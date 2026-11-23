from django.urls import path
from . import views

app_name = 'funciones'

urlpatterns = [
    # Admin
    path('admin/funciones/', views.admin_funciones_list, name='admin_funciones_list'),
    path('admin/funciones/crear/', views.admin_funcion_create, name='admin_funcion_create'),
    path('admin/funciones/editar/<int:pk>/', views.admin_funcion_edit, name='admin_funcion_edit'),
    path('admin/funciones/eliminar/<int:pk>/', views.admin_funcion_delete, name='admin_funcion_delete'),
    path('admin/funciones/cambiar-estado/<int:pk>/', views.admin_funcion_cambiar_estado, name='admin_funcion_cambiar_estado'),
    path('admin/funciones/vencidas/', views.admin_funciones_vencidas, name='admin_funciones_vencidas'),

    # Empleado
    path('mis-funciones/', views.empleado_funciones_list, name='empleado_funciones_list'),
    path('mis-funciones/<int:pk>/', views.empleado_funcion_detail, name='empleado_funcion_detail'),
    path('mis-funciones/<int:pk>/progreso/', views.empleado_funcion_marcar_progreso, name='empleado_funcion_progreso'),
    path('mis-funciones/<int:pk>/finalizar/', views.empleado_funcion_marcar_finalizada, name='empleado_funcion_finalizar'),
]