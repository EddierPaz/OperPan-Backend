// ==============================
// MÓDULO MIS MEMORANDOS (EMPLEADO)
// Panel de empleado - OperPan
// ==============================

(function () {

    let memorandosData = [];
    let detalleModal = null;

    // ============================================================
    // MOSTRAR MENSAJE
    // ============================================================

    function mostrarMensaje(mensaje, tipo = 'info') {
        const container = document.getElementById('misMemorandosContainer');
        if (!container) return;
        const alertClass = tipo === 'error' ? 'alert-danger' : 'alert-info';
        container.innerHTML = `
            <div class="alert ${alertClass} text-center py-4">
                <i class="bi ${tipo === 'error'
                    ? 'bi-exclamation-triangle-fill'
                    : 'bi-info-circle-fill'} fs-3 d-block mb-2"></i>
                ${mensaje}
            </div>
        `;
    }

    // ============================================================
    // FORMATEAR FECHA
    // ============================================================

    function formatearFecha(isoString) {
        if (!isoString) return '—';
        try {
            return new Date(isoString).toLocaleString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return isoString;
        }
    }

    // ============================================================
    // ESCAPAR HTML
    // ============================================================

    function escapar(texto) {
        if (texto === null || texto === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(texto);
        return div.innerHTML;
    }

    // ============================================================
    // CARGAR MEMORANDOS
    // ============================================================

    async function cargarMisMemorandos() {
        try {
            const resp = await fetch('/memorandos/mis/');
            if (!resp.ok) {
                throw new Error('Error al cargar los memorandos');
            }
            const data = await resp.json();
            memorandosData = data || [];

            const sinMemorandos = document.getElementById('sinMemorandos');
            const tablaContainer = document.getElementById('misMemorandosTabla');
            const tbody = document.getElementById('misMemorandosBody');

            if (!memorandosData.length) {
                if (sinMemorandos) sinMemorandos.style.display = 'block';
                if (tablaContainer) tablaContainer.style.display = 'none';
                return;
            }

            if (sinMemorandos) sinMemorandos.style.display = 'none';
            if (tablaContainer) tablaContainer.style.display = 'block';

            tbody.innerHTML = memorandosData.map(m => {

                const origenBadge = m.es_automatico
                    ? `<span class="badge bg-info-subtle text-info-emphasis">
                           <i class="bi bi-robot me-1"></i>Sistema
                       </span>`
                    : `<span class="badge bg-secondary-subtle text-secondary-emphasis">
                           <i class="bi bi-person me-1"></i>Manual
                       </span>`;

                return `<tr>
                    <td data-label="Consecutivo">
                        <strong>${escapar(m.consecutivo)}</strong>
                        <div class="mt-1">${origenBadge}</div>
                    </td>
                    <td data-label="Tipo">${escapar(m.tipo)}</td>
                    <td data-label="Asunto">${escapar(m.asunto)}</td>
                    <td data-label="Fecha emisión">${formatearFecha(m.fecha_emision)}</td>
                    <td data-label="Acciones">
                        <button type="button"
                                class="btn-action btn-action-view ver-memo-btn"
                                data-id="${m.id}"
                                title="Ver detalle">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                    </td>
                </tr>`;
            }).join('');

            document.querySelectorAll('.ver-memo-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = parseInt(this.dataset.id, 10);
                    abrirDetalle(id);
                });
            });

        } catch (err) {
            console.error('Error al cargar mis memorandos:', err);
            mostrarMensaje(
                'Error al cargar tus memorandos. Por favor, recarga la página.',
                'error'
            );
        }
    }

    // ============================================================
    // ABRIR MODAL DE DETALLE
    // ============================================================

    function abrirDetalle(id) {
        const memo = memorandosData.find(m => m.id === id);
        if (!memo) return;

        document.getElementById('miMemoSubtitulo').textContent = memo.asunto || '—';
        document.getElementById('miMemoConsecutivo').textContent = memo.consecutivo || '—';
        document.getElementById('miMemoTipo').textContent = memo.tipo || '—';
        document.getElementById('miMemoFecha').textContent = formatearFecha(memo.fecha_emision);
        document.getElementById('miMemoAsunto').textContent = memo.asunto || '—';

        const origenEl = document.getElementById('miMemoOrigen');
        origenEl.innerHTML = memo.es_automatico
            ? `<span class="badge bg-info-subtle text-info-emphasis">
                   <i class="bi bi-robot me-1"></i>Generado automáticamente por el sistema
               </span>`
            : `<span class="badge bg-secondary-subtle text-secondary-emphasis">
                   <i class="bi bi-person me-1"></i>Emitido por administración
               </span>`;

        document.getElementById('miMemoContenido').textContent = memo.contenido || '—';

        const btnDescarga = document.getElementById('miMemoDescargarBtn');
        if (memo.archivo_pdf) {
            btnDescarga.href = `/memorandos/${memo.id}/descargar/`;
            btnDescarga.style.display = 'inline-flex';
        } else {
            btnDescarga.style.display = 'none';
        }

        if (!detalleModal) {
            detalleModal = new bootstrap.Modal(
                document.getElementById('miMemorandoDetalleModal')
            );
        }
        detalleModal.show();
    }

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================

    document.addEventListener('DOMContentLoaded', cargarMisMemorandos);

})();