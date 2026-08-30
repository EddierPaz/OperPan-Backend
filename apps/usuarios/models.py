from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):

    ROLES = (
        ('admin', 'Administrador'),
        ('empleado', 'Empleado'),
    )

    # --- NUEVO: estados de cuenta (fuente de verdad de negocio para el acceso) ---
    class EstadoCuenta(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        ACTIVA = 'ACTIVA', 'Activa'
        SUSPENDIDA = 'SUSPENDIDA', 'Suspendida'
        INACTIVA = 'INACTIVA', 'Inactiva'

    rol = models.CharField(
        max_length=20,
        choices=ROLES,
        default='empleado'
    )

    # --- NUEVOS CAMPOS ---
    estado_cuenta = models.CharField(
        max_length=20,
        choices=EstadoCuenta.choices,
        default=EstadoCuenta.PENDIENTE
    )

    debe_cambiar_password = models.BooleanField(
        default=True
    )

    fecha_primer_acceso = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Se registra la primera vez que el usuario completa su cambio de contraseña obligatorio."
    )

    # --- Mapa de sincronización estado_cuenta -> is_active ---
    # Única dirección permitida (RN-CT-07): nadie debe asignar is_active a mano en ningún form/vista.
    ESTADOS_QUE_PERMITEN_ACCESO = {EstadoCuenta.PENDIENTE, EstadoCuenta.ACTIVA}

    def save(self, *args, **kwargs):
        # is_active se recalcula siempre a partir de estado_cuenta, nunca al revés.
        self.is_active = self.estado_cuenta in self.ESTADOS_QUE_PERMITEN_ACCESO
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"


class PerfilEmpleado(models.Model):

    TIPOS_DOCUMENTO = (
        ('CC', 'Cédula de Ciudadanía'),
        ('CE', 'Cédula de Extranjería'),
        ('TI', 'Tarjeta de Identidad'),
        ('PA', 'Pasaporte'),
    )

    GENEROS = (
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    )

    ESTADOS_CIVILES = (
        ('soltero', 'Soltero'),
        ('casado', 'Casado'),
        ('union_libre', 'Unión Libre'),
        ('divorciado', 'Divorciado'),
        ('viudo', 'Viudo'),
    )

    TIPOS_SANGRE = (
        ('O+', 'O+'),
        ('O-', 'O-'),
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
    )

    CARGOS = (
        ('mesero', 'Mesero'),
        ('cajero', 'Cajero'),
        ('pastelero', 'Pastelero'),
        ('panadero', 'Panadero'),
        ('cocina', 'Cocina'),
        ('buñuelero', 'Buñuelero'),
        ('greca', 'Greca'),
    )

    # --- MODIFICADO: se quita 'suspendido'. Este campo ahora es SOLO estado laboral. ---
    ESTADOS = (
        ('activo', 'Activo'),
        ('retirado', 'Retirado'),
    )

    # Relación con usuario

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='perfil'
    )

    # DATOS PERSONALES

    primer_nombre = models.CharField(max_length=50)

    segundo_nombre = models.CharField(
        max_length=50,
        blank=True
    )

    primer_apellido = models.CharField(max_length=50)

    segundo_apellido = models.CharField(
        max_length=50,
        blank=True
    )

    tipo_documento = models.CharField(
        max_length=2,
        choices=TIPOS_DOCUMENTO
    )

    numero_documento = models.CharField(
        max_length=20,
        unique=True
    )

    fecha_nacimiento = models.DateField(
        null=True,
        blank=True
    )

    genero = models.CharField(
        max_length=1,
        choices=GENEROS,
        blank=True
    )

    estado_civil = models.CharField(
        max_length=20,
        choices=ESTADOS_CIVILES,
        blank=True,
        null=True
    )

    tipo_sangre = models.CharField(
        max_length=3,
        choices=TIPOS_SANGRE,
        blank=True,
        null=True    
    )

    telefono = models.CharField(max_length=20)

    correo = models.EmailField()

    ciudad = models.CharField(max_length=100)

    direccion = models.CharField(
        max_length=200,
        blank=True,
        null=True)

    contacto_emergencia = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )
    
    parentesco_emergencia = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    telefono_emergencia = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    # DATOS LABORALES

    cargo = models.CharField(
        max_length=50,
        choices=CARGOS,
        blank=True,
        null=True
    )

    fecha_ingreso = models.DateField(
        blank=True,
        null=True
    )

    eps = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    arl = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    fondo_pension = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='activo'
    )

    # FECHAS DEL SISTEMA

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True
    )

    def nombre_completo(self):
        return (
            f"{self.primer_nombre} "
            f"{self.segundo_nombre} "
            f"{self.primer_apellido} "
            f"{self.segundo_apellido}"
        ).strip()

    def __str__(self):
        return  f'{self.nombre_completo()} {self.cargo}'


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    creado = models.DateTimeField(auto_now_add=True)
    usado = models.BooleanField(default=False)

    def es_valido(self):
        vencimiento = self.creado + timedelta(hours=1)
        return not self.usado and timezone.now() < vencimiento


# --- NUEVO: modelo de auditoría (sección S del análisis) ---
class RegistroAuditoriaCuenta(models.Model):

    class Accion(models.TextChoices):
        CREACION = 'CREACION', 'Creación de cuenta'
        PRIMER_ACCESO = 'PRIMER_ACCESO', 'Primer acceso completado'
        SUSPENSION = 'SUSPENSION', 'Suspensión'
        REACTIVACION = 'REACTIVACION', 'Reactivación'
        RETIRO = 'RETIRO', 'Retiro'
        REACTIVACION_RETIRO = 'REACTIVACION_RETIRO', 'Reactivación por reingreso'
        CAMBIO_ROL = 'CAMBIO_ROL', 'Cambio de rol'
        RESET_PASSWORD = 'RESET_PASSWORD', 'Restablecimiento de contraseña'

    usuario_afectado = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='eventos_como_afectado'
    )
    username_afectado = models.CharField(max_length=150)

    ejecutado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='eventos_ejecutados'
    )
    username_ejecutor = models.CharField(max_length=150, blank=True)

    accion = models.CharField(max_length=30, choices=Accion.choices)
    estado_anterior = models.CharField(max_length=30, blank=True)
    estado_nuevo = models.CharField(max_length=30, blank=True)
    motivo = models.TextField(blank=True)

    memorando_consecutivo = models.CharField(
        max_length=20,
        blank=True,
        help_text="Consecutivo del memorando relacionado, si aplica (ej. MEM-2026-003). No es una FK para evitar acoplar las apps usuarios/memorandos."
    )

    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_hora']

    def __str__(self):
        return f"{self.get_accion_display()} - {self.username_afectado} ({self.fecha_hora:%Y-%m-%d %H:%M})"