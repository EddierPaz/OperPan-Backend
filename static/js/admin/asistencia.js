document.addEventListener("DOMContentLoaded", function () {

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

    if (turnoSelect) {
        turnoSelect.addEventListener("change", function () {
            switch (this.value) {
                case "MANANA": horaEntrada.value = "05:00"; horaSalida.value = "13:00"; break;
                case "TARDE": horaEntrada.value = "13:00"; horaSalida.value = "22:00"; break;
                case "FIJO": horaEntrada.value = "08:00"; horaSalida.value = "17:00"; break;
                default: horaEntrada.value = ""; horaSalida.value = "";
            }
        });
    }

    // ==========================
    // CALENDARIO — CREAR
    // ==========================

    const cicloCrear = document.getElementById("ciclo14x1");
    const inputCrear = document.getElementById("fechaDescansoInput");
    const labelCrear = document.getElementById("descansoLabel");
    const textoCrear = document.getElementById("descansoFechaTexto");

    if (cicloCrear) {
        cicloCrear.addEventListener("click", function (e) {
            const btn = e.target.closest(".dia-btn");
            if (!btn) return;
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

    if (cicloEditar) {
        cicloEditar.addEventListener("click", function (e) {
            const btn = e.target.closest(".dia-btn");
            if (!btn) return;
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