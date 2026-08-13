document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias ---
    const tipoSelect = document.getElementById('tipoSolicitud');
    const formPermiso = document.getElementById('formPermiso');
    const formIncapacidad = document.getElementById('formIncapacidad');
    const formCertificado = document.getElementById('formCertificado');
    const nuevoHorarioGroup = document.getElementById('nuevoHorarioGroup');
    const solicitudesContainer = document.getElementById('solicitudesContainer');

    // --- 1. Gestión de formularios por tipo ---
    const mostrarFormularioSegunTipo = () => {
        if (!tipoSelect) return;
        const tipo = tipoSelect.value;

        [formPermiso, formIncapacidad, formCertificado, nuevoHorarioGroup].forEach(el => {
            if (el) el.style.display = 'none';
        });

        if (['permiso', 'cambio_turno', 'vacaciones'].includes(tipo)) {
            if (formPermiso) formPermiso.style.display = 'block';
            if (tipo === 'cambio_turno' && nuevoHorarioGroup) nuevoHorarioGroup.style.display = 'block';
        } else if (tipo === 'incapacidad' && formIncapacidad) {
            formIncapacidad.style.display = 'block';
        } else if (tipo === 'certificado' && formCertificado) {
            formCertificado.style.display = 'block';
            actualizarCamposCertificado();
        }
    };

    if (tipoSelect) {
        tipoSelect.addEventListener('change', mostrarFormularioSegunTipo);
        mostrarFormularioSegunTipo();
    }

    // --- 2. Cálculo de días de incapacidad ---
    const incapInicio = document.getElementById('incapacidadFechaInicio');
    const incapFin = document.getElementById('incapacidadFechaFin');
    const incapDias = document.getElementById('incapacidadDias');

    const actualizarDiasIncapacidad = () => {
        if (!incapInicio?.value || !incapFin?.value) {
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

    [incapInicio, incapFin].forEach(el => el?.addEventListener('change', actualizarDiasIncapacidad));

    // --- 3. Certificados ---
    const certTipo = document.getElementById('certificadoTipo');
    const periodoGroup = document.getElementById('certificadoPeriodoGroup');

    const actualizarCamposCertificado = () => {
        if (!certTipo) return;
        if (periodoGroup) {
            periodoGroup.style.display = certTipo.value === 'ingresos' ? 'block' : 'none';
        }
    };

    if (certTipo) {
        certTipo.addEventListener('change', actualizarCamposCertificado);
        actualizarCamposCertificado();
    }

    // --- 4. Filtros del Historial ---
    let tipoActual = 'permiso';
    let estadoActual = 'todas';

    const filtrarHistorial = () => {
        if (!solicitudesContainer) return;
        const tarjetas = Array.from(solicitudesContainer.querySelectorAll('.request-card'));
        let visibles = 0;

        tarjetas.forEach(card => {
            const matchTipo = card.dataset.tipo === tipoActual;
            const matchEstado = estadoActual === 'todas' || card.dataset.estado === estadoActual;

            card.style.display = (matchTipo && matchEstado) ? '' : 'none';
            if (matchTipo && matchEstado) visibles++;
        });

        let msg = document.getElementById('mensajeSinResultados');
        if (visibles === 0) {
            if (!msg) {
                msg = document.createElement('div');
                msg.id = 'mensajeSinResultados';
                msg.className = 'empty-history';
                solicitudesContainer.appendChild(msg);
            }
            const t = { 'permiso': 'permisos', 'incapacidad': 'incapacidades', 'certificado': 'certificados' }[tipoActual] || 'solicitudes';
            const e = estadoActual !== 'todas' ? ` ${estadoActual}s` : '';
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

    // --- 5. Botones "Ver todas" ---
    document.querySelectorAll('.btn-view-pending').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTipo = e.currentTarget.dataset.tipo;
            const scrollTo = e.currentTarget.dataset.scrollTo;

            tipoFiltroTabs.forEach(tab => {
                if (tab.dataset.tipo === targetTipo) {
                    tab.click();
                }
            });

            if (scrollTo) {
                const element = document.getElementById(scrollTo);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // --- 6. Limpieza del formulario al hacer reset ---
    const solicitudForm = document.getElementById('solicitudForm');
    if (solicitudForm) {
        solicitudForm.addEventListener('reset', () => {
            setTimeout(() => {
                mostrarFormularioSegunTipo();
                actualizarCamposCertificado();
                if (incapDias) incapDias.value = '';
                const fileInputs = solicitudForm.querySelectorAll('input[type="file"]');
                fileInputs.forEach(input => {
                    input.value = '';
                });
            }, 0);
        });
    }

    // --- 7. Modal de detalle (NUEVO DISEÑO) ---
    const modalDetalleEl = document.getElementById('modalDetalleSolicitud');
    const modalDetalle = modalDetalleEl ? new bootstrap.Modal(modalDetalleEl) : null;

    // Función para obtener el icono según el tipo
    function getTipoIcon(tipo) {
        const icons = {
            'permiso': 'bi-calendar-event-fill',
            'incapacidad': 'bi-heart-pulse-fill',
            'certificado': 'bi-award-fill',
            'cambio_turno': 'bi-arrow-repeat',
            'vacaciones': 'bi-umbrella-fill'
        };
        return icons[tipo] || 'bi-file-earmark-text-fill';
    }

    // Función para el badge de estado
    function getEstadoBadge(estado) {
        const badges = {
            'pendiente': 'novedad-estado-pendiente',
            'aprobado': 'novedad-estado-aprobado',
            'rechazado': 'novedad-estado-rechazado'
        };
        return badges[estado] || 'novedad-estado-pendiente';
    }

    function getEstadoLabel(estado) {
        const labels = {
            'pendiente': 'Pendiente',
            'aprobado': 'Aprobado',
            'rechazado': 'Rechazado'
        };
        return labels[estado] || estado;
    }

    document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const d = e.currentTarget.dataset;
            
            const tipo = d.tipo || 'solicitud';
            const estado = d.estadoSlug || 'pendiente';
            
            // Icono
            document.getElementById('detalleIcono').className = `bi ${getTipoIcon(tipo)}`;
            
            // Título
            document.getElementById('detalleTitulo').textContent = d.titulo || 'Detalle de solicitud';
            
            // Subtítulo
            document.getElementById('detalleSubtitulo').textContent = d.subtitulo || 'Información completa de la solicitud';
            
            // Estado
            const badge = document.getElementById('detalleEstadoBadge');
            badge.textContent = getEstadoLabel(estado);
            badge.className = `novedad-detalle-estado ${getEstadoBadge(estado)}`;
            
            // Tipo
            document.getElementById('detalleTipo').textContent = d.titulo || '—';
            
            // Fechas
            const fechasContainer = document.getElementById('detalleFechasContainer');
            const fechasEl = document.getElementById('detalleFechas');
            if (d.subtitulo && d.subtitulo.includes('→')) {
                const fechas = d.subtitulo.split('·')[1] || d.subtitulo;
                fechasEl.textContent = fechas.trim();
                fechasContainer.style.display = 'block';
            } else {
                fechasContainer.style.display = 'none';
            }
            
            // Motivo
            document.getElementById('detalleMotivo').textContent = d.motivo || 'Sin información adicional.';
            
            // Motivo de rechazo
            const rechazoContainer = document.getElementById('detalleRechazoContainer');
            const motivoRechazoEl = document.getElementById('detalleMotivoRechazo');
            if (estado === 'rechazado' && d.motivoRechazo && d.motivoRechazo !== '') {
                motivoRechazoEl.textContent = d.motivoRechazo;
                rechazoContainer.style.display = 'block';
            } else {
                rechazoContainer.style.display = 'none';
            }
            
            // Archivo
            const archivoContainer = document.getElementById('detalleArchivoContainer');
            const archivoLink = document.getElementById('detalleArchivoLink');
            if (d.archivo && d.archivo !== '') {
                archivoLink.href = d.archivo;
                archivoContainer.style.display = 'block';
            } else {
                archivoContainer.style.display = 'none';
            }
            
            // Botones de acción
            const editarBtn = document.getElementById('detalleEditarBtn');
            const eliminarBtn = document.getElementById('detalleEliminarBtn');
            const descargarBtn = document.getElementById('detalleDescargarBtn');
            
            editarBtn.style.display = 'none';
            eliminarBtn.style.display = 'none';
            descargarBtn.style.display = 'none';
            
            // Si está pendiente, mostrar botones de editar/eliminar
            if (estado === 'pendiente') {
                const pendingItem = btn.closest('.pending-item');
                if (pendingItem) {
                    const editarOriginal = pendingItem.querySelector('.btn-editar-solicitud');
                    const eliminarOriginal = pendingItem.querySelector('.btn-eliminar-solicitud');
                    
                    if (editarOriginal) {
                        editarBtn.style.display = 'inline-flex';
                        editarBtn.onclick = function(e) {
                            e.stopPropagation();
                            modalDetalle?.hide();
                            setTimeout(() => {
                                editarOriginal.click();
                            }, 300);
                        };
                    }
                    
                    if (eliminarOriginal) {
                        eliminarBtn.style.display = 'inline-flex';
                        eliminarBtn.onclick = function(e) {
                            e.stopPropagation();
                            modalDetalle?.hide();
                            setTimeout(() => {
                                eliminarOriginal.click();
                            }, 300);
                        };
                    }
                }
            } 
            // Si está aprobado y tiene archivo, mostrar descargar
            else if (estado === 'aprobado' && d.archivo && d.archivo !== '') {
                descargarBtn.style.display = 'inline-flex';
                descargarBtn.onclick = function() {
                    window.open(d.archivo, '_blank');
                };
            }
            // Si es certificado aprobado, buscar enlace de descarga
            else if (estado === 'aprobado' && tipo === 'certificado') {
                const card = btn.closest('.request-card');
                if (card) {
                    const link = card.querySelector('a[href*="certificado"]');
                    if (link) {
                        descargarBtn.style.display = 'inline-flex';
                        descargarBtn.onclick = function() {
                            window.open(link.href, '_blank');
                        };
                    }
                }
            }
            
            // Mostrar el modal
            if (modalDetalle) modalDetalle.show();
        });
    });

    // --- 8. Modal de confirmación y eliminación por AJAX ---
    const modalEliminarEl = document.getElementById('modalConfirmarEliminar');
    const modalEliminar = modalEliminarEl ? new bootstrap.Modal(modalEliminarEl) : null;
    const btnConfirmarEliminacion = document.getElementById('btnConfirmarEliminacion');

    let urlParaEliminar = '';

    document.addEventListener('click', (e) => {
        const btnEliminar = e.target.closest('.btn-eliminar-solicitud');
        if (btnEliminar) {
            e.preventDefault();
            urlParaEliminar = btnEliminar.dataset.url;
            if (urlParaEliminar && modalEliminar) {
                modalEliminar.show();
            } else {
                console.error("No se encontró el atributo data-url en el botón de eliminación.");
            }
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
                    if (cookie.startsWith('csrftoken=')) {
                        csrftoken = cookie.substring('csrftoken='.length);
                        break;
                    }
                }

                const response = await fetch(urlParaEliminar, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const data = await response.json();

                if (response.ok && data.status === 'ok') {
                    if (modalEliminar) modalEliminar.hide();
                    window.location.reload();
                } else {
                    alert(data.error || 'Ocurrió un error al intentar eliminar la solicitud.');
                    if (modalEliminar) modalEliminar.hide();
                    btnConfirmarEliminacion.disabled = false;
                    btnConfirmarEliminacion.innerHTML = '<i class="bi bi-trash3"></i> Sí, eliminar';
                }
            } catch (error) {
                console.error('Error en la petición:', error);
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

    // --- 9. Modal de Edición por AJAX ---
    const modalEditarEl = document.getElementById('modalEditarSolicitud');
    const modalEditar = modalEditarEl ? new bootstrap.Modal(modalEditarEl) : null;
    const formEditar = document.getElementById('formEditarSolicitud');
    const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');

    let urlParaEditar = '';

    document.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('.btn-editar-solicitud');
        if (btnEditar) {
            e.preventDefault();

            urlParaEditar = btnEditar.dataset.url;

            const idVal = btnEditar.dataset.id || '';
            const tipoVal = btnEditar.dataset.tipo || 'permiso';
            const inicioVal = btnEditar.dataset.inicio || '';
            const finVal = btnEditar.dataset.fin || '';
            const motivoVal = btnEditar.dataset.motivo || '';
            const archivoUrl = btnEditar.dataset.archivo || '';

            const idInput = document.getElementById('editarId');
            if (idInput) idInput.value = idVal;

            const tipoDisplay = document.getElementById('editarTipoDisplay');
            if (tipoDisplay) {
                const tipos = {
                    'permiso': 'Permiso',
                    'cambio_turno': 'Cambio de Turno',
                    'vacaciones': 'Vacaciones',
                    'incapacidad': 'Incapacidad',
                    'certificado': 'Certificado'
                };
                tipoDisplay.value = tipos[tipoVal] || tipoVal;
            }

            const tipoOriginal = document.getElementById('editarTipoOriginal');
            if (tipoOriginal) tipoOriginal.value = tipoVal;

            const inputInicio = document.getElementById('editarFechaInicio');
            if (inputInicio) inputInicio.value = inicioVal;

            const inputFin = document.getElementById('editarFechaFin');
            if (inputFin) inputFin.value = finVal;

            const inputMotivo = document.getElementById('editarMotivo');
            if (inputMotivo) inputMotivo.value = motivoVal;

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
            if (!urlParaEditar) {
                alert('No se encontró la URL para editar.');
                return;
            }

            try {
                if (btnGuardarEdicion) {
                    btnGuardarEdicion.disabled = true;
                    btnGuardarEdicion.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Guardando...';
                }

                let csrftoken = '';
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.startsWith('csrftoken=')) {
                        csrftoken = cookie.substring('csrftoken='.length);
                        break;
                    }
                }

                const formData = new FormData(formEditar);

                const response = await fetch(urlParaEditar, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.ok && data.status === 'ok') {
                    if (modalEditar) modalEditar.hide();
                    window.location.reload();
                } else {
                    alert(data.error || 'Ocurrió un error al intentar actualizar la solicitud.');
                    if (btnGuardarEdicion) {
                        btnGuardarEdicion.disabled = false;
                        btnGuardarEdicion.innerHTML = 'Guardar cambios';
                    }
                }
            } catch (error) {
                console.error('Error en la petición:', error);
                alert('Error de red al intentar conectar con el servidor.');
                if (modalEditar) modalEditar.hide();
                if (btnGuardarEdicion) {
                    btnGuardarEdicion.disabled = false;
                    btnGuardarEdicion.innerHTML = 'Guardar cambios';
                }
            }
        });

        if (modalEditarEl) {
            modalEditarEl.addEventListener('hidden.bs.modal', () => {
                if (btnGuardarEdicion) {
                    btnGuardarEdicion.disabled = false;
                    btnGuardarEdicion.innerHTML = 'Guardar cambios';
                }
                urlParaEditar = '';
            });
        }
    }

    // --- 10. Mostrar errores del formulario al cargar la página ---
    const formErrors = document.querySelector('.alert-danger');
    if (formErrors) {
        if (document.querySelector('#formPermiso .is-invalid, #formPermiso .errorlist')) {
            const select = document.getElementById('tipoSolicitud');
            if (select) {
                select.value = 'permiso';
                mostrarFormularioSegunTipo();
            }
        } else if (document.querySelector('#formIncapacidad .is-invalid, #formIncapacidad .errorlist')) {
            const select = document.getElementById('tipoSolicitud');
            if (select) {
                select.value = 'incapacidad';
                mostrarFormularioSegunTipo();
            }
        } else if (document.querySelector('#formCertificado .is-invalid, #formCertificado .errorlist')) {
            const select = document.getElementById('tipoSolicitud');
            if (select) {
                select.value = 'certificado';
                mostrarFormularioSegunTipo();
                actualizarCamposCertificado();
            }
        }
    }

    // --- 11. Ejecutar filtro inicial ---
    filtrarHistorial();

    // ============================================================
    // --- 12. VALIDACIÓN DEL FORMULARIO DE NUEVA SOLICITUD ---
    // ============================================================
    
    const formNuevaSolicitud = document.getElementById('solicitudForm');
    
    if (formNuevaSolicitud) {
        formNuevaSolicitud.addEventListener('submit', function(e) {
            const tipoSelect = document.getElementById('tipoSolicitud');
            const tipo = tipoSelect?.value;
            
            if (!tipo) {
                e.preventDefault();
                alert('❌ Por favor, selecciona un tipo de solicitud.');
                return false;
            }

            // INCAPACIDAD
            if (tipo === 'incapacidad') {
                const titulo = document.getElementById('incapacidadTitulo');
                const descripcion = document.getElementById('incapacidadDescripcion');
                const fechaInicio = document.getElementById('incapacidadFechaInicio');
                const fechaFin = document.getElementById('incapacidadFechaFin');
                const archivo = document.getElementById('incapacidadAdjunto');
                
                if (!titulo?.value.trim()) {
                    e.preventDefault();
                    alert('❌ El título es obligatorio.');
                    return false;
                }
                if (!descripcion?.value.trim()) {
                    e.preventDefault();
                    alert('❌ La descripción es obligatoria.');
                    return false;
                }
                if (!fechaInicio?.value) {
                    e.preventDefault();
                    alert('❌ La fecha de inicio es obligatoria.');
                    return false;
                }
                if (!fechaFin?.value) {
                    e.preventDefault();
                    alert('❌ La fecha de fin es obligatoria.');
                    return false;
                }
                if (!archivo?.files || archivo.files.length === 0) {
                    e.preventDefault();
                    alert('❌ Debes adjuntar un soporte médico para la incapacidad.');
                    return false;
                }
            }

            // CERTIFICADO
            if (tipo === 'certificado') {
                const tipoCert = document.getElementById('certificadoTipo');
                const proposito = document.getElementById('certificadoProposito');
                
                if (!tipoCert?.value) {
                    e.preventDefault();
                    alert('❌ El tipo de certificado es obligatorio.');
                    return false;
                }
                if (!proposito?.value.trim()) {
                    e.preventDefault();
                    alert('❌ El propósito es obligatorio.');
                    return false;
                }
            }

            // PERMISO
            if (['permiso', 'cambio_turno', 'vacaciones'].includes(tipo)) {
                const tipoPermiso = document.getElementById('permisoTipo');
                const fechaInicio = document.getElementById('permisoFechaInicio');
                const fechaFin = document.getElementById('permisoFechaFin');
                const justificacion = document.getElementById('permisoMotivo');
                
                if (!tipoPermiso?.value) {
                    e.preventDefault();
                    alert('❌ El tipo de permiso es obligatorio.');
                    return false;
                }
                
                if (!fechaInicio?.value) {
                    e.preventDefault();
                    alert('❌ La fecha de inicio es obligatoria.');
                    return false;
                }
                
                if (!fechaFin?.value) {
                    e.preventDefault();
                    alert('❌ La fecha de fin es obligatoria.');
                    return false;
                }
                
                if (!justificacion?.value.trim()) {
                    e.preventDefault();
                    alert('❌ La justificación es obligatoria.');
                    return false;
                }
            }
            
            console.log('✅ Formulario válido, enviando...');
            return true;
        });
    }

    console.log('✅ OperPan - Solicitudes.js cargado correctamente');
});