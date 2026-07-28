// ============================================================
// TAREAS - EMPLEADO 
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
});