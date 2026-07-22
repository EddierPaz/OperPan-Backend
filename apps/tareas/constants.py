from datetime import time
from .models import Turno


# Cargo -> área operativa sugerida (Task.area). El admin la puede cambiar igual.
CARGO_AREA_MAP = {
    'mesero': 'MOSTRADOR',
    'cajero': 'CAJA',
    'pastelero': 'REPOSTERIA',
    'panadero': 'PRODUCCION',
    'cocina': 'PRODUCCION',
    'buñuelero': 'PRODUCCION',
    'greca': 'MOSTRADOR',
}

OTRA_VALUE = 'OTRA'

# Catálogo de tareas predefinidas por cargo, con prioridad automática
TAREAS_POR_CARGO = {
    'mesero': [
        {'value': 'atender_mesas', 'label': 'Atender mesas', 'prioridad': 'ALTA'},
        {'value': 'tomar_pedidos', 'label': 'Tomar pedidos', 'prioridad': 'ALTA'},
        {'value': 'limpiar_mesas', 'label': 'Limpiar mesas', 'prioridad': 'BAJA'},
        {'value': 'llevar_platos', 'label': 'Llevar platos a cocina', 'prioridad': 'MEDIA'},
        {'value': 'verificar_satisfaccion', 'label': 'Verificar satisfacción del cliente', 'prioridad': 'MEDIA'},
    ],
    'cajero': [
        {'value': 'cuadre_caja', 'label': 'Cuadre de caja', 'prioridad': 'ALTA'},
        {'value': 'atender_caja', 'label': 'Atender cliente en caja', 'prioridad': 'MEDIA'},
        {'value': 'registrar_ventas', 'label': 'Registrar ventas', 'prioridad': 'MEDIA'},
        {'value': 'empacar_pedidos', 'label': 'Empacar pedidos', 'prioridad': 'BAJA'},
        {'value': 'reportar_faltantes', 'label': 'Reportar faltantes/sobrantes', 'prioridad': 'ALTA'},
    ],
    'pastelero': [
        {'value': 'preparar_tortas', 'label': 'Preparar tortas', 'prioridad': 'ALTA'},
        {'value': 'decorar_postres', 'label': 'Decorar postres', 'prioridad': 'MEDIA'},
        {'value': 'preparar_rellenos', 'label': 'Preparar rellenos', 'prioridad': 'MEDIA'},
        {'value': 'limpiar_reposteria', 'label': 'Limpiar área de repostería', 'prioridad': 'BAJA'},
        {'value': 'inventario_insumos', 'label': 'Controlar inventario de insumos', 'prioridad': 'MEDIA'},
    ],
    'panadero': [
        {'value': 'hornear_pan', 'label': 'Hornear pan del día', 'prioridad': 'ALTA'},
        {'value': 'amasar', 'label': 'Amasar y preparar masa', 'prioridad': 'ALTA'},
        {'value': 'formar_panes', 'label': 'Formar y pesar panes', 'prioridad': 'MEDIA'},
        {'value': 'limpiar_horno', 'label': 'Limpiar horno y utensilios', 'prioridad': 'BAJA'},
        {'value': 'controlar_horneado', 'label': 'Controlar tiempos de horneado', 'prioridad': 'MEDIA'},
    ],
    'cocina': [
        {'value': 'preparar_alimentos', 'label': 'Preparar alimentos del menú', 'prioridad': 'ALTA'},
        {'value': 'organizar_cocina', 'label': 'Organizar y limpiar cocina', 'prioridad': 'BAJA'},
        {'value': 'inventario_cocina', 'label': 'Controlar inventario de cocina', 'prioridad': 'MEDIA'},
        {'value': 'verificar_vencimientos', 'label': 'Verificar fechas de vencimiento', 'prioridad': 'MEDIA'},
        {'value': 'lavar_utensilios', 'label': 'Lavar utensilios y platos', 'prioridad': 'BAJA'},
    ],
    'buñuelero': [
        {'value': 'preparar_masa_buñuelos', 'label': 'Preparar masa de buñuelos', 'prioridad': 'ALTA'},
        {'value': 'freir_buñuelos', 'label': 'Freír buñuelos', 'prioridad': 'ALTA'},
        {'value': 'controlar_temperatura_aceite', 'label': 'Controlar temperatura de aceite', 'prioridad': 'MEDIA'},
        {'value': 'empacar_buñuelos', 'label': 'Empacar buñuelos', 'prioridad': 'BAJA'},
        {'value': 'limpiar_fritura', 'label': 'Limpiar área de fritura', 'prioridad': 'BAJA'},
    ],
    'greca': [
        {'value': 'preparar_cafe', 'label': 'Preparar café del día', 'prioridad': 'ALTA'},
        {'value': 'mantener_greca', 'label': 'Mantener greca limpia', 'prioridad': 'MEDIA'},
        {'value': 'controlar_insumos_greca', 'label': 'Controlar insumos (café, azúcar, leche)', 'prioridad': 'MEDIA'},
        {'value': 'servir_bebidas', 'label': 'Servir bebidas calientes', 'prioridad': 'ALTA'},
        {'value': 'revisar_greca', 'label': 'Revisar funcionamiento de la greca', 'prioridad': 'BAJA'},
    ],
}