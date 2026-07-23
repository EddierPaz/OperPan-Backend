"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include("apps.login.urls")),
    path('', include("apps.usuarios.urls")),
    path('novedades/', include('apps.novedades.urls')),
    path('asistencia/', include('apps.asistencia.urls')),
    path('tareas/', include('apps.tareas.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)