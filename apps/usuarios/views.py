from datetime import date, timedelta, datetime
import json
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import reverse
from django.utils import timezone
from django.utils.dateparse import parse_date

from .models import User, PerfilEmpleado
from .forms import UserForm, PerfilEmpleadoForm
from .decorators import admin_required
from apps.asistencia.models import Horario, Asistencia, DescansoEmpleado
from apps.asistencia.views import _contexto_base
from apps.tareas.models import Task, EstadoTarea
from apps.novedades.models import Permiso, Incapacidad, Certificado
from apps.memorandos.models import Memorando


# ========================
# DASHBOARDS
# ========================

@login_required
@admin_required
def admin_dashboard(request):
    # 1. Contexto base de asistencia (ya existente)
    contexto = _contexto_base()
    
    # 2. Empleados activos
    total_empleados_activos = PerfilEmpleado.objects.filter(estado='activo').count()
    
    # 3. KPIs de tareas (método existente)
    kpis_tareas = Task.get_kpis_administrador()
    
    # 4. Tareas pendientes / en progreso: ordenadas por fecha más antigua primero (vencidas primero)
    tareas_pendientes_qs = Task.objects.filter(
        estado__in=['PENDIENTE', 'EN_PROGRESO']
    ).select_related('empleado').order_by('fecha_limite', 'prioridad')
    
    tareas_pendientes_mostrar = list(tareas_pendientes_qs[:20])  # máximo 20 para el dashboard
    
    # 5. Novedades pendientes (conteos y listas para iterar en el template)
    permisos_pendientes_qs = Permiso.objects.filter(estado='pendiente').select_related('empleado')
    incapacidades_pendientes_qs = Incapacidad.objects.filter(estado='pendiente').select_related('empleado')
    certificados_pendientes_qs = Certificado.objects.filter(estado='pendiente').select_related('empleado')
    
    permisos_pendientes = permisos_pendientes_qs.count()
    incapacidades_pendientes = incapacidades_pendientes_qs.count()
    certificados_pendientes = certificados_pendientes_qs.count()
    total_solicitudes_pendientes = permisos_pendientes + incapacidades_pendientes + certificados_pendientes
    
    # --- Construir lista unificada de novedades pendientes (ordenadas por fecha) ---
    novedades_pendientes = []
    for p in permisos_pendientes_qs:
        novedades_pendientes.append({
            'tipo': 'permiso',
            'empleado': p.empleado,
            'fecha': p.fecha_solicitud,
            'detalle': p.get_tipo_display(),
            'url': reverse('novedades:novedades_admin'),
            'id': p.id,
        })
    for i in incapacidades_pendientes_qs:
        novedades_pendientes.append({
            'tipo': 'incapacidad',
            'empleado': i.empleado,
            'fecha': i.fecha_solicitud,
            'detalle': i.titulo,
            'url': reverse('novedades:novedades_admin'),
            'id': i.id,
        })
    for c in certificados_pendientes_qs:
        novedades_pendientes.append({
            'tipo': 'certificado',
            'empleado': c.empleado,
            'fecha': c.fecha_solicitud,
            'detalle': c.get_tipo_display(),
            'url': reverse('novedades:novedades_admin'),  # no hay detalle individual
            'id': c.id,
        })
    
    # Ordenar por fecha descendente (más reciente primero) y tomar 20
    novedades_pendientes.sort(key=lambda x: x['fecha'], reverse=True)
    novedades_pendientes_mostrar = novedades_pendientes[:20]
    
    # 6. ASISTENCIA: filtrar por turno según hora actual y mostrar ausentes, o tardanzas si no hay ausentes
    hora_actual = timezone.localtime().time()

    # Determinar turno actual
    if hora_actual >= datetime.strptime('04:00', '%H:%M').time() and hora_actual < datetime.strptime('13:00', '%H:%M').time():
        turno_actual = 'MANANA'
    elif hora_actual >= datetime.strptime('13:00', '%H:%M').time() and hora_actual < datetime.strptime('23:00', '%H:%M').time():
        turno_actual = 'TARDE'
    else:
        turno_actual = None  # fuera de horario laboral

    ausentes_hoy = []
    tardanzas_hoy = []
    if turno_actual:
        for horario in contexto['turnos_hoy'].get(turno_actual, []):
            if not horario.asistencia or horario.asistencia.estado == 'AUSENTE':
                ausentes_hoy.append({
                    'empleado': horario.empleado,
                    'asistencia': horario.asistencia,
                })
            elif horario.asistencia and horario.asistencia.estado == 'TARDE':
                tardanzas_hoy.append({
                    'empleado': horario.empleado,
                    'asistencia': horario.asistencia,
                })

    # Si no hay ausentes, mostrar tardanzas
    if ausentes_hoy:
        lista_asistencia = ausentes_hoy
        estado_label = 'Ausente'
        badge_color = 'bg-danger'
    else:
        lista_asistencia = tardanzas_hoy
        estado_label = 'Tarde'
        badge_color = 'bg-warning text-dark'

    # Ahora en el contexto pasamos lista_asistencia, estado_label, badge_color
    
    # 7. Feed de actividad (últimos 8 eventos combinados)
    ultimos_permisos = Permiso.objects.select_related('empleado').order_by('-fecha_solicitud')[:8]
    ultimas_incapacidades = Incapacidad.objects.select_related('empleado').order_by('-fecha_solicitud')[:8]
    ultimos_certificados = Certificado.objects.select_related('empleado').order_by('-fecha_solicitud')[:8]
    ultimas_tareas = Task.objects.select_related('empleado').order_by('-fecha_asignacion')[:8]
    
    actividad = []
    
    for p in ultimos_permisos:
        actividad.append({
            'tipo': 'permiso',
            'fecha': p.fecha_solicitud,
            'empleado': p.empleado.nombre_completo(),
            'estado': p.get_estado_display(),
            'detalle': f"Solicitud de {p.get_tipo_display()}",
            'id': p.id,
            'modelo': 'permiso'
        })
    for i in ultimas_incapacidades:
        actividad.append({
            'tipo': 'incapacidad',
            'fecha': i.fecha_solicitud,
            'empleado': i.empleado.nombre_completo(),
            'estado': i.get_estado_display(),
            'detalle': f"Incapacidad: {i.titulo}",
            'id': i.id,
            'modelo': 'incapacidad'
        })
    for c in ultimos_certificados:
        actividad.append({
            'tipo': 'certificado',
            'fecha': c.fecha_solicitud,
            'empleado': c.empleado.nombre_completo(),
            'estado': c.get_estado_display(),
            'detalle': f"Certificado de {c.get_tipo_display()}",
            'id': c.id,
            'modelo': 'certificado'
        })
    for t in ultimas_tareas:
        actividad.append({
            'tipo': 'tarea',
            'fecha': t.fecha_asignacion,
            'empleado': t.empleado.nombre_completo(),
            'estado': t.get_estado_display(),
            'detalle': f"Tarea: {t.titulo}",
            'id': t.id,
            'modelo': 'tarea'
        })
    
    # Ordenar por fecha descendente y tomar 8
    actividad.sort(key=lambda x: x['fecha'], reverse=True)
    actividad = actividad[:8]
    
    # Asignar URLs reales a cada ítem del feed
    for item in actividad:
        if item['modelo'] == 'permiso':
            item['url'] = reverse('novedades:permiso_detalle', args=[item['id']])
        elif item['modelo'] == 'incapacidad':
            item['url'] = reverse('novedades:incapacidad_detalle', args=[item['id']])
        elif item['modelo'] == 'certificado':
            item['url'] = reverse('novedades:novedades_admin')
        elif item['modelo'] == 'tarea':
            item['url'] = reverse('tareas:admin_tarea_edit', args=[item['id']])
    
    # 8. Datos para gráficas (en formato JSON para Chart.js)
    # Asistencia
    asistencia_data = {
        'labels': ['Presentes', 'Tardanzas', 'Ausentes'],
        'values': [
            contexto['resumen_asistencia']['presentes'],
            contexto['resumen_asistencia']['tardanzas'],
            contexto['resumen_asistencia']['ausentes']
        ],
        'colors': ['#28a745', '#ffc107', '#dc3545']
    }
    
    # Tareas por estado
    tareas_estado = {
        'labels': ['Pendientes', 'En progreso', 'Finalizadas'],
        'values': [
            kpis_tareas['pendientes'],
            kpis_tareas['en_progreso'],
            kpis_tareas['finalizadas']
        ],
        'colors': ['#ffc107', '#17a2b8', '#28a745']
    }
    
    # Novedades pendientes por tipo
    novedades_data = {
        'labels': ['Permisos', 'Incapacidades', 'Certificados'],
        'values': [
            permisos_pendientes,
            incapacidades_pendientes,
            certificados_pendientes
        ],
        'colors': ['#007bff', '#dc3545', '#6c757d']
    }
    
    # 9. Contexto final
    contexto.update({
        'total_empleados_activos': total_empleados_activos,
        'kpis_tareas': kpis_tareas,
        'tareas_pendientes_mostrar': tareas_pendientes_mostrar,
        'permisos_pendientes': permisos_pendientes,
        'incapacidades_pendientes': incapacidades_pendientes,
        'certificados_pendientes': certificados_pendientes,
        'total_solicitudes_pendientes': total_solicitudes_pendientes,
        'novedades_pendientes_mostrar': novedades_pendientes_mostrar,
        'ausentes_hoy': ausentes_hoy,
        'actividad_reciente': actividad,
        'asistencia_chart_data': json.dumps(asistencia_data),
        'tareas_chart_data': json.dumps(tareas_estado),
        'novedades_chart_data': json.dumps(novedades_data),
        'perfil': request.user.perfil,
        'today': date.today(),

        'lista_asistencia': lista_asistencia,
        'estado_asistencia_label': estado_label,
        'badge_asistencia_color': badge_color,
    })
    
    return render(request, "admin/landingAdmin.html", contexto)

