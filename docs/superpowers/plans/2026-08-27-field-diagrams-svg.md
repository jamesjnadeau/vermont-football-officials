# Field Diagrams: A Generated SVG Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every field diagram on the site is drawn by one field renderer from a
short scene description, instead of being a hand-emitted SVG blob or a scanned
JPEG. Build the general field first — turf, lines, hashes, numbers, posts — then
the layer that paints players and officials onto it, then express the 50 existing
diagrams and the 7 remaining raster ones as data through it.

**Architecture:** A small ESM module under `lib/field/` that returns SVG strings
from plain data, plus `npm run diagrams` which writes the results into
`static/images/`. Generated SVGs stay committed, so Eleventy's existing
passthrough copy of `static/` is unchanged and the build has no new ordering
dependency. A test regenerates into memory and fails if any committed file has
drifted from its source.

**Tech Stack:** Node 24 ESM, no new dependencies. Output is plain SVG consumed by
`<img src>` in the articles exactly as today.

---

## What's actually there right now

This was measured, not assumed. Four findings drive the plan:

**1. The generator is missing.** `static/images/` holds 50 SVGs across five
directories. None was written by hand: they carry emitter fingerprints like
`y="121.60000000000001"`, `viewBox="0 0 270 394.0"`, and hash marks listed in
loop order rather than reading order. A script produced these and was never
committed — the same finding the field-reference-cards plan hit with the card
HTML. Until it's rebuilt, no diagram on the site can be corrected without hand-
editing coordinates.

**2. The duplication is near-total.** `position-cards/referee/kickoff.svg` and
`position-cards/umpire/kickoff.svg` differ by **18 lines out of 173** — the title,
and which official wears the halo. `position-cards/referee/kickoff.svg` versus
`kicking-plays/kickoff-crew-of-5.svg` differ by **9 lines**. The 30 position-card
files are six scenes rendered six times each with a different official highlighted.
That is six scenes of real content stored as 30 files.

**3. The stylesheet has already drifted three ways.** All 50 files inline a
~30-rule `<style>` block. There are three generations of it: the base (38 files),
base plus flag classes (8), and a variant that drops `text-transform` on the press
box label and adds `.mvlab` (4). Two rules apart today; more tomorrow.

**4. Seven diagrams are still raster and off-style.** `7-man-mechanics/*.jpg` are
JPEG screenshots from the 2022 slide deck: green turf, yellow annotations, boxed
letters, ~105 KB each. They don't scale, don't print monochrome, and don't match
the house visual language the other 50 use.

### The coordinate system, reverse-engineered

The existing files agree on horizontal geometry and disagree on vertical:

| Quantity | Value | Check |
| --- | --- | --- |
| viewBox width | 270 units, all files | — |
| Sidelines | x = 35 and x = 235 | 200 units = 53⅓ yd → **3.75 units/yd** |
| Field centre | x = 135 | — |
| Hash marks | centred x = 101.67 and x = 168.33 | 33.33 units = 8.89 yd from centre = NFHS 53'4" from sideline ✓ |
| Out-of-bounds officials | x = 26 and x = 244 | 2.4 yd outside the sideline |
| Vertical scale | **varies**: 4.0 units/yd tight views, 4.8 units/yd wide views | not derived from the horizontal scale |
| viewBox height | 178, 186, 206, 237.8, 339, 394 — six values | one per crop |

Horizontal scale is correct and consistent. Vertical scale is a per-diagram
choice that was never written down, which is why a 5-yard gap measures 20 units
on a position card and 24 units on a kickoff. The renderer keeps that freedom —
diagrams genuinely need different crops — but makes it an explicit `scaleY`
input rather than an accident.

### The primitive inventory

Every mark in all 50 files, by CSS class, with usage counts:

- **Field:** `turf` (50), `sl` sideline (100), `yl` yard line (185), `gl` goal
  line (60), `rl` restraining line, dashed (50), `hash` (764), `ez` end zone
  (30) filled with the `hl` hatch pattern, `post` goal posts (28),
  `ylab` yard number (522, with `.start`/`.end` anchoring), `pb` press box (50).
- **Players:** `kp` (469) — an X drawn as two crossed lines, one `<g>` per player;
  `rp` (455) — an outlined circle.
- **Officials:** `hat-b` black disc (190), `hat-w` white disc (50), `halo` (50)
  and the `you` group that highlights one official, `mk` label text with
  `mk-l`/`mk-d` for light/dark fill (240).
