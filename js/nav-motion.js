/**
 * Nav and motion layer. Loads after js/main.js.
 * No scroll listeners: IntersectionObserver + ResizeObserver only.
 */
document.addEventListener('DOMContentLoaded', () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.querySelector('.nav-links');
  const sections = document.querySelectorAll('main section[id]');

  // 1. Sliding pill behind the active nav link
  if (nav && sections.length && 'IntersectionObserver' in window) {
    const links = Array.from(nav.querySelectorAll('.nav-link[href^="#"]'));
    const pill = document.createElement('span');
    pill.className = 'nav-pill';
    pill.setAttribute('aria-hidden', 'true');
    nav.insertBefore(pill, nav.firstChild);

    let active = null;

    const move = (animate = true) => {
      if (!active) { pill.style.opacity = '0'; return; }
      const navRect = nav.getBoundingClientRect();
      if (navRect.width === 0) return;               // nav is hidden below 768px
      const r = active.getBoundingClientRect();
      if (!animate) {
        const prev = pill.style.transition;
        pill.style.transition = 'none';
        pill.style.transform = 'translateX(' + (r.left - navRect.left) + 'px)';
        pill.style.width = r.width + 'px';
        void pill.offsetWidth;
        pill.style.transition = prev;
      } else {
        pill.style.transform = 'translateX(' + (r.left - navRect.left) + 'px)';
        pill.style.width = r.width + 'px';
      }
      pill.style.opacity = '1';
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        active = links.find((l) => l.getAttribute('href') === '#' + id) || null;
        move();
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach((s) => io.observe(s));

    if ('ResizeObserver' in window) {
      new ResizeObserver(() => move(false)).observe(nav);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => move(false));
    }
  }

  // 2. Condensed navbar, driven by a sentinel rather than a scroll listener
  const sentinel = document.getElementById('nav-sentinel');
  if (sentinel && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      document.body.classList.toggle('is-scrolled', !entry.isIntersecting);
    }, { threshold: 0 });
    io.observe(sentinel);
  }

  // 3. Brand lockup roll on hover (board 6a). Pointer devices only, and
  //    suppressed while the navbar is condensed, which owns the same roll.
  const brand = document.querySelector('.brand');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (brand && brand.querySelector('.brand-roll') && canHover) {
    let timer = null;
    const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };

    const enter = () => {
      if (document.body.classList.contains('is-scrolled')) return;
      clear();
      brand.classList.add('is-step-1');
      timer = setTimeout(() => {
        brand.classList.remove('is-step-1');
        brand.classList.add('is-step-2');
      }, 520);
    };

    const leave = () => {
      clear();
      brand.classList.remove('is-step-1', 'is-step-2');
    };

    brand.addEventListener('mouseenter', enter);
    brand.addEventListener('mouseleave', leave);
    brand.addEventListener('focus', enter);
    brand.addEventListener('blur', leave);
  }

  // 4. Hero wipe needs no JS: js/main.js already adds .animate-in to the
  //    .hero-headline, and css/nav-motion.css drives the two lines from it.
  //    Reduced motion is handled in CSS; nothing to branch on here.
  void reduce;
});
