// ============================================================
// PERMISOS.JS - MÓDULO DE PERMISOS
// Panel de administración de novedades - OperPan
// ============================================================

(function () {
    let currentPermisoId = null;

    function updatePermisosKPIs() {
        fetch('/novedades/permisos/historial/?estado=pendiente')
            .then(r => r.json())
            .then(data => {
                const pendingEl = document.getElementById('permisosKpiPendientes');
                if (pendingEl) pendingEl.innerText = data.length;
            })
            .catch(() => console.error('Error al obtener KPIs de permisos'));

        fetch('/novedades/permisos/historial/')
            .then(r => r.json())
            .then(data => {
                const now = new Date();
                const mes = now.getMonth();
                const año = now.getFullYear();
                const aprobados = data.filter(p => (p.estado || '').toLowerCase() === 'aprobado' && new Date(p.fecha_solicitud).getMonth() === mes && new Date(p.fecha_solicitud).getFullYear() === año).length;
                const rechazados = data.filter(p => (p.estado || '').toLowerCase() === 'rechazado' && new Date(p.fecha_solicitud).getMonth() === mes && new Date(p.fecha_solicitud).getFullYear() === año).length;
                
                const aprobadosEl = document.getElementById('permisosKpiAprobados');
                const rechazadosEl = document.getElementById('permisosKpiRechazados');
                if (aprobadosEl) aprobadosEl.innerText = aprobados;
                if (rechazadosEl) rechazadosEl.innerText = rechazados;
            })
            .catch(() => console.error('Error al obtener KPIs de permisos'));
    }

    function renderPermisosPendientes() {
        fetch('/novedades/permisos/pendientes/')
            .then(r => r.json())
            .then(data => {
                const container = document.getElementById('permisosSolicitudesContainer');
                if (!container) return;

                if (!data.length) {
                    container.innerHTML = `
                        <div class="solicitudes-vacio text-center text-muted py-3">
                            <i class="bi bi-inbox fs-2 mb-2 d-block"></i>
                            No hay permisos pendientes por revisar.
                        </div>
                    `;
                    return;
                }
                
                let html = `
                    <div class="solicitudes-grid">
                        ${data.map(p => `
                            <div class="solicitud-card">
                                <div class="solicitud-header">
                                    <div class="solicitud-titulo">
                                        <i class="bi bi-calendar2-check-fill"></i>
                                        <span>${p.tipo || 'Permiso'}</span>
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
                                    <button class="btn-action btn-action-view verPermisoBtn" data-id="${p.id}">
                                        <i class="bi bi-eye me-1"></i> Ver detalles
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                container.innerHTML = html;
                document.querySelectorAll('.verPermisoBtn').forEach(btn => {
                    btn.addEventListener('click', () => verDetallePermiso(btn.dataset.id));
                });
            })
            .catch(() => console.error('Error al cargar permisos pendientes'));
    }

    // ============================================================
    // VER DETALLE DESDE BANDEJA (CON BOTONES APROBAR/RECHAZAR)
    // ============================================================
    function verDetallePermiso(id) {
        currentPermisoId = id;
        fetch(`/novedades/permisos/${id}/`)
            .then(r => r.json())
            .then(p => {
                const data = {
                    ...p,
                    empleado: p.empleado || 'Empleado no disponible',
                    estado: p.estado || 'pendiente',
                    archivo: p.archivo || null
                };
                renderPermisoDetalle(data);
                
                const aprobarBtn = document.getElementById('permisosAprobarBtn');
                const rechazarBtn = document.getElementById('permisosRechazarBtn');
                
                const estadoNormalizado = (data.estado || '').toLowerCase().trim();
                const esPendiente = estadoNormalizado === 'pendiente';
                
                if (esPendiente) {
                    if (aprobarBtn) aprobarBtn.style.display = 'inline-flex';
                    if (rechazarBtn) rechazarBtn.style.display = 'inline-flex';
                } else {
                    if (aprobarBtn) aprobarBtn.style.display = 'none';
                    if (rechazarBtn) rechazarBtn.style.display = 'none';
                }
                
                const modal = new bootstrap.Modal(document.getElementById('permisosDetalleModal'));
                modal.show();
            })
            .catch(() => showMessage('Error al cargar detalle del permiso'));
    }

    // ============================================================
    // VER DETALLE DESDE HISTORIAL (SOLO LECTURA - SIN BOTONES)
    // ============================================================
    function verDetalleHistorialPermiso(id) {
        fetch(`/novedades/permisos/${id}/`)
            .then(r => r.json())
            .then(p => {
                const data = {
                    ...p,
                    empleado: p.empleado || 'Empleado no disponible',
                    estado: p.estado || 'pendiente',
                    archivo: p.archivo || null
                };
                renderPermisoDetalle(data);
                
                const aprobarBtn = document.getElementById('permisosAprobarBtn');
                const rechazarBtn = document.getElementById('permisosRechazarBtn');
                
                if (aprobarBtn) aprobarBtn.style.display = 'none';
                if (rechazarBtn) rechazarBtn.style.display = 'none';
                
                const modal = new bootstrap.Modal(document.getElementById('permisosDetalleModal'));
                modal.show();
            })
            .catch(() => showMessage('Error al cargar detalle del permiso'));
    }

    function aprobarPermiso(id) {
        fetch(`/novedades/permisos/${id}/aprobar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'ok') {
                    showMessage('✅ Permiso aprobado correctamente.');
                    updatePermisosKPIs();
                    renderPermisosPendientes();
                    renderPermisosHistorial();
                } else {
                    showMessage('❌ Error: ' + (data.error || 'No se pudo aprobar'));
                }
            })
            .catch(() => showMessage('❌ Error de red al aprobar permiso'));
    }

    function rechazarPermiso(id, motivo) {
        fetch(`/novedades/permisos/${id}/rechazar/`, {
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
                    showMessage('✅ Permiso rechazado.');
                    updatePermisosKPIs();
                    renderPermisosPendientes();
                    renderPermisosHistorial();
                } else {
                    showMessage('❌ Error: ' + (data.error || 'No se pudo rechazar'));
                }
            })
            .catch(() => showMessage('❌ Error de red al rechazar permiso'));
    }

    function renderPermisosHistorial() {
        const estado = document.getElementById('permisosFiltroEstado')?.value || '';
        const busqueda = (document.getElementById('buscarPermiso')?.value || '').trim();

        const params = new URLSearchParams();
        if (estado && estado !== 'todas') params.append('estado', estado);
        if (busqueda) params.append('buscar', busqueda);

        fetch(`/novedades/permisos/historial/?${params.toString()}`)
            .then(r => r.json())
            .then(data => {
                const tbody = document.getElementById('permisosHistorialBody');
                const sinResultados = document.getElementById('permisosSinResultados');
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
                            <button class="btn-action btn-action-view verHistorialPermisoBtn" data-id="${p.id}" title="Ver detalles">
                                <i class="bi bi-eye"></i> 
                            </button>
                        </td>
                    </tr>`;
                }).join('');

                document.querySelectorAll('.verHistorialPermisoBtn').forEach(btn => {
                    btn.addEventListener('click', () => verDetalleHistorialPermiso(btn.dataset.id));
                });
            })
            .catch(error => console.error('Error al cargar historial de permisos:', error));
    }

    // ============================================================
    // EVENTOS DE MODALES - CORREGIDOS
    // ============================================================

    // Aprobar - abre confirmación
    document.getElementById('permisosAprobarBtn')?.addEventListener('click', function() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('permisosDetalleModal'));
        modal?.hide();
        new bootstrap.Modal(document.getElementById('permisosConfirmApproveModal')).show();
    });

    // Confirmar Aprobación
    document.getElementById('permisosConfirmApprove')?.addEventListener('click', function() {
        aprobarPermiso(currentPermisoId);
        bootstrap.Modal.getInstance(document.getElementById('permisosConfirmApproveModal'))?.hide();
    });

    // ============================================================
    // RECHAZAR - ABRE DIRECTAMENTE EL MODAL DE MOTIVO (SIN CONFIRMACIÓN PREVIA)
    // ============================================================
    document.getElementById('permisosRechazarBtn')?.addEventListener('click', function() {
        bootstrap.Modal.getInstance(document.getElementById('permisosDetalleModal'))?.hide();
        new bootstrap.Modal(document.getElementById('permisosRejectModal')).show();
    });

    // Confirmar Rechazo
    document.getElementById('permisosConfirmReject')?.addEventListener('click', function() {
        const reason = document.getElementById('permisosRejectReason').value.trim();
        if (!reason) {
            showMessage('❌ Debe ingresar un motivo de rechazo.');
            return;
        }
        rechazarPermiso(currentPermisoId, reason);
        bootstrap.Modal.getInstance(document.getElementById('permisosRejectModal'))?.hide();
    });

    // Eventos de Filtro y Búsqueda
    document.getElementById('permisosFiltroEstado')?.addEventListener('change', renderPermisosHistorial);
    document.getElementById('buscarPermiso')?.addEventListener('input', debounce(renderPermisosHistorial, 300));
    document.getElementById('permisosBtnLimpiar')?.addEventListener('click', () => {
        const inputBuscar = document.getElementById('buscarPermiso');
        const selectEstado = document.getElementById('permisosFiltroEstado');
        if (inputBuscar) inputBuscar.value = '';
        if (selectEstado) selectEstado.value = '';
        renderPermisosHistorial();
    });

    // ============================================================
    // FUNCIÓN PÚBLICA PARA CARGAR EL MÓDULO
    // ============================================================
    window.cargarPermisos = function() {
        console.log('📋 Cargando módulo de Permisos...');
        updatePermisosKPIs();
        renderPermisosPendientes();
        renderPermisosHistorial();
    };

    // Cargar automáticamente si la pestaña está activa
    if (document.getElementById('tabPermisos')?.classList.contains('active')) {
        window.cargarPermisos();
    }

    console.log('✅ permisos.js cargado correctamente');
})();