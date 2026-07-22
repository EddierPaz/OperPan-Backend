from datetime import date
from django.db import models
from django.utils import timezone
from apps.usuarios.models import PerfilEmpleado, User


# ============================================================
# CHOICES (Enumeraciones)
# ============================================================

class Turno(models.TextChoices):
    MANANA = 'MANANA', 'Mañana'
    TARDE = 'TARDE', 'Tarde'
    FIJO = 'FIJO', 'Fijo'


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


# ============================================================
# MODELO TASK
# ============================================================

class Task(models.Model):
    """
    Modelo para la gestión de tareas operativas en OperPan.
    """
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

    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()

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

    fecha_limite = models.DateField()
    hora_limite = models.TimeField(blank=True, null=True)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_finalizacion = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.titulo} ({self.fecha_limite})"

    @classmethod
    def get_kpis_administrador(cls):
        hoy = date.today()
        qs = cls.objects.all()
        return {
            'total': qs.count(),
            'pendientes': qs.filter(estado=EstadoTarea.PENDIENTE).count(),
            'en_progreso': qs.filter(estado=EstadoTarea.EN_PROGRESO).count(),
            'finalizadas': qs.filter(estado=EstadoTarea.FINALIZADA).count(),
            'vencidas': qs.filter(
                fecha_limite__lt=hoy
            ).exclude(estado=EstadoTarea.FINALIZADA).count(),
        }

    @classmethod
    def get_kpis_empleado(cls, user):
        hoy = date.today()
        qs = cls.objects.filter(empleado__user=user)
        return {
            'total': qs.count(),
            'pendientes': qs.filter(estado=EstadoTarea.PENDIENTE).count(),
            'en_progreso': qs.filter(estado=EstadoTarea.EN_PROGRESO).count(),
            'finalizadas': qs.filter(estado=EstadoTarea.FINALIZADA).count(),
            'vencidas': qs.filter(
                fecha_limite__lt=hoy
            ).exclude(estado=EstadoTarea.FINALIZADA).count(),
        }

    def cambiar_estado(self, nuevo_estado, usuario):
        if nuevo_estado not in dict(EstadoTarea.choices):
            return False

        self.estado = nuevo_estado
        self.ultimo_cambio_por = usuario

        if nuevo_estado == EstadoTarea.FINALIZADA:
            self.fecha_finalizacion = timezone.now()
        else:
            self.fecha_finalizacion = None

        self.save()
        return True