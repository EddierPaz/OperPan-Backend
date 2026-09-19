"""
Management command: seed_historico

Genera una base de datos histórica realista para OperPan:
- 4 admins + 26 empleados.
- Horarios con ciclos automáticos desde 2026-01-05 (lunes) hasta hoy.
- Descansos por ciclo (FIJO = mismo día semanal, MANANA/TARDE = rotativo).
- Asistencias día a día.
- Permisos, incapacidades, certificados.
- Tareas distribuidas en el tiempo.
- Memorandos generados automáticamente.

Uso:
    python manage.py seed_historico --clean   # borra todo y regenera
    python manage.py seed_historico           # solo si la BD está vacía
"""

import random
from datetime import date, datetime, time, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker

from apps.usuarios.models import User, PerfilEmpleado
from apps.asistencia.models import Horario, DescansoEmpleado, Asistencia
from apps.asistencia.services.horario_service import (
    dias_ciclo, ciclo_fin, generar_siguiente_ciclo,
)
from apps.tareas.models import Task, EstadoTarea, Prioridad, Area
from apps.novedades.models import Permiso, Incapacidad, Certificado
from apps.memorandos.services import (
    verificar_y_generar_memorando, verificar_memorandos_asistencia,
)


# ============================================================
# CONFIGURACIÓN
# ============================================================

FECHA_INICIO_HISTORICO = date(2026, 1, 5)   # lunes

N_ADMINS = 4
N_EMPLEADOS = 26

CARGOS = ['mesero', 'cajero', 'pastelero', 'panadero', 'cocina', 'buñuelero', 'greca']
TURNOS = ['MANANA', 'TARDE', 'FIJO']

HORAS_TURNO = {
    'MANANA': (time(6, 0), time(14, 0)),
    'TARDE':  (time(14, 0), time(22, 0)),
    'FIJO':   (time(8, 0), time(17, 0)),
}

NOMBRES_H = [
    'Juan', 'Carlos', 'Luis', 'Andrés', 'Felipe', 'Jorge', 'Daniel', 'David',
    'José', 'Manuel', 'Pedro', 'Santiago', 'Mateo', 'Sebastián', 'Nicolás',
    'Gabriel', 'Camilo', 'Esteban', 'Diego', 'Oscar',
]
NOMBRES_M = [
    'María', 'Laura', 'Natalia', 'Carolina', 'Diana', 'Sofía', 'Valentina',
    'Ana', 'Paula', 'Camila', 'Isabella', 'Lucía', 'Daniela', 'Angélica',
    'Lina', 'Adriana', 'Marcela', 'Cristina', 'Lorena', 'Viviana',
]
APELLIDOS = [
    'García', 'Martínez', 'Pérez', 'Rodríguez', 'Gómez', 'Herrera', 'Rojas',
    'González', 'Díaz', 'López', 'Ramírez', 'Torres', 'Castillo', 'Cruz',
    'Morales', 'Ortiz', 'Reyes', 'Mendoza', 'Álvarez', 'Castro', 'Vargas',
    'Flores', 'Guzmán', 'Molina', 'Jiménez', 'Ramos', 'Romero', 'Gil',
]

CIUDADES = [
    'Medellín', 'Envigado', 'Itagüí', 'Sabaneta', 'Bello', 'Rionegro',
    'La Estrella', 'Caldas', 'Bogotá', 'Cali',
]
EPS_LISTA = ['Sura', 'Colsanitas', 'Salud Total', 'Nueva EPS', 'Sanitas', 'Compensar']
ARL_LISTA = ['Sura ARL', 'Positiva ARL', 'Liberty ARL', 'Colpatria ARL']
PENSION_LISTA = ['Porvenir', 'Protección', 'Colfondos', 'Skandia']

ASUNTOS_MEMO = [
    ('Llegadas tardías reiteradas', 'llamado_atencion',
     'Durante las últimas semanas se ha evidenciado incumplimiento reiterado en el horario de ingreso.'),
    ('Incumplimiento del uniforme', 'advertencia',
     'Se recuerda el uso obligatorio del uniforme completo durante la jornada.'),
    ('Reconocimiento por excelente desempeño', 'reconocimiento',
     'Se reconoce el excelente desempeño demostrado durante el último mes.'),
    ('Llamado preventivo', 'informacion',
     'Se hace un llamado preventivo para reforzar el cumplimiento de las normas internas.'),
    ('Incumplimiento de protocolos de higiene', 'advertencia',
     'Se exige el cumplimiento estricto de los protocolos de limpieza y desinfección.'),
]

