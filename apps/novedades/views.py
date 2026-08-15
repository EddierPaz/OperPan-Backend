import json
import os

from django.http import JsonResponse, FileResponse, HttpResponseForbidden, Http404
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.shortcuts import render, redirect
from django.utils import timezone
from .models import Permiso, Incapacidad, Certificado
from .forms import (
    RechazoForm,
    CertificadoFiltroForm,
    PermisoCrearForm,
    IncapacidadCrearForm,
    CertificadoCrearForm,
)
from apps.usuarios.decorators import admin_required_json as admin_required
from apps.usuarios.decorators import admin_required as admin_required_html
from apps.usuarios.decorators import empleado_required
from .pdfs import generar_certificado_pdf


# ============================================================
# VISTAS PARA EMPLEADO (HTML + POST)
# ============================================================

@login_required
@empleado_required
def solicitudes_empleado(request):
    """
    Vista principal del empleado para gestionar sus solicitudes.
    Las solicitudes pendientes se muestran separadas del historial.
    """

    perfil = request.user.perfil

    # ============================================================
    # SOLICITUDES DEL EMPLEADO
    # ============================================================

    permisos = Permiso.objects.filter(
        empleado=perfil
    ).order_by('-fecha_solicitud')

    incapacidades = Incapacidad.objects.filter(
        empleado=perfil
    ).order_by('-fecha_solicitud')

    certificados = Certificado.objects.filter(
        empleado=perfil
    ).order_by('-fecha_solicitud')

    # ============================================================
    # PENDIENTES
    # ============================================================

    permisos_pendientes = permisos.filter(estado='pendiente')
    incapacidades_pendientes = incapacidades.filter(estado='pendiente')
    certificados_pendientes = certificados.filter(estado='pendiente')

    # ============================================================
    # HISTORIAL
    # ============================================================

    permisos_historial = permisos.filter(estado__in=['aprobado', 'rechazado'])
    incapacidades_historial = incapacidades.filter(estado__in=['aprobado', 'rechazado'])
    certificados_historial = certificados.filter(estado__in=['aprobado', 'rechazado'])

    # ============================================================
    # KPIs
    # ============================================================

    total_solicitudes = (
        permisos.count()
        + incapacidades.count()
        + certificados.count()
    )

    total_pendientes = (
        permisos_pendientes.count()
        + incapacidades_pendientes.count()
        + certificados_pendientes.count()
    )

    total_respondidas = (
        permisos_historial.count()
        + incapacidades_historial.count()
        + certificados_historial.count()
    )

    # ============================================================
    # FORMULARIOS
    # ============================================================

    permiso_form = PermisoCrearForm(prefix='permiso')
    incapacidad_form = IncapacidadCrearForm(prefix='incapacidad')
    certificado_form = CertificadoCrearForm(prefix='certificado')

    # ============================================================
    # PROCESAMIENTO DEL FORMULARIO
    # ============================================================

    if request.method == 'POST':

        tipo_solicitud = request.POST.get('tipo_solicitud')
        formulario_invalido = False

        # --------------------------------------------------------
        # PERMISO
        # --------------------------------------------------------

        if tipo_solicitud == 'permiso':

            permiso_form = PermisoCrearForm(
                request.POST,
                request.FILES,
                prefix='permiso'
            )

            if permiso_form.is_valid():

                permiso = permiso_form.save(commit=False)
                permiso.empleado = perfil
                permiso.save()

                messages.success(
                    request,
                    '✅ Permiso creado correctamente.'
                )

                return redirect('novedades:solicitudes_empleado')
            else:
                formulario_invalido = True

        # --------------------------------------------------------
        # INCAPACIDAD
        # --------------------------------------------------------

        elif tipo_solicitud == 'incapacidad':

            incapacidad_form = IncapacidadCrearForm(
                request.POST,
                request.FILES,
                prefix='incapacidad'
            )

            if incapacidad_form.is_valid():

                incapacidad = incapacidad_form.save(commit=False)
                incapacidad.empleado = perfil
                incapacidad.save()

                messages.success(
                    request,
                    '✅ Incapacidad creada correctamente.'
                )

                return redirect('novedades:solicitudes_empleado')
            else:
                formulario_invalido = True

        # --------------------------------------------------------
        # CERTIFICADO
        # --------------------------------------------------------

        elif tipo_solicitud == 'certificado':

            certificado_form = CertificadoCrearForm(
                request.POST,
                request.FILES,
                prefix='certificado'
            )

            if certificado_form.is_valid():

                certificado = certificado_form.save(commit=False)
                certificado.empleado = perfil
                certificado.save()

                messages.success(
                    request,
                    '✅ Certificado creado correctamente.'
                )

                return redirect('novedades:solicitudes_empleado')
            else:
                formulario_invalido = True

        # --------------------------------------------------------
        # CAMBIO DE TURNO / VACACIONES
        # --------------------------------------------------------

        elif tipo_solicitud in ('cambio_turno', 'vacaciones'):

            permiso_form = PermisoCrearForm(
                request.POST,
                request.FILES,
                prefix='permiso'
            )

            if permiso_form.is_valid():

                permiso = permiso_form.save(commit=False)
                permiso.empleado = perfil
                permiso.tipo = tipo_solicitud
                permiso.save()

                messages.success(
                    request,
                    f'✅ Solicitud de {tipo_solicitud.replace("_", " ")} creada correctamente.'
                )

                return redirect('novedades:solicitudes_empleado')
            else:
                formulario_invalido = True

        # --------------------------------------------------------
        # TIPO NO VÁLIDO
        # --------------------------------------------------------

        else:

            messages.error(
                request,
                '❌ Tipo de solicitud no válido.'
            )

            return redirect('novedades:solicitudes_empleado')

        # ========================================================
        # SOLO SI EL FORMULARIO ES INVÁLIDO
        # ========================================================

        if formulario_invalido:
            messages.error(
                request,
                '❌ Por favor, corrige los errores en el formulario.'
            )

            context = {
                "fecha_hoy": timezone.localdate(),
                "permisos": permisos,
                "incapacidades": incapacidades,
                "certificados": certificados,
                "permisos_pendientes": permisos_pendientes,
                "incapacidades_pendientes": incapacidades_pendientes,
                "certificados_pendientes": certificados_pendientes,
                "permisos_historial": permisos_historial,
                "incapacidades_historial": incapacidades_historial,
                "certificados_historial": certificados_historial,
                "total_solicitudes": total_solicitudes,
                "total_pendientes": total_pendientes,
                "total_respondidas": total_respondidas,
                "permiso_form": permiso_form,
                "incapacidad_form": incapacidad_form,
                "certificado_form": certificado_form,
            }

            return render(
                request,
                'empleado/solicitudes/solicitudes.html',
                context
            )

    # ============================================================
    # GET NORMAL
    # ============================================================

    context = {
        "fecha_hoy": timezone.localdate(),
        "permisos": permisos,
        "incapacidades": incapacidades,
        "certificados": certificados,
        "permisos_pendientes": permisos_pendientes,
        "incapacidades_pendientes": incapacidades_pendientes,
        "certificados_pendientes": certificados_pendientes,
        "permisos_historial": permisos_historial,
        "incapacidades_historial": incapacidades_historial,
        "certificados_historial": certificados_historial,
        "total_solicitudes": total_solicitudes,
        "total_pendientes": total_pendientes,
        "total_respondidas": total_respondidas,
        "permiso_form": permiso_form,
        "incapacidad_form": incapacidad_form,
        "certificado_form": certificado_form,
    }

    return render(
        request,
        'empleado/solicitudes/solicitudes.html',
        context
    )


