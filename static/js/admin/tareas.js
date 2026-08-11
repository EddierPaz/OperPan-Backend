document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. UTILIDAD PARSEADOR JSON
    // ==========================================
    /**
     * Extrae y parsea de forma segura el contenido JSON generado por Django json_script
     */
    function leerJSON(id, fallback) {
        const el = document.getElementById(id);
        if (!el) return fallback;
        try {
            let contenido = JSON.parse(el.textContent);
            if (typeof contenido === 'string') {
                contenido = JSON.parse(contenido);
            }
            return contenido;
        } catch (e) {
            console.error(`Error al parsear JSON de #${id}:`, e);
            return fallback;
        }
    }

    // ==========================================
    // 2. FILTRADO INSTANTÁNEO CLIENT-SIDE
    // ==========================================
    const inputBuscar = document.getElementById('buscarTarea');
    const selectEstado = document.getElementById('filtroEstadoTarea');
    const selectPrioridad = document.getElementById('filtroPrioridadTarea');
    const btnLimpiar = document.getElementById('limpiarFiltrosTareas');

    function aplicarFiltrosTareas() {
        // Acotado a #tasksContainer: el listado completo, no las tarjetas
        // del acordeón "tareas de hoy" (que no deben verse afectadas por
        // este filtro).
        const cards = document.querySelectorAll('#tasksContainer .task-card');
        const texto = inputBuscar ? inputBuscar.value.trim().toLowerCase() : '';
        const estadoSel = selectEstado ? selectEstado.value.toUpperCase() : '';
        const prioridadSel = selectPrioridad ? selectPrioridad.value.toUpperCase() : '';

        cards.forEach(card => {
            const titulo = (card.dataset.titulo || '').toLowerCase();
            const empleado = (card.dataset.empleado || '').toLowerCase();
            const estadoCard = (card.dataset.estado || '').toUpperCase();
            const prioridadCard = (card.dataset.prioridad || '').toUpperCase();

            // Obtenemos la columna o contenedor de la tarjeta para ocultar/mostrar
            const contenedor = card.parentElement;

            const coincideTexto = !texto || titulo.includes(texto) || empleado.includes(texto);
            const coincideEstado = !estadoSel || estadoCard === estadoSel;
            const coincidePrioridad = !prioridadSel || prioridadCard === prioridadSel;

            if (coincideTexto && coincideEstado && coincidePrioridad) {
                contenedor.style.removeProperty('display');
            } else {
                contenedor.style.setProperty('display', 'none', 'important');
            }
        });
    }

    // Escuchadores de eventos para los filtros
    [inputBuscar, selectEstado, selectPrioridad].forEach(el => {
        if (el) {
            el.addEventListener('keyup', aplicarFiltrosTareas);
            el.addEventListener('input', aplicarFiltrosTareas);
            el.addEventListener('change', aplicarFiltrosTareas);
        }
    });

    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', function () {
            if (inputBuscar) inputBuscar.value = '';
            if (selectEstado) selectEstado.value = '';
            if (selectPrioridad) selectPrioridad.value = '';
            aplicarFiltrosTareas();
        });
    }

    // ==========================================
    // 3. AUTOCOMPLETADO Y LÓGICA DEL FORMULARIO
    // ==========================================
    const taskForm = document.getElementById('taskForm');
    if (!taskForm) return;

    const OTRA_VALUE = 'OTRA';

    // Carga de datos inyectados por Django desde el HTML
    const empleadosData = leerJSON('empleados-data', {});
    const tareasPorCargo = leerJSON('tareas-por-cargo', {});

    // Elementos del DOM del Formulario Modal
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

    // Almacenar descripción original en caso de alternar con "Otra"
    if (descripcionInput) descripcionInput.dataset.original = descripcionInput.value;

    // Si el título es ingresado por preset, ocultar el input genérico por defecto
    if (tituloInput && !tituloInput.value) {
        tituloInput.style.display = 'none';
    }

    // Establecer fecha mínima para selección (Hoy)
    if (fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.setAttribute('min', hoy);
    }

    function actualizarLimiteHora(horaSalida) {
        if (horaSalida) {
            if (horaInput) horaInput.setAttribute('max', horaSalida);
            if (horaHint) horaHint.textContent = `No puede superar el fin de la jornada (${horaSalida}).`;
        } else {
            if (horaInput) horaInput.removeAttribute('max');
            if (horaHint) horaHint.textContent = '';
        }
    }

    function bloquear(campo) {
        if (!campo) return;
        campo.classList.add('locked-field');
        campo.setAttribute('tabindex', '-1');
        if (campo.tagName === 'INPUT' || campo.tagName === 'TEXTAREA') {
            campo.setAttribute('readonly', 'readonly');
        }
    }

    function desbloquear(campo) {
        if (!campo) return;
        campo.classList.remove('locked-field');
        campo.removeAttribute('tabindex');
        campo.removeAttribute('readonly');
    }

    function poblarTitulos(cargo, tituloPrevio) {
        if (!tituloPreset) return;
        tituloPreset.innerHTML = '';
        const opciones = tareasPorCargo[cargo] || [];

        const optDefault = document.createElement('option');
        optDefault.value = '';
        optDefault.textContent = 'Selecciona una tarea sugerida';
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
        if (tituloInput) {
            tituloInput.value = op.label;
            tituloInput.style.display = 'none';
        }
        if (prioridadSelect) {
            prioridadSelect.value = op.prioridad;
            bloquear(prioridadSelect);
        }
        if (descripcionInput) {
            descripcionInput.value = `Tarea estándar: ${op.label}.`;
            bloquear(descripcionInput);
        }
    }

    function aplicarOtra(tituloExistente) {
        if (tituloInput) {
            tituloInput.value = tituloExistente || '';
            tituloInput.style.display = 'block';
            tituloInput.focus();
        }
        if (prioridadSelect) desbloquear(prioridadSelect);
        if (descripcionInput) {
            descripcionInput.value = descripcionInput.dataset.original || '';
            desbloquear(descripcionInput);
        }
    }

    // Evento al cambiar el empleado en el select
    if (empleadoSelect) {
        empleadoSelect.addEventListener('change', function () {
            const emp = empleadosData[this.value];
            if (!emp) {
                if (cargoDisplay) cargoDisplay.value = '';
                if (tituloPreset) tituloPreset.innerHTML = '<option value="">Selecciona un empleado primero</option>';
                actualizarLimiteHora(null);
                return;
            }
            if (cargoDisplay) cargoDisplay.value = emp.cargo_display || '';
            if (turnoSelect && emp.turno) turnoSelect.value = emp.turno;

            actualizarLimiteHora(emp.hora_salida);
            poblarTitulos(emp.cargo, null);
        });
    }

    // Evento al cambiar la tarea sugerida (preset)
    if (tituloPreset) {
        tituloPreset.addEventListener('change', function () {
            if (this.value === OTRA_VALUE) { 
                aplicarOtra(''); 
                return; 
            }
            const emp = empleadosData[empleadoSelect ? empleadoSelect.value : ''];
            const opciones = (emp && tareasPorCargo[emp.cargo]) || [];
            const op = opciones.find(function (o) { return o.value === tituloPreset.value; });
            if (op) aplicarPreset(op);
        });
    }

    // Cargar datos existentes si se está editando una tarea
    const editando = taskForm.dataset.editando === '1';
    if (editando) {
        const empleadoActual = taskForm.dataset.empleadoActual;
        const tituloActual = taskForm.dataset.tituloActual;

        if (empleadoActual && empleadoSelect) {
            empleadoSelect.value = empleadoActual;
            const emp = empleadosData[empleadoActual];
            if (emp) {
                if (cargoDisplay) cargoDisplay.value = emp.cargo_display || '';
                if (turnoSelect && !turnoSelect.value && emp.turno) turnoSelect.value = emp.turno;
                actualizarLimiteHora(emp.hora_salida);
                poblarTitulos(emp.cargo, tituloActual);
            }
        }
    }
});