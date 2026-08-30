from django.contrib.auth import logout
from django.shortcuts import redirect
from django.contrib import messages


class VerificarEstadoCuentaMiddleware:
    """
    En cada request de un usuario ya autenticado, verifica que su
    estado_cuenta siga permitiendo el acceso. Si fue suspendido o
    inactivado mientras tenía sesión abierta, se le cierra la sesión
    de inmediato (RF-CT-09).
    """

    # Rutas que SIEMPRE deben quedar accesibles, incluso si se va a
    # cerrar la sesión (evita loops de redirección).
    RUTAS_EXENTAS = ['/auth/login/', '/auth/logout/', '/inicio/']

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path not in self.RUTAS_EXENTAS:
            user = getattr(request, 'user', None)

            if user is not None and user.is_authenticated:
                estado = getattr(user, 'estado_cuenta', None)

                if estado in (user.EstadoCuenta.SUSPENDIDA, user.EstadoCuenta.INACTIVA):
                    logout(request)
                    mensaje = (
                        "Tu cuenta ha sido suspendida. Contacta al administrador."
                        if estado == user.EstadoCuenta.SUSPENDIDA
                        else "Esta cuenta ya no está disponible."
                    )
                    messages.error(request, mensaje)
                    return redirect('login')

        return self.get_response(request)