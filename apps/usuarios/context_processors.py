from datetime import date
from apps.tareas.models import Task, EstadoTarea
from apps.novedades.models import Permiso, Incapacidad, Certificado
from apps.memorandos.models import Memorando
from apps.asistencia.models import Asistencia, Horario
from .models import User, PerfilEmpleado

def notificaciones_context(request):
    context = {
        'notif_admin_asistencia': 0,
        'notif_admin_horarios': 0,
        'notif_admin_cuentas': 0,
        'notif_admin_tareas': 0,
        'notif_admin_novedades': 0,
        
        'notif_empleado_asistencia': 0, # Por ahora 0, pero el diseño ya está listo
        'notif_empleado_novedades': 0,
        'notif_empleado_tareas': 0,
        'notif_empleado_memorandos': 0,
    }
    
    if not request.user.is_authenticated:
        return context
        
    if request.user.rol == 'admin':
        hoy = date.today()
        
        # 1. Asistencia: Empleados ausentes o tardanzas hoy
        context['notif_admin_asistencia'] = Asistencia.objects.filter(
            fecha=hoy, estado__in=['AUSENTE', 'TARDE']
        ).count()
        
        # 2. Horarios: Empleados activos que NO tienen un horario asignado
        context['notif_admin_horarios'] = PerfilEmpleado.objects.filter(
            estado='activo', user__estado_cuenta='ACTIVA'
        ).exclude(
            horarios__estado=True
        ).count()
        
        # 3. Cuentas: Usuarios pendientes por primer acceso
        context['notif_admin_cuentas'] = User.objects.filter(estado_cuenta='PENDIENTE').count()
        
        # 4. Tareas: Pendientes o en progreso
        context['notif_admin_tareas'] = Task.objects.filter(
            estado__in=[EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO]
        ).count()
        
        # 5. Novedades: Todas las solicitudes pendientes
        context['notif_admin_novedades'] = (
            Permiso.objects.filter(estado='pendiente').count() +
            Incapacidad.objects.filter(estado='pendiente').count() +
            Certificado.objects.filter(estado='pendiente').count()
        )
        
    elif request.user.rol == 'empleado' and hasattr(request.user, 'perfil'):
        perfil = request.user.perfil
        
        # 1. Tareas asignadas no finalizadas
        context['notif_empleado_tareas'] = Task.objects.filter(
            empleado=perfil
        ).exclude(estado=EstadoTarea.FINALIZADA).count()
        
        # 2. Solicitudes propias pendientes
        context['notif_empleado_novedades'] = (
            Permiso.objects.filter(empleado=perfil, estado='pendiente').count() +
            Incapacidad.objects.filter(empleado=perfil, estado='pendiente').count() +
            Certificado.objects.filter(empleado=perfil, estado='pendiente').count()
        )
        
        # 3. Memorandos emitidos
        context['notif_empleado_memorandos'] = Memorando.objects.filter(
            empleado=perfil, estado='emitido'
        ).count()

    return context