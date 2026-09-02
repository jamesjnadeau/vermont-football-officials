# 2026–27 NFHS Manual Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the *2026 and 2027 NFHS Football Game Officials Manual* the single
source of truth for every mechanics claim on the site — the words, the tables and
the field diagrams — and say so in the provenance footer of each page it now
backs.

**Architecture:** Content-first. Almost all of the work is rewriting prose and
tables in `content/information/*.md` against a cited page of the manual, plus one
terminology rename that reaches code (`Linesman` → `Head Line Judge`, draw-tool
mark `LM` → `HL`). The diagrams are the exception: nine of the corrections move
officials on the field, and the 50 committed SVGs have no generator, so this plan
does not hand-edit them. It first finishes Tasks 2–4 of
`2026-08-27-field-diagrams-svg.md` — scenes in, SVGs out, drift test — and then
every diagram correction is a coordinate in a scene file.

**Tech Stack:** Node 24 ESM, Eleventy 3, `node --test`, gray-matter, html-validate,
linkinator, Playwright (card PDFs). No new dependencies.

**Spec:** `docs/superpowers/plans/2026-09-02-nfhs-2026-manual-audit.md` — the
finding-by-finding audit this plan implements. Findings are cited below as
"Finding N". Read it first; every task argues from it.

## Global Constraints

- **The manual is the authority, cited by section and print page.** Every claim
  this plan writes or rewrites carries its manual section (`§4.7`) and print page
  in the audit, and each edited page declares
  `source: the 2026 and 2027 NFHS Football Game Officials Manual` plus the
  sections it rests on. A claim with no manual backing either keeps its old
  source line or is dropped.
- **Manual conversion path:** `/home/user/nfhs-rules-converter/2026-nfhs-football-game-officials-manual/`
  (clone of `jamesjnadeau/nfhs-rules-converter`). Chapter files are
  `04-part-1-officiating-principles.md`, `06-part-3-crew-of-four.md`,
  `07-part-4-crew-of-five.md`, `08-part-5-crew-of-seven.md`. MechaniGrams are in
  `images/pNNN-figN.png` and are **copyright Referee Enterprises — never
  reproduce, trace or re-host them.** Read them to get positions right; draw our
  own.
- **"Head Line Judge", never "Linesman" or "Head Linesman".** Definition of
  Terms, p. 9. Abbreviation is **`HL`** — the letter the manual's own
  MechaniGrams use.
- **`verified:` front matter must be today's date** on every page this plan
  touches, and `test/content/frontmatter.test.js` fails any `verified` more than
  400 days old or in the future.
- **New article files must be added to the `want` array** in
  `test/content/frontmatter.test.js`, and new printable cards to the slug list in
  `test/cards/extract.test.js`.
- **Every article must be tagged only from `content/_data/topics.json`**, and
  `.pages.yml`'s tags dropdown must offer exactly those names — a test compares
  them.
- **Printable cards are hard-gated at two pages** (`test/cards/output.test.js`).
  Adding a paragraph to a card page can push the PDF to three and fail the build.
  Cut something when you add something.
- **Vermont crews work four and five.** Crew-of-seven material is corrected for
  accuracy, not expanded.
- **Full gate before every commit:** `npm test` (build, field, draw, cards,
  content, editing, output, html-validate, linkinator).

---

## File Structure

**Modified — content**

| File | Responsibility after this plan |
| --- | --- |
| `content/information/head-line-judge-position-card.md` | *(renamed from `linesman-position-card.md`)* The HL's card: chain-side duties, punt hold-the-line release, penalty walk-off |
| `content/information/line-judge-position-card.md` | The LJ's card: enforcement-spot hold, crew-of-4 deep-kick and scoring-kick duties, game-clock backup |
| `content/information/referee-position-card.md` | Passing-arm-side positioning, free-kick four-on-each-side check, scoring-kick relay |
| `content/information/umpire-position-card.md` | Manual's depth ranges, free-kick sideline, two down indicators |
| `content/information/back-judge-position-card.md` | Punt depth, free-kick sideline, play clock, crossbar ruling |
| `content/information/kicking-plays-crew-card.md` | All four kicking phases, crews of 5 and 4, from §3.7/§3.8 and §4.7/§4.8 |
| `content/information/run-pass-plays-crew-card.md` | Scrimmage-play positions and keys from §3.3/§3.7 and §4.3/§4.7 |
| `content/information/between-downs-crew-card.md` | Forward progress from the Points of Emphasis; whistle mechanics from §1.4 |
| `content/information/fouls-enforcement-crew-card.md` | §1.3 + Penalty Communication POE: notification, reporting, the two wings' different jobs |
| `content/information/clock-timing-crew-card.md` | §1.6 play clock vs game clock, reset-to-25 rule, first-down-inbounds procedure |
| `content/information/clock-officials-cheat-sheet.md` | Same, for the timer at the table |
| `content/information/official-signals.md` | §2.2 signalling sequences reconciled; S17's two-handed variant |
| `content/information/all-signals-listed-and-diagrammed.md` | Chart captions reconciled with §2 (pp. 38–45) |
| `content/information/7-man-mechanics.md` | Corrected against Part 5; provenance made honest |
| `content/information/penalty-enforcement-guide.md` | Terminology; §1.3 crew roles |
| `content/information/your-first-season.md` | Link and name updates |

**Created — content**

| File | Responsibility |
| --- | --- |
| `content/information/pregame-conference.md` | The manual's pregame chapter (pp. 12–16) as a crew card |
| `content/information/line-to-gain-crew-card.md` | §1.6 chain-crew instructions — a card for the home site's chain crew |
| `content/information/crew-communication-signals.md` | §2.1 crew and supplementary signals + §1.10 non-verbal communication + §1.11 "when in question" |
| `content/information/linesman-position-card.md` | Two-line redirect stub preserving the old URL |

**Modified — code**

| File | Change |
| --- | --- |
| `lib/draw/state.js` | `{ mark: 'LM', name: 'Linesman' }` → `{ mark: 'HL', name: 'Head Line Judge' }`; accept `LM` as a legacy alias when decoding |
| `lib/draw/presets.js` | `mark: 'LM'` → `mark: 'HL'` (5 sites); corrected preset coordinates |
| `test/draw/state.test.js`, `test/draw/codec.test.js`, `test/draw/presets.test.js` | Mark updated; one new test for the legacy alias |
| `test/content/frontmatter.test.js` | `want` array: rename + three new files |
| `test/cards/extract.test.js` | Card slug list: rename + new cards |
| `docs/draw/README.md`, `lib/field/README.md` | Terminology |
| `docs/sources.md` | Register the manual as a primary source; retire the OHSAA/VFOA rows |

