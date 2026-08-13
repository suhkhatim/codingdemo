/* =========================================================
   S² People Advisory — interactions
   Vanilla JS, no dependencies. Every module is defensive:
   if its markup is absent the module simply does nothing.
   ========================================================= */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------
     Header: shrink on scroll + reading progress bar
     ------------------------------------------------------- */
  (function header() {
    const el = $('#siteHeader');
    const bar = $('#scrollProgress');
    const toTop = $('#toTop');
    if (!el) return;

    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      el.classList.toggle('is-scrolled', y > 40);

      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }
      if (toTop) toTop.classList.toggle('is-visible', y > 700);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    if (toTop) {
      toTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  })();

  /* -------------------------------------------------------
     Mobile navigation drawer
     ------------------------------------------------------- */
  (function mobileNav() {
    const toggle   = $('#navToggle');
    const nav      = $('#primaryNav');
    const backdrop = $('#navBackdrop');
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
      if (backdrop) {
        backdrop.hidden = !open;
        // next frame so the opacity transition has a starting point
        requestAnimationFrame(() => backdrop.classList.toggle('is-open', open));
      }
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    if (backdrop) backdrop.addEventListener('click', () => setOpen(false));

    // Close after tapping a link, and on Escape
    $$('a', nav).forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
    });

    // Reset state if the viewport grows past the mobile breakpoint
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });
  })();

  /* -------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------- */
  (function reveal() {
    const items = $$('[data-reveal]');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const delay = parseInt(entry.target.dataset.revealDelay || '0', 10);
        setTimeout(() => entry.target.classList.add('is-revealed'), delay);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    items.forEach(el => io.observe(el));
  })();

  /* -------------------------------------------------------
     Scrollspy — highlight the nav link for the section in view
     ------------------------------------------------------- */
  (function scrollspy() {
    const links = $$('.nav-list a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const map = new Map();
    links.forEach(link => {
      const section = document.querySelector(link.getAttribute('href'));
      if (section) map.set(section, link);
    });
    if (!map.size) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const link = map.get(entry.target);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    map.forEach((_, section) => io.observe(section));
  })();

  /* -------------------------------------------------------
     Hero headline word rotator
     ------------------------------------------------------- */
  (function rotator() {
    const track = $('#rotator');
    if (!track) return;
    const items = $$('.rotator-item', track);
    if (items.length < 2 || reduceMotion) return;

    let i = 0;
    setInterval(() => {
      i = (i + 1) % items.length;
      track.style.transform = `translateY(-${i * 1.05}em)`;
    }, 2600);
  })();

  /* -------------------------------------------------------
     Animated counters
     ------------------------------------------------------- */
  (function counters() {
    const nums = $$('[data-count]');
    if (!nums.length) return;

    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      if (reduceMotion) { el.textContent = target + suffix; return; }

      const duration = 1600;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    nums.forEach(el => io.observe(el));
  })();

  /* -------------------------------------------------------
     Services → detail modal
     ------------------------------------------------------- */
  (function serviceModal() {
    const modal = $('#serviceModal');
    const cards = $$('.service-card');
    if (!modal || !cards.length) return;

    const panel   = $('.modal-panel', modal);
    const title   = $('#modalTitle');
    const summary = $('#modalSummary');
    const list    = $('#modalList');
    const outcome = $('#modalOutcome');
    let lastFocused = null;

    const open = (card) => {
      lastFocused = card;
      title.innerHTML   = card.dataset.title   || '';
      summary.innerHTML = card.dataset.summary || '';
      outcome.innerHTML = card.dataset.outcome || '';

      list.innerHTML = '';
      (card.dataset.items || '').split('|').filter(Boolean).forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = item.trim();
        list.appendChild(li);
      });

      modal.hidden = false;
      document.body.classList.add('is-locked');
      requestAnimationFrame(() => modal.classList.add('is-open'));
      panel.scrollTop = 0;
      $('.modal-close', modal).focus();
    };

    const close = () => {
      modal.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      const done = () => { modal.hidden = true; };
      reduceMotion ? done() : setTimeout(done, 320);
      if (lastFocused) lastFocused.focus();
    };

    cards.forEach(card => {
      card.addEventListener('click', () => open(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
      });
    });

    $$('[data-close]', modal).forEach(el => el.addEventListener('click', close));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) close();
    });

    // Keep tab focus inside the dialog while it is open
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusables = $$('a[href], button, input, select, textarea', panel)
        .filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  })();

  /* -------------------------------------------------------
     Testimonial carousel
     ------------------------------------------------------- */
  (function carousel() {
    const root  = $('#carousel');
    const track = $('#carouselTrack');
    const dots  = $('#carouselDots');
    if (!root || !track) return;

    const slides = $$('.slide', track);
    if (slides.length < 2) return;

    let index = 0;
    let timer = null;
    const INTERVAL = 6500;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
      dot.addEventListener('click', () => { go(i); restart(); });
      dots.appendChild(dot);
    });
    const dotEls = $$('button', dots);

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dotEls.forEach((d, n) => {
        d.classList.toggle('is-active', n === index);
        d.setAttribute('aria-selected', String(n === index));
      });
      slides.forEach((s, n) => s.setAttribute('aria-hidden', String(n !== index)));
    }

    const next = () => go(index + 1);
    const prev = () => go(index - 1);

    function start() { if (!reduceMotion) timer = setInterval(next, INTERVAL); }
    function stop()  { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    $('#nextSlide')?.addEventListener('click', () => { next(); restart(); });
    $('#prevSlide')?.addEventListener('click', () => { prev(); restart(); });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    // Keyboard
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { next(); restart(); }
      if (e.key === 'ArrowLeft')  { prev(); restart(); }
    });

    // Touch swipe
    let startX = 0, delta = 0, dragging = false;
    track.addEventListener('touchstart', (e) => {
      dragging = true; startX = e.touches[0].clientX; delta = 0; stop();
    }, { passive: true });
    track.addEventListener('touchmove', (e) => {
      if (dragging) delta = e.touches[0].clientX - startX;
    }, { passive: true });
    track.addEventListener('touchend', () => {
      if (dragging && Math.abs(delta) > 50) (delta < 0 ? next() : prev());
      dragging = false;
      start();
    });

    // Pause while the section is off-screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.25 }).observe(root);
    } else {
      start();
    }

    go(0);
  })();

  /* -------------------------------------------------------
     FAQ accordion (height-animated, one panel open at a time)
     ------------------------------------------------------- */
  (function accordion() {
    const root = $('#accordion');
    if (!root) return;
    const items = $$('.acc-item', root);

    items.forEach((item, i) => {
      const trigger = $('.acc-trigger', item);
      const panel   = $('.acc-panel', item);
      if (!trigger || !panel) return;

      const id = `acc-panel-${i}`;
      panel.id = id;
      trigger.setAttribute('aria-controls', id);

      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';

        // collapse siblings
        items.forEach(other => {
          if (other === item) return;
          $('.acc-trigger', other)?.setAttribute('aria-expanded', 'false');
          const p = $('.acc-panel', other);
          if (p) p.style.height = '0px';
        });

        trigger.setAttribute('aria-expanded', String(!isOpen));
        panel.style.height = isOpen ? '0px' : panel.scrollHeight + 'px';
      });
    });

    // Keep an open panel correctly sized when the layout reflows
    window.addEventListener('resize', () => {
      items.forEach(item => {
        const trigger = $('.acc-trigger', item);
        const panel   = $('.acc-panel', item);
        if (trigger?.getAttribute('aria-expanded') === 'true' && panel) {
          panel.style.height = panel.scrollHeight + 'px';
        }
      });
    });
  })();

  /* -------------------------------------------------------
     Contact form — client-side validation
     NOTE: this does NOT send anything. Wire the form up to a
     handler (Formspree, Netlify Forms, your own endpoint) and
     replace the simulated submit below.
     ------------------------------------------------------- */
  (function contactForm() {
    const form   = $('#contactForm');
    const status = $('#formStatus');
    if (!form) return;

    const rules = {
      name:    v => v.trim().length >= 2            || 'Please tell us your name.',
      email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
      topic:   v => v !== ''                        || 'Please choose what you need help with.',
      message: v => v.trim().length >= 15           || 'A sentence or two of context helps us prepare.',
      consent: (v, el) => el.checked                || 'We need your consent to reply.'
    };

    const showError = (name, msg) => {
      const el = form.elements[name];
      const box = form.querySelector(`[data-error-for="${name}"]`);
      el?.closest('.field')?.classList.add('has-error');
      if (box) { box.textContent = msg; box.classList.add('is-visible'); }
    };

    const clearError = (name) => {
      const el = form.elements[name];
      const box = form.querySelector(`[data-error-for="${name}"]`);
      el?.closest('.field')?.classList.remove('has-error');
      if (box) { box.textContent = ''; box.classList.remove('is-visible'); }
    };

    const validateField = (name) => {
      const el = form.elements[name];
      if (!el || !rules[name]) return true;
      const result = rules[name](el.value, el);
      if (result === true) { clearError(name); return true; }
      showError(name, result);
      return false;
    };

    // Re-validate a field once it has been touched and corrected
    Object.keys(rules).forEach(name => {
      const el = form.elements[name];
      if (!el) return;
      el.addEventListener('blur', () => validateField(name));
      el.addEventListener('input', () => {
        if (el.closest('.field')?.classList.contains('has-error') || name === 'consent') {
          validateField(name);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      const failed = Object.keys(rules).filter(name => !validateField(name));

      if (failed.length) {
        const first = form.elements[failed[0]];
        first?.focus();
        first?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        status.textContent = 'Please fix the highlighted fields and try again.';
        status.classList.add('is-error', 'is-visible');
        return;
      }

      // --- Simulated submit. Replace with a real fetch() to your handler. ---
      const btn = form.querySelector('button[type="submit"]');
      const label = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = 'Sending…';

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = label;
        form.reset();
        status.textContent = 'Thank you — your enquiry has been received. We reply within one working day. (Demo only: this form is not yet connected to a mail handler.)';
        status.classList.add('is-success', 'is-visible');
        status.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }, 900);
    });
  })();

  /* -------------------------------------------------------
     Footer year
     ------------------------------------------------------- */
  (function year() {
    const el = $('#year');
    if (el) el.textContent = new Date().getFullYear();
  })();

})();
