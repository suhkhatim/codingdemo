# The Yeast Coast — website

A single-page site for an at-home Hokkaido milk bread business. Plain HTML, CSS,
and JavaScript — no build step, no dependencies, no server. Open `index.html` in
a browser and it works.

```
index.html    markup and copy
styles.css    all styling
script.js     branding, nav, scroll reveal, order form
```

## Run it locally

```bash
npx http-server -p 8080     # or: python3 -m http.server 8080
```

Then open http://localhost:8080.

## Make it yours

### 1. Name and contact details

Everything identifying lives in one block at the top of `script.js`:

```js
const CONFIG = {
  businessName: 'The Yeast Coast',
  orderEmail:   'hello@example.com',   // where order emails land
  instagram:    'theyeastcoast',       // handle, no @
  pickupWeekday: 6,                    // 0=Sun … 6=Sat
  leadTimeDays:  3,                    // earliest pickup, days from today
  pickupSlots:   6                     // how many upcoming dates to offer
};
```

The name is written into every `[data-business-name]` element and the page title
at load, so changing it here changes it everywhere. **Set `orderEmail` before you
share the site** — orders go nowhere until you do.

The `<title>` and `<meta name="description">` in `index.html` are also worth
editing directly, since search engines and link previews read the HTML before the
script runs.

### 2. Prices and box sizes

Box sizes are declared in two places that need to agree:

- `index.html` → the `.boxes__grid` cards, for display
- `index.html` → the `input[name="box"]` radios in the order form, which carry
  the real numbers as data attributes:

```html
<input type="radio" name="box" value="12" data-price="22" data-max="3">
```

`value` is the piece count, `data-price` the dollar price, `data-max` how many
flavors fit in that box. The form's live total and flavor cap both read from
these, so changing a price here is enough — no JS edit needed.

### 3. Flavors

Two lists, also kept in sync by hand:

- the `.menu-grid` cards in the Flavors section (name + description)
- the checkboxes in `#flavorGrid` in the order form

Only the order-form `value` attributes appear in the order that gets emailed.

## How ordering works

There's no backend and nothing is charged. The form validates in the browser,
then either:

- **Send order by email** — opens the customer's mail app with a formatted order
  pre-filled and addressed to `orderEmail`. They still have to hit send.
- **Copy for Instagram DM** — copies the same summary to the clipboard and opens
  your Instagram profile so they can paste it into a DM.

Both are deliberately low-tech: no signup, no fees, no order data passing through
a third party. The trade-off is that an order only reaches you if the customer
completes the send, so it's worth confirming each one by reply.

If you outgrow that, the natural next step is pointing the form at a hosted form
service (Formspree, Netlify Forms) — replace the `submit` handler in `script.js`
with a `fetch` POST and keep everything else.

## Publishing

The site is three static files, so anything that serves static files works.
GitHub Pages: push to your default branch, then Settings → Pages → deploy from
that branch's root.

## Before you take real orders

The FAQ contains two things written as placeholders that carry legal weight in
most places, and you should check both against your local rules:

- the allergen line under **What's in them?**
- the cottage-food notice at the bottom of the FAQ ("Made in a home kitchen that
  is not subject to routine inspection by a health department")

Many US states require wording close to that second line on home-baked goods sold
to the public, and some require it on the packaging too. The exact sentence
varies by state — confirm what yours asks for.

## Notes

- Responsive down to 320px, no horizontal scroll.
- Honors `prefers-reduced-motion` — animations and scroll reveals turn off.
- Keyboard accessible with visible focus rings; the custom checkboxes are real
  inputs, visually hidden rather than replaced.
