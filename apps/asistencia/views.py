from datetime import date, timedelta
from datetime import datetime, time
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone

from apps.usuarios.models import PerfilEmpleado
from apps.usuarios.decorators import admin_required
from .models import Asistencia, DescansoEmpleado, Horario


# ---

# La importacion paginator sirve para el historial de asistencia 

from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
# ---



# Gmail API
from apps.notificaciones.utils import enviar_notificacion, obtener_correo_admin

def dias_ciclo(turno):
    """Devuelve la duración informativa del ciclo según el turno."""
    return 8 if turno == "FIJO" else 15


def _siguiente_dia_habil(dia_semana):
    if dia_semana >= 4:
        return 0
    return dia_semana + 1


def _proxima_fecha_con_dia_semana(desde, dia_semana_objetivo):
    fecha = desde
    while fecha.weekday() != dia_semana_objetivo:
        fecha += timedelta(days=1)
    return fecha


def regenerar_descanso_si_vencido(horario, hoy):
    descansos = list(
        DescansoEmpleado.objects
        .filter(horario=horario)
        .order_by("-fecha", "-id")
    )

    if not descansos:
        if hoy.weekday() <= 4:
            nueva_fecha = hoy
        else:
            nueva_fecha = hoy + timedelta(days=7 - hoy.weekday())

        descanso = DescansoEmpleado.objects.create(
            horario=horario,
            fecha=nueva_fecha,
            es_descanso=True,
        )

        horario.ciclo_inicio = hoy
        horario.save(update_fields=["ciclo_inicio"])
        return descanso

    descanso = descansos[0]
    otros_ids = [d.id for d in descansos[1:]]

    if otros_ids:
        DescansoEmpleado.objects.filter(id__in=otros_ids).delete()

    if not descanso.es_descanso:
        descanso.es_descanso = True
        descanso.save(update_fields=["es_descanso"])

    if descanso.fecha >= hoy:
        return descanso

    fecha_anterior = descanso.fecha

    if horario.turno == "FIJO":
        dia_objetivo = fecha_anterior.weekday()
        base = fecha_anterior + timedelta(days=1)
        nueva_fecha = _proxima_fecha_con_dia_semana(base, dia_objetivo)
    else:
        dia_objetivo = _siguiente_dia_habil(fecha_anterior.weekday())
        base = fecha_anterior + timedelta(days=1)
        nueva_fecha = _proxima_fecha_con_dia_semana(base, dia_objetivo)

    DescansoEmpleado.objects.filter(horario=horario).exclude(id=descanso.id).delete()

    descanso.fecha = nueva_fecha
    descanso.es_descanso = True
    descanso.save(update_fields=["fecha", "es_descanso"])

    horario.ciclo_inicio = hoy
    horario.save(update_fields=["ciclo_inicio"])

    return descanso


def ciclo_fin(horario):
    if not horario.ciclo_inicio:
        return None

    return horario.ciclo_inicio + timedelta(
        days=dias_ciclo(horario.turno) - 1
    )

def estado_vigencia_horario(horario, hoy, fin):
    """Determina el estado de vigencia mostrado en la tabla/modal."""
    if not horario.estado:
        return "inactivo"
    if fin is None:
        return "activo"
    if fin < hoy:
        return "vencido"
    if (fin - hoy).days <= 2:
        return "por_vencer"
    return "activo"


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

    # 1. Obtenemos los horarios base
    horarios_qs = (
        Horario.objects
        .filter(estado=True)
        .select_related("empleado")
    )

    horarios = []
    for horario in horarios_qs:
        horario.proximo_descanso = regenerar_descanso_si_vencido(horario, hoy)
        horario.vigencia_fin = ciclo_fin(horario)
        horario.vigencia_estado = estado_vigencia_horario(horario, hoy, horario.vigencia_fin)
        horarios.append(horario)

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



# Cambio el 1 de sep para historial de asistencia con filtros y paginación

@login_required
@admin_required
def asistencia_dashboard(request):
    # Obtener contexto base (día actual, KPIs, turnos, etc.)
    context = _contexto_base()

    # Agregar histórico inicial (sin filtros, página 1)
    historico = Asistencia.objects.select_related('horario__empleado').order_by('-fecha', '-hora_marcada')
    paginator = Paginator(historico, 12)
    page_obj = paginator.get_page(1)
    context['page_obj'] = page_obj

    # También pasar la lista de empleados para el filtro
    context['empleados'] = PerfilEmpleado.objects.all().order_by('primer_nombre')

    return render(request, 'admin/asistencia/asistencia.html', context)


