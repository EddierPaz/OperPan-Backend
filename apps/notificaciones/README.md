# 📧 Sistema de Notificaciones — OperPan

## Propósito

La aplicación `notificaciones` centraliza el envío de correos electrónmicos a empleados y administradores de OperPan, utilizando la **API de Gmail** (actualmente en modo simulación). Su objetivo es informar automáticamente sobre eventos importantes del sistema, manteniendo la operación principal desacoplada del servicio de correo.

---

## Estructura de la aplicación

```
apps/notificaciones/
├── management/commands/        # Comandos programados (recordatorios)
│   ├── send_task_overdue_notifications.py
│   ├── send_reminder_pending_requests.py
│   ├── send_rest_reminders.py
│   └── send_missing_attendance.py
├── templates/emails/           # Plantillas HTML para cada tipo de correo
│   ├── base_email.html
│   ├── tarea_*.html
│   ├── solicitud_*.html
│   ├── memorando_*.html
│   ├── horario_*.html
│   └── descanso_recordatorio.html
├── services.py                 # Lógica de envío (Gmail API / simulación)
├── utils.py                    # Funciones auxiliares (logo base64, envío unificado)
└── __init__.py
```

---

## Cómo funciona

1. **Integración en vistas existentes**  
   Cada vez que se crea, edita o elimina una entidad (tarea, solicitud, memorando, horario), se llama a la función `enviar_notificacion()` desde el `views.py` correspondiente. Esta función construye el correo usando la plantilla adecuada y lo envía al destinatario (empleado o administrador).

2. **Modo simulación (por defecto)**  
   Mientras no se configuren las credenciales OAuth de Gmail, los correos **no se envían realmente**; solo se registran en los logs (consola) con el prefijo `[SIMULACIÓN]`. Esto permite probar toda la lógica sin depender de Gmail.

3. **Comandos programados**  
   Los recordatorios automáticos (tareas vencidas, solicitudes pendientes, descansos) se ejecutan mediante comandos de Django que deben ser programados con **cron** (o Programador de tareas en Windows). Cada comando revisa las condiciones y envía las notificaciones correspondientes.

4. **Configuración futura con Gmail API**  
   Cuando se tengan las credenciales OAuth de la cuenta `operpangestion@gmail.com`, se modificará `services.py` para usar la API real. El resto del código (vistas y comandos) no cambiará.

---

## ¿Qué eventos generan notificaciones?

| Módulo | Evento | Destinatario |
|--------|--------|--------------|
| **Tareas** | Creación, edición, cambio de estado (admin → empleado), eliminación | Empleado |
| | Cambio de estado (empleado → admin), tarea vencida | Administrador |
| **Solicitudes** (Permisos, Incapacidades, Certificados) | Creación, edición | Administrador |
| | Aprobación, rechazo (con motivo) | Empleado |
| **Memorandos** | Creación | Empleado |
| **Asistencia** | Asignación, edición de horario | Empleado |
| | Recordatorio de descanso (7 días y 1 día antes) | Empleado y Administrador |
| | Falta de registro de asistencia | Empleado y Administrador |

---

## Comandos programados (recordatorios)

| Comando | Frecuencia sugerida | Descripción |
|---------|---------------------|-------------|
| `send_task_overdue_notifications` | Diaria (7:00 AM) | Notifica tareas vencidas a empleados y administradores. |
| `send_reminder_pending_requests` | Diaria (9:00 AM) | Recuerda solicitudes pendientes por más de 7 días a empleados y administradores. |
| `send_rest_reminders` | Diaria (8:00 AM) | Envía recordatorios de descanso (7 días y 1 día antes) a empleados y administradores. |
| `send_missing_attendance` | Diaria (6:00 PM) | Alerta sobre empleados sin registro de asistencia en el día. |

**Ejecución manual:**  
```bash
python manage.py send_task_overdue_notifications
```

---

## Pruebas

Para verificar que el sistema funciona, puedes ejecutar el shell de Django y simular un envío:

```python
from apps.notificaciones.utils import enviar_notificacion

contexto = {
    'empleado_nombre': 'Juan Pérez',
    'titulo': 'Tarea de prueba',
    'descripcion': 'Descripción de ejemplo',
    'fecha_limite': '25/08/2026',
    'prioridad': 'Alta'
}
enviar_notificacion(
    destinatario='tu-correo@ejemplo.com',
    asunto='📋 Prueba de notificación',
    template_name='emails/tarea_asignada.html',
    contexto=contexto
)
```

Deberías ver en la consola los logs de simulación, confirmando que la lógica está correcta.

---

## Próximos pasos (integración con Gmail API real)

1. Crear un proyecto en Google Cloud Console.
2. Habilitar la API de Gmail.
3. Generar credenciales OAuth 2.0 (tipo "Aplicación web").
4. Obtener un refresh token manualmente (desde un entorno de desarrollo).
5. Almacenar las credenciales en el archivo `.env`:

   ```env
   GMAIL_CLIENT_ID=...
   GMAIL_CLIENT_SECRET=...
   GMAIL_REFRESH_TOKEN=...
   ```

6. Modificar `services.py` para utilizar las credenciales reales (reemplazar la simulación).

---

## Mantenimiento

- **Agregar nuevas notificaciones:**  
  Crear una plantilla HTML en `templates/emails/`, llamar a `enviar_notificacion()` desde la vista correspondiente con el contexto adecuado.

- **Modificar contenido de correos:**  
  Editar las plantillas HTML; los cambios se reflejan inmediatamente.

- **Actualizar credenciales:**  
  Si se revoca el token, repetir el proceso de autorización para obtener un nuevo refresh token.

---

## Nota importante

El sistema está diseñado para **no depender de Gmail**. Si la API falla, la operación principal de OperPan continúa; solo se registra el error en los logs. Esto asegura que el sistema sea robusto.

---

**¡Listo para usar!**  
Cualquier duda o mejora, contacta con el equipo de desarrollo.