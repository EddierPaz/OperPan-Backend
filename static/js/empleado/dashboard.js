// ============================================================
// LANDING EMPLEADO - OPERPAN
// Panel de bienvenida con resumen y acceso rápido a módulos
// ============================================================

const empleadoActual = {
    id: "EMP-2024-156",
    nombre: "EDDIER PAZ PARDO",
    email: "eddier.paz@estacionpaisa.com",
    telefono: "+57 300 123 4567",
    rol: "Panadero Principal",
    turno: "Mañana (6am - 2pm)",
    antiguedad: "2 años"
};

// Mostrar fecha actual
function mostrarFecha() {
    const fecha = new Date();
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("fechaActual").innerText = fecha.toLocaleDateString('es-ES', opciones);
}

// Simular obtención de datos resumidos desde localStorage (conexión con otros módulos)
function cargarResumen() {
    // Datos de asistencia (simulados desde módulo de asistencia)
    const asistenciasStorage = localStorage.getItem("operpan_asistencia_empleado");
    let diasTrabajados = 12;
    let horasExtra = 3.5;
    let puntualidad = 92;

    if (asistenciasStorage) {
        const registros = JSON.parse(asistenciasStorage);
        // Calcular días trabajados (aquellos con entrada válida)
        const trabajados = registros.filter(r => r.entrada && r.entrada !== "—").length;
        if (trabajados > 0) diasTrabajados = trabajados;
        // Calcular horas extra (sumar)
        let extraSum = 0;
        registros.forEach(r => {
            if (r.extra && r.extra !== "—") {
                const match = r.extra.match(/(\d+)h\s*(\d+)m/);
                if (match) extraSum += parseInt(match[1]) + parseInt(match[2]) / 60;
            }
        });
        if (extraSum > 0) horasExtra = extraSum.toFixed(1);
    }

    // Tareas desde módulo de tareas
    const tareasStorage = localStorage.getItem("operpan_tareas");
    let pendientes = 0;
    let completadas = 0;
    if (tareasStorage) {
        const tareas = JSON.parse(tareasStorage);
        const misTareas = tareas.filter(t => t.empleadoId === empleadoActual.id);
        pendientes = misTareas.filter(t => t.estado === "pendiente" || t.estado === "progreso").length;
        completadas = misTareas.filter(t => t.estado === "finalizada").length;
    } else {
        pendientes = 3;
        completadas = 8;
    }

    document.getElementById("diasTrabajados").innerText = diasTrabajados;
    document.getElementById("horasExtra").innerText = horasExtra;
    document.getElementById("puntualidad").innerText = puntualidad;
    document.getElementById("tareasPendientes").innerText = pendientes;
    document.getElementById("tareasCompletadas").innerText = completadas;
}

// Cargar notificaciones desde localStorage (solicitudes, certificados)
function cargarNotificaciones() {
    const container = document.getElementById("notificationsContainer");
    if (!container) return;

    let notificaciones = [];

    // Verificar solicitudes pendientes
    const solicitudesStorage = localStorage.getItem("operpan_solicitudes");
    if (solicitudesStorage) {
        const solicitudes = JSON.parse(solicitudesStorage);
        const misSolicitudes = solicitudes.filter(s => s.empleadoId === empleadoActual.id && s.estado === "pendiente");
        if (misSolicitudes.length > 0) {
            notificaciones.push({
                fecha: "Reciente",
                icono: "envelope-paper",
                texto: `Tienes ${misSolicitudes.length} solicitud(es) pendiente(s) de revisión.`
            });
        }
        // Solicitudes aprobadas recientes
        const aprobadas = solicitudes.filter(s => s.empleadoId === empleadoActual.id && s.estado === "aprobada");
        if (aprobadas.length > 0) {
            notificaciones.push({
                fecha: "Última semana",
                icono: "check-circle",
                texto: `${aprobadas.length} solicitud(es) han sido aprobadas recientemente.`
            });
        }
    }

    // Verificar certificados disponibles
    const certificadosStorage = localStorage.getItem("operpan_solicitudes_certificados");
    if (certificadosStorage) {
        const solicitudesCert = JSON.parse(certificadosStorage);
        const pendientesCert = solicitudesCert.filter(s => s.empleadoId === empleadoActual.id && s.estado === "aprobada");
        if (pendientesCert.length > 0) {
            notificaciones.push({
                fecha: "Disponible",
                icono: "file-text",
                texto: `Tienes ${pendientesCert.length} certificado(s) listo(s) para descargar en "Información personal".`
            });
        }
    }

    // Si no hay notificaciones, mostrar mensaje por defecto
    if (notificaciones.length === 0) {
        container.innerHTML = `<div class="text-muted text-center py-3">No hay novedades recientes</div>`;
        return;
    }

    // Mostrar hasta 3 notificaciones
    container.innerHTML = notificaciones.slice(0, 3).map(not => `
            <div class="notification-item">
                <small class="text-muted"><i class="bi bi-${not.icono}"></i> ${not.fecha}</small>
                <p class="mb-0">${not.texto}</p>
            </div>
        `).join('');
}

function mostrarMensaje(mensaje, tipo = "success") {
    const toast = document.getElementById("liveToast");
    const msgSpan = document.getElementById("toastMsg");
    msgSpan.innerText = mensaje;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 3000);
}


// Sidebar toggle
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
if (menuToggle) {
    menuToggle.addEventListener("click", () => sidebar.classList.toggle("active"));
}

// Inicializar
mostrarFecha();
cargarResumen();
cargarNotificaciones();

// Registrar acceso al landing (trazabilidad)
console.log(`[ACCESO] Empleado ${empleadoActual.nombre} ingresó al panel principal - ${new Date().toLocaleString()}`);

// Simular saludo de bienvenida
setTimeout(() => {
    mostrarMensaje(`¡Bienvenido ${empleadoActual.nombre}! Revisa tus tareas pendientes.`, "success");
}, 500);