/* =========================================================
   The Yeast Coast: front-end behavior
   No dependencies, no build step.
   ========================================================= */

/* ---------------------------------------------------------
   CONFIG: the only block you need to edit.
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

  // Boxes are paid up front. Nothing is held until payment lands.
  //
  // Apple Pay and Google Pay are not handles. There is nothing to print on a
  // ticket the way a $cashtag or a Zelle address prints, because both are
  // wallet buttons that only appear inside a real checkout run by a payment
  // processor. Google's person-to-person transfers in the US closed in 2024,
  // so there is no Google equivalent of a Zelle address at all.
  //
  // That leaves two honest ways in, and both are below. Apple Cash is Apple's
  // person-to-person product and behaves exactly like the two above it: a
  // phone number, paid inside Messages, no fees and no account to open. The
  // payment link is a checkout page hosted by a processor (Square, Stripe and
  // PayPal all hand you one), and its page is what puts real Apple Pay and
  // Google Pay buttons in front of a customer. It costs roughly 2.9% + 30c a
  // box and needs an account with that processor, which is why it ships off:
  // paste a real link in and flip `on` to true. A pay button that goes nowhere
  // is worse than no pay button.
  //
  // Order matters, the ticket and the order email both read this list, and
  // anything switched off or left blank is skipped by both.
  payment: [
    { id: 'cashapp',   label: 'Cash App',   value: '$TheYeastCoast',    on: true },
    { id: 'zelle',     label: 'Zelle',      value: 'hello@example.com', on: true },
    { id: 'applecash', label: 'Apple Cash', value: '(555) 000-0000',    on: true,
      note: 'Send it in Messages' },
    { id: 'link',      label: 'Card, Apple Pay or Google Pay', kind: 'link',
      value: '', cta: 'Open checkout', on: false }
  ],

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

/* Roughly what each one looks like baked. The tray is meant to read as
   the actual box, so these are food colours, not brand colours. */
const FLAVOR_COLOR = {
  'Classic Milk':           '#F2DFC0',
  'Honey Butter':           '#E8B863',
  'Hokkaido Custard':       '#F5D97E',
  'Cinnamon Sugar':         '#C08A56',
  'Matcha White Chocolate': '#A8BE84',
  'Black Sesame':           '#6E6A6B',
  'Ube':                    '#8E7BB5',
  'Chocolate Hazelnut':     '#7A5138'
};

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* The payment methods a customer can actually use: switched on, and with
   something to show. The ticket and the order email both read this, so the two
   can never end up disagreeing about how someone is meant to pay. */
function payMethods() {
  return CONFIG.payment.filter(function (m) { return m.on && m.value; });
}

/* =========================================================
   Branding
   ========================================================= */
