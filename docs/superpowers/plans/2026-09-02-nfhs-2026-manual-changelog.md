# 2026–27 NFHS Manual Alignment — Change Log

**What this was.** The *2026 and 2027 NFHS Football Game Officials Manual* is now
the source of truth for every mechanics claim on the site. Every mechanics page
was previously written from a secondary source — the OHSAA Gold Book for the
crew and position cards, a 2022 VFOA slide deck for 7-man, SDCFOA for the clock
sheet. Those follow the manual but are not it, and where they paraphrase they
sometimes paraphrased an older edition.

**Read the audit for the evidence:**
`2026-09-02-nfhs-2026-manual-audit.md`. **Read the plan for the method:**
`2026-09-02-nfhs-2026-manual-alignment.md`.

Twelve commits, 205 files. `npm test` green throughout — build, field, draw,
card, content and output suites, html-validate over every built page, linkinator
over every internal link.

---

## Part 1 — Corrections that change what a crew does on the field

These are ordered by how much they'd change your night. Every one is cited to
the manual's own section and print page.

### 1. The two wings' punt release was backwards

**§4.8 p. 149 · §3.8 p. 78**

The cards had the **Line Judge** holding the line until the kick crossed and the
**Head Line Judge** pausing to read a block. It is the other way round: the Head
Line Judge stays on the line until the kick crosses the neutral zone — **and he
is the one who rules whether it crossed** — while the Line Judge releases on the
snap and works the space between the neutral zone and the receivers. The
Umpire's spot follows from this: he favours the Line Judge's sideline precisely
*because* the Line Judge leaves at the snap.

### 2. In a crew of four the deep punt official is the Line Judge, not the Umpire

**§3.7 p. 72 · §3.8 p. 78**

The card gave the Umpire the whole deep job — "everything the 5-man Back Judge
does, PSK bag and goal line included." The manual gives it to the **Line Judge**:
7 to 10 yards wider than and in front of the deepest receiver, with every deep
receiver, kicks down the middle and into his side zone, and getting to Team R's
goal line to rule momentum and touchback. The Umpire sits 10 yards deep
favouring the Line Judge's sideline. This is the largest single error found in
the crew-of-four material.

### 3. The Referee's scrimmage position, and why

**§4.7 p. 139 · §3.7 p. 69 · §1.5 p. 23**

| | Was | Is |
| --- | --- | --- |
| Side | The wide side — "you decide which side that is" | **The quarterback's passing-arm side** |
| Depth | 15 yards | **10 to 12 yards** |
| Width | 8 wide of the QB at 45° | **At least as wide as the tight end** |
| In the huddle | not stated | 10–15 from the line, 5 wide of the huddle, where the clock operator can see him |

This is why the manual has the Referee ask the head coach in pregame whether the
quarterback is right- or left-handed. The passer cushion changed with it: be wide
and deep enough that a pocket drop does not move you, and keep **at least a
10-yard buffer** if he rolls — the cards said five, ten on a roll.

### 4. The Umpire and Back Judge were on each other's sidelines on a free kick

**§4.7 p. 136, MechaniGram p. 137 · §1.6 p. 25**

The Umpire stands outside the sideline on R's free-kick line "on the side
opposite the chains", and the chains live opposite the press box — so he is on
the **press box** side and the Back Judge is on the Head Line Judge's. The cards
had both reversed. Also added: both wings must be on the **same yard line**.

### 5. The crew-of-five onside kick had three of five in the wrong place

**§4.7 p. 138**

The manual makes a box — Umpire and Head Line Judge on R's free-kick line, Line
Judge and Back Judge on K's, one per sideline — with the Referee in the middle
**deeper than the deepest receiver**, not on the goal line. The Umpire and both
wings carry a beanbag for K's first touching, and **anyone may kill the ball when
a prone player recovers, ten yards or not.** None of that was on the card.

### 6. Nobody stands under a post in a crew of four

**§3.7 pp. 73–74**

The card had the Umpire under one upright and a wing under the other. In a crew
of four the **Line Judge rules the kick**, in two alignments the card did not
carry at all:

- **Outside R's 15** — 5 yards behind and directly between the uprights, **sole
  judge of good or no good**. The Referee echoes it to the press box.
- **On or inside R's 15** — on the line 5–7 yards outside the offensive end, hard
  to the end line at the snap, ruling the **crossbar**. Thumbs-up if it clears,
  signals no good himself if it doesn't. **The Referee rules whether it went
  through the uprights.**

### 7. On a crew-of-five scoring kick, the deep officials are *beyond* the end line

**§4.7 p. 141 · §4.8 p. 150**

Beyond it, each behind his own upright — the Umpire on the press box side, the
Back Judge opposite (the cards had them swapped). The **Back Judge rules the
crossbar as well as his upright, and he is the one who whistles and signals**;
the Umpire confirms his upright to him rather than both signalling together. The
wings straddle the line of scrimmage, not the field numbers. And the Referee
**does** relay the result to the press box — his card said he never signals it.

