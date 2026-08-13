// ============================================================
// INCAPACIDADES.JS - MÓDULO DE INCAPACIDADES
// Panel de administración de novedades - OperPan
// ============================================================

(function () {
    let currentIncapId = null;

    window.updateIncapKPIs = function() {
        fetch('/novedades/incapacidades/historial/?estado=pendiente')
            .then(r => r.json())
            .then(data => {
                const pendingEl = document.getElementById('incapacidadesKpiPendientes');
                if (pendingEl) pendingEl.innerText = Array.isArray(data) ? data.length : 0;
            })
            .catch(() => console.error('Error al obtener KPIs de incapacidades'));

        fetch('/novedades/incapacidades/historial/')
            .then(r => r.json())
            .then(data => {
                const now = new Date();
                const mes = now.getMonth();
                const año = now.getFullYear();
                const aprobadas = Array.isArray(data) ? data.filter(i => {
                    const estado = (i.estado || '').toLowerCase();
                    const fecha = i.fecha_solicitud ? new Date(i.fecha_solicitud) : new Date();
                    return estado === 'aprobado' && fecha.getMonth() === mes && fecha.getFullYear() === año;
                }).length : 0;
                const rechazadas = Array.isArray(data) ? data.filter(i => {
                    const estado = (i.estado || '').toLowerCase();
                    const fecha = i.fecha_solicitud ? new Date(i.fecha_solicitud) : new Date();
                    return estado === 'rechazado' && fecha.getMonth() === mes && fecha.getFullYear() === año;
                }).length : 0;
                
                const aprobadasEl = document.getElementById('incapacidadesKpiAprobadas');
                const rechazadasEl = document.getElementById('incapacidadesKpiRechazadas');
                if (aprobadasEl) aprobadasEl.innerText = aprobadas;
                if (rechazadasEl) rechazadasEl.innerText = rechazadas;
            })
            .catch(() => console.error('Error al obtener KPIs de incapacidades'));
    };

    // ============================================================
    // VER DETALLE DESDE BANDEJA (CON BOTONES APROBAR/RECHAZAR)
    // ============================================================
    window.verDetalleIncapacidad = function(id) {
        currentIncapId = id;
        fetch(`/novedades/incapacidades/${id}/`)
            .then(r => r.json())
            .then(i => {
                const data = {
                    ...i,
                    empleado: i.empleado || 'Empleado no disponible',
                    estado: i.estado || 'pendiente',
                    archivo: i.archivo || null
                };
                renderIncapacidadDetalle(data);
                
                const aprobarBtn = document.getElementById('incapacidadesAprobarBtn');
                const rechazarBtn = document.getElementById('incapacidadesRechazarBtn');
                
                const estadoNormalizado = (data.estado || '').toLowerCase().trim();
                const esPendiente = estadoNormalizado === 'pendiente';
                
                if (esPendiente) {
                    if (aprobarBtn) aprobarBtn.style.display = 'inline-flex';
                    if (rechazarBtn) rechazarBtn.style.display = 'inline-flex';
                } else {
                    if (aprobarBtn) aprobarBtn.style.display = 'none';
                    if (rechazarBtn) rechazarBtn.style.display = 'none';
                }
                
                const modal = new bootstrap.Modal(document.getElementById('incapacidadesDetalleModal'));
                modal.show();
            })
            .catch(() => showMessage('❌ Error al cargar detalle de incapacidad'));
    };

    // ============================================================
    // VER DETALLE DESDE HISTORIAL (SOLO LECTURA - SIN BOTONES)
    // ============================================================
    window.verDetalleHistorialIncapacidad = function(id) {
        fetch(`/novedades/incapacidades/${id}/`)
            .then(r => r.json())
            .then(i => {
                const data = {
                    ...i,
                    empleado: i.empleado || 'Empleado no disponible',
                    estado: i.estado || 'pendiente',
                    archivo: i.archivo || null
                };
                renderIncapacidadDetalle(data);
                
                const aprobarBtn = document.getElementById('incapacidadesAprobarBtn');
                const rechazarBtn = document.getElementById('incapacidadesRechazarBtn');
                
                if (aprobarBtn) aprobarBtn.style.display = 'none';
                if (rechazarBtn) rechazarBtn.style.display = 'none';
                
                const modal = new bootstrap.Modal(document.getElementById('incapacidadesDetalleModal'));
                modal.show();
            })
            .catch(() => showMessage('❌ Error al cargar detalle de incapacidad'));
    };

    function aprobarIncapacidad(id) {
        fetch(`/novedades/incapacidades/${id}/aprobar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'ok') {
                    showMessage('✅ Incapacidad aprobada.');
                    window.updateIncapKPIs();
                    renderIncapacidadesLista();
                    renderHistorialIncapacidades();
                } else {
                    showMessage('❌ Error: ' + (data.error || 'No se pudo aprobar'));
                }
            })
            .catch(() => showMessage('❌ Error de red al aprobar incapacidad'));
    }

    function rechazarIncapacidad(id, motivo) {
        fetch(`/novedades/incapacidades/${id}/rechazar/`, {
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
                    showMessage('✅ Incapacidad rechazada.');
                    window.updateIncapKPIs();
                    renderIncapacidadesLista();
                    renderHistorialIncapacidades();
                } else {
                    showMessage('❌ Error: ' + (data.error || 'No se pudo rechazar'));
                }
            })
            .catch(() => showMessage('❌ Error de red al rechazar incapacidad'));
    }

    window.renderIncapacidadesLista = function() {
        const container = document.getElementById('incapacidadesListaContainer');
        if (!container) return;
        
        fetch('/novedades/incapacidades/pendientes/')
            .then(r => r.json())
            .then(data => {
                const pendientes = Array.isArray(data) ? data : [];

                if (!pendientes.length) {
                    container.innerHTML = `
                        <div class="solicitudes-vacio text-center text-muted py-3">
                            <i class="bi bi-clipboard2-check fs-2 mb-2 d-block"></i>
                            No hay incapacidades pendientes por revisar.
                        </div>
                    `;
                    return;
                }

                container.innerHTML = `
                    <div class="solicitudes-grid">
                        ${pendientes.map(i => `
                            <div class="solicitud-card">
                                <div class="solicitud-header">
                                    <div class="solicitud-titulo">
                                        <i class="bi bi-clipboard2-pulse"></i>
                                        <span>${i.titulo || 'Incapacidad'}</span>
                                    </div>
                                </div>
                                <div class="solicitud-empleado">
                                    <i class="bi bi-person me-1"></i>
                                    <strong>${i.empleado || 'Empleado no disponible'}</strong>
                                </div>
                                <div class="solicitud-dato">
                                    <i class="bi bi-calendar-range me-1"></i>
                                    ${i.fecha_inicio || '—'} - ${i.fecha_fin || '—'}
                                </div>
                                <div class="solicitud-descripcion">
                                    ${i.descripcion || 'Sin descripción.'}
                                </div>
                                <div class="solicitud-footer mt-3">
                                    <button type="button" class="solicitud-btn-detalle" onclick="window.verDetalleIncapacidad(${i.id})">
                                        <i class="bi bi-eye me-1"></i> Ver detalles
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            })
            .catch(error => console.error('Error al cargar incapacidades:', error));
    };

    window.renderHistorialIncapacidades = function() {
        const estado = document.getElementById('incapacidadesFiltroEstado')?.value || '';
        const busqueda = (document.getElementById('buscarIncapacidad')?.value || document.getElementById('incapacidadesBuscarEmpleado')?.value || '').trim();

        const params = new URLSearchParams();
        if (estado && estado !== 'todas') params.append('estado', estado);
        if (busqueda) params.append('buscar', busqueda);

        fetch(`/novedades/incapacidades/historial/?${params.toString()}`)
            .then(r => r.json())
            .then(data => {
                const tbody = document.getElementById('incapacidadesHistorialBody');
                const sinResultados = document.getElementById('incapacidadesSinResultados');
                if (!tbody) return;

                let historial = Array.isArray(data) ? data : [];

                if (busqueda) {
                    const term = busqueda.toLowerCase();
                    historial = historial.filter(i =>
                        (i.empleado || '').toLowerCase().includes(term) ||
                        (i.titulo || '').toLowerCase().includes(term) ||
                        (i.descripcion || '').toLowerCase().includes(term)
                    );
                }

                if (!historial.length) {
                    tbody.innerHTML = '';
                    if (sinResultados) sinResultados.classList.remove('d-none');
                    return;
                }

                if (sinResultados) sinResultados.classList.add('d-none');

                tbody.innerHTML = historial.map(i => {
                    const estadoVal = (i.estado || 'Pendiente').toString().trim().toLowerCase();
                    let badge = '<span class="badge badge-pendiente">Pendiente</span>';

                    if (estadoVal === 'aprobado' || estadoVal === 'aprobada') {
                        badge = '<span class="badge badge-active">Aprobado</span>';
                    } else if (estadoVal === 'rechazado' || estadoVal === 'rechazada') {
                        badge = '<span class="badge badge-rechazado">Rechazado</span>';
                    }

                    return `<tr>
                        <td data-label="Fecha solicitud">${i.fecha_solicitud ? new Date(i.fecha_solicitud).toLocaleString('es-CO') : '—'}</td>
                        <td data-label="Empleado"><strong>${i.empleado || '—'}</strong></td>
                        <td data-label="Diagnóstico">${i.titulo || i.descripcion || '—'}</td>
                        <td data-label="Período">${i.fecha_inicio || '—'} - ${i.fecha_fin || '—'}</td>
                        <td data-label="Estado">${badge}</td>
                        <td data-label="Aprobado por">${i.decision_por || i.aprobado_por || '—'}</td>
                        <td data-label="Acciones">
                            <button class="btn btn-sm btn-primary-corporate" onclick="window.verDetalleHistorialIncapacidad(${i.id})" title="Ver detalles">
                                <i class="bi bi-eye"></i>
                            </button>
                        </td>
                    </tr>`;
                }).join('');
            })
            .catch(error => console.error('Error al cargar historial de incapacidades:', error));
    };

    // ============================================================
    // EVENTOS DE MODALES - CORREGIDOS
    // ============================================================

    // Aprobar - abre confirmación
    document.getElementById('incapacidadesAprobarBtn')?.addEventListener('click', function() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('incapacidadesDetalleModal'));
        modal?.hide();
        new bootstrap.Modal(document.getElementById('incapacidadesConfirmApproveModal')).show();
    });

    // Confirmar Aprobación
    document.getElementById('incapacidadesConfirmApprove')?.addEventListener('click', function() {
        aprobarIncapacidad(currentIncapId);
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesConfirmApproveModal'))?.hide();
    });

    // ============================================================
    // RECHAZAR - ABRE DIRECTAMENTE EL MODAL DE MOTIVO (SIN CONFIRMACIÓN PREVIA)
    // ============================================================
    document.getElementById('incapacidadesRechazarBtn')?.addEventListener('click', function() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('incapacidadesDetalleModal'));
        modal?.hide();
        new bootstrap.Modal(document.getElementById('incapacidadesRejectModal')).show();
    });

    // Confirmar Rechazo
    document.getElementById('incapacidadesConfirmReject')?.addEventListener('click', function() {
        const reason = document.getElementById('incapacidadesRejectReason').value.trim();
        if (!reason) {
            showMessage('❌ Debe ingresar un motivo de rechazo.');
            return;
        }
        rechazarIncapacidad(currentIncapId, reason);
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesRejectModal'))?.hide();
    });

    // Filtros
    document.getElementById('incapacidadesFiltroEstado')?.addEventListener('change', window.renderHistorialIncapacidades);
    document.getElementById('incapacidadesBuscarEmpleado')?.addEventListener('input', debounce(window.renderHistorialIncapacidades, 300));
    document.getElementById('buscarIncapacidad')?.addEventListener('input', debounce(window.renderHistorialIncapacidades, 300));
    document.getElementById('incapacidadesBtnLimpiar')?.addEventListener('click', () => {
        const inputBuscar = document.getElementById('buscarIncapacidad') || document.getElementById('incapacidadesBuscarEmpleado');
        const selectEstado = document.getElementById('incapacidadesFiltroEstado');
        if (inputBuscar) inputBuscar.value = '';
        if (selectEstado) selectEstado.value = '';
        window.renderHistorialIncapacidades();
    });

    // ============================================================
    // FUNCIÓN PÚBLICA PARA CARGAR EL MÓDULO
    // ============================================================
    window.cargarIncapacidades = function() {
        console.log('📋 Cargando módulo de Incapacidades...');
        window.updateIncapKPIs();
        window.renderIncapacidadesLista();
        window.renderHistorialIncapacidades();
    };

    // Cargar automáticamente si la pestaña está activa
    if (document.getElementById('tabIncapacidades')?.classList.contains('active')) {
        window.cargarIncapacidades();
    }

    console.log('✅ incapacidades.js cargado correctamente');
})();