
// ============================================================
// MÓDULO INFORMACIÓN PERSONAL - OPERPAN (EMPLEADO)
// Cumple: visualización horarios, historial, desempeño, documentos, certificaciones
// Simulación de datos con trazabilidad y solicitud de certificado (RF-CR-01, RF-CR-02)
// ============================================================


// Editar la informacion personal
const btnEditar = document.getElementById("btnEditar");
let editando = false;

btnEditar.addEventListener("click", function () {

    const vistas = document.querySelectorAll(".view-mode");
    const campos = document.querySelectorAll(".edit-mode");

    if (!editando) {

        vistas.forEach(v => v.classList.add("d-none"));
        campos.forEach(c => c.classList.remove("d-none"));

        btnEditar.innerHTML =
            '<i class="bi bi-check-lg"></i> Guardar';

        btnEditar.classList.remove("btn-primary");
        btnEditar.classList.add("btn-success");

        editando = true;

    } else {

        vistas.forEach((vista, index) => {
            vista.textContent = campos[index].value;
            vista.classList.remove("d-none");
        });

        campos.forEach(c => c.classList.add("d-none"));

        btnEditar.innerHTML =
            '<i class="bi bi-pencil-square"></i> Editar';

        btnEditar.classList.remove("btn-success");
        btnEditar.classList.add("btn-primary");

        editando = false;

        // Aquí puedes llamar tu AJAX para guardar en BD
        // guardarEmpleado();
    }
});

const empleadoActual = {
    id: "EMP-2024-156",
    nombre: "EDDIER PAZ PARDO",
    email: "eddier.paz@estacionpaisa.com",
    telefono: "+57 300 123 4567",
    antiguedad: "2 años",
    rol: "Panadero Principal",
    turnoActual: "Mañana (6am - 2pm)"
};

// Datos simulados para cada sección
const historialAsistencia = [
    { mes: "Abril 2025", diasTrabajados: 8, ausencias: 1, horasExtra: "3h 15m", estado: "Al día", estadoClase: "success" },
    { mes: "Marzo 2025", diasTrabajados: 24, ausencias: 0, horasExtra: "5h 40m", estado: "Al día", estadoClase: "success" },
    { mes: "Febrero 2025", diasTrabajados: 20, ausencias: 2, horasExtra: "0h", estado: "Con novedades", estadoClase: "warning" }
];

const turnosAsignados = [
    { semana: "07 - 12 Abr 2025", dias: "Lun - Sáb", horario: "6am - 2pm", estado: "Activo", clase: "success" },
    { semana: "14 - 19 Abr 2025", dias: "Lun - Sáb", horario: "6am - 2pm", estado: "Próximo", clase: "info" },
    { semana: "21 - 26 Abr 2025", dias: "Lun - Sáb", horario: "8am - 4pm (Cambio especial)", estado: "Pendiente", clase: "warning" }
];

const metricas = {
    puntualidad: 92,
    tareasCompletadas: 87,
    llamadosAtencion: 1
};

// Simulación de certificaciones emitidas (historial)
let certificaciones = [
    { id: "cert1", titulo: "Certificación laboral", fecha: "01/03/2025", estado: "emitida", pdfUrl: "#" },
    { id: "cert2", titulo: "Constancia de ingresos", fecha: "15/02/2025", estado: "emitida", pdfUrl: "#" }
];

function mostrarMensaje(msg, tipo = "success") {
    const toast = document.getElementById("liveToast");
    const msgSpan = document.getElementById("toastMsg");
    msgSpan.innerText = msg;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 3000);
}

// Cargar datos en tablas
function cargarHistorial() {
    const tbody = document.getElementById("historialBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    historialAsistencia.forEach(h => {
        tbody.innerHTML += `<tr>
                <td>${h.mes}</td><td>${h.diasTrabajados}</td><td>${h.ausencias}</td><td>${h.horasExtra}</td>
                <td><span class="badge badge-${h.estadoClase}">${h.estado}</span></td>
            </tr>`;
    });
}

