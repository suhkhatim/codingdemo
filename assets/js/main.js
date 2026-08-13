/* =========================================================
   S² People Advisory — behaviour
   Deliberately small. The page is a document: it should be
   readable and complete with none of this running.
   ========================================================= */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------
     The mark draws itself in: navy first, then the gold S
     closing over it. The interlock is the practice's premise,
     which is the only reason this animation is here.
     ------------------------------------------------------- */
  (function drawMark() {
    const svg = $('#coverMark');
    if (!svg || reduceMotion) return;

    const paths = $$('path', svg);
    if (!paths.length) return;

    paths.forEach(p => p.style.setProperty('--len', p.getTotalLength()));
    svg.classList.add('mark-draw');
    // Two frames: the dash offset must be painted before the transition starts.
    requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.add('is-drawn')));
  })();

  /* -------------------------------------------------------
     Spine index tracks the section being read
     ------------------------------------------------------- */
  (function bookmark() {
    const links = $$('.index-list a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const pairs = links
      .map(a => ({ a, section: document.querySelector(a.getAttribute('href')) }))
      .filter(p => p.section);
    if (!pairs.length) return;

    // Track every section's ratio and mark the most visible one, so short
    // sections at the end of the page still get their turn.
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => seen.set(e.target, e.intersectionRatio));

      let best = null, bestRatio = 0;
      seen.forEach((ratio, section) => {
        if (ratio > bestRatio) { bestRatio = ratio; best = section; }
      });

      links.forEach(a => a.classList.remove('is-here'));
      if (best) {
        const hit = pairs.find(p => p.section === best);
        if (hit) hit.a.classList.add('is-here');
      }
    }, { threshold: [0, .1, .25, .5, .75, 1] });

    pairs.forEach(p => io.observe(p.section));
  })();

  /* -------------------------------------------------------
     Mobile: the index drops out of the bar as a sheet
     ------------------------------------------------------- */
  (function sheet() {
    const btn   = $('#sheetToggle');
    const panel = $('#sheet');
    if (!btn || !panel) return;

    let scrim = null;

    const setOpen = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      $('.topbar-btn-label', btn).textContent = open ? 'Close' : 'Index';
      panel.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);

      if (open && !scrim) {
        scrim = document.createElement('div');
        scrim.className = 'scrim';
        scrim.addEventListener('click', () => setOpen(false));
        document.body.appendChild(scrim);
      } else if (!open && scrim) {
        scrim.remove();
        scrim = null;
      }
    };

    btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
    $$('a', panel).forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
    window.matchMedia('(min-width: 941px)').addEventListener('change', e => {
      if (e.matches) setOpen(false);
    });
  })();

  /* -------------------------------------------------------
     Disciplines open in place. Several may stay open at once —
     it's an index to read across, not a set of tabs.
     ------------------------------------------------------- */
  (function ledger() {
    const rows = $$('#ledger .row');
    if (!rows.length) return;

    rows.forEach((row, i) => {
      const head  = $('.row-head', row);
      const panel = $('.row-panel', row);
      if (!head || !panel) return;

      panel.id = `discipline-${i + 1}`;
      head.setAttribute('aria-controls', panel.id);

      head.addEventListener('click', () => {
        const open = head.getAttribute('aria-expanded') === 'true';
        head.setAttribute('aria-expanded', String(!open));
        panel.style.height = open ? '0px' : panel.scrollHeight + 'px';
      });
    });

    // Keep open panels correctly sized through reflow
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        rows.forEach(row => {
          const head  = $('.row-head', row);
          const panel = $('.row-panel', row);
          if (head?.getAttribute('aria-expanded') === 'true' && panel) {
            panel.style.height = 'auto';
            panel.style.height = panel.scrollHeight + 'px';
          }
        });
      }, 120);
    });
  })();

  /* -------------------------------------------------------
     Enquiry form — validates only. It does not send:
     give the <form> an action and replace the block marked
     below with a real fetch().
     ------------------------------------------------------- */
  (function enquiry() {
    const form   = $('#contactForm');
    const status = $('#formStatus');
    if (!form) return;

    const rules = {
      name:    v => v.trim().length >= 2 || 'Please tell us your name.',
      email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'That email address doesn’t look right.',
      topic:   v => v !== '' || 'Please choose a discipline.',
      message: v => v.trim().length >= 15 || 'A sentence or two of context helps us prepare.',
      consent: (v, el) => el.checked || 'We need your consent to reply.'
    };

    const mark = (name, msg) => {
      const el  = form.elements[name];
      const box = form.querySelector(`[data-error-for="${name}"]`);
      el?.closest('.f')?.classList.toggle('is-bad', !!msg);
      if (box) { box.textContent = msg || ''; box.classList.toggle('on', !!msg); }
    };

    const check = (name) => {
      const el = form.elements[name];
      if (!el || !rules[name]) return true;
      const r = rules[name](el.value, el);
      mark(name, r === true ? '' : r);
      return r === true;
    };

    Object.keys(rules).forEach(name => {
      const el = form.elements[name];
      if (!el) return;
      el.addEventListener('blur', () => check(name));
      el.addEventListener('input', () => {
        if (el.closest('.f')?.classList.contains('is-bad') || name === 'consent') check(name);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      const failed = Object.keys(rules).filter(n => !check(n));
      if (failed.length) {
        const first = form.elements[failed[0]];
        first?.focus();
        first?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        status.textContent = 'Some details are missing — see the marked fields above.';
        status.classList.add('bad', 'on');
        return;
      }

      // --- Stand-in for a real submit ---------------------
      const btn = form.querySelector('button[type="submit"]');
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending…';

      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = label;
        form.reset();
        status.textContent = 'Received, thank you — we reply within one working day. (Demo only: this form is not yet connected to a mail handler.)';
        status.classList.add('ok', 'on');
      }, 700);
      // ----------------------------------------------------
    });
  })();

  /* ------------------------------------------------------- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

})();
