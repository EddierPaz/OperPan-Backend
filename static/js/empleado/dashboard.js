/**
 * Dashboard Empleado - OperPan
 */

// 1. MOSTRAR FECHA ACTUAL
function mostrarFecha() {
    const fecha = new Date();
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaElement = document.getElementById('fechaActual');
    if (fechaElement) {
        fechaElement.innerText = fecha.toLocaleDateString('es-ES', opciones);
    }
}

// 2. INICIALIZAR GRÁFICAS CON CHART.JS Y DATALABELS
function initCharts() {
    if (typeof Chart === 'undefined') return;

    // Registrar el plugin para mostrar los números
    Chart.register(ChartDataLabels);

    // --- Gráfica 1: Estado de funciones ---
    const ctxFunciones = document.getElementById('chartFunciones');
    if (ctxFunciones && window.funcionesChartData) {
        const data = window.funcionesChartData;
        new Chart(ctxFunciones, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: data.colors,
                    borderWidth: 2,
                    borderColor: 'transparent', // Deja que el fondo del contenedor se vea
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, font: { size: 11 } } },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: 14 },
                        formatter: (value) => value > 0  value : '' // Oculta los ceros
                    }
                }
            }
        });
    }

    // --- Gráfica 2: Asistencia del mes ---
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
                    borderColor: 'transparent',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, font: { size: 11 } } },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: 14 },
                        formatter: (value) => value > 0  value : ''
                    }
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    mostrarFecha();
    setTimeout(initCharts, 100);
});
