# 2026–27 NFHS Game Officials Manual — Content Audit

**Status:** Spec. This document is the *findings*; the work is in
`2026-09-02-nfhs-2026-manual-alignment.md`.

**Source of truth:** *2026 and 2027 NFHS Football Game Officials Manual*, Bob
Colgate ed., NFHS/Referee Enterprises, ISBN 978-1-58208-626-2. Markdown
conversion at
[`jamesjnadeau/nfhs-rules-converter/2026-nfhs-football-game-officials-manual`](https://github.com/jamesjnadeau/nfhs-rules-converter/tree/main/2026-nfhs-football-game-officials-manual),
one file per chapter, with MechaniGrams rendered to `images/`. Page numbers
below are the manual's own print pages, preserved in the conversion as
`<!-- page N -->` markers.

**Why this audit exists.** Every mechanics page on this site was written from a
secondary source — the OHSAA Gold Book "Brief & Concise" crew-of-five cards for
the position and crew cards, a 2022 VFOA slide deck for 7-man, SDCFOA for the
clock sheet. Those sources follow the NFHS manual but are not it, and where they
paraphrase they sometimes paraphrase a *previous* edition. Now that the manual
itself is in hand, it replaces them.

**What the manual covers:** crews of four, five and seven. It contains no
six-person mechanics ("State associations are encouraged to adopt mechanics for
six-person crews as necessary until this manual provides such mechanics",
p. 3). Vermont crews work four and five, so those are the priority; the site's
7-man page is corrected but not expanded.

---

## Finding 0 — Terminology: "Head Linesman" is now "Head Line Judge"

> **Head Line Judge —** The Head Linesman position is now referred to as Head
> Line Judge. (Definition of Terms, p. 9)
>
> **Wing official —** The head line judge or line judge. (p. 11)

The manual uses "head line judge" throughout and its MechaniGrams letter the
position **HL** (verified against `images/p137-fig1.png`, `p138-fig1.png`,
`p139-fig1.png`). The site says "Linesman" everywhere: a page title, a URL
(`/information/linesman-position-card/`), an image directory
(`static/images/position-cards/linesman/`), thirty-odd body references, and the
`/draw` tool's token mark `LM`.

This is the single highest-traffic correction on the site, because it is the
word an official will hear in every pregame and read in every rulebook PENALTY
statement from now on.

**Also confirmed by the MechaniGrams:** the head line judge works the sideline
**opposite the press box**, the line judge the **press box** sideline. That
matches the site's current geometry, so only the name and the mark change — not
which sideline anyone stands on.

---

## Finding 1 — Free kick, crew of five: umpire and back judge are on the wrong sidelines

Manual §4.7, p. 136, and MechaniGram p. 137:

| | Manual | Site (`kicking-plays-crew-card.md`, position cards) |
| --- | --- | --- |
| **R** | Team R's goal line, centre of the field | Straddles R's goal line, middle ✅ |
| **U** | Outside the sideline on Team R's free-kick line, **on the side opposite the chains** | "The 50, 2 yds out of bounds, **opposite the press box**" ❌ |
| **HL / LJ** | Team R's goal line extended, both on the same yard line, deeper than the deepest receiver if adjusted | Goal line, own sidelines ✅ (but no "same yard line / deeper than the deepest receiver" adjustment rule) |
| **BJ** | Outside the sideline on Team K's free-kick line | "K's 40, 2 yds out of bounds, **press box side**" ❌ |

The chains live opposite the press box — the manual says so twice: the
line-to-gain crew "shall meet with the Head Line Judge on the sideline opposite
the press box at least 15 minutes before game time" (§1.6, p. 25), and the head
line judge is the chain-side official throughout. So "opposite the chains" is
the **press box** side, and the site has the umpire and back judge on each
other's sidelines.

**Also missing from the site:**

- "The referee is responsible for noting whether Team K has at least four
  players on either side of the kicker" (§4.7, p. 136; repeated as a Point of
  Emphasis, p. 8). The site's referee card says only "Nobody kicks without 11
  and 11."
- The back judge checks the tee's legality, withholds the ball until Team K has
  11 on the field, reminds the kicker not to kick before the whistle, and notes
  "whether no Team K player other than the kicker is more than 5 yards from Team
  K's free-kick line" (§4.7, p. 136).
- "If the football falls or blows off tee just prior to free kick, sound the
  whistle to prevent action and move to the kicker to give instructions" (ibid.)
  — the site's back judge card has "Off the tee | Two whistle blasts and jog to
  the kicker", which is close but not the manual's wording.

---

## Finding 2 — Onside kick, crew of five: three of five positions are wrong

