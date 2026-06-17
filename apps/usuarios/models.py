from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):

    ROLES = (
        ('admin', 'Administrador'),
        ('empleado', 'Empleado'),
    )

    rol = models.CharField(
        max_length=20,
        choices=ROLES,
        default='empleado'
    )

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

    ESTADOS = (
        ('activo', 'Activo'),
        ('suspendido', 'Suspendido'),
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