import calendar
from datetime import date, time, timedelta

from django.test import TestCase
from django.template.loader import render_to_string

from apps.asistencia.models import Horario
from apps.asistencia.services.horario_service import construir_calendario
from apps.novedades.models import Solicitud
from apps.usuarios.models import PerfilEmpleado, User


class CalendarioCambioTurnoTests(TestCase):
    def test_cambio_aprobado_marca_el_dia_sin_convertirlo_en_permiso(self):
        user = User.objects.create_user(
            username='empleado_turno',
            password='clave-de-prueba',
            rol='empleado',
            estado_cuenta=User.EstadoCuenta.ACTIVA,
        )
        empleado = PerfilEmpleado.objects.create(
            user=user,
            primer_nombre='Luis',
            primer_apellido='Prueba',
            tipo_documento='CC',
            numero_documento='87654321',
            telefono='3007654321',
            correo='luis.prueba@example.com',
            ciudad='Bogotá',
        )
        inicio_ciclo = date.today().replace(day=1)
        horario = Horario.objects.create(
            empleado=empleado,
            turno='MANANA',
            hora_entrada=time(5, 0),
            hora_salida=time(13, 0),
            fecha_inicio=inicio_ciclo,
            ciclo_inicio=inicio_ciclo,
        )
        fecha_cambio = inicio_ciclo + timedelta(days=5)
        Solicitud.objects.create(
            empleado=empleado,
            tipo='cambio_turno',
            fecha_inicio=fecha_cambio,
            fecha_fin=fecha_cambio,
            nuevo_horario='TARDE',
            estado='aprobado',
        )

        horario.turno = 'TARDE'
        horario.hora_entrada = time(13, 0)
        horario.hora_salida = time(22, 0)
        calendario = construir_calendario(
            horario,
            fecha_inicio=inicio_ciclo,
            dias=calendar.monthrange(inicio_ciclo.year, inicio_ciclo.month)[1],
            hoy=inicio_ciclo,
        )
        dia_cambio = next(dia for dia in calendario if dia and dia['fecha'] == fecha_cambio)
        dia_base = next(dia for dia in calendario if dia and dia['fecha'] == inicio_ciclo)

        self.assertTrue(dia_cambio['cambio_turno'])
        self.assertEqual(dia_cambio['hora_entrada'], time(13, 0))
        self.assertEqual(dia_cambio['hora_salida'], time(22, 0))
        self.assertNotEqual(dia_cambio['estado'], 'SOLICITUD')
        self.assertFalse(dia_base['cambio_turno'])
        self.assertEqual(dia_base['hora_entrada'], time(5, 0))

        html = render_to_string(
            'empleado/horario/_horario_detalle.html',
            {'horario': horario, 'calendario': calendario},
        )
        self.assertIn('dia-cambio-turno-indicador', html)
        self.assertIn('Cambio de turno · Tarde · 13:00 - 22:00', html)
