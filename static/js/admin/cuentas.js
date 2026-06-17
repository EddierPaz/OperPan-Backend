const form = document.getElementById('formularioCuenta');
const formEl = document.getElementById('formCuenta');
const btnAbrir = document.getElementById('btnCrearCuenta');
const btnCerrar = document.getElementById('btnCerrarFormulario');
const btnLimpiar = document.getElementById('btnLimpiar');

// ── Abrir en modo CREAR ──────────────────────────────────────
btnAbrir.addEventListener('click', () => modoCrear());

// ── Cerrar ───────────────────────────────────────────────────
btnCerrar.addEventListener('click', () => {
    form.style.display = 'none';
});

// ── Limpiar ──────────────────────────────────────────────────
btnLimpiar.addEventListener('click', () => formEl.reset());

// ── Modo CREAR ───────────────────────────────────────────────
function modoCrear() {
    formEl.reset();
    formEl.action = urlCrear;

    document.getElementById('formTitulo').innerHTML =
        '<i class="bi bi-person-plus-fill me-2"></i> Crear Usuario';
    document.getElementById('btnGuardar').innerHTML =
        '<i class="bi bi-save me-1"></i> Guardar Usuario';

    // Campos no editables → habilitarlos para crear
    setNoEditables(false);

    // Campo estado → oculto al crear (siempre activo)
    document.getElementById('campoEstado').style.display = 'none';

    // Password obligatorio al crear
    document.getElementById('f_password').required = true;

    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Modo EDITAR ──────────────────────────────────────────────
function editarUsuario(btn) {
    const d = btn.closest('tr').dataset;

    formEl.action = `/editar_usuario/${d.id}/`;

    document.getElementById('formTitulo').innerHTML =
        '<i class="bi bi-pencil-square me-2"></i> Editar Usuario';
    document.getElementById('btnGuardar').innerHTML =
        '<i class="bi bi-save me-1"></i> Guardar Cambios';

    // Rellenar campos editables
    document.getElementById('f_primer_nombre').value = d.primerNombre;
    document.getElementById('f_segundo_nombre').value = d.segundoNombre;
    document.getElementById('f_primer_apellido').value = d.primerApellido;
    document.getElementById('f_segundo_apellido').value = d.segundoApellido;
    document.getElementById('f_genero').value = d.genero;
    document.getElementById('f_estado_civil').value = d.estadoCivil;
    document.getElementById('f_tipo_sangre').value = d.tipoSangre;
    document.getElementById('f_telefono').value = d.telefono;
    document.getElementById('f_correo').value = d.correo;
    document.getElementById('f_ciudad').value = d.ciudad;
    document.getElementById('f_direccion').value = d.direccion;
    document.getElementById('f_contacto_emergencia').value = d.contactoEmergencia;
    document.getElementById('f_parentesco_emergencia').value = d.parentescoEmergencia;
    document.getElementById('f_telefono_emergencia').value = d.telefonoEmergencia;
    document.getElementById('f_cargo').value = d.cargo;
    document.getElementById('f_fecha_ingreso').value = d.fechaIngreso;
    document.getElementById('f_eps').value = d.eps;
    document.getElementById('f_arl').value = d.arl;
    document.getElementById('f_fondo_pension').value = d.fondoPension;
    document.getElementById('f_rol').value = d.rol;

    // Campo estado → visible al editar
    document.getElementById('campoEstado').style.display = 'block';
    document.getElementById('f_estado').value = d.estado;

    // Rellenar campos NO editables y deshabilitarlos
    document.getElementById('f_tipo_documento').value = d.tipoDocumento;
    document.getElementById('f_numero_documento').value = d.numeroDocumento;
    document.getElementById('f_fecha_nacimiento').value = d.fechaNacimiento;
    document.getElementById('f_username').value = d.username;
    setNoEditables(true);

    // Password no requerido al editar
    document.getElementById('f_password').required = false;
    document.getElementById('f_password').value = '';
    document.getElementById('f_password').placeholder = 'No editable aquí';

    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Habilitar / deshabilitar campos no editables ─────────────
function setNoEditables(disabled) {
    ['f_tipo_documento', 'f_numero_documento', 'f_fecha_nacimiento', 'f_username', 'f_password']
        .forEach(id => {
            const el = document.getElementById(id);
            el.disabled = disabled;
        });
}

// ── Abrir automáticamente si hay mensajes ────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (form.dataset.open === 'true') {
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
