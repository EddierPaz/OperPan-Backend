document.addEventListener('DOMContentLoaded', function () {

    // ---------- Búsqueda ----------
    const searchInput = document.getElementById('searchTask');
    const searchBtn = document.getElementById('searchBtn');

    function realizarBusqueda() {
        const termino = searchInput.value.trim();
        const url = new URL(window.location.href);
        if (termino) url.searchParams.set('busqueda', termino);
        else url.searchParams.delete('busqueda');
        window.location.href = url.toString();
    }

    if (searchBtn) searchBtn.addEventListener('click', realizarBusqueda);
    if (searchInput) {
        searchInput.addEventListener('keyup', function (e) {
            if (e.key === 'Enter') realizarBusqueda();
        });
    }

    // ---------- Autocompletado del formulario de tareas ----------
    const taskForm = document.getElementById('taskForm');
    if (!taskForm) return;

    const OTRA_VALUE = 'OTRA';

    function leerJSON(id, fallback) {
        const el = document.getElementById(id);
        if (!el) return fallback;
        try { return JSON.parse(el.textContent); } catch (e) { return fallback; }
    }

    const empleadosData = leerJSON('empleados-data', {});
    const tareasPorCargo = leerJSON('tareas-por-cargo', {});

    const empleadoSelect = document.getElementById('id_empleado');
    const cargoDisplay = document.getElementById('id_cargo_display');
    const turnoSelect = document.getElementById('id_turno_asociado');
    const tituloPreset = document.getElementById('id_titulo_preset');
    const tituloInput = document.getElementById('id_titulo');
    const prioridadSelect = document.getElementById('id_prioridad');
    const descripcionInput = document.getElementById('id_descripcion');
    const fechaInput = document.getElementById('id_fecha_limite');
    const horaInput = document.getElementById('id_hora_limite');
    const horaHint = document.getElementById('hora-limite-hint');

    if (descripcionInput) descripcionInput.dataset.original = descripcionInput.value;

    // Si al cargar la página el título ya trae un valor (modo edición con "Otra"),
    // el input debe verse; si no, empieza oculto hasta que se elija "Otra".
    if (tituloInput && !tituloInput.value) {
        tituloInput.style.display = 'none';
    }

    // ----- Fecha límite: no permitir fechas pasadas -----
    if (fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.setAttribute('min', hoy);
    }

    // ----- Hora límite: tope = hora de salida del horario activo del empleado -----
    function actualizarLimiteHora(horaSalida) {
        if (horaSalida) {
            horaInput.setAttribute('max', horaSalida);
            horaHint.textContent = `No puede superar el fin de la jornada (${horaSalida}).`;
        } else {
            horaInput.removeAttribute('max');
            horaHint.textContent = '';
        }
    }

    function bloquear(campo) {
        campo.classList.add('locked-field');
        campo.setAttribute('tabindex', '-1');
        if (campo.tagName === 'INPUT' || campo.tagName === 'TEXTAREA') {
            campo.setAttribute('readonly', 'readonly');
        }
    }
    function desbloquear(campo) {
        campo.classList.remove('locked-field');
        campo.removeAttribute('tabindex');
        campo.removeAttribute('readonly');
    }

    function poblarTitulos(cargo, tituloPrevio) {
        tituloPreset.innerHTML = '';
        const opciones = tareasPorCargo[cargo] || [];

        const optDefault = document.createElement('option');
        optDefault.value = '';
        optDefault.textContent = 'Selecciona una tarea';
        tituloPreset.appendChild(optDefault);

        opciones.forEach(function (op) {
            const opt = document.createElement('option');
            opt.value = op.value;
            opt.textContent = op.label;
            tituloPreset.appendChild(opt);
        });

        const optOtra = document.createElement('option');
        optOtra.value = OTRA_VALUE;
        optOtra.textContent = 'Otra (especificar)';
        tituloPreset.appendChild(optOtra);

        if (tituloPrevio) {
            const coincide = opciones.find(function (op) { return op.label === tituloPrevio; });
            if (coincide) {
                tituloPreset.value = coincide.value;
                aplicarPreset(coincide);
            } else {
                tituloPreset.value = OTRA_VALUE;
                aplicarOtra(tituloPrevio);
            }
        }
    }

    function aplicarPreset(op) {
        tituloInput.value = op.label;
        tituloInput.style.display = 'none';

        prioridadSelect.value = op.prioridad;
        bloquear(prioridadSelect);

        descripcionInput.value = `Tarea estándar: ${op.label}.`;
        bloquear(descripcionInput);
    }

    function aplicarOtra(tituloExistente) {
        tituloInput.value = tituloExistente || '';
        tituloInput.style.display = 'block';
        tituloInput.focus();

        desbloquear(prioridadSelect);

        descripcionInput.value = descripcionInput.dataset.original || '';
        desbloquear(descripcionInput);
    }

    if (empleadoSelect) {
        empleadoSelect.addEventListener('change', function () {
            const emp = empleadosData[this.value];
            if (!emp) {
                cargoDisplay.value = '';
                tituloPreset.innerHTML = '<option value="">Selecciona un empleado primero</option>';
                actualizarLimiteHora(null);
                return;
            }
            cargoDisplay.value = emp.cargo_display || '';
            if (turnoSelect && emp.turno) turnoSelect.value = emp.turno;

            actualizarLimiteHora(emp.hora_salida);
            poblarTitulos(emp.cargo, null);
        });
    }

    if (tituloPreset) {
        tituloPreset.addEventListener('change', function () {
            if (this.value === OTRA_VALUE) { aplicarOtra(''); return; }
            const emp = empleadosData[empleadoSelect.value];
            const opciones = (emp && tareasPorCargo[emp.cargo]) || [];
            const op = opciones.find(function (o) { return o.value === tituloPreset.value; });
            if (op) aplicarPreset(op);
        });
    }

    // ----- Modo edición: precargar todo -----
    const editando = taskForm.dataset.editando === '1';
    if (editando) {
        const empleadoActual = taskForm.dataset.empleadoActual;
        const tituloActual = taskForm.dataset.tituloActual;

        if (empleadoActual && empleadoSelect) {
            empleadoSelect.value = empleadoActual;
            const emp = empleadosData[empleadoActual];
            if (emp) {
                cargoDisplay.value = emp.cargo_display || '';
                if (turnoSelect && !turnoSelect.value && emp.turno) turnoSelect.value = emp.turno;
                actualizarLimiteHora(emp.hora_salida);
                poblarTitulos(emp.cargo, tituloActual);
            }
        }
    }
});