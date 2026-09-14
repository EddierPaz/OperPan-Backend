from django.contrib import admin
from .models import Horario, DescansoEmpleado


@admin.register(Horario)
class HorarioAdmin(admin.ModelAdmin):

    list_display = (
        'empleado',
        'turno',
        'hora_entrada',
        'hora_salida',
        'estado',
        'ciclo_inicio',
        'es_ciclo_cerrado',
        'es_generado_automaticamente',
        'ciclo_anterior',
    )

    list_filter = (
        'turno',
        'estado',
        'es_ciclo_cerrado',
        'es_generado_automaticamente',
    )


@admin.register(DescansoEmpleado)
class DescansoEmpleadoAdmin(admin.ModelAdmin):

    list_display = (
        'horario',
        'fecha',
        'es_descanso',
        'fue_generado_automaticamente',
    )

    list_filter = (
        'fecha',
        'es_descanso',
        'fue_generado_automaticamente',
    )