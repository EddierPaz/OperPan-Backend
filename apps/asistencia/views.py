# =============================================================================
# IMPORTS ESTÁNDAR DE PYTHON
# =============================================================================
import calendar                     # Para operaciones con meses (último día del mes)
from datetime import date, timedelta, datetime, time   # Manejo de fechas y horas
import json

# =============================================================================
# IMPORTS DE DJANGO CORE
# =============================================================================
from django.contrib import messages                     # Mensajes flash (notificaciones)
from django.contrib.auth.decorators import login_required   # Decorador para vistas protegidas
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger   # Paginación (aunque ya no se usa para el listado, se mantiene por si acaso)
from django.db.models import Q                          # Consultas complejas (OR, AND)
from django.http import JsonResponse                    # Respuestas JSON para AJAX
from django.shortcuts import get_object_or_404, redirect, render   # Atajos de renderizado
from django.template.loader import render_to_string     # Renderizar templates a string (para AJAX)
from django.urls import reverse                         # Generar URLs inversas
from django.utils import timezone                       # Zona horaria y fechas locales

# =============================================================================
# IMPORTS DE APPS DEL PROYECTO
# =============================================================================
from apps.usuarios.models import PerfilEmpleado         # Modelo de empleado
from apps.usuarios.decorators import admin_required     # Decorador para restringir a admin
from apps.notificaciones.utils import enviar_notificacion, obtener_correo_admin  # Envío de emails

# Modelos locales
from .models import Asistencia, DescansoEmpleado, Horario

# Fin de importaciones:

def construir_calendario(horario, fecha_inicio=None, dias=None, hoy=None, asistencias=None, mostrar_relleno=True):
    if fecha_inicio is None:
        fecha_inicio = horario.ciclo_inicio or timezone.localdate()
    if hoy is None:
        hoy = timezone.localdate()
    if dias is None:
        dias = dias_ciclo(horario.turno)

    descanso = regenerar_descanso_si_vencido(horario, fecha_inicio)
    asistencias_dict = {a.fecha: a.estado for a in asistencias} if asistencias else {}

    calendario = []

    # Solo rellenamos con vacíos si se pide alinear con el calendario
    if mostrar_relleno:
        for _ in range(fecha_inicio.weekday()):
            calendario.append(None)

    for i in range(dias):
        fecha = fecha_inicio + timedelta(days=i)
        es_descanso = descanso and fecha == descanso.fecha

        # Inicializamos las variables por defecto para evitar NameError
        estado = None
        estado_texto = 'Pendiente'

        if es_descanso:
            estado = 'DESCANSO'
            estado_texto = 'Descanso'
        elif fecha in asistencias_dict:
            estado = asistencias_dict[fecha]
            estado_texto = 'Presente' if estado == 'PRESENTE' else 'Tardanza'
        elif fecha < hoy:
            estado = 'AUSENTE'
            estado_texto = 'Ausente'
        else:
            estado = None
            estado_texto = 'Pendiente'

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

def dias_ciclo(turno):
    """Devuelve la duración informativa del ciclo según el turno."""
    return 8 if turno == "FIJO" else 15


def _siguiente_dia_habil(dia_semana):
    if dia_semana >= 4:
        return 0
    return dia_semana + 1


def _proxima_fecha_con_dia_semana(desde, dia_semana_objetivo):
    fecha = desde
    while fecha.weekday() != dia_semana_objetivo:
        fecha += timedelta(days=1)
    return fecha


