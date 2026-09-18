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
from django.core.cache import cache

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

# ============================================================
# VERIFICACIÓN ON-DEMAND DE MEMORANDOS
# ============================================================

def _verificar_memorandos_asistencia_throttled():
    """
    Ejecuta la verificación de memorandos por ASISTENCIA (tardanzas
    y ausencias) para todos los empleados activos, con throttle de
    30 min.

    NO incluye tareas: cada app verifica lo suyo.
    """
    if cache.get('verif_memorandos_asistencia_throttle'):
        return

    from apps.memorandos.services import verificar_memorandos_asistencia
    from apps.usuarios.models import PerfilEmpleado

    for emp in PerfilEmpleado.objects.filter(user__rol='empleado', estado='activo'):
        try:
            verificar_memorandos_asistencia(emp)
        except Exception as e:
            print(f"[asistencia.views] Error verificando memos para "
                  f"{emp.pk}: {e}")

    cache.set('verif_memorandos_asistencia_throttle', True, timeout=1800)


def _verificar_memorandos_asistencia_empleado(user):
    """
    Verifica solo el memorando de asistencia del empleado autenticado.
    Sin throttle (una llamada por request).
    """
    perfil = getattr(user, 'perfil', None)
    if perfil is None:
        return

    from apps.memorandos.services import verificar_memorandos_asistencia

    try:
        verificar_memorandos_asistencia(perfil)
    except Exception as e:
        print(f"[asistencia.views] Error verificando memo para "
              f"{perfil.pk}: {e}")

def _contexto_base():
    hoy = timezone.localdate()
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

    # 1. Obtenemos los horarios activos (uno por empleado, en teoría) y nos
    #    aseguramos de que cada uno esté al día con su ciclo. Si el cron no
    #    corrió, esto genera aquí mismo los ciclos que hicieran falta.
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

    # 2. ORDENAR: Por la fecha de descanso más cercana (ascendente).
    # Los que no tengan descanso quedan al final.
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
            .filter(
                horario=horario,
                fecha=hoy
            )
            .first()
        )

        horario.asistencia = asistencia

        if horario.turno in turnos_hoy:
            turnos_hoy[horario.turno].append(horario)

        if asistencia:
            if asistencia.estado == "PRESENTE":
                presentes += 1
            elif asistencia.estado == "TARDE":
                tardanzas += 1
            elif asistencia.estado == "AUSENTE":
                ausentes += 1
        else:
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


# ---


# Cambio el 7 de sep para historial de asistencia con filtros y paginación

@login_required
@admin_required
def asistencia_dashboard(request):

    _verificar_memorandos_asistencia_throttled()

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


# ---


# Helper para obtener resumen de un empleado
# Cambio del 7 de sep 26