(function applyBranding() {
  document.querySelectorAll('[data-business-name]').forEach(function (el) {
    el.textContent = CONFIG.businessName;
  });

  // querySelectorAll, not querySelector: the privacy page carries a contact
  // link in the prose as well as the one in the footer.
  document.querySelectorAll('[data-contact="email"]').forEach(function (el) {
    el.href = 'mailto:' + CONFIG.orderEmail;
    el.textContent = CONFIG.orderEmail;
  });

  document.querySelectorAll('[data-contact="instagram"]').forEach(function (el) {
    el.href = 'https://instagram.com/' + CONFIG.instagram;
    el.textContent = '@' + CONFIG.instagram;
  });

  // The ticket's method rows are built from the config rather than written
  // into the markup, so adding a way to pay is one line in CONFIG.payment and
  // nothing else. A handle renders as a copyable value; a checkout link
  // renders as a link out, because you cannot copy your way to Apple Pay.
  const payList = document.getElementById('payMethods');
  if (payList) {
    payList.innerHTML = '';
    payMethods().forEach(function (m) {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = m.label;
      if (m.note) {
        const hint = document.createElement('em');
        hint.textContent = m.note;
        label.appendChild(hint);
      }
      li.appendChild(label);

      if (m.kind === 'link') {
        const a = document.createElement('a');
        a.className = 'ticket__paylink';
        a.href = m.value;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = m.cta || 'Pay online';
        li.appendChild(a);
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copyable';
        btn.setAttribute('data-copy', '');
        btn.setAttribute('data-pay', m.id);
        btn.setAttribute('aria-label', 'Copy ' + m.label + ' handle');
        btn.textContent = m.value;
        li.appendChild(btn);
      }
      payList.appendChild(li);
    });
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
   Pickup dates, shared by the week bar and the order form
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
   The week: mark today, and say plainly whether ordering is open
   ========================================================= */
(function weekStatus() {
  const days = document.querySelectorAll('.week__day');
  const statusEl = document.getElementById('weekStatus');
  if (!days.length) return;

  const today = new Date().getDay();          // 0=Sun … 6=Sat
  const CUTOFF = 3;                           // Wednesday
  if (days[today]) days[today].classList.add('is-today');

  if (!statusEl) return;
  const name = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date());
  const nextBake = PICKUP_FMT.format(upcomingPickups()[0]);

  if (today <= CUTOFF) {
    const daysLeft = CUTOFF - today;
    statusEl.innerHTML = daysLeft === 0
      ? 'It\'s <strong>' + name + '</strong>, and today is the cutoff. Orders for ' + nextBake + ' close tonight.'
      : 'It\'s <strong>' + name + '</strong>. You have ' + daysLeft + ' day' + (daysLeft === 1 ? '' : 's')
        + ' left to order for <strong>' + nextBake + '</strong>.';
  } else {
    statusEl.innerHTML = 'It\'s <strong>' + name + '</strong>, so this week\'s list has closed and the dough is planned. '
      + 'Orders sent now go on the list for <strong>' + nextBake + '</strong>.';
  }
})();

/* =========================================================
   Sold-out flavors: marked on the menu and locked in the form
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
   Copy to clipboard, used by the payment handles
   ========================================================= */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Clipboard API needs a secure context; fall back to a hidden textarea.
    const scratch = document.createElement('textarea');
    scratch.value = text;
    scratch.setAttribute('readonly', '');
    scratch.style.position = 'fixed';
    scratch.style.opacity = '0';
    document.body.appendChild(scratch);
    scratch.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(scratch);
    return ok;
  }
}

/* Delegated rather than bound to each button at load, because the payment rows
   are rendered from the config and would otherwise have to exist before this
   module ran to be clickable at all. */
(function copyables() {
  document.addEventListener('click', async function (event) {
    const btn = event.target.closest('[data-copy]');
    if (!btn) return;
    if (!(await copyText(btn.textContent.replace(/\s*copied$/, '').trim()))) return;
    btn.classList.add('is-copied');
    setTimeout(function () { btn.classList.remove('is-copied'); }, 1600);
  });
})();

/* =========================================================
   The tangzhong dial

   One input, everything else derived. The number a baker actually chooses is
   what share of the flour goes into the cooked starter, so that is the only
   control, and the figures, the recipe and the drawing all fall out of it.

   The curve deliberately has an interior peak. Cooking flour into the milk
   gelatinises its starch, which lets the dough carry water it otherwise could
   not, and that water is what keeps the crumb soft on day two. But gelatinised
   starch carries no gluten, so past roughly 5.5% of the flour there is more
   soft starch than structure to hold it, and the loaf stops rising and sinks
   with a gummy layer along the bottom. Both effects are in the model, which is
   why dragging to the end makes things worse rather than better.
   ========================================================= */
function tangzhong(t) {
  const ease = function (k) { return 1 - Math.exp(-t / k); };
  const over = Math.max(0, t - 5.5);
  const rise = Math.max(0, 100 - 2.6 * over * over);
  const open = 100 * ease(3.6);
  const day2 = 30 + 62 * ease(4.2);
  return {
    t: t,
    hydration: 62 + 20 * ease(4.2),
    open: open,
    day2: day2,
    rise: rise,
    // What you would actually rather eat, which is what the peak marks.
    result: (rise / 100) * (0.4 * open + 0.6 * day2)
  };
}