- **Annotation:** `mv` dotted movement path (81) with the `ar` arrowhead marker
  (`arh`, 50), `note` italic caption (210, with `.start`/`.middle`/`.end`),
  `mvlab` movement label (4), `flagk`/`flagt` penalty flag (2).

That list is the renderer's complete API surface. Nothing else needs inventing.

---

## Global Constraints

- All constraints from `2026-07-26-eleventy-migration.md` apply.
- **Monochrome-first**, inherited from `2026-08-27-field-reference-cards.md`:
  hatching never gray fill, shape-based encoding never color coding, proofed on
  a black-and-white laser. The renderer must not introduce color, including for
  the 7-man rebuild.
- **No visual regression on the 50 existing diagrams.** They are live on the
  site and printed on cards. This plan changes how they are produced, not how
  they look. Byte-identical output is not the bar (the float artifacts are
  worth losing); geometric equivalence is.
- **Generated files stay committed.** No build-time generation, no new Eleventy
  hook. `npm run diagrams` is run by a person; the drift test catches anyone who
  forgets.
- **One stylesheet.** The three generations collapse into one shared block. Any
  rule only some diagrams need is emitted conditionally from a single source,
  never forked.
- **Every diagram keeps its `<title>` and `aria-label`.** The articles' `alt`
  text is detailed and stays as-is; the SVG's own accessible name must match
  what it did before.
- Tasks 1 and 2 are unblocked. Task 3 depends on both. Task 5 depends on Task 2
  and on the verification gate in its own Step 1.

---

### Task 1: The general field

The reusable base every other diagram is painted on: turf, boundaries, yard
lines and numbers, hashes, end zones, goal posts, press box. No players, no
officials. This is the piece to get right before anything is layered on it,
because all 57 diagrams inherit its geometry.

**Files:**
- Create: `lib/field/geometry.js`
- Create: `lib/field/style.js`
- Create: `lib/field/field.js`
- Create: `test/field/geometry.test.js`

**Interfaces:**
- Produces: `renderField(view)` returning `{ svgBody, viewBox, style }`, and a
  coordinate helper `{ x(yardsFromCentre), y(yardLine) }` that scenes use to
  place marks in football terms rather than SVG units.

- [ ] **Step 1: Write `geometry.js` — football units in, SVG units out**

Scenes must never contain a raw SVG coordinate. This module is the only place
that knows about units.

