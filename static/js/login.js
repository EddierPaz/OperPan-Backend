document.addEventListener("DOMContentLoaded", function() {
    const togglePassword = document.querySelector('#togglePassword');
    const passwordInput = document.querySelector('#passwordInput');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            // Cambia el tipo de input entre texto y contraseña
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Alterna las clases del icono del ojo
            this.classList.toggle('bi-eye');
            this.classList.toggle('bi-eye-slash');
        });
    }
});