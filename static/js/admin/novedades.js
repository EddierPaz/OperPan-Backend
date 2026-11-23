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

function showMessage(msg, tipo = 'success') {
    const texto = String(msg || '');
    const textoNormalizado = texto.toLowerCase();
    if (textoNormalizado.includes('error') ||
        textoNormalizado.includes('no se pudo') ||
        textoNormalizado.includes('no puede') ||
        textoNormalizado.includes('falta') ||
        textoNormalizado.includes('debe ')) {
        tipo = 'danger';
    } else if (textoNormalizado.includes('rechaz')) {
        tipo = 'warning';
    }
    if (typeof window.mostrarNotificacion === 'function') {
        window.mostrarNotificacion(texto, tipo);
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
// RENDERIZAR DETALLE DE SOLICITUD (ADMIN) - CON ARCHIVO
// ============================================================
function renderSolicitudDetalle(data) {
    const container = document.getElementById('solicitudesModalBody');
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
                </div>` : ''}
            ${data.motivo_rechazo ? `
                <div class="novedad-detalle-bloque-largo" style="border-left: 3px solid #dc3545; background: #fff7f7;">
                    <span class="novedad-detalle-bloque-largo-label" style="color: #dc3545;">Motivo del rechazo</span>
                    <p class="novedad-detalle-bloque-largo-texto" style="color: #7f1d1d;">${data.motivo_rechazo}</p>
                </div>
                </div>` : ''}
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
                </div>` : ''}
            ${data.motivo_rechazo ? `
                <div class="novedad-detalle-bloque-largo" style="border-left: 3px solid #dc3545; background: #fff7f7;">
                    <span class="novedad-detalle-bloque-largo-label" style="color: #dc3545;">Motivo del rechazo</span>
                    <p class="novedad-detalle-bloque-largo-texto" style="color: #7f1d1d;">${data.motivo_rechazo}</p>
                </div>` : ''}
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
                </div>` : ''}
            <div class="novedad-detalle-bloque-largo">
                <span class="novedad-detalle-bloque-largo-label">Propósito</span>
                <p class="novedad-detalle-bloque-largo-texto">${data.proposito || 'Sin información adicional.'}</p>
            </div>
            ${data.dirigido_a ? `
                <div class="novedad-detalle-item novedad-detalle-item-full">
                    <span class="novedad-detalle-label">Dirigido a</span>
                    <span class="novedad-detalle-value">${data.dirigido_a}</span>
                </div>` : ''}
            ${data.periodo ? `
                <div class="novedad-detalle-item novedad-detalle-item-full">
                    <span class="novedad-detalle-label">Período</span>
                    <span class="novedad-detalle-value">${data.periodo}</span>
                </div>
                </div>` : ''}
            ${data.archivo ? `
                <div class="novedad-detalle-bloque-largo">
                    <span class="novedad-detalle-bloque-largo-label">Archivo adjunto</span>
                    <p class="novedad-detalle-bloque-largo-texto">
                        <a href="${data.archivo}" target="_blank" class="btn btn-sm btn-primary-corporate">
                            <i class="bi bi-paperclip me-1"></i> Ver archivo
                        </a>
                    </p>
                </div>` : ''}
                </div>
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
window.renderSolicitudDetalle = renderSolicitudDetalle;
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
            case 'solicitudes':
                if (typeof window.updateSolicitudesKPIs === 'function') window.updateSolicitudesKPIs();
                if (typeof window.renderSolicitudesPendientes === 'function') window.renderSolicitudesPendientes();
                if (typeof window.renderSolicitudesHistorial === 'function') window.renderSolicitudesHistorial();
                break;
            case 'incapacidades':
                if (typeof window.updateIncapKPIs === 'function') window.updateIncapKPIs();
                if (typeof window.renderIncapacidadesLista === 'function') window.renderIncapacidadesLista();
                if (typeof window.renderHistorialIncapacidades === 'function') window.renderHistorialIncapacidades();
                break;
            case 'certificados':
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
// MÓDULO SOLICITUDES
// ============================================================
(function () {
    let currentSolicitudId = null;

    window.updateSolicitudesKPIs = function () {
        fetch('/novedades/solicitudes/historial/estado=pendiente')
            .then(r => r.json())
            .then(data => {
                const pendingEl = document.getElementById('solicitudesKpiPendientes');
                if (pendingEl) pendingEl.innerText = data.length;
            })
            .catch(() => console.error('Error al obtener KPIs de solicitudes'));

        fetch('/novedades/solicitudes/historial/')
            .then(r => r.json())
            .then(data => {
                const now = new Date();
                const mes = now.getMonth();
                const año = now.getFullYear();
                const aprobados = data.filter(p => (p.estado || '').toLowerCase() === 'aprobado' && new Date(p.fecha_solicitud).getMonth() === mes && new Date(p.fecha_solicitud).getFullYear() === año).length;
                const rechazados = data.filter(p => (p.estado || '').toLowerCase() === 'rechazado' && new Date(p.fecha_solicitud).getMonth() === mes && new Date(p.fecha_solicitud).getFullYear() === año).length;

                const aprobadosEl = document.getElementById('solicitudesKpiAprobados');
                const rechazadosEl = document.getElementById('solicitudesKpiRechazados');
                if (aprobadosEl) aprobadosEl.innerText = aprobados;
                if (rechazadosEl) rechazadosEl.innerText = rechazados;
            })
            .catch(() => console.error('Error al obtener KPIs de solicitudes'));
    };

    window.renderSolicitudesPendientes = function () {
        fetch('/novedades/solicitudes/pendientes/')
            .then(r => r.json())
            .then(data => {
                const container = document.getElementById('solicitudesNovedadesContainer');
                if (!container) return;

                if (!data.length) {
                    container.innerHTML = `
                        <div class="solicitudes-vacio text-center text-muted py-3">
                            <i class="bi bi-inbox fs-2 mb-2 d-block"></i>
                            No hay solicitudes pendientes por revisar.
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
                                        <span>${p.tipo || 'Solicitud'}</span>
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
${p.justificacion? p.justificacion.substring(0, 80) : 'Sin justificación especificada.'}
                                </div>
                                <div class="solicitud-footer mt-3">
                                    <button class="solicitud-btn-detalle verSolicitudBtn" data-id="${p.id}">
                                        <i class="bi bi-eye me-1"></i> Ver detalles
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                container.innerHTML = html;
                document.querySelectorAll('.verSolicitudBtn').forEach(btn => {
                    btn.addEventListener('click', () => verDetalleSolicitud(btn.dataset.id));
                });
            })
            .catch(() => console.error('Error al cargar solicitudes pendientes'));
    };

    function verDetalleSolicitud(id) {
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
                renderSolicitudDetalle(data);

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
    }

    function verDetalleHistorialSolicitud(id) {
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
    }

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
                    showMessage('Solicitud aprobada correctamente.', 'success');
                    window.updateSolicitudesKPIs();
                    window.renderSolicitudesPendientes();
                    window.renderSolicitudesHistorial();
                } else {
                    showMessage('Error: ' + (data.error || 'No se pudo aprobar'), 'danger');
                }
            })
            .catch(() => showMessage('Error de red al aprobar solicitud', 'danger'));
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
                    showMessage('Solicitud rechazada.', 'warning');
                    window.updateSolicitudesKPIs();
                    window.renderSolicitudesPendientes();
                    window.renderSolicitudesHistorial();
                } else {
                    showMessage('Error: ' + (data.error || 'No se pudo rechazar'), 'danger');
                }
            })
            .catch(() => showMessage('Error de red al rechazar solicitud', 'danger'));
    }

    window.renderSolicitudesHistorial = function () {
        const estado = document.getElementById('solicitudesFiltroEstado').value || '';
        const busqueda = (document.getElementById('buscarSolicitudes').value || '').trim();

        const params = new URLSearchParams();
        if (estado && estado !== 'todas') params.append('estado', estado);
        if (busqueda) params.append('buscar', busqueda);

        fetch(`/novedades/solicitudes/historial/${params.toString()}`)
            .then(r => r.json())
            .then(data => {
                const tbody = document.getElementById('solicitudesHistorialBody');
                const sinResultados = document.getElementById('solicitudesSinResultados');
                if (!tbody) return;

let historial = Array.isArray(data)? data : [];

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
<td data-label="Fecha solicitud">${p.fecha_solicitud? new Date(p.fecha_solicitud).toLocaleString('es-CO') : '—'}</td>
                        <td data-label="Empleado"><strong>${p.empleado || '—'}</strong></td>
                        <td data-label="Tipo">${p.tipo || '—'}</td>
                        <td data-label="Fechas">${p.fecha_inicio || '—'} → ${p.fecha_fin || '—'}</td>
                        <td data-label="Estado">${badge}</td>
                        <td data-label="Aprobado por">${p.decision_por || p.aprobado_por || '—'}</td>
                        <td data-label="Acciones">
                            <button class="btn btn-sm btn-primary-corporate verHistorialSolicitudBtn" data-id="${p.id}" title="Ver detalles">
                                <i class="bi bi-eye"></i> 
                            </button>
                        </td>
                    </tr>`;
                }).join('');

                document.querySelectorAll('.verHistorialSolicitudBtn').forEach(btn => {
                    btn.addEventListener('click', () => verDetalleHistorialSolicitud(btn.dataset.id));
                });
            })
            .catch(error => console.error('Error al cargar historial de solicitudes:', error));
    };

    // Eventos de modales de solicitudes
    document.getElementById('solicitudesAprobarBtn').addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('solicitudesDetalleModal'));
        modal.hide();
        new bootstrap.Modal(document.getElementById('solicitudesConfirmApproveModal')).show();
    });
    document.getElementById('solicitudesConfirmApprove').addEventListener('click', () => {
        aprobarSolicitud(currentSolicitudId);
        bootstrap.Modal.getInstance(document.getElementById('solicitudesConfirmApproveModal')).hide();
    });
    
    // Al hacer click en rechazar, abrimos directamente el modal de motivo (ajustado a tu HTML)
    document.getElementById('solicitudesRechazarBtn').addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('solicitudesDetalleModal')).hide();
        new bootstrap.Modal(document.getElementById('solicitudesRejectModal')).show();
    });
    
    document.getElementById('solicitudesConfirmReject').addEventListener('click', () => {
        const reason = document.getElementById('solicitudesRejectReason').value.trim();
        if (!reason) {
            showMessage('Debe ingresar un motivo de rechazo.', 'warning');
            return;
        }
        rechazarSolicitud(currentSolicitudId, reason);
        bootstrap.Modal.getInstance(document.getElementById('solicitudesRejectModal')).hide();
    });

    // Eventos de Filtro y Búsqueda
    document.getElementById('solicitudesFiltroEstado').addEventListener('change', window.renderSolicitudesHistorial);
    document.getElementById('buscarSolicitudes').addEventListener('input', debounce(window.renderSolicitudesHistorial, 300));
    document.getElementById('solicitudesBtnLimpiar').addEventListener('click', () => {
        const inputBuscar = document.getElementById('buscarSolicitudes');
        const selectEstado = document.getElementById('solicitudesFiltroEstado');
        if (inputBuscar) inputBuscar.value = '';
        if (selectEstado) selectEstado.value = '';
        window.renderSolicitudesHistorial();
    });

    // Inicializar Módulo
    window.updateSolicitudesKPIs();
    window.renderSolicitudesPendientes();
    window.renderSolicitudesHistorial();
})();


// ============================================================
// MÓDULO INCAPACIDADES
// ============================================================
(function () {
    let currentIncapId = null;

    window.updateIncapKPIs = function () {
        fetch('/novedades/incapacidades/historial/estado=pendiente')
            .then(r => r.json())
            .then(data => {
                const pendingEl = document.getElementById('incapacidadesKpiPendientes');
if (pendingEl) pendingEl.innerText = Array.isArray(data)? data.length : 0;
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
const fecha = i.fecha_solicitud? new Date(i.fecha_solicitud) : new Date();
                    return estado === 'aprobado' && fecha.getMonth() === mes && fecha.getFullYear() === año;
                }).length : 0;
                const rechazadas = Array.isArray(data) ? data.filter(i => {
                    const estado = (i.estado || '').toLowerCase();
const fecha = i.fecha_solicitud? new Date(i.fecha_solicitud) : new Date();
                    return estado === 'rechazado' && fecha.getMonth() === mes && fecha.getFullYear() === año;
                }).length : 0;

                const aprobadasEl = document.getElementById('incapacidadesKpiAprobadas');
                const rechazadasEl = document.getElementById('incapacidadesKpiRechazadas');
                if (aprobadasEl) aprobadasEl.innerText = aprobadas;
                if (rechazadasEl) rechazadasEl.innerText = rechazadas;
            })
            .catch(() => console.error('Error al obtener KPIs de incapacidades'));
    };

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

                if (esPendiente) {
                    if (aprobarBtn) aprobarBtn.style.display = 'inline-flex';
                    if (rechazarBtn) rechazarBtn.style.display = 'inline-flex';
                    if (accionesFooter) accionesFooter.style.display = 'flex';
                } else {
                    if (aprobarBtn) aprobarBtn.style.display = 'none';
                    if (rechazarBtn) rechazarBtn.style.display = 'none';
                    if (accionesFooter) accionesFooter.style.display = 'none';
                }

                const modal = new bootstrap.Modal(document.getElementById('incapacidadesDetalleModal'));
                modal.show();
            })
            .catch(() => showMessage('Error al cargar detalle de incapacidad'));
    };

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
                    showMessage('Incapacidad aprobada.', 'success');
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
                    showMessage('Incapacidad rechazada.', 'warning');
                    window.updateIncapKPIs();
                    window.renderIncapacidadesLista();
                    window.renderHistorialIncapacidades();
                } else {
                    showMessage('Error: ' + (data.error || 'No se pudo rechazar'), 'danger');
                }
            })
            .catch(() => showMessage('Error de red al rechazar incapacidad', 'danger'));
    }

    window.renderIncapacidadesLista = function () {
        const container = document.getElementById('incapacidadesListaContainer');
        if (!container) return;

        fetch('/novedades/incapacidades/pendientes/')
            .then(r => r.json())
            .then(data => {
const pendientes = Array.isArray(data)? data : [];

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
                container.innerHTML = `<div class="solicitudes-vacio text-center text-danger py-3"><i class="bi bi-exclamation-triangle fs-2 mb-2 d-block"></i>Error al cargar incapacidades pendientes.</div>`;
            });
    };

    window.renderHistorialIncapacidades = function () {
        const estado = document.getElementById('incapacidadesFiltroEstado').value || '';
        const busqueda = (document.getElementById('buscarIncapacidad').value || '').trim();

        const params = new URLSearchParams();
        if (estado && estado !== 'todas') params.append('estado', estado);
        if (busqueda) params.append('buscar', busqueda);

        fetch(`/novedades/incapacidades/historial/${params.toString()}`)
            .then(r => r.json())
            .then(data => {
                const tbody = document.getElementById('incapacidadesHistorialBody');
                const sinResultados = document.getElementById('incapacidadesSinResultados');
                if (!tbody) return;

let historial = Array.isArray(data)? data : [];

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
<td data-label="Fecha solicitud">${i.fecha_solicitud? new Date(i.fecha_solicitud).toLocaleString('es-CO') : '—'}</td>
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
            .catch(error => console.error('Error al cargar historial de incapacidades:', error));
    };

    // Eventos de modales
    document.getElementById('incapacidadesAprobarBtn').addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesDetalleModal')).hide();
        new bootstrap.Modal(document.getElementById('incapacidadesConfirmApproveModal')).show();
    });
    document.getElementById('incapacidadesConfirmApprove').addEventListener('click', () => {
        aprobarIncapacidad(currentIncapId);
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesConfirmApproveModal')).hide();
    });
    document.getElementById('incapacidadesRechazarBtn').addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesDetalleModal')).hide();
        new bootstrap.Modal(document.getElementById('incapacidadesRejectModal')).show();
    });
    document.getElementById('incapacidadesConfirmReject').addEventListener('click', () => {
        const reason = document.getElementById('incapacidadesRejectReason').value.trim();
        if (!reason) {
            showMessage('Debe ingresar un motivo de rechazo.', 'warning');
            return;
        }
        rechazarIncapacidad(currentIncapId, reason);
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesRejectModal')).hide();
    });

    // Filtros
    document.getElementById('incapacidadesFiltroEstado').addEventListener('change', window.renderHistorialIncapacidades);
    document.getElementById('buscarIncapacidad').addEventListener('input', debounce(window.renderHistorialIncapacidades, 300));
    document.getElementById('incapacidadesBtnLimpiar').addEventListener('click', () => {
        const inputBuscar = document.getElementById('buscarIncapacidad');
        const selectEstado = document.getElementById('incapacidadesFiltroEstado');
        if (inputBuscar) inputBuscar.value = '';
        if (selectEstado) selectEstado.value = '';
        window.renderHistorialIncapacidades();
    });

    // Inicializar
    window.updateIncapKPIs();
    window.renderIncapacidadesLista();
    window.renderHistorialIncapacidades();
})();


// ============================================================
// MÓDULO CERTIFICADOS
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
const pendientes = Array.isArray(data)? data.filter(c => (c.estado || '').toLowerCase() === 'pendiente').length : 0;
                const aprobados = Array.isArray(data) ? data.filter(c => {
                    const estado = (c.estado || '').toLowerCase();
const fecha = c.fecha_emision? new Date(c.fecha_emision) : (c.fecha_solicitud? new Date(c.fecha_solicitud) : new Date());
                    return estado === 'aprobado' && fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
                }).length : 0;
                const rechazados = Array.isArray(data) ? data.filter(c => {
                    const estado = (c.estado || '').toLowerCase();
const fecha = c.fecha_emision? new Date(c.fecha_emision) : (c.fecha_solicitud? new Date(c.fecha_solicitud) : new Date());
                    return estado === 'rechazado' && fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
                }).length : 0;

                const kpiPendientes = document.getElementById('certificadosKpiPendientes');
                const kpiAprobadas = document.getElementById('certificadosKpiAprobadas');
                const kpiRechazadas = document.getElementById('certificadosKpiRechazadas');
                if (kpiPendientes) kpiPendientes.innerText = pendientes;
                if (kpiAprobadas) kpiAprobadas.innerText = aprobados;
                if (kpiRechazadas) kpiRechazadas.innerText = rechazados;
            })
            .catch(error => console.error('Error al obtener KPIs de certificados:', error));
    };

    window.cargarCertificadosPendientes = function () {
        const container = document.getElementById('certificadosSolicitudesContainer');
        if (!container) return;

        fetch('/novedades/certificados/pendientes/')
            .then(r => r.json())
            .then(data => {
const pendientes = Array.isArray(data)? data : [];

                if (pendientes.length === 0) {
                    container.innerHTML = `<div class="text-center text-muted py-4"><i class="bi bi-inbox fs-1 d-block mb-2"></i>No hay certificados pendientes.</div>`;
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
Solicitado: ${c.fecha_solicitud? new Date(c.fecha_solicitud).toLocaleString('es-CO') : '—'}
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
                container.innerHTML = `<div class="text-center text-danger py-4"><i class="bi bi-exclamation-circle fs-1 d-block mb-2"></i>Error al cargar certificados pendientes.</div>`;
            });
    };

    function mostrarCertificadoDetalle(c, esHistorial) {
        const data = {
            ...c,
            empleado: c.empleado || 'Empleado no disponible',
            estado: c.estado || 'pendiente',
            archivo: c.archivo || null,
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

        if (esAprobado && descargarBtn) {
            descargarBtn.style.display = 'inline-flex';
            descargarBtn.onclick = function () { window.open(data.url_descarga, '_blank'); };
        } else if (descargarBtn) {
            descargarBtn.style.display = 'none';
        }

        if (!esHistorial && esPendiente) {
            if (aprobarBtn) aprobarBtn.style.display = 'inline-flex';
            if (rechazarBtn) rechazarBtn.style.display = 'inline-flex';
        } else {
            if (aprobarBtn) aprobarBtn.style.display = 'none';
            if (rechazarBtn) rechazarBtn.style.display = 'none';
        }

        const accionesFooter = document.getElementById('certificadosAccionesFooter');
        if (accionesFooter) accionesFooter.style.display = 'flex';

        const modal = new bootstrap.Modal(document.getElementById('certificadosDetalleModal'));
        modal.show();
    }

    window.verDetalleCertificado = async function (id) {
        certificadoSeleccionadoId = id;
        try {
            const resp = await fetch(`/novedades/certificados/${id}/`);
            const c = await resp.json();
            mostrarCertificadoDetalle(c, false);
        } catch (err) {
            showMessage('Error al cargar detalle del certificado');
        }
    };

    window.verDetalleHistorialCertificado = async function (id) {
        try {
            const resp = await fetch(`/novedades/certificados/${id}/`);
            const c = await resp.json();
            mostrarCertificadoDetalle(c, true);
        } catch (err) {
            showMessage('Error al cargar detalle del certificado');
        }
    };

    window.renderCertificados = function () {
        const tipoFiltro = (document.getElementById('certificadosFiltroTipo').value || '').toLowerCase().trim();
        const estadoFiltro = (document.getElementById('certificadosFiltroEstado').value || '').toLowerCase().trim();
        const busqueda = (document.getElementById('buscarCertificado').value || '').toLowerCase().trim();

        fetch('/novedades/certificados/')
            .then(response => response.json())
            .then(data => {
let certificados = Array.isArray(data)? data : [];

                if (busqueda) {
                    certificados = certificados.filter(c => 
                        [c.empleado, c.documento, c.usuario, c.nombre, c.cargo, c.tipo]
                        .filter(v => v).join(' ').toLowerCase().includes(busqueda)
                    );
                }
                if (tipoFiltro) certificados = certificados.filter(c => (c.tipo || '').toLowerCase().trim() === tipoFiltro);
                if (estadoFiltro) certificados = certificados.filter(c => (c.estado || '').toLowerCase().trim() === estadoFiltro);

                const tbody = document.getElementById('certificadosTablaBody');
                const sinResultados = document.getElementById('certificadosSinResultados');
                if (!tbody) return;

                if (certificados.length === 0) {
                    tbody.innerHTML = '';
                    if (sinResultados) sinResultados.classList.remove('d-none');
                    return;
                }
                if (sinResultados) sinResultados.classList.add('d-none');

                tbody.innerHTML = certificados.map(c => {
                    const estadoVal = (c.estado || 'Pendiente').toLowerCase().trim();
                    let badge = '<span class="badge badge-pendiente">Pendiente</span>';
                    if (estadoVal === 'aprobado') badge = `<span class="badge badge-active">Aprobado</span>`;
                    else if (estadoVal === 'rechazado') badge = `<span class="badge badge-rechazado">Rechazado</span>`;

const fechaMostrar = (estadoVal === 'aprobado')? (c.fecha_emision || c.fecha_decision) : c.fecha_solicitud;
const fechaFormateada = fechaMostrar? new Date(fechaMostrar).toLocaleString('es-CO') : '—';

                    return `<tr>
                        <td data-label="Empleado"><strong>${c.empleado || '—'}</strong></td>
                        <td data-label="Cargo">${c.cargo || '—'}</td>
                        <td data-label="Tipo de certificado">${c.tipo || '—'}</td>
                        <td data-label="Fecha">${fechaFormateada}</td>
                        <td data-label="Estado">${badge}</td>
                        <td data-label="Acciones">
                            <button class="btn btn-sm btn-primary-corporate" onclick="window.verDetalleHistorialCertificado(${c.id})" title="Ver detalles">
                                <i class="bi bi-eye"></i>
                            </button>
                        </td>
                    </tr>`;
                }).join('');
            })
            .catch(error => console.error('Error al cargar certificados:', error));
    };

    // Eventos de certificados
    document.getElementById('certificadosAprobarBtn').addEventListener('click', function () {
        bootstrap.Modal.getInstance(document.getElementById('certificadosDetalleModal')).hide();
        new bootstrap.Modal(document.getElementById('certificadosConfirmApproveModal')).show();
    });
    document.getElementById('certificadosConfirmApprove').addEventListener('click', async function () {
        if (!certificadoSeleccionadoId) return;
        try {
            const resp = await fetch(`/novedades/certificados/${certificadoSeleccionadoId}/aprobar/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': getCSRFToken(), 'Content-Type': 'application/json' }
            });
            const data = await resp.json();
            bootstrap.Modal.getInstance(document.getElementById('certificadosConfirmApproveModal')).hide();
            if (resp.ok && data.status === 'ok') {
                showMessage('Certificado aprobado correctamente.', 'success');
                window.cargarCertificadosPendientes();
                window.renderCertificados();
                window.actualizarKPICertificados();
            } else {
                showMessage('Error: ' + (data.error || 'No se pudo aprobar'));
            }
        } catch (err) { showMessage('Error de red'); }
    });

    document.getElementById('certificadosRechazarBtn').addEventListener('click', function () {
        bootstrap.Modal.getInstance(document.getElementById('certificadosDetalleModal')).hide();
        new bootstrap.Modal(document.getElementById('certificadosRejectModal')).show();
    });
    document.getElementById('certificadosConfirmReject').addEventListener('click', async function () {
        if (!certificadoSeleccionadoId) return;
        const motivo = document.getElementById('certificadosRejectReason').value.trim();
        if (!motivo) { showMessage('Debe indicar un motivo.'); return; }

        try {
            const resp = await fetch(`/novedades/certificados/${certificadoSeleccionadoId}/rechazar/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': getCSRFToken(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo: motivo })
            });
            const data = await resp.json();
            bootstrap.Modal.getInstance(document.getElementById('certificadosRejectModal')).hide();
            document.getElementById('certificadosRejectReason').value = '';
            if (resp.ok && data.status === 'ok') {
                showMessage('Certificado rechazado.', 'warning');
                window.cargarCertificadosPendientes();
                window.renderCertificados();
                window.actualizarKPICertificados();
            } else {
                showMessage('Error: ' + (data.error || 'No se pudo rechazar'), 'danger');
            }
        } catch (err) { showMessage('Error de red'); }
    });

    document.getElementById('buscarCertificado').addEventListener('input', debounce(window.renderCertificados, 300));
    document.getElementById('certificadosFiltroTipo').addEventListener('change', window.renderCertificados);
    document.getElementById('certificadosFiltroEstado').addEventListener('change', window.renderCertificados);
    document.getElementById('certificadosBtnLimpiar').addEventListener('click', () => {
        document.getElementById('buscarCertificado').value = '';
        document.getElementById('certificadosFiltroTipo').value = '';
        document.getElementById('certificadosFiltroEstado').value = '';
        window.renderCertificados();
    });

    window.actualizarKPICertificados();
    window.cargarCertificadosPendientes();
    window.renderCertificados();
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
        } catch (err) { console.error('Error al cargar empleados:', err); }
    }

    async function cargarMemorandosHistorial() {
        try {
            const resp = await fetch('/memorandos/');
            memorandosData = await resp.json();
            renderizarTablaMemorandos(memorandosData);
            actualizarKPIsMemorandos(memorandosData);
        } catch (err) {
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
            const tipoBadge = `<span class="badge badge-neutral badge-memorando-${m.tipo_raw}">${m.tipo}</span>`;
            const btnDescarga = m.archivo_pdf
                ? `<a href="/memorandos/${m.id}/descargar/" class="btn btn-sm btn-primary-corporate" target="_blank" title="Descargar PDF"><i class="bi bi-download"></i></a>`
                : `<span class="text-muted"><i class="bi bi-file-earmark-pdf"></i></span>`;

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
        const hoyCount = data.filter(m => new Date(m.fecha_emision).toDateString() === hoy).length;

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

            if (!empleadoId || !tipo || !asunto || contenido.length < 10) {
                mensajeDiv.innerHTML = `<div class="alert alert-warning">⚠️ Completa todos los campos. El contenido debe tener al menos 10 caracteres.</div>`;
                return;
            }

            const btn = document.getElementById('memorandoBtnGenerar');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Generando...';

            try {
                const resp = await fetch('/memorandos/crear/', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': getCSRFToken(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ empleado: empleadoId, tipo: tipo, asunto: asunto, contenido: contenido })
                });

                const data = await resp.json();

                if (resp.ok && data.status === 'ok') {
mensajeDiv.innerHTML = `<div class="alert alert-success d-flex align-items-center gap-2"><i class="bi bi-check-circle-fill fs-5"></i><div><strong>${data.mensaje}</strong><br><small>Consecutivo: ${data.consecutivo}</small>${data.archivo_pdf? `<br><a href="${data.archivo_pdf}" target="_blank" class="text-success"><i class="bi bi-file-pdf"></i> Ver PDF</a>` : ''}</div></div>`;
                    form.reset();
                    await cargarMemorandosHistorial();
                } else {
                    mensajeDiv.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i> Error: ${data.error || 'No se pudo generar'}</div>`;
                }
            } catch (err) {
                mensajeDiv.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i> Error de conexión.</div>`;
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-file-pdf me-1"></i> Generar memorando';
            }
        });
    }

    async function initMemorandos() {
        await new Promise(resolve => {
            if (document.readyState === 'complete') resolve();
            else window.addEventListener('load', resolve);
        });

        if (!document.getElementById('memorandosTablaBody')) return;
        await cargarEmpleados();
        await cargarMemorandosHistorial();
        configurarFormularioMemorando();
    }

    if (document.readyState === 'complete') initMemorandos();
    else window.addEventListener('load', initMemorandos);
})();

console.log('Novedades.js (completo - corregido final) cargado correctamente');