# ============================================================
# EDITAR SOLICITUDES - EMPLEADO
# ============================================================

@login_required
@empleado_required
def editar_permiso(request, pk):
    """Editar un permiso pendiente"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        permiso = Permiso.objects.get(
            pk=pk,
            empleado=request.user.perfil,
            estado='pendiente'
        )
    except Permiso.DoesNotExist:
        return JsonResponse({
            'error': 'El permiso no existe, no te pertenece o ya fue procesado.'
        }, status=404)

    # Obtener los datos del POST
    fecha_inicio = request.POST.get('fecha_inicio')
    fecha_fin = request.POST.get('fecha_fin')
    justificacion = request.POST.get('motivo')
    
    # Validar campos obligatorios
    if not fecha_inicio or not fecha_fin or not justificacion:
        return JsonResponse({
            'error': 'Todos los campos son obligatorios.'
        }, status=400)
    
    # Actualizar SOLO los campos permitidos
    permiso.fecha_inicio = fecha_inicio
    permiso.fecha_fin = fecha_fin
    permiso.justificacion = justificacion
    
    if request.FILES.get('archivo'):
        permiso.archivo = request.FILES['archivo']
    
    permiso.save()

    # Guardar mensaje en sesión
    messages.success(request, '✅ Permiso actualizado correctamente.')

    return JsonResponse({
        'status': 'ok',
        'mensaje': '✅ Permiso actualizado correctamente.'
    })

@login_required
@empleado_required
def editar_incapacidad(request, pk):
    """Editar una incapacidad pendiente"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        incapacidad = Incapacidad.objects.get(
            pk=pk,
            empleado=request.user.perfil,
            estado='pendiente'
        )
    except Incapacidad.DoesNotExist:
        return JsonResponse({
            'error': 'La incapacidad no existe, no te pertenece o ya fue procesada.'
        }, status=404)

    # Obtener los datos del POST
    fecha_inicio = request.POST.get('fecha_inicio')
    fecha_fin = request.POST.get('fecha_fin')
    descripcion = request.POST.get('motivo')
    
    # Validar campos obligatorios
    if not fecha_inicio or not fecha_fin or not descripcion:
        return JsonResponse({
            'error': 'Todos los campos son obligatorios.'
        }, status=400)
    
    # Actualizar SOLO los campos permitidos
    incapacidad.fecha_inicio = fecha_inicio
    incapacidad.fecha_fin = fecha_fin
    incapacidad.descripcion = descripcion
    
    if request.FILES.get('archivo'):
        incapacidad.archivo = request.FILES['archivo']
    
    incapacidad.save()

    # Guardar mensaje en sesión
    messages.success(request, '✅ Incapacidad actualizada correctamente.')

    return JsonResponse({
        'status': 'ok',
        'mensaje': '✅ Incapacidad actualizada correctamente.'
    })
    
