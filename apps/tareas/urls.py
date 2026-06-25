from django.urls import path
from . import views

app_name = 'tareas'

urlpatterns = [
    # Admin
    path('admin/tareas/', views.admin_tareas_list, name='admin_tareas_list'),
    path('admin/tareas/crear/', views.admin_tarea_create, name='admin_tarea_create'),
    path('admin/tareas/editar/<int:pk>/', views.admin_tarea_edit, name='admin_tarea_edit'),
    path('admin/tareas/eliminar/<int:pk>/', views.admin_tarea_delete, name='admin_tarea_delete'),
    path('admin/tareas/cambiar-estado/<int:pk>/', views.admin_tarea_cambiar_estado, name='admin_tarea_cambiar_estado'),
    path('admin/tareas/vencidas/', views.admin_tareas_vencidas, name='admin_tareas_vencidas'),

    # Empleado
    path('mis-tareas/', views.empleado_tareas_list, name='empleado_tareas_list'),
    path('mis-tareas/<int:pk>/', views.empleado_tarea_detail, name='empleado_tarea_detail'),
    path('mis-tareas/<int:pk>/progreso/', views.empleado_tarea_marcar_progreso, name='empleado_tarea_progreso'),
    path('mis-tareas/<int:pk>/finalizar/', views.empleado_tarea_marcar_finalizada, name='empleado_tarea_finalizar'),
]