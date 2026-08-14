# ============================================================
# pdfs.py - MEMORANDOS OPERPAN
# Plantilla A4 - Estación Paisa
# ============================================================

import os
from datetime import datetime, date
from django.conf import settings

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import stringWidth

# ============================================================
# CONSTANTES Y COLORES
# ============================================================

ROJO = colors.HexColor("#A40706")
ROJO_OSCURO = colors.HexColor("#7F0504")
ROJO_SUAVE = colors.HexColor("#C52A28")

CREMA = colors.HexColor("#FBF8F3")
CREMA_CARD = colors.HexColor("#F8EFE9")

NEGRO = colors.HexColor("#171717")
GRIS = colors.HexColor("#555555")
BLANCO = colors.white

LINEA_COLOR = colors.HexColor("#CFA99A")
CIRCULO_BG_COLOR = colors.HexColor("#D9C6BA")
CARD_BORDER_COLOR = colors.HexColor("#D8B9A9")


# ============================================================
# UTILIDADES DE DATOS Y FECHAS
# ============================================================

def _valor(obj, nombre, default=""):
    """Obtiene un valor de un diccionario u objeto de forma segura."""
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(nombre, default)
    return getattr(obj, nombre, default)


def _primero(obj, *nombres, default=""):
    """Devuelve el primer valor disponible entre varias opciones de atributos/claves."""
    for nombre in nombres:
        valor = _valor(obj, nombre, None)
        if valor not in (None, ""):
            return valor
    return default


def _fecha_es(valor):
    """Convierte una fecha a formato legible en español."""
    if not valor:
        return ""

    meses = {
        1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
        5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
        9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
    }

    if isinstance(valor, datetime):
        f = valor.date()
    elif isinstance(valor, date):
        f = valor
    else:
        try:
            f = datetime.fromisoformat(str(valor).replace("Z", "")).date()
        except Exception:
            return str(valor)

    return f"{f.day:02d} de {meses[f.month]} de {f.year}"


# ============================================================
# GESTIÓN DE RECURSOS (FUENTES Y LOGOS)
# ============================================================

def _registrar_fuente_estacion_paisa():
    """Registra la primera fuente caligráfica disponible en el proyecto."""
    base = settings.BASE_DIR
    fuentes = [
        os.path.join(base, "static", "fonts", "GreatVibes-Regular.ttf"),
        os.path.join(base, "static", "fonts", "AlexBrush-Regular.ttf"),
        os.path.join(base, "static", "fonts", "Allura-Regular.ttf"),
        os.path.join(base, "static", "fonts", "DancingScript-Regular.ttf"),
    ]

    for ruta in fuentes:
        if os.path.exists(ruta):
            try:
                nombre = os.path.splitext(os.path.basename(ruta))[0]
                pdfmetrics.registerFont(TTFont(nombre, ruta))
                return nombre
            except Exception:
                pass
    return "Helvetica-Oblique"


def _buscar_logo(logo_path=None):
    """Busca la ruta válida para el logotipo de la empresa."""
    if logo_path and os.path.exists(logo_path):
        return logo_path

    base = settings.BASE_DIR
    media_root = getattr(settings, "MEDIA_ROOT", "")
    
    candidatos = [
        os.path.join(base, "static", "img", "empresa.png"),
        os.path.join(base, "static", "img", "LOGO EMPRESA.png"),
        os.path.join(base, "static", "img", "logo.png"),
        os.path.join(base, "static", "images", "empresa.png"),
        os.path.join(base, "static", "images", "LOGO EMPRESA.png"),
        os.path.join(base, "static", "images", "logo.png"),
        os.path.join(media_root, "empresa.png"),
        os.path.join(media_root, "LOGO EMPRESA.png"),
        os.path.join(media_root, "logo.png"),
    ]

    return next((p for p in candidatos if p and os.path.exists(p)), None)


# ============================================================
# COMPONENTES GRÁFICOS Y DE DIBUJO
# ============================================================

