// ============================================================
// INCAPACIDADES.JS - CONFIGURACIÓN DEL MÓDULO DE INCAPACIDADES
// Panel de administración de novedades - OperPan
// ============================================================

crearModuloNovedad({
    nombre: 'incapacidades',
    prefijo: 'incapacidades',        

    urls: {
        base: '/novedades/incapacidades/',
        pendientes: '/novedades/incapacidades/pendientes/',
        lista: '/novedades/incapacidades/historial/',
    },

    ids: {
        kpiPendientes: 'incapacidadesKpiPendientes',
        kpiAprobados: 'incapacidadesKpiAprobadas',
        kpiRechazados: 'incapacidadesKpiRechazadas',
        pendientes: 'incapacidadesListaContainer',
        tbody: 'incapacidadesHistorialBody',
        sinResultados: 'incapacidadesSinResultados',
        filtroEstado: 'incapacidadesFiltroEstado',
        buscar: ['buscarIncapacidad', 'incapacidadesBuscarEmpleado'],
        btnLimpiar: 'incapacidadesBtnLimpiar',
    },

    textos: {
        vacio: 'No hay incapacidades pendientes por revisar.',
        iconoVacio: 'bi-clipboard2-check',
        errorCarga: 'Error al cargar las incapacidades.',
        errorDetalle: 'Error al cargar el detalle de la incapacidad.',
        aprobado: 'Incapacidad aprobada correctamente.',
        rechazado: 'Incapacidad rechazada.',
    },

    tarjeta: {
        icono: 'bi-clipboard2-pulse',
        titulo: () => 'Incapacidad Médica',
        iconoDato: 'bi-calendar-range',
        dato: (i) => `${formatDate(i.fecha_inicio)} - ${formatDate(i.fecha_fin)}`,
        // sin descripcion: el modelo de Incapacidad ya no tiene texto libre
    },

    columnas: [
        { label: 'Fecha solicitud', valor: (i) => formatDateTime(i.fecha_solicitud) },
        { label: 'Empleado', tipo: 'fuerte', valor: (i) => i.empleado },
        { label: 'Período', valor: (i) => `${formatDate(i.fecha_inicio)} - ${formatDate(i.fecha_fin)}` },
        { label: 'Estado', tipo: 'estado' },
        { label: 'Aprobado por', valor: (i) => i.decision_por },
    ],

    busqueda: (i) => i.empleado || '',

    campos: (d) => [
        { estado: d.estado },
        { label: 'Empleado', valor: d.empleado },
        { label: 'Período', valor: `${formatDate(d.fecha_inicio)} - ${formatDate(d.fecha_fin)}`, icono: 'bi-calendar3', full: true },
        { label: 'Fecha de solicitud', valor: formatDate(d.fecha_solicitud), icono: 'bi-clock', full: true },
        { archivo: d.archivo },
        { rechazo: d.motivo_rechazo },
    ],
});