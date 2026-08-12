# The Yeast Coast — website

A single-page site for an at-home Hokkaido milk bread business. Plain HTML, CSS
and JavaScript — no build step, no dependencies, no server.

```
index.html    markup and copy
styles.css    all styling
fonts.css     two self-hosted webfaces, inlined as data URIs
script.js     config, weekly stock, photo slots, order form
photos/       your photos — see photos/README.md
```

## Run it locally

```bash
npx http-server -p 8080     # or: python3 -m http.server 8080
```

## The three things to do before this goes live

### 1. Set your email

`CONFIG.orderEmail` at the top of `script.js` is `hello@example.com`. Every
order button routes there, so nothing reaches you until you change it. Check
`instagram` on the line below it too.

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

## How ordering works

No backend, nothing charged. The form validates in the browser, then either
opens the customer's mail app with a formatted ticket addressed to
`orderEmail`, or copies the same ticket for pasting into an Instagram DM.

The trade-off: an order only reaches you if the customer completes the send, so
confirm each one by reply. If you outgrow that, point the `submit` handler at a
hosted form service (Formspree, Netlify Forms) and keep everything else.

## Publishing

Three static files plus fonts and photos. GitHub Pages: push, then
Settings → Pages → deploy from the branch root.

## Before you take real orders

Two bits of the FAQ carry legal weight and are written as placeholders:

- the allergen line under **What's in them?**
- the cottage-food notice at the foot of the FAQ

Most US states require wording close to that second line for home-baked goods
sold to the public, sometimes on the packaging too, and the exact sentence
varies. Confirm what yours asks for.

## Notes

- Responsive to 320px with no horizontal scroll.
- Every text/background pair clears WCAG AA, verified against rendered colors.
- Honors `prefers-reduced-motion` — reveals, the sticker, card tilts and the
  scroll-driven bake all switch off.
- Fonts are Fraunces and Schibsted Grotesk, both SIL Open Font License 1.1,
  inlined so there is no CDN dependency. Regenerate with
  `scratchpad/mkfonts.mjs` if you ever want different faces.
