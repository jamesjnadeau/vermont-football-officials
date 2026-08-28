# The drawing page

`/draw` lets somebody lay a play out on a field — drop players and officials,
drag them where they belong, start from a preset, draw movement arrows, write
on it — and hand the result to somebody else as a link. It draws on the same
field renderer the site's diagrams use (`lib/field/`), not a second copy of a
field, so a mark on this page and a mark in a diagram can never quietly
disagree about what it looks like.

**Finding it:** go to `/draw`. It carries no link from anywhere else on the
site — not the navigation, not an article, not a topic listing — and that is
on purpose, not an oversight. It is a tool for building and sharing one play,
not an article somebody has written and verified the way everything else on
this site is (see `docs/sources.md`), so it does not belong presented
alongside the association's reviewed pages as something to browse to. Two
tests hold this in place: `test/content/output.test.js` fails the build if any
rendered page links `/draw` or if it turns up in a topic listing, and
`test/draw/page.test.js` confirms the page itself still renders and works. If
`/draw` ever should be linked from somewhere, that is a decision to make
explicitly — change `content/draw/index.pug` and update both tests, not just
one.

## `lib/` is served twice, and both copies must agree

`.eleventy.js` passthrough-copies `lib/field/` to `/js/field/` and `lib/draw/`
to `/js/draw/` in the built site. That is why the two directories are laid out
the way they are: a relative import inside them, such as `../field/geometry.js`
in `lib/draw/board.js`, resolves to the same file whether the importer is
`node --test` reading `lib/draw/board.js` directly or a browser loading
`/js/draw/board.js`. Nothing under either directory needs a second, browser-only
spelling of its own dependencies.

The consequence cuts the other way too: **no module under `lib/field/` or
`lib/draw/` may use a `node:` built-in or touch `document`**, because every one
of them is also a file a browser downloads and runs unchanged. The one
exception is `lib/draw/app.js`, the page's entry point — it says so in its own
header, and it is the only file in either tree that is allowed to know a DOM
exists.

Practically: if a change to one of these modules needs `node:fs`, `process`,
`window`, or anything else that only exists in one runtime, that logic belongs
in `app.js` (browser-only) or in a script under `bin/`/`lib/` that is never
passthrough-copied (Node-only) — never in `lib/field/` or the rest of
`lib/draw/`.

## No path prefix, anywhere in this page

The site is served from the custom domain named in `static/CNAME`, so it
builds at the domain root and every URL in the templates is root-relative
with no prefix — see the top-level README's "Deploying" section.
`content/draw/index.pug` loads its script as
`script(src='/js/draw/app.js')`, and every import inside `lib/draw/` and
`lib/field/` is a relative specifier, not a root-absolute one — so the page
itself does not depend on the site building at the root.

The thing that does: `HtmlBasePlugin` (in `.eleventy.js`) rewrites the
root-relative URLs Eleventy renders into HTML, such as that `script` tag, if a
`--pathprefix` is ever passed for a build. It does not — and cannot — rewrite
a URL that only ever exists inside a `.js` file, because it works on rendered
HTML output, not on JavaScript. Nothing under `lib/draw/` or `lib/field/`
should ever gain one (there is none today), because introducing it would
silently break this page the day the site moves off its own domain and back
onto the GitHub Pages project path — and nothing catches that until the
deploy that does it, since neither `html-validate` nor the link checker reads
inside a script.

## The board's data

A board is `{ view, tokens, arrows }` (`lib/draw/state.js`). Every position on
it is football units — yards across from the centre of the field, yards from
the current view's anchor line — never SVG units. `lib/field/geometry.js` is
the only place a yard turns into an SVG coordinate, in either direction: `x()`
and `y()` go football-units-to-SVG for the diagrams, and their inverses
`xToYards()` / `yToYards()` go the other way for a pointer position on this
page. **The view is a camera**: switching it (a preset does this) moves
nothing already on the board, which is what lets a saved board or a share link
made today still open correctly after somebody retunes a view's `scaleY` in
`lib/field/views.js`.

`state.js` owns everything that can be on a board, and it throws rather than
coerces — a bad value here is a bug today or a crafted link tomorrow, and
both want the same answer. `lib/draw/codec.js`, the share-link format, does
not repeat any of `state.js`'s bounds; it decodes a payload and hands each
item to `state.js`, catching the throw and dropping just that item. **There is
exactly one allowlist for what can be on a board, and it lives in
`state.js`.** A second one in `codec.js` would drift from the first the moment
either changed without the other. This is not a style preference: an earlier
version of `state.js`'s view check used a plain truthiness test
(`views[name]`) instead of `Object.hasOwn(views, name)`, and `views['__proto__']`
is `Object.prototype` — an object, and therefore truthy — so a crafted link
naming `__proto__` as its view passed the check and handed every later
`view.scaleY` an `undefined` to do arithmetic with. It was caught precisely
because `codec.js` has no view logic of its own to have separately gotten
right; fixing `requireView()` once in `state.js` fixed it for both the UI and
every share link.

