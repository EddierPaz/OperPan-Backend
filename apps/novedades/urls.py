from django.urls import path
from . import views

app_name = 'novedades'

urlpatterns = [
    # Admin (HTML)
    path('', views.novedades_admin, name='novedades_admin'),

    # Empleado (HTML)
    path('solicitudes/', views.solicitudes_empleado, name='solicitudes_empleado'),

    # API - Empleado
    path('mis-solicitudes/', views.mis_solicitudes, name='mis_solicitudes'),
    path('permisos/crear/', views.crear_permiso, name='crear_permiso'),
    path('incapacidades/crear/', views.crear_incapacidad, name='crear_incapacidad'),
    path('certificados/crear/', views.crear_certificado, name='crear_certificado'),

    # API - Admin (permisos)
    path('permisos/pendientes/', views.permisos_pendientes, name='permisos_pendientes'),
    path('permisos/historial/', views.permisos_historial, name='permisos_historial'),
    path('permisos/<int:pk>/', views.permiso_detalle, name='permiso_detalle'),
    path('permisos/<int:pk>/aprobar/', views.permiso_aprobar, name='permiso_aprobar'),
    path('permisos/<int:pk>/rechazar/', views.permiso_rechazar, name='permiso_rechazar'),

    # API - Admin (incapacidades)
    path('incapacidades/pendientes/', views.incapacidades_pendientes, name='incapacidades_pendientes'),
    path('incapacidades/historial/', views.incapacidades_historial, name='incapacidades_historial'),
    path('incapacidades/<int:pk>/', views.incapacidad_detalle, name='incapacidad_detalle'),
    path('incapacidades/<int:pk>/aprobar/', views.incapacidad_aprobar, name='incapacidad_aprobar'),
    path('incapacidades/<int:pk>/rechazar/', views.incapacidad_rechazar, name='incapacidad_rechazar'),

    # API - Admin (certificados)
    path('certificados/', views.certificados_lista, name='certificados_lista'),
    path('certificados/pendientes/', views.certificados_pendientes, name='certificados_pendientes'),
    path('certificados/<int:pk>/aprobar/', views.certificado_aprobar, name='certificado_aprobar'),
    path('certificados/<int:pk>/rechazar/', views.certificado_rechazar, name='certificado_rechazar'),
    path('certificados/<int:pk>/descargar/', views.certificado_descargar, name='certificado_pdf'),

    # API - Admin (memorandos)
    path('memorandos/', views.memorandos_lista, name='memorandos_lista'),
    path('memorandos/empleados/', views.memorandos_empleados_lista, name='memorandos_empleados_lista'),
    path('memorandos/crear/', views.memorando_crear, name='memorando_crear'),
    path('memorandos/<int:pk>/descargar/', views.memorando_descargar, name='memorando_descargar'),

    # Empleado - Memorandos
    path('memorandos/mis/', views.mis_memorandos_api, name='mis_memorandos_api'),
    path('memorandos/empleado/', views.memorandos_empleado, name='memorandos_empleado'),
]