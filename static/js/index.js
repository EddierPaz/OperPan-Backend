// ==========================================================================
// OPERPAN - EFECTOS VISUALES E INTERACTIVIDAD DE LA HOMEPAGE (index.html)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    // 1. Efecto de cambio de color del Navbar al hacer Scroll
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 60) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // 2. Animación Fade-in (Aparición secuencial al bajar la pantalla)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Pequeño retraso (delay) para que aparezcan uno tras otro de forma fluida
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // 3. Cierre automático del menú colapsable de Bootstrap en dispositivos móviles
    document.querySelectorAll('#mainNav .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const collapse = document.getElementById('mainNav');
            if (collapse && collapse.classList.contains('show')) {
                // Comprueba que Bootstrap esté cargado antes de ejecutar la instancia
                if (typeof bootstrap !== 'undefined') {
                    bootstrap.Collapse.getInstance(collapse)?.hide();
                }
            }
        });
    });

});