## Adding a preset

Presets live in `lib/draw/presets.js` as `{ id, label, group, view, tokens }`.
`group` is `'situation'` or `'formation'`, and the two are not interchangeable:

- **Situations** (Kickoff, Field Goal, Goal Line, Punt, Spot) carry officials,
  and their positions are this association's mechanics — extracted from this
  site's own committed diagrams, not typed in from memory. See
  `docs/sources.md`'s "Draw-a-play presets" section for exactly which files
  each one came from and how solidly each rests on them; don't duplicate that
  table here, read it there before adding or trusting one.
- **Formations** (Wing-T, Trips, Power I, Shotgun) carry no officials — they
  are offense-only scenery from named public coaching sources, not this
  association's material, which is why `app.js` labels and colours their
  buttons differently. Adding one means citing a source in `docs/sources.md`,
  the same section, not eyeballing a diagram.

Either way: never hand-type an official's position from memory or from eyeing
a picture. If a position can't be pinned to a source, leave it out and record
the gap in `docs/sources.md` rather than guessing at a number that will read
as this association's mechanics to whoever loads the preset.

**Crew-of-four presets are deliberately absent, and not because nobody has
gotten to them.** This plan originally assumed a crew of four is a crew of
five with the Back Judge removed. Extracting the real crew-of-4 diagrams
disproved that: measured against "crew-of-5 minus the Back Judge," the actual
crew-of-4 positions move the Line Judge 50 yards downfield on a kickoff, the
Umpire 10 yards, the Referee 12.8 yards across and 10 back, and put the
Linesman into the Back Judge's old spot on a field goal. A crew that works
with four redistributes coverage — that is real mechanics, and the formula
this plan first assumed would have taught four officials to stand in the
wrong places. If crew-of-4 presets are wanted, they need their own extraction
from their own committed art as separate scenes, the same way the five
situations above were built — never derived from an existing preset by
removing one official.

`test/draw/presets.test.js` checks structure (every view exists, every token
lands somewhere its view can show, every mark and player kind is one
`state.js` recognizes) — it has no way to check that a position is *correct*,
which is what the sourcing discipline above is for.

## The share link

A board becomes a link through `lib/draw/codec.js`: JSON, then base64url, in
the URL fragment (`#d=...`) so the payload never reaches the server —
`app.js` is the only file that knows the board lives there. The wire format
is versioned (`VERSION` in `codec.js`) and the format itself, plus exactly why
each design choice in it exists, is documented in that file's own header
comment — read it there rather than here, because the code and the
explanation of the code are one file and one place to keep in sync.

**What to do when the format needs to change:** bump `VERSION`, keep the
old-version decoding path working, and never touch the frozen payload in
`test/draw/codec.test.js` (`VERSION_1_LINK`) — that string was written out by
hand rather than produced by calling `encode()`, specifically so a refactor of
the encoder can't quietly bring the test into agreement with a format that no
longer opens a link someone already has in a text message. If that test ever
starts failing, the fix is in the decoder, not in the test's frozen string.

## Monochrome, with one exception

The field and every player, official, and arrow on it stay the same
black-and-white the printable cards use (`docs/cards/README.md`) — these get
photocopied and read on a sideline, same as the cards. `lib/field/style.js` is
the one stylesheet this is enforced through; nothing on the board reaches for
a colour of its own outside it.

The one thing a user can colour is a caption's text — that is a feature
someone asked for, and it is not the same act as the site publishing a
diagram. It has a real cost, stated once on the page beside the colour
control (`app.js`): a coloured caption prints as flat grey on a black-and-white
laser and a pale one all but vanishes, so colour must never be the only thing
carrying a caption's meaning.

UI chrome — the selection outline, hover states, which tool is active — may
use colour freely, because none of it ever leaves the screen.

## Testing it

```bash
npm run build          # /draw is a built page like any other
npm run test:draw      # test/draw/*.test.js — needs the build above first
```

`test/draw/*.test.js` splits the way the code does: `state.test.js`,
`codec.test.js`, and `presets.test.js` are pure Node, no browser, and exercise
the board as data. `test/draw/page.test.js` is the one file that opens a real
browser (Playwright, the same Chromium the printable cards use) against the
built `_site/`, because it is the only test here that can confirm the page
actually boots, a preset actually paints tokens, and — the two cases it exists
for — a stranger's mangled share link cannot wedge the page and a stranger's
caption text cannot become an element rather than words. `npm test` runs
`npm run build` first and then all of the above, in order.
