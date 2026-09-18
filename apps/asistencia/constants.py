"""
Constantes de la app asistencia.

Reglas de negocio para la generación automática de memorandos
por acumulación de tardanzas o ausencias.
"""

# ============================================================
# MEMORANDOS AUTOMÁTICOS POR ASISTENCIA
# ============================================================
# Cantidad de tardanzas en el MISMO MES CALENDARIO que dispara
# la emisión automática de un memorando de llamado de atención.
UMBRAL_TARDANZAS_MEMORANDO = 3

# Cantidad de ausencias en el MISMO MES CALENDARIO que dispara
# la emisión automática de un memorando de llamado de atención.
UMBRAL_AUSENCIAS_MEMORANDO = 3