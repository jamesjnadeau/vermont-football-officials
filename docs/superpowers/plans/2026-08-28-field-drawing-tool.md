# The Field Drawing Tool Implementation Plan

> **Implemented.** All nine tasks landed: `/draw` builds and its guard rails
> (`test/draw/*.test.js`, `test/content/output.test.js`) pass. It shipped
> deliberately unlinked, as this plan specified; it was later added to the main
> navigation as "Play Draw" at the site owner's request, and the test that
> asserted nothing linked it was inverted to require the nav link. It stays out
> of the article collections either way. Kickoff, Field Goal, Goal Line, Punt
> and Spot shipped as Situation presets, and Wing-T, Trips, Power I, Shotgun
> and an empty scrimmage set shipped as Formation presets, per Task 4. Two
> things shipped on weaker footing than the rest, and both are stated where
> the data lives
> (`docs/sources.md`'s "Draw-a-play presets" section), not just here:
> **Spot rests on one uncorroborated source diagram** (no position cards
> exist for that scene, unlike the other four Situations, each checked
> against five or six agreeing sources), and **crew-of-4 presets did not
> ship** — this plan originally assumed a crew of four is a crew of five
> minus the Back Judge, and extracting the real crew-of-4 art (Task 4
> Step 1) disproved it: officials redistribute coverage rather than one
> simply stepping out, so shipping a derived crew-of-4 would have taught
> wrong mechanics. A crew-of-4 preset still needs its own extraction from
> its own art, not a formula. See `docs/draw/README.md`,
> `lib/field/README.md` and `docs/sources.md` for what shipped and why.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A page at `/draw` where an official can lay a play out on a field —
drop players and officials, drag them where they go, start from a named
formation, draw movement arrows, write on it — and hand somebody the result as
a link. The field it draws on is the same field `lib/field/` already draws for the
committed diagrams, not a second one that will drift from it.

**Architecture:** The field modules under `lib/field/` are dependency-free ESM
that turn football units into SVG strings. They already run in Node; they run
unchanged in a browser once they are served. So `lib/` is passthrough-copied to
`/js/`, `/draw` imports the same modules the diagram renderer does, and one
coordinate system serves both. The board's state is a small object in football
units — never SVG units — which makes the share link stable, the crop a camera
rather than part of the data, and the whole thing testable in Node with no
browser.

**Tech Stack:** Node 24 ESM, Pug, Bootstrap 5, plain browser ES modules with
Pointer Events. No new dependencies, no bundler, no framework. Playwright is
already installed for the printable cards and gets one smoke test here.

---

## What's actually there right now

**The field renderer is one task old.** `2026-08-27-field-diagrams-svg.md` Task 1
landed in commit `23fa625`: `lib/field/geometry.js`, `style.js`, `field.js`,
`views.js`, and `test/field/geometry.test.js`. Tasks 2–6 of that plan have not
started — there is no `markers.js`, no `render.js`, no `bin/render-diagrams.js`,
and no `npm run diagrams`. The 50 SVGs in `static/images/` are still the
originally committed files; nothing generates them yet.

So this plan inherits a field it can draw on and no way to put anything on it.
**It builds `lib/field/markers.js`** — which is that plan's Task 2 Step 1, to
that plan's stated interface — rather than inventing a parallel set of token
shapes for the drawing page. When the diagram plan resumes, `markers.js` is
already there and already proved by a second consumer.

**The mark vocabulary is fully readable off the committed SVGs.** Measured from
`static/images/position-cards/referee/kickoff.svg`:

| Mark | Shape | Notes |
| --- | --- | --- |
| Official | `<circle r="9.5" class="hat-b">` + `<text class="mk mk-l">` at `y + 4.2` | |
| Official, highlighted | `<g class="you">` wrapping `<circle r="14.5" class="halo">`, `<circle r="9.5" class="hat-w">`, `<text class="mk mk-d">` | |
| Player, offense/kicking | `<g class="kp">` holding two crossed `<line>` — an X | |
| Player, defense/receiving | `<circle r="3.8" class="rp">` | |
| Movement | `<path class="mv" marker-end="url(#ar)">` | straight `L` segments; `<text class="note middle">` labels one |
| Note | `<text class="note middle|start|end">` | |

Officials in that file stand at `cx="20"` and `cx="250"` — **outside** the
sidelines at 35 and 235, and outside even the 26/244 the diagram plan's table
records. Out-of-bounds officials are normal and a wing official on the far
sideline is the whole point of some diagrams, so the drawing page clamps tokens
to the 270-unit viewBox, never to the field.

**The site has three constraints a new page has to satisfy**, all enforced by
`test/content/output.test.js`:

1. Every built page needs `<html lang>`, a non-empty `<title>`, and a
   `<meta name="description">`. Using `layouts/main.pug` supplies the first;
   front matter supplies the other two.
2. **Every built page needs a footer linking Pages CMS.** That footer lives in
   `layouts/main.pug`, so `/draw` uses that layout — it cannot be a bare
   standalone HTML file.
3. No `<script src>` pointing at a third-party host. Everything ships from the
   repo, which this plan does anyway.

`html-validate` globs `_site/**/*.html`, so `/draw` is validated whether or not
anything links to it.

**Nothing needs doing to keep it out of the navigation.** The nav in
`layouts/main.pug` is three hardcoded `a.nav-item` links, and the topic/tag
machinery only picks up what carries a topic tag. `eleventyExcludeFromCollections:
true` and no `tags:` is the whole of it — but Task 8 adds a test, because "it's
hidden because nobody remembered to link it" is not a guarantee.

**No path prefix.** The site builds at the domain root (`static/CNAME`,
and the comment on the `npm run build` step in `deploy.yml` says why). Root-
absolute module specifiers like `/js/draw/app.js` are safe. `HtmlBasePlugin`
rewrites HTML, not JavaScript, so if a path prefix is ever introduced this page
breaks — noted in Task 9.

---

## Global Constraints

- All constraints from `2026-07-26-eleventy-migration.md` apply.
- **One field, one geometry.** The drawing page must not contain a coordinate,
  a yard-to-unit conversion, or a copy of a mark's shape. Everything comes
  through `lib/field/`. If the page needs something the renderer can't express,
  the renderer gains it — that is the point of building `markers.js` here.
- **Monochrome, with one deliberate exception.** The field, and every player,
  official and arrow on it, stay the black-and-white the cards print in —
  inherited from `2026-08-27-field-reference-cards.md`. UI chrome (selection
  outline, hover, the active tool) may use colour because it never leaves the
  screen. **Text annotations are colourable by the user**, which is asked for
  and is not the same act as the site publishing a diagram. It carries a real
  cost: a coloured caption on a black-and-white laser prints as flat grey and a
  pale one all but vanishes, so colour must never be the only thing carrying a
  caption's meaning. Say that on the page, once, beside the colour control.
- **Football units in state, SVG units nowhere.** A saved board holds yards
  across from centre and yards from the view's anchor line. A share link made
  today must still open correctly after somebody retunes a view's `scaleY`.
- **Untrusted input.** The share payload comes off the URL, which means anyone
  can hand an official a crafted link to a page on the association's domain.
  Everything decoded is validated against an allowlist before it reaches the
  DOM, and no free text is interpolated into markup unescaped. Text
  annotations make this load-bearing rather than precautionary: from Task 6 on,
  the URL carries words, a colour, a size and an angle that all end up in the
  document. See Task 7 Step 2.
- **No new dependencies.** Node 24 and the browser both have `TextEncoder`,
  `btoa`/`atob`, `structuredClone`, and Pointer Events.
- **The officials' positions in the presets are mechanics.** They come from the
  committed diagrams, not from memory. See Task 4 Step 1, which is the one step
  in this plan that can teach somebody something false.

---

### Task 1: `markers.js` — the marks themselves

The layer that puts things on the field. Shared by the drawing page and, later,
by the diagram renderer.

**Files:**
- Create: `lib/field/markers.js`
- Create: `test/field/markers.test.js`
- Modify: `package.json` (`test:field` already globs `test/field/*.test.js` — confirm, don't duplicate)

**Interfaces:**
- Consumes: `geometry.js` (`x`, `y`, `num`).
- Produces: `official()`, `player()`, `movement()`, `note()`, `label()`,
  `flag()`, each returning an SVG fragment string.

- [ ] **Step 1: Write `markers.js` to the shapes measured above**

One function per primitive, each taking football coordinates and the view:

- `official({ mark, at, highlight })` — `at` is `{ across, down }` in yards.
  `highlight: true` emits the `you` group with `halo` + `hat-w` + `mk-d`;
  otherwise `hat-b` + `mk-l`. The highlight is a parameter, not a separate
  scene — that is what collapses 30 position-card files into 6 later.
- `player({ kind, at })` — `'k'` for the crossed-line X, `'r'` for the outlined
  circle.
- `movement({ points, label })` — a `<path class="mv">` with `marker-end`.
  Takes a list of points, so a straight arrow is the two-point case and a bent
  one needs no new function.
- `note({ text, at, anchor })`, `flag({ at })` — the diagrams' fixed italic
  caption and the penalty flag. These keep their current styling and stay
  driven by the shared `STYLE` block.
- `label({ text, at, size, color, bold, underline, rotate })` — the drawing
  page's writable text, and the one mark whose styling cannot live in `STYLE`.
  Any size and any colour is an unbounded vocabulary, so `label()` emits
  **inline presentation attributes** (`font-size`, `fill`, `font-weight`,
  `text-decoration`) rather than classes. That is the whole reason it is a
  second function instead of an option on `note()`; comment it there, or
  somebody will merge them back.

  `rotate` is emitted as `transform="rotate(a cx cy)"` about the label's own
  anchor point, so changing the angle spins the text in place instead of
  swinging it across the field.

Escape every string that reaches text content. `field.js` already has an
`escapeText` helper doing exactly this — **lift it into a shared module rather
than copying it**, since Tasks 6 and 7 depend on it holding.

Round through `num()`. No literal ever appears twice.

- [ ] **Step 2: Let a mark be positioned by its group, not only by its centre**

The drawing page moves a token 60 times a second. Re-serialising a whole board
per frame is avoidable: each token renders once into a `<g class="token">` and
drag updates only that group's `transform`.

For that to work without a special case, a marker must be renderable at the
origin. Confirm each function accepts `at: { across: 0, down: 0 }` mapped
through a view whose anchor puts that at `(0, 0)` — or, more simply, give each
function an optional `origin` mode that emits at `0,0` and leaves placement to
the caller's transform. **Pick one and comment why**; the diagram renderer will
use absolute placement and the drawing page will use transforms, and both must
produce the same picture.

- [ ] **Step 3: Test the marks**

Structure, not pixels, per the diagram plan's Task 2 Step 3:

- A highlighted official emits exactly one `halo`, one `hat-w`, one `mk-d`, and
  no `hat-b`; an unhighlighted one emits `hat-b` + `mk-l` and no halo.
- The same call twice returns identical strings.
- A mark whose text contains `<`, `&`, or a quote comes back escaped —
  `note()` and `label()` both, since `label()` is the one that will carry text
  a stranger typed.
- A `label()` emits its size, colour, weight and decoration as attributes, and
  emits nothing for the ones left at their defaults.
- A rotated `label()` and an unrotated one have the same anchor coordinates:
  rotation must not move the text.
- Every emitted coordinate carries at most two decimals.
- A mark rendered at the origin plus a `translate` lands where the same mark
  rendered absolutely lands (this is the Step 2 invariant, and it is the one
  that will actually break).

- [ ] **Step 4: Commit**

```bash
npm test
git add -A
git commit -m "Paint players, officials and movement onto the field"
```

---

### Task 2: The board on a page

An empty field at `/draw`, drawn by the same code that draws the committed
diagrams. Nothing moves yet.

**Files:**
- Create: `content/draw/index.pug`
- Create: `lib/draw/board.js`
- Create: `lib/draw/app.js`
- Modify: `.eleventy.js` (passthrough copy)
- Modify: `content/styles/main.scss`

**Interfaces:**
- Consumes: `lib/field/{views,field,markers,style}.js` over HTTP.
- Produces: `/draw`, showing a field.

- [ ] **Step 1: Serve `lib/` to the browser**

In `.eleventy.js`:

```js
eleventyConfig.addPassthroughCopy({ "lib/field": "js/field", "lib/draw": "js/draw" });
```

Mirroring `lib/` onto `js/` is deliberate: a relative import like
`../field/geometry.js` then resolves identically in Node and in the browser, so
no module needs two spellings of its own dependencies. Comment that in the
config — it is the reason the layout is what it is, and it is not obvious.

`lib/draw/app.js` is the only module here that touches `document`. Say so in
its header. Everything else must stay importable by `node --test`.

- [ ] **Step 2: Write the page**

`content/draw/index.pug`, front matter:

```yaml
title: Draw a Play | Vermont Football Officials
description: Lay players and officials out on a field, draw their movement, and share the result as a link.
layout: layouts/main.pug
eleventyExcludeFromCollections: true
```

No `tags:` — a tag would put it on a topic page and in the Information list.

Body: a toolbar, an `<svg id="board">` shell, and
`script(type="module" src="/js/draw/app.js")`. Plus a `<noscript>` saying the
page needs JavaScript and pointing at `/information/` for the static diagrams —
the board is built entirely client-side, so without this the page is a blank
white box. (Server-rendering a default board was considered and rejected: a
shared link's state lives in the fragment, which never reaches the server, so
the no-JS rendering would silently show the wrong play.)

- [ ] **Step 3: Write `board.js` — the field layer**

Takes a view name, returns the `viewBox`, the `<style>`, the `<defs>`, and the
field body — all of it straight from `renderField()` and `STYLE`/`DEFS`. The
SVG gets stacked `<g>` layers in paint order, created once and never
reordered:

    field → players → officials → arrows → text → overlay

A caption must never end up under a player, and the way to guarantee that is
structural rather than per-item. **Text is the topmost content layer** — that is
what "highest z" means here. `overlay` sits above it and holds only UI chrome:
the selection outline and the in-progress arrow preview, which are never part
of a shared board.

- [ ] **Step 4: Style it**

In `main.scss`, under a `.draw-` prefix: the board sized to its aspect ratio and
capped so a tall crop like `kickoff` still fits a laptop viewport, the toolbar
wrapping on narrow screens, and `touch-action: none` on the board so a drag on
a phone moves a token instead of scrolling the page.

Production PurgeCSS scans `_site/**/*.html` **and** `_site/**/*.js`, and
`lib/draw/` is copied into `_site/js/`, so a class named only in JavaScript
survives. Verify with `NODE_ENV=production npm run build` before believing it.

- [ ] **Step 5: Look at it**

`npm run dev`, open `/draw`, and compare the field against
`static/images/position-cards/referee/run.svg` opened beside it. Same line
weights, same hatch, same numbers. If it differs, it is `board.js` mishandling
the renderer's output, because the field code is unchanged and already proved.

- [ ] **Step 6: Commit**

```bash
npm test
git add -A
git commit -m "Draw the field on a page at /draw"
```

---

### Task 3: Tokens you can move

**Files:**
- Create: `lib/draw/state.js`
- Modify: `lib/draw/app.js`
- Create: `test/draw/state.test.js`
- Modify: `package.json` (`"test:draw": "node --test \"test/draw/*.test.js\""`, wired into `test`)

- [ ] **Step 1: Write `state.js` — the board as data**

```js
{ view: 'runPass',
  tokens: [{ id, type: 'official'|'player', kind, mark, across, down }],
  arrows: [{ id, points: [{ across, down }, ...] }] }
```

`across` is yards from the middle of the field, `down` is yards from the view's
anchor line — the same units `geometry.js` takes. **The view is a camera, not
part of a token.** Changing the crop must not move anything; it changes what is
in frame and nothing else. This is what makes Task 4's preset switching and
Task 7's share link both work without special cases.

Pure functions only: `addToken`, `moveToken`, `removeToken`, `setView`,
`addArrow`. Each returns a new state. No DOM, no globals — `node --test` runs
this file.

- [ ] **Step 2: Drag with Pointer Events**

Pointer Events, not mouse events: one code path covers mouse, finger and pen,
and officials will open this on a phone at a meeting. `setPointerCapture` on
`pointerdown` so a fast drag that leaves the token keeps tracking.

Screen pixels convert to football units through the SVG's own
`getScreenCTM().inverse()` and then `geometry.js` in reverse — do not
reimplement the scaling with the element's bounding box, which goes wrong the
moment the board is scaled by CSS.

Clamp to the 270-unit viewBox, **not** to the sidelines. Officials stand out of
bounds; that is where several of them belong.

- [ ] **Step 3: Add, select and delete**

A palette of what can be dropped: offense player, defense player, and each
official mark (R, U, H/LM, L/LJ, B/BJ — take the letter set from the marks
already used in `static/images/position-cards/`, do not invent one). Click a
palette item to add it at the middle of the frame; drag it where it goes.

Selection gets a visible outline that is UI chrome, not a mark — it must not
survive into anything shareable or printable.

- [ ] **Step 4: Keyboard access**

A drag-only tool is unusable without a mouse, and this site already treats that
as a defect (the `focusableCodeBlocks` transform in `.eleventy.js`). Each token
is focusable with a real accessible name ("Referee", "offense player"); arrow
keys nudge by a quarter yard, shift-arrow by a yard, Delete removes. Tab order
follows the token list.

- [ ] **Step 5: Undo**

A capped stack of past states (50 is plenty — the whole state is a few hundred
bytes). Push on every structural change and on drag *end*, never on
`pointermove`, or one drag fills the stack. Ctrl/Cmd-Z, and a button, because
the button is the only one a phone has.

- [ ] **Step 6: Test the state**

`test/draw/state.test.js`: every mutation returns a new object and leaves the
old one untouched; a token moved twice ends where the second move put it;
removing a token leaves the others' ids alone; `setView` changes no token's
coordinates — assert that one explicitly, it is the load-bearing invariant.

- [ ] **Step 7: Commit**

```bash
npm test
git add -A
git commit -m "Move players and officials around the drawing board"
```

---

### Task 4: Presets

**Files:**
- Create: `lib/draw/presets.js`
- Create: `test/draw/presets.test.js`
- Modify: `lib/draw/app.js`, `docs/sources.md`

- [ ] **Step 1: VERIFICATION GATE — get the officials off the committed diagrams**

The officials' positions on this page are mechanics. Somebody will read them as
where to stand.

For `kickoff`, `field goal` and `goal line`, the positions already exist and are
correct: `static/images/position-cards/*/kickoff.svg`,
`.../field-goal.svg`, `.../goal-line.svg`, and the crew cards in
`static/images/kicking-plays/`. Write a throwaway script that parses those SVGs
back into football units — `<circle class="hat-b" cx cy>` plus the `<text
class="mk">` beside it, inverted through `geometry.js` — and emit the preset
data from that. **Do not transcribe positions by hand**; the diagram plan's Task
3 Step 1 says the same thing for the same reason, and this script is a first
draft of that extractor. Keep it in the scratchpad, not the repo.

Use the un-highlighted crew-of-5 rendering, since a drawing board has no "you".

**Corrected after the gate ran: crew-of-4 presets are out.** This plan originally
said a crew-of-4 preset is the crew-of-5 with the Back Judge removed. The
extraction disproved that against the committed art. Measured against
(crew-of-5 − BJ), the real crew-of-4 diagrams move officials by: kickoff — U by
10.0 yd, R by (12.8, −10.0) yd, LM by (16.8, −10.0) yd, **LJ by 50.0 yd
downfield**; field goal — LM by (21.6, 10.73) yd into BJ's old spot. When a crew
works with four, the remaining officials redistribute coverage; that is real
mechanics, and the derivation this plan assumed would have taught four officials
to stand in the wrong places. Ship crew-of-5 presets only. If crew-of-4 presets
are wanted later they must be extracted from their own committed art as separate
scenes — never derived.

For the offensive formations — Wing-T, Trips, Power I, Shotgun — nothing in this
repo holds them. They are standard and widely published; take them from a
named source, cite it in `docs/sources.md`, and **label them in the UI as
starting points, not as mechanics**. The distinction is the point: officials'
positions here are this association's material, formations are scenery for
putting a play together.

If a position cannot be settled from either, leave it out and record the gap in
`docs/sources.md`. Do not guess one.

- [ ] **Step 2: Write `presets.js`**

Each preset is `{ label, view, tokens }` — no arrows, since an arrow is
something the user draws. Presets carry a view because they need different
crops: a kickoff spans 70 yards and a Wing-T needs 15, and squeezing both into
one crop makes both bad. Applying a preset replaces the board (undoable, per
Task 3 Step 5).

Group them in the UI: **Formations** (Wing-T, Trips, Power I, Shotgun,
plus an empty scrimmage set) and **Situations** (Kickoff, Punt, Field Goal,
Goal Line, Spot). The second group is the one carrying officials.

- [ ] **Step 3: Test the presets**

`test/draw/presets.test.js`, in Node, no browser:

- Every preset names a view that exists in `views.js`.
- Every token lands inside the 270-unit viewBox and inside its view's vertical
  range once mapped through `geometry.js` — a preset that puts a wing official
  off the canvas is invisible and unfixable by the user.
- Every official's `mark` is in the allowed set; every formation has 11
  offensive players, or a comment on the preset saying why not.
- No preset is derived from another by removing an official. The crew-of-4
  derivation this plan first assumed is false against the committed art (see
  Step 1), so a test asserting it would lock in the error.
- Every preset places its tokens at explicit extracted coordinates. Nothing goes
  through Task 3's `openSpot` add-cascade, which is for hand-placed tokens and is
  known to collapse onto one clamped corner past roughly a dozen same-mark adds.

- [ ] **Step 4: Commit**

```bash
npm test
git add -A
git commit -m "Start a play from a formation or a kicking situation"
```

---

### Task 5: Arrows

**Files:**
- Modify: `lib/draw/app.js`, `lib/draw/state.js`, `content/draw/index.pug`

- [ ] **Step 1: A tool mode**

Two modes, Select and Arrow, as a radio-style pair in the toolbar with the
active one visibly active and announced (`aria-pressed`). Escape returns to
Select from anywhere — the way out of a drawing mode has to be obvious.

- [ ] **Step 2: Draw one**

In Arrow mode, `pointerdown` starts, `pointermove` previews into the `overlay`
layer, `pointerup` commits through `movement()`. Straight two-point arrows.

A drag under a few units is a mis-click, not an arrow: discard it rather than
leaving an invisible zero-length path that can never be selected to delete.

- [ ] **Step 3: Bent arrows**

`movement()` takes a list of points (Task 1 Step 1), so this is UI, not
renderer: in Arrow mode, a click extends the current path and a double-click or
Enter finishes it. Keep it behind the same tool — a second toolbar button for
"bent arrow" is a mode nobody will find.

- [ ] **Step 4: Delete one**

Arrows are selectable and deletable on the same keys as tokens. An arrow that
can be drawn and not removed makes the page a one-way trip.

- [ ] **Step 5: Commit**

```bash
npm test
git add -A
git commit -m "Draw movement arrows on the board"
```

---

### Task 6: Text

Writing on the board: a caption, a down-and-distance, a name for a formation.
The one thing on the board the user can colour, and the one thing that carries
words rather than positions.

**Files:**
- Modify: `lib/draw/state.js`, `lib/draw/app.js`, `content/draw/index.pug`, `content/styles/main.scss`
- Modify: `test/draw/state.test.js`

- [ ] **Step 1: Add text to the state**

```js
{ id, kind: 'text', text, across, down,
  size, color, bold, underline, rotate }
```

Same football units as everything else, so a caption keeps its place when the
crop changes. `size` is in SVG user units, which is the space the rest of the
board's type lives in — `.mk` is 10 and `.note` is 8.6 — so **6 to 36** spans
"smaller than a diagram caption" to "a banner across the field". `rotate` is
degrees, normalised to the range −180…180 on the way in, so two encodings of
the same angle are the same state.

Defaults: black, 12, not bold, not underlined, 0°. A user who never touches the
controls gets something that looks like the rest of the board.

- [ ] **Step 2: Put it on the top layer**

Into the `text` layer from Task 2 Step 3, above the arrows, through `label()`
from Task 1 Step 1. Nothing here computes an SVG coordinate or writes an
attribute by hand — if a caption needs something `label()` cannot express, it
goes in `label()`.

- [ ] **Step 3: Place one, and edit it in real form controls**

A third tool mode beside Select and Arrow (Task 5 Step 1). Click on the board
places a caption there and moves focus straight to the text field, so placing
and typing is one gesture.

**The editing happens in an HTML `<input>` in a properties strip, not inside
the SVG.** SVG has no dependable `contenteditable`, and a real input brings the
mobile keyboard, IME, text selection, undo-in-field and screen-reader support
that hand-rolling it in SVG would all have to reinvent badly. The strip appears
when a caption is selected and edits that caption live.

An empty caption is not a caption: if the field is left blank on blur, drop the
item rather than leaving an invisible zero-width `<text>` that can be selected
only by accident. Same rule as the too-short arrow in Task 5 Step 2.

- [ ] **Step 4: The formatting controls**

In the properties strip, all acting on the selected caption and all remembered
as the default for the next one:

- **Size** — a number input plus a slider, clamped to the 6–36 of Step 1.
- **Colour** — a short row of swatches (black, plus a few that stay legible at
  small sizes on white) alongside `<input type="color">`. The swatches are what
  a phone user will actually hit; the picker is the escape hatch. Note beside
  it, once, that colour prints grey — the Global Constraints entry says why.
- **Bold** and **Underline** — toggle buttons carrying `aria-pressed`.
- **Angle** — a slider *and* a number input, because a slider alone cannot be
  driven from a keyboard with any precision. Snap to 0 and ±90 within a couple
  of degrees; those three are most of the real uses (flat, and reading up or
  down a sideline).

Bold and underline are booleans that select between fixed attribute values.
Neither the colour nor the size is ever passed through as a raw CSS string —
`fill` accepts `url(#…)`, so "whatever the user typed" is not a colour.

- [ ] **Step 5: Select, move, delete, undo — the same way as everything else**

A caption is a token as far as the rest of the page is concerned: dragging
(Task 3 Step 2), keyboard nudging (Task 3 Step 4), Delete, and undo (Task 3
Step 5) all work on it with no separate code path. Its drag transform and its
rotation compose as `translate(…) rotate(…)` in that order — the other way
round moves the caption when you rotate it.

Its accessible name is its own text, so a screen reader reads the caption
rather than "text item 3".

- [ ] **Step 6: Test it**

Extend `test/draw/state.test.js`: a caption survives `setView` unmoved, like
every other item; an angle of 450 normalises to 90 and −270 to 90 as well; a
size outside 6–36 is clamped, not rejected into a broken item; a blank caption
is dropped.

- [ ] **Step 7: Commit**

```bash
npm test
git add -A
git commit -m "Write on the board"
```

---

### Task 7: The share link

**Files:**
- Create: `lib/draw/codec.js`
- Create: `test/draw/codec.test.js`
- Modify: `lib/draw/app.js`, `content/draw/index.pug`

- [ ] **Step 1: Write `codec.js`**

`encode(state)` → a base64url string; `decode(string)` → a state or `null`.

- JSON with short keys and coordinates rounded to one decimal — a full board of
  22 players and 5 officials lands around 700 characters encoded, which is
  comfortably inside every browser's URL limit. Captions are the variable part:
  each costs its own text plus its styling, so omit every field that is still
  at its default rather than writing the whole record out.
- **base64url** (`-`/`_`, no padding), not plain base64: `+`, `/` and `=` all
  need percent-encoding in a URL and will be mangled by something on the way to
  the recipient.
- UTF-8 safe: `btoa(String.fromCharCode(...new TextEncoder().encode(json)))`,
  not `btoa(json)`, which throws on any character above U+00FF.
- A `v` field, checked on decode. Version 1 is the only one today; the point is
  that version 2 can still open version 1's links, and a link from the future
  fails cleanly instead of half-loading.

- [ ] **Step 2: Validate everything that comes off the URL**

This is the security-relevant step. The payload is attacker-controllable and
the page is on the association's domain.

- `view` must be a key of `views`. Not "a string" — a key.
- `type` and `kind` must be in a fixed allowlist.
- `mark` must match `/^[A-Z]{1,2}$/`. Marks reach the DOM as text; an
  unvalidated one plus a future `innerHTML` path is a stored XSS on a real site.
- Every number must be finite and inside the board, clamped rather than
  trusted.
- Token, arrow and caption counts capped, so a crafted link cannot hang the
  page building a hundred thousand nodes.

And for the captions from Task 6, which are the only free text in the payload
and so the only part a stranger fully controls:

- `text` is capped in length and reaches the document **only** through
  `label()`'s escaping, or through `textContent`. Never `innerHTML`, on any
  path, including the accessible name and the properties strip.
- `color` must match `/^#[0-9a-f]{6}$/i`. Not "a non-empty string" — `fill`
  takes `url(#…)`, and a colour that is really a reference is how a well-formed
  payload starts pointing at something it should not.
- `size` clamped to 6–36, `rotate` to a finite −180…180. A `NaN` here does not
  fail loudly; it produces an attribute the browser ignores and a caption that
  silently vanishes.
- `bold` and `underline` coerced to real booleans, and used only to pick
  between fixed attribute values.

Anything that fails validation is dropped; if the whole payload fails, the page
opens the default board and shows a dismissible notice. **A bad link never
produces a blank page and never throws into the console with nothing on
screen** — the person holding it has no idea what went wrong and no way to ask.

- [ ] **Step 3: Wire it to the URL**

State lives in the fragment: `/draw#d=<payload>`. The fragment, not the query
string — it never leaves the browser, so no board is logged by GitHub Pages or
by anything between here and the recipient, and it keeps working on a static
host with no server to read a query.

On load, decode the fragment if present. On change, update it with
`history.replaceState` — not `pushState`, or every drag adds a Back-button
entry. Debounce so a drag writes once at the end.

- [ ] **Step 4: The button**

"Copy link" writes the full absolute URL with `navigator.clipboard.writeText`
and confirms in place. Clipboard access needs a user gesture and a secure
context, and `npm run dev` over plain `http://localhost` is one — but a
`file://` open is not, so keep a fallback that selects the URL in a visible
input for manual copying. Announce the confirmation in a live region, not only
as a colour change.

- [ ] **Step 5: Test the codec**

`test/draw/codec.test.js`, in Node:

- Round-trip: a board with tokens and arrows encodes and decodes to an equal
  board, coordinates included.
- The encoding contains no character outside the base64url alphabet.
- `decode` returns `null`, and does not throw, for: empty string, non-base64,
  valid base64 of non-JSON, valid JSON that is not an object, a missing or
  unknown `v`.
- The hostile cases are *dropped, not sanitised into something*: a `mark` of
  `<script>`, an unknown `view`, `across: Infinity`, `across: 1e9`, a
  `__proto__` key, ten thousand tokens.
- The caption cases, each asserted separately because each is a different
  mistake: `color: "url(#x)"`, `color: "red"`, `color: "#fff"` (three digits —
  decide and test whether it is accepted or dropped), `size: 1e6`,
  `rotate: NaN`, a `text` of a megabyte, and a `text` of
  `<script>alert(1)</script>` which must survive as those literal characters
  and never as an element.
- A hand-written version-1 payload committed in the test file still decodes.
  This is the test that stops a refactor from silently invalidating every link
  anyone has already shared.

- [ ] **Step 6: Commit**

```bash
npm test
git add -A
git commit -m "Share a drawn play as a link"
```

---

### Task 8: Guard rails

**Files:**
- Create: `test/draw/page.test.js`
- Modify: `test/content/output.test.js`, `package.json`

- [ ] **Step 1: Assert `/draw` is built and stays out of the way**

In `test/content/output.test.js`: `_site/draw/index.html` exists; no built page
links `href="/draw"` (or `/draw/`); `/draw` appears in no collection listing —
check the Information index and the topic pages, which is where a stray tag
would surface it.

- [ ] **Step 2: Link-check the page**

`linkinator _site --recurse` crawls from the home page, so an unlinked `/draw`
is never visited and its links go unchecked. Add it as an explicit second
target in `test:links` and confirm linkinator accepts both.

- [ ] **Step 3: One browser smoke test**

Playwright and Chromium are already installed and already cached in CI for the
cards, so this costs a few seconds, not a new toolchain. Serve `_site/` over
HTTP — **not `file://`**, which blocks ES module imports — and assert:

1. `/draw` renders a board with the field's sidelines and hash marks present.
2. Clicking a preset button puts the expected number of tokens on it.
3. Dragging a token changes the fragment, and reloading that URL reproduces the
   same board.
4. Opening `/draw#d=notvalidbase64` shows the default board and the notice, and
   logs no uncaught error.
5. Opening a link whose caption text is `<script>alert(1)</script>` shows those
   characters on the field as words, adds no `<script>` element to the
   document, and fires no dialog.

The last two are the real reason for this test. Neither is reachable from a
unit test, one is what a stranger with a mangled link hits, and the other is
the thing the whole of Task 7 Step 2 exists to prevent — an assertion in Node
that a string was escaped is not the same as a browser confirming it never
became an element.

Reuse `chromiumExecutable()` from `lib/cards/render.js` rather than calling
`chromium.launch()` bare — it already handles the several places a browser can
live and fails with a useful message when it is missing.

- [ ] **Step 4: Commit**

```bash
npm test
git add -A
git commit -m "Guard the drawing page against drift and bad links"
```

---

### Task 9: Document it

**Files:**
- Create: `docs/draw/README.md`
- Modify: `README.md`, `lib/field/README.md` (if Task 6 of the diagram plan has landed by then), `docs/sources.md`

- [ ] **Step 1: Write `docs/draw/README.md`**

How to add a preset, how the share payload is versioned and what to do when it
changes, and the `lib/` → `js/` mirroring rule with the reason. Record the two
constraints a future change can trip over without any test catching it until
deploy: **the page is not in the navigation on purpose**, and **root-absolute
module imports assume no path prefix**.

- [ ] **Step 2: Note it in the top-level README**

Under Developing: `/draw` exists, it is deliberately unlinked, and `lib/field/`
and `lib/draw/` are served to the browser as `/js/field/` and `/js/draw/` — so a
Node-only API (`node:fs`, `process`) must not appear in either.

- [ ] **Step 3: Record the provenance**

In `docs/sources.md`: the officials' preset positions came from the committed
position-card and crew-card SVGs; the offensive formations came from the source
named in Task 4 Step 1; anything left unresolved is listed as open.

- [ ] **Step 4: Commit**

```bash
npm test
git add -A
git commit -m "Document the drawing page"
```

---

## Decisions worth confirming before this is built

1. **The presets' officials come from the committed diagrams, the formations do
   not.** Task 4 Step 1 draws that line and says formations are labelled as
   starting points. If the formations should instead be sourced as carefully as
   the mechanics — or dropped entirely, leaving only the situations — that
   changes Task 4 and nothing else.

2. **Text is in, and it is why the codec's validation matters.** A caption
   carries words, a colour, a size and an angle, all of them in the share link
   — which makes `/draw` a way to put arbitrary text on a page at this
   association's domain and hand somebody the URL. That exposure is inherent in
   a shareable board that can be written on, not something the implementation
   adds, and Task 7 Step 2 plus Task 8 Step 3 are what keep it to *words*. Worth
   confirming you want it knowing that, because it is the one part of this plan
   where a sloppy implementation is a security bug rather than a wrong diagram.

   Arrow labels are still out — an arrow's caption can be a text item placed
   beside it, which needs no second text path to get right.

3. **The share state lives in the fragment.** Nothing server-side ever sees a
   board. The cost is that a shared link's content is invisible to link
   previews and to `linkinator`.

## Deliberately out of scope

- **Downloading the board as an SVG or PNG.** It is nearly free — the board
  already *is* an SVG string — and it is the obvious next request, especially
  for getting a diagram into an article. It is not what was asked for, and it
  raises a question this plan should not answer alone: whether a
  drawn play can become a committed diagram, which is the diagram plan's
  territory.
- **Animation, play sequencing, printing.**
- **Compressing the share payload.** `CompressionStream` exists in both
  runtimes and would roughly halve a long link. Not needed at ~700 characters,
  and browsers handle far longer URLs than that — but captions are the one part
  of the payload with no fixed size, so a board with a paragraph on it is the
  likeliest thing to force this. Measure before adding it.
- **Fonts.** One family, the board's own. A font picker means either shipping
  files or a third-party host the output test forbids.

## Notes for whoever picks this up

- **Task 1 is the risky one and Task 7 Step 2 is the important one.**
  `markers.js` has 50 committed diagrams to check its shapes against — use
  them. The codec has nothing to check against except the tests written for it,
  and it is the part handling input from strangers. Captions arriving in Task 6
  are what turn that from a precaution into the reason the task exists.

- **This plan advances `2026-08-27-field-diagrams-svg.md` rather than forking
  it.** Task 1 here is that plan's Task 2 Step 1. When that plan resumes, its
  Task 2 needs only `render.js` and its own tests, and its Task 3 extractor has
  a working first draft from Task 4 Step 1 here. Tick those steps there when
  these land, or the next person will build `markers.js` twice.

- **If a preset needs a crop no view has**, add it to `views.js` — that file is
  the list of crops the site uses, and a drawing board is as legitimate a
  consumer as a card. Do not compute a one-off view inside `lib/draw/`.

- **The board is the same monochrome as the cards.** That will look plain next
  to a colour play-designer, and it is correct: these diagrams get photocopied
  and read on a sideline in the rain, and every existing diagram on the site
  encodes meaning by shape because of it.
