import json
from datetime import date
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from django.utils import timezone
from django.urls import reverse
from django.core.cache import cache
from .models import Funcion, EstadoFuncion
from .forms import FuncionForm, FuncionFilterForm
from .constants import FUNCIONES_POR_CARGO, CARGO_AREA_MAP, OTRA_VALUE
from apps.usuarios.decorators import admin_required, empleado_required
from apps.usuarios.models import PerfilEmpleado
from apps.asistencia.models import Horario
from django.core.paginator import Paginator



# ==========================================
# ============ VERIFICACIÃ“N MEMORANDOS ============
# ==========================================

def _verificar_memorandos_throttled():
    """
    Ejecuta la verificación de memorandos por FUNCIONES VENCIDAS para
    todos los empleados activos, con throttle de 30 min.

    NO incluye asistencia: cada app verifica lo suyo.
    """
    if cache.get('verif_memorandos_funciones_throttle'):
        return

    from apps.memorandos.services import verificar_y_generar_memorando
    from apps.usuarios.models import PerfilEmpleado as _Perfil

    for emp in _Perfil.objects.filter(user__rol='empleado', estado='activo'):
        try:
            verificar_y_generar_memorando(emp)
        except Exception as e:
            print(f"[funciones.views] Error verificando memos para "
                  f"{emp.pk}: {e}")

    cache.set('verif_memorandos_funciones_throttle', True, timeout=1800)  # 30 min


def _verificar_memorando_empleado(user):
    """
    Verifica los memorandos por funciones vencidas del empleado autenticado.
    Sin throttle (una llamada por request).
    """
    perfil = getattr(user, 'perfil', None)
    if perfil is None:
        return

    from apps.memorandos.services import verificar_y_generar_memorando

    try:
        verificar_y_generar_memorando(perfil)
    except Exception as e:
        print(f"[funciones.views] Error verificando memo para "
              f"{perfil.pk}: {e}")


def _verificar_memorando_funcion_vencida(funcion):
    """
    Dispara la verificación de memorandos por funciones vencidas del
    empleado dueño de una funcion vencida. Se usa desde las vistas donde
    el empleado intenta operar sobre una funcion ya vencida.
    """
    from apps.memorandos.services import verificar_y_generar_memorando

    try:
        verificar_y_generar_memorando(funcion.empleado)
    except Exception as e:
        print(f"[funciones.views] Error verificando memo para "
              f"{funcion.empleado_id}: {e}")


# ==========================================
# ============ VISTAS DEL ADMINISTRADOR ============
# ==========================================

