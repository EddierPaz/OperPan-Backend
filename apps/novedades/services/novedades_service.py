from datetime import timedelta

from django.utils import timezone

from ..models import Solicitud, Certificado

MOTIVO_RECHAZO_AUTOMATICO = (
    'La solicitud fue rechazada automáticamente porque no fue '
    'respondida dentro del tiempo establecido.'
)

def rechazar_solicitudes_vencidas():
    """
    Rechaza automáticamente:
    - Solicitudes: cuando llega su fecha_inicio.
    - Certificados: cuando han pasado 5 días calendario desde fecha_solicitud.
    Las incapacidades NO se procesan automáticamente.
    """
    ahora = timezone.now()
    hoy = timezone.localdate()

    solicitudes_rechazadas = 0
    certificados_rechazados = 0

    # ============================================================
    # SOLICITUDES
    # ============================================================
    solicitudes = Solicitud.objects.filter(
        estado='pendiente',
        fecha_inicio__lte=hoy,
    ).select_related('empleado')

    for solicitud in solicitudes:
        solicitud.estado = 'rechazado'
        solicitud.motivo_rechazo = MOTIVO_RECHAZO_AUTOMATICO
        solicitud.decision_fecha = ahora
        solicitud.decision_por = None

        solicitud.save(update_fields=[
            'estado',
            'motivo_rechazo',
            'decision_fecha',
            'decision_por',
        ])

        solicitudes_rechazadas += 1

    # ============================================================
    # CERTIFICADOS
    # ============================================================
    fecha_limite = hoy - timedelta(days=5)

    certificados = Certificado.objects.filter(
        estado='pendiente',
        fecha_solicitud__date__lte=fecha_limite,
    ).select_related('empleado')

    for certificado in certificados:
        certificado.estado = 'rechazado'
        certificado.motivo_rechazo = MOTIVO_RECHAZO_AUTOMATICO
        certificado.decision_fecha = ahora
        certificado.decision_por = None

        certificado.save(update_fields=[
            'estado',
            'motivo_rechazo',
            'decision_fecha',
            'decision_por',
        ])

        certificados_rechazados += 1

    return {
        'solicitudes_rechazadas': solicitudes_rechazadas,
        'certificados_rechazados': certificados_rechazados,
        'total': solicitudes_rechazadas + certificados_rechazados,
    }