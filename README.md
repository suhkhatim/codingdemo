# The Yeast Coast — website

A single-page site for an at-home Hokkaido milk bread business. Plain HTML, CSS
and JavaScript — no build step, no dependencies, no server.

```
index.html    the main page
privacy.html  privacy policy
styles.css    all styling, both pages
fonts.css     two self-hosted webfaces, inlined as data URIs
script.js     config, weekly stock, photo slots, order form
photos/       your photos — see photos/README.md
```

## Run it locally

```bash
npx http-server -p 8080     # or: python3 -m http.server 8080
```

## The three things to do before this goes live

### 1. Set your email and payment handles

At the top of `script.js`:

```js
orderEmail: 'hello@example.com',      // where order emails land
instagram:  'theyeastcoast',
payment: {
  cashApp: '$TheYeastCoast',          // your $cashtag
  zelle:   'hello@example.com'        // the phone or email your Zelle uses
},
```

All four are placeholders. The Cash App and Zelle handles print on the ticket
and in the emailed order, so customers cannot pay until they are real.

### 2. Add photos

See `photos/README.md`. Three files, exact names, and they appear automatically.
Until then the page shows labelled placeholders — it looks deliberate, not
broken, but photos are the single biggest improvement available to this site.

### 3. Rewrite the baker's note

The "Who bakes it" section in `index.html` is placeholder copy in a generic
voice, marked with a comment. It is the most valuable text on the page and the
only part a competitor can't copy. Two paragraphs in your own words, and sign it
with your actual name.

## Updating it each week

One object, near the top of `script.js`:

```js
thisWeek: {
  boxesTotal: 20,
  boxesLeft:  6,
  soldOut:    ['Ube']     // names must match the flavor list exactly
}
```

That drives the bar under the hero, the meter, and the sold-out treatment —
sold-out flavors get stamped on the menu and locked in the order form so nobody
can order one. A mistyped name logs a warning in the browser console rather than
failing silently.

The pickup date is worked out from `pickupWeekday` and `leadTimeDays`, so it
rolls forward on its own and needs no weekly edit.

## Prices, boxes, flavors

Box sizes live in two places that must agree: the display cards in
`.boxes__grid`, and the `input[name="box"]` radios in the order form, which
carry the real numbers:

```html
<input type="radio" name="box" value="12" data-price="22" data-max="3">
```

`value` is the piece count, `data-price` the dollars, `data-max` how many
flavors fit. The live total and the flavor cap both read from these, so changing
a price is a one-attribute edit.

Flavors likewise live in the menu cards, the order-form checkboxes, and the
`FLAVORS` array in `script.js` (used only to sanity-check `soldOut`).

## How ordering and payment work

Boxes are **paid up front**. Nothing is charged on the website and no card
details are collected anywhere in the flow.

1. The customer builds a box. The form validates in the browser.
2. Sending opens their own mail app with the ticket pre-filled, or copies it for
   an Instagram DM. The ticket includes the total and both payment handles.
3. They send the money by Cash App or Zelle with their name and pickup date in
   the payment note.
4. You match the payment to the ticket and reply to confirm.

The box isn't held until payment lands — that's stated on the ticket, in the
FAQ, and in the week timeline, so it should not surprise anyone.

Two consequences worth being ready for. An order only reaches you if the
customer completes the send, so a ticket with no payment against it is a normal
occurrence, not a lost order. And because you are matching payments by hand,
the note field is doing real work — chase it if someone leaves it blank.

The cancellation terms in the FAQ (full refund before the Wednesday cutoff, none
after, box transferable) are a starting point. Change them to whatever you're
actually willing to honor, since customers will hold you to what's written.

If you outgrow this, point the `submit` handler at a hosted form service
(Formspree, Netlify Forms), or move to a real checkout (Stripe, Square) if you
want payment and order capture in one step.

## Publishing

Three static files plus fonts and photos. GitHub Pages: push, then
Settings → Pages → deploy from the branch root.

## Before you take real orders

Three things carry legal weight and are written as placeholders:

- the allergen line under **What's in them?** in the FAQ
- the cottage-food notice at the foot of the FAQ
- `privacy.html`

Most US states require wording close to the cottage-food line for home-baked
goods sold to the public, sometimes on the packaging too, and the exact sentence
varies. Confirm what yours asks for.

### The privacy policy

`privacy.html` describes what this site genuinely does — no cookies, no
analytics, no third-party embeds, self-hosted fonts, and an order form that
hands off to your own email client rather than posting anywhere. Those claims
are accurate as written, and they stay accurate only while the site works this
way. **If you ever add analytics, a hosted form backend, a chat widget, an
embedded map, or a real checkout, this page becomes wrong and has to be
updated.**

Three placeholders need filling — search the file for square brackets:

- `[your city, state]` — where you bake
- `[your state]` — for the record-keeping sentence
- `[your host]` — whoever serves the pages, e.g. GitHub Pages or Netlify

It is written in plain language rather than legalese, and it is not legal
advice. If you have any doubt about your state's requirements, or you start
shipping outside it, have someone local read it over.

## Notes

- Responsive to 320px with no horizontal scroll.
- Every text/background pair clears WCAG AA, verified against rendered colors.
- Honors `prefers-reduced-motion` — reveals, the sticker, card tilts and the
  scroll-driven bake all switch off.
- Fonts are Fraunces and Schibsted Grotesk, both SIL Open Font License 1.1,
  inlined so there is no CDN dependency. Regenerate with
  `scratchpad/mkfonts.mjs` if you ever want different faces.
