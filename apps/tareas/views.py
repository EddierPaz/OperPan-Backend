from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from django.utils import timezone
from datetime import date
from .models import Task, EstadoTarea, Prioridad, Area, Turno
from .forms import TaskForm, TaskEstadoForm, TaskFilterForm, TaskSearchForm
from apps.usuarios.decorators import admin_required


# ==========================================
# ============ VISTAS DEL ADMINISTRADOR ============
# ==========================================

@login_required
@admin_required
def admin_tareas_list(request):
    """
    Vista principal del administrador.
    Muestra: KPIs, formulario (crear/editar), listado con filtros y búsqueda.
    Template: admin/tareas.html
    """
    # KPIs
    kpis = Task.get_kpis_administrador()

    # Query base
    tareas = Task.objects.select_related(
        'empleado',
        'creador__perfil',
        'ultimo_cambio_por__perfil'
    ).all()

    # --- Filtros (GET) ---
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

    # --- Búsqueda ---
    busqueda = request.GET.get('busqueda', '')
    if busqueda:
        tareas = tareas.filter(
            Q(titulo__icontains=busqueda) |
            Q(empleado__perfil__primer_nombre__icontains=busqueda) |
            Q(empleado__perfil__primer_apellido__icontains=busqueda) |
            Q(descripcion__icontains=busqueda)
        )

    # Orden
    tareas = tareas.order_by('-prioridad', 'fecha_limite')

    # --- Formulario de creación/edición ---
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

    context = {
        'tareas': tareas,
        'kpis': kpis,
        'filter_form': filter_form,
        'busqueda': busqueda,
        'total_tareas': tareas.count(),
        'form': form,
        'editando': editando,
        'tarea_actual': tarea_actual,
    }
    return render(request, 'admin/tareas.html', context)


@login_required
@admin_required
def admin_tarea_create(request):
    """
    Procesa la creación de una nueva tarea (POST).
    Redirige al listado.
    """
    if request.method == 'POST':
        form = TaskForm(request.POST)
        if form.is_valid():
            tarea = form.save(commit=False)
            tarea.creador = request.user
            tarea.ultimo_cambio_por = request.user
            tarea.save()
            messages.success(
                request,
                f"✅ Tarea '{tarea.titulo}' creada exitosamente para {tarea.empleado.nombre_completo()}."
            )
        else:
            messages.error(request, "❌ Por favor corrige los errores del formulario.")
    return redirect('tareas:admin_tareas_list')


@login_required
@admin_required
def admin_tarea_edit(request, pk):
    """
    Procesa la edición de una tarea existente (POST).
    Redirige al listado.
    """
    tarea = get_object_or_404(Task, pk=pk)
    if request.method == 'POST':
        form = TaskForm(request.POST, instance=tarea)
        if form.is_valid():
            tarea_editada = form.save(commit=False)
            tarea_editada.ultimo_cambio_por = request.user
            tarea_editada.save()
            messages.success(
                request,
                f"✅ Tarea '{tarea.titulo}' actualizada exitosamente."
            )
        else:
            messages.error(request, "❌ Por favor corrige los errores del formulario.")
    return redirect('tareas:admin_tareas_list')


@login_required
@admin_required
def admin_tarea_delete(request, pk):
    """
    Elimina una tarea (POST). Redirige al listado.
    """
    tarea = get_object_or_404(Task, pk=pk)
    if request.method == 'POST':
        titulo = tarea.titulo
        empleado = tarea.empleado.nombre_completo()
        tarea.delete()
        messages.success(
            request,
            f"🗑️ Tarea '{titulo}' de {empleado} eliminada exitosamente."
        )
    return redirect('tareas:admin_tareas_list')


@login_required
@admin_required
def admin_tarea_cambiar_estado(request, pk):
    """
    Cambia el estado de una tarea (GET con parámetro ?estado=...).
    Redirige a la URL de origen (next) o al listado.
    """
    tarea = get_object_or_404(Task, pk=pk)
    nuevo_estado = request.GET.get('estado')
    next_url = request.GET.get('next', request.META.get('HTTP_REFERER', 'tareas:admin_tareas_list'))

    if nuevo_estado in dict(EstadoTarea.choices):
        if tarea.cambiar_estado(nuevo_estado, request.user):
            messages.success(
                request,
                f"✅ Estado de '{tarea.titulo}' actualizado a '{tarea.get_estado_display()}'."
            )
        else:
            messages.error(request, "❌ No se pudo cambiar el estado de la tarea.")
    else:
        messages.error(request, "❌ Estado no válido.")

    return redirect(next_url)


