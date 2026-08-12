document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias ---
    const tipoSelect = document.getElementById('tipoSolicitud');
    const formPermiso = document.getElementById('formPermiso');
    const formIncapacidad = document.getElementById('formIncapacidad');
    const formCertificado = document.getElementById('formCertificado');
    const nuevoHorarioGroup = document.getElementById('nuevoHorarioGroup');
    const solicitudesContainer = document.getElementById('solicitudesContainer');

    // --- 1. Gestión de formularios por tipo ---
    const mostrarFormularioSegunTipo = () => {
        if (!tipoSelect) return;
        const tipo = tipoSelect.value;

        [formPermiso, formIncapacidad, formCertificado, nuevoHorarioGroup].forEach(el => {
            if (el) el.style.display = 'none';
        });

        if (['permiso', 'cambio_turno', 'vacaciones'].includes(tipo)) {
            if (formPermiso) formPermiso.style.display = 'block';
            if (tipo === 'cambio_turno' && nuevoHorarioGroup) nuevoHorarioGroup.style.display = 'block';
        } else if (tipo === 'incapacidad' && formIncapacidad) {
            formIncapacidad.style.display = 'block';
        } else if (tipo === 'certificado' && formCertificado) {
            formCertificado.style.display = 'block';
        }
    };

    if (tipoSelect) {
        tipoSelect.addEventListener('change', mostrarFormularioSegunTipo);
        mostrarFormularioSegunTipo();
    }

    // --- 2. Cálculo de días de incapacidad ---
    const incapInicio = document.getElementById('incapacidadFechaInicio');
    const incapFin = document.getElementById('incapacidadFechaFin');
    const incapDias = document.getElementById('incapacidadDias');

    const actualizarDiasIncapacidad = () => {
        if (!incapInicio?.value || !incapFin?.value) return;
        const inicio = new Date(`${incapInicio.value}T00:00:00`);
        const fin = new Date(`${incapFin.value}T00:00:00`);
        
        if (fin < inicio) {
            incapDias.value = '';
        } else {
            const diff = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
            incapDias.value = diff;
        }
    };

    [incapInicio, incapFin].forEach(el => el?.addEventListener('change', actualizarDiasIncapacidad));

    // --- 3. Certificados ---
    const certTipo = document.getElementById('certificadoTipo');
    const finalidadGroup = document.getElementById('certificadoFinalidadGroup');
    const periodoGroup = document.getElementById('certificadoPeriodoGroup');

    const actualizarCamposCertificado = () => {
        if (!certTipo) return;
        if (finalidadGroup) finalidadGroup.style.display = certTipo.value === 'laboral' ? 'block' : 'none';
        if (periodoGroup) periodoGroup.style.display = certTipo.value === 'ingresos' ? 'block' : 'none';
    };

    certTipo?.addEventListener('change', actualizarCamposCertificado);

    // --- 4. Filtros del Historial ---
    let tipoActual = 'permiso';
    let estadoActual = 'todas';

    const filtrarHistorial = () => {
        if (!solicitudesContainer) return;
        const tarjetas = Array.from(solicitudesContainer.querySelectorAll('.request-card'));
        let visibles = 0;

        tarjetas.forEach(card => {
            const matchTipo = card.dataset.tipo === tipoActual;
            const matchEstado = estadoActual === 'todas' || card.dataset.estado === estadoActual;

            card.style.display = (matchTipo && matchEstado) ? '' : 'none';
            if (matchTipo && matchEstado) visibles++;
        });

        // Manejo de mensaje sin resultados
        let msg = document.getElementById('mensajeSinResultados');
        if (visibles === 0) {
            if (!msg) {
                msg = document.createElement('div');
                msg.id = 'mensajeSinResultados';
                msg.className = 'empty-history';
                solicitudesContainer.appendChild(msg);
            }
            const t = { 'permiso': 'permisos', 'incapacidad': 'incapacidades', 'certificado': 'certificados' }[tipoActual] || 'solicitudes';
            const e = estadoActual !== 'todas' ? ` ${estadoActual}s` : '';
            msg.innerHTML = `<div class="empty-history-icon"><i class="bi bi-search"></i></div><h5>Sin resultados</h5><p>No tienes ${t}${e} en el historial.</p>`;
        } else if (msg) {
            msg.remove();
        }
    };

    // Eventos de botones de filtro por Tipo (Contenedor específico para evitar conflictos)
    const tipoFiltroTabs = document.querySelectorAll('#tipoFiltroTabs .novedades-tab');
    tipoFiltroTabs.forEach(btn => btn.addEventListener('click', (e) => {
        tipoFiltroTabs.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        tipoActual = e.currentTarget.dataset.tipo;
        filtrarHistorial();
    }));

    // Eventos de botones de filtro por Estado (Contenedor específico para evitar conflictos)
    const estadoFiltroTabs = document.querySelectorAll('#estadoFiltroTabs .novedades-tab');
    estadoFiltroTabs.forEach(btn => btn.addEventListener('click', (e) => {
        estadoFiltroTabs.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        estadoActual = e.currentTarget.dataset.estado;
        filtrarHistorial();
    }));

    // --- 5. Conexión con botones "Ver todas" de las tarjetas superiores ---
    document.querySelectorAll('.btn-view-pending').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTipo = e.currentTarget.dataset.tipo;
            const scrollTo = e.currentTarget.dataset.scrollTo;

            // Buscar y activar la pestaña correspondiente en el historial
            tipoFiltroTabs.forEach(tab => {
                if (tab.dataset.tipo === targetTipo) {
                    tab.click(); // Simula el clic para actualizar variables y filtros
                }
            });

            // Desplazamiento suave hacia el historial
            if (scrollTo) {
                const element = document.getElementById(scrollTo);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // --- 6. Limpieza formulario ---
    document.getElementById('solicitudForm')?.addEventListener('reset', () => {
        setTimeout(() => {
            mostrarFormularioSegunTipo();
            actualizarCamposCertificado();
            if (incapDias) incapDias.value = '';
        }, 0);
    });

    filtrarHistorial();
});