# NFHS stick-figure signal cards

All 47 signals from the **2026 NFHS Official Football Signals** chart, redrawn as
stick figures — one SVG per signal, numbered to match the chart so `S38-24` in the
rules book points at the same picture here.

These are original drawings of the *motions*. The NFHS chart's own artwork is
copyright Referee (referee.com) and is not reproduced or traced.

## Files

    stickfig.py   the drawing engine: a pose is a handful of limb angles
    signals.py    the data: all 47 poses, captions and motion notes
    build.py      the command-line tool
    svg/          the output, 01-… through 47-…

## Rebuilding

    python3 build.py                  # writes svg/01-ball-ready-for-play.svg …
    python3 build.py --sheet          # plus contact-sheet.html
    python3 build.py --zip            # plus a zip of the SVGs and this tool
    python3 build.py --only 38 39 40  # just those three, while you tune them
    python3 build.py --no-caption     # number only, for self-quizzing
    python3 build.py --plain          # no number, no caption
    python3 build.py --out cards      # somewhere other than svg/

Standard library only — no packages to install.

## Changing a pose

Angles are measured from **straight down**, swinging **outward**:

    0 = arm at your side      90 = straight out      180 = straight up
    negative = across the body        over 180 = crossing above the head

Each arm and leg takes a pair, `(upper, forearm)`. So the touchdown signal is

    Pose(la=(176, 176), ra=(176, 176), lh="open", rh="open")

and hands on hips is

    Pose(la=(36, -42), ra=(36, -42), lh="fist", rh="fist")

`la`/`ll` are the figure's **left** side, which is on the **viewer's right**.
Most one-armed signals use `ra`, matching the way the chart draws them.

Hands: `fist`, `open`, `flat` (the blade of the hand), `point`, `thumb`, or `None`.

Other pose options: `view="front" | "back" | "side"`, `facing=1|-1` for side view,
`lean=` degrees of bend at the waist, `shift_x=` to recentre a leaning figure.

Movement is drawn by an `annotate` function that gets the figure's joints and
returns SVG — `arrow`, `double_arrow`, `circle_arrow` and `note` are provided:

    annotate=lambda J: arrow(off(J["hr"], 0, 26), off(J["hr"], 0, 92))

Joint names: `head neck sl sr el hl er hr hip hipl hipr kl fl kr fr`
(s = shoulder, e = elbow, h = hand, k = knee, f = foot; l/r = the figure's own
left and right).

## Notes on the drawings

* The signals the chart draws as motion — dead ball, incomplete pass, holding,
  chop block, tripping — carry a red arrow showing the movement.
* Signal 29 (sideline interference) is drawn from behind, as the chart does,
  because you give it facing the press box.
* Signals 30 (running into the kicker) and 39 (clipping) are drawn from the side,
  since both are leg-and-lean signals that a front view hides.
* Each card carries the chart's own caption, plus a one-line note on the motion.

The SVGs adapt to a dark background if you view them in a browser set to dark mode.

## Installing them on the site

`svg/` is the tool's own output and is not committed. The copies the site
serves live in `static/images/official-signals/`, and
`content/information/official-signals.md` embeds them by name:

    python3 build.py                             # from this directory
    python3 tools/signal-svgs/install-to-site.py # from the repository root

The install step strips each drawing's dark-mode block. The site has no dark
mode — every page is a white page — so a drawing that inverted itself for a
viewer whose OS is set to dark would come out white-on-white. Everything else
is copied through untouched, filenames included: the article links them by the
numbered name, so renaming one breaks the article.