def _texto_centrado(c, texto, x, y, font, size, color=NEGRO):
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawCentredString(x, y, str(texto))


def _wrap(c, texto, x, y, ancho, font="Helvetica", size=8.3, leading=11):
    texto = str(texto or "").strip()
    if not texto:
        return y

    c.setFont(font, size)
    c.setFillColor(NEGRO)
    linea = ""

    for palabra in texto.split():
        prueba = palabra if not linea else f"{linea} {palabra}"
        if stringWidth(prueba, font, size) <= ancho:
            linea = prueba
        else:
            c.drawString(x, y, linea)
            y -= leading
            linea = palabra

    if linea:
        c.drawString(x, y, linea)
        y -= leading

    return y


def _icono(c, tipo, x, y, size=11):
    c.saveState()
    c.setStrokeColor(ROJO)
    c.setLineWidth(1.1)

    if tipo == "calendario":
        c.rect(x - size/2, y - size/2, size, size, fill=0, stroke=1)
        c.line(x - size/2, y + size*.15, x + size/2, y + size*.15)
        c.line(x - size*.25, y + size/2, x - size*.25, y + size*.70)
        c.line(x + size*.25, y + size/2, x + size*.25, y + size*.70)

    elif tipo == "documento":
        c.rect(x - size*.38, y - size*.5, size*.76, size, fill=0, stroke=1)
        c.line(x - size*.18, y + size*.16, x + size*.22, y + size*.16)
        c.line(x - size*.18, y, x + size*.22, y)
        c.line(x - size*.18, y - size*.16, x + size*.12, y - size*.16)

    elif tipo == "persona":
        c.circle(x, y + size*.20, size*.17, fill=0, stroke=1)
        c.arc(x - size*.35, y - size*.45, x + size*.35, y + size*.08, 0, 180)

    elif tipo == "tipo":
        c.line(x - size*.42, y, x + size*.15, y)
        c.line(x + size*.15, y, x + size*.43, y + size*.23)
        c.line(x + size*.15, y, x + size*.43, y - size*.23)

    c.restoreState()


def _linea(c, x1, y, x2):
    c.setStrokeColor(LINEA_COLOR)
    c.setLineWidth(0.65)
    c.line(x1, y, x2, y)


def _fondo(c, w, h):
    c.setFillColor(CREMA)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.saveState()
    c.setStrokeColor(CIRCULO_BG_COLOR)
    c.setFillColor(CIRCULO_BG_COLOR)
    c.setStrokeAlpha(0.10)
    c.setFillAlpha(0.05)
    
    c.circle(w * 0.50, h * 0.57, 125, fill=0, stroke=1)
    c.circle(w * 0.50, h * 0.57, 110, fill=0, stroke=1)
    c.restoreState()


def _curva_superior(c, w, h):
    c.saveState()
    
    # Curva Roja Principal
    c.setFillColor(ROJO)
    p = c.beginPath()
    p.moveTo(-20, h - 190)
    p.curveTo(w * 0.18, h - 250, w * 0.35, h - 250, w * 0.50, h - 195)
    p.curveTo(w * 0.68, h - 140, w * 0.85, h - 125, w + 20, h - 170)
    p.lineTo(w + 20, h - 205)
    p.curveTo(w * 0.84, h - 170, w * 0.68, h - 175, w * 0.50, h - 225)
    p.curveTo(w * 0.34, h - 270, w * 0.16, h - 268, -20, h - 225)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

    # Franja Oscura
    c.setFillColor(ROJO_OSCURO)
    p = c.beginPath()
    p.moveTo(-20, h - 204)
    p.curveTo(w * 0.18, h - 263, w * 0.35, h - 263, w * 0.50, h - 211)
    p.curveTo(w * 0.68, h - 157, w * 0.85, h - 145, w + 20, h - 188)
    p.lineTo(w + 20, h - 199)
    p.curveTo(w * 0.84, h - 162, w * 0.68, h - 169, w * 0.50, h - 221)
    p.curveTo(w * 0.34, h - 267, w * 0.16, h - 265, -20, h - 219)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    
    c.restoreState()


