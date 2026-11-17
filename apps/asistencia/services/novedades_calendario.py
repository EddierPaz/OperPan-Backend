"""
Servicio de integración entre novedades (solicitudes/incapacidades aprobados)
y el módulo de asistencia.

Estados devueltos por día:
    - 'INCAPACIDAD'  → incapacidad aprobada (no trabaja)
    - 'SOLICITUD'      → solicitud aprobada, tipo distinto a cambio_turno (no trabaja)
    - 'CAMBIO_TURNO' → solicitud de cambio_turno (SÍ trabaja, en otro horario)

Prioridad cuando hay solapamiento:
    INCAPACIDAD > SOLICITUD > CAMBIO_TURNO
"""

from datetime import timedelta

from apps.novedades.models import Solicitud, Incapacidad


ESTADO_APROBADO = 'aprobado'
TIPO_CAMBIO_TURNO = 'cambio_turno'


def obtener_novedades_por_fecha(empleado, fecha_inicio, fecha_fin):
    """
    Devuelve un dict {fecha: {'tipo': str, 'detalle': obj}} para todos los
    días (inclusive) entre fecha_inicio y fecha_fin que estén cubiertos por
    un solicitud o incapacidad APROBADO del empleado.

    El campo 'tipo' puede ser:
        - 'INCAPACIDAD'
        - 'SOLICITUD'      (solicitudes que NO son cambio de turno)
        - 'CAMBIO_TURNO'    (solicitudes de tipo cambio_turno)

    Reglas:
        - Solo solicitudes con estado='aprobado'.
        - Prioridad: INCAPACIDAD > SOLICITUD > CAMBIO_TURNO.
        - El rango del resultado se recorta a [fecha_inicio, fecha_fin].
    """
    resultado = {}

    if not empleado or fecha_inicio > fecha_fin:
        return resultado

    # ----------------------------------------------------------
    # 1. Solicitudes aprobados (separamos cambio_turno del resto)
    # ----------------------------------------------------------
    solicitud = Solicitud.objects.filter(
        empleado=empleado,
        estado=ESTADO_APROBADO,
        fecha_inicio__lte=fecha_fin,
        fecha_fin__gte=fecha_inicio,
    )

    for p in solicitud:
        tipo = 'CAMBIO_TURNO' if p.tipo == TIPO_CAMBIO_TURNO else 'SOLICITUD'
        inicio = max(p.fecha_inicio, fecha_inicio)
        fin = min(p.fecha_fin, fecha_fin)
        cursor = inicio
        while cursor <= fin:
            existente = resultado.get(cursor)
            # SOLICITUD gana sobre CAMBIO_TURNO; entre mismos tipos, el primero
            # que llegó se queda (no importa cuál, son del mismo empleado).
            if existente is None or (
                existente['tipo'] == 'CAMBIO_TURNO' and tipo == 'SOLICITUD'
            ):
                resultado[cursor] = {'tipo': tipo, 'detalle': p}
            cursor += timedelta(days=1)

    # ----------------------------------------------------------
    # 2. Incapacidades aprobadas (máxima prioridad)
    # ----------------------------------------------------------
    incapacidades = Incapacidad.objects.filter(
        empleado=empleado,
        estado=ESTADO_APROBADO,
        fecha_inicio__lte=fecha_fin,
        fecha_fin__gte=fecha_inicio,
    )

    for i in incapacidades:
        inicio = max(i.fecha_inicio, fecha_inicio)
        fin = min(i.fecha_fin, fecha_fin)
        cursor = inicio
        while cursor <= fin:
            resultado[cursor] = {'tipo': 'INCAPACIDAD', 'detalle': i}
            cursor += timedelta(days=1)

    return resultado


def obtener_novedad_del_dia(empleado, fecha):
    """Atajo: devuelve {'tipo': ..., 'detalle': ...} o None."""
    return obtener_novedades_por_fecha(empleado, fecha, fecha).get(fecha)