def regenerar_descanso_si_vencido(horario, hoy):
    descansos = list(
        DescansoEmpleado.objects
        .filter(horario=horario)
        .order_by("-fecha", "-id")
    )

    if not descansos:
        if hoy.weekday() <= 4:
            nueva_fecha = hoy
        else:
            nueva_fecha = hoy + timedelta(days=7 - hoy.weekday())

        descanso = DescansoEmpleado.objects.create(
            horario=horario,
            fecha=nueva_fecha,
            es_descanso=True,
        )

        horario.ciclo_inicio = hoy
        horario.save(update_fields=["ciclo_inicio"])
        return descanso

    descanso = descansos[0]
    otros_ids = [d.id for d in descansos[1:]]

    if otros_ids:
        DescansoEmpleado.objects.filter(id__in=otros_ids).delete()

    if not descanso.es_descanso:
        descanso.es_descanso = True
        descanso.save(update_fields=["es_descanso"])

    if descanso.fecha >= hoy:
        return descanso

    fecha_anterior = descanso.fecha

    if horario.turno == "FIJO":
        dia_objetivo = fecha_anterior.weekday()
        base = fecha_anterior + timedelta(days=1)
        nueva_fecha = _proxima_fecha_con_dia_semana(base, dia_objetivo)
    else:
        dia_objetivo = _siguiente_dia_habil(fecha_anterior.weekday())
        base = fecha_anterior + timedelta(days=dias_ciclo(horario.turno))  
        nueva_fecha = _proxima_fecha_con_dia_semana(base, dia_objetivo)

    DescansoEmpleado.objects.filter(horario=horario).exclude(id=descanso.id).delete()

    descanso.fecha = nueva_fecha
    descanso.es_descanso = True
    descanso.save(update_fields=["fecha", "es_descanso"])

    horario.ciclo_inicio = hoy
    horario.save(update_fields=["ciclo_inicio"])

    return descanso


def ciclo_fin(horario):
    if not horario.ciclo_inicio:
        return None

    return horario.ciclo_inicio + timedelta(
        days=dias_ciclo(horario.turno) - 1
    )

def estado_vigencia_horario(horario, hoy, fin):
    """Determina el estado de vigencia mostrado en la tabla/modal."""
    if not horario.estado:
        return "inactivo"
    if fin is None:
        return "activo"
    if fin < hoy:
        return "vencido"
    if (fin - hoy).days <= 2:
        return "por_vencer"
    return "activo"


def _contexto_base():
    hoy = timezone.localdate()
    proximos_dias = []

    for _ in range(hoy.weekday()):
        proximos_dias.append(None)

    for i in range(15):
        fecha = hoy + timedelta(days=i)
        proximos_dias.append({
            "fecha": fecha,
            "numero": fecha.day,
            "weekday": fecha.weekday(),
            "indice": i,
        })

    # 1. Obtenemos los horarios base
    horarios_qs = (
        Horario.objects
        .filter(estado=True)
        .select_related("empleado")
    )

    horarios = []
    for horario in horarios_qs:
        horario.proximo_descanso = regenerar_descanso_si_vencido(horario, hoy)
        horario.vigencia_fin = ciclo_fin(horario)
        horario.vigencia_estado = estado_vigencia_horario(horario, hoy, horario.vigencia_fin)
        horarios.append(horario)

    # 2. ORDENAR: Por la fecha de descanso más cercana (ascendente). 
    # Los que no tengan descanso quedan al final.
    horarios.sort(key=lambda h: h.proximo_descanso.fecha if h.proximo_descanso else date.max)

    turnos_hoy = {
        "MANANA": [],
        "TARDE": [],
        "FIJO": [],
    }

    programados = 0
    presentes = 0
    tardanzas = 0
    ausentes = 0

    for horario in horarios:
        descanso_hoy = (
            horario.proximo_descanso is not None
            and horario.proximo_descanso.fecha == hoy
        )

        if descanso_hoy:
            continue

        programados += 1

        asistencia = (
            Asistencia.objects
            .filter(
                horario=horario,
                fecha=hoy
            )
            .first()
        )

        horario.asistencia = asistencia

        if horario.turno in turnos_hoy:
            turnos_hoy[horario.turno].append(horario)

        if asistencia:
            if asistencia.estado == "PRESENTE":
                presentes += 1
            elif asistencia.estado == "TARDE":
                tardanzas += 1
            elif asistencia.estado == "AUSENTE":
                ausentes += 1
        else:
            ausentes += 1

    resumen_asistencia = {
        "programados": programados,
        "presentes": presentes,
        "tardanzas": tardanzas,
        "ausentes": ausentes,
    }
    
    resumen_horarios = {
        "total": len(horarios),
        "manana": sum(1 for h in horarios if h.turno == "MANANA"),
        "tarde": sum(1 for h in horarios if h.turno == "TARDE"),
        "fijo": sum(1 for h in horarios if h.turno == "FIJO"),
    }

    return {
        "empleados": PerfilEmpleado.objects.all(),
        "horarios": horarios,
        "proximos_dias": proximos_dias,
        "dias_semana": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        "fecha_hoy": hoy,
        "turnos_hoy": turnos_hoy,
        "resumen_asistencia": resumen_asistencia,
        "resumen_horarios": resumen_horarios,
    }



