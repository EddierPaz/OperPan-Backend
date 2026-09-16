# =============================================================================
# IMPORTS ESTÁNDAR DE PYTHON
# =============================================================================
from datetime import date, timedelta, datetime   # Manejo de fechas y horas
import json

# =============================================================================
# IMPORTS DE DJANGO CORE
# =============================================================================
from django.contrib import messages                     # Mensajes flash (notificaciones)
from django.contrib.auth.decorators import login_required   # Decorador para vistas protegidas
from django.db.models import Q                          # Consultas complejas (OR, AND)
from django.http import JsonResponse                    # Respuestas JSON para AJAX
from django.shortcuts import get_object_or_404, redirect, render   # Atajos de renderizado
from django.template.loader import render_to_string     # Renderizar templates a string (para AJAX)
from django.urls import reverse                         # Generar URLs inversas
from django.utils import timezone                       # Zona horaria y fechas locales

# =============================================================================
# IMPORTS DE APPS DEL PROYECTO
# =============================================================================
from apps.usuarios.models import PerfilEmpleado         # Modelo de empleado
from apps.usuarios.decorators import admin_required     # Decorador para restringir a admin
from apps.notificaciones.utils import enviar_notificacion, obtener_correo_admin  # Envío de emails

# Modelos locales
from .models import Asistencia, DescansoEmpleado, Horario

# Servicio de horarios: ciclos automáticos (creación/cierre), cálculos de
# vigencia y calendario. Toda la lógica de fechas de ciclo vive aquí ahora,
# no en este archivo.
from .services.horario_service import (
    dias_ciclo,
    ciclo_fin,
    estado_vigencia_horario,
    construir_calendario,
    obtener_o_generar_horario_vigente,
)

# Fin de importaciones:


# =============================================================================
# HELPERS DE ASISTENCIA (15/09/2026)
# =============================================================================

def formatear_tardanza(minutos):
    """
    Formatea minutos de tardanza en algo legible:
        15  → '15 min'
        60  → '1h'
        400 → '6h 40min'
    """
    if minutos is None:
        return None
    if minutos < 60:
        return f"{minutos} min"
    horas = minutos // 60
    mins = minutos % 60
    if mins == 0:
        return f"{horas}h"
    return f"{horas}h {mins}min"


def calcular_estado_y_minutos(horario, hora_marcada):
    """
    Calcula el estado y los minutos de tardanza al marcar asistencia.

    Reglas (15/09/2026):
        - Marcó dentro de los primeros 30 min desde la entrada
          → PRESENTE, sin minutos de tardanza.
        - Marcó después de 30 min
          → TARDE, con los minutos exactos de tardanza.

    Devuelve una tupla (estado, minutos_tarde).
    """
    entrada_dt = datetime.combine(date.today(), horario.hora_entrada)
    marcada_dt = datetime.combine(date.today(), hora_marcada)
    diferencia_minutos = int((marcada_dt - entrada_dt).total_seconds() / 60)

    if diferencia_minutos <= 30:
        return "PRESENTE", None
    else:
        return "TARDE", diferencia_minutos


def generar_ausentes_pendientes(dias_atras=30):
    """
    Genera registros AUSENTE para días pasados sin marcado (generación lazy).

    Recorre los últimos `dias_atras` días. Por cada día pasado donde el
    empleado tenía horario vigente y no era descanso, si no existe un
    registro de Asistencia, lo crea con estado=AUSENTE.

    - No toca el día de hoy (ese lo computa dinámicamente _contexto_base).
    - No toca días de descanso.
    - Es idempotente gracias al unique_together (horario, fecha).
    """
    hoy = timezone.localdate()
    desde = hoy - timedelta(days=dias_atras)

    horarios = Horario.objects.filter(
        ciclo_inicio__isnull=False,
        ciclo_inicio__lte=hoy
    )

    for horario in horarios:
        # Rango efectivo de este horario dentro de los últimos N días
        rango_inicio = max(horario.ciclo_inicio, desde)
        rango_fin = ciclo_fin(horario)
        if rango_fin is None or rango_fin >= hoy:
            rango_fin = hoy - timedelta(days=1)
        if rango_inicio > rango_fin:
            continue

        # Fechas de descanso de este horario (en el rango)
        descansos = set(
            DescansoEmpleado.objects.filter(
                horario=horario,
                fecha__gte=rango_inicio,
                fecha__lte=rango_fin,
                es_descanso=True,
            ).values_list('fecha', flat=True)
        )

        # Fechas ya registradas
        existentes = set(
            Asistencia.objects.filter(
                horario=horario,
                fecha__gte=rango_inicio,
                fecha__lte=rango_fin,
            ).values_list('fecha', flat=True)
        )

        # Crear ausentes donde falte
        cursor = rango_inicio
        while cursor <= rango_fin:
            if cursor not in descansos and cursor not in existentes:
                Asistencia.objects.create(
                    horario=horario,
                    fecha=cursor,
                    estado='AUSENTE',
                    hora_marcada=None,
                    minutos_tarde=None,
                )
            cursor += timedelta(days=1)


# =============================================================================
# CONTEXTO BASE DEL DASHBOARD
# =============================================================================

