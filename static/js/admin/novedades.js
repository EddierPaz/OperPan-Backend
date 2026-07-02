// ============================== MÓDULO PERMISOS ==============================
(function(){
    let currentPermisoId = null;

    // Obtener token CSRF
    function getCSRFToken() {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return cookie ? cookie.split('=')[1] : '';
    }

    function showMessage(msg) {
        const toast = document.getElementById('liveToast');
        if (toast) {
            document.getElementById('toastMsg').innerText = msg;
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 3000);
        } else {
            alert(msg);
        }
    }

    function updatePermisosKPIs() {
        fetch('/novedades/permisos/historial/?estado=pendiente')
            .then(r => r.json())
            .then(data => {
                document.getElementById('permisosKpiPendientes').innerText = data.length;
            })
            .catch(() => console.error('Error al obtener KPIs de permisos'));

        // Aprobados y rechazados este mes (se calcula en el backend, pero podemos contar desde historial)
        fetch('/novedades/permisos/historial/')
            .then(r => r.json())
            .then(data => {
                const now = new Date();
                const mes = now.getMonth();
                const año = now.getFullYear();
                const aprobados = data.filter(p => p.estado === 'Aprobado' && new Date(p.fecha_solicitud).getMonth() === mes && new Date(p.fecha_solicitud).getFullYear() === año).length;
                const rechazados = data.filter(p => p.estado === 'Rechazado' && new Date(p.fecha_solicitud).getMonth() === mes && new Date(p.fecha_solicitud).getFullYear() === año).length;
                document.getElementById('permisosKpiAprobados').innerText = aprobados;
                document.getElementById('permisosKpiRechazados').innerText = rechazados;
            })
            .catch(() => console.error('Error al obtener KPIs de permisos'));
    }

    function renderPermisosPendientes() {
        fetch('/novedades/permisos/pendientes/')
            .then(r => r.json())
            .then(data => {
                const container = document.getElementById('permisosSolicitudesContainer');
                if (!data.length) {
                    container.innerHTML = '<div class="alert alert-light">No hay solicitudes pendientes.</div>';
                    return;
                }
                let html = '';
                data.forEach(p => {
                    html += `<div class="admin-request-card">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>${p.empleado}</strong><br>
                                <small>${p.tipo}</small>
                                <p class="mt-1 small">${p.justificacion.substring(0,80)}</p>
                                <div><small><i class="bi bi-calendar-range date-icon"></i> ${p.fecha_inicio} → ${p.fecha_fin}</small></div>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-primary-corporate verPermisoBtn" data-id="${p.id}"><i class="bi bi-eye"></i> Ver</button>
                            </div>
                        </div>
                    </div>`;
                });
                container.innerHTML = html;
                document.querySelectorAll('.verPermisoBtn').forEach(btn => {
                    btn.addEventListener('click', () => verDetallePermiso(btn.dataset.id));
                });
            })
            .catch(() => console.error('Error al cargar permisos pendientes'));
    }

    function renderPermisosHistorial() {
        fetch('/novedades/permisos/historial/')
            .then(r => r.json())
            .then(data => {
                const tbody = document.getElementById('permisosHistorialBody');
                tbody.innerHTML = '';
                data.forEach(p => {
                    let badge = p.estado === 'Pendiente' ? '<span class="badge badge-pending">Pendiente</span>' :
                                p.estado === 'Aprobado' ? '<span class="badge badge-approved">Aprobado</span>' :
                                '<span class="badge badge-rejected">Rechazado</span>';
                    tbody.innerHTML += `<tr>
                        <td data-label="Fecha solicitud">${new Date(p.fecha_solicitud).toLocaleString()}</td>
                        <td data-label="Empleado">${p.empleado}</td>
                        <td data-label="Tipo">${p.tipo}</td>
                        <td data-label="Fechas">${p.fecha_inicio} - ${p.fecha_fin}</td>
                        <td data-label="Estado">${badge}</td>
                        <td data-label="Aprobado por">${p.decision_por || '—'}</td>
                        <td data-label="Acciones"><button class="btn btn-sm btn-outline-secondary verHistorialPermisoBtn" data-id="${p.id}"><i class="bi bi-eye"></i> Ver</button></td>
                    </tr>`;
                });
                document.querySelectorAll('.verHistorialPermisoBtn').forEach(btn => {
                    btn.addEventListener('click', () => verDetalleHistorialPermiso(btn.dataset.id));
                });
            })
            .catch(() => console.error('Error al cargar historial de permisos'));
    }

    function verDetallePermiso(id) {
        currentPermisoId = id;
        fetch(`/novedades/permisos/${id}/`)
            .then(r => r.json())
            .then(p => {
                const emp = p.empleado;
                document.getElementById('permisosModalBody').innerHTML = `
                    <div class="row">
                        <div class="col-md-6"><strong>Empleado:</strong><br>${emp}</div>
                        <div class="col-md-6"><strong>Tipo:</strong><br>${p.tipo}</div>
                        <div class="col-12"><strong>Justificación:</strong><br>${p.justificacion}</div>
                        <div class="col-6"><strong>Fechas:</strong><br><i class="bi bi-calendar3"></i> ${p.fecha_inicio} → ${p.fecha_fin}</div>
                    </div>
                `;
                const modal = new bootstrap.Modal(document.getElementById('permisosDetalleModal'));
                modal.show();
            })
            .catch(() => alert('Error al cargar detalle del permiso'));
    }

    function verDetalleHistorialPermiso(id) {
        fetch(`/novedades/permisos/${id}/`)
            .then(r => r.json())
            .then(p => {
                document.getElementById('permisosModalBody').innerHTML = `
                    <div class="row">
                        <div class="col-md-6"><strong>Empleado:</strong><br>${p.empleado}</div>
                        <div class="col-md-6"><strong>Tipo:</strong><br>${p.tipo}</div>
                        <div class="col-12"><strong>Justificación:</strong><br>${p.justificacion}</div>
                        <div class="col-6"><strong>Fechas:</strong><br><i class="bi bi-calendar3"></i> ${p.fecha_inicio} → ${p.fecha_fin}</div>
                        ${p.motivo_rechazo ? `<div class="col-12 text-danger"><strong>Motivo rechazo:</strong><br>${p.motivo_rechazo}</div>` : ''}
                    </div>
                `;
                document.getElementById('permisosAprobarBtn').disabled = true;
                document.getElementById('permisosRechazarBtn').disabled = true;
                const modal = new bootstrap.Modal(document.getElementById('permisosDetalleModal'));
                modal.show();
                modal._element.addEventListener('hidden.bs.modal', () => {
                    document.getElementById('permisosAprobarBtn').disabled = false;
                    document.getElementById('permisosRechazarBtn').disabled = false;
                }, { once: true });
            })
            .catch(() => alert('Error al cargar detalle del permiso'));
    }

    function aprobarPermiso(id) {
        fetch(`/novedades/permisos/${id}/aprobar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'ok') {
                showMessage('Permiso aprobado correctamente.');
                updatePermisosKPIs();
                renderPermisosPendientes();
                renderPermisosHistorial();
            } else {
                showMessage('Error: ' + (data.error || 'No se pudo aprobar'));
            }
        })
        .catch(() => showMessage('Error de red al aprobar permiso'));
    }

    function rechazarPermiso(id, motivo) {
        fetch(`/novedades/permisos/${id}/rechazar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivo: motivo })
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'ok') {
                showMessage('Permiso rechazado.');
                updatePermisosKPIs();
                renderPermisosPendientes();
                renderPermisosHistorial();
            } else {
                showMessage('Error: ' + (data.error || 'No se pudo rechazar'));
            }
        })
        .catch(() => showMessage('Error de red al rechazar permiso'));
    }

    // Eventos de permisos
    document.getElementById('permisosAprobarBtn')?.addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('permisosDetalleModal'));
        modal.hide();
        new bootstrap.Modal(document.getElementById('permisosConfirmApproveModal')).show();
    });
    document.getElementById('permisosConfirmApprove')?.addEventListener('click', () => {
        aprobarPermiso(currentPermisoId);
        bootstrap.Modal.getInstance(document.getElementById('permisosConfirmApproveModal')).hide();
    });
    document.getElementById('permisosRechazarBtn')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('permisosDetalleModal')).hide();
        new bootstrap.Modal(document.getElementById('permisosConfirmRejectFirstModal')).show();
    });
    document.getElementById('permisosConfirmRejectFirst')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('permisosConfirmRejectFirstModal')).hide();
        new bootstrap.Modal(document.getElementById('permisosRejectModal')).show();
    });
    document.getElementById('permisosConfirmReject')?.addEventListener('click', () => {
        const reason = document.getElementById('permisosRejectReason').value.trim();
        if (!reason) {
            showMessage('Debe ingresar un motivo de rechazo.');
            return;
        }
        rechazarPermiso(currentPermisoId, reason);
        bootstrap.Modal.getInstance(document.getElementById('permisosRejectModal')).hide();
    });

    // Inicializar permisos
    updatePermisosKPIs();
    renderPermisosPendientes();
    renderPermisosHistorial();
})();


