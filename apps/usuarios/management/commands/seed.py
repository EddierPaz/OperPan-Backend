import random
from datetime import datetime, timedelta, date
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker

from apps.usuarios.models import User, PerfilEmpleado
from apps.asistencia.models import Horario, DescansoEmpleado, Asistencia
from apps.tareas.models import Task, Turno, Prioridad, EstadoTarea, Area
from apps.novedades.models import Permiso, Incapacidad, Certificado
from apps.memorandos.models import Memorando


class Command(BaseCommand):
    help = 'Puebla la base de datos con datos realistas para OperPan'

    def handle(self, *args, **options):
        # Verificar si ya existen datos suficientes
        if User.objects.filter(rol='admin').exists() and PerfilEmpleado.objects.count() >= 30:
            self.stdout.write(self.style.WARNING('La base de datos ya parece poblada. No se ejecutará el seed.'))
            return

        self.stdout.write(self.style.SUCCESS('Iniciando población de datos...'))

        fake = Faker('es_CO')

        # -------------------- LISTAS DE TEXTO REALISTA --------------------
        # Nombres y apellidos colombianos comunes
        NOMBRES_H = [
            'Juan', 'Carlos', 'Luis', 'Andrés', 'Felipe', 'Jorge', 'Daniel', 'David', 'José', 'Manuel',
            'Pedro', 'Santiago', 'Mateo', 'Sebastián', 'Nicolás', 'Gabriel', 'Camilo', 'Esteban', 'Diego', 'Oscar'
        ]
        NOMBRES_M = [
            'María', 'Laura', 'Natalia', 'Carolina', 'Diana', 'Sofía', 'Valentina', 'Ana', 'Paula', 'Camila',
            'Isabella', 'Lucía', 'Daniela', 'Angélica', 'Lina', 'Adriana', 'Marcela', 'Cristina', 'Lorena', 'Viviana'
        ]
        APELLIDOS = [
            'García', 'Martínez', 'Pérez', 'Rodríguez', 'Gómez', 'Herrera', 'Rojas', 'González', 'Díaz', 'López',
            'Ramírez', 'Torres', 'Castillo', 'Cruz', 'Morales', 'Ortiz', 'Reyes', 'Mendoza', 'Álvarez', 'Castro',
            'Vargas', 'Flores', 'Guzmán', 'Molina', 'Jiménez', 'Ramos', 'Romero', 'Gil', 'Pineda', 'Bernal'
        ]

        # Ciudades colombianas
        CIUDADES = [
            'Medellín', 'Envigado', 'Itagüí', 'Sabaneta', 'Bello', 'Rionegro', 'La Estrella', 'Caldas',
            'Bogotá', 'Cali', 'Barranquilla', 'Cartagena', 'Santa Marta', 'Bucaramanga', 'Pereira', 'Manizales'
        ]

        # Tareas de panadería
        TAREAS_PANADERIA = [
            ('Preparar masa madre', 'Elaborar la masa madre diaria para panadería.'),
            ('Preparar buñuelos', 'Amasar y freír buñuelos para el mostrador.'),
            ('Hornear pan francés', 'Hornear la tanda de pan francés de la mañana.'),
            ('Atender mostrador', 'Atención al cliente en el punto de venta.'),
            ('Organizar vitrinas', 'Reordenar y limpiar las vitrinas de exhibición.'),
            ('Limpiar horno', 'Limpieza profunda del horno de panadería.'),
            ('Inventario de harina', 'Realizar conteo de bultos de harina en bodega.'),
            ('Preparar café', 'Preparar café y bebidas calientes para servicio.'),
            ('Empacar pedidos', 'Empacar pedidos para domicilios y recogidas.'),
            ('Control de desperdicios', 'Registrar y gestionar los desperdicios de producción.'),
            ('Amasar pan de queso', 'Preparar y hornear pan de queso para venta.'),
            ('Preparar pasteles', 'Elaborar pasteles y tortas para eventos.'),
            ('Decorar tortas', 'Realizar decoración de tortas con crema y fruta.'),
            ('Mantener limpieza de área', 'Limpieza general del área de producción.'),
            ('Reabastecer insumos', 'Reponer insumos en el área de trabajo.'),
            ('Elaborar pan de yuca', 'Preparar pan de yuca para exhibición.'),
            ('Preparar almojábanas', 'Elaborar almojábanas para venta diaria.'),
            ('Hacer arepas de choclo', 'Preparar arepas de choclo para el desayuno.'),
            ('Revisar caducidad de productos', 'Verificar fechas de vencimiento en vitrina.'),
            ('Atender pedidos por teléfono', 'Tomar y gestionar pedidos telefónicos.'),
            ('Organizar bodega', 'Ordenar y limpiar la bodega de insumos.'),
            ('Recibir mercancía', 'Recepción y verificación de mercancía entrante.'),
            ('Facturar ventas', 'Realizar facturación de ventas del día.'),
            ('Preparar sándwiches', 'Preparar sándwiches para servicio de cafetería.'),
            ('Cocinar empanadas', 'Elaborar empanadas para la vitrina.')
        ]

        # Justificaciones de permisos
        JUSTIFICACIONES_PERMISOS = [
            "Cita médica con especialista.",
            "Control odontológico.",
            "Diligencia personal impostergable.",
            "Acompañamiento a familiar en consulta médica.",
            "Trámite bancario.",
            "Renovación de documentos.",
            "Asistencia a ceremonia de graduación.",
            "Calamidad familiar.",
            "Asistencia a audiencia judicial.",
            "Reunión escolar de hijo menor.",
            "Trámite notarial.",
            "Renovación de licencia de conducción.",
            "Matrícula universitaria.",
            "Cita psicológica.",
            "Atención en EPS.",
            "Entrega de documentos en entidad pública."
        ]

        # Enfermedades y descripciones para incapacidades
        ENFERMEDADES = [
            ("Gripe", "Reposo por infección respiratoria aguda."),
            ("Migraña", "Incapacidad por cefalea severa."),
            ("Gastroenteritis", "Reposo por cuadro gastrointestinal."),
            ("Lumbalgia", "Dolor lumbar por esfuerzo físico."),
            ("Conjuntivitis", "Infección ocular, reposo y tratamiento."),
            ("COVID-19", "Infección por coronavirus, aislamiento y reposo."),
            ("Infección respiratoria", "Reposo por infección de vías respiratorias."),
            ("Gastritis", "Cuadro de gastritis, reposo y dieta."),
            ("Amigdalitis", "Infección de amígdalas, reposo."),
            ("Faringitis", "Inflamación de faringe, reposo."),
            ("Tendinitis", "Inflamación de tendón por esfuerzo repetitivo."),
            ("Sinusitis", "Infección de senos paranasales, reposo."),
            ("Cefalea tensional", "Dolor de cabeza por estrés, reposo."),
            ("Bronquitis", "Inflamación bronquial, reposo."),
            ("Lesión muscular", "Reposo por lesión muscular en extremidad inferior.")
        ]

        # Propósitos para certificados
        PROPOSITOS_CERTIFICADOS = [
            "Presentación ante entidad bancaria.",
            "Solicitud de crédito.",
            "Actualización de hoja de vida.",
            "Presentación ante universidad.",
            "Trámite de vivienda.",
            "Caja de compensación familiar.",
            "Subsidio familiar.",
            "Proceso de contratación.",
            "Solicitud de visa.",
            "Presentación ante EPS.",
            "Justificación de ausencia laboral.",
            "Trámite de pensión.",
            "Beneficio de caja de compensación."
        ]

        # Asuntos para memorandos
        ASUNTOS_MEMORANDOS = [
            ("Llegadas tardías reiteradas", "Llamado de atención por incumplimiento del horario de ingreso."),
            ("Incumplimiento del uniforme", "Recordatorio del uso obligatorio del uniforme completo."),
            ("Reconocimiento por excelente desempeño", "Felicitación por el compromiso y resultados obtenidos."),
            ("Incumplimiento de funciones", "Advertencia por tareas no realizadas según lo asignado."),
            ("Uso inadecuado del celular", "Prohibición del uso de dispositivos móviles durante la jornada laboral."),
            ("Felicitación por atención al cliente", "Reconocimiento por la excelente atención brindada a los clientes."),
            ("Cambio temporal de funciones", "Notificación de cambio de actividades por necesidades del negocio."),
            ("Seguimiento disciplinario", "Inicio de seguimiento disciplinario por faltas repetidas."),
            ("Llamado preventivo", "Prevención sobre el cumplimiento de las normas internas."),
            ("Reconocimiento por compromiso laboral", "Agradecimiento por la dedicación y compromiso demostrado."),
            ("Incumplimiento de protocolos de higiene", "Advertencia por no seguir las normas de aseo y desinfección."),
            ("Felicitación por trabajo en equipo", "Reconocimiento al equipo por lograr los objetivos del mes.")
        ]

        # Contenido adicional para memorandos (se puede personalizar según asunto)
        CONTENIDOS_MEMORANDOS = {
            "Llegadas tardías reiteradas": "Durante las últimas semanas se ha evidenciado incumplimiento reiterado en el horario de ingreso. Se solicita mejorar la puntualidad y dar cumplimiento al reglamento interno.",
            "Incumplimiento del uniforme": "Se ha observado que algunos empleados no utilizan el uniforme completo. Se recuerda que es obligatorio el uso de la camisa, pantalón y zapatos de seguridad.",
            "Reconocimiento por excelente desempeño": "Se reconoce el excelente desempeño demostrado durante el último mes y el compromiso permanente con las labores asignadas.",
            "Incumplimiento de funciones": "Se ha detectado que no se han cumplido a cabalidad las funciones asignadas. Se solicita ajustar el desempeño a lo establecido en el contrato.",
            "Uso inadecuado del celular": "Se prohíbe el uso de celular durante la jornada laboral, excepto para emergencias. Se solicita cumplir con esta norma.",
            "Felicitación por atención al cliente": "Se reconoce la excelente atención brindada a los clientes, reflejada en los comentarios positivos recibidos.",
            "Cambio temporal de funciones": "Por necesidades del servicio, se le asigna temporalmente nuevas funciones en el área de mostrador durante las próximas dos semanas.",
            "Seguimiento disciplinario": "Se inicia proceso de seguimiento disciplinario por faltas recurrentes al reglamento. Se espera mejora inmediata.",
            "Llamado preventivo": "Se hace un llamado preventivo para reforzar el cumplimiento de las normas de convivencia y seguridad en el trabajo.",
            "Reconocimiento por compromiso laboral": "Se agradece el compromiso y dedicación demostrados en la ejecución de las tareas diarias.",
            "Incumplimiento de protocolos de higiene": "Se ha verificado que no se siguen los protocolos de limpieza y desinfección establecidos. Se exige su cumplimiento.",
            "Felicitación por trabajo en equipo": "Se felicita al equipo por su colaboración y esfuerzo conjunto para alcanzar las metas propuestas."
        }

        # Tipos de memorando según asunto
        TIPO_MEMORANDO_POR_ASUNTO = {
            "Llegadas tardías reiteradas": "llamado_atencion",
            "Incumplimiento del uniforme": "advertencia",
            "Reconocimiento por excelente desempeño": "reconocimiento",
            "Incumplimiento de funciones": "llamado_atencion",
            "Uso inadecuado del celular": "advertencia",
            "Felicitación por atención al cliente": "reconocimiento",
            "Cambio temporal de funciones": "cambio_funciones",
            "Seguimiento disciplinario": "amonestacion",
            "Llamado preventivo": "informacion",
            "Reconocimiento por compromiso laboral": "reconocimiento",
            "Incumplimiento de protocolos de higiene": "advertencia",
            "Felicitación por trabajo en equipo": "reconocimiento"
        }

        # -------------------- FUNCIONES AUXILIARES --------------------
        def generar_nombre_completo(genero):
            """Genera nombre y apellido sin género inconsistente."""
            if genero == 'M':
                nombre = random.choice(NOMBRES_H)
            else:
                nombre = random.choice(NOMBRES_M)
            apellido1 = random.choice(APELLIDOS)
            apellido2 = random.choice(APELLIDOS)
            return nombre, apellido1, apellido2

        def generar_username(nombre, apellido1, apellido2, existing_usernames):
            """Genera username sin números, combinando nombre y apellidos."""
            base = (nombre + apellido1).lower()
            if base not in existing_usernames:
                existing_usernames.add(base)
                return base
            base2 = (nombre + apellido2).lower()
            if base2 not in existing_usernames:
                existing_usernames.add(base2)
                return base2
            # Si ambos ya existen, añadir inicial del segundo apellido
            base3 = (nombre + apellido1 + apellido2[0]).lower()
            if base3 not in existing_usernames:
                existing_usernames.add(base3)
                return base3
            # Último recurso: añadir una letra aleatoria
            for _ in range(10):
                candidato = base + random.choice('abcdefghijklmnopqrstuvwxyz')
                if candidato not in existing_usernames:
                    existing_usernames.add(candidato)
                    return candidato
            return base  # fallback

        def generar_correo(nombre, apellido1, apellido2):
            """Genera correo sin números."""
            return f"{nombre.lower()}.{apellido1.lower()}@operpan.com"

        # -------------------- INICIO DE TRANSACCIÓN --------------------
        with transaction.atomic():
            # 1. Crear usuario administrador
            admin_user, created = User.objects.get_or_create(
                username='admin',
                defaults={
                    'email': 'admin@operpan.com',
                    'rol': 'admin',
                    'is_staff': True,
                    'is_superuser': True
                }
            )
            if created:
                admin_user.set_password('1234')
                admin_user.save()
                self.stdout.write(self.style.SUCCESS('Usuario administrador creado.'))

            # 2. Crear 30 empleados
            empleados = []
            existing_usernames = {'admin'}  # para evitar duplicados
            for i in range(30):
                # Determinar género aleatorio
                genero = random.choice(['M', 'F'])
                nombre, apellido1, apellido2 = generar_nombre_completo(genero)
                username = generar_username(nombre, apellido1, apellido2, existing_usernames)
                email = generar_correo(nombre, apellido1, apellido2)

                user, created = User.objects.get_or_create(
                    username=username,
                    defaults={
                        'email': email,
                        'rol': 'empleado',
                        'first_name': nombre,
                        'last_name': f"{apellido1} {apellido2}".strip()
                    }
                )
                if created:
                    user.set_password('1234')
                    user.save()
                else:
                    # Si ya existe, ajustamos el username (no debería pasar)
                    pass

                # Datos personales
                tipo_doc = random.choice(['CC', 'CE', 'TI', 'PA'])
                numero_doc = fake.unique.random_number(digits=10)
                fecha_nac = fake.date_of_birth(minimum_age=18, maximum_age=65)
                estado_civil = random.choice(['soltero', 'casado', 'union_libre', 'divorciado', 'viudo'])
                tipo_sangre = random.choice(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
                telefono = fake.phone_number()
                ciudad = random.choice(CIUDADES)
                direccion = fake.street_address()
                contacto_emergencia = fake.name()
                parentesco_emergencia = random.choice(['Padre', 'Madre', 'Hermano', 'Cónyuge', 'Tío', 'Amigo'])
                telefono_emergencia = fake.phone_number()
                cargo = random.choice(['mesero', 'cajero', 'pastelero', 'panadero', 'cocina', 'buñuelero', 'greca'])
                fecha_ingreso = fake.date_between(start_date='-5y', end_date='-1m')
                eps = random.choice(['Sura', 'Colsanitas', 'Salud Total', 'Nueva EPS', 'Sanitas', 'Compensar', 'Cafam'])
                arl = random.choice(['Sura ARL', 'Colpatria ARL', 'Positiva ARL', 'Liberty ARL', 'Mapfre ARL'])
                fondo_pension = random.choice(['Porvenir', 'Protección', 'Colfondos', 'Skandia', 'BBVA'])
                estado = random.choices(['activo', 'suspendido', 'retirado'], weights=[0.85, 0.10, 0.05])[0]

                # Crear perfil (usando get_or_create)
                perfil, created = PerfilEmpleado.objects.get_or_create(
                    user=user,
                    defaults={
                        'primer_nombre': nombre,
                        'segundo_nombre': '',
                        'primer_apellido': apellido1,
                        'segundo_apellido': apellido2,
                        'tipo_documento': tipo_doc,
                        'numero_documento': numero_doc,
                        'fecha_nacimiento': fecha_nac,
                        'genero': genero,
                        'estado_civil': estado_civil,
                        'tipo_sangre': tipo_sangre,
                        'telefono': telefono,
                        'correo': email,
                        'ciudad': ciudad,
                        'direccion': direccion,
                        'contacto_emergencia': contacto_emergencia,
                        'parentesco_emergencia': parentesco_emergencia,
                        'telefono_emergencia': telefono_emergencia,
                        'cargo': cargo,
                        'fecha_ingreso': fecha_ingreso,
                        'eps': eps,
                        'arl': arl,
                        'fondo_pension': fondo_pension,
                        'estado': estado,
                    }
                )
                if created:
                    empleados.append(perfil)
                    self.stdout.write(f'Empleado creado: {perfil.nombre_completo()} - {cargo}')

            self.stdout.write(self.style.SUCCESS(f'{len(empleados)} empleados creados.'))

            # 3. Horarios y asistencias
            hoy = timezone.now().date()
            dias_atras = 30

            for empleado in empleados:
                # Crear horario
                turno = random.choice(['MANANA', 'TARDE', 'FIJO'])
                if turno == 'MANANA':
                    hora_entrada = datetime.strptime('06:00', '%H:%M').time()
                    hora_salida = datetime.strptime('14:00', '%H:%M').time()
                elif turno == 'TARDE':
                    hora_entrada = datetime.strptime('14:00', '%H:%M').time()
                    hora_salida = datetime.strptime('22:00', '%H:%M').time()
                else:  # FIJO
                    hora_entrada = datetime.strptime('07:00', '%H:%M').time()
                    hora_salida = datetime.strptime('17:00', '%H:%M').time()

                horario, created = Horario.objects.get_or_create(
                    empleado=empleado,
                    defaults={
                        'turno': turno,
                        'hora_entrada': hora_entrada,
                        'hora_salida': hora_salida,
                        'estado': True
                    }
                )

                # Descansos: domingos y algunos miércoles
                for delta in range(dias_atras):
                    fecha = hoy - timedelta(days=delta)
                    if fecha.weekday() == 6 or (fecha.weekday() == 2 and random.random() < 0.3):
                        DescansoEmpleado.objects.get_or_create(
                            horario=horario,
                            fecha=fecha,
                            defaults={'es_descanso': True}
                        )

                # Asistencias para los últimos 30 días (excepto descansos)
                dias_descanso = DescansoEmpleado.objects.filter(horario=horario, fecha__gte=hoy-timedelta(days=dias_atras)).values_list('fecha', flat=True)
                for delta in range(dias_atras):
                    fecha = hoy - timedelta(days=delta)
                    if fecha in dias_descanso:
                        continue

                    # Determinar estado
                    rand = random.random()
                    if rand < 0.90:
                        estado = 'PRESENTE'
                    elif rand < 0.97:
                        estado = 'TARDE'
                    else:
                        estado = 'AUSENTE'

                    hora_marcada = None
                    if estado in ['PRESENTE', 'TARDE']:
                        entrada_min = hora_entrada.hour * 60 + hora_entrada.minute
                        salida_min = hora_salida.hour * 60 + hora_salida.minute
                        if estado == 'TARDE':
                            min_marcada = entrada_min + random.randint(5, 30)
                        else:
                            min_marcada = entrada_min + random.randint(-5, 5)
                        min_marcada = max(entrada_min, min(entrada_min+30, salida_min))
                        hora_marcada = (datetime.min + timedelta(minutes=min_marcada)).time()

                    Asistencia.objects.get_or_create(
                        horario=horario,
                        fecha=fecha,
                        defaults={
                            'estado': estado,
                            'hora_marcada': hora_marcada
                        }
                    )

            self.stdout.write(self.style.SUCCESS('Horarios, descansos y asistencias creados.'))

            # 4. Tareas
            for empleado in empleados:
                num_tareas = random.randint(2, 6)
                tareas_asignadas = random.sample(TAREAS_PANADERIA, min(num_tareas, len(TAREAS_PANADERIA)))
                for titulo, descripcion in tareas_asignadas:
                    area = random.choice(Area.values)
                    turno_asociado = random.choice([None, 'MANANA', 'TARDE', 'FIJO'])
                    prioridad = random.choice(Prioridad.values)
                    estado = random.choices(
                        [EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO, EstadoTarea.FINALIZADA],
                        weights=[0.4, 0.3, 0.3]
                    )[0]
                    fecha_limite = hoy + timedelta(days=random.randint(-5, 15))
                    hora_limite = None
                    if random.choice([True, False]):
                        hora_limite = datetime.strptime(f"{random.randint(8, 20)}:00", '%H:%M').time()

                    Task.objects.create(
                        empleado=empleado,
                        creador=admin_user,
                        ultimo_cambio_por=admin_user,
                        titulo=titulo,
                        descripcion=descripcion,
                        area=area,
                        turno_asociado=turno_asociado,
                        prioridad=prioridad,
                        estado=estado,
                        fecha_limite=fecha_limite,
                        hora_limite=hora_limite,
                        fecha_asignacion=timezone.now() - timedelta(days=random.randint(0, 10)),
                        fecha_actualizacion=timezone.now(),
                        fecha_finalizacion=timezone.now() if estado == EstadoTarea.FINALIZADA else None,
                    )

            self.stdout.write(self.style.SUCCESS('Tareas creadas.'))

            # 5. Permisos (20)
            for _ in range(20):
                empleado = random.choice(empleados)
                tipo = random.choice([c[0] for c in Permiso.TIPO_CHOICES])
                fecha_inicio = hoy + timedelta(days=random.randint(1, 30))
                fecha_fin = fecha_inicio + timedelta(days=random.randint(1, 5))
                justificacion = random.choice(JUSTIFICACIONES_PERMISOS)
                nuevo_horario = random.choice(['06:00-14:00', '14:00-22:00', '07:00-17:00']) if random.choice([True, False]) else ''
                estado = random.choices(
                    ['pendiente', 'aprobado', 'rechazado'],
                    weights=[0.3, 0.5, 0.2]
                )[0]
                decision_fecha = timezone.now() if estado != 'pendiente' else None
                decision_por = admin_user if estado != 'pendiente' else None
                motivo_rechazo = random.choice([
                    "No se ajusta a los requisitos internos.",
                    "Solicitud incompleta.",
                    "No se justificó adecuadamente la ausencia."
                ]) if estado == 'rechazado' else None

                Permiso.objects.create(
                    empleado=empleado,
                    tipo=tipo,
                    fecha_inicio=fecha_inicio,
                    fecha_fin=fecha_fin,
                    justificacion=justificacion,
                    nuevo_horario=nuevo_horario,
                    estado=estado,
                    fecha_solicitud=timezone.now() - timedelta(days=random.randint(0, 15)),
                    decision_fecha=decision_fecha,
                    decision_por=decision_por,
                    motivo_rechazo=motivo_rechazo
                )

            self.stdout.write(self.style.SUCCESS('Permisos creados.'))

            # 6. Incapacidades (10)
            for _ in range(10):
                empleado = random.choice(empleados)
                enfermedad, descripcion = random.choice(ENFERMEDADES)
                fecha_inicio = hoy - timedelta(days=random.randint(0, 60))
                fecha_fin = fecha_inicio + timedelta(days=random.randint(3, 15))
                entidad_emisora = random.choice(['Sura', 'Colsanitas', 'Salud Total', 'Nueva EPS', 'Sanitas', 'Clínica de la Salud', 'Hospital General'])
                numero_incapacidad = fake.unique.random_number(digits=8)
                estado = random.choices(
                    ['pendiente', 'aprobado', 'rechazado'],
                    weights=[0.2, 0.6, 0.2]
                )[0]
                decision_fecha = timezone.now() if estado != 'pendiente' else None
                decision_por = admin_user if estado != 'pendiente' else None
                motivo_rechazo = random.choice([
                    "No se presentó soporte médico suficiente.",
                    "La incapacidad no corresponde al diagnóstico.",
                    "Documentación incompleta."
                ]) if estado == 'rechazado' else None

                Incapacidad.objects.create(
                    empleado=empleado,
                    titulo=enfermedad,
                    descripcion=descripcion,
                    fecha_inicio=fecha_inicio,
                    fecha_fin=fecha_fin,
                    archivo=None,
                    entidad_emisora=entidad_emisora,
                    numero_incapacidad=numero_incapacidad,
                    estado=estado,
                    fecha_solicitud=timezone.now() - timedelta(days=random.randint(0, 30)),
                    decision_fecha=decision_fecha,
                    decision_por=decision_por,
                    motivo_rechazo=motivo_rechazo
                )

            self.stdout.write(self.style.SUCCESS('Incapacidades creadas.'))

            # 7. Certificados (20)
            for _ in range(20):
                empleado = random.choice(empleados)
                tipo = random.choice([c[0] for c in Certificado.TIPO_CHOICES])
                proposito = random.choice(PROPOSITOS_CERTIFICADOS)
                dirigido_a = fake.name() if random.choice([True, False]) else None
                periodo = f"{hoy.year}" if random.choice([True, False]) else None
                estado = random.choices(
                    ['pendiente', 'aprobado', 'rechazado'],
                    weights=[0.3, 0.5, 0.2]
                )[0]
                fecha_emision = timezone.now() if estado == 'aprobado' else None
                decision_fecha = timezone.now() if estado != 'pendiente' else None
                decision_por = admin_user if estado != 'pendiente' else None
                motivo_rechazo = random.choice([
                    "Solicitud incompleta.",
                    "Información inconsistente.",
                    "No se cumplen los requisitos."
                ]) if estado == 'rechazado' else None

                Certificado.objects.create(
                    empleado=empleado,
                    tipo=tipo,
                    proposito=proposito,
                    dirigido_a=dirigido_a,
                    periodo=periodo,
                    estado=estado,
                    fecha_solicitud=timezone.now() - timedelta(days=random.randint(0, 20)),
                    fecha_emision=fecha_emision,
                    decision_fecha=decision_fecha,
                    decision_por=decision_por,
                    motivo_rechazo=motivo_rechazo,
                    generado_por=admin_user if estado == 'aprobado' else None,
                    descargas=random.randint(0, 10) if estado == 'aprobado' else 0
                )

            self.stdout.write(self.style.SUCCESS('Certificados creados.'))

            # 8. Memorandos (15)
            for _ in range(15):
                empleado = random.choice(empleados)
                asunto, _ = random.choice(ASUNTOS_MEMORANDOS)   # <- selección directa desde la lista
                contenido = CONTENIDOS_MEMORANDOS.get(asunto, "Se adjunta el presente memorando para su conocimiento.")
                tipo = TIPO_MEMORANDO_POR_ASUNTO.get(asunto, 'informacion')
                estado = random.choices(['emitido', 'anulado'], weights=[0.9, 0.1])[0]
                generado_por = admin_user if random.choice([True, False]) else None

                memo = Memorando(
                    empleado=empleado,
                    tipo=tipo,
                    asunto=asunto,
                    contenido=contenido,
                    estado=estado,
                    generado_por=generado_por,
                    descargas=random.randint(0, 5)
                )
                memo.save()

            self.stdout.write(self.style.SUCCESS('Memorandos creados.'))

            self.stdout.write(self.style.SUCCESS('¡Base de datos poblada exitosamente!'))