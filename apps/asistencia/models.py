from django.db import models
from apps.usuarios.models import PerfilEmpleado


class Horario(models.Model):

    TURNOS = [
        ('MANANA', 'Mañana'),
        ('TARDE', 'Tarde'),
        ('FIJO', 'Fijo'),
    ]

    empleado = models.ForeignKey(
        PerfilEmpleado,
        on_delete=models.CASCADE
    )

    turno = models.CharField(
        max_length=10,
        choices=TURNOS
    )

    hora_entrada = models.TimeField()
    hora_salida = models.TimeField()

    dias_laborales = models.JSONField(
        default=list
    )

    descanso = models.DateField(
        null=True,
        blank=True
    )

    estado = models.BooleanField(
        default=True
    )

    def __str__(self):
        return f"{self.empleado} - {self.get_turno_display()}"