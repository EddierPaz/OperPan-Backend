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
# VISTAS DEL ADMINISTRADOR
# ==========================================

@login_required
@admin_required
def admin_tareas_list(request):
    """Lista todas las tareas con filtros."""
    # ✅ Los KPIs vienen del modelo (lógica de negocio)
    kpis = Task.get_kpis_administrador()
    
    # ✅ Los filtros se construyen en la vista (no en el modelo)
    tareas = Task.objects.select_related('empleado__perfil')
    
    # Filtros (esto NO debería estar en el modelo)
    if request.GET.get('estado'):
        tareas = tareas.filter(estado=request.GET['estado'])
    if request.GET.get('area'):
        tareas = tareas.filter(area=request.GET['area'])
    if request.GET.get('prioridad'):
        tareas = tareas.filter(prioridad=request.GET['prioridad'])
    if request.GET.get('turno'):
        tareas = tareas.filter(turno_asociado=request.GET['turno'])
    
    # ✅ Búsqueda en la vista
    busqueda = request.GET.get('busqueda')
    if busqueda:
        tareas = tareas.filter(
            Q(titulo__icontains=busqueda) |
            Q(empleado__perfil__primer_nombre__icontains=busqueda) |
            Q(empleado__perfil__primer_apellido__icontains=busqueda)
        )
    
    return render(request, 'admin/tareas/list.html', {
        'tareas': tareas,
        'kpis': kpis,
    })

# ==========================================
# VISTAS DEL EMPLEADO
# ==========================================

@login_required
def empleado_tareas_list(request):
    """Lista las tareas del empleado logueado."""
    # ✅ KPIs del modelo
    kpis = Task.get_kpis_empleado(request.user)
    
    # ✅ Filtros en la vista
    tareas = Task.objects.filter(empleado=request.user)
    
    estado_filtro = request.GET.get('estado')
    if estado_filtro:
        tareas = tareas.filter(estado=estado_filtro)
    
    # ✅ Tareas vencidas - filtro en vista
    if request.GET.get('vencidas') == 'true':
        tareas = tareas.filter(
            fecha_limite__lt=date.today()
        ).exclude(estado=EstadoTarea.FINALIZADA)
    
    return render(request, 'empleado/tareas/list.html', {
        'tareas': tareas,
        'kpis': kpis,
    })


# ============================================
# ============ VISTAS DEL ADMINISTRADOR ============
# ============================================

@login_required
@admin_required
def admin_tareas_list(request):
    """
    Vista para listar todas las tareas (Administrador)
    """
    # Obtener KPIs
    kpis = Task.get_kpis_administrador()
    
    # Obtener todas las tareas con relaciones optimizadas
    tareas = Task.objects.select_related(
        'empleado__perfil', 
        'creador__perfil',
        'ultimo_cambio_por__perfil'
    ).all()
    
    # Formulario de búsqueda
    search_form = TaskSearchForm(request.GET or None)
    busqueda = request.GET.get('busqueda', '')
    if busqueda:
        tareas = tareas.filter(
            Q(titulo__icontains=busqueda) |
            Q(empleado__perfil__primer_nombre__icontains=busqueda) |
            Q(empleado__perfil__primer_apellido__icontains=busqueda) |
            Q(descripcion__icontains=busqueda)
        )
    
    # Formulario de filtros
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
    
    # Ordenar por prioridad y fecha límite
    tareas = tareas.order_by('-prioridad', 'fecha_limite')
    
    context = {
        'tareas': tareas,
        'kpis': kpis,
        'filter_form': filter_form,
        'search_form': search_form,
        'busqueda': busqueda,
        'total_tareas': tareas.count(),
    }
    return render(request, 'admin/tareas/tareas_list.html', context)


@login_required
@admin_required
def admin_tarea_create(request):
    """
    Vista para crear una nueva tarea (Administrador)
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
                f"✅ Tarea '{tarea.titulo}' creada exitosamente para {tarea.empleado.perfil.nombre_completo()}."
            )
            return redirect('tareas:admin_tareas_list')
        else:
            messages.error(request, "❌ Por favor corrige los errores del formulario.")
    else:
        form = TaskForm()
    
    return render(request, 'admin/tareas/tarea_form.html', {
        'form': form, 
        'accion': 'Crear',
        'titulo_pagina': 'Asignar nueva tarea'
    })


@login_required
@admin_required
def admin_tarea_edit(request, pk):
    """
    Vista para editar una tarea existente (Administrador)
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
            return redirect('tareas:admin_tareas_list')
        else:
            messages.error(request, "❌ Por favor corrige los errores del formulario.")
    else:
        form = TaskForm(instance=tarea)
    
    return render(request, 'admin/tareas/tarea_form.html', {
        'form': form, 
        'accion': 'Editar',
        'tarea': tarea,
        'titulo_pagina': f'Editar tarea: {tarea.titulo}'
    })


@login_required
@admin_required
def admin_tarea_delete(request, pk):
    """
    Vista para eliminar una tarea (Administrador)
    """
    tarea = get_object_or_404(Task, pk=pk)
    
    if request.method == 'POST':
        titulo = tarea.titulo
        empleado = tarea.empleado.perfil.nombre_completo()
        tarea.delete()
        messages.success(
            request, 
            f"🗑️ Tarea '{titulo}' de {empleado} eliminada exitosamente."
        )
        return redirect('tareas:admin_tareas_list')
    
    return render(request, 'admin/tareas/tarea_confirm_delete.html', {
        'tarea': tarea
    })


