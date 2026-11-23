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

        document.querySelectorAll('.text-danger.small').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });

        // Esta función es clave: oculta el div, deshabilita los inputs y quita el required
        const toggleForm = (form, isVisible) => {
            if (!form) return;
            form.style.display = isVisible  'block' : 'none';
            const inputs = form.querySelectorAll('input, select, texfuncion');
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
        
        if (inputJustificacion) { inputJustificacion.required = false; inputJustificacion.value = ''; }
        if (inputAdjunto) { inputAdjunto.required = false; inputAdjunto.value = ''; }
        if (inputNuevoHorario) { inputNuevoHorario.required = false; inputNuevoHorario.value = ''; inputNuevoHorario.disabled = true; }
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
            const tipoAct = tipoSelect.value === 'solicitud'  innerTipoSelect.value : tipoSelect.value;
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
            periodoGroup.style.display = certTipo.value === 'ingresos'  'block' : 'none';
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
            card.style.display = (matchTipo && matchEstado)  '' : 'none';
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
            const e = estadoActual !== 'todas'  ` ${estadoActual}s` : '';
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
                const errorElements = solicitudForm.querySelectorAll('.alert-danger, .text-danger, .errorlist');
                errorElements.forEach(el => el.remove());
                const toastContainer = document.getElementById('toastContainer');
                if (toastContainer) toastContainer.innerHTML = '';
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
    const modalDetalle = modalDetalleEl  new bootstrap.Modal(modalDetalleEl) : null;

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
    const modalEliminar = modalEliminarEl  new bootstrap.Modal(modalEliminarEl) : null;
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
                    alert(data.error || 'Ocurrió un error al intentar eliminar.');
                    if (modalEliminar) modalEliminar.hide();
                    btnConfirmarEliminacion.disabled = false;
                    btnConfirmarEliminacion.innerHTML = '<i class="bi bi-trash3"></i> Sí, eliminar';
                }
            } catch (error) {
                alert('Error de red al intentar conectar con el servidor.');
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
    const modalEditar = modalEditarEl  new bootstrap.Modal(modalEditarEl) : null;
    const formEditar = document.getElementById('formEditarSolicitud');
    const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');
    let urlParaEditar = '';

    document.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('.btn-editar-solicitud');
        if (btnEditar) {
            e.preventDefault();
            urlParaEditar = btnEditar.dataset.url;
            const idVal = btnEditar.dataset.id || '';
            const tipoVal = btnEditar.dataset.tipo || 'solicitud';
            const inicioVal = btnEditar.dataset.inicio || '';
            const finVal = btnEditar.dataset.fin || '';
            const archivoUrl = btnEditar.dataset.archivo || '';

            const idInput = document.getElementById('editarId');
            if (idInput) idInput.value = idVal;

            const tipoDisplay = document.getElementById('editarTipoDisplay');
            if (tipoDisplay) {
                const tipos = { 'solicitud': 'Solicitud', 'cambio_turno': 'Cambio de Turno', 'vacaciones': 'Vacaciones', 'incapacidad': 'Incapacidad', 'certificado': 'Certificado' };
                tipoDisplay.value = tipos[tipoVal] || tipoVal;
            }

            const inputInicio = document.getElementById('editarFechaInicio');
            const inputFin = document.getElementById('editarFechaFin');

            if (['solicitud', 'cambio_turno', 'vacaciones'].includes(tipoVal)) {
                if (inputInicio) inputInicio.min = minSolicitudStr;
                if (inputFin) inputFin.min = minSolicitudStr;
            } else if (tipoVal === 'incapacidad') {
                if (inputInicio) inputInicio.min = hoyStr;
                if (inputFin) inputFin.min = hoyStr;
            } else {
                if (inputInicio) inputInicio.removeAttribute('min');
                if (inputFin) inputFin.removeAttribute('min');
            }

            if (inputInicio) inputInicio.value = inicioVal;
            if (inputFin) inputFin.value = finVal;

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
                const inputInicioEdit = document.getElementById('editarFechaInicio');
                const fechaInicio = inputInicioEdit.value || '';
                const fechaFin = document.getElementById('editarFechaFin').value || '';

                if (inputInicioEdit.min && fechaInicio && fechaInicio < inputInicioEdit.min) {
                    if (btnGuardarEdicion) {
                        btnGuardarEdicion.disabled = false;
                        btnGuardarEdicion.innerHTML = '<i class="bi bi-check-lg"></i> Guardar cambios';
                    }
                    alert('La fecha de inicio no es válida.');
                    return;
                }

                formData.append('fecha_inicio', fechaInicio);
                formData.append('fecha_fin', fechaFin);
                
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
                    alert(data.error || 'Ocurrió un error al actualizar.');
                }
            } catch (error) {
                console.error(error);
                if (btnGuardarEdicion) {
                    btnGuardarEdicion.disabled = false;
                    btnGuardarEdicion.innerHTML = '<i class="bi bi-check-lg"></i> Guardar cambios';
                }
                alert('Error de red al conectar con el servidor.');
            }
        });

        if (modalEditarEl) {
            modalEditarEl.addEventListener('hidden.bs.modal', () => {
                if (btnGuardarEdicion) {
                    btnGuardarEdicion.disabled = false;
                    btnGuardarEdicion.innerHTML = '<i class="bi bi-check-lg"></i> Guardar cambios';
                }
                urlParaEditar = '';
            });
        }
    }

    // ============================================================
    // MOSTRAR ERRORES AL CARGAR
    // ============================================================
    const formErrors = document.querySelector('.alert-danger');
    if (formErrors) {
        if (document.querySelector('#formSolicitud .is-invalid, #formSolicitud .errorlist')) {
            if (tipoSelect) { tipoSelect.value = 'solicitud'; mostrarFormularioSegunTipo(); }
        } else if (document.querySelector('#formIncapacidad .is-invalid, #formIncapacidad .errorlist')) {
            if (tipoSelect) { tipoSelect.value = 'incapacidad'; mostrarFormularioSegunTipo(); }
        } else if (document.querySelector('#formCertificado .is-invalid, #formCertificado .errorlist')) {
            if (tipoSelect) { tipoSelect.value = 'certificado'; mostrarFormularioSegunTipo(); actualizarCamposCertificado(); }
        }
    }

    filtrarHistorial();

    // ============================================================
    // VALIDACIÃ“N FINAL DEL SUBMIT
    // ============================================================
    if (solicitudForm) {
        solicitudForm.addEventListener('submit', function(e) {
            const mainTipo = tipoSelect.value;
            let tipoEfectivo = mainTipo;

            if (mainTipo === 'solicitud' && innerTipoSelect) {
                tipoEfectivo = innerTipoSelect.value;
            }

            if (!tipoEfectivo) {
                e.preventDefault();
                alert('Por favor, selecciona un tipo de novedad.');
                return false;
            }

            if (tipoEfectivo === 'cambio_turno') {
                // Asegura fecha_fin = fecha_inicio justo antes de enviar
                const ini = document.getElementById('solicitudFechaInicio');
                const fin = document.getElementById('solicitudFechaFin');
                if (ini && fin) fin.value = ini.value;

                const nuevoHorario = document.getElementById('nuevoHorario');
                if (!nuevoHorario || !nuevoHorario.value) {
                    e.preventDefault();
                    alert('Por favor, selecciona el nuevo turno.');
                    return false;
                }
            }

            if (tipoEfectivo === 'incapacidad') {
                const fechaInicio = document.getElementById('incapacidadFechaInicio');
                const fechaFin = document.getElementById('incapacidadFechaFin');
                const archivo = document.getElementById('incapacidadAdjunto');

                if (!fechaInicio.value) { e.preventDefault(); alert('La fecha de inicio es obligatoria.'); return false; }
                if (!fechaFin.value) { e.preventDefault(); alert('La fecha de fin es obligatoria.'); return false; }
                if (!archivo.files || archivo.files.length === 0) { e.preventDefault(); alert('Debes adjuntar el soporte médico.'); return false; }
            }
            
            return true;
        });
    }

    const modalCrearEl = document.getElementById('modalsolicitudes');
    if (modalCrearEl) {
        modalCrearEl.addEventListener('hide.bs.modal', () => {
            if (document.activeElement) document.activeElement.blur();
        });
    }

    // ============================================================
    // REABRIR MODAL SI HAY ERRORES DE DJANGO
    // ============================================================
    const errorMessages = document.querySelectorAll('#toastContainer .app-toast-danger');
    if (errorMessages.length > 0) {
        const modalCrear = new bootstrap.Modal(document.getElementById('modalsolicitudes'));
        modalCrear.show();
        const mainTipo = document.querySelector('#tipoSolicitud').value;
        if (mainTipo) mostrarFormularioSegunTipo();
    }

    console.log('âœ… OperPan - novedades.js cargado correctamente');
});

