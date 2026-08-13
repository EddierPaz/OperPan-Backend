// ============================================================
// NOVEDADES.JS - ADMIN (COMPLETO - CORREGIDO FINAL)
// Panel de administración de novedades - OperPan
// ============================================================

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

function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ============================================================
// FUNCIONES AUXILIARES PARA RENDERIZADO
// ============================================================
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function getEstadoClass(estado) {
    const map = {
        'pendiente': 'novedad-estado-pendiente',
        'aprobado': 'novedad-estado-aprobado',
        'rechazado': 'novedad-estado-rechazado'
    };
    return map[estado] || 'novedad-estado-pendiente';
}

function getEstadoLabel(estado) {
    const map = {
        'pendiente': 'Pendiente',
        'aprobado': 'Aprobado',
        'rechazado': 'Rechazado'
    };
    return map[estado] || estado;
}

// ============================================================
// RENDERIZAR DETALLE DE PERMISO (ADMIN) - CON ARCHIVO
// ============================================================
function renderPermisoDetalle(data) {
    const container = document.getElementById('permisosModalBody');
    if (!container) return;

    const estadoClass = getEstadoClass(data.estado);
    const estadoLabel = getEstadoLabel(data.estado);

    const fechaInicio = formatDate(data.fecha_inicio);
    const fechaFin = formatDate(data.fecha_fin);
    const fechaSolicitud = formatDate(data.fecha_solicitud);

    container.innerHTML = `
        <div class="novedad-detalle-grid">
            <div class="novedad-detalle-item">
                <span class="novedad-detalle-label">Estado</span>
                <span class="novedad-detalle-value">
                    <span class="novedad-detalle-estado ${estadoClass}">${estadoLabel}</span>
                </span>
            </div>
            <div class="novedad-detalle-item">
                <span class="novedad-detalle-label">Empleado</span>
                <span class="novedad-detalle-value">${data.empleado || '—'}</span>
            </div>
            <div class="novedad-detalle-item">
                <span class="novedad-detalle-label">Tipo</span>
                <span class="novedad-detalle-value">${data.tipo || '—'}</span>
            </div>
            <div class="novedad-detalle-item novedad-detalle-item-full">
                <span class="novedad-detalle-label">Período</span>
                <span class="novedad-detalle-value">
                    <i class="bi bi-calendar3 me-1"></i>
                    ${fechaInicio} → ${fechaFin}
                </span>
            </div>
            <div class="novedad-detalle-bloque-largo">
                <span class="novedad-detalle-bloque-largo-label">Justificación</span>
                <p class="novedad-detalle-bloque-largo-texto">${data.justificacion || 'Sin información adicional.'}</p>
            </div>
            <div class="novedad-detalle-item novedad-detalle-item-full">
                <span class="novedad-detalle-label">Fecha de solicitud</span>
                <span class="novedad-detalle-value">
                    <i class="bi bi-clock me-1"></i>
                    ${fechaSolicitud}
                </span>
            </div>
            ${data.archivo ? `
                <div class="novedad-detalle-bloque-largo">
                    <span class="novedad-detalle-bloque-largo-label">Archivo adjunto</span>
                    <p class="novedad-detalle-bloque-largo-texto">
                        <a href="${data.archivo}" target="_blank" class="btn btn-sm btn-primary-corporate">
                            <i class="bi bi-paperclip me-1"></i> Ver archivo
                        </a>
                    </p>
                </div>
            ` : ''}
            ${data.motivo_rechazo ? `
                <div class="novedad-detalle-bloque-largo" style="border-left: 3px solid #dc3545; background: #fff7f7;">
                    <span class="novedad-detalle-bloque-largo-label" style="color: #dc3545;">Motivo del rechazo</span>
                    <p class="novedad-detalle-bloque-largo-texto" style="color: #7f1d1d;">${data.motivo_rechazo}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================================
// RENDERIZAR DETALLE DE INCAPACIDAD (ADMIN) - CON ARCHIVO
// ============================================================
function renderIncapacidadDetalle(data) {
    const container = document.getElementById('incapacidadesModalBody');
    if (!container) return;

    const estadoClass = getEstadoClass(data.estado);
    const estadoLabel = getEstadoLabel(data.estado);

    const fechaInicio = formatDate(data.fecha_inicio);
    const fechaFin = formatDate(data.fecha_fin);
    const fechaSolicitud = formatDate(data.fecha_solicitud);

    container.innerHTML = `
        <div class="novedad-detalle-grid">
            <div class="novedad-detalle-item">
                <span class="novedad-detalle-label">Estado</span>
                <span class="novedad-detalle-value">
                    <span class="novedad-detalle-estado ${estadoClass}">${estadoLabel}</span>
                </span>
            </div>
            <div class="novedad-detalle-item">
                <span class="novedad-detalle-label">Empleado</span>
                <span class="novedad-detalle-value">${data.empleado || '—'}</span>
            </div>
            <div class="novedad-detalle-item">
                <span class="novedad-detalle-label">Título</span>
                <span class="novedad-detalle-value">${data.titulo || '—'}</span>
            </div>
            <div class="novedad-detalle-item novedad-detalle-item-full">
                <span class="novedad-detalle-label">Período</span>
                <span class="novedad-detalle-value">
                    <i class="bi bi-calendar3 me-1"></i>
                    ${fechaInicio} → ${fechaFin}
                </span>
            </div>
            <div class="novedad-detalle-bloque-largo">
                <span class="novedad-detalle-bloque-largo-label">Descripción</span>
                <p class="novedad-detalle-bloque-largo-texto">${data.descripcion || 'Sin información adicional.'}</p>
            </div>
            <div class="novedad-detalle-item novedad-detalle-item-full">
                <span class="novedad-detalle-label">Fecha de solicitud</span>
                <span class="novedad-detalle-value">
                    <i class="bi bi-clock me-1"></i>
                    ${fechaSolicitud}
                </span>
            </div>
            ${data.archivo ? `
                <div class="novedad-detalle-bloque-largo">
                    <span class="novedad-detalle-bloque-largo-label">Archivo adjunto</span>
                    <p class="novedad-detalle-bloque-largo-texto">
                        <a href="${data.archivo}" target="_blank" class="btn btn-sm btn-primary-corporate">
                            <i class="bi bi-paperclip me-1"></i> Ver archivo
                        </a>
                    </p>
                </div>
            ` : ''}
            ${data.motivo_rechazo ? `
                <div class="novedad-detalle-bloque-largo" style="border-left: 3px solid #dc3545; background: #fff7f7;">
                    <span class="novedad-detalle-bloque-largo-label" style="color: #dc3545;">Motivo del rechazo</span>
                    <p class="novedad-detalle-bloque-largo-texto" style="color: #7f1d1d;">${data.motivo_rechazo}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================================
// RENDERIZAR DETALLE DE CERTIFICADO (ADMIN) - SIN BLOQUE DE DESCARGA
// ============================================================
function renderCertificadoDetalle(data) {
    const container = document.getElementById('certificadosModalBody');
    if (!container) return;

    const estadoClass = getEstadoClass(data.estado);
    const estadoLabel = getEstadoLabel(data.estado);

    const fechaSolicitud = formatDate(data.fecha_solicitud);
    const fechaEmision = formatDate(data.fecha_emision);

    container.innerHTML = `
        <div class="novedad-detalle-grid">
            <div class="novedad-detalle-item">
                <span class="novedad-detalle-label">Estado</span>
                <span class="novedad-detalle-value">
                    <span class="novedad-detalle-estado ${estadoClass}">${estadoLabel}</span>
                </span>
            </div>
            <div class="novedad-detalle-item">
                <span class="novedad-detalle-label">Empleado</span>
                <span class="novedad-detalle-value">${data.empleado || '—'}</span>
            </div>
            <div class="novedad-detalle-item">
                <span class="novedad-detalle-label">Tipo</span>
                <span class="novedad-detalle-value">${data.tipo || '—'}</span>
            </div>
            <div class="novedad-detalle-item">
                <span class="novedad-detalle-label">Solicitado</span>
                <span class="novedad-detalle-value">
                    <i class="bi bi-calendar3 me-1"></i>
                    ${fechaSolicitud}
                </span>
            </div>
            ${data.fecha_emision ? `
                <div class="novedad-detalle-item">
                    <span class="novedad-detalle-label">Fecha de emisión</span>
                    <span class="novedad-detalle-value">
                        <i class="bi bi-check-circle me-1"></i>
                        ${fechaEmision}
                    </span>
                </div>
            ` : ''}
            <div class="novedad-detalle-bloque-largo">
                <span class="novedad-detalle-bloque-largo-label">Propósito</span>
                <p class="novedad-detalle-bloque-largo-texto">${data.proposito || 'Sin información adicional.'}</p>
            </div>
            ${data.dirigido_a ? `
                <div class="novedad-detalle-item novedad-detalle-item-full">
                    <span class="novedad-detalle-label">Dirigido a</span>
                    <span class="novedad-detalle-value">${data.dirigido_a}</span>
                </div>
            ` : ''}
            ${data.periodo ? `
                <div class="novedad-detalle-item novedad-detalle-item-full">
                    <span class="novedad-detalle-label">Período</span>
                    <span class="novedad-detalle-value">${data.periodo}</span>
                </div>
            ` : ''}
            ${data.archivo ? `
                <div class="novedad-detalle-bloque-largo">
                    <span class="novedad-detalle-bloque-largo-label">Archivo adjunto</span>
                    <p class="novedad-detalle-bloque-largo-texto">
                        <a href="${data.archivo}" target="_blank" class="btn btn-sm btn-primary-corporate">
                            <i class="bi bi-paperclip me-1"></i> Ver archivo
                        </a>
                    </p>
                </div>
            ` : ''}
            ${data.motivo_rechazo ? `
                <div class="novedad-detalle-bloque-largo" style="border-left: 3px solid #dc3545; background: #fff7f7;">
                    <span class="novedad-detalle-bloque-largo-label" style="color: #dc3545;">Motivo del rechazo</span>
                    <p class="novedad-detalle-bloque-largo-texto" style="color: #7f1d1d;">${data.motivo_rechazo}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================================
// EXPONER FUNCIONES GLOBALMENTE
// ============================================================
window.renderPermisoDetalle = renderPermisoDetalle;
window.renderIncapacidadDetalle = renderIncapacidadDetalle;
window.renderCertificadoDetalle = renderCertificadoDetalle;
window.formatDate = formatDate;
window.getEstadoClass = getEstadoClass;
window.getEstadoLabel = getEstadoLabel;
window.showMessage = showMessage;
window.getCSRFToken = getCSRFToken;
window.debounce = debounce;


// ============================================================
// CONTROL DE PESTAÑAS
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    const tabs = document.querySelectorAll('.novedades-tab');

    function activateTab(tab) {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabName = tab.dataset.tab;
        if (!tabName) return;

        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        const paneId = `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
        const pane = document.getElementById(paneId);
        if (pane) {
            pane.classList.add('active');
        }

        console.log(`📌 Pestaña activada: ${tabName}`);

        switch (tabName) {
            case 'permisos':
                break;
            case 'incapacidades':
                console.log('🔄 Cargando incapacidades...');
                if (typeof window.updateIncapKPIs === 'function') window.updateIncapKPIs();
                if (typeof window.renderIncapacidadesLista === 'function') window.renderIncapacidadesLista();
                if (typeof window.renderHistorialIncapacidades === 'function') window.renderHistorialIncapacidades();
                break;
            case 'certificados':
                console.log('🔄 Cargando certificados...');
                if (typeof window.actualizarKPICertificados === 'function') window.actualizarKPICertificados();
                if (typeof window.cargarCertificadosPendientes === 'function') window.cargarCertificadosPendientes();
                if (typeof window.renderCertificados === 'function') window.renderCertificados();
                break;
            case 'memorandos':
                break;
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            activateTab(this);
        });
    });

    const activeTab = document.querySelector('.novedades-tab.active');
    if (activeTab) {
        activateTab(activeTab);
    } else if (tabs.length > 0) {
        activateTab(tabs[0]);
    }
});


// ============================================================
// MÓDULO PERMISOS - CORREGIDO
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
                const accionesFooter = document.getElementById('permisosAccionesFooter');

                const estadoNormalizado = (data.estado || '').toLowerCase().trim();
                const esPendiente = estadoNormalizado === 'pendiente';

                console.log(`📌 Estado del permiso: "${data.estado}" → esPendiente: ${esPendiente}`);

                if (esPendiente) {
                    if (aprobarBtn) {
                        aprobarBtn.style.display = 'inline-flex';
                        console.log('✅ Botón Aprobar mostrado');
                    }
                    if (rechazarBtn) {
                        rechazarBtn.style.display = 'inline-flex';
                        console.log('✅ Botón Rechazar mostrado');
                    }
                    if (accionesFooter) {
                        accionesFooter.style.display = 'flex';
                        console.log('✅ Footer de acciones mostrado');
                    }
                } else {
                    if (aprobarBtn) aprobarBtn.style.display = 'none';
                    if (rechazarBtn) rechazarBtn.style.display = 'none';
                    if (accionesFooter) accionesFooter.style.display = 'none';
                    console.log('❌ Botones ocultados (no es pendiente)');
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
                const accionesFooter = document.getElementById('permisosAccionesFooter');

                if (aprobarBtn) aprobarBtn.style.display = 'none';
                if (rechazarBtn) rechazarBtn.style.display = 'none';
                if (accionesFooter) accionesFooter.style.display = 'none';

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

    updatePermisosKPIs();
    renderPermisosPendientes();
    renderPermisosHistorial();
})();


// ============================================================
// MÓDULO INCAPACIDADES - CORREGIDO
// ============================================================
(function () {
    let currentIncapId = null;

    window.updateIncapKPIs = function () {
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
    window.verDetalleIncapacidad = function (id) {
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
                const accionesFooter = document.getElementById('incapacidadesAccionesFooter');

                const estadoNormalizado = (data.estado || '').toLowerCase().trim();
                const esPendiente = estadoNormalizado === 'pendiente';

                console.log(`📌 Estado de la incapacidad: "${data.estado}" → esPendiente: ${esPendiente}`);

                if (esPendiente) {
                    if (aprobarBtn) {
                        aprobarBtn.style.display = 'inline-flex';
                        console.log('✅ Botón Aprobar mostrado');
                    }
                    if (rechazarBtn) {
                        rechazarBtn.style.display = 'inline-flex';
                        console.log('✅ Botón Rechazar mostrado');
                    }
                    if (accionesFooter) {
                        accionesFooter.style.display = 'flex';
                        console.log('✅ Footer de acciones mostrado');
                    }
                } else {
                    if (aprobarBtn) aprobarBtn.style.display = 'none';
                    if (rechazarBtn) rechazarBtn.style.display = 'none';
                    if (accionesFooter) accionesFooter.style.display = 'none';
                    console.log('❌ Botones ocultados (no es pendiente)');
                }

                const modal = new bootstrap.Modal(document.getElementById('incapacidadesDetalleModal'));
                modal.show();
            })
            .catch(() => showMessage('Error al cargar detalle de incapacidad'));
    };

    // ============================================================
    // VER DETALLE DESDE HISTORIAL (SOLO LECTURA - SIN BOTONES)
    // ============================================================
    window.verDetalleHistorialIncapacidad = function (id) {
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
                const accionesFooter = document.getElementById('incapacidadesAccionesFooter');

                if (aprobarBtn) aprobarBtn.style.display = 'none';
                if (rechazarBtn) rechazarBtn.style.display = 'none';
                if (accionesFooter) accionesFooter.style.display = 'none';

                const modal = new bootstrap.Modal(document.getElementById('incapacidadesDetalleModal'));
                modal.show();
            })
            .catch(() => showMessage('Error al cargar detalle de incapacidad'));
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
                    showMessage('Incapacidad aprobada.');
                    window.updateIncapKPIs();
                    window.renderIncapacidadesLista();
                    window.renderHistorialIncapacidades();
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
                    window.updateIncapKPIs();
                    window.renderIncapacidadesLista();
                    window.renderHistorialIncapacidades();
                } else {
                    showMessage('Error: ' + (data.error || 'No se pudo rechazar'));
                }
            })
            .catch(() => showMessage('Error de red al rechazar incapacidad'));
    }

    window.renderIncapacidadesLista = function () {
        const container = document.getElementById('incapacidadesListaContainer');
        if (!container) {
            console.warn('⚠️ Contenedor incapacidadesListaContainer no encontrado');
            return;
        }

        console.log('📋 Cargando incapacidades pendientes...');

        fetch('/novedades/incapacidades/pendientes/')
            .then(r => {
                if (!r.ok) throw new Error('Error al consultar incapacidades pendientes');
                return r.json();
            })
            .then(data => {
                const pendientes = Array.isArray(data) ? data : [];
                console.log(`📋 Incapacidades pendientes: ${pendientes.length}`);

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
                                    <button type="button" class="solicitud-btn-detalle" onclick="window.verDetalleIncapacidad(${i.id})">
                                        <i class="bi bi-eye me-1"></i> Ver detalles
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            })
            .catch(error => {
                console.error('Error al cargar la bandeja de incapacidades:', error);
                container.innerHTML = `
                    <div class="solicitudes-vacio text-center text-danger py-3">
                        <i class="bi bi-exclamation-triangle fs-2 mb-2 d-block"></i>
                        Error al cargar incapacidades pendientes.
                    </div>
                `;
            });
    };

    window.renderHistorialIncapacidades = function () {
        const estado = document.getElementById('incapacidadesFiltroEstado')?.value || '';
        const busqueda = (document.getElementById('buscarIncapacidad')?.value || document.getElementById('incapacidadesBuscarEmpleado')?.value || '').trim();

        const params = new URLSearchParams();
        if (estado && estado !== 'todas') params.append('estado', estado);
        if (busqueda) params.append('buscar', busqueda);

        console.log(`📋 Cargando historial de incapacidades con filtros: estado=${estado}, busqueda=${busqueda}`);

        fetch(`/novedades/incapacidades/historial/?${params.toString()}`)
            .then(r => {
                if (!r.ok) throw new Error('Error al consultar historial de incapacidades');
                return r.json();
            })
            .then(data => {
                const tbody = document.getElementById('incapacidadesHistorialBody');
                const sinResultados = document.getElementById('incapacidadesSinResultados');
                if (!tbody) {
                    console.warn('⚠️ Contenedor incapacidadesHistorialBody no encontrado');
                    return;
                }

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
                        <td data-label="Período">${i.fecha_inicio || '—'} → ${i.fecha_fin || '—'}</td>
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
            .catch(error => {
                console.error('Error al cargar historial de incapacidades:', error);
                const tbody = document.getElementById('incapacidadesHistorialBody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar historial</td></tr>';
                }
            });
    };

    // Eventos de modales
    document.getElementById('incapacidadesAprobarBtn')?.addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('incapacidadesDetalleModal'));
        modal?.hide();
        new bootstrap.Modal(document.getElementById('incapacidadesConfirmApproveModal')).show();
    });
    document.getElementById('incapacidadesConfirmApprove')?.addEventListener('click', () => {
        aprobarIncapacidad(currentIncapId);
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesConfirmApproveModal'))?.hide();
    });
    document.getElementById('incapacidadesRechazarBtn')?.addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('incapacidadesDetalleModal'));
        modal?.hide();
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

    // Inicializar
    window.updateIncapKPIs();
    window.renderIncapacidadesLista();
    window.renderHistorialIncapacidades();

    console.log('✅ Módulo Incapacidades inicializado');
})();


// ============================================================
// MÓDULO CERTIFICADOS - CORREGIDO FINAL CON DESCARGA
// ============================================================
(function () {
    let certificadoSeleccionadoId = null;

    window.actualizarKPICertificados = function () {
        fetch('/novedades/certificados/')
            .then(r => r.json())
            .then(data => {
                const ahora = new Date();
                const mesActual = ahora.getMonth();
                const añoActual = ahora.getFullYear();
                const pendientes = Array.isArray(data) ? data.filter(c => (c.estado || '').toLowerCase() === 'pendiente').length : 0;
                const aprobados = Array.isArray(data) ? data.filter(c => {
                    const estado = (c.estado || '').toLowerCase();
                    const fecha = c.fecha_emision ? new Date(c.fecha_emision) : (c.fecha_solicitud ? new Date(c.fecha_solicitud) : new Date());
                    return estado === 'aprobado' && fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
                }).length : 0;
                const rechazados = Array.isArray(data) ? data.filter(c => {
                    const estado = (c.estado || '').toLowerCase();
                    const fecha = c.fecha_emision ? new Date(c.fecha_emision) : (c.fecha_solicitud ? new Date(c.fecha_solicitud) : new Date());
                    return estado === 'rechazado' && fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
                }).length : 0;

                const kpiPendientes = document.getElementById('certificadosKpiPendientes');
                const kpiAprobadas = document.getElementById('certificadosKpiAprobadas');
                const kpiRechazadas = document.getElementById('certificadosKpiRechazadas');
                if (kpiPendientes) kpiPendientes.innerText = pendientes;
                if (kpiAprobadas) kpiAprobadas.innerText = aprobados;
                if (kpiRechazadas) kpiRechazadas.innerText = rechazados;

                console.log(`📊 Certificados KPIs: Pendientes=${pendientes}, Aprobados=${aprobados}, Rechazados=${rechazados}`);
            })
            .catch(error => console.error('Error al obtener KPIs de certificados:', error));
    };

    window.cargarCertificadosPendientes = function () {
        const container = document.getElementById('certificadosSolicitudesContainer');
        if (!container) {
            console.warn('⚠️ Contenedor certificadosSolicitudesContainer no encontrado');
            return;
        }

        console.log('📋 Cargando certificados pendientes...');

        fetch('/novedades/certificados/pendientes/')
            .then(r => {
                if (!r.ok) throw new Error(`Error HTTP: ${r.status}`);
                return r.json();
            })
            .then(data => {
                const pendientes = Array.isArray(data) ? data : [];
                console.log(`📋 Certificados pendientes: ${pendientes.length}`);

                if (pendientes.length === 0) {
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
                        ${pendientes.map(c => `
                            <div class="solicitud-card">
                                <div class="solicitud-header">
                                    <div class="solicitud-titulo">
                                        <i class="bi bi-flag-fill"></i>
                                        <span>${c.tipo || 'Certificado'}</span>
                                    </div>
                                </div>
                                <div class="solicitud-empleado">
                                    <i class="bi bi-person me-1"></i>
                                    <strong>${c.empleado || 'Empleado no disponible'}</strong>
                                </div>
                                <div class="solicitud-dato">
                                    <i class="bi bi-calendar3 me-1"></i>
                                    Solicitado: ${c.fecha_solicitud ? new Date(c.fecha_solicitud).toLocaleString('es-CO') : '—'}
                                </div>
                                <div class="solicitud-descripcion">
                                    ${c.proposito || 'Sin propósito especificado.'}
                                </div>
                                <div class="solicitud-footer mt-3">
                                    <button type="button" class="solicitud-btn-detalle" onclick="window.verDetalleCertificado(${c.id})">
                                        <i class="bi bi-eye me-1"></i> Ver detalles
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            })
            .catch(error => {
                console.error('Error cargando certificados pendientes:', error);
                container.innerHTML = `
                    <div class="text-center text-danger py-4">
                        <i class="bi bi-exclamation-circle fs-1 d-block mb-2"></i>
                        Error al cargar certificados pendientes.
                    </div>
                `;
            });
    };

    // ============================================================
    // FUNCIÓN AUXILIAR PARA MOSTRAR DETALLE DE CERTIFICADO - CORREGIDA
    // ============================================================
    function mostrarCertificadoDetalle(c, esHistorial) {
        const data = {
            ...c,
            empleado: c.empleado || c.empleado_nombre || 'Empleado no disponible',
            estado: c.estado || 'pendiente',
            archivo: c.archivo || c.archivo_url || null,
            tipo: c.tipo || '—',
            proposito: c.proposito || 'Sin información adicional.',
            dirigido_a: c.dirigido_a || null,
            periodo: c.periodo || null,
            fecha_solicitud: c.fecha_solicitud || null,
            fecha_emision: c.fecha_emision || null,
            motivo_rechazo: c.motivo_rechazo || null,
            url_descarga: c.url_descarga || `/novedades/certificados/${c.id}/descargar/`
        };

        renderCertificadoDetalle(data);

        const aprobarBtn = document.getElementById('certificadosAprobarBtn');
        const rechazarBtn = document.getElementById('certificadosRechazarBtn');
        const descargarBtn = document.getElementById('certificadosDescargarBtn');

        const estadoNormalizado = (data.estado || '').toLowerCase().trim();
        const esPendiente = estadoNormalizado === 'pendiente';
        const esAprobado = estadoNormalizado === 'aprobado';

        console.log(`📌 Estado del certificado: "${data.estado}" → esPendiente: ${esPendiente}, esAprobado: ${esAprobado}`);

        // ============================================================
        // BOTÓN DE DESCARGA - SOLO SI ESTÁ APROBADO
        // ============================================================
        if (esAprobado && descargarBtn) {
            descargarBtn.style.display = 'inline-flex';
            descargarBtn.onclick = function () {
                window.open(data.url_descarga, '_blank');
            };
            console.log('✅ Botón Descargar mostrado en footer');
        } else if (descargarBtn) {
            descargarBtn.style.display = 'none';
            console.log('❌ Botón Descargar ocultado');
        }

        // ============================================================
        // BOTONES DE APROBAR/RECHAZAR - SOLO SI ESTÁ PENDIENTE Y NO ES HISTORIAL
        // ============================================================
        if (!esHistorial && esPendiente) {
            if (aprobarBtn) {
                aprobarBtn.style.display = 'inline-flex';
                console.log('✅ Botón Aprobar mostrado');
            }
            if (rechazarBtn) {
                rechazarBtn.style.display = 'inline-flex';
                console.log('✅ Botón Rechazar mostrado');
            }
        } else {
            if (aprobarBtn) {
                aprobarBtn.style.display = 'none';
                console.log('❌ Botón Aprobar ocultado');
            }
            if (rechazarBtn) {
                rechazarBtn.style.display = 'none';
                console.log('❌ Botón Rechazar ocultado');
            }
        }

        // ============================================================
        // EL FOOTER SIEMPRE DEBE ESTAR VISIBLE
        // ============================================================
        const accionesFooter = document.getElementById('certificadosAccionesFooter');
        if (accionesFooter) {
            accionesFooter.style.display = 'flex';
        }

        const modal = new bootstrap.Modal(document.getElementById('certificadosDetalleModal'));
        modal.show();
    }

    // ============================================================
    // VER DETALLE DESDE BANDEJA (CON BOTONES APROBAR/RECHAZAR)
    // ============================================================
    window.verDetalleCertificado = async function (id) {
        certificadoSeleccionadoId = id;
        try {
            let resp = await fetch(`/novedades/certificados/${id}/`);
            if (!resp.ok) {
                resp = await fetch(`/novedades/certificados/${id}/detalle/`);
                if (!resp.ok) throw new Error('Error al obtener detalle del certificado');
            }
            const c = await resp.json();
            mostrarCertificadoDetalle(c, false);
        } catch (err) {
            console.error('Error obteniendo detalle:', err);
            showMessage('Error al cargar detalle del certificado');
        }
    };

    // ============================================================
    // VER DETALLE DESDE HISTORIAL (SOLO LECTURA - SIN BOTONES APROBAR/RECHAZAR)
    // ============================================================
    window.verDetalleHistorialCertificado = async function (id) {
        try {
            let resp = await fetch(`/novedades/certificados/${id}/`);
            if (!resp.ok) {
                resp = await fetch(`/novedades/certificados/${id}/detalle/`);
                if (!resp.ok) throw new Error('Error al obtener detalle del certificado');
            }
            const c = await resp.json();
            mostrarCertificadoDetalle(c, true);
        } catch (err) {
            console.error('Error obteniendo detalle:', err);
            showMessage('Error al cargar detalle del certificado');
        }
    };

    window.renderCertificados = function () {
        const tipoFiltro = (document.getElementById('certificadosFiltroTipo')?.value || '').toLowerCase().trim();
        const estadoFiltro = (document.getElementById('certificadosFiltroEstado')?.value || '').toLowerCase().trim();
        const busqueda = (document.getElementById('buscarCertificado')?.value || '').toLowerCase().trim();

        console.log(`📋 Cargando historial de certificados con filtros: tipo=${tipoFiltro}, estado=${estadoFiltro}, busqueda=${busqueda}`);

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

                if (!tbody) {
                    console.warn('⚠️ Contenedor certificadosTablaBody no encontrado');
                    return;
                }

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

                    let badgeEstado = '<span class="badge badge-pendiente">Pendiente</span>';
                    if (estadoVal === 'aprobado' || estadoVal === 'aprobada') {
                        badgeEstado = `<span class="badge badge-active">Aprobado</span>`;
                    } else if (estadoVal === 'rechazado' || estadoVal === 'rechazada') {
                        badgeEstado = `<span class="badge badge-rechazado">Rechazado</span>`;
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
                        <td data-label="Fecha">${fechaFormateada}</td>
                        <td data-label="Estado">${badgeEstado}</td>
                        <td data-label="Acciones">
                            <button class="btn btn-sm btn-primary-corporate" onclick="window.verDetalleHistorialCertificado(${certificado.id})" title="Ver detalles">
                                <i class="bi bi-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
                }).join('');
            })
            .catch(error => {
                console.error('Error al cargar certificados:', error);
                const tbody = document.getElementById('certificadosTablaBody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar certificados</td></tr>';
                }
            });
    };

    // ============================================================
    // EVENTOS DE CERTIFICADOS - CORREGIDOS
    // ============================================================

    // Botón Aprobar en el modal de detalle
    document.getElementById('certificadosAprobarBtn')?.addEventListener('click', function () {
        console.log('🔘 Click en Aprobar Certificado');
        const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('certificadosDetalleModal'));
        if (modalDetalle) {
            modalDetalle.hide();
        }
        const modalConfirm = new bootstrap.Modal(document.getElementById('certificadosConfirmApproveModal'));
        modalConfirm.show();
    });

    // Botón Confirmar Aprobar
    document.getElementById('certificadosConfirmApprove')?.addEventListener('click', async function () {
        console.log('🔘 Click en Confirmar Aprobar Certificado');
        if (!certificadoSeleccionadoId) {
            showMessage('❌ No hay certificado seleccionado.');
            return;
        }
        try {
            const resp = await fetch(`/novedades/certificados/${certificadoSeleccionadoId}/aprobar/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });
            const data = await resp.json();

            const modal = bootstrap.Modal.getInstance(document.getElementById('certificadosConfirmApproveModal'));
            if (modal) modal.hide();

            if (resp.ok && data.status === 'ok') {
                showMessage('✅ Certificado aprobado correctamente.');
                window.cargarCertificadosPendientes();
                window.renderCertificados();
                window.actualizarKPICertificados();
            } else {
                showMessage('❌ Error: ' + (data.error || 'No se pudo aprobar el certificado'));
            }
        } catch (err) {
            console.error('Error aprobando certificado:', err);
            showMessage('❌ Error de red al aprobar certificado');
        }
    });

    // Botón Rechazar en el modal de detalle
    document.getElementById('certificadosRechazarBtn')?.addEventListener('click', function () {
        console.log('🔘 Click en Rechazar Certificado');
        const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('certificadosDetalleModal'));
        if (modalDetalle) {
            modalDetalle.hide();
        }
        const modalReject = new bootstrap.Modal(document.getElementById('certificadosRejectModal'));
        modalReject.show();
    });

    // Botón Confirmar Rechazar
    document.getElementById('certificadosConfirmReject')?.addEventListener('click', async function () {
        console.log('🔘 Click en Confirmar Rechazar Certificado');
        if (!certificadoSeleccionadoId) {
            showMessage('❌ No hay certificado seleccionado.');
            return;
        }
        const motivo = document.getElementById('certificadosRejectReason').value.trim();
        if (!motivo) {
            showMessage('❌ Debes indicar un motivo de rechazo.');
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

            const modal = bootstrap.Modal.getInstance(document.getElementById('certificadosRejectModal'));
            if (modal) modal.hide();
            document.getElementById('certificadosRejectReason').value = '';

            if (resp.ok && data.status === 'ok') {
                showMessage('✅ Certificado rechazado.');
                window.cargarCertificadosPendientes();
                window.renderCertificados();
                window.actualizarKPICertificados();
            } else {
                showMessage('❌ Error: ' + (data.error || 'No se pudo rechazar el certificado'));
            }
        } catch (err) {
            console.error('Error rechazando certificado:', err);
            showMessage('❌ Error de red al rechazar certificado');
        }
    });

    // Filtros
    document.getElementById('buscarCertificado')?.addEventListener('input', debounce(window.renderCertificados, 300));
    document.getElementById('certificadosFiltroTipo')?.addEventListener('change', window.renderCertificados);
    document.getElementById('certificadosFiltroEstado')?.addEventListener('change', window.renderCertificados);

    document.getElementById('certificadosBtnLimpiar')?.addEventListener('click', () => {
        const buscar = document.getElementById('buscarCertificado');
        const tipo = document.getElementById('certificadosFiltroTipo');
        const estado = document.getElementById('certificadosFiltroEstado');
        if (buscar) buscar.value = '';
        if (tipo) tipo.value = '';
        if (estado) estado.value = '';
        window.renderCertificados();
    });

    // Inicializar
    window.actualizarKPICertificados();
    window.cargarCertificadosPendientes();
    window.renderCertificados();

    console.log('✅ Módulo Certificados inicializado');
})();


// ============================================================
// MÓDULO MEMORANDOS
// ============================================================
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
            const tipoBadge = `<span class="badge text-dark badge-memorando-${m.tipo_raw}">${m.tipo}</span>`;
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

console.log('✅ Novedades.js (completo - corregido final) cargado correctamente');