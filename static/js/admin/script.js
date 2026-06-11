// ============================================================
// LANDING DEL ADMINISTRADOR - OPERPAN
// ============================================================

const STORAGE_USERS = "operpan_usuarios";
const STORAGE_TAREAS = "operpan_tareas_admin";
const STORAGE_PERMISOS = "operpan_permisos";
const STORAGE_REPORTES = "operpan_reportes";

// Mostrar fecha actual
function actualizarFecha() {
    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById("fechaActual") && (document.getElementById("fechaActual").innerText = fechaStr);
}
actualizarFecha();

// Cerrar sesión
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    mostrarMensaje("Cerrando sesión...");
    setTimeout(() => window.location.href = "../login.html", 800);
});

// Sidebar toggle (móvil)
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
if (menuToggle) {
    menuToggle.addEventListener("click", () => sidebar.classList.toggle("active"));
}
// Cerrar el menú si se hace clic fuera de él (en la zona blanca)
document.addEventListener("click", (event) => {
    // Verificamos si el sidebar está abierto (tiene la clase active)
    if (sidebar.classList.contains("active")) {
        // Si el clic NO fue dentro del sidebar Y TAMPOCO en el botón de hamburguesa...
        if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            sidebar.classList.remove("active");
        }
    }
});

function mostrarMensaje(msg) {
    const toast = document.getElementById("liveToast");
    const msgSpan = document.getElementById("toastMsg");
    msgSpan.innerText = msg;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 3000);
}

// Trazabilidad de acceso al dashboard de admin
console.log(`[ACCESO ADMIN] Administrador ingresó al panel principal - ${new Date().toLocaleString()}`);

cargarKPIs();