def _build_funciones_context(request, form=None, editando=False, funcion_actual=None):
    """
    Construye el contexto completo de la vista admin_funciones_list.
    Se extrajo a una función aparte para poder reutilizarlo desde
    admin_funcion_create y admin_funcion_edit cuando el formulario es
    inválido: así se puede volver a renderizar la página con el modal
    abierto, los datos que el usuario escribió y los errores de cada
    campo, en vez de perderlos con un redirect.
    """
    kpis = Funcion.get_kpis_administrador()

    funciones = Funcion.objects.select_related(
        'empleado', 'creador__perfil', 'ultimo_cambio_por__perfil'
    ).all()

    filter_form = FuncionFilterForm(request.GET or None)
    if filter_form.is_valid():
        # --- INICIO DEL ARREGLO ---
        estado_filtro = filter_form.cleaned_data.get('estado')
        
        if estado_filtro == 'VENCIDA':
            funciones = funciones.filter(fecha_limite__lt=date.today()).exclude(estado=EstadoFuncion.FINALIZADA)
        elif estado_filtro:
            funciones = funciones.filter(estado=estado_filtro)
        # --- FIN DEL ARREGLO ---

        # Los demás filtros se quedan exactamente igual:
        if filter_form.cleaned_data.get('empleado'):
            funciones = funciones.filter(empleado=filter_form.cleaned_data['empleado'])
        if filter_form.cleaned_data.get('area'):
            funciones = funciones.filter(area=filter_form.cleaned_data['area'])
        if filter_form.cleaned_data.get('prioridad'):
            funciones = funciones.filter(prioridad=filter_form.cleaned_data['prioridad'])
        if filter_form.cleaned_data.get('turno'):
            funciones = funciones.filter(turno_asociado=filter_form.cleaned_data['turno'])

    busqueda = request.GET.get('busqueda', '')
    if busqueda:
        funciones = funciones.filter(
            Q(titulo__icontains=busqueda) |
            Q(empleado__primer_nombre__icontains=busqueda) |
            Q(empleado__segundo_nombre__icontains=busqueda) |
            Q(empleado__primer_apellido__icontains=busqueda) |
            Q(empleado__segundo_apellido__icontains=busqueda) |
            Q(descripcion__icontains=busqueda)
        )

    if request.GET.get('vencidas') == 'true':
        funciones = funciones.filter(
            fecha_limite__lt=date.today()
        ).exclude(
            estado=EstadoFuncion.FINALIZADA
        )

    funciones = funciones.order_by('-fecha_asignacion')


        # --- INICIO DE LA PAGINACIÃ“N (FASE 2) ---
    # 1. Atrapamos el número de página de la URL (ej. page=2). Si no hay, usamos la página 1.
    page_number = request.GET.get('page', 1)
    
    # 2. Creamos la "bandeja" (Paginator) diciendo que solo queremos 10 funciones por página.
    paginator = Paginator(funciones, 10) 
    
    # 3. Obtenemos la página solicitada. 
    # get_page() es mágico: si le pides la página 999 y solo hay 5, te da la 5 sin dar error.
    page_obj = paginator.get_page(page_number)
    # --- FIN DE LA PAGINACIÃ“N ---

    # --- Funciones de HOY, agrupadas por estado ---
    hoy = date.today()
    funciones_hoy = funciones.filter(fecha_limite=hoy)
    funciones_hoy_por_estado = {
        EstadoFuncion.PENDIENTE: funciones_hoy.filter(estado=EstadoFuncion.PENDIENTE),
        EstadoFuncion.EN_PROGRESO: funciones_hoy.filter(estado=EstadoFuncion.EN_PROGRESO),
        EstadoFuncion.FINALIZADA: funciones_hoy.filter(estado=EstadoFuncion.FINALIZADA),
    }
    total_hoy = funciones_hoy.count()

    detalle_id = request.GET.get('detalle')
    funcion_detalle = None
    if detalle_id:
        try:
            funcion_detalle = Funcion.objects.get(pk=detalle_id)
        except Funcion.DoesNotExist:
            messages.error(request, "La funcion que intentas consultar no existe.")

    if form is None:
        form = FuncionForm()

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
        'funciones': page_obj,
        'funciones_hoy_por_estado': funciones_hoy_por_estado,
        'total_hoy': total_hoy,
        'kpis': kpis,
        'filter_form': filter_form,
        'busqueda': busqueda,
        'total_funciones': funciones.count(),
        'form': form,
        'editando': editando,
        'funcion_actual': funcion_actual,
        'funcion_detalle': funcion_detalle,
        'empleados_data': json.dumps(empleados_data),
        'funciones_por_cargo': json.dumps(FUNCIONES_POR_CARGO),
        'cargo_area_map': json.dumps(CARGO_AREA_MAP),
        'otra_value': OTRA_VALUE,
    }
    return context


@login_required   #AAAA
@admin_required
def admin_funciones_list(request):

    # â–¼â–¼â–¼ VerificaciÃ³n on-demand (throttle 30 min, solo funciones) â–¼â–¼â–¼
    _verificar_memorandos_throttled()
    # â–²â–²â–²

    editando = False
    funcion_actual = None
    form = FuncionForm()

    edit_id = request.GET.get('edit')
    if edit_id:
        try:
            funcion_actual = Funcion.objects.get(pk=edit_id)
            form = FuncionForm(instance=funcion_actual)
            editando = True
        except Funcion.DoesNotExist:
            messages.error(request, "La funcion que intentas editar no existe.")

    context = _build_funciones_context(request, form=form, editando=editando, funcion_actual=funcion_actual)
    return render(request, 'admin/funciones/funciones.html', context)


