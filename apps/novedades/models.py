from django.db import models
from django.utils import timezone
from apps.usuarios.models import PerfilEmpleado, User

class Permiso(models.Model):
    TIPO_CHOICES = (
        ('personal', 'Personal'),
        ('cambio_turno', 'Cambio de turno'),
        ('medico', 'Médico'),
        ('familiar', 'Familiar'),          # <-- NUEVO
        ('vacaciones', 'Vacaciones'),
        ('academico', 'Académico'),
        ('calamidad', 'Calamidad'),
        ('otro', 'Otro'),
    )
    ESTADO_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    )

    empleado = models.ForeignKey(PerfilEmpleado, on_delete=models.CASCADE, related_name='permisos')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    justificacion = models.TextField()
    nuevo_horario = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    decision_fecha = models.DateTimeField(null=True, blank=True)
    decision_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='permisos_decididos')
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
    titulo = models.CharField(max_length=100)
    descripcion = models.TextField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    archivo = models.FileField(upload_to='incapacidades/', blank=True, null=True)
    entidad_emisora = models.CharField(max_length=100, blank=True, null=True)
    numero_incapacidad = models.CharField(max_length=50, blank=True, null=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    decision_fecha = models.DateTimeField(null=True, blank=True)
    decision_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='incapacidades_decididos')
    motivo_rechazo = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.titulo} ({self.fecha_inicio})"


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

    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')  # <-- NUEVO
    fecha_solicitud = models.DateTimeField(auto_now_add=True)   # <-- RENOMBRADO (antes fecha_emision)
    fecha_emision = models.DateTimeField(null=True, blank=True)  # <-- ahora se llena SOLO al aprobar
    decision_fecha = models.DateTimeField(null=True, blank=True)  # <-- NUEVO
    decision_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='certificados_decididos')  # <-- NUEVO
    motivo_rechazo = models.TextField(blank=True, null=True)  # <-- NUEVO

    generado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='certificados_generados')
    descargas = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.get_tipo_display()} ({self.estado})"


class Memorando(models.Model):
    TIPO_CHOICES = (
        ('llamado_atencion', 'Llamado de atención'),
        ('amonestacion', 'Amonestación escrita'),
        ('reconocimiento', 'Reconocimiento'),
        ('informacion', 'Información general'),
        ('advertencia', 'Advertencia'),
        ('cambio_funciones', 'Cambio de funciones'),
        ('otro', 'Otro'),
    )

    ESTADO_CHOICES = (
        ('emitido', 'Emitido'),
        ('anulado', 'Anulado'),
    )

    empleado = models.ForeignKey(
        PerfilEmpleado,
        on_delete=models.CASCADE,
        related_name='memorandos'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    asunto = models.CharField(max_length=200)
    contenido = models.TextField()
    consecutivo = models.CharField(max_length=20, unique=True, blank=True, editable=False)
    fecha_emision = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='emitido')
    generado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='memorandos_generados'
    )
    archivo_pdf = models.FileField(
        upload_to='memorandos/',
        blank=True,
        null=True
    )
    descargas = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.consecutivo:
            year = timezone.now().year
            # Obtener el último consecutivo del año actual
            last = Memorando.objects.filter(
                consecutivo__startswith=f'MEM-{year}-'
            ).order_by('-consecutivo').first()
            if last:
                # Extraer el número del consecutivo
                try:
                    num = int(last.consecutivo.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    num = 1
            else:
                num = 1
            self.consecutivo = f'MEM-{year}-{num:03d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.consecutivo} - {self.empleado.nombre_completo()} ({self.get_tipo_display()})"