TAREAS_PANADERIA = [
    ('Preparar masa madre', 'Elaborar la masa madre diaria.'),
    ('Preparar buñuelos', 'Amasar y freír buñuelos para el mostrador.'),
    ('Hornear pan francés', 'Hornear la tanda de pan francés de la mañana.'),
    ('Atender mostrador', 'Atención al cliente en el punto de venta.'),
    ('Organizar vitrinas', 'Reordenar y limpiar las vitrinas de exhibición.'),
    ('Limpiar horno', 'Limpieza profunda del horno de panadería.'),
    ('Inventario de harina', 'Conteo de bultos de harina en bodega.'),
    ('Preparar café', 'Preparar café y bebidas calientes para el servicio.'),
    ('Empacar pedidos', 'Empacar pedidos para domicilios y recogidas.'),
    ('Amasar pan de queso', 'Preparar pan de queso para venta.'),
    ('Decorar tortas', 'Decoración de tortas con crema y fruta.'),
    ('Reabastecer insumos', 'Reponer insumos en el área de trabajo.'),
]


# ============================================================
# HELPERS
# ============================================================

def _generar_nombre(genero):
    nombre = random.choice(NOMBRES_H if genero == 'M' else NOMBRES_M)
    return nombre, random.choice(APELLIDOS), random.choice(APELLIDOS)


def _generar_username(nombre, ap1, ap2, existentes):
    for cand in [
        (nombre + ap1).lower().replace(' ', ''),
        (nombre + ap2).lower().replace(' ', ''),
    ]:
        if cand not in existentes:
            existentes.add(cand)
            return cand
    for _ in range(30):
        cand = f"{(nombre + ap1).lower().replace(' ', '')}{random.randint(1, 999)}"
        if cand not in existentes:
            existentes.add(cand)
            return cand
    return (nombre + ap1).lower()


def _perfil_calidad():
    """(p_presente, p_tarde, p_ausente) según el 'comportamiento' del empleado."""
    r = random.random()
    if r < 0.70:
        return (0.95, 0.04, 0.01)   # modelo
    if r < 0.90:
        return (0.85, 0.10, 0.05)   # normal
    return (0.70, 0.15, 0.15)       # problemático


# ============================================================
# COMMAND
# ============================================================

