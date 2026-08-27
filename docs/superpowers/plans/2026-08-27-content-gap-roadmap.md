# Content Gap Roadmap — Vermont Football Officials

> **This is an umbrella document, not an implementation plan.** It records the
> August 2026 gap audit and sequences the four implementation plans that came
> out of it. Each plan is a separate file in this directory and can be executed
> independently once its stated dependencies are met.

**Date:** 2026-08-27
**Audit basis:** the live site at
<https://jamesjnadeau.github.io/vermont-football-officials/> as of 2026-08-27
(16 information articles, 5 quizzes, contact page, rules bot), read against the
[VPA football page](https://vpaonline.org/athletics/football/) and the
[VPA officials associations page](https://vpaonline.org/athletics/vt-sports-officials-association/).

---

## The finding

The site's stated goal is "everything refs need to know to do their job at
officiating football in Vermont." Against that goal, the content splits cleanly:

**What is strong.** The ten-card reference set (five topic cards, five position
cards), the clock operator sheet, the NFHS rules cliff notes, and the five
interactive quizzes. This is more usable field reference than most state
association sites carry, and the print-first design work is done.

**What is missing.** Two whole layers.

1. **The Vermont layer.** Every substantive page on the site right now is
   generic NFHS. Nothing on it would be wrong in Ohio. But Vermont games are
   governed by the VPA Football Guide on top of NFHS, and none of that guide is
   represented: the 35-point running clock, sub-varsity quarter length and
   overtime cap, the pregame timeline, the fee and cancellation schedule, the
   ejection review workflow, host school obligations. An official who read this
   entire site cover to cover would still walk onto a Vermont field not knowing
   these. This is the single largest gap and it sits directly under the site's
   name.

2. **The administrative layer.** Someone who wants to officiate in Vermont
   cannot find out how from this site. Registration, dues, background check,
   insurance, required NFHS Learn coursework, the assignor and how games are
   assigned, meeting and exam requirements, the sub-varsity → varsity
   progression, pay and mileage, and who to contact for what — none of it is
   here. `information-for-new-folks.md` covers equipment well and then stops.

There is a third, smaller category: **field reference still to build** —
signals chart, equipment legality checklist, penalty enforcement flowchart,
overtime procedure, pregame conference script, and 4- and 5-man crew mechanics
(the site has 7-man only, plus position cards). And a fourth: **site structure**
— no search, no start-here path, no season calendar, no rules-year versioning,
no offline access, and a placeholder question still visible in published copy.

---

## The plans

Execute roughly in this order. Plan 1 is the highest value and also builds the
verification machinery the others depend on.

| # | Plan | Why this order |
| --- | --- | --- |
| 1 | [`2026-08-27-vermont-rules-and-policies.md`](./2026-08-27-vermont-rules-and-policies.md) | Closes the biggest gap; establishes the source/verification front matter that plans 2–4 reuse |
| 2 | [`2026-08-27-becoming-an-official.md`](./2026-08-27-becoming-an-official.md) | Recruiting pipeline; depends on plan 1's verification banner |
| 3 | [`2026-08-27-field-reference-cards.md`](./2026-08-27-field-reference-cards.md) | Extends the existing card system; no new machinery needed |
| 4 | [`2026-08-27-site-navigation-and-trust.md`](./2026-08-27-site-navigation-and-trust.md) | Best done once there is enough content to need navigating |

Plans 3 and 4 can run in parallel with each other. Plan 2 can start before plan
1 finishes as long as plan 1's Task 1 (front matter + banner) has landed.

---

## The verification problem, stated once

Most of the missing content **cannot be written from public sources alone.**
The VPA publishes a football guide, but the copy reachable on the web mixes
2024 and 2025 material — fees, dates, and points of emphasis all change
annually, and some of what's needed (VFOA dues, assignor process, exam
requirements, commissioner contacts) is internal to the association and appears
nowhere public.

Every plan in this set therefore treats content as blocked on a **verification
gate**: a task where James, or someone with the current guide and VFOA
standing, supplies or confirms the facts before the page is written. Plans mark
these explicitly. The agent executing a plan should stop at the gate rather
than guess, and should never publish a number, date, fee, or contact that has
not passed one.

This mirrors the site's existing convention — the crew cards already say
"Associations amend these — check Vermont's guidance before teaching it."
Plan 1 turns that convention from a sentence typed into each article into a
front matter field the build can check.

---

## Standing constraints for all four plans

- Repo conventions from
  [`2026-07-26-eleventy-migration.md`](./2026-07-26-eleventy-migration.md)
  still hold: ESM, Node ≥24, branch `master`, input `content/`, root-relative
  URLs only, no CDN `<script src>`, `npm test` must stay green.
- New articles go in `content/information/` as markdown with `title` and `date`
  front matter, and must be added to the `want` array in
  `test/content/frontmatter.test.js` — that test asserts an exact file list and
  will fail otherwise. This is deliberate; it is the reminder to update the
  list.
- Anything editable by a non-technical editor must round-trip through Pages CMS.
  New front matter fields need matching entries in `.pages.yml` or editors will
  silently strip them on save. Every plan that adds a field must also add it
  there.
- PDFs are built with WeasyPrint from self-contained HTML with inline styles and
  inline SVG, monochrome-first, verified against black-and-white laser output.
  Hatching, not gray fill. Shape-based encoding, not color.
- Two pages, Letter, two-sided, flip on long edge, is the hard constraint on
  every print card. Content gets cut to fit; the constraint does not move.

---

## Known open items carried forward

These predate this audit and remain unresolved. Each is assigned to a plan.

- **Vermont's 4-man punt alignment** — plan 3, Task 4. Blocked on verification.
- **Good/no-good ruling responsibility on field goals in a 4-man crew** —
  plan 3, Task 4. Blocked on verification.
- **VPA play clock adoption status** — plan 1, Task 2. Blocked on verification.
- **Stylesheet drift between cards 1–2 and cards 3–5** — the first two topic
  cards use an older stylesheet with smaller body type. Plan 3, Task 6.
- **`information-for-new-folks.md` contains a published placeholder** — the line
  `?You will be provided a physical rule book during training?` is live on the
  site. Plan 2, Task 2 resolves it.

---

## What "done" looks like

An official new to Vermont can, from this site alone:

1. Find out how to become an official here, what it costs, and who to email.
2. Learn what Vermont changes about the NFHS rule set before their first game.
3. Print a crew card for their position and a topic card for their assignment.
4. Look up a signal, a penalty enforcement spot, or an equipment ruling on a
   phone in a parking lot with one bar of service.
5. Know when the next meeting is and what the season calendar looks like.
6. Tell, on every page, what rules year it reflects and when it was last checked
   against Vermont's own guidance.

None of those six are true today. Items 2 and 6 are plan 1; item 1 is plan 2;
items 3 and 4 are plan 3; items 4 and 5 are plan 4.
