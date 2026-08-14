(function () {
    let memorandosData = [];
    let empleadosData = [];

    // Cargar empleados - Similar al de horarios
    async function cargarEmpleados() {
        try {
            const resp = await fetch('/memorandos/empleados/');
            empleadosData = await resp.json();
            const select = document.getElementById('memorandoEmpleado');
            if (!select) return;
           
            select.innerHTML = '<option value="">Seleccionar empleado</option>';
            empleadosData.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = emp.nombre_completo;
                option.dataset.cargo = emp.cargo; // Guardar cargo en data attribute
                select.appendChild(option);
            });

            // Evento para autocompletar cargo al seleccionar empleado
            select.addEventListener('change', function() {
                const cargoInput = document.getElementById('memorandoCargo');
                const selectedOption = this.options[this.selectedIndex];
                if (selectedOption && selectedOption.dataset.cargo) {
                    cargoInput.value = selectedOption.dataset.cargo;
                } else {
                    cargoInput.value = '';
                }
            });

        } catch (err) {
            console.error('Error al cargar empleados:', err);
        }
    }

    // Cargar historial con timestamp para evitar caché
    async function cargarMemorandosHistorial() {
        try {
            // Añadir timestamp para evitar caché
            const timestamp = new Date().getTime();
            const resp = await fetch(`/memorandos/?_=${timestamp}`);
            
            // Verificar si la respuesta es válida
            if (!resp.ok) {
                throw new Error(`Error HTTP: ${resp.status}`);
            }
            
            memorandosData = await resp.json();
            renderizarTablaMemorandos(memorandosData);
            actualizarKPIsMemorandos(memorandosData);
        } catch (err) {
            console.error('Error al cargar historial:', err);
            // Mostrar mensaje de error al usuario
            const tbody = document.getElementById('memorandosTablaBody');
            const sinResultados = document.getElementById('memorandosSinResultados');
            if (tbody) {
                tbody.innerHTML = '';
                if (sinResultados) {
                    sinResultados.classList.remove('d-none');
                    sinResultados.innerHTML = `
                        <i class="bi bi-exclamation-triangle fs-1 d-block mb-2 text-warning"></i>
                        Error al cargar los memorandos. Por favor, intente nuevamente.
                    `;
                }
            }
        }
    }

    function renderizarTablaMemorandos(data) {
        const tbody = document.getElementById('memorandosTablaBody');
        const sinResultados = document.getElementById('memorandosSinResultados');
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = '';
            if (sinResultados) {
                sinResultados.classList.remove('d-none');
                sinResultados.innerHTML = `
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay memorandos registrados.
                `;
            }
            return;
        }
        if (sinResultados) sinResultados.classList.add('d-none');

        tbody.innerHTML = data.map(m => {
            const tipoBadge = `<span class="badge text-dark badge-memorando-${m.tipo_raw || 'default'}">${m.tipo || 'Sin tipo'}</span>`;
            const btnDescarga = m.archivo_pdf
                ? `<a href="/memorandos/${m.id}/descargar/" class="btn btn-sm btn-primary-corporate" target="_blank" title="Descargar PDF"><i class="bi bi-download"></i></a>`
                : `<span class="text-muted"><i class="bi bi-file-earmark-pdf"></i> Sin PDF</span>`;

            // Mostrar empleado con cargo en la tabla (como en horarios)
            const empleadoConCargo = m.empleado_cargo ?
                `${m.empleado} <br><small class="text-muted" style="font-size: 0.7rem;">${m.empleado_cargo}</small>` :
                m.empleado;

            return `<tr>
                <td data-label="Consecutivo"><strong>${m.consecutivo || 'N/A'}</strong></td>
                <td data-label="Empleado">${empleadoConCargo}</td>
                <td data-label="Tipo">${tipoBadge}</td>
                <td data-label="Asunto">${m.asunto || 'Sin asunto'}</td>
                <td data-label="Fecha emisión">${m.fecha_emision ? new Date(m.fecha_emision).toLocaleString('es-CO') : 'N/A'}</td>
                <td data-label="Generado por">${m.generado_por || '—'}</td>
                <td data-label="Acciones">${btnDescarga}</td>
            </tr>`;
        }).join('');
    }

    function actualizarKPIsMemorandos(data) {
        const ahora = new Date();
        const mes = ahora.getMonth();
        const año = ahora.getFullYear();
        const hoy = ahora.toDateString();

        const total = data ? data.length : 0;
        const esteMes = data ? data.filter(m => {
            try {
                const f = new Date(m.fecha_emision);
                return f.getMonth() === mes && f.getFullYear() === año;
            } catch (e) {
                return false;
            }
        }).length : 0;
        const hoyCount = data ? data.filter(m => {
            try {
                const f = new Date(m.fecha_emision);
                return f.toDateString() === hoy;
            } catch (e) {
                return false;
            }
        }).length : 0;

        const elTotal = document.getElementById('memorandosKpiTotal');
        const elMes = document.getElementById('memorandosKpiMes');
        const elHoy = document.getElementById('memorandosKpiHoy');

        if (elTotal) elTotal.innerText = total;
        if (elMes) elMes.innerText = esteMes;
        if (elHoy) elHoy.innerText = hoyCount;
    }

    // Añadir un nuevo memorando a la lista local sin recargar
    function agregarMemorandoLocal(memorando) {
        if (!memorando) return false;
        
        // Verificar si ya existe para evitar duplicados
        const existe = memorandosData.some(m => m.id === memorando.id);
        if (existe) return false;
        
        // Añadir al inicio del array
        memorandosData.unshift(memorando);
        renderizarTablaMemorandos(memorandosData);
        actualizarKPIsMemorandos(memorandosData);
        return true;
    }

    // Configuración del formulario
    function configurarFormularioMemorando() {
        const form = document.getElementById('memorandoForm');
        if (!form || form.dataset.bound === 'true') return;
        form.dataset.bound = 'true';

        // Botón limpiar - Similar al de horarios
        const btnLimpiar = document.querySelector('button[form="memorandoForm"][type="reset"]');
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', function(e) {
                e.preventDefault();
                setTimeout(function() {
                    const cargoInput = document.getElementById('memorandoCargo');
                    if (cargoInput) cargoInput.value = '';
                    const select = document.getElementById('memorandoEmpleado');
                    if (select) select.value = '';
                    const tipoSelect = document.getElementById('memorandoTipo');
                    if (tipoSelect) tipoSelect.value = '';
                    const asuntoInput = document.getElementById('memorandoAsunto');
                    if (asuntoInput) asuntoInput.value = '';
                    const contenidoTextarea = document.getElementById('memorandoContenido');
                    if (contenidoTextarea) contenidoTextarea.value = '';
                   
                    // Remover clase seleccionado de cualquier elemento
                    document.querySelectorAll('.seleccionado').forEach(el => {
                        el.classList.remove('seleccionado');
                    });
                }, 10);
            });
        }

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const btn = document.getElementById('memorandoBtnGenerar');
            const originalBtnText = btn.innerHTML;
           
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Generando...';

            try {
                const empleadoId = document.getElementById('memorandoEmpleado').value;
                const tipo = document.getElementById('memorandoTipo').value;
                const asunto = document.getElementById('memorandoAsunto').value.trim();
                const contenido = document.getElementById('memorandoContenido').value.trim();
               
                if (!empleadoId) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Campo requerido',
                        text: 'Por favor seleccione un empleado',
                        confirmButtonText: 'Aceptar'
                    });
                    btn.disabled = false;
                    btn.innerHTML = originalBtnText;
                    return;
                }
               
                const resp = await fetch('/memorandos/crear/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCSRFToken(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        empleado: empleadoId,
                        tipo: tipo,
                        asunto: asunto,
                        contenido: contenido
                    })
                });

                const data = await resp.json();

                if (resp.ok && data.status === 'ok') {
                    bootstrap.Modal.getInstance(document.getElementById('modalMemorando'))?.hide();
                   
                    // Añadir el memorando localmente si existe el objeto
                    let memorandoAgregado = false;
                    if (data.memorando) {
                        memorandoAgregado = agregarMemorandoLocal(data.memorando);
                    }
                    
                    // Si no se pudo agregar localmente, recargar todo
                    if (!memorandoAgregado) {
                        await cargarMemorandosHistorial();
                    }
                   
                    Swal.fire({
                        icon: 'success',
                        title: '¡Memorando generado!',
                        html: `
                            <div style="text-align: left; margin-top: 1rem;">
                                <p><strong>Consecutivo:</strong> ${data.consecutivo || 'N/A'}</p>
                                <p><strong>Empleado:</strong> ${data.empleado_nombre || 'N/A'}</p>
                                <p><strong>Cargo:</strong> ${data.empleado_cargo || '—'}</p>
                            </div>
                        `,
                        footer: data.archivo_pdf ? `<a href="${data.archivo_pdf}" target="_blank" class="btn btn-primary-corporate"><i class="bi bi-file-earmark-pdf me-2"></i>Ver PDF</a>` : '',
                        confirmButtonText: 'Aceptar',
                        width: '500px'
                    });

                    // Resetear formulario
                    form.reset();
                    const cargoInput = document.getElementById('memorandoCargo');
                    if (cargoInput) cargoInput.value = '';
                   
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.error || data.detalles || 'No se pudo procesar la solicitud.',
                        confirmButtonText: 'Aceptar'
                    });
                }
            } catch (err) {
                console.error('Error:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: 'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.',
                    confirmButtonText: 'Aceptar'
                });
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalBtnText;
            }
        });
    }
   
    function getCSRFToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }

    // Función pública
    window.cargarMemorandos = async function() {
        await cargarEmpleados();
        await cargarMemorandosHistorial();
        configurarFormularioMemorando();
    };

    // Inicialización
    if (document.getElementById('tabMemorandos')?.classList.contains('active')) {
        window.cargarMemorandos();
    }
})();