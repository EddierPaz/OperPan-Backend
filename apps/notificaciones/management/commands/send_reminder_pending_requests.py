from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.novedades.models import Permiso, Incapacidad, Certificado
from apps.notificaciones.utils import enviar_notificacion, obtener_correo_admin

class Command(BaseCommand):
    help = 'Envía recordatorios de solicitudes pendientes con más de 7 días'

    def handle(self, *args, **options):
        hace_7_dias = timezone.now() - timedelta(days=7)
        solicitudes_pendientes = []

        # Recolectar solicitudes pendientes con más de 7 días
        for modelo, nombre in [(Permiso, 'Permiso'), (Incapacidad, 'Incapacidad'), (Certificado, 'Certificado')]:
            qs = modelo.objects.filter(estado='pendiente', fecha_solicitud__lte=hace_7_dias)
            for s in qs:
                solicitudes_pendientes.append({
                    'empleado': s.empleado,
                    'tipo': nombre,
                    'fecha_solicitud': s.fecha_solicitud,
                    'dias_pendientes': (timezone.now() - s.fecha_solicitud).days,
                    'id': s.id,
                })

        if not solicitudes_pendientes:
            self.stdout.write(self.style.SUCCESS("No hay solicitudes pendientes con más de 7 días."))
            return

        # Notificar a cada empleado
        for item in solicitudes_pendientes:
            contexto = {
                'empleado_nombre': item['empleado'].nombre_completo(),
                'tipo_solicitud': item['tipo'],
                'fecha_solicitud': item['fecha_solicitud'].strftime('%d/%m/%Y'),
                'dias_pendientes': item['dias_pendientes'],
            }
            enviar_notificacion(
                destinatario=item['empleado'].correo,
                asunto="⏳ Recordatorio: tu solicitud sigue pendiente",
                template_name='emails/solicitud_pendiente_recordatorio.html',
                contexto=contexto
            )

        # Notificar a los administradores
        admins = obtener_correo_admin()
        for admin_email in admins:
            enviar_notificacion(
                destinatario=admin_email,
                asunto=f"⏳ {len(solicitudes_pendientes)} solicitudes pendientes por más de 7 días",
                template_name='emails/solicitud_pendiente_recordatorio_admin.html',
                contexto={'total': len(solicitudes_pendientes)}
            )

        self.stdout.write(self.style.SUCCESS(f"Recordatorios enviados para {len(solicitudes_pendientes)} solicitudes."))