@login_required
@empleado_required
def editar_certificado(request, pk):
    """Editar un certificado pendiente"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        certificado = Certificado.objects.get(
            pk=pk,
            empleado=request.user.perfil,
            estado='pendiente'
        )
    except Certificado.DoesNotExist:
        return JsonResponse({
            'error': 'El certificado no existe, no te pertenece o ya fue procesado.'
        }, status=404)

    # Obtener los datos del POST
    proposito = request.POST.get('motivo')
    
    # Validar campos obligatorios
    if not proposito:
        return JsonResponse({
            'error': 'El propósito es obligatorio.'
        }, status=400)
    
    # Actualizar SOLO los campos permitidos
    certificado.proposito = proposito
    
    if request.FILES.get('archivo'):
        certificado.archivo = request.FILES['archivo']
    
    certificado.save()

    # Guardar mensaje en sesión
    messages.success(request, '✅ Certificado actualizado correctamente.')

    return JsonResponse({
        'status': 'ok',
        'mensaje': '✅ Certificado actualizado correctamente.'
    })
    
# ============================================================
# ELIMINAR SOLICITUDES - EMPLEADO
# ============================================================

@login_required
@empleado_required
def eliminar_permiso(request, pk):
    """Eliminar un permiso pendiente"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        permiso = Permiso.objects.get(
            pk=pk,
            empleado=request.user.perfil,
            estado='pendiente'
        )
    except Permiso.DoesNotExist:
        return JsonResponse({
            'error': 'El permiso no existe, no te pertenece o ya fue procesado.'
        }, status=404)

    # Guardar información para el mensaje
    tipo_permiso = permiso.get_tipo_display()
    
    # Eliminar
    permiso.delete()

    # Guardar mensaje en sesión
    messages.success(request, f'✅ Permiso "{tipo_permiso}" eliminado correctamente.')

    return JsonResponse({
        'status': 'ok',
        'mensaje': f'✅ Permiso "{tipo_permiso}" eliminado correctamente.'
    })

