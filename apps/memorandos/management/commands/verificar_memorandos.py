from django.core.management.base import BaseCommand

from apps.usuarios.models import PerfilEmpleado
from apps.memorandos.services import verificar_y_generar_memorando


class Command(BaseCommand):
    help = (
        'Revisa tareas vencidas de todos los empleados activos y '
        'genera memorandos automáticos cuando se acumulan '
        '3 o más tareas vencidas sin memorando previo.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--empleado-id',
            type=int,
            help='Verificar solo un empleado específico (útil para pruebas).'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula la verificación sin crear memorandos.'
        )

    def handle(self, *args, **options):
        empleado_id = options.get('empleado_id')
        dry_run = options.get('dry_run')

        # ----------------------------------------------------------
        # Determinar qué empleados revisar
        # ----------------------------------------------------------
        qs = PerfilEmpleado.objects.filter(
            user__rol='empleado',
            estado='activo'
        )
        if empleado_id:
            qs = qs.filter(pk=empleado_id)
            if not qs.exists():
                self.stdout.write(self.style.ERROR(
                    f'No existe un empleado activo con id={empleado_id}.'
                ))
                return

        total_empleados = qs.count()
        total_memorandos = 0

        self.stdout.write(self.style.MIGRATE_HEADING(
            f'Verificando {total_empleados} empleado(s)...'
            + (' [DRY RUN]' if dry_run else '')
        ))

        # ----------------------------------------------------------
        # Recorrer empleados
        # ----------------------------------------------------------
        for emp in qs:
            if dry_run:
                # Solo consultar si calificaría, sin crear nada
                from apps.memorandos.services import (
                    tareas_vencidas_sin_memorando,
                )
                from apps.tareas.constants import (
                    UMBRAL_TAREAS_VENCIDAS_MEMORANDO,
                )

                vencidas = tareas_vencidas_sin_memorando(emp).count()
                if vencidas >= UMBRAL_TAREAS_VENCIDAS_MEMORANDO:
                    self.stdout.write(self.style.WARNING(
                        f'  → {emp.nombre_completo()}: '
                        f'{vencidas} vencidas sin memo (calificaría).'
                    ))
                continue

            memorando = verificar_y_generar_memorando(emp)
            if memorando:
                total_memorandos += 1
                self.stdout.write(self.style.SUCCESS(
                    f'  ✔ {memorando.consecutivo} generado para '
                    f'{emp.nombre_completo()} '
                    f'({memorando.tareas_origen.count()} tareas).'
                ))

        # ----------------------------------------------------------
        # Resumen
        # ----------------------------------------------------------
        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f'Dry-run completo. Nada fue creado.'
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'Verificación completa. Memorandos generados: '
                f'{total_memorandos}'
            ))