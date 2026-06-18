// ============================================================
// SISTEMA DE GESTIÓN DE SOLICITUDES (EMPLEADO) - CONECTADO A DJANGO
// ============================================================

let filtroActual = "todas";

function getCSRFToken() {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : '';
}

function mostrarMensaje(mensaje, tipo = "success") {
    const toast = document.getElementById("liveToast");
    const msgSpan = document.getElementById("toastMsg");
    if (!toast) return;
    msgSpan.innerText = mensaje;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 3000);
}

function renderizarSolicitudes() {
    const container = document.getElementById("solicitudesContainer");
    if (!container) return;

    // Obtener solicitudes del empleado desde el backend
    fetch('/novedades/mis-solicitudes/')
        .then(response => response.json())
        .then(data => {
            let filtradas = data;
            if (filtroActual !== "todas") {
                filtradas = data.filter(s => s.estado === filtroActual);
            }

            if (filtradas.length === 0) {
                container.innerHTML = `<div class="alert alert-light text-center">No hay solicitudes ${filtroActual !== 'todas' ? 'con estado ' + filtroActual : ''}.</div>`;
                return;
            }

            filtradas.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

            let html = '';
            filtradas.forEach(sol => {
                let badgeClass = "";
                let estadoTexto = "";
                if (sol.estado === "pendiente") { badgeClass = "badge-pending"; estadoTexto = "Pendiente"; }
                else if (sol.estado === "aprobada") { badgeClass = "badge-approved"; estadoTexto = "Aprobada"; }
                else { badgeClass = "badge-rejected"; estadoTexto = "Rechazada"; }

                const tipoMostrar = {
                    permiso: "Permiso",
                    incapacidad: "Incapacidad",
                    cambio_turno: "Cambio de turno",
                    vacaciones: "Vacaciones",
                    certificados: "Certificado"
                }[sol.tipo] || sol.tipo;

                let detalle = "";
                if (sol.tipo === "permiso" && sol.datos_especificos) {
                    detalle = `<small class="text-muted">${sol.datos_especificos.tipo_permiso} · ${sol.fecha_inicio} ${sol.datos_especificos.hora_salida} a ${sol.datos_especificos.hora_regreso}</small>`;
                } else if (sol.tipo === "incapacidad" && sol.datos_especificos) {
                    detalle = `<small class="text-muted">${sol.datos_especificos.entidad} · N° ${sol.datos_especificos.numero_incapacidad}</small>`;
                } else if (sol.tipo === "cambio_turno" && sol.datos_especificos) {
                    detalle = `<small class="text-muted">${sol.datos_especificos.turno_actual} → ${sol.datos_especificos.turno_solicitado}</small>`;
                } else if (sol.tipo === "certificados" && sol.datos_especificos) {
                    detalle = `<small class="text-muted">${sol.datos_especificos.tipo_certificado} · Dirigido a: ${sol.datos_especificos.dirigido_a}</small>`;
                } else {
                    detalle = `<small class="text-muted">${sol.fecha_inicio} → ${sol.fecha_fin}</small>`;
                }

                html += `
                <div class="request-card">
                    <div class="d-flex justify-content-between align-items-start flex-wrap">
                        <div>
                            <h5 class="mb-1">${tipoMostrar}</h5>
                            ${detalle}
                            <p class="mb-2 mt-2">${sol.datos_especificos?.motivo || sol.datos_especificos?.observaciones || "Sin descripción"}</p>
                            ${sol.adjunto ? `<span class="badge bg-light text-dark"><i class="bi bi-paperclip"></i> ${sol.adjunto}</span>` : ''}
                            ${sol.motivo_rechazo ? `<div class="small text-danger mt-2"><i class="bi bi-chat-dots"></i> Rechazo: ${sol.motivo_rechazo}</div>` : ''}
                            <div class="small text-muted mt-2">Creada: ${new Date(sol.fecha_creacion).toLocaleString()}</div>
                        </div>
                        <div>
                            <span class="badge ${badgeClass}">${estadoTexto}</span>
                        </div>
                    </div>
                </div>
                `;
            });
            container.innerHTML = html;
        })
        .catch(() => {
            container.innerHTML = `<div class="alert alert-danger">Error al cargar las solicitudes.</div>`;
        });
}

