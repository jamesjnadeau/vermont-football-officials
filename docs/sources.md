# Sources

Where the facts on this site came from, and when someone last checked them.

Most of what the site still needs cannot be written from public sources. The VPA
publishes a football guide, but the copy reachable on the web mixes 2024 and
2025 material, and some of what's needed — dues, the assignor process, exam
requirements, commissioner contacts — is internal to the VFOA and appears
nowhere public. So content is gated: someone with the current guide and VFOA
standing supplies or confirms a fact before a page states it.

**Nothing on this list may be published until it is answered here with a source
and a date.** A wrong fee on a recruiting page is worse than a missing one, and
a wrong email address loses the recruit silently.

## How to use this file

Fill in **Answer**, **Source** and **Checked** for each item. Source means where
it actually came from — "2026 VPA Football Guide p. 14", "James Nadeau, email
2026-09-02", "voted at the August 2026 meeting" — not "James said so".

Pages that carry these facts should also set the `source` and `verified` front
matter, which renders as a provenance footnote and fails the build once the
verified date is more than 400 days old.

The two tables directly below are the register proper: what the site is built
from, and which page rests on which document. The question tables after them are
the open gates — facts nobody has supplied yet.

---

## Primary sources

The documents the site is built from. **Obtained** is the date someone last had
the edition in hand; blank means the site does not hold it and any page needing
it is blocked.

