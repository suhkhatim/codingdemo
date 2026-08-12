/* =========================================================
   The Yeast Coast — front-end behavior
   No dependencies, no build step.
   ========================================================= */

/* ---------------------------------------------------------
   CONFIG — edit this block and nothing else to rebrand.
   --------------------------------------------------------- */
const CONFIG = {
  businessName: 'The Yeast Coast',
  orderEmail:   'hello@example.com',   // where order emails are sent
  instagram:    'theyeastcoast',       // handle, no @
  pickupWeekday: 6,                    // 0=Sun … 6=Sat
  leadTimeDays:  3,                    // earliest pickup, in days from today
  pickupSlots:   6                     // how many upcoming dates to offer
};

/* =========================================================
   Branding — push CONFIG into the page
   ========================================================= */
(function applyBranding() {
  document.querySelectorAll('[data-business-name]').forEach(function (el) {
    el.textContent = CONFIG.businessName;
  });

  document.title = CONFIG.businessName + ' — Small-batch Japanese milk bread, baked at home';

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
   Nav — mobile toggle + stuck shadow
   ========================================================= */
(function nav() {
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');
  const bar    = document.getElementById('nav');

  toggle.addEventListener('click', function () {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Close the mobile menu after tapping a link.
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  const onScroll = function () {
    bar.classList.toggle('is-stuck', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* =========================================================
   Reveal on scroll
   ========================================================= */
(function reveal() {
  const items = document.querySelectorAll('.reveal');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (!entry.isIntersecting) return;
      // Small stagger so groups of cards cascade rather than pop together.
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
  // Looked up by id, not form.<name> — HTMLFormElement.name is the form's own
  // attribute, so form.name would shadow the text input and return a string.
  const nameInput   = document.getElementById('name');
  const emailInput  = document.getElementById('email');
  const phoneInput  = document.getElementById('phone');
  const notesInput  = document.getElementById('notes');
  const statusEl    = document.getElementById('orderStatus');
  const summaryList = document.getElementById('summaryList');
  const summaryTot  = document.getElementById('summaryTotal');
  const dmBtn       = document.getElementById('dmBtn');

  const boxInputs    = Array.from(form.querySelectorAll('input[name="box"]'));
  const flavorInputs = Array.from(flavorGrid.querySelectorAll('input[name="flavor"]'));

  /* ---------- pickup dates ---------- */
  function upcomingPickups() {
    const dates = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() + CONFIG.leadTimeDays);

    // Walk forward to the first eligible pickup weekday.
    while (cursor.getDay() !== CONFIG.pickupWeekday) {
      cursor.setDate(cursor.getDate() + 1);
    }
    for (let i = 0; i < CONFIG.pickupSlots; i++) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return dates;
  }

  (function fillPickups() {
    const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    upcomingPickups().forEach(function (d) {
      const opt = document.createElement('option');
      opt.value = fmt.format(d);
      opt.textContent = fmt.format(d);
      pickupSel.appendChild(opt);
    });
  })();

  /* ---------- state helpers ---------- */
  function selectedBox() {
    return boxInputs.find(function (i) { return i.checked; });
  }
  function selectedFlavors() {
    return flavorInputs.filter(function (i) { return i.checked; });
  }
  function maxFlavors() {
    return Number(selectedBox().dataset.max);
  }
  function boxPrice() {
    return Number(selectedBox().dataset.price);
  }
  function qty() {
    const n = parseInt(qtyInput.value, 10);
    return Number.isNaN(n) ? 1 : Math.min(20, Math.max(1, n));
  }

  /* ---------- enforce the flavor cap ---------- */
  function applyFlavorCap() {
    const max = maxFlavors();
    const chosen = selectedFlavors();

    // If the box shrank, drop the extras from the end of the selection.
    while (chosen.length > max) {
      chosen.pop().checked = false;
    }

    const atCap = selectedFlavors().length >= max;
    flavorInputs.forEach(function (input) {
      const lock = atCap && !input.checked;
      input.disabled = lock;
      input.closest('.choice').classList.toggle('is-disabled', lock);
    });

    flavorHint.textContent = 'Pick up to ' + max;
  }

  /* ---------- live summary ---------- */
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
      row('Box', d.boxLabel + ' · ' + d.pieces + ' bites'),
      row('Quantity', d.qty + (d.qty === 1 ? ' box' : ' boxes')),
      row('Flavors', d.flavors.length ? d.flavors.join(', ') : 'None picked yet'),
      row('Pickup', d.pickup || '—')
    );
    summaryTot.textContent = '$' + (d.price * d.qty);
  }

  /* ---------- validation ---------- */
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
    if (!selectedFlavors().length) return flavorInputs[0];
    if (!nameInput.value.trim()) return nameInput;
    return emailInput;
  }

  /* ---------- message building ---------- */
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

  /* ---------- events ---------- */
  boxInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      applyFlavorCap();
      renderSummary();
    });
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
    input.addEventListener('blur', function () {
      if (input.value.trim()) validate();
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      say('Just a couple of things to fix above.', true);
      firstInvalid().focus();
      return;
    }

    const d = orderData();
    const subject = 'Box order — ' + d.name + ' — ' + d.pickup;
    const href = 'mailto:' + CONFIG.orderEmail +
      '?subject=' + encodeURIComponent(subject) +
      '&body='    + encodeURIComponent(orderText());

    window.location.href = href;
    say('Opening your email app — hit send and we’ll confirm within a day.');
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
      say('Order copied. Opening Instagram — paste it into a DM.');
      window.open('https://instagram.com/' + CONFIG.instagram, '_blank', 'noopener');
    } else {
      say('Couldn’t copy automatically — email works, or screenshot your summary.', true);
    }
  });

  /* ---------- init ---------- */
  applyFlavorCap();
  renderSummary();
})();
