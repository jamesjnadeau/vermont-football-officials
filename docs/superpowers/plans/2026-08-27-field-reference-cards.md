# Field Reference Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the reference set. The ten existing cards cover mechanics by
topic and by position, but the things officials most often look up mid-week and
mid-game are still missing: signals, equipment legality, penalty enforcement
spots, overtime, and a pregame conference script. The site also carries 7-man
mechanics — which Vermont crews don't work — while having no consolidated 4- or
5-man mechanics document. This plan closes those, and unifies the stylesheet
drift across the existing set.

**Architecture:** Extends the established pattern exactly: a markdown article in
`content/information/` that frames the material and links a two-page,
Letter-size, two-sided PDF built from self-contained HTML with inline styles and
inline SVG. No new machinery. The one structural addition is a shared card
stylesheet, extracted so drift can't recur.

**Tech Stack:** ~~HTML/CSS with inline stylesheets and inline SVG, WeasyPrint for
PDF generation, existing Eleventy pipeline for the articles.~~ Out of date — see
Task 1. Cards are generated from the article markdown by the Eleventy build
through headless Chromium (`lib/cards/`), so a new card needs an article and
nothing else.

## Global Constraints

- All constraints from `2026-07-26-eleventy-migration.md` apply. New articles go
  in the `want` array in `test/content/frontmatter.test.js`.
- **Two pages, Letter, two-sided, flip on long edge.** Hard constraint. Content
  is cut to fit; the constraint does not move.
- **Monochrome-first.** Verified against black-and-white laser output. Hatching,
  never gray fill — gray dithers on cheap copiers. Dotted paths and dashed lines
  instead of color accents. Shape-based encoding (solid / outlined / dashed
  badges) instead of color coding.
- **Cards help officials direct others**, not just remind themselves. That
  framing distinguishes these from personal cheat sheets and should survive into
  the new cards.
- **Crew-of-4 framing**: describe where a position's duties *redistribute* in a
  four-official crew, not merely that the position is absent.
- **Neutral jurisdiction language** where Vermont's position isn't confirmed:
  "confirm with the Line Judge," not an asserted state fact. Anything this plan
  can't verify gets conditional framing and a note in `docs/sources.md`.
- Tasks 2 and 3 are unblocked and can start immediately. Task 4 is blocked on
  verification. Task 5 depends on plan 1's Vermont content for the overtime cap.

---

### Task 1: ~~Extract a shared card stylesheet~~ — SUPERSEDED

**Struck. Done differently by
[2026-08-27-printable-card-pipeline.md](2026-08-27-printable-card-pipeline.md),
which has landed.**

This task assumed the cards were HTML documents in the repo that a shared
stylesheet could be extracted from. They were not: the HTML the committed PDFs
were built from was never in the repo, which is the finding Step 1 asked for.
There is nothing to recover.

The cards are now generated from the article markdown during the site build, so
the HTML is a build intermediate and the shared stylesheet was written once,
from scratch, at `lib/cards/card.css`. `docs/cards/README.md` and
`docs/cards/proofing.md` are the documents this task wanted. The two-page
constraint is no longer a rule someone remembers — the build reads the page
count back out of each PDF and fails on anything but two.

What this task wanted that still holds, and is now free: **a new card needs no
HTML at all.** Write the article, tag it `Printable`, and the card follows.
Tasks 2 to 5 below should be read that way — their `docs/cards/*.html` files do
not need to exist.

---

### Task 2: Signals card

The most-looked-up reference in officiating and conspicuously absent. Unblocked
— NFHS signals are standardized and don't need Vermont verification.

**Files:**
- Create: `content/information/signals-card.md`
- Create: `docs/cards/signals-card.html`
- Create: `static/uploads/signals-card.pdf`
- Modify: `test/content/frontmatter.test.js` (add to `want`)

**Interfaces:**
- Consumes: Task 1's `card-base.css`.
- Produces: `/information/signals-card/` and the linked PDF.

- [ ] **Step 1: Add to `want`, confirm the test fails**

- [ ] **Step 2: Build the card**

Inline SVG figures, monochrome, in the house style. Organize by *when you need
it*, not by the rule book's numbering:

- **Page 1 front:** clock and administrative signals (start/stop clock, timeout,
  ready for play, first down, touchback, safety, score, try). These are the ones
  the crew and the scoreboard operator both read, and they're used every game.
- **Page 1 back / page 2:** foul signals grouped by category — dead ball fouls,
  live ball fouls against the offense, against the defense, and the personal
  foul family.

For each: the figure, the signal name, and the signal number. Where a signal is
routinely confused with another, note the distinguishing feature — that's the
thing a card can do that a rule book diagram can't.

Include the preliminary-versus-final signal sequence and the mechanic for
mirroring, since that's crew coordination, not just vocabulary.

- [ ] **Step 3: Proof and verify**

Print on a black-and-white laser. Every figure must be unambiguous at printed
size — SVG line weight that reads fine on screen frequently disappears in
print. Check two pages exactly.