Manual §4.7, p. 138, and MechaniGram `images/p138-fig1.png`:

| | Manual | Site |
| --- | --- | --- |
| **R** | Middle of the field, **deeper than the deepest receiver** | "Middle of the field, on the goal line" ❌ |
| **U** | **Team R's free-kick line**, same side as the line judge (press box side) | "K's 40, opposite the press box" ❌ |
| **HL** | Team R's free-kick line | "Up to the 50, your sideline" ✅ |
| **LJ** | **Team K's free-kick line** | "Up to the 50, your sideline" ❌ |
| **BJ** | Team K's free-kick line, **on the head line judge's side** | "K's 40, press box side" ❌ |

The manual's shape is a box: two officials on each restraining line, one per
sideline, with the umpire and head line judge on R's line and the line judge and
back judge on K's line. The site has all four bunched on the wrong lines.

The umpire, head line judge and line judge all "should have his beanbag in hand
to mark the spot if Team K first touches the kick and should be prepared to blow
the ball dead if a prone player from either team recovers the kick regardless of
whether it has traveled 10 yards." The site has none of that.

---

## Finding 3 — Scrimmage kick (punt): the wings' release is reversed

Manual §4.8, p. 149 (crew of five):

> At the snap, **the head line judge observes the initial line charge and
> remains on the line until the kick crosses the neutral zone** while **the line
> judge releases on the snap** and observes action on his side of the field
> between the neutral zone and the receivers.

The site has this backwards. `kicking-plays-crew-card.md` line 177: "LM:
sideline at the line, pauses first, reading a possible block. LJ: sideline,
straddling the line until the kick crosses." The line judge card says "Punt |
Straddling the line until the kick crosses it."

The crew-of-four text is even more explicit (§3.8, p. 78): "The head line judge
doesn't move downfield until the ball is beyond the neutral zone. The head line
judge is primarily responsible for determining if the ball crossed the line."

## Finding 3b — Punt positions, crew of five

| | Manual (§4.7, p. 140) | Site |
| --- | --- | --- |
| **R** | 3–5 yards outside the tight end, 2–3 yards behind the kicker, **kicking-leg side** | "Five deep, ten wide of the punter at 45°, **wide side** of the field" ❌ |
| **U** | 4–7 yards deep, **favouring the line judge's sideline** | "Seven yards off the line inside the ends, **opposite the Referee**" ❌ |
| **BJ** | **10–12 yards wider than and 2–3 yards behind** the deepest receiver, **on the head line judge's side** | "8 wide, 5 deep of one returner. Favour the wide side; in the middle with one returner, favour the Line Judge" ❌ |

The referee's side is set by the kicker's leg, not by the field's width, and the
umpire's by the line judge's release — "Favoring the line judge's side
compensates for the line judge moving downfield immediately at the snap."

## Finding 3c — Punt, crew of four: the deep official is the line judge, not the umpire

Manual §3.7, p. 72:

| | Manual | Site |
| --- | --- | --- |
| **R** | 2–3 yards behind, 3–5 yards outside the punter, **line judge's side** | "Same as a crew of 5" ❌ |
| **U** | **10 yards deep**, favouring the line judge's sideline | "Takes the deep spot — everything the 5-man Back Judge does, PSK bag and goal line included" ❌ |
| **HL** | Straddling the line of scrimmage, **more than 9 yards outside the widest offensive player** | "Both hold their own sidelines at the line of scrimmage" ❌ |
| **LJ** | **7–10 yards wider than and in front of the deepest receiver** | as above ❌ |

§3.8, p. 78: "All deep receivers are the responsibility of the line judge…​ The
line judge is responsible for covering all kicks down the middle and to his side
zone and should be prepared to get to Team R's goal line to rule on momentum
exception or touchback situations." The site gives that job to the umpire. This
is the largest single error in the crew-of-four material.

---

## Finding 4 — Scoring kicks: who goes under the posts, and who signals

**Crew of five** (§4.7, p. 141; §4.8, p. 150):

| | Manual | Site |
| --- | --- | --- |
| **R** | 2–3 yards to the rear, 3–5 yards to the side of the kicker, facing the holder | "Plant-leg side, five deeper than the holder, ten wide, shoulders at 45°" ❌ |
| **U** | Beyond the end line, behind the upright; rules inside/outside **his** upright | Under the upright opposite the press box ✅ |
| **HL / LJ** | **Straddling the line of scrimmage** | "On the field numbers at the line of scrimmage" ❌ |
| **BJ** | Beyond the end line, behind the upright; rules his upright **and the crossbar**; sounds the whistle and gives the signals | Under the press box upright ✅, but "Both of you signal" ❌ |

