from django.db import models
from apps.usuarios.models import PerfilEmpleado, User


# ============================================================
# CHOICES (Enumeraciones)
# ============================================================

class Prioridad(models.TextChoices):
    BAJA = 'BAJA', 'Baja'
    MEDIA = 'MEDIA', 'Media'
    ALTA = 'ALTA', 'Alta'


class EstadoTarea(models.TextChoices):
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    EN_PROGRESO = 'EN_PROGRESO', 'En progreso'
    FINALIZADA = 'FINALIZADA', 'Finalizada'


class Area(models.TextChoices):
    SIN_AREA = 'SIN_AREA', 'Sin área'
    PRODUCCION = 'PRODUCCION', 'Producción'
    MOSTRADOR = 'MOSTRADOR', 'Mostrador'
    LIMPIEZA = 'LIMPIEZA', 'Limpieza'
    REPOSTERIA = 'REPOSTERIA', 'Repostería'
    ASEO = 'ASEO', 'Aseo'
    CAJA = 'CAJA', 'Caja'


class Turno(models.TextChoices):
    MAÑANA = 'MAÑANA', 'Mañana (4am-2pm)'
    TARDE = 'TARDE', 'Tarde (1pm-11pm)'


# ============================================================
# MODELO TASK
# ============================================================

class Task(models.Model):
    """
    Modelo para la gestión de tareas operativas en OperPan.
    """
    # ---- Relaciones ----
    empleado = models.ForeignKey(
        PerfilEmpleado,
        on_delete=models.CASCADE,
        related_name='tareas_asignadas'
    )
    creador = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tareas_creadas'
    )
    ultimo_cambio_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tareas_modificadas'
    )

    # ---- Información principal ----
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()

    # ---- Categorización ----
    area = models.CharField(
        max_length=20,
        choices=Area.choices,
        default=Area.SIN_AREA
    )
    turno_asociado = models.CharField(
        max_length=20,
        choices=Turno.choices,
        blank=True,
        null=True
    )

    # ---- Gestión ----
    prioridad = models.CharField(
        max_length=10,
        choices=Prioridad.choices,
        default=Prioridad.MEDIA
    )
    estado = models.CharField(
        max_length=15,
        choices=EstadoTarea.choices,
        default=EstadoTarea.PENDIENTE
    )

    # ---- Fechas ----
    fecha_limite = models.DateField()
    hora_limite = models.TimeField(blank=True, null=True)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_finalizacion = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.titulo} ({self.fecha_limite})"