// ============================== MÓDULO INCAPACIDADES ==============================
(function(){
    let currentIncapId = null;

    function getCSRFToken() {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return cookie ? cookie.split('=')[1] : '';
    }

    function showMessage(msg) {
        const toast = document.getElementById('liveToast');
        if (toast) {
            document.getElementById('toastMsg').innerText = msg;
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 3000);
        } else {
            alert(msg);
        }
    }

    function updateIncapKPIs() {
        fetch('/novedades/incapacidades/historial/?estado=pendiente')
            .then(r => r.json())
            .then(data => {
                document.getElementById('incapacidadesKpiPendientes').innerText = data.length;
            })
            .catch(() => console.error('Error al obtener KPIs de incapacidades'));

        fetch('/novedades/incapacidades/historial/')
            .then(r => r.json())
            .then(data => {
                const now = new Date();
                const mes = now.getMonth();
                const año = now.getFullYear();
                const aprobadas = data.filter(i => i.estado === 'Aprobado' && new Date(i.fecha_solicitud).getMonth() === mes && new Date(i.fecha_solicitud).getFullYear() === año).length;
                const rechazadas = data.filter(i => i.estado === 'Rechazado' && new Date(i.fecha_solicitud).getMonth() === mes && new Date(i.fecha_solicitud).getFullYear() === año).length;
                document.getElementById('incapacidadesKpiAprobadas').innerText = aprobadas;
                document.getElementById('incapacidadesKpiRechazadas').innerText = rechazadas;
            })
            .catch(() => console.error('Error al obtener KPIs de incapacidades'));
    }

    function renderIncapacidadesLista() {
        const estado = document.getElementById('incapacidadesFiltroEstado').value;
        const busqueda = document.getElementById('incapacidadesBuscarEmpleado').value.toLowerCase();
        let url = '/novedades/incapacidades/pendientes/';
        if (estado !== 'todas') {
            url = `/novedades/incapacidades/historial/?estado=${estado}`;
        }
        fetch(url)
            .then(r => r.json())
            .then(data => {
                let filtradas = data;
                if (busqueda) {
                    filtradas = filtradas.filter(i => i.empleado.toLowerCase().includes(busqueda));
                }
                const container = document.getElementById('incapacidadesListaContainer');
                if (!filtradas.length) {
                    container.innerHTML = '<div class="alert alert-light">No hay incapacidades con esos filtros.</div>';
                    return;
                }
                let html = '';
                filtradas.forEach(i => {
                    let badgeClass = i.estado === 'Pendiente' ? 'badge-pending' :
                                    i.estado === 'Aprobado' ? 'badge-approved' :
                                    'badge-rejected';
                    html += `<div class="incapacidad-card">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>${i.empleado}</strong><br>
                                <small>${i.titulo}</small>
                                <p class="mt-1 small">${i.descripcion}</p>
                                <div>
                                    <small><i class="bi bi-calendar-range"></i> ${i.fecha_inicio} → ${i.fecha_fin}</small>
                                    <span class="badge ${badgeClass}">${i.estado}</span>
                                </div>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-primary-corporate verIncapBtn" data-id="${i.id}"><i class="bi bi-eye"></i> Ver</button>
                            </div>
                        </div>
                        ${i.motivo_rechazo ? `<div class="alert alert-danger mt-2 small">Motivo: ${i.motivo_rechazo}</div>` : ''}
                    </div>`;
                });
                container.innerHTML = html;
                document.querySelectorAll('.verIncapBtn').forEach(btn => {
                    btn.addEventListener('click', () => verDetalleIncapacidad(btn.dataset.id));
                });
            })
            .catch(() => console.error('Error al cargar incapacidades'));
    }

    function renderHistorialIncapacidades() {
        fetch('/novedades/incapacidades/historial/')
            .then(r => r.json())
            .then(data => {
                const tbody = document.getElementById('incapacidadesHistorialBody');
                tbody.innerHTML = '';
                data.forEach(i => {
                    let badge = i.estado === 'Pendiente' ? '<span class="badge badge-pending">Pendiente</span>' :
                                i.estado === 'Aprobado' ? '<span class="badge badge-approved">Aprobado</span>' :
                                '<span class="badge badge-rejected">Rechazado</span>';
                    tbody.innerHTML += `<tr>
                        <td data-label="Fecha solicitud">${new Date(i.fecha_solicitud).toLocaleString()}</td>
                        <td data-label="Empleado">${i.empleado}</td>
                        <td data-label="Diagnóstico">${i.titulo}</td>
                        <td data-label="Período">${i.fecha_inicio} → ${i.fecha_fin}</td>
                        <td data-label="Estado">${badge}</td>
                        <td data-label="Aprobado por">${i.decision_por || '—'}</td>
                        <td data-label="Acciones"><button class="btn btn-sm btn-outline-secondary verHistorialIncapacidadBtn" data-id="${i.id}"><i class="bi bi-eye"></i> Ver</button></td>
                    </tr>`;
                });
                document.querySelectorAll('.verHistorialIncapacidadBtn').forEach(btn => {
                    btn.addEventListener('click', () => verDetalleHistorialIncapacidad(btn.dataset.id));
                });
            })
            .catch(() => console.error('Error al cargar historial de incapacidades'));
    }

    function verDetalleIncapacidad(id) {
        currentIncapId = id;
        fetch(`/novedades/incapacidades/${id}/`)
            .then(r => r.json())
            .then(i => {
                document.getElementById('incapacidadesModalBody').innerHTML = `
                    <p><strong>Empleado:</strong> ${i.empleado}</p>
                    <p><strong>Título:</strong> ${i.titulo}</p>
                    <p><strong>Descripción:</strong> ${i.descripcion}</p>
                    <p><strong>Período:</strong> <i class="bi bi-calendar3"></i> ${i.fecha_inicio} → ${i.fecha_fin}</p>
                    <p><strong>Estado:</strong> ${i.estado}</p>
                    ${i.motivo_rechazo ? `<p class="text-danger"><strong>Motivo rechazo:</strong> ${i.motivo_rechazo}</p>` : ''}
                `;
                const modal = new bootstrap.Modal(document.getElementById('incapacidadesDetalleModal'));
                const aprobarBtn = document.getElementById('incapacidadesAprobarBtn');
                const rechazarBtn = document.getElementById('incapacidadesRechazarBtn');
                if (i.estado !== 'Pendiente') {
                    aprobarBtn.disabled = true;
                    rechazarBtn.disabled = true;
                } else {
                    aprobarBtn.disabled = false;
                    rechazarBtn.disabled = false;
                }
                modal.show();
            })
            .catch(() => alert('Error al cargar detalle de incapacidad'));
    }

    function verDetalleHistorialIncapacidad(id) {
        fetch(`/novedades/incapacidades/${id}/`)
            .then(r => r.json())
            .then(i => {
                document.getElementById('incapacidadesModalBody').innerHTML = `
                    <p><strong>Empleado:</strong> ${i.empleado}</p>
                    <p><strong>Diagnóstico:</strong> ${i.titulo}</p>
                    <p><strong>Descripción:</strong> ${i.descripcion}</p>
                    <p><strong>Período:</strong> <i class="bi bi-calendar3"></i> ${i.fecha_inicio} → ${i.fecha_fin}</p>
                    <p><strong>Estado:</strong> ${i.estado}</p>
                    ${i.motivo_rechazo ? `<p class="text-danger"><strong>Motivo rechazo:</strong> ${i.motivo_rechazo}</p>` : ''}
                `;
                document.getElementById('incapacidadesAprobarBtn').disabled = true;
                document.getElementById('incapacidadesRechazarBtn').disabled = true;
                const modal = new bootstrap.Modal(document.getElementById('incapacidadesDetalleModal'));
                modal.show();
            })
            .catch(() => alert('Error al cargar detalle de incapacidad'));
    }

    function aprobarIncapacidad(id) {
        fetch(`/novedades/incapacidades/${id}/aprobar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'ok') {
                showMessage('Incapacidad aprobada.');
                updateIncapKPIs();
                renderIncapacidadesLista();
                renderHistorialIncapacidades();
            } else {
                showMessage('Error: ' + (data.error || 'No se pudo aprobar'));
            }
        })
        .catch(() => showMessage('Error de red al aprobar incapacidad'));
    }

    function rechazarIncapacidad(id, motivo) {
        fetch(`/novedades/incapacidades/${id}/rechazar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivo: motivo })
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'ok') {
                showMessage('Incapacidad rechazada.');
                updateIncapKPIs();
                renderIncapacidadesLista();
                renderHistorialIncapacidades();
            } else {
                showMessage('Error: ' + (data.error || 'No se pudo rechazar'));
            }
        })
        .catch(() => showMessage('Error de red al rechazar incapacidad'));
    }

    // Eventos de incapacidades
    document.getElementById('incapacidadesAprobarBtn')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesDetalleModal')).hide();
        new bootstrap.Modal(document.getElementById('incapacidadesConfirmApproveModal')).show();
    });
    document.getElementById('incapacidadesConfirmApprove')?.addEventListener('click', () => {
        aprobarIncapacidad(currentIncapId);
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesConfirmApproveModal')).hide();
    });
    document.getElementById('incapacidadesRechazarBtn')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesDetalleModal')).hide();
        new bootstrap.Modal(document.getElementById('incapacidadesConfirmRejectFirstModal')).show();
    });
    document.getElementById('incapacidadesConfirmRejectFirst')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesConfirmRejectFirstModal')).hide();
        new bootstrap.Modal(document.getElementById('incapacidadesRejectModal')).show();
    });
    document.getElementById('incapacidadesConfirmReject')?.addEventListener('click', () => {
        const reason = document.getElementById('incapacidadesRejectReason').value.trim();
        if (!reason) {
            showMessage('Debe ingresar un motivo de rechazo.');
            return;
        }
        rechazarIncapacidad(currentIncapId, reason);
        bootstrap.Modal.getInstance(document.getElementById('incapacidadesRejectModal')).hide();
    });

    document.getElementById('incapacidadesFiltroEstado')?.addEventListener('change', () => {
        renderIncapacidadesLista();
    });
    document.getElementById('incapacidadesBuscarEmpleado')?.addEventListener('input', () => {
        renderIncapacidadesLista();
    });

    // Inicializar incapacidades
    updateIncapKPIs();
    renderIncapacidadesLista();
    renderHistorialIncapacidades();
})();


