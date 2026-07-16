from django.urls import path
from . import views

urlpatterns = [
    path('admi/dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('employee/dashboard/', views.employee_dashboard, name='employee_dashboard'),
    path('admi/users/', views.user_list_create, name='user_list'),
    path('admi/users/<int:user_id>/update/', views.user_update, name='user_update'),
    path('admi/users/<int:user_id>/delete/', views.user_delete, name='user_delete'),
    path('employee/profile/', views.employee_profile, name='employee_profile'),
    path('employee/profile/update/', views.employee_profile_update, name='employee_profile_update'),
]
