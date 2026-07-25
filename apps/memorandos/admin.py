from django.contrib import admin
from .models import Memorando


@admin.register(Memorando)
class MemorandoAdmin(admin.ModelAdmin):
    list_display = ('consecutivo', 'empleado', 'tipo', 'asunto', 'fecha_emision', 'estado', 'generado_por')
    list_filter = ('tipo', 'estado', 'fecha_emision')
    search_fields = ('consecutivo', 'empleado__primer_nombre', 'empleado__primer_apellido', 'asunto', 'contenido')
    readonly_fields = ('consecutivo', 'fecha_emision', 'descargas')
    date_hierarchy = 'fecha_emision'
    ordering = ('-fecha_emision',)
    fieldsets = (
        ('Información del documento', {
            'fields': ('consecutivo', 'fecha_emision', 'estado')
        }),
        ('Datos del empleado', {
            'fields': ('empleado',)
        }),
        ('Contenido', {
            'fields': ('tipo', 'asunto', 'contenido')
        }),
        ('Archivo', {
            'fields': ('archivo_pdf', 'descargas')
        }),
        ('Auditoría', {
            'fields': ('generado_por',)
        }),
    )