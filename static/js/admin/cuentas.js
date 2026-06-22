const form = document.getElementById('formularioCuenta');   // contenedor
const formEl = document.getElementById('formCuenta');       // formulario

const btnAbrir = document.getElementById('btnCrearCuenta');
const btnCerrar = document.getElementById('btnCerrarFormulario');
const btnLimpiar = document.getElementById('btnLimpiar');

// ===============================
// EVENTOS BASE
// ===============================
btnAbrir.addEventListener('click', modoCrear);

btnCerrar.addEventListener('click', () => {
    form.style.display = 'none';
});

btnLimpiar.addEventListener('click', () => formEl.reset());

// ===============================
// MODO CREAR
// ===============================
function modoCrear() {
    formEl.reset();
    formEl.action = urlCrear;

    document.getElementById('formTitulo').innerHTML =
        '<i class="bi bi-person-plus-fill me-2"></i> Crear Usuario';

    document.getElementById('btnGuardar').innerHTML =
        '<i class="bi bi-save me-1"></i> Guardar Usuario';

    // habilitar todo
    setNoEditables(false);
    bloquearFormulario(false);

    document.getElementById('campoEstado').style.display = 'none';

    document.getElementById('f_password').required = true;

    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
}

// ===============================
// MODO EDITAR
// ===============================
function editarUsuario(btn) {
    const fila = btn.closest("tr");
    const d = fila.dataset;

    formEl.action = `/admi/users/${d.id}/update/`;

    document.getElementById('formTitulo').innerHTML =
        '<i class="bi bi-pencil-square me-2"></i> Editar Usuario';

    document.getElementById('btnGuardar').innerHTML =
        '<i class="bi bi-save me-1"></i> Guardar Cambios';

    llenarFormulario(fila);

    setNoEditables(true);
    bloquearFormulario(false);

    document.getElementById('campoEstado').style.display = 'block';
    document.getElementById('f_estado').value = d.estado;

    document.getElementById('f_password').required = false;
    document.getElementById('f_password').value = '';
    document.getElementById('f_password').placeholder = 'No editable';

    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
}

// ===============================
// MODO VER (solo lectura)
// ===============================
function verUsuario(btn) {
    const fila = btn.closest("tr");

    llenarFormulario(fila);

    bloquearFormulario(true); // bloquea todo
    document.getElementById('btnGuardar').style.display = "none";
    document.getElementById('campoEstado').style.display = 'block';

    form.style.display = "block";
    form.scrollIntoView({ behavior: 'smooth' });
}

// ===============================
// LLENAR FORMULARIO (ÚNICA FUNCIÓN)
// ===============================
function llenarFormulario(fila) {
    const d = fila.dataset;

    document.getElementById("f_primer_nombre").value = d.primerNombre;
    document.getElementById("f_segundo_nombre").value = d.segundoNombre;
    document.getElementById("f_primer_apellido").value = d.primerApellido;
    document.getElementById("f_segundo_apellido").value = d.segundoApellido;

    document.getElementById("f_tipo_documento").value = d.tipoDocumento;
    document.getElementById("f_numero_documento").value = d.numeroDocumento;
    document.getElementById("f_fecha_nacimiento").value = d.fechaNacimiento;

    document.getElementById("f_genero").value = d.genero;
    document.getElementById("f_estado_civil").value = d.estadoCivil;
    document.getElementById("f_tipo_sangre").value = d.tipoSangre;

    document.getElementById("f_telefono").value = d.telefono;
    document.getElementById("f_correo").value = d.correo;
    document.getElementById("f_ciudad").value = d.ciudad;
    document.getElementById("f_direccion").value = d.direccion;

    document.getElementById("f_contacto_emergencia").value = d.contactoEmergencia;
    document.getElementById("f_parentesco_emergencia").value = d.parentescoEmergencia;
    document.getElementById("f_telefono_emergencia").value = d.telefonoEmergencia;

    document.getElementById("f_cargo").value = d.cargo;
    document.getElementById("f_fecha_ingreso").value = d.fechaIngreso;
    document.getElementById("f_eps").value = d.eps;
    document.getElementById("f_arl").value = d.arl;
    document.getElementById("f_fondo_pension").value = d.fondoPension;

    document.getElementById("f_username").value = d.username;
    document.getElementById("f_rol").value = d.rol;
}

// ===============================
// BLOQUEAR / DESBLOQUEAR FORM
// ===============================
function bloquearFormulario(bloquear) {
    const inputs = document.querySelectorAll("#formCuenta input, #formCuenta select");

    inputs.forEach(input => {
        input.disabled = bloquear;
    });

    document.getElementById("btnGuardar").style.display =
        bloquear ? "none" : "inline-block";
}

// ===============================
// CAMPOS NO EDITABLES
// ===============================
function setNoEditables(disabled) {
    ['f_tipo_documento', 'f_numero_documento', 'f_fecha_nacimiento', 'f_username', 'f_password']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = disabled;
        });
}

// ===============================
// AUTO ABRIR SI HAY MENSAJES
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    if (form.dataset.open === 'true') {
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
    }
});