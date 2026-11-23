document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // REFERENCIAS AL DOM
    // ============================================================
    const tipoSelect = document.getElementById('tipoSolicitud'); 
    const innerTipoSelect = document.getElementById('solicitudTipo'); 
    const formSolicitud = document.getElementById('formSolicitud');
    const formIncapacidad = document.getElementById('formIncapacidad');
    const formCertificado = document.getElementById('formCertificado');
    const novedadesContainer = document.getElementById('novedadesContainer');
    const modalCrearEl = document.getElementById('modalsolicitudes');
    let configuracionInicialFormulario = true;

    const notificarNovedad = (mensaje, tipo = 'danger') => {
        if (typeof window.mostrarNotificacion === 'function') {
            const htmlSeguro = String(mensaje).replace(/[&<>"']/g, caracter => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[caracter]);
            window.mostrarNotificacion(htmlSeguro, tipo);
        } else {
            console.error(mensaje);
        }
    };

    // ============================================================
    // CONFIGURACIÃ“N DE FECHAS BASE
    // ============================================================
    const formatearFechaISO = (fecha) => {
        const y = fecha.getFullYear();
        const m = String(fecha.getMonth() + 1).padStart(2, '0');
        const d = String(fecha.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyStr = formatearFechaISO(hoy);

    const minSolicitud = new Date(hoy);
    minSolicitud.setDate(minSolicitud.getDate() + 3); // 3 días de anticipación
    const minSolicitudStr = formatearFechaISO(minSolicitud);

    // ============================================================
    // LÃ“GICA DEL MODAL CREAR: Mostrar/Ocultar y Habilitar/Deshabilitar
    // ============================================================
    const mostrarFormularioSegunTipo = () => {
        if (!tipoSelect) return;
        const mainTipo = tipoSelect.value;
        const conservarValores = configuracionInicialFormulario &&
            modalCrearEl && modalCrearEl.dataset.reabrir === 'true';
        configuracionInicialFormulario = false;

        // Esta función es clave: oculta el div, deshabilita los inputs y quita el required
        const toggleForm = (form, isVisible) => {
            if (!form) return;
form.style.display = isVisible? 'block' : 'none';
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.disabled = !isVisible;
                if (!isVisible) input.required = false; // Evita el error "not focusable"
            });
        };

        toggleForm(formSolicitud, false);
        toggleForm(formIncapacidad, false);
        toggleForm(formCertificado, false);

        if (!mainTipo) return;

        if (mainTipo === 'incapacidad') {
            toggleForm(formIncapacidad, true);
            const incapInicio = document.getElementById('incapacidadFechaInicio');
            const incapFin = document.getElementById('incapacidadFechaFin');
            if (incapInicio) { incapInicio.min = hoyStr; incapInicio.required = true; }
            if (incapFin) { incapFin.min = hoyStr; incapFin.required = true; }
            return;
        }
        
        if (mainTipo === 'certificado') {
            toggleForm(formCertificado, true);
            actualizarCamposCertificado();
            return;
        }

        toggleForm(formSolicitud, true);

        const grupoTipoSolicitud = document.getElementById('grupoTipoSolicitud');
        if (innerTipoSelect) {
            if (mainTipo === 'cambio_turno') {
                innerTipoSelect.value = 'cambio_turno';
                if (grupoTipoSolicitud) grupoTipoSolicitud.style.display = 'none';
            } else if (mainTipo === 'vacaciones') {
                innerTipoSelect.value = 'vacaciones';
                if (grupoTipoSolicitud) grupoTipoSolicitud.style.display = 'none';
            } else {
                if (grupoTipoSolicitud) grupoTipoSolicitud.style.display = 'block';
            }
        }

        let tipoEfectivo = mainTipo;
        if (mainTipo === 'solicitud' && innerTipoSelect) {
            tipoEfectivo = innerTipoSelect.value;
        }

        const grupoFechaInicio = document.getElementById('grupoFechaInicio');
        const grupoFechaFin = document.getElementById('grupoFechaFin');
        const grupoNuevoHorario = document.getElementById('grupoNuevoHorario');
        const grupoJustificacion = document.getElementById('grupoJustificacion');
        const grupoAdjunto = document.getElementById('grupoAdjunto');
        
        const labelFechaInicio = document.getElementById('labelFechaInicio');
        const labelJustificacion = document.getElementById('labelJustificacion');
        const labelAdjunto = document.getElementById('labelAdjunto');
        const hintAdjunto = document.getElementById('hintAdjunto');
        const inputFechaInicio = document.getElementById('solicitudFechaInicio');
        const inputFechaFin = document.getElementById('solicitudFechaFin');
        const inputNuevoHorario = document.getElementById('nuevoHorario'); 
        const inputJustificacion = document.getElementById('solicitudMotivo');
        const inputAdjunto = document.getElementById('solicitudAdjunto');

        // RESET
        if (grupoFechaInicio) grupoFechaInicio.style.display = 'block';
        if (grupoFechaFin) grupoFechaFin.style.display = 'block';
        if (grupoJustificacion) grupoJustificacion.style.display = 'none';
        if (grupoAdjunto) grupoAdjunto.style.display = 'none';
        if (grupoNuevoHorario) grupoNuevoHorario.style.display = 'none';
        
        if (inputJustificacion) {
            inputJustificacion.required = false;
            if (!conservarValores) inputJustificacion.value = '';
        }
        if (inputAdjunto) { inputAdjunto.required = false; inputAdjunto.value = ''; }
        if (inputNuevoHorario) {
            inputNuevoHorario.required = false;
            if (!conservarValores) inputNuevoHorario.value = '';
            inputNuevoHorario.disabled = true;
        }
        if (inputFechaFin) inputFechaFin.required = false;

        if (tipoEfectivo === 'luto' || tipoEfectivo === 'calamidad') {
            if (inputFechaInicio) inputFechaInicio.min = hoyStr;
        } else {
            if (inputFechaInicio) inputFechaInicio.min = minSolicitudStr;
        }

        if (tipoEfectivo === 'cambio_turno') {
            if (labelFechaInicio) labelFechaInicio.innerHTML = 'Fecha del cambio <span class="text-danger">*</span>';
            if (grupoFechaFin) grupoFechaFin.style.display = 'none'; 
            if (grupoNuevoHorario) grupoNuevoHorario.style.display = 'block'; 
            if (grupoJustificacion) grupoJustificacion.style.display = 'block';
            if (labelJustificacion) labelJustificacion.innerHTML = 'Motivo del cambio <span class="text-danger">*</span>';
            
            if (inputJustificacion) inputJustificacion.required = true;
            if (inputNuevoHorario) { inputNuevoHorario.required = true; inputNuevoHorario.disabled = false; }
            
            if (inputFechaInicio && inputFechaFin) inputFechaFin.value = inputFechaInicio.value;

        } else if (tipoEfectivo === 'vacaciones') {
            if (labelFechaInicio) labelFechaInicio.innerHTML = 'Fecha de inicio de vacaciones <span class="text-danger">*</span>';
            if (grupoFechaFin) grupoFechaFin.style.display = 'block';
            if (inputFechaFin) inputFechaFin.required = true;

        } else if (['luto', 'citas_medicas', 'maternidad_paternidad'].includes(tipoEfectivo)) {
            if (labelFechaInicio) labelFechaInicio.innerHTML = 'Fecha inicio <span class="text-danger">*</span>';
            if (grupoFechaFin) grupoFechaFin.style.display = 'block';
            if (grupoAdjunto) grupoAdjunto.style.display = 'block';
            if (labelAdjunto) labelAdjunto.innerHTML = '<strong class="text-danger">(Obligatorio)</strong>';
            if (inputAdjunto) inputAdjunto.required = true;
            
            if (hintAdjunto) {
                if (tipoEfectivo === 'luto') hintAdjunto.innerHTML = '<strong>Sugerencia: Adjunta el registro civil de defunción.</strong>';
                else if (tipoEfectivo === 'citas_medicas') hintAdjunto.innerHTML = '<strong>Sugerencia: Adjunta el certificado médico.</strong>';
                else hintAdjunto.innerHTML = '<strong>Sugerencia: Adjunta el registro civil de nacimiento.</strong>';
            }
            if (inputFechaFin) inputFechaFin.required = true;

        } else {
            if (labelFechaInicio) labelFechaInicio.innerHTML = 'Fecha inicio <span class="text-danger">*</span>';
            if (grupoFechaFin) grupoFechaFin.style.display = 'block';
            if (grupoJustificacion) grupoJustificacion.style.display = 'block';
            if (labelJustificacion) labelJustificacion.innerHTML = 'Justificación <span class="text-danger">*</span>';
            if (inputJustificacion) inputJustificacion.required = true;
            if (grupoAdjunto) grupoAdjunto.style.display = 'block';
            if (labelAdjunto) labelAdjunto.textContent = '(opcional)';
            if (hintAdjunto) hintAdjunto.textContent = 'Formato PDF, JPG, PNG (máx 5MB).';
            if (inputFechaFin) inputFechaFin.required = true;
        }
    };

    if (tipoSelect) tipoSelect.addEventListener('change', mostrarFormularioSegunTipo);
    if (innerTipoSelect) innerTipoSelect.addEventListener('change', mostrarFormularioSegunTipo);
    mostrarFormularioSegunTipo();

    // ============================================================
    // CÁLCULO DE DÍAS DE INCAPACIDAD
    // ============================================================
    const incapInicio = document.getElementById('incapacidadFechaInicio');
    const incapFin = document.getElementById('incapacidadFechaFin');
    const incapDias = document.getElementById('incapacidadDias');

    const actualizarDiasIncapacidad = () => {
        if (!incapInicio.value || !incapFin.value) {
            if (incapDias) incapDias.value = '';
            return;
        }
        const inicio = new Date(`${incapInicio.value}T00:00:00`);
        const fin = new Date(`${incapFin.value}T00:00:00`);
        if (fin < inicio) {
            incapDias.value = 'Fecha inválida';
        } else {
            const diff = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
            incapDias.value = diff + ' día(s)';
        }
    };

    if (incapInicio) incapInicio.addEventListener('change', () => {
        if (incapFin) incapFin.min = incapInicio.value || hoyStr;
        actualizarDiasIncapacidad();
    });
    if (incapFin) incapFin.addEventListener('change', actualizarDiasIncapacidad);

    // ============================================================
    // RESTRICCIONES DINÁMICAS DE FECHA (Solicitudes)
    // ============================================================
    const solicitudInicio = document.getElementById('solicitudFechaInicio');
    const solicitudFin = document.getElementById('solicitudFechaFin');

    if (solicitudInicio) {
        solicitudInicio.addEventListener('change', () => {
            if (solicitudFin) solicitudFin.min = solicitudInicio.value || hoyStr;

            // Cambio de turno = un solo día: fecha_fin siempre igual a fecha_inicio
const tipoAct = tipoSelect.value === 'solicitud'? innerTipoSelect.value : tipoSelect.value;
            if (tipoAct === 'cambio_turno' && solicitudFin) solicitudFin.value = solicitudInicio.value;
        });
    }

    // ============================================================
    // CAMPOS DE CERTIFICADO
    // ============================================================
    const certTipo = document.getElementById('certificadoTipo');
    const periodoGroup = document.getElementById('certificadoPeriodoGroup');

    const actualizarCamposCertificado = () => {
        if (!certTipo) return;
        if (periodoGroup) {
periodoGroup.style.display = certTipo.value === 'ingresos'? 'block' : 'none';
        }
    };

    if (certTipo) {
        certTipo.addEventListener('change', actualizarCamposCertificado);
        actualizarCamposCertificado();
    }

    // ============================================================
    // FILTROS DEL HISTORIAL
    // ============================================================
    let tipoActual = 'solicitud';
    let estadoActual = 'todas';

    const filtrarHistorial = () => {
        if (!novedadesContainer) return;
        const tarjetas = Array.from(novedadesContainer.querySelectorAll('.request-card'));
        let visibles = 0;

        tarjetas.forEach(card => {
            const matchTipo = card.dataset.tipo === tipoActual;
            const matchEstado = estadoActual === 'todas' || card.dataset.estado === estadoActual;
card.style.display = (matchTipo && matchEstado)? '' : 'none';
            if (matchTipo && matchEstado) visibles++;
        });

        let msg = document.getElementById('mensajeSinResultados');
        if (visibles === 0) {
            if (!msg) {
                msg = document.createElement('div');
                msg.id = 'mensajeSinResultados';
                msg.className = 'empty-history';
                novedadesContainer.appendChild(msg);
            }
            const t = { 'solicitud': 'solicitudes', 'incapacidad': 'incapacidades', 'certificado': 'certificados' }[tipoActual] || 'novedades';
const e = estadoActual !== 'todas'? ` ${estadoActual}s` : '';
            msg.innerHTML = `<div class="empty-history-icon"><i class="bi bi-search"></i></div><h5>Sin resultados</h5><p>No tienes ${t}${e} en el historial.</p>`;
        } else if (msg) {
            msg.remove();
        }
    };

    const tipoFiltroTabs = document.querySelectorAll('#tipoFiltroTabs .novedades-tab');
    tipoFiltroTabs.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tipoFiltroTabs.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            tipoActual = e.currentTarget.dataset.tipo;
            filtrarHistorial();
        });
    });

    const estadoFiltroTabs = document.querySelectorAll('#estadoFiltroTabs .novedades-tab');
    estadoFiltroTabs.forEach(btn => {
        btn.addEventListener('click', (e) => {
            estadoFiltroTabs.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            estadoActual = e.currentTarget.dataset.estado;
            filtrarHistorial();
        });
    });

    document.querySelectorAll('.btn-view-pending').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTipo = e.currentTarget.dataset.tipo;
            const scrollTo = e.currentTarget.dataset.scrollTo;
            tipoFiltroTabs.forEach(tab => {
                if (tab.dataset.tipo === targetTipo) tab.click();
            });
            if (scrollTo) {
                const element = document.getElementById(scrollTo);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ============================================================
    // LIMPIEZA DEL FORMULARIO (RESET)
    // ============================================================
    const solicitudForm = document.getElementById('solicitudForm');
    if (solicitudForm) {
        solicitudForm.addEventListener('reset', () => {
            setTimeout(() => {
                const errorElements = solicitudForm.querySelectorAll('.errorlist');
                errorElements.forEach(el => el.remove());
                mostrarFormularioSegunTipo();
                actualizarCamposCertificado();
                if (incapDias) incapDias.value = '';
                const fileInputs = solicitudForm.querySelectorAll('input[type="file"]');
                fileInputs.forEach(input => input.value = '');
            }, 50);
        });
    }

    // ============================================================
    // MODAL: VER DETALLE
    // ============================================================
    const modalDetalleEl = document.getElementById('modalDetalleSolicitud');
const modalDetalle = modalDetalleEl? new bootstrap.Modal(modalDetalleEl) : null;

    function getTipoIcon(tipo) {
        const icons = {
            'solicitud': 'bi-calendar-event-fill',
            'incapacidad': 'bi-heart-pulse-fill',
            'certificado': 'bi-award-fill',
            'cambio_turno': 'bi-arrow-repeat',
            'vacaciones': 'bi-umbrella-fill'
        };
        return icons[tipo] || 'bi-file-earmark-text-fill';
    }

    function getEstadoBadge(estado) {
        const badges = {
            'pendiente': 'novedad-estado-pendiente',
            'aprobado': 'novedad-estado-aprobado',
            'rechazado': 'novedad-estado-rechazado'
        };
        return badges[estado] || 'novedad-estado-pendiente';
    }

    function getEstadoLabel(estado) {
        const labels = { 'pendiente': 'Pendiente', 'aprobado': 'Aprobado', 'rechazado': 'Rechazado' };
        return labels[estado] || estado;
    }

    document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const d = e.currentTarget.dataset;
            const tipo = d.tipo || 'solicitud';
            const estado = d.estadoSlug || 'pendiente';
            
            document.getElementById('detalleIcono').className = `bi ${getTipoIcon(tipo)}`;
            document.getElementById('detalleTitulo').textContent = d.titulo || 'Detalle de novedad';
            document.getElementById('detalleSubtitulo').textContent = d.subtitulo || 'Información completa';
            
            const badge = document.getElementById('detalleEstadoBadge');
            badge.textContent = getEstadoLabel(estado);
            badge.className = `novedad-detalle-estado ${getEstadoBadge(estado)}`;
            
            document.getElementById('detalleTipo').textContent = d.titulo || 'â€”';
            
            const fechasContainer = document.getElementById('detalleFechasContainer');
            const fechasEl = document.getElementById('detalleFechas');
            if (d.subtitulo && d.subtitulo.includes('â†’')) {
                const fechas = d.subtitulo.split('·')[1] || d.subtitulo;
                fechasEl.textContent = fechas.trim();
                fechasContainer.style.display = 'block';
            } else {
                fechasContainer.style.display = 'none';
            }
            
            document.getElementById('detalleMotivo').textContent = d.motivo || 'Sin información adicional.';
            
            const rechazoContainer = document.getElementById('detalleRechazoContainer');
            const motivoRechazoEl = document.getElementById('detalleMotivoRechazo');
            if (estado === 'rechazado' && d.motivoRechazo && d.motivoRechazo !== '') {
                motivoRechazoEl.textContent = d.motivoRechazo;
                rechazoContainer.style.display = 'block';
            } else {
                rechazoContainer.style.display = 'none';
            }
            
            const archivoContainer = document.getElementById('detalleArchivoContainer');
            const archivoLink = document.getElementById('detalleArchivoLink');
            if (d.archivo && d.archivo !== '') {
                archivoLink.href = d.archivo;
                archivoContainer.style.display = 'block';
            } else {
                archivoContainer.style.display = 'none';
            }
            
            const editarBtn = document.getElementById('detalleEditarBtn');
            const eliminarBtn = document.getElementById('detalleEliminarBtn');
            const descargarBtn = document.getElementById('detalleDescargarBtn');
            
            editarBtn.style.display = 'none';
            eliminarBtn.style.display = 'none';
            descargarBtn.style.display = 'none';
            
            if (estado === 'pendiente') {
                const pendingItem = btn.closest('.pending-item');
                if (pendingItem) {
                    const editarOriginal = pendingItem.querySelector('.btn-editar-solicitud');
                    const eliminarOriginal = pendingItem.querySelector('.btn-eliminar-solicitud');
                    
                    if (editarOriginal) {
                        editarBtn.style.display = 'inline-flex';
                        editarBtn.onclick = function(e) {
                            e.stopPropagation();
                            modalDetalle.hide();
                            setTimeout(() => editarOriginal.click(), 300);
                        };
                    }
                    if (eliminarOriginal) {
                        eliminarBtn.style.display = 'inline-flex';
                        eliminarBtn.onclick = function(e) {
                            e.stopPropagation();
                            modalDetalle.hide();
                            setTimeout(() => eliminarOriginal.click(), 300);
                        };
                    }
                }
            }
            
            if (estado === 'aprobado' && tipo === 'certificado') {
                descargarBtn.style.display = 'inline-flex';
                const card = btn.closest('.request-card') || btn.closest('.request-card-grid');
                if (card) {
                    const link = card.querySelector('a[href*="certificado"]');
                    if (link) descargarBtn.onclick = function() { window.open(link.href, '_blank'); };
                    else if (d.archivo) descargarBtn.onclick = function() { window.open(d.archivo, '_blank'); };
                } else if (d.archivo) {
                    descargarBtn.onclick = function() { window.open(d.archivo, '_blank'); };
                }
            }
            
            if (modalDetalle) modalDetalle.show();
        });
    });

    // ============================================================
    // MODAL: CONFIRMAR ELIMINACIÃ“N
    // ============================================================
    const modalEliminarEl = document.getElementById('modalConfirmarEliminar');
