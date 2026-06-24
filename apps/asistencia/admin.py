from django.contrib import admin
from .models import Horario, DescansoEmpleado


@admin.register(Horario)
class HorarioAdmin(admin.ModelAdmin):

    list_display = (
        'empleado',
        'turno',
        'hora_entrada',
        'hora_salida',
        'estado'
    )

    list_filter = (
        'turno',
        'estado'
    )


@admin.register(DescansoEmpleado)
class DescansoEmpleadoAdmin(admin.ModelAdmin):

    list_display = (
        'horario',
        'fecha',
        'es_descanso'
    )

    list_filter = (
        'fecha',
        'es_descanso'
    )