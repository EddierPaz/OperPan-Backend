from django.http import JsonResponse

def admin_required(view_func):
    """
    Decorador para vistas API que requieren autenticación y rol de administrador.
    Retorna JSON con errores en lugar de redireccionar.
    """
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'No autenticado'}, status=401)
        if request.user.rol != 'admin':
            return JsonResponse({'error': 'Permisos insuficientes'}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper