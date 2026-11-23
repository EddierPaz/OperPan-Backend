// ============================================================
// MODULO.JS - FÁBRICA DE MÓDULOS DE NOVEDADES
// Panel de administración de novedades - OperPan
// ============================================================

(function () {
    const $ = (id) => document.getElementById(id);

    // ------------------------------------------------------------
    // Piezas del modal de detalle (usan las clases globales .modal-detalle-*)
    // ------------------------------------------------------------
    function renderCampo(c) {
        // { estado }
        if ('estado' in c) {
            return `
                <div class="modal-detalle-item">
                    <span class="modal-detalle-label">Estado</span>
                    <span class="modal-detalle-value">${badgeEstado(c.estado)}</span>
                </div>`;
        }

        // { bloque: 'Justificación', valor, vacio }
        if ('bloque' in c) {
            return `
                <div class="modal-detalle-bloque-largo">
                    <span class="modal-detalle-bloque-largo-label">${esc(c.bloque)}</span>
                    <p class="modal-detalle-bloque-largo-texto">${esc(c.valor || c.vacio || 'Sin información adicional.')}</p>
                </div>`;
        }

        // { archivo: url }
        if ('archivo' in c) {
            if (!c.archivo) return '';
            return `
                <div class="modal-detalle-bloque-largo">
                    <span class="modal-detalle-bloque-largo-label">Archivo adjunto</span>
                    <p class="modal-detalle-bloque-largo-texto">
                        <a href="${esc(c.archivo)}" target="_blank" rel="noopener" class="btn-action btn-action-print">
                            <i class="bi bi-paperclip me-1"></i> Ver archivo
                        </a>
                    </p>
                </div>`;
        }

        // { rechazo: motivo }
        if ('rechazo' in c) {
            if (!c.rechazo) return '';
            return `
                <div class="modal-detalle-rechazo">
                    <strong>Motivo del rechazo</strong><br>
                    ${esc(c.rechazo)}
                </div>`;
        }

        // { label, valor, icono, full, opcional }
        if (c.opcional && !c.valor) return '';
        const clase = c.full  'modal-detalle-item modal-detalle-item-full' : 'modal-detalle-item';
        const icono = c.icono  `<i class="bi ${c.icono} me-1"></i>` : '';
        return `
            <div class="${clase}">
                <span class="modal-detalle-label">${esc(c.label)}</span>
                <span class="modal-detalle-value">${icono}${esc(c.valor || '—')}</span>
            </div>`;
    }

    // ------------------------------------------------------------
    // Helpers de modales Bootstrap
    // ------------------------------------------------------------
    const instancia = (elemento) => (elemento  bootstrap.Modal.getOrCreateInstance(elemento) : null);

    function mostrarModal(elemento) {
        instancia(elemento).show();
    }

    /** Cierra un modal y abre otro cuando el primero terminó de cerrarse. */
    function pasarA(desde, hacia) {
        if (desde && desde.classList.contains('show')) {
            desde.addEventListener('hidden.bs.modal', () => mostrarModal(hacia), { once: true });
            instancia(desde).hide();
        } else {
            mostrarModal(hacia);
        }
    }

    function mostrar(nodo, visible, display = 'inline-flex') {
        if (nodo) nodo.style.display = visible  display : 'none';
    }

    // ------------------------------------------------------------
    // FÁBRICA
    // ------------------------------------------------------------
    function crearModuloNovedad(cfg) {
        const p = cfg.prefijo;                         // prefijo de los IDs de modales
        const el = (sufijo) => $(p + sufijo);          // ej. el('DetalleModal') -> #solicitudesDetalleModal
        const URL = {
            detalle: (id) => `${cfg.urls.base}${id}/`,
            accion: (id, accion) => `${cfg.urls.base}${id}/${accion}/`,
        };

        let seleccionadoId = null;
        let datos = [];                                // lista completa (KPIs + historial)

        // ---------------- KPIs ----------------
        function setTexto(id, valor) {
            const nodo = $(id);
            if (nodo) nodo.innerText = valor;
        }

        function actualizarKPIs() {
            const ahora = new Date();
            const esDelMes = (item) => {
                const f = new Date(cfg.fechaKpi  cfg.fechaKpi(item) : item.fecha_solicitud);
                return !isNaN(f) && f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
            };
            const contar = (estado, soloMes) => datos.filter(
                (i) => normalizarEstado(i.estado) === estado && (!soloMes || esDelMes(i))
            ).length;

            setTexto(cfg.ids.kpiPendientes, contar('pendiente', false));
            setTexto(cfg.ids.kpiAprobados, contar('aprobado', true));
            setTexto(cfg.ids.kpiRechazados, contar('rechazado', true));
        }

        // ---------------- Bandeja de pendientes ----------------
        function tarjetaHTML(i) {
            const t = cfg.tarjeta;
            const descripcion = t.descripcion
                 `<div class="solicitud-descripcion">${esc(t.descripcion(i))}</div>`
                : '';
            return `
                <div class="solicitud-card">
                    <div class="solicitud-header">
                        <div class="solicitud-titulo">
                            <i class="bi ${t.icono}"></i>
                            <span>${esc(t.titulo(i))}</span>
                        </div>
                    </div>
                    <div class="solicitud-empleado">
                        <i class="bi bi-person me-1"></i>
                        <strong>${esc(i.empleado || 'Empleado no disponible')}</strong>
                    </div>
                    <div class="solicitud-dato">
                        <i class="bi ${t.iconoDato} me-1"></i>${esc(t.dato(i))}
                    </div>
                    ${descripcion}
                    <div class="solicitud-footer mt-3">
                        <button type="button" class="btn-action btn-action-view" data-accion="ver" data-id="${i.id}">
                            <i class="bi bi-eye me-1"></i> Ver detalles
                        </button>
                    </div>
                </div>`;
        }

        function mensajeBandeja(icono, texto, claseTexto = 'text-muted') {
            return `
                <div class="solicitudes-vacio text-center ${claseTexto} py-3">
                    <i class="bi ${icono} fs-2 mb-2 d-block"></i>
                    ${esc(texto)}
                </div>`;
        }

        async function cargarPendientes() {
            const contenedor = $(cfg.ids.pendientes);
            if (!contenedor) return;
            try {
                const data = await api(cfg.urls.pendientes);
                const lista = Array.isArray(data)  data : [];
                contenedor.innerHTML = lista.length
                     `<div class="solicitudes-grid">${lista.map(tarjetaHTML).join('')}</div>`
                    : mensajeBandeja(cfg.textos.iconoVacio, cfg.textos.vacio);
            } catch (err) {
                console.error(`[${cfg.nombre}] pendientes:`, err);
                contenedor.innerHTML = mensajeBandeja('bi-exclamation-triangle', cfg.textos.errorCarga, 'text-danger');
            }
        }

        // ---------------- Historial ----------------
        function filaHTML(i) {
            const celdas = cfg.columnas.map((c) => {
                let valor;
                if (c.tipo === 'estado') valor = badgeEstado(i.estado);
                else if (c.tipo === 'fuerte') valor = `<strong>${esc(c.valor(i) || '—')}</strong>`;
                else valor = esc(c.valor(i) || '—');
                return `<td data-label="${esc(c.label)}">${valor}</td>`;
            });
            celdas.push(`
                <td data-label="Acciones">
                    <button type="button" class="btn-action btn-action-view" data-accion="ver" data-origen="historial" data-id="${i.id}" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>`);
            return `<tr>${celdas.join('')}</tr>`;
        }

        const campoBusqueda = () => cfg.ids.buscar.map($).find(Boolean);

        function filtrar() {
            const estado = $(cfg.ids.filtroEstado).value || '';
            const texto = (campoBusqueda().value || '').trim().toLowerCase();
            const extra = cfg.ids.filtroExtra;
            const valorExtra = extra  ($(extra.id).value || '').trim().toLowerCase() : '';

            return datos.filter((i) => {
                if (estado && estado !== 'todas' && normalizarEstado(i.estado) !== normalizarEstado(estado)) return false;
                if (valorExtra && String(i[extra.campo] || '').trim().toLowerCase() !== valorExtra) return false;
                if (texto && !cfg.busqueda(i).toLowerCase().includes(texto)) return false;
                return true;
            });
        }

        function renderHistorial() {
            const tbody = $(cfg.ids.tbody);
            if (!tbody) return;
            const sinResultados = $(cfg.ids.sinResultados);
            const lista = filtrar();

            if (!lista.length) {
                tbody.innerHTML = '';
                sinResultados.classList.remove('d-none');
                return;
            }
            sinResultados.classList.add('d-none');
            tbody.innerHTML = lista.map(filaHTML).join('');
        }

        async function cargarLista() {
            try {
                const data = await api(cfg.urls.lista);
                datos = Array.isArray(data)  data : [];
            } catch (err) {
                console.error(`[${cfg.nombre}] historial:`, err);
                datos = [];
                const tbody = $(cfg.ids.tbody);
                if (tbody) {
                    tbody.innerHTML = `<tr><td colspan="${cfg.columnas.length + 1}" class="text-center text-danger">${esc(cfg.textos.errorCarga)}</td></tr>`;
                }
                actualizarKPIs();
                return;
            }
            actualizarKPIs();
            renderHistorial();
        }

        async function cargar() {
            await Promise.all([cargarPendientes(), cargarLista()]);
        }

        // ---------------- Detalle ----------------
        function renderDetalle(d) {
            const cuerpo = el('ModalBody');
            if (!cuerpo) return;
            cuerpo.innerHTML = `<div class="modal-detalle-grid">${cfg.campos(d).map(renderCampo).join('')}</div>`;
        }

        function configurarBotones(d, soloLectura) {
            const puedeDecidir = d.estado === 'pendiente' && !soloLectura;
            mostrar(el('AprobarBtn'), puedeDecidir);
            mostrar(el('RechazarBtn'), puedeDecidir);

            let puedeDescargar = false;
            if (cfg.urlDescarga) {
                puedeDescargar = d.estado === 'aprobado';
                const btn = el('DescargarBtn');
                if (btn) btn.dataset.url = puedeDescargar  cfg.urlDescarga(d) : '';
                mostrar(btn, puedeDescargar);
            }

            mostrar(el('AccionesFooter'), puedeDecidir || puedeDescargar, 'flex');
        }

        async function abrirDetalle(id, soloLectura) {
            seleccionadoId = id;
            try {
                const crudo = await api(URL.detalle(id));
                const d = {
                    ...crudo,
                    empleado: crudo.empleado || 'Empleado no disponible',
                    estado: normalizarEstado(crudo.estado),
                };
                renderDetalle(d);
                configurarBotones(d, soloLectura);
                mostrarModal(el('DetalleModal'));
            } catch (err) {
                console.error(`[${cfg.nombre}] detalle:`, err);
                showMessage(cfg.textos.errorDetalle, 'error');
            }
        }

        // ---------------- Aprobar / rechazar ----------------
        async function decidir(accion, cuerpo) {
            if (!seleccionadoId) {
                showMessage('No hay ningún registro seleccionado.', 'warning');
                return;
            }
            try {
                await api(URL.accion(seleccionadoId, accion), { method: 'POST', body: cuerpo });
                if (accion === 'aprobar') showMessage(cfg.textos.aprobado, 'success');
                else showMessage(cfg.textos.rechazado, 'info');
                await cargar();
            } catch (err) {
                showMessage(`Error: ${err.message}`, 'error');
            }
        }

        // ---------------- Eventos ----------------
        function init() {
            // Botones "Ver detalles" (delegado: sirve para filas nuevas sin volver a enlazar)
            [$(cfg.ids.pendientes), $(cfg.ids.tbody)].forEach((zona) => {
                zona.addEventListener('click', (e) => {
                    const boton = e.target.closest('[data-accion="ver"]');
                    if (boton) abrirDetalle(boton.dataset.id, boton.dataset.origen === 'historial');
                });
            });

            // Aprobar: detalle -> confirmación -> POST
            el('AprobarBtn').addEventListener('click', () => pasarA(el('DetalleModal'), el('ConfirmApproveModal')));
            el('ConfirmApprove').addEventListener('click', () => {
                instancia(el('ConfirmApproveModal')).hide();
                decidir('aprobar');
            });

            // Rechazar: detalle -> motivo -> POST
            el('RechazarBtn').addEventListener('click', () => pasarA(el('DetalleModal'), el('RejectModal')));
            el('ConfirmReject').addEventListener('click', () => {
                const campo = el('RejectReason');
                const motivo = (campo.value || '').trim();
                if (!motivo) {
                    showMessage('Debes ingresar un motivo de rechazo.', 'warning');
                    return;
                }
                instancia(el('RejectModal')).hide();
                if (campo) campo.value = '';
                decidir('rechazar', { motivo });
            });

            // Descarga (solo certificados)
            el('DescargarBtn').addEventListener('click', (e) => {
                const url = e.currentTarget.dataset.url;
                if (url) window.open(url, '_blank');
                else showMessage('No se encontró la URL de descarga.', 'error');
            });

            // Filtros (se aplican sobre la lista ya cargada, sin nuevos fetch)
            $(cfg.ids.filtroEstado).addEventListener('change', renderHistorial);
            if (cfg.ids.filtroExtra) $(cfg.ids.filtroExtra.id).addEventListener('change', renderHistorial);
            cfg.ids.buscar.forEach((id) => $(id).addEventListener('input', debounce(renderHistorial, 300)));
            $(cfg.ids.btnLimpiar).addEventListener('click', () => {
                cfg.ids.buscar.forEach((id) => { const n = $(id); if (n) n.value = ''; });
                const sel = $(cfg.ids.filtroEstado);
                if (sel) sel.value = '';
                if (cfg.ids.filtroExtra) {
                    const extra = $(cfg.ids.filtroExtra.id);
                    if (extra) extra.value = '';
                }
                renderHistorial();
            });
        }

        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
        else init();

        // main.js llama a esta función cuando se activa la pestaña
        window.novedadesModulos[cfg.nombre] = cargar;
        return { cargar };
    }

    window.crearModuloNovedad = crearModuloNovedad;
})();