- [ ] **Step 4: Write the article and commit**

Article follows the established pattern: short framing paragraph, download link
with print instructions, provenance note, cross-links to the topic cards.

```bash
npm test
git commit -am "feat: signals card"
```

---

### Task 3: Equipment & Uniform card

The most common pregame conflict with coaches, and the site has nothing on it.
Unblocked — NFHS equipment rules are standard, with the Vermont waiver
notification handled by cross-link to plan 1's content.

**Files:**
- Create: `content/information/equipment-card.md`
- Create: `docs/cards/equipment-card.html`
- Create: `static/uploads/equipment-card.pdf`
- Modify: `test/content/frontmatter.test.js` (add to `want`)

**Interfaces:**
- Consumes: Task 1's `card-base.css`; cross-links plan 1 Task 3 for waivers.
- Produces: `/information/equipment-card/` and the PDF.

- [ ] **Step 1: Add to `want`, confirm it fails**

- [ ] **Step 2: Build the card**

Structure it as a decision aid, because the real question on the field is always
"is this legal and what do I do about it right now":

- **Required equipment** — the mandatory list, with what counts as properly worn.
- **Illegal equipment** — the prohibited list.
- **The judgement calls** — jewelry, medical alert tags, eye shields, casts and
  braces, hard splints, gloves, towels, tape, non-standard pads, hair and
  religious head coverings. For each: the rule, and the practical remedy.
- **What you do about it** — the escalation: correct it before the snap, charge
  a timeout, remove the player until corrected. Officials get this wrong under
  pressure more often than they get the legality wrong.
- **Uniform and numbering** — legal jersey and pants, number requirements,
  duplicate numbers, and the mercy provisions.
- **Vermont note** — schools must notify opponents and officials when an
  equipment waiver has been granted; what a crew does when told about one.
  Cross-link [Vermont Rules & Policies](/information/vermont-rules-and-policies/).

- [ ] **Step 3: Proof, write the article, commit**

```bash
npm test
git commit -am "feat: equipment and uniform card"
```

---

### Task 4: Crew mechanics for four and five officials

The site has 7-man mechanics, which Vermont crews don't work, and five position
cards that describe individual roles. There's no document showing the crew
moving as a unit at the sizes actually used. **Blocked on verification.**

**Files:**
- Create: `content/information/crew-mechanics-4-and-5.md`
- Create: `docs/cards/crew-mechanics-4-and-5.html`
- Create: `static/uploads/crew-mechanics-4-and-5.pdf`
- Modify: `content/information/7-man-mechanics.md`
- Modify: `test/content/frontmatter.test.js` (add to `want`)

**Interfaces:**
- Consumes: Task 1's `card-base.css`; the existing position cards, which this
  card must not contradict.
- Produces: `/information/crew-mechanics-4-and-5/` and the PDF.

- [ ] **Step 1: VERIFICATION GATE — resolve the two open mechanics questions**

Two items have been open since the position cards were built and block this
card, because both are structural to the diagrams rather than footnotes:

1. **Vermont's 4-man punt alignment.** Which official has which coverage
   responsibility, and where they start.
2. **Good/no-good ruling on field goals in a 4-man crew** — who rules it, from
   where, and how it's signalled.

Both need confirmation from the VFOA rules interpreter or the current state
4-man manual. **Do not resolve these by adopting the OHSAA Gold Book answer and
labelling it Vermont's** — the Gold Book was cross-checked against a state 4-man
manual for the existing cards precisely because they diverge.

