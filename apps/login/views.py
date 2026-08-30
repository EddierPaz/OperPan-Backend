from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.urls import reverse
from django.utils import timezone

from apps.usuarios.models import User, PerfilEmpleado, PasswordResetToken
from apps.usuarios.forms import EstablecerPasswordForm


def inicio(request):
    return render(request, "index.html")


def login_view(request):
    if request.method == "POST":
        identificador = request.POST.get("username", "").strip()
        contrasena = request.POST.get("password", "")
        user = authenticate(request, username=identificador, password=contrasena)

        if user is not None:
            # is_active ya es el espejo de estado_cuenta (RN-CT-07), pero el
            # MENSAJE debe distinguir por qué está bloqueada (sección P).
            if not user.is_active:
                if user.estado_cuenta == User.EstadoCuenta.SUSPENDIDA:
                    messages.error(
                        request,
                        "Tu cuenta está suspendida. Contacta al administrador."
                    )
                else:
                    messages.error(request, "Esta cuenta no está disponible.")
                return render(request, "login/login.html")

            login(request, user)

            # RF-CT-03: cambio de contraseña obligatorio antes de cualquier otra vista.
            if user.debe_cambiar_password:
                return redirect("primer_acceso")

            if user.rol == "admin":
                return redirect("admin_dashboard")
            return redirect("employee_dashboard")

        messages.error(request, "Usuario o contraseña incorrectos.")
    return render(request, "login/login.html")


@login_required
def logout_view(request):
    logout(request)
    messages.info(request, "Sesión cerrada correctamente.")
    return redirect("login")


@login_required
def primer_acceso_view(request):
    """
    RF-CT-03 / sección G: pantalla obligatoria de cambio de contraseña.
    Si el usuario ya no la necesita, no tiene nada que hacer aquí.
    """
    user = request.user

    if not user.debe_cambiar_password:
        return redirect("admin_dashboard" if user.rol == "admin" else "employee_dashboard")

    numero_documento = user.perfil.numero_documento

    if request.method == "POST":
        form = EstablecerPasswordForm(request.POST, numero_documento=numero_documento)
        if form.is_valid():
            user.set_password(form.cleaned_data["password1"])
            user.debe_cambiar_password = False
            if not user.fecha_primer_acceso:
                user.fecha_primer_acceso = timezone.now()
            if user.estado_cuenta == User.EstadoCuenta.PENDIENTE:
                user.estado_cuenta = User.EstadoCuenta.ACTIVA
            user.save()

            # Django invalidaría la sesión al cambiar el password; la refrescamos
            # para no forzar un segundo login inmediatamente después de este.
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request, user)

            messages.success(request, "Contraseña actualizada. Bienvenido a OperPan.")
            return redirect("admin_dashboard" if user.rol == "admin" else "employee_dashboard")
    else:
        form = EstablecerPasswordForm(numero_documento=numero_documento)

    return render(request, "login/primer_acceso.html", {"form": form})


def password_reset_documento(request):
    if request.method == "POST":
        documento = request.POST.get("documento", "").strip()
        try:
            perfil = PerfilEmpleado.objects.get(numero_documento=documento)

            # Sección Q: no revelamos si la cuenta está suspendida/inactiva —
            # el token se emite igual, el bloqueo ocurre al hacer login después.
            token_obj = PasswordResetToken.objects.create(user=perfil.user)
            reset_url = request.build_absolute_uri(
                reverse("password_reset_confirmar", args=[str(token_obj.token)])
            )
            contexto_email = {"nombre": perfil.primer_nombre, "reset_url": reset_url}
            html_content = render_to_string("login/password_reset_email.html", contexto_email)

            email = EmailMultiAlternatives(
                subject="Recupera tu contraseña - OperPan",
                body="Ingresa a OperPan para restablecer tu contraseña.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[perfil.correo],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)

        except PerfilEmpleado.DoesNotExist:
            pass  # mismo mensaje genérico, no se filtra si el documento existe

        messages.success(
            request,
            "Si el documento existe en nuestro sistema, recibirás un correo con instrucciones."
        )
        return redirect("login")

    return render(request, "login/password_reset.html")


def password_reset_confirmar(request, token):
    token_obj = get_object_or_404(PasswordResetToken, token=token)

    if not token_obj.es_valido():
        messages.error(request, "El enlace ha expirado o ya fue utilizado.")
        return redirect("login")

    user = token_obj.user
    numero_documento = user.perfil.numero_documento

    if request.method == "POST":
        form = EstablecerPasswordForm(request.POST, numero_documento=numero_documento)
        if form.is_valid():
            user.set_password(form.cleaned_data["password1"])

            # RN-CT-06: el reset NUNCA reactiva una cuenta suspendida/inactiva.
            # Única excepción (sección Q): PENDIENTE → ACTIVA, porque completar
            # el reset aquí equivale a completar el primer acceso.
            if user.estado_cuenta == User.EstadoCuenta.PENDIENTE:
                user.estado_cuenta = User.EstadoCuenta.ACTIVA
                user.debe_cambiar_password = False
                if not user.fecha_primer_acceso:
                    user.fecha_primer_acceso = timezone.now()

            user.save()

            token_obj.usado = True
            token_obj.save()

            messages.success(request, "Contraseña actualizada correctamente. Ya puedes iniciar sesión.")
            return redirect("login")
    else:
        form = EstablecerPasswordForm(numero_documento=numero_documento)

    return render(request, "login/password_reset_confirmar.html", {"form": form})