from django.contrib import admin
from .models import Horario, Asistencia


@admin.register(Horario)
class HorarioAdmin(admin.ModelAdmin):

    list_display = (
        'empleado',
        'mostrar_cargo',
        'turno',
        'hora_entrada',
        'hora_salida',
        'descanso',
        'estado'
    )

    list_filter = (
        'turno',
        'estado',
        'descanso'
    )

    search_fields = (
        'empleado__primer_nombre',
        'empleado__primer_apellido',
        'empleado__numero_documento'
    )

    def mostrar_cargo(self, obj):
        return obj.empleado.get_cargo_display()

    mostrar_cargo.short_description = 'Cargo'


@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):

    list_display = (
        'empleado',
        'fecha',
        'hora_entrada',
        'hora_salida',
        'estado'
    )

    list_filter = (
        'estado',
        'fecha'
    )

    search_fields = (
        'empleado__primer_nombre',
        'empleado__primer_apellido',
        'empleado__numero_documento'
    )