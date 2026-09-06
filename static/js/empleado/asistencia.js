document.addEventListener('DOMContentLoaded', function () {
    const modalDetalle = document.getElementById('modalDetalleAsistencia');
    
    modalDetalle.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget;
        
        // Leer todos los atributos data-*
        const fecha = button.getAttribute('data-fecha');
        const horaRegistro = button.getAttribute('data-hora-registro');
        const turno = button.getAttribute('data-turno');
        const entradaProg = button.getAttribute('data-entrada-prog');
        const salidaProg = button.getAttribute('data-salida-prog');
        const estado = button.getAttribute('data-estado');
        const esDescanso = button.getAttribute('data-es-descanso') === 'true';
        const nombre = button.getAttribute('data-nombre') || '--';
        const documento = button.getAttribute('data-documento') || '--';
        const cargo = button.getAttribute('data-cargo') || '--';
        const entradaReal = horaRegistro || '--:--'; // usamos horaRegistro como entrada real
        const salidaReal = button.getAttribute('data-salida-real') || '--:--';
        const tardanza = button.getAttribute('data-tardanza') || '--';

        // Elementos del modal
        const modalFecha = document.getElementById('modalFecha');
        const modalNombre = document.getElementById('modalNombre');
        const modalDocumento = document.getElementById('modalDocumento');
        const modalCargo = document.getElementById('modalCargo');
        const modalTurno = document.getElementById('modalTurno');
        const modalEntradaProg = document.getElementById('modalEntradaProg');
        const modalSalidaProg = document.getElementById('modalSalidaProg');
        const modalEntradaReal = document.getElementById('modalEntradaReal');
        const modalSalidaReal = document.getElementById('modalSalidaReal');
        const modalEstadoBadge = document.getElementById('modalEstadoBadge');
        const modalTardanza = document.getElementById('modalTardanza');
        
        const seccionNormal = document.getElementById('seccionDiaNormal');
        const seccionDescanso = document.getElementById('seccionDiaDescanso');

        // Asignar valores
        modalFecha.textContent = fecha;
        modalNombre.textContent = nombre;
        modalDocumento.textContent = documento;
        modalCargo.textContent = cargo;
        modalTurno.textContent = turno;
        modalEntradaProg.textContent = entradaProg;
        modalSalidaProg.textContent = salidaProg;
        modalEntradaReal.textContent = entradaReal;
        modalSalidaReal.textContent = salidaReal;
        modalTardanza.textContent = tardanza;

        if (esDescanso) {
            seccionNormal.classList.add('d-none');
            seccionDescanso.classList.remove('d-none');
            modalEstadoBadge.innerHTML = ''; // limpiar
        } else {
            seccionNormal.classList.remove('d-none');
            seccionDescanso.classList.add('d-none');

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
            } else {
                badgeClass += 'badge-secondary';
                estadoTexto = estado || 'Sin estado';
            }
            modalEstadoBadge.innerHTML = `<span class="${badgeClass}">${estadoTexto}</span>`;
        }
    });
});