# Vermont Rules & Policies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the Vermont layer on the site. Today every substantive page is
generic NFHS; a Vermont official can read the whole site and still not know
about the 35-point running clock, the sub-varsity overtime cap, the fee
schedule, or the ejection review workflow. This plan adds the pages that carry
Vermont's amendments to the NFHS rule set, and adds the front matter and build
check that let every page state what it was verified against and when.

**Architecture:** Two parts. First, a **verification mechanism**: new optional
front matter (`ruleYear`, `source`, `verified`) rendered as a banner by
`article.pug`, exposed in `.pages.yml`, and asserted by a new test so a page
claiming Vermont authority can't ship unverified. Second, **four new
articles** in `content/information/` plus edits folding Vermont's clock rules
into the two existing clock documents and their PDFs.

**Tech Stack:** No new dependencies. Existing Eleventy 3 / Pug / markdown
pipeline, `node --test` + `gray-matter` for content assertions, WeasyPrint for
the PDF rebuilds.

## Global Constraints

- All constraints from `2026-07-26-eleventy-migration.md` still apply.
- `test/content/frontmatter.test.js` asserts an **exact** list of files in
  `content/information/`. Every new article must be added to the `want` array in
  the same commit or `npm test` fails.
- New front matter fields must be added to `.pages.yml` in the same commit, or
  Pages CMS will strip them the first time an editor saves that article.
- **Nothing in this plan ships an unverified fact.** Task 1 builds the gate;
  Task 2 is the gate. Tasks 3–7 are blocked on it. If the executing agent
  reaches a number, date, fee, or name it cannot source from a document James
  has confirmed as current, it stops and asks rather than filling it in.
- Vermont-specific claims are written as *amendments layered on NFHS*, never as
  restatements of NFHS. If a page has to explain the NFHS baseline to make the
  amendment legible, it links to the existing rules summary rather than
  duplicating it.

---

### Task 1: Verification front matter, banner, and test

Give every article the ability to declare which rules year it reflects, what it
was built from, and when a human last checked it. Nothing renders for articles
that omit the fields, so this is backward-compatible with all 16 existing
articles.