**Modified — diagrams** (all via the generator built in Task 1, never by hand)

`static/images/position-cards/head-line-judge/*` (renamed),
`static/images/position-cards/{referee,umpire,line-judge,back-judge}/*`,
`static/images/kicking-plays/*`, `static/images/run-pass-plays/*`.

---

## Phase order

1. **Task 1** unblocks every diagram change. Do it first or the diagram tasks
   degrade into hand-editing SVG.
2. **Task 2** (terminology) touches every other file. Do it before the content
   rewrites so they are written in the new vocabulary once.
3. **Tasks 3–8** are the content corrections, ordered by how wrong the page is.
4. **Tasks 9–11** are the new pages.
5. **Task 12** is the sweep: provenance, sources register, changelog.

---

### Task 1: Make the diagrams generated, not hand-written

**Files:**
- Execute: `docs/superpowers/plans/2026-08-27-field-diagrams-svg.md`, Tasks 2, 3
  and 4 exactly as written there (Task 2's `markers.js` already exists; the
  remaining Task 2 work is `lib/field/render.js`)
- Create: `lib/field/render.js`, `lib/field/scenes/*.js`, `tools/diagrams.js`
- Modify: `package.json` (`"diagrams": "node tools/diagrams.js"`)
- Test: `test/field/render.test.js`, `test/field/drift.test.js`

**Interfaces:**
- Consumes: `lib/field/{geometry,style,field,markers,views,escape}.js`, already built.
- Produces: `renderScene(scene) -> string` (a complete SVG document), a scene
  module per diagram exporting `{ file, title, view, officials, players, arrows, notes }`,
  and `npm run diagrams` writing every scene into `static/images/`.

- [ ] **Step 1: Read the plan you are executing**

```bash
sed -n '208,365p' docs/superpowers/plans/2026-08-27-field-diagrams-svg.md
```

Follow its Tasks 2, 3 and 4 to the letter, including **Task 3 Step 5, the
byte-for-byte equivalence gate**: the generator must reproduce all 50 committed
SVGs exactly before any of them is allowed to change. That gate is what makes
the rest of this plan safe.

- [ ] **Step 2: Run the equivalence gate**

Run: `npm run diagrams && git diff --stat static/images/`
Expected: **no output.** A single changed byte means the generator is not yet
equivalent and Task 3 of that plan is not finished. Do not proceed.

- [ ] **Step 3: Run the drift test**

Run: `node --test "test/field/*.test.js"`
Expected: PASS, including a `drift` test that regenerates into memory and
compares against the committed files.

- [ ] **Step 4: Commit**

```bash
git add lib/field tools/diagrams.js package.json test/field
git commit -m "Generate the field diagrams from scenes instead of hand-written SVG"
```

---

### Task 2: "Linesman" becomes "Head Line Judge"

Implements **Finding 0**. Definition of Terms, p. 9: "The Head Linesman position
is now referred to as Head Line Judge." Mark is `HL`, from the manual's own
MechaniGrams.

**Files:**
- Rename: `content/information/linesman-position-card.md` → `head-line-judge-position-card.md`
- Create: `content/information/linesman-position-card.md` (redirect stub)
- Rename: `static/images/position-cards/linesman/` → `static/images/position-cards/head-line-judge/`
- Rename: `lib/field/scenes/` position-card scene ids from `linesman` to `head-line-judge`
- Modify: `lib/draw/state.js:55`, `lib/draw/presets.js` (5 sites), `docs/draw/README.md:135`, `lib/field/README.md`
- Modify: every `content/information/*.md` containing "Linesman" or "linesman"
- Test: `test/draw/state.test.js:243,287`, `test/draw/codec.test.js:64`,
  `test/content/frontmatter.test.js:51`, `test/cards/extract.test.js:32`

- [ ] **Step 1: Write the failing test for the legacy share link**

An existing `/draw` share link encodes the mark as `"LM"`. Renaming the mark must
not turn those links into an error. Add to `test/draw/codec.test.js`:

```js
test('a link written before the Head Line Judge rename still decodes', () => {
  // Wire format v1 as emitted before 2026-09: the wing opposite the press box
  // was marked "LM". The mark is now "HL"; the old payload must still land on
  // the board rather than being dropped as an unknown official.
  const legacy = encodeURIComponent(
    JSON.stringify({ v: 1, w: 'runPass', t: [['o', 'LM', -30.7, 12.5]] }),
  );
  const board = decodeBoard(toPayload(legacy));
  assert.equal(board.tokens.length, 1);
  assert.equal(board.tokens[0].mark, 'HL');
});
```

Use whatever `decodeBoard`/payload helpers the neighbouring tests in that file
already use; do not invent a second decoding path.

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test test/draw/codec.test.js`
Expected: FAIL — the token is dropped, `board.tokens.length` is `0`.

- [ ] **Step 3: Rename the mark and add the alias**

In `lib/draw/state.js`, change the crew list and teach `addToken` the one legacy
spelling. Keep the allowlist as the only place a mark is validated:

```js
export const OFFICIALS = [
  { mark: 'R', name: 'Referee' },
  { mark: 'U', name: 'Umpire' },
  { mark: 'HL', name: 'Head Line Judge' },
  { mark: 'LJ', name: 'Line Judge' },
  { mark: 'BJ', name: 'Back Judge' },
];

