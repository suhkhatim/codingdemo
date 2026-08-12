/* =========================================================
   The Yeast Coast — front-end behavior
   No dependencies, no build step.
   ========================================================= */

/* ---------------------------------------------------------
   CONFIG — the only block you need to edit.
   THIS_WEEK is the part to update each week.
   --------------------------------------------------------- */
const CONFIG = {
  businessName: 'The Yeast Coast',
  orderEmail:   'hello@example.com',   // where order emails are sent
  instagram:    'theyeastcoast',       // handle, no @

  pickupWeekday: 6,                    // 0=Sun … 6=Sat
  leadTimeDays:  3,                    // earliest pickup, in days from today
  pickupSlots:   6,                    // how many upcoming dates to offer
  cutoffDay:     'Wednesday',

  // ---- update these every week ----
  thisWeek: {
    boxesTotal: 20,
    boxesLeft:  6,
    soldOut:    ['Ube']                // flavor names, exactly as written below
  }
};

const FLAVORS = [
  'Classic Milk', 'Honey Butter', 'Hokkaido Custard', 'Cinnamon Sugar',
  'Matcha White Chocolate', 'Black Sesame', 'Ube', 'Chocolate Hazelnut'
];

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =========================================================
   Branding
   ========================================================= */
(function applyBranding() {
  document.querySelectorAll('[data-business-name]').forEach(function (el) {
    el.textContent = CONFIG.businessName;
  });

  const emailLink = document.querySelector('[data-contact="email"]');
  if (emailLink) {
    emailLink.href = 'mailto:' + CONFIG.orderEmail;
    emailLink.textContent = CONFIG.orderEmail;
  }

  const igLink = document.querySelector('[data-contact="instagram"]');
  if (igLink) {
    igLink.href = 'https://instagram.com/' + CONFIG.instagram;
    igLink.textContent = '@' + CONFIG.instagram;
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

/* =========================================================
   Photo slots
   The markup points at real files. Until those files exist the figure is
   flagged and the placeholder underneath shows instead, so the layout is
   photo-shaped from the start and adding a photo is just dropping a file in.
   ========================================================= */
(function photoSlots() {
  document.querySelectorAll('.photo').forEach(function (fig) {
    const img = fig.querySelector('img');
    if (!img) return;
    const markEmpty = function () { fig.classList.add('is-empty'); };
    if (img.complete) {
      if (!img.naturalWidth) markEmpty();
    } else {
      img.addEventListener('error', markEmpty);
    }
  });
})();

/* =========================================================
   Pickup dates — shared by the week bar and the order form
   ========================================================= */
function upcomingPickups() {
  const dates = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + CONFIG.leadTimeDays);
  while (cursor.getDay() !== CONFIG.pickupWeekday) {
    cursor.setDate(cursor.getDate() + 1);
  }
  for (let i = 0; i < CONFIG.pickupSlots; i++) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return dates;
}
const PICKUP_FMT = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

/* =========================================================
   This week's bake
   ========================================================= */
(function weekBar() {
  const dateEl  = document.getElementById('weekDate');
  const leftEl  = document.getElementById('weekLeft');
  const totalEl = document.getElementById('weekTotal');
  const meterEl = document.getElementById('weekMeter');
  const soldEl  = document.getElementById('weekSold');
  const cutEl   = document.getElementById('weekCutoff');
  if (!dateEl) return;

  const w = CONFIG.thisWeek;
  const left = Math.max(0, Math.min(w.boxesLeft, w.boxesTotal));
  const taken = w.boxesTotal - left;

  dateEl.textContent  = PICKUP_FMT.format(upcomingPickups()[0]);
  leftEl.textContent  = left;
  totalEl.textContent = w.boxesTotal;
  if (cutEl) cutEl.textContent = CONFIG.cutoffDay;

  // Fill shows how much is spoken for, so a busy week reads as a full bar.
  const pct = w.boxesTotal ? Math.round((taken / w.boxesTotal) * 100) : 0;
  if (reduced) meterEl.style.width = pct + '%';
  else requestAnimationFrame(function () {
    setTimeout(function () { meterEl.style.width = pct + '%'; }, 250);
  });

  if (w.soldOut && w.soldOut.length) {
    soldEl.textContent = 'Sold out this week: ' + w.soldOut.join(', ');
    soldEl.hidden = false;
  }
})();

/* =========================================================
   Sold-out flavors — marked on the menu and locked in the form
   ========================================================= */
(function soldOut() {
  const out = (CONFIG.thisWeek.soldOut || []).filter(function (name) {
    if (FLAVORS.indexOf(name) !== -1) return true;
    console.warn('CONFIG.thisWeek.soldOut: no flavor named "' + name + '"');
    return false;
  });
  if (!out.length) return;

  out.forEach(function (name) {
    const card = document.querySelector('.flavor[data-flavor="' + CSS.escape(name) + '"]');
    if (card) {
      card.classList.add('is-out');
      const stamp = document.createElement('span');
      stamp.className = 'flavor__stamp';
      stamp.textContent = 'Sold out';
      card.appendChild(stamp);
    }
    const input = document.querySelector('#flavorGrid input[value="' + CSS.escape(name) + '"]');
    if (input) {
      input.checked = false;
      input.disabled = true;
      input.dataset.soldOut = 'true';
      input.closest('.choice').classList.add('is-out');
    }
  });
})();

/* =========================================================
   Nav
   ========================================================= */
(function nav() {
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');
  const bar    = document.getElementById('nav');

  toggle.addEventListener('click', function () {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  const onScroll = function () { bar.classList.toggle('is-stuck', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* =========================================================
   Scroll-driven bake
   The placeholder bites brown from pale to golden as the hero scrolls past —
   one orchestrated moment rather than a scattering of small ones.
   ========================================================= */
(function bake() {
  const pan = document.querySelector('.pan');
  if (!pan) return;
  if (reduced) { pan.style.setProperty('--bake', '100%'); return; }

  const hero = document.getElementById('top');
  let queued = false;

  const update = function () {
    queued = false;
    const h = hero.getBoundingClientRect();
    // 0 while the hero is fully in view, 1 by the time it has left the top.
    const progress = Math.min(1, Math.max(0, -h.top / Math.max(1, h.height * 0.75)));
    pan.style.setProperty('--bake', Math.round(progress * 100) + '%');
  };

  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
})();

/* =========================================================
   Reveal on scroll
   ========================================================= */
(function reveal() {
  const items = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (!entry.isIntersecting) return;
      setTimeout(function () { entry.target.classList.add('is-in'); }, i * 70);
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });
})();

/* =========================================================
   Order form
   ========================================================= */
(function orderForm() {
  const form = document.getElementById('orderForm');
  if (!form) return;

  const flavorGrid  = document.getElementById('flavorGrid');
  const flavorHint  = document.getElementById('flavorHint');
  const flavorError = document.getElementById('flavorError');
  const qtyInput    = document.getElementById('qty');
  const pickupSel   = document.getElementById('pickup');
  const statusEl    = document.getElementById('orderStatus');
  const summaryList = document.getElementById('summaryList');
  const summaryTot  = document.getElementById('summaryTotal');
  const dmBtn       = document.getElementById('dmBtn');

  // Looked up by id, not form.<name> — HTMLFormElement.name is the form's own
  // attribute, so form.name would shadow the text input and return a string.
  const nameInput  = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const notesInput = document.getElementById('notes');

  const boxInputs    = Array.from(form.querySelectorAll('input[name="box"]'));
  const flavorInputs = Array.from(flavorGrid.querySelectorAll('input[name="flavor"]'));
  const isSoldOut = function (input) { return input.dataset.soldOut === 'true'; };

  (function fillPickups() {
    upcomingPickups().forEach(function (d) {
      const opt = document.createElement('option');
      opt.value = PICKUP_FMT.format(d);
      opt.textContent = PICKUP_FMT.format(d);
      pickupSel.appendChild(opt);
    });
  })();

  function selectedBox()     { return boxInputs.find(function (i) { return i.checked; }); }
  function selectedFlavors() { return flavorInputs.filter(function (i) { return i.checked; }); }
  function maxFlavors()      { return Number(selectedBox().dataset.max); }
  function boxPrice()        { return Number(selectedBox().dataset.price); }
  function qty() {
    const n = parseInt(qtyInput.value, 10);
    return Number.isNaN(n) ? 1 : Math.min(20, Math.max(1, n));
  }

  /* Sold-out flavors stay locked regardless of how much room the box has. */
  function applyFlavorCap() {
    const max = maxFlavors();
    const chosen = selectedFlavors();
    while (chosen.length > max) chosen.pop().checked = false;

    const atCap = selectedFlavors().length >= max;
    flavorInputs.forEach(function (input) {
      if (isSoldOut(input)) { input.disabled = true; return; }
      const lock = atCap && !input.checked;
      input.disabled = lock;
      input.closest('.choice').classList.toggle('is-disabled', lock);
    });
    flavorHint.textContent = 'Pick up to ' + max;
  }

  function orderData() {
    const box = selectedBox();
    return {
      boxLabel: box.closest('.choice').querySelector('.choice__title').textContent,
      pieces:   Number(box.value),
      price:    boxPrice(),
      qty:      qty(),
      flavors:  selectedFlavors().map(function (i) { return i.value; }),
      pickup:   pickupSel.value,
      name:     nameInput.value.trim(),
      email:    emailInput.value.trim(),
      phone:    phoneInput.value.trim(),
      notes:    notesInput.value.trim()
    };
  }

  function row(term, detail) {
    const wrap = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = term;
    dd.textContent = detail;
    wrap.append(dt, dd);
    return wrap;
  }

  function renderSummary() {
    const d = orderData();
    summaryList.replaceChildren(
      row('Box', d.boxLabel),
      row('Bites', String(d.pieces)),
      row('Qty', d.qty + (d.qty === 1 ? ' box' : ' boxes')),
      row('Flavors', d.flavors.length ? d.flavors.join(', ') : '—'),
      row('Pickup', d.pickup || '—')
    );
    summaryTot.textContent = '$' + (d.price * d.qty);
  }

  function setFieldError(input, show) {
    const msg = form.querySelector('[data-error-for="' + input.id + '"]');
    if (msg) msg.hidden = !show;
    input.setAttribute('aria-invalid', String(show));
  }

  function validate() {
    const nameOk   = nameInput.value.trim().length > 0;
    const emailOk  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
    const flavorOk = selectedFlavors().length > 0;
    setFieldError(nameInput, !nameOk);
    setFieldError(emailInput, !emailOk);
    flavorError.hidden = flavorOk;
    return nameOk && emailOk && flavorOk;
  }

  // First problem in reading order, so focus lands where the eye already is.
  function firstInvalid() {
    if (!selectedFlavors().length) {
      return flavorInputs.find(function (i) { return !isSoldOut(i); }) || flavorInputs[0];
    }
    if (!nameInput.value.trim()) return nameInput;
    return emailInput;
  }

  function orderText() {
    const d = orderData();
    const lines = [
      'Order for ' + d.pickup,
      '',
      'Box:      ' + d.boxLabel + ' (' + d.pieces + ' bites)',
      'Quantity: ' + d.qty,
      'Flavors:  ' + d.flavors.join(', '),
      'Total:    $' + (d.price * d.qty),
      '',
      'Name:  ' + d.name,
      'Email: ' + d.email
    ];
    if (d.phone) lines.push('Phone: ' + d.phone);
    if (d.notes) lines.push('', 'Notes: ' + d.notes);
    return lines.join('\n');
  }

  function say(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle('is-error', Boolean(isError));
  }

  boxInputs.forEach(function (input) {
    input.addEventListener('change', function () { applyFlavorCap(); renderSummary(); });
  });
  flavorInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      applyFlavorCap();
      renderSummary();
      if (selectedFlavors().length) flavorError.hidden = true;
    });
  });
  form.querySelectorAll('.stepper__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      qtyInput.value = Math.min(20, Math.max(1, qty() + Number(btn.dataset.step)));
      renderSummary();
    });
  });
  qtyInput.addEventListener('input', renderSummary);
  pickupSel.addEventListener('change', renderSummary);
  [nameInput, emailInput].forEach(function (input) {
    input.addEventListener('blur', function () { if (input.value.trim()) validate(); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      say('Just a couple of things to fix above.', true);
      firstInvalid().focus();
      return;
    }
    const d = orderData();
    const href = 'mailto:' + CONFIG.orderEmail +
      '?subject=' + encodeURIComponent('Box order — ' + d.name + ' — ' + d.pickup) +
      '&body='    + encodeURIComponent(orderText());
    window.location.href = href;
    say('Opening your email app — hit send and you’ll get a reply within a day.');
  });

  dmBtn.addEventListener('click', async function () {
    if (!validate()) {
      say('Add your name, email, and at least one flavor first.', true);
      return;
    }
    const text = orderText();
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (err) {
      // Clipboard API needs a secure context; fall back to a hidden textarea.
      const scratch = document.createElement('textarea');
      scratch.value = text;
      scratch.setAttribute('readonly', '');
      scratch.style.position = 'fixed';
      scratch.style.opacity = '0';
      document.body.appendChild(scratch);
      scratch.select();
      try { copied = document.execCommand('copy'); } catch (e2) { copied = false; }
      document.body.removeChild(scratch);
    }
    if (copied) {
      say('Ticket copied. Opening Instagram — paste it into a DM.');
      window.open('https://instagram.com/' + CONFIG.instagram, '_blank', 'noopener');
    } else {
      say('Couldn’t copy automatically — email works, or screenshot the ticket.', true);
    }
  });

  applyFlavorCap();
  renderSummary();
})();
