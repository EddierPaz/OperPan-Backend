// ============================================================
// UTILIDADES COMPARTIDAS
// ============================================================
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function getCSRFToken() {
    return getCookie('csrftoken');
}

function showMessage(msg) {
    const toast = document.getElementById('liveToast');
    if (toast) {
        document.getElementById('toastMsg').innerText = msg;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    } else {
        alert(msg);
    }
}

// Debounce: evita disparar una petición al backend por cada tecla.
// Espera `delay` ms desde la última llamada antes de ejecutar `fn`.
function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}


// ============================== MÓDULO PERMISOS ==============================
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
                                    ${p.fecha_inicio || '—'} → ${p.fecha_fin || '—'}
                                </div>
                                <div class="solicitud-descripcion">
                                    ${p.justificacion ? p.justificacion.substring(0, 80) : 'Sin justificación especificada.'}
                                </div>
                                <div class="solicitud-footer mt-3">
                                    <button class="solicitud-btn-detalle verPermisoBtn" data-id="${p.id}">
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
                    let badge = '<span class="badge bg-warning text-dark">Pendiente</span>';
                    
                    if (estadoVal === 'aprobado' || estadoVal === 'aprobada') {
                        badge = '<span class="badge bg-success">Aprobado</span>';
                    } else if (estadoVal === 'rechazado' || estadoVal === 'rechazada') {
                        badge = '<span class="badge bg-danger">Rechazado</span>';
                    }

                    return `<tr>
                        <td data-label="Fecha solicitud">${p.fecha_solicitud ? new Date(p.fecha_solicitud).toLocaleString('es-CO') : '—'}</td>
                        <td data-label="Empleado"><strong>${p.empleado || '—'}</strong></td>
                        <td data-label="Tipo">${p.tipo || '—'}</td>
                        <td data-label="Fechas">${p.fecha_inicio || '—'} → ${p.fecha_fin || '—'}</td>
                        <td data-label="Estado">${badge}</td>
                        <td data-label="Aprobado por">${p.decision_por || p.aprobado_por || '—'}</td>
                        <td data-label="Acciones">
                            <button class="btn btn-sm btn-primary-corporate verHistorialPermisoBtn" data-id="${p.id}" title="Ver detalles">
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

    function verDetallePermiso(id) {
        currentPermisoId = id;
        fetch(`/novedades/permisos/${id}/`)
            .then(r => r.json())
            .then(p => {
                const emp = p.empleado;
                document.getElementById('permisosModalBody').innerHTML = `
                    <div class="row g-3">
                        <div class="col-md-6"><strong>Empleado:</strong><br>${emp}</div>
                        <div class="col-md-6"><strong>Tipo:</strong><br>${p.tipo}</div>
                        <div class="col-12"><strong>Justificación:</strong><br>${p.justificacion}</div>
                        <div class="col-6"><strong>Fechas:</strong><br><i class="bi bi-calendar3"></i> ${p.fecha_inicio} → ${p.fecha_fin}</div>
                    </div>
                `;
                // Mostrar botones para tomar decisión desde la bandeja
                const aprobarBtn = document.getElementById('permisosAprobarBtn');
                const rechazarBtn = document.getElementById('permisosRechazarBtn');
                if (aprobarBtn) aprobarBtn.style.display = 'inline-block';
                if (rechazarBtn) rechazarBtn.style.display = 'inline-block';

                const modal = new bootstrap.Modal(document.getElementById('permisosDetalleModal'));
                modal.show();
            })
            .catch(() => alert('Error al cargar detalle del permiso'));
    }

    function verDetalleHistorialPermiso(id) {
        fetch(`/novedades/permisos/${id}/`)
            .then(r => r.json())
            .then(p => {
                document.getElementById('permisosModalBody').innerHTML = `
                    <div class="row g-3">
                        <div class="col-md-6"><strong>Empleado:</strong><br>${p.empleado}</div>
                        <div class="col-md-6"><strong>Tipo:</strong><br>${p.tipo}</div>
                        <div class="col-12"><strong>Justificación:</strong><br>${p.justificacion}</div>
                        <div class="col-6"><strong>Fechas:</strong><br><i class="bi bi-calendar3"></i> ${p.fecha_inicio} → ${p.fecha_fin}</div>
                        <div class="col-6"><strong>Estado:</strong><br>${p.estado}</div>
                        ${p.motivo_rechazo ? `<div class="col-12 text-danger"><strong>Motivo rechazo:</strong><br>${p.motivo_rechazo}</div>` : ''}
                    </div>
                `;
                // MODO SOLO LECTURA: Ocultar botones de acción en el historial
                const aprobarBtn = document.getElementById('permisosAprobarBtn');
                const rechazarBtn = document.getElementById('permisosRechazarBtn');
                if (aprobarBtn) aprobarBtn.style.display = 'none';
                if (rechazarBtn) rechazarBtn.style.display = 'none';

                const modal = new bootstrap.Modal(document.getElementById('permisosDetalleModal'));
                modal.show();
            })
            .catch(() => alert('Error al cargar detalle del permiso'));
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
                    showMessage('Permiso aprobado correctamente.');
                    updatePermisosKPIs();
                    renderPermisosPendientes();
                    renderPermisosHistorial();
                } else {
                    showMessage('Error: ' + (data.error || 'No se pudo aprobar'));
                }
            })
            .catch(() => showMessage('Error de red al aprobar permiso'));
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
                    showMessage('Permiso rechazado.');
                    updatePermisosKPIs();
                    renderPermisosPendientes();
                    renderPermisosHistorial();
                } else {
                    showMessage('Error: ' + (data.error || 'No se pudo rechazar'));
                }
            })
            .catch(() => showMessage('Error de red al rechazar permiso'));
    }

    // Eventos de modales de permisos
    document.getElementById('permisosAprobarBtn')?.addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('permisosDetalleModal'));
        modal?.hide();
        new bootstrap.Modal(document.getElementById('permisosConfirmApproveModal')).show();
    });
    document.getElementById('permisosConfirmApprove')?.addEventListener('click', () => {
        aprobarPermiso(currentPermisoId);
        bootstrap.Modal.getInstance(document.getElementById('permisosConfirmApproveModal'))?.hide();
    });
    document.getElementById('permisosRechazarBtn')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('permisosDetalleModal'))?.hide();
        new bootstrap.Modal(document.getElementById('permisosConfirmRejectFirstModal')).show();
    });
    document.getElementById('permisosConfirmRejectFirst')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('permisosConfirmRejectFirstModal'))?.hide();
        new bootstrap.Modal(document.getElementById('permisosRejectModal')).show();
    });
    document.getElementById('permisosConfirmReject')?.addEventListener('click', () => {
        const reason = document.getElementById('permisosRejectReason').value.trim();
        if (!reason) {
            showMessage('Debe ingresar un motivo de rechazo.');
            return;
        }
        rechazarPermiso(currentPermisoId, reason);
        bootstrap.Modal.getInstance(document.getElementById('permisosRejectModal'))?.hide();
    });

    // Eventos de Filtro y Búsqueda — instantáneo, sin botón "Buscar"
    document.getElementById('permisosFiltroEstado')?.addEventListener('change', renderPermisosHistorial);
    document.getElementById('buscarPermiso')?.addEventListener('input', debounce(renderPermisosHistorial, 300));
    document.getElementById('permisosBtnLimpiar')?.addEventListener('click', () => {
        const inputBuscar = document.getElementById('buscarPermiso');
        const selectEstado = document.getElementById('permisosFiltroEstado');
        if (inputBuscar) inputBuscar.value = '';
        if (selectEstado) selectEstado.value = '';
        renderPermisosHistorial();
    });

    updatePermisosKPIs();
    renderPermisosPendientes();
    renderPermisosHistorial();
})();


// ============================== MÓDULO INCAPACIDADES ==============================
(function () {
    let currentIncapId = null;

    function updateIncapKPIs() {
        fetch('/novedades/incapacidades/historial/?estado=pendiente')
            .then(r => r.json())
            .then(data => {
                const pendingEl = document.getElementById('incapacidadesKpiPendientes');
                if (pendingEl) pendingEl.innerText = data.length;
            })
            .catch(() => console.error('Error al obtener KPIs de incapacidades'));

        fetch('/novedades/incapacidades/historial/')
            .then(r => r.json())
            .then(data => {
                const now = new Date();
                const mes = now.getMonth();
                const año = now.getFullYear();
                const aprobadas = data.filter(i => (i.estado || '').toLowerCase() === 'aprobado' && new Date(i.fecha_solicitud).getMonth() === mes && new Date(i.fecha_solicitud).getFullYear() === año).length;
                const rechazadas = data.filter(i => (i.estado || '').toLowerCase() === 'rechazado' && new Date(i.fecha_solicitud).getMonth() === mes && new Date(i.fecha_solicitud).getFullYear() === año).length;
                
                const aprobadasEl = document.getElementById('incapacidadesKpiAprobadas');
                const rechazadasEl = document.getElementById('incapacidadesKpiRechazadas');
                if (aprobadasEl) aprobadasEl.innerText = aprobadas;
                if (rechazadasEl) rechazadasEl.innerText = rechazadas;
            })
            .catch(() => console.error('Error al obtener KPIs de incapacidades'));
    }

    function renderIncapacidadesLista() {
        fetch('/novedades/incapacidades/pendientes/')
            .then(r => {
                if (!r.ok) throw new Error('Error al consultar incapacidades pendientes');
                return r.json();
            })
            .then(data => {
                const container = document.getElementById('incapacidadesListaContainer');
                if (!container) return;

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
                                    ${i.fecha_inicio || '—'} → ${i.fecha_fin || '—'}
                                </div>
                                <div class="solicitud-descripcion">
                                    ${i.descripcion || 'Sin descripción.'}
                                </div>
                                <div class="solicitud-footer mt-3">
                                    <button type="button" class="solicitud-btn-detalle" onclick="verDetalleIncapacidad(${i.id})">
                                        <i class="bi bi-eye me-1"></i> Ver detalles
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            })
            .catch(error => console.error('Error al cargar la bandeja de incapacidades:', error));
    }

    function renderHistorialIncapacidades() {
        const estado = document.getElementById('incapacidadesFiltroEstado')?.value || '';
        const busqueda = (document.getElementById('buscarIncapacidad')?.value || document.getElementById('incapacidadesBuscarEmpleado')?.value || '').trim();

        const params = new URLSearchParams();
        if (estado && estado !== 'todas') params.append('estado', estado);
        if (busqueda) params.append('buscar', busqueda);

        fetch(`/novedades/incapacidades/historial/?${params.toString()}`)
            .then(r => {
                if (!r.ok) throw new Error('Error al consultar historial de incapacidades');
                return r.json();
            })
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
                    let badge = '<span class="badge bg-warning text-dark">Pendiente</span>';

                    if (estadoVal === 'aprobado' || estadoVal === 'aprobada') {
                        badge = '<span class="badge bg-success">Aprobado</span>';
                    } else if (estadoVal === 'rechazado' || estadoVal === 'rechazada') {
                        badge = '<span class="badge bg-danger">Rechazado</span>';
                    }

                    return `<tr>
                        <td data-label="Fecha solicitud">${i.fecha_solicitud ? new Date(i.fecha_solicitud).toLocaleString('es-CO') : '—'}</td>
                        <td data-label="Empleado"><strong>${i.empleado || '—'}</strong></td>
                        <td data-label="Diagnóstico">${i.titulo || i.descripcion || '—'}</td>
                        <td data-label="Período">${i.fecha_inicio || '—'} → ${i.fecha_fin || '—'}</td>
                        <td data-label="Estado">${badge}</td>
                        <td data-label="Aprobado por">${i.decision_por || i.aprobado_por || '—'}</td>
                        <td data-label="Acciones">
                            <button class="btn btn-sm btn-primary-corporate verHistorialIncapacidadBtn" onclick="verDetalleHistorialIncapacidad(${i.id})" title="Ver detalles">
                                <i class="bi bi-eye"></i>
                            </button>
                        </td>
                    </tr>`;
                }).join('');
            })
            .catch(error => console.error('Error al cargar historial de incapacidades:', error));
    }

    function verDetalleIncapacidad(id) {
        currentIncapId = id;
        fetch(`/novedades/incapacidades/${id}/`)
            .then(r => r.json())
            .then(i => {
                document.getElementById('incapacidadesModalBody').innerHTML = `
                    <p><strong>Empleado:</strong> ${i.empleado}</p>
                    <p><strong>Título:</strong> ${i.titulo}</p>
                    <p><strong>Descripción:</strong> ${i.descripcion}</p>
                    <p><strong>Período:</strong> <i class="bi bi-calendar3"></i> ${i.fecha_inicio} → ${i.fecha_fin}</p>
                    <p><strong>Estado:</strong> ${i.estado}</p>
                    ${i.motivo_rechazo ? `<p class="text-danger"><strong>Motivo rechazo:</strong> ${i.motivo_rechazo}</p>` : ''}
                `;
                const modal = new bootstrap.Modal(document.getElementById('incapacidadesDetalleModal'));
                const aprobarBtn = document.getElementById('incapacidadesAprobarBtn');
                const rechazarBtn = document.getElementById('incapacidadesRechazarBtn');
                if (aprobarBtn) aprobarBtn.style.display = 'inline-block';
                if (rechazarBtn) rechazarBtn.style.display = 'inline-block';
                modal.show();
            })
            .catch(() => alert('Error al cargar detalle de incapacidad'));
    }

    window.verDetalleIncapacidad = verDetalleIncapacidad;

    function verDetalleHistorialIncapacidad(id) {
        fetch(`/novedades/incapacidades/${id}/`)
            .then(r => r.json())
            .then(i => {
                document.getElementById('incapacidadesModalBody').innerHTML = `
                    <p><strong>Empleado:</strong> ${i.empleado}</p>
                    <p><strong>Diagnóstico:</strong> ${i.titulo}</p>
                    <p><strong>Descripción:</strong> ${i.descripcion}</p>
                    <p><strong>Período:</strong> <i class="bi bi-calendar3"></i> ${i.fecha_inicio} → ${i.fecha_fin}</p>
                    <p><strong>Estado:</strong> ${i.estado}</p>
                    ${i.motivo_rechazo ? `<p class="text-danger"><strong>Motivo rechazo:</strong> ${i.motivo_rechazo}</p>` : ''}
                `;
                // MODO SOLO LECTURA
                const aprobarBtn = document.getElementById('incapacidadesAprobarBtn');
                const rechazarBtn = document.getElementById('incapacidadesRechazarBtn');
                if (aprobarBtn) aprobarBtn.style.display = 'none';
                if (rechazarBtn) rechazarBtn.style.display = 'none';

                const modal = new bootstrap.Modal(document.getElementById('incapacidadesDetalleModal'));
                modal.show();
            })
            .catch(() => alert('Error al cargar detalle de incapacidad'));
    }

    window.verDetalleHistorialIncapacidad = verDetalleHistorialIncapacidad;

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
                    showMessage('Incapacidad aprobada.');
                    updateIncapKPIs();
                    renderIncapacidadesLista();
                    renderHistorialIncapacidades();
                } else {
                    showMessage('Error: ' + (data.error || 'No se pudo aprobar'));
                }
            })
            .catch(() => showMessage('Error de red al aprobar incapacidad'));
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
                    showMessage('Incapacidad rechazada.');
                    updateIncapKPIs();
                    renderIncapacidadesLista();
                    renderHistorialIncapacidades();
                } else {
                    showMessage('Error: ' + (data.error || 'No se pudo rechazar'));
                }
            })
            .catch(() => showMessage('Error de red al rechazar incapacidad'));
    }

    document.getElementById('incapacidadesAprobarBtn')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesDetalleModal'))?.hide();
        new bootstrap.Modal(document.getElementById('incapacidadesConfirmApproveModal')).show();
    });
    document.getElementById('incapacidadesConfirmApprove')?.addEventListener('click', () => {
        aprobarIncapacidad(currentIncapId);
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesConfirmApproveModal'))?.hide();
    });
    document.getElementById('incapacidadesRechazarBtn')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesDetalleModal'))?.hide();
        new bootstrap.Modal(document.getElementById('incapacidadesConfirmRejectFirstModal')).show();
    });
    document.getElementById('incapacidadesConfirmRejectFirst')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesConfirmRejectFirstModal'))?.hide();
        new bootstrap.Modal(document.getElementById('incapacidadesRejectModal')).show();
    });
    document.getElementById('incapacidadesConfirmReject')?.addEventListener('click', () => {
        const reason = document.getElementById('incapacidadesRejectReason').value.trim();
        if (!reason) {
            showMessage('Debe ingresar un motivo de rechazo.');
            return;
        }
        rechazarIncapacidad(currentIncapId, reason);
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesRejectModal'))?.hide();
    });

    // Filtro instantáneo — sin botón "Buscar"
    document.getElementById('incapacidadesFiltroEstado')?.addEventListener('change', renderHistorialIncapacidades);
    document.getElementById('incapacidadesBuscarEmpleado')?.addEventListener('input', debounce(renderHistorialIncapacidades, 300));
    document.getElementById('buscarIncapacidad')?.addEventListener('input', debounce(renderHistorialIncapacidades, 300));
    document.getElementById('incapacidadesBtnLimpiar')?.addEventListener('click', () => {
        const inputBuscar = document.getElementById('buscarIncapacidad') || document.getElementById('incapacidadesBuscarEmpleado');
        const selectEstado = document.getElementById('incapacidadesFiltroEstado');
        if (inputBuscar) inputBuscar.value = '';
        if (selectEstado) selectEstado.value = '';
        renderHistorialIncapacidades();
    });

    updateIncapKPIs();
    renderIncapacidadesLista();
    renderHistorialIncapacidades();
})();


// ============================== MÓDULO CERTIFICADOS ==============================
(function () {

    function actualizarKPICertificados() {
        fetch('/novedades/certificados/')
            .then(r => r.json())
            .then(data => {
                const ahora = new Date();
                const mesActual = ahora.getMonth();
                const añoActual = ahora.getFullYear();
                const pendientes = data.filter(c => (c.estado || '').toLowerCase() === 'pendiente').length;
                const aprobados = data.filter(c => (c.estado || '').toLowerCase() === 'aprobado').filter(c => {
                    const fecha = new Date(c.fecha_emision || c.fecha_solicitud);
                    return (fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual);
                }).length;

                const rechazados = data.filter(c => (c.estado || '').toLowerCase() === 'rechazado').filter(c => {
                    const fecha = new Date(c.fecha_emision || c.fecha_solicitud);
                    return (fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual);
                }).length;

                const kpiPendientes = document.getElementById('certificadosKpiPendientes');
                const kpiAprobadas = document.getElementById('certificadosKpiAprobadas');
                const kpiRechazadas = document.getElementById('certificadosKpiRechazadas');
                if (kpiPendientes) kpiPendientes.innerText = pendientes;
                if (kpiAprobadas) kpiAprobadas.innerText = aprobados;
                if (kpiRechazadas) kpiRechazadas.innerText = rechazados;
            })
            .catch(error => console.error('Error al obtener KPIs de certificados:', error));
    }

    function renderCertificados() {
        const tipoFiltro = (document.getElementById('certificadosFiltroTipo')?.value || '').toLowerCase().trim();
        const estadoFiltro = (document.getElementById('certificadosFiltroEstado')?.value || '').toLowerCase().trim();
        const busqueda = (document.getElementById('buscarCertificado')?.value || '').toLowerCase().trim();

        fetch('/novedades/certificados/')
            .then(response => {
                if (!response.ok) throw new Error('Error al consultar certificados');
                return response.json();
            })
            .then(data => {
                let certificados = Array.isArray(data) ? data : [];

                if (busqueda) {
                    certificados = certificados.filter(certificado => {
                        const textoBusqueda = [
                            certificado.empleado,
                            certificado.documento,
                            certificado.usuario,
                            certificado.nombre,
                            certificado.cargo,
                            certificado.tipo
                        ].filter(valor => valor !== null && valor !== undefined).join(' ').toLowerCase();

                        return textoBusqueda.includes(busqueda);
                    });
                }

                if (tipoFiltro) {
                    certificados = certificados.filter(certificado => (certificado.tipo || '').toLowerCase().trim() === tipoFiltro);
                }

                if (estadoFiltro) {
                    certificados = certificados.filter(certificado => (certificado.estado || '').toLowerCase().trim() === estadoFiltro);
                }

                const tbody = document.getElementById('certificadosTablaBody');
                const sinResultados = document.getElementById('certificadosSinResultados');

                if (!tbody) return;

                if (certificados.length === 0) {
                    tbody.innerHTML = '';
                    if (sinResultados) sinResultados.classList.remove('d-none');
                    return;
                }

                if (sinResultados) sinResultados.classList.add('d-none');

                tbody.innerHTML = certificados.map(certificado => {
                    const empleado = certificado.empleado || '—';
                    const cargo = certificado.cargo || '—';
                    const tipo = certificado.tipo || '—';
                    const estadoVal = (certificado.estado || 'Pendiente').toString().trim().toLowerCase();

                    let badgeEstado = '<span class="badge bg-warning text-dark">Pendiente</span>';
                    if (estadoVal === 'aprobado' || estadoVal === 'aprobada') {
                        badgeEstado = `<span class="badge bg-success">Aprobado</span>`;
                    } else if (estadoVal === 'rechazado' || estadoVal === 'rechazada') {
                        badgeEstado = `<span class="badge bg-danger">Rechazado</span>`;
                    }

                    const fechaMostrar = (estadoVal === 'aprobado' || estadoVal === 'aprobada')
                        ? (certificado.fecha_emision || certificado.fecha_decision)
                        : certificado.fecha_solicitud;

                    const fechaFormateada = fechaMostrar
                        ? new Date(fechaMostrar).toLocaleString('es-CO')
                        : '—';

                    return `
                    <tr>
                        <td data-label="Empleado"><strong>${empleado}</strong></td>
                        <td data-label="Cargo">${cargo}</td>
                        <td data-label="Tipo de certificado">${tipo}</td>
                        <td data-label="Fecha de emisión">${fechaFormateada}</td>
                        <td data-label="Estado">${badgeEstado}</td>
                        <td data-label="Acciones">
                            <button class="btn btn-sm btn-primary-corporate" onclick="verDetalleHistorialCertificado(${certificado.id})" title="Ver detalles">
                                <i class="bi bi-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
                }).join('');
            })
            .catch(error => console.error('Error al cargar certificados:', error));
    }

    // Filtro instantáneo — sin botón "Buscar"
    document.getElementById('buscarCertificado')?.addEventListener('input', debounce(renderCertificados, 300));
    document.getElementById('certificadosFiltroTipo')?.addEventListener('change', renderCertificados);
    document.getElementById('certificadosFiltroEstado')?.addEventListener('change', renderCertificados);

    document.getElementById('certificadosBtnLimpiar')?.addEventListener('click', () => {
        const buscar = document.getElementById('buscarCertificado');
        const tipo = document.getElementById('certificadosFiltroTipo');
        const estado = document.getElementById('certificadosFiltroEstado');
        if (buscar) buscar.value = '';
        if (tipo) tipo.value = '';
        if (estado) estado.value = '';
        renderCertificados();
    });

    actualizarKPICertificados();
    renderCertificados();
})();