// ============================== MÓDULO CERTIFICADOS ==============================
(function(){
    function actualizarKPICertificados() {
        fetch('/novedades/certificados/')
            .then(r => r.json())
            .then(data => {
                const hoy = new Date();
                const mes = hoy.getMonth();
                const año = hoy.getFullYear();
                let emitidosMes = 0, emitidosHoy = 0;
                data.forEach(c => {
                    const f = new Date(c.fecha_emision);
                    if (f.getMonth() === mes && f.getFullYear() === año) emitidosMes++;
                    if (f.toDateString() === hoy.toDateString()) emitidosHoy++;
                });
                document.getElementById('certificadosKpiMes').innerText = emitidosMes;
                document.getElementById('certificadosKpiHoy').innerText = emitidosHoy;
            })
            .catch(() => console.error('Error al obtener KPIs de certificados'));
    }

    function cargarEmpleadosSelect() {
        // Obtener lista de empleados desde el backend (se puede hacer desde el endpoint de certificados)
        fetch('/novedades/certificados/')
            .then(r => r.json())
            .then(data => {
                const empleados = [...new Set(data.map(c => c.empleado))];
                const select = document.getElementById('certificadosFiltroEmpleado');
                select.innerHTML = '<option value="">Todos</option>';
                empleados.forEach(emp => {
                    select.innerHTML += `<option value="${emp}">${emp}</option>`;
                });
            })
            .catch(() => console.error('Error al cargar empleados para filtro'));
    }

    function renderCertificados() {
        const emp = document.getElementById('certificadosFiltroEmpleado').value;
        const tipo = document.getElementById('certificadosFiltroTipo').value;
        const desde = document.getElementById('certificadosFiltroDesde').value;
        const hasta = document.getElementById('certificadosFiltroHasta').value;

        let url = '/novedades/certificados/?';
        if (emp) url += `empleado=${encodeURIComponent(emp)}&`;
        if (tipo) url += `tipo=${encodeURIComponent(tipo)}&`;
        if (desde) url += `desde=${desde}&`;
        if (hasta) url += `hasta=${hasta}&`;
        url = url.slice(0, -1); // quitar último & o ?

        fetch(url)
            .then(r => r.json())
            .then(data => {
                const tbody = document.getElementById('certificadosTablaBody');
                const sinRes = document.getElementById('certificadosSinResultados');
                if (!data.length) {
                    tbody.innerHTML = '';
                    sinRes.classList.remove('d-none');
                    return;
                }
                sinRes.classList.add('d-none');
                tbody.innerHTML = data.map(c => `<tr>
                    <td data-label="Empleado"><strong>${c.empleado}</strong></td>
                    <td data-label="Cargo">${c.cargo}</td>
                    <td data-label="Tipo de certificado"><span class="badge badge-approved">${c.tipo}</span></td>
                    <td data-label="Fecha de emisión">${new Date(c.fecha_emision).toLocaleString()}</td>
                    <td data-label="Estado"><span class="badge bg-success bg-opacity-10 text-success">Emitido</span></td>
                </tr>`).join('');
            })
            .catch(() => console.error('Error al cargar certificados'));
    }

    // Eventos de certificados
    document.getElementById('certificadosFiltroEmpleado')?.addEventListener('change', renderCertificados);
    document.getElementById('certificadosFiltroTipo')?.addEventListener('change', renderCertificados);
    document.getElementById('certificadosFiltroDesde')?.addEventListener('change', renderCertificados);
    document.getElementById('certificadosFiltroHasta')?.addEventListener('change', renderCertificados);
    document.getElementById('certificadosBtnLimpiar')?.addEventListener('click', () => {
        document.getElementById('certificadosFiltroEmpleado').value = '';
        document.getElementById('certificadosFiltroTipo').value = '';
        document.getElementById('certificadosFiltroDesde').value = '';
        document.getElementById('certificadosFiltroHasta').value = '';
        renderCertificados();
    });

    // Inicializar certificados
    actualizarKPICertificados();
    cargarEmpleadosSelect();
    renderCertificados();
})();


