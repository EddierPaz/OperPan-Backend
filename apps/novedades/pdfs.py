# ============================================================
# pdfs.py - CERTIFICADOS OPERPAN
# Formato carta formal (estilo certificación laboral clásica)
# ============================================================

import os
from datetime import datetime, date
from django.conf import settings

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth

ROJO = colors.HexColor("#A40706")
ROJO_OSCURO = colors.HexColor("#7F0504")
NEGRO = colors.HexColor("#1A1A1A")
GRIS = colors.HexColor("#555555")


# ============================================================
# UTILIDADES
# ============================================================

def _valor(obj, nombre, default=""):
    if obj is None:
        return default
    return getattr(obj, nombre, default) if not isinstance(obj, dict) else obj.get(nombre, default)


def _fecha_es(valor, con_dia_texto=False):
    if not valor:
        return ""
    meses = {
        1: "enero", 2: "febrero", 3: "marzo", 4: "abril", 5: "mayo", 6: "junio",
        7: "julio", 8: "agosto", 9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre",
    }
    if isinstance(valor, datetime):
        f = valor.date()
    elif isinstance(valor, date):
        f = valor
    else:
        return str(valor)
    return f"{f.day} de {meses[f.month]} de {f.year}"


def _dia_en_letras(dia):
    """Convierte un día del mes (1-31) a su forma escrita en español."""
    unidades = {
        1: "uno", 2: "dos", 3: "tres", 4: "cuatro", 5: "cinco",
        6: "seis", 7: "siete", 8: "ocho", 9: "nueve", 10: "diez",
        11: "once", 12: "doce", 13: "trece", 14: "catorce", 15: "quince",
        16: "dieciséis", 17: "diecisiete", 18: "dieciocho", 19: "diecinueve",
        20: "veinte",
    }
    if dia in unidades:
        return unidades[dia]
    if dia == 21:
        return "veintiuno"
    if 22 <= dia <= 29:
        return f"veinti{unidades[dia - 20]}"
    if dia == 30:
        return "treinta"
    if dia == 31:
        return "treinta y uno"
    return str(dia)


def _numero_certificado(certificado, fecha):
    anio = fecha.year if hasattr(fecha, "year") else datetime.now().year
    pk = getattr(certificado, "id", None) or getattr(certificado, "pk", 0)
    return f"CERT-{anio}-{pk:04d}"


def _buscar_logo():
    base = settings.BASE_DIR
    candidatos = [
        os.path.join(base, "static", "img", "empresa.png"),
        os.path.join(base, "static", "img", "LOGO EMPRESA.png"),
        os.path.join(base, "static", "img", "logo.png"),
    ]
    return next((p for p in candidatos if os.path.exists(p)), None)


def _wrap_justificado(c, texto, x, y, ancho, font="Helvetica", size=10.5, leading=16.5, negritas=None):
    """
    Dibuja texto envuelto. `negritas` es una lista de substrings que deben
    imprimirse en Helvetica-Bold dentro del párrafo (nombres, fechas, cargos, etc).
    """
    negritas = negritas or []

    # Se reemplazan las frases en negrita por marcadores para separarlas al tokenizar
    marcador = "\x01"
    texto_marcado = texto
    for n in negritas:
        texto_marcado = texto_marcado.replace(n, f"{marcador}{n}{marcador}")

    partes = texto_marcado.split(marcador)
    tokens = []
    for parte in partes:
        if not parte:
            continue
        bold = parte in negritas
        for palabra in parte.split():
            tokens.append((palabra, bold))

    linea_actual = []
    ancho_linea = 0
    cur_y = y

    def flush_linea():
        nonlocal linea_actual, ancho_linea, cur_y
        cx = x
        for palabra, bold in linea_actual:
            f = "Helvetica-Bold" if bold else font
            c.setFont(f, size)
            c.setFillColor(NEGRO)
            c.drawString(cx, cur_y, palabra)
            cx += stringWidth(palabra + " ", f, size)
        cur_y -= leading
        linea_actual = []
        ancho_linea = 0

    for palabra, bold in tokens:
        f = "Helvetica-Bold" if bold else font
        w = stringWidth(palabra + " ", f, size)
        if ancho_linea + w > ancho and linea_actual:
            flush_linea()
        linea_actual.append((palabra, bold))
        ancho_linea += w

    if linea_actual:
        flush_linea()

    return cur_y


