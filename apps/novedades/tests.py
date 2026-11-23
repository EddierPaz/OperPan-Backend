from datetime import date, time, timedelta

from django.test import TestCase
from django.urls import reverse

from apps.asistencia.models import DescansoEmpleado, Horario
from apps.novedades.forms import SolicitudCrearForm
from apps.usuarios.models import PerfilEmpleado, User
from .models import Certificado, Incapacidad, Solicitud


class NovedadesEdicionTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='empleado_prueba',
            password='clave-de-prueba',
            rol='empleado',
            estado_cuenta=User.EstadoCuenta.ACTIVA,
            debe_cambiar_password=False,
        )
        self.empleado = PerfilEmpleado.objects.create(
            user=self.user,
            primer_nombre='Ana',
            primer_apellido='Prueba',
            tipo_documento='CC',
            numero_documento='12345678',
            telefono='3001234567',
            correo='ana.prueba@example.com',
            ciudad='Bogotá',
        )
        self.client.force_login(self.user)

    def crear_horario_para_cambio(self):
        hoy = date.today()
        inicio_ciclo = (hoy.replace(day=28) + timedelta(days=4)).replace(day=1)
        horario = Horario.objects.create(
            empleado=self.empleado,
            turno='MANANA',
            hora_entrada=time(5, 0),
            hora_salida=time(13, 0),
            fecha_inicio=inicio_ciclo,
            ciclo_inicio=inicio_ciclo,
        )
        return horario, inicio_ciclo + timedelta(days=5)

    def crear_formulario_cambio(self, horario_nuevo, fecha):
        return SolicitudCrearForm(
            data={
                'tipo': 'cambio_turno',
                'fecha_inicio': fecha.isoformat(),
                'fecha_fin': fecha.isoformat(),
                'justificacion': 'Cambio por una necesidad personal',
                'nuevo_horario': horario_nuevo,
            },
            empleado=self.empleado,
        )

    def test_editar_solicitud_actualiza_justificacion_y_fechas(self):
        inicio = date.today() + timedelta(days=8)
        solicitud = Solicitud.objects.create(
            empleado=self.empleado,
            tipo='otro',
            fecha_inicio=inicio,
            fecha_fin=inicio + timedelta(days=1),
            justificacion='Motivo anterior',
        )
        nuevo_inicio = inicio + timedelta(days=2)
        nuevo_fin = nuevo_inicio + timedelta(days=2)

        response = self.client.post(
            reverse('novedades:editar_solicitud', args=[solicitud.pk]),
            {
                'fecha_inicio': nuevo_inicio.isoformat(),
                'fecha_fin': nuevo_fin.isoformat(),
                'justificacion': 'Motivo actualizado',
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')
        solicitud.refresh_from_db()
        self.assertEqual(solicitud.fecha_inicio, nuevo_inicio)
        self.assertEqual(solicitud.fecha_fin, nuevo_fin)
        self.assertEqual(solicitud.justificacion, 'Motivo actualizado')

    def test_editar_certificado_actualiza_campos_visibles(self):
        certificado = Certificado.objects.create(
            empleado=self.empleado,
            tipo='laboral',
            proposito='Trámite anterior',
            dirigido_a='Entidad anterior',
            periodo='2025',
        )

        response = self.client.post(
            reverse('novedades:editar_certificado', args=[certificado.pk]),
            {
                'tipo': 'ingresos',
                'proposito': 'Solicitud de crédito',
                'dirigido_a': 'Banco',
                'periodo': '2026',
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')
        certificado.refresh_from_db()
        self.assertEqual(certificado.tipo, 'ingresos')
        self.assertEqual(certificado.proposito, 'Solicitud de crédito')
        self.assertEqual(certificado.dirigido_a, 'Banco')
        self.assertEqual(certificado.periodo, '2026')

    def test_pagina_de_novedades_renderiza_campos_de_edicion(self):
        response = self.client.get(reverse('novedades:novedades_empleado'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'id="editarMotivo"')
        self.assertContains(response, 'id="editarNuevoHorario"')
        self.assertContains(response, 'id="editarCertificadoTipo"')

    def test_crear_novedad_ajax_devuelve_errores_sin_crear_registro(self):
        response = self.client.post(
            reverse('novedades:novedades_empleado'),
            {
                'tipo_solicitud': 'solicitud',
                'solicitud-tipo': 'otro',
                'solicitud-fecha_inicio': '',
                'solicitud-fecha_fin': '',
                'solicitud-justificacion': '',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['status'], 'error')
        self.assertTrue(response.json()['errores'])
        self.assertFalse(Solicitud.objects.filter(empleado=self.empleado).exists())

    def test_crear_novedad_ajax_devuelve_exito_y_guarda_el_registro(self):
        fecha_inicio = date.today() + timedelta(days=8)
        response = self.client.post(
            reverse('novedades:novedades_empleado'),
            {
                'tipo_solicitud': 'solicitud',
                'solicitud-tipo': 'otro',
                'solicitud-fecha_inicio': fecha_inicio.isoformat(),
                'solicitud-fecha_fin': fecha_inicio.isoformat(),
                'solicitud-justificacion': 'Motivo de prueba',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')
        self.assertTrue(Solicitud.objects.filter(empleado=self.empleado).exists())

    def test_formulario_invalido_reabre_modal_y_conserva_los_datos(self):
        fecha_inicio = date.today() + timedelta(days=8)
        response = self.client.post(
            reverse('novedades:novedades_empleado'),
            {
                'tipo_solicitud': 'solicitud',
                'solicitud-tipo': 'otro',
                'solicitud-fecha_inicio': fecha_inicio.isoformat(),
                'solicitud-fecha_fin': '',
                'solicitud-justificacion': 'Motivo que debe conservarse',
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.context['reabrir_modal_novedad'])
        self.assertContains(response, 'data-reabrir="true"')
        self.assertContains(response, fecha_inicio.isoformat())
        self.assertContains(response, 'Motivo que debe conservarse')
        self.assertContains(response, 'No se pudo enviar la novedad')
        self.assertNotContains(response, 'alertaErrorNovedad')

    def test_editar_solicitud_devuelve_error_de_validacion_claro(self):
        inicio = date.today() + timedelta(days=8)
        solicitud = Solicitud.objects.create(
            empleado=self.empleado,
            tipo='otro',
            fecha_inicio=inicio,
            fecha_fin=inicio,
            justificacion='Motivo anterior',
        )

        response = self.client.post(
            reverse('novedades:editar_solicitud', args=[solicitud.pk]),
            {
                'fecha_inicio': inicio.isoformat(),
                'fecha_fin': inicio.isoformat(),
                'justificacion': '',
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('justificación', response.json()['error'].lower())
        solicitud.refresh_from_db()
        self.assertEqual(solicitud.justificacion, 'Motivo anterior')

    def test_cambio_turno_debe_ser_distinto_al_turno_asignado(self):
        _, fecha = self.crear_horario_para_cambio()

        mismo_turno = self.crear_formulario_cambio('MANANA', fecha)
        self.assertFalse(mismo_turno.is_valid())
        self.assertIn('turno contrario', str(mismo_turno.errors['nuevo_horario']))

        otro_turno = self.crear_formulario_cambio('TARDE', fecha)
        self.assertTrue(otro_turno.is_valid(), otro_turno.errors)

    def test_cambio_turno_no_se_permite_en_descanso_incapacidad_ni_otra_solicitud(self):
        horario, fecha = self.crear_horario_para_cambio()
        DescansoEmpleado.objects.create(horario=horario, fecha=fecha)
        Incapacidad.objects.create(
            empleado=self.empleado,
            fecha_inicio=fecha,
            fecha_fin=fecha,
            estado='pendiente',
        )
        Solicitud.objects.create(
            empleado=self.empleado,
            tipo='otro',
            fecha_inicio=fecha,
            fecha_fin=fecha,
            justificacion='Otra solicitud',
            estado='aprobado',
        )

        form = self.crear_formulario_cambio('TARDE', fecha)

        self.assertFalse(form.is_valid())
        errores = str(form.errors['fecha_inicio']).lower()
        self.assertIn('descanso', errores)
        self.assertIn('incapacidad', errores)
        self.assertIn('otra solicitud', errores)
