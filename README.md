# S² People Advisory — website

Marketing site for an independent HR consultancy. Static HTML/CSS/JS — no build
step, no dependencies, no framework. Open `index.html` and it works.

```
index.html
assets/
  css/styles.css     tokens + all component styles
  js/main.js         behaviour (each module self-contained)
  img/logo-mark.svg  the S² monogram, rebuilt as vector
  img/favicon.svg
```

## Running it

```bash
python3 -m http.server 8000     # http://localhost:8000
```

Opening `index.html` from the filesystem works too.

## Deploying

A folder of static files — drops onto GitHub Pages, Netlify, Cloudflare Pages
or S3 unmodified. For GitHub Pages: Settings → Pages → deploy from branch, root
directory.

## The design

**The site is laid out as an engagement record** — the thing an HR consultancy
actually produces. That premise drives every structural decision:

- A **fixed spine** down the left edge carries the mark, the contents index and
  standing contact details, like the bound edge of a report. It stays put while
  the stage scrolls, and the current section is marked in the gutter with a gold
  rule.
- The stage uses an **asymmetric grid**: a content column capped at 68 characters
  and a genuine **margin column** for annotations — credentials, engagement
  models, caveats on the figures. Margin notes carry real content; they are not
  decoration.
- **No cards, and no `border-radius` anywhere.** Hairline rules do all the
  dividing. This is the single most load-bearing rule in the stylesheet — adding
  a rounded card would break the whole conceit.
- Sections are numbered 01–06 because the contents index needs stable
  references. The Method phases are numbered because they are a real sequence.
  Nothing else is numbered for decoration.

### Palette

Sampled from the logo, with neutrals biased toward the navy so they read as
chosen rather than inherited. All defined as custom properties at the top of
`styles.css`.

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#16294A` | primary text, the navy S |
| `--ink-2` | `#5C6B85` | body text, secondary |
| `--paper` | `#FCFCFD` | ground |
| `--paper-2` | `#F1F3F7` | colophon strip |
| `--rule` / `--rule-2` | `#DCE1EA` / `#BFC8D6` | hairlines, light and strong |
| `--gold` | `#C79A4B` | the logo gold — marks and large accents only |
| `--gold-ink` | `#8A6420` | darkened gold for small text (passes AA on paper) |
| `--deep` | `#0E1B33` | the Record band |

The two golds exist because the logo gold is a 3.1:1 contrast against paper —
fine for the monogram and large display type, not for 12px labels.

The Record band is dark. It works by **redefining the tokens** inside
`.band-dark` rather than restyling each component, so anything placed there
inherits the right palette automatically.

### Type

| Role | Face |
| --- | --- |
| Statements, section titles, discipline names | Instrument Serif |
| Body | IBM Plex Sans |
| Numbers, labels, margin notes, the whole documentary apparatus | IBM Plex Mono |

Loaded from Google Fonts with a system fallback stack.

### The monogram

Inline SVG. A `<symbol id="mark">` at the top of `index.html`, reused via
`<use>`, recolouring through `currentColor` on the `.mark-navy` / `.mark-gold`
paths — that's how the dark band gets a white-on-navy version for free.

The **cover mark is inlined as real paths rather than a `<use>`**, deliberately:
`<use>` clones into a shadow tree, and the per-path stroke timings the draw-in
animation needs can't reach inside it.

## Behaviour

All in `assets/js/main.js`. The page is a document — it reads completely with
JavaScript disabled, apart from the disciplines index, which then shows its
summaries but not its detail panels.

- **The mark draws itself in on load** — navy stroke first, then the gold S
  closing over it. The interlock is the practice's premise, which is the only
  reason there's an animation on this page at all. Nothing else animates on
  scroll.
- Spine index tracks the section being read (picks the most-visible section, so
  short sections at the page end still get their turn)
- Mobile: the spine collapses to a bar and the index drops out of it as a sheet
- Disciplines expand in place, and **several can stay open at once** — it's an
  index to read across, not a set of tabs
- Inquiry form validates per-field with inline errors

`prefers-reduced-motion: reduce` disables the draw-in and all transitions.
There's a print stylesheet that drops the spine and opens every panel.

### Adding a discipline

Copy an `<article class="row">` inside `#ledger`. The markup is self-describing —
numeral, name, one-line abstract, then the `.spec` list and the `.yield` line.
`main.js` wires up whatever rows it finds; no JS changes needed.

## Before launch — placeholders to replace

Copy is written to be industry-accurate but the specifics are invented. Search
for `PLACEHOLDER` and swap in:

- **Contact details** — `hello@s2peopleadvisory.com`, `+44 20 0000 0000` and the
  London address appear in the spine, the Inquiry particulars and the JSON-LD in
  `<head>`
- **Client accounts** — all four are fictional, each tagged `[Client Name]`. Get
  written approval before publishing real quotes
- **The Record figures** — illustrative, and the margin note beside them says so
  on the page. Replace with verified metrics or delete the table; unevidenced
  numbers cost more trust than they buy
- **Company registration number** in the footer
- **Legal pages** — privacy, cookies and terms all point at `#`
- **Canonical URL and OG image** in `<head>`

### Wiring up the inquiry form

It validates and confirms **client-side only — it does not send**. To make it
live, give the `<form>` an `action` and replace the block marked
`Stand-in for a real submit` in `main.js` with a real `fetch()`. Formspree,
Netlify Forms and Formspark all work without a backend.

It collects personal data, so a real privacy policy and a lawful basis for
processing need to be in place first.