// The 2026 NFHS manual renamed the Head Linesman to Head Line Judge (Definition
// of Terms, p. 9) and letters him HL. Share links written before that carry the
// old mark, and a link an official already texted to a crewmate has to keep
// working, so the old spelling is translated on the way in rather than kept in
// the allowlist above — which is what a diagram or a palette button would read.
const LEGACY_MARKS = { LM: 'HL' };
```

Apply `LEGACY_MARKS` where `addToken` first sees `mark`, before the allowlist
check.

- [ ] **Step 4: Run the draw tests**

Run: `node --test "test/draw/*.test.js"`
Expected: PASS. Update the three literal `'LM'`s in `state.test.js` and
`presets.test.js` to `'HL'`; the new codec test keeps `'LM'` deliberately.

- [ ] **Step 5: Rename the article, its images and its scenes**

```bash
git mv content/information/linesman-position-card.md content/information/head-line-judge-position-card.md
git mv static/images/position-cards/linesman static/images/position-cards/head-line-judge
```

Then in the renamed article set `title: Head Line Judge Position Card`, repoint
the six `<img src>` paths and the card download link, and rewrite the body's
"Linesman" references. Rename the corresponding scene ids in `lib/field/scenes/`
and regenerate (`npm run diagrams`).

- [ ] **Step 6: Keep the old URL alive**

`linkinator` follows internal links and the old URL is in the wild. Create
`content/information/linesman-position-card.md`:

```markdown
---
title: Linesman Position Card
date: 2026-09-02
permalink: /information/linesman-position-card/
eleventyExcludeFromCollections: true
layout: layouts/main.pug
---

The 2026 NFHS Game Officials Manual renamed this position: the Head Linesman is
now the **Head Line Judge**. This page moved with it.

[Head Line Judge Position Card](/information/head-line-judge-position-card/)
```

`eleventyExcludeFromCollections` keeps it out of the article list, the topic
pages and the card build; because it is excluded it needs no `tags`, and
`test/content/frontmatter.test.js` must be taught to skip it.

- [ ] **Step 7: Sweep the remaining prose**

```bash
grep -rn "Linesman\|linesman" content/ lib/ docs/ test/ --include=*.md --include=*.js --include=*.pug
```

Every hit outside the redirect stub and this plan becomes "Head Line Judge".
Watch the eight body references listed in the audit, `penalty-enforcement-guide.md`
(4), `official-signals.md:161`, `clock-timing-crew-card.md:82,186`,
`your-first-season.md:48`, and the `LM /` table headers in five crew cards
(`| **LM / LJ** |` → `| **HL / LJ** |`).

- [ ] **Step 8: Update the two test manifests**

`test/content/frontmatter.test.js` `want` array: replace
`'linesman-position-card.md'` with `'head-line-judge-position-card.md'` *and*
keep `'linesman-position-card.md'` (the stub still exists as a file), exempting
the stub from the tags and date assertions. `test/cards/extract.test.js`: replace
`'linesman-position-card'` with `'head-line-judge-position-card'` in the sorted
slug list.

- [ ] **Step 9: Full gate**

Run: `npm test`
Expected: PASS. `linkinator` proves the redirect stub resolves and no link still
points at a dead image path.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Rename Linesman to Head Line Judge per the 2026 NFHS manual"
```

---

### Task 3: Free kicks and onside kicks

Implements **Findings 1 and 2**. Sources: §4.7 pp. 136–138 and §4.8 pp. 142–145
(crew of five); §3.7 pp. 67–68 and §3.8 p. 75 (crew of four); Points of
Emphasis p. 8 (free-kick coverage).

**Files:**
- Modify: `content/information/kicking-plays-crew-card.md:60-130` (Kickoff and
  Onside sections)
- Modify: `content/information/referee-position-card.md`,
  `umpire-position-card.md`, `back-judge-position-card.md`,
  `line-judge-position-card.md`, `head-line-judge-position-card.md` — the
  "Kicks" section of each
- Modify: `lib/field/scenes/` — `kickoff-crew-of-5`, `kickoff-crew-of-4`,
  `onside-crew-of-5`, `onside-crew-of-4`, and the five `kickoff` position-card
  scenes

**Interfaces:**
- Consumes: `renderScene` and the scene shape from Task 1.
- Produces: nothing other tasks read.

- [ ] **Step 1: Read the manual, not the audit**

```bash
cd /home/user/nfhs-rules-converter/2026-nfhs-football-game-officials-manual
sed -n '307,340p' 07-part-4-crew-of-five.md   # crew of 5, free kick + onside
sed -n '205,230p' 06-part-3-crew-of-four.md   # crew of 4, free kick + onside
sed -n '385,435p' 07-part-4-crew-of-five.md   # crew of 5 coverage
```

Open `images/p137-fig1.png` and `images/p138-fig1.png` and read the letters off
them. They settle which sideline each official is on; the prose says "opposite
the chains", the picture says which side that is.

- [ ] **Step 2: Correct the crew-of-five kickoff table**

`kicking-plays-crew-card.md`, the Kickoff "Positions" table becomes:

```markdown
| | Crew of 5 | Crew of 4 |
| --- | --- | --- |
| **R** | R's goal line, middle of the field. Check Team K has at least four players on each side of the kicker. | Top of the numbers at R's 5 or 10, Line Judge's side. Same four-on-each-side check. |
| **U** | R's free-kick line (the 50), outside the sideline, press box side — opposite the chains. | Sideline at R's 20. |
| **HL** | R's goal line extended, own sideline. | K's free-kick line. Moves toward the middle once the players are on. Gives the kicker the ball only at 11 on the field. |
| **LJ** | R's goal line extended, own sideline, same yard line as the HL. | R's free-kick line, coming to the top of the numbers. |
| **BJ** | K's free-kick line, outside the sideline, HL's side. Checks the tee, holds the ball until K has 11, notes nobody but the kicker more than 5 yards off K's line. | — |
```

Add beneath it: "Both wings must be on the **same yard line**, and deeper than
the deepest receiver if they move up (§4.7, p. 136)."

- [ ] **Step 3: Correct the crew-of-five onside table**

```markdown
| | Crew of 5 | Crew of 4 |
| --- | --- | --- |
| **R** | Middle of the field, deeper than the deepest receiver. | About R's 10. |
| **U** | R's free-kick line, Line Judge's side. Beanbag in hand. | R's free-kick line. Beanbag in hand. |
| **HL** | R's free-kick line, own sideline. Beanbag in hand. | Regular free-kick position. Beanbag in hand. |
| **LJ** | K's free-kick line, own sideline. Beanbag in hand. | Regular free-kick position. Beanbag in hand. |
| **BJ** | K's free-kick line, HL's side. | — |
```

And the shared rule, which the site does not currently carry at all: "Everyone
with a bag marks Team K first touching with it. Anyone may kill the ball if a
**prone** player from either team recovers, whether or not the kick has gone 10
yards (§4.7, p. 138)."

- [ ] **Step 4: Replace the free-kick keying paragraph**