(function tzDial() {
  const range = document.getElementById("tzRange");
  const svg   = document.getElementById("tzCrumb");
  if (!range || !svg) return;

  const el = function (id) { return document.getElementById(id); };
  const out = {
    value: el("tzValue"), hyd: el("tzHyd"), day2: el("tzDay2"), rise: el("tzRise"),
    hydBar: el("tzHydBar"), day2Bar: el("tzDay2Bar"), riseBar: el("tzRiseBar"),
    starter: el("tzStarter"), rest: el("tzRest"), verdict: el("tzVerdict"),
    cap: el("tzCrumbCap"), window: el("tzWindow"), peak: el("tzPeak")
  };

  const MIN = parseFloat(range.min), MAX = parseFloat(range.max);
  const pct = function (t) { return ((t - MIN) / (MAX - MIN)) * 100; };

  // Found by sampling rather than written down, so the marker cannot drift out
  // of step with the model if the constants above are ever tuned.
  let best = { t: MIN, result: -1 };
  for (let t = MIN; t <= MAX; t += 0.1) {
    const r = tangzhong(t);
    if (r.result > best.result) best = r;
  }
  const bestT = Math.round(best.t * 2) / 2;
  if (out.peak) out.peak.style.left = pct(bestT) + "%";
  // The usable window: anywhere the result is within a tenth of the best.
  let lo = bestT, hi = bestT;
  for (let t = MIN; t <= MAX; t += 0.1) {
    if (tangzhong(t).result >= best.result * 0.9) { lo = Math.min(lo, t); hi = Math.max(hi, t); }
  }
  if (out.window) {
    out.window.style.left  = pct(lo) + "%";
    out.window.style.width = (pct(hi) - pct(lo)) + "%";
  }

  /* ---- the slice ----
     The cells are laid out once from a fixed seed and then only resized, so
     dragging morphs one crumb rather than reshuffling into a different one
     every frame. That is the whole reason it reads as cause and effect. */
  const W = 320, H = 210, NS = "http://www.w3.org/2000/svg";
  let seed = 20260824;
  const rnd = function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const cells = [];
  for (let gy = 0; gy < 13; gy++) {
    for (let gx = 0; gx < 19; gx++) {
      cells.push({
        x: 14 + gx * 16.2 + (rnd() - 0.5) * 13,
        y: 24 + gy * 13.4 + (rnd() - 0.5) * 11,
        s: 0.62 + rnd() * 0.78,
        a: 0.82 + rnd() * 0.42,
        rot: rnd() * 180
      });
    }
  }

  const clipId = "tzSlice";
  svg.innerHTML =
    "<defs><clipPath id=\"" + clipId + "\"><path id=\"tzSlicePath\"/></clipPath></defs>" +
    "<path id=\"tzCrust\" fill=\"#C98B3F\"/>" +
    "<path id=\"tzBody\" fill=\"#E9D3A8\"/>" +
    "<g clip-path=\"url(#" + clipId + ")\" id=\"tzCells\"></g>";
  const slicePath = svg.querySelector("#tzSlicePath");
  const crust = svg.querySelector("#tzCrust");
  const body  = svg.querySelector("#tzBody");
  const group = svg.querySelector("#tzCells");
  cells.forEach(function () {
    group.appendChild(document.createElementNS(NS, "ellipse"));
  });
  const nodes = group.childNodes;

  // Top edge domes when the loaf holds, flattens, then dips as it collapses.
  const outline = function (gum) {
    const crown = 26 * (1 - gum * 1.75);
    const top = 34;
    return "M10," + (H - 8) + " L10," + top +
           " Q160," + (top - crown * 2) + " 310," + top +
           " L310," + (H - 8) + " Z";
  };

  function draw(m) {
    const gum = 1 - m.rise / 100;
    const d = outline(gum);
    slicePath.setAttribute("d", d);
    body.setAttribute("d", d);
    crust.setAttribute("d", d);
    crust.setAttribute("transform", "translate(0,-5)");

    const grow = 1.7 + (m.open / 100) * 6.2;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i], n = nodes[i];
      // A sunken loaf goes dense along the bottom before anything else, so the
      // gummy band eats the cells from the base upwards.
      const depth = c.y / H;
      const band = Math.max(0, Math.min(1, (depth - (1 - 0.5 * gum)) / 0.5));
      const r = c.s * grow * (1 - 0.88 * band);
      const sink = gum * 30 * Math.max(0, 1 - depth * 1.4) *
                   (1 - Math.abs(c.x - 160) / 190);
      n.setAttribute("cx", c.x.toFixed(1));
      n.setAttribute("cy", (c.y + sink).toFixed(1));
      n.setAttribute("rx", Math.max(0, r).toFixed(2));
      n.setAttribute("ry", Math.max(0, r * c.a * (1 + band * 0.6)).toFixed(2));
      n.setAttribute("transform", "rotate(" + c.rot.toFixed(0) + " " + c.x.toFixed(1) + " " + (c.y + sink).toFixed(1) + ")");
      n.setAttribute("fill", "#FDF8ED");
      n.setAttribute("opacity", (0.55 + 0.45 * (1 - band)).toFixed(2));
    }
  }

  const VERDICTS = [
    [0.5,  "Tight, close crumb, and dry by tomorrow. This is bread, but it is not milk bread."],
    [3,    "Softer, and it keeps a little longer. Still holding back a lot of water it could carry."],
    [4.5,  "Close. The crumb is opening and it will still be good in the morning."],
    [7.5,  "This is the window. Enough cooked starch to hold the water, enough gluten to lift it."],
    [9.5,  "Past the peak. The rise is going, and the crumb is starting to go tacky near the base."],
    [99,   "Too far. There is more cooked starch than gluten to carry it, so it sinks in the middle and leaves a gummy line along the bottom."]
  ];
  const verdictFor = function (t) {
    for (let i = 0; i < VERDICTS.length; i++) if (t < VERDICTS[i][0]) return VERDICTS[i][1];
    return VERDICTS[VERDICTS.length - 1][1];
  };

  const g = function (n) { return Math.round(n) + "g"; };

  function update() {
    const t = parseFloat(range.value);
    const m = tangzhong(t);

    out.value.textContent = t + "%";
    out.hyd.textContent   = Math.round(m.hydration) + "%";
    out.day2.textContent  = Math.round(m.day2) + "%";
    out.rise.textContent  = Math.round(m.rise) + "%";
    out.hydBar.style.width  = ((m.hydration - 55) / 30 * 100) + "%";
    out.day2Bar.style.width = m.day2 + "%";
    out.riseBar.style.width = m.rise + "%";
    out.riseBar.classList.toggle("is-poor", m.rise < 70);

    const flour = 500, starterFlour = flour * t / 100;
    const liquid = flour * m.hydration / 100, starterMilk = starterFlour * 5;
    out.starter.textContent = t === 0
      ? "nothing to cook"
      : g(starterFlour) + " flour + " + g(starterMilk) + " milk";
    out.rest.textContent = g(flour - starterFlour) + " flour, " + g(liquid - starterMilk) + " milk";

    out.verdict.textContent = verdictFor(t);
    out.cap.textContent = t === 0
      ? "Straight dough, no cooked starter."
      : t + "% of the flour cooked first, at " + Math.round(m.hydration) + "% hydration.";
    // Announced instead of the bare number, which on its own says nothing.
    range.setAttribute("aria-valuetext",
      t + "% of the flour cooked into the starter. " + Math.round(m.hydration) +
      "% hydration, " + Math.round(m.day2) + "% still soft on day two, " +
      Math.round(m.rise) + "% of the rise held.");
    range.parentElement.style.setProperty("--fill", pct(t) + "%");

    draw(m);
  }

  range.addEventListener("input", update);
  update();
})();

