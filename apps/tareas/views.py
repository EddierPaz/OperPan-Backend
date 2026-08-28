import json
from datetime import date
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from django.utils import timezone
from django.urls import reverse

from .models import Task, EstadoTarea
from .forms import TaskForm, TaskFilterForm
from .constants import TAREAS_POR_CARGO, CARGO_AREA_MAP, OTRA_VALUE
from apps.usuarios.decorators import admin_required
from apps.usuarios.models import PerfilEmpleado
from apps.asistencia.models import Horario

# Gmail API
from apps.notificaciones.utils import enviar_notificacion, obtener_correo_admin


# ==========================================
# ============ VISTAS DEL ADMINISTRADOR ============
# ==========================================

@login_required
@admin_required
def admin_tareas_list(request):

    kpis = Task.get_kpis_administrador()

    tareas = Task.objects.select_related(
        'empleado', 'creador__perfil', 'ultimo_cambio_por__perfil'
    ).all()

    filter_form = TaskFilterForm(request.GET or None)
    if filter_form.is_valid():
        if filter_form.cleaned_data.get('estado'):
            tareas = tareas.filter(estado=filter_form.cleaned_data['estado'])
        if filter_form.cleaned_data.get('empleado'):
            tareas = tareas.filter(empleado=filter_form.cleaned_data['empleado'])
        if filter_form.cleaned_data.get('area'):
            tareas = tareas.filter(area=filter_form.cleaned_data['area'])
        if filter_form.cleaned_data.get('prioridad'):
            tareas = tareas.filter(prioridad=filter_form.cleaned_data['prioridad'])
        if filter_form.cleaned_data.get('turno'):
            tareas = tareas.filter(turno_asociado=filter_form.cleaned_data['turno'])

    busqueda = request.GET.get('busqueda', '')
    if busqueda:
        tareas = tareas.filter(
            Q(titulo__icontains=busqueda) |
            Q(empleado__primer_nombre__icontains=busqueda) |
            Q(empleado__segundo_nombre__icontains=busqueda) |
            Q(empleado__primer_apellido__icontains=busqueda) |
            Q(empleado__segundo_apellido__icontains=busqueda) |
            Q(descripcion__icontains=busqueda)
        )

    if request.GET.get('vencidas') == 'true':
        tareas = tareas.filter(
            fecha_limite__lt=date.today()
        ).exclude(
            estado=EstadoTarea.FINALIZADA
        )

    tareas = tareas.order_by('-prioridad', 'fecha_limite')

    # --- Tareas de HOY, agrupadas por estado (respeta búsqueda/filtros ya aplicados) ---
    hoy = date.today()
    tareas_hoy = tareas.filter(fecha_limite=hoy)
    tareas_hoy_por_estado = {
        EstadoTarea.PENDIENTE: tareas_hoy.filter(estado=EstadoTarea.PENDIENTE),
        EstadoTarea.EN_PROGRESO: tareas_hoy.filter(estado=EstadoTarea.EN_PROGRESO),
        EstadoTarea.FINALIZADA: tareas_hoy.filter(estado=EstadoTarea.FINALIZADA),
    }
    total_hoy = tareas_hoy.count()

    editando = False
    tarea_actual = None
    form = TaskForm()

    edit_id = request.GET.get('edit')
    if edit_id:
        try:
            tarea_actual = Task.objects.get(pk=edit_id)
            form = TaskForm(instance=tarea_actual)
            editando = True
        except Task.DoesNotExist:
            messages.error(request, "La tarea que intentas editar no existe.")

    detalle_id = request.GET.get('detalle')
    tarea_detalle = None
    if detalle_id:
        try:
            tarea_detalle = Task.objects.get(pk=detalle_id)
        except Task.DoesNotExist:
            messages.error(request, "La tarea que intentas consultar no existe.")

    # --- Datos para el autocompletado (empleado -> cargo + horario activo) ---
    empleados_qs = PerfilEmpleado.objects.filter(user__rol='empleado', estado='activo')

    horarios_activos = {}
    for h in Horario.objects.filter(empleado__in=empleados_qs, estado=True).order_by('-fecha_creacion'):
        horarios_activos.setdefault(h.empleado_id, h)

    empleados_data = {}
    for emp in empleados_qs:
        horario = horarios_activos.get(emp.pk)
        empleados_data[str(emp.pk)] = {
            'cargo': emp.cargo if emp.cargo else '',
            'cargo_display': emp.get_cargo_display() if emp.cargo else '',
            'turno': horario.turno if horario else '',
            'turno_display': horario.get_turno_display() if horario else '',
            'hora_entrada': horario.hora_entrada.strftime('%H:%M') if horario and horario.hora_entrada else '',
            'hora_salida': horario.hora_salida.strftime('%H:%M') if horario and horario.hora_salida else '',
        }

    context = {
        "fecha_hoy": timezone.localdate(),
        'tareas': tareas,
        'tareas_hoy_por_estado': tareas_hoy_por_estado,
        'total_hoy': total_hoy,
        'kpis': kpis,
        'filter_form': filter_form,
        'busqueda': busqueda,
        'total_tareas': tareas.count(),
        'form': form,
        'editando': editando,
        'tarea_actual': tarea_actual,
        'tarea_detalle': tarea_detalle,
        # Serialización segura a JSON string para que el script JavaScript lo lea limpio
        'empleados_data': json.dumps(empleados_data),
        'tareas_por_cargo': json.dumps(TAREAS_POR_CARGO),
        'cargo_area_map': json.dumps(CARGO_AREA_MAP),
        'otra_value': OTRA_VALUE,
    }
    return render(request, 'admin/tareas/tareas.html', context)