def _curva_inferior(c, w, h):
    c.saveState()
    c.setFillColor(ROJO)
    
    p = c.beginPath()
    p.moveTo(-20, 0)
    p.lineTo(w + 20, 0)
    p.lineTo(w + 20, 42)
    p.curveTo(w * 0.80, 22, w * 0.64, 25, w * 0.50, 47)
    p.curveTo(w * 0.35, 69, w * 0.18, 70, -20, 45)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

    c.setFillColor(colors.HexColor("#D9C5B4"))
    p = c.beginPath()
    p.moveTo(-20, 45)
    p.curveTo(w * 0.18, 70, w * 0.35, 69, w * 0.50, 47)
    p.curveTo(w * 0.64, 25, w * 0.80, 22, w + 20, 42)
    p.lineTo(w + 20, 49)
    p.curveTo(w * 0.80, 29, w * 0.65, 32, w * 0.50, 55)
    p.curveTo(w * 0.34, 78, w * 0.17, 78, -20, 52)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    
    c.restoreState()


def _marca_agua(c, w, h):
    c.saveState()
    logo_path = _buscar_logo()

    if logo_path and os.path.exists(logo_path):
        try:
            img = ImageReader(logo_path)
            logo_size = 370
            c.setFillAlpha(0.055)
            c.setStrokeAlpha(0.055)
            c.drawImage(
                img, (w - logo_size) / 2, (h - logo_size) / 2 - 25,
                width=logo_size, height=logo_size,
                preserveAspectRatio=True, anchor="c", mask="auto"
            )
            c.restoreState()
            return
        except Exception:
            pass

    # Fallback de marca de agua tipográfica
    c.setFont("Helvetica-Bold", 72)
    c.setFillColor(ROJO)
    c.setFillAlpha(0.055)
    c.translate(w / 2, h / 2)
    c.rotate(-25)
    c.drawCentredString(0, 0, "OPERPAN")
    c.restoreState()


def _logo_firma(c, ruta, x, y, size):
    if ruta and os.path.exists(ruta):
        try:
            c.drawImage(
                ImageReader(ruta), x - size / 2, y - size / 2,
                size, size, preserveAspectRatio=True, mask="auto"
            )
            return
        except Exception:
            pass

    # Fallback gráfico para el sello/logo
    c.saveState()
    c.setStrokeColor(ROJO)
    c.setLineWidth(1.5)
    c.circle(x, y, size * 0.40, fill=0, stroke=1)
    c.circle(x, y, size * 0.32, fill=0, stroke=1)

    _texto_centrado(c, "ESTACIÓN PAISA", x, y + size * 0.12, "Helvetica-Bold", max(5.5, size * 0.07), ROJO)
    _texto_centrado(c, "OPERPAN", x, y - size * 0.03, "Helvetica-Bold", max(7, size * 0.10), ROJO)
    _texto_centrado(c, "CALIDAD • SABOR", x, y - size * 0.16, "Helvetica", max(4.5, size * 0.05), ROJO)
    c.restoreState()


# ============================================================
# FUNCIÓN PRINCIPAL DE GENERACIÓN
# ============================================================