# ---



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
                f"El empleado {empleado} ya tiene un horario activo asignado."
            )
            return redirect("asistencia:horarios")

        # Convertir strings de hora a objetos time de Python de forma segura
        hora_entrada_obj = datetime.strptime(hora_entrada_str, '%H:%M').time() if hora_entrada_str else None
        hora_salida_obj = datetime.strptime(hora_salida_str, '%H:%M').time() if hora_salida_str else None

        horario = Horario.objects.create(
            empleado=empleado,
            turno=turno,
            hora_entrada=hora_entrada_obj,
            hora_salida=hora_salida_obj,
            estado=True,
            ciclo_inicio=timezone.localdate(),
        )
        
        # =====================================================
        # NOTIFICACIÓN AL EMPLEADO (Usando el objeto ya guardado)
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

        if fecha_descanso:
            DescansoEmpleado.objects.create(
                horario=horario,
                fecha=fecha_descanso,
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
    horario = get_object_or_404(
        Horario.objects.select_related("empleado"),
        id=id
    )

    hoy = timezone.localdate()
    descanso = regenerar_descanso_si_vencido(horario, hoy)
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
        "ciclo_inicio": horario.ciclo_inicio.strftime("%d/%m/%Y") if horario.ciclo_inicio else None,
        "ciclo_fin": fin.strftime("%d/%m/%Y") if fin else None,
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
            
        fecha_descanso = request.POST.get("fecha_descanso")

        if fecha_descanso:
            descanso = DescansoEmpleado.objects.filter(horario=horario, es_descanso=True).order_by("-fecha", "-id").first()
            if descanso:
                descanso.fecha = fecha_descanso
                descanso.save(update_fields=["fecha"])
            else:
                DescansoEmpleado.objects.create(
                    horario=horario,
                    fecha=fecha_descanso,
                    es_descanso=True,
                )
            horario.ciclo_inicio = timezone.localdate()

        horario.save()

        # =====================================================
        # NOTIFICACIÓN AL EMPLEADO (DESPUÉS DE GUARDAR)
        # =====================================================
        contexto = {
            'empleado_nombre': horario.empleado.nombre_completo(),
            'turno': horario.get_turno_display(),
            'hora_entrada': horario.hora_entrada.strftime('%H:%M') if horario.hora_entrada else '',
            'hora_salida': horario.hora_salida.strftime('%H:%M') if horario.hora_salida else '',
            'fecha_descanso': fecha_descanso if fecha_descanso else 'A definir',
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


def registrar_asistencia(request):
    if request.method == "POST":
        horario_id = request.POST.get("horario_id")
        horario = get_object_or_404(Horario, id=horario_id)

        asistencia_existente = (
            Asistencia.objects
            .filter(
                horario=horario,
                fecha=timezone.localdate()
            )
            .first()
        )

        if asistencia_existente:
            return redirect("asistencia:asistencia_dashboard")

        hora_actual = timezone.localtime().time()
        estado = "PRESENTE" if hora_actual <= horario.hora_entrada else "TARDE"

        Asistencia.objects.create(
            horario=horario,
            fecha=timezone.localdate(),
            estado=estado,
            hora_marcada=hora_actual,
        )

    return redirect("asistencia:asistencia_dashboard")


def asistencia_empleado(request):
    perfil = request.user.perfil
    hoy = timezone.localdate()
    
    # 1. Capturar el filtro (default 'semana')
    filtro = request.GET.get('filtro', 'semana')
    
    # 2. Definir fecha de inicio según filtro
    if filtro == 'mes':
        fecha_inicio = hoy - timedelta(days=30)
    else:
        # Asumimos semana (7 días atrás)
        fecha_inicio = hoy - timedelta(days=7)

    horario = (
        Horario.objects
        .filter(empleado=perfil, estado=True)
        .order_by("-id")
        .first()
    )

    proximo_descanso = None
    calendario = []
    asistencias = []
    dias_asistencia = 0
    dias_sin_asistencia = 0
    retardos = 0

    if horario:
        proximo_descanso = regenerar_descanso_si_vencido(horario, hoy)

        for _ in range(hoy.weekday()):
            calendario.append(None)

        for i in range(dias_ciclo(horario.turno)):
            fecha = hoy + timedelta(days=i)
            calendario.append({
                "numero": fecha.day,
                "fecha": fecha,
                "es_descanso": (
                    proximo_descanso is not None
                    and fecha == proximo_descanso.fecha
                ),
            })

        asistencias = (
            Asistencia.objects
            .filter(horario=horario, fecha__gte=fecha_inicio)
            .order_by("-fecha")
        )

        dias_asistencia = asistencias.count()
        retardos = asistencias.filter(estado="TARDE").count()
        dias_sin_asistencia = max(0, 30 - dias_asistencia)

    return render(
        request,
        "empleado/asistencia/asistencia.html",
        {
            "fecha_hoy": hoy,
            "horario": horario,
            "proximo_descanso": proximo_descanso,
            "calendario": calendario,
            "asistencias": asistencias,
            "dias_asistencia": dias_asistencia,
            "dias_sin_asistencia": dias_sin_asistencia,
            "retardos": retardos,
            "filtro": filtro,  
        }
    )


# Funcionalidades para Dashboards

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
    from django.contrib import messages
    from django.shortcuts import redirect
    from django.urls import reverse
    from apps.usuarios.models import PerfilEmpleado
    
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
        horario = Horario.objects.filter(empleado=empleado, estado=True).first()
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






# Historial de Asistencia para administradores con filtros y paginación


@login_required
@admin_required
def asistencia_historico(request):
    """
    Vista para el historial de asistencias con filtros y paginación.
    Devuelve HTML parcial para actualización vía AJAX.
    """
    # Obtener parámetros GET
    page = request.GET.get('page', 1)
    busqueda = request.GET.get('busqueda', '').strip()
    empleados_ids = request.GET.getlist('empleados')  # lista de IDs
    turno = request.GET.get('turno', '')
    estado = request.GET.get('estado', '')
    fecha_unica = request.GET.get('fecha_unica', '')
    fecha_desde = request.GET.get('fecha_desde', '')
    fecha_hasta = request.GET.get('fecha_hasta', '')

    # Query base con select_related para optimizar
    asistencias = Asistencia.objects.select_related('horario__empleado').all()

    # Aplicar filtros
    if busqueda:
        # Buscar en nombre del empleado (primer nombre, segundo, apellidos), fecha (como string), y estado
        asistencias = asistencias.filter(
            Q(horario__empleado__primer_nombre__icontains=busqueda) |
            Q(horario__empleado__segundo_nombre__icontains=busqueda) |
            Q(horario__empleado__primer_apellido__icontains=busqueda) |
            Q(horario__empleado__segundo_apellido__icontains=busqueda) |
            Q(fecha__icontains=busqueda) |
            Q(estado__icontains=busqueda)
        )

    if empleados_ids:
        asistencias = asistencias.filter(horario__empleado__id__in=empleados_ids)

    if turno:
        asistencias = asistencias.filter(horario__turno=turno)

    if estado:
        asistencias = asistencias.filter(estado=estado)

    if fecha_unica:
        asistencias = asistencias.filter(fecha=fecha_unica)

    if fecha_desde and fecha_hasta:
        asistencias = asistencias.filter(fecha__range=[fecha_desde, fecha_hasta])
    elif fecha_desde:
        asistencias = asistencias.filter(fecha__gte=fecha_desde)
    elif fecha_hasta:
        asistencias = asistencias.filter(fecha__lte=fecha_hasta)

    # Ordenar (más reciente primero)
    asistencias = asistencias.order_by('-fecha', '-hora_marcada')

    # Paginación (12 por página)
    paginator = Paginator(asistencias, 12)
    try:
        page_obj = paginator.page(page)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)

    # Si es AJAX, devolver solo el parcial
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        context = {
            'page_obj': page_obj,
        }
        return render(request, 'admin/asistencia/historial_cards.html', context)
    else:
        # Si no es AJAX, redirigir al dashboard (o renderizar completo)
        # Normalmente no se usará, pero por si acaso
        return redirect('asistencia:asistencia_dashboard')