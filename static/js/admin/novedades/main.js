// ============================================================
// MAIN.JS - UTILIDADES GLOBALES Y CONTROL DE PESTAÑAS
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
                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );
                break;
            }
        }
    }

    return cookieValue;
}

function getCSRFToken() {
    return getCookie('csrftoken');
}


// ============================================================
// SISTEMA DE NOTIFICACIONES
// ============================================================

function showMessage(msg, tipo = null) {

    if (typeof window.mostrarNotificacion !== 'function') {
        console.warn(
            '⚠️ Sistema global de notificaciones no disponible:',
            msg
        );
        return;
    }

    // Quitar emojis de estado del mensaje
    let mensaje = String(msg || '')
        .replace(/✅/g, '')
        .replace(/❌/g, '')
        .replace(/⚠️/g, '')
        .replace(/ℹ️/g, '')
        .trim();

    const mensajeTexto = mensaje.toLowerCase();

    // ========================================================
    // DETECTAR TIPO
    // ========================================================

    if (!tipo) {

        // RECHAZOS / ERRORES → ROJO
        if (
            mensajeTexto.includes('error') ||
            mensajeTexto.includes('no se pudo') ||
            mensajeTexto.includes('no hay') ||
            mensajeTexto.includes('rechazad') ||
            mensajeTexto.includes('eliminad') ||
            mensajeTexto.includes('cancelad')
        ) {

            tipo = 'error';

        }

        // ADVERTENCIAS → AMARILLO
        else if (
            mensajeTexto.includes('advertencia') ||
            mensajeTexto.includes('seleccione') ||
            mensajeTexto.includes('debe ingresar')
        ) {

            tipo = 'warning';

        }

        // ÉXITOS → VERDE
        else if (
            mensajeTexto.includes('correctamente') ||
            mensajeTexto.includes('aprobado') ||
            mensajeTexto.includes('generado') ||
            mensajeTexto.includes('creado')
        ) {

            tipo = 'success';

        }

        // INFORMACIÓN → AZUL
        else {

            tipo = 'info';

        }
    }

    // Enviar SOLO el texto al sistema global.
    // El sistema global se encarga del icono.
    window.mostrarNotificacion(mensaje, tipo);
}


// ============================================================
// DEBOUNCE
// ============================================================

