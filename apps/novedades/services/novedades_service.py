from datetime import timedelta

from django.utils import timezone

from ..models import Permiso, Certificado


MOTIVO_RECHAZO_AUTOMATICO = (
    'La solicitud fue rechazada automáticamente porque no fue '
    'respondida dentro del tiempo establecido.'
)


def rechazar_solicitudes_vencidas():
    """
    Rechaza automáticamente:

    - Permisos: cuando llega su fecha_inicio.
    - Certificados: cuando han pasado 5 días calendario desde fecha_solicitud.

    Las incapacidades NO se procesan automáticamente.
    """

    ahora = timezone.now()
    hoy = timezone.localdate()

    permisos_rechazados = 0
    certificados_rechazados = 0

    # ============================================================
    # PERMISOS
    # ============================================================
    permisos = Permiso.objects.filter(
        estado='pendiente',
        fecha_inicio__lte=hoy,
    ).select_related('empleado')

    for permiso in permisos:
        permiso.estado = 'rechazado'
        permiso.motivo_rechazo = MOTIVO_RECHAZO_AUTOMATICO
        permiso.decision_fecha = ahora
        permiso.decision_por = None

        permiso.save(update_fields=[
            'estado',
            'motivo_rechazo',
            'decision_fecha',
            'decision_por',
        ])

        permisos_rechazados += 1


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
        'permisos_rechazados': permisos_rechazados,
        'certificados_rechazados': certificados_rechazados,
        'total': permisos_rechazados + certificados_rechazados,
    }