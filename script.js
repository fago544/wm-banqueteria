
/* ===== Util ===== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ===== Header on scroll ===== */
const header = $('#header');
const onScroll = () => {
  header.classList.toggle('header--scrolled', window.scrollY > 8);
};
document.addEventListener('scroll', onScroll); onScroll();

/* ===== Mobile nav ===== */
const toggleBtn = $('.nav__toggle');
const navMenu = $('#navMenu');
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', open);
  });
  $$('#navMenu a').forEach(a => a.addEventListener('click', () => navMenu.classList.remove('open')));
}

/* ===== Smooth scroll ===== */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const el = $(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ===== Hero background rotator ===== */
const heroBg = $('.hero__bg');
const heroImages = [
  "https://images.unsplash.com/photo-1511576661531-b34d7da5d0bb?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop"
];
let heroIndex = 0;
function setHero(i){
  heroBg.style.opacity = 0;
  setTimeout(() => {
    heroBg.style.backgroundImage = `url('${heroImages[i]}')`;
    heroBg.style.opacity = 1;
  }, 300);
}
setHero(heroIndex);
setInterval(() => {
  heroIndex = (heroIndex + 1) % heroImages.length;
  setHero(heroIndex);
}, 6000);

/* ===== Scroll reveal ===== */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
},{ threshold: .2 });
$$('[data-animate]').forEach(el => {
  const delay = el.dataset.delay || 0;
  el.style.transitionDelay = `${delay}ms`;
  observer.observe(el);
});

/* ===== Carousel ===== */
const carousel = $('.carousel');
const track = $('.carousel__track', carousel);
const slides = $$('.carousel__slide', track);
const prevBtn = $('.carousel__arrow.prev', carousel);
const nextBtn = $('.carousel__arrow.next', carousel);
const dotsWrap = $('.carousel__dots', carousel);

let current = 0;
const setSlide = (i, { focus=false } = {}) => {
  current = (i + slides.length) % slides.length;
  const offset = -current * (slides[0].getBoundingClientRect().width + 14);
  track.style.transform = `translateX(${offset}px)`;
  // Dots
  $$('.carousel__dots button', dotsWrap).forEach((b, idx)=>{
    b.setAttribute('aria-selected', idx === current ? 'true' : 'false');
    b.setAttribute('tabindex', idx === current ? '0' : '-1');
  });
  if (focus) $('.carousel__viewport', carousel).focus();
};

// Create dots
slides.forEach((_, i) => {
  const b = document.createElement('button');
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-label', `Ir a la foto ${i+1}`);
  b.addEventListener('click', ()=> setSlide(i));
  dotsWrap.appendChild(b);
});
setSlide(0);

// Arrows
prevBtn.addEventListener('click', ()=> setSlide(current-1, {focus:true}));
nextBtn.addEventListener('click', ()=> setSlide(current+1, {focus:true}));

// Keyboard navigation
$('.carousel__viewport', carousel).addEventListener('keydown', (e)=>{
  if (e.key === 'ArrowLeft') setSlide(current-1);
  if (e.key === 'ArrowRight') setSlide(current+1);
});

// Drag / touch
let startX=0, isDown=false, moved=false;
const viewport = $('.carousel__viewport', carousel);
viewport.addEventListener('pointerdown', e => {
  isDown=true; moved=false; startX=e.clientX; viewport.setPointerCapture(e.pointerId);
});
viewport.addEventListener('pointermove', e => {
  if(!isDown) return;
  const dx = e.clientX - startX;
  if(Math.abs(dx)>10) moved=true;
  track.style.transform = `translateX(${-current * (slides[0].getBoundingClientRect().width + 14) + dx}px)`;
});
viewport.addEventListener('pointerup', e => {
  if(!isDown) return;
  isDown=false; viewport.releasePointerCapture(e.pointerId);
  const dx = e.clientX - startX;
  if (moved && Math.abs(dx) > 40){
    setSlide(current + (dx<0 ? 1 : -1));
  } else {
    setSlide(current);
  }
});

// Autoplay (pausa al hover/focus)
let autoplay = setInterval(()=> setSlide(current+1), 5000);
carousel.addEventListener('mouseenter', ()=> clearInterval(autoplay));
carousel.addEventListener('mouseleave', ()=> autoplay = setInterval(()=> setSlide(current+1), 5000));

// Footer year
$('#year').textContent = new Date().getFullYear();

/* ===== Form dummy handler ===== */
const form = $('.contact__form');
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const status = $('.form__status', form);
  status.textContent = "Enviando…";
  setTimeout(()=>{
    status.textContent = "Gracias. Te contactaremos pronto.";
    form.reset();
  }, 900);
});
