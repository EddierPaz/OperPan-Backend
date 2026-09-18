"""
Utilidades de la app `usuarios`.

Contiene helpers compartidos por las vistas de login y gestión de usuarios.
"""

import base64
import logging
import os

from django.conf import settings

logger = logging.getLogger(__name__)


def get_logo_base64():
    """
    Retorna el logo de OperPan codificado en base64 para incrustar en
    los correos HTML.

    Si el logo no existe en disco, devuelve None y los templates se
    encargan de mostrar un fallback.
    """
    logo_path = os.path.join(
        settings.BASE_DIR, 'static', 'img', 'LOGO EMPRESA.png'
    )

    if os.path.exists(logo_path):
        try:
            with open(logo_path, 'rb') as f:
                return base64.b64encode(f.read()).decode('utf-8')
        except Exception as e:
            logger.error("Error leyendo logo en %s: %s", logo_path, e)
            return None

    logger.warning("Logo no encontrado en: %s", logo_path)
    return None