def obtener_resumen_empleado(empleado):
    """
    Calcula el resumen de asistencia para un empleado recorriendo día a día.
    Cuenta correctamente:
        - Presente / Tarde: días con registro real
        - Ausente: días pasados sin marcar y sin novedad
        - Descanso: días de descanso programado
        - Permiso / Incapacidad / Cambio turno: días cubiertos por
          una solicitud aprobada
    """
    from .services.novedades_calendario import obtener_novedades_por_fecha

    vacio = {
        'presente': 0, 'tarde': 0, 'ausente': 0, 'descanso': 0,
        'permiso': 0, 'incapacidad': 0, 'cambio_turno': 0,
    }

    hoy = timezone.localdate()

    # 1. Fecha de inicio
    fecha_inicio = empleado.fecha_ingreso
    if not fecha_inicio:
        primer_horario = Horario.objects.filter(
            empleado=empleado, estado=True
        ).order_by('fecha_creacion').first()
        if primer_horario:
            fecha_inicio = primer_horario.fecha_creacion.date()
        else:
            return vacio

    if fecha_inicio > hoy:
        return vacio

    # 2. Horarios del empleado (para saber si tenía horario ese día)
    horarios_empleado = [
        (h.ciclo_inicio, ciclo_fin(h))
        for h in Horario.objects.filter(
            empleado=empleado, ciclo_inicio__isnull=False
        )
    ]

    def tiene_horario(fecha):
        for ci, cf in horarios_empleado:
            if ci <= fecha and (cf is None or fecha <= cf):
                return True
        return False

    # 3. Consultas materializadas
    asistencias_dict = {
        a.fecha: a.estado
        for a in Asistencia.objects.filter(
            horario__empleado=empleado,
            fecha__gte=fecha_inicio,
            fecha__lte=hoy,
        )
    }

    descansos_set = set(
        DescansoEmpleado.objects.filter(
            horario__empleado=empleado,
            fecha__gte=fecha_inicio,
            fecha__lte=hoy,
            es_descanso=True,
        ).values_list('fecha', flat=True)
    )

    novedades = obtener_novedades_por_fecha(empleado, fecha_inicio, hoy)

    # 4. Recorrer día a día
    resumen = dict(vacio)
    cursor = fecha_inicio

    while cursor <= hoy:
        if not tiene_horario(cursor):
            cursor += timedelta(days=1)
            continue

        novedad = novedades.get(cursor)

        if novedad:
            tipo = novedad['tipo']
            if tipo == 'PERMISO':
                resumen['permiso'] += 1
            elif tipo == 'INCAPACIDAD':
                resumen['incapacidad'] += 1
            elif tipo == 'CAMBIO_TURNO':
                resumen['cambio_turno'] += 1
                # Si además marcó asistencia ese día, se cuenta como Presente/Tarde
                estado_real = asistencias_dict.get(cursor)
                if estado_real == 'PRESENTE':
                    resumen['presente'] += 1
                elif estado_real == 'TARDE':
                    resumen['tarde'] += 1

        elif cursor in descansos_set:
            resumen['descanso'] += 1

        else:
            estado_real = asistencias_dict.get(cursor)

            if estado_real == 'PRESENTE':
                resumen['presente'] += 1
            elif estado_real == 'TARDE':
                resumen['tarde'] += 1
            elif estado_real == 'AUSENTE':
                resumen['ausente'] += 1
            elif cursor < hoy:
                # Día pasado, sin registro y sin novedad = ausencia real
                resumen['ausente'] += 1
            # Si es HOY y aún no marcó → no cuenta (aún puede marcar)

        cursor += timedelta(days=1)

    return resumen



# 7 sep/2026 Ahora bien, esta nueva función tiene mucha importancia ya que es fundamental para el modal:

# Se agregaron filtros de rango y fecha unica para el 8 de sep