# ============================================================
# TEXTOS POR TIPO DE CERTIFICADO
# ============================================================

def _construir_parrafo(certificado, empleado):
    tipo = certificado.tipo
    nombre = empleado.nombre_completo().upper()
    doc = f"{empleado.get_tipo_documento_display()} No. {empleado.numero_documento}"
    cargo = empleado.get_cargo_display() if empleado.cargo else "—"
    ingreso = _fecha_es(empleado.fecha_ingreso) if empleado.fecha_ingreso else "—"

    activo = empleado.estado == 'activo'
    if activo:
        periodo_txt = f"desde el {ingreso} hasta la fecha"
    else:
        salida = _fecha_es(certificado.fecha_retiro) if certificado.fecha_retiro else "la fecha de su retiro"
        periodo_txt = f"desde el {ingreso} hasta el {salida}"

    negritas = [nombre, doc, cargo, ingreso]

    if tipo == 'laboral':
        texto = (
            f"El señor(a) {nombre}, identificado(a) con {doc}, "
            f"{'presta' if activo else 'prestó'} sus servicios a nuestra compañía "
            f"{periodo_txt}, desempeñando el cargo de {cargo}."
        )

    elif tipo == 'ingresos':
        salario_txt = f"${certificado.salario:,.0f}".replace(",", ".") if certificado.salario else "—"
        negritas.append(salario_txt)
        texto = (
            f"El señor(a) {nombre}, identificado(a) con {doc}, "
            f"{'presta' if activo else 'prestó'} sus servicios a nuestra compañía "
            f"{periodo_txt}, desempeñando el cargo de {cargo}, "
            f"con un ingreso mensual de {salario_txt}."
        )

    elif tipo == 'antiguedad':
        if empleado.fecha_ingreso:
            hoy = certificado.fecha_retiro or date.today()
            dias = (hoy - empleado.fecha_ingreso).days
            anios = dias // 365
            meses = (dias % 365) // 30
            tiempo_txt = f"{anios} año(s) y {meses} mes(es)" if anios else f"{meses} mes(es)"
        else:
            tiempo_txt = "—"
        negritas.append(tiempo_txt)
        texto = (
            f"El señor(a) {nombre}, identificado(a) con {doc}, "
            f"{'presta' if activo else 'prestó'} sus servicios a nuestra compañía "
            f"{periodo_txt}, desempeñando el cargo de {cargo}, "
            f"con una antigüedad de {tiempo_txt} en la empresa."
        )

    else:
        texto = certificado.proposito

    return texto, negritas


# ============================================================
# FUNCIÓN PRINCIPAL
# ============================================================

