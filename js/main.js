/**
 * Malla Harshal Kumar - Personal Portfolio Script
 * Vanilla JavaScript - Zero Dependencies - Motion Layer & Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check user preference for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Entrance duration lives in CSS (--duration-entrance) so the counter and the
  // panel it sits inside resolve on one number. Parsed once; falls back to 700ms
  // if the token is missing or unparseable.
  const readEntranceDuration = () => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--duration-entrance')
      .trim();
    if (raw.endsWith('ms')) {
      const ms = parseFloat(raw);
      return Number.isFinite(ms) ? ms : 700;
    }
    if (raw.endsWith('s')) {
      const s = parseFloat(raw);
      return Number.isFinite(s) ? s * 1000 : 700;
    }
    return 700;
  };

  const ENTRANCE_MS = readEntranceDuration();

  // 1. Dynamic Copyright Year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. Theme Toggle (light / dark, persisted, system-aware)
  const themeToggles = document.querySelectorAll('[data-theme-toggle]');
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const THEME_KEY = 'theme';

  const readStoredTheme = () => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      return stored === 'light' || stored === 'dark' ? stored : null;
    } catch (e) {
      return null;
    }
  };

  const effectiveTheme = () => {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return darkQuery.matches ? 'dark' : 'light';
  };

  const syncThemeToggles = () => {
    const isDark = effectiveTheme() === 'dark';
    themeToggles.forEach(btn => {
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  };

  if (themeToggles.length > 0) {
    syncThemeToggles();

    themeToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch (e) { /* storage unavailable; choice lasts for this page view */ }
        syncThemeToggles();
      });
    });

    // Follow the system only while the visitor has not made an explicit choice
    const onSystemThemeChange = () => {
      if (!readStoredTheme()) syncThemeToggles();
    };
    if (typeof darkQuery.addEventListener === 'function') {
      darkQuery.addEventListener('change', onSystemThemeChange);
    } else if (typeof darkQuery.addListener === 'function') {
      darkQuery.addListener(onSystemThemeChange);
    }
  }

  // Release the compositor layer once a one-shot entrance transition finishes.
  // `will-change` is a promise of imminent animation; holding it for the whole
  // session on ~15 elements costs memory for transforms that never run again.
  const clearWillChangeAfterEntrance = (el) => {
    const onDone = (event) => {
      // Only react to the element's own transition, not a child's bubbling one
      if (event.target !== el) return;
      el.style.willChange = 'auto';
      el.removeEventListener('transitionend', onDone);
      el.removeEventListener('transitioncancel', onDone);
    };
    el.addEventListener('transitionend', onDone);
    el.addEventListener('transitioncancel', onDone);
  };

  // 3. Hero Staggered Entrance Animation
  const heroElements = document.querySelectorAll('.animate-fade-up');
  if (heroElements.length > 0) {
    if (prefersReducedMotion) {
      // No transition fires in this branch, so transitionend never arrives:
      // release the layer hint straight away instead of waiting for it.
      heroElements.forEach(el => {
        el.classList.add('animate-in');
        el.style.willChange = 'auto';
      });
    } else {
      // Trigger staggered CSS transitions on microtask
      requestAnimationFrame(() => {
        heroElements.forEach(el => {
          clearWillChangeAfterEntrance(el);
          el.classList.add('animate-in');
        });
      });
    }
  }

  // 4. Scroll Reveal via IntersectionObserver (NO window scroll listener)
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length > 0) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach(el => {
        el.classList.add('is-revealed');
        el.style.willChange = 'auto';
      });
    } else {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            clearWillChangeAfterEntrance(entry.target);
            entry.target.classList.add('is-revealed');
            // Unobserve immediately after trigger to prevent memory leaks or re-runs
            observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.1
      });

      revealElements.forEach(el => revealObserver.observe(el));
    }
  }

  // 5. Project Stat Number Counter (requestAnimationFrame + easeOutCubic)
  const counterElements = document.querySelectorAll('[data-counter]');

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target || '0');
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const finalText = `${prefix}${target.toFixed(decimals)}${suffix}`;

    // A zero target would animate from 0 to 0 and read as a broken counter.
    // Render the final value straight away instead.
    if (prefersReducedMotion || target === 0) {
      el.textContent = finalText;
      return;
    }

    const duration = ENTRANCE_MS;
    const startTime = performance.now();

    function updateCounter(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic curve: 1 - (1 - t)^3
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = target * easedProgress;

      el.textContent = `${prefix}${currentValue.toFixed(decimals)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        el.textContent = finalText;
      }
    }

    requestAnimationFrame(updateCounter);
  }

  if (counterElements.length > 0) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      counterElements.forEach(animateCounter);
    } else {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            // Unobserve immediately after animating once
            observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.2
      });

      counterElements.forEach(el => counterObserver.observe(el));
    }
  }

  // 6. Active Navigation Link Highlighting on Scroll (IntersectionObserver)
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  if (sections.length > 0 && 'IntersectionObserver' in window) {
    // Only the desktop nav gets an underline. The mobile sheet's links share the
    // .nav-link class but live in a different containing block.
    const desktopNav = document.querySelector('.nav-links');
    const desktopLinks = desktopNav
      ? Array.from(desktopNav.querySelectorAll('.nav-link[href^="#"]'))
      : [];

    let underline = null;
    if (desktopNav && desktopLinks.length > 0) {
      underline = document.createElement('span');
      underline.className = 'nav-underline';
      underline.setAttribute('aria-hidden', 'true');
      desktopNav.appendChild(underline);
    }

    // Remembered so a resize can re-measure without waiting for a new section
    let activeLink = null;

    const moveUnderline = () => {
      if (!underline) return;

      if (!activeLink) {
        underline.style.opacity = '0';
        underline.style.transform = 'translateX(0) scaleX(0)';
        return;
      }

      const navRect = desktopNav.getBoundingClientRect();
      // Below 768px .nav-links is display:none, so every rect is zero.
      // Bail rather than snapping the bar to the origin.
      if (navRect.width === 0) return;

      const linkRect = activeLink.getBoundingClientRect();
      const x = linkRect.left - navRect.left;
      const y = linkRect.bottom - navRect.top + 6;

      // `top` is a layout property: set once per measurement, never transitioned.
      underline.style.top = `${y}px`;
      underline.style.opacity = '1';
      underline.style.transform = `translateX(${x}px) scaleX(${linkRect.width})`;
    };

    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${currentId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
          activeLink = desktopLinks.find(
            link => link.getAttribute('href') === `#${currentId}`
          ) || null;
          moveUnderline();
        }
      });
    }, {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(section => navObserver.observe(section));

    // Re-measure on layout changes (viewport resize, font load, zoom) without a
    // resize or scroll listener. ResizeObserver fires only when the nav's own
    // box actually changes, which is exactly the condition that invalidates the
    // cached rects.
    if (underline && 'ResizeObserver' in window) {
      const navResizeObserver = new ResizeObserver(() => {
        // Suppress the slide while re-measuring after a layout change: the bar
        // should reappear in its new place, not travel there.
        const previous = underline.style.transition;
        underline.style.transition = 'none';
        moveUnderline();
        // Force a style flush so the suppressed value is committed before the
        // transition is restored, otherwise both changes coalesce into one frame.
        void underline.offsetWidth;
        underline.style.transition = previous;
      });
      navResizeObserver.observe(desktopNav);
    }
  }

  // 7. Mobile Navigation Toggle, Scroll Lock & Focus Management
  const navToggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('.nav-link') : [];

  if (navToggle && mobileMenu) {
    const FOCUSABLE = 'a[href], button:not([disabled])';

    const getFocusable = () => Array.from(mobileMenu.querySelectorAll(FOCUSABLE));

    const openMenu = () => {
      mobileMenu.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      const focusable = getFocusable();
      if (focusable.length > 0) focusable[0].focus();
    };

    const closeMenu = ({ restoreFocus = true } = {}) => {
      mobileMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      if (restoreFocus) navToggle.focus();
    };

    const isOpen = () => mobileMenu.classList.contains('open');

    navToggle.addEventListener('click', () => {
      if (isOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Following a link navigates the page, so do not steal focus back to the toggle
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (isOpen()) closeMenu({ restoreFocus: false });
      });
    });

    document.addEventListener('keydown', (e) => {
      if (!isOpen()) return;

      if (e.key === 'Escape') {
        closeMenu();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!mobileMenu.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  // 8. Smooth Scroll for Back to Top Button
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  }
});
