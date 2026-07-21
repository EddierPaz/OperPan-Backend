// ============================== MÓDULO MIS MEMORANDOS (EMPLEADO) ==============================
(function() {
    // Mostrar mensaje en el contenedor
    function mostrarMensaje(mensaje, tipo = 'info') {
        const container = document.getElementById('misMemorandosContainer');
        if (!container) return;
        const alertClass = tipo === 'error' ? 'alert-danger' : 'alert-info';
        container.innerHTML = `
            <div class="alert ${alertClass} text-center py-4">
                <i class="bi ${tipo === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} fs-3 d-block mb-2"></i>
                ${mensaje}
            </div>
        `;
    }

    // Obtener token CSRF
    function getCSRFToken() {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return cookie ? cookie.split('=')[1] : '';
    }

    // Cargar memorandos del empleado
    async function cargarMisMemorandos() {
        try {
            const resp = await fetch('/novedades/memorandos/mis/');
            if (!resp.ok) {
                throw new Error('Error al cargar los memorandos');
            }
            const data = await resp.json();

            const sinMemorandos = document.getElementById('sinMemorandos');
            const tablaContainer = document.getElementById('misMemorandosTabla');
            const tbody = document.getElementById('misMemorandosBody');

            if (!data || data.length === 0) {
                sinMemorandos.style.display = 'block';
                tablaContainer.style.display = 'none';
                return;
            }

            sinMemorandos.style.display = 'none';
            tablaContainer.style.display = 'block';

            tbody.innerHTML = data.map(m => {
                const btnDescarga = m.archivo_pdf 
                    ? `<a href="/novedades/memorandos/${m.id}/descargar/" class="btn btn-sm btn-primary-corporate" target="_blank" title="Descargar PDF">
                        <i class="bi bi-download"></i> Descargar
                       </a>`
                    : `<span class="text-muted"><i class="bi bi-file-earmark-pdf"></i> No disponible</span>`;

                return `<tr>
                    <td data-label="Consecutivo"><strong>${m.consecutivo}</strong></td>
                    <td data-label="Tipo">${m.tipo}</td>
                    <td data-label="Asunto">${m.asunto}</td>
                    <td data-label="Fecha emisión">${new Date(m.fecha_emision).toLocaleString('es-CO')}</td>
                    <td data-label="Acciones">${btnDescarga}</td>
                </tr>`;
            }).join('');

        } catch (err) {
            console.error('Error al cargar mis memorandos:', err);
            mostrarMensaje('Error al cargar tus memorandos. Por favor, recarga la página.', 'error');
        }
    }

    // Inicializar
    document.addEventListener('DOMContentLoaded', cargarMisMemorandos);
})();