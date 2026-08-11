// =====================================================
// PERFIL EMPLEADO - OPERPAN
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // ELEMENTOS DOM
    // ==========================================

    const btnEditar = document.getElementById("btnEditar");
    const btnEditarTexto = document.getElementById("btnEditarTexto");

    // Contenedores de acciones por pestaña
    const accionesPersonal = document.getElementById("accionesEdicionPersonal");
    const accionesSeguridad = document.getElementById("accionesEdicionSeguridad");

    // Botones de cancelar por pestaña
    const btnCancelarPersonal = document.querySelector(".btnCancelarPersonal");
    const btnCancelarSeguridad = document.querySelector(".btnCancelarSeguridad");

    // Variables de estado
    let valoresOriginales = {};

    // Verificar que el botón Editar existe
    if (!btnEditar) {
        console.error("❌ Botón Editar no encontrado");
        return;
    }

    // ==========================================
    // FUNCIONES AUXILIARES
    // ==========================================

    function ocultarTodasLasAcciones() {
        if (accionesPersonal) accionesPersonal.classList.add("d-none");
        if (accionesSeguridad) accionesSeguridad.classList.add("d-none");
    }

    function mostrarAccionesEnPestanaActiva() {
        const pestañaActiva = document.querySelector(".tab-pane.active");
        if (!pestañaActiva) return;

        // Buscar el contenedor de acciones dentro de la pestaña activa
        const acciones = pestañaActiva.querySelector('[id^="accionesEdicion"]');
        if (acciones) {
            acciones.classList.remove("d-none");
        }
    }

    function guardarValoresOriginales() {
        const campos = document.querySelectorAll(".edit-mode");
        valoresOriginales = {};
        campos.forEach(campo => {
            if (campo.type === 'checkbox' || campo.type === 'radio') {
                valoresOriginales[campo.name] = campo.checked;
            } else {
                valoresOriginales[campo.name] = campo.value;
            }
        });
    }

    function restaurarValoresOriginales() {
        const campos = document.querySelectorAll(".edit-mode");
        campos.forEach(campo => {
            if (campo.name in valoresOriginales) {
                if (campo.type === 'checkbox' || campo.type === 'radio') {
                    campo.checked = valoresOriginales[campo.name];
                } else {
                    campo.value = valoresOriginales[campo.name];
                }
            }
        });
    }

    function entrarModoEdicion() {
        const vistas = document.querySelectorAll(".view-mode");
        const campos = document.querySelectorAll(".edit-mode");

        // Guardar valores originales
        guardarValoresOriginales();

        // Mostrar campos editables, ocultar vistas
        vistas.forEach(vista => vista.classList.add("d-none"));
        campos.forEach(campo => campo.classList.remove("d-none"));

        // Mostrar botones de acción en la pestaña activa
        mostrarAccionesEnPestanaActiva();

        // Cambiar estado del botón Editar
        btnEditar.classList.add("active");
        btnEditarTexto.textContent = "Editando...";
    }

    function salirModoEdicion() {
        const vistas = document.querySelectorAll(".view-mode");
        const campos = document.querySelectorAll(".edit-mode");

        // Restaurar valores originales
        restaurarValoresOriginales();

        // Ocultar campos editables, mostrar vistas
        vistas.forEach(vista => vista.classList.remove("d-none"));
        campos.forEach(campo => campo.classList.add("d-none"));

        // Ocultar todos los botones de acción
        ocultarTodasLasAcciones();

        // Restaurar estado del botón Editar
        btnEditar.classList.remove("active");
        btnEditarTexto.textContent = "Editar";
        valoresOriginales = {};
    }

    // ==========================================
    // EVENTO: CLIC EN "EDITAR1"
    // ==========================================

    btnEditar.addEventListener("click", function(e) {
        e.preventDefault();

        const estaEditando = btnEditar.classList.contains("active");
        if (estaEditando) {
            salirModoEdicion();
        } else {
            entrarModoEdicion();
        }
    });

    // ==========================================
    // EVENTO: CLIC EN "CANCELAR" (Personal)
    // ==========================================

    if (btnCancelarPersonal) {
        btnCancelarPersonal.addEventListener("click", function(e) {
            e.preventDefault();
            salirModoEdicion();
        });
    }

    // ==========================================
    // EVENTO: CLIC EN "CANCELAR" (Seguridad)
    // ==========================================

    if (btnCancelarSeguridad) {
        btnCancelarSeguridad.addEventListener("click", function(e) {
            e.preventDefault();
            salirModoEdicion();
        });
    }

    // ==========================================
    // EVENTO: ENVÍO DEL FORMULARIO (GUARDAR)
    // ==========================================

    const formPerfil = document.getElementById("formPerfil");
    if (formPerfil) {
        formPerfil.addEventListener("submit", function() {
            // Feedback visual al guardar
            btnEditar.classList.remove("active");
            btnEditarTexto.textContent = "Guardando...";
            btnEditar.disabled = true;
            // El formulario se envía normalmente (POST)
            // La página se recargará después del envío
        });
    }

    // ==========================================
    // INICIALIZACIÓN: VERIFICAR ERRORES
    // ==========================================

    const hayErrores = document.querySelector('.is-invalid');
    if (hayErrores) {
        // Si hay errores, mantener el modo edición activo
        document.querySelectorAll('.view-mode').forEach(el => el.classList.add("d-none"));
        document.querySelectorAll('.edit-mode').forEach(el => el.classList.remove("d-none"));
        mostrarAccionesEnPestanaActiva();
        btnEditar.classList.add("active");
        btnEditarTexto.textContent = "Editando...";
    } else {
        // Modo vista normal
        document.querySelectorAll('.view-mode').forEach(el => el.classList.remove("d-none"));
        document.querySelectorAll('.edit-mode').forEach(el => el.classList.add("d-none"));
        ocultarTodasLasAcciones();
        btnEditar.classList.remove("active");
        btnEditarTexto.textContent = "Editar";
        guardarValoresOriginales();
    }

    // ==========================================
    // TABS (SIN CAMBIOS)
    // ==========================================

    const tabs = document.querySelectorAll(".tab-btn-custom");
    const panes = document.querySelectorAll(".tab-pane");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove("active"));
            panes.forEach(p => p.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(target)?.classList.add("active");

            // Si estamos en modo edición, mostrar las acciones en la nueva pestaña activa
            if (btnEditar.classList.contains("active")) {
                ocultarTodasLasAcciones();
                mostrarAccionesEnPestanaActiva();
            }
        });
    });

    // ==========================================
    // DESCARGA DOCUMENTOS (SIN CAMBIOS)
    // ==========================================

    document.querySelectorAll(".descargarBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const documento = btn.dataset.doc;
            console.log(`Descargando documento: ${documento}`);
        });
    });

    console.log("✅ Módulo de información personal cargado correctamente.");
});
