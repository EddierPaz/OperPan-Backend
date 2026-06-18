# Primeras Impresiones

> dev: santiago muñeton

> Estas son mis primeras impresiones con el proyecto respecto a backend.






---






## Tabla de Contenido

1. [Primeros Pasos](#primeros-pasos)

2. [Migraciones | Runserver](#migraciones--runserver)

3. [Createsuperuser](#createsuperuser)

4. [Revisión de Proyecto](#revisión-de-proyecto)

5. [Creación de Novedades | backend](#creación-de-novedades--backend)

6. [novedades/ decorators.py](#novedades-decoratorspy)

7. [novedades/ forms.py](#novedades-formspy)

8. [novedades/ urls.py](#novedades-urlspy)

9. [novedades/ views.py](#novedades-viewspy)

10. [Creación de Novedades | frontend](#creación-de-novedades--frontend)







---






## Primeros Pasos

Despues de clonar mediante git este repositorio, fui a ejecutar el comando para el entorno virtual.

    La pregunta: ¿Se puede ejecutar python -m venv env en la misma carpeta raíz del proyecto, o debe ser por fuera?

    Respuesta: Sí, puedes ejecutarlo en la misma carpeta raíz del proyecto. Es una práctica común tener el entorno virtual dentro del directorio del proyecto (por ejemplo, env/ o venv/). Sin embargo, es importante que ese directorio esté en el archivo .gitignore para no subirlo al repositorio.

---

Luego trate de hacer uso del comando:

```bash
    /env/Scripts/activate.bat
```

Que esta en el archivo README de este proyecto, pero esta mal pues deberia ser con:

```bash
    env\Scripts\activate
```

> Agregue sección de clonar repositorio en el README.md 

Y ahora, debo entonces instalar requerimientos:

```bash
    pip install -r requirements.txt
```

Me empiezan a preocupar dos cosas:

1. No veo base de datos en el repositorio, ¿Donde está? Es un hecho, que podriamos empezar a trabajar con datos reales, por lo que esto podria ser algo que subamos a un drive privado. 

> Más adelante en este documento veremos este tema, pues django como practica y como esta con db.sqlite3 no es necesario ni crear la base de datos y por medio de los comandos de migraciones es más que suficiente.

> Este repositorio debido a temas de backend y seriedad, ya podría ser privado pues no tendrá una integración con github pages.

2. La versión de django esta sobre la 6, cuando para XAMPP necesitamos una menor a la 5. Esto podría ser un problema, pero lo ire evaluando.

> Investigando un poco, puede que esta versión de django no ponga ningún problema para xampp como tal y se podrá trabajar común y corriente. Django 6.0.6 es la versión más reciente (para 2026) y funciona sin problemas con XAMPP (Apache/MySQL). Django no depende de XAMPP directamente; solo usas MySQL (o MariaDB) como motor de base de datos. Django corre sobre su propio servidor de desarrollo (Esto sucede al ejecutar runserver), para desarrollo el servidor integrado es suficiente.

---

Ahora empiezan a surgir una serie de preguntas mirando el código y cada una de las carpetas que tenemos:

* ¿Qué tipo de integración vas a hacer? (API REST, renderizado de templates con Django, vistas basadas en clases, etc.)

* ¿Cuáles son los modelos de datos que vas a usar? (Permisos, Incapacidades, Certificados) – necesito saber los campos y relaciones.

* ¿Vas a reemplazar el localStorage por llamadas a la API? ¿O vas a mantener ambos?

* ¿Necesitas endpoints específicos? (listar, crear, aprobar, rechazar, filtrar)

* ¿Qué estructura de URLs manejas en Django? (para saber cómo se llamarán los endpoints)

* ¿El frontend actual (HTML+CSS+JS) se mantendrá igual o se va a modificar para consumir datos desde Django?






---





## Migraciones | Runserver

Quiero inicialmente poder correrlo, asi que ejecutaré:

```bash
    (env) C:\xampp\htdocs\1-Code\OperPan-Backend> pip install -r requirements.txt
```

**Primero - homepage y estructura de archivos**

> Debo hacer las migraciones y mirar el tema de la base de datos.

> Aun no necesito tener XAMPP activado.

Mirando el proyecto desde el servidor local inicialmente, veo problemas del CSS pues parece ser que no lo encuentra debido a que la homepage esta con html crudo y estilos de bootstrap.

> Aun nos falta volver determinar y mejorar la homepage del proyecto para diferenciar más estación paisa de OperPan.

Veo que respecto al HTML semántico, no se encuentra el icono del proyecto OperPan.

* Es bonito mirar entonces en apps/ como esta usuarios (trabajo de eddier). Entonces ahorita tengo que crear la de novedades y paula en ese mismo medio, deberá crear tareas.

* Veo que esta la carpeta static/ contiene el css, js e imagenes del proyecto.

* Veo en la carpeta templates/ los html

> Es interesante como aun no incorporamos todos los HTML, CSS y JS que tenemos en nuestra versión de solo frontend, pues estamos llendo paso a paso y considero que es mejor asi.

---

**Segundo - Login**

Aun tiene ese pequeño problema respecto a HTML semántico en etiquetas SEO.

Y ahora pide entonces contraseña y correo. ¿Qué pongo aqui?

En este momento ya es buena idea:

1. Ejecutar

```bash
    pip install pymysql
```

2. Activar XAMPP y phpmyadmin y crear la base de datos 

Para revisar esto fui a config/settings.py, me encontré esto:

```python
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
```

Mirando el tema, como esta con db.sqlite3. No contiene una base de datos propia, pues con el hecho de ejecutar migraciones, esto estará hecho.

> No hay que crear la BD y simplemente pasamos al siguente paso.

2. Ejecutar migraciones:

```bash
    python manage.py makemigrations
    python manage.py migrate
```

3. Volver a ejecutar el servidor:

```bash
    python manage.py runserver
```

Y entonces como resultado:

```bash
    (env) C:\xampp\htdocs\1-Code\OperPan-Backend>python manage.py runserver
    Watching for file changes with StatReloader
    Performing system checks...

    System check identified no issues (0 silenced).
    June 17, 2026 - 23:32:45
    Django version 6.0.6, using settings 'config.settings'
    Starting development server at http://127.0.0.1:8000/
    Quit the server with CTRL-BREAK.

    WARNING: This is a development server. Do not use it in a production setting. Use a production WSGI or ASGI server instead.
    For more information on production servers see: https://docs.djangoproject.com/en/6.0/howto/deployment/
    [17/Jun/2026 23:33:01] "GET / HTTP/1.1" 200 35668
    [17/Jun/2026 23:33:01] "GET /static/css/style.css HTTP/1.1" 304 0
    [17/Jun/2026 23:33:01] "GET /static/img/homepage/02-servicio-al-cliente.webp HTTP/1.1" 304 0
    [17/Jun/2026 23:33:01] "GET /static/img/LOGO%20EMPRESA.png HTTP/1.1" 304 0
    [17/Jun/2026 23:33:01] "GET /static/img/homepage/01-carrusel-pan.webp HTTP/1.1" 304 0
    [17/Jun/2026 23:33:01] "GET /static/img/homepage/03-carrusel-work-employee.png HTTP/1.1" 304 0
    [17/Jun/2026 23:33:02] "GET /static/js/index.js HTTP/1.1" 304 0
```






---






## Createsuperuser

> Quiero hacer uso del login. Esto para pasar común y corriente a los demás modulos.

El comando createsuperuser en Django es una utilidad que viene incluida en el framework.

Su propósito es crear un usuario administrador (superusuario) que tenga permisos totales para acceder al panel de administración de Django (/admin/) y también para hacer lo que quieras dentro del sistema (por ejemplo, autenticarte en el login del proyecto para acceder a las vistas protegidas).

Cuando ejecutas:

```bash
    python manage.py createsuperuser
```

Te va a pedir:

* Nombre de usuario (puede ser tu nombre, admin, etc.)

* Correo electrónico (opcional pero recomendado)

* Contraseña (debes escribirla dos veces)

Luego guarda ese usuario en la tabla auth_user de la base de datos (que se crea con las migraciones).

> admin | 1234

Para acceder al panel de administración de Django: Ve a http://127.0.0.1:8000/admin/ e inicia sesión con ese usuario. Ahí podrás ver y gestionar los modelos que tengas registrados en admin.py

* Actualmente en el momento que redacto este documento, se encuentra Usuarios.

* De esta forma podré crearme un usuario administrador para que sea el que ingrese a los modulos de administrador y yo asi crear entonces el modulo de novedades del administrador.

Una vez inicias como administrador, quedas en inicio y si haces click a cualquier modulo no te funciona; Asistencia, Solicitudes, Tareas Operativas te llevan a la homepage e información personal te lanza error.

> Entonces debo crear la de Solicitudes.











---











## Revisión de Proyecto

> Analizaré un poco lo que realizo Eddier: Cuentas y Dashboard de Admin y Emp

De ahora en adelante hay que tener muy en cuenta los templates y base.html

> Estos templates ya tienen una sintaxis ligeramente diferente debido a las variables {{}} debido a que deben funcionar como su nombre lo indica: templates

Cuando valla a agregar algo nuevo debo recordar editar:

config/settings.py

config/urls.py

Y de ahí, hacer los procedimientos de crear otra app. En mi caso será solicitudes.

Revisando la app de usuarios tiene un nuevo archivo llamado decorators.py el cual contiene:

```python
from django.shortcuts import redirect
from django.contrib import messages

def admin_required(view_func):

    def wrapper(request, *args, **kwargs):

        if request.user.rol != "admin":

            messages.error(
                request,
                "No tienes permisos para acceder a esta sección."
            )

            return redirect("empleado_panel")

        return view_func(request, *args, **kwargs)

    return wrapper

def empleado_required(view_func):

    def wrapper(request, *args, **kwargs):

        if request.user.rol != "empleado":

            messages.error(
                request,
                "No tienes permisos para acceder a esta sección."
            )

            return redirect("admin_panel")

        return view_func(request, *args, **kwargs)

    return wrapper
```

* Esto es novedoso y debe revisarlo bien para solicitudes respecto a Admin y Emp.

Al crearse una nueva app tendré que editar los archivos: forms.py, models.py, urls.py, views.py. Tal vez decorators.py y como tal todo el apartado de templates respecto al modulo que este programando.

Para ingresar a la interfaz de administrador tube que ingresar a http://127.0.0.1:8000/usuarios/ y crear un admin y otro empleado desde ahí.

> Ya a este punto considero que ya entiendo el proyecto y ya puedo empezar a programar (me demoré 3 horas aproximadamente para llegar a este punto.)






---






## Creación de Novedades | backend

Dado que el módulo de Novedades agrupa tres submódulos (Permisos, Incapacidades, Certificados), podemos crear una nueva app llamada novedades dentro de apps/. Esta app contendrá:

Modelos para cada submódulo (Permiso, Incapacidad, Certificado).

Vistas para el administrador (listado, detalle, aprobar, rechazar, etc.).

URLs específicas.

Templates para las vistas (basados en el HTML existente pero adaptados a Django).

Lógica de negocio (filtros, KPIs, etc.).

Entonces como primer paso voy a crear la App:

```bash
    cd apps
    python manage.py startapp novedades
```

Ahora voy a registrar la app en INSTALLED_APPS de config/settings.py:

```python
INSTALLED_APPS = [
    ...
    'apps.usuarios',
    'apps.novedades',   
]
```

Vamos a por el modelo por lo que en novedades/models.py:

```python
from django.db import models
from django.contrib.auth import get_user_model

# Importamos los modelos de usuarios
from apps.usuarios.models import PerfilEmpleado, User

# User = get_user_model()  # también funciona, pero es mejor usar el import directo

class Permiso(models.Model):
    TIPO_CHOICES = (
        ('personal', 'Permiso personal'),
        ('cambio_turno', 'Cambio de turno'),
        ('medico', 'Cita médica'),
        ('familiar', 'Asunto familiar'),
        ('vacaciones', 'Vacaciones'),
    )
    ESTADO_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    )

    empleado = models.ForeignKey(
        PerfilEmpleado,
        on_delete=models.CASCADE,
        related_name='permisos'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    justificacion = models.TextField()
    nuevo_horario = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    decision_fecha = models.DateTimeField(null=True, blank=True)
    decision_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permisos_decididos'
    )
    motivo_rechazo = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.get_tipo_display()} ({self.fecha_inicio})"


class Incapacidad(models.Model):
    ESTADO_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
    )

    empleado = models.ForeignKey(
        PerfilEmpleado,
        on_delete=models.CASCADE,
        related_name='incapacidades'
    )
    titulo = models.CharField(max_length=100)
    descripcion = models.TextField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    archivo = models.FileField(upload_to='incapacidades/', blank=True, null=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    decision_fecha = models.DateTimeField(null=True, blank=True)
    decision_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incapacidades_decididos'
    )
    motivo_rechazo = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.titulo} ({self.fecha_inicio})"


class Certificado(models.Model):
    TIPO_CHOICES = (
        ('laboral', 'Certificado laboral'),
        ('ingresos', 'Certificado de ingresos'),
        ('antiguedad', 'Certificado de antigüedad'),
    )

    empleado = models.ForeignKey(
        PerfilEmpleado,
        on_delete=models.CASCADE,
        related_name='certificados'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    proposito = models.CharField(max_length=200)
    fecha_emision = models.DateTimeField(auto_now_add=True)
    generado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certificados_generados'
    )
    descargas = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.get_tipo_display()} ({self.fecha_emision.date()})"
```

Se solicita escribir:

```bash
    python manage.py makemigrations novedades
    python manage.py migrate
```

A este punto me encontré un error, consistia en que yo cree la app de novedades inicialmente en la carpeta raiz del proyecto, por lo que mi archivo apps.py en novedades contenia:

```python
from django.apps import AppConfig

class NovedadesConfig(AppConfig):
    name = 'novedades'
```

Por lo que lo remplazaré por:

```python
from django.apps import AppConfig

class NovedadesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.novedades'
```

Vuelvo a intentar ejecutar migraciones, y esta vez si funciono.

```bash
(env) C:\xampp\htdocs\1-Code\OperPan-Backend>python manage.py makemigrations novedades
Migrations for 'novedades':
  apps\novedades\migrations\0001_initial.py
    + Create model Certificado
    + Create model Incapacidad
    + Create model Permiso
```

```bash
(env) C:\xampp\htdocs\1-Code\OperPan-Backend>python manage.py migrate
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, novedades, sessions, usuarios
Running migrations:
  Applying novedades.0001_initial... OK
```








---








## novedades/ decorators.py:

```python
    from django.http import JsonResponse

    def admin_required(view_func):
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'No autenticado'}, status=401)
            if request.user.rol != 'admin':
                return JsonResponse({'error': 'Permisos insuficientes'}, status=403)
            return view_func(request, *args, **kwargs)
        return wrapper
```








---








## novedades/ forms.py:

```python
from django import forms

class RechazoForm(forms.Form):
    """Formulario para validar el motivo de rechazo de un permiso o incapacidad."""
    motivo = forms.CharField(
        max_length=500,
        widget=forms.Textarea,
        required=True,
        error_messages={'required': 'El motivo del rechazo es obligatorio.'}
    )

class CertificadoFiltroForm(forms.Form):
    """Formulario para validar los filtros de certificados."""
    empleado = forms.CharField(required=False)
    tipo = forms.ChoiceField(
        choices=[('', 'Todos')] + [('laboral', 'Certificado laboral'), ('ingresos', 'Certificado de ingresos'), ('antiguedad', 'Certificado de antigüedad')],
        required=False
    )
    desde = forms.DateField(required=False, input_formats=['%Y-%m-%d'])
    hasta = forms.DateField(required=False, input_formats=['%Y-%m-%d'])

    def clean(self):
        cleaned_data = super().clean()
        desde = cleaned_data.get('desde')
        hasta = cleaned_data.get('hasta')
        if desde and hasta and desde > hasta:
            raise forms.ValidationError('La fecha "desde" no puede ser mayor que "hasta".')
        return cleaned_data
```








---








## novedades/ urls.py:

```python
from django.urls import path
from . import views

app_name = 'novedades'

urlpatterns = [
    # PERMISOS
    path('permisos/pendientes/', views.permisos_pendientes, name='permisos_pendientes'),
    path('permisos/historial/', views.permisos_historial, name='permisos_historial'),
    path('permisos/<int:pk>/', views.permiso_detalle, name='permiso_detalle'),
    path('permisos/<int:pk>/aprobar/', views.permiso_aprobar, name='permiso_aprobar'),
    path('permisos/<int:pk>/rechazar/', views.permiso_rechazar, name='permiso_rechazar'),

    # INCAPACIDADES
    path('incapacidades/pendientes/', views.incapacidades_pendientes, name='incapacidades_pendientes'),
    path('incapacidades/historial/', views.incapacidades_historial, name='incapacidades_historial'),
    path('incapacidades/<int:pk>/', views.incapacidad_detalle, name='incapacidad_detalle'),
    path('incapacidades/<int:pk>/aprobar/', views.incapacidad_aprobar, name='incapacidad_aprobar'),
    path('incapacidades/<int:pk>/rechazar/', views.incapacidad_rechazar, name='incapacidad_rechazar'),

    # CERTIFICADOS
    path('certificados/', views.certificados_lista, name='certificados_lista'),
]
```








---








## novedades/ views.py:

```python
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from django.utils import timezone
from .models import Permiso, Incapacidad, Certificado
from .forms import RechazoForm, CertificadoFiltroForm
from apps.usuarios.models import PerfilEmpleado
from .decorators import admin_required



# ---------- PERMISOS ----------
@login_required
@admin_required
def permisos_pendientes(request):
    """Lista todos los permisos en estado pendiente."""
    pendientes = Permiso.objects.filter(estado='pendiente').select_related('empleado__user')
    data = [
        {
            'id': p.id,
            'empleado': p.empleado.nombre_completo(),
            'empleado_id': p.empleado.id,
            'tipo': p.get_tipo_display(),
            'fecha_inicio': p.fecha_inicio.isoformat(),
            'fecha_fin': p.fecha_fin.isoformat(),
            'justificacion': p.justificacion,
            'fecha_solicitud': p.fecha_solicitud.isoformat(),
        }
        for p in pendientes
    ]
    return JsonResponse(data, safe=False)

@login_required
@admin_required
def permisos_historial(request):
    """Lista todos los permisos (historial). Puede filtrarse por estado, tipo, fechas."""
    qs = Permiso.objects.all().select_related('empleado__user')
    estado = request.GET.get('estado')
    tipo = request.GET.get('tipo')
    if estado:
        qs = qs.filter(estado=estado)
    if tipo:
        qs = qs.filter(tipo=tipo)
    qs = qs.order_by('-fecha_solicitud')
    data = [
        {
            'id': p.id,
            'empleado': p.empleado.nombre_completo(),
            'tipo': p.get_tipo_display(),
            'fecha_inicio': p.fecha_inicio.isoformat(),
            'fecha_fin': p.fecha_fin.isoformat(),
            'estado': p.get_estado_display(),
            'fecha_solicitud': p.fecha_solicitud.isoformat(),
            'decision_por': p.decision_por.username if p.decision_por else None,
            'motivo_rechazo': p.motivo_rechazo,
        }
        for p in qs
    ]
    return JsonResponse(data, safe=False)

@login_required
@admin_required
def permiso_detalle(request, pk):
    """Devuelve los detalles completos de un permiso específico."""
    try:
        p = Permiso.objects.select_related('empleado__user', 'decision_por').get(pk=pk)
    except Permiso.DoesNotExist:
        return JsonResponse({'error': 'Permiso no encontrado'}, status=404)

    data = {
        'id': p.id,
        'empleado': p.empleado.nombre_completo(),
        'empleado_id': p.empleado.id,
        'tipo': p.get_tipo_display(),
        'fecha_inicio': p.fecha_inicio.isoformat(),
        'fecha_fin': p.fecha_fin.isoformat(),
        'justificacion': p.justificacion,
        'nuevo_horario': p.nuevo_horario,
        'estado': p.get_estado_display(),
        'fecha_solicitud': p.fecha_solicitud.isoformat(),
        'decision_por': p.decision_por.username if p.decision_por else None,
        'decision_fecha': p.decision_fecha.isoformat() if p.decision_fecha else None,
        'motivo_rechazo': p.motivo_rechazo,
    }
    return JsonResponse(data)

@csrf_exempt
@login_required
@admin_required
def permiso_aprobar(request, pk):
    """Aprueba un permiso pendiente."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    try:
        p = Permiso.objects.get(pk=pk, estado='pendiente')
    except Permiso.DoesNotExist:
        return JsonResponse({'error': 'Permiso no encontrado o ya procesado'}, status=404)

    p.estado = 'aprobado'
    p.decision_por = request.user
    p.decision_fecha = timezone.now()
    p.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Permiso aprobado'})

@csrf_exempt
@login_required
@admin_required
def permiso_rechazar(request, pk):
    """Rechaza un permiso pendiente con motivo obligatorio."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        p = Permiso.objects.get(pk=pk, estado='pendiente')
    except Permiso.DoesNotExist:
        return JsonResponse({'error': 'Permiso no encontrado o ya procesado'}, status=404)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    form = RechazoForm(data)
    if not form.is_valid():
        return JsonResponse({'error': 'Motivo requerido', 'detalles': form.errors}, status=400)

    p.estado = 'rechazado'
    p.motivo_rechazo = form.cleaned_data['motivo']
    p.decision_por = request.user
    p.decision_fecha = timezone.now()
    p.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Permiso rechazado'})

# ---------- INCAPACIDADES ----------
@login_required
@admin_required
def incapacidades_pendientes(request):
    """Lista incapacidades pendientes."""
    pendientes = Incapacidad.objects.filter(estado='pendiente').select_related('empleado__user')
    data = [
        {
            'id': i.id,
            'empleado': i.empleado.nombre_completo(),
            'titulo': i.titulo,
            'descripcion': i.descripcion,
            'fecha_inicio': i.fecha_inicio.isoformat(),
            'fecha_fin': i.fecha_fin.isoformat(),
            'fecha_solicitud': i.fecha_solicitud.isoformat(),
        }
        for i in pendientes
    ]
    return JsonResponse(data, safe=False)

@login_required
@admin_required
def incapacidades_historial(request):
    """Historial de incapacidades (con filtros opcionales por estado, empleado)."""
    qs = Incapacidad.objects.all().select_related('empleado__user')
    estado = request.GET.get('estado')
    empleado = request.GET.get('empleado')
    if estado:
        qs = qs.filter(estado=estado)
    if empleado:
        qs = qs.filter(empleado__id=empleado)
    qs = qs.order_by('-fecha_solicitud')

    data = [
        {
            'id': i.id,
            'empleado': i.empleado.nombre_completo(),
            'titulo': i.titulo,
            'fecha_inicio': i.fecha_inicio.isoformat(),
            'fecha_fin': i.fecha_fin.isoformat(),
            'estado': i.get_estado_display(),
            'fecha_solicitud': i.fecha_solicitud.isoformat(),
            'decision_por': i.decision_por.username if i.decision_por else None,
            'motivo_rechazo': i.motivo_rechazo,
        }
        for i in qs
    ]
    return JsonResponse(data, safe=False)

@login_required
@admin_required
def incapacidad_detalle(request, pk):
    try:
        i = Incapacidad.objects.select_related('empleado__user', 'decision_por').get(pk=pk)
    except Incapacidad.DoesNotExist:
        return JsonResponse({'error': 'Incapacidad no encontrada'}, status=404)

    data = {
        'id': i.id,
        'empleado': i.empleado.nombre_completo(),
        'titulo': i.titulo,
        'descripcion': i.descripcion,
        'fecha_inicio': i.fecha_inicio.isoformat(),
        'fecha_fin': i.fecha_fin.isoformat(),
        'archivo': i.archivo.url if i.archivo else None,
        'estado': i.get_estado_display(),
        'fecha_solicitud': i.fecha_solicitud.isoformat(),
        'decision_por': i.decision_por.username if i.decision_por else None,
        'decision_fecha': i.decision_fecha.isoformat() if i.decision_fecha else None,
        'motivo_rechazo': i.motivo_rechazo,
    }
    return JsonResponse(data)

@csrf_exempt
@login_required
@admin_required
def incapacidad_aprobar(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    try:
        i = Incapacidad.objects.get(pk=pk, estado='pendiente')
    except Incapacidad.DoesNotExist:
        return JsonResponse({'error': 'Incapacidad no encontrada o ya procesada'}, status=404)

    i.estado = 'aprobada'
    i.decision_por = request.user
    i.decision_fecha = timezone.now()
    i.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Incapacidad aprobada'})

@csrf_exempt
@login_required
@admin_required
def incapacidad_rechazar(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        i = Incapacidad.objects.get(pk=pk, estado='pendiente')
    except Incapacidad.DoesNotExist:
        return JsonResponse({'error': 'Incapacidad no encontrada o ya procesada'}, status=404)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    form = RechazoForm(data)
    if not form.is_valid():
        return JsonResponse({'error': 'Motivo requerido', 'detalles': form.errors}, status=400)

    i.estado = 'rechazada'
    i.motivo_rechazo = form.cleaned_data['motivo']
    i.decision_por = request.user
    i.decision_fecha = timezone.now()
    i.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Incapacidad rechazada'})

# ---------- CERTIFICADOS ----------
@login_required
@admin_required
def certificados_lista(request):
    """Lista certificados con filtros (empleado, tipo, fechas)."""
    qs = Certificado.objects.all().select_related('empleado__user', 'generado_por')

    form = CertificadoFiltroForm(request.GET)
    if form.is_valid():
        data = form.cleaned_data
        if data.get('empleado'):
            qs = qs.filter(empleado__id=data['empleado'])
        if data.get('tipo'):
            qs = qs.filter(tipo=data['tipo'])
        if data.get('desde'):
            qs = qs.filter(fecha_emision__date__gte=data['desde'])
        if data.get('hasta'):
            qs = qs.filter(fecha_emision__date__lte=data['hasta'])

    qs = qs.order_by('-fecha_emision')
    data = [
        {
            'id': c.id,
            'empleado': c.empleado.nombre_completo(),
            'cargo': c.empleado.cargo,
            'tipo': c.get_tipo_display(),
            'fecha_emision': c.fecha_emision.isoformat(),
            'proposito': c.proposito,
            'generado_por': c.generado_por.username if c.generado_por else None,
            'descargas': c.descargas,
        }
        for c in qs
    ]
    return JsonResponse(data, safe=False)
```









---










## Creación de Novedades | frontend

Ya tenemos el backend listo (modelos, vistas, URLs, formularios y migraciones aplicadas). Ahora sí, podemos empezar a trabajar en la parte frontend: **static** y **templates**.

Agregaremos unas cuantas cosas antes de iniciar de lleno con el frontend.

En `apps/novedades/views.py` agrega:

```python
    from django.shortcuts import render
    from django.contrib.auth.decorators import login_required
    from .decorators import admin_api_required  # o admin_required si usas el de usuarios para HTML

    def novedades_admin(request):
        """Vista que renderiza el panel de novedades para administradores."""
        return render(request, 'admin/novedades.html')
```

En `apps/novedades/urls.py` agrega:

```python
    path('', views.novedades_admin, name='novedades_admin'),
```

En `config/urls.py` asegúrate de incluir las URLs de novedades:

```python
    path('novedades/', include('apps.novedades.urls')),
```

Con esto, al entrar a `/novedades/` se cargará el panel de novedades.

---

Ahora si empezamos a mover archivos (Los que se tenian en frontend anteriormente) los archivos estáticos a la carpeta `static/`

Tienes los archivos:
- `novedades.css`
- `novedades.js`
- `novedades.html` (el HTML base)

**Estructura:**

```
static/
├── css/
│   └── novedades.css  
├── js/
│   └── novedades.js   
```

**Templates:**

```
templates/
└── admin/
    └── novedades.html  
```

---

Ya como ultimo paso:

Adaptar el HTML para usar etiquetas `{% static %}`

En `templates/admin/novedades.html`, reemplaza las referencias a archivos estáticos:

**Antes:**
```html
<link rel="stylesheet" href="../Assets/novedades.css">
<script src="../Scripts/novedades.js"></script>
```

**Después:**
```html
{% load static %}
<link rel="stylesheet" href="{% static 'css/novedades.css' %}">
<script src="{% static 'js/novedades.js' %}"></script>
```
