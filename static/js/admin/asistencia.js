document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. HELPER: MOSTRAR / OCLUTAR DÍAS CALENDARIO
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

    // ==========================================
    // 2. AUTOCOMPLETA CARGO DEL EMPLEADO (para horarios)
    // ==========================================
    const empleadoSelect = document.getElementById("empleadoSelect");
    const cargoInput = document.getElementById("cargoInput");
    if (empleadoSelect && cargoInput) {
        empleadoSelect.addEventListener("change", function () {
            const opcion = this.options[this.selectedIndex];
            cargoInput.value = opcion.dataset.cargo || "";
        });
    }

    // ==========================================
    // 3. CALENDARIO Y HORARIOS — CREAR
    // ==========================================
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

    // ==========================================
    // 4. LIMPIAR FORMULARIO CREAR
    // ==========================================
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

    // ==========================================
    // 5. CALENDARIO — EDITAR
    // ==========================================
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
    // 6. DELEGACIÓN DE EVENTOS (VER Y EDITAR MODALES DE HORARIOS)
    // ==========================================
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
                    alert("No se pudo cargar la información del horario.");
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
                    alert("No se pudo cargar la información para editar el horario.");
                });
        }
    });

    // ==========================================
    // 7. FILTROS DE BÚSQUEDA Y SELECCIÓN EN TABLA (existente)
    // ==========================================
    const filas = document.querySelectorAll("table.table-custom tbody tr");
    const inputBuscar = document.getElementById("buscarHorario");
    const selectTurno = document.getElementById("filtroTurno");
    const selectEstado = document.getElementById("filtroEstadoHorario");

    if (inputBuscar) {
        function aplicarFiltros() {
            const texto = inputBuscar.value.trim().toLowerCase();
            const turno = selectTurno.value.toLowerCase();
            const estado = selectEstado.value.toLowerCase();
            filas.forEach(fila => {
                const celdas = fila.querySelectorAll("td");
                if (celdas.length < 6) return;
                const empleado = celdas[0].textContent.trim().toLowerCase();
                const turnoFila = celdas[2].textContent.trim().toLowerCase();
                const estadoFila = celdas[5].textContent.trim().toLowerCase();
                const coincideTexto = !texto || empleado.includes(texto);
                const coincideTurno = !turno || turnoFila === turno;
                const coincideEstado = !estado || estadoFila === estado;
                fila.style.display = (coincideTexto && coincideTurno && coincideEstado) ? "" : "none";
            });
        }

        [inputBuscar, selectTurno, selectEstado].forEach(el => {
            if (el) {
                el.addEventListener("input", aplicarFiltros);
                el.addEventListener("change", aplicarFiltros);
            }
        });

        const btnLimpiarFiltros = document.getElementById("limpiarFiltrosHorarios");
        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener("click", function () {
                inputBuscar.value = "";
                if (selectTurno) selectTurno.value = "";
                if (selectEstado) selectEstado.value = "";
                aplicarFiltros();
            });
        }
    }

    // ==========================================
    // 8. ELIMINAR HORARIO
    // ==========================================
    document.addEventListener("click", function (e) {
        const btnEliminar = e.target.closest(".btn-eliminar-horario");
        if (btnEliminar) {
            e.preventDefault();
            const id = btnEliminar.dataset.id;
            const nombre = btnEliminar.dataset.empleado || "empleado";
            const form = document.getElementById("formEliminarHorario");
            if (form) {
                form.action = "/asistencia/horarios/" + id + "/eliminar/";
            }
            const nombreSpan = document.getElementById("eliminar-empleado-nombre");
            if (nombreSpan) {
                nombreSpan.textContent = nombre;
            }
            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalEliminarHorario"));
            modal.show();
        }
    });

    // ==========================================
    // 9. NUEVA FUNCIONALIDAD: HISTORIAL Y FILTROS
    // ==========================================
    const wrapper = document.getElementById('historialWrapper');
    if (!wrapper) return;

    const inputBuscarHistorial = document.getElementById('buscarHistorial');
    const selectTurnoHistorial = document.getElementById('filtroTurno');
    const selectEstadoHistorial = document.getElementById('filtroEstado');
    const selectEmpleadoHistorial = document.getElementById('filtroEmpleado'); 
    const btnLimpiarHistorial = document.getElementById('limpiarFiltrosHistorial');
    const seccionHistorial = document.getElementById('seccionHistorial');

    function cargarHistorial(page = 1) {
        const busqueda = inputBuscarHistorial.value.trim();
        const turno = selectTurnoHistorial.value;
        const estado = selectEstadoHistorial.value;
        const empleado = selectEmpleadoHistorial.value;

        const fechaUnica = document.getElementById('fechaUnicaSeleccionada')?.value || '';
        const fechaDesde = document.getElementById('fechaDesdeSeleccionada')?.value || '';
        const fechaHasta = document.getElementById('fechaHastaSeleccionada')?.value || '';

        const params = new URLSearchParams();
        params.append('page', page);
        if (busqueda) params.append('busqueda', busqueda);
        if (turno) params.append('turno', turno);
        if (estado) params.append('estado', estado);
        if (empleado) params.append('empleado', empleado); // IMPORTANTE: enviar 'empleado' (singular)
        if (fechaUnica) params.append('fecha_unica', fechaUnica);
        if (fechaDesde) params.append('fecha_desde', fechaDesde);
        if (fechaHasta) params.append('fecha_hasta', fechaHasta);

        const url = window.location.pathname + 'historico/?' + params.toString();

        fetch(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.text())
        .then(html => {
            if (wrapper) {
                wrapper.innerHTML = html;
            }
            if (window.history && window.history.pushState) {
                const newUrl = window.location.pathname + '?' + params.toString();
                window.history.pushState({}, '', newUrl);
            }
            if (seccionHistorial) {
                seccionHistorial.scrollIntoView({ behavior: 'smooth' });
            }
        })
        .catch(error => {
            console.error('Error al cargar historial:', error);
        });
    }

    // Debounce para búsqueda
    let timeoutId = null;
    if (inputBuscarHistorial) {
        inputBuscarHistorial.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                cargarHistorial(1);
            }, 300);
        });
    }

    // Eventos de selects (turno, estado, empleado)
    if (selectTurnoHistorial) {
        selectTurnoHistorial.addEventListener('change', function() {
            cargarHistorial(1);
        });
    }
    if (selectEstadoHistorial) {
        selectEstadoHistorial.addEventListener('change', function() {
            cargarHistorial(1);
        });
    }
    if (selectEmpleadoHistorial) {
        selectEmpleadoHistorial.addEventListener('change', function() {
            cargarHistorial(1);
        });
    }

    // Botón limpiar
    if (btnLimpiarHistorial) {
        btnLimpiarHistorial.addEventListener('click', function() {
            if (inputBuscarHistorial) inputBuscarHistorial.value = '';
            if (selectTurnoHistorial) selectTurnoHistorial.value = '';
            if (selectEstadoHistorial) selectEstadoHistorial.value = '';
            if (selectEmpleadoHistorial) selectEmpleadoHistorial.value = '';
            const fechaUnicaInput = document.getElementById('fechaUnicaSeleccionada');
            if (fechaUnicaInput) fechaUnicaInput.value = '';
            const fechaDesdeInput = document.getElementById('fechaDesdeSeleccionada');
            if (fechaDesdeInput) fechaDesdeInput.value = '';
            const fechaHastaInput = document.getElementById('fechaHastaSeleccionada');
            if (fechaHastaInput) fechaHastaInput.value = '';
            cargarHistorial(1);
        });
    }

    // Paginación: delegación de eventos para clics en números
    document.addEventListener('click', function(e) {
        const link = e.target.closest('.page-link[data-page]');
        if (link) {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (page) {
                cargarHistorial(parseInt(page));
            }
        }
    });

    // ==========================================
    // 10. MODALES DE FECHA
    // ==========================================
    const aplicarFechaUnica = document.getElementById('aplicarFechaUnica');
    if (aplicarFechaUnica) {
        aplicarFechaUnica.addEventListener('click', function() {
            const input = document.getElementById('fechaUnicaInput');
            if (input && input.value) {
                document.getElementById('fechaUnicaSeleccionada').value = input.value;
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalFechaUnica'));
                if (modal) modal.hide();
                cargarHistorial(1);
            } else {
                alert('Por favor selecciona una fecha.');
            }
        });
    }

    const aplicarRango = document.getElementById('aplicarRangoFechas');
    if (aplicarRango) {
        aplicarRango.addEventListener('click', function() {
            const desde = document.getElementById('fechaDesdeInput');
            const hasta = document.getElementById('fechaHastaInput');
            if (desde && hasta && desde.value && hasta.value) {
                if (desde.value <= hasta.value) {
                    document.getElementById('fechaDesdeSeleccionada').value = desde.value;
                    document.getElementById('fechaHastaSeleccionada').value = hasta.value;
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalRangoFechas'));
                    if (modal) modal.hide();
                    cargarHistorial(1);
                } else {
                    alert('La fecha "Desde" debe ser anterior a "Hasta".');
                }
            } else {
                alert('Por favor selecciona ambas fechas.');
            }
        });
    }

    // ==========================================
    // 11. MODAL DE DETALLE DE ASISTENCIA
    // ==========================================
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-ver-detalle');
        if (!btn) return;
        const card = btn.closest('.asistencia-card');
        if (!card) return;

        const empleado = card.dataset.empleado || 'Sin nombre';
        const fecha = card.dataset.fecha || '';
        const turno = card.dataset.turno || '';
        const estado = card.dataset.estado || 'Sin registrar';
        const estadoClase = card.dataset.estadoClase || 'sin-registro';
        const horaProgramada = card.dataset.horaProgramada || '';
        const horaMarcada = card.dataset.horaMarcada || 'Sin marcar';
        const cargo = card.dataset.cargo || 'Sin cargo';

        document.getElementById('detalleEmpleadoNombre').textContent = empleado;
        document.getElementById('detalleFecha').textContent = fecha;
        document.getElementById('detalleTurno').textContent = turno;
        document.getElementById('detalleCargo').textContent = cargo;
        document.getElementById('detalleHoraProgramada').textContent = horaProgramada;
        document.getElementById('detalleHoraMarcada').textContent = horaMarcada;

        // Estado con badge
        const estadoBadge = document.createElement('span');
        estadoBadge.className = 'badge badge-estado';
        if (estadoClase === 'presente') {
            estadoBadge.classList.add('badge-presente');
        } else if (estadoClase === 'tarde') {
            estadoBadge.classList.add('badge-tarde');
        } else if (estadoClase === 'ausente') {
            estadoBadge.classList.add('badge-ausente');
        } else {
            estadoBadge.classList.add('badge-sin-registro');
        }
        estadoBadge.textContent = estado;
        const estadoContainer = document.getElementById('detalleEstado');
        estadoContainer.innerHTML = '';
        estadoContainer.appendChild(estadoBadge);
    });
});