@login_required
@admin_required
def admin_funcion_create(request):
    if request.method == 'POST':
        form = FuncionForm(request.POST)
        if form.is_valid():
            funcion = form.save(commit=False)
            funcion.creador = request.user
            funcion.ultimo_cambio_por = request.user
            funcion.save()

            # =====================================================
            # NOTIFICACIÃ“N AL EMPLEADO
            # =====================================================
            contexto = {
                'empleado_nombre': funcion.empleado.nombre_completo(),
                'titulo': funcion.titulo,
                'descripcion': funcion.descripcion,
                'fecha_limite': funcion.fecha_limite.strftime('%d/%m/%Y'),
                'prioridad': funcion.get_prioridad_display(),
            }

            messages.success(
                request,
                f"Función '{funcion.titulo}' creada exitosamente para {funcion.empleado.nombre_completo()}."
            )
            return redirect('funciones:admin_funciones_list')
        else:
            messages.error(request, "Por favor corrige los errores del formulario.")
            context = _build_funciones_context(request, form=form, editando=False)
            return render(request, 'admin/funciones/funciones.html', context)
    return redirect('funciones:admin_funciones_list')


@login_required
@admin_required
def admin_funcion_edit(request, pk):
    funcion = get_object_or_404(Funcion, pk=pk)
    if request.method == 'POST':
        form = FuncionForm(request.POST, instance=funcion)
        if form.is_valid():
            funcion_editada = form.save(commit=False)
            funcion_editada.ultimo_cambio_por = request.user
            funcion_editada.save()

            # =====================================================
            # NOTIFICACIÃ“N AL EMPLEADO
            # =====================================================
            contexto = {
                'empleado_nombre': funcion_editada.empleado.nombre_completo(),
                'titulo': funcion_editada.titulo,
                'descripcion': funcion_editada.descripcion,
                'fecha_limite': funcion_editada.fecha_limite.strftime('%d/%m/%Y'),
                'prioridad': funcion_editada.get_prioridad_display(),
            }

            messages.success(request, f"Función '{funcion.titulo}' actualizada exitosamente.")
            return redirect('funciones:admin_funciones_list')
        else:
            messages.error(request, "Por favor corrige los errores del formulario.")
            context = _build_funciones_context(request, form=form, editando=True, funcion_actual=funcion)
            return render(request, 'admin/funciones/funciones.html', context)
    return redirect('funciones:admin_funciones_list')


@login_required
@admin_required
def admin_funcion_delete(request, pk):
    funcion = get_object_or_404(Funcion, pk=pk)
    if request.method == 'POST':
        titulo = funcion.titulo
        empleado_nombre = funcion.empleado.nombre_completo()

        # =====================================================
        # NOTIFICACIÃ“N AL EMPLEADO (ANTES DE ELIMINAR)
        # =====================================================
        contexto = {
            'empleado_nombre': funcion.empleado.nombre_completo(),
            'titulo': funcion.titulo,
        }

        funcion.delete()
        messages.success(request, f"Función '{titulo}' de {empleado_nombre} eliminada exitosamente.")
    return redirect('funciones:admin_funciones_list')