def _contexto_base():
    # Generar ausentes pendientes antes de calcular KPIs (lazy generation).
    generar_ausentes_pendientes(dias_atras=30)

    hoy = timezone.localdate()
    ahora = timezone.localtime().time()
    proximos_dias = []

    for _ in range(hoy.weekday()):
        proximos_dias.append(None)

    for i in range(15):
        fecha = hoy + timedelta(days=i)
        proximos_dias.append({
            "fecha": fecha,
            "numero": fecha.day,
            "weekday": fecha.weekday(),
            "indice": i,
        })

    # 1. Horarios activos (uno por empleado, en teoría)
    horarios_qs = (
        Horario.objects
        .filter(estado=True, es_ciclo_cerrado=False)
        .select_related("empleado")
    )

    horarios = []
    for horario in horarios_qs:
        horario_vigente = obtener_o_generar_horario_vigente(horario.empleado)
        if horario_vigente is None:
            continue

        horario_vigente.proximo_descanso = (
            DescansoEmpleado.objects
            .filter(horario=horario_vigente, es_descanso=True)
            .order_by('-fecha')
            .first()
        )
        horario_vigente.vigencia_fin = ciclo_fin(horario_vigente)
        horario_vigente.vigencia_estado = estado_vigencia_horario(
            horario_vigente, hoy, horario_vigente.vigencia_fin
        )
        horarios.append(horario_vigente)

    horarios.sort(key=lambda h: h.proximo_descanso.fecha if h.proximo_descanso else date.max)

    turnos_hoy = {
        "MANANA": [],
        "TARDE": [],
        "FIJO": [],
    }

    programados = 0
    presentes = 0
    tardanzas = 0
    ausentes = 0

    for horario in horarios:
        descanso_hoy = (
            horario.proximo_descanso is not None
            and horario.proximo_descanso.fecha == hoy
        )

        if descanso_hoy:
            continue

        programados += 1

        asistencia = (
            Asistencia.objects
            .filter(horario=horario, fecha=hoy)
            .first()
        )

        horario.asistencia = asistencia

        # ============================================================
        # 15/09/2026: Calcular estado del día (para la tabla del dashboard)
        # Reglas:
        #   - Ya marcó → usamos su estado real.
        #   - No marcó y pasaron >60 min desde hora_entrada → AUSENTE.
        #   - No marcó y pasaron <=60 min → pendiente (botón Registrar).
        # ============================================================
        horario.estado_hoy = None
        horario.minutos_tarde_display = None
        horario.tipo_accion = 'pendiente'   # pendiente | registrado | no_marcada

        if asistencia:
            horario.estado_hoy = asistencia.estado
            horario.minutos_tarde_display = formatear_tardanza(asistencia.minutos_tarde)
            horario.tipo_accion = 'registrado'
        else:
            if horario.hora_entrada:
                entrada_dt = datetime.combine(hoy, horario.hora_entrada)
                ahora_dt = datetime.combine(hoy, ahora)
                minutos_transcurridos = (ahora_dt - entrada_dt).total_seconds() / 60

                if minutos_transcurridos > 60:
                    horario.estado_hoy = 'AUSENTE'
                    horario.tipo_accion = 'no_marcada'
                # else: queda pendiente (dentro de los 60 min de tolerancia)

        if horario.turno in turnos_hoy:
            turnos_hoy[horario.turno].append(horario)

        # KPIs
        if horario.estado_hoy == "PRESENTE":
            presentes += 1
        elif horario.estado_hoy == "TARDE":
            tardanzas += 1
        else:
            # AUSENTE o pendiente → cuenta como ausente
            ausentes += 1

    resumen_asistencia = {
        "programados": programados,
        "presentes": presentes,
        "tardanzas": tardanzas,
        "ausentes": ausentes,
    }

    resumen_horarios = {
        "total": len(horarios),
        "manana": sum(1 for h in horarios if h.turno == "MANANA"),
        "tarde": sum(1 for h in horarios if h.turno == "TARDE"),
        "fijo": sum(1 for h in horarios if h.turno == "FIJO"),
    }

    return {
        "empleados": PerfilEmpleado.objects.all(),
        "horarios": horarios,
        "proximos_dias": proximos_dias,
        "dias_semana": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        "fecha_hoy": hoy,
        "turnos_hoy": turnos_hoy,
        "resumen_asistencia": resumen_asistencia,
        "resumen_horarios": resumen_horarios,
    }


# =============================================================================
# VISTA PRINCIPAL DEL DASHBOARD
# =============================================================================

@login_required
@admin_required
def asistencia_dashboard(request):
    # Obtener contexto base (día actual, KPIs, turnos, etc.)
    context = _contexto_base()

    # Obtener todos los empleados (activos e inactivos, pero con horario o sin él)
    empleados = PerfilEmpleado.objects.all().order_by('primer_nombre')

    # Para cada empleado, calcular su resumen
    empleados_con_resumen = []
    for emp in empleados:
        resumen = obtener_resumen_empleado(emp)
        empleados_con_resumen.append({
            'id': emp.id,
            'nombre': emp.nombre_completo(),
            'cargo': emp.get_cargo_display() or 'Sin cargo',
            'resumen': resumen,
            'resumen_json': json.dumps(resumen)  # JSON string para el atributo data
        })

    context['empleados_con_resumen'] = empleados_con_resumen
    context['empleados'] = empleados  # Para el filtro de empleados (select)

    return render(request, 'admin/asistencia/asistencia.html', context)


# =============================================================================
# RESUMEN POR EMPLEADO (para el gráfico de barras)
# =============================================================================

