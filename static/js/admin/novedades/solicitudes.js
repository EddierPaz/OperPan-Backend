// ============================================================
// SOLICITUDES.JS - CONFIGURACIÓN DEL MÓDULO DE SOLICITUDES
// Panel de administración de novedades - OperPan
// ============================================================

crearModuloNovedad({
    nombre: 'solicitudes',
    prefijo: 'solicitudes',            
    urls: {
        base: '/novedades/solicitudes/',
        pendientes: '/novedades/solicitudes/pendientes/',
        lista: '/novedades/solicitudes/historial/',
    },

    ids: {
        kpiPendientes: 'solicitudesKpiPendientes',
        kpiAprobados: 'solicitudesKpiAprobados',
        kpiRechazados: 'solicitudesKpiRechazados',
        pendientes: 'solicitudesNovedadesContainer',
        tbody: 'solicitudesHistorialBody',
        sinResultados: 'solicitudesSinResultados',
        filtroEstado: 'solicitudesFiltroEstado',
        buscar: ['buscarSolicitudes'],
        btnLimpiar: 'solicitudesBtnLimpiar',
    },

    textos: {
        vacio: 'No hay solicitudes pendientes por revisar.',
        iconoVacio: 'bi-inbox',
        errorCarga: 'Error al cargar las solicitudes.',
        errorDetalle: 'Error al cargar el detalle de la solicitud.',
        aprobado: 'Solicitud aprobada correctamente.',
        rechazado: 'Solicitud rechazada.',
    },

    // Tarjeta de la bandeja de pendientes
    tarjeta: {
        icono: 'bi-calendar2-check-fill',
        titulo: (i) => i.tipo || 'Solicitud',
        iconoDato: 'bi-calendar-range',
        dato: (i) => `${formatDate(i.fecha_inicio)} - ${formatDate(i.fecha_fin)}`,
        descripcion: (i) => {
            const texto = (i.justificacion || '').trim();
            if (!texto) return 'Sin justificación especificada.';
            return texto.length > 80 ? texto.substring(0, 80) + '…' : texto;
        },
    },

    // Columnas de la tabla de historial (la de acciones se agrega sola)
    columnas: [
        { label: 'Fecha solicitud', valor: (i) => formatDateTime(i.fecha_solicitud) },
        { label: 'Empleado', tipo: 'fuerte', valor: (i) => i.empleado },
        { label: 'Tipo', valor: (i) => i.tipo },
        { label: 'Fechas', valor: (i) => `${formatDate(i.fecha_inicio)} - ${formatDate(i.fecha_fin)}` },
        { label: 'Estado', tipo: 'estado' },
        { label: 'Aprobado por', valor: (i) => i.decision_por },
    ],

    // Texto sobre el que busca el input de búsqueda
    busqueda: (i) => `${i.empleado || ''} ${i.tipo || ''}`,

    // Campos del modal de detalle
    campos: (d) => [
        { estado: d.estado },
        { label: 'Empleado', valor: d.empleado },
        { label: 'Tipo', valor: d.tipo },
        { label: 'Período', valor: `${formatDate(d.fecha_inicio)} - ${formatDate(d.fecha_fin)}`, icono: 'bi-calendar3', full: true },
        { label: 'Nuevo turno solicitado', valor: d.nuevo_horario, opcional: true, full: true },
        { bloque: 'Justificación', valor: d.justificacion, vacio: 'Sin información adicional.' },
        { label: 'Fecha de solicitud', valor: formatDate(d.fecha_solicitud), icono: 'bi-clock', full: true },
        { archivo: d.archivo },
        { rechazo: d.motivo_rechazo },
    ],
});