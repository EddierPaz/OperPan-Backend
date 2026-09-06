document.addEventListener('DOMContentLoaded', function () {
    const modalHorario = document.getElementById('modalDetalleHorario');
    const botonesVer = document.querySelectorAll('.btn-ver-horario');

    botonesVer.forEach(btn => {
        btn.addEventListener('click', function () {
            const url = this.getAttribute('data-url');
            if (!url) {
                console.error('No se encontró data-url en el botón');
                return;
            }

            const visualContainer = document.getElementById('modalHorarioDetalleVisual');
            visualContainer.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';

            // Mostrar el modal
            const modal = new bootstrap.Modal(modalHorario);
            modal.show();

            fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('modalHorarioSubtitulo').textContent = `Histórico - ${data.metadatos.turno} (${data.metadatos.horas})`;
                document.getElementById('modalHorarioInicio').textContent = data.metadatos.fecha_inicio;
                document.getElementById('modalHorarioFin').textContent = data.metadatos.fecha_fin;
                const estadoBadge = document.getElementById('modalHorarioEstado');
                const estado = data.metadatos.estado;
                let badgeHtml = '';
                if (estado === 'activo') badgeHtml = '<span class="badge badge-active">Activo</span>';
                else if (estado === 'por_vencer') badgeHtml = '<span class="badge badge-pendiente">Por vencer</span>';
                else if (estado === 'vencido') badgeHtml = '<span class="badge badge-rechazado">Vencido</span>';
                else badgeHtml = '<span class="badge badge-secondary">Inactivo</span>';
                estadoBadge.innerHTML = badgeHtml;
                visualContainer.innerHTML = data.html;
            })
            .catch(error => {
                console.error('Error al cargar el horario:', error);
                visualContainer.innerHTML = '<div class="alert alert-danger">Error al cargar el detalle del horario.</div>';
            });
        });
    });
});