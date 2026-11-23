// ============================================================
// CERTIFICADOS.JS - CONFIGURACIÓN DEL MÓDULO DE CERTIFICADOS
// Panel de administración de novedades - OperPan
// ============================================================

crearModuloNovedad({
    nombre: 'certificados',
    prefijo: 'certificados',           // IDs de modales: certificadosDetalleModal, certificadosAprobarBtn...

    urls: {
        base: '/novedades/certificados/',
        pendientes: '/novedades/certificados/pendientes/',
        lista: '/novedades/certificados/',     // certificados no tiene /historial/: la lista trae todo
    },

    ids: {
        kpiPendientes: 'certificadosKpiPendientes',
        kpiAprobados: 'certificadosKpiAprobadas',
        kpiRechazados: 'certificadosKpiRechazadas',
        pendientes: 'certificadosSolicitudesContainer',
        tbody: 'certificadosTablaBody',
        sinResultados: 'certificadosSinResultados',
        filtroEstado: 'certificadosFiltroEstado',
        filtroExtra: { id: 'certificadosFiltroTipo', campo: 'tipo' },
        buscar: ['buscarCertificado'],
        btnLimpiar: 'certificadosBtnLimpiar',
    },

    textos: {
        vacio: 'No hay certificados pendientes.',
        iconoVacio: 'bi-inbox',
        errorCarga: 'Error al cargar los certificados.',
        errorDetalle: 'Error al cargar el detalle del certificado.',
        aprobado: 'Certificado aprobado correctamente.',
        rechazado: 'Certificado rechazado.',
    },

    // Los KPIs de certificados cuentan por fecha de emisión (si existe)
    fechaKpi: (c) => c.fecha_emision || c.fecha_solicitud,

    // Botón "Descargar PDF" del modal: solo aparece en certificados aprobados
    urlDescarga: (d) => `/novedades/certificados/${d.id}/descargar/`,

    tarjeta: {
        icono: 'bi-flag-fill',
        titulo: (c) => c.tipo || 'Certificado',
        iconoDato: 'bi-calendar3',
        dato: (c) => `Solicitado: ${formatDateTime(c.fecha_solicitud)}`,
        descripcion: (c) => c.proposito || 'Sin propósito especificado.',
    },

    columnas: [
        { label: 'Empleado', tipo: 'fuerte', valor: (c) => c.empleado },
        { label: 'Cargo', valor: (c) => c.cargo },
        { label: 'Tipo de certificado', valor: (c) => c.tipo },
        {
            label: 'Fecha',
            // aprobado -> fecha de emisión; los demás -> fecha de solicitud
            valor: (c) => formatDateTime(
                normalizarEstado(c.estado) === 'aprobado'
                    ? (c.fecha_emision || c.fecha_decision)
                    : c.fecha_solicitud
            ),
        },
        { label: 'Estado', tipo: 'estado' },
    ],

    busqueda: (c) => `${c.empleado || ''} ${c.cargo || ''} ${c.tipo || ''}`,

    campos: (d) => [
        { estado: d.estado },
        { label: 'Empleado', valor: d.empleado },
        { label: 'Tipo', valor: d.tipo },
        { label: 'Solicitado', valor: formatDate(d.fecha_solicitud), icono: 'bi-calendar3' },
{ label: 'Fecha de emisión', valor: d.fecha_emision? formatDate(d.fecha_emision) : '', icono: 'bi-check-circle', opcional: true },
        { bloque: 'Propósito', valor: d.proposito, vacio: 'Sin información adicional.' },
        { label: 'Dirigido a', valor: d.dirigido_a, opcional: true, full: true },
        { label: 'Período', valor: d.periodo, opcional: true, full: true },
        { archivo: d.archivo },
        { rechazo: d.motivo_rechazo },
    ],
});