from datetime import date

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from apps.tareas.constants import UMBRAL_TAREAS_VENCIDAS_MEMORANDO
from apps.tareas.models import Task, EstadoTarea
from apps.memorandos.models import Memorando
from apps.memorandos.pdfs import generar_pdf_memorando


# ============================================================
# 1. DETECCIÓN DE TAREAS VENCIDAS SIN MEMORANDO
# ============================================================

def tareas_vencidas_sin_memorando(empleado):
    """
    Devuelve un queryset con las tareas del empleado que:
        - NO están finalizadas (PENDIENTE o EN_PROGRESO)
        - Su fecha/hora límite ya pasó (vencidas)
        - Aún NO están vinculadas a ningún memorando

    Ordenadas por fecha/hora límite ascendente (las más antiguas primero).
    """
    hoy = date.today()
    ahora = timezone.localtime(timezone.now()).time()

    return Task.objects.filter(
        empleado=empleado,
        memorando_generado__isnull=True,
        estado__in=[EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO],
    ).filter(
        Q(fecha_limite__lt=hoy) |
        Q(fecha_limite=hoy, hora_limite__lt=ahora)
    ).order_by('fecha_limite', 'hora_limite')


# ============================================================
# 2. CONSTRUCCIÓN DEL TEXTO DEL MEMORANDO
# ============================================================

def _construir_contenido(tareas):
    """
    Genera el cuerpo del memorando a partir de la lista de tareas
    vencidas que lo motivan.
    """
    lineas = [
        "Por medio del presente se le informa que ha acumulado "
        f"{len(tareas)} tareas vencidas sin completar, lo cual "
        "contraviene los lineamientos operativos establecidos por "
        "la empresa.",
        "",
        "Tareas vencidas que motivan este memorando:",
        "",
    ]

    for t in tareas:
        hora = t.hora_limite.strftime('%H:%M') if t.hora_limite else '—'
        lineas.append(
            f"  • [{t.fecha_limite} {hora}] {t.titulo} "
            f"(Prioridad: {t.get_prioridad_display()})"
        )

    lineas += [
        "",
        "Se le solicita tomar las acciones necesarias para ponerse al "
        "día con sus responsabilidades a la brevedad posible.",
        "",
        "Atentamente,",
        "Gerencia — OperPan",
    ]

    return "\n".join(lineas)


# ============================================================
# 3. EMISIÓN DEL MEMORANDO
# ============================================================

def emitir_memorando_automatico(empleado, tareas):
    """
    Crea el Memorando, lo vincula a las tareas y genera el PDF.

    Parámetros:
        empleado : PerfilEmpleado dueño de las tareas vencidas.
        tareas   : lista de Task (ya materializada) que motivan el memo.

    Retorna:
        El Memorando creado.
    """
    # ----------------------------------------------------------
    # a) Crear el Memorando y vincular las tareas (atómico)
    # ----------------------------------------------------------
    with transaction.atomic():
        memorando = Memorando.objects.create(
            empleado=empleado,
            tipo='llamado_atencion',
            asunto=f'Acumulación de {len(tareas)} tareas vencidas',
            contenido=_construir_contenido(tareas),
            generado_por=None,  # None = generado por el sistema
        )

        # Usamos .update() en vez de .save() por tarea para:
        #   1. Evitar re-ejecutar Task.full_clean() (que valida el rango
        #      horario del empleado y podría fallar para tareas históricas).
        #   2. Hacerlo en un solo UPDATE.
        Task.objects.filter(
            pk__in=[t.pk for t in tareas]
        ).update(memorando_generado=memorando)

    # ----------------------------------------------------------
    # b) Generar el PDF (misma función que usa la vista manual)
    # ----------------------------------------------------------
    try:
        pdf_path = generar_pdf_memorando(memorando)
        memorando.archivo_pdf = pdf_path
        memorando.save(update_fields=['archivo_pdf'])
    except Exception as e:
        # El memorando ya está creado; solo logueamos el fallo de PDF.
        print(f"[memorandos.services] Error generando PDF del "
              f"memorando {memorando.pk}: {e}")

    return memorando


# ============================================================
# 4. PUNTO DE ENTRADA
# ============================================================

def verificar_y_generar_memorando(empleado):
    """
    Revisa si el empleado acumuló suficientes tareas vencidas para
    disparar un memorando. Si es así, lo emite y devuelve el objeto;
    si no, devuelve None.

    Es idempotente: una tarea ya vinculada a un memorando no vuelve a
    contar. Por lo tanto:
        - 3 vencidas sin memo  → 1 memorando (con esas 3)
        - 6 vencidas sin memo  → 1 memorando (con las 3 más antiguas);
                                  al siguiente llamado, otro memo con
                                  las 3 restantes.
    """
    vencidas = list(tareas_vencidas_sin_memorando(empleado))

    if len(vencidas) < UMBRAL_TAREAS_VENCIDAS_MEMORANDO:
        return None

    tareas_a_incluir = vencidas[:UMBRAL_TAREAS_VENCIDAS_MEMORANDO]
    return emitir_memorando_automatico(empleado, tareas_a_incluir)