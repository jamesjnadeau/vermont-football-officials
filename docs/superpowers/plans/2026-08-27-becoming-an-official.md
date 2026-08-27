# Becoming an Official Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Someone who wants to officiate football in Vermont currently cannot
find out how from this site. The home page ends with "Interested in becoming an
official? Get in touch" and the contact page is a mailto. Everything between
those two points — what it costs, what's required, how games get assigned, what
you get paid, who to ask — is missing. This plan builds the recruiting and
onboarding path, and fixes the placeholder currently published in
`information-for-new-folks.md`.

**Architecture:** A three-page path plus a rewrite. `becoming-an-official.md` is
the front door for people who aren't officials yet. `your-first-season.md` is
what a registered rookie needs between joining and their first varsity
assignment. `getting-assigned.md` covers the assignment machinery, which
veterans also need. `information-for-new-folks.md` gets rewritten to be the
equipment page it actually is, with its placeholder resolved and its content
deduplicated against the new pages.

**Tech Stack:** No new dependencies. Existing markdown pipeline.

## Status — 2026-08-27

**Tasks 2–5 have landed.** `information-for-new-folks.md` is the equipment page
and its rule-book placeholder is resolved; `becoming-an-official.md`,
`your-first-season.md` and `getting-assigned.md` are live and carry provenance
front matter. Task 1's gate was answered by the officers for items 1–19, which
are recorded in `docs/sources.md`. The step checkboxes below were never ticked
as the work went in; treat this note as the record rather than them.

**What Task 1 still has not answered:** item 20 (the contact list — no name goes
on the site until the person has consented), and items 21–27 in the "Still open"
table, which sharpen paragraphs rather than block them. Item 21 is now half
answered: the playing season's dates came out of the 2026 VPA Football Guide and
are on the [Season Calendar](../../../content/information/season-calendar.md),
but the association's own meeting dates are still unpublished.

## Global Constraints

- Depends on **plan 1, Task 1** (verification front matter) having landed.
  These pages carry facts that go stale — dues, fees, course requirements — and
  need the same provenance banner.
- All constraints from `2026-07-26-eleventy-migration.md` still apply. New
  articles must be added to the `want` array in
  `test/content/frontmatter.test.js`.
- **Most of this content is internal to the VFOA and appears nowhere public.**
  Task 1 is a verification gate, same shape as plan 1's. The executing agent
  stops there.