If verification is unavailable, the fallback is to build the card with those two
situations in explicit conditional framing ("confirm your crew's punt alignment
in pregame — practice varies") rather than asserting a wrong answer. Record the
decision in `docs/sources.md` either way.

- [ ] **Step 2: Add to `want`, confirm it fails**

- [ ] **Step 3: Build the card**

Formation diagrams showing all officials at once, which is what the position
cards structurally can't do. Cover, for both crew sizes: initial positions for
scrimmage plays, free kicks, scrimmage kicks, goal line, and try/field goal.
Show pre-snap keys and post-snap coverage zones.

Use the established shape encoding for the officials, and show the 4-man
variant as a redistribution of the 5-man — same visual language as the position
cards, so the two sets read together. Dotted paths for movement.

- [ ] **Step 4: Consistency check against the position cards**

Read all five position cards against this one. Any contradiction is a bug in one
of them; resolve it before shipping, and if the position card is wrong, fix and
rebuild it too. Inconsistent mechanics documents are worse than one document.

- [ ] **Step 5: Reframe the 7-man page**

`7-man-mechanics.md` currently sits in the list with no context, implying
relevance it doesn't have for Vermont crews. Add a line saying what it's for —
reference, or officials working out of state — and cross-link the new card as
the one that applies here.

- [ ] **Step 6: Proof, write the article, commit**

```bash
npm test
git commit -am "feat: crew mechanics card for four and five officials"
```

---

### Task 5: Penalty Enforcement & Overtime card

Enforcement spots are where experienced officials still get caught, and there's
no quick reference. Overtime is rare enough that nobody has it memorized, which
is exactly when a card earns its place.

**Files:**
- Create: `content/information/enforcement-overtime-card.md`
- Create: `docs/cards/enforcement-overtime-card.html`
- Create: `static/uploads/enforcement-overtime-card.pdf`
- Modify: `test/content/frontmatter.test.js` (add to `want`)

**Interfaces:**
- Consumes: Task 1's `card-base.css`; plan 1 Task 3 for the Vermont sub-varsity
  overtime cap.
- Produces: `/information/enforcement-overtime-card/` and the PDF.
- Relationship to the existing fouls card: that one covers *recognizing and
  reporting* fouls. This one covers *where the ball ends up*. Cross-link both
  ways and don't duplicate.

- [ ] **Step 1: Add to `want`, confirm it fails**

- [ ] **Step 2: Build the enforcement side**

A decision flow, in the house monochrome style:

- The basic spot determination, walked as a sequence of questions rather than a
  prose rule statement.
- All-but-one, with the three-and-one exception, shown as a diagram.
- Enforcement on kicks — the post-scrimmage-kick spot, and fouls during the kick
  versus during the return.
- Fouls at the snap, dead ball fouls, and fouls between downs, including how
  they stack when there's more than one.
- Double fouls and offsetting.
- The half-distance and goal-line constraints.
- A worked example or two — enforcement is the area where an abstract rule
  statement helps least.

- [ ] **Step 3: Build the overtime side**

The procedure end to end: the coin toss, choices, series structure, where the
ball is placed, try requirements by period, timeouts, and how fouls are enforced
during overtime.

Then the Vermont amendment: the sub-varsity cap of two innings, with the
definition of what an inning is procedurally. Cross-link
[Vermont Rules & Policies](/information/vermont-rules-and-policies/).

- [ ] **Step 4: Proof, write the article, commit**

```bash
npm test
git commit -am "feat: penalty enforcement and overtime card"
```

---

### Task 6: Pregame Conference card

The crew's own pregame, plus the coach and captain meetings. Currently the crew
pregame exists only as a reusable email template outside the site.

**Files:**
- Create: `content/information/pregame-conference-card.md`
- Create: `docs/cards/pregame-conference-card.html`
- Create: `static/uploads/pregame-conference-card.pdf`
- Modify: `test/content/frontmatter.test.js` (add to `want`)

**Interfaces:**
- Consumes: Task 1's `card-base.css`; plan 1 Task 4 for the Vermont pregame
  timeline and the captains-only rule.
- Produces: `/information/pregame-conference-card/` and the PDF.

- [ ] **Step 1: Add to `want`, confirm it fails**

- [ ] **Step 2: Build the card**

This one is a script, not a diagram, so it breaks the visual pattern of the
others — that's correct, it's used differently.

- **The crew pregame**, structured as an agenda a white hat can work down:
  introductions and positions, the timeline, coverage responsibilities and keys,
  goal line and end line coverage, kick coverage, measurements, penalty
  administration and who reports, clock management, communication signals,
  dead ball officiating, unsporting conduct philosophy and the crew's escalation
  agreement, injury and lightning procedure, and halftime.
- **The coaches' meeting** — the questions asked, the information given, and the
  legal-equipment certification.
- **The captains' meeting and coin toss** — the sequence, the wording, and the
  Vermont captains-only constraint.
- **The Vermont pregame timeline** boxed separately, per the topic-card
  convention of setting white-hat items apart.

- [ ] **Step 3: Reconcile with the existing crew email template**

James maintains a "Crew Pre-Game Information" email template covering game
details, logistics, crew roster, uniform, focus areas, weather/EAP, and
post-game. That's the *pre-game-week* communication; this card is the
*on-site* conference. They should reference each other's structure so a crew
chief isn't working from two unrelated organizing schemes. Consider publishing
a generic version of the template as a companion download.

- [ ] **Step 4: Proof, write the article, commit**

```bash
npm test
git commit -am "feat: pregame conference card"
```

---

## Post-plan notes (not tasks)

- **After this plan the set is 16 cards.** That is past the point where a flat
  Information list works — plan 4 handles grouping and a card index.
- **A single combined PDF** of all cards is worth offering once the stylesheet
  is unified, for officials who want to print the set once. Cheap to produce
  from the individual sources; deferred to plan 4 with the rest of the
  packaging work.
- **Injury, concussion, and heat protocol** is a gap this plan does not close.
  It sits awkwardly between a card and a policy page, and the Vermont
  return-to-play requirements need verification. Worth a small dedicated plan
  rather than being wedged into an existing card.
- **`foul-weather-procedures.md` is 16 lines.** Check whether it covers heat as
  well as lightning; if not, that's the natural home for it.