function calcularDias(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return 0;
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin - inicio);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Mostrar/ocultar formularios dinámicos
const tipoSelect = document.getElementById("tipoSolicitud");
const forms = {
    permiso: document.getElementById("formPermiso"),
    incapacidad: document.getElementById("formIncapacidad"),
    cambio_turno: document.getElementById("formCambioTurno"),
    vacaciones: document.getElementById("formVacaciones"),
    certificados: document.getElementById("formCertificados")
};

function mostrarFormularioSegunTipo() {
    const tipo = tipoSelect.value;
    Object.keys(forms).forEach(key => {
        if (forms[key]) forms[key].style.display = "none";
    });
    if (tipo && forms[tipo]) {
        forms[tipo].style.display = "block";
    }
}

// Actualizar días calculados para incapacidad y vacaciones
function actualizarDiasIncapacidad() {
    const inicio = document.getElementById("incapacidadFechaInicio").value;
    const fin = document.getElementById("incapacidadFechaFin").value;
    const diasInput = document.getElementById("incapacidadDias");
    if (inicio && fin) diasInput.value = calcularDias(inicio, fin);
    else diasInput.value = "";
}

function actualizarDiasVacaciones() {
    const inicio = document.getElementById("vacacionesFechaInicio").value;
    const fin = document.getElementById("vacacionesFechaFin").value;
    const diasInput = document.getElementById("vacacionesDias");
    if (inicio && fin) diasInput.value = calcularDias(inicio, fin);
    else diasInput.value = "";
}

// Certificados campos dinámicos
const certTipoSelect = document.getElementById("certificadoTipo");
const finalidadGroup = document.getElementById("certificadoFinalidadGroup");
const periodoGroup = document.getElementById("certificadoPeriodoGroup");

function actualizarCamposCertificado() {
    const tipo = certTipoSelect.value;
    finalidadGroup.style.display = "none";
    periodoGroup.style.display = "none";
    if (tipo === "laboral") finalidadGroup.style.display = "block";
    if (tipo === "ingresos") periodoGroup.style.display = "block";
}

tipoSelect.addEventListener("change", mostrarFormularioSegunTipo);
document.getElementById("incapacidadFechaInicio").addEventListener("change", actualizarDiasIncapacidad);
document.getElementById("incapacidadFechaFin").addEventListener("change", actualizarDiasIncapacidad);
document.getElementById("vacacionesFechaInicio").addEventListener("change", actualizarDiasVacaciones);
document.getElementById("vacacionesFechaFin").addEventListener("change", actualizarDiasVacaciones);
if (certTipoSelect) certTipoSelect.addEventListener("change", actualizarCamposCertificado);