# ---



# Cambio el 7 de sep para historial de asistencia con filtros y paginación

@login_required
@admin_required
def asistencia_dashboard(request):
    # Obtener contexto base (día actual, KPIs, turnos, etc.)
    context = _contexto_base()
    
    # Obtener todos los empleados (activos e inactivos, pero con horario o sin él)
    empleados = PerfilEmpleado.objects.all().order_by('primer_nombre')
    
    # Para cada empleado, calcular su resumen
    empleados_con_resumen = []
    for emp in empleados:
        resumen = obtener_resumen_empleado(emp)
        empleados_con_resumen.append({
            'id': emp.id,
            'nombre': emp.nombre_completo(),
            'cargo': emp.get_cargo_display() or 'Sin cargo',
            'resumen': resumen,
            'resumen_json': json.dumps(resumen)  # <--- NUEVO: JSON string para el atributo data
        })
    
    context['empleados_con_resumen'] = empleados_con_resumen
    context['empleados'] = empleados  # Para el filtro de empleados (select)
    
    return render(request, 'admin/asistencia/asistencia.html', context)


# ---








# Helper para obtener resumen de un empleado 
    # Cambio del 7 de sep 26

def obtener_resumen_empleado(empleado):
    """
    Calcula el resumen de asistencia para un empleado.
    Usa como fecha de inicio la fecha_ingreso del empleado (campo en PerfilEmpleado).
    Si no tiene fecha_ingreso, usa la fecha del primer horario activo.
    Retorna un dict con conteos de: presente, tarde, ausente, descanso.
    """
    hoy = timezone.localdate()
    
    # 1. Intentar usar fecha_ingreso del empleado
    fecha_inicio = empleado.fecha_ingreso
    if not fecha_inicio:
        # Fallback: primer horario activo
        primer_horario = Horario.objects.filter(empleado=empleado, estado=True).order_by('fecha_creacion').first()
        if primer_horario:
            fecha_inicio = primer_horario.fecha_creacion.date()
        else:
            # Sin horario y sin fecha de ingreso → sin datos
            return {'presente': 0, 'tarde': 0, 'ausente': 0, 'descanso': 0}
    
    # Asegurar que la fecha de inicio no sea posterior a hoy
    if fecha_inicio > hoy:
        fecha_inicio = hoy
    
    # Obtener todas las asistencias del empleado desde esa fecha
    asistencias = Asistencia.objects.filter(
        horario__empleado=empleado,
        fecha__gte=fecha_inicio,
        fecha__lte=hoy
    )
    
    # Conteos por estado
    presente = asistencias.filter(estado='PRESENTE').count()
    tarde = asistencias.filter(estado='TARDE').count()
    ausente = asistencias.filter(estado='AUSENTE').count()
    
    # Contar descansos (días de descanso en el mismo período)
    total_descansos = DescansoEmpleado.objects.filter(
        horario__empleado=empleado,
        fecha__gte=fecha_inicio,
        fecha__lte=hoy,
        es_descanso=True
    ).count()
    
    return {
        'presente': presente,
        'tarde': tarde,
        'ausente': ausente,
        'descanso': total_descansos
    }






# 7sep/2026 Ahora bien, esta nueva función tiene mucha importancia ya que es fundamental para el modal:

@login_required
@admin_required
def asistencia_empleado_historial(request, empleado_id):
    """
    Vista AJAX que devuelve HTML parcial para el modal de historial de un empleado.
    Siempre devuelve una tabla/listado de registros (sin calendario).
    """
    empleado = get_object_or_404(PerfilEmpleado, id=empleado_id)

    # Obtener parámetros GET (turno, estado, mes opcional)
    turno = request.GET.get('turno', '')
    estado = request.GET.get('estado', '')
    mes = request.GET.get('mes', '')  # opcional, se puede usar para filtrar por mes

    # Query base: todas las asistencias del empleado
    asistencias = Asistencia.objects.filter(
        horario__empleado=empleado
    ).select_related('horario').order_by('-fecha', '-hora_marcada')

    # Si se envía mes, filtrar por ese mes (opcional)
    if mes:
        try:
            año, mes_num = map(int, mes.split('-'))
            primer_dia = date(año, mes_num, 1)
            ultimo_dia = date(año, mes_num, calendar.monthrange(año, mes_num)[1])
            asistencias = asistencias.filter(fecha__gte=primer_dia, fecha__lte=ultimo_dia)
        except:
            pass

    # Aplicar filtros de turno y estado
    if turno:
        asistencias = asistencias.filter(horario__turno=turno)
    if estado:
        asistencias = asistencias.filter(estado=estado)

    # Construir lista de registros
    registros = []
    for asist in asistencias:
        registros.append({
            'fecha': asist.fecha.strftime('%d/%m/%Y'),
            'estado': asist.get_estado_display() or 'Sin registrar',
            'turno': asist.horario.get_turno_display(),
            'hora_programada': asist.horario.hora_entrada.strftime('%H:%M') if asist.horario.hora_entrada else 'N/A',
            'hora_marcada': asist.hora_marcada.strftime('%H:%M') if asist.hora_marcada else 'N/A',
            'id': asist.id,
        })

    # Renderizar parcial de lista
    html = render_to_string('admin/asistencia/empleado_historial_lista.html', {
        'registros': registros,
    }, request=request)

    return JsonResponse({
        'html': html,
        'empleado_nombre': empleado.nombre_completo(),
        'empleado_cargo': empleado.get_cargo_display() or 'Sin cargo',
    })





    # Fin.



def horarios(request):
    if request.method == "POST":
        empleado_id = request.POST.get("empleado")
        turno = request.POST.get("turno")
        hora_entrada_str = request.POST.get("hora_entrada")
        hora_salida_str = request.POST.get("hora_salida")
        fecha_descanso = request.POST.get("fecha_descanso")

        empleado = get_object_or_404(
            PerfilEmpleado,
            id=empleado_id
        )

        if Horario.objects.filter(
            empleado=empleado,
            estado=True
        ).exists():
            messages.error(
                request,
                f"El empleado {empleado.nombre_completo()} ya tiene un horario activo asignado."
            )
            return redirect("asistencia:horarios")

        # Convertir strings de hora a objetos time de Python de forma segura
        hora_entrada_obj = (
            datetime.strptime(hora_entrada_str, '%H:%M').time()
            if hora_entrada_str else None
        )

        hora_salida_obj = (
            datetime.strptime(hora_salida_str, '%H:%M').time()
            if hora_salida_str else None
        )

        # =====================================================
        # PERÍODO DEL HORARIO
        # =====================================================
        fecha_inicio = timezone.localdate()
        fecha_fin = fecha_inicio + timedelta(days=dias_ciclo(turno) - 1)

        horario = Horario.objects.create(
            empleado=empleado,
            turno=turno,
            hora_entrada=hora_entrada_obj,
            hora_salida=hora_salida_obj,
            estado=True,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            ciclo_inicio=fecha_inicio,
        )

        # =====================================================
        # NOTIFICACIÓN AL EMPLEADO
        # =====================================================
        contexto = {
            'empleado_nombre': empleado.nombre_completo(),
            'turno': horario.get_turno_display(),
            'hora_entrada': horario.hora_entrada.strftime('%H:%M') if horario.hora_entrada else '',
            'hora_salida': horario.hora_salida.strftime('%H:%M') if horario.hora_salida else '',
            'fecha_descanso': fecha_descanso if fecha_descanso else 'A definir',
        }

        enviar_notificacion(
            destinatario=empleado.correo,
            asunto="🕒 Nuevo horario asignado",
            template_name='emails/horario_asignado.html',
            contexto=contexto
        )

        if fecha_descanso:
            DescansoEmpleado.objects.create(
                horario=horario,
                fecha=fecha_descanso,
                es_descanso=True,
            )

        messages.success(request, "Horario asignado correctamente.")
        return redirect("asistencia:horarios")

    return render(
        request,
        "admin/horario/horario.html",
        _contexto_base()
    )


