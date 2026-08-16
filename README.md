# Chaos Confections

A single-page site for a bakery: cakes, cake bread, cookies, and piping lessons
taught by the baker.

Plain HTML, CSS, and JavaScript. No build step, no dependencies, no framework.
Open `index.html` in a browser and it works.

```
index.html          the whole page
css/styles.css      design tokens + all styling
js/main.js          all interactions
IMAGE-SPEC.md       what photos to supply and at what size
assets/             logo and photography (you supply these)
```

## Run it locally

Double-clicking `index.html` works for most things. To exercise it properly —
the form and image loading behave differently over `file://` — serve it:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Things you'll want to change

### 1. Add the logo and photos

The site currently shows branded placeholders wherever an image is missing. See
[`IMAGE-SPEC.md`](IMAGE-SPEC.md) for exact filenames and dimensions. Drop the
files in and they appear — nothing else to do.

### 2. Turn on the contact form

Out of the box, submitting the form opens the visitor's email app with the
details pre-filled. That works, but people without a mail client configured will
drop off, so wire it up properly:

1. Create a free form at [formspree.io](https://formspree.io) and point it at
   your email address.
2. Copy the form ID — the part after `/f/` in the endpoint they give you.
3. Open `js/main.js` and set it at the top of the file:

```js
var FORMSPREE_ID = 'xbjnqlkz';   // your ID here
```

Inquiries then arrive by email, and the visitor gets an inline confirmation
without leaving the page. If Formspree is ever unreachable, the form
automatically falls back to the email-app behavior rather than failing silently.

The address used for that fallback is on the next line — change it too:

```js
var CONTACT_EMAIL = 'hello@chaosconfections.com';
```

### 3. Replace the placeholder copy

All the writing in `index.html` is placeholder text, written to read as
finished. Things that are invented and need your real details:

- **The baker.** Named "Marcus Vela" throughout, with an invented bio, in the
  About section. Also referenced in the form's confirmation message in
  `js/main.js`.
- **Testimonials.** Four invented quotes and attributions.
- **Prices and lead times.** In the product card panels and the lesson tiers.
- **Address, hours, phone, email.** In the Contact section and the footer.
- **Social links.** Currently placeholders pointing at `#contact`.

### 4. Adjust the palette

Three brand colors, sampled from the logo, defined once at the top of
`css/styles.css`:

```css
--navy:   #16295B;   /* body text, headings, primary buttons */
--orange: #E4571D;   /* accents, display type, active states */
--cream:  #F8F1E3;   /* page background */
--gold:   #C69B4A;   /* hairline rules only */
```

One rule worth keeping if you change these: **orange is not used for body
text.** At 3.3:1 against cream it's below the accessibility threshold for
small text, so it's restricted to large display type, accents, and fills.
Buttons with an orange background take navy text, never cream.

## Deploying

It's static, so anything that serves files will host it. For GitHub Pages:
**Settings → Pages → Source: Deploy from a branch**, pick your branch and the
`/ (root)` folder.

## Notes on how it's built

- **Scroll effects** run off a single rAF-throttled listener that writes one
  value (`--hp`, 0→1) to the document. CSS derives the hero badge scale, the nav
  logo fade, and all four parallax mountain layers from that one number.
- **Reduced motion** is respected properly. With `prefers-reduced-motion:
  reduce`, parallax and reveal animations are off and the testimonial carousel
  doesn't auto-advance. The piping demo still works, since it's user-driven.
- **Without JavaScript**, the page is still fully readable: product details are
  expanded rather than collapsed, and testimonials stack vertically instead of
  becoming a carousel.
