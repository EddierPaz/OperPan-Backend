from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import User, PerfilEmpleado
from .forms import UserForm, PerfilEmpleadoForm
from django.utils.dateparse import parse_date
from .decorators import admin_required
from apps.asistencia.models import Horario
from apps.asistencia.views import _contexto_base

# ========================

# VISTAS PÚBLICAS

# ========================

def inicio(request):
    return render(request, "index.html")

def login_view(request):
    if request.method == "POST":
        identificador = request.POST.get(
            "username",
            ""
        ).strip()
        contrasena = request.POST.get(
            "password",
            ""
        )
        user = authenticate(
            request,
            username=identificador,
            password=contrasena
        )

        if user is not None:
            if not user.is_active:
                messages.error(
                    request,
                    "Esta cuenta se encuentra desactivada."
                )
                return render(
                    request,
                    "login/login.html"
                )
            login(request, user)
            if user.rol == "admin":
                return redirect(
                    "admin_dashboard"
                )
            return redirect(
                "employee_dashboard"
            )
        messages.error(
            request,
            "Usuario o contraseña incorrectos."
        )
    return render(
        request,
        "login/login.html"
    )


@login_required
def logout_view(request):
    logout(request)
    messages.info(
        request,
        "Sesión cerrada correctamente."
    )
    return redirect("login")

# ========================
# DASHBOARDS
# ========================

@login_required
@admin_required
def admin_dashboard(request):

    contexto = _contexto_base()

    contexto["perfil"] = request.user.perfil

    return render(
        request,
        "admin/landingAdmin.html",
        contexto
    )


@login_required
def employee_dashboard(request):

    perfil = request.user.perfil

    horario = (
        Horario.objects
        .filter(
            empleado=perfil,
            estado=True
        )
        .first()
    )

    proximo_descanso = None

    if horario:

        proximo_descanso = (
            horario.descansos
            .filter(
                es_descanso=True
            )
            .order_by("fecha")
            .first()
        )

    context = {
        "horario": horario,
        "proximo_descanso": proximo_descanso,
        "perfil": perfil,
    }

    return render(
        request,
        "empleado/landingEmpleado.html",
        context
    )

# ========================
# GESTIÓN DE USUARIOS
# ========================

@login_required
@admin_required
def user_list_create(request):
    usuarios = PerfilEmpleado.objects.select_related("user").all()
    if request.method == "POST":
        user_form = UserForm(request.POST)
        perfil_form = PerfilEmpleadoForm(request.POST)
        if user_form.is_valid() and perfil_form.is_valid():
            user = user_form.save(commit=False)
            user.set_password(
                user_form.cleaned_data["password"]
            )
            user.save()
            perfil = perfil_form.save(commit=False)
            perfil.user = user
            perfil.save()

            messages.success(
                request,
                "Usuario creado correctamente."
            )
            return redirect("user_list")

        messages.error(
            request,
            "Corrige los errores del formulario."
        )   
    else:
        user_form = UserForm()
        perfil_form = PerfilEmpleadoForm()
    context = {
        "usuarios": usuarios,
        "total_usuarios": usuarios.count(),
        "total_admins": usuarios.filter(
            user__rol="admin"
        ).count(),
        "total_empleados": usuarios.filter(
            user__rol="empleado"
        ).count(),
        "perfil_editar": None,
        "user_form": user_form,
        "perfil_form": perfil_form,
    }
    return render(
        request,
        "admin/usuarios.html",
        context
    )