/* =========================================================
   Nav
   Three things: the island condenses once you leave the top, the mark's ring
   reads out scroll progress, and a pill slides between the links to follow
   the pointer and settle on whichever section you are actually in.
   ========================================================= */
(function nav() {
  const bar    = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');
  if (!bar || !toggle || !menu) return;

  /* ---- open / close ---- */
  const setOpen = function (open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  };
  toggle.addEventListener('click', function () { setOpen(!menu.classList.contains('is-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });

  /* ---- island + progress ring ---- */
  const brand = document.querySelector('.brand__badge');

  /* Anything the island has to sit on top of that is too dark for navy type.
     Selector-based rather than a hand-maintained list, so a new dark band
     picks this up for free. */
  const darkBands = Array.from(document.querySelectorAll('.section--dark, .weekbar, .footer'));
  const overDark = function () {
    const r = bar.getBoundingClientRect();
    const y = r.top + r.height * 0.6;   // sample just below the island's middle
    return darkBands.some(function (el) {
      const b = el.getBoundingClientRect();
      return b.top <= y && b.bottom >= y;
    });
  };

  let queued = false;
  const onScroll = function () {
    queued = false;
    bar.classList.toggle('is-stuck', window.scrollY > 12);
    bar.classList.toggle('is-over-dark', overDark());
    if (!brand) return;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    brand.style.setProperty('--progress', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
  };
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  /* ---- sliding pill ---- */
  const links = Array.from(menu.querySelectorAll('.nav__links a'));
  const pill  = document.getElementById('navPill');
  const wide  = window.matchMedia('(min-width: 861px)');
  let current = null;

  const moveTo = function (link) {
    if (!pill || !link || !wide.matches) return;
    pill.style.left  = link.offsetLeft + 'px';
    pill.style.width = link.offsetWidth + 'px';
    pill.classList.add('is-on');
  };
  const settle = function () {
    if (!pill) return;
    if (current && wide.matches) moveTo(current);
    else pill.classList.remove('is-on');
  };

  links.forEach(function (a) {
    a.addEventListener('mouseenter', function () { moveTo(a); });
    a.addEventListener('focus', function () { moveTo(a); });
  });
  menu.addEventListener('mouseleave', settle);
  menu.addEventListener('focusout', function (e) {
    if (!menu.contains(e.relatedTarget)) settle();
  });
  window.addEventListener('resize', settle);

  /* ---- which section am I in ---- */
  const spied = links.filter(function (a) { return a.dataset.spy; });
  if (spied.length && 'IntersectionObserver' in window) {
    const seen = new Map();
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen.set(en.target.id, en.intersectionRatio); });
      let bestId = null, best = 0;
      seen.forEach(function (ratio, id) { if (ratio > best) { best = ratio; bestId = id; } });
      links.forEach(function (a) { a.classList.toggle('is-current', a.dataset.spy === bestId && best > 0); });
      current = spied.find(function (a) { return a.dataset.spy === bestId && best > 0; }) || null;
      settle();
    }, { threshold: [0, .15, .35, .6], rootMargin: '-84px 0px -45% 0px' });

    spied.forEach(function (a) {
      const target = document.getElementById(a.dataset.spy);
      if (target) io.observe(target);
    });
  }
})();

/* =========================================================
   Scroll-driven bake
   The placeholder bites brown from pale to golden as the hero scrolls past:
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
  const payAmount   = document.getElementById('payAmount');
  const tray        = document.getElementById('tray');
  const trayLegend  = document.getElementById('trayLegend');
  const trayStatus  = document.getElementById('trayStatus');
  const dmBtn       = document.getElementById('dmBtn');

  // Looked up by id, not form.<name>: HTMLFormElement.name is the form's own
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
      row('Flavors', d.flavors.length ? d.flavors.join(', ') : '…'),
      row('Pickup', d.pickup || '…')
    );
    const total = '$' + (d.price * d.qty);
    summaryTot.textContent = total;
    if (payAmount) payAmount.textContent = total;

    renderTray(d);
    // Broadcast so the menu buttons and the sticky bar can follow along
    // without either of them reaching into this module.
    document.dispatchEvent(new CustomEvent('box:change', { detail: {
      boxLabel: d.boxLabel, pieces: d.pieces, qty: d.qty,
      flavors: d.flavors, total: total, max: maxFlavors()
    } }));
  }

  /* Spread the pieces evenly across the chosen flavors, remainder to the
     first ones picked, so six bites over four flavors reads 2/2/1/1. */
  function distribute(pieces, flavors) {
    if (!flavors.length) return [];
    const base = Math.floor(pieces / flavors.length);
    const rem  = pieces % flavors.length;
    return flavors.map(function (f, i) { return { flavor: f, count: base + (i < rem ? 1 : 0) }; });
  }

  let lastFilled = 0;
  function renderTray(d) {
    if (!tray) return;
    const split = distribute(d.pieces, d.flavors);
    const bites = [];
    split.forEach(function (part) {
      for (let i = 0; i < part.count; i++) bites.push(part.flavor);
    });

    tray.dataset.size = String(d.pieces);
    tray.replaceChildren.apply(tray, Array.from({ length: d.pieces }, function (_, i) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      if (bites[i]) {
        slot.classList.add('is-filled');
        slot.style.setProperty('--slot', FLAVOR_COLOR[bites[i]] || '#F2DFC0');
        if (!reduced && i >= lastFilled) slot.classList.add('is-new');
      }
      return slot;
    }));
    lastFilled = bites.length;

    trayLegend.replaceChildren.apply(trayLegend, split.map(function (part) {
      const li = document.createElement('li');
      const sw = document.createElement('i');
      sw.style.setProperty('--slot', FLAVOR_COLOR[part.flavor] || '#F2DFC0');
      const b = document.createElement('b');
      b.textContent = part.count;
      li.append(sw, b, document.createTextNode(' ' + part.flavor));
      return li;
    }));

    const room = d.pieces - bites.length;
    trayStatus.textContent = !d.flavors.length
      ? 'Pick a flavor to start filling the box.'
      : d.flavors.length >= maxFlavors()
        ? 'Box full: ' + d.pieces + ' bites across ' + d.flavors.length + ' flavors.'
        : 'Room for ' + (maxFlavors() - d.flavors.length) + ' more flavor'
          + (maxFlavors() - d.flavors.length === 1 ? '' : 's') + (room ? '' : '') + '.';
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
    lines.push('', '--- To confirm this box, send $' + (d.price * d.qty) + ' ---');
    // Padded off the longest label rather than a fixed width, so the column
    // stays straight whatever methods are switched on.
    const methods = payMethods();
    const width = methods.reduce(function (n, m) { return Math.max(n, m.label.length); }, 0);
    methods.forEach(function (m) {
      lines.push(m.label + ':' + ' '.repeat(width - m.label.length + 1) + m.value);
    });
    lines.push('Put your name and pickup date in the payment note.');
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
      '?subject=' + encodeURIComponent('Box order for ' + d.name + ', ' + d.pickup) +
      '&body='    + encodeURIComponent(orderText());
    window.location.href = href;
    say('Opening your email app. Send it, then pay the total to hold the box.');
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
      say('Ticket copied. Paste it into a DM, then pay the total to hold the box.');
      window.open('https://instagram.com/' + CONFIG.instagram, '_blank', 'noopener');
    } else {
      say('Couldn’t copy automatically. Email works, or screenshot the ticket.', true);
    }
  });

  /* ---- baker's choice: fill the box for you, respecting cap and sold-out ---- */
  const surpriseBtn = document.getElementById('surpriseBtn');
  const clearBtn    = document.getElementById('clearBtn');

  function setFlavors(names) {
    flavorInputs.forEach(function (i) { if (!isSoldOut(i)) i.checked = names.indexOf(i.value) !== -1; });
    applyFlavorCap();
    renderSummary();
    flavorError.hidden = selectedFlavors().length > 0;
  }

  if (surpriseBtn) surpriseBtn.addEventListener('click', function () {
    const pool = flavorInputs.filter(function (i) { return !isSoldOut(i); }).map(function (i) { return i.value; });
    // Fisher-Yates, so every combination is equally likely.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    const picked = pool.slice(0, maxFlavors());
    setFlavors(picked);
    say('Baker\'s choice: ' + picked.join(', ') + '. Hit it again for another.');
  });

  if (clearBtn) clearBtn.addEventListener('click', function () {
    setFlavors([]);
    say('Cleared. Start again whenever.');
  });

  /* ---- a shareable box ----
     The choices go in the query string, not in storage, so nothing is kept on
     anyone's device and the privacy page stays accurate. */
  function writeUrl(d) {
    if (!window.history || !history.replaceState) return;
    const q = new URLSearchParams();
    q.set('box', String(d.pieces));
    if (d.qty > 1) q.set('qty', String(d.qty));
    if (d.flavors.length) q.set('f', d.flavors.join('|'));
    history.replaceState(null, '', d.flavors.length ? '?' + q.toString() : location.pathname);
  }

  function readUrl() {
    const q = new URLSearchParams(location.search);
    if (!q.has('box') && !q.has('f')) return false;

    const box = boxInputs.find(function (i) { return i.value === q.get('box'); });
    if (box) box.checked = true;

    const qn = parseInt(q.get('qty'), 10);
    if (!Number.isNaN(qn)) qtyInput.value = Math.min(20, Math.max(1, qn));

    const wanted = (q.get('f') || '').split('|').filter(Boolean);
    flavorInputs.forEach(function (i) { i.checked = !isSoldOut(i) && wanted.indexOf(i.value) !== -1; });

    const dropped = wanted.filter(function (n) {
      const i = flavorInputs.find(function (x) { return x.value === n; });
      return !i || isSoldOut(i);
    });
    applyFlavorCap();
    if (dropped.length) say(dropped.join(' and ') + ' sold out this week, so ' +
      (dropped.length === 1 ? 'it is' : 'they are') + ' not in the box. Everything else came through.', true);
    return true;
  }

  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) shareBtn.addEventListener('click', async function () {
    if (!selectedFlavors().length) { say('Pick a flavor first, then the link will have something in it.', true); return; }
    if (await copyText(location.href)) {
      shareBtn.classList.add('is-copied');
      shareBtn.textContent = 'Link copied';
      setTimeout(function () {
        shareBtn.classList.remove('is-copied');
        shareBtn.textContent = 'Copy a link to this box';
      }, 1800);
    }
  });

  const restored = readUrl();
  applyFlavorCap();
  renderSummary();
  if (restored) {
    document.dispatchEvent(new CustomEvent('box:restored'));
  }

  // Keep the URL in step after the first render, not during it.
  document.addEventListener('box:change', function (e) { writeUrl(e.detail); });
})();