const modalEliminar = modalEliminarEl? new bootstrap.Modal(modalEliminarEl) : null;
    const btnConfirmarEliminacion = document.getElementById('btnConfirmarEliminacion');
    let urlParaEliminar = '';

    document.addEventListener('click', (e) => {
        const btnEliminar = e.target.closest('.btn-eliminar-solicitud');
        if (btnEliminar) {
            e.preventDefault();
            urlParaEliminar = btnEliminar.dataset.url;
            if (urlParaEliminar && modalEliminar) modalEliminar.show();
        }
    });

    if (btnConfirmarEliminacion) {
        btnConfirmarEliminacion.addEventListener('click', async () => {
            if (!urlParaEliminar) return;
            try {
                btnConfirmarEliminacion.disabled = true;
                btnConfirmarEliminacion.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Eliminando...';

                let csrftoken = '';
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.startsWith('csrftoken=')) { csrftoken = cookie.substring('csrftoken='.length); break; }
                }

                const response = await fetch(urlParaEliminar, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrftoken, 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();

                if (response.ok && data.status === 'ok') {
                    if (modalEliminar) modalEliminar.hide();
                    window.location.reload();
                } else {
                    if (window.mostrarNotificacion) window.mostrarNotificacion(data.error || 'Ocurrió un error al intentar eliminar.', 'danger');
                    if (modalEliminar) modalEliminar.hide();
                    btnConfirmarEliminacion.disabled = false;
                    btnConfirmarEliminacion.innerHTML = '<i class="bi bi-trash3"></i> Sí, eliminar';
                }
            } catch (error) {
                if (window.mostrarNotificacion) window.mostrarNotificacion('Error de red al intentar conectar con el servidor.', 'danger');
                if (modalEliminar) modalEliminar.hide();
                btnConfirmarEliminacion.disabled = false;
                btnConfirmarEliminacion.innerHTML = '<i class="bi bi-trash3"></i> Sí, eliminar';
            }
        });

        if (modalEliminarEl) {
            modalEliminarEl.addEventListener('hidden.bs.modal', () => {
                btnConfirmarEliminacion.disabled = false;
                btnConfirmarEliminacion.innerHTML = '<i class="bi bi-trash3"></i> Sí, eliminar';
                urlParaEliminar = '';
            });
        }
    }

    // ============================================================
    // MODAL: EDITAR NOVEDAD (AJAX)
    // ============================================================
    const modalEditarEl = document.getElementById('modalEditarSolicitud');