# Dasboard de Empleado - Esta función reune y contiene todo lo importante para LandingEmpleado.html

@login_required
def employee_dashboard(request):
    perfil = request.user.perfil
    hoy = date.today()
    
    # ============================================================
    # 1. HORARIO Y ASISTENCIA DEL DÍA
    # ============================================================
    
    horario = (
        Horario.objects
        .filter(empleado=perfil, estado=True)
        .order_by("-id")
        .first()
    )
    
    proximo_descanso = None
    asistencia_hoy = None
    estado_asistencia = "No ha sido marcado"
    badge_color = "bg-secondary"
    hora_entrada = None
    hora_salida = None
    turno_display = "Sin turno asignado"
    
    if horario:
        hora_entrada = horario.hora_entrada.strftime("%I:%M %p")
        hora_salida = horario.hora_salida.strftime("%I:%M %p")
        turno_display = horario.get_turno_display()
        
        proximo_descanso = (
            horario.descansos
            .filter(es_descanso=True, fecha__gte=hoy)
            .order_by("fecha")
            .first()
        )
        
        asistencia_hoy = (
            Asistencia.objects
            .filter(horario=horario, fecha=hoy)
            .first()
        )
        
        if asistencia_hoy:
            if asistencia_hoy.estado == "PRESENTE":
                estado_asistencia = "Llegaste puntual"
                badge_color = "bg-success"
            elif asistencia_hoy.estado == "TARDE":
                estado_asistencia = "Llegaste tarde"
                badge_color = "bg-warning text-dark"
            elif asistencia_hoy.estado == "AUSENTE":
                estado_asistencia = "Ausente"
                badge_color = "bg-danger"
        else:
            estado_asistencia = "No ha sido marcado"
            badge_color = "bg-secondary"
    
    # ============================================================
    # 2. HISTORIAL DE ASISTENCIA (últimos 30 días)
    # ============================================================
    
    historial_asistencia = []
    if horario:
        asistencias_historial = (
            Asistencia.objects
            .filter(horario=horario)
            .order_by("-fecha")[:30]
        )
        for a in asistencias_historial:
            historial_asistencia.append({
                'fecha': a.fecha,
                'estado': a.get_estado_display() if a.estado else "Sin marcar",
                'hora': a.hora_marcada.strftime("%H:%M") if a.hora_marcada else None,
                'badge': (
                    'bg-success' if a.estado == 'PRESENTE' else
                    'bg-warning text-dark' if a.estado == 'TARDE' else
                    'bg-danger' if a.estado == 'AUSENTE' else
                    'bg-secondary'
                )
            })
    
    # ============================================================
    # 3. ESTADÍSTICAS DE ASISTENCIA (últimos 30 días)
    # ============================================================
    
    estadisticas_asistencia = {
        'dias_trabajados': 0,
        'puntualidad': 0,
        'tardanzas': 0,
        'ausencias': 0,
    }
    
    if horario:
        asistencias_mes = Asistencia.objects.filter(
            horario=horario,
            fecha__gte=hoy - timedelta(days=30)
        )
        total = asistencias_mes.count()
        if total > 0:
            presentes = asistencias_mes.filter(estado='PRESENTE').count()
            tardanzas = asistencias_mes.filter(estado='TARDE').count()
            ausencias = asistencias_mes.filter(estado='AUSENTE').count()
            
            estadisticas_asistencia['dias_trabajados'] = presentes + tardanzas
            estadisticas_asistencia['puntualidad'] = round((presentes / total) * 100) if total > 0 else 0
            estadisticas_asistencia['tardanzas'] = tardanzas
            estadisticas_asistencia['ausencias'] = ausencias
    
    # ============================================================
    # 4. TAREAS DEL EMPLEADO
    # ============================================================
    
    tareas_pendientes = (
        Task.objects
        .filter(empleado=perfil)
        .exclude(estado=EstadoTarea.FINALIZADA)
        .order_by('fecha_limite', 'prioridad')
    )[:20]
    
    tareas_completadas = Task.objects.filter(
        empleado=perfil,
        estado=EstadoTarea.FINALIZADA
    ).count()
    
    # KPIs de tareas (usando método existente)
    kpis_tareas = Task.get_kpis_empleado(request.user)
    
    # ============================================================
    # 5. SOLICITUDES PENDIENTES
    # ============================================================
    
    permisos_pendientes = Permiso.objects.filter(empleado=perfil, estado='pendiente').count()
    incapacidades_pendientes = Incapacidad.objects.filter(empleado=perfil, estado='pendiente').count()
    certificados_pendientes = Certificado.objects.filter(empleado=perfil, estado='pendiente').count()
    total_solicitudes_pendientes = permisos_pendientes + incapacidades_pendientes + certificados_pendientes
    
    # ============================================================
    # 6. MEMORANDOS
    # ============================================================
    
    total_memorandos = Memorando.objects.filter(empleado=perfil, estado='emitido').count()
    
    # ============================================================
    # 7. ACTIVIDAD RECIENTE (feed personal)
    # ============================================================
    
    actividad = []
    
    # Tareas recientes
    tareas_recientes = Task.objects.filter(empleado=perfil).order_by('-fecha_actualizacion')[:5]
    for t in tareas_recientes:
        actividad.append({
            'tipo': 'tarea',
            'fecha': t.fecha_actualizacion,
            'detalle': f"Tarea: {t.titulo}",
            'estado': t.get_estado_display(),
            'url': reverse('tareas:empleado_tarea_detail', args=[t.id]),
            'icono': 'list-task',
            'color': 'text-info'
        })
    
    # Solicitudes recientes (permisos)
    permisos_recientes = Permiso.objects.filter(empleado=perfil).order_by('-fecha_solicitud')[:5]
    for p in permisos_recientes:
        actividad.append({
            'tipo': 'permiso',
            'fecha': p.fecha_solicitud,
            'detalle': f"Solicitud de {p.get_tipo_display()}",
            'estado': p.get_estado_display(),
            'url': reverse('novedades:solicitudes_empleado'),
            'icono': 'file-earmark-text',
            'color': 'text-primary'
        })
    
    # Solicitudes recientes (incapacidades)
    incapacidades_recientes = Incapacidad.objects.filter(empleado=perfil).order_by('-fecha_solicitud')[:5]
    for i in incapacidades_recientes:
        actividad.append({
            'tipo': 'incapacidad',
            'fecha': i.fecha_solicitud,
            'detalle': f"Incapacidad: {i.titulo}",
            'estado': i.get_estado_display(),
            'url': reverse('novedades:solicitudes_empleado'),
            'icono': 'heart-pulse',
            'color': 'text-danger'
        })
    
    # Certificados recientes
    certificados_recientes = Certificado.objects.filter(empleado=perfil).order_by('-fecha_solicitud')[:5]
    for c in certificados_recientes:
        actividad.append({
            'tipo': 'certificado',
            'fecha': c.fecha_solicitud,
            'detalle': f"Certificado de {c.get_tipo_display()}",
            'estado': c.get_estado_display(),
            'url': reverse('novedades:solicitudes_empleado'),
            'icono': 'award',
            'color': 'text-success'
        })
    
    # Memorandos recientes
    memorandos_recientes = Memorando.objects.filter(empleado=perfil, estado='emitido').order_by('-fecha_emision')[:5]
    for m in memorandos_recientes:
        actividad.append({
            'tipo': 'memorando',
            'fecha': m.fecha_emision,
            'detalle': f"Memorando: {m.asunto}",
            'estado': "Emitido",
            'url': reverse('memorandos:memorandos_empleado'),
            'icono': 'file-pdf',
            'color': 'text-danger'
        })
    
    # Ordenar por fecha descendente y tomar 8
    actividad.sort(key=lambda x: x['fecha'], reverse=True)
    actividad = actividad[:8]
    
    # ============================================================
    # 8. DATOS PARA GRÁFICAS (Chart.js)
    # ============================================================
    
    # Estado de tareas
    tareas_chart_data = {
        'labels': ['Pendientes', 'En progreso', 'Finalizadas'],
        'values': [
            kpis_tareas['pendientes'],
            kpis_tareas['en_progreso'],
            kpis_tareas['finalizadas']
        ],
        'colors': ['#ffc107', '#17a2b8', '#28a745']
    }
    
    # Asistencia del mes (últimos 30 días)
    if horario:
        asistencias_mes = Asistencia.objects.filter(
            horario=horario,
            fecha__gte=hoy - timedelta(days=30)
        )
        presentes = asistencias_mes.filter(estado='PRESENTE').count()
        tardanzas = asistencias_mes.filter(estado='TARDE').count()
        ausencias = asistencias_mes.filter(estado='AUSENTE').count()
    else:
        presentes = tardanzas = ausencias = 0
    
    asistencia_chart_data = {
        'labels': ['Presente', 'Tarde', 'Ausente'],
        'values': [presentes, tardanzas, ausencias],
        'colors': ['#28a745', '#ffc107', '#dc3545']
    }
    
    # Distribución de solicitudes pendientes
    solicitudes_chart_data = {
        'labels': ['Permisos', 'Incapacidades', 'Certificados'],
        'values': [permisos_pendientes, incapacidades_pendientes, certificados_pendientes],
        'colors': ['#007bff', '#dc3545', '#6c757d']
    }
    
    # ============================================================
    # 9. CONTEXTO FINAL
    # ============================================================
    
    context = {
        'perfil': perfil,
        'horario': horario,
        'proximo_descanso': proximo_descanso,
        'asistencia_hoy': asistencia_hoy,
        'estado_asistencia': estado_asistencia,
        'badge_color': badge_color,
        'hora_entrada': hora_entrada,
        'hora_salida': hora_salida,
        'turno_display': turno_display,
        'historial_asistencia': historial_asistencia[:8],  # primeros 8 para mostrar
        'historial_asistencia_total': len(historial_asistencia),
        'estadisticas_asistencia': estadisticas_asistencia,
        'tareas_pendientes': tareas_pendientes,
        'tareas_completadas': tareas_completadas,
        'kpis_tareas': kpis_tareas,
        'permisos_pendientes': permisos_pendientes,
        'incapacidades_pendientes': incapacidades_pendientes,
        'certificados_pendientes': certificados_pendientes,
        'total_solicitudes_pendientes': total_solicitudes_pendientes,
        'total_memorandos': total_memorandos,
        'actividad_reciente': actividad,
        'tareas_chart_data': json.dumps(tareas_chart_data),
        'asistencia_chart_data': json.dumps(asistencia_chart_data),
        'solicitudes_chart_data': json.dumps(solicitudes_chart_data),
        'today': hoy,
    }
    
    return render(
        request,
        "empleado/landingEmpleado.html",
        context
    )


