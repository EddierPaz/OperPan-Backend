// ============================================================
// SCRIPT GLOBAL - OPERPAN · Estación Paisa
// static/js/script.js
// Solo lógica compartida en todas las páginas
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