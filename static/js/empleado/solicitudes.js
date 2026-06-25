// ============================================================
// JAVASCRIPT MÍNIMO PARA EL MÓDULO DE SOLICITUDES (EMPLEADO)
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    const tipoSelect = document.getElementById('tipoSolicitud');
    const formPermiso = document.getElementById('formPermiso');
    const formIncapacidad = document.getElementById('formIncapacidad');
    const formCertificado = document.getElementById('formCertificado');
    const nuevoHorarioGroup = document.getElementById('nuevoHorarioGroup');

    function mostrarFormularioSegunTipo() {
        const tipo = tipoSelect.value;
        // Ocultar todos
        formPermiso.style.display = 'none';
        formIncapacidad.style.display = 'none';
        formCertificado.style.display = 'none';
        nuevoHorarioGroup.style.display = 'none';

        // Mostrar según tipo
        if (tipo === 'permiso') {
            formPermiso.style.display = 'block';
        } else if (tipo === 'incapacidad') {
            formIncapacidad.style.display = 'block';
        } else if (tipo === 'certificado') {
            formCertificado.style.display = 'block';
        } else if (tipo === 'cambio_turno') {
            formPermiso.style.display = 'block';
            nuevoHorarioGroup.style.display = 'block';
        } else if (tipo === 'vacaciones') {
            formPermiso.style.display = 'block';
        }
    }

    tipoSelect.addEventListener('change', mostrarFormularioSegunTipo);
    mostrarFormularioSegunTipo(); // Estado inicial

    // Calcular días para incapacidad
    function calcularDias(fechaInicio, fechaFin) {
        if (!fechaInicio || !fechaFin) return 0;
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        const diffTime = Math.abs(fin - inicio);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const incapInicio = document.getElementById('incapacidadFechaInicio');
    const incapFin = document.getElementById('incapacidadFechaFin');
    const incapDias = document.getElementById('incapacidadDias');

    if (incapInicio && incapFin) {
        incapInicio.addEventListener('change', function() {
            incapDias.value = calcularDias(incapInicio.value, incapFin.value);
        });
        incapFin.addEventListener('change', function() {
            incapDias.value = calcularDias(incapInicio.value, incapFin.value);
        });
    }

    // Filtros de solicitudes
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active', 'btn-primary');
                b.classList.add('btn-outline-secondary');
            });
            this.classList.add('active', 'btn-primary');
            this.classList.remove('btn-outline-secondary');

            document.querySelectorAll('.request-card').forEach(card => {
                if (filter === 'todas') {
                    card.style.display = 'block';
                } else {
                    card.style.display = card.getAttribute('data-estado') === filter ? 'block' : 'none';
                }
            });
        });
    });

    // Campos dinámicos para certificados
    const certTipo = document.getElementById('certificadoTipo');
    const finalidadGroup = document.getElementById('certificadoFinalidadGroup');
    const periodoGroup = document.getElementById('certificadoPeriodoGroup');

    if (certTipo) {
        function actualizarCamposCertificado() {
            const tipo = certTipo.value;
            finalidadGroup.style.display = 'none';
            periodoGroup.style.display = 'none';
            if (tipo === 'laboral') finalidadGroup.style.display = 'block';
            if (tipo === 'ingresos') periodoGroup.style.display = 'block';
        }
        certTipo.addEventListener('change', actualizarCamposCertificado);
        actualizarCamposCertificado();
    }
});