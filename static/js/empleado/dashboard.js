/**
 * Dashboard Empleado - OperPan
 * Funcionalidades mejoradas para el panel del empleado
 */

// ============================================================
// 1. MOSTRAR FECHA ACTUAL
// ============================================================
function mostrarFecha() {
    const fecha = new Date();
    const opciones = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const fechaElement = document.getElementById('fechaActual');
    if (fechaElement) {
        fechaElement.innerText = fecha.toLocaleDateString('es-ES', opciones);
    }
}

// ============================================================
// 2. BOTÓN "VER MÁS/VER MENOS" PARA HISTORIAL DE ASISTENCIA
// ============================================================
function initVerHistorial() {
    const btn = document.getElementById('btnVerHistorial');
    if (!btn) return;

    const container = document.getElementById('historialContainer');
    if (!container) return;

    const items = container.querySelectorAll('.historial-item');
    if (items.length <= 3) {
        btn.style.display = 'none';
        return;
    }

    let visible = 3;
    btn.addEventListener('click', function() {
        const total = items.length;
        if (visible === 3) {
            items.forEach(function(item, index) {
                if (index >= 3) {
                    item.classList.remove('d-none');
                }
            });
            visible = total;
            this.innerHTML = 'Ver menos <i class="bi bi-chevron-up"></i>';
        } else {
            items.forEach(function(item, index) {
                if (index >= 3) {
                    item.classList.add('d-none');
                }
            });
            visible = 3;
            this.innerHTML = 'Ver más <i class="bi bi-chevron-down"></i>';
        }
    });
}

// ============================================================
// 3. BOTÓN "VER MÁS/VER MENOS" PARA TAREAS
// ============================================================
function initVerMasTareas() {
    const btn = document.getElementById('btnVerMasTareas');
    if (!btn) return;

    const items = document.querySelectorAll('#listaTareas .tarea-item');
    if (items.length <= 8) {
        btn.style.display = 'none';
        return;
    }

    let visible = 8;
    btn.addEventListener('click', function() {
        const total = parseInt(this.dataset.total);
        if (visible === 8) {
            items.forEach(function(item, index) {
                if (index >= 8) {
                    item.classList.remove('d-none');
                }
            });
            visible = total;
            this.innerHTML = 'Ver menos <i class="bi bi-chevron-up"></i>';
        } else {
            items.forEach(function(item, index) {
                if (index >= 8) {
                    item.classList.add('d-none');
                }
            });
            visible = 8;
            this.innerHTML = 'Ver más <i class="bi bi-chevron-down"></i>';
        }
    });
}

// ============================================================
// 4. INICIALIZAR GRÁFICAS CON CHART.JS
// ============================================================
function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está cargado.');
        return;
    }

    // --- Gráfica 1: Estado de tareas (dona) ---
    const ctxTareas = document.getElementById('chartTareas');
    if (ctxTareas && window.tareasChartData) {
        const data = window.tareasChartData;
        new Chart(ctxTareas, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: data.colors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 10,
                            padding: 6,
                            font: { size: 9, family: 'Poppins' },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                cutout: '70%',
            }
        });
    }

    // --- Gráfica 2: Asistencia del mes (dona) ---
    const ctxAsistencia = document.getElementById('chartAsistencia');
    if (ctxAsistencia && window.asistenciaChartData) {
        const data = window.asistenciaChartData;
        new Chart(ctxAsistencia, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: data.colors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 10,
                            padding: 6,
                            font: { size: 9, family: 'Poppins' },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                cutout: '70%',
            }
        });
    }

    // --- Gráfica 3: Solicitudes pendientes (dona) ---
    const ctxSolicitudes = document.getElementById('chartSolicitudes');
    if (ctxSolicitudes && window.solicitudesChartData) {
        const data = window.solicitudesChartData;
        new Chart(ctxSolicitudes, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: data.colors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 10,
                            padding: 6,
                            font: { size: 9, family: 'Poppins' },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                cutout: '70%',
            }
        });
    }
}

// ============================================================
// 5. INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    mostrarFecha();
    initVerHistorial();
    initVerMasTareas();
    setTimeout(initCharts, 100);
});