@login_required
@admin_required
def asistencia_empleado_historial(request, empleado_id):
    """
    Vista AJAX que devuelve HTML parcial para el modal de historial.
    Recorre día a día para incluir permisos, incapacidades y cambios
    de turno, además de las asistencias reales.
    """
    from .services.novedades_calendario import obtener_novedades_por_fecha

    empleado = get_object_or_404(PerfilEmpleado, id=empleado_id)

    # ============================================================
    # Filtros
    # ============================================================
    turno = request.GET.get('turno', '')
    estado_filtro = request.GET.get('estado', '')
    fecha_unica = request.GET.get('fecha_unica', '')
    fecha_desde = request.GET.get('fecha_desde', '')
    fecha_hasta = request.GET.get('fecha_hasta', '')

    hoy = timezone.localdate()

    # Rango de fechas
    if fecha_unica:
        try:
            fecha_inicio = fecha_fin = date.fromisoformat(fecha_unica)
        except ValueError:
            fecha_inicio = fecha_fin = hoy
    elif fecha_desde and fecha_hasta:
        try:
            fecha_inicio = date.fromisoformat(fecha_desde)
            fecha_fin = date.fromisoformat(fecha_hasta)
        except ValueError:
            fecha_inicio = hoy - timedelta(days=90)
            fecha_fin = hoy
    else:
        fecha_fin = hoy
        fecha_inicio = hoy - timedelta(days=90)

    # ============================================================
    # Datos auxiliares
    # ============================================================
    horarios_empleado = [
        (h, h.ciclo_inicio, ciclo_fin(h))
        for h in Horario.objects.filter(empleado=empleado, ciclo_inicio__isnull=False)
    ]

    def horario_del_dia(fecha):
        for h, ci, cf in horarios_empleado:
            if ci <= fecha and (cf is None or fecha <= cf):
                return h
        return None

    asistencias_por_fecha = {
        a.fecha: a
        for a in Asistencia.objects.filter(
            horario__empleado=empleado,
            fecha__gte=fecha_inicio,
            fecha__lte=fecha_fin,
        )
    }

    descansos_fechas = set(
        DescansoEmpleado.objects.filter(
            horario__empleado=empleado,
            fecha__gte=fecha_inicio,
            fecha__lte=fecha_fin,
            es_descanso=True,
        ).values_list('fecha', flat=True)
    )

    novedades_por_fecha = obtener_novedades_por_fecha(
        empleado, fecha_inicio, fecha_fin
    )

    # ============================================================
    # Recorrer día a día
    # ============================================================
    registros = []
    fecha_cursor = fecha_fin

    while fecha_cursor >= fecha_inicio:
        horario_dia = horario_del_dia(fecha_cursor)

        if horario_dia is None:
            fecha_cursor -= timedelta(days=1)
            continue

        if fecha_cursor > hoy:
            fecha_cursor -= timedelta(days=1)
            continue

        novedad_dia = novedades_por_fecha.get(fecha_cursor)
        asistencia = asistencias_por_fecha.get(fecha_cursor)

        es_novedad = False
        novedad_tipo = None

        if novedad_dia and novedad_dia['tipo'] in ('PERMISO', 'INCAPACIDAD'):
            estado_final = novedad_dia['tipo']
            hora_programada = 'N/A'
            hora_marcada = 'N/A'
            es_novedad = True
            novedad_tipo = novedad_dia['tipo']

        elif novedad_dia and novedad_dia['tipo'] == 'CAMBIO_TURNO':
            es_novedad = True
            novedad_tipo = 'CAMBIO_TURNO'
            if asistencia and asistencia.estado:
                estado_final = asistencia.estado
                hora_marcada = (
                    asistencia.hora_marcada.strftime('%H:%M')
                    if asistencia.hora_marcada else 'N/A'
                )
            else:
                estado_final = 'CAMBIO_TURNO'
                hora_marcada = 'N/A'
            hora_programada = (
                horario_dia.hora_entrada.strftime('%H:%M')
                if horario_dia.hora_entrada else 'N/A'
            )

        elif fecha_cursor in descansos_fechas:
            estado_final = 'DESCANSO'
            hora_programada = 'N/A'
            hora_marcada = 'N/A'

        elif asistencia:
            estado_final = asistencia.estado or 'SIN_REGISTRO'
            hora_programada = (
                horario_dia.hora_entrada.strftime('%H:%M')
                if horario_dia.hora_entrada else 'N/A'
            )
            hora_marcada = (
                asistencia.hora_marcada.strftime('%H:%M')
                if asistencia.hora_marcada else 'N/A'
            )

        else:
            estado_final = 'AUSENTE'
            hora_programada = (
                horario_dia.hora_entrada.strftime('%H:%M')
                if horario_dia.hora_entrada else 'N/A'
            )
            hora_marcada = 'N/A'

        # Filtros
        if turno and horario_dia.turno != turno:
            fecha_cursor -= timedelta(days=1)
            continue

        if estado_filtro and estado_final != estado_filtro:
            fecha_cursor -= timedelta(days=1)
            continue

        registros.append({
            'fecha': fecha_cursor.strftime('%d/%m/%Y'),
            'estado': estado_final,
            'es_novedad': es_novedad,
            'novedad_tipo': novedad_tipo,
            'turno': horario_dia.get_turno_display(),
            'hora_programada': hora_programada,
            'hora_marcada': hora_marcada,
            'id': asistencia.id if asistencia else None,
        })

        fecha_cursor -= timedelta(days=1)

    # ============================================================
    # Render
    # ============================================================
    html = render_to_string('admin/asistencia/empleado_historial_lista.html', {
        'registros': registros,
    }, request=request)

    return JsonResponse({
        'html': html,
        'empleado_nombre': empleado.nombre_completo(),
        'empleado_cargo': empleado.get_cargo_display() or 'Sin cargo',
    })