def generar_memorando_pdf(memorando=None, output_path=None, logo_path=None, **kwargs):
    # --- AJUSTE DE EXTRACCIÓN DE DATOS ---
    
    # Intentamos obtener el empleado y el cargo de forma segura
    empleado_obj = getattr(memorando, 'empleado', None)
    
    # Obtener cargo: intenta del objeto, luego del kwarg
    if memorando and empleado_obj and hasattr(empleado_obj, 'cargo'):
        # Si usas un campo 'choices', get_cargo_display() es lo correcto
        cargo = empleado_obj.get_cargo_display() if hasattr(empleado_obj, 'get_cargo_display') else empleado_obj.cargo
    else:
        cargo = kwargs.get("cargo", "—")

    empleado = _primero(memorando, "empleado", "empleado_nombre", default=kwargs.get("empleado", "—"))
    # Si 'empleado' sigue siendo el objeto, extraemos el nombre
    if hasattr(empleado, 'nombre_completo'):
        empleado = empleado.nombre_completo()
    elif hasattr(empleado, 'nombre'):
        empleado = empleado.nombre

    tipo = _primero(memorando, "tipo", "tipo_memorando", default=kwargs.get("tipo", "MEMORANDO"))
    asunto = _primero(memorando, "asunto", "descripcion", default=kwargs.get("asunto", ""))
    contenido = _primero(memorando, "contenido", "cuerpo", default=kwargs.get("contenido", ""))
    consecutivo = _primero(memorando, "consecutivo", "codigo", default=kwargs.get("consecutivo", "MEM-2026-000"))
    fecha = _primero(memorando, "fecha", "fecha_emision", default=kwargs.get("fecha", datetime.now()))

    # Manejo de rutas y directorios
    media_root = getattr(settings, "MEDIA_ROOT", os.path.join(os.getcwd(), "media"))
    if not output_path:
        output_path = kwargs.get("ruta")

    if not output_path:
        dir_memorandos = os.path.join(media_root, "memorandos")
        os.makedirs(dir_memorandos, exist_ok=True)
        absolute_output_path = os.path.join(dir_memorandos, f"{consecutivo}.pdf")
    else:
        absolute_output_path = os.path.abspath(output_path)
        directorio = os.path.dirname(absolute_output_path)
        if directorio:
            os.makedirs(directorio, exist_ok=True)

    # Configuración inicial del lienzo
    w, h = A4
    c = canvas.Canvas(absolute_output_path, pagesize=A4)
    c.setTitle(f"OperPan - {consecutivo}")

    # 1. Capas base
    _fondo(c, w, h)
    _marca_agua(c, w, h)

    # 2. Encabezado principal
    fuente_estacion = _registrar_fuente_estacion_paisa()
    _texto_centrado(c, "Estación Paisa", w / 2, h - 78, fuente_estacion, 39, ROJO_OSCURO)

    # Línea decorativa con rombos
    linea_y = h - 101
    c.setStrokeColor(ROJO)
    c.setLineWidth(1.2)
    c.line(w / 2 - 105, linea_y, w / 2 - 12, linea_y)
    c.line(w / 2 + 12, linea_y, w / 2 + 105, linea_y)

    rombo = 5
    for offset_x in (-111, 111):
        p = c.beginPath()
        p.moveTo(w / 2 + offset_x, linea_y + rombo)
        p.lineTo(w / 2 + offset_x + rombo, linea_y)
        p.lineTo(w / 2 + offset_x, linea_y - rombo)
        p.lineTo(w / 2 + offset_x - rombo, linea_y)
        p.close()
        c.drawPath(p, fill=1, stroke=0)

    _texto_centrado(c, "MEMORANDO", w / 2, h - 132, "Helvetica", 17, ROJO_OSCURO)
    
    c.setFillColor(ROJO)
    c.circle(w / 2, h - 151, 2.2, fill=1, stroke=0)

    # 3. Curva superior
    _curva_superior(c, w, h)

    # 4. Sección de Fecha y Consecutivo
    y = h - 300
    margen = 48
    mitad = w / 2

    # Fecha
    _icono(c, "calendario", margen + 7, y + 5, 11)
    c.setFillColor(ROJO)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(margen + 20, y + 9, "FECHA:")
    c.setFillColor(NEGRO)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margen + 20, y - 2, _fecha_es(fecha))

    # Consecutivo
    _icono(c, "documento", mitad + 15, y + 5, 11)
    c.setFillColor(ROJO)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(mitad + 28, y + 9, "CONSECUTIVO:")
    c.setFillColor(NEGRO)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(mitad + 28, y - 2, str(consecutivo))

    _linea(c, margen, y - 11, mitad - 8)
    _linea(c, mitad + 8, y - 11, w - margen)

    # 5. Tarjeta Para / Tipo
    card_x, card_y, card_w, card_h = 44, h - 380, w - 88, 66
    c.setFillColor(CREMA_CARD)
    c.setStrokeColor(CARD_BORDER_COLOR)
    c.setLineWidth(0.8)
    c.roundRect(card_x, card_y, card_w, card_h, 8, fill=1, stroke=1)

    c.line(w / 2, card_y + 10, w / 2, card_y + card_h - 10)

    # Empleado (Para)
    _icono(c, "persona", card_x + 25, card_y + 33, 17)
    c.setFillColor(ROJO)
    c.setFont("Helvetica-Bold", 7.8)
    c.drawString(card_x + 48, card_y + 47, "PARA:")
    c.setFillColor(NEGRO)
    c.setFont("Helvetica-Bold", 10.8)
    c.drawString(card_x + 48, card_y + 32, str(empleado))

    c.setFillColor(ROJO)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(card_x + 48, card_y + 16, "CARGO:")
    c.setFillColor(NEGRO)
    c.setFont("Helvetica", 8.8)
    c.drawString(card_x + 81, card_y + 16, str(cargo))

    # Tipo de Memorando
    _icono(c, "tipo", mitad + 24, card_y + 33, 17)
    c.setFillColor(ROJO)
    c.setFont("Helvetica-Bold", 7.8)
    c.drawString(mitad + 48, card_y + 47, "TIPO:")
    c.setFillColor(NEGRO)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(mitad + 48, card_y + 30, str(tipo).upper())

    # 6. Asunto
    y_asunto = card_y - 43
    _icono(c, "documento", 56, y_asunto + 4, 15)
    c.setFillColor(ROJO)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(78, y_asunto + 10, "ASUNTO:")
    
    y_texto = _wrap(c, asunto, 78, y_asunto - 2, w - 120, size=9.2, leading=12)
    _linea(c, 45, y_texto + 1, w - 45)

    # 7. Contenido
    y_cont = y_texto - 30
    _icono(c, "documento", 56, y_cont + 3, 15)
    c.setFillColor(ROJO)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(78, y_cont + 10, "CONTENIDO:")
    
    y_fin = _wrap(c, contenido, 78, y_cont - 6, w - 120, size=9, leading=12)
    _linea(c, 45, max(145, y_fin - 5), w - 45)

    # 8. Firma y Sello
    y_firma = max(60, max(145, y_fin - 5) - 162)
    c.setFillColor(NEGRO)
    c.setFont("Helvetica-Oblique", 21)
    c.drawCentredString(w * 0.32, y_firma + 27, "________________")
    
    c.setStrokeColor(ROJO)
    c.setLineWidth(0.8)
    c.line(w * 0.16, y_firma + 22, w * 0.48, y_firma + 22)

    _texto_centrado(c, "FIRMA Y SELLO", w * 0.32, y_firma + 8, "Helvetica-Bold", 8.5)
    _logo_firma(c, _buscar_logo(logo_path), w * 0.72, y_firma + 8, 92)

    # 9. Pie de página y cierre
    _curva_inferior(c, w, h)
    
    c.setFillColor(BLANCO)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(45, 24, "OPERPAN - ESTACIÓN PAISA")
    
    c.setFont("Helvetica", 6.3)
    c.drawRightString(w - 45, 24, "Comprometidos con el talento, enfocados en el crecimiento.")
    
    c.setFillColor(GRIS)
    c.setFont("Helvetica", 5.5)
    c.drawCentredString(w / 2, 8, f"Documento generado por OperPan - {consecutivo}")

    c.showPage()
    c.save()

    try:
        rel_path = os.path.relpath(absolute_output_path, media_root)
        return rel_path.replace("\\", "/")
    except ValueError:
        return absolute_output_path


# ============================================================
# ALIAS COMPATIBLES
# ============================================================

def crear_memorando_pdf(*args, **kwargs):
    return generar_memorando_pdf(*args, **kwargs)

def generar_pdf_memorando(*args, **kwargs):
    return generar_memorando_pdf(*args, **kwargs)