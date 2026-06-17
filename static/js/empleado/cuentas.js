// =====================================================
// PERFIL EMPLEADO - OPERPAN
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // EDITAR PERFIL
    // ==========================================

    const btnEditar = document.getElementById("btnEditar");
    const accionesEdicion = document.getElementById("accionesEdicion");

    if (btnEditar) {

        btnEditar.addEventListener("click", () => {

            const vistas = document.querySelectorAll(".view-mode");
            const campos = document.querySelectorAll(".edit-mode");

            vistas.forEach(vista => {
                vista.classList.toggle("d-none");
            });

            campos.forEach(campo => {
                campo.classList.toggle("d-none");
            });

            accionesEdicion?.classList.toggle("d-none");

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