// Envío del formulario
document.getElementById("solicitudForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const tipo = tipoSelect.value;
    if (!tipo) {
        mostrarMensaje("Seleccione un tipo de solicitud.", "error");
        return;
    }

    let data = {
        tipo: tipo,
        fecha_inicio: "",
        fecha_fin: "",
        datos_especificos: {}
    };

    let valid = true;

    if (tipo === "permiso") {
        const tipoPermiso = document.getElementById("permisoTipo").value;
        const fechaInicio = document.getElementById("permisoFechaInicio").value;
        const fechaFin = document.getElementById("permisoFechaFin").value;
        const horaSalida = document.getElementById("permisoHoraSalida").value;
        const horaRegreso = document.getElementById("permisoHoraRegreso").value;
        const motivo = document.getElementById("permisoMotivo").value;
        if (!fechaInicio || !fechaFin || !horaSalida || !horaRegreso) valid = false;
        if (valid) {
            data.fecha_inicio = fechaInicio;
            data.fecha_fin = fechaFin;
            data.datos_especificos = { tipo_permiso: tipoPermiso, hora_salida: horaSalida, hora_regreso: horaRegreso, motivo };
        } else mostrarMensaje("Complete todos los campos obligatorios del permiso.", "error");
    }
    else if (tipo === "incapacidad") {
        const fechaInicio = document.getElementById("incapacidadFechaInicio").value;
        const fechaFin = document.getElementById("incapacidadFechaFin").value;
        const entidad = document.getElementById("incapacidadEntidad").value;
        const numero = document.getElementById("incapacidadNumero").value;
        const observaciones = document.getElementById("incapacidadObservaciones").value;
        const adjuntoFile = document.getElementById("incapacidadAdjunto").files[0];
        if (!fechaInicio || !fechaFin || !entidad || !numero) valid = false;
        if (!adjuntoFile) { valid = false; mostrarMensaje("Debe adjuntar el soporte médico (obligatorio).", "error"); }
        if (valid) {
            data.fecha_inicio = fechaInicio;
            data.fecha_fin = fechaFin;
            data.adjunto = adjuntoFile.name;
            data.datos_especificos = { entidad, numero_incapacidad: numero, observaciones };
        } else if (!valid && !adjuntoFile) {} else mostrarMensaje("Complete todos los campos obligatorios de la incapacidad.", "error");
    }
    else if (tipo === "cambio_turno") {
        const fecha = document.getElementById("cambioFecha").value;
        const turnoActual = document.getElementById("cambioTurnoActual").value;
        const turnoSolicitado = document.getElementById("cambioTurnoSolicitado").value;
        const motivo = document.getElementById("cambioMotivo").value;
        const observaciones = document.getElementById("cambioObservaciones").value;
        if (!fecha || !turnoActual || !turnoSolicitado) valid = false;
        if (valid) {
            data.fecha_inicio = fecha;
            data.fecha_fin = fecha;
            data.datos_especificos = { turno_actual: turnoActual, turno_solicitado: turnoSolicitado, motivo, observaciones };
        } else mostrarMensaje("Complete los campos obligatorios del cambio de turno.", "error");
    }
    else if (tipo === "vacaciones") {
        const fechaInicio = document.getElementById("vacacionesFechaInicio").value;
        const fechaFin = document.getElementById("vacacionesFechaFin").value;
        const direccion = document.getElementById("vacacionesDireccion").value;
        const telefono = document.getElementById("vacacionesTelefono").value;
        const observaciones = document.getElementById("vacacionesObservaciones").value;
        if (!fechaInicio || !fechaFin || !direccion || !telefono) valid = false;
        if (valid) {
            data.fecha_inicio = fechaInicio;
            data.fecha_fin = fechaFin;
            data.datos_especificos = { direccion, telefono, observaciones };
        } else mostrarMensaje("Complete todos los campos obligatorios de vacaciones.", "error");
    }
    else if (tipo === "certificados") {
        const tipoCert = document.getElementById("certificadoTipo").value;
        const dirigido = document.getElementById("certificadoDirigido").value;
        const finalidad = document.getElementById("certificadoFinalidad").value;
        const periodo = document.getElementById("certificadoPeriodo").value;
        if (!dirigido) valid = false;
        if (valid) {
            data.fecha_inicio = new Date().toISOString().split('T')[0];
            data.fecha_fin = data.fecha_inicio;
            data.datos_especificos = { tipo_certificado: tipoCert, dirigido_a: dirigido, finalidad, periodo };
        } else mostrarMensaje("Indique a quién va dirigido el certificado.", "error");
    }

    if (valid) {
        fetch('/novedades/solicitar/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'ok') {
                mostrarMensaje("Solicitud enviada correctamente.", "success");
                document.getElementById("solicitudForm").reset();
                tipoSelect.value = "";
                mostrarFormularioSegunTipo();
                renderizarSolicitudes();
            } else {
                mostrarMensaje("Error: " + (result.error || "No se pudo enviar la solicitud."), "error");
            }
        })
        .catch(() => {
            mostrarMensaje("Error de red al enviar la solicitud.", "error");
        });
    }
});

// Filtros
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", function () {
        filtroActual = this.getAttribute("data-filter");
        renderizarSolicitudes();
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active", "btn-primary"));
        this.classList.add("active", "btn-primary");
        this.classList.remove("btn-outline-secondary");
    });
});

// Inicializar
renderizarSolicitudes();