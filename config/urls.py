from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView  # ← Importante
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Homepage: se sirve en la raíz
    path('', TemplateView.as_view(template_name='index.html'), name='home'),

    # Rutas de las apps
    path('', include("apps.login.urls")),
    path('', include("apps.usuarios.urls")),
    path('novedades/', include('apps.novedades.urls')),
    path('memorandos/', include('apps.memorandos.urls')),
    path('asistencia/', include('apps.asistencia.urls')),
    path('tareas/', include('apps.tareas.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)