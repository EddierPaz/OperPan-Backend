import os
from datetime import datetime
from textwrap import wrap

from django.conf import settings
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas


def generar_pdf_memorando(memorando):
    """
    Genera un PDF profesional para el memorando usando ReportLab.
    Retorna la ruta relativa del archivo guardado en media/.
    """
    media_dir = os.path.join(settings.MEDIA_ROOT, 'memorandos')
    os.makedirs(media_dir, exist_ok=True)

    filename = f"{memorando.consecutivo}.pdf"
    filepath = os.path.join(media_dir, filename)

    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter

    # Logo (intentar cargar)
    logo_path = None
    possible_paths = [
        os.path.join(settings.STATIC_ROOT, 'img', 'LOGO EMPRESA.png'),
        os.path.join(settings.BASE_DIR, 'static', 'img', 'LOGO EMPRESA.png'),
        os.path.join(settings.MEDIA_ROOT, 'logo.png'),
    ]
    for path in possible_paths:
        if os.path.exists(path):
            logo_path = path
            break

    if logo_path:
        try:
            c.drawImage(logo_path, 2 * cm, height - 2.8 * cm, width=3 * cm, height=1.5 * cm, preserveAspectRatio=True)
        except Exception:
            pass

    # Encabezado
    c.setFont('Helvetica-Bold', 18)
    c.drawCentredString(width / 2, height - 2.2 * cm, 'OPERPAN - ESTACIÓN PAISA')
    c.setFont('Helvetica-Bold', 14)
    c.drawCentredString(width / 2, height - 2.8 * cm, 'MEMORANDO')
    c.line(2 * cm, height - 3.3 * cm, width - 2 * cm, height - 3.3 * cm)

    # Datos del documento
    c.setFont('Helvetica', 10)
    y = height - 3.9 * cm
    fecha_str = datetime.now().strftime('%d de %B de %Y')
    c.drawString(2 * cm, y, f'Fecha: {fecha_str}')
    y -= 0.6 * cm
    c.drawString(2 * cm, y, f'Consecutivo: {memorando.consecutivo}')
    y -= 1.2 * cm

    # Datos del empleado
    c.setFont('Helvetica-Bold', 11)
    c.drawString(2 * cm, y, 'PARA:')
    y -= 0.6 * cm
    c.setFont('Helvetica', 11)
    c.drawString(2 * cm, y, f'{memorando.empleado.nombre_completo()}')
    y -= 0.5 * cm
    c.drawString(2 * cm, y, f'Cargo: {memorando.empleado.cargo}')
    y -= 0.5 * cm

    # Tipo y asunto
    c.setFont('Helvetica-Bold', 11)
    c.drawString(2 * cm, y, 'Tipo:')
    y -= 0.6 * cm
    c.setFont('Helvetica', 11)
    c.drawString(2 * cm, y, f'{memorando.get_tipo_display()}')
    y -= 0.8 * cm

    c.setFont('Helvetica-Bold', 11)
    c.drawString(2 * cm, y, 'ASUNTO:')
    y -= 0.6 * cm
    c.setFont('Helvetica', 11)
    c.drawString(2 * cm, y, f'{memorando.asunto}')
    y -= 1.2 * cm

    # Contenido
    c.setFont('Helvetica-Bold', 11)
    c.drawString(2 * cm, y, 'CONTENIDO:')
    y -= 0.8 * cm

    c.setFont('Helvetica', 11)
    lines = memorando.contenido.split('\n')
    for line in lines:
        if y < 4 * cm:
            c.showPage()
            c.setFont('Helvetica', 11)
            y = height - 2 * cm
        wrapped_lines = wrap(line, 90)
        for wrapped in wrapped_lines:
            c.drawString(2 * cm, y, wrapped)
            y -= 0.6 * cm
        y -= 0.2 * cm

    # Firma
    y -= 1.5 * cm
    if y < 3 * cm:
        c.showPage()
        y = height - 2 * cm

    c.setFont('Helvetica-Bold', 11)
    c.drawString(2 * cm, y, 'FIRMA Y SELLO')
    y -= 0.8 * cm
    c.setFont('Helvetica', 10)
    c.drawString(2 * cm, y, '_____________________________')
    y -= 0.4 * cm
    nombre_admin = memorando.generado_por.get_full_name() if memorando.generado_por else 'Administrador'
    c.drawString(2 * cm, y, nombre_admin)
    y -= 0.4 * cm
    c.drawString(2 * cm, y, datetime.now().strftime('%d/%m/%Y'))

    # Pie de página
    c.setFont('Helvetica', 8)
    c.drawCentredString(width / 2, 1.5 * cm, f'Documento generado por OperPan - {memorando.consecutivo}')

    c.save()
    return f'memorandos/{filename}'