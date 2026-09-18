"""
Servicios de la app `memorandos` para ASISTENCIA.

Detecta y emite memorandos automáticos por:
    - Acumulación de TARDANZAS en el mismo mes calendario.
    - Acumulación de AUSENCIAS en el mismo mes calendario.

Reglas:
    - Tardanzas: Asistencia con estado='TARDE' del mes.
    - Ausencias: días donde el empleado tenía horario vigente y no marcó,
      excluyendo descansos, permisos, incapacidades y cambios de turno.
    - Umbral: 3 por mes (configurable en apps/asistencia/constants.py).
    - Idempotente: usa el campo `memorando_generado` en Asistencia.
"""

from datetime import date, timedelta

from django.db import transaction
from django.utils import timezone

from apps.asistencia.constants import (
    UMBRAL_TARDANZAS_MEMORANDO,
    UMBRAL_AUSENCIAS_MEMORANDO,
)
from apps.asistencia.models import Asistencia, Horario, DescansoEmpleado
from apps.asistencia.services.novedades_calendario import (
    obtener_novedades_por_fecha,
)
from apps.asistencia.services.horario_service import ciclo_fin

from ..models import Memorando
from ..pdfs import generar_pdf_memorando


MESES_ES = [
    '', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]


# ============================================================
# UTILIDADES
# ============================================================

def _rango_mes(mes, anio, solo_hasta_ayer=True):
    """
    Devuelve (inicio, fin) del mes solicitado. Si solo_hasta_ayer=True,
    el fin se recorta a ayer (no cuenta el día actual).
    Devuelve (None, None) si el rango es inválido.
    """
    inicio = date(anio, mes, 1)
    if mes == 12:
        fin = date(anio + 1, 1, 1) - timedelta(days=1)
    else:
        fin = date(anio, mes + 1, 1) - timedelta(days=1)

    if solo_hasta_ayer:
        fin = min(fin, timezone.localdate() - timedelta(days=1))

    if inicio > fin:
        return None, None

    return inicio, fin


def _construir_contenido(empleado, mes, anio, asistencias, tipo_novedad):
    """Genera el cuerpo del memorando para tardanzas o ausencias."""
    nombre_mes = MESES_ES[mes]

    if tipo_novedad == 'TARDE':
        intro = (
            f"acumulado {len(asistencias)} tardanzas durante el mes de "
            f"{nombre_mes} de {anio}"
        )
        detalle_titulo = "Tardanzas registradas:"
    else:
        intro = (
            f"acumulado {len(asistencias)} ausencias durante el mes de "
            f"{nombre_mes} de {anio}"
        )
        detalle_titulo = "Ausencias registradas:"

    lineas = [
        f"Por medio del presente se le informa que ha {intro}, lo cual "
        "contraviene los lineamientos operativos establecidos por la empresa.",
        "",
        detalle_titulo,
        "",
    ]

    for a in asistencias:
        hora = a.hora_marcada.strftime('%H:%M') if a.hora_marcada else '—'
        lineas.append(f"  • {a.fecha.strftime('%d/%m/%Y')} — {hora}")

    lineas += [
        "",
        "Se le solicita tomar las acciones necesarias para corregir esta "
        "situación a la brevedad posible.",
        "",
        "Atentamente,",
        "Gerencia — OperPan",
    ]

    return "\n".join(lineas)


# ============================================================
# EMISIÓN DEL MEMORANDO
# ============================================================

def _emitir_memorando_asistencia(empleado, mes, anio, asistencias, tipo_novedad):
    """Crea el Memorando, lo vincula a las asistencias, genera el PDF."""
    nombre_mes = MESES_ES[mes]

    if tipo_novedad == 'TARDE':
        asunto = f'Acumulación de {len(asistencias)} tardanzas ({nombre_mes} {anio})'
    else:
        asunto = f'Acumulación de {len(asistencias)} ausencias ({nombre_mes} {anio})'

    contenido = _construir_contenido(
        empleado, mes, anio, asistencias, tipo_novedad
    )

    with transaction.atomic():
        memorando = Memorando.objects.create(
            empleado=empleado,
            tipo='llamado_atencion',
            asunto=asunto,
            contenido=contenido,
            generado_por=None,
        )

        Asistencia.objects.filter(
            pk__in=[a.pk for a in asistencias]
        ).update(memorando_generado=memorando)

    try:
        pdf_path = generar_pdf_memorando(memorando)
        memorando.archivo_pdf = pdf_path
        memorando.save(update_fields=['archivo_pdf'])
    except Exception as e:
        print(
            f"[memorandos.asistencia] Error generando PDF del "
            f"memorando {memorando.pk}: {e}"
        )

    return memorando