// ============================== CONTROL DE PESTAÑAS ==============================
document.querySelectorAll('.novedades-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.novedades-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.getElementById(`tab${target.charAt(0).toUpperCase() + target.slice(1)}`).classList.add('active');
    });
});


// ============================================================
// CERTIFICADOS - BANDEJA DE PENDIENTES Y MODALES
// ============================================================
let certificadoSeleccionadoId = null;

async function cargarCertificadosPendientes() {
    const container = document.getElementById('certificadosSolicitudesContainer');
    if (!container) return;

    try {
        const resp = await fetch('/novedades/certificados/pendientes/');
        if (!resp.ok) throw new Error(`Error HTTP: ${resp.status}`);

        const data = await resp.json();

        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay certificados pendientes.
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="solicitudes-grid">
                ${data.map(c => `
                    <div class="solicitud-card">
                        <div class="solicitud-header">
                            <div class="solicitud-titulo">
                                <i class="bi bi-flag-fill"></i>
                                <span>${c.tipo}</span>
                            </div>
                        </div>
                        <div class="solicitud-empleado">
                            <i class="bi bi-person me-1"></i>
                            <strong>${c.empleado}</strong>
                        </div>
                        <div class="solicitud-dato">
                            <i class="bi bi-calendar3 me-1"></i>
                            Solicitado: ${new Date(c.fecha_solicitud).toLocaleString('es-CO')}
                        </div>
                        <div class="solicitud-descripcion">
                            ${c.proposito || 'Sin propósito especificado.'}
                        </div>
                        <div class="solicitud-footer mt-3">
                            <button type="button" class="solicitud-btn-detalle" onclick="verDetalleCertificado(${c.id})">
                                <i class="bi bi-eye me-1"></i> Ver detalles
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (err) {
        console.error('Error cargando certificados pendientes:', err);
        container.innerHTML = `
            <div class="text-center text-danger py-4">
                <i class="bi bi-exclamation-circle fs-1 d-block mb-2"></i>
                Error al cargar certificados pendientes.
            </div>
        `;
    }
}

// Ver detalle desde BANDEJA (Con opción de aprobar/rechazar)
async function verDetalleCertificado(id) {
    certificadoSeleccionadoId = id;
    try {
        const resp = await fetch(`/novedades/certificados/pendientes/`);
        const data = await resp.json();
        const c = data.find(item => item.id === id);
        if (!c) return;

        document.getElementById('certificadosModalBody').innerHTML = `
            <p><strong>Empleado:</strong> ${c.empleado}</p>
            <p><strong>Tipo:</strong> ${c.tipo}</p>
            <p><strong>Propósito:</strong> ${c.proposito || '-'}</p>
            <p><strong>Dirigido a:</strong> ${c.dirigido_a || '-'}</p>
            <p><strong>Periodo:</strong> ${c.periodo || '-'}</p>
            <p><strong>Fecha de solicitud:</strong> ${new Date(c.fecha_solicitud).toLocaleString('es-CO')}</p>
        `;

        // Mostrar botones de acción
        const aprobarBtn = document.getElementById('certificadosAprobarBtn');
        const rechazarBtn = document.getElementById('certificadosRechazarBtn');
        if (aprobarBtn) aprobarBtn.style.display = 'inline-block';
        if (rechazarBtn) rechazarBtn.style.display = 'inline-block';

        const modal = new bootstrap.Modal(document.getElementById('certificadosDetalleModal'));
        modal.show();
    } catch (err) {
        console.error('Error obteniendo detalle:', err);
    }
}

// Ver detalle desde HISTORIAL (Solo Observar)
async function verDetalleHistorialCertificado(id) {
    try {
        const resp = await fetch(`/novedades/certificados/${id}/`);
        const c = await resp.json();
        if (!c) return;

        document.getElementById('certificadosModalBody').innerHTML = `
            <p><strong>Empleado:</strong> ${c.empleado}</p>
            <p><strong>Tipo:</strong> ${c.tipo}</p>
            <p><strong>Propósito:</strong> ${c.proposito || '-'}</p>
            <p><strong>Dirigido a:</strong> ${c.dirigido_a || '-'}</p>
            <p><strong>Periodo:</strong> ${c.periodo || '-'}</p>
            <p><strong>Estado:</strong> ${c.estado}</p>
            <p><strong>Fecha:</strong> ${new Date(c.fecha_emision || c.fecha_solicitud).toLocaleString('es-CO')}</p>
            ${c.motivo_rechazo ? `<p class="text-danger"><strong>Motivo rechazo:</strong> ${c.motivo_rechazo}</p>` : ''}
        `;

        // MODO SOLO LECTURA: Ocultar botones de acción
        const aprobarBtn = document.getElementById('certificadosAprobarBtn');
        const rechazarBtn = document.getElementById('certificadosRechazarBtn');
        if (aprobarBtn) aprobarBtn.style.display = 'none';
        if (rechazarBtn) rechazarBtn.style.display = 'none';

        const modal = new bootstrap.Modal(document.getElementById('certificadosDetalleModal'));
        modal.show();
    } catch (err) {
        console.error('Error obteniendo detalle del certificado:', err);
    }
}

window.verDetalleCertificado = verDetalleCertificado;
window.verDetalleHistorialCertificado = verDetalleHistorialCertificado;

document.getElementById('certificadosAprobarBtn')?.addEventListener('click', () => {
    const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('certificadosDetalleModal'));
    modalDetalle?.hide();
    const modalConfirm = new bootstrap.Modal(document.getElementById('certificadosConfirmApproveModal'));
    modalConfirm.show();
});

document.getElementById('certificadosConfirmApprove')?.addEventListener('click', async () => {
    if (!certificadoSeleccionadoId) return;
    try {
        const resp = await fetch(`/novedades/certificados/${certificadoSeleccionadoId}/aprobar/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCSRFToken() }
        });
        const data = await resp.json();

        bootstrap.Modal.getInstance(document.getElementById('certificadosConfirmApproveModal'))?.hide();

        if (resp.ok) {
            cargarCertificadosPendientes();
            if (typeof renderCertificados === 'function') renderCertificados();
        } else {
            alert(data.error || 'Error al aprobar el certificado');
        }
    } catch (err) {
        console.error('Error aprobando certificado:', err);
    }
});