| Source | Where | Obtained | Covers |
| --- | --- | --- | --- |
| NFHS Football Rules Book (2025) | Via [nfhs-rules-converter](https://github.com/jamesjnadeau/nfhs-rules-converter) | 2026-07-26 | Baseline rules; cliff notes; quizzes 001–007 |
| NFHS Football Case Book (2025) | Same repository | 2026-07-26 | Quiz rulings 001–005 |
| NFHS Football Officials Manual | Not held directly — reached secondhand through the OHSAA Gold Book | | Baseline mechanics |
| **VPA Football Guide** | [vpaonline.org/athletics/football/](https://vpaonline.org/athletics/football/) | **needed** | Vermont amendments, fees, calendar, playoffs, points of emphasis |
| **VFOA bylaws / member handbook** | | **needed** | Dues, membership, discipline |
| **VFOA assignment process** | Currently oral only — the officer answers in the tables below | 2026-08-27 | Assignor, availability, turnbacks |
| OHSAA Gold Book "Brief & Concise" (2026) | [ohsaafb.com — Gold Book handbook](https://www.ohsaafb.com/mechanics/2018-07-15-ohsaa-goldbook-approved-football-officiating-mechanics-regulations-standards-handbook/) | 2026-08-27 | Crew and position mechanics, crews of 4 and 5 |
| NVYFL 5/6 Tackle Rules (2026) | League PDF, supplied by James Nadeau; published at `/uploads/nvyfl-5-6-tackle-rules-2026.pdf` | 2026-08-27 | Youth 5/6 game rules |
| NVYFL 7/8 Tackle Rules (2026) | League PDF, supplied by James Nadeau; published at `/uploads/nvyfl-7-8-tackle-rules-2026.pdf` | 2026-08-27 | Youth 7/8 game rules |
| NVYFL 5/6 and 7/8 Tackle Rules (2025) | League PDFs, supplied by James Nadeau; published at `/uploads/nvyfl-{5-6,7-8}-tackle-rules-2025.pdf` | 2026-08-27 | Superseded; kept for the archived 2025 page |
| SDCFOA Clock Administration | [sdcfoa.org/clock-administration](https://www.sdcfoa.org/clock-administration) | | Clock operator reference |
| VFOA 7-man mechanics deck (Justin Fortier) | `/uploads/7-man-mechanics-2022.pdf` | 2022 | 7-man mechanics |
| NFHS Official Football Signals chart (2026) | Redrawn as stick figures in `tools/signal-svgs/`, supplied by James Nadeau | 2026-08-28 | Signal numbers 1–47, chart captions, the timing and administrative numbers |

The three rows in bold are what the Vermont rules and policies plan is waiting
on. Until the VPA guide row has an edition and a date, no page may state a
Vermont fee, date, or rule amendment.

**On the Gold Book row:** the URL's slug carries a 2018 date because that is
when OHSAA first published the page, not the edition it serves — James supplied
it as the 2026 source. The ten cards now carry that edition in their `source`
front matter on the strength of that identification, not a check against the
document: the cards were written on 2026-08-26 from "the OHSAA Gold Book Brief &
Concise" with no edition recorded at the time. Confirm the edition string
printed on the document and, if it is not 2026, correct all ten.

**On the NVYFL rows:** these are league documents, not VPA or NFHS ones, and
they say so on the page — both rule sets supplement the NFHS book rather than
replace it. The two 2026 pages were transcribed from the PDFs on 2026-08-27
and diffed against the 2025 pair the same day; the change list on the 2026
page is the output of that diff. All four PDFs are served from
`/uploads/` and linked at the top of their year's page, so a reader can check
a transcription against the document it came from; where the two disagree the
PDF governs, and the pages say so. Ask the league for the next edition each
summer — the 2026 5/6 document is titled a Rulebook and the 7/8 one is dated
July 2026, so the two levels are not always revised together.

## Draw-a-play presets

`lib/draw/presets.js` ships two kinds of preset, sourced two different ways.

**Situations** (Kickoff, Field Goal, Goal Line, Punt, Spot) carry officials,
and their positions are not a citation problem — they were extracted directly
from this site's own committed diagrams by a throwaway script kept out of the
repo. The five scenes do not all stand on equally solid ground, and the
difference is stated here rather than smoothed over:

- **Kickoff, Field Goal, Goal Line, Punt** are each drawn on six or five
  agreeing sources — the position card for every one of the five officials,
  plus a crew-of-5 card where one exists (`static/images/position-cards/*/
  kickoff.svg`, `.../field-goal.svg`, `.../goal-line.svg`, `.../punt.svg`,
  and the crew cards in `static/images/kicking-plays/`). Every card for a
  given scene agreed exactly (0 spread), and all 98 extracted points
  (officials plus players, across the four scenes) round-trip to their
  original SVG coordinate. This is the same standard the original three
  scenes shipped on; Punt was extracted and verified afterward, to the
  identical method, once the same six-source pattern was confirmed to hold
  for it too.
- **Spot (between-downs)** rests on exactly one diagram —
  `static/images/between-downs/getting-it-back-crew-of-5.svg` — because no
  position cards exist for this scene at all. Its five officials' positions
  are extracted correctly from that one drawing and round-trip exactly, but
  nothing corroborates the drawing itself: a single mislabeled mark or
  authoring slip in that one file would ship unnoticed, which is not true of
  the other four scenes. Say so before treating Spot's positions as equal to
  Kickoff's. Spot can move onto the same footing as the others the day a
  second, independently-drawn source of this scene exists to cross-check
  against.

  The source diagram also draws one player marker, an open circle with no
  kicking/receiving distinction (this scene is the ball being reset between
  downs, not a kicking play, so the diagram draws no team-side split for it).
  That marker is **not shipped** in the Spot preset: `state.js` and
  `markers.js` know exactly two player kinds, and rendering this one through
  either would draw it as a receiving-team player — asserting a team side the
  source never states, to save adding a third player kind for one dot. Spot
  ships its five officials only.

**Formations** (Wing-T, Trips, Power I, Shotgun) carry no officials — they are
an offense-only starting point, not this association's mechanics, and
`app.js` labels and colours their buttons differently from Situations for that
reason. Nothing in this repo holds them, so each is built from a named public
source. None of these sources publish a single diagram with every position's
exact coordinates; where a source gives no number, the formation uses a
generic convention noted below rather than a second source's number, so the
whole formation traces to one citation.

A fifth Formation preset, **Empty (scrimmage)**, places no players at all — it
is the run/pass crop with no formation assumed, for a play that doesn't start
from a named look. It carries nothing to cite and needs no source; it is
listed here so its absence from the table below reads as "nothing to source,"
not as a gap nobody noticed.

**The shipped horizontal positions are these sourced alignments doubled.**
Every distance from the middle of the field is twice the number the source
gives. That is a legibility decision and not a claim about real alignment: a
guard splitting the cited "two feet" from the centre is a quarter of the width
of the mark that draws him at diagram scale, so a truthful line renders as one
smear. Doubling separates the marks while keeping each formation's shape — who
is inside whom, which side is strong. Depths down the field are untouched. The
numbers below are the sourced ones, so the two can always be compared.

The **Trips** receivers are the one exception. Doubling their 6-yard spacing
would put the outside receiver 36 yards from the middle of the field — nine
yards out of bounds — and 12-yard gaps would also exceed the "5 to 10 yards"
its own source states. They are widened to 6.5-yard gaps instead, which fits
both constraints, with the outermost 1.67 yards inside the sideline.

| Formation | Source | What it supplied |
| --- | --- | --- |
| Wing-T | [wingt-coach.com — Positions, Formations, and Alignment](https://wingt-coach.com/wing-t-basics-positions-formations-and-alignment/) | Quoted numbers: guard-to-centre and lineman-to-lineman splits ("two feet"), the fullback's depth ("heels four yards behind the football"), the wingback's alignment ("1 yard deep and 1 yard outside the TE"), and the halfback's ("same depth as the FB..., outside foot of the tackle"). |
| Power I | [footballadvantage.com — Power I Formation Offense](https://footballadvantage.com/power-i/) | Quoted backfield depths: fullback "about three steps directly behind the Quarterback" (read here as ~3 yards — a judgement call, noted in `presets.js`), running back "about two yards directly behind the Fullback", H-back "at the same depth as the Fullback, about three yards" to a side. Also confirms this formation runs two tight ends and no wide receiver. |
| Shotgun | [footballadvantage.com — Shotgun Formation Offense](https://footballadvantage.com/shotgun-formation/) | Quoted numbers: quarterback "5-7 yards behind the center" (the preset uses 5), running back "about two yards directly to the left or right of the Quarterback". Receiver splits are not given by this source and use the generic convention below. |
| Trips | [northeastern18.com — Understanding Trips Formation](https://northeastern18.com/trips-formation-spacing-routes-player-roles/) for spacing ("receivers should aim for a distance of about 5 to 10 yards apart"); [cfbtrack.com — Trips Formation](https://cfbtrack.com/football-formations/offense/trips-formation) for the personnel naming (a single receiver isolated backside, three receivers to the trips side) | Receiver spacing and the backside-isolation shape; exact per-receiver coordinates are this page's own placement within the cited 5–10 yard spacing, not a further number from either source. |

**Generic convention, used where a formation's source gives no line split or
receiver split:** offensive linemen at roughly a yard's gap centre-to-centre,
and a receiver off the line of scrimmage a yard deeper than one on it ("a step
or two," in the Shotgun source's own words). This is ordinary football
knowledge repeated across the coaching sources above and not itself drawn from
one citable diagram; it is used only to fill a gap a formation's own source
leaves open, never in place of a number a source states.

## Page → source map

Which page rests on which document, and when a human last read one against the
other. Pages that set `source` in front matter print this publicly as a
footnote; the rest state it in prose in the page body.

| Page | Source | Rules year | Verified |
| --- | --- | --- | --- |
| `becoming-an-official.md` | VFOA officers, recorded below | — | 2026-08-27 |
| `getting-assigned.md` | VFOA officers, recorded below | — | 2026-08-27 |
| `your-first-season.md` | VFOA officers, recorded below | — | 2026-08-27 |
| Crew cards (5) and position cards (5) | OHSAA Gold Book "Brief & Concise" (2026), following the NFHS Officials Manual | — | 2026-08-26 |
| `nvyfl-youth-football-rules-2026.md` | 2026 NVYFL 5/6 Rulebook and 7/8 Game Rules | 2026 | 2026-08-27 |
| `nvyfl-youth-football-rules-2025.md` | 2025 NVYFL 5/6 and 7/8 Game Rules — archived, superseded | 2025 | 2026-08-27 |
| `official-signals.md` | 2025 NFHS Football Rules Book — penalty summary pp. 94–95 and the PENALTY statements in Rules 3–10. The drawings, their captions and the Section 5 timing numbers follow the 2026 signal chart | 2025 | 2026-08-28 |
| `clock-officials-cheat-sheet.md` | SDCFOA Clock Administration — stated in prose, no front matter | | |
| `7-man-mechanics.md` | VFOA 7-man deck, 2022 | | |
| `football-rules-summary.md` (Cliff Notes) | 2025 NFHS Football Rules Book — named in the page title, no front matter | 2025 | 2026-07-26 |
| `information-for-new-folks.md` | Email from Bryan Fortier, 2022 — not re-checked since | | |
| `foul-weather-procedures.md` | **No source stated** — states a 30-minute lightning pause; check it against the VPA guide when that lands | | |
| `recommend-reading.md` | No external source — a link list | — | — |
| `vermont-rules-and-policies.md` | Blocked — VPA Football Guide | | |
| `game-day-administration.md` | Blocked — VPA Football Guide | | |
| `ejections-and-reporting.md` | Blocked — VFOA ejection workflow | | |
| `season-calendar.md` | Blocked — VPA Football Guide | | |

The last four pages do not exist yet. `test/content/frontmatter.test.js` already
requires all three of `ruleYear`, `source` and `verified` on them, so they bind
the moment the files land.

---

## VFOA membership facts

Gathered for
[`2026-08-27-becoming-an-official.md`](./superpowers/plans/2026-08-27-becoming-an-official.md).
The "Feeds" column is the page that is blocked until the row is answered.

### Membership and registration

| # | Question | Feeds | Answer | Source | Checked |
| --- | --- | --- | --- | --- | --- |
| 1 | How does someone actually join the VFOA? Is there a form, an application window, a meeting they show up to, or an email to a specific person? | Becoming an Official (step-by-step) | Please reach out to the current acting director, you can do that by using this sites contact page. | Personal Knowledge | true |
| 2 | Dues: current amount, when they're due, and confirmation of the standing practice that first-year officials don't pay them. | Becoming an Official (what it costs) | There is a registration fee of $25 for our background check and events system. Also around $100 for membership dues, but it's waived the first year, and usually taken out of your millage reimbursement check after that. |  Personal Knowledge  | true |
| 3 | Background check: required or not, who runs it, who pays, how often it renews. | Becoming an Official (what's required) | Required, and is performed by our registration and assignment software when you sign up. | Personal Knowledge | true |
| 4 | Insurance: what coverage membership confers, and what it does not. | Becoming an Official (what's required) | Insurance is part of your registration fee of $25 for the year. It covers any liability for you officiating a game. | Personal Knowledge | true |
| 5 | Required NFHS Learn courses **for officials**. The VPA lists Implicit Bias as mandatory for officials as well as coaches; the published requirements are written mostly about coaches, so confirm the full current list for officials specifically. | Becoming an Official; Your First Season | We are only required to take concussion training, we are not required to take an Implicit Bias class that I'm aware of | Personal Knowledge | True |
| 6 | Rules exam: is there one, when, what score is passing, and what happens if you miss it. | Becoming an Official; Your First Season | There is no rules exam, but we do use quizes to help test knowledge. This is usually a group activity. | Personal Knowledge | True |
| 7 | Meeting attendance: how many, when, where, and whether attendance affects assignments or playoff eligibility. | Becoming an Official; Getting Assigned | There are usually 3 to 4 pre-season meetings, at least one in person. Presence is mandatory. Most meetings are virtual, especially during the season. | Personal Knowledge | true |
| 8 | Rule book: are officials given a physical rule book, do they buy their own, or does the association provide the app subscription? | Resolves the `?You will be provided a physical rule book during training?` placeholder that is **live on the site today** in `information-for-new-folks.md` | Rulebooks are provided as part of your membership dues. This includes print and digital copies | Personal Knowledge | True |

### Assignment and progression

| # | Question | Feeds | Answer | Source | Checked |
| --- | --- | --- | --- | --- | --- |
| 9 | Who is the assignor, and what platform is used — Arbiter, RefTown, something else, or email? | Getting Assigned | Arbiter is assignment platform, and our organizations leadership manages assignments. We try to match folks to games at their skill level, if you are ready for JV, we'll put you in a JV game, same for varsity. | Personal Knowledge | true |
| 10 | How is availability submitted, and what's the deadline? | Getting Assigned | Please keep your availability up to date in Arbiter, there is no hard deadline, but please have it in a week before the season starts. | Personal Knowledge | true |
| 11 | Turnback policy: how to give a game back, by when, who to notify, and the etiquette and consequences. | Getting Assigned | You can accept or decline games through the Arbiter system, it's expected that you do so as quickly as possible. The expectation is for you to act in a professional manor and notify folks through the proper channels if you have issues. We understand people are human and make mistakes, do all you can to remedy problems you create and you'll be fine. | Personal Knowledge | True |
| 12 | The progression youth → freshman → JV → varsity. What actually determines when someone moves up — seasons served, evaluation, the commissioners' judgement, a crew chief recommendation? | Your First Season; Getting Assigned | You will be assigned games that match your skill level. If you can do Varsity, we will assign you to varsity games. Your knowledge of the mechanics, rules and character determine your eligibility. | | |
| 13 | Playoff assignment criteria: what makes an official eligible. | Getting Assigned | Seniority usually holds out here, but we prefer to give new folks an opportunity to have playoff games each year to share the experience with everyone who is able. | Personal Knowledge | True |
| 14 | Evaluation and mentoring: is there a formal program, an assigned mentor, film review, observed games? | Your First Season | We have several knowledgeable mentors who will go out of their way to help you learn. Just like the game, it's a team effort, and we support each other to help grow our organization. | Personal Knowledge | True |
| 15 | How are crews formed? Can an official request or avoid particular crews, and how is a white hat designated? | Getting Assigned | Crews are formed based on needs of the game and compatibility of members. We try to rotate the crews each week so folks become familiar working with everyone. | Personal Knowledge | True |

### Pay and contacts

| # | Question | Feeds | Answer | Source | Checked |
| --- | --- | --- | --- | --- | --- |
| 16 | Current game fees, varsity and sub-varsity. | Becoming an Official; Getting Assigned | JV: $75, Varsity: $97.50 | Personal Knowledge | True |
| 17 | Mileage: rate, how it's calculated, how it's claimed. | Becoming an Official; Getting Assigned | You fill out a form listing your milage and for what game. You get paid back at the end of the season based on the standard milage reimbursement from the IRS. | Personal Knowledge | True |
| 18 | How and when officials are paid — by the school on site, by the VPA for playoffs, direct deposit, check. | Getting Assigned | You are paid through the Arbiter system, which you can withdraw your payments out via several methods. | Personal Knowledge | True |
| 19 | Tax treatment: the 1099 threshold and who issues it. To be stated factually; the site does not give tax advice. | Getting Assigned | Arbiter holds the 1099, this site does not give tax advice. | Personal Knowledge | true |
| 20 | The contact list: commissioners, rules interpreter, assignor, treasurer, mentor coordinator, and who handles new-member inquiries. | Becoming an Official; Getting Assigned; contact page | | | |

**On item 20:** confirm each person is willing to be listed publicly before
publishing a name or an address. No contact goes on the site unconfirmed, and
none is invented as a placeholder.

### Still open

Written around rather than guessed at. The pages are complete without these; each
would sharpen a specific paragraph.

| # | Question | Feeds | Answer | Source | Checked |
| --- | --- | --- | --- | --- | --- |
| 21 | Season shape: when preseason meetings start, when the first games are, when the season ends. Becoming an Official currently says only "through the fall". | Becoming an Official | | | |
| 22 | How many high school programs the association covers, and roughly how many games an official works in a season. | Becoming an Official ("what a season looks like in hours") | | | |
| 23 | Minimum age to register, if there is one. Omitted from the Common Questions section for now. | Becoming an Official | | | |
| 24 | Youth and freshman game fees. Only varsity ($97.50) and JV ($75.00) are published. | Becoming an Official; Getting Assigned | | | |
| 25 | Rough all-in equipment cost for a first-year official. The pages state the outlay is real and quote the association's offer to help, but no figure. | Becoming an Official; Equipment | | | |
| 26 | Item 12 (progression) has an answer but no Source or Checked entry — confirm and date it. | Your First Season | | | |
| 27 | Equipment page content (brands, item list, sourcing sites) has not been re-checked since Bryan Fortier's original email in 2022. It carries no `verified` front matter for that reason. | Equipment | | | |

---

## Already sourced

| Fact | Source | Checked |
| --- | --- | --- |
| Quiz questions 001–005 | 2025 NFHS Football Rules Book and Case Book, via [nfhs-rules-converter](https://github.com/jamesjnadeau/nfhs-rules-converter) | 2026-07-26 |
| Quiz questions 006–007 (rookie definitions) | 2025 NFHS Football Rules Book, Rules 1, 2, 6 and 7, via the same repository | 2026-08-27 |
| Cliff Notes — 2025 NFHS Football Rules Book | Same repository | 2026-07-26 |
| Equipment guidance in `information-for-new-folks.md` | Email from Bryan Fortier, generalised by James Nadeau | 2022-10-09 |

---

## Annual re-verification

Every August, before week 1:

1. Obtain the new VPA Football Guide and NFHS rules book, and update **Obtained**
   in the primary sources table.
2. Walk the page → source map top to bottom.
3. For each page: re-read it against its source, update `ruleYear` and
   `verified`, fix what changed, and say what changed in the commit message.
4. Ask the NVYFL for that year's 5/6 and 7/8 rules, publish them as a new
   year page, diff them against the outgoing year, and move the outgoing
   page to archived.
5. Rebuild any PDF whose source article changed.
6. Run `npm test` — the 400-day check catches any page that was skipped.

The 400-day window is deliberately longer than a year: a page verified in
August passes through the following August without failing mid-season, and
fails soon after if that year's pass never happened.
