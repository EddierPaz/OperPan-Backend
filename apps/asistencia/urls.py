from django.urls import path
from . import views

app_name = "asistencia"

urlpatterns = [

    path(
        "horarios/",
        views.horarios,
        name="horarios"
    ),

    path(
        "horarios/<int:id>/json/",
        views.horario_json,
        name="horario_json"
    ),

    path(
        "horarios/<int:id>/editar/",
        views.editar_horario,
        name="editar_horario"
    ),

    path(
        "horarios/<int:id>/eliminar/",
        views.eliminar_horario,
        name="eliminar_horario"
    ),
    
    path(
        'asistencia/empleado',
        views.asistencia_empleado,
        name="empleado"
    ),

    path(
        "registrar-asistencia/",
        views.registrar_asistencia,
        name="registrar_asistencia"
    )

]