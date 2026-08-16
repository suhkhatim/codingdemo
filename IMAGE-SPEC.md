# Image spec

Everything below is optional to launch — the site renders branded placeholders
for any file that isn't there yet, so nothing looks broken. Drop a file in at the
exact path and it appears automatically. No code changes needed.

Save as **JPEG** (quality ~80) for photos and **PNG** for the logo. Aim to keep
each photo under ~400KB.

## The logo

| Path | Size | Ratio | Notes |
|---|---|---|---|
| `assets/logo.png` | 1200×1200 or larger | 1:1 | **Transparent background.** Used in three places at three sizes: the hero badge, the sticky nav mark, and the footer. Trim the transparent margin tight to the circular badge or it will look small in the nav. |

Until it lands, a navy "CC" monogram disc stands in.

## Photos

| Path | Size | Ratio | What it shows |
|---|---|---|---|
| `assets/img/product-cakes.jpg` | 1200×1500 | 4:5 | A finished layer cake, ideally with visible piping. Shot vertically. |
| `assets/img/product-cake-bread.jpg` | 1200×1500 | 4:5 | A cake bread loaf, sliced, so the crumb reads. |
| `assets/img/product-cookies.jpg` | 1200×1500 | 4:5 | Decorated cookies — a few together beats one alone. |
| `assets/img/baker.jpg` | 1200×1500 | 4:5 | Marcus at the bench, working. Hands in shot if possible. |

All four are cropped with `object-fit: cover`, so **keep the subject centered** —
the edges get trimmed at narrow widths.

### Art direction

Warm, natural light. Shoot against cream, wood, or a plain surface. Avoid cool
white balance — it fights the cream background and makes the navy look grey. A
little mess in frame is on-brand.

## Adding your photos

```
mkdir -p assets/img
# copy your files in, then:
git add assets && git commit -m "Add brand photography" && git push
```

## Changing the alt text

Each image has descriptive alt text written into `index.html`. If your photo
shows something different from the description in the table above, update the
matching `alt=""` attribute so it still describes the real picture.
