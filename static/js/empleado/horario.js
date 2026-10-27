document.addEventListener('DOMContentLoaded', function () {
    const modalHorario = document.getElementById('modalDetalleHorario');
    const botonesVer = document.querySelectorAll('.btn-ver-horario');

    // Itera sobre todos los botones de "Ver detalle" en la tabla de historial del empleado
    botonesVer.forEach(btn => {
        btn.addEventListener('click', function () {
            const url = this.getAttribute('data-url');
            
            if (!url) {
                console.error('Error de configuración: El botón no posee el atributo data-url.');
                return;
            }

            const visualContainer = document.getElementById('modalHorarioDetalleVisual');
            
            // Muestra un indicador de carga mientras se obtienen los datos
            visualContainer.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>`;

            // Inicializa e invoca el modal de Bootstrap
            const modal = new bootstrap.Modal(modalHorario);
            modal.show();

            // Petición AJAX para obtener la información del horario
            fetch(url, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => response.json())
            .then(data => {
                // Actualiza los metadatos del encabezado del modal
                document.getElementById('modalHorarioSubtitulo').textContent = `Histórico - ${data.metadatos.turno} (${data.metadatos.horas})`;
                document.getElementById('modalHorarioInicio').textContent = data.metadatos.fecha_inicio;
                document.getElementById('modalHorarioFin').textContent = data.metadatos.fecha_fin;
                
                // Renderiza dinámicamente la etiqueta de estado (Activo, Vencido, etc.)
                const estadoBadge = document.getElementById('modalHorarioEstado');
                const estado = data.metadatos.estado;
                let badgeHtml = '';
                
                if (estado === 'activo') {
                    badgeHtml = '<span class="badge badge-active">Activo</span>';
                } else if (estado === 'por_vencer') {
                    badgeHtml = '<span class="badge badge-pendiente">Por vencer</span>';
                } else if (estado === 'vencido') {
                    badgeHtml = '<span class="badge badge-rechazado">Vencido</span>';
                } else {
                    badgeHtml = '<span class="badge badge-secondary">Inactivo</span>';
                }
                
                estadoBadge.innerHTML = badgeHtml;
                
                // Inyecta el HTML del calendario en el contenedor
                visualContainer.innerHTML = data.html;
            })
            .catch(error => {
                console.error('Error en la petición fetch:', error);
                visualContainer.innerHTML = '<div class="alert alert-danger">Ocurrió un error al intentar cargar el detalle del horario.</div>';
            });
        });
    });
});