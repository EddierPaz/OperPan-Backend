from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'empleado', 'prioridad', 'estado', 'fecha_limite', 'esta_vencida']
    list_filter = ['estado', 'prioridad', 'area', 'turno_asociado']
    search_fields = ['titulo', 'descripcion', 'empleado__username']
    readonly_fields = ['fecha_asignacion', 'fecha_actualizacion', 'ultimo_cambio_por']
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
            'fields': ('fecha_limite', 'hora_limite', 'fecha_asignacion', 'fecha_actualizacion')
        }),
        ('Auditoría', {
            'fields': ('ultimo_cambio_por',)
        }),
    )