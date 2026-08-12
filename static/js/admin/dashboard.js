/**
 * Dashboard - OperPan
 * Funcionalidades JavaScript para el panel de administración
 * 
 * Dependencias: Chart.js (cargado desde CDN en el template)
 * Datos: se reciben desde el backend mediante variables globales:
 *   - window.asistenciaChartData
 *   - window.tareasChartData
 *   - window.novedadesChartData
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
// 2. BOTONES "VER MÁS / VER MENOS" PARA ASISTENCIA, TAREAS Y NOVEDADES
// ============================================================
function initVerMas() {
    // Función genérica para manejar el toggle
    function setupVerMas(btnId, itemSelector, listId) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        btn.addEventListener('click', function() {
            const visible = parseInt(this.dataset.visible);
            const total = parseInt(this.dataset.total);
            const items = document.querySelectorAll(itemSelector);
            const isExpanded = this.dataset.expanded === 'true';

            if (isExpanded) {
                // Modo "Ver menos": ocultar todos los que superen 8
                items.forEach(function(item, index) {
                    if (index >= 8) {
                        item.classList.add('d-none');
                    }
                });
                this.dataset.visible = 8;
                this.dataset.expanded = 'false';
                this.innerHTML = 'Ver más <i class="bi bi-chevron-down"></i>';
            } else {
                // Modo "Ver más": mostrar hasta 20
                let nuevosVisibles = visible + 8;
                if (nuevosVisibles > total) nuevosVisibles = total;
                
                items.forEach(function(item, index) {
                    if (index < nuevosVisibles) {
                        item.classList.remove('d-none');
                    }
                });
                
                this.dataset.visible = nuevosVisibles;
                if (nuevosVisibles >= total) {
                    // Si ya se mostraron todos, cambiamos a "Ver menos"
                    this.dataset.expanded = 'true';
                    this.innerHTML = 'Ver menos <i class="bi bi-chevron-up"></i>';
                } else {
                    // Aún hay más para mostrar, pero cambiamos a "Ver menos" porque el usuario puede querer colapsar
                    this.dataset.expanded = 'true';
                    this.innerHTML = 'Ver menos <i class="bi bi-chevron-up"></i>';
                }
            }
        });
    }

    // Configurar cada botón
    setupVerMas('btnVerMasAsistencia', '#tablaAsistencia .asistencia-item', 'tablaAsistencia');
    setupVerMas('btnVerMasTareas', '#listaTareas .tarea-item', 'listaTareas');
    setupVerMas('btnVerMasNovedades', '#listaNovedades .novedad-item', 'listaNovedades');
}

// ============================================================
// 3. INICIALIZAR GRÁFICAS CON CHART.JS
// ============================================================
function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está cargado. Las gráficas no se mostrarán.');
        return;
    }

    // --- Gráfica 1: Asistencia (barras) ---
    const ctxAsistencia = document.getElementById('chartAsistencia');
    if (ctxAsistencia && window.asistenciaChartData) {
        const data = window.asistenciaChartData;
        new Chart(ctxAsistencia, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Asistencia',
                    data: data.values,
                    backgroundColor: data.colors,
                    borderWidth: 0,
                    borderRadius: 6,
                    barPercentage: 0.7,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: false },
                        ticks: { stepSize: 1 }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // --- Gráfica 2: Estado de tareas (torta/pie) ---
    const ctxTareas = document.getElementById('chartTareas');
    if (ctxTareas && window.tareasChartData) {
        const data = window.tareasChartData;
        new Chart(ctxTareas, {
            type: 'pie',  // Cambio a pie
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: data.colors,
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    // --- Gráfica 3: Distribución de novedades (dona) ---
    const ctxNovedades = document.getElementById('chartNovedades');
    if (ctxNovedades && window.novedadesChartData) {
        const data = window.novedadesChartData;
        new Chart(ctxNovedades, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: data.colors,
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: { size: 10 }
                        }
                    }
                },
                cutout: '60%',
            }
        });
    }
}

// ============================================================
// 4. INICIALIZACIÓN AL CARGAR LA PÁGINA
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    mostrarFecha();
    initVerMas();
    setTimeout(initCharts, 100);
});