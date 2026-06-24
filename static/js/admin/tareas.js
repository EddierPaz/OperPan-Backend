/*Este JS manejará:

Envío del formulario de filtros

Confirmación de eliminación

Edición de tareas (cargar datos en el formulario)

Cambio de estado

Toast de notificaciones*/


// Archivo reservado para futuras interacciones JS específicas de tareas (admin)
console.log('Módulo de tareas (admin) cargado');

// Función para búsqueda con Enter
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchTask');
    const searchBtn = document.getElementById('searchBtn');

    function realizarBusqueda() {
        const termino = searchInput.value.trim();
        const url = new URL(window.location.href);
        if (termino) {
            url.searchParams.set('busqueda', termino);
        } else {
            url.searchParams.delete('busqueda');
        }
        window.location.href = url.toString();
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', realizarBusqueda);
    }

    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                realizarBusqueda();
            }
        });
    }
});