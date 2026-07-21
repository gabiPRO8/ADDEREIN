/* ==========================================================================
   ADDEREIN — site.js (v2)
   Scroll reveals · EN/ES toggle · iframe lazy autoplay · hero video carousel
   ========================================================================== */

(function () {
  'use strict';

  // stagger reveal children with [data-stagger]
  document.querySelectorAll('[data-stagger]').forEach((parent) => {
    const step = Number(parent.dataset.stagger) || 80;
    [...parent.children].forEach((child, i) => {
      child.classList.add('reveal');
      child.dataset.delay = i * step;
    });
  });

  // ----- scroll reveal -----
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = Number(entry.target.dataset.delay || 0);
          setTimeout(() => entry.target.classList.add('is-in'), delay);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // ----- last updated stamp (single source of truth) -----
  const LAST_UPDATED = '2026-07-21'; // update when the site changes

  function applyLastUpdated(lang) {
    const el = document.querySelector('.footer-updated');
    if (!el) return;
    const d = new Date(LAST_UPDATED + 'T00:00:00');
    if (isNaN(d)) return;
    const es = lang === 'es';
    const date = d.toLocaleDateString(es ? 'es-ES' : 'en-GB',
      { day: 'numeric', month: 'short', year: 'numeric' });
    el.textContent = (es ? 'Última actualización: ' : 'Last updated: ') + date;
  }

  // ----- language toggle scaffold -----
  const LANG_KEY = 'adderein-lang';
  const validLangs = ['en', 'es'];
  const stored = localStorage.getItem(LANG_KEY);
  const initial = validLangs.includes(stored) ? stored : 'en';

  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-i18n-en], [data-i18n-es]').forEach((el) => {
      const v = el.getAttribute('data-i18n-' + lang);
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('.lang button').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.lang === lang);
    });
    applyLastUpdated(lang);
    localStorage.setItem(LANG_KEY, lang);
  }
  applyLang(initial);
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.lang button[data-lang]');
    if (!t) return;
    applyLang(t.dataset.lang);
  });

  // ----- iframe lazy attribute fallback -----
  document.querySelectorAll('iframe[data-src]').forEach((frame) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          frame.src = frame.dataset.src;
          observer.unobserve(frame);
        }
      });
    }, { rootMargin: '200px' });
    observer.observe(frame);
  });

  // ----- active nav link -----
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('is-active');
    }
  });

  // ----- nav scrolled state -----
  const nav = document.querySelector('.nav');
  if (nav && !nav.hasAttribute('data-nav-fixed')) {
    const updateNavState = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 4);
    };
    updateNavState();
    window.addEventListener('scroll', updateNavState, { passive: true });
  }

  // ----- hero video carousel -----
  // 3 layers crossfade every 6s with 800ms transition (CSS-driven on .active)
  const videoLayers = document.querySelectorAll('.hero-video-stack .hero-video');
  if (videoLayers.length > 1) {
    let current = 0;
    // make sure the first one is active
    videoLayers.forEach((v, i) => v.classList.toggle('active', i === 0));
    // play the first video element inside the active layer (if any)
    const playInside = (layer) => {
      const v = layer.querySelector('video');
      if (v && typeof v.play === 'function') {
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    };
    playInside(videoLayers[0]);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      setInterval(() => {
        videoLayers[current].classList.remove('active');
        current = (current + 1) % videoLayers.length;
        videoLayers[current].classList.add('active');
        playInside(videoLayers[current]);
      }, 6000);
    }
  }

  // ----- hero video: single looping clip -----
  // (the old 7s source-swap caused a hard cut and constant re-downloads;
  //  the <video> element loops on its own via the `loop` attribute)
  (function () {
    const heroVideoEl = document.querySelector('.hero-video-stack .hero-video video');
    if (!heroVideoEl) return;
    try {
      const p = heroVideoEl.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  })();

  // ----- mobile menu (burger) -----
  const burger = document.querySelector('.nav-burger');
  if (burger && nav) {
    const closeMenu = () => {
      nav.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-locked');
    };
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-locked', open);
    });
    document.querySelectorAll('.nav-links a').forEach((a) => {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
    // if the viewport grows past the breakpoint, make sure the sheet closes
    window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => {
      if (e.matches) closeMenu();
    });
  }

  // ----- nav dropdown panels -----
  const navItems = document.querySelectorAll('.nav-links > li');
  if (navItems.length) {
    navItems.forEach((li) => {
      let closeTimer;
      const panel = li.querySelector('.nav-panel');

      const openPanel = () => {
        clearTimeout(closeTimer);
        navItems.forEach((x) => x.classList.remove('is-open'));
        li.classList.add('is-open');
      };
      const closePanel = () => {
        closeTimer = setTimeout(() => li.classList.remove('is-open'), 90);
      };

      li.addEventListener('mouseenter', openPanel);
      li.addEventListener('mouseleave', closePanel);

      if (panel) {
        panel.addEventListener('mouseenter', () => clearTimeout(closeTimer));
        panel.addEventListener('mouseleave', closePanel);
      }
    });

    // close on click outside nav
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-links')) {
        navItems.forEach((x) => x.classList.remove('is-open'));
      }
    });
  }

  // ----- accordion cards (click / keyboard to expand) -----
  document.querySelectorAll('.compact-card.acc').forEach((card) => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-expanded', 'false');
    const toggle = () => {
      const open = card.classList.toggle('is-open');
      card.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  // ----- project sector filter (experience page) -----
  document.querySelectorAll('.filter-row').forEach((row) => {
    const gridId = row.getAttribute('data-filter-target');
    const grid = gridId ? document.getElementById(gridId) : null;
    if (!grid) return;
    const cards = grid.querySelectorAll('[data-sector]');
    row.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      row.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
      });
      const f = btn.dataset.filter;
      cards.forEach((card) => {
        card.style.display = (f === 'all' || card.dataset.sector === f) ? '' : 'none';
      });
    });
  });

  // ----- contact form (FormSubmit AJAX, no backend needed) -----
  const form = document.querySelector('form.contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const MSG = {
      en: {
        sending: 'Sending…',
        ok: 'Message sent. We will get back to you shortly.',
        err: 'The message could not be sent. Please write to us directly at <a href="mailto:adderein@adderein.com">adderein@adderein.com</a>.'
      },
      es: {
        sending: 'Enviando…',
        ok: 'Mensaje enviado. Te responderemos en breve.',
        err: 'No se ha podido enviar el mensaje. Escríbenos directamente a <a href="mailto:adderein@adderein.com">adderein@adderein.com</a>.'
      }
    };
    const curLang = () => (document.documentElement.getAttribute('lang') === 'es' ? 'es' : 'en');
    const show = (html, isError) => {
      if (!status) return;
      status.innerHTML = html;
      status.classList.add('is-visible');
      status.classList.toggle('is-error', !!isError);
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const t = MSG[curLang()];
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      show(t.sending, false);
      fetch('https://formsubmit.co/ajax/adderein@adderein.com', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then((res) => {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(() => {
          show(t.ok, false);
          form.reset();
        })
        .catch(() => {
          show(t.err, true);
        })
        .finally(() => {
          if (btn) btn.disabled = false;
        });
    });
  }
})();
