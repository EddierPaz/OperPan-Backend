import json
import os
from datetime import date, timedelta
from django.http import JsonResponse, FileResponse, HttpResponseForbidden, Http404
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.shortcuts import render, redirect
from django.utils import timezone
from .models import Solicitud, Incapacidad, Certificado
from .forms import (
    RechazoForm,
    CertificadoFiltroForm,
    SolicitudCrearForm,
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
def novedades_empleado(request):
    """
    Vista principal del empleado para gestionar sus solicitudes.
    Las solicitudes pendientes se muestran separadas del historial.
    Límite: máximo 2 solicitudes pendientes por tipo (solicitud, incapacidad, certificado).
    """

    perfil = request.user.perfil

    # ============================================================
    # SOLICITUDES DEL EMPLEADO
    # ============================================================

    solicitudes = Solicitud.objects.filter(
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

    solicitudes_pendientes = solicitudes.filter(estado='pendiente')
    incapacidades_pendientes = incapacidades.filter(estado='pendiente')
    certificados_pendientes = certificados.filter(estado='pendiente')

    # ============================================================
    # HISTORIAL
    # ============================================================

    solicitudes_historial = solicitudes.filter(estado__in=['aprobado', 'rechazado'])
    incapacidades_historial = incapacidades.filter(estado__in=['aprobado', 'rechazado'])
    certificados_historial = certificados.filter(estado__in=['aprobado', 'rechazado'])

    # ============================================================
    # KPIs
    # ============================================================

    total_solicitudes = (
        solicitudes.count()
        + incapacidades.count()
        + certificados.count()
    )

    total_pendientes = (
        solicitudes_pendientes.count()
        + incapacidades_pendientes.count()
        + certificados_pendientes.count()
    )

    total_respondidas = (
        solicitudes_historial.count()
        + incapacidades_historial.count()
        + certificados_historial.count()
    )

    # ============================================================
    # FORMULARIOS
    # ============================================================

    solicitud_form = SolicitudCrearForm(prefix='solicitud', empleado=perfil)
    incapacidad_form = IncapacidadCrearForm(prefix='incapacidad')
    certificado_form = CertificadoCrearForm(prefix='certificado')

    # ============================================================
    # PROCESAMIENTO DEL FORMULARIO
    # ============================================================

    if request.method == 'POST':
        tipo_solicitud = request.POST.get('tipo_solicitud')
        es_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'
        formulario_invalido = False
        formulario_activo = None

        # --------------------------------------------------------
        # SOLICITUD (solicitud, cambio_turno, vacaciones)
        # --------------------------------------------------------
        if tipo_solicitud == 'solicitud':
            if solicitudes_pendientes.count() >= 2:
                mensaje = 'Ya tienes 2 solicitudes pendientes. Espera a que sean respondidas antes de crear otra.'
                if es_ajax:
                    return JsonResponse({'status': 'error', 'error': mensaje, 'errores': [mensaje]}, status=400)
                messages.error(request, mensaje)
                return redirect('novedades:novedades_empleado')

            solicitud_form = SolicitudCrearForm(request.POST, request.FILES, prefix='solicitud', empleado=perfil)
            formulario_activo = solicitud_form
            if solicitud_form.is_valid():
                solicitud = solicitud_form.save(commit=False)
                solicitud.empleado = perfil
                solicitud.save()

                contexto_admin = {
                    'empleado_nombre': perfil.nombre_completo(),
                    'tipo_solicitud': solicitud.get_tipo_display(),
                    'fecha_inicio': solicitud.fecha_inicio.strftime('%d/%m/%Y'),
                    'fecha_fin': solicitud.fecha_fin.strftime('%d/%m/%Y'),
                    'motivo': solicitud.justificacion,
                }
                

                mensaje = 'Solicitud creada correctamente.'
                messages.success(request, mensaje)
                if es_ajax:
                    return JsonResponse({'status': 'ok', 'mensaje': mensaje})
                return redirect('novedades:novedades_empleado')
            else:
                formulario_invalido = True

        # --------------------------------------------------------
        # INCAPACIDAD
        # --------------------------------------------------------
        elif tipo_solicitud == 'incapacidad':
            if incapacidades_pendientes.count() >= 2:
                mensaje = 'Ya tienes 2 incapacidades pendientes. Espera a que sean respondidas antes de crear otra.'
                if es_ajax:
                    return JsonResponse({'status': 'error', 'error': mensaje, 'errores': [mensaje]}, status=400)
                messages.error(request, mensaje)
                return redirect('novedades:novedades_empleado')


            instancia_incap = Incapacidad(empleado=perfil)
            incapacidad_form = IncapacidadCrearForm(request.POST, request.FILES, prefix='incapacidad', instance=instancia_incap)
            formulario_activo = incapacidad_form
            if incapacidad_form.is_valid():
                incapacidad = incapacidad_form.save(commit=False)
                incapacidad.empleado = perfil
                incapacidad.save()

                contexto_admin = {
                    'empleado_nombre': perfil.nombre_completo(),
                    'tipo_solicitud': 'Incapacidad',
                    'fecha_inicio': incapacidad.fecha_inicio.strftime('%d/%m/%Y'),
                    'fecha_fin': incapacidad.fecha_fin.strftime('%d/%m/%Y'),
                }
                

                mensaje = 'Incapacidad creada correctamente.'
                messages.success(request, mensaje)
                if es_ajax:
                    return JsonResponse({'status': 'ok', 'mensaje': mensaje})
                return redirect('novedades:novedades_empleado')
            else:
                formulario_invalido = True

        # --------------------------------------------------------
        # CERTIFICADO
        # --------------------------------------------------------
        elif tipo_solicitud == 'certificado':
            if certificados_pendientes.count() >= 2:
                mensaje = 'Ya tienes 2 certificados pendientes. Espera a que sean respondidos antes de crear otro.'
                if es_ajax:
                    return JsonResponse({'status': 'error', 'error': mensaje, 'errores': [mensaje]}, status=400)
                messages.error(request, mensaje)
                return redirect('novedades:novedades_empleado')

            certificado_form = CertificadoCrearForm(request.POST, request.FILES, prefix='certificado')
            formulario_activo = certificado_form
            if certificado_form.is_valid():
                certificado = certificado_form.save(commit=False)
                certificado.empleado = perfil
                certificado.save()

                contexto_admin = {
                    'empleado_nombre': perfil.nombre_completo(),
                    'tipo_solicitud': 'Certificado',
                    'fecha_inicio': certificado.fecha_solicitud.strftime('%d/%m/%Y'),  # no tiene fechas propias
                    'fecha_fin': 'N/A',
                    'motivo': certificado.proposito,
                }

                mensaje = 'Certificado creado correctamente.'
                messages.success(request, mensaje)
                if es_ajax:
                    return JsonResponse({'status': 'ok', 'mensaje': mensaje})
                return redirect('novedades:novedades_empleado')
            else:
                formulario_invalido = True

        # --------------------------------------------------------
        # TIPO NO VÁLIDO
        # --------------------------------------------------------
        else:
            mensaje = 'Tipo de novedad no válido.'
            if es_ajax:
                return JsonResponse({'status': 'error', 'error': mensaje, 'errores': [mensaje]}, status=400)
            messages.error(request, mensaje)
            return redirect('novedades:novedades_empleado')

        # ========================================================
        # SOLO SI EL FORMULARIO ES INVÁLIDO
        # ========================================================
        if formulario_invalido:
            errores_formulario = _errores_formulario(formulario_activo)
            if es_ajax:
                return JsonResponse({
                    'status': 'error',
                    'error': 'No se pudo enviar la novedad. Revisa los campos indicados.',
                    'errores': errores_formulario,
                }, status=400)
            mensaje_error = errores_formulario[0] if errores_formulario else 'Revisa los datos ingresados.'
            messages.error(request, f'No se pudo enviar la novedad: {mensaje_error}')

            context = {
                "fecha_hoy": timezone.localdate(),
                "solicitudes": solicitudes,
                "incapacidades": incapacidades,
                "certificados": certificados,
                "solicitudes_pendientes": solicitudes_pendientes,
                "incapacidades_pendientes": incapacidades_pendientes,
                "certificados_pendientes": certificados_pendientes,
                "solicitudes_historial": solicitudes_historial,
                "incapacidades_historial": incapacidades_historial,
                "certificados_historial": certificados_historial,
                "total_solicitudes": total_solicitudes,
                "total_pendientes": total_pendientes,
                "total_respondidas": total_respondidas,
                "solicitud_form": solicitud_form,
                "incapacidad_form": incapacidad_form,
                "certificado_form": certificado_form,
                "tipo_solicitud_actual": tipo_solicitud,
                "reabrir_modal_novedad": True,
            }

            return render(
                request,
                'empleado/novedades/novedades.html',
                context
            )

    # ============================================================
    # GET NORMAL
    # ============================================================

    context = {
        "fecha_hoy": timezone.localdate(),
        "solicitudes": solicitudes,
        "incapacidades": incapacidades,
        "certificados": certificados,
        "solicitudes_pendientes": solicitudes_pendientes,
        "incapacidades_pendientes": incapacidades_pendientes,
        "certificados_pendientes": certificados_pendientes,
        "solicitudes_historial": solicitudes_historial,
        "incapacidades_historial": incapacidades_historial,
        "certificados_historial": certificados_historial,
        "total_solicitudes": total_solicitudes,
        "total_pendientes": total_pendientes,
        "total_respondidas": total_respondidas,
        "solicitud_form": solicitud_form,
        "incapacidad_form": incapacidad_form,
        "certificado_form": certificado_form,
    }

    return render(
        request,
        'empleado/novedades/novedades.html',
        context
    )


# ============================================================
# EDITAR SOLICITUDES - EMPLEADO
# ============================================================

def _errores_formulario(form):
    errores_formulario = []
    for campo, errores in form.errors.items():
        if campo == '__all__':
            etiqueta = ''
        else:
            etiqueta = form.fields[campo].label or campo.replace('_', ' ').capitalize()
        for error in errores:
            errores_formulario.append(f'{etiqueta}: {error}' if etiqueta else str(error))
    return errores_formulario


def _primer_error_formulario(form):
    errores = _errores_formulario(form)
    return errores[0] if errores else 'Revisa los datos ingresados.'


@login_required
@empleado_required
def editar_solicitud(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        solicitud = Solicitud.objects.get(pk=pk, empleado=request.user.perfil, estado='pendiente')
    except Solicitud.DoesNotExist:
        return JsonResponse({'error': 'La solicitud no existe, no te pertenece o ya fue procesada.'}, status=404)

    datos = request.POST.copy()
    datos['tipo'] = solicitud.tipo
    form = SolicitudCrearForm(
        datos,
        request.FILES,
        instance=solicitud,
        empleado=request.user.perfil,
    )
    if not form.is_valid():
        return JsonResponse({
            'error': f'No se pudo actualizar la solicitud. {_primer_error_formulario(form)}'
        }, status=400)

    form.save()

    messages.success(request, 'Solicitud actualizada correctamente.')
    return JsonResponse({'status': 'ok', 'mensaje': 'Solicitud actualizada correctamente.'})

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

    if not fecha_inicio or not fecha_fin:
        return JsonResponse({'error': 'Las fechas son obligatorias.'}, status=400)

    try:
        fecha_inicio_dt = date.fromisoformat(fecha_inicio)
        fecha_fin_dt = date.fromisoformat(fecha_fin)
    except ValueError:
        return JsonResponse({'error': 'Fechas inválidas.'}, status=400)

    if fecha_fin_dt < fecha_inicio_dt:
        return JsonResponse({'error': 'La fecha de fin no puede ser anterior a la de inicio.'}, status=400)

    incapacidad.fecha_inicio = fecha_inicio_dt
    incapacidad.fecha_fin = fecha_fin_dt

    if request.FILES.get('archivo'):
        incapacidad.archivo = request.FILES['archivo']

    incapacidad.save()

    # Guardar mensaje en sesión
    messages.success(request, 'Incapacidad actualizada correctamente.')

    return JsonResponse({
        'status': 'ok',
        'mensaje': 'Incapacidad actualizada correctamente.'
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

    form = CertificadoCrearForm(
        request.POST,
        request.FILES,
        instance=certificado,
    )
    if not form.is_valid():
        return JsonResponse({
            'error': f'No se pudo actualizar el certificado. {_primer_error_formulario(form)}'
        }, status=400)

    form.save()

    # Guardar mensaje en sesión
    messages.success(request, 'Certificado actualizado correctamente.')

    return JsonResponse({
        'status': 'ok',
        'mensaje': 'Certificado actualizado correctamente.'
    })
    
# ============================================================
# ELIMINAR SOLICITUDES - EMPLEADO
# ============================================================

@login_required
@empleado_required
def eliminar_solicitud(request, pk):
    """Eliminar una solicitud pendiente"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        solicitud = Solicitud.objects.get(
            pk=pk,
            empleado=request.user.perfil,
            estado='pendiente'
        )
    except Solicitud.DoesNotExist:
        return JsonResponse({
            'error': 'La solicitud no existe, no te pertenece o ya fue procesada.'
        }, status=404)

    # Guardar información para el mensaje
    tipo_solicitud = solicitud.get_tipo_display()
    
    # Eliminar
    solicitud.delete()

    # Guardar mensaje en sesión
    messages.success(request, f'Solicitud "{tipo_solicitud}" eliminada correctamente.')

    return JsonResponse({
        'status': 'ok',
        'mensaje': f'Solicitud "{tipo_solicitud}" eliminada correctamente.'
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
    
    # Eliminar
    incapacidad.delete()

    # Guardar mensaje en sesión
    messages.success(request, f'Incapacidad eliminada correctamente.')

    return JsonResponse({
        'status': 'ok',
        'mensaje': f'Incapacidad eliminada correctamente.'
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
    messages.success(request, f'Certificado "{tipo_certificado}" eliminado correctamente.')

    return JsonResponse({
        'status': 'ok',
        'mensaje': f'Certificado "{tipo_certificado}" eliminado correctamente.'
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

    solicitudes = Solicitud.objects.filter(empleado=perfil).values(
        'id', 'tipo', 'fecha_inicio', 'fecha_fin', 'justificacion', 'estado',
        'fecha_solicitud', 'motivo_rechazo', 'nuevo_horario'
    )
    incapacidades = Incapacidad.objects.filter(empleado=perfil).values(
        'id', 'fecha_inicio', 'fecha_fin', 'archivo','estado', 'fecha_solicitud', 'motivo_rechazo'
    )
    certificados = Certificado.objects.filter(empleado=perfil).values(
        'id', 'tipo', 'proposito', 'dirigido_a', 'periodo',
        'estado', 'fecha_solicitud', 'fecha_emision', 'motivo_rechazo'
    )

    resultado = []

    for s in solicitudes:
        resultado.append({
            'id': s['id'],
            'tipo': 'solicitud',
            'fecha_inicio': s['fecha_inicio'].isoformat() if s['fecha_inicio'] else None,
            'fecha_fin': s['fecha_fin'].isoformat() if s['fecha_fin'] else None,
            'estado': s['estado'],
            'motivo': s['justificacion'],
            'adjunto': None,
            'fecha_creacion': s['fecha_solicitud'].isoformat(),
            'motivo_rechazo': s['motivo_rechazo'],
            'datos_especificos': {
                'tipo_solicitud': s['tipo'],
                'nuevo_horario': s['nuevo_horario'],
            }
        })

    for i in incapacidades:
        resultado.append({
            'id': i['id'],
            'tipo': 'incapacidad',
            'fecha_inicio': i['fecha_inicio'].isoformat() if i['fecha_inicio'] else None,
            'fecha_fin': i['fecha_fin'].isoformat() if i['fecha_fin'] else None,
            'estado': i['estado'],
            'adjunto': i['archivo'] if i['archivo'] else None,
            'fecha_creacion': i['fecha_solicitud'].isoformat(),
            'motivo_rechazo': i['motivo_rechazo'],
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
def crear_solicitud(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    form = SolicitudCrearForm(request.POST, request.FILES, empleado=request.user.perfil)
    if not form.is_valid():
        return JsonResponse({'error': 'Datos inválidos', 'detalles': form.errors}, status=400)
    solicitud = form.save(commit=False)
    solicitud.empleado = request.user.perfil
    solicitud.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Solicitud creada correctamente', 'id': solicitud.id})


@login_required
@empleado_required
def crear_incapacidad(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    instancia = Incapacidad(empleado=request.user.perfil)
    form = IncapacidadCrearForm(request.POST, request.FILES, instance=instancia)
    if not form.is_valid():
        return JsonResponse({'error': 'Datos inválidos', 'detalles': form.errors}, status=400)
    incapacidad = form.save()
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

# ---------- SOLICITUDES ----------
@login_required
@admin_required
def solicitudes_pendientes(request):
    pendientes = Solicitud.objects.filter(estado='pendiente').select_related('empleado__user')
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
def solicitudes_historial(request):
    qs = Solicitud.objects.all().select_related('empleado__user')
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
def solicitud_detalle(request, pk):
    try:
        s = Solicitud.objects.select_related('empleado__user', 'decision_por').get(pk=pk)
    except Solicitud.DoesNotExist:
        return JsonResponse({'error': 'Solicitud no encontrada'}, status=404)

    data = {
        'id': s.id,
        'empleado': s.empleado.nombre_completo(),
        'empleado_id': s.empleado.id,
        'tipo': s.get_tipo_display(),
        'fecha_inicio': s.fecha_inicio.isoformat(),
        'fecha_fin': s.fecha_fin.isoformat(),
        'justificacion': s.justificacion,
        'nuevo_horario': s.nuevo_horario,
        'estado': s.get_estado_display(),
        'fecha_solicitud': s.fecha_solicitud.isoformat(),
        'decision_por': s.decision_por.username if s.decision_por else None,
        'decision_fecha': s.decision_fecha.isoformat() if s.decision_fecha else None,
        'motivo_rechazo': s.motivo_rechazo,
        'archivo': s.archivo.url if s.archivo else None,
    }
    return JsonResponse(data)


def _aplicar_cambio_turno(solicitud):
    """
    Ya NO modifica el Horario en BD. El override se aplica en memoria
    desde apps.asistencia.services.horario_service.aplicar_override_cambio_turno
    cada vez que se consulta el horario vigente.
    """
    from apps.asistencia.services.horario_service import obtener_o_generar_horario_vigente

    horario = obtener_o_generar_horario_vigente(solicitud.empleado)
    if not horario:
        print(f"[novedades] Cambio de turno aprobado (solicitud {solicitud.pk}) "
              f"pero el empleado no tiene horario vigente.")
        return False

    if horario.turno not in ('MANANA', 'TARDE'):
        print(f"[novedades] Cambio de turno aprobado (solicitud {solicitud.pk}) "
              f"pero el turno base es {horario.turno} (no permitido). "
              f"El override no se aplicará.")
        return False

    return True


@csrf_exempt
@login_required
@admin_required
def solicitud_aprobar(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    try:
        s = Solicitud.objects.get(pk=pk, estado='pendiente')
    except Solicitud.DoesNotExist:
        return JsonResponse({'error': 'Solicitud no encontrada o ya procesada'}, status=404)

    s.estado = 'aprobado'
    s.decision_por = request.user
    s.decision_fecha = timezone.now()
    s.save()

    # Si es cambio de turno, aplicar al Horario del empleado (Opción B)
    if s.tipo == 'cambio_turno':
        try:
            _aplicar_cambio_turno(s)
        except Exception as e:
            print(f"[novedades.solicitud_aprobar] Error aplicando cambio de turno (solicitud {s.pk}): {e}")

    contexto = {
        'empleado_nombre': s.empleado.nombre_completo(),
        'tipo_solicitud': s.get_tipo_display(),
        'fecha_inicio': s.fecha_inicio.strftime('%d/%m/%Y'),
        'fecha_fin': s.fecha_fin.strftime('%d/%m/%Y'),
    }

    return JsonResponse({'status': 'ok', 'mensaje': 'Solicitud aprobada'})


@csrf_exempt
@login_required
@admin_required
def solicitud_rechazar(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        s = Solicitud.objects.get(pk=pk, estado='pendiente')
    except Solicitud.DoesNotExist:
        return JsonResponse({'error': 'Solicitud no encontrada o ya procesada'}, status=404)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    form = RechazoForm(data)
    if not form.is_valid():
        return JsonResponse({'error': 'Motivo requerido', 'detalles': form.errors}, status=400)

    s.estado = 'rechazado'
    s.motivo_rechazo = form.cleaned_data['motivo']
    s.decision_por = request.user
    s.decision_fecha = timezone.now()
    s.save()

    # =====================================================
    # NOTIFICACIÓN AL EMPLEADO (CON MOTIVO)
    # =====================================================
    contexto = {
        'empleado_nombre': s.empleado.nombre_completo(),
        'tipo_solicitud': s.get_tipo_display(),
        'motivo_rechazo': s.motivo_rechazo,
    }

    return JsonResponse({'status': 'ok', 'mensaje': 'Solicitud rechazada'})


# ---------- INCAPACIDADES ----------
@login_required
@admin_required
def incapacidades_pendientes(request):
    pendientes = Incapacidad.objects.filter(estado='pendiente').select_related('empleado__user')
    data = [
        {
            'id': i.id,
            'empleado': i.empleado.nombre_completo(),
            'fecha_inicio': i.fecha_inicio.isoformat(),
            'fecha_fin': i.fecha_fin.isoformat(),
            'archivo': i.archivo.url if i.archivo else None,
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
        'fecha_inicio': i.fecha_inicio.isoformat(),
        'fecha_fin': i.fecha_fin.isoformat(),
        'archivo': i.archivo.url if i.archivo else None,
        'estado': i.estado,
        'fecha_solicitud': i.fecha_solicitud.isoformat(),
        'decision_por': i.decision_por.username if i.decision_por else None,
        'decision_fecha': i.decision_fecha.isoformat() if i.decision_fecha else None,
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
        'fecha_inicio': i.fecha_inicio.isoformat(),
        'fecha_fin': i.fecha_fin.isoformat(),
        'archivo': i.archivo.url if i.archivo else None,
        'estado': i.estado,
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

    # Notificar al empleado
    contexto = {
        'empleado_nombre': i.empleado.nombre_completo(),
        'tipo_solicitud': 'Incapacidad',
        'fecha_inicio': i.fecha_inicio.strftime('%d/%m/%Y'),
        'fecha_fin': i.fecha_fin.strftime('%d/%m/%Y'),
    }

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
    
    # Notificar al empleado
    contexto = {
        'empleado_nombre': i.empleado.nombre_completo(),
        'tipo_solicitud': 'Incapacidad',
        'fecha_inicio': i.fecha_inicio.strftime('%d/%m/%Y'),
        'fecha_fin': i.fecha_fin.strftime('%d/%m/%Y'),
    }
    
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
    # VERIFICAR SOLICITUDES - USANDO ROL
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

    # Datos opcionales para el certificado (salario, fecha_retiro, etc.)
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

    # Generar PDF (ya existente)
    try:
        pdf_path = generar_certificado_pdf(c)
        c.archivo = pdf_path
        c.save(update_fields=['archivo'])
    except Exception as e:
        print(f"Error al generar PDF para certificado {c.id}: {e}")

    # =====================================================
    # NOTIFICACIÓN AL EMPLEADO
    # =====================================================
    contexto = {
        'empleado_nombre': c.empleado.nombre_completo(),
        'tipo_solicitud': c.get_tipo_display(),
        'fecha_inicio': c.fecha_solicitud.strftime('%d/%m/%Y'),
        'fecha_fin': 'N/A',
    }

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
    
    # =====================================================
    # NOTIFICACIÓN AL EMPLEADO
    # =====================================================
    contexto = {
        'empleado_nombre': c.empleado.nombre_completo(),
        'tipo_solicitud': c.get_tipo_display(),
        'fecha_inicio': c.fecha_solicitud.strftime('%d/%m/%Y'),
        'fecha_fin': 'N/A',
    }

    return JsonResponse({'status': 'ok', 'mensaje': 'Certificado rechazado'})


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