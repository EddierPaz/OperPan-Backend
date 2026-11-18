// ============================================================
// SOLICITUDES.JS - MÓDULO DE SOLICITUDES
// Panel de administración de novedades - OperPan
// ============================================================

(function () {
    let currentSolicitudId = null;

    window.updateSolicitudesKPIs = function() {
        fetch('/novedades/solicitudes/historial/?estado=pendiente')
            .then(r => r.json())
            .then(data => {
                const pendingEl = document.getElementById('solicitudesKpiPendientes');
                if (pendingEl) pendingEl.innerText = Array.isArray(data) ? data.length : 0;
            })
            .catch(() => console.error('Error al obtener KPIs de solicitudes'));

        fetch('/novedades/solicitudes/historial/')
            .then(r => r.json())
            .then(data => {
                const now = new Date();
                const mes = now.getMonth();
                const año = now.getFullYear();
                const aprobados = Array.isArray(data) ? data.filter(p => {
                    const estado = (p.estado || '').toLowerCase();
                    const fecha = p.fecha_solicitud ? new Date(p.fecha_solicitud) : new Date();
                    return estado === 'aprobado' && fecha.getMonth() === mes && fecha.getFullYear() === año;
                }).length : 0;
                const rechazados = Array.isArray(data) ? data.filter(p => {
                    const estado = (p.estado || '').toLowerCase();
                    const fecha = p.fecha_solicitud ? new Date(p.fecha_solicitud) : new Date();
                    return estado === 'rechazado' && fecha.getMonth() === mes && fecha.getFullYear() === año;
                }).length : 0;
                
                const aprobadosEl = document.getElementById('solicitudesKpiAprobados');
                const rechazadosEl = document.getElementById('solicitudesKpiRechazados');
                if (aprobadosEl) aprobadosEl.innerText = aprobados;
                if (rechazadosEl) rechazadosEl.innerText = rechazados;
            })
            .catch(() => console.error('Error al obtener KPIs de solicitudes'));
    };

    window.renderSolicitudesPendientes = function() {
        const container = document.getElementById('solicitudesNovedadesContainer');
        if (!container) return;

        fetch('/novedades/solicitudes/pendientes/')
            .then(r => r.json())
            .then(data => {
                const pendientes = Array.isArray(data) ? data : [];

                if (!pendientes.length) {
                    container.innerHTML = `
                        <div class="solicitudes-vacio text-center text-muted py-3">
                            <i class="bi bi-inbox fs-2 mb-2 d-block"></i>
                            No hay solicitudes pendientes por revisar.
                        </div>
                    `;
                    return;
                }
                
                container.innerHTML = `
                    <div class="solicitudes-grid">
                        ${pendientes.map(p => `
                            <div class="solicitud-card">
                                <div class="solicitud-header">
                                    <div class="solicitud-titulo">
                                        <i class="bi bi-calendar2-check-fill"></i>
                                        <span>${p.tipo || 'Solicitud'}</span>
                                    </div>
                                </div>
                                <div class="solicitud-empleado">
                                    <i class="bi bi-person me-1"></i>
                                    <strong>${p.empleado || 'Empleado no disponible'}</strong>
                                </div>
                                <div class="solicitud-dato">
                                    <i class="bi bi-calendar-range me-1"></i>
                                    ${p.fecha_inicio || '—'} - ${p.fecha_fin || '—'}
                                </div>
                                <div class="solicitud-descripcion">
                                    ${p.justificacion ? p.justificacion.substring(0, 80) : 'Sin justificación especificada.'}
                                </div>
                                <div class="solicitud-footer mt-3">
                                    <button class="btn-action btn-action-view" onclick="window.verDetalleSolicitud(${p.id})">
                                        <i class="bi bi-eye me-1"></i> Ver detalles
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            })
            .catch(() => console.error('Error al cargar solicitudes pendientes'));
    };

    window.verDetalleSolicitud = function(id) {
        currentSolicitudId = id;
        fetch(`/novedades/solicitudes/${id}/`)
            .then(r => r.json())
            .then(p => {
                const data = {
                    ...p,
                    empleado: p.empleado || 'Empleado no disponible',
                    estado: p.estado || 'pendiente',
                    archivo: p.archivo || null
                };
                renderSolicitudDetalle(data); // Llamamos a la función del main.js
                
                const aprobarBtn = document.getElementById('solicitudesAprobarBtn');
                const rechazarBtn = document.getElementById('solicitudesRechazarBtn');
                const accionesFooter = document.getElementById('solicitudesAccionesFooter');
                
                const estadoNormalizado = (data.estado || '').toLowerCase().trim();
                const esPendiente = estadoNormalizado === 'pendiente';
                
                if (esPendiente) {
                    if (aprobarBtn) aprobarBtn.style.display = 'inline-flex';
                    if (rechazarBtn) rechazarBtn.style.display = 'inline-flex';
                    if (accionesFooter) accionesFooter.style.display = 'flex';
                } else {
                    if (aprobarBtn) aprobarBtn.style.display = 'none';
                    if (rechazarBtn) rechazarBtn.style.display = 'none';
                    if (accionesFooter) accionesFooter.style.display = 'none';
                }
                
                const modal = new bootstrap.Modal(document.getElementById('solicitudesDetalleModal'));
                modal.show();
            })
            .catch(() => showMessage('Error al cargar detalle de la solicitud'));
    };

    window.verDetalleHistorialSolicitud = function(id) {
        fetch(`/novedades/solicitudes/${id}/`)
            .then(r => r.json())
            .then(p => {
                const data = {
                    ...p,
                    empleado: p.empleado || 'Empleado no disponible',
                    estado: p.estado || 'pendiente',
                    archivo: p.archivo || null
                };
                renderSolicitudDetalle(data);
                
                const aprobarBtn = document.getElementById('solicitudesAprobarBtn');
                const rechazarBtn = document.getElementById('solicitudesRechazarBtn');
                const accionesFooter = document.getElementById('solicitudesAccionesFooter');
                
                if (aprobarBtn) aprobarBtn.style.display = 'none';
                if (rechazarBtn) rechazarBtn.style.display = 'none';
                if (accionesFooter) accionesFooter.style.display = 'none';
                
                const modal = new bootstrap.Modal(document.getElementById('solicitudesDetalleModal'));
                modal.show();
            })
            .catch(() => showMessage('Error al cargar detalle de la solicitud'));
    };

    function aprobarSolicitud(id) {
        fetch(`/novedades/solicitudes/${id}/aprobar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'ok') {
                    showMessage('Solicitud aprobada correctamente.');
                    window.updateSolicitudesKPIs();
                    window.renderSolicitudesPendientes();
                    window.renderSolicitudesHistorial();
                } else {
                    showMessage('Error: ' + (data.error || 'No se pudo aprobar'));
                }
            })
            .catch(() => showMessage('Error de red al aprobar solicitud'));
    }

    function rechazarSolicitud(id, motivo) {
        fetch(`/novedades/solicitudes/${id}/rechazar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivo: motivo })
        })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'ok') {
                    showMessage('Solicitud rechazada.');
                    window.updateSolicitudesKPIs();
                    window.renderSolicitudesPendientes();
                    window.renderSolicitudesHistorial();
                } else {
                    showMessage('Error: ' + (data.error || 'No se pudo rechazar'));
                }
            })
            .catch(() => showMessage('Error de red al rechazar solicitud'));
    }

    window.renderSolicitudesHistorial = function() {
        const estado = document.getElementById('solicitudesFiltroEstado')?.value || '';
        const busqueda = (document.getElementById('buscarSolicitudes')?.value || '').trim();

        const params = new URLSearchParams();
        if (estado && estado !== 'todas') params.append('estado', estado);
        if (busqueda) params.append('buscar', busqueda);

        fetch(`/novedades/solicitudes/historial/?${params.toString()}`)
            .then(r => r.json())
            .then(data => {
                const tbody = document.getElementById('solicitudesHistorialBody');
                const sinResultados = document.getElementById('solicitudesSinResultados');
                if (!tbody) return;

                let historial = Array.isArray(data) ? data : [];

                if (busqueda) {
                    const term = busqueda.toLowerCase();
                    historial = historial.filter(p => 
                        (p.empleado || '').toLowerCase().includes(term) ||
                        (p.tipo || '').toLowerCase().includes(term) ||
                        (p.justificacion || '').toLowerCase().includes(term)
                    );
                }

                if (!historial.length) {
                    tbody.innerHTML = '';
                    if (sinResultados) sinResultados.classList.remove('d-none');
                    return;
                }

                if (sinResultados) sinResultados.classList.add('d-none');

                tbody.innerHTML = historial.map(p => {
                    const estadoVal = (p.estado || 'Pendiente').toString().trim().toLowerCase();
                    let badge = '<span class="badge badge-pendiente">Pendiente</span>';
                    
                    if (estadoVal === 'aprobado' || estadoVal === 'aprobada') {
                        badge = '<span class="badge badge-active">Aprobado</span>';
                    } else if (estadoVal === 'rechazado' || estadoVal === 'rechazada') {
                        badge = '<span class="badge badge-rechazado">Rechazado</span>';
                    }

                    return `<tr>
                        <td data-label="Fecha solicitud">${p.fecha_solicitud ? new Date(p.fecha_solicitud).toLocaleString('es-CO') : '—'}</td>
                        <td data-label="Empleado"><strong>${p.empleado || '—'}</strong></td>
                        <td data-label="Tipo">${p.tipo || '—'}</td>
                        <td data-label="Fechas">${p.fecha_inicio || '—'} - ${p.fecha_fin || '—'}</td>
                        <td data-label="Estado">${badge}</td>
                        <td data-label="Aprobado por">${p.decision_por || p.aprobado_por || '—'}</td>
                        <td data-label="Acciones">
                            <button class="btn-action btn-action-view" onclick="window.verDetalleHistorialSolicitud(${p.id})" title="Ver detalles">
                                <i class="bi bi-eye"></i> 
                            </button>
                        </td>
                    </tr>`;
                }).join('');
            })
            .catch(error => console.error('Error al cargar historial de solicitudes:', error));
    };

    // ============================================================
    // EVENTOS DE MODALES
    // ============================================================
    document.getElementById('solicitudesAprobarBtn')?.addEventListener('click', function() {
        bootstrap.Modal.getInstance(document.getElementById('solicitudesDetalleModal'))?.hide();
        new bootstrap.Modal(document.getElementById('solicitudesConfirmApproveModal')).show();
    });

    document.getElementById('solicitudesConfirmApprove')?.addEventListener('click', function() {
        aprobarSolicitud(currentSolicitudId);
        bootstrap.Modal.getInstance(document.getElementById('solicitudesConfirmApproveModal'))?.hide();
    });

    document.getElementById('solicitudesRechazarBtn')?.addEventListener('click', function() {
        bootstrap.Modal.getInstance(document.getElementById('solicitudesDetalleModal'))?.hide();
        new bootstrap.Modal(document.getElementById('solicitudesRejectModal')).show();
    });

    document.getElementById('solicitudesConfirmReject')?.addEventListener('click', function() {
        const reason = document.getElementById('solicitudesRejectReason').value.trim();
        if (!reason) {
            showMessage('Debe ingresar un motivo de rechazo.');
            return;
        }
        rechazarSolicitud(currentSolicitudId, reason);
        bootstrap.Modal.getInstance(document.getElementById('solicitudesRejectModal'))?.hide();
    });

    // Eventos de Filtro y Búsqueda
    document.getElementById('solicitudesFiltroEstado')?.addEventListener('change', window.renderSolicitudesHistorial);
    document.getElementById('buscarSolicitudes')?.addEventListener('input', debounce(window.renderSolicitudesHistorial, 300));
    document.getElementById('solicitudesBtnLimpiar')?.addEventListener('click', () => {
        const inputBuscar = document.getElementById('buscarSolicitudes');
        const selectEstado = document.getElementById('solicitudesFiltroEstado');
        if (inputBuscar) inputBuscar.value = '';
        if (selectEstado) selectEstado.value = '';
        window.renderSolicitudesHistorial();
    });

    // ============================================================
    // FUNCIÓN PÚBLICA PARA CARGAR EL MÓDULO
    // ============================================================
    window.cargarSolicitudes = function() {
        console.log('📋 Cargando módulo de Solicitudes...');
        window.updateSolicitudesKPIs();
        window.renderSolicitudesPendientes();
        window.renderSolicitudesHistorial();
    };

    // Cargar automáticamente si la pestaña está activa
    if (document.getElementById('tabSolicitudes')?.classList.contains('active')) {
        window.cargarSolicitudes();
    }

    console.log('✅ solicitudes.js cargado correctamente');
})();