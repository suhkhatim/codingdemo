# S² People Advisory — website

Marketing site for an HR consultancy. Static HTML/CSS/JS — no build step, no
dependencies, no framework. Open `index.html` in a browser and it works.

```
index.html
assets/
  css/styles.css     design tokens + all component styles
  js/main.js         interactions (each module is self-contained)
  img/logo-mark.svg  the S² monogram, rebuilt as vector
  img/favicon.svg
```

## Running it

Any static server will do:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

Opening `index.html` directly from the filesystem also works.

## Deploying

The site is a folder of static files, so it drops onto GitHub Pages, Netlify,
Cloudflare Pages or S3 with no configuration. For GitHub Pages: Settings →
Pages → deploy from branch, root directory.

## Brand

Colours are sampled from the logo and live as CSS custom properties at the top
of `styles.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--navy` | `#16294A` | primary text, buttons, dark sections |
| `--navy-900` | `#0C1729` | footer, gradient anchor |
| `--gold` | `#C79A4B` | accents, hover states, highlights |
| `--gold-200` | `#E6CB93` | gold text on dark backgrounds |
| `--cream` | `#FAF7F2` | alternating section background |

Type is Outfit (headings) and Inter (body), loaded from Google Fonts with a
system-font fallback stack. The monogram is inline SVG (`<symbol id="mark">`
in `index.html`), so it stays sharp at any size and recolours via
`currentColor` on the `.mark-navy` / `.mark-gold` paths — that's how the footer
gets a white-on-navy version of the same mark.

## Sections

Hero → sectors bar → About → Services → Approach → Impact → Testimonials →
FAQ → Contact → Footer.

## Interactions

All in `assets/js/main.js`, each in its own IIFE that no-ops if its markup is
missing:

- Sticky header that shrinks on scroll, with a reading-progress bar
- Mobile drawer nav (Escape to close, closes on link tap, resets on resize)
- Scroll-reveal via `IntersectionObserver` — add `data-reveal` and optional
  `data-reveal-delay="120"` to any element
- Scrollspy underlining the nav link for the section in view
- Rotating word in the hero headline
- Counters that animate once when scrolled into view (`data-count` / `data-suffix`)
- Service cards → accessible modal (focus trap, Escape, focus restored on close)
- Testimonial carousel: autoplay, dots, arrows, keyboard, touch swipe, pauses
  on hover/focus and when off-screen
- FAQ accordion with height animation, one panel open at a time
- Contact form with per-field validation and inline errors

`prefers-reduced-motion: reduce` disables animation throughout, and there's a
print stylesheet.

### Adding a service

Copy a `.service-card` in `index.html`. Everything the modal shows comes from
data attributes on the card:

```html
<article class="service-card" data-reveal tabindex="0" role="button" aria-haspopup="dialog"
  data-title="Service name"
  data-summary="One-line description, also shown on the card."
  data-items="First bullet|Second bullet|Third bullet"
  data-outcome="What the client walks away with.">
```

`data-items` is pipe-separated. No JS changes needed.

## Before launch — placeholders to replace

Content is written to be industry-accurate but the specifics are invented.
Search the repo for `PLACEHOLDER` and swap in:

- **Contact details** — `hello@s2peopleadvisory.com`, `+44 20 0000 0000` and the
  London address appear in the contact section, the footer and the JSON-LD block
  in `<head>`
- **Testimonials** — all four are fictional; `[Client Name]` marks each one.
  Get written approval before publishing real quotes
- **Impact statistics** — the four figures in the Impact band are illustrative
  and are labelled as such on the page. Replace with verified numbers or delete
  the section
- **Company registration number** in the footer
- **Legal pages** — privacy, cookie and terms links all point at `#`
- **Social links** — the LinkedIn icon points at `#`
- **Canonical URL and OG image** in `<head>`

### Wiring up the contact form

The form currently validates and shows a confirmation **client-side only — it
does not send anything**. To make it live, give the `<form>` an `action` and
replace the simulated submit at the end of `main.js` (marked with a comment)
with a real `fetch()`. Formspree, Netlify Forms and Formspark all work without
a backend.

Note the form collects personal data, so a real privacy policy and a lawful
basis for processing need to be in place before it goes live.
