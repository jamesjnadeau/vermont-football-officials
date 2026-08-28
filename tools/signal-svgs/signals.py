"""
signals.py -- all 47 signals from the 2026 NFHS Official Football Signals chart,
as stick-figure poses.

Each entry is a dict:
    n       chart number (1-47)
    name    the chart's primary caption
    also    the chart's additional captions for the same drawing
    motion  a one-line description of the movement
    pose    a stickfig.Pose

Angles: 0 = arm straight down, 90 = straight out horizontal, 180 = straight up,
        negative = across the body.  See stickfig.py for the full convention.

The figure's LEFT arm (la) is on the viewer's RIGHT.  Most one-armed signals are
given with the right arm (ra), which the chart draws on the viewer's left.
"""

from stickfig import (Pose, arrow, double_arrow, circle_arrow, note,
                      off, mid, INK, ACCENT)

# ------------------------------------------------------------------ helpers

def down(J, key, d=52, dx=0):
    """A straight arrow dropping from a hand."""
    p = off(J[key], dx, 16)
    return arrow(p, off(p, 0, d))


def sideways(J, key, w=44, up=-18):
    """A double-headed arrow beside a hand -- 'move it side to side'."""
    p = off(J[key], 0, up)
    return double_arrow(off(p, -w, 0), off(p, w, 0))


