# apps/asistencia/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.usuarios.models import PerfilEmpleado
from .models import Horario
from .services.horario_service import primer_dia_del_mes, ultimo_dia_del_mes, _generar_descansos_ciclo
from django.utils import timezone
from datetime import datetime, timedelta

@receiver(post_save, sender=PerfilEmpleado)
def crear_horario_automatico(sender, instance, created, **kwargs):
    estado_str = str(getattr(instance, 'estado', '')).lower()
    es_activo = estado_str in ['activo', 'true', '1'] or getattr(instance, 'estado', False) is True

    if es_activo:
        if not Horario.objects.filter(empleado=instance, estado=True).exists():
            hoy = timezone.localdate()
            turno = getattr(instance, 'turno_inicial', 'MANANA')
            
            if turno == "MANANA":
                entrada = datetime.strptime("04:00", "%H:%M").time()
                salida = datetime.strptime("14:00", "%H:%M").time()
                dia_fijo = None
            elif turno == "TARDE":
                entrada = datetime.strptime("13:30", "%H:%M").time()
                salida = datetime.strptime("22:00", "%H:%M").time()
                dia_fijo = None
            else: # FIJO
                entrada = datetime.strptime("08:00", "%H:%M").time()
                salida = datetime.strptime("17:00", "%H:%M").time()
                dia_fijo = 5 # Por defecto Sábado

            horario = Horario.objects.create(
                empleado=instance,
                turno=turno,
                hora_entrada=entrada,
                hora_salida=salida,
                estado=True,
                fecha_inicio=hoy,
                fecha_fin=ultimo_dia_del_mes(hoy),
                ciclo_inicio=primer_dia_del_mes(hoy),
                es_generado_automaticamente=True,
                dia_descanso_semana=dia_fijo
            )
            
            if turno == "FIJO":
                # Si es FIJO, la función ya sabe qué día asignar gracias a dia_descanso_semana
                _generar_descansos_ciclo(horario, es_primer_ciclo=True)
            else:
                # Si es MAÑANA/TARDE, le asignamos el próximo sábado como primer descanso
                dias_hasta = (5 - hoy.weekday()) % 7
                if dias_hasta == 0: dias_hasta = 7
                proximo_descanso = hoy + timedelta(days=dias_hasta)
                _generar_descansos_ciclo(horario, es_primer_ciclo=True, fecha_manual=proximo_descanso)