### 8. The Line Judge holds the enforcement spot; the Head Line Judge walks it off

**§1.3 p. 20**

Both cards said "both wings walk it off." The manual splits them: the Head Line
Judge walks the yardage off on his sideline while the Umpire walks it in the
field; the Line Judge **holds the enforcement spot** until he is certain it was
done correctly.

### 9. Back Judge depth on a scrimmage down

**§4.7 p. 139**

Favouring the **strong side**, **20 to 25 yards** beyond the line and deeper than
the deepest defender. The cards said 17 between the uprights. On a punt he is
10–12 wider than and 2–3 behind the deepest receiver on the Head Line Judge's
side, not 8 wide and 5 deep on the wide side.

### 10. Two clocks, two operators, two officials

**§1.6 pp. 26–28**

The clock pages gave the Line Judge as the timer's contact for everything. He is
the **game** clock operator's contact and the crew's on-field backup clock. The
**play** clock operator is met by the **Back Judge**, or the **Referee** in a
crew of four.

---

## Part 2 — Rules and procedures the site did not carry

| Added | Where it went | Source |
| --- | --- | --- |
| An interrupted play clock is **never resumed — always reset to 25** | Clock Timing card, Line-to-Gain card | §1.6 p. 28 |
| First down inbounds: the **Umpire stands over the ball** until the Referee restarts the game clock and sees it start | Clock Timing card | §1.6 p. 28 |
| The play clock is **turned off** with under 25/40 seconds left in the quarter and the game clock running | Clock Timing card | §1.6 p. 28 |
| Signal 17's actual motion — arm straight up, palm up, pumped three times, "pushing the sky"; **both hands for 40** | Both signals pages | §1.6 p. 27 |
| The Referee checks **four players on each side of the kicker** | Kicking Plays card, Referee card | §4.7 p. 136, POE p. 8 |
| 2026 free-kick coverage: the widest **two** each side belong to the deepest sideline official; the rest to the restraining-line officials | Kicking Plays card, 7-man page | POE p. 8 |
| Beanbag the spot **where a scrimmage kick ends** — the PSK reference | Kicking Plays card | §4.8 p. 149 |
| The calling official notifies **both the Referee and the Head Line Judge** | Fouls card, enforcement guide | POE p. 5 |
| Dead-ball foul before the snap: **jog to the middle to report**, still watching for retaliation | Fouls card, enforcement guide | §1.3 p. 20 |
| Multiple flags: get together and agree **before any signal** | Fouls card, enforcement guide | §1.3 p. 20 |
| Teams are identified by **offence and defence**, not jersey colour | Fouls card, enforcement guide | §1.3 p. 20 |
| Microphone: preliminary without it, final signal with it, Referee owns the switch | Fouls card | §1.3 p. 21 |
| Relocate a badly thrown flag **at once** | Fouls card | §1.3 p. 22 |
| A dead-ball foul is a **four-or-five** step signal sequence; four when declined | Official Signals | §2.2 p. 50 |
| Forward progress: the sideline cases, the airborne case, and the pushed-back-runner judgment | Between Downs card | POE p. 6 |
| The spot belongs to **whoever can see the ball**, not to whose side it ended on | Between Downs card | §4.4 p. 127 |
| Legality of motion belongs to the official the player moves **away from** | Run & Pass card, 7-man page | §3.3, §4.3 |
| Crew-of-five key table by formation, and the crew-of-four end-of-line rule | Run & Pass card | §3.3 p. 56, §4.3 |

---

## Part 3 — Four new pages

**[Pregame Conference](/information/pregame-conference/)** — the manual devotes a
chapter to it (pp. 12–16) plus a section on what each official owes the field
before kickoff (§1.5); the site had neither, and an earlier plan already listed a
pregame script as missing. Carries the crew's conference list, the five things a
head coach must do, the questions worth asking him (including which arm the
quarterback throws with and which foot each kicker uses), and the per-position
duties in the 30 minutes before kickoff. Its tail carries two more short chapters
the site lacked: **jurisdiction** (p. 217 — authority runs through the Referee's
declaration of the end of the game and ends when *all* officials leave the visual
confines of the playing area) and the **postgame conference** (pp. 217–219).

**[Line-to-Gain Crew Card](/information/line-to-gain-crew-card/)** — §1.6 is
nearly two pages written *for the chain crew*, and the site had none of it. This
card is addressed to them and meant to be handed over fifteen minutes before
kickoff: conduct rules, the four-person crew and its jobs, the clip at the
intersection of the sideline and the 5-yard line nearest the trailing stake with
everything six feet back, dropping the chains on a play coming at you, the
reversal at the clip between quarters, the measurement sequence, the ball
helpers' duties, and both timers.