const modalEditar = modalEditarEl? new bootstrap.Modal(modalEditarEl) : null;
    const formEditar = document.getElementById('formEditarSolicitud');
    const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');
const grupoFechasEdit = document.getElementById('editarGrupoFechas');
const grupoFechaFinEdit = document.getElementById('editarGrupoFechaFin');
const grupoCertificadoEdit = document.getElementById('editarGrupoCertificado');
const grupoTurnoEdit = document.getElementById('editarGrupoTurno');
const grupoMotivoEdit = document.getElementById('editarGrupoMotivo');
const editarFechaInicio = document.getElementById('editarFechaInicio');
const editarFechaFin = document.getElementById('editarFechaFin');
const editarMotivo = document.getElementById('editarMotivo');
const editarNuevoHorario = document.getElementById('editarNuevoHorario');
const editarCertificadoTipo = document.getElementById('editarCertificadoTipo');
const editarCertificadoProposito = document.getElementById('editarCertificadoProposito');
const editarCertificadoDirigido = document.getElementById('editarCertificadoDirigido');
const editarCertificadoPeriodo = document.getElementById('editarCertificadoPeriodo');
const grupoArchivoEdit = document.getElementById('editarGrupoArchivo');
    let urlParaEditar = '';
let categoriaEditando = '';
let esCambioTurnoEditando = false;

    document.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('.btn-editar-solicitud');
        if (btnEditar) {
            e.preventDefault();
            urlParaEditar = btnEditar.dataset.url;
        const tipoVal = btnEditar.dataset.tipo || 'solicitud';
        const categoria = btnEditar.dataset.categoria || tipoVal;
        categoriaEditando = categoria;
        const inicioVal = btnEditar.dataset.inicio || '';
        const esCambioTurno = categoria === 'solicitud' && tipoVal === 'cambio_turno';
        esCambioTurnoEditando = esCambioTurno;
        const tieneFechas = categoria === 'solicitud' || categoria === 'incapacidad';
        const requiereMotivo = categoria === 'solicitud' &&
            !['cambio_turno', 'vacaciones', 'luto', 'citas_medicas', 'maternidad_paternidad'].includes(tipoVal);
            const archivoUrl = btnEditar.dataset.archivo || '';

            const idInput = document.getElementById('editarId');
            if (idInput) idInput.value = btnEditar.dataset.id || '';

            const tipoDisplay = document.getElementById('editarTipoDisplay');
            if (tipoDisplay) {
            const tipos = {
                'cambio_turno': 'Cambio de turno',
                'incapacidad': 'Incapacidad médica',
                'certificado': 'Certificado'
            };
            tipoDisplay.value = btnEditar.dataset.tipoDisplay || tipos[tipoVal] || tipoVal;
            tipoDisplay.closest('.modal-detalle-item').style.display = categoria === 'certificado' ? 'none' : '';
            }

        if (grupoFechasEdit) grupoFechasEdit.style.display = tieneFechas ? 'grid' : 'none';
        if (grupoFechaFinEdit) grupoFechaFinEdit.style.display = esCambioTurno ? 'none' : '';
        if (grupoCertificadoEdit) grupoCertificadoEdit.style.display = categoria === 'certificado' ? 'grid' : 'none';
        if (grupoTurnoEdit) grupoTurnoEdit.style.display = esCambioTurno ? 'grid' : 'none';
        if (grupoMotivoEdit) grupoMotivoEdit.style.display = requiereMotivo || esCambioTurno ? 'block' : 'none';
        const etiquetaMotivo = grupoMotivoEdit ? grupoMotivoEdit.querySelector('label') : null;
        if (etiquetaMotivo) {
            etiquetaMotivo.innerHTML = esCambioTurno
                ? 'Motivo del cambio <span class="text-danger">*</span>'
                : 'Justificación <span class="text-danger">*</span>';
        }
        if (grupoArchivoEdit) grupoArchivoEdit.style.display = '';

        if (editarFechaInicio) {
            editarFechaInicio.value = inicioVal;
            editarFechaInicio.required = tieneFechas;
            if (categoria === 'incapacidad') editarFechaInicio.min = hoyStr;
            else if (categoria === 'solicitud') editarFechaInicio.min = minSolicitudStr;
            else editarFechaInicio.removeAttribute('min');
        }
        if (editarFechaFin) {
            editarFechaFin.value = esCambioTurno ? inicioVal : (btnEditar.dataset.fin || '');
            editarFechaFin.required = categoria === 'incapacidad' || (categoria === 'solicitud' && !esCambioTurno);
            if (categoria === 'incapacidad') editarFechaFin.min = hoyStr;
            else if (categoria === 'solicitud') editarFechaFin.min = inicioVal || minSolicitudStr;
            else editarFechaFin.removeAttribute('min');
        }

        if (editarMotivo) {
            editarMotivo.value = btnEditar.dataset.motivo || '';
            editarMotivo.required = requiereMotivo || esCambioTurno;
        }
        if (editarNuevoHorario) {
            const turno = (btnEditar.dataset.nuevoHorario || '').toUpperCase();
            editarNuevoHorario.value = turno.includes('TARDE')
                ? 'TARDE'
                : (turno.includes('MANANA') ? 'MANANA' : '');
            editarNuevoHorario.required = esCambioTurno;
        }
        if (editarCertificadoTipo) editarCertificadoTipo.value = btnEditar.dataset.certificadoTipo || 'laboral';
        if (editarCertificadoProposito) {
            editarCertificadoProposito.value = btnEditar.dataset.proposito || '';
            editarCertificadoProposito.required = categoria === 'certificado';
        }
        if (editarCertificadoDirigido) editarCertificadoDirigido.value = btnEditar.dataset.dirigidoA || '';
        if (editarCertificadoPeriodo) editarCertificadoPeriodo.value = btnEditar.dataset.periodo || '';

            const contenedorArchivo = document.getElementById('contenedorArchivoActual');
            const linkArchivo = document.getElementById('verArchivoActual');
            if (contenedorArchivo && linkArchivo) {
                if (archivoUrl && archivoUrl !== '') {
                    linkArchivo.href = archivoUrl;
                    contenedorArchivo.style.display = 'block';
                } else {
                    contenedorArchivo.style.display = 'none';
                    linkArchivo.href = '#';
                }
            }

            const inputArchivo = document.getElementById('editarArchivo');
            if (inputArchivo) inputArchivo.value = '';
            if (modalEditar) modalEditar.show();
        }
    });

    if (editarFechaInicio) {
        editarFechaInicio.addEventListener('change', () => {
            if (esCambioTurnoEditando && editarFechaFin) {
                editarFechaFin.value = editarFechaInicio.value;
            } else if (editarFechaFin) {
                editarFechaFin.min = editarFechaInicio.value || minSolicitudStr;
            }
        });
    }

    if (formEditar) {
        formEditar.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!urlParaEditar) return;

            try {
                if (btnGuardarEdicion) {
                    btnGuardarEdicion.disabled = true;
                    btnGuardarEdicion.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Guardando...';
                }

                let csrftoken = '';
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.startsWith('csrftoken=')) { csrftoken = cookie.substring('csrftoken='.length); break; }
                }

                const formData = new FormData();
                const tipoCategoria = categoriaEditando;
                const fechaInicio = editarFechaInicio ? editarFechaInicio.value : '';
                const fechaFin = editarFechaFin ? editarFechaFin.value : '';

                if (editarFechaInicio && editarFechaInicio.min && fechaInicio && fechaInicio < editarFechaInicio.min) {
                    if (btnGuardarEdicion) {
                        btnGuardarEdicion.disabled = false;
                        btnGuardarEdicion.innerHTML = '<i class="bi bi-check-lg"></i> Guardar cambios';
                    }
                    if (window.mostrarNotificacion) window.mostrarNotificacion('La fecha de inicio no es válida.', 'warning');
                    return;
                }

                if (tipoCategoria !== 'certificado') {
                    formData.append('fecha_inicio', fechaInicio);
                    formData.append('fecha_fin', fechaFin);
                }

                if (tipoCategoria === 'solicitud') {
                    if (editarMotivo) formData.append('justificacion', editarMotivo.value);
                    if (editarNuevoHorario && editarNuevoHorario.required) {
                        formData.append('nuevo_horario', editarNuevoHorario.value);
                    }
                } else if (tipoCategoria === 'certificado') {
                    if (editarCertificadoTipo) formData.append('tipo', editarCertificadoTipo.value);
                    if (editarCertificadoProposito) formData.append('proposito', editarCertificadoProposito.value);
                    if (editarCertificadoDirigido) formData.append('dirigido_a', editarCertificadoDirigido.value);
                    if (editarCertificadoPeriodo) formData.append('periodo', editarCertificadoPeriodo.value);
                }
                
                const archivoInput = document.getElementById('editarArchivo');
                if (archivoInput && archivoInput.files && archivoInput.files.length > 0) {
                    formData.append('archivo', archivoInput.files[0]);
                }

                const response = await fetch(urlParaEditar, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrftoken, 'X-Requested-With': 'XMLHttpRequest' },
                    body: formData
                });

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('El servidor no devolvió JSON.');
                }

                const data = await response.json();
                if (btnGuardarEdicion) {
                    btnGuardarEdicion.disabled = false;
                    btnGuardarEdicion.innerHTML = '<i class="bi bi-check-lg"></i> Guardar cambios';
                }

                if (response.ok && data.status === 'ok') {
                    if (modalEditar) modalEditar.hide();
                    window.location.reload();
                } else {
                    if (window.mostrarNotificacion) window.mostrarNotificacion(data.error || 'Ocurrió un error al actualizar.', 'danger');
                }
            } catch (error) {
                console.error(error);
                if (btnGuardarEdicion) {
                    btnGuardarEdicion.disabled = false;
                    btnGuardarEdicion.innerHTML = '<i class="bi bi-check-lg"></i> Guardar cambios';
                }
                if (window.mostrarNotificacion) window.mostrarNotificacion('Error de red al conectar con el servidor.', 'danger');
            }
        });

        if (modalEditarEl) {
            modalEditarEl.addEventListener('hidden.bs.modal', () => {
                if (btnGuardarEdicion) {
                    btnGuardarEdicion.disabled = false;
                    btnGuardarEdicion.innerHTML = '<i class="bi bi-check-lg"></i> Guardar cambios';
                }
                urlParaEditar = '';
                categoriaEditando = '';
                esCambioTurnoEditando = false;
            });
        }
    }

    filtrarHistorial();

    // ============================================================
    // VALIDACIÓN Y ENVÍO DEL FORMULARIO
    // ============================================================
    if (solicitudForm) {
        solicitudForm.noValidate = true;
        solicitudForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const mainTipo = tipoSelect.value;
            let tipoEfectivo = mainTipo;
            const erroresLocales = [];

            if (mainTipo === 'solicitud' && innerTipoSelect) {
                tipoEfectivo = innerTipoSelect.value;
            }

            if (!tipoEfectivo) {
                erroresLocales.push('Selecciona el tipo de novedad.');
            }

            if (tipoEfectivo === 'cambio_turno') {
                // Asegura fecha_fin = fecha_inicio justo antes de enviar
                const ini = document.getElementById('solicitudFechaInicio');
                const fin = document.getElementById('solicitudFechaFin');
                if (ini && fin) fin.value = ini.value;

                const nuevoHorario = document.getElementById('nuevoHorario');
                if (!nuevoHorario || !nuevoHorario.value) {
                    erroresLocales.push('Selecciona el nuevo turno.');
                }
            }

            if (tipoEfectivo === 'incapacidad') {
                const fechaInicio = document.getElementById('incapacidadFechaInicio');
                const fechaFin = document.getElementById('incapacidadFechaFin');
                const archivo = document.getElementById('incapacidadAdjunto');

                if (!fechaInicio.value) erroresLocales.push('La fecha de inicio es obligatoria.');
                if (!fechaFin.value) erroresLocales.push('La fecha de fin es obligatoria.');
                if (!archivo.files || archivo.files.length === 0) {
                    erroresLocales.push('Debes adjuntar el soporte médico.');
                }
            }

            if (erroresLocales.length) {
                notificarNovedad(erroresLocales[0], 'warning');
                return;
            }

            const btnEnviar = solicitudForm.querySelector('button[type="submit"]');
            const textoOriginal = btnEnviar ? btnEnviar.innerHTML : '';
            if (btnEnviar) {
                btnEnviar.disabled = true;
                btnEnviar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Enviando...';
            }

            try {
                const response = await fetch(solicitudForm.action, {
                    method: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    body: new FormData(solicitudForm),
                });
                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    throw new Error('El servidor no devolvió una respuesta válida.');
                }

                const data = await response.json();
                if (response.ok && data.status === 'ok') {
                    window.location.reload();
                    return;
                }

                const error = data.errores && data.errores.length
                    ? data.errores[0]
                    : (data.error || 'No se pudo enviar la novedad.');
                notificarNovedad(`No se pudo enviar la novedad: ${error}`, 'danger');
            } catch (error) {
                console.error(error);
                notificarNovedad('No se pudo conectar con el servidor. Tus datos siguen en el formulario; inténtalo de nuevo.', 'danger');
            } finally {
                if (btnEnviar) {
                    btnEnviar.disabled = false;
                    btnEnviar.innerHTML = textoOriginal;
                }
            }
        });
    }

    if (modalCrearEl) {
        modalCrearEl.addEventListener('hide.bs.modal', () => {
            if (document.activeElement) document.activeElement.blur();
        });
    }

    if (modalCrearEl && modalCrearEl.dataset.reabrir === 'true') {
        new bootstrap.Modal(modalCrearEl).show();
    }

    console.log('âœ… OperPan - novedades.js cargado correctamente');
});

