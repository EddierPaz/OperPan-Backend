from django.urls import path
from . import views

app_name = 'novedades'

urlpatterns = [
    # ============================================================
    # VISTAS PRINCIPALES (HTML)
    # ============================================================
    path('', views.novedades_admin, name='novedades_admin'),
    path('novedades/', views.novedades_empleado, name='novedades_empleado'),

    # ============================================================
    # API - EMPLEADO (CRUD)
    # ============================================================

    # Listar todas las solicitudes del empleado
    path('mis-solicitudes/', views.mis_solicitudes, name='mis_solicitudes'),

    # Crear Novedades
    path('solicitudes/crear/', views.crear_solicitud, name='crear_solicitud'),
    path('incapacidades/crear/', views.crear_incapacidad, name='crear_incapacidad'),
    path('certificados/crear/', views.crear_certificado, name='crear_certificado'),

    # EDITAR Novedades (EMPLEADO)
    path('novedades/solicitud/<int:pk>/editar/', views.editar_solicitud, name='editar_solicitud'),
    path('novedades/incapacidad/<int:pk>/editar/', views.editar_incapacidad, name='editar_incapacidad'),
    path('novedades/certificado/<int:pk>/editar/', views.editar_certificado, name='editar_certificado'),

    # ELIMINAR solicitudes (EMPLEADO)
    path('novedades/solicitud/<int:pk>/eliminar/', views.eliminar_solicitud, name='eliminar_solicitud'),
    path('novedades/incapacidad/<int:pk>/eliminar/', views.eliminar_incapacidad, name='eliminar_incapacidad'),
    path('novedades/certificado/<int:pk>/eliminar/', views.eliminar_certificado, name='eliminar_certificado'),

    # ============================================================
    # API - ADMIN (SOLICITUDES)
    # ============================================================
    path('solicitudes/pendientes/', views.solicitudes_pendientes, name='solicitudes_pendientes'),
    path('solicitudes/historial/', views.solicitudes_historial, name='solicitudes_historial'),
    path('solicitudes/<int:pk>/', views.solicitud_detalle, name='solicitudes_detalle'),
    path('solicitudes/<int:pk>/aprobar/', views.solicitud_aprobar, name='solicitudes_aprobar'),
    path('solicitudes/<int:pk>/rechazar/', views.solicitud_rechazar, name='solicitudes_rechazar'),

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