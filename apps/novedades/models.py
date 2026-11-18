from django.db import models
from apps.usuarios.models import PerfilEmpleado, User


class Solicitud(models.Model):
    TIPO_CHOICES = (
        ('vacaciones', 'Vacaciones'),
        ('cambio_turno', 'Cambio de Turno / Horario'),
        ('luto', 'Licencia por Luto'),
        ('maternidad_paternidad', 'Licencia de Maternidad / Paternidad'),
        ('calamidad', 'Calamidad Doméstica / Emergencia Familiar'),
        ('citas_medicas', 'Citas Médicas / Tratamientos'),
        ('escolares', 'Obligaciones Escolares'),
        ('legales', 'Citaciones Legales o Judiciales'),
        ('no_remunerado', 'Permiso por Asuntos Personales (No Remunerado)'),
        ('otro', 'Otro'),
    )
    ESTADO_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    )

    empleado = models.ForeignKey(PerfilEmpleado, on_delete=models.CASCADE, related_name='solicitudes')
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    justificacion = models.TextField(blank=True, null=True) # Ahora permite nulos y vacíos
    nuevo_horario = models.CharField(max_length=100, blank=True, null=True)
    archivo = models.FileField(upload_to='solicitudes/', blank=True, null=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    decision_fecha = models.DateTimeField(null=True, blank=True)
    decision_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitudes_decididos')
    motivo_rechazo = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.get_tipo_display()} ({self.fecha_inicio})"


class Incapacidad(models.Model):
    ESTADO_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    )

    empleado = models.ForeignKey(PerfilEmpleado, on_delete=models.CASCADE, related_name='incapacidades')
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    archivo = models.FileField(upload_to='incapacidades/', blank=True, null=True) # El archivo lo pediremos obligatorio en el form
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    decision_fecha = models.DateTimeField(null=True, blank=True)
    decision_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='incapacidades_decididos')
    motivo_rechazo = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.fecha_inicio} al {self.fecha_fin}"


class Certificado(models.Model):
    TIPO_CHOICES = (
        ('laboral', 'Laboral'),
        ('ingresos', 'Ingresos'),
        ('antiguedad', 'Antigüedad'),
    )
    ESTADO_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    )

    empleado = models.ForeignKey(PerfilEmpleado, on_delete=models.CASCADE, related_name='certificados')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    proposito = models.CharField(max_length=200)
    dirigido_a = models.CharField(max_length=200, blank=True, null=True)
    periodo = models.CharField(max_length=100, blank=True, null=True)
    archivo = models.FileField(upload_to='certificados/', blank=True, null=True)
    salario = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    fecha_retiro = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_emision = models.DateTimeField(null=True, blank=True)
    decision_fecha = models.DateTimeField(null=True, blank=True)
    decision_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='certificados_decididos')
    motivo_rechazo = models.TextField(blank=True, null=True)

    generado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='certificados_generados')
    descargas = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.get_tipo_display()} ({self.estado})"