- Tone target: these pages are read by people deciding whether to do this at
  all. Write for someone who has never officiated anything, without
  condescension and without hiding the real costs — the equipment outlay, the
  Friday nights, the abuse. The existing new-folks page gets this right
  ("Please do not let equipment be a deterrent to starting, if that is an issue
  we likely can work something out"); match that register.
- No fabricated contacts. A wrong email address on a recruiting page loses the
  recruit silently.

---

### Task 1: Verification gate — collect the association's own facts

**Hard stop for the executing agent.** None of the following is reliably
public. All of it must come from James or another VFOA officer.

**Files:**
- Modify: `docs/sources.md` (created in plan 1, Task 2)

**Interfaces:**
- Produces: verified facts consumed by Tasks 2–5, recorded in `docs/sources.md`.

- [ ] **Step 1: Collect membership and registration facts**

1. **How someone joins the VFOA** — the actual first step. Is there a form, an
   application window, a meeting they show up to, an email to a specific person?
2. **Dues** — current amount, when due, and confirmation of the standing
   practice that first-year officials don't pay them.
3. **Background check** — required or not, who runs it, who pays, how often it
   renews.
4. **Insurance** — what coverage membership confers, and what it does not.
5. **Required NFHS Learn courses for officials.** The VPA lists Implicit Bias as
   mandatory for officials as well as coaches; confirm the full current list for
   officials specifically, since the published requirements are written mostly
   about coaches.
6. **Rules exam** — is there one, when, what score, what happens if you miss it.
7. **Meeting attendance** — how many, when, where, whether attendance affects
   assignments or playoff eligibility.

- [ ] **Step 2: Collect assignment and progression facts**

8. **Who the assignor is**, and the platform used (Arbiter, RefTown, something
   else, or email).
9. **How availability is submitted**, and the deadline.
10. **Turnback policy** — how to give a game back, by when, and the etiquette
    and consequences.
11. **The progression** — youth → freshman → JV → varsity. What actually
    determines when someone moves up: seasons served, evaluation, the
    commissioners' judgement, crew chief recommendation?
12. **Playoff assignment criteria** — what makes an official eligible.
13. **Evaluation and mentoring** — is there a formal program, an assigned
    mentor, film review, observed games?

- [ ] **Step 3: Collect pay and contacts**

14. **Current fees** (also gathered in plan 1) and **mileage** — rate, how it's
    calculated, how it's claimed.
15. **How and when officials are paid** — by the school on site, by the VPA for
    playoffs, direct deposit, check.
16. **Tax treatment** — 1099 threshold and who issues it. State it factually and
    do not give tax advice.
17. **The contact list** — commissioners, rules interpreter, assignor, treasurer,
    mentor coordinator, and who handles new-member inquiries. Confirm each
    person is willing to be listed publicly before publishing a name or address.

- [ ] **Step 4: Record and commit**

Add a "VFOA membership facts" section to `docs/sources.md` recording where each
answer came from and the date. Commit.

```bash
git commit -am "docs: record VFOA membership and assignment source facts"
```

---

### Task 2: Rewrite information-for-new-folks as the equipment page

The existing page is good equipment writing carrying a published placeholder
and doing double duty as an onboarding page it was never structured to be. Narrow
it to what it does well, and resolve the placeholder.

**Files:**
- Modify: `content/information/information-for-new-folks.md`

**Interfaces:**
- Consumes: Task 1's answer on rule book distribution.
- Produces: a focused equipment page linked from Task 3's front-door page.
  Keeps its existing filename and URL — it is linked from elsewhere and has
  search history.

- [ ] **Step 1: Resolve the placeholder**

The line `?You will be provided a physical rule book during training?` is live
on the site today. It was deliberately preserved through the Eleventy migration
as an open question for editors. Task 1 answers it. Replace it with the actual
answer — whether officials are given a rule book, buy their own, or get the app
subscription through the association.

- [ ] **Step 2: Retitle and rescope**

Retitle to something that says what it is — "Equipment & Getting Started" or
similar. Keep the equipment content essentially as written; Bryan Fortier's
original voice is doing real work and the attribution line at the bottom stays.

Move out anything that belongs on the new pages: the rule book links and quiz
links move to Task 4's first-season page, leaving a cross-link behind.

- [ ] **Step 3: Modernize the two quiz links**

The page links to two `.docx` downloads while the site has five interactive
quizzes. Either convert those two into the quiz collection (preferred — the
machinery exists and `.pages.yml` already has a quizzes schema) or, if their
content duplicates existing quizzes, drop the links and point at `/quizzes/`.
Check `content/quizzes/asked-questions.md` first — that ledger exists to stop
question reuse, and any converted questions must be recorded in it.

- [ ] **Step 4: Add provenance front matter, verify, commit**

```bash
npm test
git commit -am "refactor: narrow new-folks page to equipment, resolve rule book placeholder"
```

---

### Task 3: Becoming an Official — the front door

For people who are not officials yet. This is the page the home page's "Get in
touch" line should have been pointing at all along.

**Files:**
- Create: `content/information/becoming-an-official.md`
- Modify: `test/content/frontmatter.test.js` (add to `want`)
- Modify: `content/index.pug` (point the closing call to action here)
- Modify: `content/contact/index.pug` (link to it)

**Interfaces:**
- Consumes: Task 1 facts; plan 1 Task 1 front matter.
- Produces: `/information/becoming-an-official/`, the target of the home page
  and contact page calls to action.

- [ ] **Step 1: Add to `want`, confirm the test fails**

- [ ] **Step 2: Write the page**

Sections, in this order — the order matters, because the questions people
actually ask come in this order:

1. **What the job is.** Two paragraphs. Friday nights and Saturday mornings,
   late August through early November, 34 high school programs across the state,
   crews of four and five. What a season actually looks like in hours.
2. **What you need to start.** Short: no experience required, a reasonable level
   of fitness, transport, and the equipment (link to Task 2's page). Say plainly
   that most people start on youth and sub-varsity games.
3. **What it costs to start** — the equipment outlay, honestly stated, alongside
   the standing practice on first-year dues and the offer to work something out.
   Lead with the cost and immediately follow with the mitigation; burying the
   cost reads as a bait and switch when it surfaces later.
4. **What you get paid** — current varsity and sub-varsity fees, mileage, and
   the honest note that you'll roughly cover your equipment cost in the first
   couple of weeks of youth games.
5. **What's required** — registration, dues, background check, coursework, exam,
   meetings. A checklist, not prose.
6. **How to start, step by step** — numbered, ending in a specific action with a
   specific person's email and a realistic timeline for what happens next.
7. **The honest part.** A short, unflinching section: people will yell at you,
   the first few games are disorienting, and there is a mentor. Recruiting pages
   that omit this lose people in year one instead of at the door. Keep it brief
   and unsentimental.
8. **Common questions** — do I need to have played, how old do I have to be,
   can I do this with a full-time job, what if I can only do some weeks.

- [ ] **Step 3: Rewire the calls to action**

In `content/index.pug`, change the closing line so "Interested in becoming an
official?" links to this page rather than straight to contact. In
`content/contact/index.pug`, add a line pointing prospective officials here
first.

- [ ] **Step 4: Verify and commit**

```bash
npm test
git commit -am "feat: Becoming an Official — recruiting front door"
```

---

### Task 4: Your First Season

For someone who has joined and now has to actually do it. Distinct audience from
Task 3 and shouldn't be crammed onto the same page.

**Files:**
- Create: `content/information/your-first-season.md`
- Modify: `test/content/frontmatter.test.js` (add to `want`)

**Interfaces:**
- Consumes: Task 1 facts.
- Produces: `/information/your-first-season/`, the hub linking the existing
  reference cards into a learning order.

- [ ] **Step 1: Add to `want`, confirm it fails**

- [ ] **Step 2: Write the page**

1. **Before your first game** — the checklist: registration confirmed, courses
   done, equipment acquired, availability submitted, meeting attended,
   mentor contact made.
2. **What to study, in what order.** This is the page's real value. The site has
   ten reference cards, a rules cliff-notes, and five quizzes with no stated
   entry point. Give an actual sequence: start with
   [the rules cliff notes](/information/football-rules-summary/), then your
   position card, then the between-downs card, then kicking plays. Say roughly
   how long each takes and what to focus on first. A rookie will most often work
   as a wing — say so, and point at
   [Linesman](/information/linesman-position-card/) and
   [Line Judge](/information/line-judge-position-card/) first.
3. **Your first game** — arrive when, what to bring, what to say in pregame,
   what to do when you don't know a rule mid-game (the answer is: talk to your
   crew, and it is fine).
4. **After the game** — what to review, how to ask your crew chief for feedback,
   what to write down.
5. **Working with a mentor** — whatever Task 1 established.
6. **Moving up** — what determines progression to JV and varsity, and roughly
   how long it takes.
7. **The quizzes** — link `/quizzes/` with a note on which to start with.

- [ ] **Step 3: Verify and commit**

```bash
npm test
git commit -am "feat: Your First Season — rookie path with a study sequence"
```

---

### Task 5: Getting Assigned

The assignment machinery. Rookies need it and so does everyone else, which is
why it isn't folded into Task 4.

**Files:**
- Create: `content/information/getting-assigned.md`
- Modify: `test/content/frontmatter.test.js` (add to `want`)

**Interfaces:**
- Consumes: Task 1 Steps 2 and 3.
- Produces: `/information/getting-assigned/`.

- [ ] **Step 1: Add to `want`, confirm it fails**

- [ ] **Step 2: Write the page**

1. **Who assigns games** and how to reach them.
2. **The platform** — what it is, how to get an account, how to log in. If
   there's a screenshot worth having, put it in `static/images/`.
3. **Submitting availability** — how, by when, how granular, and what happens if
   you miss the deadline.
4. **Accepting and declining** — response windows and what silence means.
5. **Turnbacks** — how to give a game back, the deadline, who to notify, and the
   etiquette. Be direct about the consequences of a late turnback; it is the
   single most common way a new official damages their standing without
   realising it.
6. **Crew assignments** — how crews are formed, whether you can request or
   avoid, and how a white hat is designated.
7. **Getting paid** — mechanism, timing, mileage claims, and the 1099 note.
8. **Playoffs** — eligibility criteria and how those assignments differ.

- [ ] **Step 3: Verify and commit**

```bash
npm test
git commit -am "feat: Getting Assigned — assignor, availability, turnbacks, and pay"
```

---

## Post-plan notes (not tasks)

- **The contact page is still a mailto.** With a recruiting funnel in front of
  it, a real form starts to earn its keep — a prospective official who has to
  open their mail client is one who might not. The migration plan already notes
  Formspree as the drop-in for GitHub Pages. Worth revisiting once Task 3 is
  live and there's traffic to measure.
- **These pages go stale in a specific way**: fees and dates change annually,
  but the people change unpredictably. Consider putting the contact list in a
  single data file that the other pages pull from, so a commissioner change is
  one edit rather than four.
- **Recruiting reach is out of scope here** but worth noting: this content is
  the thing to point at from the VFOA Facebook page and any VPA officials
  listing. The site can't recruit if nothing links to it.
