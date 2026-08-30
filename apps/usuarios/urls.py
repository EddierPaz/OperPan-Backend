from django.urls import path
from . import views

urlpatterns = [
    path('admi/dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('employee/dashboard/', views.employee_dashboard, name='employee_dashboard'),

    path('admi/users/', views.user_list_create, name='user_list'),
    path('admi/users/<int:user_id>/update/', views.user_update, name='user_update'),
    path('admi/users/<int:user_id>/delete/', views.user_delete, name='user_delete'),
    path('admi/users/<int:user_id>/suspender/', views.user_suspender, name='user_suspender'),
    path('admi/users/<int:user_id>/reactivar/', views.user_reactivar, name='user_reactivar'),
    path('admi/users/<int:user_id>/retirar/', views.user_retirar, name='user_retirar'),
    path('admi/users/<int:user_id>/reactivar-retiro/', views.user_reactivar_retiro, name='user_reactivar_retiro'),
    path('admi/users/<int:user_id>/enviar-credenciales/', views.user_send_credentials, name='user_send_credentials'),
    path('employee/profile/', views.employee_profile, name='employee_profile'),
    path('employee/profile/update/', views.employee_profile_update, name='employee_profile_update'),
]