**Files:**
- Modify: `content/_includes/layouts/article.pug`
- Modify: `.pages.yml`
- Modify: `test/content/frontmatter.test.js`
- Modify: `content/styles/main.scss` (banner styling only if Bootstrap utilities aren't enough — prefer utilities)

**Interfaces:**
- Consumes: existing `article.pug` layout and its `title`/`date` handling.
- Produces: three optional front matter fields consumed by `article.pug` and by
  Task 2 onward —
  - `ruleYear` (number, e.g. `2026`) — the NFHS rules year the page reflects
  - `source` (string) — what it was built from, e.g. `"2026 VPA Football Guide"`
  - `verified` (ISO date string) — when a human last checked it against `source`
  Plus a test rule: **if a page sets `source`, it must also set `verified`**,
  and a `verified` date more than 400 days old fails the build.

- [ ] **Step 1: Write the failing test**

Append to `test/content/frontmatter.test.js`:

```js
// A page that claims a source must say when a human last checked it against
// that source. Rules change annually; a stale verification date is worse than
// none because it looks authoritative.
test('any article with a source also has a verified date', () => {
  const bad = articles
    .filter((a) => a.data.source && !a.data.verified)
    .map((a) => a.name);
  assert.deepEqual(bad, []);
});

test('no verified date is in the future or more than 400 days old', () => {
  const now = Date.now();
  const MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000;
  const bad = articles
    .filter((a) => a.data.verified)
    .filter((a) => {
      const t = new Date(a.data.verified).getTime();
      if (Number.isNaN(t)) return true;
      return t > now || now - t > MAX_AGE_MS;
    })
    .map((a) => `${a.name}: ${JSON.stringify(a.data.verified)}`);
  assert.deepEqual(bad, []);
});

// Vermont-specific pages are the ones where being out of date does real harm.
// They are required to carry the full provenance triple.
const VERMONT_PAGES = [
  'vermont-rules-and-policies.md',
  'game-day-administration.md',
  'ejections-and-reporting.md',
  'season-calendar.md',
];

test('Vermont-specific pages declare ruleYear, source, and verified', () => {
  const present = articles.map((a) => a.name);
  const bad = VERMONT_PAGES.filter((name) => present.includes(name))
    .map((name) => articles.find((a) => a.name === name))
    .filter((a) => !(a.data.ruleYear && a.data.source && a.data.verified))
    .map((a) => a.name);
  assert.deepEqual(bad, []);
});
```

Note the third test is written to pass vacuously until Tasks 3–6 create those
files, then bind automatically. That's intentional — it means the guard is in
place before the content it guards.

- [ ] **Step 2: Run it — should pass (vacuously) against current content**

Run: `node --test "test/content/frontmatter.test.js"`
Expected: PASS. No current article sets `source` or `verified`, so the new tests
have nothing to reject. If any test errors rather than passing, the append was
placed outside the module scope where `articles` is defined — move it below the
`articles` const.

- [ ] **Step 3: Render the banner in article.pug**

Modify `content/_includes/layouts/article.pug` so the provenance line renders
under the date when present. Keep it quiet — this is a footnote, not a warning:

```pug
---
layout: layouts/main.pug
---

article
  h1= title
  if date
    p.text-secondary
      time(datetime=new Date(date).toISOString())
        | #{new Date(date).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}
  if source
    p.small.text-secondary.border-start.border-3.ps-3.py-1
      | Reflects the #{ruleYear} NFHS rules year. Built from #{source}.
      |  Last checked #{new Date(verified).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}.
      br
      | Verify against the current rule book and VPA guide before teaching this as authoritative.
  | !{content}
```

- [ ] **Step 4: Add the fields to Pages CMS**

In `.pages.yml`, under the `information` collection's `fields:` list, add after
the `date` field:

```yaml
      - name: ruleYear
        label: NFHS rules year
        type: number
        description: The rules year this page reflects, e.g. 2026. Leave blank for pages that aren't rules content.
      - name: source
        label: Built from
        type: string
        description: 'What this was written from, e.g. "2026 VPA Football Guide" or "OHSAA Gold Book Brief & Concise". If you fill this in you must also fill in the checked date.'
      - name: verified
        label: Last checked on
        type: date
        options:
          time: false
        description: The date a human last read this page against the source above. Update it every time you re-check, even if nothing changed.
```

Also add `ruleYear` and `verified` to the collection's `view.fields` list so the
CMS index shows staleness at a glance:

```yaml
    view:
      fields: [title, date, ruleYear, verified]
```

- [ ] **Step 5: Verify the YAML parses**

```bash
node --input-type=module -e "
import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
matter('---\n' + readFileSync('.pages.yml', 'utf8') + '\n---');
console.log('YAML OK');
"
```

- [ ] **Step 6: Smoke-test the banner**

Temporarily add to `content/information/clock-timing-crew-card.md` front matter:
`ruleYear: 2026`, `source: "OHSAA Gold Book Brief & Concise"`,
`verified: 2026-08-27`. Run `npm run dev`, open the page, confirm the banner
renders below the date and reads cleanly. Then **revert the temporary front
matter** — that card's real provenance is set in Task 7.

- [ ] **Step 7: Full suite and commit**

```bash
npm test
git add -A
git commit -m "feat: rules-year and verification front matter with build-time staleness check"
```

---

### Task 2: Verification gate — gather current Vermont sources

**This task is a hard stop for the executing agent.** Everything after it
depends on documents that are not reliably available on the open web. The
publicly reachable VPA football page mixes 2024 and 2025 material; fees, dates,
and points of emphasis change annually.

**Files:**
- Create: `docs/sources.md`

**Interfaces:**
- Produces: `docs/sources.md`, a register of what each Vermont page is built
  from, which Tasks 3–7 read to populate their `source` front matter, and which
  becomes the checklist for the annual re-verification pass.

- [x] **Step 1: Create the source register**

Create `docs/sources.md`:

```markdown
# Source register

What Vermont-specific content on this site is built from, and when it was last
checked. Update the date every time a page is re-read against its source, even
if nothing changed. The build fails if any `verified` date goes past 400 days.

## Primary sources

| Source | Where | Obtained | Covers |
| --- | --- | --- | --- |
| NFHS Football Rules Book | (year) | | Baseline rules |
| NFHS Football Officials Manual | (year) | | Baseline mechanics |
| VPA Football Guide | vpaonline.org/athletics/football/ | | Vermont amendments, fees, calendar, playoffs |
| VFOA bylaws / member handbook | | | Dues, membership, discipline |
| VFOA assignment process docs | | | Assignor, availability, turnbacks |
| OHSAA Gold Book "Brief & Concise" | | | Crew mechanics (cross-checked) |
| SDCFOA clock administration | | | Clock operator reference |

## Page → source map

| Page | Source | Rules year | Verified |
| --- | --- | --- | --- |
| (filled in as pages land) | | | |

## Annual re-verification

Every August, before week 1:

1. Obtain the new VPA Football Guide and NFHS rules book.
2. Walk the page → source map top to bottom.
3. For each page: re-read against source, update `ruleYear`/`verified`, fix
   what changed, note what changed in the commit message.
4. Rebuild any PDF whose source article changed.
5. Run `npm test` — the 400-day check catches anything skipped.
```

- [ ] **Step 2: STOP — collect the sources**

The following must be obtained and confirmed current by James before any
Vermont content is written. Fill the "Obtained" column in `docs/sources.md` as
each lands.

**Needed to write Tasks 3–6:**

1. **The current VPA Football Guide** (PDF or the current page), confirmed as
   the edition in force for this season. Specifically needed from it:
   - Current officials' fees, varsity and sub-varsity, and the mileage rate
   - The suspended / cancelled game fee rules and the notice window
   - Confirmation the 35-point running clock language is unchanged, and its
     full wind/stop lists
   - Sub-varsity quarter length and the overtime cap
   - The pregame timeline
   - Current season dates, playoff dates, and championship site
   - This season's points of emphasis
2. **Whether the VPA has adopted a play clock**, and if so its operation. This
   is a long-standing open question on the existing cards and it changes the
   between-downs mechanics materially.
3. **The ejection reporting workflow as VFOA actually runs it** — who the
   officiating official notifies, on what form, by when, and how the
   commissioner/rules-interpreter review is triggered.
4. **Anything Vermont amends that isn't in the public guide** — local
   interpretations, association directives, or standing instructions the
   commissioners give crews.

**Do not proceed past this step without them.** If partial, write only the
pages fully covered and leave the others as stubs with an explicit "not yet
verified" note rather than filling gaps from the public page.

- [x] **Step 3: Commit the register**

```bash
git add docs/sources.md
git commit -m "docs: source register for Vermont content verification"
```

---

### Task 3: The Vermont Rules & Policies article

The centerpiece. One page an official reads once before their first Vermont
game, covering everything the VPA changes or adds on top of NFHS.

**Files:**
- Create: `content/information/vermont-rules-and-policies.md`
- Modify: `test/content/frontmatter.test.js` (add to `want`)

**Interfaces:**
- Consumes: Task 1's front matter fields; Task 2's verified facts.
- Produces: `/information/vermont-rules-and-policies/`, linked from the clock
  cards (Task 7) and from the new-official page (plan 2).

- [ ] **Step 1: Add the filename to the test first**

Add `'vermont-rules-and-policies.md'` to the `want` array in
`test/content/frontmatter.test.js`. Run
`node --test "test/content/frontmatter.test.js"` — expect FAIL on the file list
test. That failure is the spec.

- [ ] **Step 2: Write the article**

Create `content/information/vermont-rules-and-policies.md` with front matter:

```yaml
---
title: Vermont Rules & Policies
date: <today>
ruleYear: <verified>
source: "<the exact VPA guide edition confirmed in Task 2>"
verified: <today>
---
```

Structure. Every number, date, and fee comes from Task 2's verified guide — not
from the web page cited in the audit, which mixes years:

1. **Opening frame** — one short paragraph: Vermont plays NFHS rules; this page
   is only what the VPA changes or adds. Link to the
   [rules cliff notes](/information/football-rules-summary/) for the baseline.
2. **Running clock (35-point differential)** — the highest-value section, and
   the one most likely to be got wrong on a Friday night. Cover: the
   discretionary first-three-quarters version (mutual agreement of both coaches
   *and* the referee) versus the mandatory fourth-quarter version; that once it
   is on in the fourth it stays on even if the deficit closes; the full list of
   situations where the clock keeps running; the full list of stoppages; and how
   it restarts after each stoppage. Format as two facing lists — this is a
   lookup, not a read.
3. **Sub-varsity differences** — quarter length and the overtime cap, with a
   line on what "one inning" means procedurally.
4. **Pregame timeline** — the meeting sequence and clock times, and the
   captains-only rule for pregame and halftime meetings with officials.
5. **The clock and the scoreboard** — that the site administrator, clock
   operator, and scorer are identified to the referee; the clock operator
   meeting; and the rule that a scoreboard clock in use is official, otherwise
   it is turned off. Link to the
   [Clock Officials Cheat Sheet](/information/clock-officials-cheat-sheet/).
6. **Play clock** — whatever Task 2 established. If Vermont has not adopted one,
   say so plainly; that is itself the answer officials need.
7. **Fees, cancellations, and mileage** — the fee schedule and the three
   cancellation cases. Keep this factual and short.
8. **Equipment waivers** — that schools must notify opponents and officials when
   a waiver has been granted, and what a crew does when told about one.
9. **Points of emphasis** — this season's, with a pointer to the rules book for
   the full treatment.
10. **What this page is not** — a closing line: the VPA guide and the NFHS rule
    book govern; this is a summary maintained by an individual official.

Length target: this is a reference page, not a card. Long is fine. Use tables
for the clock lists and the fee schedule.

- [ ] **Step 3: Update the source register**

Add the row to the page → source map in `docs/sources.md`.

- [ ] **Step 4: Verify**

Run `npm test`. Expect PASS. Then `npm run dev` and read the page end to end
against the guide with the guide open beside it — this page will be quoted at
by coaches, so a wrong number here is worse than no page.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Vermont Rules & Policies — VPA amendments to the NFHS rule set"
```

---

### Task 4: Game Day Administration

What the crew is owed by the host school, and what the crew is responsible for
checking. Separate page because it's used at a different time — walking the
field ninety minutes out, not studying midweek.

**Files:**
- Create: `content/information/game-day-administration.md`
- Modify: `test/content/frontmatter.test.js` (add to `want`)

**Interfaces:**
- Consumes: Task 1 front matter; Task 2 verified facts.
- Produces: `/information/game-day-administration/`.

- [ ] **Step 1: Add to `want`, confirm it fails**

- [ ] **Step 2: Write the article**

Full provenance front matter as Task 3. Sections:

1. **What the host school must provide** — field properly equipped, at least one
   game ball, yardage chain, downs marker crew, clock operator, staff for crowd
   control, an identifiable administrator present, emergency medical services.
   Frame as a checklist the white hat walks, with a line on what to do when
   something is missing.
2. **Field and equipment walk** — goal posts, pylons, restricted area and team
   box marking, sideline barrier, ball condition. What is a delay-of-game
   problem versus a report-it-and-play problem.
3. **The chain crew and clock operator briefing** — what the crew tells them,
   when, and the vest/identification expectation at championship games.
4. **The coaches' and captains' meetings** — sequence, who may be on the field,
   what gets asked and told. Cross-link the pregame conference material from
   plan 3 once it exists.
5. **Playoff and championship differences** — higher seed wears dark and is the
   home team; ball persons; identification tags for sideline personnel;
   scoreboard clock official.
6. **When a game is suspended** — that the final decision on
   suspension/resumption sits with the host administrator, who is expected to
   consult the visiting administrator. Cross-link
   [Foul Weather Procedures](/information/foul-weather-procedures/).

- [ ] **Step 3: Update `docs/sources.md`, run `npm test`, commit**

```bash
git commit -am "feat: Game Day Administration — host obligations and the crew's pregame walk"
```

---

### Task 5: Ejections & Reporting

The workflow a white hat needs to know cold and currently cannot find anywhere.

**Files:**
- Create: `content/information/ejections-and-reporting.md`
- Modify: `test/content/frontmatter.test.js` (add to `want`)

**Interfaces:**
- Consumes: Task 1 front matter; Task 2's verified VFOA workflow.
- Produces: `/information/ejections-and-reporting/`.

- [ ] **Step 1: Add to `want`, confirm it fails**

- [ ] **Step 2: Write the article**

Sections:

1. **On the field** — the mechanics of the disqualification itself: signal,
   notifying the head coach, the player leaving, what goes on the card, what the
   crew agrees on before the ball is next snapped. Keep it tight; the rule book
   covers the ruling, this covers the doing.
2. **Write it down before you leave** — what to record while it's fresh:
   number, team, quarter, time, the act, the rule, who else saw it, exact words
   if there were words.
3. **The Vermont review workflow** — varsity ejections arising from penalties
   where ejection is provided by rule are reviewed by both VFOA commissioners
   and the VFOA rules interpreter, with a determination delivered to the VPA and
   the VIFL Executive Secretary by noon the Monday after the game. Then the part
   Task 2 has to supply: who the crew notifies, on what form, and by when, so
   that review can happen inside that window.
4. **What happens next** — the consequence side, including the standing that a
   team accumulating multiple ejections may be required to meet with the
   Activities Standards Committee. Verify the current threshold before stating
   it.
5. **Coach conduct and derogatory public statements** — the channel through
   which complaints about officiating are supposed to travel, so crews know that
   sideline arguments about it have a formal alternative.
6. **Incident reports that aren't ejections** — fights that didn't rise to it,
   spectator problems, facility or safety issues. Who to tell, and the standing
   advice to write it the same night.

- [ ] **Step 3: Update `docs/sources.md`, run `npm test`, commit**

```bash
git commit -am "feat: Ejections & Reporting — on-field mechanics and the VFOA review workflow"
```

---

### Task 6: Season Calendar

A dated page that answers "when is the next thing." Structurally different from
the others: it goes stale fastest and is the first thing to update each August.

**Files:**
- Create: `content/information/season-calendar.md`
- Modify: `test/content/frontmatter.test.js` (add to `want`)

**Interfaces:**
- Consumes: Task 1 front matter; Task 2's verified dates.
- Produces: `/information/season-calendar/`, linked from the home page in
  plan 4.

- [ ] **Step 1: Add to `want`, confirm it fails**

- [ ] **Step 2: Write the article**

A table-first page. Rows for: association meeting dates, rules interpretation
meetings, the exam window, first practice, first scrimmage date, week 1 through
week 8, playoff pairings release, quarterfinals, semifinals, championship date
and site. Second table for administrative deadlines: dues, registration,
availability submission, background check renewal.

Open with one line stating which season it covers, so a reader who lands on it
in July of the following year knows immediately it's stale — belt and braces
alongside the `verified` banner.

- [ ] **Step 3: Update `docs/sources.md`, run `npm test`, commit**

```bash
git commit -am "feat: season calendar page"
```

---

### Task 7: Fold Vermont's clock rules into the existing clock documents

The two clock documents are currently wrong by omission for Vermont: a crew
working a blowout will hit the running clock and find nothing about it on either
the crew card or the operator sheet. Both articles and both PDFs need it.

**Files:**
- Modify: `content/information/clock-timing-crew-card.md`
- Modify: `content/information/clock-officials-cheat-sheet.md`
- Rebuild: `static/uploads/clock-timing-crew-card.pdf`
- Rebuild: `static/uploads/clock-officials-cheat-sheet.pdf` (confirm actual filename first)

**Interfaces:**
- Consumes: Task 3's verified running-clock content.
- Produces: updated articles carrying full provenance front matter, and PDFs
  regenerated from the corrected HTML sources.

- [ ] **Step 1: Confirm the PDF build inputs**

Run `ls static/uploads/` and locate the HTML sources the current PDFs were
generated from. If the source HTML is not in the repo, that is itself a finding:
note it, and reconstruct or re-add the source before regenerating, so the next
person isn't in the same position. Record the outcome in `docs/sources.md`.

- [ ] **Step 2: Add the running clock to the crew card**

In `clock-timing-crew-card.md`, add a Vermont section covering the running
clock's trigger, the wind/stop lists, and the restart rule. The two-page
constraint is hard — something comes out to make room. Candidates, in order:
compress the "Who's who" table into a single line; cut duplicated 4-man notes
that the position cards already carry.

Add full provenance front matter, with `source` naming both the mechanics manual
and the VPA guide.

- [ ] **Step 3: Add it to the operator sheet**

`clock-officials-cheat-sheet.md` is written for the scoreboard operator, who is
the person actually running the clock during a blowout and is usually a
volunteer. This is the highest-stakes place for it to be clear. Write it as
plain instructions, not rule citations. Add the same provenance front matter.

- [ ] **Step 4: Cross-link**

Both documents link to
[Vermont Rules & Policies](/information/vermont-rules-and-policies/) for the
full treatment. The Vermont page links back to both.

- [ ] **Step 5: Regenerate both PDFs**

Rebuild with WeasyPrint. Verify: two pages each, no orphaned section headers,
prints legibly on a black-and-white laser at 100% on Letter. Confirm no gray
fills crept in — hatching only.

- [ ] **Step 6: Verify and commit**

```bash
npm test
git add -A
git commit -m "feat: add Vermont 35-point running clock to clock card and operator sheet"
```

---

## Post-plan notes (not tasks)

- **The 400-day staleness check will start failing in roughly 13 months.** That
  is the design. When it does, the fix is the annual re-verification pass in
  `docs/sources.md`, not raising the threshold.
- **Consider a `vermont` tag** once these four pages exist, and a filtered view
  on the Information index. Deferred to plan 4, which handles navigation.
- **The rules bot** (`content/rules-bot/index.pug`) answers from the rule book.
  Once the Vermont pages exist it is worth checking whether its corpus can
  include them — a bot that confidently gives the NFHS answer to a Vermont
  question is a liability. Out of scope here; worth a separate look.
