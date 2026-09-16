from django.db import migrations
from datetime import time


def actualizar_jornadas(apps, schema_editor):
    """
    Actualiza las horas de entrada y salida de todos los Horarios activos
    para que coincidan con las nuevas jornadas establecidas (15/09/2026):
        - Mañana: 04:00 - 14:00
        - Tarde:  13:30 - 23:00
        - Fijo:   08:00 - 17:00
    """
    Horario = apps.get_model('asistencia', 'Horario')

    nuevas_jornadas = {
        'MANANA': (time(4, 0), time(14, 0)),
        'TARDE': (time(13, 30), time(23, 0)),
        'FIJO': (time(8, 0), time(17, 0)),
    }

    for horario in Horario.objects.filter(estado=True):
        horas = nuevas_jornadas.get(horario.turno)
        if not horas:
            continue
        entrada, salida = horas
        horario.hora_entrada = entrada
        horario.hora_salida = salida
        horario.save(update_fields=['hora_entrada', 'hora_salida'])


def revertir_jornadas(apps, schema_editor):
    """
    Revertir a las jornadas anteriores (por si se necesita rollback).
    """
    Horario = apps.get_model('asistencia', 'Horario')

    jornadas_anteriores = {
        'MANANA': (time(5, 0), time(13, 0)),
        'TARDE': (time(13, 0), time(22, 0)),
        'FIJO': (time(8, 0), time(17, 0)),
    }

    for horario in Horario.objects.filter(estado=True):
        horas = jornadas_anteriores.get(horario.turno)
        if not horas:
            continue
        entrada, salida = horas
        horario.hora_entrada = entrada
        horario.hora_salida = salida
        horario.save(update_fields=['hora_entrada', 'hora_salida'])


class Migration(migrations.Migration):

    dependencies = [
        ('asistencia', '0005_asistencia_minutos_tarde'),
    ]

    operations = [
        migrations.RunPython(actualizar_jornadas, revertir_jornadas),
    ]