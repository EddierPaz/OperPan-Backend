// ==========================================================================
// OPERPAN - INTERACTIVIDAD Y EFECTOS VISUALES (HOMEPAGE)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    /* ----------------------------------------------------------------------
       1. NAVBAR: Cambio de estilo al hacer scroll
       ---------------------------------------------------------------------- */
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    /* ----------------------------------------------------------------------
       2. NAVBAR MÓVIL: Cierre automático al hacer clic en un enlace
       ---------------------------------------------------------------------- */
    const navLinks = document.querySelectorAll('#mainNav .nav-link');
    const mainNavCollapse = document.getElementById('mainNav');

    if (mainNavCollapse && navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mainNavCollapse.classList.contains('show') && typeof bootstrap !== 'undefined') {
                    const bsCollapse = bootstrap.Collapse.getInstance(mainNavCollapse);
                    if (bsCollapse) bsCollapse.hide();
                }
            });
        });
    }

    /* ----------------------------------------------------------------------
       3. CARRUSEL VERTICAL AUTOMÁTICO
       ---------------------------------------------------------------------- */
    const carouselContainer = document.getElementById('heroCarouselVertical');
    if (carouselContainer) {
        const slides = carouselContainer.querySelectorAll('.slide');
        let currentSlide = 0;
        const totalSlides = slides.length;

        if (totalSlides > 0) {
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === 0);
            });

            setInterval(() => {
                slides[currentSlide].classList.remove('active');
                currentSlide = (currentSlide + 1) % totalSlides;
                slides[currentSlide].classList.add('active');
            }, 4000);
        }
    }

    /* ----------------------------------------------------------------------
       4. SELECTOR INTERACTIVO: "Qué ofrecemos"
       ---------------------------------------------------------------------- */
    const ofertaCats = document.querySelectorAll('.oferta-cat');
    const previewIcon = document.getElementById('ofertaPreviewIcon');
    const previewTitle = document.getElementById('ofertaPreviewTitle');
    const previewDesc = document.getElementById('ofertaPreviewDesc');

    if (ofertaCats.length > 0) {
        ofertaCats.forEach(cat => {
            cat.addEventListener('click', () => {
                ofertaCats.forEach(item => item.classList.remove('active'));
                cat.classList.add('active');

                const iconClass = cat.dataset.icon || cat.getAttribute('data-icon');
                const title = cat.dataset.title || cat.getAttribute('data-title');
                const desc = cat.dataset.desc || cat.getAttribute('data-desc');

                if (previewIcon && iconClass) previewIcon.innerHTML = `<i class="bi ${iconClass}"></i>`;
                if (previewTitle && title) previewTitle.textContent = title;
                if (previewDesc && desc) previewDesc.textContent = desc;
            });
        });
    }

    /* ----------------------------------------------------------------------
       5. PESTAÑAS DE CATEGORÍAS (.btn-cat y .cat-content)
       ---------------------------------------------------------------------- */
    const catButtons = document.querySelectorAll('.btn-cat');
    const catContents = document.querySelectorAll('.cat-content');

    if (catButtons.length > 0) {
        catButtons.forEach(button => {
            button.addEventListener('click', () => {
                catButtons.forEach(btn => btn.classList.remove('active'));
                catContents.forEach(content => {
                    content.classList.add('d-none');
                    content.classList.remove('active');
                });

                button.classList.add('active');

                const targetId = button.getAttribute('data-target');
                const targetContent = document.getElementById(targetId);
                if (targetContent) {
                    targetContent.classList.remove('d-none');
                    targetContent.classList.add('active');
                }
            });
        });
    }

    /* ----------------------------------------------------------------------
       6. ANIMACIONES FADE-IN ESCALONADAS (IntersectionObserver)
       ---------------------------------------------------------------------- */
    const fadeElements = document.querySelectorAll('.fade-in');

    if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
        const observerOptions = {
            root: null,
            threshold: 0.1
        };

        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 80);
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        fadeElements.forEach(el => fadeObserver.observe(el));
    }

    /* ----------------------------------------------------------------------
   7. TARJETAS DE DESARROLLADORES: clic en toda la tarjeta
   ---------------------------------------------------------------------- */
    const teamCards = document.querySelectorAll('.team-card');
    if (teamCards.length > 0) {
        teamCards.forEach(card => {
            card.addEventListener('click', function(e) {
                // Si el clic fue en el botón, se propaga igual, pero evitamos doble toggle
                // ya que solo usamos este listener.
                const isActive = this.classList.contains('active');

                // Cerrar todas las demás tarjetas (comportamiento acordeón)
                document.querySelectorAll('.team-card.active').forEach(c => {
                    if (c !== this) c.classList.remove('active');
                });

                // Alternar la actual
                this.classList.toggle('active');
            });
        });
    }

    /* ----------------------------------------------------------------------
       8. TOGGLE DE TEMA (CLARO / OSCURO) — HOMEPAGE
       Preferencia independiente del panel (clave: 'home-theme')
       ---------------------------------------------------------------------- */
    (function () {
        const html = document.documentElement;
        const toggleBtn = document.getElementById('themeToggle');
        const icon = document.getElementById('themeIcon');

        if (!toggleBtn || !icon) return; // Si no existe el botón, salir

        function setTheme(theme) {
            html.setAttribute('data-theme', theme);
            if (theme === 'dark') {
                icon.className = 'bi bi-sun-fill';
            } else {
                icon.className = 'bi bi-moon-fill';
            }
            // Clave distinta a la del panel ('theme') para no interferir
            localStorage.setItem('home-theme', theme);
        }

        function getInitialTheme() {
            const stored = localStorage.getItem('home-theme');
            if (stored) return stored;
            // Respetar preferencia del sistema operativo
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light';
        }

        // Establecer tema inicial
        setTheme(getInitialTheme());

        // Evento clic
        toggleBtn.addEventListener('click', function () {
            const current = html.getAttribute('data-theme') || 'light';
            setTheme(current === 'light' ? 'dark' : 'light');
        });

        // Escuchar cambios de preferencia del sistema (solo si no hay preferencia guardada)
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', function (e) {
                if (!localStorage.getItem('home-theme')) {
                    setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    })();



});