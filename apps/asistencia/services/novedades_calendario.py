"""
Servicio de integración entre novedades (solicitudes/incapacidades aprobadas)
y el módulo de asistencia.

Estados devueltos por día:
    - 'INCAPACIDAD'  
    - 'SOLICITUD'

Prioridad cuando hay solapamiento:
    INCAPACIDAD > SOLICITUD
"""

from datetime import timedelta

from apps.novedades.models import Solicitud, Incapacidad


ESTADO_APROBADO = 'aprobado'
TIPO_CAMBIO_TURNO = 'cambio_turno'


def obtener_novedades_por_fecha(empleado, fecha_inicio, fecha_fin):
    resultado = {}

    if not empleado or fecha_inicio > fecha_fin:
        return resultado

    # 1. Solicitudes aprobadas (todas excepto cambio_turno)
    solicitudes = Solicitud.objects.filter(
        empleado=empleado,
        estado=ESTADO_APROBADO,
        fecha_inicio__lte=fecha_fin,
        fecha_fin__gte=fecha_inicio,
    ).exclude(tipo=TIPO_CAMBIO_TURNO)

    for p in solicitudes:
        inicio = max(p.fecha_inicio, fecha_inicio)
        fin = min(p.fecha_fin, fecha_fin)
        cursor = inicio
        while cursor <= fin:
            if cursor not in resultado:
                resultado[cursor] = {'tipo': 'SOLICITUD', 'detalle': p}
            cursor += timedelta(days=1)

    # 2. Incapacidades aprobadas (prioridad máxima)
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
    return obtener_novedades_por_fecha(empleado, fecha, fecha).get(fecha)