from datetime import date, timedelta
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from .models import Horario, DescansoEmpleado, Asistencia
from django.utils import timezone
from apps.usuarios.models import PerfilEmpleado


def _contexto_base():

    hoy = date.today()

    proximos_dias = []

    for _ in range(hoy.weekday()):
        proximos_dias.append(None)

    for i in range(15):

        fecha = hoy + timedelta(days=i)

        proximos_dias.append({
            "fecha": fecha,
            "numero": fecha.day,
            "weekday": fecha.weekday(),
        })

    horarios = (
        Horario.objects
        .select_related("empleado")
        .prefetch_related("descansos")
        .order_by("-id")
    )

    turnos_hoy = {
        "MANANA": [],
        "TARDE": [],
        "FIJO": []
    }

    presentes = 0
    tardanzas = 0
    ausentes = 0

    for horario in horarios:

        asistencia = Asistencia.objects.filter(
            horario=horario,
            fecha=hoy
        ).first()

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
        "programados": horarios.count(),
        "presentes": presentes,
        "tardanzas": tardanzas,
        "ausentes": ausentes
    }

    return {

        "empleados": PerfilEmpleado.objects.all(),

        "horarios": horarios,

        "proximos_dias": proximos_dias,

        "dias_semana": [
            "Lun",
            "Mar",
            "Mié",
            "Jue",
            "Vie",
            "Sáb",
            "Dom"
        ],

        "fecha_hoy": hoy,

        "turnos_hoy": turnos_hoy,

        "resumen_asistencia": resumen_asistencia,
    }

    return {
        "empleados": PerfilEmpleado.objects.all(),
        "horarios": Horario.objects.select_related("empleado").order_by("-id"),
        "proximos_dias": proximos_dias,
        "dias_semana": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    }


def horarios(request):

    if request.method == "POST":

        empleado_id    = request.POST.get("empleado")
        turno          = request.POST.get("turno")
        hora_entrada   = request.POST.get("hora_entrada")
        hora_salida    = request.POST.get("hora_salida")
        fecha_descanso = request.POST.get("fecha_descanso")

        empleado = PerfilEmpleado.objects.get(id=empleado_id)

        horario = Horario.objects.create(
            empleado=empleado,
            turno=turno,
            hora_entrada=hora_entrada,
            hora_salida=hora_salida,
            estado=True,
        )

        for i in range(15):
            fecha = date.today() + timedelta(days=i)
            DescansoEmpleado.objects.create(
                horario=horario,
                fecha=fecha,
                es_descanso=(str(fecha) == fecha_descanso),
            )

        return redirect("asistencia:horarios")

    return render(request, "admin/asistencia.html", _contexto_base())


def horario_json(request, id):
    """Devuelve los datos de un horario en JSON — lo usa el JS para llenar los modales"""

    horario = get_object_or_404(
        Horario.objects.select_related("empleado").prefetch_related("descansos"),
        id=id
    )
    descanso = horario.descansos.filter(es_descanso=True).first()

    return JsonResponse({
        "empleado":       horario.empleado.nombre_completo(),
        "cargo":          horario.empleado.get_cargo_display(),
        "turno":          horario.get_turno_display(),
        "turno_valor":    horario.turno,
        "hora_entrada":   horario.hora_entrada.strftime("%H:%M"),
        "hora_salida":    horario.hora_salida.strftime("%H:%M"),
        "estado":         horario.estado,
        "descanso":       descanso.fecha.strftime("%d/%m/%Y") if descanso else None,
        "descanso_fecha": descanso.fecha.strftime("%Y-%m-%d") if descanso else None,
    })


def editar_horario(request, id):

    horario = get_object_or_404(Horario, id=id)

    if request.method == "POST":

        horario.turno        = request.POST.get("turno")
        horario.hora_entrada = request.POST.get("hora_entrada")
        horario.hora_salida  = request.POST.get("hora_salida")
        horario.save()

        fecha_descanso = request.POST.get("fecha_descanso")

        if fecha_descanso:
            # Borra el ciclo anterior y lo recrea con el nuevo día de descanso
            horario.descansos.all().delete()
            for i in range(15):
                fecha = date.today() + timedelta(days=i)
                DescansoEmpleado.objects.create(
                    horario=horario,
                    fecha=fecha,
                    es_descanso=(str(fecha) == fecha_descanso),
                )

        return redirect("asistencia:horarios")

    return redirect("asistencia:horarios")


def eliminar_horario(request, id):

    horario = get_object_or_404(Horario, id=id)
    horario.delete()
    return redirect("asistencia:horarios")


def asistencia_empleado(request):

    perfil = request.user.perfil

    horario = (
        Horario.objects
        .filter(
            empleado=perfil,
            estado=True
        )
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

        proximo_descanso = (
            horario.descansos
            .filter(es_descanso=True)
            .order_by("fecha")
            .first()
        )

        descansos = set(
            horario.descansos
            .filter(es_descanso=True)
            .values_list("fecha", flat=True)
        )

        hoy = date.today()

        for _ in range(hoy.weekday()):
            calendario.append(None)

        for i in range(15):

            fecha = hoy + timedelta(days=i)

            calendario.append({
                "numero": fecha.day,
                "fecha": fecha,
                "es_descanso": fecha in descansos,
            })

        asistencias = (
            Asistencia.objects
            .filter(horario=horario)
            .order_by("-fecha")
        )

        dias_asistencia = asistencias.count()

        retardos = asistencias.filter(
            estado="TARDE"
        ).count()

        dias_sin_asistencia = max(
            0,
            30 - dias_asistencia
        )

    return render(
        request,
        "empleado/asistencia.html",
        {
            "horario": horario,
            "proximo_descanso": proximo_descanso,
            "calendario": calendario,
            "asistencias": asistencias,
            "dias_asistencia": dias_asistencia,
            "dias_sin_asistencia": dias_sin_asistencia,
            "retardos": retardos,
        }
    )

def registrar_asistencia(request):

    if request.method == "POST":

        horario_id = request.POST.get("horario_id")

        horario = get_object_or_404(
            Horario,
            id=horario_id
        )

        asistencia_existente = Asistencia.objects.filter(
            horario=horario,
            fecha=timezone.localdate()
        ).first()

        if asistencia_existente:
            return redirect("asistencia:horarios")

        hora_actual = timezone.localtime().time()

        estado = (
            "PRESENTE"
            if hora_actual <= horario.hora_entrada
            else "TARDE"
        )

        Asistencia.objects.create(
            horario=horario,
            fecha=timezone.localdate(),
            estado=estado,
            hora_marcada=hora_actual
        )

    return redirect("asistencia:horarios")