@login_required
@empleado_required
def eliminar_incapacidad(request, pk):
    """Eliminar una incapacidad pendiente"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        incapacidad = Incapacidad.objects.get(
            pk=pk,
            empleado=request.user.perfil,
            estado='pendiente'
        )
    except Incapacidad.DoesNotExist:
        return JsonResponse({
            'error': 'La incapacidad no existe, no te pertenece o ya fue procesada.'
        }, status=404)

    # Guardar información para el mensaje
    titulo = incapacidad.titulo
    
    # Eliminar
    incapacidad.delete()

    # Guardar mensaje en sesión
    messages.success(request, f'✅ Incapacidad "{titulo}" eliminada correctamente.')

    return JsonResponse({
        'status': 'ok',
        'mensaje': f'✅ Incapacidad "{titulo}" eliminada correctamente.'
    })


@login_required
@empleado_required
def eliminar_certificado(request, pk):
    """Eliminar un certificado pendiente"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        certificado = Certificado.objects.get(
            pk=pk,
            empleado=request.user.perfil,
            estado='pendiente'
        )
    except Certificado.DoesNotExist:
        return JsonResponse({
            'error': 'El certificado no existe, no te pertenece o ya fue procesado.'
        }, status=404)

    # Guardar información para el mensaje
    tipo_certificado = certificado.get_tipo_display()
    
    # Eliminar
    certificado.delete()

    # Guardar mensaje en sesión
    messages.success(request, f'✅ Certificado "{tipo_certificado}" eliminado correctamente.')

    return JsonResponse({
        'status': 'ok',
        'mensaje': f'✅ Certificado "{tipo_certificado}" eliminado correctamente.'
    })

# ============================================================
# VISTA PRINCIPAL PARA ADMINISTRADOR (HTML)
# ============================================================

@login_required
@admin_required_html
def novedades_admin(request):
    """Panel de novedades para administradores."""
    context = {"fecha_hoy": timezone.localdate()}
    return render(request, 'admin/novedades.html', context)


# ============================================================
# VISTAS API PARA EMPLEADO (JSON)
# ============================================================

@login_required
@empleado_required
def mis_solicitudes(request):
    """API para obtener todas las solicitudes del empleado en formato JSON."""
    perfil = request.user.perfil

    permisos = Permiso.objects.filter(empleado=perfil).values(
        'id', 'tipo', 'fecha_inicio', 'fecha_fin', 'justificacion', 'estado',
        'fecha_solicitud', 'motivo_rechazo', 'nuevo_horario'
    )
    incapacidades = Incapacidad.objects.filter(empleado=perfil).values(
        'id', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'archivo',
        'entidad_emisora', 'numero_incapacidad', 'estado', 'fecha_solicitud', 'motivo_rechazo'
    )
    certificados = Certificado.objects.filter(empleado=perfil).values(
        'id', 'tipo', 'proposito', 'dirigido_a', 'periodo',
        'estado', 'fecha_solicitud', 'fecha_emision', 'motivo_rechazo'
    )

    resultado = []

    for p in permisos:
        resultado.append({
            'id': p['id'],
            'tipo': 'permiso',
            'fecha_inicio': p['fecha_inicio'].isoformat() if p['fecha_inicio'] else None,
            'fecha_fin': p['fecha_fin'].isoformat() if p['fecha_fin'] else None,
            'estado': p['estado'],
            'motivo': p['justificacion'],
            'adjunto': None,
            'fecha_creacion': p['fecha_solicitud'].isoformat(),
            'motivo_rechazo': p['motivo_rechazo'],
            'datos_especificos': {
                'tipo_permiso': p['tipo'],
                'nuevo_horario': p['nuevo_horario'],
            }
        })

    for i in incapacidades:
        resultado.append({
            'id': i['id'],
            'tipo': 'incapacidad',
            'fecha_inicio': i['fecha_inicio'].isoformat() if i['fecha_inicio'] else None,
            'fecha_fin': i['fecha_fin'].isoformat() if i['fecha_fin'] else None,
            'estado': i['estado'],
            'motivo': i['descripcion'],
            'adjunto': i['archivo'] if i['archivo'] else None,
            'fecha_creacion': i['fecha_solicitud'].isoformat(),
            'motivo_rechazo': i['motivo_rechazo'],
            'datos_especificos': {
                'entidad': i['entidad_emisora'],
                'numero_incapacidad': i['numero_incapacidad'],
            }
        })

    for c in certificados:
        resultado.append({
            'id': c['id'],
            'tipo': 'certificado',
            'fecha_inicio': c['fecha_solicitud'].date().isoformat(),
            'fecha_fin': c['fecha_emision'].date().isoformat() if c['fecha_emision'] else None,
            'estado': c['estado'],
            'motivo': c['proposito'],
            'adjunto': None,
            'fecha_creacion': c['fecha_solicitud'].isoformat(),
            'motivo_rechazo': c['motivo_rechazo'],
            'datos_especificos': {
                'tipo_certificado': c['tipo'],
                'dirigido_a': c['dirigido_a'],
                'periodo': c['periodo'],
                'puede_descargar': c['estado'] == 'aprobado',
            }
        })

    resultado.sort(key=lambda x: x['fecha_creacion'], reverse=True)
    return JsonResponse(resultado, safe=False)


