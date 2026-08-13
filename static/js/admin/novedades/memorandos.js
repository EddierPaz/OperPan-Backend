// ============================================================
// MEMORANDOS.JS - MÓDULO DE MEMORANDOS
// Panel de administración de novedades - OperPan
// ============================================================

(function () {
    let memorandosData = [];
    let empleadosData = [];

    // ============================================================
    // CARGAR EMPLEADOS
    // ============================================================
    async function cargarEmpleados() {
        try {
            const resp = await fetch('/memorandos/empleados/');
            empleadosData = await resp.json();
            const select = document.getElementById('memorandoEmpleado');
            if (!select) return;
            select.innerHTML = '<option value="">Seleccionar empleado</option>';
            empleadosData.forEach(emp => {
                select.innerHTML += `<option value="${emp.id}">${emp.nombre_completo} - ${emp.cargo}</option>`;
            });
        } catch (err) {
            console.error('Error al cargar empleados para memorandos:', err);
        }
    }

    // ============================================================
    // CARGAR HISTORIAL
    // ============================================================
    async function cargarMemorandosHistorial() {
        try {
            const resp = await fetch('/memorandos/');
            memorandosData = await resp.json();
            renderizarTablaMemorandos(memorandosData);
            actualizarKPIsMemorandos(memorandosData);
        } catch (err) {
            console.error('Error al cargar historial de memorandos:', err);
            const tbody = document.getElementById('memorandosTablaBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar los memorandos.</td></tr>';
        }
    }

    // ============================================================
    // RENDERIZAR TABLA
    // ============================================================
    function renderizarTablaMemorandos(data) {
        const tbody = document.getElementById('memorandosTablaBody');
        const sinResultados = document.getElementById('memorandosSinResultados');

        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = '';
            if (sinResultados) sinResultados.classList.remove('d-none');
            return;
        }
        if (sinResultados) sinResultados.classList.add('d-none');

        tbody.innerHTML = data.map(m => {
            const tipoBadge = `<span class="badge text-dark badge-memorando-${m.tipo_raw}">${m.tipo}</span>`;
            const btnDescarga = m.archivo_pdf
                ? `<a href="/memorandos/${m.id}/descargar/" class="btn btn-sm btn-primary-corporate" target="_blank" title="Descargar PDF">
                    <i class="bi bi-download"></i>
                  </a>`
                : `<span class="text-muted"><i class="bi bi-file-earmark-pdf"></i> Sin PDF</span>`;

            return `<tr>
                <td data-label="Consecutivo"><strong>${m.consecutivo}</strong></td>
                <td data-label="Empleado">${m.empleado}</td>
                <td data-label="Tipo">${tipoBadge}</td>
                <td data-label="Asunto">${m.asunto}</td>
                <td data-label="Fecha emisión">${new Date(m.fecha_emision).toLocaleString('es-CO')}</td>
                <td data-label="Generado por">${m.generado_por || '—'}</td>
                <td data-label="Acciones">${btnDescarga}</td>
            </tr>`;
        }).join('');
    }

    // ============================================================
    // ACTUALIZAR KPIS
    // ============================================================
    function actualizarKPIsMemorandos(data) {
        const ahora = new Date();
        const mes = ahora.getMonth();
        const año = ahora.getFullYear();
        const hoy = ahora.toDateString();

        const total = data.length;
        const esteMes = data.filter(m => {
            const f = new Date(m.fecha_emision);
            return f.getMonth() === mes && f.getFullYear() === año;
        }).length;
        const hoyCount = data.filter(m => {
            const f = new Date(m.fecha_emision);
            return f.toDateString() === hoy;
        }).length;

        const elTotal = document.getElementById('memorandosKpiTotal');
        const elMes = document.getElementById('memorandosKpiMes');
        const elHoy = document.getElementById('memorandosKpiHoy');

        if (elTotal) elTotal.innerText = total;
        if (elMes) elMes.innerText = esteMes;
        if (elHoy) elHoy.innerText = hoyCount;
    }

    // ============================================================
    // CONFIGURAR FORMULARIO
    // ============================================================
    function configurarFormularioMemorando() {
        const form = document.getElementById('memorandoForm');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const empleadoId = document.getElementById('memorandoEmpleado').value;
            const tipo = document.getElementById('memorandoTipo').value;
            const asunto = document.getElementById('memorandoAsunto').value.trim();
            const contenido = document.getElementById('memorandoContenido').value.trim();
            const mensajeDiv = document.getElementById('memorandoMensaje');

            if (!empleadoId) {
                mensajeDiv.innerHTML = `<div class="alert alert-warning">⚠️ Debes seleccionar un empleado.</div>`;
                return;
            }
            if (!tipo) {
                mensajeDiv.innerHTML = `<div class="alert alert-warning">⚠️ Debes seleccionar un tipo de memorando.</div>`;
                return;
            }
            if (!asunto) {
                mensajeDiv.innerHTML = `<div class="alert alert-warning">⚠️ El asunto es obligatorio.</div>`;
                return;
            }
            if (!contenido || contenido.length < 10) {
                mensajeDiv.innerHTML = `<div class="alert alert-warning">⚠️ El contenido debe tener al menos 10 caracteres.</div>`;
                return;
            }

            const btn = document.getElementById('memorandoBtnGenerar');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Generando...';

            try {
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
                    mensajeDiv.innerHTML = `
                        <div class="alert alert-success d-flex align-items-center gap-2">
                            <i class="bi bi-check-circle-fill fs-5"></i>
                            <div>
                                <strong>${data.mensaje}</strong><br>
                                <small>Consecutivo: ${data.consecutivo}</small>
                                ${data.archivo_pdf ? `<br><a href="${data.archivo_pdf}" target="_blank" class="text-success"><i class="bi bi-file-pdf"></i> Ver PDF</a>` : ''}
                            </div>
                        </div>
                    `;
                    form.reset();
                    await cargarMemorandosHistorial();
                } else {
                    mensajeDiv.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle-fill me-1"></i>
                            Error: ${data.error || 'No se pudo generar el memorando'}
                            ${data.detalles ? `<br><small>${JSON.stringify(data.detalles)}</small>` : ''}
                        </div>
                    `;
                }
            } catch (err) {
                console.error('Error al crear memorando:', err);
                mensajeDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle-fill me-1"></i>
                        Error de conexión. Inténtalo de nuevo.
                    </div>
                `;
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-file-pdf me-1"></i> Generar memorando';
            }
        });
    }

    // ============================================================
    // FUNCIÓN PÚBLICA PARA CARGAR EL MÓDULO
    // ============================================================
    window.cargarMemorandos = async function() {
        console.log('📋 Cargando módulo de Memorandos...');
        await cargarEmpleados();
        await cargarMemorandosHistorial();
        configurarFormularioMemorando();
    };

    // ============================================================
    // INICIALIZAR
    // ============================================================
    async function initMemorandos() {
        // Esperar a que el DOM esté listo
        await new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });

        const container = document.getElementById('memorandosTablaBody');
        if (!container) return;

        // Si la pestaña está activa, cargar, si no, esperar
        if (document.getElementById('tabMemorandos')?.classList.contains('active')) {
            await window.cargarMemorandos();
        }
    }

    // Iniciar
    initMemorandos();

    console.log('✅ memorandos.js cargado correctamente');
})();