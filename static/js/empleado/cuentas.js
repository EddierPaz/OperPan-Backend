// =====================================================
// PERFIL EMPLEADO - OPERPAN
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // EDITAR PERFIL
    // ==========================================

    const btnEditar = document.getElementById("btnEditar");
    const btnCancelar = document.getElementById("btnCancelar");
    const accionesEdicion = document.getElementById("accionesEdicion");
    const btnEditarTexto = document.getElementById("btnEditarTexto");

    let valoresOriginales = {}; // Guardar valores originales

    if (btnEditar) {

        btnEditar.addEventListener("click", () => {

            const vistas = document.querySelectorAll(".view-mode");
            const campos = document.querySelectorAll(".edit-mode");
            const estaEditando = !campos[0].classList.contains("d-none");

            if (!estaEditando) {
                // Entrar en modo edición - guardar valores originales
                campos.forEach(campo => {
                    if (campo.type === 'checkbox' || campo.type === 'radio') {
                        valoresOriginales[campo.name] = campo.checked;
                    } else {
                        valoresOriginales[campo.name] = campo.value;
                    }
                });

                // Cambiar estado visual del botón
                btnEditar.classList.add("active");
                btnEditarTexto.textContent = "Editando...";
            } else {
                // Salir del modo edición - restaurar estado visual
                btnEditar.classList.remove("active");
                btnEditarTexto.textContent = "Editar";
                valoresOriginales = {};
            }

            vistas.forEach(vista => {
                vista.classList.toggle("d-none");
            });

            campos.forEach(campo => {
                campo.classList.toggle("d-none");
            });

            accionesEdicion?.classList.toggle("d-none");

        });

    }

    // Botón Cancelar - restaurar valores originales
    if (btnCancelar) {

        btnCancelar.addEventListener("click", () => {

            const vistas = document.querySelectorAll(".view-mode");
            const campos = document.querySelectorAll(".edit-mode");

            // Restaurar valores originales
            campos.forEach(campo => {
                if (campo.name in valoresOriginales) {
                    if (campo.type === 'checkbox' || campo.type === 'radio') {
                        campo.checked = valoresOriginales[campo.name];
                    } else {
                        campo.value = valoresOriginales[campo.name];
                    }
                }
            });

            // Restaurar estado visual del botón Editar
            btnEditar.classList.remove("active");
            btnEditarTexto.textContent = "Editar";
            valoresOriginales = {};

            // Volver a modo vista
            vistas.forEach(vista => {
                vista.classList.remove("d-none");
            });

            campos.forEach(campo => {
                campo.classList.add("d-none");
            });

            accionesEdicion?.classList.add("d-none");

        });

    }

    // ==========================================
    // TABS
    // ==========================================

    const tabs = document.querySelectorAll(".tab-btn-custom");
    const panes = document.querySelectorAll(".tab-pane");

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            const target = tab.dataset.tab;

            tabs.forEach(t =>
                t.classList.remove("active")
            );

            panes.forEach(p =>
                p.classList.remove("active")
            );

            tab.classList.add("active");

            document
                .getElementById(target)
                ?.classList.add("active");

        });

    });

    // ==========================================
    // DESCARGA DOCUMENTOS
    // ==========================================

    document
        .querySelectorAll(".descargarBtn")
        .forEach(btn => {

            btn.addEventListener("click", () => {

                const documento =
                    btn.dataset.doc;

                console.log(
                    `Descargando documento: ${documento}`
                );

                // Aquí después puedes conectar
                // la descarga real desde Django

            });

        });

});