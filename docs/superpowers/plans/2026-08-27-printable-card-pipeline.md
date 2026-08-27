# Printable Card Pipeline Implementation Plan

> **Implemented.** Every step below is done except Task 6 Step 3, proofing on
> paper, which needs a black-and-white laser and a person — see
> `docs/cards/proofing.md`. The pipeline lives in `lib/cards/`, the gates in
> `test/cards/output.test.js`, and the design rules in `docs/cards/README.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The article is the card. Editing `kicking-plays-crew-card.md` in Pages
CMS updates both the web page and the printable PDF, with no second document to
keep in sync and nothing for the editor to rebuild. A card re-renders only when
something it actually depends on changes — not on every site build.

**Architecture:** An Eleventy transform that renders each printable article to
PDF through headless Chromium, behind a content-addressed cache keyed on
everything that can change the output. PDFs become build output written to
`_site/cards/`, not committed artifacts, so they can never be stale.

**Tech Stack:** Node 24, Playwright's Chromium via `page.pdf()`, a card
stylesheet in CSS paged media. No Python, no second toolchain.

---

## What's there now

Eleven articles each link a PDF card that was built somewhere else:

| Article | PDF |
| --- | --- |
| `back-judge-position-card.md` | `/uploads/back-judge-position-card.pdf` |
| `between-downs-crew-card.md` | `/uploads/between-downs-crew-card.pdf` |
| `clock-officials-cheat-sheet.md` | `/uploads/clock-officials-cheat-sheet.pdf` |
| `clock-timing-crew-card.md` | `/uploads/clock-timing-crew-card.pdf` |
| `fouls-enforcement-crew-card.md` | `/uploads/fouls-enforcement-crew-card.pdf` |
| `kicking-plays-crew-card.md` | `/uploads/kicking-plays-crew-card.pdf` |
| `line-judge-position-card.md` | `/uploads/line-judge-position-card.pdf` |
| `linesman-position-card.md` | `/uploads/linesman-position-card.pdf` |
| `referee-position-card.md` | `/uploads/referee-position-card.pdf` |
| `run-pass-plays-crew-card.md` | `/uploads/run-pass-plays-crew-card.pdf` |
| `umpire-position-card.md` | `/uploads/umpire-position-card.pdf` |

(`7-man-mechanics.md` also links a PDF, but that one is the original 2022 slide
deck — an artefact, not a generated card. It stays exactly where it is.)

Three facts shape the design:

**1. The content is already duplicated, and one copy is lost.** Read
`kicking-plays-crew-card.md`: the who's-who table, the diagrams, the per-play
bullets — the card's entire content is already in the markdown. The HTML the PDF
was actually built from is not in the repo. So today an editor who fixes a
mechanic in the article has silently made the PDF wrong, with no way to tell and
no way to fix it. This plan does not so much add a pipeline as delete a second
source of truth.

**2. This supersedes part of the field-reference-cards plan.** That plan's Task 1
says to recover the missing card HTML and extract a shared stylesheet from it.
If the card is generated from the article, there is nothing to recover: the HTML
becomes a build intermediate and the shared stylesheet is written once, here.
Task 1 of that plan should be struck and replaced with a pointer to this one.

**3. Pages CMS editors have no local checkout.** They edit in a browser and
their save commits straight to master. Any design that needs a human to run a
build after editing will produce stale cards the first week. This is the
constraint that rules out committing PDFs to the repo.

---

## Global Constraints

- All constraints from `2026-07-26-eleventy-migration.md` apply.
- **Two pages, Letter, two-sided, flip on long edge.** Inherited from
  `2026-08-27-field-reference-cards.md` and unchanged. The difference is that
  it becomes an assertion the build makes rather than a rule a person remembers.
- **Monochrome-first**, same source. Proofing on a real black-and-white laser
  stays a human step; the build can only catch the things a machine can see.
- **Editors never learn a new thing.** The common case must need no card-specific
  markup in the markdown. An editor writes the article; the card follows.
- **PDFs are build output, never committed.** Same status as the compiled CSS.
  A committed PDF is a PDF that can be stale.
- **No bot commits to master.** The repo deploys from master on push; a workflow
  that commits back doubles every deploy and invites loops.
- Tasks 1 and 2 are unblocked. Task 3 depends on both. Task 6 depends on all.

---

### Task 1: Decide what of the article is the card

Before any rendering, the harder question: the web page and the printed card
want different content. The page opens with framing prose and a link to download
itself, which on the card would be a link to the thing in your hand.

**Files:**
- Create: `lib/cards/extract.js`
- Create: `test/cards/extract.test.js`

**Interfaces:**
- Produces: `cardModel(article)` returning `{ title, subtitle, sections, provenance }`
  from a parsed article, with the web-only parts already dropped.

- [x] **Step 1: Inventory what differs, across all eleven articles**

Read all eleven and list every block that belongs on the page but not the card,
and vice versa. The known ones: the download link paragraph, the framing lede,
the provenance footnote. Do not design from the two you remember — read them all
and write the list down, because the rule has to cover the ones you didn't.

- [x] **Step 2: Choose convention over markup**

Default to rules that need nothing from the editor:

- **The download link** is the paragraph whose only link points at this
  article's own card. Recognisable, so strip it.
- **The lede** — the paragraph before the download link — becomes the card's
  subtitle rather than being dropped. It is already a one-line statement of
  what the card is for.
- **Provenance** (`source`, `verified`, `ruleYear` in front matter) becomes a
  small footer line on the last page. A printed card with no date on it is a
  card nobody can trust two seasons later.
- **Everything else** is card content, in document order.

Then one escape hatch for the exceptions Step 1 found: a `card-omit` class on a
block keeps it off the card, and `card-only` keeps it off the page. Both are
plain HTML attributes an editor can ignore and a maintainer can reach for.

- [x] **Step 3: Handle the figures**

The diagrams are the bulk of the cards and the reason they're worth printing.
On the page they sit in Bootstrap grid rows; on the card they need to be sized
in physical units, because a diagram that reads on screen can be illegible at
2.4 inches wide. Decide the card's figure sizing here, in millimetres, and note
that the two-column `row` markup has to survive translation into the card's
layout.

- [x] **Step 4: Test the extraction**

Assert against real articles, not fixtures: for each of the eleven, the card
model has a non-empty title, a subtitle, at least one section, and contains no
link to its own PDF. Assert that an article with no card link is left alone.

- [x] **Step 5: Commit**

```bash
npm test
git add -A
git commit -m "Work out which parts of an article become the card"
```

---

### Task 2: The card stylesheet and template

**Files:**
- Create: `lib/cards/card.css`
- Create: `lib/cards/card-template.js`
- Create: `docs/cards/README.md`

**Interfaces:**
- Consumes: Task 1's card model.
- Produces: `renderCardHtml(model)` returning a self-contained HTML document.

- [x] **Step 1: Write the page box**

`@page { size: Letter; margin: … }` with the margins the existing cards use —
measure a current PDF rather than guessing. Set `print-color-adjust: exact` so
the end-zone hatching survives, and establish the type scale once. This is the
"corrected base" the field-reference-cards plan wanted extracted; it is being
written here instead, from scratch, because there is nothing left to extract.

- [x] **Step 2: Make the two-page constraint visible in the CSS**

Column count, type size and figure size are the three knobs that decide whether
a card fits. Put them in named custom properties at the top of the file with a
comment saying so, so the next person who has to make a card fit knows where to
push before they start cutting content.

- [x] **Step 3: Inline everything**

The renderer loads the HTML from a string with no web server. Every image must
be inlined as a data URI — the field diagrams are SVG, so they inline as text
cheaply. No external fonts: use the same system stack the diagrams use, so the
card and its figures agree.

- [x] **Step 4: Write the card README**

`docs/cards/README.md`: the design rules from Global Constraints, the build
command, the two-page constraint and which knobs to turn, and the instruction to
proof on an actual black-and-white laser before shipping. The document that
stops the rules being reinvented.

- [x] **Step 5: Commit**

```bash
npm test
git commit -am "Write the card stylesheet and template"
```

---

### Task 3: Render, and cache on content

The incremental part. A card re-renders when its inputs change and not otherwise.

**Files:**
- Create: `lib/cards/render.js`
- Create: `lib/cards/cache.js`
- Create: `test/cards/cache.test.js`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Produces: `renderCard(model, { cacheDir })` returning a PDF buffer, from cache
  when the inputs are unchanged.

- [x] **Step 1: Get the cache key right — this is the whole task**

The key is a hash of everything that can change the output. Miss one input and
the failure mode is a card that looks fine and is wrong, which is worse than no
cache at all. At minimum:

- the article's markdown body and the front-matter fields the card uses
- the **full contents of every image the card references**, not their paths — a
  regenerated field diagram must invalidate every card that shows it
- `card.css` and `card-template.js`
- a `CARD_FORMAT_VERSION` constant bumped by hand when the renderer changes
- the Chromium build the PDF came out of, since a browser upgrade changes
  layout

Write the key as a sorted list of `name: sha256` pairs so a cache miss can be
explained. When a card rebuilds and you don't know why, the answer has to be
one diff away.

- [x] **Step 2: Render**

Launch Chromium once for the whole run, not once per card. `page.setContent`,
wait for fonts, then `page.pdf({ format: 'Letter', printBackground: true })`.
Reuse the page; close the browser in a `finally`.

- [x] **Step 3: Cache on disk**

`.cache/cards/<key>.pdf`, added to `.gitignore`. On a hit, copy; on a miss,
render and store. Log one line per card saying hit or miss and, on a miss, which
input changed — that line is what makes the incrementality checkable rather than
merely claimed.

- [x] **Step 4: Test the cache**

The tests that matter are the invalidation ones, and they should be written to
fail first:

- same inputs twice → second run is a hit, no render
- change the markdown → miss
- **change the bytes of a referenced SVG, leaving its path alone → miss**
- bump `CARD_FORMAT_VERSION` → miss
- a corrupt or truncated cache entry → miss, not a broken PDF

- [x] **Step 5: Commit**

```bash
npm test
git commit -am "Render cards through a content-addressed cache"
```

---

### Task 4: Wire it into the build

**Files:**
- Modify: `.eleventy.js`, `package.json`
- Modify: the eleven article markdown files (link `/cards/…` instead of `/uploads/…`)
- Delete: the eleven PDFs under `static/uploads/`

**Interfaces:**
- Produces: `_site/cards/<slug>.pdf` for every article tagged `Printable`.

- [x] **Step 1: Emit to `/cards/`, not `/uploads/`**

`static/uploads/` is Pages CMS's media directory — editors upload into it. A
generated file living there will eventually collide with one an editor put
there. Generated cards get their own path, and the separation stays obvious:
`uploads/` is what people put in, `cards/` is what the build makes.

- [x] **Step 2: Add the Eleventy hook**

An `eleventyConfig.on('eleventy.after')` handler that finds articles tagged
`Printable`, skips the 7-man deck (which links an artefact, not a generated
card), and writes each PDF into the output directory.

- [x] **Step 3: Keep `npm run dev` fast**

Development builds skip cards entirely unless `CARDS=1` is set. A live-reload
cycle must not wait on a browser. State this in the dev docs, because the first
person to wonder why their card didn't update will be the person who wrote it.

- [x] **Step 4: Update the article links and delete the old PDFs**

Change the eleven download links to `/cards/<slug>.pdf` and delete the eleven
committed PDFs. Leave `7-man-mechanics-2022.pdf` alone.

Verify `npm test`'s link check passes — it crawls `_site`, so the generated
cards must exist by the time it runs. If they don't, the ordering is wrong and
that is the bug to fix, not a reason to skip the check.

- [x] **Step 5: Commit**

```bash
npm test
git add -A
git commit -m "Generate the printable cards during the site build"
```

---

### Task 5: The gates

An automatic pipeline that ships a broken card is worse than a manual one. These
are the checks that make unattended regeneration safe, and the reason a CMS
editor can change a card without knowing they did.

**Files:**
- Create: `test/cards/output.test.js`
- Modify: `.github/workflows/deploy.yml`

- [x] **Step 1: Assert the page count**

Every card is exactly two pages. Read it back from the rendered PDF and fail
naming the card and the count. This is the gate that makes the whole design
safe: it is the failure an editor is most likely to cause and least likely to
notice.

- [x] **Step 2: Assert nothing was silently dropped**

Overflow is the quiet failure — content pushed off the page box renders as a
clean-looking card with a missing bullet. Compare the text extracted from the
PDF against the text of the card model and fail on anything missing. Assert too
that every figure the model references appears, since a broken data URI produces
a blank space rather than an error.

- [x] **Step 3: Cache the cache in CI**

`actions/cache` on `.cache/cards`, keyed so it survives across runs. Cache the
Playwright browser download separately — it is the slow part of a cold build.
An edit to one article should rebuild one card.

- [x] **Step 4: Fail loudly, and only on the real thing**

A gate failure fails the deploy, which for a CMS editor means the site keeps
serving the last good build while someone looks. That is the right trade: a
stale card that a human is about to fix beats a wrong one nobody noticed. Make
the failure message name the article by its CMS title, not its file path.

- [x] **Step 5: Commit**

```bash
npm test
git commit -am "Gate card output on page count and completeness"
```

---

### Task 6: Migrate the eleven, and prove it

**Files:**
- Modify: the eleven articles, as each is brought across
- Create: `docs/cards/proofing.md`

- [x] **Step 1: Render all eleven and compare against the committed PDFs**

Put the generated card beside the current one, page by page. They will not
match — the current ones came from a lost source through a different renderer —
so the question is not equality but whether anything present in the old card is
missing from the new one. **Content in the old PDF that is not in the article
markdown is content that was about to be lost**: find it, and put it in the
article, where it should have been.

This step is the real work of the task. Expect it to turn up material on the
cards that never made it to the web pages.

- [x] **Step 2: Fix what the gates catch**

Cards that come out at three pages need cutting, per the constraint. Cut content
rather than shrinking type past legibility — the type size is already set for
someone reading in bad light on a sideline.

- [ ] **Step 3: Proof on paper** — NOT DONE; needs a laser and a person

Print all eleven on a black-and-white laser, two-sided, flip on long edge. Check
the flip actually works — a card whose back is upside down is a card nobody uses
twice. This is manual and cannot be skipped.

- [x] **Step 4: Write the proofing doc**

`docs/cards/proofing.md`: what to check on paper, what the gates already cover,
and what only a human can catch. Short enough to be read before each print run.

- [x] **Step 5: Commit**

```bash
npm test
git add -A
git commit -m "Move the eleven cards onto the generated pipeline"
```

---

## Decisions worth revisiting

**Chromium over WeasyPrint.** The existing cards were built with WeasyPrint,
which has genuinely better paged-media support — page counters, margin boxes,
widow and orphan control. Chromium wins here for three reasons: it keeps the
project on one toolchain rather than adding Python and its system libraries to
every contributor's setup and to CI; `page.pdf()` gives the page count directly,
which is how the two-page gate is enforced; and the same browser renders the
proof images. The tie-breaker is that fidelity to the existing cards is worth
nothing, because their source is lost and they are being rebuilt from the
markdown either way. If the cards later need running headers or "page 1 of 2",
that is the point to reconsider.

**PDFs as build output, not commits.** The alternative — regenerate in CI and
commit back — keeps the PDFs downloadable from GitHub and diffable in a PR. It
also doubles every deploy, needs loop protection, and puts a bot commit on
master for every CMS edit. Generating into `_site/` costs the ability to review
a card in a diff, which the Task 5 gates and a proof print cover better anyway.

**The cache key is the fragile part.** Everything else here fails loudly. A
missing input in the cache key fails silently, months later, as a card that
doesn't match its page. If something about a card ever looks stale, suspect the
key before anything else — and when in doubt, add the input.

## Notes

- **This plan and the field-diagram renderer meet at the figures.** Cards inline
  the same SVGs the pages show, so once the diagram renderer lands, a card's
  cache key covers generated SVG content and a diagram fix propagates to every
  card that shows it. Sequencing either way works; doing diagrams first means
  the figures stop moving before the cards start depending on them.
- **A combined all-cards PDF** becomes nearly free once this exists — one more
  template over the same models. Deferred, as the field-reference-cards plan has
  it, but the cost drops a lot.
- **The `Printable` tag becomes load-bearing.** It currently marks articles for
  readers; after this it also decides what the build renders. Worth a line in
  the CMS field description so an editor doesn't add it to an article that isn't
  a card and get a confusing failure.
