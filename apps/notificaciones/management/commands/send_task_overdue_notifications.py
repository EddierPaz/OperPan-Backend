from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.tareas.models import Task, EstadoTarea
from apps.notificaciones.utils import enviar_notificacion, obtener_correo_admin

class Command(BaseCommand):
    help = 'Envía notificaciones de tareas vencidas a empleados y administradores'

    def handle(self, *args, **options):
        hoy = timezone.now().date()
        tareas_vencidas = Task.objects.filter(
            fecha_limite__lt=hoy
        ).exclude(estado=EstadoTarea.FINALIZADA)

        if not tareas_vencidas:
            self.stdout.write(self.style.SUCCESS("No hay tareas vencidas."))
            return

        for tarea in tareas_vencidas:
            # Notificar al empleado
            contexto = {
                'empleado_nombre': tarea.empleado.nombre_completo(),
                'titulo': tarea.titulo,
                'descripcion': tarea.descripcion,
                'fecha_limite': tarea.fecha_limite.strftime('%d/%m/%Y'),
            }
            enviar_notificacion(
                destinatario=tarea.empleado.correo,
                asunto=f"⏰ Tarea vencida: {tarea.titulo}",
                template_name='emails/tarea_vencida.html',
                contexto=contexto
            )

            # Notificar a los administradores
            admins = obtener_correo_admin()
            for admin_email in admins:
                contexto_admin = {
                    'empleado': tarea.empleado.nombre_completo(),
                    'titulo': tarea.titulo,
                    'descripcion': tarea.descripcion,
                    'fecha_limite': tarea.fecha_limite.strftime('%d/%m/%Y'),
                }
                enviar_notificacion(
                    destinatario=admin_email,
                    asunto=f"⏰ Tarea vencida de {tarea.empleado.nombre_completo()}",
                    template_name='emails/tarea_vencida_admin.html',
                    contexto=contexto_admin
                )

        self.stdout.write(self.style.SUCCESS(f"Notificaciones de tareas vencidas enviadas. Total: {tareas_vencidas.count()}"))