**[Crew Communication and When in Question](/information/crew-communication-signals/)**
— the site covered all forty-seven press-box signals and none of the ones a crew
gives itself. Separates the manual's **eight approved** crew signals from the
common unofficial ones, records who gives the five-second visible count, and adds
four things the site used without ever defining: the **halo principle**, **digger
mechanics**, the **umpire's two down indicators** and the finger code for the
previous snap's lateral position, and **radio protocol** including the silence
list. Plus the **"when in question"** table verbatim.

**Redirect stub** at the old `/information/linesman-position-card/`.

---

## Part 4 — "Head Linesman" is now "Head Line Judge"

**Definition of Terms, p. 9:** *"The Head Linesman position is now referred to as
Head Line Judge."* The manual's MechaniGrams letter the position **HL**.

- The article moved to `/information/head-line-judge-position-card/`; the old URL
  redirects.
- Diagrams moved to `static/images/position-cards/head-line-judge/`.
- The `/draw` tool's token mark is now `HL`. **Share links written before the
  rename still work** — `LM` is translated on the way in, with a test that proves
  it.
- Thirty-odd body references, five crew-card table headers and every diagram's
  accessible name.

**Nothing moved on the field.** He still works the sideline opposite the press
box and still runs the chains.

---

## Part 5 — The 7-man page

Vermont crews work four and five, so this page was corrected rather than
expanded, and its provenance made honest: the text now follows Part 5 of the
manual (pp. 183–216), and the linked PDF is labelled as the VFOA's 2022 deck
kept as the association's record. Corrected: free-kick positions and the new
keying scheme; onside duties (H and L go to **K's 45**, F and S rule the 10
yards, U and B rule K's line and the topped kick, and **nobody moves** until the
ball passes R's restraining line); goal line (F and S at the pylon from the 25 to
the 7, H and L from the 7 in, **B on the end line** from the 25 in — the deck
gave B the goal line outside the 25); measurements (the box goes to H and the
spare ball to B or L, not to S and F); scrimmage-play depths; and **fade and
reverse fade mechanics**, which were absent.

The page's photographs are still the deck's, so a diagram may show an older
alignment — the page now says so, and says the text wins.

---

## Part 6 — The diagrams became build output

This had to come first, because the 50 committed SVGs under `static/images/` had
no generator: **no diagram on the site could be corrected without hand-editing
coordinates.**

They are now rendered from `lib/field/scenes/` by `npm run diagrams`, guarded by
`test/field/generated.test.js`, which fails the build if a committed file drifts
from its scene or if a file exists that no scene produces. The 30 position-card
files collapse to **six scenes** rendered once per official.

**The port was verified mark for mark before anything was allowed to move:**
every official, player, note, movement path and flag in all 50 regenerated files
landed within 0.01 SVG units of where the committed file had it, with matching
titles and viewBoxes. The only differences were formatting — floats rounded to
two decimals, three drifted copies of the stylesheet unified, marks emitted in a
fixed paint order — plus hash marks now running the full height of each frame
rather than stopping where the old emitter happened to stop.

Nineteen diagrams then moved to match the manual. The punt view's frame was
extended from 17 to 20 yards behind the line, because it could not hold a Referee
standing behind a 14-yard-deep punter.

---

## Part 7 — Provenance

Every mechanics page now declares the manual **by section and print page** in its
`source:` front matter, which renders as a footnote and fails the build once the
`verified:` date is more than 400 days old. All are dated 2026-09-02.

`docs/sources.md` registers the manual as a primary source and marks the OHSAA
Gold Book and the 2022 VFOA deck **superseded** rather than deleting them, so a
reader who remembers the old sourcing can see what replaced it. The open question
about which Gold Book edition was supplied no longer governs any published claim.

---

## What was deliberately left alone

The audit's **Finding 10** is a do-not-break list — things the site already had
right, recorded so a future pass doesn't "fix" them. Among them: the Head Line
Judge works the sideline opposite the press box; the Referee keys the
opposite-side tackle and the Umpire the centre and both guards; only the covering
official signals a touchdown; whistle in the mouth before the snap and out of it
during the down; three short blasts for a flag; no wind-then-stop for a first
down gained inbounds near a sideline; the Line Judge is the backup on-field game
clock; and the whole S1–S47 numbering system with its S7 prefix, S38 umbrella and
S8/S9 suffixes.

## Still open

- **The 7-man page's diagrams** are still JPEG screenshots from the 2022 deck.
  Replacing them is Task 5 of `2026-08-27-field-diagrams-svg.md`, not this work.
- **Vermont amendments** remain blocked on the VPA Football Guide, exactly as
  before. Nothing in this change states a Vermont-specific rule, fee or date.
- **Print proofing.** The two-page gate, the dropped-content gate and the
  missing-figure gate all pass, but no card has been put through an actual
  black-and-white laser since these edits. See `docs/cards/proofing.md`.