# ========================
# GESTIÓN DE USUARIOS
# ========================

#@login_required
#@admin_required
def user_list_create(request):
    usuarios = PerfilEmpleado.objects.select_related("user").all()
    if request.method == "POST":
        user_form = UserForm(request.POST)
        perfil_form = PerfilEmpleadoForm(request.POST)
        if user_form.is_valid() and perfil_form.is_valid():
            user = user_form.save(commit=False)
            user.email = perfil_form.cleaned_data["correo"]
            user.set_password(
                user_form.cleaned_data["password"]
            )
            user.save()

            perfil = perfil_form.save(commit=False)
            perfil.user = user
            perfil.save()

            messages.success(
                request,
                "Usuario creado correctamente."
            )
            return redirect("user_list")

        messages.error(
            request,
            "Corrige los errores del formulario."
        )   
    else:
        user_form = UserForm()
        perfil_form = PerfilEmpleadoForm()
    context = {
        "fecha_hoy": timezone.localdate(),
        "usuarios": usuarios,
        "total_usuarios": usuarios.count(),
        "total_admins": usuarios.filter(
            user__rol="admin"
        ).count(),
        "total_empleados": usuarios.filter(
            user__rol="empleado"
        ).count(),
        "perfil_editar": None,
        "user_form": user_form,
        "perfil_form": perfil_form,
    }
    return render(
        request,
        "admin/usuarios/usuarios.html",
        context
    )


