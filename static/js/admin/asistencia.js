document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. FUNCIONES EXISTENTES (HORARIOS, CALENDARIOS DE HORARIOS, ETC.)
    // ==========================================

    function diasVisibles(turno) {
        return turno === "FIJO" ? 7 : 15;
    }

    function actualizarDiasCalendario(ciclo, turno, inputFecha, label, texto) {
        if (!ciclo) return;
        const maxDias = diasVisibles(turno);
        ciclo.querySelectorAll(".dia-btn").forEach(function (btn) {
            const indice = parseInt(btn.dataset.indice, 10);
            if (indice < maxDias) {
                btn.style.display = "";
            } else {
                btn.style.display = "none";
                if (btn.classList.contains("seleccionado")) {
                    btn.classList.remove("seleccionado");
                    if (inputFecha) inputFecha.value = "";
                    if (label) label.style.display = "none";
                    if (texto) texto.textContent = "";
                }
            }
        });
    }

    // Autocompletar cargo al seleccionar empleado (para horarios)
    const empleadoSelect = document.getElementById("empleadoSelect");
    const cargoInput = document.getElementById("cargoInput");
    if (empleadoSelect && cargoInput) {
        empleadoSelect.addEventListener("change", function () {
            const opcion = this.options[this.selectedIndex];
            cargoInput.value = opcion.dataset.cargo || "";
        });
    }

    // Calendario para crear horario
    const turnoSelect = document.getElementById("turnoSelect");
    const horaEntrada = document.getElementById("horaEntrada");
    const horaSalida = document.getElementById("horaSalida");
    const cicloCrear = document.getElementById("ciclo14x1");
    const inputCrear = document.getElementById("fechaDescansoInput");
    const labelCrear = document.getElementById("descansoLabel");
    const textoCrear = document.getElementById("descansoFechaTexto");

    if (turnoSelect) {
        turnoSelect.addEventListener("change", function () {
            switch (this.value) {
                case "MANANA":
                    horaEntrada.value = "05:00";
                    horaSalida.value = "13:00";
                    break;
                case "TARDE":
                    horaEntrada.value = "13:00";
                    horaSalida.value = "22:00";
                    break;
                case "FIJO":
                    horaEntrada.value = "08:00";
                    horaSalida.value = "17:00";
                    break;
                default:
                    horaEntrada.value = "";
                    horaSalida.value = "";
            }
            actualizarDiasCalendario(cicloCrear, this.value, inputCrear, labelCrear, textoCrear);
        });
        actualizarDiasCalendario(cicloCrear, turnoSelect.value, inputCrear, labelCrear, textoCrear);
    }

    if (cicloCrear) {
        cicloCrear.addEventListener("click", function (e) {
            const btn = e.target.closest(".dia-btn");
            if (!btn || btn.style.display === "none") return;
            cicloCrear.querySelectorAll(".dia-btn").forEach(b => b.classList.remove("seleccionado"));
            btn.classList.add("seleccionado");
            inputCrear.value = btn.dataset.fecha;
            textoCrear.textContent = btn.dataset.label;
            labelCrear.style.display = "block";
        });
    }

    // Limpiar formulario crear horario
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
                actualizarDiasCalendario(cicloCrear, "", inputCrear, labelCrear, textoCrear);
            }, 10);
        });
    }

    // Calendario para editar horario
    const cicloEditar = document.getElementById("ciclo14x1Editar");
    const inputEditar = document.getElementById("fechaDescansoEditarInput");
    const labelEditar = document.getElementById("descansoEditarLabel");
    const textoEditar = document.getElementById("descansoEditarFechaTexto");
    const editarTurnoSelect = document.getElementById("editar-turno");

    if (editarTurnoSelect) {
        editarTurnoSelect.addEventListener("change", function () {
            actualizarDiasCalendario(cicloEditar, this.value, inputEditar, labelEditar, textoEditar);
        });
    }

    if (cicloEditar) {
        cicloEditar.addEventListener("click", function (e) {
            const btn = e.target.closest(".dia-btn");
            if (!btn || btn.style.display === "none") return;
            cicloEditar.querySelectorAll(".dia-btn").forEach(b => b.classList.remove("seleccionado"));
            btn.classList.add("seleccionado");
            inputEditar.value = btn.dataset.fecha;
            textoEditar.textContent = btn.dataset.label;
            labelEditar.style.display = "block";
        });
    }

    // Delegación para ver y editar horarios (modales)
    document.addEventListener("click", function (e) {
        const btnVer = e.target.closest(".btn-ver-horario");
        if (btnVer) {
            const id = btnVer.dataset.id;
            fetch("/asistencia/horarios/" + id + "/json/")
                .then(function (res) {
                    if (!res.ok) throw new Error("Error en la respuesta del servidor");
                    return res.json();
                })
                .then(function (data) {
                    document.getElementById("ver-empleado").textContent = data.empleado;
                    document.getElementById("ver-cargo").textContent = data.cargo;
                    document.getElementById("ver-turno").textContent = data.turno;
                    document.getElementById("ver-entrada").textContent = data.hora_entrada;
                    document.getElementById("ver-salida").textContent = data.hora_salida;
                    document.getElementById("ver-descanso").textContent = data.descanso || "Sin asignar";
                    document.getElementById("ver-estado").textContent = data.estado ? "Activo" : "Inactivo";
                    const ciclo = document.getElementById("ver-ciclo");
                    if (ciclo) {
                        ciclo.textContent = (data.ciclo_inicio && data.ciclo_fin)
                            ? data.ciclo_inicio + " — " + data.ciclo_fin
                            : "Sin definir";
                    }
                    const modalVer = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalVerHorario"));
                    modalVer.show();
                })
                .catch(function (err) {
                    console.error(err);
                    alert("No se pudo cargar la información del horario.");
                });
        }

        const btnEditar = e.target.closest(".btn-editar-horario");
        if (btnEditar) {
            const id = btnEditar.dataset.id;
            fetch("/asistencia/horarios/" + id + "/json/")
                .then(function (res) {
                    if (!res.ok) throw new Error("Error en la respuesta del servidor");
                    return res.json();
                })
                .then(function (data) {
                    document.getElementById("editar-empleado").value = data.empleado;
                    document.getElementById("editar-cargo").value = data.cargo;
                    document.getElementById("editar-turno").value = data.turno_valor;
                    document.getElementById("editar-entrada").value = data.hora_entrada;
                    document.getElementById("editar-salida").value = data.hora_salida;
                    document.getElementById("formEditar").action = "/asistencia/horarios/" + id + "/editar/";
                    const labelActual = document.getElementById("descanso-actual-label");
                    if (labelActual) {
                        labelActual.textContent = data.descanso ? "— actual: " + data.descanso : "";
                    }
                    actualizarDiasCalendario(cicloEditar, data.turno_valor, inputEditar, labelEditar, textoEditar);
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
                    const modalEditar = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalEditarHorario"));
                    modalEditar.show();
                })
                .catch(function (err) {
                    console.error(err);
                    alert("No se pudo cargar la información para editar el horario.");
                });
        }

        // Eliminar horario
        const btnEliminar = e.target.closest(".btn-eliminar-horario");
        if (btnEliminar) {
            e.preventDefault();
            const id = btnEliminar.dataset.id;
            const nombre = btnEliminar.dataset.empleado || "empleado";
            const form = document.getElementById("formEliminarHorario");
            if (form) {
                form.action = "/asistencia/horarios/" + id + "/eliminar/";
            }
            const nombreSpan = document.getElementById("eliminar-empleado-nombre");
            if (nombreSpan) {
                nombreSpan.textContent = nombre;
            }
            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalEliminarHorario"));
            modal.show();
        }
    });

    // Filtros de la tabla de horarios (existente)
    const filas = document.querySelectorAll("table.table-custom tbody tr");
    const inputBuscar = document.getElementById("buscarHorario");
    const selectTurno = document.getElementById("filtroTurno");
    const selectEstado = document.getElementById("filtroEstadoHorario");

    if (inputBuscar) {
        function aplicarFiltros() {
            const texto = inputBuscar.value.trim().toLowerCase();
            const turno = selectTurno.value.toLowerCase();
            const estado = selectEstado.value.toLowerCase();
            filas.forEach(fila => {
                const celdas = fila.querySelectorAll("td");
                if (celdas.length < 6) return;
                const empleado = celdas[0].textContent.trim().toLowerCase();
                const turnoFila = celdas[2].textContent.trim().toLowerCase();
                const estadoFila = celdas[5].textContent.trim().toLowerCase();
                const coincideTexto = !texto || empleado.includes(texto);
                const coincideTurno = !turno || turnoFila === turno;
                const coincideEstado = !estado || estadoFila === estado;
                fila.style.display = (coincideTexto && coincideTurno && coincideEstado) ? "" : "none";
            });
        }

        [inputBuscar, selectTurno, selectEstado].forEach(el => {
            if (el) {
                el.addEventListener("input", aplicarFiltros);
                el.addEventListener("change", aplicarFiltros);
            }
        });

        const btnLimpiarFiltros = document.getElementById("limpiarFiltrosHorarios");
        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener("click", function () {
                inputBuscar.value = "";
                if (selectTurno) selectTurno.value = "";
                if (selectEstado) selectEstado.value = "";
                aplicarFiltros();
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
    // 8 de Sep/2026: 4. MODAL DE HISTORIAL DE EMPLEADO (TABLA)
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
                alert('No se pudo cargar el detalle de la asistencia.');
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
    // 5. 8 de Sep/2026: MODALES DE FECHA (Historial)
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
            alert('Por favor selecciona una fecha.');
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
                alert('La fecha "Desde" debe ser anterior a "Hasta".');
            }
        } else {
            alert('Por favor selecciona ambas fechas.');
        }
    });

    // ==========================================
    // 6. INICIALIZACIÓN
    // ==========================================
    inicializarGraficos();

    // ==========================================
    // 8 de Sep/2026: 7. SOLUCIÓN PARA ADVERTENCIAS ARIA
    // ==========================================

    // Al abrir un modal de fecha, marcar el modal de historial como inerte
    if (modalFechaUnicaElement) {
        modalFechaUnicaElement.addEventListener('show.bs.modal', function () {
            if (modalHistorialElement) {
                modalHistorialElement.setAttribute('inert', '');
            }
        });
        modalFechaUnicaElement.addEventListener('hidden.bs.modal', function () {
            if (modalHistorialElement) {
                modalHistorialElement.removeAttribute('inert');
                // Forzar foco al modal de historial (opcional)
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
    // 8 de Sep/2026: 8. REGISTRAR ASISTENCIA (AJAX)

    // Este cambio/funcion sirve para el dropdown de asistencia del dia presente.
    // Esto genera que no se recargue la pagina y seguir registrando.
    // ==========================================

    // Función auxiliar para obtener el token CSRF desde la cookie
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

        // Deshabilitar y mostrar spinner
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append('horario_id', horarioId);

        // Obtener token CSRF desde la cookie
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
                    throw new Error(text || 'Error en la respuesta del servidor');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Encontrar la fila más cercana
                const row = btn.closest('tr');
                if (!row) return;

                // Actualizar celda de estado (5ta columna)
                const estadoCell = row.querySelector('td:nth-child(5)');
                if (estadoCell) {
                    const badge = estadoCell.querySelector('.badge');
                    if (badge) {
                        badge.textContent = data.estado_display;
                        badge.className = 'badge ' + (data.estado === 'PRESENTE' ? 'badge-active' : 'badge-pendiente');
                    }
                }

                // Actualizar celda de hora marcada (4ta columna)
                const horaCell = row.querySelector('td:nth-child(4)');
                if (horaCell) {
                    horaCell.textContent = data.hora_marcada;
                }

                // Reemplazar el botón por un badge "Registrado"
                const actionCell = btn.closest('td');
                if (actionCell) {
                    actionCell.innerHTML = '<span class="badge badge-active"><i class="bi bi-check2"></i> Registrado</span>';
                }
            } else {
                alert(data.error || 'Error al registrar la asistencia.');
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error de conexión. Intenta de nuevo.');
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        });
    });
});