The 2026 Point of Emphasis (p. 8) is a new scheme and belongs on the card:

```markdown
The widest **two** players on each side of the kicking formation belong to the
deepest official on that sideline, who stays put until the kick is possessed.
Everyone else on Team K belongs to the two officials on the restraining lines,
each taking the players on his own side. The official on **Team K's** restraining
line also has action against the kicker. When in doubt on a kick possessed inside
the 5, rule touchback.
```

- [ ] **Step 5: Correct the five position cards' Kicks sections**

Each card's "Your spot" table and "What you do" bullets take that official's row
from Steps 2 and 3, in that official's voice. Specifically:

- Referee: kickoff spot unchanged; **add** the four-players-each-side check and
  drop nothing.
- Umpire: `| **Kickoff** | R's free-kick line (the 50), 2 yds out of bounds, press box side. |` and `| **Onside** | R's free-kick line, Line Judge's side. Bag in hand. |`
- Back judge: `| **Kickoff** | K's free-kick line, 2 yds out of bounds, opposite the press box. |` and `| **Onside** | K's free-kick line, HL's side. |`
- Line judge: `| **Onside** | K's free-kick line, your sideline. Bag in hand. |`
- Head line judge: `| **Onside** | R's free-kick line, your sideline. Bag in hand. |`

Also name the team on the safety-kick rows: umpire and HL at **Team K's** 30,
back judge at **Team K's** 20 (§4.8, p. 145).

- [ ] **Step 6: Move the officials in the scenes**

Edit the coordinates in the four kicking-plays scenes and the five position-card
kickoff scenes, then regenerate:

Run: `npm run diagrams && git diff --stat static/images/`
Expected: the nine kickoff/onside SVGs changed, nothing else.

- [ ] **Step 7: Rewrite every `alt` that describes a changed diagram**

An `alt` that still says "Umpire at K's 40 opposite the press box" is now a lie
told to exactly the readers who cannot check it. Every `alt` for a regenerated
diagram is rewritten to describe what the new picture shows.

- [ ] **Step 8: Full gate**

Run: `npm test`
Expected: PASS, including the two-page card gate for `kicking-plays-crew-card`
and the five position cards.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Correct free-kick and onside-kick alignments from the 2026 NFHS manual"
```

---

### Task 4: Scrimmage kicks

Implements **Findings 3, 3b and 3c** — including the reversed wing release,
which is the correction most likely to change what a crew actually does.

**Files:**
- Modify: `content/information/kicking-plays-crew-card.md` (Punt section)
- Modify: all five position cards (Kicks section, punt rows)
- Modify: `lib/field/scenes/` — `punt-crew-of-5`, `punt-crew-of-4`, five
  `punt` position-card scenes

- [ ] **Step 1: Read the manual**

```bash
cd /home/user/nfhs-rules-converter/2026-nfhs-football-game-officials-manual
sed -n '355,368p' 07-part-4-crew-of-five.md   # crew of 5 positions
sed -n '459,466p' 07-part-4-crew-of-five.md   # crew of 5 coverage
sed -n '267,280p' 06-part-3-crew-of-four.md   # crew of 4 positions
sed -n '337,346p' 06-part-3-crew-of-four.md   # crew of 4 coverage
```

- [ ] **Step 2: Correct the punt positions table**

```markdown
| | Crew of 5 | Crew of 4 |
| --- | --- | --- |
| **R** | 3–5 yds outside the tight end, 2–3 yds behind the kicker, **kicking-leg side**. | Same, on the Line Judge's side. |
| **U** | 4–7 yds deep, favouring the Line Judge's sideline — he releases at the snap and you cover for it. | 10 yds deep, favouring the Line Judge's sideline. |
| **HL** | Straddling the line on your sideline, as on any scrimmage down. **Stay on the line until the kick crosses the neutral zone** — you rule whether it crossed. | Straddling the line, more than 9 yds outside the widest A player. Same hold. |
| **LJ** | Straddling the line on your sideline. **Release at the snap** and work the space between the neutral zone and the receivers. | 7–10 yds wider than and in front of the deepest receiver. |
| **BJ** | 10–12 yds wider than and 2–3 yds behind the deepest receiver, on the HL's side. | — |
```

- [ ] **Step 3: Rewrite the crew-of-four deep coverage**

The card currently gives the umpire the deep job. Replace with §3.8, p. 78:

```markdown
**Crew of 4: the deep official is the Line Judge, not the Umpire.** All deep
receivers are his. He covers kicks down the middle and into his side zone, gets
to Team R's goal line to rule momentum and touchback, and holds his sideline from
the line of scrimmage to R's end line. The Umpire moves to the line at the snap,
pivots to the Line Judge's side once both teams have run past, and drifts slowly
downfield; on a return up the middle the Line Judge gives the runner up to him.
```

Then fix the referee card's "When you work a crew of 4" item 4, which currently
says the umpire goes deep.

- [ ] **Step 4: Correct the wing rows on the two wing cards**

Head line judge card: `| **Punt** | Your sideline at the line. Hold the line until the kick crosses the neutral zone — you have whether it crossed. |`
Line judge card: `| **Punt** | Your sideline at the line, releasing at the snap. |`

- [ ] **Step 5: Correct the back judge's punt row**

`| **Punt** | 10–12 wide of and 2–3 behind the deepest receiver, on the Head Line Judge's side. Move up on a short kick, back if the receiver retreats. |`