@login_required
@admin_required
def user_update(request, user_id):
    try:

        user = User.objects.get(
            id=user_id
        )

        perfil = user.perfil

    except User.DoesNotExist:

        messages.error(
            request,
            "Usuario no encontrado."
        )

        return redirect(
            "user_list"
        )

    if request.method == "POST":

        perfil.primer_nombre = request.POST.get(
            "primer_nombre",
            perfil.primer_nombre
        )

        perfil.segundo_nombre = request.POST.get(
            "segundo_nombre",
            perfil.segundo_nombre
        )

        perfil.primer_apellido = request.POST.get(
            "primer_apellido",
            perfil.primer_apellido
        )

        perfil.segundo_apellido = request.POST.get(
            "segundo_apellido",
            perfil.segundo_apellido
        )

        perfil.genero = request.POST.get(
            "genero",
            perfil.genero
        )

        perfil.estado_civil = request.POST.get(
            "estado_civil",
            perfil.estado_civil
        )

        perfil.tipo_sangre = request.POST.get(
            "tipo_sangre",
            perfil.tipo_sangre
        )

        perfil.telefono = request.POST.get(
            "telefono",
            perfil.telefono
        )

        perfil.correo = request.POST.get(
            "correo",
            perfil.correo
        )

        perfil.ciudad = request.POST.get(
            "ciudad",
            perfil.ciudad
        )

        perfil.direccion = request.POST.get(
            "direccion",
            perfil.direccion
        )

        perfil.contacto_emergencia = request.POST.get(
            "contacto_emergencia",
            perfil.contacto_emergencia
        )

        perfil.parentesco_emergencia = request.POST.get(
            "parentesco_emergencia",
            perfil.parentesco_emergencia
        )

        perfil.telefono_emergencia = request.POST.get(
            "telefono_emergencia",
            perfil.telefono_emergencia
        )

        perfil.cargo = request.POST.get(
            "cargo",
            perfil.cargo
        )

        perfil.fecha_ingreso = parse_date(request.POST.get(
            "fecha_ingreso"
            )) or perfil.fecha_ingreso

        perfil.eps = request.POST.get(
            "eps",
            perfil.eps
        )

        perfil.arl = request.POST.get(
            "arl",
            perfil.arl
        )

        perfil.fondo_pension = request.POST.get(
            "fondo_pension",
            perfil.fondo_pension
        )

        perfil.estado = request.POST.get(
            "estado",
            perfil.estado
        )

        perfil.save()

        user.rol = request.POST.get(
            "rol",
            user.rol
        )

        user.save()

        messages.success(
            request,
            f"Usuario {user.username} actualizado correctamente.",
            extra_tags="editado"
        )

        return redirect(
            "user_list"
        )

    return redirect(
        "user_list"
    )


