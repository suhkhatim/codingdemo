/* =============================================================
   Chaos Confections — interactions
   No dependencies. Every module is independent and no-ops if its
   markup is absent, so sections can be removed without breaking JS.
   ============================================================= */
(function () {
  'use strict';

  /* -----------------------------------------------------------
     CONFIG — the only two values you should need to edit.
     ----------------------------------------------------------- */

  // Paste your Formspree form ID here (the part after /f/ in the
  // endpoint, e.g. 'xbjnqlkz') to start receiving inquiries by email.
  // Leave it empty and the form falls back to opening a pre-filled email.
  var FORMSPREE_ID = '';

  // Used by the mailto: fallback, and shown to the visitor if sending fails.
  var CONTACT_EMAIL = 'hello@chaosconfections.com';


  /* -----------------------------------------------------------
     Helpers
     ----------------------------------------------------------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reducedMotion() { return motionQuery.matches; }

  function clamp(n, min, max) { return n < min ? min : (n > max ? max : n); }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }


  /* -----------------------------------------------------------
     Images — the logo and photos are supplied by the client and
     may not exist yet. Reveal each one only once it actually
     loads; otherwise its styled placeholder stays put, so a
     missing file never renders a broken-image icon.
     ----------------------------------------------------------- */

  function initImages() {
    $$('.media, .nav__mark, .footer__mark').forEach(function (slot) {
      var img = $('img', slot);
      if (!img) return;

      function ready() { slot.classList.add('is-ready'); }

      // complete && naturalWidth guards against a cached 404, where
      // complete is true but nothing decoded.
      if (img.complete) {
        if (img.naturalWidth > 0) ready();
        return;
      }
      img.addEventListener('load', ready, { once: true });
      img.addEventListener('error', function () { /* keep the placeholder */ }, { once: true });
    });
  }


  /* -----------------------------------------------------------
     Nav — sticky background, mobile menu
     ----------------------------------------------------------- */

  function initNav() {
    var nav = $('#nav');
    var toggle = $('#navToggle');
    var menu = $('#navMenu');
    if (!nav) return;

    function close() {
      if (!toggle || !menu) return;
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
    }

    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        menu.classList.toggle('is-open', !open);
      });

      // Tapping a link on mobile should dismiss the menu.
      $$('a', menu).forEach(function (a) {
        a.addEventListener('click', close);
      });

      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (toggle.getAttribute('aria-expanded') !== 'true') return;
        close();
        toggle.focus();
      });

      document.addEventListener('click', function (e) {
        if (toggle.getAttribute('aria-expanded') !== 'true') return;
        if (nav.contains(e.target)) return;
        close();
      });
    }

    return { setScrolled: function (on) { nav.classList.toggle('is-scrolled', on); } };
  }


  /* -----------------------------------------------------------
     Hero scroll progress

     One rAF-throttled scroll listener writes a single normalized
     0 -> 1 value to :root. CSS derives the badge scale, the nav
     mark fade, and all four parallax layers from it — so there is
     no per-element JS and nothing reads layout during a scroll.
     ----------------------------------------------------------- */

  function initHeroScroll(nav) {
    var hero = $('.hero');
    var root = document.documentElement;
    var span = 1;
    var ticking = false;

    function measure() {
      // Measured on load and on resize only — never inside the scroll handler.
      span = hero ? Math.max(hero.offsetHeight * 0.7, 1) : 1;
    }

    function update() {
      ticking = false;
      var y = window.pageYOffset || root.scrollTop || 0;
      if (hero) root.style.setProperty('--hp', clamp(y / span, 0, 1).toFixed(4));
      if (nav) nav.setScrolled(y > 24);
    }

    function onScroll() {
      if (ticking) return;   // at most one rAF in flight
      ticking = true;
      window.requestAnimationFrame(update);
    }

    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', debounce(function () { measure(); update(); }, 150));
  }


  /* -----------------------------------------------------------
     Reveals — one shared observer, unobserved after firing so
     nothing re-animates when you scroll back up.
     ----------------------------------------------------------- */

  function initReveals() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (reducedMotion() || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }


  /* -----------------------------------------------------------
     Scrollspy — highlights the nav link for the section in view.
     ----------------------------------------------------------- */

  function initScrollspy() {
    if (!('IntersectionObserver' in window)) return;

    var links = {};
    $$('.nav__list a[href^="#"]').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });

    var sections = Object.keys(links)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    if (!sections.length) return;

    function clear() {
      Object.keys(links).forEach(function (id) { links[id].removeAttribute('aria-current'); });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        clear();
        var link = links[entry.target.id];
        if (link) link.setAttribute('aria-current', 'location');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { io.observe(s); });
  }


  /* -----------------------------------------------------------
     Product cards — expand in place.

     Height is animated in CSS (grid-template-rows 0fr -> 1fr), so
     nothing is measured here. Panels start expanded in the markup
     and are collapsed on init, which means the details are still
     readable if JS never runs.
     ----------------------------------------------------------- */

  function initCards() {
    var toggles = $$('.card__toggle');
    if (!toggles.length) return;

    var cards = toggles.map(function (btn) { return btn.closest('.card'); });

    function setOpen(card, btn, open) {
      card.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      var label = $('.card__toggle-label', btn);
      if (label) label.textContent = open ? 'Close' : 'Details';
    }

    toggles.forEach(function (btn) {
      var card = btn.closest('.card');
      if (!card) return;

      setOpen(card, btn, false);

      btn.addEventListener('click', function () {
        var willOpen = btn.getAttribute('aria-expanded') !== 'true';

        // Only one open at a time keeps the grid from thrashing.
        cards.forEach(function (other, i) {
          if (other && other !== card) setOpen(other, toggles[i], false);
        });

        setOpen(card, btn, willOpen);
      });
    });
  }


  /* -----------------------------------------------------------
     Piping demo

     Strokes are stored as data and re-rendered, so resizing the
     canvas (which clears its backing store) does not wipe the
     drawing, and Clear is a one-liner.
     ----------------------------------------------------------- */

  function initPiping() {
    var canvas = $('#pipeCanvas');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var strokes = [];        // [{ tip, color, points: [{x,y}, ...] }]
    var current = null;
    var tip = 'round';
    var color = '#F8F1E3';

    var TIPS = {
      round:  { width: 15, cap: 'round', join: 'round' },
      star:   { width: 19, cap: 'round', join: 'round' },
      ribbon: { width: 26, cap: 'butt',  join: 'round' }
    };

    /* --- sizing ------------------------------------------------ */

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      redraw();
    }

    /* --- rendering --------------------------------------------- */

    function tracePath(points) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      if (points.length === 1) {
        // A tap should still leave a dot.
        ctx.lineTo(points[0].x + 0.01, points[0].y);
      } else {
        for (var i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    function drawStroke(stroke) {
      var spec = TIPS[stroke.tip] || TIPS.round;
      var pts = stroke.points;
      if (!pts.length) return;

      ctx.save();
      ctx.lineCap = spec.cap;
      ctx.lineJoin = spec.join;

      // Body of the icing, lifted off the surface a little.
      ctx.shadowColor = 'rgba(6, 14, 34, .45)';
      ctx.shadowBlur = 7;
      ctx.shadowOffsetY = 3;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = spec.width;
      tracePath(pts);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      if (stroke.tip === 'star') {
        // Ridges: a dark groove down the middle, highlights either side.
        ctx.globalAlpha = 0.30;
        ctx.strokeStyle = '#0D1B3E';
        ctx.lineWidth = spec.width * 0.22;
        tracePath(pts);

        ctx.globalAlpha = 0.34;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = spec.width * 0.16;
        ctx.translate(0, -spec.width * 0.26);
        tracePath(pts);
        ctx.translate(0, spec.width * 0.52);
        tracePath(pts);
      } else if (stroke.tip === 'ribbon') {
        // Flat band with a single soft highlight along the top edge.
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = spec.width * 0.18;
        ctx.translate(0, -spec.width * 0.28);
        tracePath(pts);
      } else {
        // Round: one gentle sheen so it reads as piped, not drawn.
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = spec.width * 0.20;
        ctx.translate(0, -spec.width * 0.22);
        tracePath(pts);
      }

      ctx.restore();
    }

    function redraw() {
      var rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      strokes.forEach(drawStroke);
    }

    /* --- drawing ------------------------------------------------ */

    function pointFrom(e) {
      var rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      current = { tip: tip, color: color, points: [pointFrom(e)] };
      strokes.push(current);
      redraw();
    });

    canvas.addEventListener('pointermove', function (e) {
      if (!current) return;
      var p = pointFrom(e);
      var last = current.points[current.points.length - 1];
      // Skip sub-pixel jitter so the point list stays small.
      if (Math.abs(p.x - last.x) < 1.2 && Math.abs(p.y - last.y) < 1.2) return;
      current.points.push(p);
      redraw();
    });

    function end(e) {
      if (!current) return;
      current = null;
      if (e && e.pointerId != null && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    }
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    /* --- controls ------------------------------------------------ */

    $$('[data-tip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tip = btn.getAttribute('data-tip');
        $$('[data-tip]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
      });
    });

    $$('[data-color]').forEach(function (btn) {
      // The swatch paints itself from its own data attribute.
      btn.style.setProperty('--sw', btn.getAttribute('data-color'));
      btn.addEventListener('click', function () {
        color = btn.getAttribute('data-color');
        $$('[data-color]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
      });
    });

    var clearBtn = $('#pipeClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        strokes = [];
        current = null;
        redraw();
      });
    }

    resize();
    window.addEventListener('resize', debounce(resize, 150));
  }


  /* -----------------------------------------------------------
     Testimonial carousel
     ----------------------------------------------------------- */

  function initCarousel() {
    var root = $('#carousel');
    var track = $('#carouselTrack');
    var viewport = $('#carouselViewport');
    if (!root || !track || !viewport) return;

    var slides = $$('.quote', track);
    if (slides.length < 2) return;

    var dotsWrap = $('#carouselDots');
    var status = $('#carouselStatus');
    var prev = $('#carouselPrev');
    var next = $('#carouselNext');

    var index = 0;
    var timer = null;
    var DELAY = 6000;
    var paused = false;

    /* --- dots --- */
    var dots = [];
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'carousel__dot';
        b.setAttribute('aria-label', 'Quote ' + (i + 1) + ' of ' + slides.length);
        b.addEventListener('click', function () { goTo(i); restart(); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    function render(offsetPx) {
      var w = viewport.getBoundingClientRect().width;
      var x = -index * w + (offsetPx || 0);
      track.style.transform = 'translate3d(' + x + 'px, 0, 0)';
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      render(0);

      dots.forEach(function (d, di) { d.classList.toggle('is-active', di === index); });
      slides.forEach(function (s, si) {
        // Off-screen quotes stay out of the tab order and the a11y tree.
        s.setAttribute('aria-hidden', String(si !== index));
      });
      if (status) status.textContent = 'Quote ' + (index + 1) + ' of ' + slides.length;
    }

    /* --- auto-advance --- */

    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function start() {
      // Never auto-advance under reduced motion, while hovered/focused,
      // or while the tab is in the background.
      if (reducedMotion() || paused || document.hidden) return;
      stop();
      timer = setInterval(function () { goTo(index + 1); }, DELAY);
    }

    function restart() { stop(); start(); }

    function setPaused(on) { paused = on; if (on) stop(); else start(); }

    root.addEventListener('mouseenter', function () { setPaused(true); });
    root.addEventListener('mouseleave', function () { setPaused(false); });
    root.addEventListener('focusin', function () { setPaused(true); });
    root.addEventListener('focusout', function () {
      if (!root.contains(document.activeElement)) setPaused(false);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    if (prev) prev.addEventListener('click', function () { goTo(index - 1); restart(); });
    if (next) next.addEventListener('click', function () { goTo(index + 1); restart(); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { goTo(index - 1); restart(); }
      else if (e.key === 'ArrowRight') { goTo(index + 1); restart(); }
    });

    /* --- drag / swipe --- */

    var dragging = false, startX = 0, delta = 0;
    var THRESHOLD = 55;

    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      delta = 0;
      track.style.transition = 'none';
      stop();
    });

    viewport.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      delta = e.clientX - startX;
      render(delta);
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      track.style.transition = '';

      if (delta <= -THRESHOLD) goTo(index + 1);
      else if (delta >= THRESHOLD) goTo(index - 1);
      else render(0);

      delta = 0;
      start();
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('pointerleave', endDrag);

    window.addEventListener('resize', debounce(function () { render(0); }, 150));

    goTo(0);
    start();
  }


  /* -----------------------------------------------------------
     Contact form
     ----------------------------------------------------------- */

  function initForm() {
    var form = $('#contactForm');
    if (!form) return;

    var statusEl = $('#formStatus');
    var submitBtn = $('#formSubmit');
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    var fields = ['name', 'email', 'type', 'message'].map(function (id) {
      return { input: $('#' + id, form), err: $('#' + id + '-err', form) };
    }).filter(function (f) { return f.input; });

    function setError(field, on) {
      field.input.setAttribute('aria-invalid', String(on));
      if (field.err) field.err.hidden = !on;
    }

    function valid(field) {
      var v = (field.input.value || '').trim();
      if (!v) return false;
      if (field.input.type === 'email') return EMAIL_RE.test(v);
      return true;
    }

    function validate(field) {
      var ok = valid(field);
      setError(field, !ok);
      return ok;
    }

    fields.forEach(function (field) {
      field.input.addEventListener('blur', function () { validate(field); });
      // Clear the error as soon as they start fixing it.
      field.input.addEventListener('input', function () {
        if (field.input.getAttribute('aria-invalid') === 'true' && valid(field)) setError(field, false);
      });
      field.input.addEventListener('change', function () {
        if (field.input.getAttribute('aria-invalid') === 'true' && valid(field)) setError(field, false);
      });
    });

    function say(message, kind) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = 'form__status is-shown ' + (kind === 'err' ? 'is-err' : 'is-ok');
    }

    function values() {
      var out = {};
      ['name', 'email', 'type', 'date', 'message'].forEach(function (id) {
        var el = $('#' + id, form);
        if (el) out[id] = (el.value || '').trim();
      });
      return out;
    }

    function mailtoFallback(v) {
      var subject = '[' + (v.type || 'Inquiry') + '] ' + (v.name || 'Website inquiry');
      var body = [
        'Name: ' + v.name,
        'Email: ' + v.email,
        'Inquiry type: ' + v.type,
        'Date needed: ' + (v.date || '—'),
        '',
        v.message
      ].join('\n');

      window.location.href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      say('Opening your email app with the details filled in — press send there to reach us. ' +
          'If nothing opened, email ' + CONTACT_EMAIL + ' directly.', 'ok');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var allOk = true;
      var firstBad = null;
      fields.forEach(function (field) {
        if (!validate(field)) {
          allOk = false;
          if (!firstBad) firstBad = field.input;
        }
      });

      if (!allOk) {
        say('Please check the highlighted fields and try again.', 'err');
        if (firstBad) firstBad.focus();
        return;
      }

      // Honeypot: a bot filled the hidden field. Show success, send nothing.
      var hp = $('#company', form);
      if (hp && hp.value) {
        form.reset();
        say('Thanks — your inquiry is on its way.', 'ok');
        return;
      }

      var v = values();

      if (!FORMSPREE_ID) {
        mailtoFallback(v);
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
      say('Sending your inquiry…', 'ok');

      fetch('https://formspree.io/f/' + FORMSPREE_ID, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(v)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Bad response');
          form.reset();
          fields.forEach(function (f) { setError(f, false); });
          say('Thanks, ' + v.name.split(' ')[0] + ' — your inquiry is in. Marcus usually replies within two business days.', 'ok');
        })
        .catch(function () {
          mailtoFallback(v);
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send inquiry'; }
        });
    });
  }


  /* -----------------------------------------------------------
     Misc
     ----------------------------------------------------------- */

  function initYear() {
    var el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  }


  /* -----------------------------------------------------------
     Boot
     ----------------------------------------------------------- */

  function init() {
    initImages();
    var nav = initNav();
    initHeroScroll(nav);
    initReveals();
    initScrollspy();
    initCards();
    initPiping();
    initCarousel();
    initForm();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
