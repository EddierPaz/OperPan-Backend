from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.asistencia.models import Horario, Asistencia
from apps.notificaciones.utils import enviar_notificacion, obtener_correo_admin

class Command(BaseCommand):
    help = 'Envía alertas por falta de registro de asistencia del día'

    def handle(self, *args, **options):
        hoy = timezone.now().date()
        horarios = Horario.objects.filter(estado=True)

        if not horarios:
            self.stdout.write(self.style.SUCCESS("No hay horarios activos para revisar."))
            return

        empleados_sin_asistencia = []

        for horario in horarios:
            asistencia = Asistencia.objects.filter(horario=horario, fecha=hoy).first()
            if not asistencia:
                empleado = horario.empleado
                empleados_sin_asistencia.append(empleado)

                # Notificar al empleado
                contexto = {
                    'empleado_nombre': empleado.nombre_completo(),
                    'fecha': hoy.strftime('%d/%m/%Y'),
                }
                enviar_notificacion(
                    destinatario=empleado.correo,
                    asunto="⚠️ Registro de asistencia pendiente",
                    template_name='emails/falta_asistencia.html',
                    contexto=contexto
                )

        # Notificar a los administradores (solo si hay empleados sin asistencia)
        if empleados_sin_asistencia:
            admins = obtener_correo_admin()
            for admin_email in admins:
                # Podemos enviar un resumen o un correo por cada empleado
                # Opción resumen:
                contexto_admin = {
                    'total': len(empleados_sin_asistencia),
                    'empleados': ', '.join([e.nombre_completo() for e in empleados_sin_asistencia]),
                    'fecha': hoy.strftime('%d/%m/%Y'),
                }
                enviar_notificacion(
                    destinatario=admin_email,
                    asunto=f"⚠️ {len(empleados_sin_asistencia)} empleados sin registro de asistencia hoy",
                    template_name='emails/falta_asistencia_admin.html',
                    contexto=contexto_admin
                )

        self.stdout.write(self.style.SUCCESS(f"Alertas de asistencia enviadas para {len(empleados_sin_asistencia)} empleados."))