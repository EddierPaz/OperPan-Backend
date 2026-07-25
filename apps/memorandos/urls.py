from django.urls import path
from . import views

app_name = 'memorandos'

urlpatterns = [
    # Admin
    path('', views.memorandos_lista, name='memorandos_lista'),
    path('empleados/', views.memorandos_empleados_lista, name='memorandos_empleados_lista'),
    path('crear/', views.memorando_crear, name='memorando_crear'),
    path('<int:pk>/descargar/', views.memorando_descargar, name='memorando_descargar'),

    # Empleado
    path('mis/', views.mis_memorandos_api, name='mis_memorandos_api'),
    path('empleado/', views.memorandos_empleado, name='memorandos_empleado'),
]