// ============================================================
// USUARIOS - MODALES Y FILTROS
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // 1. DELEGACIÓN DE EVENTOS (Ver, Editar, acciones de estado)
    // ==========================================
    document.addEventListener('click', function(e) {

        // ===== VER USUARIO =====
        const btnVer = e.target.closest('.btn-ver-usuario');
        if (btnVer) {
            const tr = btnVer.closest('tr');
            if (!tr) return;
            const d = tr.dataset;

            const tiposDoc = { 'CC': 'Cédula de Ciudadanía', 'CE': 'Cédula de Extranjería', 'TI': 'Tarjeta de Identidad', 'PA': 'Pasaporte' };
            const generos = { 'M': 'Masculino', 'F': 'Femenino', 'O': 'Otro' };
            const estadosCiviles = { 'soltero': 'Soltero', 'casado': 'Casado', 'union_libre': 'Unión Libre', 'divorciado': 'Divorciado', 'viudo': 'Viudo' };
            const cargos = { 'mesero': 'Mesero', 'cajero': 'Cajero', 'pastelero': 'Pastelero', 'panadero': 'Panadero', 'cocina': 'Cocina', 'buñuelero': 'Buñuelero', 'greca': 'Greca' };
            const roles = { 'admin': 'Administrador', 'empleado': 'Empleado' };
            const estadosLaborales = { 'activo': 'Activo', 'retirado': 'Retirado' };
            const estadosCuenta = { 'PENDIENTE': 'Pendiente', 'ACTIVA': 'Activa', 'SUSPENDIDA': 'Suspendida', 'INACTIVA': 'Inactiva' };

            const nombreCompleto = [
                d.primerNombre || '',
                d.segundoNombre || '',
                d.primerApellido || '',
                d.segundoApellido || ''
            ].filter(Boolean).join(' ');

            const campos = {
                'v_nombre_completo': nombreCompleto || '-',
                'v_tipo_documento': tiposDoc[d.tipoDocumento] || d.tipoDocumento || '-',
                'v_numero_documento': d.numeroDocumento || '-',
                'v_fecha_nacimiento': d.fechaNacimiento || '-',
                'v_genero': generos[d.genero] || d.genero || '-',
                'v_estado_civil': estadosCiviles[d.estadoCivil] || d.estadoCivil || '-',
                'v_tipo_sangre': d.tipoSangre || '-',
                'v_telefono': d.telefono || '-',
                'v_correo': d.correo || '-',
                'v_ciudad': d.ciudad || '-',
                'v_direccion': d.direccion || '-',
                'v_contacto_emergencia': d.contactoEmergencia || '-',
                'v_parentesco_emergencia': d.parentescoEmergencia || '-',
                'v_telefono_emergencia': d.telefonoEmergencia || '-',
                'v_cargo': cargos[d.cargo] || d.cargo || '-',
                'v_fecha_ingreso': d.fechaIngreso || '-',
                'v_eps': d.eps || '-',
                'v_arl': d.arl || '-',
                'v_fondo_pension': d.fondoPension || '-',
                'v_username': d.username || '-',
                'v_rol': roles[d.rol] || d.rol || '-',
                'v_estado': estadosLaborales[d.estado] || d.estado || '-',
                'v_estado_cuenta': estadosCuenta[d.estadoCuenta] || d.estadoCuenta || '-'
            };

            for (const [id, valor] of Object.entries(campos)) {
                const el = document.getElementById(id);
                if (el) el.textContent = valor.trim ? valor.trim() : valor;
            }

            const modalEl = document.getElementById('modalVerUsuario');
            if (modalEl) new bootstrap.Modal(modalEl).show();
        }

        // ===== EDITAR USUARIO =====
        const btnEditar = e.target.closest('.btn-editar-usuario');
        if (btnEditar) {
            const tr = btnEditar.closest('tr');
            if (!tr) return;
            const id = tr.dataset.id;
            const d = tr.dataset;

            const form = document.getElementById('formEditarUsuario');
            if (form) form.action = '/admi/users/' + id + '/update/';

            const camposEditables = {
                'e_primer_nombre': d.primerNombre || '',
                'e_segundo_nombre': d.segundoNombre || '',
                'e_primer_apellido': d.primerApellido || '',
                'e_segundo_apellido': d.segundoApellido || '',
                'e_estado_civil': d.estadoCivil || '',
                'e_telefono': d.telefono || '',
                'e_correo': d.correo || '',
                'e_ciudad': d.ciudad || '',
                'e_direccion': d.direccion || '',
                'e_contacto_emergencia': d.contactoEmergencia || '',
                'e_parentesco_emergencia': d.parentescoEmergencia || '',
                'e_telefono_emergencia': d.telefonoEmergencia || '',
                'e_cargo': d.cargo || '',
                'e_eps': d.eps || '',
                'e_arl': d.arl || '',
                'e_fondo_pension': d.fondoPension || '',
                'e_username': d.username || '',
                'e_rol': d.rol || ''
            };

            for (const [id, valor] of Object.entries(camposEditables)) {
                const el = document.getElementById(id);
                if (el) el.value = valor;
            }

            // Campos solo lectura (disabled + hidden)
            const tipoDocSelect = document.getElementById('e_tipo_documento');
            const tipoDocHidden = document.getElementById('e_tipo_documento_hidden');
            if (tipoDocSelect) tipoDocSelect.value = d.tipoDocumento || '';
            if (tipoDocHidden) tipoDocHidden.value = d.tipoDocumento || '';

            const numDocInput = document.getElementById('e_numero_documento');
            if (numDocInput) numDocInput.value = d.numeroDocumento || '';

            const fechaNacInput = document.getElementById('e_fecha_nacimiento');
            if (fechaNacInput) fechaNacInput.value = d.fechaNacimiento || '';

            const generoSelect = document.getElementById('e_genero');
            const generoHidden = document.getElementById('e_genero_hidden');
            if (generoSelect) generoSelect.value = d.genero || '';
            if (generoHidden) generoHidden.value = d.genero || '';

            const sangreSelect = document.getElementById('e_tipo_sangre');
            const sangreHidden = document.getElementById('e_tipo_sangre_hidden');
            if (sangreSelect) sangreSelect.value = d.tipoSangre || '';
            if (sangreHidden) sangreHidden.value = d.tipoSangre || '';

            const fechaIngresoInput = document.getElementById('e_fecha_ingreso');
            if (fechaIngresoInput) fechaIngresoInput.value = d.fechaIngreso || '';

            const modalEl = document.getElementById('modalEditarUsuario');
            if (modalEl) new bootstrap.Modal(modalEl).show();
        }

        // ===== SUSPENDER =====
        const btnSuspender = e.target.closest('.btn-suspender-usuario');
        if (btnSuspender) {
            const id = btnSuspender.dataset.id;
            const nombre = btnSuspender.dataset.nombre || 'usuario';
            document.getElementById('formSuspenderUsuario').action = '/admi/users/' + id + '/suspender/';
            document.getElementById('suspender_usuario_nombre').textContent = nombre;
            document.getElementById('suspender_motivo').value = '';
            new bootstrap.Modal(document.getElementById('modalSuspenderUsuario')).show();
        }

        // ===== REACTIVAR (SUSPENDIDA → ACTIVA) =====
        const btnReactivar = e.target.closest('.btn-reactivar-usuario');
        if (btnReactivar) {
            const id = btnReactivar.dataset.id;
            const nombre = btnReactivar.dataset.nombre || 'usuario';
            document.getElementById('formReactivarUsuario').action = '/admi/users/' + id + '/reactivar/';
            document.getElementById('reactivar_usuario_nombre').textContent = nombre;
            new bootstrap.Modal(document.getElementById('modalReactivarUsuario')).show();
        }

        // ===== RETIRAR =====
        const btnRetirar = e.target.closest('.btn-retirar-usuario');
        if (btnRetirar) {
            const id = btnRetirar.dataset.id;
            const nombre = btnRetirar.dataset.nombre || 'usuario';
            document.getElementById('formRetirarUsuario').action = '/admi/users/' + id + '/retirar/';
            document.getElementById('retirar_usuario_nombre').textContent = nombre;
            document.getElementById('retirar_motivo').value = '';
            new bootstrap.Modal(document.getElementById('modalRetirarUsuario')).show();
        }

        // ===== REINCORPORAR (RETIRADO → ACTIVO) =====
        const btnReactivarRetiro = e.target.closest('.btn-reactivar-retiro-usuario');
        if (btnReactivarRetiro) {
            const id = btnReactivarRetiro.dataset.id;
            const nombre = btnReactivarRetiro.dataset.nombre || 'usuario';
            document.getElementById('formReactivarRetiroUsuario').action = '/admi/users/' + id + '/reactivar-retiro/';
            document.getElementById('reactivar_retiro_usuario_nombre').textContent = nombre;
            new bootstrap.Modal(document.getElementById('modalReactivarRetiroUsuario')).show();
        }

        // ===== REENVIAR CREDENCIALES =====
        const btnCredenciales = e.target.closest('.btn-credenciales-usuario');
        if (btnCredenciales) {
            const id = btnCredenciales.dataset.id;
            const nombre = btnCredenciales.dataset.nombre || 'usuario';
            document.getElementById('formEnviarCredenciales').action = '/admi/users/' + id + '/enviar-credenciales/';
            document.getElementById('credenciales_usuario_nombre').textContent = nombre;
            new bootstrap.Modal(document.getElementById('modalEnviarCredenciales')).show();
        }

        // ===== ELIMINAR USUARIO (físico, excepcional) =====
        const btnEliminar = e.target.closest('.btn-eliminar-usuario');
        if (btnEliminar) {
            const id = btnEliminar.dataset.id;
            const nombre = btnEliminar.dataset.nombre || 'usuario';

            const form = document.getElementById('formEliminarUsuario');
            if (form) form.action = '/admi/users/' + id + '/delete/';

            const nombreSpan = document.getElementById('eliminar_usuario_nombre');
            if (nombreSpan) nombreSpan.textContent = nombre;

            new bootstrap.Modal(document.getElementById('modalEliminarUsuario')).show();
        }
    });

    // ==========================================
    // 2. FILTROS DE BÚSQUEDA
    // ==========================================
    const inputBuscar = document.getElementById('buscarCuenta');
    const filtroCargo = document.getElementById('filtroCargo');
    const filtroRol = document.getElementById('filtroRol');
    const filtroEstadoCuenta = document.getElementById('filtroEstadoCuenta');
    const btnLimpiar = document.getElementById('limpiarFiltrosCuentas');

    if (inputBuscar) {
        function aplicarFiltros() {
            const texto = inputBuscar.value.trim().toLowerCase();
            const cargo = filtroCargo ? filtroCargo.value.toLowerCase() : '';
            const rol = filtroRol ? filtroRol.value.toLowerCase() : '';
            const estadoCuenta = filtroEstadoCuenta ? filtroEstadoCuenta.value : '';

            const filas = document.querySelectorAll('#tablaUsuarios tbody tr[data-id]');
            filas.forEach(fila => {
                const d = fila.dataset;

                const nombreCompleto = [
                    d.primerNombre || '',
                    d.segundoNombre || '',
                    d.primerApellido || '',
                    d.segundoApellido || ''
                ].filter(Boolean).join(' ').toLowerCase();

                const documento = (d.numeroDocumento || '').toLowerCase();
                const usuario = (d.username || '').toLowerCase();
                const cargoFila = (d.cargo || '').toLowerCase();
                const rolFila = (d.rol || '').toLowerCase();
                const estadoCuentaFila = d.estadoCuenta || '';

                const coincideTexto = !texto ||
                    documento.includes(texto) ||
                    usuario.includes(texto) ||
                    nombreCompleto.includes(texto);

                const coincideCargo = !cargo || cargoFila === cargo;
                const coincideRol = !rol || rolFila === rol;
                const coincideEstadoCuenta = !estadoCuenta || estadoCuentaFila === estadoCuenta;

                fila.style.display = (coincideTexto && coincideCargo && coincideRol && coincideEstadoCuenta) ? '' : 'none';
            });
        }

        [inputBuscar, filtroCargo, filtroRol, filtroEstadoCuenta].forEach(el => {
            if (el) {
                el.addEventListener('input', aplicarFiltros);
                el.addEventListener('change', aplicarFiltros);
            }
        });

        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', function() {
                inputBuscar.value = '';
                if (filtroCargo) filtroCargo.value = '';
                if (filtroRol) filtroRol.value = '';
                if (filtroEstadoCuenta) filtroEstadoCuenta.value = '';
                aplicarFiltros();
            });
        }
    }

    // ==========================================
    // 3. LIMPIAR FORMULARIO DE CREACIÓN
    // ==========================================
    const btnLimpiarCrear = document.getElementById('btnLimpiarCrear');
    if (btnLimpiarCrear) {
        btnLimpiarCrear.addEventListener('click', function(e) {
            e.preventDefault();
            const form = document.getElementById('formCrearUsuario');
            if (form) {
                form.reset();
                const selects = form.querySelectorAll('select');
                selects.forEach(select => { select.selectedIndex = 0; });
            }
        });
    }

    // ==========================================
    // 4. PREVENIR ENVÍO DE CAMPOS DISABLED
    // ==========================================
    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.id === 'formEditarUsuario') {
            const tipoDocHidden = document.getElementById('e_tipo_documento_hidden');
            const generoHidden = document.getElementById('e_genero_hidden');
            const sangreHidden = document.getElementById('e_tipo_sangre_hidden');

            if (tipoDocHidden && !tipoDocHidden.value) {
                const select = document.getElementById('e_tipo_documento');
                if (select) tipoDocHidden.value = select.value;
            }
            if (generoHidden && !generoHidden.value) {
                const select = document.getElementById('e_genero');
                if (select) generoHidden.value = select.value;
            }
            if (sangreHidden && !sangreHidden.value) {
                const select = document.getElementById('e_tipo_sangre');
                if (select) sangreHidden.value = select.value;
            }
        }
    });

    // ============================================================
    // 5. MEJORAS PARA EL NUEVO MENÚ DE ACCIONES
    // (Añadido para soportar el rediseño de la tabla)
    // ============================================================

    // ===== Cerrar dropdown automáticamente después de una acción =====
    // Cuando el usuario hace clic en una acción del dropdown, el menú se cierra automáticamente
    document.addEventListener('click', function(e) {
        const target = e.target.closest('.dropdown-item');
        if (target) {
            const dropdown = target.closest('.dropdown');
            if (dropdown) {
                const toggle = dropdown.querySelector('[data-bs-toggle="dropdown"]');
                if (toggle) {
                    const bsDropdown = bootstrap.Dropdown.getInstance(toggle);
                    if (bsDropdown) {
                        bsDropdown.hide();
                    }
                }
            }
        }
    });

    // ===== Feedback visual al hacer clic en acciones =====
    // Añade un pequeño efecto de "clic" para mejorar la experiencia de usuario
    document.addEventListener('click', function(e) {
        const target = e.target.closest('.btn-accion-principal, .dropdown-item');
        if (target) {
            target.style.transition = 'transform 0.1s ease';
            target.style.transform = 'scale(0.95)';
            setTimeout(() => {
                target.style.transform = 'scale(1)';
            }, 100);
        }
    });

    // ===== Soporte para teclado en el menú de acciones =====
    // Mejora la accesibilidad permitiendo navegar con teclado
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openDropdowns = document.querySelectorAll('.dropdown.show');
            openDropdowns.forEach(dropdown => {
                const toggle = dropdown.querySelector('[data-bs-toggle="dropdown"]');
                if (toggle) {
                    const bsDropdown = bootstrap.Dropdown.getInstance(toggle);
                    if (bsDropdown) {
                        bsDropdown.hide();
                    }
                }
            });
        }
    });

});