@login_required
@admin_required
def admin_funcion_cambiar_estado(request, pk):
    funcion = get_object_or_404(Funcion, pk=pk)
    nuevo_estado = request.GET.get('estado')
    next_url = request.GET.get('next', request.META.get('HTTP_REFERER', 'funciones:admin_funciones_list'))

    # Si está vencida (y no finalizada), no se puede tocar
    if funcion.esta_vencida:
        messages.error(request, f"La funcion '{funcion.titulo}' está vencida y no se puede modificar.")
        return redirect(next_url)

    # =========================================================
    # CASO 1 â€” Admin finaliza una funcion en progreso
    # =========================================================
    if nuevo_estado == EstadoFuncion.FINALIZADA and funcion.estado == EstadoFuncion.EN_PROGRESO:
        if funcion.cambiar_estado(nuevo_estado, request.user):
            messages.success(request, f"Funcion '{funcion.titulo}' finalizada exitosamente.")
        else:
            messages.error(request, "No se pudo finalizar la funcion.")

    # =========================================================
    # CASO 2 â€” Admin reabre o revierte una funcion finalizada
    # =========================================================
    elif funcion.estado == EstadoFuncion.FINALIZADA and nuevo_estado in (EstadoFuncion.EN_PROGRESO, EstadoFuncion.PENDIENTE):
        # Verificación: solo se puede reabrir dentro del margen
        if not funcion.puede_reabrirse:
            from .constants import DIAS_MARGEN_REAPERTURA
            messages.error(
                request,
                f"No se puede reabrir la funcion '{funcion.titulo}'. "
                f"Su fecha límite fue el {funcion.fecha_limite} y ya pasaron más de "
                f"{DIAS_MARGEN_REAPERTURA} días desde entonces."
            )
            return redirect(next_url)

        if nuevo_estado == EstadoFuncion.EN_PROGRESO:
            if funcion.reabrir(request.user):
                messages.success(
                    request,
                    f"Funcion '{funcion.titulo}' reabierta. El empleado puede continuar trabajando en ella."
                )
            else:
                messages.error(request, "No se pudo reabrir la funcion.")
        else:  # PENDIENTE
            if funcion.revertir_a_pendiente(request.user):
                messages.success(
                    request,
                    f"Funcion '{funcion.titulo}' revertida a 'Pendiente'. Se reinicia desde cero."
                )
            else:
                messages.error(request, "No se pudo revertir la funcion.")

    # =========================================================
    # Restricciones
    # =========================================================
    elif nuevo_estado == EstadoFuncion.EN_PROGRESO:
        messages.error(
            request,
            "Los administradores no pueden iniciar funciones. Solo los empleados pueden hacerlo."
        )

    elif nuevo_estado == EstadoFuncion.PENDIENTE:
        messages.error(request, "Los administradores no pueden revertir funciones a 'Pendiente'.")

    else:
        messages.error(request, "Acción no permitida para administradores.")

    return redirect(next_url)


@login_required
@admin_required
def admin_funciones_vencidas(request):
    hoy = date.today()
    funciones = Funcion.objects.filter(
        fecha_limite__lt=hoy
    ).exclude(
        estado=EstadoFuncion.FINALIZADA
    ).select_related('empleado')

    context = {
        'funciones': funciones,
        'total_vencidas': funciones.count(),
    }
    return render(request, 'admin/funciones/funciones_vencidas.html', context)


# ==========================================
# ============ VISTAS DEL EMPLEADO ============
# ==========================================

@login_required
@empleado_required
def empleado_funciones_list(request):

    # â–¼â–¼â–¼ VerificaciÃ³n on-demand del propio empleado â–¼â–¼â–¼
    _verificar_memorando_empleado(request.user)
    # â–²â–²â–²

    empleado = request.user
    kpis = Funcion.get_kpis_empleado(empleado)
    funciones = Funcion.objects.filter(empleado__user=request.user).select_related(
        'creador__perfil',
        'ultimo_cambio_por__perfil'
    )

    estado_filtro = request.GET.get('estado')
    if estado_filtro and estado_filtro in dict(EstadoFuncion.choices):
        funciones = funciones.filter(estado=estado_filtro)

    if request.GET.get('vencidas') == 'true':
        funciones = funciones.filter(fecha_limite__lt=date.today()).exclude(estado=EstadoFuncion.FINALIZADA)

    funciones = funciones.order_by('-fecha_asignacion')

    detalle_id = request.GET.get('detalle')
    funcion_detalle = None
    if detalle_id:
        try:
            funcion_detalle = Funcion.objects.get(pk=detalle_id, empleado__user=request.user)
        except Funcion.DoesNotExist:
            pass

    context = {
        "fecha_hoy": timezone.localdate(),
        'funciones': funciones,
        'kpis': kpis,
        'estado_filtro': estado_filtro,
        'total_funciones': funciones.count(),
        'estados': EstadoFuncion.choices,
        'funcion_detalle': funcion_detalle,
        'puede_cambiar': funcion_detalle and funcion_detalle.estado != EstadoFuncion.FINALIZADA and not funcion_detalle.esta_vencida,
    }
    return render(request, 'empleado/funciones/funciones.html', context)