Constants, from the table above: `UNITS_PER_YARD_X = 3.75`, `FIELD_WIDTH_YARDS =
160/3`, `CENTRE_X = 135`, `SIDELINE_LEFT = 35`, `SIDELINE_RIGHT = 235`,
`HASH_FROM_CENTRE_YARDS = 80/9` (53'4" from the sideline, NFHS), `VIEWBOX_WIDTH =
270`.

A `view` describes the crop: which yard lines are visible, whether an end zone
is in frame, and `scaleY` in units per yard. From that it computes viewBox
height and a `y()` mapping. Verify the existing six crops are all expressible —
if one isn't, the view model is wrong, not the diagram.

Round every emitted coordinate to at most two decimals. The
`121.60000000000001` class of artifact does not come back.

- [ ] **Step 2: Write `style.js` — the single stylesheet**

One export holding the unified rule set, reconciling the three drifted
generations. For each of the two divergences, decide deliberately and comment
the decision:

- `.pb` `text-transform: uppercase` — present in 46 files, absent in 4. Keep it;
  check the 4 files' press box labels aren't already uppercased in their text
  content, which would double-apply harmlessly but signals the intent.
- `.mvlab` and `.flagk`/`.flagt` — used by 4 and 2 files. Keep in the shared
  block; the few hundred bytes cost less than a fork.

Emit the same block into every file. Do not try to subset per diagram.

- [ ] **Step 3: Write `field.js` — draw the field**

In back-to-front paint order: turf rect, hatched end zones (with the `hz`
pattern def), yard lines, goal lines, restraining lines where the view asks for
them, hash marks, sidelines, goal posts, yard numbers on both sides, press box
label. Emit the `defs` (hatch pattern, arrow marker) once per file.

Numbers take a labelling mode, because the existing files use two: absolute
(`50`, `40`, `30` — the kickoff view) and relative to the line of scrimmage
(`-10`, `-5`, `+5` — the position cards), plus one-off labels like `K 40`.

- [ ] **Step 4: Test the geometry**

`test/field/geometry.test.js` asserts the derived numbers rather than the
output string:

- 200 units between the sidelines; `x(0) === 135`.
- Hash marks land at 101.67 and 168.33 — this is the one number that encodes an
  actual NFHS rule, and a regression here silently teaches a wrong field.
- End zone is exactly 10 yards at the view's `scaleY`.
- Each of the six existing viewBox heights is reproduced by some view.
- No emitted coordinate carries more than two decimals.

- [ ] **Step 5: Eyeball the bare field**

Render one field at each of the six crops to a scratch HTML page and open it.
The field alone, no markers. Compare side by side against the field layer of the
matching committed SVG. Line weights, hatch density, and number placement must
match — everything downstream sits on this.

- [ ] **Step 6: Commit**

```bash
npm test
git add -A
git commit -m "Draw the general field from geometry instead of literals"
```

---

### Task 2: Painting players and officials

The layer that puts marks on the field. Everything a scene can say.

**Files:**
- Create: `lib/field/markers.js`
- Create: `lib/field/render.js`
- Create: `test/field/markers.test.js`

**Interfaces:**
- Consumes: Task 1's geometry and field.
- Produces: `renderDiagram(scene)` returning a complete SVG document string.

- [ ] **Step 1: Write `markers.js`**

One function per primitive from the inventory, each taking football coordinates:

- `official({ mark, at, highlight })` — black disc plus label; `highlight: true`
  adds the halo and switches to the white disc with dark text. **The highlight is
  a parameter, not a separate scene.** This is what collapses the 30 position-card
  files into 6 scenes.
- `player({ kind, at })` — `'k'` for the crossed-lines X, `'r'` for the outlined
  circle.
- `movement({ from, to, label })` — dotted path with the arrowhead marker; the
  existing files use straight segments and one polyline, so support both.
- `note({ text, at, anchor })` — italic caption, start/middle/end anchored.
- `flag({ at })` — the penalty flag used by the fouls-enforcement pair.

- [ ] **Step 2: Write `render.js` — scene to SVG document**

A scene is: a view, a title, and a list of marks. `renderDiagram` composes the
XML declaration, `<svg>` with `role="img"` and `aria-label`, `<title>`, the
shared style, defs, the field, then the marks in paint order — field, players,
officials, movement, notes — so a note never lands under a player.

Sort emitted marks deterministically. The same scene must produce byte-identical
output on every run, or the drift test in Task 4 is worthless.

- [ ] **Step 3: Test the markers**

Assert structure, not pixels: a highlighted official emits exactly one `halo`,
one `hat-w`, and `mk-d` text; a non-highlighted one emits `hat-b` and `mk-l` and
no halo. Rendering the same scene twice gives identical strings. Every scene
emits a non-empty `<title>` and a matching `aria-label`.

- [ ] **Step 4: Commit**

```bash
npm test
git commit -am "Paint players, officials and movement onto the field"
```

---

### Task 3: Express the 50 existing diagrams as scenes

The port. Content moves out of the SVG files and into scene data; the SVG files
become build output.

**Files:**
- Create: `lib/field/scenes/*.js` (one module per diagram family)
- Create: `bin/render-diagrams.js`
- Modify: `package.json` (add `diagrams` script)

**Interfaces:**
- Consumes: Task 2's `renderDiagram`.
- Produces: `npm run diagrams`, writing all 50 files to their current paths.

- [ ] **Step 1: Extract the scenes from the committed SVGs**

Write a throwaway script that parses each committed SVG back into scene data —
official positions, player positions, movement paths, notes — converting SVG
units to football units with Task 1's geometry. Do not retype 50 diagrams by
hand; the coordinates are already correct and hand-transcription will introduce
errors that visual review won't catch.

Keep the extractor in the scratchpad, not the repo. It runs once.

- [ ] **Step 2: Collapse the position cards**

The 30 position-card files are 6 scenes (`run`, `pass`, `punt`, `kickoff`,
`field-goal`, `goal-line`) rendered once per highlighted official. Confirm this
by diffing each set — expect ~18 differing lines out of ~173, title and halo
only. **If any pair differs by more than that, the extra difference is real
content and must be understood before collapsing**, not averaged away.

Then check the six crew-card scenes against them: `kicking-plays/kickoff-crew-of-5`
differs from `position-cards/*/kickoff` by 9 lines. Share the scene where they're
genuinely the same play; keep them separate where the crew card shows something
the position card doesn't.

- [ ] **Step 3: Write the scene modules**

`scenes/position-cards.js`, `scenes/kicking-plays.js`, `scenes/run-pass-plays.js`,
`scenes/between-downs.js`, `scenes/fouls-enforcement.js`. Each exports scenes
keyed by output path, with crew-of-4 expressed as a variation on crew-of-5 where
it truly is one — the crew-of-4 diagrams are mostly the 5 with the Back Judge
removed and a note added.

- [ ] **Step 4: Write the renderer script**

`bin/render-diagrams.js` walks the scene modules and writes each to
`static/images/<path>.svg`. Add `"diagrams": "node bin/render-diagrams.js"` to
`package.json`.

- [ ] **Step 5: Verify equivalence — the gate for this whole plan**

Regenerate over the committed files and inspect `git diff`. Expected differences:
float artifacts cleaned up, mark ordering normalised, stylesheet unified. **Any
change to a coordinate, once both sides are rounded to two decimals, is a bug in
the port.**

Then check it visually, because a diff can be small and still wrong: build a
scratch page showing all 50 before-and-after pairs side by side, generated from
`git stash`ed originals, and walk every one. This step cannot be skipped or
sampled — a silently moved official teaches the wrong mechanics to someone
standing on a field.

- [ ] **Step 6: Commit**

```bash
npm test
git add -A
git commit -m "Generate the fifty existing diagrams from scene data"
```

---

### Task 4: Guard against drift

Committed generated output rots the moment someone edits it directly. One test
prevents that.

**Files:**
- Create: `test/field/generated.test.js`
- Modify: `package.json` (wire into `npm test`)

- [ ] **Step 1: Write the drift test**

Render every scene in memory and compare to the committed file. On mismatch,
fail naming the file and the command to fix it: `npm run diagrams`. This runs in
CI on every push, so a hand-edited SVG fails the build rather than surviving
until the next regeneration silently reverts it.

- [ ] **Step 2: Assert nothing is orphaned**

Also fail if `static/images/` contains an SVG no scene produces (except
`vermont.svg`, which isn't a field diagram) — that catches a scene deleted
without its output, and an output added without a scene.

- [ ] **Step 3: Commit**

```bash
npm test
git commit -am "Fail the build when a committed diagram drifts from its scene"
```

---

### Task 5: The seven 7-man diagrams

> **Done, 2026-09-02.** Redrawn from Part 5 of the 2026–27 NFHS manual rather
> than from the 2022 deck's screenshots, as ten scenes in
> `lib/field/scenes/crew-of-seven.js` — the keys screenshot became four
> separate diagrams. The JPEGs are deleted. See
> `2026-09-02-nfhs-2026-manual-changelog.md`.

The actual raster-to-vector migration. Held until last because it's the only
task that creates new artwork, and it should be drawn with a renderer that has
already been proved against 50 known-good diagrams.

**Files:**
- Create: `lib/field/scenes/7-man-mechanics.js`
- Create: `static/images/7-man-mechanics/*.svg` (7 files)
- Modify: `content/information/7-man-mechanics.md`
- Delete: `static/images/7-man-mechanics/*.jpg` (7 files)

**Interfaces:**
- Consumes: Task 2's renderer, extended for 7-man positions.
- Produces: seven vector diagrams in the house style.

- [ ] **Step 1: VERIFICATION GATE — read the positions off the source, not the JPEG**

The JPEGs are screenshots of the 2022 deck, and
`static/uploads/7-man-mechanics-2022.pdf` is the deck itself. Take positions from
the PDF, which may hold vector artwork worth extracting directly. If it does,
extracting the real coordinates beats eyeballing a JPEG.

Where a position can't be read confidently from either, do not guess: the article's
existing `alt` text and body prose describe every diagram in detail and were
written from the deck. Where those still don't settle it, note it in
`docs/sources.md` rather than inventing a position.

- [ ] **Step 2: Extend the renderer for 7-man**

Seven officials instead of five: R, U, H, L, F, S, B. The article's "Who's who"
table gives both the single-letter and two-letter forms — the diagrams use single
letters, the keys diagrams use the longer forms, so `official()` takes whatever
the scene passes. Check the existing `mk` font size still fits a two-character
mark inside the 9.5-unit disc; the current files already do this for `LM`/`LJ`.

New view crops are likely: the free-kick diagram spans an end zone to beyond
midfield, deeper than any current view.

- [ ] **Step 3: Draw the six play diagrams**

`coin-toss`, `free-kicks`, `onside-kicks`, `punts`, `scrimmage-plays`,
`field-goals-and-trys`. Each in the monochrome house style — **not a recreation
of the green-and-yellow slide.** The originals use color as their only encoding
(yellow for K's free-kick line, orange for the press box); those become the
established shape encodings: dashed `rl` for restraining lines, the `pb` label
for the press box, `note` for the annotations.

The free-kick diagram needs K1–K5 either side of the kicker as `kp` players and
both free-kick lines — the fullest scene in the set, and the one that proves the
renderer covers the 7-man material.

- [ ] **Step 4: Draw the keys diagram**

`keys.jpg` is six formations in one image, which is a different shape from
everything else: six small fields, not one. Two options —

1. Six separate SVGs shown as a grid in the article. Better on a phone, better
   for `alt` text per formation, and needs no new renderer capability.
2. One SVG with six sub-fields, matching the current single-image layout.

**Recommend option 1.** The article's current `alt` text already enumerates all
six formations in one sentence because it had to; splitting them lets each carry
its own description, which is a genuine accessibility gain. It does mean editing
the article's figure markup rather than swapping a `src`.

- [ ] **Step 5: Proof monochrome**

Print all seven on a black-and-white laser at the size they appear on the card
stock. The originals were color slides; anything that relied on hue is now
carrying its meaning some other way, and this is where that gets checked.

- [ ] **Step 6: Swap the article over**

Update the seven `<img src>` paths from `.jpg` to `.svg` in
`content/information/7-man-mechanics.md`, restructure the keys figure per Step 4,
and delete the JPEGs. Keep every `alt` and `<figcaption>` — they're good, and
they're the accessible description whether the image is raster or vector.

Leave the PDF download link alone. It's the original artefact and stays.

- [ ] **Step 7: Commit**

```bash
npm run diagrams
npm test
git add -A
git commit -m "Redraw the 7-man mechanics diagrams as SVG"
```

---

### Task 6: Document it

**Files:**
- Create: `lib/field/README.md`
- Modify: `README.md`
- Modify: `docs/sources.md`

- [ ] **Step 1: Write `lib/field/README.md`**

How to add a diagram, how to change one, and `npm run diagrams`. State the
coordinate system explicitly — the table from this plan, including the NFHS hash
derivation — because that's the knowledge whose absence caused the original
generator's loss to hurt. Note the monochrome rule and where it comes from.

- [ ] **Step 2: Note it in the top-level README**

One line under Developing: diagrams are generated, don't hand-edit
`static/images/`, run `npm run diagrams`.

- [ ] **Step 3: Record the provenance**

In `docs/sources.md`: the 50 diagrams' positions came from the previously
committed SVGs (themselves built from the position and crew cards); the 7-man
positions came from `7-man-mechanics-2022.pdf`, with anything unresolved from
Task 5 Step 1 listed as open.

- [ ] **Step 4: Commit**

```bash
npm test
git commit -am "Document the field diagram renderer"
```

---

## Notes for whoever picks this up

- **Task 5 is the only task that can produce a wrong diagram.** Tasks 1–4 have
  50 known-good references to check against; the 7-man rebuild has a JPEG and a
  slide deck. Weight the review accordingly.

- **The renderer unblocks the field-reference-cards plan.** That plan's Task 4
  (crew mechanics for 4 and 5 officials) calls for formation diagrams showing
  every official at once, in the same visual language as the position cards.
  After this plan, that's a scene file rather than a hand-built SVG. Worth
  sequencing this plan first if both are live.

- **This does not fix the missing card HTML.** The ten cards' HTML sources are
  still absent from the repo — a separate finding, owned by the
  field-reference-cards plan's Task 1. When those sources are recovered, their
  inline SVG should come from this renderer too, which is the second consumer
  the API should be able to serve without changes.

- **Six scenes for thirty files is the headline.** If the port lands and the
  position cards still need thirty scene definitions, the collapse in Task 3
  Step 2 didn't happen and the duplication has simply moved from SVG into JS.
