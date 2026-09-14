from django.core.management.base import BaseCommand

from apps.asistencia.services.horario_service import regenerar_ciclos_vencidos


class Command(BaseCommand):
    help = (
        "Genera automáticamente los siguientes ciclos de horario "
        "(Horario + DescansoEmpleado) para los horarios activos cuyo "
        "ciclo ya venció. Pensado para ejecutarse a diario vía cron "
        "(ej. todos los días a las 00:05)."
    )

    def handle(self, *args, **options):
        generados = regenerar_ciclos_vencidos()

        if generados:
            self.stdout.write(
                self.style.SUCCESS(f"Ciclos generados: {generados}")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("No había ciclos vencidos. Nada que generar.")
            )