@login_required
@empleado_required
def empleado_funcion_detail(request, pk):
    funcion = get_object_or_404(Funcion, pk=pk, empleado__user=request.user)

    if request.method == 'POST':
        if funcion.esta_vencida:
            # â–¼â–¼â–¼ VerificaciÃ³n de memorando al tocar funcion vencida â–¼â–¼â–¼
            _verificar_memorando_funcion_vencida(funcion)
            # â–²â–²â–²
            messages.error(request, f"La funcion '{funcion.titulo}' está vencida y no se puede modificar.")
            return redirect('funciones:empleado_funciones_list')

        nuevo_estado = request.POST.get('estado')
        if nuevo_estado in [EstadoFuncion.EN_PROGRESO, EstadoFuncion.FINALIZADA]:
            if funcion.cambiar_estado(nuevo_estado, request.user):
                messages.success(request, f"Estado actualizado a '{funcion.get_estado_display()}'.")
            else:
                messages.error(request, "No se pudo actualizar el estado.")
        else:
            messages.error(request, "No tienes permiso para cambiar a ese estado.")
        return redirect('funciones:empleado_funciones_list')

    return redirect(f"{reverse('funciones:empleado_funciones_list')}detalle={pk}")


@login_required
@empleado_required
def empleado_funcion_marcar_progreso(request, pk):
    funcion = get_object_or_404(Funcion, pk=pk, empleado__user=request.user)
    if request.method == 'POST':

        if funcion.esta_vencida:
            _verificar_memorando_funcion_vencida(funcion)
            messages.error(
                request,
                f"La funcion '{funcion.titulo}' está vencida y no se puede modificar."
            )
            return redirect('funciones:empleado_funciones_list')

        if funcion.estado == EstadoFuncion.PENDIENTE:
            if funcion.cambiar_estado(EstadoFuncion.EN_PROGRESO, request.user):
                messages.success(request, f"Funcion '{funcion.titulo}' marcada como 'En progreso'.")
            else:
                messages.error(request, "No se pudo marcar la funcion como 'En progreso'.")
        else:
            messages.error(request, "Esta funcion ya no está pendiente.")
    return redirect('funciones:empleado_funciones_list')


@login_required
@empleado_required
def empleado_funcion_marcar_finalizada(request, pk):
    funcion = get_object_or_404(Funcion, pk=pk, empleado__user=request.user)
    if request.method == 'POST':

        if funcion.esta_vencida:
            _verificar_memorando_funcion_vencida(funcion)
            messages.error(
                request,
                f"La funcion '{funcion.titulo}' está vencida y no se puede modificar."
            )
            return redirect('funciones:empleado_funciones_list')

        if funcion.estado == EstadoFuncion.EN_PROGRESO:
            evidencia = request.FILES.get('evidencia')
            if evidencia:
                funcion.evidencia = evidencia
            if funcion.cambiar_estado(EstadoFuncion.FINALIZADA, request.user):
                messages.success(request, f"Funcion '{funcion.titulo}' marcada como 'Finalizada'.")
            else:
                messages.error(request, "No se pudo marcar la funcion como 'Finalizada'.")
        else:
            messages.error(request, "Primero debes marcar la funcion como 'En progreso'.")
    return redirect('funciones:empleado_funciones_list')
