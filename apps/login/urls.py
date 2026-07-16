from django.urls import path
from . import views

urlpatterns = [
    path('', views.inicio, name='index'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('recuperar/contrasena/', views.password_reset_documento, name='password_reset_documento'),
    path('recuperar/confirmar/<uuid:token>/', views.password_reset_confirmar, name='password_reset_confirmar'),
]