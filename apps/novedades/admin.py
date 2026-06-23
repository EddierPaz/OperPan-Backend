from django.contrib import admin
from django.utils.html import format_html
from .models import Permiso, Incapacidad, Certificado


@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'empleado_nombre',
        'tipo_display',
        'fecha_inicio',
        'fecha_fin',
        'estado_display',
        'fecha_solicitud',
        'decision_por',
    )
    list_filter = ('estado', 'tipo', 'fecha_solicitud')
    search_fields = (
        'empleado__primer_nombre',
        'empleado__primer_apellido',
        'empleado__numero_documento',
        'justificacion',
    )
    readonly_fields = ('fecha_solicitud',)  # Eliminado 'fecha_modificacion' porque no existe en el modelo
    fieldsets = (
        ('Información del permiso', {
            'fields': (
                'empleado',
                'tipo',
                'fecha_inicio',
                'fecha_fin',
                'justificacion',
                'nuevo_horario',
            )
        }),
        ('Estado y decisión', {
            'fields': (
                'estado',
                'decision_por',
                'decision_fecha',
                'motivo_rechazo',
            )
        }),
        ('Auditoría', {
            'fields': ('fecha_solicitud',),
            'classes': ('collapse',),
        }),
    )
    autocomplete_fields = ('empleado', 'decision_por')
    date_hierarchy = 'fecha_solicitud'
    actions = ['aprobar_permisos', 'rechazar_permisos']

    def empleado_nombre(self, obj):
        return obj.empleado.nombre_completo()
    empleado_nombre.short_description = 'Empleado'
    empleado_nombre.admin_order_field = 'empleado__primer_nombre'

    def tipo_display(self, obj):
        return obj.get_tipo_display()
    tipo_display.short_description = 'Tipo'

    def estado_display(self, obj):
        colores = {
            'pendiente': 'orange',
            'aprobado': 'green',
            'rechazado': 'red',
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colores.get(obj.estado, 'black'),
            obj.get_estado_display()
        )
    estado_display.short_description = 'Estado'

    def aprobar_permisos(self, request, queryset):
        count = queryset.filter(estado='pendiente').update(estado='aprobado')
        self.message_user(request, f'{count} permiso(s) aprobado(s).')
    aprobar_permisos.short_description = 'Aprobar permisos seleccionados'

    def rechazar_permisos(self, request, queryset):
        count = queryset.filter(estado='pendiente').update(estado='rechazado')
        self.message_user(request, f'{count} permiso(s) rechazado(s).')
    rechazar_permisos.short_description = 'Rechazar permisos seleccionados'


@admin.register(Incapacidad)
class IncapacidadAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'empleado_nombre',
        'titulo',
        'fecha_inicio',
        'fecha_fin',
        'estado_display',
        'fecha_solicitud',
        'decision_por',
    )
    list_filter = ('estado', 'fecha_solicitud')
    search_fields = (
        'empleado__primer_nombre',
        'empleado__primer_apellido',
        'empleado__numero_documento',
        'titulo',
        'descripcion',
        'entidad_emisora',
        'numero_incapacidad',
    )
    readonly_fields = ('fecha_solicitud',)
    fieldsets = (
        ('Información de la incapacidad', {
            'fields': (
                'empleado',
                'titulo',
                'descripcion',
                'fecha_inicio',
                'fecha_fin',
                'archivo',
                'entidad_emisora',
                'numero_incapacidad',
            )
        }),
        ('Estado y decisión', {
            'fields': (
                'estado',
                'decision_por',
                'decision_fecha',
                'motivo_rechazo',
            )
        }),
        ('Auditoría', {
            'fields': ('fecha_solicitud',),
            'classes': ('collapse',),
        }),
    )
    autocomplete_fields = ('empleado', 'decision_por')
    date_hierarchy = 'fecha_solicitud'
    actions = ['aprobar_incapacidades', 'rechazar_incapacidades']

    def empleado_nombre(self, obj):
        return obj.empleado.nombre_completo()
    empleado_nombre.short_description = 'Empleado'
    empleado_nombre.admin_order_field = 'empleado__primer_nombre'

    def estado_display(self, obj):
        colores = {
            'pendiente': 'orange',
            'aprobado': 'green',
            'rechazado': 'red',
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colores.get(obj.estado, 'black'),
            obj.get_estado_display()
        )
    estado_display.short_description = 'Estado'

    def aprobar_incapacidades(self, request, queryset):
        count = queryset.filter(estado='pendiente').update(estado='aprobado')
        self.message_user(request, f'{count} incapacidad(es) aprobada(s).')
    aprobar_incapacidades.short_description = 'Aprobar incapacidades seleccionadas'

    def rechazar_incapacidades(self, request, queryset):
        count = queryset.filter(estado='pendiente').update(estado='rechazado')
        self.message_user(request, f'{count} incapacidad(es) rechazada(s).')
    rechazar_incapacidades.short_description = 'Rechazar incapacidades seleccionadas'


@admin.register(Certificado)
class CertificadoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'empleado_nombre',
        'tipo_display',
        'fecha_emision',
        'proposito',
        'generado_por',
        'descargas',
    )
    list_filter = ('tipo', 'fecha_emision')
    search_fields = (
        'empleado__primer_nombre',
        'empleado__primer_apellido',
        'empleado__numero_documento',
        'proposito',
        'dirigido_a',
        'periodo',
    )
    readonly_fields = ('fecha_emision',)
    fieldsets = (
        ('Información del certificado', {
            'fields': (
                'empleado',
                'tipo',
                'proposito',
                'dirigido_a',
                'periodo',
            )
        }),
        ('Registro', {
            'fields': (
                'fecha_emision',
                'generado_por',
                'descargas',
            )
        }),
    )
    autocomplete_fields = ('empleado', 'generado_por')
    date_hierarchy = 'fecha_emision'

    def empleado_nombre(self, obj):
        return obj.empleado.nombre_completo()
    empleado_nombre.short_description = 'Empleado'
    empleado_nombre.admin_order_field = 'empleado__primer_nombre'

    def tipo_display(self, obj):
        return obj.get_tipo_display()
    tipo_display.short_description = 'Tipo'