# ============================================================
# TARDANZAS
# ============================================================

def _detectar_tardanzas_mes(empleado, mes, anio):
    """Lista de Asistencia TARDE del mes sin memorando previo."""
    return list(
        Asistencia.objects.filter(
            horario__empleado=empleado,
            estado='TARDE',
            memorando_generado__isnull=True,
            fecha__year=anio,
            fecha__month=mes,
        ).order_by('fecha')
    )


def verificar_tardanzas_empleado(empleado, mes=None, anio=None):
    """
    Revisa las tardanzas del mes indicado (por defecto el actual).
    Si hay >= UMBRAL sin memorando, emite uno. Devuelve el Memorando o None.
    """
    hoy = timezone.localdate()
    mes = mes or hoy.month
    anio = anio or hoy.year

    tardanzas = _detectar_tardanzas_mes(empleado, mes, anio)

    if len(tardanzas) < UMBRAL_TARDANZAS_MEMORANDO:
        return None

    a_incluir = tardanzas[:UMBRAL_TARDANZAS_MEMORANDO]
    return _emitir_memorando_asistencia(
        empleado, mes, anio, a_incluir, tipo_novedad='TARDE'
    )


# ============================================================
# AUSENCIAS
# ============================================================

def _materializar_ausencias_mes(empleado, mes, anio):
    """
    Recorre el mes día a día y crea registros Asistencia(estado='AUSENTE')
    para los días donde:
        - El empleado tenía horario vigente.
        - No hay registro previo de Asistencia.
        - No es día de descanso.
        - No tiene permiso/incapacidad/cambio_turno aprobado.
        - Ya pasó (fecha < hoy).
    Devuelve la lista de Asistencia AUSENTE del mes sin memorando.
    """
    inicio, fin = _rango_mes(mes, anio, solo_hasta_ayer=True)
    if inicio is None:
        return []

    horarios = list(
        Horario.objects.filter(empleado=empleado, ciclo_inicio__isnull=False)
    )
    if not horarios:
        return []

    descansos_fechas = set(
        DescansoEmpleado.objects.filter(
            horario__empleado=empleado,
            fecha__range=(inicio, fin),
            es_descanso=True,
        ).values_list('fecha', flat=True)
    )

    novedades = obtener_novedades_por_fecha(empleado, inicio, fin)

    asistencias_existentes = set(
        Asistencia.objects.filter(
            horario__empleado=empleado,
            fecha__range=(inicio, fin),
        ).values_list('fecha', flat=True)
    )

    cursor = inicio
    while cursor <= fin:
        horario_dia = None
        for h in horarios:
            cf = ciclo_fin(h)
            if h.ciclo_inicio <= cursor and (cf is None or cursor <= cf):
                horario_dia = h
                break

        if horario_dia is None:
            cursor += timedelta(days=1)
            continue

        if cursor in asistencias_existentes:
            cursor += timedelta(days=1)
            continue

        if cursor in descansos_fechas:
            cursor += timedelta(days=1)
            continue

        if cursor in novedades:
            cursor += timedelta(days=1)
            continue

        Asistencia.objects.get_or_create(
            horario=horario_dia,
            fecha=cursor,
            defaults={'estado': 'AUSENTE', 'hora_marcada': None},
        )

        cursor += timedelta(days=1)

    return list(
        Asistencia.objects.filter(
            horario__empleado=empleado,
            estado='AUSENTE',
            memorando_generado__isnull=True,
            fecha__year=anio,
            fecha__month=mes,
        ).order_by('fecha')
    )


def verificar_ausencias_empleado(empleado, mes=None, anio=None):
    """
    Revisa las ausencias del mes indicado (por defecto el actual).
    Materializa las ausencias primero, luego emite memorando si >= umbral.
    """
    hoy = timezone.localdate()
    mes = mes or hoy.month
    anio = anio or hoy.year

    ausencias = _materializar_ausencias_mes(empleado, mes, anio)

    if len(ausencias) < UMBRAL_AUSENCIAS_MEMORANDO:
        return None

    a_incluir = ausencias[:UMBRAL_AUSENCIAS_MEMORANDO]
    return _emitir_memorando_asistencia(
        empleado, mes, anio, a_incluir, tipo_novedad='AUSENTE'
    )


# ============================================================
# ORQUESTADOR
# ============================================================

def verificar_memorandos_asistencia(empleado, mes=None, anio=None):
    """
    Ejecuta tardanzas + ausencias del mes actual (o el indicado).
    Devuelve dict con los memorandos creados (o None si no calificó).
    """
    return {
        'tardanzas': verificar_tardanzas_empleado(empleado, mes, anio),
        'ausencias': verificar_ausencias_empleado(empleado, mes, anio),
    }