def obtener_resumen_empleado(empleado):
    """
    Calcula el resumen de asistencia para un empleado.
    Usa como fecha de inicio la fecha_ingreso del empleado (campo en PerfilEmpleado).
    Si no tiene fecha_ingreso, usa la fecha del primer horario activo.
    Retorna un dict con conteos de: presente, tarde, ausente, descanso.
    """
    hoy = timezone.localdate()

    # 1. Intentar usar fecha_ingreso del empleado
    fecha_inicio = empleado.fecha_ingreso
    if not fecha_inicio:
        # Fallback: primer horario activo
        primer_horario = Horario.objects.filter(empleado=empleado, estado=True).order_by('fecha_creacion').first()
        if primer_horario:
            fecha_inicio = primer_horario.fecha_creacion.date()
        else:
            # Sin horario y sin fecha de ingreso → sin datos
            return {'presente': 0, 'tarde': 0, 'ausente': 0, 'descanso': 0}

    # Asegurar que la fecha de inicio no sea posterior a hoy
    if fecha_inicio > hoy:
        fecha_inicio = hoy

    # Obtener todas las asistencias del empleado desde esa fecha
    # (recorre TODOS los horarios/ciclos del empleado, no solo el activo)
    asistencias = Asistencia.objects.filter(
        horario__empleado=empleado,
        fecha__gte=fecha_inicio,
        fecha__lte=hoy
    )

    # Conteos por estado
    presente = asistencias.filter(estado='PRESENTE').count()
    tarde = asistencias.filter(estado='TARDE').count()
    ausente = asistencias.filter(estado='AUSENTE').count()

    # Contar descansos (días de descanso en el mismo período, en cualquier ciclo)
    total_descansos = DescansoEmpleado.objects.filter(
        horario__empleado=empleado,
        fecha__gte=fecha_inicio,
        fecha__lte=hoy,
        es_descanso=True
    ).count()

    return {
        'presente': presente,
        'tarde': tarde,
        'ausente': ausente,
        'descanso': total_descansos
    }


# =============================================================================
# HISTORIAL DE ASISTENCIA POR EMPLEADO (modal)
# =============================================================================

@login_required
@admin_required
def asistencia_empleado_historial(request, empleado_id):
    """
    Vista AJAX que devuelve HTML parcial para el modal de historial de un empleado.
    Aplica filtros de turno, estado, fecha única o rango de fechas.
    Recorre todos los horarios/ciclos del empleado (histórico completo).
    """
    empleado = get_object_or_404(PerfilEmpleado, id=empleado_id)

    # Obtener parámetros GET
    turno = request.GET.get('turno', '')
    estado = request.GET.get('estado', '')
    fecha_unica = request.GET.get('fecha_unica', '')
    fecha_desde = request.GET.get('fecha_desde', '')
    fecha_hasta = request.GET.get('fecha_hasta', '')

    # Query base: todas las asistencias del empleado (en cualquier ciclo/horario)
    asistencias = Asistencia.objects.filter(
        horario__empleado=empleado
    ).select_related('horario').order_by('-fecha', '-hora_marcada')

    # Aplicar filtros de fecha (prioridad: fecha única > rango)
    if fecha_unica:
        asistencias = asistencias.filter(fecha=fecha_unica)
    elif fecha_desde and fecha_hasta:
        asistencias = asistencias.filter(fecha__range=[fecha_desde, fecha_hasta])

    # Aplicar filtros de turno y estado
    if turno:
        asistencias = asistencias.filter(horario__turno=turno)
    if estado:
        asistencias = asistencias.filter(estado=estado)

    # Construir lista de registros
    registros = []
    for asist in asistencias:
        registros.append({
            'fecha': asist.fecha.strftime('%d/%m/%Y'),
            'estado': asist.get_estado_display() or 'Sin registrar',
            'turno': asist.horario.get_turno_display(),
            'hora_programada': asist.horario.hora_entrada.strftime('%H:%M') if asist.horario.hora_entrada else 'N/A',
            'hora_marcada': asist.hora_marcada.strftime('%H:%M') if asist.hora_marcada else 'N/A',
            'id': asist.id,
        })

    # Renderizar parcial de lista
    html = render_to_string('admin/asistencia/empleado_historial_lista.html', {
        'registros': registros,
    }, request=request)

    return JsonResponse({
        'html': html,
        'empleado_nombre': empleado.nombre_completo(),
        'empleado_cargo': empleado.get_cargo_display() or 'Sin cargo',
    })


# =============================================================================
# CRUD DE HORARIOS
# =============================================================================