@login_required
@empleado_required
def crear_permiso(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    form = PermisoCrearForm(request.POST)
    if not form.is_valid():
        return JsonResponse({'error': 'Datos inválidos', 'detalles': form.errors}, status=400)
    permiso = form.save(commit=False)
    permiso.empleado = request.user.perfil
    permiso.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Permiso creado correctamente', 'id': permiso.id})


@login_required
@empleado_required
def crear_incapacidad(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    form = IncapacidadCrearForm(request.POST, request.FILES)
    if not form.is_valid():
        return JsonResponse({'error': 'Datos inválidos', 'detalles': form.errors}, status=400)
    incapacidad = form.save(commit=False)
    incapacidad.empleado = request.user.perfil
    incapacidad.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Incapacidad creada correctamente', 'id': incapacidad.id})


@login_required
@empleado_required
def crear_certificado(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    form = CertificadoCrearForm(request.POST)
    if not form.is_valid():
        return JsonResponse({'error': 'Datos inválidos', 'detalles': form.errors}, status=400)
    certificado = form.save(commit=False)
    certificado.empleado = request.user.perfil
    certificado.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Certificado creado correctamente', 'id': certificado.id})


# ============================================================
# VISTAS API PARA ADMINISTRADOR (JSON)
# ============================================================

# ---------- PERMISOS ----------
@login_required
@admin_required
def permisos_pendientes(request):
    pendientes = Permiso.objects.filter(estado='pendiente').select_related('empleado__user')
    data = [
        {
            'id': p.id,
            'empleado': p.empleado.nombre_completo(),
            'empleado_id': p.empleado.id,
            'tipo': p.get_tipo_display(),
            'fecha_inicio': p.fecha_inicio.isoformat(),
            'fecha_fin': p.fecha_fin.isoformat(),
            'justificacion': p.justificacion,
            'fecha_solicitud': p.fecha_solicitud.isoformat(),
        }
        for p in pendientes
    ]
    return JsonResponse(data, safe=False)


@login_required
@admin_required
def permisos_historial(request):
    qs = Permiso.objects.all().select_related('empleado__user')
    estado = request.GET.get('estado')
    tipo = request.GET.get('tipo')
    if estado:
        qs = qs.filter(estado=estado)
    if tipo:
        qs = qs.filter(tipo=tipo)
    qs = qs.order_by('-fecha_solicitud')
    data = [
        {
            'id': p.id,
            'empleado': p.empleado.nombre_completo(),
            'tipo': p.get_tipo_display(),
            'fecha_inicio': p.fecha_inicio.isoformat(),
            'fecha_fin': p.fecha_fin.isoformat(),
            'estado': p.get_estado_display(),
            'fecha_solicitud': p.fecha_solicitud.isoformat(),
            'decision_por': p.decision_por.username if p.decision_por else None,
            'motivo_rechazo': p.motivo_rechazo,
        }
        for p in qs
    ]
    return JsonResponse(data, safe=False)


@login_required
@admin_required
def permiso_detalle(request, pk):
    try:
        p = Permiso.objects.select_related('empleado__user', 'decision_por').get(pk=pk)
    except Permiso.DoesNotExist:
        return JsonResponse({'error': 'Permiso no encontrado'}, status=404)

    data = {
        'id': p.id,
        'empleado': p.empleado.nombre_completo(),
        'empleado_id': p.empleado.id,
        'tipo': p.get_tipo_display(),
        'fecha_inicio': p.fecha_inicio.isoformat(),
        'fecha_fin': p.fecha_fin.isoformat(),
        'justificacion': p.justificacion,
        'nuevo_horario': p.nuevo_horario,
        'estado': p.get_estado_display(),
        'fecha_solicitud': p.fecha_solicitud.isoformat(),
        'decision_por': p.decision_por.username if p.decision_por else None,
        'decision_fecha': p.decision_fecha.isoformat() if p.decision_fecha else None,
        'motivo_rechazo': p.motivo_rechazo,
        'archivo': p.archivo.url if p.archivo else None,
    }
    return JsonResponse(data)


@csrf_exempt
@login_required
@admin_required
def permiso_aprobar(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    try:
        p = Permiso.objects.get(pk=pk, estado='pendiente')
    except Permiso.DoesNotExist:
        return JsonResponse({'error': 'Permiso no encontrado o ya procesado'}, status=404)

    p.estado = 'aprobado'
    p.decision_por = request.user
    p.decision_fecha = timezone.now()
    p.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Permiso aprobado'})


@csrf_exempt
@login_required
@admin_required
def permiso_rechazar(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        p = Permiso.objects.get(pk=pk, estado='pendiente')
    except Permiso.DoesNotExist:
        return JsonResponse({'error': 'Permiso no encontrado o ya procesado'}, status=404)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    form = RechazoForm(data)
    if not form.is_valid():
        return JsonResponse({'error': 'Motivo requerido', 'detalles': form.errors}, status=400)

    p.estado = 'rechazado'
    p.motivo_rechazo = form.cleaned_data['motivo']
    p.decision_por = request.user
    p.decision_fecha = timezone.now()
    p.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Permiso rechazado'})


# ---------- INCAPACIDADES ----------
@login_required
@admin_required
def incapacidades_pendientes(request):
    pendientes = Incapacidad.objects.filter(estado='pendiente').select_related('empleado__user')
    data = [
        {
            'id': i.id,
            'empleado': i.empleado.nombre_completo(),
            'titulo': i.titulo,
            'descripcion': i.descripcion,
            'fecha_inicio': i.fecha_inicio.isoformat(),
            'fecha_fin': i.fecha_fin.isoformat(),
            'fecha_solicitud': i.fecha_solicitud.isoformat(),
        }
        for i in pendientes
    ]
    return JsonResponse(data, safe=False)


@login_required
@admin_required
def incapacidades_historial(request):
    qs = Incapacidad.objects.all().select_related('empleado__user')
    estado = request.GET.get('estado')
    empleado = request.GET.get('empleado')
    if estado:
        qs = qs.filter(estado=estado)
    if empleado:
        qs = qs.filter(empleado__id=empleado)
    qs = qs.order_by('-fecha_solicitud')

    data = [
        {
            'id': i.id,
            'empleado': i.empleado.nombre_completo(),
            'titulo': i.titulo,
            'fecha_inicio': i.fecha_inicio.isoformat(),
            'fecha_fin': i.fecha_fin.isoformat(),
            'estado': i.get_estado_display(),
            'fecha_solicitud': i.fecha_solicitud.isoformat(),
            'decision_por': i.decision_por.username if i.decision_por else None,
            'motivo_rechazo': i.motivo_rechazo,
        }
        for i in qs
    ]
    return JsonResponse(data, safe=False)


@login_required
@admin_required
def incapacidad_detalle(request, pk):
    try:
        i = Incapacidad.objects.select_related('empleado__user', 'decision_por').get(pk=pk)
    except Incapacidad.DoesNotExist:
        return JsonResponse({'error': 'Incapacidad no encontrada'}, status=404)

    data = {
        'id': i.id,
        'empleado': i.empleado.nombre_completo(),
        'titulo': i.titulo,
        'descripcion': i.descripcion,
        'fecha_inicio': i.fecha_inicio.isoformat(),
        'fecha_fin': i.fecha_fin.isoformat(),
        'archivo': i.archivo.url if i.archivo else None,
        'estado': i.get_estado_display(),
        'fecha_solicitud': i.fecha_solicitud.isoformat(),
        'decision_por': i.decision_por.username if i.decision_por else None,
        'decision_fecha': i.decision_fecha.isoformat() if i.decision_fecha else None,
        'motivo_rechazo': i.motivo_rechazo,
    }
    return JsonResponse(data)


@csrf_exempt
@login_required
@admin_required
def incapacidad_aprobar(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    try:
        i = Incapacidad.objects.get(pk=pk, estado='pendiente')
    except Incapacidad.DoesNotExist:
        return JsonResponse({'error': 'Incapacidad no encontrada o ya procesada'}, status=404)

    i.estado = 'aprobado'
    i.decision_por = request.user
    i.decision_fecha = timezone.now()
    i.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Incapacidad aprobada'})


@csrf_exempt
@login_required
@admin_required
def incapacidad_rechazar(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        i = Incapacidad.objects.get(pk=pk, estado='pendiente')
    except Incapacidad.DoesNotExist:
        return JsonResponse({'error': 'Incapacidad no encontrada o ya procesada'}, status=404)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    form = RechazoForm(data)
    if not form.is_valid():
        return JsonResponse({'error': 'Motivo requerido', 'detalles': form.errors}, status=400)

    i.estado = 'rechazado'
    i.motivo_rechazo = form.cleaned_data['motivo']
    i.decision_por = request.user
    i.decision_fecha = timezone.now()
    i.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Incapacidad rechazada'})


# ---------- CERTIFICADOS ----------
@login_required
@admin_required
def certificados_lista(request):
    qs = Certificado.objects.all().select_related('empleado__user', 'generado_por')

    form = CertificadoFiltroForm(request.GET)
    if form.is_valid():
        data = form.cleaned_data
        if data.get('empleado'):
            qs = qs.filter(empleado__id=data['empleado'])
        if data.get('tipo'):
            qs = qs.filter(tipo=data['tipo'])
        if data.get('desde'):
            qs = qs.filter(fecha_emision__date__gte=data['desde'])
        if data.get('hasta'):
            qs = qs.filter(fecha_emision__date__lte=data['hasta'])

    qs = qs.order_by('-fecha_solicitud')
    data = [
        {
            'id': c.id,
            'empleado': c.empleado.nombre_completo(),
            'cargo': c.empleado.cargo,
            'tipo': c.get_tipo_display(),
            'estado': c.get_estado_display(),
            'fecha_solicitud': c.fecha_solicitud.isoformat(),
            'fecha_emision': c.fecha_emision.isoformat() if c.fecha_emision else None,
            'fecha_decision': c.decision_fecha.isoformat() if c.decision_fecha else None,
            'proposito': c.proposito,
            'generado_por': c.generado_por.username if c.generado_por else None,
            'descargas': c.descargas,
        }
        for c in qs
    ]
    return JsonResponse(data, safe=False)


@login_required
@admin_required
def certificados_pendientes(request):
    pendientes = Certificado.objects.filter(estado='pendiente').select_related('empleado__user')
    data = [
        {
            'id': c.id,
            'empleado': c.empleado.nombre_completo(),
            'empleado_id': c.empleado.id,
            'tipo': c.get_tipo_display(),
            'proposito': c.proposito,
            'dirigido_a': c.dirigido_a,
            'periodo': c.periodo,
            'fecha_solicitud': c.fecha_solicitud.isoformat(),
        }
        for c in pendientes
    ]
    return JsonResponse(data, safe=False)


# ============================================================
# CERTIFICADO DETALLE - NUEVA VISTA
# ============================================================
@login_required
def certificado_detalle(request, pk):
    try:
        c = Certificado.objects.select_related('empleado__user', 'decision_por', 'generado_por').get(pk=pk)
    except Certificado.DoesNotExist:
        return JsonResponse({'error': 'Certificado no encontrado'}, status=404)

    # ============================================================
    # VERIFICAR PERMISOS - USANDO ROL
    # ============================================================
    user = request.user
    es_admin = user.rol == 'admin'
    es_dueño = False
    if hasattr(user, 'perfil'):
        es_dueño = c.empleado_id == user.perfil.id

    if not (es_dueño or es_admin):
        return JsonResponse({'error': 'No tienes permiso para ver este certificado.'}, status=403)

    data = {
        'id': c.id,
        'empleado': c.empleado.nombre_completo(),
        'empleado_id': c.empleado.id,
        'cargo': c.empleado.cargo,
        'tipo': c.get_tipo_display(),
        'proposito': c.proposito,
        'dirigido_a': c.dirigido_a,
        'periodo': c.periodo,
        'archivo': c.archivo.url if c.archivo else None,
        'estado': c.get_estado_display(),
        'fecha_solicitud': c.fecha_solicitud.isoformat(),
        'fecha_emision': c.fecha_emision.isoformat() if c.fecha_emision else None,
        'decision_por': c.decision_por.username if c.decision_por else None,
        'decision_fecha': c.decision_fecha.isoformat() if c.decision_fecha else None,
        'motivo_rechazo': c.motivo_rechazo,
        'descargas': c.descargas,
        'generado_por': c.generado_por.username if c.generado_por else None,
        'url_descarga': f'/novedades/certificados/{c.id}/descargar/',
    }
    return JsonResponse(data)


@csrf_exempt
@login_required
@admin_required
def certificado_aprobar(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    try:
        c = Certificado.objects.get(pk=pk, estado='pendiente')
    except Certificado.DoesNotExist:
        return JsonResponse({'error': 'Certificado no encontrado o ya procesado'}, status=404)

    # Datos opcionales enviados al aprobar (solo aplican según el tipo)
    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        data = {}

    if data.get('salario'):
        c.salario = data['salario']
    if data.get('fecha_retiro'):
        c.fecha_retiro = data['fecha_retiro']

    c.estado = 'aprobado'
    c.fecha_emision = timezone.now()
    c.decision_por = request.user
    c.decision_fecha = timezone.now()
    c.generado_por = request.user
    c.save()

    try:
        pdf_path = generar_certificado_pdf(c)
        c.archivo = pdf_path
        c.save(update_fields=['archivo'])
    except Exception as e:
        print(f"Error al generar PDF para certificado {c.id}: {e}")

    return JsonResponse({'status': 'ok', 'mensaje': 'Certificado aprobado'})


@csrf_exempt
@login_required
@admin_required
def certificado_rechazar(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        c = Certificado.objects.get(pk=pk, estado='pendiente')
    except Certificado.DoesNotExist:
        return JsonResponse({
            'error': 'Certificado no encontrado o ya procesado'
        }, status=404)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    form = RechazoForm(data)

    if not form.is_valid():
        return JsonResponse({
            'error': 'Motivo requerido',
            'detalles': form.errors
        }, status=400)

    c.estado = 'rechazado'
    c.motivo_rechazo = form.cleaned_data['motivo']
    c.decision_por = request.user
    c.decision_fecha = timezone.now()
    c.save()

    return JsonResponse({
        'status': 'ok',
        'mensaje': 'Certificado rechazado',
        'fecha_decision': c.decision_fecha.isoformat()
    })


@login_required
def certificado_descargar(request, pk):
    """Descarga el PDF del certificado (solo si está aprobado)."""
    try:
        c = Certificado.objects.select_related('empleado__user').get(pk=pk)
    except Certificado.DoesNotExist:
        raise Http404('Certificado no encontrado')

    user = request.user
    es_admin = user.rol == 'admin'
    es_dueño = hasattr(user, 'perfil') and c.empleado_id == user.perfil.id

    if not (es_dueño or es_admin):
        return HttpResponseForbidden('No tienes permiso para descargar este certificado.')

    if c.estado != 'aprobado':
        return JsonResponse({'error': 'El certificado aún no ha sido aprobado.'}, status=400)

    if not c.archivo or not os.path.exists(c.archivo.path):
        try:
            pdf_path = generar_certificado_pdf(c)
            c.archivo = pdf_path
            c.save(update_fields=['archivo'])
        except Exception as e:
            return JsonResponse({'error': f'Error al generar el PDF: {str(e)}'}, status=500)

    c.descargas += 1
    c.save(update_fields=['descargas'])

    filename = f"certificado_{c.id}_{c.empleado.nombre_completo().replace(' ', '_')}.pdf"
    response = FileResponse(c.archivo.open('rb'), as_attachment=True, filename=filename, content_type='application/pdf')
    return response