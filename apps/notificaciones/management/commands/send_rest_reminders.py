from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.asistencia.models import DescansoEmpleado
from apps.notificaciones.utils import enviar_notificacion, obtener_correo_admin

class Command(BaseCommand):
    help = 'Envía recordatorios de próximos días de descanso (7 días y 1 día antes)'

    def handle(self, *args, **options):
        hoy = timezone.now().date()
        dias_recordatorio = [7, 1]  # 7 días antes y 1 día antes
        descansos = DescansoEmpleado.objects.filter(
            es_descanso=True,
            fecha__gte=hoy
        ).select_related('horario__empleado')

        if not descansos:
            self.stdout.write(self.style.SUCCESS("No hay descansos próximos."))
            return

        for descanso in descansos:
            dias_restantes = (descanso.fecha - hoy).days
            if dias_restantes in dias_recordatorio:
                empleado = descanso.horario.empleado
                contexto = {
                    'empleado_nombre': empleado.nombre_completo(),
                    'fecha_descanso': descanso.fecha.strftime('%d/%m/%Y'),
                    'dias_restantes': dias_restantes,
                }

                # Notificar al empleado
                enviar_notificacion(
                    destinatario=empleado.correo,
                    asunto="📅 Recordatorio: tu día de descanso está próximo",
                    template_name='emails/descanso_recordatorio.html',
                    contexto=contexto
                )

                # Notificar a los administradores
                admins = obtener_correo_admin()
                for admin_email in admins:
                    enviar_notificacion(
                        destinatario=admin_email,
                        asunto=f"📅 Recordatorio: día de descanso de {empleado.nombre_completo()}",
                        template_name='emails/descanso_recordatorio_admin.html',
                        contexto=contexto
                    )

        self.stdout.write(self.style.SUCCESS("Recordatorios de descanso enviados."))