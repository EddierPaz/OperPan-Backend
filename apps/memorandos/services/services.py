from datetime import date

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from apps.funciones.constants import UMBRAL_FUNCIONES_VENCIDAS_MEMORANDO
from apps.funciones.models import Funcion, EstadoFuncion
from apps.memorandos.models import Memorando
from apps.memorandos.pdfs import generar_pdf_memorando


# ============================================================
# 1. DETECCIÃ“N DE FUNCIONES VENCIDAS SIN MEMORANDO
# ============================================================

def funciones_vencidas_sin_memorando(empleado):
    """
    Devuelve un queryset con las funciones del empleado que:
        - NO están finalizadas (PENDIENTE o EN_PROGRESO)
        - Su fecha/hora límite ya pasó (vencidas)
        - Aún NO están vinculadas a ningún memorando

    Ordenadas por fecha/hora límite ascendente (las más antiguas primero).
    """
    # --- INICIO DEL GUARDIÁN (Fase 1) ---
    # Si el empleado NO está activo (ej. está retirado), devolvemos un QuerySet vacío.
    if empleado.estado != 'activo':
        return Funcion.objects.none()
    # --- FIN DEL GUARDIÁN ---

    hoy = date.today()
    ahora = timezone.localtime(timezone.now()).time()

    return Funcion.objects.filter(
        empleado=empleado,
        memorando_generado__isnull=True,
        estado__in=[EstadoFuncion.PENDIENTE, EstadoFuncion.EN_PROGRESO],
    ).filter(
        Q(fecha_limite__lt=hoy) |
        Q(fecha_limite=hoy, hora_limite__lt=ahora)
    ).order_by('fecha_limite', 'hora_limite')


# ============================================================
# 2. CONSTRUCCIÃ“N DEL TEXTO DEL MEMORANDO
# ============================================================

def _construir_contenido(funciones):
    """
    Genera el cuerpo del memorando a partir de la lista de funciones
    vencidas que lo motivan.
    """
    lineas = [
        "Por medio del presente se le informa que ha acumulado "
        f"{len(funciones)} funciones vencidas sin completar, lo cual "
        "contraviene los lineamientos operativos establecidos por "
        "la empresa.",
        "",
        "Funciones vencidas que motivan este memorando:",
        "",
    ]

    for t in funciones:
        hora = t.hora_limite.strftime('%H:%M') if t.hora_limite else 'â€”'
        lineas.append(
            f"  â€¢ [{t.fecha_limite} {hora}] {t.titulo} "
            f"(Prioridad: {t.get_prioridad_display()})"
        )

    lineas += [
        "",
        "Se le solicita tomar las acciones necesarias para ponerse al "
        "día con sus responsabilidades a la brevedad posible.",
        "",
        "Atentamente,",
        "Gerencia â€” OperPan",
    ]

    return "\n".join(lineas)


# ============================================================
# 3. EMISIÃ“N DEL MEMORANDO
# ============================================================

def emitir_memorando_automatico(empleado, funciones):
    """
    Crea el Memorando, lo vincula a las funciones y genera el PDF.

    Parámetros:
        empleado : PerfilEmpleado dueño de las funciones vencidas.
        funciones   : lista de Funcion (ya materializada) que motivan el memo.

    Retorna:
        El Memorando creado.
    """
    # ----------------------------------------------------------
    # a) Crear el Memorando y vincular las funciones (atómico)
    # ----------------------------------------------------------
    with transaction.atomic():
        memorando = Memorando.objects.create(
            empleado=empleado,
            tipo='llamado_atencion',
            asunto=f'Acumulación de {len(funciones)} funciones vencidas',
            contenido=_construir_contenido(funciones),
            generado_por=None,  # None = generado por el sistema
        )

        # Usamos .update() en vez de .save() por funcion para:
        #   1. Evitar re-ejecutar Funcion.full_clean() (que valida el rango
        #      horario del empleado y podría fallar para funciones históricas).
        #   2. Hacerlo en un solo UPDATE.
        Funcion.objects.filter(
            pk__in=[t.pk for t in funciones]
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
    Revisa si el empleado acumuló suficientes funciones vencidas para
    disparar un memorando. Si es así, lo emite y devuelve el objeto;
    si no, devuelve None.
    """
    # --- INICIO DEL ARREGLO (FASE 1) ---
    # Validar que el empleado esté activo antes de generar memorandos
    if empleado.estado != 'activo': 
        return None
    # --- FIN DEL ARREGLO ---

    vencidas = list(funciones_vencidas_sin_memorando(empleado))

    if len(vencidas) < UMBRAL_FUNCIONES_VENCIDAS_MEMORANDO:
        return None

    funciones_a_incluir = vencidas[:UMBRAL_FUNCIONES_VENCIDAS_MEMORANDO]
    return emitir_memorando_automatico(empleado, funciones_a_incluir)
