document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. SISTEMA DE NOTIFICACIONES (TOAST)
    // ==========================================
    function mostrarToast(mensaje, tipo = 'warning') {
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion(mensaje, tipo);
        }
    }

    // ==========================================
    // 2. LÓGICA DE CALENDARIO (SOLO EDICIÓN)
    // ==========================================
    function diasVisibles() {
        const hoy = new Date();
        return new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    }

    function actualizarDiasCalendario(ciclo, inputFecha, label, texto) {
        if (!ciclo) return;
        const maxDias = diasVisibles();
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

    // --- Configuración del Modal: Editar Horario ---
    const cicloEditar = document.getElementById("ciclo14x1Editar");
    const inputEditar = document.getElementById("fechaDescansoEditarInput");
    const labelEditar = document.getElementById("descansoEditarLabel");
    const textoEditar = document.getElementById("descansoEditarFechaTexto");
    const editarTurnoSelect = document.getElementById("editar-turno");
    
    const contenedorDiaFijo = document.getElementById("contenedorDiaFijo");
    const selectDiaFijo = document.getElementById("editar-dia-descanso");

    let descansosFechasArray = []; 

    const modalEditarBody = document.querySelector('#modalEditarHorario .modal-body');
    let avisoEdicion = null;
    if (modalEditarBody) {
        avisoEdicion = document.createElement('div');
        avisoEdicion.id = 'descanso-edit-aviso';
        avisoEdicion.className = 'alert alert-warning d-none';
        avisoEdicion.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i> ';
        modalEditarBody.insertBefore(avisoEdicion, modalEditarBody.firstChild);
    }

    function sincronizarHoras(turno) {
        const entradaInput = document.getElementById("editar-entrada");
        const salidaInput = document.getElementById("editar-salida");
        if (!entradaInput || !salidaInput) return;

        switch (turno) {
            case "MANANA": entradaInput.value = "04:00"; salidaInput.value = "14:00"; break;
            case "TARDE": entradaInput.value = "13:30"; salidaInput.value = "22:00"; break;
            case "FIJO": entradaInput.value = "08:00"; salidaInput.value = "17:00"; break;
        }
    }

    function toggleDiaFijo(turno) {
        if (contenedorDiaFijo) {
contenedorDiaFijo.style.display = (turno === "FIJO") ? "block" : "none";
        }
    }

    function resaltarDescansos() {
        if (!cicloEditar) return;
        const turno = editarTurnoSelect.value;
const diaFijo = selectDiaFijo ? parseInt(selectDiaFijo.value) : null;

        cicloEditar.querySelectorAll(".dia-btn").forEach(btn => {
            btn.classList.remove("seleccionado");
            const fechaStr = btn.dataset.fecha;
            if (!fechaStr) return;
            const fecha = new Date(fechaStr + 'T00:00:00');

            if (turno === "FIJO" && diaFijo !== null && !isNaN(diaFijo)) {
                if (fecha.getDay() === diaFijo) {
                    btn.classList.add("seleccionado");
                }
            } else {
                if (descansosFechasArray.includes(fechaStr)) {
                    btn.classList.add("seleccionado");
                }
            }
        });
    }

    if (selectDiaFijo) {
        selectDiaFijo.addEventListener("change", function() {
            resaltarDescansos();
            const labelActual = document.getElementById("descanso-actual-label");
            if (labelActual) labelActual.textContent = "";
        });
    }

    if (editarTurnoSelect) {
        editarTurnoSelect.addEventListener("change", function () {
            sincronizarHoras(this.value);
            toggleDiaFijo(this.value);
            resaltarDescansos();
            actualizarDiasCalendario(cicloEditar, inputEditar, labelEditar, textoEditar);
            
            const labelActual = document.getElementById("descanso-actual-label");
            if (labelActual) {
                if (this.value === "FIJO") {
                    labelActual.textContent = "— (Seleccione el día semanal)";
                } else {
                    labelActual.textContent = ""; 
                }
            }
        });
    }

    if (cicloEditar) {
        cicloEditar.addEventListener("click", function (e) {
            const btn = e.target.closest(".dia-btn");
            if (!btn || btn.style.display === "none" || btn.disabled) return;

            const fechaStr = btn.dataset.fecha;
            if (!fechaStr) return;

            const fechaSeleccionada = new Date(fechaStr + 'T00:00:00');
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (fechaSeleccionada <= hoy) {
                mostrarToast("No puedes seleccionar el día de hoy o una fecha que ya pasó.", "warning");
                return;
            }

            if (editarTurnoSelect.value === "FIJO") {
                selectDiaFijo.value = fechaSeleccionada.getDay();
                resaltarDescansos();
            } else {
                cicloEditar.querySelectorAll(".dia-btn").forEach(b => b.classList.remove("seleccionado"));
                btn.classList.add("seleccionado");
            }

            inputEditar.value = btn.dataset.fecha;
            textoEditar.textContent = btn.dataset.label;
            labelEditar.style.display = "block";
        });
    }

    // ==========================================
    // 3. ACCIONES DE LA TABLA (VER Y EDITAR)
    // ==========================================
    document.addEventListener("click", function (e) {
        
        // ACCIÓN: VER DETALLE
        const btnVer = e.target.closest(".btn-ver-horario");
        if (btnVer) {
            const id = btnVer.dataset.id;
            fetch("/asistencia/horarios/" + id + "/json/")
                .then(res => res.json())
                .then(data => {
                    document.getElementById("ver-empleado").textContent = data.empleado;
                    document.getElementById("ver-cargo").textContent = data.cargo;
                    document.getElementById("ver-turno").textContent = data.turno;
                    document.getElementById("ver-entrada").textContent = data.hora_entrada;
                    document.getElementById("ver-salida").textContent = data.hora_salida;
                    document.getElementById("ver-descanso").textContent = data.descanso || "Sin asignar";
document.getElementById("ver-estado").textContent = data.estado ? "Activo" : "Inactivo";
                    document.getElementById("ver-ciclo-inicio").textContent = data.ciclo_inicio || "Sin definir";
                    document.getElementById("ver-ciclo-fin").textContent = data.ciclo_fin || "Sin definir";
                    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalVerHorario")).show();
                })
                .catch(err => mostrarToast("Error al cargar horario.", "danger"));
        }

        // ACCIÓN: EDITAR
        const btnEditar = e.target.closest(".btn-editar-horario");
        if (btnEditar) {
            const id = btnEditar.dataset.id;
            fetch("/asistencia/horarios/" + id + "/json/")
                .then(res => res.json())
                .then(data => {
                    descansosFechasArray = data.descansos_fechas || [];

                    document.getElementById("editar-empleado").value = data.empleado;
                    document.getElementById("editar-cargo").value = data.cargo;
                    document.getElementById("editar-turno").value = data.turno_valor;
                    
                    sincronizarHoras(data.turno_valor);
                    toggleDiaFijo(data.turno_valor);
                    
                    if (data.turno_valor === "FIJO" && data.dia_descanso_semana !== null && selectDiaFijo) {
                        selectDiaFijo.value = data.dia_descanso_semana;
                    }

                    document.getElementById("formEditar").action = "/asistencia/horarios/" + id + "/editar/";
                    const labelActual = document.getElementById("descanso-actual-label");
if (labelActual) labelActual.textContent = data.descanso ? "— actual: " + data.descanso : "";

                    actualizarDiasCalendario(cicloEditar, inputEditar, labelEditar, textoEditar);
                    resaltarDescansos();

                    // Bloqueo visual de días pasados y de hoy
                    if (cicloEditar) {
                        cicloEditar.querySelectorAll(".dia-btn").forEach(function (b) {
                            const fechaStr = b.dataset.fecha;
                            if (fechaStr) {
                                const fecha = new Date(fechaStr + 'T00:00:00');
                                const hoyBtn = new Date();
                                hoyBtn.setHours(0, 0, 0, 0);
                                
                                if (fecha <= hoyBtn) {
                                    b.style.opacity = '0.3';
                                    b.style.cursor = 'not-allowed';
                                    b.style.backgroundColor = '#e9ecef';
                                    b.style.color = '#adb5bd';
                                    b.style.border = '1px solid #dee2e6';
                                    b.disabled = true;
                                } else {
                                    b.style.opacity = '1';
                                    b.style.cursor = 'pointer';
                                    b.style.backgroundColor = '';
                                    b.style.color = '';
                                    b.style.border = '';
                                    b.disabled = false;
                                }
                            }
                        });
                    }

                    if (inputEditar) inputEditar.value = "";
                    if (labelEditar) labelEditar.style.display = "none";
                    if (textoEditar) textoEditar.textContent = "";

                    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalEditarHorario")).show();
                })
                .catch(err => mostrarToast("Error al cargar la información para editar.", "danger"));
        }
    });

    // ==========================================
    // 4. FILTROS DE LA TABLA
    // ==========================================
    const filas = document.querySelectorAll("table.table-custom tbody tr");
    const inputBuscar = document.getElementById("buscarHorario");
    const selectTurno = document.getElementById("filtroTurno");

    if (inputBuscar) {
        function aplicarFiltros() {
            const texto = inputBuscar.value.trim().toLowerCase();
const turno = selectTurno ? selectTurno.value.toLowerCase() : "";

            filas.forEach(fila => {
                const empleado = (fila.dataset.empleado || "").toLowerCase();
                const turnoFila = (fila.dataset.turno || "").toLowerCase();
                const coincideTexto = !texto || empleado.includes(texto);
                const coincideTurno = !turno || turnoFila === turno;
fila.style.display = (coincideTexto && coincideTurno) ? "" : "none";
            });
        }

        inputBuscar.addEventListener("input", aplicarFiltros);
        if (selectTurno) selectTurno.addEventListener("change", aplicarFiltros);

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