"""
Comando de gestión: verifica funciones vencidas y asistencia, y genera
memorandos automáticos cuando corresponde.

Uso:
    python manage.py verificar_memorandos
    python manage.py verificar_memorandos --empleado-id 5
    python manage.py verificar_memorandos --solo funciones
    python manage.py verificar_memorandos --solo asistencia
    python manage.py verificar_memorandos --mes 9 --anio 2026

Pensado para ejecutarse:
    - Manualmente desde la terminal cuando se quiera forzar la revisión.
    - Periódicamente vía cron (Linux) o Programador de funciones (Windows).
"""

from django.core.management.base import BaseCommand

from apps.usuarios.models import PerfilEmpleado
from apps.memorandos.services import (
    verificar_y_generar_memorando,
    verificar_memorandos_asistencia,
)


class Command(BaseCommand):
    help = (
        'Revisa funciones vencidas y asistencia de todos los empleados '
        'activos y genera memorandos automáticos cuando corresponde.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--empleado-id',
            type=int,
            help='Verificar solo un empleado específico (útil para pruebas).'
        )
        parser.add_argument(
            '--solo',
            choices=['funciones', 'asistencia'],
            help='Ejecutar solo un módulo (por defecto: ambos).'
        )
        parser.add_argument(
            '--mes',
            type=int,
            help='Mes a verificar en asistencia (por defecto: mes actual).'
        )
        parser.add_argument(
            '--anio',
            type=int,
            help='Año a verificar en asistencia (por defecto: año actual).'
        )

    def handle(self, *args, **options):
        empleado_id = options.get('empleado_id')
        solo = options.get('solo')
        mes = options.get('mes')
        anio = options.get('anio')

        # ----------------------------------------------------------
        # Determinar empleados a revisar
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

        total = qs.count()
        self.stdout.write(self.style.MIGRATE_HEADING(
            f'Verificando {total} empleado(s)...'
        ))

        # Contadores
        cont = {
            'funciones': 0,
            'tardanzas': 0,
            'ausencias': 0,
        }

        # ----------------------------------------------------------
        # Recorrer
        # ----------------------------------------------------------
        for emp in qs:
            # ========== FUNCIONES ==========
            if solo in (None, 'funciones'):
                try:
                    memo = verificar_y_generar_memorando(emp)
                    if memo:
                        cont['funciones'] += 1
                        self.stdout.write(self.style.SUCCESS(
                            f'  âœ” [FUNCIONES] {memo.consecutivo} â†’ '
                            f'{emp.nombre_completo()}'
                        ))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(
                        f'  âš  Error en funciones para {emp.nombre_completo()}: {e}'
                    ))

            # ========== ASISTENCIA (tardanzas + ausencias) ==========
            if solo in (None, 'asistencia'):
                try:
                    resultado = verificar_memorandos_asistencia(
                        emp, mes=mes, anio=anio
                    )
                    if resultado['tardanzas']:
                        cont['tardanzas'] += 1
                        self.stdout.write(self.style.SUCCESS(
                            f'  âœ” [TARDANZAS] '
                            f'{resultado["tardanzas"].consecutivo} â†’ '
                            f'{emp.nombre_completo()}'
                        ))
                    if resultado['ausencias']:
                        cont['ausencias'] += 1
                        self.stdout.write(self.style.SUCCESS(
                            f'  âœ” [AUSENCIAS] '
                            f'{resultado["ausencias"].consecutivo} â†’ '
                            f'{emp.nombre_completo()}'
                        ))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(
                        f'  âš  Error en asistencia para {emp.nombre_completo()}: {e}'
                    ))

        # ----------------------------------------------------------
        # Resumen
        # ----------------------------------------------------------
        self.stdout.write(self.style.SUCCESS(
            f'\nVerificación completa:\n'
            f'  Funciones vencidas:  {cont["funciones"]} memorando(s)\n'
            f'  Tardanzas:        {cont["tardanzas"]} memorando(s)\n'
            f'  Ausencias:        {cont["ausencias"]} memorando(s)\n'
        ))
