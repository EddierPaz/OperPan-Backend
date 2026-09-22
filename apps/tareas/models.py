from datetime import date
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.usuarios.models import PerfilEmpleado, User
from datetime import date, timedelta


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
    hora_limite = models.TimeField(blank=True, null=True)  # ⚠️ Cambiar a null=False en la migración
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_finalizacion = models.DateTimeField(null=True, blank=True)

    evidencia = models.FileField(
        upload_to='tareas/evidencias/%Y/%m/',
        blank=True,
        null=True,
        help_text='Foto o documento opcional como evidencia de finalización'
    )

    # ------------------------------------------------------------------
    # NUEVO: vínculo al memorando generado automáticamente.
    # ------------------------------------------------------------------
    memorando_generado = models.ForeignKey(
        'memorandos.Memorando',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tareas_origen',
        help_text='Memorando generado automáticamente por acumulación de vencidas'
    )

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.titulo} ({self.fecha_limite})"

    def clean(self):
        """Validación a nivel de modelo"""
        from apps.asistencia.models import Horario

        # 1. Validar que la hora_limite sea obligatoria
        if not self.hora_limite:
            raise ValidationError({
                'hora_limite': 'La hora límite es obligatoria. Debes especificar una hora.'
            })

        # 2. Validar que la hora_limite esté dentro del rango del horario del empleado
        horario_activo = Horario.objects.filter(
            empleado=self.empleado,
            estado=True
        ).order_by('-fecha_creacion').first()

        if horario_activo and horario_activo.hora_entrada and horario_activo.hora_salida:
            hora_entrada = horario_activo.hora_entrada
            hora_salida = horario_activo.hora_salida

            if not (hora_entrada <= self.hora_limite <= hora_salida):
                raise ValidationError({
                    'hora_limite': f'La hora límite debe estar dentro del rango de la jornada '
                                   f'({hora_entrada.strftime("%H:%M")} - {hora_salida.strftime("%H:%M")}) '
                                   f'del empleado.'
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def esta_vencida(self):
        """True si la fecha/hora límite ya pasó y la tarea no está finalizada."""
        if self.estado == EstadoTarea.FINALIZADA:
            return False
        ahora_local = timezone.localtime(timezone.now())
        hoy = ahora_local.date()
        if self.fecha_limite < hoy:
            return True
        if self.fecha_limite == hoy and self.hora_limite:
            return ahora_local.time() > self.hora_limite
        return False

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

    def reabrir(self, usuario):
        """
        Reabre una tarea previamente finalizada y la devuelve a EN_PROGRESO.

        - Limpia `fecha_finalizacion`.
        - NO borra `evidencia` (se conserva por si el empleado ya había
          subido algo; puede sobreescribirla al volver a finalizar).
        - Usa .update() para no re-ejecutar full_clean() (que valida que
          hora_limite esté dentro del horario actual del empleado).

        Retorna True si se reabrió, False si no estaba finalizada.
        """
        if self.estado != EstadoTarea.FINALIZADA:
            return False

        Task.objects.filter(pk=self.pk).update(
            estado=EstadoTarea.EN_PROGRESO,
            ultimo_cambio_por=usuario,
            fecha_finalizacion=None,
        )
        self.refresh_from_db()
        return True

    def revertir_a_pendiente(self, usuario):
        """
        Revierte una tarea FINALIZADA a PENDIENTE. Útil cuando el empleado
        marcó como terminada una tarea que en realidad no había empezado
        (o que se necesita reiniciar desde cero).

        - Limpia `fecha_finalizacion`.
        - NO borra `evidencia` (mismo criterio que `reabrir`).

        Retorna True si se revirtió, False si no estaba finalizada.
        """
        if self.estado != EstadoTarea.FINALIZADA:
            return False

        Task.objects.filter(pk=self.pk).update(
            estado=EstadoTarea.PENDIENTE,
            ultimo_cambio_por=usuario,
            fecha_finalizacion=None,
        )
        self.refresh_from_db()
        return True

    @property
    def puede_reabrirse(self):
        """
        True si:
            - La tarea está FINALIZADA
            - Y la fecha límite original + DIAS_MARGEN_REAPERTURA
              todavía no ha pasado.

        Pasado el margen, la tarea queda como histórica y no se puede
        reabrir ni revertir. Esto evita que un admin modifique tareas
        muy antiguas, alterando métricas y memorandos ya emitidos.
        """
        from .constants import DIAS_MARGEN_REAPERTURA

        if self.estado != EstadoTarea.FINALIZADA:
            return False

        hoy = timezone.localdate()
        fecha_tope = self.fecha_limite + timedelta(days=DIAS_MARGEN_REAPERTURA)
        return fecha_tope >= hoy