@login_required
@admin_required
def user_update(request, user_id):
    try:

        user = User.objects.get(
            id=user_id
        )

        perfil = user.perfil

    except User.DoesNotExist:

        messages.error(
            request,
            "Usuario no encontrado."
        )

        return redirect(
            "user_list"
        )

    if request.method == "POST":

        perfil.primer_nombre = request.POST.get(
            "primer_nombre",
            perfil.primer_nombre
        )

        perfil.segundo_nombre = request.POST.get(
            "segundo_nombre",
            perfil.segundo_nombre
        )

        perfil.primer_apellido = request.POST.get(
            "primer_apellido",
            perfil.primer_apellido
        )

        perfil.segundo_apellido = request.POST.get(
            "segundo_apellido",
            perfil.segundo_apellido
        )

        perfil.genero = request.POST.get(
            "genero",
            perfil.genero
        )

        perfil.estado_civil = request.POST.get(
            "estado_civil",
            perfil.estado_civil
        )

        perfil.tipo_sangre = request.POST.get(
            "tipo_sangre",
            perfil.tipo_sangre
        )

        perfil.telefono = request.POST.get(
            "telefono",
            perfil.telefono
        )

        perfil.correo = request.POST.get(
            "correo",
            perfil.correo
        )

        perfil.ciudad = request.POST.get(
            "ciudad",
            perfil.ciudad
        )

        perfil.direccion = request.POST.get(
            "direccion",
            perfil.direccion
        )

        perfil.contacto_emergencia = request.POST.get(
            "contacto_emergencia",
            perfil.contacto_emergencia
        )

        perfil.parentesco_emergencia = request.POST.get(
            "parentesco_emergencia",
            perfil.parentesco_emergencia
        )

        perfil.telefono_emergencia = request.POST.get(
            "telefono_emergencia",
            perfil.telefono_emergencia
        )

        perfil.cargo = request.POST.get(
            "cargo",
            perfil.cargo
        )

        perfil.fecha_ingreso = parse_date(request.POST.get(
            "fecha_ingreso"
            )) or perfil.fecha_ingreso

        perfil.eps = request.POST.get(
            "eps",
            perfil.eps
        )

        perfil.arl = request.POST.get(
            "arl",
            perfil.arl
        )

        perfil.fondo_pension = request.POST.get(
            "fondo_pension",
            perfil.fondo_pension
        )

        perfil.estado = request.POST.get(
            "estado",
            perfil.estado
        )

        perfil.save()

        user.rol = request.POST.get(
            "rol",
            user.rol
        )

        user.save()

        messages.success(
            request,
            f"Usuario {user.username} actualizado correctamente.",
            extra_tags="editado"
        )

        return redirect(
            "user_list"
        )

    return redirect(
        "user_list"
    )

@login_required
@admin_required
def user_delete(request, user_id):
    if request.method == "POST":

        try:

            user = User.objects.get(
                id=user_id
            )

            user.delete()

            messages.success(
                request,
                "Usuario eliminado correctamente."
            )

        except User.DoesNotExist:

            messages.error(
                request,
                "Usuario no encontrado."
            )

    return redirect(
        "user_list"
    )

# ========================
# PERFIL EMPLEADO
# ========================

@login_required
def employee_profile(request):
    perfil = request.user.perfil
    return render(
        request,
        "empleado/cuentas.html",
        {
            "perfil": perfil
        }
    )

@login_required
def employee_profile_update(request):
    if request.method == "POST":

        perfil = request.user.perfil

        perfil.genero = request.POST.get(
            "genero"
        )

        perfil.estado_civil = request.POST.get(
            "estado_civil"
        )

        perfil.telefono = request.POST.get(
            "telefono"
        )

        perfil.correo = request.POST.get(
            "correo"
        )

        perfil.direccion = request.POST.get(
            "direccion"
        )

        perfil.ciudad = request.POST.get(
            "ciudad"
        )

        perfil.contacto_emergencia = request.POST.get(
            "contacto_emergencia"
        )

        perfil.parentesco_emergencia = request.POST.get(
            "parentesco_emergencia"
        )

        perfil.telefono_emergencia = request.POST.get(
            "telefono_emergencia"
        )

        perfil.save()

        password = request.POST.get(
            "password"
        )

        if password:

            request.user.set_password(
                password
            )

            request.user.save()

        messages.success(
            request,
            "Perfil actualizado correctamente."
        )

    return redirect(
        "employee_profile"
    )
