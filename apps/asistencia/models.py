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

    fecha_inicio = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha en que inicia la asignación del horario."
    )

    fecha_fin = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha en que finaliza la asignación del horario."
    )

    ciclo_inicio = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha en que arrancó el ciclo vigente de este horario."
    )

    # =====================================================
    # CAMPOS NUEVOS - GENERACIÓN AUTOMÁTICA DE CICLOS
    # =====================================================

    ciclo_anterior = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='ciclos_siguientes',
        help_text="Ciclo (Horario) del cual este es la continuación automática."
    )

    es_ciclo_cerrado = models.BooleanField(
        default=False,
        help_text="True cuando este ciclo ya venció y fue reemplazado por el siguiente."
    )

    es_generado_automaticamente = models.BooleanField(
        default=False,
        help_text="True si este Horario fue creado por el sistema (no manualmente por el admin)."
    )

    dia_descanso_semana = models.IntegerField(
        null=True,
        blank=True,
        help_text="0=Lunes...6=Domingo. Solo aplica a turno FIJO: el día de descanso "
                   "se repite siempre en este día de la semana en cada ciclo."
    )

    def __str__(self):
        return f"{self.empleado.nombre_completo()} - {self.get_turno_display()}"

    def tiene_asistencia_registrada(self):
        """
        True si este horario ya tiene al menos un registro de asistencia
        asociado. Se usa para impedir eliminarlo (perdería trazabilidad
        de la asistencia ya marcada).
        """
        return self.asistencias.exists()


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

    fue_generado_automaticamente = models.BooleanField(
        default=False,
        help_text="True si esta fecha de descanso fue calculada por el sistema "
                   "al generar un nuevo ciclo automáticamente."
    )

    class Meta:
        unique_together = (
            'horario',
            'fecha'
        )

    def __str__(self):
        return f"{self.horario.empleado.nombre_completo()} - {self.fecha}"


class Asistencia(models.Model):

    ESTADOS = (
        ('PRESENTE', 'Presente'),
        ('TARDE', 'Tarde'),
        ('AUSENTE', 'Ausente'),
    )

    horario = models.ForeignKey(
        Horario,
        on_delete=models.CASCADE,
        related_name='asistencias'
    )

    fecha = models.DateField()

    estado = models.CharField(
        max_length=10,
        choices=ESTADOS,
        null=True,
        blank=True
    )

    hora_marcada = models.TimeField(
        null=True,
        blank=True
    )

    fecha_registro = models.DateTimeField(
        auto_now=True
    )

    # ------------------------------------------------------------------
    # NUEVO: vínculo al memorando generado automáticamente cuando esta
    # asistencia (TARDE o AUSENTE) formó parte de una acumulación
    # >= umbral en el mismo mes calendario.
    # Si esta asistencia nunca disparó un memorando, queda en NULL.
    # Se usa referencia por string 'memorandos.Memorando' para evitar
    # import circular.
    # ------------------------------------------------------------------
    memorando_generado = models.ForeignKey(
        'memorandos.Memorando',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='asistencias_origen',
        help_text='Memorando generado automáticamente por acumulación '
                  'de tardanzas o ausencias.'
    )

    class Meta:
        unique_together = (
            'horario',
            'fecha'
        )

    def __str__(self):
        return (
            f"{self.horario.empleado.nombre_completo()} - {self.fecha} - "
            f"{self.get_estado_display() if self.estado else 'Sin marcar'}"
        )