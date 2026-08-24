// ============================================================
// USUARIOS - MODALES Y FILTROS
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // 1. DELEGACIÓN DE EVENTOS (Ver, Editar, Eliminar)
    // ==========================================
    document.addEventListener('click', function(e) {

        // ===== VER USUARIO =====
        const btnVer = e.target.closest('.btn-ver-usuario');
        if (btnVer) {
            const tr = btnVer.closest('tr');
            if (!tr) return;
            const d = tr.dataset;
            
            // Mapeo de valores para mostrar
            const tiposDoc = { 'CC': 'Cédula de Ciudadanía', 'CE': 'Cédula de Extranjería', 'TI': 'Tarjeta de Identidad', 'PA': 'Pasaporte' };
            const generos = { 'M': 'Masculino', 'F': 'Femenino', 'O': 'Otro' };
            const estadosCiviles = { 'soltero': 'Soltero', 'casado': 'Casado', 'union_libre': 'Unión Libre', 'divorciado': 'Divorciado', 'viudo': 'Viudo' };
            const cargos = { 'mesero': 'Mesero', 'cajero': 'Cajero', 'pastelero': 'Pastelero', 'panadero': 'Panadero', 'cocina': 'Cocina', 'buñuelero': 'Buñuelero', 'greca': 'Greca' };
            const roles = { 'admin': 'Administrador', 'empleado': 'Empleado' };
            const estados = { 'activo': 'Activo', 'suspendido': 'Suspendido', 'retirado': 'Retirado' };
            
            // Construir nombre completo
            const nombreCompleto = [
                d.primerNombre || '',
                d.segundoNombre || '',
                d.primerApellido || '',
                d.segundoApellido || ''
            ].filter(Boolean).join(' ');
            
            // Llenar campos de vista (usando textContent)
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
                'v_estado': estados[d.estado] || d.estado || '-'
            };
            
            for (const [id, valor] of Object.entries(campos)) {
                const el = document.getElementById(id);
                if (el) el.textContent = valor.trim();
            }
            
            const modalEl = document.getElementById('modalVerUsuario');
            if (modalEl) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            }
        }

        // ===== EDITAR USUARIO =====
        const btnEditar = e.target.closest('.btn-editar-usuario');
        if (btnEditar) {
            const tr = btnEditar.closest('tr');
            if (!tr) return;
            const id = tr.dataset.id;
            const d = tr.dataset;
            
            // Configurar acción del formulario
            const form = document.getElementById('formEditarUsuario');
            if (form) {
                form.action = '/usuarios/' + id + '/update/';
            }
            
            // ==========================================
            // CAMPOS EDITABLES (con .value)
            // ==========================================
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
                'e_estado': d.estado || 'activo',
                'e_username': d.username || '',
                'e_rol': d.rol || ''
            };
            
            for (const [id, valor] of Object.entries(camposEditables)) {
                const el = document.getElementById(id);
                if (el) el.value = valor;
            }
            
            // ==========================================
            // CAMPOS SOLO LECTURA (disabled + hidden)
            // ==========================================
            // Tipo Documento (disabled + hidden)
            const tipoDocSelect = document.getElementById('e_tipo_documento');
            const tipoDocHidden = document.getElementById('e_tipo_documento_hidden');
            if (tipoDocSelect) {
                tipoDocSelect.value = d.tipoDocumento || '';
            }
            if (tipoDocHidden) {
                tipoDocHidden.value = d.tipoDocumento || '';
            }
            
            // Número Documento (readonly)
            const numDocInput = document.getElementById('e_numero_documento');
            if (numDocInput) {
                numDocInput.value = d.numeroDocumento || '';
            }
            
            // Fecha Nacimiento (readonly)
            const fechaNacInput = document.getElementById('e_fecha_nacimiento');
            if (fechaNacInput) {
                fechaNacInput.value = d.fechaNacimiento || '';
            }
            
            // Género (disabled + hidden)
            const generoSelect = document.getElementById('e_genero');
            const generoHidden = document.getElementById('e_genero_hidden');
            if (generoSelect) {
                generoSelect.value = d.genero || '';
            }
            if (generoHidden) {
                generoHidden.value = d.genero || '';
            }
            
            // Tipo Sangre (disabled + hidden)
            const sangreSelect = document.getElementById('e_tipo_sangre');
            const sangreHidden = document.getElementById('e_tipo_sangre_hidden');
            if (sangreSelect) {
                sangreSelect.value = d.tipoSangre || '';
            }
            if (sangreHidden) {
                sangreHidden.value = d.tipoSangre || '';
            }
            
            // Fecha Ingreso (readonly)
            const fechaIngresoInput = document.getElementById('e_fecha_ingreso');
            if (fechaIngresoInput) {
                fechaIngresoInput.value = d.fechaIngreso || '';
            }
            
            // ==========================================
            // LIMPIAR CONTRASEÑA (siempre vacío)
            // ==========================================
            const passInput = document.getElementById('e_password');
            if (passInput) {
                passInput.value = '';
            }
            
            // Mostrar modal
            const modalEl = document.getElementById('modalEditarUsuario');
            if (modalEl) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            }
        }

        // ===== ELIMINAR USUARIO =====
        const btnEliminar = e.target.closest('.btn-eliminar-usuario');
        if (btnEliminar) {
            const tr = btnEliminar.closest('tr');
            if (!tr) return;
            const id = tr.dataset.id;
            const nombre = btnEliminar.dataset.nombre || 'usuario';
            
            const form = document.getElementById('formEliminarUsuario');
            if (form) {
                form.action = '/usuarios/' + id + '/eliminar/';
            }
            
            const nombreSpan = document.getElementById('eliminar_usuario_nombre');
            if (nombreSpan) {
                nombreSpan.textContent = nombre;
            }
            
            const modalEl = document.getElementById('modalEliminarUsuario');
            if (modalEl) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            }
        }
    });

    // ==========================================
    // 2. FILTROS DE BÚSQUEDA
    // ==========================================
    const inputBuscar = document.getElementById('buscarCuenta');
    const filtroCargo = document.getElementById('filtroCargo');
    const filtroRol = document.getElementById('filtroRol');
    const filtroEstado = document.getElementById('filtroEstado');
    const btnLimpiar = document.getElementById('limpiarFiltrosCuentas');

    if (inputBuscar) {
        function aplicarFiltros() {
            const texto = inputBuscar.value.trim().toLowerCase();
            const cargo = filtroCargo ? filtroCargo.value.toLowerCase() : '';
            const rol = filtroRol ? filtroRol.value.toLowerCase() : '';
            const estado = filtroEstado ? filtroEstado.value.toLowerCase() : '';
            
            const filas = document.querySelectorAll('#tablaUsuarios tbody tr[data-id]');
            filas.forEach(fila => {
                const d = fila.dataset;
                
                // Construir nombre completo para búsqueda
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
                const estadoFila = (d.estado || '').toLowerCase();
                
                const coincideTexto = !texto || 
                    documento.includes(texto) || 
                    usuario.includes(texto) || 
                    nombreCompleto.includes(texto);
                
                const coincideCargo = !cargo || cargoFila === cargo;
                const coincideRol = !rol || rolFila === rol;
                const coincideEstado = !estado || estadoFila === estado;
                
                fila.style.display = (coincideTexto && coincideCargo && coincideRol && coincideEstado) ? '' : 'none';
            });
        }

        // Event listeners para filtros
        [inputBuscar, filtroCargo, filtroRol, filtroEstado].forEach(el => {
            if (el) {
                el.addEventListener('input', aplicarFiltros);
                el.addEventListener('change', aplicarFiltros);
            }
        });

        // Botón limpiar filtros
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', function() {
                inputBuscar.value = '';
                if (filtroCargo) filtroCargo.value = '';
                if (filtroRol) filtroRol.value = '';
                if (filtroEstado) filtroEstado.value = '';
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
                // Limpiar campos ocultos o especiales si es necesario
                const selects = form.querySelectorAll('select');
                selects.forEach(select => {
                    select.selectedIndex = 0;
                });
            }
        });
    }

    // ==========================================
    // 4. PREVENIR ENVÍO DE CAMPOS DISABLED
    // ==========================================
    // Los campos disabled no se envían, pero tenemos hidden inputs
    // que sí se envían con los valores correctos.
    // Esto asegura que el backend reciba todos los datos.
    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.id === 'formEditarUsuario') {
            // Asegurar que los hidden inputs tengan los valores correctos
            const tipoDocHidden = document.getElementById('e_tipo_documento_hidden');
            const generoHidden = document.getElementById('e_genero_hidden');
            const sangreHidden = document.getElementById('e_tipo_sangre_hidden');
            
            // Si el hidden está vacío, tomar del select disabled
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
});