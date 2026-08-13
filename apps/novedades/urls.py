from django.urls import path
from . import views

app_name = 'novedades'

urlpatterns = [
    # ============================================================
    # VISTAS PRINCIPALES (HTML)
    # ============================================================
    path('', views.novedades_admin, name='novedades_admin'),
    path('solicitudes/', views.solicitudes_empleado, name='solicitudes_empleado'),

    # ============================================================
    # API - EMPLEADO (CRUD)
    # ============================================================

    # Listar todas las solicitudes del empleado
    path('mis-solicitudes/', views.mis_solicitudes, name='mis_solicitudes'),

    # Crear solicitudes
    path('permisos/crear/', views.crear_permiso, name='crear_permiso'),
    path('incapacidades/crear/', views.crear_incapacidad, name='crear_incapacidad'),
    path('certificados/crear/', views.crear_certificado, name='crear_certificado'),

    # EDITAR solicitudes (EMPLEADO)
    path('solicitudes/permiso/<int:pk>/editar/', views.editar_permiso, name='editar_permiso'),
    path('solicitudes/incapacidad/<int:pk>/editar/', views.editar_incapacidad, name='editar_incapacidad'),
    path('solicitudes/certificado/<int:pk>/editar/', views.editar_certificado, name='editar_certificado'),

    # ELIMINAR solicitudes (EMPLEADO)
    path('solicitudes/permiso/<int:pk>/eliminar/', views.eliminar_permiso, name='eliminar_permiso'),
    path('solicitudes/incapacidad/<int:pk>/eliminar/', views.eliminar_incapacidad, name='eliminar_incapacidad'),
    path('solicitudes/certificado/<int:pk>/eliminar/', views.eliminar_certificado, name='eliminar_certificado'),

    # ============================================================
    # API - ADMIN (PERMISOS)
    # ============================================================
    path('permisos/pendientes/', views.permisos_pendientes, name='permisos_pendientes'),
    path('permisos/historial/', views.permisos_historial, name='permisos_historial'),
    path('permisos/<int:pk>/', views.permiso_detalle, name='permiso_detalle'),
    path('permisos/<int:pk>/aprobar/', views.permiso_aprobar, name='permiso_aprobar'),
    path('permisos/<int:pk>/rechazar/', views.permiso_rechazar, name='permiso_rechazar'),

    # ============================================================
    # API - ADMIN (INCAPACIDADES)
    # ============================================================
    path('incapacidades/pendientes/', views.incapacidades_pendientes, name='incapacidades_pendientes'),
    path('incapacidades/historial/', views.incapacidades_historial, name='incapacidades_historial'),
    path('incapacidades/<int:pk>/', views.incapacidad_detalle, name='incapacidad_detalle'),
    path('incapacidades/<int:pk>/aprobar/', views.incapacidad_aprobar, name='incapacidad_aprobar'),
    path('incapacidades/<int:pk>/rechazar/', views.incapacidad_rechazar, name='incapacidad_rechazar'),

    # ============================================================
    # API - ADMIN (CERTIFICADOS)
    # ============================================================
    path('certificados/', views.certificados_lista, name='certificados_lista'),
    path('certificados/pendientes/', views.certificados_pendientes, name='certificados_pendientes'),
    path('certificados/<int:pk>/', views.certificado_detalle, name='certificado_detalle'),  # <--- NUEVA
    path('certificados/<int:pk>/aprobar/', views.certificado_aprobar, name='certificado_aprobar'),
    path('certificados/<int:pk>/rechazar/', views.certificado_rechazar, name='certificado_rechazar'),
    path('certificados/<int:pk>/descargar/', views.certificado_descargar, name='certificado_descargar'),
]