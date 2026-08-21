/**
 * Dashboard Admin - OperPan
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
// 2. INICIALIZAR GRÁFICAS CON CHART.JS
// ============================================================
function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está cargado. Las gráficas no se mostrarán.');
        return;
    }

    // --- Gráfica 1: Asistencia (barras) con borde blanco ---
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
                    borderWidth: 2,
                    borderColor: '#ffffff',
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

    // --- Gráfica 2: Estado de tareas (pie) con borde blanco ---
    const ctxTareas = document.getElementById('chartTareas');
    if (ctxTareas && window.tareasChartData) {
        const data = window.tareasChartData;
        new Chart(ctxTareas, {
            type: 'pie',
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
                            boxWidth: 12,
                            padding: 8,
                            font: { size: 10, family: 'Poppins' },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                }
            }
        });
    }

    // --- Gráfica 3: Novedades pendientes (dona) con borde blanco ---
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
                            boxWidth: 12,
                            padding: 8,
                            font: { size: 10, family: 'Poppins' },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                cutout: '60%',
            }
        });
    }
}

// ============================================================
// 3. CAMBIAR ESTADO DE ASISTENCIA (AJAX)
// ============================================================
function initCambiarEstadoAsistencia() {
    const botones = document.querySelectorAll('.btn-cambiar-estado');
    botones.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const tr = this.closest('.asistencia-item');
            const empleadoId = tr.dataset.empleadoId;
            const estado = this.dataset.estado;
            const badge = tr.querySelector('.estado-badge');
            const url = "/asistencia/cambiar-estado-asistencia/";
            
            // Crear formulario con CSRF
            const formData = new FormData();
            formData.append('empleado_id', empleadoId);
            formData.append('estado', estado);
            
            // Obtener token CSRF desde el meta tag
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
            if (csrfToken) {
                formData.append('csrfmiddlewaretoken', csrfToken.value);
            }
            
            fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken ? csrfToken.value : '',
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    // Actualizar badge
                    const badgeClass = estado === 'PRESENTE' ? 'bg-success' : 
                                      estado === 'TARDE' ? 'bg-warning text-dark' : 'bg-danger';
                    const badgeText = estado === 'PRESENTE' ? 'Presente' : 
                                      estado === 'TARDE' ? 'Tarde' : 'Ausente';
                    badge.className = 'badge ' + badgeClass;
                    badge.textContent = badgeText;
                    
                    // Mostrar toast de éxito
                    mostrarMensaje('✅ Estado actualizado a ' + badgeText, 'success');
                } else {
                    mostrarMensaje('❌ Error: ' + data.error, 'danger');
                }
            })
            .catch(error => {
                mostrarMensaje('❌ Error de conexión', 'danger');
            });
        });
    });
}

// ============================================================
// 4. MOSTRAR MENSAJE TOAST
// ============================================================
function mostrarMensaje(mensaje, tipo = 'success') {
    const toast = document.getElementById('liveToast');
    const msgSpan = document.getElementById('toastMsg');
    if (!toast || !msgSpan) return;
    
    msgSpan.innerText = mensaje;
    const border = toast.querySelector('.border-start');
    if (border) {
        if (tipo === 'success') {
            border.className = 'border-start border-4 border-success';
        } else if (tipo === 'danger') {
            border.className = 'border-start border-4 border-danger';
        } else {
            border.className = 'border-start border-4 border-warning';
        }
    }
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

// ============================================================
// 5. INICIALIZACIÓN AL CARGAR LA PÁGINA
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    mostrarFecha();
    setTimeout(initCharts, 100);
    initCambiarEstadoAsistencia();
});