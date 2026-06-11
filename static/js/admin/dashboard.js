// Cargar KPIs desde localStorage (datos reales de los módulos)
function cargarKPIs() {
    // Total empleados activos
    let totalEmpleados = 0;
    try {
        const users = localStorage.getItem(STORAGE_USERS);
        if (users) {
            const empleados = JSON.parse(users);
            totalEmpleados = empleados.filter(e => e.estado === "activo").length;
        } else {
            totalEmpleados = 3; // datos demo
        }
    } catch (e) { totalEmpleados = 3; }
    document.getElementById("totalEmpleados").innerText = totalEmpleados;

    // Tareas pendientes (admin)
    let tareasPendientes = 0;
    try {
        const tareas = localStorage.getItem(STORAGE_TAREAS);
        if (tareas) {
            const lista = JSON.parse(tareas);
            tareasPendientes = lista.filter(t => t.estado === "pendiente").length;
        } else {
            tareasPendientes = 2;
        }
    } catch (e) { tareasPendientes = 2; }
    document.getElementById("tareasPendientes").innerText = tareasPendientes;

    // Permisos pendientes
    let permisosPendientes = 0;
    try {
        const permisos = localStorage.getItem(STORAGE_PERMISOS);
        if (permisos) {
            const lista = JSON.parse(permisos);
            permisosPendientes = lista.filter(p => p.estado === "pendiente").length;
        } else {
            permisosPendientes = 2;
        }
    } catch (e) { permisosPendientes = 2; }
    document.getElementById("permisosPendientes").innerText = permisosPendientes;

    // Reportes pendientes
    let reportesPendientes = 0;
    try {
        const reportes = localStorage.getItem(STORAGE_REPORTES);
        if (reportes) {
            const lista = JSON.parse(reportes);
            reportesPendientes = lista.filter(r => r.estado === "pendiente").length;
        } else {
            reportesPendientes = 1;
        }
    } catch (e) { reportesPendientes = 1; }
    document.getElementById("reportesPendientes").innerText = reportesPendientes;
}