function debounce(fn, delay = 300) {
    let timer;

    return function (...args) {
        clearTimeout(timer);

        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
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

    // Usa los mismos badges globales de components.css que ya
    // usan las tarjetas del historial (permisos.js/incapacidades.js/
    // certificados.js), para no duplicar estilos ni colores fijos.
    const map = {
        'pendiente': 'badge-pendiente',
        'aprobado': 'badge-aprobado',
        'rechazado': 'badge-rechazado'
    };

    return map[estado] || 'badge-pendiente';
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
// RENDERIZAR DETALLE DE PERMISO
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
        <div class="modal-detalle-grid">

            <div class="modal-detalle-item">
                <span class="modal-detalle-label">Estado</span>

                <span class="modal-detalle-value">
                    <span class="badge ${estadoClass}">
                        ${estadoLabel}
                    </span>
                </span>
            </div>

            <div class="modal-detalle-item">
                <span class="modal-detalle-label">Empleado</span>

                <span class="modal-detalle-value">
                    ${data.empleado || '—'}
                </span>
            </div>

            <div class="modal-detalle-item">
                <span class="modal-detalle-label">Tipo</span>

                <span class="modal-detalle-value">
                    ${data.tipo || '—'}
                </span>
            </div>

            <div class="modal-detalle-item modal-detalle-item-full">
                <span class="modal-detalle-label">Período</span>

                <span class="modal-detalle-value">
                    <i class="bi bi-calendar3 me-1"></i>
                    ${fechaInicio} - ${fechaFin}
                </span>
            </div>

            <div class="modal-detalle-bloque-largo">
                <span class="modal-detalle-bloque-largo-label">
                    Justificación
                </span>

                <p class="modal-detalle-bloque-largo-texto">
                    ${data.justificacion || 'Sin información adicional.'}
                </p>
            </div>

            <div class="modal-detalle-item modal-detalle-item-full">
                <span class="modal-detalle-label">
                    Fecha de solicitud
                </span>

                <span class="modal-detalle-value">
                    <i class="bi bi-clock me-1"></i>
                    ${fechaSolicitud}
                </span>
            </div>

            ${data.archivo ? `
                <div class="modal-detalle-bloque-largo">

                    <span class="modal-detalle-bloque-largo-label">
                        Archivo adjunto
                    </span>

                    <p class="modal-detalle-bloque-largo-texto">

                        <a
                            href="${data.archivo}"
                            target="_blank"
                            class="btn-action btn-action-print"
                        >
                            <i class="bi bi-paperclip me-1"></i>
                            Ver archivo
                        </a>

                    </p>
                </div>
            ` : ''}

            ${data.motivo_rechazo ? `
                <div class="modal-detalle-rechazo">
                    <strong>Motivo del rechazo</strong><br>
                    ${data.motivo_rechazo}
                </div>
            ` : ''}

        </div>
    `;
}


// ============================================================
// RENDERIZAR DETALLE DE INCAPACIDAD
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
        <div class="modal-detalle-grid">

            <div class="modal-detalle-item">
                <span class="modal-detalle-label">Estado</span>

                <span class="modal-detalle-value">
                    <span class="badge ${estadoClass}">
                        ${estadoLabel}
                    </span>
                </span>
            </div>

            <div class="modal-detalle-item">
                <span class="modal-detalle-label">Empleado</span>

                <span class="modal-detalle-value">
                    ${data.empleado || '—'}
                </span>
            </div>

            <div class="modal-detalle-item">
                <span class="modal-detalle-label">Título</span>

                <span class="modal-detalle-value">
                    ${data.titulo || '—'}
                </span>
            </div>

            <div class="modal-detalle-item modal-detalle-item-full">
                <span class="modal-detalle-label">Período</span>

                <span class="modal-detalle-value">
                    <i class="bi bi-calendar3 me-1"></i>
                    ${fechaInicio} - ${fechaFin}
                </span>
            </div>

            <div class="modal-detalle-bloque-largo">

                <span class="modal-detalle-bloque-largo-label">
                    Descripción
                </span>

                <p class="modal-detalle-bloque-largo-texto">
                    ${data.descripcion || 'Sin información adicional.'}
                </p>

            </div>

            <div class="modal-detalle-item modal-detalle-item-full">

                <span class="modal-detalle-label">
                    Fecha de solicitud
                </span>

                <span class="modal-detalle-value">
                    <i class="bi bi-clock me-1"></i>
                    ${fechaSolicitud}
                </span>

            </div>

            ${data.archivo ? `
                <div class="modal-detalle-bloque-largo">

                    <span class="modal-detalle-bloque-largo-label">
                        Archivo adjunto
                    </span>

                    <p class="modal-detalle-bloque-largo-texto">

                        <a
                            href="${data.archivo}"
                            target="_blank"
                            class="btn-action btn-action-print"
                        >
                            <i class="bi bi-paperclip me-1"></i>
                            Ver archivo
                        </a>

                    </p>

                </div>
            ` : ''}

            ${data.motivo_rechazo ? `
                <div class="modal-detalle-rechazo">
                    <strong>Motivo del rechazo</strong><br>
                    ${data.motivo_rechazo}
                </div>
            ` : ''}

        </div>
    `;
}


// ============================================================
// RENDERIZAR DETALLE DE CERTIFICADO
// ============================================================

function renderCertificadoDetalle(data) {

    const container = document.getElementById('certificadosModalBody');

    if (!container) return;

    const estadoClass = getEstadoClass(data.estado);
    const estadoLabel = getEstadoLabel(data.estado);

    const fechaSolicitud = formatDate(data.fecha_solicitud);
    const fechaEmision = formatDate(data.fecha_emision);

    container.innerHTML = `
        <div class="modal-detalle-grid">

            <div class="modal-detalle-item">

                <span class="modal-detalle-label">
                    Estado
                </span>

                <span class="modal-detalle-value">

                    <span class="badge ${estadoClass}">
                        ${estadoLabel}
                    </span>

                </span>

            </div>

            <div class="modal-detalle-item">

                <span class="modal-detalle-label">
                    Empleado
                </span>

                <span class="modal-detalle-value">
                    ${data.empleado || '—'}
                </span>

            </div>

            <div class="modal-detalle-item">

                <span class="modal-detalle-label">
                    Tipo
                </span>

                <span class="modal-detalle-value">
                    ${data.tipo || '—'}
                </span>

            </div>

            <div class="modal-detalle-item">

                <span class="modal-detalle-label">
                    Solicitado
                </span>

                <span class="modal-detalle-value">

                    <i class="bi bi-calendar3 me-1"></i>
                    ${fechaSolicitud}

                </span>

            </div>

            ${data.fecha_emision ? `
                <div class="modal-detalle-item">

                    <span class="modal-detalle-label">
                        Fecha de emisión
                    </span>

                    <span class="modal-detalle-value">

                        <i class="bi bi-check-circle me-1"></i>
                        ${fechaEmision}

                    </span>

                </div>
            ` : ''}

            <div class="modal-detalle-bloque-largo">

                <span class="modal-detalle-bloque-largo-label">
                    Propósito
                </span>

                <p class="modal-detalle-bloque-largo-texto">
                    ${data.proposito || 'Sin información adicional.'}
                </p>

            </div>

            ${data.dirigido_a ? `
                <div class="modal-detalle-item modal-detalle-item-full">

                    <span class="modal-detalle-label">
                        Dirigido a
                    </span>

                    <span class="modal-detalle-value">
                        ${data.dirigido_a}
                    </span>

                </div>
            ` : ''}

            ${data.periodo ? `
                <div class="modal-detalle-item modal-detalle-item-full">

                    <span class="modal-detalle-label">
                        Período
                    </span>

                    <span class="modal-detalle-value">
                        ${data.periodo}
                    </span>

                </div>
            ` : ''}

            ${data.archivo ? `
                <div class="modal-detalle-bloque-largo">

                    <span class="modal-detalle-bloque-largo-label">
                        Archivo adjunto
                    </span>

                    <p class="modal-detalle-bloque-largo-texto">

                        <a
                            href="${data.archivo}"
                            target="_blank"
                            class="btn-action btn-action-print"
                        >
                            <i class="bi bi-paperclip me-1"></i>
                            Ver archivo
                        </a>

                    </p>

                </div>
            ` : ''}

            ${data.motivo_rechazo ? `
                <div class="modal-detalle-rechazo">
                    <strong>Motivo del rechazo</strong><br>
                    ${data.motivo_rechazo}
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

        const paneId =
            `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;

        const pane = document.getElementById(paneId);

        if (pane) {
            pane.classList.add('active');
        }

        console.log(`📌 Pestaña activada: ${tabName}`);

        switch (tabName) {

            case 'permisos':

                if (typeof window.cargarPermisos === 'function') {
                    window.cargarPermisos();
                }

                break;

            case 'incapacidades':

                if (typeof window.cargarIncapacidades === 'function') {
                    window.cargarIncapacidades();
                }

                break;

            case 'certificados':

                if (typeof window.cargarCertificados === 'function') {
                    window.cargarCertificados();
                }

                break;

            case 'memorandos':

                if (typeof window.cargarMemorandos === 'function') {
                    window.cargarMemorandos();
                }

                break;
        }
    }


    tabs.forEach(tab => {

        tab.addEventListener('click', function () {
            activateTab(this);
        });

    });


    // Activar pestaña inicial
    const activeTab = document.querySelector(
        '.novedades-tab.active'
    );

    if (activeTab) {

        activateTab(activeTab);

    } else if (tabs.length > 0) {

        activateTab(tabs[0]);

    }

});


console.log('✅ main.js cargado correctamente');