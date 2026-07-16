from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.urls import reverse
from apps.usuarios.models import PerfilEmpleado, PasswordResetToken, User


def inicio(request):
    return render(request, "index.html")


def login_view(request):
    if request.method == "POST":
        identificador = request.POST.get("username", "").strip()
        contrasena = request.POST.get("password", "")
        user = authenticate(request, username=identificador, password=contrasena)

        if user is not None:
            if not user.is_active:
                messages.error(request, "Esta cuenta se encuentra desactivada.")
                return render(request, "login/login.html")
            login(request, user)
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


def password_reset_documento(request):
    if request.method == "POST":
        documento = request.POST.get("documento")
        try:
            perfil = PerfilEmpleado.objects.get(numero_documento=documento)

            token_obj = PasswordResetToken.objects.create(user=perfil.user)
            reset_url = request.build_absolute_uri(
                reverse("password_reset_confirmar", args=[str(token_obj.token)])
            )
            contexto_email = {"nombre": perfil.primer_nombre, "reset_url": reset_url}
            html_content = render_to_string("login/email/password_reset_email.html", contexto_email)

            email = EmailMultiAlternatives(
                subject="Recupera tu contraseña - OperPan",
                body="Ingresa a OperPan para restablecer tu contraseña.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[perfil.correo],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)

        except PerfilEmpleado.DoesNotExist:
            pass

        messages.success(
            request,
            "Si el documento existe, enviamos un correo con las instrucciones."
        )
        return redirect("password_reset_documento")   

    return render(request, "login/password_reset.html")


def password_reset_confirmar(request, token):
    token_obj = get_object_or_404(PasswordResetToken, token=token)

    if not token_obj.es_valido():
        messages.error(request, "El enlace ha expirado o ya fue utilizado.")
        return redirect("login")

    if request.method == "POST":
        nueva_password = request.POST.get("password")
        confirmar_password = request.POST.get("confirmar_password")

        if nueva_password != confirmar_password:
            messages.error(request, "Las contraseñas no coinciden.")
            return render(request, "login/password_reset_confirmar.html")

        user = token_obj.user
        user.set_password(nueva_password)
        user.save()

        token_obj.usado = True
        token_obj.save()

        messages.success(request, "Contraseña actualizada correctamente. Ya puedes iniciar sesión.")
        return redirect("login")

    return render(request, "login/password_reset_confirmar.html")