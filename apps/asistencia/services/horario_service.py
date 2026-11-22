import calendar
from datetime import date, timedelta, datetime
from django.utils import timezone
from django.db import transaction
from ..models import Horario, DescansoEmpleado

# ============================================================
# HELPERS DE FECHAS MENSUALES
# ============================================================
def dias_ciclo(turno=None):
    """Mantenido por compatibilidad. Retorna días del mes actual."""
    hoy = timezone.localdate()
    return calendar.monthrange(hoy.year, hoy.month)[1]

def dias_del_mes(fecha):
    return calendar.monthrange(fecha.year, fecha.month)[1]

def primer_dia_del_mes(fecha):
    return fecha.replace(day=1)

def ultimo_dia_del_mes(fecha):
    return fecha.replace(day=dias_del_mes(fecha))

def ciclo_fin(horario):
    if not horario or not horario.ciclo_inicio:
        return None
    return ultimo_dia_del_mes(horario.ciclo_inicio)

def estado_vigencia_horario(horario, hoy, fin):
    if not horario.estado:
        return "inactivo"
    if fin is None:
        return "activo"
    if fin < hoy:
        return "vencido"
    if (fin - hoy).days <= 2:
        return "por_vencer"
    return "activo"

# ============================================================
# LÓGICA DE DESCANSO ROTATIVO
# ============================================================
def _proxima_fecha_con_dia_semana(desde, dia_semana_objetivo):
    fecha = desde
    while fecha.weekday() != dia_semana_objetivo:
        fecha += timedelta(days=1)
    return fecha

def _generar_descansos_ciclo(horario, es_primer_ciclo=False, fecha_manual=None):
    """Genera descansos: FIJO (semanal), MAÑANA/TARDE (rotativo 2 veces al mes)."""
    inicio = horario.ciclo_inicio
    fin = ciclo_fin(horario)
    descansos = []

    if horario.turno == "FIJO":
        dia_semana = horario.dia_descanso_semana
        if dia_semana is None:
            dia_semana = fecha_manual.weekday() if fecha_manual else inicio.weekday()
        
        cursor = _proxima_fecha_con_dia_semana(inicio, dia_semana)
        while cursor <= fin:
            descansos.append(cursor)
            cursor += timedelta(days=7)

    else: # MANANA o TARDE
        if es_primer_ciclo and fecha_manual:
            descansos.append(fecha_manual)
            segundo = fecha_manual + timedelta(days=14)
            if segundo > fin:
                segundo = fecha_manual - timedelta(days=14)
            if inicio <= segundo <= fin:
                descansos.append(segundo)
        else:
            anterior = horario.ciclo_anterior
            dia_rotado = inicio.weekday()
            if anterior:
                ultimo_descanso = DescansoEmpleado.objects.filter(
                    horario=anterior, es_descanso=True
                ).order_by('-fecha').first()
                if ultimo_descanso:
                    # Rotamos el día (+1)
                    dia_rotado = (ultimo_descanso.fecha.weekday() + 1) % 7

            primer_descanso = _proxima_fecha_con_dia_semana(inicio, dia_rotado)
            descansos.append(primer_descanso)
            
            tercer_descanso = primer_descanso + timedelta(days=14)
            if tercer_descanso <= fin:
                descansos.append(tercer_descanso)
            else:
                segundo_descanso = primer_descanso + timedelta(days=7)
                if segundo_descanso <= fin:
                    descansos.append(segundo_descanso)

    for d in set(descansos):
        DescansoEmpleado.objects.get_or_create(
            horario=horario,
            fecha=d,
            defaults={'es_descanso': True, 'fue_generado_automaticamente': True}
        )

# ============================================================
# GENERACIÓN DE CICLOS (Lazy Generation)
# ============================================================
def generar_siguiente_ciclo(horario_actual):
    if horario_actual.ciclo_inicio.month == 12:
        nuevo_inicio = horario_actual.ciclo_inicio.replace(year=horario_actual.ciclo_inicio.year + 1, month=1, day=1)
    else:
        nuevo_inicio = horario_actual.ciclo_inicio.replace(month=horario_actual.ciclo_inicio.month + 1, day=1)
    
    nuevo_fin = ultimo_dia_del_mes(nuevo_inicio)

    with transaction.atomic():
        nuevo_horario = Horario.objects.create(
            empleado=horario_actual.empleado,
            turno=horario_actual.turno,
            hora_entrada=horario_actual.hora_entrada,
            hora_salida=horario_actual.hora_salida,
            estado=True,
            fecha_inicio=nuevo_inicio,
            fecha_fin=nuevo_fin,
            ciclo_inicio=nuevo_inicio,
            ciclo_anterior=horario_actual,
            es_generado_automaticamente=True,
            dia_descanso_semana=horario_actual.dia_descanso_semana,
        )
        _generar_descansos_ciclo(nuevo_horario)

        horario_actual.estado = False
        horario_actual.es_ciclo_cerrado = True
        horario_actual.save(update_fields=["estado", "es_ciclo_cerrado"])

    return nuevo_horario

