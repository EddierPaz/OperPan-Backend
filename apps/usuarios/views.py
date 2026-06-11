from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages
from .forms import UserForm
from .models import User, PerfilEmpleado

@login_required
def gestion_cuentas(request):

    if request.method == 'POST':

        username = request.POST.get('username', '').strip()
        numero_documento = request.POST.get('numero_documento', '').strip()

        # Validar usuario repetido
        if User.objects.filter(username=username).exists():

            messages.error(
                request,
                'Ese nombre de usuario ya existe.'
            )

            return redirect('gestion_cuentas')

        # Validar documento repetido
        if PerfilEmpleado.objects.filter(
            numero_documento=numero_documento
        ).exists():

            messages.error(
                request,
                'Ya existe un empleado con ese número de documento.'
            )

            return redirect('gestion_cuentas')

        # Crear usuario
        user = User.objects.create_user(
            username=username,
            password=request.POST.get('password'),
            rol=request.POST.get('rol')
        )

        # Crear perfil
        PerfilEmpleado.objects.create(
            user=user,

            primer_nombre=request.POST.get('primer_nombre'),
            segundo_nombre=request.POST.get('segundo_nombre'),

            primer_apellido=request.POST.get('primer_apellido'),
            segundo_apellido=request.POST.get('segundo_apellido'),

            tipo_documento=request.POST.get('tipo_documento'),
            numero_documento=numero_documento,

            fecha_nacimiento=request.POST.get('fecha_nacimiento') or None,

            genero=request.POST.get('genero'),
            estado_civil=request.POST.get('estado_civil'),
            tipo_sangre=request.POST.get('tipo_sangre'),

            telefono=request.POST.get('telefono'),
            correo=request.POST.get('correo'),

            ciudad=request.POST.get('ciudad'),
            direccion=request.POST.get('direccion'),

            contacto_emergencia=request.POST.get(
                'contacto_emergencia'
            ),

            telefono_emergencia=request.POST.get(
                'telefono_emergencia'
            ),

            cargo=request.POST.get('cargo'),

            fecha_ingreso=request.POST.get(
                'fecha_ingreso'
            ) or None,
            
            estado='activo',

            eps=request.POST.get('eps'),
            arl=request.POST.get('arl'),
            fondo_pension=request.POST.get(
                'fondo_pension'
            ),
        )

        messages.success(
            request,
            'Usuario creado correctamente.'
        )

        return redirect('gestion_cuentas')

    usuarios = PerfilEmpleado.objects.select_related(
        'user'
    ).all()

    context = {
        'usuarios': usuarios,
        'total_usuarios': usuarios.count(),
        'total_admins': usuarios.filter(
            user__rol='admin'
        ).count(),
        'total_empleados': usuarios.filter(
            user__rol='empleado'
        ).count(),
        'perfil_editar': None,
    }

    return render(
        request,
        'login/crear_usuario.html',
        context
    )

@login_required
def editar_usuario(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        perfil = user.perfil
    except User.DoesNotExist:
        messages.error(request, "Usuario no encontrado.")
        return redirect('gestion_cuentas')

    if request.method == 'POST':
        # Datos editables del perfil
        perfil.primer_nombre = request.POST.get('primer_nombre', perfil.primer_nombre)
        perfil.segundo_nombre = request.POST.get('segundo_nombre', perfil.segundo_nombre)
        perfil.primer_apellido = request.POST.get('primer_apellido', perfil.primer_apellido)
        perfil.segundo_apellido = request.POST.get('segundo_apellido', perfil.segundo_apellido)
        perfil.genero = request.POST.get('genero', perfil.genero)
        perfil.estado_civil = request.POST.get('estado_civil', perfil.estado_civil)
        perfil.tipo_sangre = request.POST.get('tipo_sangre', perfil.tipo_sangre)
        perfil.telefono = request.POST.get('telefono', perfil.telefono)
        perfil.correo = request.POST.get('correo', perfil.correo)
        perfil.ciudad = request.POST.get('ciudad', perfil.ciudad)
        perfil.direccion = request.POST.get('direccion', perfil.direccion)
        perfil.contacto_emergencia = request.POST.get('contacto_emergencia', perfil.contacto_emergencia)
        perfil.telefono_emergencia = request.POST.get('telefono_emergencia', perfil.telefono_emergencia)
        perfil.cargo = request.POST.get('cargo', perfil.cargo)
        perfil.fecha_ingreso = request.POST.get('fecha_ingreso') or perfil.fecha_ingreso
        perfil.eps = request.POST.get('eps', perfil.eps)
        perfil.arl = request.POST.get('arl', perfil.arl)
        perfil.fondo_pension = request.POST.get('fondo_pension', perfil.fondo_pension)
        perfil.estado = request.POST.get('estado', perfil.estado)
        perfil.save()

        # Rol editable
        user.rol = request.POST.get('rol', user.rol)
        user.save()

        messages.success(request, f"Usuario {user.username} actualizado correctamente.", extra_tags='editado')
        return redirect('gestion_cuentas')

    context = {
        'perfil': perfil,
        'user': user,
    }
    return render(request, 'login/crear_usuario.html', context)

def iniciar_sesion(request):
    if request.method == "POST":
        identificador = request.POST.get('username', '').strip()
        contrasena = request.POST.get('password', '')

        user = authenticate(request, username=identificador, password=contrasena)

        if user is not None:
            if not user.is_active:
                messages.error(request, "Esta cuenta se encuentra desactivada.")
                return render(request, "login/login.html")

            login(request, user)

            # Redirección basada en el Rol corporativo
            if user.rol == 'admin':
                return redirect('admin_panel')
            else:
                return redirect('empleado_panel')
        else:
            messages.error(request, "Usuario o contraseña incorrectos.")

    return render(request, "login/login.html")

@login_required
def cerrar_sesion(request):
    logout(request)
    messages.info(request, "Sesión cerrada correctamente.")
    return redirect('iniciar_sesion') 

def inicio(request):
    return render(request, "index.html")

@login_required
def admin_panel(request):
    return render(request, "admin/landingAdmin.html")

@login_required
def empleado_panel(request):
    return render(request, "empleado/landingEmpleado.html")

@login_required
def eliminar_usuario(request, user_id):
    if request.method == 'POST':
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            messages.success(request, "Usuario eliminado correctamente.")
        except User.DoesNotExist:
            messages.error(request, "Usuario no encontrado.")
    return redirect('gestion_cuentas')

def base (request):
    return render(request, "admin/base/base.html")