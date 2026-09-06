from django.urls import path
from . import views

app_name = "asistencia"

urlpatterns = [

    path(
        "",
        views.asistencia_dashboard,
        name="asistencia_dashboard"
    ),

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
    ),

    path(
        "asistencia/empleado/<int:empleado_id>/",
        views.asistencia_empleado_admin,
        name="asistencia_empleado_admin"
    ),

    path(
    "cambiar-estado-asistencia/",
    views.cambiar_estado_asistencia,
    name="cambiar_estado_asistencia"
    ),

    # NUEVA RUTA PARA HISTORIAL
        # Esta función se encuentra al final del documento views.py 
    path(
        "historico/",
        views.asistencia_historico,
        name="asistencia_historico"
    ),

    path( 
        "cambiar-estado-asistencia/",
        views.cambiar_estado_asistencia,
        name="cambiar_estado_asistencia"
    ), 

    path(
        'empleado/horario/', 
        views.empleado_horario, 
        name='empleado_horario'
        ),

    path(
        'empleado/horario/<int:id>/detalle/', 
        views.empleado_horario_detalle, 
        name='empleado_horario_detalle'),
]