Keep the PSK beanbag line — §4.8, p. 149 requires it ("The covering game
official, regardless of position, must beanbag the spot where the kick ends").

- [ ] **Step 6: Move the officials in the scenes and regenerate**

Run: `npm run diagrams && git diff --stat static/images/`
Expected: seven punt SVGs changed.

- [ ] **Step 7: Rewrite the punt `alt` text on every changed figure**

- [ ] **Step 8: Full gate and commit**

Run: `npm test`

```bash
git add -A
git commit -m "Correct scrimmage-kick mechanics from the 2026 NFHS manual"
```

---

### Task 5: Scoring kicks

Implements **Finding 4**. §4.7 p. 141 and §4.8 p. 150 (crew of five); §3.7
pp. 73–74 (crew of four, both the outside-the-15 and inside-the-15 cases).

**Files:**
- Modify: `content/information/kicking-plays-crew-card.md` (Field goal and try)
- Modify: all five position cards (Goal line and place kicks section)
- Modify: `lib/field/scenes/` — `field-goal-crew-of-5`, `field-goal-crew-of-4`,
  five `field-goal` position-card scenes

- [ ] **Step 1: Read the manual**

```bash
cd /home/user/nfhs-rules-converter/2026-nfhs-football-game-officials-manual
sed -n '369,384p' 07-part-4-crew-of-five.md
sed -n '281,312p' 06-part-3-crew-of-four.md
sed -n '467,476p' 07-part-4-crew-of-five.md
sed -n '347,356p' 06-part-3-crew-of-four.md
```

Note that the crew of four has **two** alignments, split at Team R's 15-yard
line. The site has one. This task adds the second.

- [ ] **Step 2: Replace the field goal and try positions table**

```markdown
### Crew of 5

| | |
| --- | --- |
| **R** | 2–3 yds to the rear and 3–5 yds to the side of the kicker, facing the holder. |
| **U** | Beyond the end line, behind your upright. You rule inside or outside **your** upright. |
| **HL / LJ** | Straddling the line of scrimmage. You rule whether the kick crossed the neutral zone. |
| **BJ** | Beyond the end line, behind your upright. You rule your upright **and the crossbar** — and you sound the whistle and give the signal. |

### Crew of 4 — snapped outside Team R's 15

| | |
| --- | --- |
| **R** | About 1 yd behind and 2–3 yds to the side of the kicker, facing the holder. Rules roughing the holder and kicker; echoes good / no good to the press box. |
| **U** | 10 yds off the line, favouring the Line Judge's side. Checks the line's numbers; moves to the line at the snap. |
| **HL** | Straddling the line, not closer than 9 yds outside the widest A player. Also rules roughing the holder and kicker. |
| **LJ** | 5 yds behind and directly between the uprights. **Sole judge of good or no good.** |

### Crew of 4 — snapped on or inside Team R's 15

| | |
| --- | --- |
| **R** | Same spot, and **he** rules whether the ball went through the uprights. |
| **U** | Unchanged. |
| **HL** | Unchanged. |
| **LJ** | On the line of scrimmage, 5–7 yds outside the offensive end; moves hard to the end line at the snap and rules the **crossbar**. Thumbs-up to the Referee if it clears; signals no good himself if it doesn't, then touchback. |
```

- [ ] **Step 3: Fix who signals**

Referee card, "What you do": replace "You do not signal a touchdown or a
successful try to the press box" with the manual's mechanic:

```markdown
- Stay with the kicker and holder until neither is threatened. Then look to your
  deep officials for the result and **relay their signal to the press box** —
  that relay is yours (§4.8, p. 150). What you never do is mirror a touchdown a
  wing has already signalled.
```

Umpire card: `| **Never** | You do not signal a touchdown. Ever. |` stays — it is
correct. But `| **Good** | Both of you signal… |` becomes
`| **Good** | The Back Judge sounds the whistle and signals. You confirm your upright to him. |`

- [ ] **Step 4: Correct the wings' spot**

Both wing cards: `| **FG / try** | Straddling the line of scrimmage. |` — not "on
the field numbers".

- [ ] **Step 5: Add the field-goal-by-free-kick note**

§4.7, p. 141: "On a field-goal attempt by free kick, the chains are set to
establish the 10-yard neutral zone. Referee is behind the upright. Umpire is
behind the upright and rules on crossbar. Both game officials determine whether
kick is successful. All other game officials' mechanics are the same as for a
kickoff." Add as a note under the crew-of-5 table.

- [ ] **Step 6: Regenerate the seven field-goal scenes, rewrite `alt`, gate, commit**

Run: `npm run diagrams && npm test`

```bash
git add -A
git commit -m "Correct scoring-kick mechanics from the 2026 NFHS manual"
```

---

### Task 6: Scrimmage plays — positions and keys

Implements **Finding 5**, plus the keys MechaniGrams from §3.3 and §4.3.

**Files:**
- Modify: `content/information/run-pass-plays-crew-card.md`
- Modify: `content/information/referee-position-card.md` (Run and pass),
  `umpire-position-card.md`, `back-judge-position-card.md`, both wing cards
- Modify: `lib/field/scenes/` — `every-down`, `running`, `passing`, `goal-line`
  (×2 crew sizes) and the `run`/`pass`/`goal-line` position-card scenes

- [ ] **Step 1: Read the manual**

```bash
cd /home/user/nfhs-rules-converter/2026-nfhs-football-game-officials-manual
sed -n '341,354p' 07-part-4-crew-of-five.md   # crew of 5 scrimmage positions
sed -n '227,238p' 06-part-3-crew-of-four.md   # crew of 4 scrimmage positions
sed -n '441,454p' 07-part-4-crew-of-five.md   # crew of 5 scrimmage coverage
sed -n '45,68p'   06-part-3-crew-of-four.md   # crew of 4 keys
sed -n '45,178p'  07-part-4-crew-of-five.md   # crew of 5 keys, all 11 MechaniGrams
```

- [ ] **Step 2: Correct the referee's spot**

```markdown
| | |
| --- | --- |
| **In the huddle** | 10–15 back, 5 wide of the huddle, where the clock operator can see you. |
| **A at the line** | **Passing-arm side** of the quarterback, 10–12 deep, at least as wide as the tight end. |
| **Pass** | Same. Wide and deep enough that a pocket drop doesn't move you; **10-yard buffer** if he rolls. |
| **Backed up** | 8 wide of the QB at 45° on the end line. From the –10 to the –15, 10 wide on the goal line. |
| **Hurry-up** | Don't move in as far. Tell the centre and QB to wait for your whistle. |
```

And in "Before the snap", add the reason the side is knowable: "Ask the head
coach in the pregame whether the quarterback is right- or left-handed, and
whether the punter and place kicker are right- or left-footed. Your position
depends on all three (§1.5, p. 23)."

- [ ] **Step 3: Correct the umpire and back judge depths**

Umpire: `| **Run / pass** | 5–7 off Team B's line in a crew of 5, 5–10 in a crew of 4, between the defensive ends. You must see the ball from the snapper's first touch until the snap. |`

Back judge: `| **Run / pass** | Favouring the **strong side**, 20–25 yds beyond the line and deeper than the deepest defender. |`

- [ ] **Step 4: Correct the wings' spot**

The manual puts wings **on the sideline** straddling the line of scrimmage
("Working on the sideline is strongly encouraged", §3.7, p. 69) — not "10 yards
outside the widest A player". Change the wing rows in
`run-pass-plays-crew-card.md:72` and both wing cards, and keep the existing
"never inside the numbers" only where the manual supports it (that is: off the
sideline once the play develops, §4.8, p. 147).

- [ ] **Step 5: Rewrite the keys section from the MechaniGrams**

Crew of four (§3.3, p. 56) is one sentence and the site should say it plainly:
"The wing officials key the eligible receivers on their side. With more than one,
the **primary key is the receiver on the end of the line** — the tight end or
split end; flankers, slot backs and motion men are secondary." Referee keys the
opposite-side tackle; umpire keys the centre and both guards.

Crew of five (§4.3) is eleven formations. Put the four that a Vermont crew
actually sees on the card — balanced with strength to the Line Judge, double
tight ends, trips, and motion changing strength — each as a two-line "who keys
what", and cite the rest.

The motion rule is worth its own callout because it is stated four times in the
manual: "Legality of motion is always the responsibility of the game official
**away from whom** the player is moving, even if he reverses direction."

- [ ] **Step 6: Regenerate the scrimmage scenes, rewrite `alt`, gate, commit**

Run: `npm run diagrams && npm test`

```bash
git add -A
git commit -m "Correct scrimmage-play positions and keys from the 2026 NFHS manual"
```

---

### Task 7: Fouls, flags and penalty administration

Implements **Finding 6**. §1.3 pp. 20–22, Points of Emphasis p. 5, §2.2
pp. 48–51.

**Files:**
- Modify: `content/information/fouls-enforcement-crew-card.md`
- Modify: `content/information/penalty-enforcement-guide.md:346,366,372,407`
- Modify: `content/information/official-signals.md:161` and its §3
- Modify: `content/information/head-line-judge-position-card.md`,
  `line-judge-position-card.md`

- [ ] **Step 1: Split the two wings' walk-off jobs**

`fouls-enforcement-crew-card.md`, replace the `| **HL / LJ** | Both walk it off…`
row with two rows:

```markdown
| **HL** | Walk the yardage off on your sideline while the Umpire walks it off in the field. Tell the head coach the number and the foul in plain words — never guess a number. |
| **LJ** | **Hold the enforcement spot** until you are certain the enforcement was done correctly. Don't leave it to walk with anybody. |
```

Make the same split in `linesman`→`head-line-judge-position-card.md:223` and add
the matching row to `line-judge-position-card.md`.

- [ ] **Step 2: Add the notification chain**

```markdown
The official who threw it tells **two** people before anything else happens: the
Referee, and the Head Line Judge — so the chains and the down box freeze. Three
short blasts after the ball is dead if you can't reach them any other way. A
dead-ball foul before the snap: jog toward the middle of the field to report it,
still watching the players you just flagged for the retaliation that is coming.
```

- [ ] **Step 3: Add the multiple-flag rule and the naming rule**

"Two flags on one snap: the officials who threw them get together and agree
before **any** signal goes to the press box. Never signal a foul from the wing —
your crewmate may have a different one on the same play." And: "Identify teams as
offence and defence, not by jersey colour."

- [ ] **Step 4: Reconcile the signalling sequences with §2.2**

`official-signals.md` §3 says the dead-ball sequence is five steps. The manual
says "a four- or five-step process" — the declination case has no down signal.
Correct the wording and add the declination example (PlayPic F): dead-ball foul,
the foul, the offending team, the declination, then ready-for-play.

- [ ] **Step 5: Add flag technique and the microphone**

Two short subsections from §1.3, pp. 21–22: throw to a spot for a spot foul and
into the air for dead-ball fouls; relocate a bad flag at once; never slam-dunk,
wave or throw it at a player. Microphone: preliminary without it, final with it,
referee owns the switch, short phrases, turn it off.

- [ ] **Step 6: Gate and commit**

Run: `npm test`

```bash
git add -A
git commit -m "Correct penalty administration from the 2026 NFHS manual"
```

---

### Task 8: The clock

Implements **Finding 7**. §1.6 pp. 26–28.

**Files:**
- Modify: `content/information/clock-timing-crew-card.md`
- Modify: `content/information/clock-officials-cheat-sheet.md`
- Modify: `content/information/all-signals-listed-and-diagrammed.md` (S17)
- Modify: `content/information/back-judge-position-card.md`,
  `referee-position-card.md` (play clock rows)

- [ ] **Step 1: Separate the two clocks and their two contacts**

The **game** clock operator's contact is the Line Judge — that part is right, and
the manual backs it ("As a backup, an onfield game official should time the game.
Those duties fall to the line judge in a crew of four or five", §1.6, p. 26). The
**play** clock operator's contact is the **Back Judge in a crew of five, the
Referee in a crew of four** (§1.6, p. 27). Say both, clearly labelled, on both
clock pages.

- [ ] **Step 2: Add the reset rule**

```markdown
**An interrupted play clock is never resumed — it is reset to 25.** Malfunction,
official's time-out, appreciable delay with the clock down to 20: all 25. When
the play clock is interrupted the game clock stops too, and restarts on the snap
or on the ready if it had been running. When in doubt, reset.
```

- [ ] **Step 3: Add the first-down-inbounds procedure**

```markdown
First down gained inbounds: the game clock stops for the new series, but the
40-second play clock starts when the ball is dead. The ball cannot be snapped
until the game clock restarts, so **the Umpire stands over the ball** until the
Referee winds it and the Umpire has seen it start. No response from the operator:
the Referee may whistle — that does not reset the play clock. Still nothing: he
signals time-out and resets to 25.
```

- [ ] **Step 4: Correct S17 in the signals list**

`all-signals-listed-and-diagrammed.md`, S17 caption and `alt`: "Right arm
extended upward, palm up, pumping three times — 'pushing the sky'. **Reset to
25.** Both hands for 40." The current entry mentions neither the motion nor the
two-handed variant.

- [ ] **Step 5: Add the play-clock-off rule and the horn**

"The play clock is turned off once the ready-for-play is whistled with less than
25 (or 40) seconds left in the quarter and the game clock is running, so the
quarterback isn't reading the wrong number. The play clock **is** used in
overtime. The scoreboard's auto horn stays off — it must never sound during a
live play."

- [ ] **Step 6: Gate and commit**

Run: `npm test`

```bash
git add -A
git commit -m "Correct clock mechanics from the 2026 NFHS manual"
```

---

### Task 9: New page — Pregame Conference

Implements **Finding 8.1**. Manual pp. 12–16, plus §1.5 pp. 23–24 (on the field
before the game).

**Files:**
- Create: `content/information/pregame-conference.md`
- Modify: `test/content/frontmatter.test.js` (`want` array),
  `test/cards/extract.test.js` (slug list)

- [ ] **Step 1: Read the chapter whole**

```bash
cat /home/user/nfhs-rules-converter/2026-nfhs-football-game-officials-manual/03-pregame-conference.md
sed -n '103,110p' /home/user/nfhs-rules-converter/2026-nfhs-football-game-officials-manual/04-part-1-officiating-principles.md
```

- [ ] **Step 2: Write the article**

Front matter:

```yaml
---
title: Pregame Conference
date: 2026-09-02
ruleYear: 2026
source: the 2026 and 2027 NFHS Football Game Officials Manual, Pregame Conference (pp. 12–16) and §1.5 On the Field Before the Game (pp. 23–24)
verified: 2026-09-02
tags:
  - Mechanics
  - Crew Cards
  - Printable
---
```

Structure it as a crew card the white hat can work down: the crew's own
conference topics from pp. 12–16, then the head coaches' meeting checklist from
§1.5 — the five things the coach must do (verify legal equipment, acknowledge
sportsmanship, identify protective guards and casts, name the time-out
representative, name the penalty-decision representative), plus the get-back
coach, the quarterback's throwing hand, the kickers' feet, unique formations and
trick plays, the trainer's location, the lightning detector, and who walks which
sideline and end line.

- [ ] **Step 3: Add it to the two manifests and the card build**

`want` array and card slug list, alphabetically placed.

- [ ] **Step 4: Prove it fits on two pages**

Run: `CARDS=1 npm run build && node --test test/cards/output.test.js`
Expected: PASS. A three-page result means cut, not extend.

- [ ] **Step 5: Full gate and commit**

Run: `npm test`

```bash
git add -A
git commit -m "Add the Pregame Conference card from the 2026 NFHS manual"
```

---

### Task 10: New page — Line-to-Gain Crew Card

Implements **Finding 8.2**. §1.6, p. 25, plus §1.6 p. 28 (ball helpers) and
§4.6 pp. 130–135 (what the chain crew does during a measurement).

**Files:**
- Create: `content/information/line-to-gain-crew-card.md`
- Modify: `test/content/frontmatter.test.js`, `test/cards/extract.test.js`

- [ ] **Step 1: Read the section**

```bash
sed -n '111,140p' /home/user/nfhs-rules-converter/2026-nfhs-football-game-officials-manual/04-part-1-officiating-principles.md
sed -n '217,306p' /home/user/nfhs-rules-converter/2026-nfhs-football-game-officials-manual/07-part-4-crew-of-five.md
```

- [ ] **Step 2: Write it for the chain crew, not for the officials**

This card is handed to volunteers, so it is written in the second person to
them. Cover: you are part of the officiating crew and must be impartial; a
four-person crew is preferable and what each of the four does; adults, vests,
no phones, no cheering, no talking to the visiting team; you take instruction
from the **Head Line Judge** only and bring every problem to him; meet him on
the sideline opposite the press box 15 minutes before the game and 5 minutes
before the second-half kickoff; the clip goes at the intersection of the
sideline and the 5-yard line nearest the trailing stake, then chains and box
move six feet off the sideline with the box in front of the trailing stake;
lead holder keeps the chain taut, trailing holder stands on the chain; never
move or change the down until told; drop everything and get clear on a play
coming at you; only the down indicator during tries and once the line to gain
is the goal line; reverse at the clip between the first and second and the
third and fourth periods; what happens during a measurement.

Add the ball helpers' section (§1.6, p. 28) — one per sideline mirroring the
wing, end-line duty on kicks with a ball behind the post, keep the ball dry —
and the manual's own recommendation that ball helpers not be allowed on the
field.

- [ ] **Step 3: Manifests, two-page gate, full gate, commit**

Run: `npm test`

```bash
git add -A
git commit -m "Add the Line-to-Gain Crew card from the 2026 NFHS manual"
```

---

### Task 11: New page — Crew Communication and "When in Question"

Implements **Findings 8.3, 8.4, 8.5, 8.6, 8.7, 8.8**. §1.7 p. 29, §1.8 p. 31,
§1.9 p. 34, §1.10 pp. 35–37, §1.11 p. 38, §2.1 pp. 46–47.

**Files:**
- Create: `content/information/crew-communication-signals.md`
- Modify: `content/information/official-signals.md` (link to it from §1)
- Modify: `test/content/frontmatter.test.js`, `test/cards/extract.test.js`

- [ ] **Step 1: Read the sections**

```bash
sed -n '141,275p' /home/user/nfhs-rules-converter/2026-nfhs-football-game-officials-manual/04-part-1-officiating-principles.md
sed -n '220,270p' /home/user/nfhs-rules-converter/2026-nfhs-football-game-officials-manual/05-part-2-nfhs-official-football-signals.md
```

- [ ] **Step 2: Write the four sections**

1. **The eight approved crew signals**, each with its motion, from §2.1 and
   §1.10: 11 players (fist out, elbow straight, thumb on top), don't start clock
   (wrists crossed at the waist), start clock on ready (rotated index finger),
   double sticks (arms crossed on the chest), unbalanced line (hand to the
   cheek), receiver off the line / backward pass (arm extended into the
   backfield, palm to the field), snapper protection applies (rolling fists),
   and the **five-second visible count** — referee in a crew of four, back judge
   in crews of five and seven. Note explicitly which of these the manual calls
   approved and which it calls suggestions (more/less than 11 have no formal
   signal; "five will get you one" is the Head Line Judge's flat palm on the
   chest and is unofficial).
2. **When to be silent** on the radio: coin toss, referee with a coach, others
   talking, stadium mic, live-ball play, multiple flags.
3. **The halo principle** (§1.7): main halo and secondary halos, 2–5 yards, and
   the handoff example — the referee owns the main halo until the ball crosses
   the neutral zone, then it becomes the wing's or the umpire's and every halo
   shifts.
4. **"When in question"** (§1.11) as a two-column table, verbatim in both
   columns.

Add the digger mechanics (§1.8) and the umpire's two down indicators (§1.9,
including the finger code: little = left hash, ring = left upright, middle =
middle of field, index = right upright, thumb = right hash) as short sections —
they are communication too.

**Do not draw these signals.** The existing stick figures cover S1–S47 and were
built by `tools/signal-svgs/`; the crew signals are not on that chart. Describe
the motion in words rather than shipping a drawing nobody has proofed.

- [ ] **Step 3: Manifests, two-page gate, full gate, commit**

Run: `npm test`

```bash
git add -A
git commit -m "Add crew communication signals and the when-in-question guide"
```

---

### Task 12: Provenance sweep, 7-man honesty, and the changelog

Implements **Findings 9 and 10**, and closes the plan.

**Files:**
- Modify: `content/information/7-man-mechanics.md`
- Modify: every article touched by Tasks 2–11 (`source`, `verified`, `ruleYear`)
- Modify: `docs/sources.md`
- Create: `docs/superpowers/plans/2026-09-02-nfhs-2026-manual-changelog.md`

- [ ] **Step 1: Correct the 7-man page's claims**

Read Part 5 §5.7 and §5.8, then fix the five sections the audit names —
free-kick keying (the new Point of Emphasis scheme), onside duties (HL and LJ at
K's 45; SJ and FJ rule the 10 yards; U and BJ rule K's line and the topped kick;
nobody moves until the ball passes R's restraining line), goal line (FJ/SJ at
the pylon from the 25 to the 7, HL/LJ from the 7 in, BJ on the end line from the
25 in), measurements (§5.6 assignments), and add the scrimmage-play depths (R
13–15 on the passing-arm side, U 5–10 and not outside the tackle, FJ/SJ 20–22,
BJ 25–30).

Then make the provenance honest. The page's lead currently presents a 2022 VFOA
slide deck as the content. Replace with: what is corrected here comes from the
manual; the linked PDF is the 2022 deck and is kept as the VFOA's own record;
Vermont crews work four and five. Set:

```yaml
source: the 2026 and 2027 NFHS Football Game Officials Manual, Part 5 — Crew of Seven (pp. 183–216); the linked PDF is the VFOA's 2022 slide deck and is not the source for the text
verified: 2026-09-02
ruleYear: 2026
```

The JPEG diagrams on this page still show the 2022 deck's alignments. Where the
diagram now contradicts the corrected text, say so in the caption rather than
leaving a reader to trust the picture. (Replacing them is Task 5 of
`2026-08-27-field-diagrams-svg.md`, not this plan.)

- [ ] **Step 2: Set provenance on every touched page**

```yaml
ruleYear: 2026
source: the 2026 and 2027 NFHS Football Game Officials Manual, §4.7 Positioning (pp. 136–141) and §4.8 Coverage (pp. 142–150)
verified: 2026-09-02
```

Cite the sections that page actually rests on — not the whole manual. Pages that
keep secondary material (the clock cheat sheet's SDCFOA content, the NVYFL
transcriptions) name both sources.

- [ ] **Step 3: Rewrite the "Associations amend these" line**

Every card carries `**Associations amend these** — check Vermont's guidance
before teaching it.` That stays, but the cards no longer point at the OHSAA Gold
Book, so the sentence beneath each download link is updated to name the manual.

- [ ] **Step 4: Update `docs/sources.md`**

Add to the primary sources table:

```markdown
| NFHS Football Game Officials Manual (2026 and 2027) | Via [nfhs-rules-converter](https://github.com/jamesjnadeau/nfhs-rules-converter/tree/main/2026-nfhs-football-game-officials-manual) | 2026-09-02 | All mechanics: positions, coverage, keys, signals, pregame and postgame, chain crew |
```

Then update the page-to-source mapping rows for every page this plan touched,
and retire the OHSAA Gold Book and 2022 VFOA deck rows to a "superseded" note
rather than deleting them — a reader who remembers the old sourcing should be
able to see what replaced it.

- [ ] **Step 5: Write the changelog**

`docs/superpowers/plans/2026-09-02-nfhs-2026-manual-changelog.md`, one section
per task, and within each a table of **what the site said → what the manual says
→ the page and section it now cites**. This is the document the requester
reviews, so it is written for someone who knows football and not this repository:
lead with the corrections that change what a crew does on the field (the punt
wing release, the crew-of-four deep official, the free-kick sidelines, the
referee's passing-arm side), then the additions, then the terminology, then the
file-level detail.

- [ ] **Step 6: Final full gate**

Run: `npm test`
Expected: PASS — build, 4 field suites, 4 draw suites, 3 card suites, 3 content
suites, html-validate over every built page, linkinator over every internal link.

- [ ] **Step 7: Commit and push**

```bash
git add -A
git commit -m "Record 2026 NFHS manual provenance and the alignment changelog"
git push -u origin claude/nfhs-manual-review-updates-01242l
```

---

## Self-review

**Spec coverage.** Findings 0–10 each map to a task: 0→T2, 1–2→T3, 3/3b/3c→T4,
4→T5, 5→T6, 6→T7, 7→T8, 8.1→T9, 8.2→T10, 8.3–8.8→T11, 8.9–8.13→T9/T10/T11
(jurisdiction and postgame into the pregame card's tail; forward progress into
T6's between-downs edit; free-kick coverage into T3 Step 4; ball helpers into
T10), 9→T12, 10→nothing, deliberately — it is the do-not-break list.

**Placeholders.** None: every table and callout above is the literal text to
write. The one thing this plan does not spell out line-by-line is Task 1, which
delegates to an existing plan by section and step number rather than restating
150 lines of it.

**Type consistency.** The mark is `HL` in `lib/draw/state.js`,
`lib/draw/presets.js`, both draw tests, the scene files and every card table.
`LM` survives in exactly one place — the legacy alias and the test that proves
it. Directory and slug are `head-line-judge` everywhere. Scene ids match the
image paths they write.

**Known risk.** Task 1 is a real dependency, not a formality: if the
byte-equivalence gate in its Step 2 cannot be met, Tasks 3–6 have no safe way to
move an official on a diagram, and the correct response is to stop and re-scope
the diagram work rather than to hand-edit 50 SVGs and hope.