@login_required
@admin_required
def user_delete(request, user_id):
    if request.method == "POST":

        try:

            user = User.objects.get(
                id=user_id
            )

            user.delete()

            messages.success(
                request,
                "Usuario eliminado correctamente."
            )

        except User.DoesNotExist:

            messages.error(
                request,
                "Usuario no encontrado."
            )

    return redirect(
        "user_list"
    )


# ========================
# PERFIL EMPLEADO
# ========================

@login_required
def employee_profile(request):
    perfil = request.user.perfil
    return render(
        request,
        "empleado/cuentas/cuentas.html",
        {
            "perfil": perfil
        }
    )


@login_required
def employee_profile_update(request):
    if request.method == "POST":

        perfil = request.user.perfil

        perfil.genero = request.POST.get(
            "genero"
        )

        perfil.estado_civil = request.POST.get(
            "estado_civil"
        )

        perfil.telefono = request.POST.get(
            "telefono"
        )

        perfil.correo = request.POST.get(
            "correo"
        )

        perfil.direccion = request.POST.get(
            "direccion"
        )

        perfil.ciudad = request.POST.get(
            "ciudad"
        )

        perfil.contacto_emergencia = request.POST.get(
            "contacto_emergencia"
        )

        perfil.parentesco_emergencia = request.POST.get(
            "parentesco_emergencia"
        )

        perfil.telefono_emergencia = request.POST.get(
            "telefono_emergencia"
        )

        perfil.save()

        password = request.POST.get(
            "password"
        )

        if password:

            request.user.set_password(
                password
            )

            request.user.save()

        messages.success(
            request,
            "Perfil actualizado correctamente."
        )

    return redirect(
        "employee_profile"
    )