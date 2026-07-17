document.addEventListener("DOMContentLoaded", function () {

    // ==========================
    // HELPER: mostrar/ocultar días
    // según el turno (7 días para
    // FIJO, 15 para MANANA/TARDE)
    // ==========================

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
                // Si el día que se estaba mostrando queda fuera del nuevo
                // rango, se oculta y se limpia su selección
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

    // ==========================
    // CARGAR CARGO EMPLEADO
    // ==========================

    const empleadoSelect = document.getElementById("empleadoSelect");
    const cargoInput = document.getElementById("cargoInput");

    if (empleadoSelect && cargoInput) {
        empleadoSelect.addEventListener("change", function () {
            const opcion = this.options[this.selectedIndex];
            cargoInput.value = opcion.dataset.cargo || "";
        });
    }

    // ==========================
    // AUTOCOMPLETAR HORARIOS
    // ==========================

    const turnoSelect = document.getElementById("turnoSelect");
    const horaEntrada = document.getElementById("horaEntrada");
    const horaSalida = document.getElementById("horaSalida");

    // ==========================
    // CALENDARIO — CREAR
    // ==========================

    const cicloCrear = document.getElementById("ciclo14x1");
    const inputCrear = document.getElementById("fechaDescansoInput");
    const labelCrear = document.getElementById("descansoLabel");
    const textoCrear = document.getElementById("descansoFechaTexto");

    if (turnoSelect) {
        turnoSelect.addEventListener("change", function () {
            switch (this.value) {
                case "MANANA": horaEntrada.value = "05:00"; horaSalida.value = "13:00"; break;
                case "TARDE": horaEntrada.value = "13:00"; horaSalida.value = "22:00"; break;
                case "FIJO": horaEntrada.value = "08:00"; horaSalida.value = "17:00"; break;
                default: horaEntrada.value = ""; horaSalida.value = "";
            }

            // Ajustar cuántos días del calendario se muestran
            actualizarDiasCalendario(cicloCrear, this.value, inputCrear, labelCrear, textoCrear);
        });

        // Estado inicial (por si el select ya trae un valor precargado)
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

    // ==========================
    // LIMPIAR FORMULARIO
    // ==========================

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
                // Al limpiar también se resetea la vista del calendario a 15 días
                actualizarDiasCalendario(cicloCrear, "", inputCrear, labelCrear, textoCrear);
            }, 10);
        });
    }

    // ==========================
    // CALENDARIO — EDITAR
    // ==========================

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

    // ==========================
    // VER Y EDITAR — delegación
    // en document para que funcione
    // aunque la tabla cargue tarde
    // ==========================

    document.addEventListener("click", function (e) {

        // Botón VER
        const btnVer = e.target.closest(".btn-ver-horario");
        if (btnVer) {
            const id = btnVer.dataset.id;
            fetch("/asistencia/horarios/" + id + "/json/")
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    document.getElementById("ver-empleado").value = data.empleado;
                    document.getElementById("ver-cargo").value = data.cargo;
                    document.getElementById("ver-turno").value = data.turno;
                    document.getElementById("ver-entrada").value = data.hora_entrada;
                    document.getElementById("ver-salida").value = data.hora_salida;
                    document.getElementById("ver-descanso").value = data.descanso || "Sin asignar";
                    document.getElementById("ver-estado").value = data.estado ? "Activo" : "Inactivo";
                    new bootstrap.Modal(document.getElementById("modalVerHorario")).show();
                })
                .catch(function () { alert("No se pudo cargar el horario."); });
        }

        // Botón EDITAR
        const btnEditar = e.target.closest(".btn-editar-horario");
        if (btnEditar) {
            const id = btnEditar.dataset.id;
            fetch("/asistencia/horarios/" + id + "/json/")
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    document.getElementById("editar-empleado").value = data.empleado;
                    document.getElementById("editar-cargo").value = data.cargo;
                    document.getElementById("editar-turno").value = data.turno_valor;
                    document.getElementById("editar-entrada").value = data.hora_entrada;
                    document.getElementById("editar-salida").value = data.hora_salida;

                    document.getElementById("formEditar").action =
                        "/asistencia/horarios/" + id + "/editar/";

                    const labelActual = document.getElementById("descanso-actual-label");
                    if (labelActual) {
                        labelActual.textContent = data.descanso ? "— actual: " + data.descanso : "";
                    }

                    // Ajustar el calendario (7 o 15 días) según el turno actual del horario
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

                    new bootstrap.Modal(document.getElementById("modalEditarHorario")).show();
                })
                .catch(function () { alert("No se pudo cargar el horario."); });
        }

    });

});