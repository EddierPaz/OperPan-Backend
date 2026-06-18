from django.urls import path
from . import views

app_name = 'asistencia'

urlpatterns = [
    path('asistencia/', views.asistencia, name='asistencias'),
    path('asistencia_admin/', views.asistenciaAdmin, name='asistencias_admin'),
]