class Command(BaseCommand):
    help = 'Genera datos históricos completos para OperPan.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Borra todos los datos existentes antes de generar.',
        )
        parser.add_argument(
            '--desde',
            type=str,
            default=None,
            help='Fecha de inicio (YYYY-MM-DD). Por defecto: 2026-01-05.',
        )

    def handle(self, *args, **options):
        if options['clean']:
            self._limpiar_todo()

        if User.objects.exists():
            self.stdout.write(self.style.WARNING(
                '⚠️  Ya hay usuarios en la BD. Usa --clean para regenerar.'
            ))
            return

        fecha_inicio = (
            date.fromisoformat(options['desde'])
            if options['desde'] else FECHA_INICIO_HISTORICO
        )

        fake = Faker('es_CO')
        random.seed(42)   # reproducibilidad

        self.stdout.write(self.style.MIGRATE_HEADING(
            f'Generando datos desde {fecha_inicio} hasta {date.today()}...'
        ))

        with transaction.atomic():
            admins = self._crear_admins(fake)
            perfiles = self._crear_empleados(fake)
            self.stdout.write(f'  ✓ {len(admins)} admins + {len(perfiles)} empleados')

            horarios_por_empleado = {}
            for perfil in perfiles:
                horarios_por_empleado[perfil.pk] = self._crear_horarios(
                    perfil, fecha_inicio
                )
            total_ciclos = sum(len(v) for v in horarios_por_empleado.values())
            self.stdout.write(f'  ✓ {total_ciclos} ciclos de horario')

            self._crear_novedades(perfiles, fake)
            self.stdout.write('  ✓ Permisos, incapacidades y certificados')

            total_asist = self._crear_asistencias(perfiles, horarios_por_empleado)
            self.stdout.write(f'  ✓ {total_asist} asistencias')

            total_tareas = self._crear_tareas(perfiles, admins[0])
            self.stdout.write(f'  ✓ {total_tareas} tareas')

        # Memorandos — fuera de la transacción por si tardan
        self.stdout.write(self.style.MIGRATE_HEADING(
            'Generando memorandos automáticos...'
        ))
        self._generar_memorandos(perfiles)

        # Resumen final
        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Listo. Totales:\n'
            f'  Usuarios:      {User.objects.count()}\n'
            f'  Perfiles:      {PerfilEmpleado.objects.count()}\n'
            f'  Horarios:      {Horario.objects.count()}\n'
            f'  Asistencias:   {Asistencia.objects.count()}\n'
            f'  Tareas:        {Task.objects.count()}\n'
            f'  Permisos:      {Permiso.objects.count()}\n'
            f'  Incapacidades: {Incapacidad.objects.count()}\n'
            f'  Certificados:  {Certificado.objects.count()}\n'
        ))

    # ============================================================
    # LIMPIEZA
    # ============================================================

    def _limpiar_todo(self):
        """Borra todos los datos de las apps (mantiene migraciones)."""
        from apps.memorandos.models import Memorando

        self.stdout.write(self.style.WARNING('Borrando datos existentes...'))
        with transaction.atomic():
            Memorando.objects.all().delete()
            Asistencia.objects.all().delete()
            DescansoEmpleado.objects.all().delete()
            Horario.objects.all().delete()
            Task.objects.all().delete()
            Permiso.objects.all().delete()
            Incapacidad.objects.all().delete()
            Certificado.objects.all().delete()
            PerfilEmpleado.objects.all().delete()
            User.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('  ✓ Datos borrados'))

    # ============================================================
    # ADMINS Y EMPLEADOS
    # ============================================================

    def _crear_admins(self, fake):
        admins = []
        usernames = set()

        # Admin principal
        admin_principal, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@operpan.com',
                'rol': 'admin',
                'estado_cuenta': User.EstadoCuenta.ACTIVA,
                'debe_cambiar_password': False,
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if created:
            admin_principal.set_password('admin1234')
            admin_principal.save()

        # Crear perfil si no existe
        if not hasattr(admin_principal, 'perfil'):
            PerfilEmpleado.objects.create(
                user=admin_principal,
                primer_nombre='Admin',
                segundo_nombre='',
                primer_apellido='OperPan',
                segundo_apellido='',
                tipo_documento='CC',
                numero_documento='1000000001',
                correo='admin@operpan.com',
                telefono='3000000001',
                ciudad='Medellín',
                fecha_ingreso=FECHA_INICIO_HISTORICO,
                estado='activo',
            )

        admins.append(admin_principal)
        usernames.add('admin')

        # Admins adicionales
        for i in range(N_ADMINS - 1):
            genero = random.choice(['M', 'F'])
            nombre, ap1, ap2 = _generar_nombre(genero)
            username = _generar_username(nombre, ap1, ap2, usernames)

            user = User.objects.create(
                username=username,
                email=f'{username}@operpan.com',
                rol='admin',
                estado_cuenta=User.EstadoCuenta.ACTIVA,
                debe_cambiar_password=False,
                is_staff=True,
                first_name=nombre,
                last_name=f'{ap1} {ap2}',
            )
            user.set_password('admin1234')
            user.save()

            PerfilEmpleado.objects.create(
                user=user,
                primer_nombre=nombre,
                segundo_nombre='',
                primer_apellido=ap1,
                segundo_apellido=ap2,
                tipo_documento='CC',
                numero_documento=str(fake.unique.random_number(digits=10)),
                correo=user.email,
                telefono=fake.phone_number()[:20],
                ciudad=random.choice(CIUDADES),
                fecha_ingreso=FECHA_INICIO_HISTORICO,
                estado='activo',
            )

            admins.append(user)

        return admins

    def _crear_empleados(self, fake):
        perfiles = []
        usernames = set(u.username for u in User.objects.all())

        for _ in range(N_EMPLEADOS):
            genero = random.choice(['M', 'F'])
            nombre, ap1, ap2 = _generar_nombre(genero)
            username = _generar_username(nombre, ap1, ap2, usernames)

            user = User.objects.create(
                username=username,
                email=f'{username}@operpan.com',
                rol='empleado',
                estado_cuenta=User.EstadoCuenta.ACTIVA,
                debe_cambiar_password=False,
                first_name=nombre,
                last_name=f'{ap1} {ap2}',
            )
            user.set_password('empleado1234')
            user.save()

            # Calidad del empleado para asistencia
            calidad = _perfil_calidad()

            perfil = PerfilEmpleado.objects.create(
                user=user,
                primer_nombre=nombre,
                segundo_nombre='',
                primer_apellido=ap1,
                segundo_apellido=ap2,
                tipo_documento='CC',
                numero_documento=str(fake.unique.random_number(digits=10)),
                fecha_nacimiento=fake.date_of_birth(minimum_age=18, maximum_age=55),
                genero=genero,
                estado_civil=random.choice(['soltero', 'casado', 'union_libre']),
                tipo_sangre=random.choice(['O+', 'A+', 'B+', 'AB+']),
                telefono=fake.phone_number()[:20],
                correo=f'{username}@operpan.com',
                ciudad=random.choice(CIUDADES),
                direccion=fake.street_address()[:200],
                contacto_emergencia=fake.name()[:100],
                parentesco_emergencia=random.choice(['Padre', 'Madre', 'Hermano', 'Cónyuge']),
                telefono_emergencia=fake.phone_number()[:20],
                cargo=random.choice(CARGOS),
                fecha_ingreso=FECHA_INICIO_HISTORICO,
                eps=random.choice(EPS_LISTA),
                arl=random.choice(ARL_LISTA),
                fondo_pension=random.choice(PENSION_LISTA),
                estado='activo',
            )
            perfil._calidad = calidad   # atributo temporal
            perfiles.append(perfil)

        return perfiles

    # ============================================================
    # HORARIOS Y CICLOS
    # ============================================================

    def _crear_horarios(self, perfil, fecha_inicio):
        """
        Crea el horario inicial del empleado y genera todos los ciclos
        siguientes hasta hoy. Devuelve la lista de Horarios del empleado.
        """
        turno = random.choice(TURNOS)
        h_entrada, h_salida = HORAS_TURNO[turno]
        dias = dias_ciclo(turno)
        fecha_fin = fecha_inicio + timedelta(days=dias - 1)

        # Día de descanso dentro del primer ciclo
        if turno == 'FIJO':
            # Elegir un weekday fijo
            dia_sem = random.randint(0, 6)
            fecha_desc = fecha_inicio
            while fecha_desc.weekday() != dia_sem:
                fecha_desc += timedelta(days=1)
            if fecha_desc > fecha_fin:
                # No cayó dentro del ciclo → ajustar al primer día
                fecha_desc = fecha_inicio
            dia_desc_sem = fecha_desc.weekday()
        else:
            fecha_desc = fecha_inicio + timedelta(days=random.randint(0, dias - 1))
            dia_desc_sem = None

        # Primer ciclo
        horario = Horario.objects.create(
            empleado=perfil,
            turno=turno,
            hora_entrada=h_entrada,
            hora_salida=h_salida,
            estado=True,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            ciclo_inicio=fecha_inicio,
            dia_descanso_semana=dia_desc_sem,
        )
        DescansoEmpleado.objects.create(
            horario=horario,
            fecha=fecha_desc,
            es_descanso=True,
        )

        # Generar ciclos hasta hoy
        ciclos = [horario]
        hoy = timezone.localdate()
        while ciclo_fin(horario) is not None and ciclo_fin(horario) < hoy:
            horario = generar_siguiente_ciclo(horario)
            ciclos.append(horario)

        return ciclos

    # ============================================================
    # NOVEDADES (permisos, incapacidades, certificados)
    # ============================================================

    def _crear_novedades(self, perfiles, fake):
        """
        Crea permisos, incapacidades y certificados distribuidos
        a lo largo del período. Las solicitudes aprobadas de permiso
        e incapacidad se usarán para excluir días en la generación
        de asistencias.
        """
        hoy = timezone.localdate()
        for perfil in perfiles:
            # --- Permisos (2 a 5 por empleado en el período) ---
            n_permisos = random.randint(2, 5)
            for _ in range(n_permisos):
                fi = self._fecha_aleatoria(FECHA_INICIO_HISTORICO, hoy)
                ff = fi + timedelta(days=random.randint(0, 3))
                estado = random.choices(
                    ['pendiente', 'aprobado', 'rechazado'],
                    weights=[0.2, 0.6, 0.2],
                )[0]

                Permiso.objects.create(
                    empleado=perfil,
                    tipo=random.choice([
                        'personal', 'medico', 'familiar', 'academico',
                        'calamidad', 'vacaciones',
                    ]),
                    fecha_inicio=fi,
                    fecha_fin=ff,
                    justificacion=fake.sentence(nb_words=10)[:300],
                    estado=estado,
                    decision_fecha=(
                        timezone.now() - timedelta(days=random.randint(1, 30))
                        if estado != 'pendiente' else None
                    ),
                    motivo_rechazo=(
                        'No se justificó adecuadamente.' if estado == 'rechazado' else None
                    ),
                )

            # --- Incapacidades (0 a 2 por empleado) ---
            for _ in range(random.randint(0, 2)):
                fi = self._fecha_aleatoria(FECHA_INICIO_HISTORICO, hoy)
                ff = fi + timedelta(days=random.randint(2, 7))
                estado = random.choices(
                    ['aprobado', 'rechazado'],
                    weights=[0.8, 0.2],
                )[0]

                Incapacidad.objects.create(
                    empleado=perfil,
                    titulo=random.choice(['Gripe', 'Migraña', 'Lumbalgia', 'Gastritis']),
                    descripcion='Reposo médico indicado por profesional.',
                    fecha_inicio=fi,
                    fecha_fin=ff,
                    entidad_emisora=random.choice(['Sura', 'Nueva EPS', 'Sanitas']),
                    numero_incapacidad=str(fake.random_number(digits=8)),
                    estado=estado,
                    decision_fecha=timezone.now() - timedelta(days=random.randint(1, 30)),
                )

            # --- Certificados (0 a 1 por empleado) ---
            if random.random() < 0.6:
                Certificado.objects.create(
                    empleado=perfil,
                    tipo=random.choice(['laboral', 'ingresos', 'antiguedad']),
                    proposito='Trámite personal del empleado.',
                    estado=random.choice(['aprobado', 'pendiente']),
                    fecha_solicitud=(
                        timezone.now() - timedelta(days=random.randint(1, 60))
                    ),
                    fecha_emision=(
                        timezone.now() - timedelta(days=random.randint(0, 30))
                    ),
                )

    # ============================================================
    # ASISTENCIAS
    # ============================================================

    def _crear_asistencias(self, perfiles, horarios_por_empleado):
        """
        Recorre todos los ciclos de cada empleado y crea asistencias
        día a día, evitando:
            - días de descanso
            - días con permiso o incapacidad aprobada
            - fechas futuras
        """
        hoy = timezone.localdate()
        asistencias_nuevas = []

        for perfil in perfiles:
            p_pres, p_tarde, p_aus = perfil._calidad

            # Descansos de todos los ciclos del empleado (set de fechas)
            descansos = set(
                DescansoEmpleado.objects
                .filter(horario__empleado=perfil, es_descanso=True)
                .values_list('fecha', flat=True)
            )

            # Permisos aprobados → días cubiertos
            permisos_aprobados = Permiso.objects.filter(
                empleado=perfil, estado='aprobado',
            ).values_list('fecha_inicio', 'fecha_fin')

            # Incapacidades aprobadas → días cubiertos
            incap_aprobadas = Incapacidad.objects.filter(
                empleado=perfil, estado='aprobado',
            ).values_list('fecha_inicio', 'fecha_fin')

            dias_cubiertos = set()
            for fi, ff in list(permisos_aprobados) + list(incap_aprobadas):
                cursor = fi
                while cursor <= ff:
                    dias_cubiertos.add(cursor)
                    cursor += timedelta(days=1)

            for horario in horarios_por_empleado[perfil.pk]:
                cursor = horario.ciclo_inicio
                fin_ciclo = ciclo_fin(horario)

                while cursor <= fin_ciclo and cursor <= hoy:
                    if cursor in descansos:
                        cursor += timedelta(days=1)
                        continue
                    if cursor in dias_cubiertos:
                        cursor += timedelta(days=1)
                        continue

                    # Decidir estado
                    r = random.random()
                    if r < p_pres:
                        estado = 'PRESENTE'
                    elif r < p_pres + p_tarde:
                        estado = 'TARDE'
                    else:
                        estado = 'AUSENTE'

                    # Hora marcada
                    hora_marcada = None
                    if estado == 'PRESENTE':
                        delta = random.randint(-5, 5)
                        hm = (
                            datetime.combine(cursor, horario.hora_entrada)
                            + timedelta(minutes=delta)
                        )
                        hora_marcada = hm.time()
                    elif estado == 'TARDE':
                        delta = random.randint(6, 30)
                        hm = (
                            datetime.combine(cursor, horario.hora_entrada)
                            + timedelta(minutes=delta)
                        )
                        hora_marcada = hm.time()

                    asistencias_nuevas.append(Asistencia(
                        horario=horario,
                        fecha=cursor,
                        estado=estado,
                        hora_marcada=hora_marcada,
                        fecha_registro=timezone.now(),
                    ))

                    cursor += timedelta(days=1)

        Asistencia.objects.bulk_create(asistencias_nuevas, batch_size=500)
        return len(asistencias_nuevas)

    # ============================================================
    # TAREAS
    # ============================================================

    def _crear_tareas(self, perfiles, admin_creador):
        """
        Crea tareas distribuidas en los últimos 4 meses. La mayoría
        finalizadas, algunas pendientes, y suficientes vencidas para
        que el verificador genere memorandos a quien corresponda.
        """
        hoy = timezone.localdate()
        fecha_min = hoy - timedelta(days=120)
        tareas = []

        for perfil in perfiles:
            n_tareas = random.randint(8, 15)
            for _ in range(n_tareas):
                titulo, descripcion = random.choice(TAREAS_PANADERIA)
                fecha_limite = self._fecha_aleatoria(fecha_min, hoy + timedelta(days=15))

                # Estado según la relación con hoy
                if fecha_limite >= hoy:
                    # Futuro o presente: pendiente o en progreso
                    estado = random.choices(
                        [EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO],
                        weights=[0.6, 0.4],
                    )[0]
                else:
                    # Pasado: mayormente finalizada, algunas vencidas
                    estado = random.choices(
                        [EstadoTarea.FINALIZADA, EstadoTarea.PENDIENTE],
                        weights=[0.75, 0.25],
                    )[0]

                # Hora límite dentro del turno del empleado
                # (aproximado: 9 AM para MANANA, 15 PM para TARDE, 12 PM para FIJO)
                hora_limite = time(random.randint(7, 16), 0)

                tarea = Task(
                    empleado=perfil,
                    creador=admin_creador,
                    ultimo_cambio_por=admin_creador,
                    titulo=titulo,
                    descripcion=descripcion,
                    area=random.choice(Area.values),
                    prioridad=random.choice(Prioridad.values),
                    estado=estado,
                    fecha_limite=fecha_limite,
                    hora_limite=hora_limite,
                    fecha_finalizacion=(
                        timezone.now() if estado == EstadoTarea.FINALIZADA else None
                    ),
                )
                tareas.append(tarea)

        # bulk_create para saltar full_clean() (que valida hora dentro del horario)
        Task.objects.bulk_create(tareas, batch_size=200)
        return len(tareas)

    # ============================================================
    # MEMORANDOS
    # ============================================================

    def _generar_memorandos(self, perfiles):
        """
        Corre los servicios de memorandos para cada empleado. Al ser
        idempotentes, se puede ejecutar sin duplicar.
        """
        total = 0
        for perfil in perfiles:
            try:
                memo_t = verificar_y_generar_memorando(perfil)
                if memo_t:
                    total += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(
                    f'  ⚠ Error en memo tareas para {perfil.pk}: {e}'
                ))

            try:
                res = verificar_memorandos_asistencia(perfil)
                if res.get('tardanzas'):
                    total += 1
                if res.get('ausencias'):
                    total += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(
                    f'  ⚠ Error en memo asistencia para {perfil.pk}: {e}'
                ))

        self.stdout.write(self.style.SUCCESS(f'  ✓ {total} memorandos generados'))

    # ============================================================
    # UTILIDADES
    # ============================================================

    def _fecha_aleatoria(self, desde, hasta):
        """Fecha aleatoria entre [desde, hasta]."""
        delta = (hasta - desde).days
        if delta <= 0:
            return desde
        return desde + timedelta(days=random.randint(0, delta))