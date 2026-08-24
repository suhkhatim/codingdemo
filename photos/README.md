# photos

Drop your photos here with these exact filenames and the site picks them up,
with no code change needed. Until a file exists, the page shows a labelled
placeholder in its place, so nothing looks broken while you're still shooting.

| Filename            | Where it appears        | Shape        | What to shoot |
|---------------------|-------------------------|--------------|---------------|
| `hero-box.jpg`      | Hero, top of the page   | square (1:1) | An open box from directly above, in daylight |
| `classic-milk.jpg`  | Feature flavor tile     | landscape 4:3| One bite torn in half, close, showing the shred |

## Shooting notes

Phone camera by a window, mid-morning, no flash. Turn the overhead lights off, because
mixing daylight and kitchen bulbs is what makes food photos look yellow and
grim. Put the bread near the window with the light coming from the side or
slightly behind it, so the steam and the crust texture catch.

The torn-open shot matters most. A whole bite is a beige lump; a torn one shows
the shred, and the shred is the entire argument for milk bread.

Save at roughly 1600px on the long edge: big enough to look sharp on a laptop,
small enough that the page still loads fast on a phone.

## Adding more

The pattern is `<figure class="photo">` with a real `<img>` inside and a
`.photo__ph` block after it. `script.js` flags the figure when the image fails
to load, and CSS swaps in the placeholder. Copy an existing one in
`index.html` and change the `src`, `alt`, and aspect-ratio class.
