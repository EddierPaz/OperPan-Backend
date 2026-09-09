document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. TOAST (duplicado de asistencia.js: horarios.js
    // vive en páginas que no cargan asistencia.js, así
    // que necesita su propia copia de la función)
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

    if (editarTurnoSelect) {
        editarTurnoSelect.addEventListener("change", function () {
            actualizarDiasCalendario(cicloEditar, this.value, inputEditar, labelEditar, textoEditar);
        });
    }

    if (cicloEditar) {
        cicloEditar.addEventListener("click", function (e) {
            const btn = e.target.closest(".dia-btn");
            if (!btn || btn.style.display === "none") return;
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

    // Referencias del modal de eliminar (para el bloqueo por asistencia)
    const modalEliminarElement = document.getElementById("modalEliminarHorario");
    const formEliminarHorario = document.getElementById("formEliminarHorario");
    const btnConfirmarEliminar = formEliminarHorario
        ? formEliminarHorario.querySelector('button[type="submit"]')
        : null;
    const eliminarBodyElement = modalEliminarElement
        ? modalEliminarElement.querySelector(".modal-body")
        : null;

    // Mensaje de bloqueo: se crea una sola vez y se muestra/oculta,
    // en vez de inyectarlo cada vez que se abre el modal.
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
                    actualizarDiasCalendario(cicloEditar, data.turno_valor, inputEditar, labelEditar, textoEditar);
                    if (cicloEditar) {
                        cicloEditar.querySelectorAll(".dia-btn").forEach(function (b) {
                            b.classList.remove("seleccionado");
                            if (data.descanso_fecha && b.dataset.fecha === data.descanso_fecha) {
                                b.classList.add("seleccionado");
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

        // Eliminar horario: antes de mostrar el modal, se consulta si el
        // horario ya tiene asistencia registrada y, de ser así, se
        // bloquea el botón de confirmar en vez de dejar que el usuario
        // intente y reciba el error solo después de enviar el formulario.
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

            // Estado inicial: habilitado, mientras se confirma con el servidor
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
                    // Si falla la consulta, no se bloquea aquí: el backend
                    // sigue siendo la validación real al enviar el formulario.
                });
        }
    });

    // Al enviar el formulario de eliminar, doble seguro por si el botón
    // quedó deshabilitado justo cuando el usuario hizo clic.
    if (formEliminarHorario) {
        formEliminarHorario.addEventListener("submit", function (e) {
            if (btnConfirmarEliminar && btnConfirmarEliminar.disabled) {
                e.preventDefault();
            }
        });
    }

    // ==========================================
    // 4. FILTROS DE LA TABLA DE HORARIOS
    // ==========================================
    const filas = document.querySelectorAll("table.table-custom tbody tr");
    const inputBuscar = document.getElementById("buscarHorario");
    const selectTurno = document.getElementById("filtroTurno");
    // NOTA: No hay filtro de estado en esta tabla, solo turno

    if (inputBuscar) {
        function aplicarFiltros() {
            const texto = inputBuscar.value.trim().toLowerCase();
            const turno = selectTurno ? selectTurno.value.toLowerCase() : "";
            
            filas.forEach(fila => {
                const celdas = fila.querySelectorAll("td");
                if (celdas.length < 2) return;
                
                // El nombre está en la primera columna (celdas[0])
                const empleado = celdas[0].textContent.trim().toLowerCase();
                
                // El turno está en la segunda columna (celdas[1])
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