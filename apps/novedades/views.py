import json
from django.http import JsonResponse
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
from .decorators import admin_required
from apps.usuarios.decorators import admin_required as admin_required_html
from apps.usuarios.decorators import empleado_required
import io
from django.http import FileResponse, HttpResponseForbidden, Http404
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

# ============================================================
# VISTAS PARA EMPLEADO (HTML + POST)
# ============================================================

@login_required
@empleado_required
def solicitudes_empleado(request):
    """
    Vista principal del empleado para gestionar sus solicitudes.
    Maneja GET (muestra el formulario y el listado) y POST (crea una nueva solicitud).
    """
    perfil = request.user.perfil

    # --- Obtener listado de solicitudes (siempre necesario) ---
    permisos = Permiso.objects.filter(empleado=perfil).order_by('-fecha_solicitud')
    incapacidades = Incapacidad.objects.filter(empleado=perfil).order_by('-fecha_solicitud')
    certificados = Certificado.objects.filter(empleado=perfil).order_by('-fecha_emision')

    # --- Inicializar formularios con prefijos para evitar colisiones ---
    permiso_form = PermisoCrearForm(prefix='permiso')
    incapacidad_form = IncapacidadCrearForm(prefix='incapacidad')
    certificado_form = CertificadoCrearForm(prefix='certificado')

    # --- Procesar POST (creación de solicitud) ---
    if request.method == 'POST':
        tipo_solicitud = request.POST.get('tipo_solicitud')

        if tipo_solicitud == 'permiso':
            permiso_form = PermisoCrearForm(request.POST, prefix='permiso')
            if permiso_form.is_valid():
                permiso = permiso_form.save(commit=False)
                permiso.empleado = perfil
                permiso.save()
                messages.success(request, '✅ Permiso creado correctamente.')
                return redirect('novedades:solicitudes_empleado')
            # Si es inválido, se renderiza con el formulario con errores

        elif tipo_solicitud == 'incapacidad':
            incapacidad_form = IncapacidadCrearForm(request.POST, request.FILES, prefix='incapacidad')
            if incapacidad_form.is_valid():
                incapacidad = incapacidad_form.save(commit=False)
                incapacidad.empleado = perfil
                incapacidad.save()
                messages.success(request, '✅ Incapacidad creada correctamente.')
                return redirect('novedades:solicitudes_empleado')
            # Si es inválido, se renderiza con el formulario con errores

        elif tipo_solicitud == 'certificado':
            certificado_form = CertificadoCrearForm(request.POST, prefix='certificado')
            if certificado_form.is_valid():
                certificado = certificado_form.save(commit=False)
                certificado.empleado = perfil
                certificado.save()
                messages.success(request, '✅ Certificado creado correctamente.')
                return redirect('novedades:solicitudes_empleado')
            # Si es inválido, se renderiza con el formulario con errores

        elif tipo_solicitud in ('cambio_turno', 'vacaciones'):
            # Se usa el formulario de permiso pero se fuerza el tipo
            permiso_form = PermisoCrearForm(request.POST, prefix='permiso')
            if permiso_form.is_valid():
                permiso = permiso_form.save(commit=False)
                permiso.empleado = perfil
                permiso.tipo = 'cambio_turno' if tipo_solicitud == 'cambio_turno' else 'vacaciones'
                permiso.save()
                messages.success(request, f'✅ Solicitud de {tipo_solicitud.replace("_", " ")} creada correctamente.')
                return redirect('novedades:solicitudes_empleado')
            # Si es inválido, se renderiza con el formulario con errores

        else:
            messages.error(request, '❌ Tipo de solicitud no válido.')
            return redirect('novedades:solicitudes_empleado')

        # --- Si llegamos aquí, el formulario tuvo errores ---
        # Se renderiza el template con los formularios que contienen errores y los datos precargados
        context = {
            'permisos': permisos,
            'incapacidades': incapacidades,
            'certificados': certificados,
            'permiso_form': permiso_form,
            'incapacidad_form': incapacidad_form,
            'certificado_form': certificado_form,
        }
        messages.error(request, '❌ Por favor, corrige los errores en el formulario.')
        return render(request, 'empleado/solicitudes.html', context)

    # --- GET: mostrar formulario y listado ---
    context = {
        'permisos': permisos,
        'incapacidades': incapacidades,
        'certificados': certificados,
        'permiso_form': permiso_form,
        'incapacidad_form': incapacidad_form,
        'certificado_form': certificado_form,
    }
    return render(request, 'empleado/solicitudes.html', context)