def horario_json(request, id):
    horario = get_object_or_404(
        Horario.objects.select_related("empleado"),
        id=id
    )

    hoy = timezone.localdate()
    descanso = regenerar_descanso_si_vencido(horario, hoy)
    fin = ciclo_fin(horario)
    vigencia_estado = estado_vigencia_horario(horario, hoy, fin)

    return JsonResponse({
        "empleado": horario.empleado.nombre_completo(),
        "cargo": horario.empleado.get_cargo_display(),
        "turno": horario.get_turno_display(),
        "turno_valor": horario.turno,
        "hora_entrada": horario.hora_entrada.strftime("%H:%M"),
        "hora_salida": horario.hora_salida.strftime("%H:%M"),
        "estado": horario.estado,
        "vigencia_estado": vigencia_estado,
        "descanso": descanso.fecha.strftime("%d/%m/%Y") if descanso else None,
        "descanso_fecha": descanso.fecha.strftime("%Y-%m-%d") if descanso else None,
        "ciclo_inicio": horario.ciclo_inicio.strftime("%d/%m/%Y") if horario.ciclo_inicio else None,
        "ciclo_fin": fin.strftime("%d/%m/%Y") if fin else None,
    })


def editar_horario(request, id):
    horario = get_object_or_404(Horario, id=id)

    if request.method == "POST":
        horario.turno = request.POST.get("turno")
        
        hora_entrada_str = request.POST.get("hora_entrada")
        hora_salida_str = request.POST.get("hora_salida")
        
        if hora_entrada_str:
            horario.hora_entrada = datetime.strptime(hora_entrada_str, '%H:%M').time()
        if hora_salida_str:
            horario.hora_salida = datetime.strptime(hora_salida_str, '%H:%M').time()
            
        fecha_descanso = request.POST.get("fecha_descanso")

        if fecha_descanso:
            descanso = DescansoEmpleado.objects.filter(horario=horario, es_descanso=True).order_by("-fecha", "-id").first()
            if descanso:
                descanso.fecha = fecha_descanso
                descanso.save(update_fields=["fecha"])
            else:
                DescansoEmpleado.objects.create(
                    horario=horario,
                    fecha=fecha_descanso,
                    es_descanso=True,
                )
            horario.ciclo_inicio = timezone.localdate()

        horario.save()

        # =====================================================
        # NOTIFICACIÓN AL EMPLEADO (DESPUÉS DE GUARDAR)
        # =====================================================
        contexto = {
            'empleado_nombre': horario.empleado.nombre_completo(),
            'turno': horario.get_turno_display(),
            'hora_entrada': horario.hora_entrada.strftime('%H:%M') if horario.hora_entrada else '',
            'hora_salida': horario.hora_salida.strftime('%H:%M') if horario.hora_salida else '',
            'fecha_descanso': fecha_descanso if fecha_descanso else 'A definir',
        }
        enviar_notificacion(
            destinatario=horario.empleado.correo,
            asunto="✏️ Horario actualizado",
            template_name='emails/horario_editado.html',
            contexto=contexto
        )

        messages.success(request, "Horario actualizado correctamente.")
        return redirect("asistencia:horarios")

    return redirect("asistencia:horarios")


def eliminar_horario(request, id):
    horario = get_object_or_404(Horario, id=id)

    # =====================================================
    # NOTIFICACIÓN AL EMPLEADO (ANTES DE DESACTIVAR)
    # =====================================================
    contexto = {
        'empleado_nombre': horario.empleado.nombre_completo(),
        'turno': horario.get_turno_display(),
    }
    enviar_notificacion(
        destinatario=horario.empleado.correo,
        asunto="🚫 Horario eliminado",
        template_name='emails/horario_eliminado.html',
        contexto=contexto
    )

    horario.estado = False
    horario.save(update_fields=["estado"])

    messages.success(request, "Horario eliminado correctamente.")
    return redirect("asistencia:horarios")


