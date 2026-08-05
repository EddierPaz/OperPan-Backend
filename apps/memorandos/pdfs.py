import os
from datetime import datetime
from textwrap import wrap

from django.conf import settings
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib import colors


def generar_pdf_memorando(memorando):
    """
    Genera un PDF profesional con diseño centrado tipo certificado para el memorando.
    Retorna la ruta relativa del archivo guardado en media/.
    """
    media_dir = os.path.join(settings.MEDIA_ROOT, 'memorandos')
    os.makedirs(media_dir, exist_ok=True)

    filename = f"{memorando.consecutivo}.pdf"
    filepath = os.path.join(media_dir, filename)

    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter

    # ============================================================
    # 0. CONFIGURACIÓN DE FECHA EN ESPAÑOL (sin depender del sistema)
    # ============================================================
    meses = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
        5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
        9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    }

    ahora = datetime.now()
    fecha_formateada = f"{ahora.day:02d} de {meses[ahora.month]} de {ahora.year}"
    # Resultado: "05 de Agosto de 2026"

    # ============================================================
    # 1. CONFIGURACIÓN DE COLORES Y ESTILOS
    # ============================================================
    color_rojo = colors.HexColor('#A40706')
    color_gris = colors.HexColor('#2D2D2D')

    # ============================================================
    # 2. MARCO DECORATIVO (BORDE PROFESIONAL)
    # ============================================================
    margin = 0.75 * cm
    c.setStrokeColor(color_rojo)
    c.setLineWidth(2)
    c.rect(margin, margin, width - 2 * margin, height - 2 * margin)
    
    # Segundo borde interno (más delgado)
    c.setStrokeColor(colors.HexColor('#CCCCCC'))
    c.setLineWidth(1)
    c.rect(margin + 0.3 * cm, margin + 0.3 * cm, 
           width - 2 * margin - 0.6 * cm, 
           height - 2 * margin - 0.6 * cm)

    # ============================================================
    # 3. LOGO (centrado en la parte superior)
    # ============================================================
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
            logo_width = 3.5 * cm
            logo_height = 1.8 * cm
            c.drawImage(logo_path, 
                       (width - logo_width) / 2, 
                       height - 3.2 * cm, 
                       width=logo_width, 
                       height=logo_height, 
                       preserveAspectRatio=True)
        except Exception:
            pass

    # ============================================================
    # 4. ENCABEZADO PRINCIPAL (CENTRADO)
    # ============================================================
    y_pos = height - 3.8 * cm if logo_path else height - 2.5 * cm
    
    # Título "OPERPAN"
    c.setFont('Helvetica-Bold', 22)
    c.setFillColor(color_rojo)
    c.drawCentredString(width / 2, y_pos, 'OPERPAN')
    
    # Línea decorativa debajo del título
    y_pos -= 0.2 * cm
    c.setStrokeColor(color_rojo)
    c.setLineWidth(1.5)
    c.line(4 * cm, y_pos, width - 4 * cm, y_pos)
    
    # Subtítulo "ESTACIÓN PAISA"
    y_pos -= 0.6 * cm
    c.setFont('Helvetica', 14)
    c.setFillColor(color_gris)
    c.drawCentredString(width / 2, y_pos, 'ESTACIÓN PAISA')
    
    # Línea decorativa fina
    y_pos -= 0.2 * cm
    c.setStrokeColor(colors.HexColor('#CCCCCC'))
    c.setLineWidth(0.5)
    c.line(5 * cm, y_pos, width - 5 * cm, y_pos)

    # ============================================================
    # 5. TÍTULO DEL DOCUMENTO "MEMORANDO" (CENTRADO)
    # ============================================================
    y_pos -= 1.2 * cm
    c.setFont('Helvetica-Bold', 26)
    c.setFillColor(color_rojo)
    c.drawCentredString(width / 2, y_pos, 'MEMORANDO')
    
    # Línea decorativa doble
    y_pos -= 0.3 * cm
    c.setStrokeColor(color_rojo)
    c.setLineWidth(1)
    c.line(3 * cm, y_pos, width - 3 * cm, y_pos)
    
    y_pos -= 0.2 * cm
    c.setStrokeColor(colors.HexColor('#CCCCCC'))
    c.setLineWidth(0.5)
    c.line(4 * cm, y_pos, width - 4 * cm, y_pos)

    # ============================================================
    # 6. DATOS DEL DOCUMENTO (FECHA Y CONSECUTIVO - CENTRADOS)
    # ============================================================
    y_pos -= 1.2 * cm
    c.setFont('Helvetica', 10)
    c.setFillColor(color_gris)
    c.drawCentredString(width / 2, y_pos, f'Fecha: {fecha_formateada}')  # ← FECHA EN ESPAÑOL
    
    y_pos -= 0.5 * cm
    c.drawCentredString(width / 2, y_pos, f'Consecutivo: {memorando.consecutivo}')

    # ============================================================
    # 7. DESTINATARIO (CENTRADO)
    # ============================================================
    y_pos -= 1.2 * cm
    c.setFont('Helvetica-Bold', 12)
    c.setFillColor(color_rojo)
    c.drawCentredString(width / 2, y_pos, 'PARA:')
    
    y_pos -= 0.6 * cm
    c.setFont('Helvetica', 14)
    c.setFillColor(color_gris)
    c.drawCentredString(width / 2, y_pos, f'{memorando.empleado.nombre_completo()}')
    
    y_pos -= 0.5 * cm
    c.setFont('Helvetica', 11)
    c.setFillColor(color_gris)
    c.drawCentredString(width / 2, y_pos, f'Cargo: {memorando.empleado.get_cargo_display()}')

    # ============================================================
    # 8. TIPO DE MEMORANDO Y ASUNTO (CENTRADOS)
    # ============================================================
    y_pos -= 1 * cm
    c.setFont('Helvetica-Bold', 11)
    c.setFillColor(color_rojo)
    c.drawCentredString(width / 2, y_pos, f'TIPO: {memorando.get_tipo_display()}')
    
    y_pos -= 0.8 * cm
    c.setFont('Helvetica-Bold', 11)
    c.setFillColor(color_rojo)
    c.drawCentredString(width / 2, y_pos, 'ASUNTO:')
    
    y_pos -= 0.6 * cm
    c.setFont('Helvetica', 12)
    c.setFillColor(color_gris)
    c.drawCentredString(width / 2, y_pos, f'{memorando.asunto}')

    # ============================================================
    # 9. CONTENIDO (JUSTIFICADO Y CENTRADO)
    # ============================================================
    y_pos -= 1.2 * cm
    c.setFont('Helvetica-Bold', 11)
    c.setFillColor(color_rojo)
    c.drawCentredString(width / 2, y_pos, 'CONTENIDO:')
    
    y_pos -= 0.8 * cm
    c.setFont('Helvetica', 11)
    c.setFillColor(color_gris)
    
    # Procesar el contenido con justificación
    contenido = memorando.contenido
    line_width = 80
    wrapped_lines = []
    
    parrafos = contenido.split('\n')
    for parrafo in parrafos:
        if parrafo.strip():
            words = parrafo.split()
            current_line = ""
            for word in words:
                if len(current_line) + len(word) + 1 <= line_width:
                    current_line += word + " "
                else:
                    wrapped_lines.append(current_line.strip())
                    current_line = word + " "
            if current_line:
                wrapped_lines.append(current_line.strip())
        else:
            wrapped_lines.append("")
    
    for line in wrapped_lines:
        if y_pos < 4 * cm:
            c.showPage()
            y_pos = height - 2 * cm
        if line.strip():
            c.drawCentredString(width / 2, y_pos, line)
        y_pos -= 0.6 * cm
        if not line.strip():
            y_pos -= 0.2 * cm

    # ============================================================
    # 10. FIRMA Y SELLO (CENTRADO CON ESPACIO)
    # ============================================================
    y_pos -= 2 * cm
    if y_pos < 3 * cm:
        c.showPage()
        y_pos = height - 2 * cm

    c.setStrokeColor(color_gris)
    c.setLineWidth(1)
    firma_x = (width - 8 * cm) / 2
    c.line(firma_x, y_pos, firma_x + 8 * cm, y_pos)
    
    y_pos -= 0.4 * cm
    c.setFont('Helvetica-Bold', 11)
    c.setFillColor(color_rojo)
    c.drawCentredString(width / 2, y_pos, 'FIRMA Y SELLO')
    
    y_pos -= 0.6 * cm
    c.setFont('Helvetica', 10)
    c.setFillColor(color_gris)
    nombre_admin = memorando.generado_por.get_full_name() if memorando.generado_por else 'Administrador'
    c.drawCentredString(width / 2, y_pos, nombre_admin)
    
    y_pos -= 0.4 * cm
    c.setFont('Helvetica', 10)
    c.setFillColor(color_gris)
    c.drawCentredString(width / 2, y_pos, fecha_formateada)  # ← FECHA EN ESPAÑOL

    # ============================================================
    # 11. PIE DE PÁGINA (CON CÓDIGO DE DOCUMENTO)
    # ============================================================
    c.setFont('Helvetica', 8)
    c.setFillColor(colors.HexColor('#999999'))
    pie_texto = f'Documento generado por OperPan - {memorando.consecutivo}'
    c.drawCentredString(width / 2, 1.2 * cm, pie_texto)
    
    c.setStrokeColor(colors.HexColor('#CCCCCC'))
    c.setLineWidth(0.5)
    c.line(3 * cm, 1.6 * cm, width - 3 * cm, 1.6 * cm)

    c.save()
    return f'memorandos/{filename}'