def horarios(request):
    if request.method == "POST":
        empleado_id = request.POST.get("empleado")
        turno = request.POST.get("turno")
        hora_entrada_str = request.POST.get("hora_entrada")
        hora_salida_str = request.POST.get("hora_salida")
        fecha_descanso = request.POST.get("fecha_descanso")

        empleado = get_object_or_404(
            PerfilEmpleado,
            id=empleado_id
        )

        if Horario.objects.filter(
            empleado=empleado,
            estado=True
        ).exists():
            messages.error(
                request,
                f"El empleado {empleado.nombre_completo()} ya tiene un horario activo asignado."
            )
            return redirect("asistencia:horarios")

        # Convertir strings de hora a objetos time de Python de forma segura
        hora_entrada_obj = (
            datetime.strptime(hora_entrada_str, '%H:%M').time()
            if hora_entrada_str else None
        )

        hora_salida_obj = (
            datetime.strptime(hora_salida_str, '%H:%M').time()
            if hora_salida_str else None
        )

        # =====================================================
        # PERÍODO DEL HORARIO
        # =====================================================
        fecha_inicio = timezone.localdate()
        fecha_fin = fecha_inicio + timedelta(days=dias_ciclo(turno) - 1)

        # =====================================================
        # DÍA DE DESCANSO SEMANAL (solo turno FIJO)
        # Se deriva de la fecha de descanso elegida por el admin; a partir
        # de acá, cada ciclo automático repetirá el descanso en este mismo
        # día de la semana, sin que el admin tenga que volver a elegirlo.
        # =====================================================
        dia_descanso_semana = None
        fecha_descanso_obj = None
        if fecha_descanso:
            fecha_descanso_obj = datetime.strptime(fecha_descanso, '%Y-%m-%d').date()
            if turno == "FIJO":
                dia_descanso_semana = fecha_descanso_obj.weekday()

        horario = Horario.objects.create(
            empleado=empleado,
            turno=turno,
            hora_entrada=hora_entrada_obj,
            hora_salida=hora_salida_obj,
            estado=True,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            ciclo_inicio=fecha_inicio,
            dia_descanso_semana=dia_descanso_semana,
        )

        # =====================================================
        # NOTIFICACIÓN AL EMPLEADO
        # =====================================================
        contexto = {
            'empleado_nombre': empleado.nombre_completo(),
            'turno': horario.get_turno_display(),
            'hora_entrada': horario.hora_entrada.strftime('%H:%M') if horario.hora_entrada else '',
            'hora_salida': horario.hora_salida.strftime('%H:%M') if horario.hora_salida else '',
            'fecha_descanso': fecha_descanso if fecha_descanso else 'A definir',
        }

        enviar_notificacion(
            destinatario=empleado.correo,
            asunto="🕒 Nuevo horario asignado",
            template_name='emails/horario_asignado.html',
            contexto=contexto
        )

        if fecha_descanso_obj:
            DescansoEmpleado.objects.create(
                horario=horario,
                fecha=fecha_descanso_obj,
                es_descanso=True,
            )

        messages.success(request, "Horario asignado correctamente.")
        return redirect("asistencia:horarios")

    return render(
        request,
        "admin/horario/horario.html",
        _contexto_base()
    )


def horario_json(request, id):
    """
    Devuelve el estado actual (de solo lectura) de un horario puntual,
    para los modales de Ver/Editar/Eliminar. No genera ni muta ciclos:
    la generación automática ocurre en _contexto_base() y en
    obtener_o_generar_horario_vigente(), no al abrir un modal.
    """
    horario = get_object_or_404(
        Horario.objects.select_related("empleado"),
        id=id
    )

    hoy = timezone.localdate()
    descanso = (
        DescansoEmpleado.objects
        .filter(horario=horario, es_descanso=True)
        .order_by('-fecha')
        .first()
    )
    fin = ciclo_fin(horario)
    vigencia_estado = estado_vigencia_horario(horario, hoy, fin)

    return JsonResponse({
        "empleado": horario.empleado.nombre_completo(),
        "cargo": horario.empleado.get_cargo_display(),
        "turno": horario.get_turno_display(),
        "turno_valor": horario.turno,
        "hora_entrada": horario.hora_entrada.strftime("%H:%M"),
        "hora_salida": horario.hora_salida.strftime("%H:%M"),
        "estado": horario.estado,
        "vigencia_estado": vigencia_estado,
        "descanso": descanso.fecha.strftime("%d/%m/%Y") if descanso else None,
        "descanso_fecha": descanso.fecha.strftime("%Y-%m-%d") if descanso else None,
        "descanso_pasado": bool(descanso and descanso.fecha < hoy),
        "ciclo_inicio": horario.ciclo_inicio.strftime("%d/%m/%Y") if horario.ciclo_inicio else None,
        "ciclo_fin": fin.strftime("%d/%m/%Y") if fin else None,
        "tiene_asistencia": horario.tiene_asistencia_registrada(),
    })


