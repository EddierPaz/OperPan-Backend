from django.shortcuts import render

def asistencia(request):
    return render(request, "empleado/asistencia.html")

def asistenciaAdmin(request):
    return render(request, "admin/asistencia.html")


