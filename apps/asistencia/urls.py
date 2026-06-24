from django.urls import path
from . import views

app_name = 'asistencia'

urlpatterns = [

    path(
        'horarios/',
        views.horarios,
        name='horarios'
    ),

    path(
        'descansos/',
        views.descansos,
        name='descansos'
    ),

]