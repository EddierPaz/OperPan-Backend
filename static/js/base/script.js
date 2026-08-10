// ============================================================
// SCRIPT GLOBAL - OPERPAN · Estación Paisa
// static/js/base/script.js
// Lógica compartida en todas las páginas (admin y empleado)
// ============================================================

// ── Sidebar toggle (móvil) ───────────────────────────────────
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

if (menuToggle && sidebar) {
    // Abrir / cerrar con el botón hamburguesa
    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });

    // Cerrar si se hace clic fuera del sidebar
    document.addEventListener("click", (event) => {
        if (sidebar.classList.contains("active")) {
            if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                sidebar.classList.remove("active");
            }
        }
    });
}

// ── Sistema de Notificaciones (Mensajes Django → Toast) ─────
document.addEventListener("DOMContentLoaded", () => {

    const ICONOS = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill',
        debug: 'bi-info-circle-fill',
    };

    // Django usa "error" como tag pero por defecto Bootstrap usa "danger"
    function normalizarTipo(tipo) {
        if (tipo === 'error') return 'danger';
        return tipo || 'info';
    }

    function crearToast(mensaje, tipo) {
        const tipoNormalizado = normalizarTipo(tipo);
        const icono = ICONOS[tipo] || ICONOS.info;

        const toastEl = document.createElement('div');
        toastEl.className = `app-toast app-toast-${tipoNormalizado}`;
        toastEl.innerHTML = `
            <div class="app-toast-icon">
                <i class="bi ${icono}"></i>
            </div>
            <div class="app-toast-msg">${mensaje}</div>
            <button type="button" class="app-toast-close" aria-label="Cerrar">
                <i class="bi bi-x"></i>
            </button>
        `;

        return toastEl;
    }

    function mostrarNotificacion(mensaje, tipo = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) {
            // Fallback si el contenedor no existe en la plantilla
            alert(mensaje);
            return;
        }

        const toastEl = crearToast(mensaje, tipo);
        container.appendChild(toastEl);

        // Animación de entrada
        requestAnimationFrame(() => {
            toastEl.classList.add('show');
        });

        // Cierre manual
        const btnClose = toastEl.querySelector('.app-toast-close');
        btnClose.addEventListener('click', () => cerrarToast(toastEl));

        // Autocierre rápido (efecto "flash")
        const timer = setTimeout(() => cerrarToast(toastEl), 4000);
        toastEl.dataset.timerId = timer;
    }

    function cerrarToast(toastEl) {
        clearTimeout(Number(toastEl.dataset.timerId));
        toastEl.classList.remove('show');
        toastEl.classList.add('hide');
        setTimeout(() => toastEl.remove(), 300); // debe coincidir con la transición CSS
    }

    // Tomar los mensajes que Django renderizó (ocultos) y mostrarlos apilados
    const mensajes = document.querySelectorAll('.django-message');
    mensajes.forEach((msg, index) => {
        const tipo = msg.dataset.tipo || 'info';
        const texto = msg.innerText.trim();

        // Pequeño delay escalonado si hay varios mensajes a la vez
        setTimeout(() => mostrarNotificacion(texto, tipo), index * 200);
    });

    const wrapperMensajes = document.getElementById('djangoMessages');
    if (wrapperMensajes) wrapperMensajes.remove();

    // Exponer función globalmente por si alguna vista necesita
    // lanzar una notificación desde JS (ej. tras una llamada fetch)
    window.mostrarNotificacion = mostrarNotificacion;
});