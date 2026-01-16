
/* =========================================================
   WM Banquetería — JavaScript (Landing de una sola página)
   - Navbar sticky + mobile
   - Smooth scroll
   - Hero con fondo dinámico
   - Animaciones on-scroll (IntersectionObserver)
   - Carrusel genérico (galería marketing y modales)
   - Modales por servicio (cada una con su propio carrusel)
   ========================================================= */

/* ---------- Utilidades ---------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ---------- Navbar sticky ---------- */
const header = $('#header');
const onScroll = () => header?.classList.toggle('header--scrolled', window.scrollY > 8);
document.addEventListener('scroll', onScroll); onScroll();

/* ---------- Mobile nav ---------- */
const toggleBtn = $('.nav__toggle');
const navMenu  = $('#navMenu');
if (toggleBtn && navMenu) {
  toggleBtn.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', String(open));
  });
  $$('#navMenu a').forEach(a =>
    a.addEventListener('click', () => navMenu.classList.remove('open'))
  );
}

/* ---------- Smooth scroll ---------- */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const el = $(id);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ---------- Hero con fondo dinámico ---------- */
const heroBg = $('.hero__bg');
const heroImages = [
  "https://images.unsplash.com/photo-1511576661531-b34d7da5d0bb?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop"
];
let heroIndex = 0;
function setHero(i) {
  if (!heroBg) return;
  heroBg.style.opacity = 0;
  setTimeout(() => {
    heroBg.style.backgroundImage = `url('${heroImages[i]}')`;
    heroBg.style.opacity = 1;
  }, 300);
}
if (heroBg) {
  setHero(heroIndex);
  setInterval(() => { heroIndex = (heroIndex + 1) % heroImages.length; setHero(heroIndex); }, 6000);
}

/* ---------- Animaciones on-scroll ---------- */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
$$('[data-animate]').forEach(el => {
  const delay = el.dataset.delay || 0;
  el.style.transitionDelay = `${delay}ms`;
  observer.observe(el);
});

/* =========================================================
   Carrusel genérico (galería marketing + carruseles en modales)
   - Soporta <img> y <video>
   - Autoplay configurable (default 5000 ms)
   - Flechas, dots, teclado, drag/touch, pausa con hover
   - Carga robusta: si el <li> tiene sólo URL en texto, se auto-convierte
   ========================================================= */

/* Convierte URLs sueltas dentro de <li> en <img> o <video> reales */
function upgradeSlidesIfNeeded(track) {
  if (!track) return;
  $$('.carousel__slide', track).forEach(li => {
    const hasMedia = $('img,video', li);
    if (hasMedia) return;
    const raw = (li.textContent || '').trim();
    if (!raw) return;
    li.textContent = '';
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(raw)) {
      const v = document.createElement('video');
      v.src = raw; v.muted = true; v.playsInline = true; v.loop = true; v.preload = 'metadata';
      v.setAttribute('aria-label', 'Video de galería');
      li.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = raw; img.alt = 'Imagen de galería';
      li.appendChild(img);
    }
  });
}