def registrar_asistencia(request):
    if request.method == "POST":
        horario_id = request.POST.get("horario_id")
        horario = get_object_or_404(Horario, id=horario_id)

        asistencia_existente = (
            Asistencia.objects
            .filter(
                horario=horario,
                fecha=timezone.localdate()
            )
            .first()
        )

        if asistencia_existente:
            return redirect("asistencia:asistencia_dashboard")

        hora_actual = timezone.localtime().time()
        estado = "PRESENTE" if hora_actual <= horario.hora_entrada else "TARDE"

        Asistencia.objects.create(
            horario=horario,
            fecha=timezone.localdate(),
            estado=estado,
            hora_marcada=hora_actual,
        )

    return redirect("asistencia:asistencia_dashboard")


def asistencia_empleado(request):
    perfil = request.user.perfil
    hoy = timezone.localdate()
    
    filtro = request.GET.get('filtro', 'semana')
    if filtro == 'mes':
        fecha_inicio = hoy - timedelta(days=30)
    else:
        fecha_inicio = hoy - timedelta(days=7)

    horario = Horario.objects.filter(empleado=perfil, estado=True).order_by("-id").first()
    
    # Estado de hoy
    estado_hoy = {
        'tiene_jornada': False,
        'turno': None,
        'hora_entrada_prog': None,
        'hora_salida_prog': None,
        'hora_entrada_real': None,
        'hora_salida_real': None,
        'estado': None,  # PRESENTE, TARDE, AUSENTE, DESCANSO, SIN_HORARIO
        'es_descanso': False,
        'tardanza_minutos': None,
    }

    if horario:
        # Verificar si hoy es descanso
        descanso = regenerar_descanso_si_vencido(horario, hoy)
        es_descanso_hoy = descanso and descanso.fecha == hoy

        estado_hoy['tiene_jornada'] = True
        estado_hoy['turno'] = horario.get_turno_display()
        estado_hoy['hora_entrada_prog'] = horario.hora_entrada
        estado_hoy['hora_salida_prog'] = horario.hora_salida

        if es_descanso_hoy:
            estado_hoy['estado'] = 'DESCANSO'
            estado_hoy['es_descanso'] = True
        else:
            # Buscar asistencia de hoy
            asistencia_hoy = Asistencia.objects.filter(horario=horario, fecha=hoy).first()
            if asistencia_hoy:
                estado_hoy['hora_entrada_real'] = asistencia_hoy.hora_marcada
                estado_hoy['estado'] = asistencia_hoy.estado
                if asistencia_hoy.estado == 'TARDE' and horario.hora_entrada:
                    # Calcular tardanza en minutos
                    entrada_prog = datetime.combine(hoy, horario.hora_entrada)
                    entrada_real = datetime.combine(hoy, asistencia_hoy.hora_marcada)
                    if entrada_real > entrada_prog:
                        diff = entrada_real - entrada_prog
                        estado_hoy['tardanza_minutos'] = int(diff.total_seconds() // 60)
            else:
                estado_hoy['estado'] = 'AUSENTE'
    else:
        estado_hoy['estado'] = 'SIN_HORARIO'

    # Obtener asistencias para el historial
    asistencias = []
    dias_asistencia = 0
    retardos = 0
    if horario:
        asistencias = Asistencia.objects.filter(horario=horario, fecha__gte=fecha_inicio).order_by('-fecha')
        dias_asistencia = asistencias.count()
        retardos = asistencias.filter(estado='TARDE').count()
    dias_sin_asistencia = max(0, 30 - dias_asistencia)  # aproximado

    return render(request, 'empleado/asistencia/asistencia.html', {
        'fecha_hoy': hoy,
        'horario': horario,
        'estado_hoy': estado_hoy,
        'asistencias': asistencias,
        'dias_asistencia': dias_asistencia,
        'dias_sin_asistencia': dias_sin_asistencia,
        'retardos': retardos,
        'filtro': filtro,
    })



# Cambio del 7 de septiembre
@login_required
@admin_required
def asistencia_detalle(request, asistencia_id):
    """
    Devuelve los datos de una asistencia específica en formato JSON
    para llenar el modal de detalle.
    """
    asistencia = get_object_or_404(
        Asistencia.objects.select_related('horario__empleado'),
        id=asistencia_id
    )
    data = {
        'empleado': asistencia.horario.empleado.nombre_completo(),
        'fecha': asistencia.fecha.strftime('%d/%m/%Y'),
        'estado': asistencia.get_estado_display() or 'Sin registrar',
        'estado_clase': asistencia.estado.lower() if asistencia.estado else 'sin-registro',
        'turno': asistencia.horario.get_turno_display(),
        'cargo': asistencia.horario.empleado.get_cargo_display() or 'Sin cargo',
        'hora_programada': asistencia.horario.hora_entrada.strftime('%H:%M') if asistencia.horario.hora_entrada else 'N/A',
        'hora_marcada': asistencia.hora_marcada.strftime('%H:%M') if asistencia.hora_marcada else 'N/A',
    }
    return JsonResponse(data)






@login_required
def empleado_horario(request):
    perfil = request.user.perfil
    hoy = timezone.localdate()
    
    horario_actual = Horario.objects.filter(empleado=perfil, estado=True).order_by("-id").first()
    
    calendario = []
    if horario_actual:
        regenerar_descanso_si_vencido(horario_actual, hoy)
        fecha_inicio = horario_actual.fecha_inicio or horario_actual.ciclo_inicio or hoy

        calendario = construir_calendario(
            horario_actual,
            fecha_inicio=fecha_inicio,
            dias=dias_ciclo(horario_actual.turno),
            hoy=hoy
    )
        horario_actual.proximo_descanso = DescansoEmpleado.objects.filter(
            horario=horario_actual, es_descanso=True
        ).order_by('-fecha').first()
        
        # --- OBTENER ASISTENCIAS PARA EL RANGO DE FECHAS ---
        fechas_calendario = [dia['fecha'] for dia in calendario if dia]
        asistencias = Asistencia.objects.filter(
            horario=horario_actual,
            fecha__in=fechas_calendario
        )
        # Crear un dict para acceso rápido: {fecha: estado}
        asistencias_por_fecha = {a.fecha: a.estado for a in asistencias}

        # En la vista, después de obtener asistencias_por_fecha
        for dia in calendario:
            if dia:
                fecha = dia['fecha']
                if dia['es_descanso']:
                    dia['estado'] = 'DESCANSO'
                    dia['estado_texto'] = 'Descanso'
                elif fecha in asistencias_por_fecha:
                    estado = asistencias_por_fecha[fecha]
                    dia['estado'] = estado
                    dia['estado_texto'] = 'Presente' if estado == 'PRESENTE' else 'Tardanza'
                elif fecha < hoy:
                    # Día pasado sin registro = Ausente (ROJO)
                    dia['estado'] = 'AUSENTE'
                    dia['estado_texto'] = 'Ausente'
                else:
                    # Día futuro o actual sin registro = Pendiente (BLANCO)
                    dia['estado'] = None
                    dia['estado_texto'] = 'Pendiente'
            # Si dia es None (relleno de inicio de semana), se mantiene None
    
    historial_horarios = Horario.objects.filter(empleado=perfil).order_by('-fecha_creacion')
    for h in historial_horarios:
        h.vigencia_fin = ciclo_fin(h) if h.ciclo_inicio else None
        h.vigencia_estado = estado_vigencia_horario(h, hoy, h.vigencia_fin)
    
    return render(request, 'empleado/horario/horario.html', {
        'horario_actual': horario_actual,
        'calendario': calendario,
        'historial_horarios': historial_horarios,
        'hoy': hoy,
    })

@login_required
def empleado_horario_detalle(request, id):
    horario = get_object_or_404(Horario, id=id, empleado=request.user.perfil)
    hoy = timezone.localdate()
    
    # AQUí ESTABLECES LA FECHA DE INICIO REAL DE TU CICLO/HORARIO (ej. 29)
    fecha_inicio = horario.ciclo_inicio or horario.fecha_creacion.date()
    dias = dias_ciclo(horario.turno)

    asistencias = Asistencia.objects.filter(
        horario=horario,
        fecha__gte=fecha_inicio,
        fecha__lt=fecha_inicio + timedelta(days=dias)
    )

    # Le pasamos explícitamente el fecha_inicio del ciclo
    calendario = construir_calendario(horario, fecha_inicio, dias=dias, hoy=hoy, asistencias=asistencias)
    
    horario.proximo_descanso = DescansoEmpleado.objects.filter(
        horario=horario, es_descanso=True
    ).order_by('-fecha').first()
    
    fin = ciclo_fin(horario)
    vigencia_estado = estado_vigencia_horario(horario, hoy, fin)
    
    html = render_to_string('empleado/horario/_horario_detalle.html', {
        'horario': horario,
        'calendario': calendario,
    }, request=request)
    
    metadatos = {
        'fecha_inicio': fecha_inicio.strftime('%d/%m/%Y'),
        'fecha_fin': fin.strftime('%d/%m/%Y') if fin else 'Indefinido',
        'estado': vigencia_estado,
        'turno': horario.get_turno_display(),
        'horas': f"{horario.hora_entrada.strftime('%H:%M')} - {horario.hora_salida.strftime('%H:%M')}",
    }
    
    return JsonResponse({'html': html, 'metadatos': metadatos})
# Funcionalidades para Dashboards

# ============================================================
# ADMIN - ASISTENCIA POR EMPLEADO
# ============================================================

@login_required
@admin_required
def asistencia_empleado_admin(request, empleado_id):
    """
    Redirige al administrador al módulo de asistencia con el empleado filtrado.
    Permite ver y registrar la asistencia de un empleado específico.
    """
    from django.contrib import messages
    from django.shortcuts import redirect
    from django.urls import reverse
    from apps.usuarios.models import PerfilEmpleado
    
    try:
        empleado = PerfilEmpleado.objects.get(id=empleado_id)
    except PerfilEmpleado.DoesNotExist:
        messages.error(request, "Empleado no encontrado.")
        return redirect('asistencia:horarios')
    
    return redirect(f"{reverse('asistencia:horarios')}?empleado={empleado_id}")


# ============================================================
# ADMIN - CAMBIAR ESTADO DE ASISTENCIA (AJAX)
# ============================================================

@login_required
@admin_required
def cambiar_estado_asistencia(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    empleado_id = request.POST.get('empleado_id')
    estado = request.POST.get('estado')

    if not empleado_id or estado not in ['PRESENTE', 'TARDE', 'AUSENTE']:
        return JsonResponse({'error': 'Datos inválidos'}, status=400)

    try:
        empleado = PerfilEmpleado.objects.get(id=empleado_id)
        horario = Horario.objects.filter(empleado=empleado, estado=True).first()
        if not horario:
            return JsonResponse({'error': 'Empleado sin horario activo'}, status=400)

        hoy = timezone.localdate()
        asistencia, created = Asistencia.objects.get_or_create(
            horario=horario,
            fecha=hoy,
            defaults={'estado': estado, 'hora_marcada': timezone.localtime().time()}
        )
        if not created:
            asistencia.estado = estado
            asistencia.hora_marcada = timezone.localtime().time()
            asistencia.save()

        # =====================================================
        # NOTIFICACIÓN AL EMPLEADO (DESPUÉS DE REGISTRAR)
        # =====================================================
        estado_display = dict(Asistencia.ESTADOS).get(estado, estado)
        contexto = {
            'empleado_nombre': empleado.nombre_completo(),
            'fecha': hoy.strftime('%d/%m/%Y'),
            'estado': estado_display,
        }
        enviar_notificacion(
            destinatario=empleado.correo,
            asunto=f"📋 Asistencia registrada - {estado_display}",
            template_name='emails/asistencia_registrada.html',
            contexto=contexto
        )

        return JsonResponse({'status': 'ok', 'mensaje': 'Estado actualizado'})
    except PerfilEmpleado.DoesNotExist:
        return JsonResponse({'error': 'Empleado no encontrado'}, status=404)