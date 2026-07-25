from django.shortcuts import redirect
from django.contrib import messages
from django.http import JsonResponse


def admin_required(view_func):
    def wrapper(request, *args, **kwargs):
        if request.user.rol != "admin":
            messages.error(request, "No tienes permisos para acceder a esta sección.")
            return redirect("login")
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_required_json(view_func):
    def wrapper(request, *args, **kwargs):
        if request.user.rol != "admin":
            return JsonResponse(
                {'error': 'No tienes permisos para realizar esta acción.'},
                status=403
            )
        return view_func(request, *args, **kwargs)
    return wrapper


def empleado_required(view_func):
    def wrapper(request, *args, **kwargs):
        if request.user.rol != "empleado":
            messages.error(request, "No tienes permisos para acceder a esta sección.")
            return redirect("login")
        return view_func(request, *args, **kwargs)
    return wrapper