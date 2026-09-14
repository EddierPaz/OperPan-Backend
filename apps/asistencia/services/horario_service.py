from datetime import timedelta
from django.utils import timezone
from ..models import Horario, DescansoEmpleado


def dias_ciclo(turno):
    return 7 if turno == "FIJO" else 15


def _siguiente_dia_habil(dia_semana):
    """Siguiente día hábil (0=Lunes...4=Viernes), saltando sábado y domingo.
    Si dia_semana es viernes (4), rota a lunes (0)."""
    if dia_semana >= 4:
        return 0
    return dia_semana + 1


def _proxima_fecha_con_dia_semana(desde, dia_semana_objetivo):
    """Primera fecha >= desde cuyo weekday() coincide con dia_semana_objetivo."""
    fecha = desde
    while fecha.weekday() != dia_semana_objetivo:
        fecha += timedelta(days=1)
    return fecha


def ciclo_fin(horario):
    """Última fecha del ciclo vigente de un horario, o None si no tiene
    ciclo_inicio definido."""
    if not horario.ciclo_inicio:
        return None
    return horario.ciclo_inicio + timedelta(days=dias_ciclo(horario.turno) - 1)


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


def construir_calendario(horario, fecha_inicio=None, dias=None, hoy=None,
                          asistencias=None, mostrar_relleno=True):
    """Arma la grilla de días de un ciclo (usada en 'Mi horario' del empleado)."""
    if fecha_inicio is None:
        fecha_inicio = horario.ciclo_inicio or timezone.localdate()
    if hoy is None:
        hoy = timezone.localdate()
    if dias is None:
        dias = dias_ciclo(horario.turno)

    descanso = (
        DescansoEmpleado.objects
        .filter(horario=horario, es_descanso=True)
        .order_by("-fecha")
        .first()
    )
    asistencias_dict = {a.fecha: a.estado for a in asistencias} if asistencias else {}

    calendario = []

    # Solo rellenamos con vacíos si se pide alinear con el calendario
    if mostrar_relleno:
        for _ in range(fecha_inicio.weekday()):
            calendario.append(None)

    for i in range(dias):
        fecha = fecha_inicio + timedelta(days=i)
        es_descanso = descanso and fecha == descanso.fecha

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


def _calcular_descanso_nuevo_ciclo(horario_actual, nuevo_horario, nuevo_inicio):
    """Calcula la fecha de descanso del nuevo ciclo según el turno.

    FIJO: siempre el mismo día de la semana (dia_descanso_semana), ubicado
    dentro del nuevo ciclo.
    MANANA / TARDE: rota +1 día hábil respecto al descanso del ciclo
    anterior, ubicado dentro del nuevo ciclo.
    """
    if horario_actual.turno == "FIJO":
        dia_objetivo = nuevo_horario.dia_descanso_semana
        if dia_objetivo is None:
            # Seguridad: si nunca quedó definido, se conserva el día del
            # descanso anterior (o el del propio inicio de ciclo).
            descanso_anterior = (
                DescansoEmpleado.objects
                .filter(horario=horario_actual, es_descanso=True)
                .order_by("-fecha")
                .first()
            )
            dia_objetivo = (
                descanso_anterior.fecha.weekday()
                if descanso_anterior else nuevo_inicio.weekday()
            )
        return _proxima_fecha_con_dia_semana(nuevo_inicio, dia_objetivo)

    descanso_anterior = (
        DescansoEmpleado.objects
        .filter(horario=horario_actual, es_descanso=True)
        .order_by("-fecha")
        .first()
    )
    dia_previo = descanso_anterior.fecha.weekday() if descanso_anterior else nuevo_inicio.weekday()
    dia_objetivo = _siguiente_dia_habil(dia_previo)
    return _proxima_fecha_con_dia_semana(nuevo_inicio, dia_objetivo)


def generar_siguiente_ciclo(horario_actual):
    dias = dias_ciclo(horario_actual.turno)
    base_inicio = horario_actual.ciclo_inicio or horario_actual.fecha_inicio
    nuevo_inicio = base_inicio + timedelta(days=dias)
    nuevo_fin = nuevo_inicio + timedelta(days=dias - 1)

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

    nueva_fecha_descanso = _calcular_descanso_nuevo_ciclo(horario_actual, nuevo_horario, nuevo_inicio)

    DescansoEmpleado.objects.create(
        horario=nuevo_horario,
        fecha=nueva_fecha_descanso,
        es_descanso=True,
        fue_generado_automaticamente=True,
    )

    horario_actual.estado = False
    horario_actual.es_ciclo_cerrado = True
    horario_actual.save(update_fields=["estado", "es_ciclo_cerrado"])

    return nuevo_horario


def obtener_o_generar_horario_vigente(empleado):
    """Devuelve el Horario vigente (que cubre la fecha de hoy) de un
    empleado, generando automáticamente los ciclos que hayan vencido
    -uno o varios, si el cron falló más de un periodo- hasta llegar
    al que cubre hoy.

    Devuelve None si el empleado nunca tuvo un horario asignado
    (requiere que el admin le asigne uno manualmente la primera vez).
    """
    horario = (
        Horario.objects
        .filter(empleado=empleado, estado=True, es_ciclo_cerrado=False)
        .order_by('-ciclo_inicio')
        .first()
    )

    if not horario:
        return None

    hoy = timezone.localdate()
    fin = ciclo_fin(horario)

    while fin is not None and fin < hoy:
        horario = generar_siguiente_ciclo(horario)
        fin = ciclo_fin(horario)

    return horario


def regenerar_ciclos_vencidos():
    """Recorre todos los horarios activos y genera los ciclos vencidos
    de cada uno. Pensado para ser llamado desde el management command
    (cron diario).

    Devuelve la cantidad total de ciclos nuevos generados.
    """
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