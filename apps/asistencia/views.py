from django.shortcuts import render, redirect
from .models import Horario, Asistencia
from apps.usuarios.models import PerfilEmpleado


def horarios(request):

    if request.method == "POST":

        empleado_id = request.POST.get("empleado")
        turno = request.POST.get("turno")
        hora_entrada = request.POST.get("hora_entrada")
        hora_salida = request.POST.get("hora_salida")

        dias = request.POST.get(
            "dias_laborales",
            ""
        )

        dias_laborales = [
            dia.strip()
            for dia in dias.split(",")
            if dia.strip()
        ]

        empleado = PerfilEmpleado.objects.get(
            id=empleado_id
        )

        Horario.objects.create(
            empleado=empleado,
            turno=turno,
            hora_entrada=hora_entrada,
            hora_salida=hora_salida,
            dias_laborales=dias_laborales,
            estado=True
        )

        return redirect('asistencia:horarios')

    context = {
        "empleados": PerfilEmpleado.objects.all(),
        "horarios": Horario.objects.select_related(
            "empleado"
        ).all().order_by("-id")
    }

    return render(
        request,
        "admin/asistencia.html",
        context
    )

from datetime import date, timedelta

def descansos(request):

    empleados = PerfilEmpleado.objects.all()

    proximos_dias = []

    for i in range(15):
        proximos_dias.append(
            date.today() + timedelta(days=i)
        )

    context = {
        "empleados": empleados,
        "proximos_dias": proximos_dias
    }

    return render(
        request,
        "admin/asistencia.html",
        context
    )