@login_required
@admin_required
def admin_tarea_create(request):
    if request.method == 'POST':
        form = TaskForm(request.POST)
        if form.is_valid():
            tarea = form.save(commit=False)
            tarea.creador = request.user
            tarea.ultimo_cambio_por = request.user
            tarea.save()

            # =====================================================
            # NOTIFICACIÓN AL EMPLEADO
            # =====================================================
            contexto = {
                'empleado_nombre': tarea.empleado.nombre_completo(),
                'titulo': tarea.titulo,
                'descripcion': tarea.descripcion,
                'fecha_limite': tarea.fecha_limite.strftime('%d/%m/%Y'),
                'prioridad': tarea.get_prioridad_display(),
            }
            enviar_notificacion(
                destinatario=tarea.empleado.correo,
                asunto=f"📋 Nueva tarea asignada: {tarea.titulo}",
                template_name='emails/tarea_asignada.html',
                contexto=contexto
            )

            messages.success(
                request,
                f"✅ Tarea '{tarea.titulo}' creada exitosamente para {tarea.empleado.nombre_completo()}."
            )
            return redirect('tareas:admin_tareas_list')
        else:
            messages.error(request, "❌ Por favor corrige los errores del formulario.")
    return redirect('tareas:admin_tareas_list')


@login_required
@admin_required
def admin_tarea_edit(request, pk):
    tarea = get_object_or_404(Task, pk=pk)
    if request.method == 'POST':
        form = TaskForm(request.POST, instance=tarea)
        if form.is_valid():
            tarea_editada = form.save(commit=False)
            tarea_editada.ultimo_cambio_por = request.user
            tarea_editada.save()

            # =====================================================
            # NOTIFICACIÓN AL EMPLEADO
            # =====================================================
            contexto = {
                'empleado_nombre': tarea_editada.empleado.nombre_completo(),
                'titulo': tarea_editada.titulo,
                'descripcion': tarea_editada.descripcion,
                'fecha_limite': tarea_editada.fecha_limite.strftime('%d/%m/%Y'),
                'prioridad': tarea_editada.get_prioridad_display(),
            }
            enviar_notificacion(
                destinatario=tarea_editada.empleado.correo,
                asunto=f"✏️ Tarea actualizada: {tarea_editada.titulo}",
                template_name='emails/tarea_editada.html',
                contexto=contexto
            )

            messages.success(request, f"Tarea '{tarea.titulo}' actualizada exitosamente.")
            return redirect('tareas:admin_tareas_list')
        else:
            messages.error(request, "Por favor corrige los errores del formulario.")
    return redirect('tareas:admin_tareas_list')