document.getElementById('certificadosRechazarBtn')?.addEventListener('click', () => {
    const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('certificadosDetalleModal'));
    modalDetalle?.hide();
    const modalReject = new bootstrap.Modal(document.getElementById('certificadosRejectModal'));
    modalReject.show();
});

document.getElementById('certificadosConfirmReject')?.addEventListener('click', async () => {
    if (!certificadoSeleccionadoId) return;
    const motivo = document.getElementById('certificadosRejectReason').value.trim();
    if (!motivo) {
        alert('Debes indicar un motivo de rechazo.');
        return;
    }

    try {
        const resp = await fetch(`/novedades/certificados/${certificadoSeleccionadoId}/rechazar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivo: motivo })
        });
        const data = await resp.json();

        bootstrap.Modal.getInstance(document.getElementById('certificadosRejectModal'))?.hide();
        document.getElementById('certificadosRejectReason').value = '';

        if (resp.ok) {
            cargarCertificadosPendientes();
            if (typeof renderCertificados === 'function') renderCertificados();
        } else {
            alert(data.error || 'Error al rechazar el certificado');
        }
    } catch (err) {
        console.error('Error rechazando certificado:', err);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    cargarCertificadosPendientes();
});


// ============================== MÓDULO MEMORANDOS ==============================
(function () {
    let memorandosData = [];
    let empleadosData = [];

    async function cargarEmpleados() {
        try {
            const resp = await fetch('/memorandos/empleados/');
            empleadosData = await resp.json();
            const select = document.getElementById('memorandoEmpleado');
            if (!select) return;
            select.innerHTML = '<option value="">Seleccionar empleado</option>';
            empleadosData.forEach(emp => {
                select.innerHTML += `<option value="${emp.id}">${emp.nombre_completo} - ${emp.cargo}</option>`;
            });
        } catch (err) {
            console.error('Error al cargar empleados para memorandos:', err);
        }
    }

    async function cargarMemorandosHistorial() {
        try {
            const resp = await fetch('/memorandos/');
            memorandosData = await resp.json();
            renderizarTablaMemorandos(memorandosData);
            actualizarKPIsMemorandos(memorandosData);
        } catch (err) {
            console.error('Error al cargar historial de memorandos:', err);
            const tbody = document.getElementById('memorandosTablaBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar los memorandos.</td></tr>';
        }
    }

    function renderizarTablaMemorandos(data) {
        const tbody = document.getElementById('memorandosTablaBody');
        const sinResultados = document.getElementById('memorandosSinResultados');

        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = '';
            if (sinResultados) sinResultados.classList.remove('d-none');
            return;
        }
        if (sinResultados) sinResultados.classList.add('d-none');

        tbody.innerHTML = data.map(m => {
            const tipoBadge = `<span class="badge badge-memorando-${m.tipo_raw}">${m.tipo}</span>`;
            const btnDescarga = m.archivo_pdf
                ? `<a href="/memorandos/${m.id}/descargar/" class="btn btn-sm btn-primary-corporate" target="_blank" title="Descargar PDF">
                    <i class="bi bi-download"></i>
                  </a>`
                : `<span class="text-muted"><i class="bi bi-file-earmark-pdf"></i> Sin PDF</span>`;

            return `<tr>
                <td data-label="Consecutivo"><strong>${m.consecutivo}</strong></td>
                <td data-label="Empleado">${m.empleado}</td>
                <td data-label="Tipo">${tipoBadge}</td>
                <td data-label="Asunto">${m.asunto}</td>
                <td data-label="Fecha emisión">${new Date(m.fecha_emision).toLocaleString('es-CO')}</td>
                <td data-label="Generado por">${m.generado_por || '—'}</td>
                <td data-label="Acciones">${btnDescarga}</td>
            </tr>`;
        }).join('');
    }

    function actualizarKPIsMemorandos(data) {
        const ahora = new Date();
        const mes = ahora.getMonth();
        const año = ahora.getFullYear();
        const hoy = ahora.toDateString();

        const total = data.length;
        const esteMes = data.filter(m => {
            const f = new Date(m.fecha_emision);
            return f.getMonth() === mes && f.getFullYear() === año;
        }).length;
        const hoyCount = data.filter(m => {
            const f = new Date(m.fecha_emision);
            return f.toDateString() === hoy;
        }).length;

        const elTotal = document.getElementById('memorandosKpiTotal');
        const elMes = document.getElementById('memorandosKpiMes');
        const elHoy = document.getElementById('memorandosKpiHoy');

        if (elTotal) elTotal.innerText = total;
        if (elMes) elMes.innerText = esteMes;
        if (elHoy) elHoy.innerText = hoyCount;
    }

    function configurarFormularioMemorando() {
        const form = document.getElementById('memorandoForm');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const empleadoId = document.getElementById('memorandoEmpleado').value;
            const tipo = document.getElementById('memorandoTipo').value;
            const asunto = document.getElementById('memorandoAsunto').value.trim();
            const contenido = document.getElementById('memorandoContenido').value.trim();
            const mensajeDiv = document.getElementById('memorandoMensaje');

            if (!empleadoId) {
                mensajeDiv.innerHTML = `<div class="alert alert-warning">⚠️ Debes seleccionar un empleado.</div>`;
                return;
            }
            if (!tipo) {
                mensajeDiv.innerHTML = `<div class="alert alert-warning">⚠️ Debes seleccionar un tipo de memorando.</div>`;
                return;
            }
            if (!asunto) {
                mensajeDiv.innerHTML = `<div class="alert alert-warning">⚠️ El asunto es obligatorio.</div>`;
                return;
            }
            if (!contenido || contenido.length < 10) {
                mensajeDiv.innerHTML = `<div class="alert alert-warning">⚠️ El contenido debe tener al menos 10 caracteres.</div>`;
                return;
            }

            const btn = document.getElementById('memorandoBtnGenerar');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Generando...';

            try {
                const resp = await fetch('/memorandos/crear/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCSRFToken(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        empleado: empleadoId,
                        tipo: tipo,
                        asunto: asunto,
                        contenido: contenido
                    })
                });

                const data = await resp.json();

                if (resp.ok && data.status === 'ok') {
                    mensajeDiv.innerHTML = `
                        <div class="alert alert-success d-flex align-items-center gap-2">
                            <i class="bi bi-check-circle-fill fs-5"></i>
                            <div>
                                <strong>${data.mensaje}</strong><br>
                                <small>Consecutivo: ${data.consecutivo}</small>
                                ${data.archivo_pdf ? `<br><a href="${data.archivo_pdf}" target="_blank" class="text-success"><i class="bi bi-file-pdf"></i> Ver PDF</a>` : ''}
                            </div>
                        </div>
                    `;
                    form.reset();
                    await cargarMemorandosHistorial();
                } else {
                    mensajeDiv.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle-fill me-1"></i>
                            Error: ${data.error || 'No se pudo generar el memorando'}
                            ${data.detalles ? `<br><small>${JSON.stringify(data.detalles)}</small>` : ''}
                        </div>
                    `;
                }
            } catch (err) {
                console.error('Error al crear memorando:', err);
                mensajeDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle-fill me-1"></i>
                        Error de conexión. Inténtalo de nuevo.
                    </div>
                `;
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-file-pdf me-1"></i> Generar memorando';
            }
        });
    }

    async function initMemorandos() {
        await new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });

        const container = document.getElementById('memorandosTablaBody');
        if (!container) return;

        await cargarEmpleados();
        await cargarMemorandosHistorial();
        configurarFormularioMemorando();
    }

    if (document.readyState === 'complete') {
        initMemorandos();
    } else {
        window.addEventListener('load', initMemorandos);
    }

})();