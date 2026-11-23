// ============================================================
// MAIN.JS - UTILIDADES COMPARTIDAS Y CONTROL DE PESTAÑAS
// Panel de administración de novedades - OperPan
// ============================================================

// ------------------------------------------------------------
// CSRF
// ------------------------------------------------------------
function getCookie(name) {
    if (!document.cookie) return null;
    const par = document.cookie
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith(name + '='));
    return par  decodeURIComponent(par.substring(name.length + 1)) : null;
}

function getCSRFToken() {
    return getCookie('csrftoken');
}

// ------------------------------------------------------------
// NOTIFICACIONES (usa el sistema global de toasts.css / mostrarNotificacion)
// tipo: 'success' | 'error' | 'warning' | 'info'
// ------------------------------------------------------------
function showMessage(msg, tipo = 'info') {
    if (typeof window.mostrarNotificacion !== 'function') {
        console.warn('Sistema global de notificaciones no disponible:', msg);
        return;
    }
    const limpio = String(msg || '').replace(/[✅❌⚠️ℹ️]/gu, '').trim();
    window.mostrarNotificacion(limpio, tipo);
}

// ------------------------------------------------------------
// HELPERS GENERALES
// ------------------------------------------------------------
function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

/** Escapa texto del usuario antes de meterlo en innerHTML (evita XSS). */
function esc(valor) {
    return String(valor  '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/** 'YYYY-MM-DD' o ISO completo -> 'dd/mm/yyyy' (sin desfase de zona horaria). */
function formatDate(valor) {
    if (!valor) return '—';
    const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (soloFecha) return `${soloFecha[3]}/${soloFecha[2]}/${soloFecha[1]}`;
    const d = new Date(valor);
    if (isNaN(d)) return '—';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatDateTime(valor) {
    if (!valor) return '—';
    const d = new Date(valor);
    return isNaN(d)  '—' : d.toLocaleString('es-CO');
}

// ------------------------------------------------------------
// ESTADOS (un solo lugar para clases y textos de los badges)
// Si tu CSS usa otro nombre de clase, cámbialo aquí y listo.
// ------------------------------------------------------------
const ESTADOS = {
    pendiente: { clase: 'badge-pendiente', texto: 'Pendiente' },
    aprobado:  { clase: 'badge-active',    texto: 'Aprobado' },
    rechazado: { clase: 'badge-rechazado', texto: 'Rechazado' },
};

/** Acepta 'Aprobado', 'aprobada', 'APROBADO'... y devuelve la clave canónica. */
function normalizarEstado(estado) {
    const e = String(estado || '').trim().toLowerCase();
    if (e.startsWith('aprob')) return 'aprobado';
    if (e.startsWith('rechaz')) return 'rechazado';
    return 'pendiente';
}

function badgeEstado(estado) {
    const { clase, texto } = ESTADOS[normalizarEstado(estado)];
    return `<span class="badge ${clase}">${texto}</span>`;
}

// ------------------------------------------------------------
// API: fetch con CSRF, JSON y manejo de errores en un solo lugar
// Lanza Error(mensaje) si la respuesta no es 2xx.
// ------------------------------------------------------------
async function api(url, { method = 'GET', body } = {}) {
    const opciones = { method, headers: {} };
    if (method !== 'GET') {
        opciones.headers['X-CSRFToken'] = getCSRFToken();
        opciones.headers['Content-Type'] = 'application/json';
        if (body !== undefined) opciones.body = JSON.stringify(body);
    }
    const resp = await fetch(url, opciones);
    let data = null;
    try { data = await resp.json(); } catch (_) { /* respuesta sin JSON */ }
    if (!resp.ok) {
        throw new Error((data && data.error) || `Error ${resp.status}`);
    }
    return data;
}

// ------------------------------------------------------------
// EXPONER (memorandos.js y modulo.js usan estas funciones)
// ------------------------------------------------------------
window.getCSRFToken = getCSRFToken;
window.showMessage = showMessage;
window.debounce = debounce;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.esc = esc;
window.api = api;
window.ESTADOS = ESTADOS;
window.normalizarEstado = normalizarEstado;
window.badgeEstado = badgeEstado;

// ------------------------------------------------------------
// REGISTRO DE MÓDULOS (cada pestaña registra aquí su función "cargar")
// ------------------------------------------------------------
window.novedadesModulos = window.novedadesModulos || {};

// ------------------------------------------------------------
// CONTROL DE PESTAÑAS
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    const tabs = document.querySelectorAll('.novedades-tab');
    const paneles = document.querySelectorAll('.tab-pane');

    function activarTab(tab) {
        const nombre = tab.dataset.tab;
        if (!nombre) return;

        tabs.forEach(t => t.classList.remove('active'));
        paneles.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');

        const panel = document.getElementById('tab' + nombre.charAt(0).toUpperCase() + nombre.slice(1));
        panel.classList.add('active');

        // Cada módulo se registra como novedadesModulos.<nombre>;
        // memorandos.js todavía expone window.cargarMemorandos.
        const cargar = window.novedadesModulos[nombre]
            || window['cargar' + nombre.charAt(0).toUpperCase() + nombre.slice(1)];
        if (typeof cargar === 'function') cargar();
    }

    tabs.forEach(tab => tab.addEventListener('click', () => activarTab(tab)));

    const inicial = document.querySelector('.novedades-tab.active') || tabs[0];
    if (inicial) activarTab(inicial);
});