@login_required
@admin_required
def admin_tareas_vencidas(request):
    """
    Vista para ver solo tareas vencidas (Administrador)
    """
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
    return render(request, 'admin/tareas_vencidas.html', context)


# ==========================================
# ============ VISTAS DEL EMPLEADO ============
# ==========================================

@login_required
def empleado_tareas_list(request):
    """
    Vista principal del empleado.
    Muestra: KPIs personales, listado de sus tareas con filtros.
    Si viene parámetro 'detalle' en GET, se pasa la tarea al contexto para abrir el modal.
    Template: empleado/tareas.html
    """
    empleado = request.user

    # KPIs del empleado
    kpis = Task.get_kpis_empleado(empleado)

    # Tareas del empleado
    tareas = Task.objects.filter(empleado__user=request.user).select_related(
        'creador__perfil',
        'ultimo_cambio_por__perfil'
    )

    # Filtro por estado (GET)
    estado_filtro = request.GET.get('estado')
    if estado_filtro and estado_filtro in dict(EstadoTarea.choices):
        tareas = tareas.filter(estado=estado_filtro)

    # Filtro "Ver vencidas"
    if request.GET.get('vencidas') == 'true':
        tareas = tareas.filter(fecha_limite__lt=date.today()).exclude(estado=EstadoTarea.FINALIZADA)

    # Orden
    tareas = tareas.order_by('-prioridad', 'fecha_limite')

    # Verificar si se debe abrir el modal de detalle
    detalle_id = request.GET.get('detalle')
    tarea_detalle = None
    if detalle_id:
        try:
            tarea_detalle = Task.objects.get(pk=detalle_id, empleado__user=request.user)
        except Task.DoesNotExist:
            pass

    context = {
        'tareas': tareas,
        'kpis': kpis,
        'estado_filtro': estado_filtro,
        'total_tareas': tareas.count(),
        'estados': EstadoTarea.choices,
        'tarea_detalle': tarea_detalle,  # Para abrir el modal automáticamente
        'puede_cambiar': tarea_detalle and tarea_detalle.estado != EstadoTarea.FINALIZADA,
    }
    return render(request, 'empleado/tareas.html', context)


@login_required
def empleado_tarea_detail(request, pk):
    """
    Procesa el cambio de estado desde el modal del empleado (POST).
    También puede mostrar el detalle en una página separada (GET), pero aquí redirige al listado.
    """
    tarea = get_object_or_404(Task, pk=pk, empleado=request.user)

    if request.method == 'POST':
        nuevo_estado = request.POST.get('estado')
        # El empleado solo puede cambiar a EN_PROGRESO o FINALIZADA
        if nuevo_estado in [EstadoTarea.EN_PROGRESO, EstadoTarea.FINALIZADA]:
            if tarea.cambiar_estado(nuevo_estado, request.user):
                messages.success(
                    request,
                    f"✅ Estado actualizado a '{tarea.get_estado_display()}'."
                )
            else:
                messages.error(request, "❌ No se pudo actualizar el estado.")
        else:
            messages.error(request, "❌ No tienes permiso para cambiar a ese estado.")
        return redirect('tareas:empleado_tareas_list')

    # Si es GET, redirigimos al listado con el ID para abrir el modal
    return redirect(f"{reverse('tareas:empleado_tareas_list')}?detalle={pk}")


@login_required
def empleado_tarea_marcar_progreso(request, pk):
    """
    Marca tarea como 'En progreso' (empleado). Redirige al listado.
    """
    tarea = get_object_or_404(Task, pk=pk, empleado=request.user)
    if tarea.cambiar_estado(EstadoTarea.EN_PROGRESO, request.user):
        messages.success(request, f"✅ Tarea '{tarea.titulo}' marcada como 'En progreso'.")
    else:
        messages.error(request, "❌ No se pudo marcar la tarea como 'En progreso'.")
    return redirect('tareas:empleado_tareas_list')


@login_required
def empleado_tarea_marcar_finalizada(request, pk):
    """
    Marca tarea como 'Finalizada' (empleado). Redirige al listado.
    """
    tarea = get_object_or_404(Task, pk=pk, empleado=request.user)
    if tarea.cambiar_estado(EstadoTarea.FINALIZADA, request.user):
        messages.success(request, f"✅ Tarea '{tarea.titulo}' marcada como 'Finalizada'.")
    else:
        messages.error(request, "❌ No se pudo marcar la tarea como 'Finalizada'.")
    return redirect('tareas:empleado_tareas_list')