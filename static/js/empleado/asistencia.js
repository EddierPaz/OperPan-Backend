document.addEventListener('DOMContentLoaded', function () {
    const modalDetalle = document.getElementById('modalDetalleAsistencia');
    
    modalDetalle.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget;
        
        const fecha = button.getAttribute('data-fecha');
        const horaRegistro = button.getAttribute('data-hora-registro');
        const turno = button.getAttribute('data-turno');
        const entradaProg = button.getAttribute('data-entrada-prog');
        const estado = button.getAttribute('data-estado');
        const esDescanso = button.getAttribute('data-es-descanso') === 'true';

        const modalFecha = document.getElementById('modalFecha');
        const modalHoraRegistro = document.getElementById('modalHoraRegistro');
        const modalTurno = document.getElementById('modalTurno');
        const modalEntradaProg = document.getElementById('modalEntradaProg');
        const modalEstadoBadge = document.getElementById('modalEstadoBadge');
        
        const seccionNormal = document.getElementById('seccionDiaNormal');
        const seccionDescanso = document.getElementById('seccionDiaDescanso');

        modalFecha.textContent = fecha;

        if (esDescanso) {
            seccionNormal.classList.add('d-none');
            seccionDescanso.classList.remove('d-none');
        } else {
            seccionNormal.classList.remove('d-none');
            seccionDescanso.classList.add('d-none');

            modalHoraRegistro.textContent = horaRegistro;
            modalTurno.textContent = turno;
            modalEntradaProg.textContent = entradaProg;

            let badgeClass = 'badge-status ';
            let estadoTexto = estado;
            
            if (estado === 'PRESENTE') {
                badgeClass += 'badge-presente';
                estadoTexto = 'Presente';
            } else if (estado === 'TARDE') {
                badgeClass += 'badge-tarde';
                estadoTexto = 'Tarde';
            } else if (estado === 'AUSENTE') {
                badgeClass += 'badge-ausente';
                estadoTexto = 'Ausente';
            }

            modalEstadoBadge.innerHTML = `<span class="${badgeClass}">${estadoTexto}</span>`;
        }
    });
});