// ============================== CONTROL DE PESTAÑAS ==============================
document.querySelectorAll('.novedades-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.novedades-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.getElementById(`tab${target.charAt(0).toUpperCase()+target.slice(1)}`).classList.add('active');
    });
});

// ============================================================
// CERTIFICADOS - Bandeja de pendientes y aprobación
// ============================================================

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

let certificadoSeleccionadoId = null;

async function cargarCertificadosPendientes() {
    const container = document.getElementById('certificadosSolicitudesContainer');
    if (!container) return;

    try {
        const resp = await fetch('/novedades/certificados/pendientes/');
        const data = await resp.json();

        if (data.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-3">No hay certificados pendientes.</div>';
            return;
        }

        container.innerHTML = data.map(c => `
            <div class="request-card request-pending mb-2">
                <div class="d-flex justify-content-between align-items-start flex-wrap">
                    <div>
                        <h5 class="mb-1">${c.empleado}</h5>
                        <small class="text-muted">${c.tipo} · Solicitado: ${new Date(c.fecha_solicitud).toLocaleString('es-CO')}</small>
                        <p class="mb-0 mt-2">${c.proposito || ''}</p>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-corporate" onclick="verDetalleCertificado(${c.id})">
                            <i class="bi bi-eye"></i> Ver detalle
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error cargando certificados pendientes:', err);
        container.innerHTML = '<div class="text-center text-danger py-3">Error al cargar certificados pendientes.</div>';
    }
}

async function verDetalleCertificado(id) {
    certificadoSeleccionadoId = id;
    try {
        const resp = await fetch(`/novedades/certificados/pendientes/`);
        const data = await resp.json();
        const c = data.find(item => item.id === id);
        if (!c) return;

        document.getElementById('certificadosModalBody').innerHTML = `
            <p><strong>Empleado:</strong> ${c.empleado}</p>
            <p><strong>Tipo:</strong> ${c.tipo}</p>
            <p><strong>Propósito:</strong> ${c.proposito || '-'}</p>
            <p><strong>Dirigido a:</strong> ${c.dirigido_a || '-'}</p>
            <p><strong>Periodo:</strong> ${c.periodo || '-'}</p>
            <p><strong>Fecha de solicitud:</strong> ${new Date(c.fecha_solicitud).toLocaleString('es-CO')}</p>
        `;

        const modal = new bootstrap.Modal(document.getElementById('certificadosDetalleModal'));
        modal.show();
    } catch (err) {
        console.error('Error obteniendo detalle:', err);
    }
}

// Botón "Aprobar" dentro del modal de detalle -> abre modal de confirmación
document.getElementById('certificadosAprobarBtn')?.addEventListener('click', () => {
    const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('certificadosDetalleModal'));
    modalDetalle?.hide();
    const modalConfirm = new bootstrap.Modal(document.getElementById('certificadosConfirmApproveModal'));
    modalConfirm.show();
});

// Confirmar aprobación
document.getElementById('certificadosConfirmApprove')?.addEventListener('click', async () => {
    if (!certificadoSeleccionadoId) return;
    try {
        const resp = await fetch(`/novedades/certificados/${certificadoSeleccionadoId}/aprobar/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        });
        const data = await resp.json();

        bootstrap.Modal.getInstance(document.getElementById('certificadosConfirmApproveModal'))?.hide();

        if (resp.ok) {
            cargarCertificadosPendientes();
            if (typeof cargarCertificadosHistorial === 'function') cargarCertificadosHistorial();
        } else {
            alert(data.error || 'Error al aprobar el certificado');
        }
    } catch (err) {
        console.error('Error aprobando certificado:', err);
    }
});

