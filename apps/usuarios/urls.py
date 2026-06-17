from django.urls import path
from . import views

urlpatterns = [
    path('', views.inicio, name='index'),
    path('iniciar/', views.iniciar_sesion, name='iniciar_sesion'),
    path('cerrar/', views.cerrar_sesion, name='cerrar_sesion'),
    path('admin_panel/', views.admin_panel, name='admin_panel'),
    path('empleado_panel/', views.empleado_panel, name='empleado_panel'),
    path('usuarios/',views.gestion_cuentas,name='gestion_cuentas'),
    path('eliminar_usuario/<int:user_id>/', views.eliminar_usuario, name='eliminar_usuario'),
    path('editar_usuario/<int:user_id>/', views.editar_usuario, name='editar_usuario'),
    path('base/', views.base, name='base'),
    path('base_empleado/', views.baseEmpleado, name='base_empleado'),
    path('editar_empleado/', views.editar_empleado, name='editar_empleado'),
]
