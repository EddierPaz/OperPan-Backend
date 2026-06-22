from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date

User = get_user_model()

# --- Choices (Opciones) ---

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

# --- Modelo Task ---

class Task(models.Model):
    """
    Modelo para la gestión de tareas en OperPan.
    """
    # Campos principales
    titulo = models.CharField(
        max_length=200,
        verbose_name="Título"
    )
    descripcion = models.TextField(
        verbose_name="Descripción"
    )
    
    # Relaciones
    empleado = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tareas_asignadas',
        verbose_name="Empleado"
    )
    
    creador = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='tareas_creadas',
        verbose_name="Creador"
    )
    
    # Categorización
    area = models.CharField(
        max_length=20,
        choices=Area.choices,
        default=Area.SIN_AREA,
        verbose_name="Área"
    )
    
    turno_asociado = models.CharField(
        max_length=20,
        choices=Turno.choices,
        blank=True,
        null=True,
        verbose_name="Turno asociado"
    )
    
    # Prioridad y estado
    prioridad = models.CharField(
        max_length=10,
        choices=Prioridad.choices,
        default=Prioridad.MEDIA,
        verbose_name="Prioridad"
    )
    
    estado = models.CharField(
        max_length=15,
        choices=EstadoTarea.choices,
        default=EstadoTarea.PENDIENTE,
        verbose_name="Estado"
    )
    
    # Fechas
    fecha_limite = models.DateField(
        verbose_name="Fecha límite"
    )
    
    hora_limite = models.TimeField(
        blank=True,
        null=True,
        verbose_name="Hora límite"
    )
    
    fecha_asignacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de asignación"
    )
    
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name="Última actualización"
    )

    # --- Historial de cambios ---
    ultimo_cambio_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='tareas_modificadas',
        verbose_name="Último cambio por"
    )

    class Meta:
        verbose_name = "Tarea"
        verbose_name_plural = "Tareas"
        ordering = ['-prioridad', 'fecha_limite']
        indexes = [
            models.Index(fields=['estado', 'empleado']),
            models.Index(fields=['fecha_limite']),
            models.Index(fields=['empleado', 'estado']),
            models.Index(fields=['prioridad']),
        ]

    def __str__(self):
        """Representación legible de la tarea."""
        nombre_empleado = self.get_nombre_empleado()
        return f"{self.titulo} - {nombre_empleado}"

    # --- Métodos auxiliares ---

    def get_nombre_empleado(self):
        """Obtiene el nombre del empleado de forma segura."""
        if hasattr(self.empleado, 'perfil'):
            return self.empleado.perfil.nombre_completo()
        return self.empleado.username

    # ==========================================
    # PROPIEDADES CALCULADAS (Lógica de negocio)
    # ==========================================

    @property
    def esta_vencida(self):
        """Verifica si la tarea está vencida."""
        if self.estado == EstadoTarea.FINALIZADA:
            return False
        
        hoy = date.today()
        ahora = timezone.now().time()
        
        if self.fecha_limite < hoy:
            return True
        elif self.fecha_limite == hoy and self.hora_limite:
            return ahora > self.hora_limite
        return False

    @property
    def estado_visual(self):
        """Retorna el estado a mostrar en la interfaz."""
        if self.esta_vencida:
            return 'VENCIDA'
        return self.estado

    @property
    def prioridad_color(self):
        """Retorna el color correspondiente a la prioridad."""
        colores = {
            Prioridad.ALTA: 'red',
            Prioridad.MEDIA: 'yellow',
            Prioridad.BAJA: 'gray',
        }
        return colores.get(self.prioridad, 'gray')

    @property
    def es_reciente(self):
        """Verifica si la tarea fue creada en los últimos 7 días."""
        dias = (timezone.now().date() - self.fecha_asignacion.date()).days
        return dias <= 7

    @property
    def dias_restantes(self):
        """Calcula los días restantes hasta la fecha límite."""
        if self.esta_vencida:
            return 0
        dias = (self.fecha_limite - date.today()).days
        return max(0, dias)

    # ==========================================
    # MÉTODOS DE CAMBIO DE ESTADO (Lógica de negocio)
    # ==========================================

    def cambiar_estado(self, nuevo_estado, usuario):
        """Cambia el estado de la tarea y registra quién lo hizo."""
        estados_validos = [
            EstadoTarea.PENDIENTE,
            EstadoTarea.EN_PROGRESO,
            EstadoTarea.FINALIZADA
        ]
        
        if nuevo_estado not in estados_validos:
            return False
        
        # Si ya está finalizada
        if self.estado == EstadoTarea.FINALIZADA:
            # Solo admin puede reabrir una tarea finalizada
            if usuario.rol == 'admin' and nuevo_estado == EstadoTarea.PENDIENTE:
                pass
            else:
                return False
        
        # Si es empleado, solo puede cambiar a EN_PROGRESO o FINALIZADA
        if usuario.rol == 'empleado':
            if nuevo_estado == EstadoTarea.PENDIENTE and self.estado != EstadoTarea.PENDIENTE:
                return False
            if self.estado == EstadoTarea.FINALIZADA:
                return False
        
        self.estado = nuevo_estado
        self.ultimo_cambio_por = usuario
        self.save(update_fields=['estado', 'ultimo_cambio_por', 'fecha_actualizacion'])
        return True

    def marcar_como_en_progreso(self, usuario):
        """Marca la tarea como 'En progreso' y registra quién lo hizo."""
        return self.cambiar_estado(EstadoTarea.EN_PROGRESO, usuario)

    def marcar_como_finalizada(self, usuario):
        """Marca la tarea como 'Finalizada' y registra quién lo hizo."""
        return self.cambiar_estado(EstadoTarea.FINALIZADA, usuario)

    def marcar_como_pendiente(self, usuario):
        """Marca la tarea como 'Pendiente' y registra quién lo hizo."""
        return self.cambiar_estado(EstadoTarea.PENDIENTE, usuario)

    # ==========================================
    # KPIs (Agregaciones específicas del negocio)
    # ==========================================

    @classmethod
    def get_kpis_administrador(cls):
        """KPIs para el dashboard del administrador."""
        hoy = date.today()
        return {
            'total': cls.objects.count(),
            'pendientes': cls.objects.filter(estado=EstadoTarea.PENDIENTE).count(),
            'en_progreso': cls.objects.filter(estado=EstadoTarea.EN_PROGRESO).count(),
            'finalizadas': cls.objects.filter(estado=EstadoTarea.FINALIZADA).count(),
            'vencidas': cls.objects.exclude(
                estado=EstadoTarea.FINALIZADA
            ).filter(fecha_limite__lt=hoy).count(),
        }

    @classmethod
    def get_kpis_empleado(cls, empleado):
        """KPIs para el dashboard del empleado."""
        tareas = cls.objects.filter(empleado=empleado)
        
        pendientes = tareas.filter(estado=EstadoTarea.PENDIENTE).count()
        en_progreso = tareas.filter(estado=EstadoTarea.EN_PROGRESO).count()
        finalizadas = tareas.filter(estado=EstadoTarea.FINALIZADA).count()
        
        vencidas = tareas.exclude(
            estado=EstadoTarea.FINALIZADA
        ).filter(fecha_limite__lt=date.today()).count()
        
        return {
            'pendientes': pendientes,
            'en_progreso': en_progreso,
            'finalizadas': finalizadas,
            'vencidas': vencidas,
        }