// Botón "Rechazar" dentro del modal de detalle -> abre modal de motivo
document.getElementById('certificadosRechazarBtn')?.addEventListener('click', () => {
    const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('certificadosDetalleModal'));
    modalDetalle?.hide();
    const modalReject = new bootstrap.Modal(document.getElementById('certificadosRejectModal'));
    modalReject.show();
});

// Confirmar rechazo
document.getElementById('certificadosConfirmReject')?.addEventListener('click', async () => {
    if (!certificadoSeleccionadoId) return;
    const motivo = document.getElementById('certificadosRejectReason').value.trim();
    if (!motivo) {
        alert('Debes indicar un motivo de rechazo.');
        return;
    }

    try {
        const resp = await fetch(`/novedades/certificados/${certificadoSeleccionadoId}/rechazar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivo: motivo })
        });
        const data = await resp.json();

        bootstrap.Modal.getInstance(document.getElementById('certificadosRejectModal'))?.hide();
        document.getElementById('certificadosRejectReason').value = '';

        if (resp.ok) {
            cargarCertificadosPendientes();
            if (typeof cargarCertificadosHistorial === 'function') cargarCertificadosHistorial();
        } else {
            alert(data.error || 'Error al rechazar el certificado');
        }
    } catch (err) {
        console.error('Error rechazando certificado:', err);
    }
});

// Cargar al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarCertificadosPendientes();
});