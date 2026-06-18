from django.urls import path
from . import views

app_name = 'novedades'

urlpatterns = [
    path('', views.novedades_admin, name='novedades_admin'),
    # PERMISOS
    path('permisos/pendientes/', views.permisos_pendientes, name='permisos_pendientes'),
    path('permisos/historial/', views.permisos_historial, name='permisos_historial'),
    path('permisos/<int:pk>/', views.permiso_detalle, name='permiso_detalle'),
    path('permisos/<int:pk>/aprobar/', views.permiso_aprobar, name='permiso_aprobar'),
    path('permisos/<int:pk>/rechazar/', views.permiso_rechazar, name='permiso_rechazar'),

    # INCAPACIDADES
    path('incapacidades/pendientes/', views.incapacidades_pendientes, name='incapacidades_pendientes'),
    path('incapacidades/historial/', views.incapacidades_historial, name='incapacidades_historial'),
    path('incapacidades/<int:pk>/', views.incapacidad_detalle, name='incapacidad_detalle'),
    path('incapacidades/<int:pk>/aprobar/', views.incapacidad_aprobar, name='incapacidad_aprobar'),
    path('incapacidades/<int:pk>/rechazar/', views.incapacidad_rechazar, name='incapacidad_rechazar'),

    # CERTIFICADOS
    path('certificados/', views.certificados_lista, name='certificados_lista'),
]