@login_required
@admin_required
def admin_tarea_delete(request, pk):
    tarea = get_object_or_404(Task, pk=pk)
    if request.method == 'POST':
        titulo = tarea.titulo
        empleado_nombre = tarea.empleado.nombre_completo()

        # =====================================================
        # NOTIFICACIÓN AL EMPLEADO (ANTES DE ELIMINAR)
        # =====================================================
        contexto = {
            'empleado_nombre': tarea.empleado.nombre_completo(),
            'titulo': tarea.titulo,
        }
        enviar_notificacion(
            destinatario=tarea.empleado.correo,
            asunto=f"🗑️ Tarea eliminada: {tarea.titulo}",
            template_name='emails/tarea_eliminada.html',
            contexto=contexto
        )

        tarea.delete()
        messages.error(request, f"Tarea '{titulo}' de {empleado_nombre} eliminada exitosamente.")
    return redirect('tareas:admin_tareas_list')



@login_required
@admin_required
def admin_tarea_cambiar_estado(request, pk):
    tarea = get_object_or_404(Task, pk=pk)
    nuevo_estado = request.GET.get('estado')
    next_url = request.GET.get('next', request.META.get('HTTP_REFERER', 'tareas:admin_tareas_list'))

    if tarea.esta_vencida:
        messages.error(request, f"La tarea '{tarea.titulo}' está vencida y no se puede modificar.")
        return redirect(next_url)

    if nuevo_estado == EstadoTarea.FINALIZADA and tarea.estado == EstadoTarea.EN_PROGRESO:
        if tarea.cambiar_estado(nuevo_estado, request.user):
            # =====================================================
            # NOTIFICACIÓN AL EMPLEADO (ADMIN FINALIZÓ)
            # =====================================================
            contexto = {
                'empleado_nombre': tarea.empleado.nombre_completo(),
                'titulo': tarea.titulo,
                'estado_nuevo': tarea.get_estado_display(),
            }
            enviar_notificacion(
                destinatario=tarea.empleado.correo,
                asunto=f"Estado de tarea actualizado",
                template_name='emails/tarea_estado_cambiado.html',
                contexto=contexto
            )
            messages.success(request, f"Tarea '{tarea.titulo}' finalizada exitosamente.")
        else:
            messages.error(request, "No se pudo finalizar la tarea.")
    elif nuevo_estado == EstadoTarea.EN_PROGRESO:
        messages.error(request, "Los administradores no pueden iniciar tareas. Solo los empleados pueden hacerlo.")
    elif nuevo_estado == EstadoTarea.PENDIENTE:
        messages.error(request, "Los administradores no pueden revertir tareas a 'Pendiente'.")
    else:
        messages.error(request, "Acción no permitida para administradores.")

    return redirect(next_url)


@login_required
@admin_required
def admin_tareas_vencidas(request):
    hoy = date.today()
    tareas = Task.objects.filter(
        fecha_limite__lt=hoy
    ).exclude(
        estado=EstadoTarea.FINALIZADA
    ).select_related('empleado')

    context = {
        'tareas': tareas,
        'total_vencidas': tareas.count(),
    }
    return render(request, 'admin/tareas/tareas_vencidas.html', context)


# ==========================================
# ============ VISTAS DEL EMPLEADO ============
# ==========================================

@login_required
def empleado_tareas_list(request):
    empleado = request.user
    kpis = Task.get_kpis_empleado(empleado)
    tareas = Task.objects.filter(empleado__user=request.user).select_related(
        'creador__perfil',
        'ultimo_cambio_por__perfil'
    )

    estado_filtro = request.GET.get('estado')
    if estado_filtro and estado_filtro in dict(EstadoTarea.choices):
        tareas = tareas.filter(estado=estado_filtro)

    if request.GET.get('vencidas') == 'true':
        tareas = tareas.filter(fecha_limite__lt=date.today()).exclude(estado=EstadoTarea.FINALIZADA)

    tareas = tareas.order_by('-prioridad', 'fecha_limite')

    detalle_id = request.GET.get('detalle')
    tarea_detalle = None
    if detalle_id:
        try:
            tarea_detalle = Task.objects.get(pk=detalle_id, empleado__user=request.user)
        except Task.DoesNotExist:
            pass

    context = {
        "fecha_hoy": timezone.localdate(),
        'tareas': tareas,
        'kpis': kpis,
        'estado_filtro': estado_filtro,
        'total_tareas': tareas.count(),
        'estados': EstadoTarea.choices,
        'tarea_detalle': tarea_detalle,
        'puede_cambiar': tarea_detalle and tarea_detalle.estado != EstadoTarea.FINALIZADA and not tarea_detalle.esta_vencida,
    }
    return render(request, 'empleado/tareas/tareas.html', context)
    