/* =========================================================
   Menu ↔ form, and the sticky order bar
   The flavor cards drive the real checkboxes rather than keeping a second
   copy of the state, so the two can never disagree.
   ========================================================= */
(function menuSync() {
  const adds = Array.from(document.querySelectorAll('.flavor__add'));
  const bar  = document.getElementById('orderBar');
  if (!adds.length && !bar) return;

  const inputFor = function (name) {
    return document.querySelector('#flavorGrid input[value="' + CSS.escape(name) + '"]');
  };

  adds.forEach(function (btn) {
    const input = inputFor(btn.dataset.add);
    if (!input) return;
    if (input.dataset.soldOut === 'true') {
      btn.disabled = true;
      btn.textContent = 'Sold out';
      return;
    }
    btn.addEventListener('click', function () {
      if (input.disabled && !input.checked) {
        btn.textContent = 'Box is full';
        setTimeout(function () { btn.textContent = 'Add to box'; }, 1400);
        return;
      }
      input.checked = !input.checked;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  const barBox = document.getElementById('barBox');
  const barFlv = document.getElementById('barFlavors');
  const barTot = document.getElementById('barTotal');

  document.addEventListener('box:change', function (e) {
    const d = e.detail;
    adds.forEach(function (btn) {
      const input = inputFor(btn.dataset.add);
      if (!input || input.dataset.soldOut === 'true') return;
      const on = input.checked;
      btn.classList.toggle('is-added', on);
      btn.textContent = on ? 'In your box' : 'Add to box';
      btn.setAttribute('aria-pressed', String(on));
    });

    if (!bar) return;
    barBox.textContent = d.boxLabel + (d.qty > 1 ? ' ×' + d.qty : '');
    barFlv.textContent = d.flavors.length ? d.flavors.join(', ') : 'no flavors yet';
    barTot.textContent = d.total;
  });

  /* The bar is only useful between the hero and the form: before that there
     is nothing to finish, and while the form is on screen it just covers it. */
  if (bar) {
    const orderSection = document.getElementById('order');
    const hero = document.getElementById('top');
    let formVisible = false;

    if ('IntersectionObserver' in window && orderSection) {
      new IntersectionObserver(function (entries) {
        formVisible = entries[0].isIntersecting;
        update();
      }, { threshold: 0.08 }).observe(orderSection);
    }

    const update = function () {
      const pastHero = hero ? window.scrollY > hero.offsetHeight * 0.7 : window.scrollY > 400;
      const show = pastHero && !formVisible;
      bar.hidden = false;
      bar.classList.toggle('is-up', show);
      document.body.classList.toggle('has-bar', show);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
})();


/* =========================================================
   Flavor filters
   ========================================================= */
(function filters() {
  const chips = Array.from(document.querySelectorAll('.chip[data-filter]'));
  const grid  = document.getElementById('menuGrid');
  const count = document.getElementById('filterCount');
  if (!chips.length || !grid) return;

  const cards = Array.from(grid.querySelectorAll('.flavor'));
  const matches = function (card, filter) {
    if (filter === 'all') return true;
    if (filter === 'available') return !card.classList.contains('is-out');
    return card.dataset.kind === filter;
  };

  const apply = function (filter) {
    let shown = 0;
    cards.forEach(function (card) {
      const on = matches(card, filter);
      card.classList.toggle('is-filtered', !on);
      if (on) shown++;
    });
    count.textContent = shown === cards.length
      ? cards.length + ' flavors'
      : 'Showing ' + shown + ' of ' + cards.length;
    chips.forEach(function (c) {
      const on = c.dataset.filter === filter;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', String(on));
    });
  };

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      grid.classList.add('is-swapping');
      setTimeout(function () {
        apply(chip.dataset.filter);
        grid.classList.remove('is-swapping');
      }, reduced ? 0 : 140);
    });
  });

  apply('all');
})();

/* =========================================================
   Reheat tabs: roving tabindex, arrow keys, home/end
   ========================================================= */
(function tabs() {
  const list = document.querySelector('.tabs[role="tablist"]');
  if (!list) return;
  const tabs = Array.from(list.querySelectorAll('[role="tab"]'));

  const select = function (tab, focus) {
    tabs.forEach(function (t) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };

  tabs.forEach(function (tab) { tab.addEventListener('click', function () { select(tab, false); }); });

  list.addEventListener('keydown', function (e) {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    let next = null;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    select(next, true);
  });
})();
