# apps/notificaciones/utils.py
import base64
import os
import logging
from django.conf import settings
from .services import GmailService

logger = logging.getLogger(__name__)

def get_logo_base64():
    """Retorna el logo en base64 para incrustar en correos."""
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'img', 'LOGO EMPRESA.png')
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    logger.warning("Logo no encontrado en la ruta: %s", logo_path)
    return None

def enviar_notificacion(destinatario, asunto, template_name, contexto, attachments=None):
    """
    Función unificada para enviar una notificación por correo.
    - destinatario: string con el email.
    - asunto: string.
    - template_name: ruta de la plantilla (ej: 'emails/tarea_asignada.html').
    - contexto: dict con datos para la plantilla.
    - attachments: lista de archivos (opcional).
    """
    if not destinatario:
        logger.warning("Intento de enviar correo sin destinatario. Se omite.")
        return

    # Añadir el logo al contexto para todas las plantillas
    contexto['logo_base64'] = get_logo_base64()
    contexto['year'] = settings.TIME_ZONE  # o puedes usar datetime.now().year

    service = GmailService()
    service.send_email(
        to=destinatario,
        subject=asunto,
        template_name=template_name,
        context=contexto,
        attachments=attachments
    )

def obtener_correo_admin():
    """Retorna una lista con los correos de los administradores activos."""
    from apps.usuarios.models import User
    admin_users = User.objects.filter(rol='admin', is_active=True)
    correos = [user.perfil.correo for user in admin_users if user.perfil.correo]
    return correos