def editar_horario(request, id):
    horario = get_object_or_404(Horario, id=id)

    if request.method == "POST":
        horario.turno = request.POST.get("turno")

        hora_entrada_str = request.POST.get("hora_entrada")
        hora_salida_str = request.POST.get("hora_salida")

        if hora_entrada_str:
            horario.hora_entrada = datetime.strptime(hora_entrada_str, '%H:%M').time()
        if hora_salida_str:
            horario.hora_salida = datetime.strptime(hora_salida_str, '%H:%M').time()

        fecha_descanso_str = request.POST.get("fecha_descanso")

        # =====================================================
        # VALIDACIÓN DE FECHA DE DESCANSO
        # =====================================================
        if fecha_descanso_str:
            try:
                nueva_fecha_descanso = datetime.strptime(fecha_descanso_str, '%Y-%m-%d').date()
                hoy = timezone.localdate()

                if nueva_fecha_descanso < hoy:
                    messages.error(
                        request,
                        "No puedes asignar un día de descanso en una fecha que ya pasó."
                    )
                    return redirect("asistencia:horarios")

                descanso_actual = DescansoEmpleado.objects.filter(
                    horario=horario,
                    es_descanso=True
                ).order_by("-fecha", "-id").first()

                if descanso_actual:
                    ciclo_inicio = horario.ciclo_inicio
                    if not ciclo_inicio:
                        ciclo_inicio = horario.fecha_inicio or hoy

                    dias_ciclo_val = dias_ciclo(horario.turno)
                    ciclo_fin_val = ciclo_inicio + timedelta(days=dias_ciclo_val - 1)

                    if not (ciclo_inicio <= nueva_fecha_descanso <= ciclo_fin_val):
                        messages.error(
                            request,
                            f"La fecha de descanso debe estar dentro del ciclo actual "
                            f"({ciclo_inicio.strftime('%d/%m/%Y')} - {ciclo_fin_val.strftime('%d/%m/%Y')})."
                        )
                        return redirect("asistencia:horarios")

                    if descanso_actual.fecha < hoy and nueva_fecha_descanso != descanso_actual.fecha:
                        messages.error(
                            request,
                            f"No puedes cambiar el día de descanso porque el descanso actual "
                            f"({descanso_actual.fecha.strftime('%d/%m/%Y')}) ya ocurrió. "
                            "El siguiente descanso se generará automáticamente al finalizar el ciclo."
                        )
                        return redirect("asistencia:horarios")

                    if descanso_actual.fecha < hoy and nueva_fecha_descanso == descanso_actual.fecha:
                        messages.warning(
                            request,
                            "El día de descanso ya ocurrió. La fecha no se modificará."
                        )
                        return redirect("asistencia:horarios")

                    asistencia_existente = Asistencia.objects.filter(
                        horario=horario,
                        fecha=nueva_fecha_descanso
                    ).exists()

                    if asistencia_existente:
                        messages.error(
                            request,
                            f"No puedes asignar descanso en el día {nueva_fecha_descanso.strftime('%d/%m/%Y')} "
                            "porque ya tiene asistencia registrada."
                        )
                        return redirect("asistencia:horarios")

                    descanso_actual.fecha = nueva_fecha_descanso
                    descanso_actual.save(update_fields=["fecha"])

                    # Si el turno es FIJO, este nuevo día de descanso pasa a
                    # ser el que se repetirá automáticamente cada ciclo.
                    if horario.turno == "FIJO":
                        horario.dia_descanso_semana = nueva_fecha_descanso.weekday()

                else:
                    DescansoEmpleado.objects.create(
                        horario=horario,
                        fecha=nueva_fecha_descanso,
                        es_descanso=True,
                    )

                    if horario.turno == "FIJO":
                        horario.dia_descanso_semana = nueva_fecha_descanso.weekday()

            except ValueError:
                messages.error(request, "Formato de fecha inválido.")
                return redirect("asistencia:horarios")

        horario.save()

        # =====================================================
        # NOTIFICACIÓN AL EMPLEADO
        # =====================================================
        contexto = {
            'empleado_nombre': horario.empleado.nombre_completo(),
            'turno': horario.get_turno_display(),
            'hora_entrada': horario.hora_entrada.strftime('%H:%M') if horario.hora_entrada else '',
            'hora_salida': horario.hora_salida.strftime('%H:%M') if horario.hora_salida else '',
            'fecha_descanso': fecha_descanso_str if fecha_descanso_str else 'A definir',
        }
        enviar_notificacion(
            destinatario=horario.empleado.correo,
            asunto="✏️ Horario actualizado",
            template_name='emails/horario_editado.html',
            contexto=contexto
        )

        messages.success(request, "Horario actualizado correctamente.")
        return redirect("asistencia:horarios")

    return redirect("asistencia:horarios")


def eliminar_horario(request, id):
    horario = get_object_or_404(Horario, id=id)

    # =====================================================
    # VALIDACIÓN: no se puede eliminar un horario que ya
    # tiene asistencia registrada (se perdería trazabilidad).
    # =====================================================
    if horario.tiene_asistencia_registrada():
        messages.error(
            request,
            f"No se puede eliminar el horario de {horario.empleado.nombre_completo()} "
            "porque ya tiene asistencia registrada."
        )
        return redirect("asistencia:horarios")

    # =====================================================
    # NOTIFICACIÓN AL EMPLEADO (ANTES DE DESACTIVAR)
    # =====================================================
    contexto = {
        'empleado_nombre': horario.empleado.nombre_completo(),
        'turno': horario.get_turno_display(),
    }
    enviar_notificacion(
        destinatario=horario.empleado.correo,
        asunto="🚫 Horario eliminado",
        template_name='emails/horario_eliminado.html',
        contexto=contexto
    )

    horario.estado = False
    horario.save(update_fields=["estado"])

    messages.success(request, "Horario eliminado correctamente.")
    return redirect("asistencia:horarios")


# =============================================================================
# REGISTRO DE ASISTENCIA (desde el dashboard del admin)
# =============================================================================