@login_required
def empleado_tarea_detail(request, pk):
    tarea = get_object_or_404(Task, pk=pk, empleado__user=request.user)

    if request.method == 'POST':
        if tarea.esta_vencida:
            messages.error(request, f"La tarea '{tarea.titulo}' está vencida y no se puede modificar.")
            return redirect('tareas:empleado_tareas_list')
        
        nuevo_estado = request.POST.get('estado')
        if nuevo_estado in [EstadoTarea.EN_PROGRESO, EstadoTarea.FINALIZADA]:
            if tarea.cambiar_estado(nuevo_estado, request.user):
                messages.success(request, f"Estado actualizado a '{tarea.get_estado_display()}'.")
            else:
                messages.error(request, "No se pudo actualizar el estado.")
        else:
            messages.error(request, "No tienes permiso para cambiar a ese estado.")
        return redirect('tareas:empleado_tareas_list')

    return redirect(f"{reverse('tareas:empleado_tareas_list')}?detalle={pk}")


@login_required
def empleado_tarea_marcar_progreso(request, pk):
    tarea = get_object_or_404(Task, pk=pk, empleado__user=request.user)
    if request.method == 'POST':
        if tarea.estado == EstadoTarea.PENDIENTE:
            if tarea.cambiar_estado(EstadoTarea.EN_PROGRESO, request.user):
                # =====================================================
                # NOTIFICACIÓN A ADMINISTRADORES
                # =====================================================
                admins = obtener_correo_admin()
                for admin_email in admins:
                    contexto_admin = {
                        'empleado_nombre': tarea.empleado.nombre_completo(),
                        'titulo': tarea.titulo,
                        'estado_nuevo': tarea.get_estado_display(),
                    }
                    enviar_notificacion(
                        destinatario=admin_email,
                        asunto=f"Tarea en progreso por {tarea.empleado.nombre_completo()}",
                        template_name='emails/tarea_estado_cambiado_admin.html',
                        contexto=contexto_admin
                    )
                messages.success(request, f"Tarea '{tarea.titulo}' marcada como 'En progreso'.")
            else:
                messages.error(request, "No se pudo marcar la tarea como 'En progreso'.")
        else:
            messages.error(request, "Esta tarea ya no está pendiente.")
    return redirect('tareas:empleado_tareas_list')


@login_required
def empleado_tarea_marcar_finalizada(request, pk):
    tarea = get_object_or_404(Task, pk=pk, empleado__user=request.user)
    if request.method == 'POST':
        if tarea.estado == EstadoTarea.EN_PROGRESO:
            evidencia = request.FILES.get('evidencia')
            if evidencia:
                tarea.evidencia = evidencia
            if tarea.cambiar_estado(EstadoTarea.FINALIZADA, request.user):
                # =====================================================
                # NOTIFICACIÓN A ADMINISTRADORES
                # =====================================================
                admins = obtener_correo_admin()
                for admin_email in admins:
                    contexto_admin = {
                        'empleado_nombre': tarea.empleado.nombre_completo(),
                        'titulo': tarea.titulo,
                        'estado_nuevo': tarea.get_estado_display(),
                    }
                    enviar_notificacion(
                        destinatario=admin_email,
                        asunto=f"Tarea finalizada por {tarea.empleado.nombre_completo()}",
                        template_name='emails/tarea_estado_cambiado_admin.html',
                        contexto=contexto_admin
                    )
                messages.success(request, f"Tarea '{tarea.titulo}' marcada como 'Finalizada'.")
            else:
                messages.error(request, "No se pudo marcar la tarea como 'Finalizada'.")
        else:
            messages.error(request, "Primero debes marcar la tarea como 'En progreso'.")
    return redirect('tareas:empleado_tareas_list')