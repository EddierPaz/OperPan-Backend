from django.contrib import admin
from .models import User, PerfilEmpleado


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'username',
        'email',
        'first_name',
        'last_name',
        'rol',
        'is_active',
        'is_staff',
    )

    search_fields = (
        'username',
        'email',
        'first_name',
        'last_name',
    )

    list_filter = (
        'rol',
        'is_active',
        'is_staff',
    )


@admin.register(PerfilEmpleado)
class PerfilEmpleadoAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'primer_nombre',
        'segundo_nombre',
        'primer_apellido',
        'segundo_apellido',
        'tipo_documento',
        'numero_documento',
        'telefono',
        'correo',
        'cargo',
        'estado',
        'fecha_ingreso',
    )

    search_fields = (
        'primer_nombre',
        'segundo_nombre',
        'primer_apellido',
        'segundo_apellido',
        'numero_documento',
        'correo',
        'telefono',
    )

    list_filter = (
        'tipo_documento',
        'genero',
        'estado_civil',
        'tipo_sangre',
        'cargo',
        'estado',
    )

    readonly_fields = (
        'fecha_creacion',
        'fecha_actualizacion',
    )

    fieldsets = (

        ('Usuario', {
            'fields': (
                'user',
            )
        }),

        ('Datos Personales', {
            'fields': (
                'primer_nombre',
                'segundo_nombre',
                'primer_apellido',
                'segundo_apellido',
                'tipo_documento',
                'numero_documento',
                'fecha_nacimiento',
                'genero',
                'estado_civil',
                'tipo_sangre',
            )
        }),

        ('Información de Contacto', {
            'fields': (
                'telefono',
                'correo',
                'ciudad',
                'direccion',
            )
        }),

        ('Contacto de Emergencia', {
            'fields': (
                'contacto_emergencia',
                'parentesco_emergencia',
                'telefono_emergencia',
            )
        }),

        ('Información Laboral', {
            'fields': (
                'cargo',
                'fecha_ingreso',
                'eps',
                'arl',
                'fondo_pension',
                'estado',
            )
        }),

        ('Sistema', {
            'fields': (
                'fecha_creacion',
                'fecha_actualizacion',
            )
        }),
    )