# Fin.


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


# Cambio del 8 de septiembre del 2026:

    # Se cambio porque el dropdown de asistencia del admin, se recargaba por el metodo POST
    # Ahora se implemento AJAX para siempre tener el dropdown abierto cuando se esta registrando asistencia.

    # Ahora valida si registrar o no la asistencia dependiendo de si corresponde al turno o

def registrar_asistencia(request):
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

    # VALIDACIÓN DE TURNO
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
                'hora_marcada': asistencia_existente.hora_marcada.strftime('%H:%M'),
                'estado_display': asistencia_existente.get_estado_display(),
                'ya_registrado': True
            })
        return redirect("asistencia:asistencia_dashboard")

    # Registrar nueva asistencia
    estado = "PRESENTE" if hora_actual <= hora_entrada else "TARDE"
    asistencia = Asistencia.objects.create(
        horario=horario,
        fecha=hoy,
        estado=estado,
        hora_marcada=hora_actual,
    )

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'success': True,
            'estado': asistencia.estado,
            'hora_marcada': asistencia.hora_marcada.strftime('%H:%M'),
            'estado_display': asistencia.get_estado_display(),
            'ya_registrado': False
        })

    return redirect("asistencia:asistencia_dashboard")


def asistencia_empleado(request):

    _verificar_memorandos_asistencia_empleado(request.user)

    from .services.novedades_calendario import obtener_novedades_por_fecha

    perfil = request.user.perfil
    hoy = timezone.localdate()

    filtro = request.GET.get('filtro', 'semana')
    if filtro == 'mes':
        fecha_inicio = hoy - timedelta(days=30)
    else:
        fecha_inicio = hoy - timedelta(days=7)

    horario = obtener_o_generar_horario_vigente(perfil)

    # Novedades aprobadas en el rango del historial
    novedades_por_fecha = obtener_novedades_por_fecha(perfil, fecha_inicio, hoy)

    estado_hoy = {
        'tiene_jornada': False,
        'turno': None,
        'hora_entrada_prog': None,
        'hora_salida_prog': None,
        'hora_entrada_real': None,
        'hora_salida_real': None,
        'estado': None,
        'es_descanso': False,
        'tardanza_minutos': None,
        'novedad': None,
    }

    if horario:
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

        novedad_hoy = novedades_por_fecha.get(hoy)

        if novedad_hoy and novedad_hoy['tipo'] in ('PERMISO', 'INCAPACIDAD'):
            # Permiso o incapacidad: no trabaja → estado y novedad
            estado_hoy['estado'] = novedad_hoy['tipo']
            estado_hoy['novedad'] = novedad_hoy
        elif novedad_hoy and novedad_hoy['tipo'] == 'CAMBIO_TURNO':
            # Cambio de turno: SÍ trabaja, pero guardamos la novedad para mostrarla
            estado_hoy['novedad'] = novedad_hoy
            asistencia_hoy = Asistencia.objects.filter(horario=horario, fecha=hoy).first()
            if asistencia_hoy:
                estado_hoy['hora_entrada_real'] = asistencia_hoy.hora_marcada
                estado_hoy['estado'] = asistencia_hoy.estado
                if asistencia_hoy.estado == 'TARDE' and horario.hora_entrada:
                    entrada_prog = datetime.combine(hoy, horario.hora_entrada)
                    entrada_real = datetime.combine(hoy, asistencia_hoy.hora_marcada)
                    if entrada_real > entrada_prog:
                        estado_hoy['tardanza_minutos'] = int(
                            (entrada_real - entrada_prog).total_seconds() // 60
                        )
            else:
                estado_hoy['estado'] = 'AUSENTE'
        elif es_descanso_hoy:
            estado_hoy['estado'] = 'DESCANSO'
            estado_hoy['es_descanso'] = True
        else:
            asistencia_hoy = Asistencia.objects.filter(horario=horario, fecha=hoy).first()
            if asistencia_hoy:
                estado_hoy['hora_entrada_real'] = asistencia_hoy.hora_marcada
                estado_hoy['estado'] = asistencia_hoy.estado
                if asistencia_hoy.estado == 'TARDE' and horario.hora_entrada:
                    entrada_prog = datetime.combine(hoy, horario.hora_entrada)
                    entrada_real = datetime.combine(hoy, asistencia_hoy.hora_marcada)
                    if entrada_real > entrada_prog:
                        estado_hoy['tardanza_minutos'] = int(
                            (entrada_real - entrada_prog).total_seconds() // 60
                        )
            else:
                estado_hoy['estado'] = 'AUSENTE'
    else:
        estado_hoy['estado'] = 'SIN_HORARIO'

    # ============================================================
    # HISTORIAL
    # ============================================================
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
                fecha_cursor -= timedelta(days=1)
                continue

            novedad_dia = novedades_por_fecha.get(fecha_cursor)

            # --------------------------------------------------
            # 1. PRIORIDAD: PERMISO / INCAPACIDAD (no trabajó)
            # --------------------------------------------------
            if novedad_dia and novedad_dia['tipo'] in ('PERMISO', 'INCAPACIDAD'):
                historial.append({
                    'fecha': fecha_cursor,
                    'es_descanso': False,
                    'es_novedad': True,
                    'novedad_tipo': novedad_dia['tipo'],
                    'novedad_detalle': novedad_dia['detalle'],
                    'estado': novedad_dia['tipo'],
                    'hora_marcada': None,
                    'tardanza_display': '--',
                    'turno': horario_dia.get_turno_display(),
                    'hora_entrada_prog': horario_dia.hora_entrada,
                    'hora_salida_prog': horario_dia.hora_salida,
                })
            else:
                # --------------------------------------------------
                # 2. CAMBIO_TURNO / DESCANSO / asistencia real
                # --------------------------------------------------
                es_cambio_turno = novedad_dia and novedad_dia['tipo'] == 'CAMBIO_TURNO'

                if fecha_cursor in descansos_fechas and not es_cambio_turno:
                    historial.append({
                        'fecha': fecha_cursor,
                        'es_descanso': True,
                        'es_novedad': False,
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
                        estado_dia = 'AUSENTE'
                        hora_marcada = None
                    else:
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
                        'es_novedad': es_cambio_turno,
                        'novedad_tipo': 'CAMBIO_TURNO' if es_cambio_turno else None,
                        'novedad_detalle': novedad_dia['detalle'] if es_cambio_turno else None,
                        'estado': estado_dia,
                        'hora_marcada': hora_marcada,
                        'tardanza_display': tardanza_display,
                        'turno': horario_dia.get_turno_display(),
                        'hora_entrada_prog': horario_dia.hora_entrada,
                        'hora_salida_prog': horario_dia.hora_salida,
                    })

                    # Cambio de turno SÍ cuenta como asistencia si trabajó
                    if estado_dia in ('PRESENTE', 'TARDE'):
                        dias_asistencia += 1
                    if estado_dia == 'TARDE':
                        retardos += 1

            fecha_cursor -= timedelta(days=1)

    # Días sin asistencia: SOLO ausencias reales
    dias_sin_asistencia = sum(
        1 for d in historial
        if d['estado'] == 'AUSENTE' and not d.get('es_novedad')
    )

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


