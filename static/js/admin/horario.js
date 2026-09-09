document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. TOAST
    // ==========================================
    function mostrarToast(mensaje, tipo = 'warning') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const existing = container.querySelectorAll('.app-toast');
        existing.forEach(el => el.remove());

        const toast = document.createElement('div');
        toast.className = `app-toast app-toast-${tipo}`;
        toast.setAttribute('role', 'alert');

        let icono = 'bi-exclamation-triangle-fill';
        if (tipo === 'success') icono = 'bi-check-circle-fill';
        else if (tipo === 'danger') icono = 'bi-x-circle-fill';
        else if (tipo === 'info') icono = 'bi-info-circle-fill';

        toast.innerHTML = `
            <div class="app-toast-icon">
                <i class="bi ${icono}"></i>
            </div>
            <div class="app-toast-msg">${mensaje}</div>
            <button type="button" class="app-toast-close" aria-label="Cerrar">
                <i class="bi bi-x-lg"></i>
            </button>
        `;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        const timeout = setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 4000);

        const closeBtn = toast.querySelector('.app-toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                clearTimeout(timeout);
                toast.classList.add('hide');
                setTimeout(() => toast.remove(), 300);
            });
        }
    }

    // ==========================================
    // 2. CALENDARIO DE CICLO (crear y editar horario)
    // ==========================================
    function diasVisibles(turno) {
        return turno === "FIJO" ? 7 : 15;
    }

    function actualizarDiasCalendario(ciclo, turno, inputFecha, label, texto) {
        if (!ciclo) return;
        const maxDias = diasVisibles(turno);
        ciclo.querySelectorAll(".dia-btn").forEach(function (btn) {
            const indice = parseInt(btn.dataset.indice, 10);
            if (indice < maxDias) {
                btn.style.display = "";
            } else {
                btn.style.display = "none";
                if (btn.classList.contains("seleccionado")) {
                    btn.classList.remove("seleccionado");
                    if (inputFecha) inputFecha.value = "";
                    if (label) label.style.display = "none";
                    if (texto) texto.textContent = "";
                }
            }
        });
    }

    // Autocompletar cargo al seleccionar empleado
    const empleadoSelect = document.getElementById("empleadoSelect");
    const cargoInput = document.getElementById("cargoInput");
    if (empleadoSelect && cargoInput) {
        empleadoSelect.addEventListener("change", function () {
            const opcion = this.options[this.selectedIndex];
            cargoInput.value = opcion.dataset.cargo || "";
        });
    }

    // Calendario para crear horario
    const turnoSelect = document.getElementById("turnoSelect");
    const horaEntrada = document.getElementById("horaEntrada");
    const horaSalida = document.getElementById("horaSalida");
    const cicloCrear = document.getElementById("ciclo14x1");
    const inputCrear = document.getElementById("fechaDescansoInput");
    const labelCrear = document.getElementById("descansoLabel");
    const textoCrear = document.getElementById("descansoFechaTexto");

    if (turnoSelect) {
        turnoSelect.addEventListener("change", function () {
            switch (this.value) {
                case "MANANA":
                    horaEntrada.value = "05:00";
                    horaSalida.value = "13:00";
                    break;
                case "TARDE":
                    horaEntrada.value = "13:00";
                    horaSalida.value = "22:00";
                    break;
                case "FIJO":
                    horaEntrada.value = "08:00";
                    horaSalida.value = "17:00";
                    break;
                default:
                    horaEntrada.value = "";
                    horaSalida.value = "";
            }
            actualizarDiasCalendario(cicloCrear, this.value, inputCrear, labelCrear, textoCrear);
        });
        actualizarDiasCalendario(cicloCrear, turnoSelect.value, inputCrear, labelCrear, textoCrear);
    }

    if (cicloCrear) {
        cicloCrear.addEventListener("click", function (e) {
            const btn = e.target.closest(".dia-btn");
            if (!btn || btn.style.display === "none") return;
            cicloCrear.querySelectorAll(".dia-btn").forEach(b => b.classList.remove("seleccionado"));
            btn.classList.add("seleccionado");
            inputCrear.value = btn.dataset.fecha;
            textoCrear.textContent = btn.dataset.label;
            labelCrear.style.display = "block";
        });
    }

    // Limpiar formulario crear horario
    const btnLimpiar = document.getElementById("btnLimpiarHorario");
    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", function () {
            setTimeout(function () {
                if (cargoInput) cargoInput.value = "";
                if (inputCrear) inputCrear.value = "";
                if (labelCrear) labelCrear.style.display = "none";
                if (textoCrear) textoCrear.textContent = "";
                document.querySelectorAll("#ciclo14x1 .dia-btn").forEach(function (b) {
                    b.classList.remove("seleccionado");
                    b.blur();
                });
                actualizarDiasCalendario(cicloCrear, "", inputCrear, labelCrear, textoCrear);
            }, 10);
        });
    }

    // Calendario para editar horario
    const cicloEditar = document.getElementById("ciclo14x1Editar");
    const inputEditar = document.getElementById("fechaDescansoEditarInput");
    const labelEditar = document.getElementById("descansoEditarLabel");
    const textoEditar = document.getElementById("descansoEditarFechaTexto");
    const editarTurnoSelect = document.getElementById("editar-turno");

    // Variables para controlar el estado del descanso
    let descansoPasado = false;
    let fechaDescansoActual = null;
    let cicloInicio = null;
    let cicloFin = null;
    let turnoActual = null;

    // Crear elemento para mensaje de advertencia en el modal de edición
    const modalEditarBody = document.querySelector('#modalEditarHorario .modal-body');
    let avisoEdicion = null;
    if (modalEditarBody) {
        avisoEdicion = document.createElement('div');
        avisoEdicion.id = 'descanso-edit-aviso';
        avisoEdicion.className = 'alert alert-warning d-none';
        avisoEdicion.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i> ';
        modalEditarBody.insertBefore(avisoEdicion, modalEditarBody.firstChild);
    }

    if (editarTurnoSelect) {
        editarTurnoSelect.addEventListener("change", function () {
            actualizarDiasCalendario(cicloEditar, this.value, inputEditar, labelEditar, textoEditar);
        });
    }

    if (cicloEditar) {
        cicloEditar.addEventListener("click", function (e) {
            const btn = e.target.closest(".dia-btn");
            if (!btn || btn.style.display === "none") return;

            // Obtener la fecha seleccionada
            const fechaStr = btn.dataset.fecha;
            if (!fechaStr) return;

            const fechaSeleccionada = new Date(fechaStr + 'T00:00:00');
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            // =====================================================
            // VALIDACIÓN 1: No permitir fechas pasadas O EL DÍA ACTUAL
            // =====================================================
            if (fechaSeleccionada <= hoy) {
                mostrarToast("No puedes seleccionar el día de hoy o una fecha que ya pasó.", "warning");
                return;
            }

            // =====================================================
            // VALIDACIÓN 2: Si el descanso ya pasó, bloquear cualquier cambio
            // =====================================================
            if (descansoPasado) {
                mostrarToast(
                    "El descanso de este ciclo ya ocurrió. No se puede modificar.",
                    "warning"
                );
                return;
            }

            // =====================================================
            // VALIDACIÓN 3: Verificar que la fecha esté dentro del ciclo actual
            // =====================================================
            if (cicloInicio && cicloFin) {
                const fechaInicio = new Date(cicloInicio + 'T00:00:00');
                const fechaFin = new Date(cicloFin + 'T00:00:00');
                if (fechaSeleccionada < fechaInicio || fechaSeleccionada > fechaFin) {
                    const inicioStr = fechaInicio.toLocaleDateString('es-ES');
                    const finStr = fechaFin.toLocaleDateString('es-ES');
                    mostrarToast(
                        `La fecha debe estar dentro del ciclo actual (${inicioStr} - ${finStr}).`,
                        "warning"
                    );
                    return;
                }
            }

            // Si pasa todas las validaciones, seleccionar
            cicloEditar.querySelectorAll(".dia-btn").forEach(b => b.classList.remove("seleccionado"));
            btn.classList.add("seleccionado");
            inputEditar.value = btn.dataset.fecha;
            textoEditar.textContent = btn.dataset.label;
            labelEditar.style.display = "block";
        });
    }

    // ==========================================
    // 3. VER / EDITAR / ELIMINAR HORARIO (modales)
    // ==========================================

    // Referencias del modal de eliminar
    const modalEliminarElement = document.getElementById("modalEliminarHorario");
    const formEliminarHorario = document.getElementById("formEliminarHorario");
    const btnConfirmarEliminar = formEliminarHorario
        ? formEliminarHorario.querySelector('button[type="submit"]')
        : null;
    const eliminarBodyElement = modalEliminarElement
        ? modalEliminarElement.querySelector(".modal-body")
        : null;

    let avisoBloqueo = null;
    if (eliminarBodyElement) {
        avisoBloqueo = document.createElement("p");
        avisoBloqueo.id = "eliminarHorarioBloqueadoMsg";
        avisoBloqueo.className = "text-danger small mt-3 mb-0";
        avisoBloqueo.style.display = "none";
        avisoBloqueo.innerHTML = '<i class="bi bi-shield-exclamation me-1"></i> ' +
            "Este horario ya tiene asistencia registrada y no se puede eliminar.";
        eliminarBodyElement.appendChild(avisoBloqueo);
    }

    function bloquearEliminacion(bloqueado) {
        if (avisoBloqueo) avisoBloqueo.style.display = bloqueado ? "block" : "none";
        if (btnConfirmarEliminar) {
            btnConfirmarEliminar.disabled = bloqueado;
            btnConfirmarEliminar.classList.toggle("disabled", bloqueado);
        }
    }

    document.addEventListener("click", function (e) {
        const btnVer = e.target.closest(".btn-ver-horario");
        if (btnVer) {
            const id = btnVer.dataset.id;
            fetch("/asistencia/horarios/" + id + "/json/")
                .then(function (res) {
                    if (!res.ok) throw new Error("Error en la respuesta del servidor");
                    return res.json();
                })
                .then(function (data) {
                    document.getElementById("ver-empleado").textContent = data.empleado;
                    document.getElementById("ver-cargo").textContent = data.cargo;
                    document.getElementById("ver-turno").textContent = data.turno;
                    document.getElementById("ver-entrada").textContent = data.hora_entrada;
                    document.getElementById("ver-salida").textContent = data.hora_salida;
                    document.getElementById("ver-descanso").textContent = data.descanso || "Sin asignar";
                    document.getElementById("ver-estado").textContent = data.estado ? "Activo" : "Inactivo";
                    const ciclo = document.getElementById("ver-ciclo");
                    if (ciclo) {
                        ciclo.textContent = (data.ciclo_inicio && data.ciclo_fin)
                            ? data.ciclo_inicio + " — " + data.ciclo_fin
                            : "Sin definir";
                    }
                    const modalVer = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalVerHorario"));
                    modalVer.show();
                })
                .catch(function (err) {
                    console.error(err);
                    mostrarToast("No se pudo cargar la información del horario.", "danger");
                });
        }

        const btnEditar = e.target.closest(".btn-editar-horario");
        if (btnEditar) {
            const id = btnEditar.dataset.id;
            fetch("/asistencia/horarios/" + id + "/json/")
                .then(function (res) {
                    if (!res.ok) throw new Error("Error en la respuesta del servidor");
                    return res.json();
                })
                .then(function (data) {
                    // Guardar datos del ciclo y descanso para validaciones
                    descansoPasado = data.descanso_pasado || false;
                    fechaDescansoActual = data.descanso_fecha || null;
                    cicloInicio = data.ciclo_inicio || null;
                    cicloFin = data.ciclo_fin || null;
                    turnoActual = data.turno_valor || null;

                    document.getElementById("editar-empleado").value = data.empleado;
                    document.getElementById("editar-cargo").value = data.cargo;
                    document.getElementById("editar-turno").value = data.turno_valor;
                    document.getElementById("editar-entrada").value = data.hora_entrada;
                    document.getElementById("editar-salida").value = data.hora_salida;
                    document.getElementById("formEditar").action = "/asistencia/horarios/" + id + "/editar/";

                    const labelActual = document.getElementById("descanso-actual-label");
                    if (labelActual) {
                        labelActual.textContent = data.descanso ? "— actual: " + data.descanso : "";
                    }

                    // =====================================================
                    // Mostrar advertencia si el descanso ya pasó o es hoy
                    // =====================================================
                    if (avisoEdicion) {
                        const hoy = new Date();
                        hoy.setHours(0, 0, 0, 0);
                        const fechaDesc = fechaDescansoActual ? new Date(fechaDescansoActual + 'T00:00:00') : null;
                        const esHoyOAntes = fechaDesc && fechaDesc <= hoy;

                        if (descansoPasado || esHoyOAntes) {
                            const fechaStr = fechaDesc ? fechaDesc.toLocaleDateString('es-ES') : 'fecha desconocida';
                            avisoEdicion.classList.remove('d-none');
                            avisoEdicion.innerHTML = `
                                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                <strong>Atención:</strong> El descanso de este ciclo (${fechaStr}) 
                                ${descansoPasado ? 'ya ocurrió' : 'está en el día de hoy'}. 
                                No se puede modificar. El siguiente descanso se generará automáticamente.
                            `;
                            // Deshabilitar el calendario
                            cicloEditar.style.pointerEvents = 'none';
                            cicloEditar.style.opacity = '0.5';
                            cicloEditar.style.cursor = 'not-allowed';
                            // Deshabilitar el botón de limpiar
                            const btnLimpiarEditar = document.getElementById('btnLimpiarEditar');
                            if (btnLimpiarEditar) {
                                btnLimpiarEditar.disabled = true;
                                btnLimpiarEditar.style.opacity = '0.5';
                            }
                        } else {
                            avisoEdicion.classList.add('d-none');
                            cicloEditar.style.pointerEvents = 'auto';
                            cicloEditar.style.opacity = '1';
                            cicloEditar.style.cursor = 'default';
                            const btnLimpiarEditar = document.getElementById('btnLimpiarEditar');
                            if (btnLimpiarEditar) {
                                btnLimpiarEditar.disabled = false;
                                btnLimpiarEditar.style.opacity = '1';
                            }
                        }
                    }

                    actualizarDiasCalendario(cicloEditar, data.turno_valor, inputEditar, labelEditar, textoEditar);

                    // Seleccionar el día de descanso en el calendario
                    if (cicloEditar) {
                        cicloEditar.querySelectorAll(".dia-btn").forEach(function (b) {
                            b.classList.remove("seleccionado");
                            if (data.descanso_fecha && b.dataset.fecha === data.descanso_fecha) {
                                b.classList.add("seleccionado");
                            }
                        });
                    }

                    // =====================================================
                    // Marcar días pasados y el día actual como deshabilitados
                    // =====================================================
                    if (cicloEditar) {
                        const hoy = new Date();
                        hoy.setHours(0, 0, 0, 0);
                        cicloEditar.querySelectorAll(".dia-btn").forEach(function (b) {
                            const fechaStr = b.dataset.fecha;
                            if (fechaStr) {
                                const fecha = new Date(fechaStr + 'T00:00:00');
                                // Deshabilitar días pasados Y el día actual
                                if (fecha <= hoy) {
                                    b.style.opacity = '0.3';
                                    b.style.cursor = 'not-allowed';
                                    b.title = fecha < hoy ? 'Fecha pasada - No seleccionable' : 'Hoy - No seleccionable';
                                } else {
                                    b.style.opacity = '1';
                                    b.style.cursor = 'pointer';
                                    b.title = '';
                                }
                            }
                        });
                    }

                    if (inputEditar) inputEditar.value = data.descanso_fecha || "";
                    if (labelEditar) labelEditar.style.display = "none";
                    if (textoEditar) textoEditar.textContent = "";

                    const modalEditar = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalEditarHorario"));
                    modalEditar.show();
                })
                .catch(function (err) {
                    console.error(err);
                    mostrarToast("No se pudo cargar la información para editar el horario.", "danger");
                });
        }

        // Eliminar horario
        const btnEliminar = e.target.closest(".btn-eliminar-horario");
        if (btnEliminar) {
            e.preventDefault();
            const id = btnEliminar.dataset.id;
            const nombre = btnEliminar.dataset.empleado || "empleado";

            if (formEliminarHorario) {
                formEliminarHorario.action = "/asistencia/horarios/" + id + "/eliminar/";
            }
            const nombreSpan = document.getElementById("eliminar-empleado-nombre");
            if (nombreSpan) {
                nombreSpan.textContent = nombre;
            }

            bloquearEliminacion(false);

            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalEliminarHorario"));
            modal.show();

            fetch("/asistencia/horarios/" + id + "/json/")
                .then(function (res) {
                    if (!res.ok) throw new Error("Error en la respuesta del servidor");
                    return res.json();
                })
                .then(function (data) {
                    bloquearEliminacion(!!data.tiene_asistencia);
                })
                .catch(function (err) {
                    console.error(err);
                });
        }
    });

    // Al enviar el formulario de eliminar, doble seguro
    if (formEliminarHorario) {
        formEliminarHorario.addEventListener("submit", function (e) {
            if (btnConfirmarEliminar && btnConfirmarEliminar.disabled) {
                e.preventDefault();
                mostrarToast("Este horario no se puede eliminar porque tiene asistencia registrada.", "warning");
            }
        });
    }

    // ==========================================
    // 4. FILTROS DE LA TABLA DE HORARIOS
    // ==========================================
    const filas = document.querySelectorAll("table.table-custom tbody tr");
    const inputBuscar = document.getElementById("buscarHorario");
    const selectTurno = document.getElementById("filtroTurno");

    if (inputBuscar) {
        function aplicarFiltros() {
            const texto = inputBuscar.value.trim().toLowerCase();
            const turno = selectTurno ? selectTurno.value.toLowerCase() : "";
            
            filas.forEach(fila => {
                const celdas = fila.querySelectorAll("td");
                if (celdas.length < 2) return;
                
                const empleado = celdas[0].textContent.trim().toLowerCase();
                const turnoFila = celdas[1].textContent.trim().toLowerCase();
                
                const coincideTexto = !texto || empleado.includes(texto);
                const coincideTurno = !turno || turnoFila === turno;
                
                fila.style.display = (coincideTexto && coincideTurno) ? "" : "none";
            });
        }

        if (inputBuscar) {
            inputBuscar.addEventListener("input", aplicarFiltros);
            inputBuscar.addEventListener("keyup", aplicarFiltros);
        }
        if (selectTurno) {
            selectTurno.addEventListener("change", aplicarFiltros);
        }

        const btnLimpiarFiltros = document.getElementById("limpiarFiltrosHorarios");
        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener("click", function () {
                inputBuscar.value = "";
                if (selectTurno) selectTurno.value = "";
                aplicarFiltros();
            });
        }
    }

});