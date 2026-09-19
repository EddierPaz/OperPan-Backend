from pathlib import Path
from django import http
import environ
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Variables de entorno ──────────────────────
# Se leen primero para que SECRET_KEY, DEBUG y las credenciales de correo
# vengan siempre del .env (nunca hardcodeadas en este archivo).
env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', default=True)

ALLOWED_HOSTS = []

# ── Apps ──────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'apps.usuarios',
    'apps.login',
    'apps.novedades',
    'apps.memorandos',
    'apps.asistencia',
    'apps.tareas',
]

# ── Middleware ────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.usuarios.middleware.VerificarEstadoCuentaMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# ── Templates ─────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ── Base de datos ─────────────────────────────

# db.sqlite3 -- Esta base de datos es la que se usa por defecto (óptima
# para trabajar desde Mac). Para producción/XAMPP, comenta este bloque
# y descomenta el bloque MySQL de abajo.

#DATABASES = {
#    "default": {
#        "ENGINE": "django.db.backends.sqlite3",
#        "NAME": BASE_DIR / "db.sqlite3",
#    }
#}

# XAMPP - únicamente funcional en Windows:
# Esta BD es mejor para nutrirla y es la verdad al momento de ejecutar producción

DATABASES = {
     'default': {
         'ENGINE': 'django.db.backends.mysql',
         'NAME': 'operpan',

         # root es el usuario por defecto en xampp:
             # En el cambio del 4/09/2026 - Modifique a usuario y contraseña por defecto
             # En vez de tener un usuario de OperPan y una contraseña debido a que muchas veces
             # Los computadores pueden tener atributos que alteran los privilegios de usuarios en xampp sobre las db
             # Por ende es mejor tenerlo asi para tener un mejor flujo de trabajo:
         'USER': 'root',

         # No tenemos contraseña para usar la por defecto
         'PASSWORD': 'Eddier2929*',
         'HOST': 'localhost',
         'PORT': '3306',
         'OPTIONS': {
             'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
         },
     }
 }

# ── Usuario personalizado ─────────────────────
AUTH_USER_MODEL = 'usuarios.User'

# ── Autenticación ─────────────────────────────
LOGIN_URL = 'login'
LOGIN_REDIRECT_URL = 'login'
LOGOUT_REDIRECT_URL = 'login'

# ── Contraseñas ───────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── Internacionalización ──────────────────────
LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

# ── Archivos estáticos ────────────────────────
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ── Archivos media ────────────────────────────
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ── PK por defecto ────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===============================
# CONFIGURACIÓN DE CORREO
# ===============================

# ===============================
# CONFIGURACIÓN DE CORREO
# ===============================

if DEBUG and not env.bool('EMAIL_BACKEND_REAL', default=False):
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True

EMAIL_HOST_USER = env('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')

DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

SITE_URL = env('SITE_URL', default='http://127.0.0.1:8000')