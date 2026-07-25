import json

from django.contrib.auth.decorators import login_required
from django.http import FileResponse, HttpResponseForbidden, Http404, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from apps.usuarios.decorators import admin_required_json as admin_required
from apps.usuarios.decorators import empleado_required
from .models import Memorando
from .forms import MemorandoForm, MemorandoFiltroForm
from .pdfs import generar_pdf_memorando
from apps.usuarios.models import PerfilEmpleado


# ============================================================
# VISTAS PARA MEMORANDOS (ADMIN)
# ============================================================

@csrf_exempt
@login_required
@admin_required
def memorando_crear(request):
    """Crea un nuevo memorando, genera el PDF y lo almacena."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    form = MemorandoForm(data)
    if not form.is_valid():
        return JsonResponse({
            'error': 'Datos inválidos',
            'detalles': form.errors
        }, status=400)

    memorando = form.save(commit=False)
    memorando.generado_por = request.user
    memorando.save()  # genera el consecutivo automáticamente

    try:
        pdf_path = generar_pdf_memorando(memorando)
        memorando.archivo_pdf = pdf_path
        memorando.save(update_fields=['archivo_pdf'])
    except Exception as e:
        print(f"Error al generar PDF para memorando {memorando.id}: {e}")

    return JsonResponse({
        'status': 'ok',
        'mensaje': 'Memorando generado correctamente',
        'id': memorando.id,
        'consecutivo': memorando.consecutivo,
        'archivo_pdf': memorando.archivo_pdf.url if memorando.archivo_pdf else None,
    })


@login_required
@admin_required
def memorandos_lista(request):
    """Lista todos los memorandos con filtros opcionales (API JSON)."""
    qs = Memorando.objects.all().select_related('empleado', 'generado_por').order_by('-fecha_emision')
    form = MemorandoFiltroForm(request.GET)
    if form.is_valid():
        data = form.cleaned_data
        if data.get('empleado'):
            qs = qs.filter(empleado=data['empleado'])
        if data.get('tipo'):
            qs = qs.filter(tipo=data['tipo'])
        if data.get('desde'):
            qs = qs.filter(fecha_emision__date__gte=data['desde'])
        if data.get('hasta'):
            qs = qs.filter(fecha_emision__date__lte=data['hasta'])
    data = [
        {
            'id': m.id,
            'consecutivo': m.consecutivo,
            'empleado': m.empleado.nombre_completo(),
            'empleado_id': m.empleado.id,
            'tipo': m.get_tipo_display(),
            'tipo_raw': m.tipo,
            'asunto': m.asunto,
            'contenido': m.contenido,
            'fecha_emision': m.fecha_emision.isoformat(),
            'estado': m.get_estado_display(),
            'generado_por': m.generado_por.username if m.generado_por else None,
            'archivo_pdf': m.archivo_pdf.url if m.archivo_pdf else None,
            'descargas': m.descargas,
        }
        for m in qs
    ]
    return JsonResponse(data, safe=False)


@login_required
@admin_required
def memorandos_empleados_lista(request):
    """Lista de empleados para el dropdown (API JSON)."""
    empleados = PerfilEmpleado.objects.filter(estado='activo').order_by('primer_nombre', 'primer_apellido')
    data = [
        {
            'id': e.id,
            'nombre_completo': e.nombre_completo(),
            'cargo': e.cargo,
        }
        for e in empleados
    ]
    return JsonResponse(data, safe=False)


@login_required
@empleado_required
def memorandos_empleado(request):
    """Vista del empleado para ver sus propios memorandos."""
    return render(request, 'empleado/memorandos/memorandos.html')


@login_required
@empleado_required
def mis_memorandos_api(request):
    """API para que el empleado obtenga sus propios memorandos (JSON)."""
    perfil = request.user.perfil
    memorandos = Memorando.objects.filter(
        empleado=perfil,
        estado='emitido'
    ).select_related('generado_por').order_by('-fecha_emision')
    data = [
        {
            'id': m.id,
            'consecutivo': m.consecutivo,
            'tipo': m.get_tipo_display(),
            'asunto': m.asunto,
            'contenido': m.contenido,
            'fecha_emision': m.fecha_emision.isoformat(),
            'generado_por': m.generado_por.username if m.generado_por else None,
            'archivo_pdf': m.archivo_pdf.url if m.archivo_pdf else None,
            'descargas': m.descargas,
        }
        for m in memorandos
    ]
    return JsonResponse(data, safe=False)


@login_required
def memorando_descargar(request, pk):
    """Descarga el PDF de un memorando (admin o empleado dueño)."""
    try:
        memorando = Memorando.objects.select_related('empleado', 'generado_por').get(pk=pk)
    except Memorando.DoesNotExist:
        raise Http404('Memorando no encontrado')

    perfil = getattr(request.user, 'perfil', None)
    es_dueño = perfil is not None and memorando.empleado_id == perfil.id
    es_admin = request.user.is_staff or request.user.is_superuser

    if not (es_dueño or es_admin):
        return HttpResponseForbidden('No tienes permiso para descargar este memorando.')

    if not memorando.archivo_pdf:
        return JsonResponse({'error': 'El memorando no tiene archivo PDF asociado.'}, status=404)

    memorando.descargas += 1
    memorando.save(update_fields=['descargas'])

    response = FileResponse(memorando.archivo_pdf.open('rb'), as_attachment=True)
    response['Content-Disposition'] = f'attachment; filename="{memorando.consecutivo}.pdf"'
    return response