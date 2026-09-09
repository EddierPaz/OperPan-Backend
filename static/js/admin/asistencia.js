document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. TOAST - Sistema de notificaciones
    // ==========================================
    function mostrarToast(mensaje, tipo = 'warning') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const existing = container.querySelectorAll('.app-toast');
        existing.forEach(el => el.remove());

        const toast = document.createElement('div');
        toast.className = `app-toast app-toast-${tipo}`;
        toast.setAttribute('role', 'alert');

        let icono = 'bi-exclamation-triangle-fill';
        if (tipo === 'success') icono = 'bi-check-circle-fill';
        else if (tipo === 'danger') icono = 'bi-x-circle-fill';
        else if (tipo === 'info') icono = 'bi-info-circle-fill';

        toast.innerHTML = `
            <div class="app-toast-icon">
                <i class="bi ${icono}"></i>
            </div>
            <div class="app-toast-msg">${mensaje}</div>
            <button type="button" class="app-toast-close" aria-label="Cerrar">
                <i class="bi bi-x-lg"></i>
            </button>
        `;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        const timeout = setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 4000);

        const closeBtn = toast.querySelector('.app-toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                clearTimeout(timeout);
                toast.classList.add('hide');
                setTimeout(() => toast.remove(), 300);
            });
        }
    }

    // ==========================================
    // 2. GRÁFICOS DE BARRAS HORIZONTALES (empleados)
    // ==========================================

    function inicializarGraficos() {
        document.querySelectorAll('.empleado-grafico canvas').forEach(function(canvas) {
            const parent = canvas.closest('.asistencia-card-empleado');
            if (!parent) return;

            let data = {presente: 0, tarde: 0, ausente: 0, descanso: 0};
            if (parent.dataset.resumen) {
                try {
                    data = JSON.parse(parent.dataset.resumen);
                } catch(e) {
                    console.warn('Error al parsear resumen:', e);
                }
            }

            const ctx = canvas.getContext('2d');
            const labels = ['Presente', 'Tarde', 'Ausente', 'Descanso'];
            const values = [data.presente || 0, data.tarde || 0, data.ausente || 0, data.descanso || 0];
            const colors = ['#28A745', '#FFC107', '#DC3545', '#2E86C1'];

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderColor: ['#1E7E34', '#D39E00', '#BD2130', '#1B6FA8'],
                        borderWidth: 1,
                        borderRadius: 4,
                        barThickness: 16,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.parsed.x + ' días';
                                }
                            }
                        },
                        datalabels: {
                            anchor: 'end',
                            align: 'end',
                            color: '#1E293B',
                            font: { weight: 'bold', size: 11 },
                            formatter: function(value) {
                                return value > 0 ? value : '';
                            },
                            offset: 2
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: { display: false },
                            ticks: { stepSize: 1, font: { size: 9 } }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { font: { size: 10, weight: '500' } }
                        }
                    },
                    layout: {
                        padding: { right: 30 }
                    }
                },
                plugins: [ChartDataLabels]
            });
        });
    }

    // ==========================================
    // 3. FILTROS EN LA PÁGINA PRINCIPAL
    // ==========================================

    const inputBuscarEmpleado = document.getElementById('buscarEmpleado');
    const selectEmpleado = document.getElementById('filtroEmpleado');
    const btnLimpiarEmpleados = document.getElementById('limpiarFiltrosEmpleados');

    function filtrarEmpleados() {
        const texto = inputBuscarEmpleado.value.trim().toLowerCase();
        const empleadoId = selectEmpleado.value;
        const items = document.querySelectorAll('.empleado-item');

        items.forEach(function(item) {
            const nombre = (item.dataset.nombre || '').toLowerCase();
            const id = item.dataset.id || '';
            let mostrar = true;

            if (texto && !nombre.includes(texto)) {
                mostrar = false;
            }
            if (empleadoId && id !== empleadoId) {
                mostrar = false;
            }

            if (mostrar) {
                item.classList.remove('d-none');
            } else {
                item.classList.add('d-none');
            }
        });
    }

    if (inputBuscarEmpleado) {
        inputBuscarEmpleado.addEventListener('input', filtrarEmpleados);
        inputBuscarEmpleado.addEventListener('keyup', filtrarEmpleados);
    }
    if (selectEmpleado) {
        selectEmpleado.addEventListener('change', filtrarEmpleados);
    }
    if (btnLimpiarEmpleados) {
        btnLimpiarEmpleados.addEventListener('click', function() {
            inputBuscarEmpleado.value = '';
            selectEmpleado.value = '';
            filtrarEmpleados();
        });
    }

    // ==========================================
    // 4. MODAL DE HISTORIAL DE EMPLEADO (TABLA)
    // ==========================================

    let empleadoIdActual = null;
    let modalHistorialInstance = null;
    let modalDetalleInstance = null;
    let modalFechaInstance = null;

    const modalHistorialElement = document.getElementById('modalHistorialEmpleado');
    if (modalHistorialElement) {
        modalHistorialInstance = new bootstrap.Modal(modalHistorialElement, {
            backdrop: 'static',
            keyboard: true
        });

        modalHistorialElement.addEventListener('hidden.bs.modal', function () {
            if (!modalFechaInstance) {
                document.getElementById('filtroTurnoInterno').value = '';
                document.getElementById('filtroEstadoInterno').value = '';
                document.getElementById('fechaUnicaSeleccionadaHistorial').value = '';
                document.getElementById('fechaDesdeSeleccionadaHistorial').value = '';
                document.getElementById('fechaHastaSeleccionadaHistorial').value = '';
                const fechaUnicaInput = document.getElementById('fechaUnicaInputHistorial');
                if (fechaUnicaInput) fechaUnicaInput.value = '';
                const fechaDesdeInput = document.getElementById('fechaDesdeInputHistorial');
                if (fechaDesdeInput) fechaDesdeInput.value = '';
                const fechaHastaInput = document.getElementById('fechaHastaInputHistorial');
                if (fechaHastaInput) fechaHastaInput.value = '';
                empleadoIdActual = null;
            }
        });
    }

    const modalDetalleElement = document.getElementById('modalDetalleAsistencia');
    if (modalDetalleElement) {
        modalDetalleInstance = new bootstrap.Modal(modalDetalleElement, {
            backdrop: 'static',
            keyboard: true
        });
    }

    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-ver-historial');
        if (!btn) return;
        empleadoIdActual = btn.dataset.empleadoId;
        cargarHistorialEmpleado(empleadoIdActual);
    });

    function cargarHistorialEmpleado(empleadoId) {
        const contenedor = document.getElementById('contenidoHistorialEmpleado');
        if (!contenedor) return;
        contenedor.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';

        const turno = document.getElementById('filtroTurnoInterno')?.value || '';
        const estado = document.getElementById('filtroEstadoInterno')?.value || '';
        const fechaUnica = document.getElementById('fechaUnicaSeleccionadaHistorial')?.value || '';
        const fechaDesde = document.getElementById('fechaDesdeSeleccionadaHistorial')?.value || '';
        const fechaHasta = document.getElementById('fechaHastaSeleccionadaHistorial')?.value || '';

        let url = '/asistencia/empleado_historial/' + empleadoId + '/?';
        const params = [];

        if (fechaUnica) {
            params.push('fecha_unica=' + fechaUnica);
        } else if (fechaDesde && fechaHasta) {
            params.push('fecha_desde=' + fechaDesde);
            params.push('fecha_hasta=' + fechaHasta);
        }

        if (turno) params.push('turno=' + turno);
        if (estado) params.push('estado=' + estado);

        url += params.join('&');

        fetch(url, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('modalHistorialTitulo').textContent = 'Historial de Asistencia de ' + data.empleado_nombre;
            document.getElementById('modalHistorialSubTitulo').textContent = data.empleado_cargo || '';
            contenedor.innerHTML = data.html;

            if (modalHistorialInstance) {
                modalHistorialInstance.show();
            }

            document.querySelectorAll('.btn-ver-detalle-lista').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = this.dataset.id;
                    if (id) {
                        if (modalHistorialInstance) {
                            modalHistorialInstance.hide();
                        }
                        abrirDetalleAsistencia(id);
                    }
                });
            });
        })
        .catch(function(error) {
            console.error('Error al cargar historial:', error);
            contenedor.innerHTML = '<div class="alert alert-danger">Error al cargar los datos. Intenta de nuevo.</div>';
            mostrarToast('Error al cargar el historial. Intenta de nuevo.', 'danger');
        });
    }

    function abrirDetalleAsistencia(asistenciaId) {
        fetch('/asistencia/asistencia_detalle/' + asistenciaId + '/')
            .then(response => response.json())
            .then(data => {
                document.getElementById('detalleEmpleadoNombre').textContent = data.empleado;
                document.getElementById('detalleFecha').textContent = data.fecha;
                document.getElementById('detalleTurno').textContent = data.turno;
                document.getElementById('detalleCargo').textContent = data.cargo;
                document.getElementById('detalleHoraProgramada').textContent = data.hora_programada;
                document.getElementById('detalleHoraMarcada').textContent = data.hora_marcada;

                const estadoBadge = document.createElement('span');
                estadoBadge.className = 'badge badge-estado';
                if (data.estado_clase === 'presente') {
                    estadoBadge.classList.add('badge-presente');
                } else if (data.estado_clase === 'tarde') {
                    estadoBadge.classList.add('badge-tarde');
                } else if (data.estado_clase === 'ausente') {
                    estadoBadge.classList.add('badge-ausente');
                } else {
                    estadoBadge.classList.add('badge-sin-registro');
                }
                estadoBadge.textContent = data.estado;
                const estadoContainer = document.getElementById('detalleEstado');
                estadoContainer.innerHTML = '';
                estadoContainer.appendChild(estadoBadge);

                if (modalDetalleInstance) {
                    modalDetalleInstance.show();
                }
            })
            .catch(function(error) {
                console.error('Error al cargar detalle:', error);
                mostrarToast('No se pudo cargar el detalle de la asistencia.', 'danger');
                if (empleadoIdActual && modalHistorialInstance) {
                    cargarHistorialEmpleado(empleadoIdActual);
                }
            });
    }

    if (modalDetalleElement) {
        modalDetalleElement.addEventListener('hidden.bs.modal', function () {
            if (empleadoIdActual && modalHistorialInstance) {
                cargarHistorialEmpleado(empleadoIdActual);
            }
        });
    }

    document.querySelectorAll('#filtroTurnoInterno, #filtroEstadoInterno').forEach(function(el) {
        if (el) {
            el.addEventListener('change', function() {
                if (empleadoIdActual && modalHistorialInstance) {
                    cargarHistorialEmpleado(empleadoIdActual);
                }
            });
        }
    });

    document.getElementById('limpiarFiltrosInternos')?.addEventListener('click', function() {
        document.getElementById('filtroTurnoInterno').value = '';
        document.getElementById('filtroEstadoInterno').value = '';
        document.getElementById('fechaUnicaSeleccionadaHistorial').value = '';
        document.getElementById('fechaDesdeSeleccionadaHistorial').value = '';
        document.getElementById('fechaHastaSeleccionadaHistorial').value = '';
        const fechaUnicaInput = document.getElementById('fechaUnicaInputHistorial');
        if (fechaUnicaInput) fechaUnicaInput.value = '';
        const fechaDesdeInput = document.getElementById('fechaDesdeInputHistorial');
        if (fechaDesdeInput) fechaDesdeInput.value = '';
        const fechaHastaInput = document.getElementById('fechaHastaInputHistorial');
        if (fechaHastaInput) fechaHastaInput.value = '';
        if (empleadoIdActual && modalHistorialInstance) {
            cargarHistorialEmpleado(empleadoIdActual);
        }
    });

    // ==========================================
    // 5. MODALES DE FECHA (Historial)
    // ==========================================

    const modalFechaUnicaElement = document.getElementById('modalFechaUnicaHistorial');
    const modalRangoElement = document.getElementById('modalRangoFechasHistorial');

    if (modalFechaUnicaElement) {
        modalFechaUnicaElement.addEventListener('show.bs.modal', function () {
            modalFechaInstance = 'unica';
        });
        modalFechaUnicaElement.addEventListener('hidden.bs.modal', function () {
            modalFechaInstance = null;
            const fechaSeleccionada = document.getElementById('fechaUnicaSeleccionadaHistorial')?.value;
            if (fechaSeleccionada && empleadoIdActual) {
                setTimeout(function() {
                    if (modalHistorialInstance) {
                        cargarHistorialEmpleado(empleadoIdActual);
                    }
                }, 200);
            }
        });
    }

    if (modalRangoElement) {
        modalRangoElement.addEventListener('show.bs.modal', function () {
            modalFechaInstance = 'rango';
        });
        modalRangoElement.addEventListener('hidden.bs.modal', function () {
            modalFechaInstance = null;
            const desde = document.getElementById('fechaDesdeSeleccionadaHistorial')?.value;
            const hasta = document.getElementById('fechaHastaSeleccionadaHistorial')?.value;
            if (desde && hasta && empleadoIdActual) {
                setTimeout(function() {
                    if (modalHistorialInstance) {
                        cargarHistorialEmpleado(empleadoIdActual);
                    }
                }, 200);
            }
        });
    }

    document.getElementById('aplicarFechaUnicaHistorial')?.addEventListener('click', function() {
        const input = document.getElementById('fechaUnicaInputHistorial');
        if (input && input.value) {
            document.getElementById('fechaUnicaSeleccionadaHistorial').value = input.value;
            document.getElementById('fechaDesdeSeleccionadaHistorial').value = '';
            document.getElementById('fechaHastaSeleccionadaHistorial').value = '';
            const modal = bootstrap.Modal.getInstance(modalFechaUnicaElement);
            if (modal) modal.hide();
        } else {
            mostrarToast('Por favor selecciona una fecha.', 'warning');
        }
    });

    document.getElementById('aplicarRangoFechasHistorial')?.addEventListener('click', function() {
        const desde = document.getElementById('fechaDesdeInputHistorial');
        const hasta = document.getElementById('fechaHastaInputHistorial');
        if (desde && hasta && desde.value && hasta.value) {
            if (desde.value <= hasta.value) {
                document.getElementById('fechaDesdeSeleccionadaHistorial').value = desde.value;
                document.getElementById('fechaHastaSeleccionadaHistorial').value = hasta.value;
                document.getElementById('fechaUnicaSeleccionadaHistorial').value = '';
                const modal = bootstrap.Modal.getInstance(modalRangoElement);
                if (modal) modal.hide();
            } else {
                mostrarToast('La fecha "Desde" debe ser anterior a "Hasta".', 'warning');
            }
        } else {
            mostrarToast('Por favor selecciona ambas fechas.', 'warning');
        }
    });

    // ==========================================
    // 6. SOLUCIÓN PARA ADVERTENCIAS ARIA
    // ==========================================

    if (modalFechaUnicaElement) {
        modalFechaUnicaElement.addEventListener('show.bs.modal', function () {
            if (modalHistorialElement) {
                modalHistorialElement.setAttribute('inert', '');
            }
        });
        modalFechaUnicaElement.addEventListener('hidden.bs.modal', function () {
            if (modalHistorialElement) {
                modalHistorialElement.removeAttribute('inert');
                const closeBtn = modalHistorialElement.querySelector('.btn-close');
                if (closeBtn) setTimeout(() => closeBtn.focus(), 100);
            }
        });
    }

    if (modalRangoElement) {
        modalRangoElement.addEventListener('show.bs.modal', function () {
            if (modalHistorialElement) {
                modalHistorialElement.setAttribute('inert', '');
            }
        });
        modalRangoElement.addEventListener('hidden.bs.modal', function () {
            if (modalHistorialElement) {
                modalHistorialElement.removeAttribute('inert');
                const closeBtn = modalHistorialElement.querySelector('.btn-close');
                if (closeBtn) setTimeout(() => closeBtn.focus(), 100);
            }
        });
    }

    // ==========================================
    // 7. REGISTRAR ASISTENCIA (AJAX)
    // ==========================================

    function getCsrfToken() {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, 'csrftoken'.length + 1) === ('csrftoken' + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring('csrftoken'.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-registrar-asistencia');
        if (!btn) return;

        e.preventDefault();
        const horarioId = btn.dataset.horarioId;
        const originalHtml = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append('horario_id', horarioId);

        const csrfToken = getCsrfToken();

        fetch('/asistencia/registrar-asistencia/', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    let errorMsg = text;
                    try {
                        const json = JSON.parse(text);
                        if (json.error) errorMsg = json.error;
                    } catch (e) {}
                    throw new Error(errorMsg || 'Error al registrar la asistencia.');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                mostrarToast('Asistencia registrada correctamente.', 'success');

                const row = btn.closest('tr');
                if (!row) return;

                const estadoCell = row.querySelector('td:nth-child(5)');
                if (estadoCell) {
                    const badge = estadoCell.querySelector('.badge');
                    if (badge) {
                        badge.textContent = data.estado_display;
                        badge.className = 'badge ' + (data.estado === 'PRESENTE' ? 'badge-active' : 'badge-pendiente');
                    }
                }

                const horaCell = row.querySelector('td:nth-child(4)');
                if (horaCell) {
                    horaCell.textContent = data.hora_marcada;
                }

                const actionCell = btn.closest('td');
                if (actionCell) {
                    actionCell.innerHTML = '<span class="badge badge-active"><i class="bi bi-check2"></i> Registrado</span>';
                }
            } else {
                mostrarToast(data.error || 'Error al registrar la asistencia.', 'warning');
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarToast(error.message || 'Error de conexión. Intenta de nuevo.', 'warning');
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        });
    });

    // ==========================================
    // 8. INICIALIZACIÓN
    // ==========================================
    inicializarGraficos();

});