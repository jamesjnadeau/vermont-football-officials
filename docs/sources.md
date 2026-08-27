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
| SDCFOA Clock Administration | [sdcfoa.org/clock-administration](https://www.sdcfoa.org/clock-administration) | | Clock operator reference |
| VFOA 7-man mechanics deck (Justin Fortier) | `/uploads/7-man-mechanics-2022.pdf` | 2022 | 7-man mechanics |

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
4. Rebuild any PDF whose source article changed.
5. Run `npm test` — the 400-day check catches any page that was skipped.

The 400-day window is deliberately longer than a year: a page verified in
August passes through the following August without failing mid-season, and
fails soon after if that year's pass never happened.
