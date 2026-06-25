// ============================================================
// TAREAS - EMPLEADO (OperPan)
// JS mínimo: solo para funcionalidades que requieren interacción
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Módulo de tareas (empleado) cargado');

    // Notificación simple (Toast)
    function mostrarNotificacion(mensaje, tipo = 'info') {
        const toast = document.getElementById('liveToast');
        const msgSpan = document.getElementById('toastMsg');
        if (!toast || !msgSpan) {
            alert(mensaje);
            return;
        }
        msgSpan.innerText = mensaje;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 3500);
    }

    // Si hay mensajes de Django (messages) pasarlos a toast
    const messages = document.querySelectorAll('.django-message');
    messages.forEach(function(msg) {
        const tipo = msg.dataset.tipo || 'info';
        mostrarNotificacion(msg.innerText, tipo);
        msg.remove();
    });

    // Sidebar toggle (ya manejado por base.html, pero por si acaso)
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Cerrar sidebar al hacer clic fuera (en móvil)
    document.addEventListener('click', function(event) {
        if (sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
});

// Función global para cerrar sidebar (si se necesita desde otros lugares)
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('active');
}