def registrar_asistencia(request):
    """
    Registra la asistencia de un empleado para el día de hoy.

    Reglas de negocio (15/09/2026):
        - Si la hora actual NO está dentro del rango [hora_entrada, hora_salida]
          del horario → se rechaza con un toast amarillo.
        - Si está dentro:
            · Marcó dentro de los primeros 30 min → PRESENTE
            · Marcó después de 30 min → TARDE (con minutos de tardanza)
        - Si ya existe registro para hoy → se devuelve el existente sin duplicar.
    """
    if request.method != "POST":
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'error': 'Método no permitido'}, status=405)
        return redirect("asistencia:asistencia_dashboard")

    horario_id = request.POST.get("horario_id")
    if not horario_id:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'error': 'Falta ID de horario'}, status=400)
        return redirect("asistencia:asistencia_dashboard")

    horario = get_object_or_404(Horario, id=horario_id)
    hoy = timezone.localdate()
    hora_actual = timezone.localtime().time()

    # VALIDACIÓN DE RANGO HORARIO
    hora_entrada = horario.hora_entrada
    hora_salida = horario.hora_salida

    if hora_entrada and hora_salida:
        if not (hora_entrada <= hora_actual <= hora_salida):
            nombre_turno = horario.get_turno_display()
            mensaje = (
                f"No puedes marcar asistencia del turno {nombre_turno} "
                f"(rango {hora_entrada.strftime('%H:%M')} - {hora_salida.strftime('%H:%M')})."
            )
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'error': mensaje}, status=400)
            messages.error(request, mensaje)
            return redirect("asistencia:asistencia_dashboard")

    # Verificar si ya existe asistencia para hoy
    asistencia_existente = Asistencia.objects.filter(horario=horario, fecha=hoy).first()
    if asistencia_existente:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'estado': asistencia_existente.estado,
                'hora_marcada': asistencia_existente.hora_marcada.strftime('%H:%M') if asistencia_existente.hora_marcada else None,
                'estado_display': asistencia_existente.get_estado_display(),
                'minutos_tarde': asistencia_existente.minutos_tarde,
                'ya_registrado': True
            })
        return redirect("asistencia:asistencia_dashboard")

    # Registrar nueva asistencia con la nueva regla de negocio
    estado, minutos_tarde = calcular_estado_y_minutos(horario, hora_actual)
    asistencia = Asistencia.objects.create(
        horario=horario,
        fecha=hoy,
        estado=estado,
        hora_marcada=hora_actual,
        minutos_tarde=minutos_tarde,
    )

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'success': True,
            'estado': asistencia.estado,
            'hora_marcada': asistencia.hora_marcada.strftime('%H:%M'),
            'estado_display': asistencia.get_estado_display(),
            'minutos_tarde': minutos_tarde,
            'ya_registrado': False
        })

    return redirect("asistencia:asistencia_dashboard")


# =============================================================================
# VISTA DE ASISTENCIA DEL EMPLEADO (historial personal)
# =============================================================================

