// ============================================================
// CERTIFICADOS.JS - MÓDULO DE CERTIFICADOS
// Panel de administración de novedades - OperPan
// ============================================================

(function () {
    let certificadoSeleccionadoId = null;

    // ============================================================
    // FUNCIÓN PARA MOSTRAR DETALLE DE CERTIFICADO
    // ============================================================
    function mostrarCertificadoDetalle(c, esHistorial) {
        const data = {
            ...c,
            empleado: c.empleado || c.empleado_nombre || 'Empleado no disponible',
            estado: c.estado || 'pendiente',
            archivo: c.archivo || c.archivo_url || null,
            tipo: c.tipo || '—',
            proposito: c.proposito || 'Sin información adicional.',
            dirigido_a: c.dirigido_a || null,
            periodo: c.periodo || null,
            fecha_solicitud: c.fecha_solicitud || null,
            fecha_emision: c.fecha_emision || null,
            motivo_rechazo: c.motivo_rechazo || null,
            url_descarga: c.url_descarga || `/novedades/certificados/${c.id}/descargar/`,
            id: c.id
        };
        
        renderCertificadoDetalle(data);
        
        const aprobarBtn = document.getElementById('certificadosAprobarBtn');
        const rechazarBtn = document.getElementById('certificadosRechazarBtn');
        const descargarBtn = document.getElementById('certificadosDescargarBtn');
        
        const estadoNormalizado = (data.estado || '').toLowerCase().trim();
        const esPendiente = estadoNormalizado === 'pendiente';
        const esAprobado = estadoNormalizado === 'aprobado';
        
        console.log('📌 Estado certificado:', data.estado, 'esAprobado:', esAprobado);
        
        // ============================================================
        // BOTÓN DE DESCARGA - SOLO SI ESTÁ APROBADO
        // ============================================================
        if (esAprobado && descargarBtn) {
            descargarBtn.style.display = 'inline-flex';
            descargarBtn.dataset.url = data.url_descarga;
            console.log('✅ Botón Descargar habilitado con URL:', data.url_descarga);
        } else if (descargarBtn) {
            descargarBtn.style.display = 'none';
            console.log('❌ Botón Descargar ocultado');
        }
        
        // ============================================================
        // BOTONES DE APROBAR/RECHAZAR - SOLO SI ESTÁ PENDIENTE Y NO ES HISTORIAL
        // ============================================================
        if (!esHistorial && esPendiente) {
            if (aprobarBtn) {
                aprobarBtn.style.display = 'inline-flex';
                aprobarBtn.dataset.id = data.id;
            }
            if (rechazarBtn) {
                rechazarBtn.style.display = 'inline-flex';
                rechazarBtn.dataset.id = data.id;
            }
        } else {
            if (aprobarBtn) aprobarBtn.style.display = 'none';
            if (rechazarBtn) rechazarBtn.style.display = 'none';
        }
        
        // FOOTER SIEMPRE VISIBLE
        const accionesFooter = document.getElementById('certificadosAccionesFooter');
        if (accionesFooter) {
            accionesFooter.style.display = 'flex';
        }
        
        const modal = new bootstrap.Modal(document.getElementById('certificadosDetalleModal'));
        modal.show();
    }

    // ============================================================
    // VER DETALLE DESDE BANDEJA (CON BOTONES APROBAR/RECHAZAR)
    // ============================================================
    window.verDetalleCertificado = async function(id) {
        certificadoSeleccionadoId = id;
        console.log('📌 Ver certificado ID:', id);
        try {
            let resp = await fetch(`/novedades/certificados/${id}/`);
            if (!resp.ok) {
                resp = await fetch(`/novedades/certificados/${id}/detalle/`);
                if (!resp.ok) throw new Error('Error al obtener detalle');
            }
            const c = await resp.json();
            console.log('📌 Datos del certificado:', c);
            mostrarCertificadoDetalle(c, false);
        } catch (err) {
            console.error('Error:', err);
            showMessage('❌ Error al cargar detalle del certificado');
        }
    };

    // ============================================================
    // VER DETALLE DESDE HISTORIAL (SOLO LECTURA - SIN BOTONES)
    // ============================================================
    window.verDetalleHistorialCertificado = async function(id) {
        certificadoSeleccionadoId = id;
        console.log('📌 Ver historial certificado ID:', id);
        try {
            let resp = await fetch(`/novedades/certificados/${id}/`);
            if (!resp.ok) {
                resp = await fetch(`/novedades/certificados/${id}/detalle/`);
                if (!resp.ok) throw new Error('Error al obtener detalle');
            }
            const c = await resp.json();
            mostrarCertificadoDetalle(c, true);
        } catch (err) {
            console.error('Error:', err);
            showMessage('❌ Error al cargar detalle del certificado');
        }
    };

    // ============================================================
    // ACTUALIZAR KPIS
    // ============================================================
    window.actualizarKPICertificados = function() {
        fetch('/novedades/certificados/')
            .then(r => r.json())
            .then(data => {
                const ahora = new Date();
                const mesActual = ahora.getMonth();
                const añoActual = ahora.getFullYear();
                const pendientes = Array.isArray(data) ? data.filter(c => (c.estado || '').toLowerCase() === 'pendiente').length : 0;
                const aprobados = Array.isArray(data) ? data.filter(c => {
                    const estado = (c.estado || '').toLowerCase();
                    const fecha = c.fecha_emision ? new Date(c.fecha_emision) : (c.fecha_solicitud ? new Date(c.fecha_solicitud) : new Date());
                    return estado === 'aprobado' && fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
                }).length : 0;
                const rechazados = Array.isArray(data) ? data.filter(c => {
                    const estado = (c.estado || '').toLowerCase();
                    const fecha = c.fecha_emision ? new Date(c.fecha_emision) : (c.fecha_solicitud ? new Date(c.fecha_solicitud) : new Date());
                    return estado === 'rechazado' && fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
                }).length : 0;

                const kpiPendientes = document.getElementById('certificadosKpiPendientes');
                const kpiAprobadas = document.getElementById('certificadosKpiAprobadas');
                const kpiRechazadas = document.getElementById('certificadosKpiRechazadas');
                if (kpiPendientes) kpiPendientes.innerText = pendientes;
                if (kpiAprobadas) kpiAprobadas.innerText = aprobados;
                if (kpiRechazadas) kpiRechazadas.innerText = rechazados;
                console.log('📊 KPIs Certificados:', {pendientes, aprobados, rechazados});
            })
            .catch(error => console.error('Error al obtener KPIs:', error));
    };

    // ============================================================
    // CARGAR CERTIFICADOS PENDIENTES
    // ============================================================
    window.cargarCertificadosPendientes = function() {
        const container = document.getElementById('certificadosSolicitudesContainer');
        if (!container) {
            console.warn('⚠️ Contenedor certificadosSolicitudesContainer no encontrado');
            return;
        }

        fetch('/novedades/certificados/pendientes/')
            .then(r => r.json())
            .then(data => {
                const pendientes = Array.isArray(data) ? data : [];
                console.log('📋 Certificados pendientes:', pendientes.length);

                if (pendientes.length === 0) {
                    container.innerHTML = `
                        <div class="text-center text-muted py-4">
                            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                            No hay certificados pendientes.
                        </div>
                    `;
                    return;
                }

                container.innerHTML = `
                    <div class="solicitudes-grid">
                        ${pendientes.map(c => `
                            <div class="solicitud-card">
                                <div class="solicitud-header">
                                    <div class="solicitud-titulo">
                                        <i class="bi bi-flag-fill"></i>
                                        <span>${c.tipo || 'Certificado'}</span>
                                    </div>
                                </div>
                                <div class="solicitud-empleado">
                                    <i class="bi bi-person me-1"></i>
                                    <strong>${c.empleado || 'Empleado no disponible'}</strong>
                                </div>
                                <div class="solicitud-dato">
                                    <i class="bi bi-calendar3 me-1"></i>
                                    Solicitado: ${c.fecha_solicitud ? new Date(c.fecha_solicitud).toLocaleString('es-CO') : '—'}
                                </div>
                                <div class="solicitud-descripcion">
                                    ${c.proposito || 'Sin propósito especificado.'}
                                </div>
                                <div class="solicitud-footer mt-3">
                                    <button type="button" class="solicitud-btn-detalle" onclick="window.verDetalleCertificado(${c.id})">
                                        <i class="bi bi-eye me-1"></i> Ver detalles
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            })
            .catch(error => {
                console.error('Error cargando pendientes:', error);
                container.innerHTML = `
                    <div class="text-center text-danger py-4">
                        <i class="bi bi-exclamation-circle fs-1 d-block mb-2"></i>
                        Error al cargar certificados pendientes.
                    </div>
                `;
            });
    };

    // ============================================================
    // RENDERIZAR HISTORIAL
    // ============================================================
    window.renderCertificados = function() {
        const tipoFiltro = (document.getElementById('certificadosFiltroTipo')?.value || '').toLowerCase().trim();
        const estadoFiltro = (document.getElementById('certificadosFiltroEstado')?.value || '').toLowerCase().trim();
        const busqueda = (document.getElementById('buscarCertificado')?.value || '').toLowerCase().trim();

        console.log('📋 Filtros Certificados:', {tipoFiltro, estadoFiltro, busqueda});

        fetch('/novedades/certificados/')
            .then(response => {
                if (!response.ok) throw new Error('Error al consultar certificados');
                return response.json();
            })
            .then(data => {
                let certificados = Array.isArray(data) ? data : [];

                if (busqueda) {
                    certificados = certificados.filter(certificado => {
                        const textoBusqueda = [
                            certificado.empleado,
                            certificado.documento,
                            certificado.usuario,
                            certificado.nombre,
                            certificado.cargo,
                            certificado.tipo
                        ].filter(valor => valor !== null && valor !== undefined).join(' ').toLowerCase();
                        return textoBusqueda.includes(busqueda);
                    });
                }

                if (tipoFiltro) {
                    certificados = certificados.filter(certificado => (certificado.tipo || '').toLowerCase().trim() === tipoFiltro);
                }

                if (estadoFiltro) {
                    certificados = certificados.filter(certificado => (certificado.estado || '').toLowerCase().trim() === estadoFiltro);
                }

                const tbody = document.getElementById('certificadosTablaBody');
                const sinResultados = document.getElementById('certificadosSinResultados');

                if (!tbody) {
                    console.warn('⚠️ Contenedor certificadosTablaBody no encontrado');
                    return;
                }

                if (certificados.length === 0) {
                    tbody.innerHTML = '';
                    if (sinResultados) sinResultados.classList.remove('d-none');
                    return;
                }

                if (sinResultados) sinResultados.classList.add('d-none');

                tbody.innerHTML = certificados.map(certificado => {
                    const empleado = certificado.empleado || '—';
                    const cargo = certificado.cargo || '—';
                    const tipo = certificado.tipo || '—';
                    const estadoVal = (certificado.estado || 'Pendiente').toString().trim().toLowerCase();

                    let badgeEstado = '<span class="badge badge-pendiente">Pendiente</span>';
                    if (estadoVal === 'aprobado' || estadoVal === 'aprobada') {
                        badgeEstado = `<span class="badge badge-active">Aprobado</span>`;
                    } else if (estadoVal === 'rechazado' || estadoVal === 'rechazada') {
                        badgeEstado = `<span class="badge badge-rechazado">Rechazado</span>`;
                    }

                    const fechaMostrar = (estadoVal === 'aprobado' || estadoVal === 'aprobada')
                        ? (certificado.fecha_emision || certificado.fecha_decision)
                        : certificado.fecha_solicitud;

                    const fechaFormateada = fechaMostrar
                        ? new Date(fechaMostrar).toLocaleString('es-CO')
                        : '—';

                    return `
                    <tr>
                        <td data-label="Empleado"><strong>${empleado}</strong></td>
                        <td data-label="Cargo">${cargo}</td>
                        <td data-label="Tipo de certificado">${tipo}</td>
                        <td data-label="Fecha">${fechaFormateada}</td>
                        <td data-label="Estado">${badgeEstado}</td>
                        <td data-label="Acciones">
                            <button class="btn btn-sm btn-primary-corporate" onclick="window.verDetalleHistorialCertificado(${certificado.id})" title="Ver detalles">
                                <i class="bi bi-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
                }).join('');
            })
            .catch(error => {
                console.error('Error al cargar certificados:', error);
                const tbody = document.getElementById('certificadosTablaBody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar certificados</td></tr>';
                }
            });
    };

    // ============================================================
    // EVENTO DE DESCARGA (DELEGADO)
    // ============================================================
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('#certificadosDescargarBtn');
        if (btn && btn.style.display !== 'none') {
            const url = btn.dataset.url;
            console.log('🔘 Click en Descargar - URL:', url);
            if (url) {
                window.open(url, '_blank');
            } else {
                showMessage('❌ No se encontró la URL de descarga.');
            }
        }
    });

    // ============================================================
    // EVENTOS DE MODALES
    // ============================================================

    // Aprobar - abre confirmación
    document.getElementById('certificadosAprobarBtn')?.addEventListener('click', function() {
        console.log('🔘 Click en Aprobar Certificado');
        const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('certificadosDetalleModal'));
        if (modalDetalle) modalDetalle.hide();
        new bootstrap.Modal(document.getElementById('certificadosConfirmApproveModal')).show();
    });

    // Confirmar Aprobación
    document.getElementById('certificadosConfirmApprove')?.addEventListener('click', async function() {
        console.log('🔘 Click en Confirmar Aprobar');
        if (!certificadoSeleccionadoId) {
            showMessage('❌ No hay certificado seleccionado.');
            return;
        }
        try {
            const resp = await fetch(`/novedades/certificados/${certificadoSeleccionadoId}/aprobar/`, {
                method: 'POST',
                headers: { 
                    'X-CSRFToken': getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });
            const data = await resp.json();

            const modal = bootstrap.Modal.getInstance(document.getElementById('certificadosConfirmApproveModal'));
            if (modal) modal.hide();

            if (resp.ok && data.status === 'ok') {
                showMessage('✅ Certificado aprobado correctamente.');
                window.cargarCertificadosPendientes();
                window.renderCertificados();
                window.actualizarKPICertificados();
            } else {
                showMessage('❌ Error: ' + (data.error || 'No se pudo aprobar el certificado'));
            }
        } catch (err) {
            console.error('Error aprobando certificado:', err);
            showMessage('❌ Error de red al aprobar certificado');
        }
    });

    // ============================================================
    // RECHAZAR - ABRE DIRECTAMENTE EL MODAL DE MOTIVO
    // ============================================================
    document.getElementById('certificadosRechazarBtn')?.addEventListener('click', function() {
        console.log('🔘 Click en Rechazar Certificado');
        const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('certificadosDetalleModal'));
        if (modalDetalle) modalDetalle.hide();
        new bootstrap.Modal(document.getElementById('certificadosRejectModal')).show();
    });

    // Confirmar Rechazo
    document.getElementById('certificadosConfirmReject')?.addEventListener('click', async function() {
        console.log('🔘 Click en Confirmar Rechazar');
        if (!certificadoSeleccionadoId) {
            showMessage('❌ No hay certificado seleccionado.');
            return;
        }
        const motivo = document.getElementById('certificadosRejectReason').value.trim();
        if (!motivo) {
            showMessage('❌ Debes indicar un motivo de rechazo.');
            return;
        }

        try {
            const resp = await fetch(`/novedades/certificados/${certificadoSeleccionadoId}/rechazar/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ motivo: motivo })
            });
            const data = await resp.json();

            const modal = bootstrap.Modal.getInstance(document.getElementById('certificadosRejectModal'));
            if (modal) modal.hide();
            document.getElementById('certificadosRejectReason').value = '';

            if (resp.ok && data.status === 'ok') {
                showMessage('✅ Certificado rechazado.');
                window.cargarCertificadosPendientes();
                window.renderCertificados();
                window.actualizarKPICertificados();
            } else {
                showMessage('❌ Error: ' + (data.error || 'No se pudo rechazar el certificado'));
            }
        } catch (err) {
            console.error('Error rechazando certificado:', err);
            showMessage('❌ Error de red al rechazar certificado');
        }
    });

    // ============================================================
    // FILTROS
    // ============================================================
    document.getElementById('buscarCertificado')?.addEventListener('input', debounce(window.renderCertificados, 300));
    document.getElementById('certificadosFiltroTipo')?.addEventListener('change', window.renderCertificados);
    document.getElementById('certificadosFiltroEstado')?.addEventListener('change', window.renderCertificados);

    document.getElementById('certificadosBtnLimpiar')?.addEventListener('click', () => {
        const buscar = document.getElementById('buscarCertificado');
        const tipo = document.getElementById('certificadosFiltroTipo');
        const estado = document.getElementById('certificadosFiltroEstado');
        if (buscar) buscar.value = '';
        if (tipo) tipo.value = '';
        if (estado) estado.value = '';
        window.renderCertificados();
    });

    // ============================================================
    // FUNCIÓN PÚBLICA PARA CARGAR EL MÓDULO
    // ============================================================
    window.cargarCertificados = function() {
        console.log('📋 Cargando módulo de Certificados...');
        window.actualizarKPICertificados();
        window.cargarCertificadosPendientes();
        window.renderCertificados();
    };

    // Cargar automáticamente si la pestaña está activa
    if (document.getElementById('tabCertificados')?.classList.contains('active')) {
        window.cargarCertificados();
    }

    console.log('✅ certificados.js cargado correctamente');
})();