@login_required
@admin_required
def admin_tarea_cambiar_estado(request, pk):
    """
    Vista para cambiar estado de una tarea (Administrador)
    """
    tarea = get_object_or_404(Task, pk=pk)
    
    if request.method == 'POST':
        form = TaskEstadoForm(request.POST)
        if form.is_valid():
            nuevo_estado = form.cleaned_data.get('estado')
            observacion = form.cleaned_data.get('observacion', '')
            
            if nuevo_estado in dict(EstadoTarea.choices):
                if tarea.cambiar_estado(nuevo_estado, request.user):
                    messages.success(
                        request, 
                        f"✅ Estado de '{tarea.titulo}' actualizado a '{tarea.get_estado_display()}'."
                    )
                    if observacion:
                        messages.info(request, f"📝 Observación: {observacion}")
                else:
                    messages.error(request, "❌ No se pudo cambiar el estado de la tarea.")
            else:
                messages.error(request, "❌ Estado no válido.")
        return redirect('tareas:admin_tareas_list')
    
    form = TaskEstadoForm(initial={'estado': tarea.estado})
    return render(request, 'admin/tareas/tarea_cambiar_estado.html', {
        'tarea': tarea, 
        'form': form
    })


# ============================================
# ============ VISTAS DEL EMPLEADO ============
# ============================================

@login_required
def empleado_tareas_list(request):
    """
    Vista para listar las tareas del empleado logueado
    """
    empleado = request.user
    
    # Obtener KPIs del empleado
    kpis = Task.get_kpis_empleado(empleado)
    
    # Obtener tareas del empleado con relaciones optimizadas
    tareas = Task.objects.filter(empleado=empleado).select_related(
        'creador__perfil',
        'ultimo_cambio_por__perfil'
    )
    
    # Filtrar por estado
    estado_filtro = request.GET.get('estado')
    if estado_filtro and estado_filtro in dict(EstadoTarea.choices):
        tareas = tareas.filter(estado=estado_filtro)
    
    # Ver tareas vencidas
    ver_vencidas = request.GET.get('vencidas')
    if ver_vencidas == 'true':
        tareas = tareas.filter(fecha_limite__lt=date.today()).exclude(estado=EstadoTarea.FINALIZADA)
    
    # Ordenar: primero las vencidas, luego por prioridad, luego por fecha límite
    tareas = tareas.order_by('-prioridad', 'fecha_limite')
    
    context = {
        'tareas': tareas,
        'kpis': kpis,
        'estado_filtro': estado_filtro,
        'ver_vencidas': ver_vencidas,
        'total_tareas': tareas.count(),
        'estados': EstadoTarea.choices,
    }
    return render(request, 'empleado/tareas/tareas_list.html', context)


@login_required
def empleado_tarea_detail(request, pk):
    """
    Vista para ver detalle de una tarea (Empleado)
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
        
        return redirect('tareas:empleado_tarea_detail', pk=pk)
    
    # Formulario para cambiar estado (solo opciones permitidas para empleado)
    form = TaskEstadoForm()
    form.fields['estado'].choices = [
        ('', '--- Seleccionar estado ---'),
        (EstadoTarea.EN_PROGRESO, 'En progreso'),
        (EstadoTarea.FINALIZADA, 'Finalizada'),
    ]
    
    # Si la tarea ya está finalizada, deshabilitar el formulario
    if tarea.estado == EstadoTarea.FINALIZADA:
        form.fields['estado'].widget.attrs['disabled'] = 'disabled'
    
    context = {
        'tarea': tarea,
        'form': form,
        'puede_cambiar': tarea.estado != EstadoTarea.FINALIZADA,
    }
    return render(request, 'empleado/tareas/tarea_detail.html', context)


@login_required
def empleado_tarea_marcar_progreso(request, pk):
    """
    Vista para marcar tarea como 'En progreso' (Empleado)
    """
    tarea = get_object_or_404(Task, pk=pk, empleado=request.user)
    
    if tarea.cambiar_estado(EstadoTarea.EN_PROGRESO, request.user):
        messages.success(
            request, 
            f"✅ Tarea '{tarea.titulo}' marcada como 'En progreso'."
        )
    else:
        messages.error(request, "❌ No se pudo marcar la tarea como 'En progreso'.")
    
    return redirect('tareas:empleado_tareas_list')


@login_required
def empleado_tarea_marcar_finalizada(request, pk):
    """
    Vista para marcar tarea como 'Finalizada' (Empleado)
    """
    tarea = get_object_or_404(Task, pk=pk, empleado=request.user)
    
    if tarea.cambiar_estado(EstadoTarea.FINALIZADA, request.user):
        messages.success(
            request, 
            f"✅ Tarea '{tarea.titulo}' marcada como 'Finalizada'."
        )
    else:
        messages.error(request, "❌ No se pudo marcar la tarea como 'Finalizada'.")
    
    return redirect('tareas:empleado_tareas_list')


# ============================================
# ============ VISTAS AUXILIARES ============
# ============================================

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
    ).select_related('empleado__perfil')
    
    context = {
        'tareas': tareas,
        'total_vencidas': tareas.count(),
    }
    return render(request, 'admin/tareas/tareas_vencidas.html', context)