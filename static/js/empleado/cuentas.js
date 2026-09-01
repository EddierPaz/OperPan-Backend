// =====================================================
// PERFIL EMPLEADO - OPERPAN
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // PESTAÑAS PRINCIPALES (Personal / Laboral / Seguridad)
    // ==========================================
    const tabs = document.querySelectorAll(".custom-tabs-modern button[data-tab]");
    const panes = document.querySelectorAll(".employee-card > .tab-pane");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove("active"));
            panes.forEach(p => p.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(target)?.classList.add("active");
        });
    });

    // ==========================================
    // PESTAÑAS INTERNAS DEL MODAL "EDITAR PERFIL"
    // ==========================================
    const modalTabs = document.querySelectorAll(".usuarios-modal-tab-btn[data-modal-tab]");
    const modalPanes = document.querySelectorAll(".usuarios-modal-tab-pane");

    modalTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.modalTab;
            modalTabs.forEach(t => t.classList.remove("active"));
            modalPanes.forEach(p => p.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(target)?.classList.add("active");
        });
    });

    // Volver siempre a la primera pestaña interna al cerrar el modal de perfil
    document.getElementById("editarPerfilModal")?.addEventListener("hidden.bs.modal", () => {
        modalTabs.forEach(t => t.classList.remove("active"));
        modalPanes.forEach(p => p.classList.remove("active"));
        modalTabs[0]?.classList.add("active");
        modalPanes[0]?.classList.add("active");
    });

    // ==========================================
    // MOSTRAR / OCULTAR CONTRASEÑA
    // ==========================================
    document.querySelectorAll(".btn-toggle-password").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = btn.closest(".usuarios-modal-input-password").querySelector("input");
            const icon = btn.querySelector("i");
            const isHidden = input.type === "password";
            input.type = isHidden ? "text" : "password";
            icon.classList.toggle("bi-eye");
            icon.classList.toggle("bi-eye-slash");
        });
    });

    // ==========================================
    // VALIDACIÓN VISUAL: MODAL CAMBIAR CONTRASEÑA
    // ==========================================
    const formPassword = document.getElementById("formCambiarPassword");

    if (formPassword) {
        const actual = document.getElementById("id_password_actual");
        const nueva = document.getElementById("id_password_nueva");
        const confirmar = document.getElementById("id_password_confirmar");

        function mostrarError(input, mensaje) {
            const feedback = formPassword.querySelector(`[data-feedback-for="${input.name}"]`);
            input.closest(".usuarios-modal-input-password").classList.add("is-invalid-custom");
            if (feedback) {
                feedback.textContent = mensaje;
                feedback.classList.add("visible");
            }
        }

        function limpiarError(input) {
            const feedback = formPassword.querySelector(`[data-feedback-for="${input.name}"]`);
            input.closest(".usuarios-modal-input-password").classList.remove("is-invalid-custom");
            if (feedback) feedback.classList.remove("visible");
        }

        [actual, nueva, confirmar].forEach(input => {
            input.addEventListener("input", () => limpiarError(input));
        });

        formPassword.addEventListener("submit", function (e) {
            let valido = true;

            if (!actual.value.trim()) {
                mostrarError(actual, "Este campo es obligatorio.");
                valido = false;
            }
            if (!nueva.value.trim()) {
                mostrarError(nueva, "Este campo es obligatorio.");
                valido = false;
            } else if (nueva.value.length < 8) {
                mostrarError(nueva, "La contraseña debe tener al menos 8 caracteres.");
                valido = false;
            }
            if (!confirmar.value.trim()) {
                mostrarError(confirmar, "Este campo es obligatorio.");
                valido = false;
            } else if (nueva.value && confirmar.value !== nueva.value) {
                mostrarError(confirmar, "Las contraseñas no coinciden.");
                valido = false;
            }

            if (!valido) {
                e.preventDefault();
            }
        });
    }

    // ==========================================
    // RESETEAR MODAL DE CONTRASEÑA AL CERRARLO
    // ==========================================
    document.getElementById("cambiarPasswordModal")?.addEventListener("hidden.bs.modal", () => {
        const form = document.getElementById("formCambiarPassword");
        if (!form) return;

        form.reset();
        form.querySelectorAll(".usuarios-modal-invalid-feedback").forEach(f => f.classList.remove("visible"));
        form.querySelectorAll(".usuarios-modal-input-password").forEach(g => g.classList.remove("is-invalid-custom"));
        form.querySelectorAll("input[type=text]").forEach(i => { i.type = "password"; });
        form.querySelectorAll(".btn-toggle-password i").forEach(icon => {
            icon.classList.add("bi-eye");
            icon.classList.remove("bi-eye-slash");
        });
    });

    console.log("✅ Módulo de perfil (modales) cargado correctamente.");
});