from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """
    Configuración del panel de administración para el modelo Task.
    """
    # ---- Listado ----
    list_display = [
        'titulo',
        'empleado_nombre',      # ← NUEVO: método personalizado
        'prioridad',
        'estado',
        'fecha_limite',
        'fecha_asignacion',
    ]
    
    # ---- Filtros laterales ----
    list_filter = [
        'estado',
        'prioridad',
        'area',
        'turno_asociado',
        'fecha_limite',
    ]
    
    # ---- Búsqueda ----
    search_fields = [
        'titulo',
        'descripcion',
        'empleado__primer_nombre',      # ← CAMBIO: ahora es PerfilEmpleado
        'empleado__primer_apellido',    # ← CAMBIO: ahora es PerfilEmpleado
        'empleado__numero_documento',   # ← NUEVO: búsqueda por documento
    ]
    
    # ---- Campos de solo lectura ----
    readonly_fields = [
        'fecha_asignacion',
        'fecha_actualizacion',
        'fecha_finalizacion',   # ← NUEVO: agregado
        'ultimo_cambio_por',
        'creador',
    ]
    
    # ---- Organización del formulario ----
    fieldsets = (
        ('Información Principal', {
            'fields': ('titulo', 'descripcion', 'empleado', 'creador')
        }),
        ('Categorización', {
            'fields': ('area', 'turno_asociado')
        }),
        ('Prioridad y Estado', {
            'fields': ('prioridad', 'estado')
        }),
        ('Fechas', {
            'fields': ('fecha_limite', 'hora_limite', 'fecha_asignacion', 'fecha_actualizacion', 'fecha_finalizacion')
        }),
        ('Auditoría', {
            'fields': ('ultimo_cambio_por',)
        }),
    )
    
    # ---- Orden por defecto ----
    ordering = ['-fecha_asignacion']
    
    # ============================================================
    # MÉTODOS PERSONALIZADOS
    # ============================================================
    
    def empleado_nombre(self, obj):
        """Muestra el nombre completo del empleado."""
        return obj.empleado.nombre_completo()
    empleado_nombre.short_description = 'Empleado'
    empleado_nombre.admin_order_field = 'empleado__primer_nombre'