# ============================================================
# VISTA PRINCIPAL PARA ADMINISTRADOR (HTML)
# ============================================================

@login_required
@admin_required_html
def novedades_admin(request):
    """Panel de novedades para administradores."""
    return render(request, 'admin/novedades.html')


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
            'fecha_emision': c.fecha_emision.isoformat() if c.fecha_emision else None,  # <-- ARREGLADO
            'proposito': c.proposito,
            'generado_por': c.generado_por.username if c.generado_por else None,
            'descargas': c.descargas,
        }
        for c in qs
    ]
    return JsonResponse(data, safe=False)

# ============================================================
# VISTAS API PARA EMPLEADO (JSON) - Compatibilidad con apps móviles/futuras
# ============================================================

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


@login_required
@empleado_required
def mis_solicitudes(request):
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
            'estado': c['estado'],  # <-- ahora sí es dinámico
            'motivo': c['proposito'],
            'adjunto': None,
            'fecha_creacion': c['fecha_solicitud'].isoformat(),
            'motivo_rechazo': c['motivo_rechazo'],
            'datos_especificos': {
                'tipo_certificado': c['tipo'],
                'dirigido_a': c['dirigido_a'],
                'periodo': c['periodo'],
                'puede_descargar': c['estado'] == 'aprobado',  # <-- el frontend usa esto para mostrar el botón
            }
        })

    resultado.sort(key=lambda x: x['fecha_creacion'], reverse=True)
    return JsonResponse(resultado, safe=False)

    # ---------- CERTIFICADOS: flujo de aprobación ----------

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

    c.estado = 'aprobado'
    c.fecha_emision = timezone.now()
    c.decision_por = request.user
    c.decision_fecha = timezone.now()
    c.generado_por = request.user
    c.save()
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
        return JsonResponse({'error': 'Certificado no encontrado o ya procesado'}, status=404)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    form = RechazoForm(data)
    if not form.is_valid():
        return JsonResponse({'error': 'Motivo requerido', 'detalles': form.errors}, status=400)

    c.estado = 'rechazado'
    c.motivo_rechazo = form.cleaned_data['motivo']
    c.decision_por = request.user
    c.decision_fecha = timezone.now()
    c.save()
    return JsonResponse({'status': 'ok', 'mensaje': 'Certificado rechazado'})

@login_required
def certificado_descargar(request, pk):
    try:
        c = Certificado.objects.select_related('empleado__user').get(pk=pk)
    except Certificado.DoesNotExist:
        raise Http404('Certificado no encontrado')

    # Permiso: solo el dueño del certificado o un admin puede descargarlo
    perfil = getattr(request.user, 'perfil', None)
    es_dueño = perfil is not None and c.empleado_id == perfil.id
    es_admin = request.user.is_staff or request.user.is_superuser  # ajusta si tu lógica de admin es distinta

    if not (es_dueño or es_admin):
        return HttpResponseForbidden('No tienes permiso para descargar este certificado.')

    if c.estado != 'aprobado':
        return JsonResponse({'error': 'El certificado aún no ha sido aprobado.'}, status=400)

    # --- Generar PDF ---
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    p.setFont('Helvetica-Bold', 16)
    p.drawCentredString(width / 2, height - 3 * cm, 'CERTIFICADO')

    p.setFont('Helvetica', 11)
    lineas = [
        f"Tipo: {c.get_tipo_display()}",
        f"Empleado: {c.empleado.nombre_completo()}",
        f"Cargo: {c.empleado.cargo}",
        f"Propósito: {c.proposito}",
        f"Dirigido a: {c.dirigido_a or '-'}",
        f"Período: {c.periodo or '-'}",
        f"Fecha de emisión: {c.fecha_emision.strftime('%d/%m/%Y %H:%M')}",
    ]
    y = height - 5 * cm
    for linea in lineas:
        p.drawString(3 * cm, y, linea)
        y -= 1 * cm

    p.showPage()
    p.save()
    buffer.seek(0)

    c.descargas += 1
    c.save(update_fields=['descargas'])

    filename = f"certificado_{c.id}_{c.empleado.nombre_completo().replace(' ', '_')}.pdf"
    return FileResponse(buffer, as_attachment=True, filename=filename, content_type='application/pdf')