And the referee: "Once he is confident the kicker and holder are in no danger of
being roughed, the referee looks to the deep officials to learn the result of
the kick. **The signal should then be relayed to the press box.**" The site's
referee card says the opposite — "You do not signal a touchdown or a successful
try to the press box."

**Crew of four** (§3.7, pp. 73–74) — the site has this materially wrong:

- Outside Team R's 15: **line judge** goes beyond the end line, between the
  uprights, and is the sole judge of good/no good. Umpire stays 10 yards off the
  line favouring the line judge's side. Head line judge straddles the line not
  closer than 9 yards outside the widest offensive player and rules roughing the
  holder and kicker.
- On or inside Team R's 15: line judge is on the line of scrimmage 5–7 yards
  outside the offensive end and moves to the end line at the snap to rule the
  crossbar; he signals no good himself, or thumbs-up to the referee, **and the
  referee rules whether the ball went through the uprights**.

The site says "U takes one upright. The wing looking at the Referee's back
releases to the end line, takes the other upright." Neither official is where
the manual puts them, and nobody is ruling the crossbar.

---

## Finding 5 — Scrimmage play positions

Manual §4.7, p. 139 (crew of five) and §3.7, p. 69 (crew of four):

| | Manual | Site |
| --- | --- | --- |
| **R** | While A huddles: 10–15 yards from the line, 5 wide of the huddle, to be visible to the clock operator. Once A is at the line: **passing-arm side** of the quarterback, **10–12 yards deep**, at least as wide as the tight end | "15 yards behind the line, 8 wide of the quarterback at 45°, always on the **wide side**. You decide which side that is." ❌ |
| **U** | 5–7 yards behind Team B's line (crew of five; 5–10 in a crew of four), between the defensive ends | "7 off the line inside the ends" — inside the range, but stated as a fixed number |
| **HL / LJ** | Straddling the line of scrimmage, on the sideline ("Working on the sideline is strongly encouraged") | 10 yards outside the widest A player, never inside the numbers ❌ |
| **BJ** | Favouring the **strong side**, 20–25 yards beyond the line, deeper than the deepest defender | Not stated as a distance |

The referee's side is the **quarterback's throwing arm**, which is why the
manual tells the referee to ask the coach whether the quarterback is
right- or left-handed in the pregame meeting (§1.5, p. 23). The site's "wide
side, you decide" is a different mechanic.

The passer cushion is also different. Manual §4.8, p. 145: "The referee should
be wide and deep enough so he does not have to move if the quarterback drops
back into the pocket. If the quarterback rolls to either direction, the referee
must move with him, keeping at least a **10-yard buffer**." The site says "Five-
yard cushion on the passer, ten on a rolling quarterback."

---

## Finding 6 — Penalty administration: the two wings have different jobs

Manual §1.3, p. 20:

> **The line judge should hold the enforcement spot** until he is certain that
> the penalty enforcement has been done correctly. **The head line judge should
> walk off the penalty yardage on the sideline** as the umpire is walking off
> the penalty.

The site's `fouls-enforcement-crew-card.md` (line 104) and
`linesman-position-card.md` (line 223) both say "Both wings walk it off."

Also from §1.3 and the Points of Emphasis (p. 5), missing or partial on the
site:

- The calling official must notify **both the referee and the head line judge**
  as soon as the play ends; three short whistle blasts if needed.
- Wing officials who flag a **dead-ball foul before the snap jog toward the
  middle of the field to report**, still watching for retaliation.
- With **multiple flags**, officials meet and discuss before any signal goes to
  the press box. Never signal from the wing.
- Teams are identified **by offence or defence, not by jersey colour**.
- Microphone: preliminary signal without the mic; final signal *with* it; the
  referee controls the on/off switch and turns it off when done.
- Flag technique: to a spot for a spot foul, into the air for dead-ball fouls
  and fouls simultaneous with the snap; relocate a badly thrown flag
  immediately, and never slam-dunk it, wave it, or throw it at a player.

---

## Finding 7 — The play clock and the game clock

Manual §1.6, pp. 27–28:

