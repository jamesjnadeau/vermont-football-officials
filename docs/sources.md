# Sources

Where the facts on this site came from, and when someone last checked them.

The VPA's own documents are public and current: the 2026 Football Guide and the
high school Athletic Policies are both linked from
[vpaonline.org/athletic-guides-rules/](https://vpaonline.org/athletic-guides-rules/),
and every Vermont page on this site is written from them. What those documents
do not cover — dues, the assignor process, exam requirements, commissioner
contacts — is internal to the VFOA and appears nowhere public. That part stays
gated: someone with VFOA standing supplies or confirms the fact before a page
states it.

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
| VPA Football Guide (2026) | [Google Doc linked from vpaonline.org/athletic-guides-rules/](https://docs.google.com/document/d/1m_DX_Z5mkQxssWG9zO6k5yTXk_xfeEYa/edit) | 2026-08-27 | Vermont amendments, fees, calendar, playoffs, points of emphasis |
| VPA Athletic Policies, High School | [Google Doc linked from the same page](https://docs.google.com/document/d/1_DMlEHHX3zIzO2jgqzaXLv2Puklx-o4y7IriQtRjQ0I/edit) | 2026-08-27 | Lightning rule, ejection suspensions, assault on officials, protests |
| **VFOA bylaws / member handbook** | | **needed** | Dues, membership, discipline |
| **VFOA assignment process** | Currently oral only — the officer answers in the tables below | 2026-08-27 | Assignor, availability, turnbacks |
| OHSAA Gold Book "Brief & Concise" (2026) | [ohsaafb.com — Gold Book handbook](https://www.ohsaafb.com/mechanics/2018-07-15-ohsaa-goldbook-approved-football-officiating-mechanics-regulations-standards-handbook/) | 2026-08-27 | Crew and position mechanics, crews of 4 and 5 |
| SDCFOA Clock Administration | [sdcfoa.org/clock-administration](https://www.sdcfoa.org/clock-administration) | | Clock operator reference |
| VFOA 7-man mechanics deck (Justin Fortier) | `/uploads/7-man-mechanics-2022.pdf` | 2022 | 7-man mechanics |

The row still in bold is the one thing the site cannot reach. The VFOA's own
bylaws and handbook are not published anywhere; dues, discipline and the
membership process come from the officer answers in the tables below, which is
why those rows say "Personal Knowledge" rather than naming a document.

**On the VPA rows:** the football page at `vpaonline.org/athletics/football/`
now 404s. Both documents live on
[Athletic Guides & Rules](https://vpaonline.org/athletic-guides-rules/) as
Google Docs, and both export as plain text by appending `/export?format=txt` to
the document URL — that is how the 2026 editions were read on 2026-08-27. The
football guide is headed "2026 FOOTBALL GUIDE"; check that heading first each
August, because the URL does not change between editions.

**On the VPA sports calendar:** the spreadsheet linked from the same page was
approved by VSADA on 2025-01-14 and still carries 2025 dates. It disagrees with
the 2026 Football Guide, and the guide wins. Do not date the season calendar
page from the spreadsheet.

**On the Gold Book row:** the URL's slug carries a 2018 date because that is
when OHSAA first published the page, not the edition it serves. **Resolved
2026-08-27:** the page serves `2026 Gold Book.pdf`, whose cover reads "Ohio
High School Athletic Association / 2026 / Approved FB Officiating Mechanics,
Regulations, & Rules Philosophies · Handbook / 'The Gold Book'", signed and
dated 5/24/26. The section the ten cards were written from — "Mechanics for 4,
5, or 6 Officials on a Crew: Brief & Concise" — is dated 5/22/26 inside that
edition. The `source: ... (2026 edition)` front matter on all ten cards is
correct as written; no correction needed.

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
| `clock-officials-cheat-sheet.md` | SDCFOA Clock Administration, plus the 2026 VPA Football Guide for the point differential clock | 2026 | 2026-08-27 |
| `7-man-mechanics.md` | VFOA 7-man deck, 2022 | | |
| `football-rules-summary.md` (Cliff Notes) | 2025 NFHS Football Rules Book — named in the page title, no front matter | 2025 | 2026-07-26 |
| `information-for-new-folks.md` | Email from Bryan Fortier, 2022 — not re-checked since | | |
| `foul-weather-procedures.md` | VPA Athletic Policies, High School — "VPA Lightning Rule"; NFHS rule 3-1-5 for the suspension procedure | 2026 | 2026-08-27 |
| `recommend-reading.md` | No external source — a link list | — | — |
| `vermont-rules-and-policies.md` | 2026 VPA Football Guide | 2026 | 2026-08-27 |
| `game-day-administration.md` | 2026 VPA Football Guide | 2026 | 2026-08-27 |
| `ejections-and-reporting.md` | 2026 VPA Football Guide and VPA Athletic Policies, High School | 2026 | 2026-08-27 |
| `season-calendar.md` | 2026 VPA Football Guide | 2026 | 2026-08-27 |
| `clock-timing-crew-card.md` | OHSAA Gold Book (2026), plus the 2026 VPA Football Guide for the point differential clock | 2026 | 2026-08-27 |

`test/content/frontmatter.test.js` requires all three of `ruleYear`, `source`
and `verified` on the four Vermont pages, and they now carry them.

**The card PDFs cannot be rebuilt.** `static/uploads/` holds ten card PDFs and
the clock operator sheet, and the repo holds no HTML sources for any of them —
`find . -name '*.html'` outside `node_modules` and `_site` returns nothing.
WeasyPrint is not installed either. So when an article's body changes, its PDF
goes stale and there is no way to regenerate it from this repository. That is
the finding plan 3's Task 1 Step 1 anticipated, and it blocks plan 1's Task 7
Step 5. Until the sources are reconstructed under `docs/cards/`, an article
whose PDF is behind says so above the download link.

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
| 21 | Season shape: when preseason meetings start, when the first games are, when the season ends. Becoming an Official currently says only "through the fall". | Becoming an Official | Partly answered. The playing season is fixed by the guide — practice may start Monday 10 August 2026, the regular season ends Saturday 14 November 2026, and the [season calendar](../content/information/season-calendar.md) carries the dates. **VFOA's own meeting dates are still open**: item 7 says three or four pre-season meetings, at least one in person, but not when. | 2026 VPA Football Guide, §II.1 and §VI | 2026-08-27 |
| 22 | How many high school programs the association covers, and roughly how many games an official works in a season. | Becoming an Official ("what a season looks like in hours") | | | |
| 23 | Minimum age to register, if there is one. Omitted from the Common Questions section for now. | Becoming an Official | | | |
| 24 | Youth and freshman game fees. Only varsity ($97.50) and JV ($75.00) are published. | Becoming an Official; Getting Assigned | Still open, and the guide will not answer it — §II.5 sets varsity and JV only. Sub-varsity below JV is not a VPA fee. | | |
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
| Officials' fees, varsity $97.50 and JV $75.00 | 2026 VPA Football Guide §II.5 — independently confirms officer answer 16 | 2026-08-27 |
| Suspended and cancelled game fees, and the two-hour notice window | 2026 VPA Football Guide §II.6 | 2026-08-27 |
| The 35/42-point differential running clock, with its wind, stop and restart lists | 2026 VPA Football Guide §III.8 | 2026-08-27 |
| Sub-varsity 12-minute quarters and the two-inning overtime cap | 2026 VPA Football Guide §III.6 and §III.2 | 2026-08-27 |
| The pregame timeline and the captains-only rule | 2026 VPA Football Guide §III.7 and §II.4 | 2026-08-27 |
| Scoreboard clock is official when used; the 30-minute clock operator meeting | 2026 VPA Football Guide §III.5 | 2026-08-27 |
| The varsity ejection review workflow and its noon-Monday deadline | 2026 VPA Football Guide §III.3 | 2026-08-27 |
| The two-ejection Activities Standards Committee threshold, 2026 season | 2026 VPA Football Guide §III.3 note | 2026-08-27 |
| One-game ejection suspension in football; second ejection ends the season | VPA Athletic Policies, High School — Student/Coach Ejection Rule | 2026-08-27 |
| Assault on officials by coaches and by students | VPA Athletic Policies, High School | 2026-08-27 |
| The 30-minute lightning pause and its reset on any new thunder | VPA Athletic Policies, High School — VPA Lightning Rule | 2026-08-27 |
| 2026 season dates, playoff pairings, semifinals, and the championship site | 2026 VPA Football Guide §II.1, §VI | 2026-08-27 |
| This season's points of emphasis | 2026 VPA Football Guide §I | 2026-08-27 |

---

## Open against the VPA documents

Read out of the 2026 guide on 2026-08-27 and still unresolved. These are
different in kind from the VFOA questions above: nobody is withholding them,
the documents simply do not address them.

| # | Question | Feeds | Status |
| --- | --- | --- | --- |
| 28 | **Has Vermont adopted a visible play clock?** The 2026 guide never mentions one. Absence is not adoption, so the Vermont page states that the guide is silent and that the play clock is therefore kept on the field under NFHS timing. Confirm with the rules interpreter and, if a stadium runs a visible play clock, say who operates it. | Vermont Rules & Policies; Clock cards | Guide silent |
| 29 | **How does the crew start the ejection review?** §III.3 says both VFOA commissioners and the rules interpreter review every varsity ejection and deliver a determination to the VPA and the VIFL Executive Secretary by noon the Monday after. It does not say who the crew notifies, on what form, or by when — the crew's half of that workflow is VFOA-internal. | Ejections & Reporting | VFOA-internal |
| 30 | **Who is the VIFL Executive Secretary, and how is the VFOA rules interpreter reached?** Named as roles in the guide, not as people. No name goes on the site until item 20's consent rule is satisfied. | Ejections & Reporting; contact page | Needs consent |
| 31 | **Do officials' fees change for playoff games?** §VI.4 says the VPA pays all game officials' fees in the tournament, but does not say at what rate. | Vermont Rules & Policies; Getting Assigned | Guide silent |
| 32 | **The mileage rate.** Officer answer 17 says the IRS standard rate, reimbursed at season's end. The guide mentions mileage only in the suspended/cancelled fee rules and never sets a rate. Confirm the figure the VFOA actually pays. | Vermont Rules & Policies; Getting Assigned | Guide silent |

---

## Annual re-verification

Every August, before week 1:

1. Obtain the new VPA Football Guide and NFHS rules book, and update **Obtained**
   in the primary sources table. The guide and the athletic policies are Google
   Docs on
   [Athletic Guides & Rules](https://vpaonline.org/athletic-guides-rules/);
   appending `/export?format=txt` to a document URL gives the whole thing as
   plain text. The URL does not change between editions, so read the heading —
   if it does not name the new year, the new edition is not up yet.
2. Walk the page → source map top to bottom.
3. For each page: re-read it against its source, update `ruleYear` and
   `verified`, fix what changed, and say what changed in the commit message.
4. Rebuild any PDF whose source article changed.
5. Run `npm test` — the 400-day check catches any page that was skipped.

The 400-day window is deliberately longer than a year: a page verified in
August passes through the following August without failing mid-season, and
fails soon after if that year's pass never happened.
