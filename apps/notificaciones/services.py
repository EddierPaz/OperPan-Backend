# apps/notificaciones/services.py
import logging
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

class GmailService:
    """
    Servicio para enviar correos usando Gmail API.
    Por ahora solo simula el envío (logs).
    Más adelante se integrará con la API real.
    """

    def __init__(self):
        self.sender = settings.DEFAULT_FROM_EMAIL

    def send_email(self, to, subject, template_name, context, attachments=None):
        """
        Envía un correo HTML.
        - to: destinatario (string)
        - subject: asunto
        - template_name: ruta de la plantilla (ej: 'emails/tarea_asignada.html')
        - context: diccionario con variables para la plantilla
        - attachments: lista de archivos (por ahora no se usa)
        """
        # Renderizar el HTML
        html_body = render_to_string(template_name, context)
        plain_text = strip_tags(html_body)  # versión texto plano (fallback)

        # Por ahora solo logueamos (simulación)
        logger.info(f"📧 [SIMULACIÓN] Enviando correo a: {to}")
        logger.info(f"Asunto: {subject}")
        logger.info(f"Contenido HTML (primeros 200 caracteres): {html_body[:200]}...")
        logger.info("=" * 50)

        # En el futuro aquí irá el envío real con Gmail API
        # self._send_via_gmail_api(to, subject, html_body, plain_text, attachments)