def obtener_o_generar_horario_vigente(empleado):
    hoy = timezone.localdate()
    horario = Horario.objects.filter(empleado=empleado, estado=True, es_ciclo_cerrado=False).order_by('-ciclo_inicio').first()

    if not horario:
        return None

    fin = ciclo_fin(horario)

    # Genera meses futuros si el sistema estuvo apagado
    while fin is not None and fin < hoy:
        horario = generar_siguiente_ciclo(horario)
        fin = ciclo_fin(horario)

    return aplicar_override_cambio_turno(horario, hoy)

def regenerar_ciclos_vencidos():
    hoy = timezone.localdate()
    activos = list(Horario.objects.filter(estado=True, es_ciclo_cerrado=False))
    generados = 0
    for horario in activos:
        fin = ciclo_fin(horario)
        while fin is not None and fin < hoy:
            horario = generar_siguiente_ciclo(horario)
            fin = ciclo_fin(horario)
            generados += 1
    return generados

# ============================================================
# OVERRIDE CAMBIO DE TURNO (En memoria)
# ============================================================
HORAS_POR_TURNO_CAMBIO = {'MANANA': ('05:00', '13:00'), 'TARDE': ('13:00', '22:00')}

def _parsear_nuevo_horario(valor):
    s = (valor or '').strip().lower()
    if 'mañana' in s or 'manana' in s: turno = 'MANANA'
    elif 'tarde' in s: turno = 'TARDE'
    else: return None, None, None
    entrada_str, salida_str = HORAS_POR_TURNO_CAMBIO[turno]
    return turno, datetime.strptime(entrada_str, '%H:%M').time(), datetime.strptime(salida_str, '%H:%M').time()

import copy
def aplicar_override_cambio_turno(horario, fecha):
    if not horario or not fecha: return horario
    from apps.novedades.models import Solicitud

    sol = Solicitud.objects.filter(
        empleado=horario.empleado, tipo='cambio_turno', estado='aprobado',
        fecha_inicio__lte=fecha, fecha_fin__gte=fecha,
    ).order_by('-fecha_inicio', '-id').first()

    if not sol: return horario

    turno, entrada, salida = _parsear_nuevo_horario(sol.nuevo_horario)
    if not turno: return horario

    horario_override = copy.copy(horario)
    horario_override.turno = turno
    horario_override.hora_entrada = entrada
    horario_override.hora_salida = salida
    return horario_override

# ============================================================
# CALENDARIO VISUAL
# ============================================================
def construir_calendario(horario, fecha_inicio=None, dias=None, hoy=None, asistencias=None, mostrar_relleno=True):
    if fecha_inicio is None: 
        fecha_inicio = horario.ciclo_inicio or timezone.localdate()
    if hoy is None: 
        hoy = timezone.localdate()
    if dias is None: 
        dias = dias_del_mes(fecha_inicio)

    # Obtenemos los descansos del horario
    descansos = set(
        DescansoEmpleado.objects.filter(horario=horario, es_descanso=True).values_list('fecha', flat=True)
    )
    
    # Diccionario de asistencias
    asistencias_dict = {a.fecha: a.estado for a in asistencias} if asistencias else {}
    
    calendario = []

    # Relleno inicial para que el día 1 caiga en el día de la semana correcto
    if mostrar_relleno:
        for _ in range(fecha_inicio.weekday()): 
            calendario.append(None)

    # LA FECHA EN QUE EL EMPLEADO REALMENTE EMPEZÓ
    fecha_inicio_real = horario.fecha_inicio or horario.ciclo_inicio

    for i in range(dias):
        fecha = fecha_inicio + timedelta(days=i)
        es_descanso = fecha in descansos
        
        estado, estado_texto = None, 'Pendiente'
        
        if es_descanso: 
            estado, estado_texto = 'DESCANSO', 'Descanso'
        # FORZAMOS A QUE SI ES EL DÍA DE CREACIÓN O ANTES, SEA "SIN DATOS" (Gris)
        elif fecha_inicio_real and fecha <= fecha_inicio_real:
            estado, estado_texto = 'SIN_DATOS', 'Sin datos' 
        elif fecha in asistencias_dict:
            estado = asistencias_dict[fecha]
            estado_texto = 'Presente' if estado == 'PRESENTE' else 'Tardanza'
        elif fecha < hoy:
            estado, estado_texto = 'AUSENTE', 'Ausente'

        calendario.append({
            'numero': fecha.day, 
            'fecha': fecha, 
            'es_descanso': es_descanso,
            'estado': estado, 
            'estado_texto': estado_texto,
            'hora_entrada': horario.hora_entrada, 
            'hora_salida': horario.hora_salida,
        })
        
    return calendario