from django.db import models
from django.contrib.auth import get_user_model

# Importamos los modelos de usuarios
from apps.usuarios.models import PerfilEmpleado, User

# User = get_user_model()  # también funciona, pero es mejor usar el import directo

class Permiso(models.Model):
    TIPO_CHOICES = (
        ('personal', 'Permiso personal'),
        ('cambio_turno', 'Cambio de turno'),
        ('medico', 'Cita médica'),
        ('familiar', 'Asunto familiar'),
        ('vacaciones', 'Vacaciones'),
    )
    ESTADO_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    )

    empleado = models.ForeignKey(
        PerfilEmpleado,
        on_delete=models.CASCADE,
        related_name='permisos'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    justificacion = models.TextField()
    nuevo_horario = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    decision_fecha = models.DateTimeField(null=True, blank=True)
    decision_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permisos_decididos'
    )
    motivo_rechazo = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.get_tipo_display()} ({self.fecha_inicio})"


class Incapacidad(models.Model):
    ESTADO_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
    )

    empleado = models.ForeignKey(
        PerfilEmpleado,
        on_delete=models.CASCADE,
        related_name='incapacidades'
    )
    titulo = models.CharField(max_length=100)
    descripcion = models.TextField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    archivo = models.FileField(upload_to='incapacidades/', blank=True, null=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    decision_fecha = models.DateTimeField(null=True, blank=True)
    decision_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incapacidades_decididos'
    )
    motivo_rechazo = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.titulo} ({self.fecha_inicio})"


class Certificado(models.Model):
    TIPO_CHOICES = (
        ('laboral', 'Certificado laboral'),
        ('ingresos', 'Certificado de ingresos'),
        ('antiguedad', 'Certificado de antigüedad'),
    )

    empleado = models.ForeignKey(
        PerfilEmpleado,
        on_delete=models.CASCADE,
        related_name='certificados'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    proposito = models.CharField(max_length=200)
    fecha_emision = models.DateTimeField(auto_now_add=True)
    generado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certificados_generados'
    )
    descargas = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.get_tipo_display()} ({self.fecha_emision.date()})"