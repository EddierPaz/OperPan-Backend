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

    // 2. Animación Fade-in (aparición secuencial)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // 3. Cierre automático del menú colapsable en móviles
    document.querySelectorAll('#mainNav .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const collapse = document.getElementById('mainNav');
            if (collapse && collapse.classList.contains('show')) {
                if (typeof bootstrap !== 'undefined') {
                    bootstrap.Collapse.getInstance(collapse)?.hide();
                }
            }
        });
    });

    // 4. Carrusel vertical automático
    const carousel = document.getElementById('heroCarouselVertical');
    if (carousel) {
        const slides = carousel.querySelectorAll('.slide');
        let current = 0;
        const total = slides.length;

        if (total > 0) {
            // Mostrar el primer slide
            slides.forEach((s, idx) => s.classList.toggle('active', idx === 0));

            setInterval(() => {
                slides.forEach(s => s.classList.remove('active'));
                current = (current + 1) % total;
                slides[current].classList.add('active');
            }, 4000); // Cambio cada 4 segundos
        }
    }

});