- The **back judge (crew of five) or referee (crew of four)** meets the play
  clock timer before the game. The site's clock pages give the timer's contact
  as the Line Judge throughout — correct for the **game** clock ("As a backup,
  an onfield game official should time the game. Those duties fall to the line
  judge in a crew of four or five") but wrong for the **play** clock.
- **An interrupted play clock is always reset to 25 seconds**, never resumed.
  Reset to 25 if there is an appreciable delay and the clock is down to 20.
- **Signal 17** is the right arm extended upward, palm up, pumping three times
  — "pushing the sky" — for 25 seconds; **both hands** for 40. The site's
  `all-signals-listed-and-diagrammed.md` lists S17 as "Reset play clock" with no
  mention of the two-handed 40-second variant.
- The play clock is **turned off** when the ready-for-play is whistled with less
  than 25 (or 40) seconds left in the quarter and the game clock is running.
- On a first down gained inbounds, the game clock stops for the new series but
  the 40-second play clock starts at the dead ball; **the umpire stands over the
  ball to prevent a snap until the referee restarts the game clock and the
  umpire confirms it started**. If the operator does not respond the referee may
  whistle (which does not reset the play clock); if still nothing, he signals
  time-out and resets to 25.
- The play clock **is used during overtime**.
- Auto horn should be in the "off" position.
- Timers are encouraged to report crews whose signals are not clear (§Postgame,
  p. 217).

---

## Finding 8 — Content the manual supplies that the site does not have at all

These are gaps, not errors.

1. **Pregame conference** (pp. 12–16) — a full chapter. The site has no pregame
   page; an earlier plan
   (`2026-08-27-field-reference-cards.md`) already lists "a pregame conference
   script" as missing.
2. **Line-to-gain crew** (§1.6, p. 25) — nearly a page of instructions for the
   chain crew: a four-person crew is preferable; adults in distinctive vests;
   they are part of the officiating crew and must be impartial; no phones; they
   take instruction only from the head line judge; meet the head line judge on
   the sideline opposite the press box 15 minutes before the game and five
   minutes before the second-half kickoff; the clip goes at the intersection of
   the sideline and the 5-yard line nearest the trailing stake, then chains and
   box move six feet off the sideline; drop everything on a play coming at them;
   only the down indicator during tries and once the line to gain is the goal
   line; reverse the chain at the clip between the first/second and third/fourth
   periods. The site has nothing on this, and a chain-crew card is the kind of
   thing a home site actually needs.
3. **Crew and supplementary signal chart** (§2.1, pp. 46–47) — the eight
   approved crew communication signals plus the common unofficial ones: 11
   players (fist out, elbow straight, thumb on top), more/less than 11, pass
   juggled, play ended out-of-bounds, unbalanced line (hand to cheek), don't
   start clock (wrists crossed at waist), double sticks (arms crossed on the
   chest), snapper protection applies (rolling fists), start clock on ready
   (rotated index finger), receiver off the line (arm extended into the
   backfield), backward pass (same signal), and the five-second visible count —
   used by the **referee in a crew of four and the back judge in crews of five
   and seven**. "Five will get you one" is the head line judge's flat palm
   against the chest (§1.10, p. 37). The site's two signal pages cover S1–S47
   and nothing else.
4. **"When in question" guide** (§1.11, p. 38) — a 15-line tiebreaker table:
   forward or backward pass → forward; catch or not → no catch; fumble or down
   by rule → down by rule; touchback/safety → touchback; defenseless or not →
   defenseless; 5/15-yard face mask → 15; kick or pass touched or not → not
   touched; passer in or out of the free-blocking zone → outside; and so on.
5. **Halo principle** (§1.7, p. 29) — main halo and secondary halos, 2–5 yards,
   and the handoff/punt worked examples. `lib/draw/state.js` and the position
   cards use halo language without ever defining it.
6. **Digger mechanics** (§1.8, p. 31) — who digs, who manages conduct, who stops
   the clock, and the "I've got the ball; everyone off the pile" technique. The
   site has one line ("You and the Back Judge dig the ball out").
7. **Umpire's two down indicators** (§1.9, p. 34) — little finger = left hash,
   ring = left upright, middle = middle of field, index = right upright, thumb =
   right hash, for remembering the previous snap's lateral position. Previous
   spot means previous spot, laterally as well as by yard line.
8. **Wireless communication protocol** (§1.10, p. 35) — what to say, and the
   silence list: during the coin toss, while the referee is with a coach, while
   others are talking, on the stadium mic, during live-ball play, and whenever
   multiple flags are down.
9. **Game officials' jurisdiction** (p. 217) — authority runs through the
   referee's declaration of the end of the fourth period or overtime and ends
   when all officials leave the visual confines of the playing area; clerical
   authority survives for reports.
10. **Postgame conference** (pp. 217–219) — reporting disqualifications to the
    conference coordinator with the point of the game at which they occurred;
    disqualified coaches out of sight and sound; the postgame review checklist.
11. **Ball helpers** (§1.6, p. 28) — one per sideline mirroring the wing, end
    line duty on kicks, a ball behind the goal post, and the recommendation that
    ball helpers **not** be allowed on the field.
12. **Forward progress** (Points of Emphasis, p. 6) — a full page, including the
    sideline cases (the spot is the foremost point of the ball when the foot
    touches the line, not the foot; airborne runners are spotted where the ball
    crosses the plane of the sideline) and the pushed-back-runner judgment.
13. **Free-kick coverage** (Points of Emphasis, p. 8) — the widest two players
    on each side of the kicking formation belong to the **deepest sideline
    official**, who stays stationary until the kick is possessed; the rest
    belong to the officials on the two restraining lines; the official on Team
    K's restraining line has action against the kicker.

---

## Finding 9 — The 7-man page is a 2022 slide deck, not the manual

`7-man-mechanics.md` reproduces a VFOA presentation. Against Part 5 (pp. 183–216):

- **Free kick** — manual: R centre of the field on the goal line; U at K's
  restraining line opposite the press box; HL and LJ at their pylons on the goal
  line (or ≥10 yards deeper than the deepest receiver); SJ and FJ at R's
  restraining line; BJ at K's restraining line, press box side, after handing
  the kicker the ball. The page's diagram alt text puts the referee "behind the
  receiving team's end zone" and never states the restraining-line assignments.
- **Free-kick keying** — the page assigns "F and S follow K2 and K3, B and U
  follow K4 and K5." The 2026 Point of Emphasis (p. 8) replaces that: the widest
  **two** players on each side belong to the deepest sideline official; everyone
  else belongs to the two restraining-line officials.
- **Onside kick** — manual: HL and LJ move up to **Team K's 45**; SJ and FJ on
  R's restraining line rule whether the ball went 10 yards; U and BJ on K's
  restraining line rule the ball being topped off the tee and K staying behind
  its line; nobody moves until the ball passes R's restraining line or is
  recovered. The page has roughly the opposite split of duties.
- **Goal line** — manual: FJ/SJ take the goal line at the pylon from the 25 to
  the 7; HL/LJ have the goal line from the 7 in; BJ has **end line** coverage
  from the 25 in. The page gives the back judge goal-line responsibility outside
  the 25 and the wings the goal line from the 7 in.
- **Measurements** — manual §5.6: the head line judge has the down indicator
  moved behind the lead rod and brings the chain in; the line judge marks the
  clip intersection; the **back judge or line judge** gets the spare ball; the
  back judge holds the ball facing Team A's goal line; the umpire takes and
  pulls the front rod. The page assigns the down box to S and the spare ball to
  F.
- **Scrimmage play** — manual §5.7: R is 13–15 yards deep on the passing-arm
  side, at least a yard outside the tight end; U 5–10 deep and not outside the
  tackle; FJ/SJ 20–22 deep; BJ 25–30 deep. The page gives none of these.
- **Media time-out** (§5.5, p. 203) and **fade / reverse fade mechanics** (§5.8)
  are in the manual and absent from the page.

Vermont crews work four and five, so the fix here is to correct what the page
claims and label its provenance honestly rather than to build a full 7-man
reference.

---

## Finding 10 — Things the site gets right, recorded so nobody "fixes" them

- Head line judge on the sideline **opposite** the press box, line judge on the
  press box side. Confirmed by MechaniGram.
- Referee keys the **opposite-side tackle**; umpire keys the **centre and both
  guards** (§3.3/§4.3, "Referee and Umpire Keys").
- Only the covering official signals a touchdown; mirroring is discouraged
  (§3.7 p. 70, §4.8 p. 149).
- Whistle in the mouth before the snap, out of the mouth during the down
  (§1.4, p. 22).
- Three short blasts to alert the crew to a flag (§1.4, p. 22).
- Do not give wind-then-stop for a first down gained inbounds near the sideline
  (§1.10, p. 37; §4.8, p. 148).
- Line judge is the backup on-field **game** clock in crews of four and five
  (§1.6, p. 26).
- Free kick after a safety, crew of five: back judge at Team K's 20, umpire and
  head line judge at Team K's 30 (§4.8, p. 145). The site's back judge card
  agrees; the umpire card's "The 30" and the line judge card's "the receivers'
  30" need the team named.
- The site's signal numbering (S1–S47), the S7 dead-ball prefix, the S38
  personal-foul umbrella and the S8/S9 suffixes all match the manual's chart
  order and its penalty signalling sequences (§2.2, pp. 48–51).
- The crew-of-five pass keys on the 7-man page (widest to F and S, flanker to B,
  inside receiver to H, back to L in a balanced set) match Part 5's
  MechaniGrams.