def asistencia_empleado(request):
    perfil = request.user.perfil
    hoy = timezone.localdate()

    filtro = request.GET.get('filtro', 'semana')
    if filtro == 'mes':
        fecha_inicio = hoy - timedelta(days=30)
    else:
        fecha_inicio = hoy - timedelta(days=7)

    # Horario vigente: si el ciclo anterior venció, esto lo genera solo.
    horario = obtener_o_generar_horario_vigente(perfil)

    # Estado de hoy
    estado_hoy = {
        'tiene_jornada': False,
        'turno': None,
        'hora_entrada_prog': None,
        'hora_salida_prog': None,
        'hora_entrada_real': None,
        'hora_salida_real': None,
        'estado': None,  # PRESENTE, TARDE, AUSENTE, DESCANSO, SIN_HORARIO
        'es_descanso': False,
        'tardanza_minutos': None,
    }

    if horario:
        # Verificar si hoy es descanso (el descanso del ciclo vigente ya
        # quedó calculado al generar/obtener el horario, no se recalcula aquí)
        descanso = (
            DescansoEmpleado.objects
            .filter(horario=horario, es_descanso=True)
            .order_by('-fecha')
            .first()
        )
        es_descanso_hoy = descanso and descanso.fecha == hoy

        estado_hoy['tiene_jornada'] = True
        estado_hoy['turno'] = horario.get_turno_display()
        estado_hoy['hora_entrada_prog'] = horario.hora_entrada
        estado_hoy['hora_salida_prog'] = horario.hora_salida

        if es_descanso_hoy:
            estado_hoy['estado'] = 'DESCANSO'
            estado_hoy['es_descanso'] = True
        else:
            # Buscar asistencia de hoy
            asistencia_hoy = Asistencia.objects.filter(horario=horario, fecha=hoy).first()
            if asistencia_hoy:
                estado_hoy['hora_entrada_real'] = asistencia_hoy.hora_marcada
                estado_hoy['estado'] = asistencia_hoy.estado
                if asistencia_hoy.estado == 'TARDE' and horario.hora_entrada:
                    # Calcular tardanza en minutos
                    entrada_prog = datetime.combine(hoy, horario.hora_entrada)
                    entrada_real = datetime.combine(hoy, asistencia_hoy.hora_marcada)
                    if entrada_real > entrada_prog:
                        diff = entrada_real - entrada_prog
                        estado_hoy['tardanza_minutos'] = int(diff.total_seconds() // 60)
            else:
                estado_hoy['estado'] = 'AUSENTE'
    else:
        estado_hoy['estado'] = 'SIN_HORARIO'

    # Historial para la tabla: se construye día por día en el rango
    # [fecha_inicio, hoy], recorriendo TODOS los ciclos (Horario) que el
    # empleado ha tenido, no solo el vigente. Un día solo genera fila si
    # cae dentro de algún ciclo real (ciclo_inicio..ciclo_fin) — así no
    # aparecen "ausencias" en fechas donde el empleado ni siquiera tenía
    # horario asignado todavía.
    historial = []
    dias_asistencia = 0
    retardos = 0

    horarios_empleado = [
        (h, h.ciclo_inicio, ciclo_fin(h))
        for h in Horario.objects.filter(empleado=perfil, ciclo_inicio__isnull=False)
    ]

    def horario_del_dia(fecha):
        for h, ci, cf in horarios_empleado:
            if ci <= fecha and (cf is None or fecha <= cf):
                return h
        return None

    if horarios_empleado:
        asistencias_por_fecha = {
            a.fecha: a
            for a in Asistencia.objects.filter(
                horario__empleado=perfil, fecha__gte=fecha_inicio, fecha__lte=hoy
            )
        }
        descansos_fechas = set(
            DescansoEmpleado.objects.filter(
                horario__empleado=perfil,
                fecha__gte=fecha_inicio,
                fecha__lte=hoy,
                es_descanso=True,
            ).values_list('fecha', flat=True)
        )

        fecha_cursor = hoy
        while fecha_cursor >= fecha_inicio:
            horario_dia = horario_del_dia(fecha_cursor)

            if horario_dia is None:
                # El empleado no tenía horario asignado ese día: se omite,
                # no aplica marcarlo como ausente.
                fecha_cursor -= timedelta(days=1)
                continue

            if fecha_cursor in descansos_fechas:
                historial.append({
                    'fecha': fecha_cursor,
                    'es_descanso': True,
                    'estado': 'DESCANSO',
                    'hora_marcada': None,
                    'tardanza_display': '--',
                    'turno': horario_dia.get_turno_display(),
                    'hora_entrada_prog': horario_dia.hora_entrada,
                    'hora_salida_prog': horario_dia.hora_salida,
                })
            else:
                asistencia = asistencias_por_fecha.get(fecha_cursor)
                if asistencia:
                    estado_dia = asistencia.estado
                    hora_marcada = asistencia.hora_marcada
                elif fecha_cursor < hoy:
                    # No hay registro y ya pasó: ausencia real (no persistida).
                    estado_dia = 'AUSENTE'
                    hora_marcada = None
                else:
                    # Es hoy y todavía no se ha marcado: usa el mismo estado
                    # ya calculado arriba para "Estado de hoy".
                    estado_dia = estado_hoy['estado']
                    hora_marcada = estado_hoy['hora_entrada_real']

                tardanza_display = '--'
                if estado_dia == 'TARDE' and horario_dia.hora_entrada and hora_marcada:
                    entrada_prog = datetime.combine(fecha_cursor, horario_dia.hora_entrada)
                    entrada_real = datetime.combine(fecha_cursor, hora_marcada)
                    if entrada_real > entrada_prog:
                        minutos = int((entrada_real - entrada_prog).total_seconds() // 60)
                        tardanza_display = f"{minutos} min"

                historial.append({
                    'fecha': fecha_cursor,
                    'es_descanso': False,
                    'estado': estado_dia,
                    'hora_marcada': hora_marcada,
                    'tardanza_display': tardanza_display,
                    'turno': horario_dia.get_turno_display(),
                    'hora_entrada_prog': horario_dia.hora_entrada,
                    'hora_salida_prog': horario_dia.hora_salida,
                })

                if estado_dia in ('PRESENTE', 'TARDE'):
                    dias_asistencia += 1
                if estado_dia == 'TARDE':
                    retardos += 1

            fecha_cursor -= timedelta(days=1)

    dias_sin_asistencia = sum(1 for d in historial if d['estado'] == 'AUSENTE')

    return render(request, 'empleado/asistencia/asistencia.html', {
        'fecha_hoy': hoy,
        'horario': horario,
        'estado_hoy': estado_hoy,
        'historial': historial,
        'dias_asistencia': dias_asistencia,
        'dias_sin_asistencia': dias_sin_asistencia,
        'retardos': retardos,
        'filtro': filtro,
    })


# =============================================================================
# DETALLE DE UNA ASISTENCIA ESPECÍFICA (para el modal del admin)
# =============================================================================

@login_required
@admin_required
def asistencia_detalle(request, asistencia_id):
    """
    Devuelve los datos de una asistencia específica en formato JSON
    para llenar el modal de detalle.
    """
    asistencia = get_object_or_404(
        Asistencia.objects.select_related('horario__empleado'),
        id=asistencia_id
    )
    data = {
        'empleado': asistencia.horario.empleado.nombre_completo(),
        'fecha': asistencia.fecha.strftime('%d/%m/%Y'),
        'estado': asistencia.get_estado_display() or 'Sin registrar',
        'estado_clase': asistencia.estado.lower() if asistencia.estado else 'sin-registro',
        'turno': asistencia.horario.get_turno_display(),
        'cargo': asistencia.horario.empleado.get_cargo_display() or 'Sin cargo',
        'hora_programada': asistencia.horario.hora_entrada.strftime('%H:%M') if asistencia.horario.hora_entrada else 'N/A',
        'hora_marcada': asistencia.hora_marcada.strftime('%H:%M') if asistencia.hora_marcada else 'N/A',
        'minutos_tarde': asistencia.minutos_tarde,
    }
    return JsonResponse(data)


# =============================================================================
# VISTAS DEL EMPLEADO (horario propio)
# =============================================================================

@login_required
def empleado_horario(request):
    perfil = request.user.perfil
    hoy = timezone.localdate()

    # Horario vigente: si el ciclo anterior venció, esto genera el/los
    # siguientes ciclos automáticamente (encadenados por ciclo_anterior).
    horario_actual = obtener_o_generar_horario_vigente(perfil)

    calendario = []
    if horario_actual:
        fecha_inicio = horario_actual.ciclo_inicio or horario_actual.fecha_inicio or hoy
        horario_actual.vigencia_fin = ciclo_fin(horario_actual)

        calendario = construir_calendario(
            horario_actual,
            fecha_inicio=fecha_inicio,
            dias=dias_ciclo(horario_actual.turno),
            hoy=hoy
        )
        horario_actual.proximo_descanso = DescansoEmpleado.objects.filter(
            horario=horario_actual, es_descanso=True
        ).order_by('-fecha').first()

        # --- OBTENER ASISTENCIAS PARA EL RANGO DE FECHAS ---
        fechas_calendario = [dia['fecha'] for dia in calendario if dia]
        asistencias = Asistencia.objects.filter(
            horario=horario_actual,
            fecha__in=fechas_calendario
        )
        asistencias_por_fecha = {a.fecha: a.estado for a in asistencias}

        for dia in calendario:
            if dia:
                fecha = dia['fecha']
                if dia['es_descanso']:
                    dia['estado'] = 'DESCANSO'
                    dia['estado_texto'] = 'Descanso'
                elif fecha in asistencias_por_fecha:
                    estado = asistencias_por_fecha[fecha]
                    dia['estado'] = estado
                    dia['estado_texto'] = 'Presente' if estado == 'PRESENTE' else 'Tardanza'
                elif fecha < hoy:
                    dia['estado'] = 'AUSENTE'
                    dia['estado_texto'] = 'Ausente'
                else:
                    dia['estado'] = None
                    dia['estado_texto'] = 'Pendiente'
            # Si dia es None (relleno de inicio de semana), se mantiene None

    # Historial de ciclos: todos los Horario del empleado (cada ciclo
    # generado automáticamente queda aquí como una fila más).
    historial_horarios = Horario.objects.filter(empleado=perfil).order_by('-fecha_creacion')
    for h in historial_horarios:
        h.vigencia_fin = ciclo_fin(h) if h.ciclo_inicio else None
        h.vigencia_estado = estado_vigencia_horario(h, hoy, h.vigencia_fin)

    return render(request, 'empleado/horario/horario.html', {
        'horario_actual': horario_actual,
        'calendario': calendario,
        'historial_horarios': historial_horarios,
        'hoy': hoy,
    })


@login_required
def empleado_horario_detalle(request, id):
    horario = get_object_or_404(Horario, id=id, empleado=request.user.perfil)
    hoy = timezone.localdate()

    fecha_inicio = horario.ciclo_inicio or horario.fecha_creacion.date()
    dias = dias_ciclo(horario.turno)

    asistencias = Asistencia.objects.filter(
        horario=horario,
        fecha__gte=fecha_inicio,
        fecha__lt=fecha_inicio + timedelta(days=dias)
    )

    calendario = construir_calendario(horario, fecha_inicio, dias=dias, hoy=hoy, asistencias=asistencias)

    horario.proximo_descanso = DescansoEmpleado.objects.filter(
        horario=horario, es_descanso=True
    ).order_by('-fecha').first()

    fin = ciclo_fin(horario)
    vigencia_estado = estado_vigencia_horario(horario, hoy, fin)
    horario.vigencia_fin = fin

    html = render_to_string('empleado/horario/_horario_detalle.html', {
        'horario': horario,
        'calendario': calendario,
    }, request=request)

    metadatos = {
        'fecha_inicio': fecha_inicio.strftime('%d/%m/%Y'),
        'fecha_fin': fin.strftime('%d/%m/%Y') if fin else 'Indefinido',
        'estado': vigencia_estado,
        'turno': horario.get_turno_display(),
        'horas': f"{horario.hora_entrada.strftime('%H:%M')} - {horario.hora_salida.strftime('%H:%M')}",
    }

    return JsonResponse({'html': html, 'metadatos': metadatos})


# =============================================================================
# ADMIN - ASISTENCIA POR EMPLEADO (redirige al módulo de horarios filtrado)
# =============================================================================

@login_required
@admin_required
def asistencia_empleado_admin(request, empleado_id):
    """
    Redirige al administrador al módulo de asistencia con el empleado filtrado.
    Permite ver y registrar la asistencia de un empleado específico.
    """
    try:
        empleado = PerfilEmpleado.objects.get(id=empleado_id)
    except PerfilEmpleado.DoesNotExist:
        messages.error(request, "Empleado no encontrado.")
        return redirect('asistencia:horarios')

    return redirect(f"{reverse('asistencia:horarios')}?empleado={empleado_id}")


# =============================================================================
# ADMIN - CAMBIAR ESTADO DE ASISTENCIA (AJAX)
# =============================================================================

@login_required
@admin_required
def cambiar_estado_asistencia(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    empleado_id = request.POST.get('empleado_id')
    estado = request.POST.get('estado')

    if not empleado_id or estado not in ['PRESENTE', 'TARDE', 'AUSENTE']:
        return JsonResponse({'error': 'Datos inválidos'}, status=400)

    try:
        empleado = PerfilEmpleado.objects.get(id=empleado_id)
        horario = obtener_o_generar_horario_vigente(empleado)
        if not horario:
            return JsonResponse({'error': 'Empleado sin horario activo'}, status=400)

        hoy = timezone.localdate()
        asistencia, created = Asistencia.objects.get_or_create(
            horario=horario,
            fecha=hoy,
            defaults={'estado': estado, 'hora_marcada': timezone.localtime().time()}
        )
        if not created:
            asistencia.estado = estado
            asistencia.hora_marcada = timezone.localtime().time()
            asistencia.save()

        # =====================================================
        # NOTIFICACIÓN AL EMPLEADO (DESPUÉS DE REGISTRAR)
        # =====================================================
        estado_display = dict(Asistencia.ESTADOS).get(estado, estado)
        contexto = {
            'empleado_nombre': empleado.nombre_completo(),
            'fecha': hoy.strftime('%d/%m/%Y'),
            'estado': estado_display,
        }
        enviar_notificacion(
            destinatario=empleado.correo,
            asunto=f"📋 Asistencia registrada - {estado_display}",
            template_name='emails/asistencia_registrada.html',
            contexto=contexto
        )

        return JsonResponse({'status': 'ok', 'mensaje': 'Estado actualizado'})
    except PerfilEmpleado.DoesNotExist:
        return JsonResponse({'error': 'Empleado no encontrado'}, status=404)