def generar_certificado_pdf(certificado, output_path=None):
    empleado = certificado.empleado
    fecha = certificado.fecha_emision or datetime.now()
    numero = _numero_certificado(certificado, fecha)

    media_root = getattr(settings, "MEDIA_ROOT", os.path.join(os.getcwd(), "media"))
    if not output_path:
        dir_certificados = os.path.join(media_root, "certificados")
        os.makedirs(dir_certificados, exist_ok=True)
        output_path = os.path.join(dir_certificados, f"{numero}.pdf")
    else:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    w, h = letter
    c = canvas.Canvas(output_path, pagesize=letter)
    c.setTitle(f"OperPan - {numero}")

    margen = 2.5 * cm
    ancho_util = w - 2 * margen

    # ------------------------------------------------------------
    # Marco exterior
    # ------------------------------------------------------------
    c.setStrokeColor(colors.HexColor("#888888"))
    c.setLineWidth(1.2)
    c.rect(1.2 * cm, 1.2 * cm, w - 2.4 * cm, h - 2.4 * cm, fill=0, stroke=1)

    # ------------------------------------------------------------
    # Encabezado
    # ------------------------------------------------------------
    y = h - 3 * cm
    logo = _buscar_logo()
    if logo:
        try:
            c.drawImage(ImageReader(logo), margen, y - 20, width=55, height=55,
                        preserveAspectRatio=True, mask="auto")
        except Exception:
            pass

    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(ROJO_OSCURO)
    c.drawString(margen + 65, y, "ESTACIÓN PAISA")
    c.setFont("Helvetica", 8)
    c.setFillColor(GRIS)
    c.drawString(margen + 65, y - 14, "Panadería y Pastelería")

    c.setFont("Helvetica", 7.5)
    c.setFillColor(GRIS)
    c.drawRightString(w - margen, y, "NIT. 900.XXX.XXX-X")
    c.drawRightString(w - margen, y - 11, "Bogotá D.C., Colombia")

    c.setStrokeColor(ROJO)
    c.setLineWidth(1.5)
    c.line(margen, y - 32, w - margen, y - 32)

    # ------------------------------------------------------------
    # Título
    # ------------------------------------------------------------
    y -= 75
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(NEGRO)
    c.drawCentredString(w / 2, y, "EL DEPARTAMENTO DE GESTIÓN HUMANA")
    c.drawCentredString(w / 2, y - 15, "DE ESTACIÓN PAISA")

    y -= 55
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(ROJO_OSCURO)
    c.drawCentredString(w / 2, y, "C E R T I F I C A   Q U E")

    # ------------------------------------------------------------
    # Cuerpo / párrafo principal
    # ------------------------------------------------------------
    y -= 55
    texto, negritas = _construir_parrafo(certificado, empleado)
    y = _wrap_justificado(c, texto, margen, y, ancho_util, size=11, leading=17, negritas=negritas)

    # Propósito / dirigido a (si aplica)
    if certificado.proposito:
        y -= 20
        y = _wrap_justificado(
            c,
            f"La presente certificación se expide para {certificado.proposito}.",
            margen, y, ancho_util, size=11, leading=17
        )

    if certificado.dirigido_a:
        y -= 20
        c.setFont("Helvetica-Bold", 10.5)
        c.setFillColor(NEGRO)
        c.drawString(margen, y, f"Dirigido a: {certificado.dirigido_a}")

    # ------------------------------------------------------------
    # Fecha de expedición
    # ------------------------------------------------------------
    y -= 45
    dia = fecha.day
    meses = {
        1: "enero", 2: "febrero", 3: "marzo", 4: "abril", 5: "mayo", 6: "junio",
        7: "julio", 8: "agosto", 9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre",
    }
    texto_fecha = (
        f"Se expide la presente certificación a solicitud del interesado a los "
        f"({dia}) {_dia_en_letras(dia)} días del mes de {meses[fecha.month]} de {fecha.year}."
    )
    y = _wrap_justificado(c, texto_fecha, margen, y, ancho_util, size=10.5, leading=16)

    # ------------------------------------------------------------
    # Firma
    # ------------------------------------------------------------
    y -= 70
    c.setStrokeColor(NEGRO)
    c.setLineWidth(0.8)
    c.line(margen, y, margen + 220, y)

    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(NEGRO)
    c.drawString(margen, y - 14, "GESTIÓN HUMANA")
    c.setFont("Helvetica", 9.5)
    c.drawString(margen, y - 27, "Estación Paisa")

    # ------------------------------------------------------------
    # Pie
    # ------------------------------------------------------------
    c.setFont("Helvetica", 6.5)
    c.setFillColor(GRIS)
    c.drawCentredString(w / 2, 1.6 * cm, f"Documento generado por OperPan · {numero}")

    c.showPage()
    c.save()

    try:
        return os.path.relpath(output_path, media_root).replace("\\", "/")
    except ValueError:
        return output_path


def crear_certificado_pdf(*args, **kwargs):
    return generar_certificado_pdf(*args, **kwargs)