function cargarTurnos() {
    const tbody = document.getElementById("turnosBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    turnosAsignados.forEach(t => {
        tbody.innerHTML += `<tr>
                <td>${t.semana}</td><td>${t.dias}</td><td>${t.horario}</td>
                <td><span class="badge badge-${t.clase}">${t.estado}</span></td>
            </tr>`;
    });
}

function cargarMetricas() {
    document.getElementById("puntualidadVal").innerText = metricas.puntualidad + "%";
    document.getElementById("tareasCompletadasVal").innerText = metricas.tareasCompletadas + "%";
    document.getElementById("llamadosVal").innerText = metricas.llamadosAtencion;
}

// Solicitar certificado (RF-CR-01, RF-CR-02)
function solicitarCertificado() {
    // Simulación: crear una solicitud de certificado laboral
    const solicitud = {
        id: Date.now(),
        empleadoId: empleadoActual.id,
        empleadoNombre: empleadoActual.nombre,
        tipo: "Certificado laboral",
        fechaSolicitud: new Date().toISOString(),
        estado: "pendiente"
    };
    // Guardar en localStorage para simular trazabilidad
    let solicitudes = localStorage.getItem("operpan_solicitudes_certificados");
    solicitudes = solicitudes ? JSON.parse(solicitudes) : [];
    solicitudes.push(solicitud);
    localStorage.setItem("operpan_solicitudes_certificados", JSON.stringify(solicitudes));

    mostrarMensaje("Solicitud de certificado enviada al administrador. Recibirás notificación cuando esté listo.", "success");
    console.log("[TRAZABILIDAD] Solicitud de certificado creada:", solicitud);

    // Simular notificación al administrador (en producción se enviaría email/notificación)
}

// Descarga de documentos (simulación)
function descargarDocumento(tipo) {
    mostrarMensaje(`Descargando ${tipo}... (simulación)`, "info");
    console.log(`[AUDITORÍA] Empleado ${empleadoActual.nombre} descargó documento: ${tipo}`);
    // En producción aquí se generaría el PDF real
}

// Gestión de pestañas
function initTabs() {
    const tabs = document.querySelectorAll(".tab-btn-custom");
    const panes = document.querySelectorAll(".tab-pane");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetId = tab.getAttribute("data-tab");
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            panes.forEach(pane => pane.classList.remove("active"));
            document.getElementById(targetId).classList.add("active");
        });
    });
}

// Cerrar sesión
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    mostrarMensaje("Cerrando sesión...", "info");
    setTimeout(() => window.location.href = "../../login.html", 800);
});

// Sidebar toggle
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
if (menuToggle) {
    menuToggle.addEventListener("click", () => sidebar.classList.toggle("active"));
}

// Botón solicitar certificado
document.getElementById("solicitarCertificadoBtn")?.addEventListener("click", solicitarCertificado);

// Botones de descarga de documentos
document.querySelectorAll(".descargarBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const doc = btn.getAttribute("data-doc");
        descargarDocumento(doc);
    });
});

// Inicializar datos
cargarHistorial();
cargarTurnos();
cargarMetricas();
initTabs();

// Mostrar datos de empleado en consola (trazabilidad de acceso)
console.log(`[ACCESO] Empleado ${empleadoActual.nombre} visualizó información personal - ${new Date().toLocaleString()}`);

// Simulación de notificación de certificado aprobado (para demostrar trazabilidad)
setTimeout(() => {
    // Opcional: mostrar mensaje si hay certificados nuevos
    const solicitudesPendientes = JSON.parse(localStorage.getItem("operpan_solicitudes_certificados") || "[]");
    const nuevas = solicitudesPendientes.filter(s => s.estado === "aprobada" && !s.notificado);
    if (nuevas.length) {
        mostrarMensaje("Tienes un certificado laboral disponible para descargar en la sección Documentos.", "success");
    }
}, 1000);