# Cambio del 7 de septiembre
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
    }
    return JsonResponse(data)


@login_required
@login_required
def empleado_horario(request):
    from .services.novedades_calendario import obtener_novedades_por_fecha

    perfil = request.user.perfil
    hoy = timezone.localdate()

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

        fechas_calendario = [dia['fecha'] for dia in calendario if dia]
        asistencias = Asistencia.objects.filter(
            horario=horario_actual,
            fecha__in=fechas_calendario
        )
        asistencias_por_fecha = {a.fecha: a.estado for a in asistencias}

        fecha_min = min(fechas_calendario) if fechas_calendario else hoy
        fecha_max = max(fechas_calendario) if fechas_calendario else hoy
        novedades_por_fecha = obtener_novedades_por_fecha(perfil, fecha_min, fecha_max)

        for dia in calendario:
            if dia:
                fecha = dia['fecha']
                novedad = novedades_por_fecha.get(fecha)

                # ----------------------------------------------
                # 1. PRIORIDAD: PERMISO / INCAPACIDAD
                # ----------------------------------------------
                if novedad and novedad['tipo'] in ('PERMISO', 'INCAPACIDAD'):
                    dia['estado'] = novedad['tipo']
                    dia['estado_texto'] = (
                        'Permiso' if novedad['tipo'] == 'PERMISO' else 'Incapacidad'
                    )
                    dia['novedad'] = novedad

                # ----------------------------------------------
                # 2. CAMBIO_TURNO (trabaja, pero en otro horario)
                # ----------------------------------------------
                elif novedad and novedad['tipo'] == 'CAMBIO_TURNO':
                    dia['estado'] = 'CAMBIO_TURNO'
                    dia['estado_texto'] = 'Cambio de turno'
                    dia['novedad'] = novedad
                    # Si hubo asistencia, respetamos que trabajó
                    if fecha in asistencias_por_fecha:
                        dia['estado'] = asistencias_por_fecha[fecha]
                        dia['estado_texto'] = (
                            'Presente' if asistencias_por_fecha[fecha] == 'PRESENTE'
                            else 'Tardanza'
                        )

                # ----------------------------------------------
                # 3. Resto de la lógica normal
                # ----------------------------------------------
                elif dia['es_descanso']:
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
    from .services.novedades_calendario import obtener_novedades_por_fecha

    horario = get_object_or_404(Horario, id=id, empleado=request.user.perfil)
    hoy = timezone.localdate()

    fecha_inicio = horario.ciclo_inicio or horario.fecha_creacion.date()
    dias = dias_ciclo(horario.turno)
    fecha_fin = fecha_inicio + timedelta(days=dias - 1)

    asistencias = Asistencia.objects.filter(
        horario=horario,
        fecha__gte=fecha_inicio,
        fecha__lt=fecha_inicio + timedelta(days=dias)
    )

    calendario = construir_calendario(
        horario, fecha_inicio, dias=dias, hoy=hoy, asistencias=asistencias
    )

    # ============================================================
    # NUEVO: aplicar novedades (permisos / incapacidades / cambios de turno)
    # ============================================================
    novedades_por_fecha = obtener_novedades_por_fecha(
        horario.empleado, fecha_inicio, fecha_fin
    )

    for dia in calendario:
        if not dia:
            continue

        novedad = novedades_por_fecha.get(dia['fecha'])

        if novedad and novedad['tipo'] in ('PERMISO', 'INCAPACIDAD'):
            # Máxima prioridad: no trabajó
            dia['estado'] = novedad['tipo']
            dia['estado_texto'] = (
                'Permiso' if novedad['tipo'] == 'PERMISO' else 'Incapacidad'
            )
        elif novedad and novedad['tipo'] == 'CAMBIO_TURNO':
            # Cambio de turno: si ya marcó asistencia, respetar eso
            if dia.get('estado') not in ('PRESENTE', 'TARDE'):
                dia['estado'] = 'CAMBIO_TURNO'
                dia['estado_texto'] = 'Cambio de turno'

    # ============================================================

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
        'horas': (
            f"{horario.hora_entrada.strftime('%H:%M')} - "
            f"{horario.hora_salida.strftime('%H:%M')}"
        ),
    }

    return JsonResponse({'html': html, 'metadatos': metadatos})


# ============================================================
# ADMIN - ASISTENCIA POR EMPLEADO
# ============================================================

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


# ============================================================
# ADMIN - CAMBIAR ESTADO DE ASISTENCIA (AJAX)
# ============================================================

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