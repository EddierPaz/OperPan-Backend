// ============================================================
// USUARIOS - MODALES Y FILTROS (CON TOASTS Y VALIDACIONES)
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // 0. SISTEMA DE TOASTS Y LECTURA DE MENSAJES
    // ==========================================
    function showToast(message, type = 'danger') {
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion(message, type);
        }
    }

    // Leer mensajes de Django inyectados en el HTML
    const msgScript = document.getElementById('django-messages');
    if (msgScript) {
        try {
            const messages = JSON.parse(msgScript.textContent);
            messages.forEach(msg => {
                let type = 'info';
                if (msg.tags.includes('error')) type = 'danger';
                else if (msg.tags.includes('success')) type = 'success';
                else if (msg.tags.includes('warning')) type = 'warning';
                showToast(msg.text, type);
            });
        } catch (e) {
            console.error("Error parsing messages", e);
        }
    }

    // ==========================================
    // 1. LÓGICA DEL DROPDOWN DE CIUDAD
    // ==========================================
    const selectCiudad = document.getElementById('c_ciudad');
    const inputCiudadOtra = document.getElementById('c_ciudad_otra');

    if (selectCiudad && inputCiudadOtra) {
        selectCiudad.addEventListener('change', function() {
            if (this.value === 'Otra') {
                inputCiudadOtra.classList.remove('d-none');
                inputCiudadOtra.required = true;
                inputCiudadOtra.setAttribute('name', 'ciudad'); // Toma el control
                selectCiudad.removeAttribute('name'); // El select pierde el nombre para no enviarse
            } else {
                inputCiudadOtra.classList.add('d-none');
                inputCiudadOtra.required = false;
                inputCiudadOtra.removeAttribute('name');
                selectCiudad.setAttribute('name', 'ciudad');
            }
        });
    }

        // [19/11/2026] Calcular dinámicamente los límites del calendario (16 a 80 años)
    function calcularFechasLimiteNacimiento() {
        const today = new Date();
        // Límite superior (edad mínima de 16 años)
        const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
        // Límite inferior (edad máxima de 80 años)
        const minDate = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate());

        const formatDate = (date) => {
            const d = new Date(date);
            let month = '' + (d.getMonth() + 1);
            let day = '' + d.getDate();
            const year = d.getFullYear();
            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;
            return [year, month, day].join('-');
        };

        const cFnac = document.getElementById('c_fecha_nacimiento');
        if (cFnac) {
            cFnac.setAttribute('min', formatDate(minDate));
            cFnac.setAttribute('max', formatDate(maxDate));
        }
        
        const eFnac = document.getElementById('e_fecha_nacimiento');
        if (eFnac) {
            eFnac.setAttribute('min', formatDate(minDate));
            eFnac.setAttribute('max', formatDate(maxDate));
        }
    }
    calcularFechasLimiteNacimiento();

        // ==========================================
    // 2. VALIDACIONES EN TIEMPO REAL Y ENVÍO POR AJAX
    // ==========================================
    const formCrear = document.getElementById('formCrearUsuario');
    
    if (formCrear) {
        formCrear.addEventListener('submit', function(e) {
            // [19/11/2026] Prevenimos SIEMPRE el envío tradicional.
            // Esto evita que la página se recargue, el modal se cierre y se pierdan los datos.
            e.preventDefault(); 
            
            let errors = [];
            
            // Función auxiliar para obtener el valor de un input y limpiar espacios en blanco
            const getVal = id => document.getElementById(id).value.trim() || '';

            // ------------------------------------------
            // VALIDACIÓN DE NOMBRES Y APELLIDOS
            // ------------------------------------------
            // Expresión regular que permite letras (con tildes y ñ), espacios y guiones.
            
            const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-]+$/;
            
            const primerNombre = getVal('c_primer_nombre');
            if (primerNombre.length < 3 || !nameRegex.test(primerNombre)) {
                errors.push("El primer nombre es inválido (mínimo 3 letras, sin números).");
            }
            
            const primerApellido = getVal('c_primer_apellido');
            if (primerApellido.length < 3 || !nameRegex.test(primerApellido)) {
                errors.push("El primer apellido es inválido (mínimo 3 letras, sin números).");
            }

            // ------------------------------------------
            // VALIDACIÓN DE DOCUMENTO
            // ------------------------------------------
            const doc = getVal('c_numero_documento');
            // [22/11/2026] Exactamente entre 6 y 10 dígitos
            if (!/^\d{6,10}$/.test(doc)) {
                errors.push("El número de documento debe tener entre 6 y 10 números.");
            }

            // ------------------------------------------
            // VALIDACIÓN DE CORREO ELECTRÓNICO
            // ------------------------------------------
            const correo = getVal('c_correo');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                errors.push("El correo electrónico no tiene un formato válido.");
            }

            // ------------------------------------------
            // VALIDACIÓN DE TELÉFONOS
            // ------------------------------------------
            ['c_telefono', 'c_telefono_emergencia'].forEach(id => {
                const val = getVal(id);
                // [22/11/2026] Exactamente 10 dígitos
                if (val && (!/^\d+$/.test(val) || val.length !== 10)) {
                    errors.push("Los teléfonos deben tener exactamente 10 números.");
                }
            });

            // ------------------------------------------
            // VALIDACIÓN DE DIRECCIÓN (Universal y Flexible)
            // ------------------------------------------
            const dir = getVal('c_direccion');

            if (dir.length < 10 || dir.length > 100) {
                errors.push("La dirección debe tener entre 10 y 100 caracteres.");
            } else {
                // REGLA UNIVERSAL:
                // 1. Acepta vías: CL, CALLE, KR, CR, CARRERA, AV, etc.
                // 2. Exige al menos un número al principio.
                // 3. Permite letras, espacios, guiones o la letra 'A' entre los números.
                // 4. Exige el '#'.
                // 5. Al final permite letras (como SUR) o guiones.
                const patronDireccion = /^(CL|CALLE|KR|CR|CARRERA|AV|AC|AVENIDA|AUTOPISTA|TRANSVERSAL|TV|DIAGONAL|DG)\s*[\d\w\s\-]+#\s*[\d\w\s\-]+$/i;
                
                if (!patronDireccion.test(dir)) {
                    console.log("Falló la dirección:", `"${dir}"`); // Para depurar en consola F12
                    errors.push("Dirección inválida. Asegúrate de incluir el numeral (#). Ejemplo: 'CR 9 A 13C #15 SUR' o 'Calle 6 # 6-64'.");
                }
            }

            // ------------------------------------------
            // VALIDACIÓN DE FECHAS Y EDAD (16 a 80 años)
            // ------------------------------------------
            const fnacVal = getVal('c_fecha_nacimiento');
            const fingVal = getVal('c_fecha_ingreso');
            
            if (!fnacVal || !fingVal) {
                errors.push("Debe ingresar las fechas de nacimiento e ingreso.");
            } else {
                const fnac = new Date(fnacVal);
                const fing = new Date(fingVal);
                const today = new Date();

                // Comprobar que ninguna fecha esté en el futuro
                if (fnac > today) errors.push("La fecha de nacimiento no puede ser futura.");
                if (fing > today) errors.push("La fecha de ingreso no puede ser futura.");

                // Cálculo exacto de la edad actual
                let age = today.getFullYear() - fnac.getFullYear();
                const m = today.getMonth() - fnac.getMonth();
                // Si aún no ha pasado el mes de cumpleaños, o es el mismo mes pero no el día, le restamos 1 año
                if (m < 0 || (m === 0 && today.getDate() < fnac.getDate())) age--;

                if (age < 16) {
                    errors.push("El empleado debe tener mínimo 16 años de edad.");
                } else if (age > 80) {
                    errors.push("La fecha de nacimiento no es válida (excede los 80 años).");
                }

                // Cálculo de la edad que tenía el empleado en la fecha de ingreso
                let ageIngreso = fing.getFullYear() - fnac.getFullYear();
                const mIngreso = fing.getMonth() - fnac.getMonth();
                if (mIngreso < 0 || (mIngreso === 0 && fing.getDate() < fnac.getDate())) ageIngreso--;

                if (ageIngreso < 16) {
                    errors.push("La fecha de ingreso indica que el empleado tenía menos de 16 años.");
                }
            }

            // ------------------------------------------
            // EVALUACIÓN DE ERRORES FRONTEND
            // ------------------------------------------
            if (errors.length > 0) {
                // Si hay errores, mostramos máximo 3 Toasts para no saturar la pantalla
                errors.slice(0, 3).forEach(err => showToast(err, 'danger'));
                if (errors.length > 3) {
                    showToast("Y hay más errores en el formulario...", "danger");
                }
                // Detenemos la ejecución aquí. No se envía nada al servidor.
                return; 
            }

            // ------------------------------------------
            // ENVÍO POR AJAX (FETCH)
            // ------------------------------------------
            // Si el código llega hasta aquí, significa que el frontend está limpio.
            // Procedemos a enviar los datos al backend.

            const submitBtn = document.querySelector('button[form="formCrearUsuario"]');
            const originalBtnText = submitBtn.innerHTML;
            
            // Feedback visual: bloqueamos el botón para evitar doble clic y avisamos que está cargando
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';

            // Empaquetamos todos los datos del formulario, incluyendo el token CSRF
            const formData = new FormData(formCrear);

            // Realizamos la petición asíncrona a la URL definida en el action del form
            fetch(formCrear.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest' // Le indica a Django que es una petición AJAX
                }
            })
            .then(response => response.json()) // Convertimos la respuesta del backend a JSON
            .then(data => {
                if (data.status === 'success') {
                    // Caso exitoso: Mostramos Toast verde y recargamos la página tras 1.5s
                    // para que el usuario vea el mensaje y la tabla se actualice.
                    showToast(data.message, 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    // Caso de error desde el Backend (ej. Usuario duplicado en la BD):
                    // Reactivamos el botón y mostramos los errores que envió Django.
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    
                    // El backend envía un array de errores. Los mostramos en Toasts.
                    data.errors.forEach(err => showToast(err, 'danger'));
                }
            })
            .catch(error => {
                // Caso de error de red o de servidor caído
                console.error("Error en la petición Fetch:", error);
                showToast("Ocurrió un error inesperado al comunicarse con el servidor.", "danger");
                
                // Restauramos el botón en caso de fallo
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            });
        });
    }

    // ==========================================
    // 3. DELEGACIÓN DE EVENTOS (Ver, Editar, etc.)
    // ==========================================
    document.addEventListener('click', function(e) {
        // ===== VER USUARIO =====
        const btnVer = e.target.closest('.btn-ver-usuario');
        if (btnVer) {
            const tr = btnVer.closest('tr'); 
            if (!tr) return;
            const d = tr.dataset;

            const tiposDoc = { 'CC': 'Cédula de Ciudadanía', 'CE': 'Cédula de Extranjería', 'TI': 'Tarjeta de Identidad', 'PPT': 'Permiso por Protección Temporal' };
            const generos = { 'M': 'Masculino', 'F': 'Femenino', 'O': 'Otro' };
            const estadosCiviles = { 'soltero': 'Soltero', 'casado': 'Casado', 'union_libre': 'Unión Libre', 'divorciado': 'Divorciado', 'viudo': 'Viudo' };
            const cargos = { 'mesero': 'Mesero', 'cajero': 'Cajero', 'pastelero': 'Pastelero', 'panadero': 'Panadero', 'cocina': 'Cocina', 'buñuelero': 'Buñuelero', 'greca': 'Greca' };
            const roles = { 'admin': 'Administrador', 'empleado': 'Empleado' };
            const estadosLaborales = { 'activo': 'Activo', 'retirado': 'Retirado' };
            const estadosCuenta = { 'PENDIENTE': 'Pendiente', 'ACTIVA': 'Activa', 'INACTIVA': 'Inactiva' };

            const nombreCompleto = [d.primerNombre || '', d.segundoNombre || '', d.primerApellido || '', d.segundoApellido || ''].filter(Boolean).join(' ');

            const campos = {
                'v_nombre_completo': nombreCompleto || '-', 'v_tipo_documento': tiposDoc[d.tipoDocumento] || d.tipoDocumento || '-',
                'v_numero_documento': d.numeroDocumento || '-', 'v_fecha_nacimiento': d.fechaNacimiento || '-',
                'v_genero': generos[d.genero] || d.genero || '-', 'v_estado_civil': estadosCiviles[d.estadoCivil] || d.estadoCivil || '-',
                'v_tipo_sangre': d.tipoSangre || '-', 'v_telefono': d.telefono || '-', 'v_correo': d.correo || '-',
                'v_ciudad': d.ciudad || '-', 'v_direccion': d.direccion || '-', 'v_contacto_emergencia': d.contactoEmergencia || '-',
                'v_parentesco_emergencia': d.parentescoEmergencia || '-', 'v_telefono_emergencia': d.telefonoEmergencia || '-',
                'v_cargo': cargos[d.cargo] || d.cargo || '-', 'v_fecha_ingreso': d.fechaIngreso || '-',
                'v_eps': d.eps || '-', 'v_arl': d.arl || '-', 'v_fondo_pension': d.fondoPension || '-',
                'v_username': d.username || '-', 'v_rol': roles[d.rol] || d.rol || '-', 'v_estado': estadosLaborales[d.estado] || d.estado || '-',
                'v_estado_cuenta': estadosCuenta[d.estadoCuenta] || d.estadoCuenta || '-'
            };

            for (const [id, valor] of Object.entries(campos)) {
                const el = document.getElementById(id);
if (el) el.textContent = typeof valor === 'string' ? valor.trim() : valor;
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
                'e_primer_nombre': d.primerNombre || '', 'e_segundo_nombre': d.segundoNombre || '',
                'e_primer_apellido': d.primerApellido || '', 'e_segundo_apellido': d.segundoApellido || '',
                'e_estado_civil': d.estadoCivil || '', 'e_telefono': d.telefono || '', 'e_correo': d.correo || '',
                'e_ciudad': d.ciudad || '', 'e_direccion': d.direccion || '', 'e_contacto_emergencia': d.contactoEmergencia || '',
                'e_parentesco_emergencia': d.parentescoEmergencia || '', 'e_telefono_emergencia': d.telefonoEmergencia || '',
                'e_cargo': d.cargo || '', 'e_eps': d.eps || '', 'e_arl': d.arl || '', 'e_fondo_pension': d.fondoPension || '',
                'e_username': d.username || '', 'e_rol': d.rol || ''
            };

            for (const [id, valor] of Object.entries(camposEditables)) {
                const el = document.getElementById(id);
                if (el) el.value = valor;
            }

            // Campos ocultos y readonly de edición
            document.getElementById('e_tipo_documento').value = d.tipoDocumento || '';
            document.getElementById('e_tipo_documento_hidden').value = d.tipoDocumento || '';
            document.getElementById('e_numero_documento').value = d.numeroDocumento || '';
            document.getElementById('e_fecha_nacimiento').value = d.fechaNacimiento || '';
            document.getElementById('e_genero').value = d.genero || '';
            document.getElementById('e_genero_hidden').value = d.genero || '';
            document.getElementById('e_tipo_sangre').value = d.tipoSangre || '';
            document.getElementById('e_tipo_sangre_hidden').value = d.tipoSangre || '';
            document.getElementById('e_fecha_ingreso').value = d.fechaIngreso || '';

            new bootstrap.Modal(document.getElementById('modalEditarUsuario')).show();
        }

        // ===== RETIRAR =====
        const btnRetirar = e.target.closest('.btn-retirar-usuario');
        if (btnRetirar) {
            document.getElementById('formRetirarUsuario').action = '/admi/users/' + btnRetirar.dataset.id + '/retirar/';
            document.getElementById('retirar_usuario_nombre').textContent = btnRetirar.dataset.nombre || 'usuario';
            document.getElementById('retirar_motivo').value = '';
            new bootstrap.Modal(document.getElementById('modalRetirarUsuario')).show();
        }

        // ===== REINCORPORAR =====
        const btnReactivarRetiro = e.target.closest('.btn-reactivar-retiro-usuario');
        if (btnReactivarRetiro) {
            document.getElementById('formReactivarRetiroUsuario').action = '/admi/users/' + btnReactivarRetiro.dataset.id + '/reactivar-retiro/';
            document.getElementById('reactivar_retiro_usuario_nombre').textContent = btnReactivarRetiro.dataset.nombre || 'usuario';
            new bootstrap.Modal(document.getElementById('modalReactivarRetiroUsuario')).show();
        }

        // ===== REENVIAR CREDENCIALES =====
        const btnCredenciales = e.target.closest('.btn-credenciales-usuario');
        if (btnCredenciales) {
            document.getElementById('formEnviarCredenciales').action = '/admi/users/' + btnCredenciales.dataset.id + '/enviar-credenciales/';
            document.getElementById('credenciales_usuario_nombre').textContent = btnCredenciales.dataset.nombre || 'usuario';
            new bootstrap.Modal(document.getElementById('modalEnviarCredenciales')).show();
        }

        // ===== ELIMINAR =====
        const btnEliminar = e.target.closest('.btn-eliminar-usuario');
        if (btnEliminar) {
            document.getElementById('formEliminarUsuario').action = '/admi/users/' + btnEliminar.dataset.id + '/delete/';
            document.getElementById('eliminar_usuario_nombre').textContent = btnEliminar.dataset.nombre || 'usuario';
            new bootstrap.Modal(document.getElementById('modalEliminarUsuario')).show();
        }
    });

    // ==========================================
    // 4. FILTROS DE BÚSQUEDA 
    // ==========================================
    const inputBuscar = document.getElementById('buscarCuenta');
    const filtroCargo = document.getElementById('filtroCargo');
    const filtroRol = document.getElementById('filtroRol');
    const filtroEstadoCuenta = document.getElementById('filtroEstadoCuenta');
    const btnLimpiar = document.getElementById('limpiarFiltrosCuentas');

    function aplicarFiltros() {
const texto = inputBuscar ? inputBuscar.value.trim().toLowerCase() : '';
const cargo = filtroCargo ? filtroCargo.value.toLowerCase() : '';
const rol = filtroRol ? filtroRol.value.toLower() : '';
const estadoCuenta = filtroEstadoCuenta ? filtroEstadoCuenta.value.trim() : '';

        const filas = document.querySelectorAll('#tablaUsuarios tbody tr[data-id]');
        filas.forEach(fila => {
            const d = fila.dataset;
            const nombreCompleto = [d.primerNombre || '', d.segundoNombre || '', d.primerApellido || '', d.segundoApellido || ''].filter(Boolean).join(' ').toLowerCase();
            const documento = (d.numeroDocumento || '').toLowerCase();
            const usuario = (d.username || '').toLowerCase();
            const cargoFila = (d.cargo || '').toLowerCase();
            const rolFila = (d.rol || '').toLowerCase();
            const estadoCuentaFila = (d.estadoCuenta || '').trim();

            const coincideTexto = !texto || documento.includes(texto) || usuario.includes(texto) || nombreCompleto.includes(texto);
            const coincideCargo = !cargo || cargoFila === cargo.trim();
            const coincideRol = !rol || rolFila === rol.trim();
            const coincideEstadoCuenta = !estadoCuenta || estadoCuentaFila === estadoCuenta;

fila.style.display = (coincideTexto && coincideCargo && coincideRol && coincideEstadoCuenta) ? '' : 'none';
        });
    }

    if (inputBuscar || filtroCargo || filtroRol || filtroEstadoCuenta) {
        [inputBuscar, filtroCargo, filtroRol, filtroEstadoCuenta].forEach(el => {
            if (el) { el.addEventListener('input', aplicarFiltros); el.addEventListener('change', aplicarFiltros); }
        });
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', function() {
                if (inputBuscar) inputBuscar.value = '';
                if (filtroCargo) filtroCargo.value = '';
                if (filtroRol) filtroRol.value = '';
                if (filtroEstadoCuenta) filtroEstadoCuenta.value = '';
                aplicarFiltros();
            });
        }
    }

    // ==========================================
    // 5. LIMPIAR FORMULARIO DE CREACIÓN
    // ==========================================
    const btnLimpiarCrear = document.getElementById('btnLimpiarCrear');
    if (btnLimpiarCrear) {
        btnLimpiarCrear.addEventListener('click', function(e) {
            e.preventDefault();
            if (formCrear) {
                formCrear.reset();
                formCrear.querySelectorAll('select').forEach(select => { select.selectedIndex = 0; });
                if (inputCiudadOtra) {
                    inputCiudadOtra.classList.add('d-none');
                    inputCiudadOtra.required = false;
                    inputCiudadOtra.removeAttribute('name');
                }
                if (selectCiudad) selectCiudad.setAttribute('name', 'ciudad');
            }
        });
    }

    // ==========================================
    // 6. PREVENIR ENVÍO DE CAMPOS DISABLED (EDITAR)
    // ==========================================
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'formEditarUsuario') {
            const hiddenFields = ['e_tipo_documento_hidden', 'e_genero_hidden', 'e_tipo_sangre_hidden'];
            hiddenFields.forEach(id => {
                const hidden = document.getElementById(id);
                if (hidden && !hidden.value) {
                    const select = document.getElementById(id.replace('_hidden', ''));
                    if (select) hidden.value = select.value;
                }
            });
        }
    });

    // ==========================================
    // 7. LÓGICA DE VALIDACIÓN PPT
    // ==========================================
    const selectCrear = document.getElementById('c_tipo_documento');
    const inputCrear = document.getElementById('c_numero_documento');

    if (selectCrear && inputCrear) {
        selectCrear.addEventListener('change', function() {
            if (this.value === 'PPT') {
                inputCrear.maxLength = 7;
                inputCrear.placeholder = "Solo 7 números";
            } else {
                inputCrear.maxLength = 20;
                inputCrear.placeholder = "";
            }
        });

        inputCrear.addEventListener('input', function() {
            if (selectCrear.value === 'PPT') {
                this.value = this.value.replace(/[^0-9]/g, '');
            }
        });
    }

    const selectEditar = document.getElementById('e_tipo_documento');
    const inputEditar = document.getElementById('e_numero_documento');

    if (selectEditar && inputEditar) {
        selectEditar.addEventListener('change', function() {
            if (this.value === 'PPT') {
                inputEditar.maxLength = 7;
                inputEditar.placeholder = "Solo 7 números";
            } else {
                inputEditar.maxLength = 20;
                inputEditar.placeholder = "";
            }
        });

        inputEditar.addEventListener('input', function() {
            if (selectEditar.value === 'PPT') {
                this.value = this.value.replace(/[^0-9]/g, '');
            }
        });
    }

});