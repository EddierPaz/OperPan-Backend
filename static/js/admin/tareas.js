document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. UTILIDAD PARSEADOR JSON
    // ==========================================
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

        const cards = document.querySelectorAll('#tasksContainer .task-card');
        const texto = inputBuscar ? inputBuscar.value.trim().toLowerCase() : '';
        const estadoSel = selectEstado ? selectEstado.value.toUpperCase() : '';
        const prioridadSel = selectPrioridad ? selectPrioridad.value.toUpperCase() : '';

        cards.forEach(card => {
            const titulo = (card.dataset.titulo || '').toLowerCase();
            const empleado = (card.dataset.empleado || '').toLowerCase();
            const estadoCard = (card.dataset.estado || '').toUpperCase();
            const prioridadCard = (card.dataset.prioridad || '').toUpperCase();
            const esVencida = card.dataset.vencida === 'true';

            const contenedor = card.parentElement;

            let coincideEstado = true;

            if (estadoSel === 'VENCIDA') {
                coincideEstado = esVencida;
            } else if (estadoSel) {
                if (esVencida) {
                    coincideEstado = false;
                } else {
                    coincideEstado = estadoCard === estadoSel;
                }
            } else {
                coincideEstado = true;
            }

            const coincideTexto = !texto || titulo.includes(texto) || empleado.includes(texto);
            const coincidePrioridad = !prioridadSel || prioridadCard === prioridadSel;

            if (coincideTexto && coincideEstado && coincidePrioridad) {
                contenedor.style.removeProperty('display');
            } else {
                contenedor.style.setProperty('display', 'none', 'important');
            }
        });
    }

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

    const empleadosData = leerJSON('empleados-data', {});
    const tareasPorCargo = leerJSON('tareas-por-cargo', {});

    const empleadoSelect = document.getElementById('id_empleado');
    const cargoDisplay = document.getElementById('id_cargo_display');
    const turnoSelect = document.getElementById('id_turno_asociado');
    const turnoDisplay = document.getElementById('id_turno_display');
    const tituloPreset = document.getElementById('id_titulo_preset');
    const tituloInput = document.getElementById('id_titulo');
    const prioridadSelect = document.getElementById('id_prioridad');
    const descripcionInput = document.getElementById('id_descripcion');
    const fechaInput = document.getElementById('id_fecha_limite');
    const horaInput = document.getElementById('id_hora_limite');
    const horaHint = document.getElementById('hora-limite-hint');
    const horaError = document.getElementById('hora-limite-error');

    // Almacenar descripción original
    if (descripcionInput) descripcionInput.dataset.original = descripcionInput.value;

    if (tituloInput && !tituloInput.value) {
        tituloInput.style.display = 'none';
    }

    if (fechaInput) {
        const hoy = new Date();
        const manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1);
        const year = manana.getFullYear();
        const month = String(manana.getMonth() + 1).padStart(2, '0');
        const day = String(manana.getDate()).padStart(2, '0');
        fechaInput.setAttribute('min', `${year}-${month}-${day}`);
    }

    function aplicarTurnoAutomatico(turnoValue, turnoLabel) {
        if (turnoSelect) {
            turnoSelect.value = turnoValue || '';
            turnoSelect.style.display = 'none';
        }
        if (turnoDisplay) {
            turnoDisplay.style.display = 'block';
            turnoDisplay.value = turnoLabel || '';
        }
    }

    function permitirTurnoManual(turnoActual) {
        if (turnoSelect) {
            turnoSelect.style.display = 'block';
            turnoSelect.value = turnoActual || '';
        }
        if (turnoDisplay) {
            turnoDisplay.style.display = 'none';
            turnoDisplay.value = '';
        }
    }

    // ==========================================
    // 3.1 VALIDACIÓN DE HORA LÍMITE (NUEVO)
    // ==========================================
    function validarHoraLimite(horaEntrada, horaSalida) {
        if (!horaInput) return;

        const valor = horaInput.value;
        const errorElement = document.getElementById('hora-limite-error');
        const hintElement = document.getElementById('hora-limite-hint');

        // Limpiar errores previos
        horaInput.classList.remove('is-invalid', 'is-valid');

        // Actualizar hint
        if (horaEntrada && horaSalida) {
            if (hintElement) {
                hintElement.textContent = `⏰ Rango permitido: ${horaEntrada} - ${horaSalida} (jornada del empleado)`;
                hintElement.style.color = '#6c757d';
            }
        } else if (horaEntrada) {
            if (hintElement) {
                hintElement.textContent = `⏰ Hora mínima: ${horaEntrada} (inicio de jornada)`;
                hintElement.style.color = '#6c757d';
            }
        } else if (horaSalida) {
            if (hintElement) {
                hintElement.textContent = `⏰ Hora máxima: ${horaSalida} (fin de jornada)`;
                hintElement.style.color = '#6c757d';
            }
        } else {
            if (hintElement) {
                hintElement.textContent = '⏰ Debe estar dentro del rango de la jornada del empleado';
                hintElement.style.color = '#6c757d';
            }
        }

        // Validar si hay valor
        if (!valor) {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            horaInput.setCustomValidity('La hora límite es obligatoria.');
            return;
        }

        // Validar rango
        if (horaEntrada && valor < horaEntrada) {
            horaInput.classList.add('is-invalid');
            if (errorElement) {
                errorElement.style.display = 'block';
                errorElement.textContent = `❌ La hora no puede ser antes de ${horaEntrada} (inicio de jornada).`;
            }
            horaInput.setCustomValidity(`La hora no puede ser antes de ${horaEntrada}.`);
            return;
        }

        if (horaSalida && valor > horaSalida) {
            horaInput.classList.add('is-invalid');
            if (errorElement) {
                errorElement.style.display = 'block';
                errorElement.textContent = `❌ La hora no puede superar ${horaSalida} (fin de jornada).`;
            }
            horaInput.setCustomValidity(`La hora no puede superar ${horaSalida}.`);
            return;
        }

        // Válido
        horaInput.classList.remove('is-invalid');
        horaInput.classList.add('is-valid');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        horaInput.setCustomValidity('');
    }

    function actualizarLimiteHora(horaEntrada, horaSalida) {
        if (horaInput) {
            if (horaSalida) horaInput.setAttribute('max', horaSalida);
            else horaInput.removeAttribute('max');

            if (horaEntrada) horaInput.setAttribute('min', horaEntrada);
            else horaInput.removeAttribute('min');

            // Hacer required si no lo está
            horaInput.setAttribute('required', 'required');
        }

        // Aplicar validación si hay valor
        if (horaInput && horaInput.value) {
            validarHoraLimite(horaEntrada, horaSalida);
        } else {
            // Mostrar hint incluso sin valor
            validarHoraLimite(horaEntrada, horaSalida);
        }
    }

    // Eventos para validación en tiempo real
    if (horaInput) {
        horaInput.addEventListener('input', function() {
            const emp = empleadosData[empleadoSelect ? empleadoSelect.value : ''];
            validarHoraLimite(
                emp ? emp.hora_entrada : null,
                emp ? emp.hora_salida : null
            );
        });
        horaInput.addEventListener('change', function() {
            const emp = empleadosData[empleadoSelect ? empleadoSelect.value : ''];
            validarHoraLimite(
                emp ? emp.hora_entrada : null,
                emp ? emp.hora_salida : null
            );
        });
    }

    // ==========================================
    // 3.2 FUNCIONES DE BLOQUEO
    // ==========================================
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

    // ==========================================
    // 3.3 FUNCIONES DE POBLADO
    // ==========================================
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

    // ==========================================
    // 3.4 EVENTOS DEL FORMULARIO
    // ==========================================

    // Cambio de empleado
    if (empleadoSelect) {
        empleadoSelect.addEventListener('change', function () {
            const emp = empleadosData[this.value];
            if (!emp) {
                if (cargoDisplay) cargoDisplay.value = '';
                permitirTurnoManual('');
                if (tituloPreset) tituloPreset.innerHTML = '<option value="">Selecciona un empleado primero</option>';
                actualizarLimiteHora(null, null);
                return;
            }
            if (cargoDisplay) cargoDisplay.value = emp.cargo_display || '';
            if (emp.turno) {
                aplicarTurnoAutomatico(emp.turno, emp.turno_display);
            } else {
                permitirTurnoManual('');
            }
            actualizarLimiteHora(emp.hora_entrada, emp.hora_salida);
            poblarTitulos(emp.cargo, null);

            // Resetear hora si está fuera del rango
            if (horaInput && horaInput.value) {
                validarHoraLimite(emp.hora_entrada, emp.hora_salida);
            }
        });
    }

    // Cambio de tarea preseleccionada
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

    // ==========================================
    // 4. CARGA DE DATOS EXISTENTES (EDICIÓN)
    // ==========================================
    const editando = taskForm.dataset.editando === '1';
    if (editando) {
        const empleadoActual = taskForm.dataset.empleadoActual;
        const tituloActual = taskForm.dataset.tituloActual;
        const turnoActual = taskForm.dataset.turnoActual;

        if (empleadoActual && empleadoSelect) {
            empleadoSelect.value = empleadoActual;
            const emp = empleadosData[empleadoActual];
            if (emp) {
                if (cargoDisplay) cargoDisplay.value = emp.cargo_display || '';
                if (emp.turno) {
                    aplicarTurnoAutomatico(emp.turno, emp.turno_display);
                } else {
                    permitirTurnoManual(turnoActual);
                }
                actualizarLimiteHora(emp.hora_entrada, emp.hora_salida);
                poblarTitulos(emp.cargo, tituloActual);
            }
        }
    }

    // ==========================================
    // 5. VALIDACIÓN ANTES DE ENVIAR
    // ==========================================
    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            const horaValor = horaInput ? horaInput.value : '';
            if (!horaValor) {
                e.preventDefault();
                mostrarError('La hora límite es obligatoria. Por favor selecciona una hora.');
                if (horaInput) {
                    horaInput.classList.add('is-invalid');
                    horaInput.focus();
                }
                return;
            }

            // Verificar que la hora sea válida según el rango
            const emp = empleadosData[empleadoSelect ? empleadoSelect.value : ''];
            if (emp && emp.hora_entrada && emp.hora_salida) {
                if (horaValor < emp.hora_entrada || horaValor > emp.hora_salida) {
                    e.preventDefault();
                    mostrarError(`La hora debe estar dentro del rango ${emp.hora_entrada} - ${emp.hora_salida}.`);
                    if (horaInput) {
                        horaInput.classList.add('is-invalid');
                        horaInput.focus();
                    }
                    return;
                }
            }
        });
    }

    function mostrarError(mensaje) {
        // Usar el toast si existe, o alert simple
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer && typeof mostrarToast === 'function') {
            mostrarToast(mensaje, 'warning');
        } else {
            alert(mensaje);
        }
    }

});