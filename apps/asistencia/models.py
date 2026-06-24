from django.db import models
from apps.usuarios.models import PerfilEmpleado


class Horario(models.Model):

    TURNOS = (
        ('MANANA', 'Mañana'),
        ('TARDE', 'Tarde'),
        ('FIJO', 'Fijo'),
    )

    empleado = models.ForeignKey(
        PerfilEmpleado,
        on_delete=models.CASCADE,
        related_name='horarios'
    )

    turno = models.CharField(
        max_length=10,
        choices=TURNOS
    )

    hora_entrada = models.TimeField()

    hora_salida = models.TimeField()

    estado = models.BooleanField(
        default=True
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.get_turno_display()}"


class DescansoEmpleado(models.Model):

    horario = models.ForeignKey(
        Horario,
        on_delete=models.CASCADE,
        related_name='descansos'
    )

    fecha = models.DateField()

    es_descanso = models.BooleanField(
        default=True
    )

    class Meta:
        unique_together = (
            'horario',
            'fecha'
        )

    def __str__(self):
        return f"{self.horario.empleado.nombre_completo()} - {self.fecha}"