/* Inicializa un carrusel dentro de un contenedor raíz */
function initCarousel(root, { autoplayMs = 5000 } = {}) {
  if (!root) return null;
  const track    = $('.carousel__track', root);
  const viewport = $('.carousel__viewport', root);
  const prevBtn  = $('.carousel__arrow.prev', root);
  const nextBtn  = $('.carousel__arrow.next', root);
  const dotsWrap = $('.carousel__dots', root);

  if (!track || !viewport || !dotsWrap) return null;

  // Asegurar que cada <li> tenga media real
  upgradeSlidesIfNeeded(track);

  const slides = $$('.carousel__slide', track);
  if (!slides.length) return null;

  // Construir dots
  dotsWrap.innerHTML = '';
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Ir a la foto ${i + 1}`);
    b.addEventListener('click', () => setSlide(i, { focus: false }));
    dotsWrap.appendChild(b);
  });

  // Cálculo de ancho robusto
  function slideWidth() {
    const first = slides[0];
    if (!first) return 0;
    const w = first.getBoundingClientRect().width || first.offsetWidth || 0;
    return w + 14; // 14px = gap declarado en CSS
  }

  let current = 0;
  let autoplayTimer = null;

  function updateDots() {
    $$('.carousel__dots button', dotsWrap).forEach((b, idx) => {
      const sel = idx === current;
      b.setAttribute('aria-selected', sel ? 'true' : 'false');
      b.setAttribute('tabindex', sel ? '0' : '-1');
    });
  }

  function handleVideosVisibility() {
    slides.forEach((li, idx) => {
      const vid = $('video', li);
      if (!vid) return;
      if (idx === current) {
        // Reinicia y reproduce solo el slide visible
        try { vid.currentTime = 0; vid.play(); } catch {}
      } else {
        try { vid.pause(); } catch {}
      }
    });
  }

  function setSlide(i, { focus = false } = {}) {
    if (!slides.length) return;
    current = (i + slides.length) % slides.length;
    const w = slideWidth();
    if (!w) {
      // Aún sin medidas; reintentar en el próximo frame
      requestAnimationFrame(() => setSlide(current, { focus }));
      return;
    }
    const offset = -current * w;
    track.style.transform = `translateX(${offset}px)`;
    updateDots();
    handleVideosVisibility();
    if (focus) viewport.focus();
  }

  // Flechas
  prevBtn?.addEventListener('click', () => setSlide(current - 1, { focus: true }));
  nextBtn?.addEventListener('click', () => setSlide(current + 1, { focus: true }));

  // Teclado
  viewport.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  setSlide(current - 1);
    if (e.key === 'ArrowRight') setSlide(current + 1);
  });

  // Drag / touch (pointer events)
  let startX = 0, isDown = false, moved = false;
  viewport.addEventListener('pointerdown', e => {
    isDown = true; moved = false; startX = e.clientX; viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', e => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 10) moved = true;
    const w = slideWidth();
    track.style.transform = `translateX(${-current * w + dx}px)`;
  });
  viewport.addEventListener('pointerup', e => {
    if (!isDown) return;
    isDown = false; viewport.releasePointerCapture(e.pointerId);
    const dx = e.clientX - startX;
    if (moved && Math.abs(dx) > 40) {
      setSlide(current + (dx < 0 ? 1 : -1));
    } else {
      setSlide(current);
    }
  });

  // Autoplay
  function startAutoplay() {
    stopAutoplay();
    if (autoplayMs > 0) {
      autoplayTimer = setInterval(() => setSlide(current + 1), autoplayMs);
    }
  }
  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  root.addEventListener('mouseenter', stopAutoplay);
  root.addEventListener('mouseleave', startAutoplay);

  // Calibrar al cargar imágenes
  const imgs = $$('img', track);
  if (imgs.length) {
    let pending = imgs.length;
    const recalibrate = () => setTimeout(() => setSlide(current), 0);
    imgs.forEach(img => {
      if (img.complete && img.naturalWidth) {
        if (--pending === 0) recalibrate();
      } else {
        img.addEventListener('load',  () => { if (--pending === 0) recalibrate(); }, { once: true });
        img.addEventListener('error', () => { if (--pending === 0) recalibrate(); }, { once: true });
      }
    });
  }

  // Inicio
  setSlide(0);
  startAutoplay();

  // API mínima (por si la necesitamos)
  return { setSlide, startAutoplay, stopAutoplay };
}

/* ---------- Inicializar carrusel de la galería de marketing ---------- */
const marketingCarousel = $('.gallery .carousel');
if (marketingCarousel) initCarousel(marketingCarousel, { autoplayMs: 5000 });

/* =========================================================
   Modales por servicio
   - Mapa card->modal
   - Apertura/cierre, focus, escape, click en backdrop
   - Un carrusel independiente por cada modal (autoplay 7s por defecto)
   ========================================================= */

const serviceToModalId = {
  dj:           'modal-dj',
  banqueteria:  'modal-banqueteria',
  cocteleria:   'modal-cocteleria',
  cabina360:    'modal-cabina360',
  produccion:   'modal-produccion'
};

// Almacenamos la instancia de carrusel por cada modal para no re‑inicializar
const modalCarousels = new Map();

let activeModal = null;
let lastFocused  = null;

function lockScroll(lock) {
  document.documentElement.style.overflow = lock ? 'hidden' : '';
  document.body.style.overflow = lock ? 'hidden' : '';
}

function openModal(modal) {
  if (!modal) return;
  lastFocused = document.activeElement;
  modal.setAttribute('aria-hidden', 'false');
  activeModal = modal;
  lockScroll(true);

  // Iniciar el carrusel interno si no existe aún
  if (!modalCarousels.has(modal)) {
    const innerCarousel = $('.modal__carousel', modal);
    if (innerCarousel) {
      const ms = Number(innerCarousel.dataset.autoplay || 7000);
      const api = initCarousel(innerCarousel, { autoplayMs: ms });
      modalCarousels.set(modal, api);
    }
  } else {
    // Si ya existe, reiniciar autoplay y posicionar en el primer slide
    const api = modalCarousels.get(modal);
    api?.setSlide(0);
    api?.startAutoplay?.();
  }

  // Focus en el diálogo
  $('.modal__dialog', modal)?.focus();
}

function closeModal(modal) {
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  lockScroll(false);

  // Pausar autoplay dentro de la modal
  const api = modalCarousels.get(modal);
  api?.stopAutoplay?.();

  // devolver el foco al elemento previo
  if (lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus();
  }
  activeModal = null;
}

/* Listener global para abrir modales desde las cards */
$$('.service').forEach(card => {
  const key = card.dataset.service;
  const id  = serviceToModalId[key];
  const modal = id ? document.getElementById(id) : null;

  const open = () => openModal(modal);

  card.addEventListener('click', open);
  // Accesible con teclado (Enter/Espacio)
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
});

/* Cierre de modal: botones [data-close] y clic en backdrop */
$$('.modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target.matches('[data-close]') || e.target.classList.contains('modal__backdrop')) {
      closeModal(modal);
    }
  });
});

/* Escape para cerrar la modal activa */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && activeModal) closeModal(activeModal);
});

/* ---------- Año dinámico en footer ---------- */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
