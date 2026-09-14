from django.core.management.base import BaseCommand

from ...services.novedades_service import rechazar_solicitudes_vencidas


class Command(BaseCommand):
    help = (
        'Rechaza automáticamente permisos cuya fecha de inicio '
        'ya llegó y certificados pendientes con 5 días o más.'
    )

    def handle(self, *args, **options):
        resultado = rechazar_solicitudes_vencidas()

        self.stdout.write(
            self.style.SUCCESS(
                'Proceso completado correctamente.'
            )
        )

        self.stdout.write(
            f"Permisos rechazados: "
            f"{resultado['permisos_rechazados']}"
        )

        self.stdout.write(
            f"Certificados rechazados: "
            f"{resultado['certificados_rechazados']}"
        )

        self.stdout.write(
            f"Total rechazados: "
            f"{resultado['total']}"
        )