SIGNALS = [
 dict(n=1, name="Ball ready for play", also=["*Untimed down"],
      motion="Arm extended toward the ball, chop downward. Untimed down: "
             "index finger circling overhead.",
      pose=Pose(ra=(96, 96), rh="flat",
                annotate=lambda J: arrow(off(J["hr"], 0, 26), off(J["hr"], 0, 92)))),

 dict(n=2, name="Start clock", also=[],
      motion="Full arm windmill overhead, forward and around.",
      pose=Pose(ra=(168, 172), rh="fist",
                annotate=lambda J: circle_arrow(mid(J["sr"], J["hr"], 0.55), 74, -95, 320))),

 dict(n=3, name="Time-out", also=["Discretionary or injury time-out"],
      motion="Arms sweep up from horizontal and cross overhead. Injury: "
             "follow by tapping both hands on the chest.",
      pose=Pose(la=(196, 214), ra=(196, 214), lh="open", rh="open",
                annotate=lambda J: arrow((330, 250), (250, 120), curve=34)
                + arrow((70, 250), (150, 120), curve=-34))),

 dict(n=4, name="TV / radio time-out", also=[],
      motion="One forearm horizontal, the other hand upright against it: a T.",
      pose=Pose(la=(5, -95), lh=None, ra=(-15, 180), rh="flat")),

 dict(n=5, name="Touchdown", also=["Field goal", "Point(s) after touchdown"],
      motion="Both arms straight up, palms open.",
      pose=Pose(la=(176, 176), ra=(176, 176), lh="open", rh="open")),

 dict(n=6, name="Safety", also=[],
      motion="Palms together above the head.",
      pose=Pose(la=(192, 200), ra=(192, 200), lh=None, rh=None)),

 dict(n=7, name="Dead ball foul", also=["Touchback"],
      motion="Arm straight overhead, open hand moving side to side.",
      pose=Pose(ra=(174, 174), rh="open",
                annotate=lambda J: sideways(J, "hr", 52, -26))),

 dict(n=8, name="First down", also=[],
      motion="Arm extended toward the offense's goal line.",
      pose=Pose(ra=(88, 88), rh="open")),

 dict(n=9, name="Loss of down", also=[],
      motion="Both hands behind the head, elbows out.",
      pose=Pose(la=(125, 255), ra=(125, 255), lh=None, rh=None)),

 dict(n=10, name="Incomplete forward pass",
      also=["Penalty declined", "No play, no score", "Toss option deferred"],
      motion="Both arms swept back and forth in front of the body.",
      pose=Pose(la=(72, 72), ra=(72, 72), lh="flat", rh="flat",
                annotate=lambda J: double_arrow(off(J["hl"], 34, 26),
                                                off(J["hr"], -34, 26)))),

 dict(n=11, name="Legal touching of forward pass or scrimmage kick", also=[],
      motion="Hand brushed sideways in front of the shoulder.",
      pose=Pose(ra=(118, 182), rh="fist",
                annotate=lambda J: arrow(off(J["hr"], -14, -12), off(J["hr"], -86, -20)))),

 dict(n=12, name="Inadvertent whistle", also=[],
      motion="Face the press box, whistle held out in front.",
      pose=Pose(ra=(15, -85), rh="fist")),

 dict(n=13, name="Disregard flag", also=[],
      motion="Flag waved overhead, side to side. The referee's signal only.",
      pose=Pose(ra=(166, 172), rh="fist",
                annotate=lambda J: sideways(J, "hr", 46, -30)
                + ('<path class="ink" d="M%.1f,%.1f l26,10 l-8,30 l-26,-10 z" '
                   'fill="none" stroke="%s" stroke-width="5" stroke-linejoin="round"/>'
                   % (J["hr"][0] - 4, J["hr"][1] + 4, INK)))),

 dict(n=14, name="End of period", also=[],
      motion="Ball held overhead in one hand.",
      pose=Pose(ra=(170, 174), rh=None,
                annotate=lambda J: ('<ellipse class="ink-s" cx="%.1f" cy="%.1f" rx="21" '
                                    'ry="13" fill="none" stroke="%s" stroke-width="6" '
                                    'transform="rotate(-18 %.1f %.1f)"/>'
                                    % (J["hr"][0], J["hr"][1] - 8, INK,
                                       J["hr"][0], J["hr"][1] - 8)))),

 dict(n=15, name="Sideline warning", also=[],
      motion="Both arms extended toward the sidelines. First offense is a "
             "warning only.",
      pose=Pose(la=(108, 108), ra=(108, 108), lh="open", rh="open",
                annotate=lambda J: arrow(off(J["hl"], 16, -6), off(J["hl"], 62, -18))
                + arrow(off(J["hr"], -16, -6), off(J["hr"], -62, -18)))),

 dict(n=16, name="First touching", also=["Illegal touching"],
      motion="Fingertips tap both shoulders.",
      pose=Pose(la=(140, -40), ra=(140, -40), lh="point", rh="point",
                annotate=lambda J: arrow(off(J["hl"], 34, -70), off(J["hl"], 8, -22))
                + arrow(off(J["hr"], -34, -70), off(J["hr"], -8, -22)))),

 dict(n=17, name="Reset play clock to 25 seconds", also=[],
      motion="One hand pumped up and down. Use both hands to reset to 40.",
      pose=Pose(ra=(146, 190), rh="fist",
                annotate=lambda J: double_arrow(off(J["hr"], -46, -34),
                                                off(J["hr"], -46, 52)))),

 dict(n=18, name="Encroachment", also=[],
      motion="Hands on hips.",
      pose=Pose(la=(36, -42), ra=(36, -42), lh="fist", rh="fist")),

 dict(n=19, name="False start", also=["Illegal formation", "Free kick infraction"],
      motion="Forearms rotated over one another in front of the chest.",
      pose=Pose(la=(5, -95), ra=(70, -85), lh="fist", rh="fist",
                annotate=lambda J: circle_arrow((186, 222), 33, -50, 300))),

 dict(n=20, name="Illegal shift (2 hands)", also=["Illegal motion (1 hand)"],
      motion="Forearms horizontal in front, moving side to side. One hand for "
             "motion, two for a shift.",
      pose=Pose(la=(5, -95), ra=(70, -85), lh="flat", rh="flat",
                annotate=lambda J: double_arrow((112, 292), (288, 292)))),

 dict(n=21, name="Delay of game", also=[],
      motion="Arms folded across the chest.",
      pose=Pose(la=(5, -99), ra=(70, -89), lh=None, rh=None)),

 dict(n=22, name="Substitution infraction", also=[],
      motion="One arm folded across the chest, fist at the opposite shoulder.",
      pose=Pose(ra=(10, -98), rh="fist")),

 dict(n=23, name="Disconcerting act", also=[],
      motion="Cupped hand behind the ear.",
      pose=Pose(ra=(135, 255), rh="open")),

 dict(n=24, name="Illegal helmet contact", also=["Targeting"],
      motion="Fist struck against the side of the helmet.",
      pose=Pose(ra=(133, 246), rh="fist")),

 dict(n=25, name="Illegal horse-collar tackle", also=[],
      motion="Hand at the back of the collar, pulled sharply down and back.",
      pose=Pose(ra=(133, 250), rh="fist",
                annotate=lambda J: arrow(off(J["hr"], -14, -18), off(J["hr"], -88, -30)))),

 dict(n=26, name="Illegal blindside block", also=[],
      motion="Fists brought together in front of the chest.",
      pose=Pose(la=(8, -98), ra=(52, -90), lh="fist", rh="fist",
                annotate=lambda J: arrow(off(J["hl"], 86, 34), off(J["hl"], 24, 34))
                + arrow(off(J["hr"], -86, 34), off(J["hr"], -24, 34)))),

 dict(n=27, name="Unsportsmanlike conduct", also=["Noncontact foul"],
      motion="Arms extended horizontally from the shoulders, palms down.",
      pose=Pose(la=(90, 92), ra=(90, 92), lh=None, rh=None)),

 dict(n=28, name="Illegal participation", also=[],
      motion="Both hands on top of the head, elbows out.",
      pose=Pose(la=(155, 243), ra=(155, 243), lh=None, rh=None)),

 dict(n=29, name="Sideline interference", also=[],
      motion="Facing the press box, hands clasped behind the back.",
      pose=Pose(view="back", la=(30, -70), ra=(30, -70), lh=None, rh="fist")),

 dict(n=30, name="Running into or roughing kicker or holder", also=[],
      motion="Swing one leg forward, as a kicker does.",
      pose=Pose(view="side", facing=1, shift_x=-14, ll=(54, 50), rl=(-16, -6),
                la=(24, 30), ra=(-22, -16), lh="fist", rh="fist",
                annotate=lambda J: arrow(off(J["fl"], -86, 62), off(J["fl"], 16, 14),
                                         curve=38))),

 dict(n=31, name="Illegal batting / kicking", also=[],
      motion="Open hand slapped downward above the shoulder. For kicking, "
             "follow by pointing at the toe.",
      pose=Pose(ra=(105, 214), rh="open",
                annotate=lambda J: arrow(off(J["hr"], -44, -40), off(J["hr"], -26, 30),
                                         curve=22))),

 dict(n=32, name="Invalid fair catch", also=["Illegal fair catch signal"],
      motion="Forearm up, open hand waved side to side at head height.",
      pose=Pose(ra=(106, 176), rh="open",
                annotate=lambda J: sideways(J, "hr", 42, -30))),

 dict(n=33, name="Forward pass interference", also=["Kick catching interference"],
      motion="Both arms forward from the shoulders, hands open and upright.",
      pose=Pose(la=(125, 225), ra=(125, 225), lh="open", rh="open")),

 dict(n=34, name="Roughing passer", also=[],
      motion="One arm swung down across the front of the body.",
      pose=Pose(ra=(58, 22), rh="fist",
                annotate=lambda J: arrow((104, 214), (150, 300), curve=-24))),

 dict(n=35, name="Illegal pass / forward handing", also=[],
      motion="Face the press box, one hand behind the back at the waist.",
      pose=Pose(ra=(22, -58), rh="flat",
                annotate=lambda J: arrow(off(J["hr"], -54, 52), off(J["hr"], -54, -14)))),

 dict(n=36, name="Intentional grounding", also=[],
      motion="Both arms swung downward across the front of the body.",
      pose=Pose(la=(76, 80), ra=(88, 92), lh="flat", rh="flat",
                annotate=lambda J: arrow(off(J["hr"], -6, 18), off(J["hr"], 12, 76),
                                         curve=-18)
                + arrow(off(J["hl"], 6, 18), off(J["hl"], -12, 76), curve=18))),

 dict(n=37, name="Ineligible downfield on pass", also=[],
      motion="One hand flat on top of the head.",
      pose=Pose(ra=(158, 246), rh="flat")),

 dict(n=38, name="Personal foul", also=[],
      motion="One wrist struck against the other in front of the body.",
      pose=Pose(ra=(70, -85), rh="fist", la=(5, -95), lh="fist",
                annotate=lambda J: arrow(off(J["hr"], 58, 44), off(J["hr"], 14, 12)))),

 dict(n=39, name="Clipping", also=[],
      motion="Bend at the waist, strike the back of your own leg.",
      pose=Pose(view="side", facing=1, lean=46, shift_x=-52,
                la=(-28, -30), lh="flat", ra=(22, 46), rh="fist",
                ll=(14, -12), rl=(-12, 10),
                annotate=lambda J: arrow(off(J["hl"], -34, -46), off(J["hl"], -6, 2),
                                         curve=26))),

 dict(n=40, name="Blocking below waist", also=[],
      motion="Bend forward, both hands chopping at the thighs.",
      pose=Pose(la=(10, 10), ra=(10, 10), lh="flat", rh="flat",
                annotate=lambda J: arrow(off(J["hl"], 82, 46), off(J["hl"], 24, 40))
                + arrow(off(J["hr"], -82, 46), off(J["hr"], -24, 40)))),

 dict(n=41, name="Chop block", also=[],
      motion="Standing upright, both hands chopping inward at thigh height.",
      pose=Pose(la=(26, 26), ra=(26, 26), lh="open", rh="open",
                annotate=lambda J: arrow(off(J["hl"], 74, 22), off(J["hl"], 22, 22))
                + arrow(off(J["hr"], -74, 22), off(J["hr"], -22, 22)))),

 dict(n=42, name="Holding", also=[],
      motion="Grasp the closed fist and pull it downward.",
      pose=Pose(ra=(46, -70), rh="fist", la=(38, -92), lh=None,
                annotate=lambda J: arrow(off(J["hr"], 30, -8), off(J["hr"], 30, 58)))),

 dict(n=43, name="Illegal block", also=["Illegal use of hands/arms"],
      motion="One forearm horizontal, the other hand open and upright above it.",
      pose=Pose(la=(30, -96), lh=None, ra=(120, 208), rh="open")),

 dict(n=44, name="Helping runner", also=["Interlocked blocking"],
      motion="Arms down at the sides, both hands sweeping outward.",
      pose=Pose(la=(14, 14), ra=(14, 14), lh="fist", rh="fist",
                annotate=lambda J: arrow(off(J["hl"], 18, 10), off(J["hl"], 74, -14),
                                         curve=-16)
                + arrow(off(J["hr"], -18, 10), off(J["hr"], -74, -14), curve=16))),

 dict(n=45, name="Grasping face mask or helmet opening", also=[],
      motion="Closed fist in front of the mask, pulled down.",
      pose=Pose(ra=(133, 267), rh="fist",
                annotate=lambda J: arrow(off(J["hr"], -34, -18), off(J["hr"], -34, 44)))),

 dict(n=46, name="Tripping", also=[],
      motion="Swing one leg across the front of the other.",
      pose=Pose(ll=(-20, -26), rl=(12, 12), la=(12, 12), ra=(12, 12),
                lh="fist", rh="fist",
                annotate=lambda J: arrow(off(J["fl"], 104, 30), off(J["fl"], 12, 16),
                                         curve=-28))),

 dict(n=47, name="Disqualification", also=[],
      motion="Thumb jerked up over the shoulder. Referee only, facing the "
             "press box.",
      pose=Pose(ra=(95, 241), rh="thumb",
                annotate=lambda J: arrow(off(J["hr"], -22, 28), off(J["hr"], -40, -46),
                                         curve=20))),
]

assert len(SIGNALS) == 47, len(SIGNALS)
assert [s["n"] for s in SIGNALS] == list(range(1, 48))
