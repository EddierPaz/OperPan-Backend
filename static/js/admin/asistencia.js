document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. FUNCIONES EXISTENTES (HORARIOS, CALENDARIOS, ETC.)
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

        // Botón limpiar filtros
        const btnLimpiarFiltros = document.getElementById('limpiarFiltrosEmpleados');
        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener('click', function() {
                // Restablecer campo de búsqueda
                if (inputBuscarEmpleado) {
                    inputBuscarEmpleado.value = '';
                }
                // Restablecer dropdown de empleados
                if (selectEmpleado) {
                    selectEmpleado.value = '';
                }
                // Ejecutar el filtro para actualizar la vista
                filtrarEmpleados();
            });
        }
    }

    // ==========================================
    // 2. NUEVA FUNCIONALIDAD: EMPLEADOS Y GRÁFICOS
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
            
            const total = data.presente + data.tarde + data.ausente + data.descanso;
            let chartData, chartColors;
            if (total === 0) {
                chartData = [1];
                chartColors = ['#E9ECEF'];
            } else {
                chartData = [data.presente || 0, data.tarde || 0, data.ausente || 0, data.descanso || 0];
                chartColors = ['#28A745', '#FFC107', '#DC3545', '#2E86C1'];
            }
            
            const ctx = canvas.getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Presente', 'Tarde', 'Ausente', 'Descanso'],
                    datasets: [{
                        data: chartData,
                        backgroundColor: chartColors,
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (total === 0) return 'Sin datos';
                                    return context.label + ': ' + context.raw;
                                }
                            }
                        }
                    },
                    cutout: '65%'
                }
            });
        });
    }

    // ==========================================
    // 3. FILTROS EN LA PÁGINA PRINCIPAL (empleados)
    // ==========================================

    console.log('Inicializando filtros de empleados...');

    const inputBuscarEmpleado = document.getElementById('buscarEmpleado');
    const selectEmpleado = document.getElementById('filtroEmpleado');

    console.log('inputBuscarEmpleado:', inputBuscarEmpleado);
    console.log('selectEmpleado:', selectEmpleado);

    function filtrarEmpleados() {
        const texto = inputBuscarEmpleado.value.trim().toLowerCase();
        const empleadoId = selectEmpleado.value;
        const items = document.querySelectorAll('.empleado-item');
        console.log(`Filtrando: texto="${texto}", empleadoId="${empleadoId}", total items=${items.length}`);
        
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

    // Eventos
    if (inputBuscarEmpleado) {
        inputBuscarEmpleado.addEventListener('input', filtrarEmpleados);
        inputBuscarEmpleado.addEventListener('keyup', filtrarEmpleados);
    } else {
        console.error('No se encontró el elemento #buscarEmpleado');
    }

    if (selectEmpleado) {
        selectEmpleado.addEventListener('change', filtrarEmpleados);
    } else {
        console.error('No se encontró el elemento #filtroEmpleado');
    }

    // Botón limpiar filtros
    const btnLimpiarFiltros = document.getElementById('limpiarFiltrosEmpleados');
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', function() {
            if (inputBuscarEmpleado) {
                inputBuscarEmpleado.value = '';
            }
            if (selectEmpleado) {
                selectEmpleado.value = '';
            }
            filtrarEmpleados();
        });
    }

    // Eventos
    if (inputBuscarEmpleado) {
        inputBuscarEmpleado.addEventListener('input', filtrarEmpleados);
        inputBuscarEmpleado.addEventListener('keyup', filtrarEmpleados);
    } else {
        console.error('No se encontró el elemento #buscarEmpleado');
    }

    if (selectEmpleado) {
        selectEmpleado.addEventListener('change', filtrarEmpleados);
    } else {
        console.error('No se encontró el elemento #filtroEmpleado');
    }

    // ==========================================
    // 4. MODAL DE HISTORIAL DE EMPLEADO
    // ==========================================

    let empleadoIdActual = null;

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

        let url = '/asistencia/empleado_historial/' + empleadoId + '/?';
        const turno = document.getElementById('filtroTurnoInterno')?.value || '';
        const estado = document.getElementById('filtroEstadoInterno')?.value || '';
        const mes = document.getElementById('filtroMesInterno')?.value || '';
        const fechaUnica = document.getElementById('fechaUnicaSeleccionadaInterna')?.value || '';
        const fechaDesde = document.getElementById('fechaDesdeSeleccionadaInterna')?.value || '';
        const fechaHasta = document.getElementById('fechaHastaSeleccionadaInterna')?.value || '';

        const params = [];
        if (turno) params.push('turno=' + turno);
        if (estado) params.push('estado=' + estado);
        if (mes) params.push('mes=' + mes);
        if (fechaUnica) params.push('fecha_unica=' + fechaUnica);
        if (fechaDesde) params.push('fecha_desde=' + fechaDesde);
        if (fechaHasta) params.push('fecha_hasta=' + fechaHasta);
        url += params.join('&');

        fetch(url, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('modalHistorialTitulo').textContent = 'Historial de Asistencia de ' + data.empleado_nombre;
            document.getElementById('modalHistorialSubTitulo').textContent = data.empleado_cargo || '';
            contenedor.innerHTML = data.html;

            // Eventos de los días del calendario
            document.querySelectorAll('.dia-calendario').forEach(function(el) {
                el.addEventListener('click', function() {
                    const idAsistencia = this.dataset.idAsistencia;
                    if (idAsistencia) {
                        abrirDetalleAsistencia(idAsistencia);
                    } else {
                        alert('No hay registro de asistencia para esta fecha.');
                    }
                });
            });
            // Eventos de los botones "ver detalle" en lista
            document.querySelectorAll('.btn-ver-detalle-lista').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = this.dataset.id;
                    if (id) abrirDetalleAsistencia(id);
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar historial:', error);
            contenedor.innerHTML = '<div class="alert alert-danger">Error al cargar los datos. Intenta de nuevo.</div>';
        });
    }

    function abrirDetalleAsistencia(asistenciaId) {
        // Por ahora solo muestra un alert. Puedes implementar la carga real aquí.
        alert('Ver detalle de asistencia ID: ' + asistenciaId);
        // fetch('/asistencia/asistencia_detalle/' + asistenciaId + '/')
        //   .then(response => response.json())
        //   .then(data => { ... llenar modal ... })
    }

    // Eventos de filtros internos del modal
    document.querySelectorAll('#filtroTurnoInterno, #filtroEstadoInterno, #filtroMesInterno').forEach(function(el) {
        if (el) {
            el.addEventListener('change', function() {
                if (empleadoIdActual) cargarHistorialEmpleado(empleadoIdActual);
            });
        }
    });

    document.getElementById('limpiarFiltrosInternos')?.addEventListener('click', function() {
        document.getElementById('filtroTurnoInterno').value = '';
        document.getElementById('filtroEstadoInterno').value = '';
        document.getElementById('filtroMesInterno').value = '';
        document.getElementById('fechaUnicaSeleccionadaInterna').value = '';
        document.getElementById('fechaDesdeSeleccionadaInterna').value = '';
        document.getElementById('fechaHastaSeleccionadaInterna').value = '';
        if (empleadoIdActual) cargarHistorialEmpleado(empleadoIdActual);
    });

    document.getElementById('aplicarFechaUnicaInterna')?.addEventListener('click', function() {
        const input = document.getElementById('fechaUnicaInputInterna');
        if (input && input.value) {
            document.getElementById('fechaUnicaSeleccionadaInterna').value = input.value;
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalFechaUnicaInterna'));
            if (modal) modal.hide();
            if (empleadoIdActual) cargarHistorialEmpleado(empleadoIdActual);
        } else {
            alert('Por favor selecciona una fecha.');
        }
    });

    document.getElementById('aplicarRangoFechasInterno')?.addEventListener('click', function() {
        const desde = document.getElementById('fechaDesdeInputInterna');
        const hasta = document.getElementById('fechaHastaInputInterna');
        if (desde && hasta && desde.value && hasta.value) {
            if (desde.value <= hasta.value) {
                document.getElementById('fechaDesdeSeleccionadaInterna').value = desde.value;
                document.getElementById('fechaHastaSeleccionadaInterna').value = hasta.value;
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalRangoFechasInterno'));
                if (modal) modal.hide();
                if (empleadoIdActual) cargarHistorialEmpleado(empleadoIdActual);
            } else {
                alert('La fecha "Desde" debe ser anterior a "Hasta".');
            }
        } else {
            alert('Por favor selecciona ambas fechas.');
        }
    });

    // Rellenar dropdown de meses internos
    function llenarMesesInternos() {
        const select = document.getElementById('filtroMesInterno');
        if (!select) return;
        select.innerHTML = '';
        const hoy = new Date();
        for (let i = 0; i < 12; i++) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            const valor = fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0');
            const nombre = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
            const option = document.createElement('option');
            option.value = valor;
            option.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
            select.appendChild(option);
        }
    }
    llenarMesesInternos();

    // ==========================================
    // 5. INICIALIZACIÓN
    // ==========================================
    inicializarGraficos();
    console.log('Asistencia - Nuevo módulo de empleados cargado.');
});