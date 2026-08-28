"""
stickfig.py -- a tiny stick-figure engine that draws one football official
in one pose and writes it out as a standalone SVG.

Everything is described with limb ANGLES, so a signal is a few numbers
rather than a pile of path data.

ANGLE CONVENTION (the only thing you really need to learn)

    Angles are in degrees and are measured from STRAIGHT DOWN,
    swinging OUTWARD, away from the body's midline.

          0   arm hanging at the side
         45   halfway out and down
         90   straight out, horizontal
        135   halfway up
        180   straight up
       >180   continues over the head and crosses the midline
        <0    crosses the body (e.g. -40 = down and across)

    The same convention is used for both arms (they mirror each other),
    and for legs.  Each limb takes a PAIR of angles: (upper, forearm).
    Give the same number twice for a straight limb.

    In side view both arms swing toward `facing` for positive angles.

COORDINATES

    A 400 x 520 canvas.  The figure lives above y=428 (the ground line);
    the caption block lives below it.
"""

import math

# ---------------------------------------------------------------- proportions

W, H = 400, 580
CX = 200.0
GROUND = 428.0

HEAD_R = 26.0
HEAD_Y = 128.0
NECK_Y = 158.0
SHOULDER_Y = 180.0
SHOULDER_W = 34.0          # half-width
HIP_Y = 284.0
HIP_W = 20.0
UPPER_ARM = 62.0
FOREARM = 58.0
THIGH = 70.0
SHIN = 68.0

INK = "#14171a"
ACCENT = "#c8452c"         # motion arrows
MUTED = "#5f6873"


# ---------------------------------------------------------------- small maths

def _limb(origin, angle_deg, length, side):
    """side = +1 for the figure's left (viewer's right), -1 for its right."""
    a = math.radians(angle_deg)
    return (origin[0] + side * math.sin(a) * length,
            origin[1] + math.cos(a) * length)


def rot(p, o, deg):
    """Rotate p about o.  Positive = clockwise on screen (leans right)."""
    if not deg:
        return p
    a = math.radians(deg)
    dx, dy = p[0] - o[0], p[1] - o[1]
    return (o[0] + dx * math.cos(a) - dy * math.sin(a),
            o[1] + dx * math.sin(a) + dy * math.cos(a))


def _pt(p):
    return "%.1f,%.1f" % p


def mid(p, q, t=0.5):
    return (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)


def off(p, dx, dy):
    return (p[0] + dx, p[1] + dy)


# ---------------------------------------------------------------- annotations
# These return SVG fragments.  Signals use them to show movement.

def arrow(p, q, curve=0.0, width=4.0, color=ACCENT, head=11.0):
    """Arrow from p to q.  curve bows the shaft (positive = bows left of p->q)."""
    dx, dy = q[0] - p[0], q[1] - p[1]
    L = math.hypot(dx, dy) or 1.0
    ux, uy = dx / L, dy / L
    # pull the tip back so the head sits on q
    tipbase = (q[0] - ux * head * 0.9, q[1] - uy * head * 0.9)
    if curve:
        c = (mid(p, tipbase)[0] - uy * curve, mid(p, tipbase)[1] + ux * curve)
        d = "M%s Q%s %s" % (_pt(p), _pt(c), _pt(tipbase))
        # recompute head direction from the control point
        hx, hy = tipbase[0] - c[0], tipbase[1] - c[1]
        hl = math.hypot(hx, hy) or 1.0
        ux, uy = hx / hl, hy / hl
    else:
        d = "M%s L%s" % (_pt(p), _pt(tipbase))
    px, py = -uy, ux
    a = (q[0] - ux * head + px * head * 0.5, q[1] - uy * head + py * head * 0.5)
    b = (q[0] - ux * head - px * head * 0.5, q[1] - uy * head - py * head * 0.5)
    return ('<path class="mo" d="%s" fill="none" stroke="%s" stroke-width="%.1f" '
            'stroke-linecap="round"/>'
            '<path class="mof" d="M%s L%s L%s Z" fill="%s"/>'
            % (d, color, width, _pt(q), _pt(a), _pt(b), color))


def double_arrow(p, q, curve=0.0):
    """Arrowheads at both ends -- for back-and-forth motions."""
    return arrow(mid(p, q), q, curve) + arrow(mid(p, q), p, curve)


def circle_arrow(center, r, start_deg=-60, sweep=300, color=ACCENT, width=4.0):
    """Open circular arrow -- the windmill of the start-clock signal."""
    a0 = math.radians(start_deg)
    a1 = math.radians(start_deg + sweep)
    p0 = (center[0] + r * math.cos(a0), center[1] + r * math.sin(a0))
    p1 = (center[0] + r * math.cos(a1), center[1] + r * math.sin(a1))
    large = 1 if abs(sweep) > 180 else 0
    swf = 1 if sweep > 0 else 0
    tang = (-math.sin(a1) * (1 if sweep > 0 else -1),
            math.cos(a1) * (1 if sweep > 0 else -1))
    tip = (p1[0] + tang[0] * 2, p1[1] + tang[1] * 2)
    px, py = -tang[1], tang[0]
    h = 11.0
    a = (tip[0] - tang[0] * h + px * h * .5, tip[1] - tang[1] * h + py * h * .5)
    b = (tip[0] - tang[0] * h - px * h * .5, tip[1] - tang[1] * h - py * h * .5)
    return ('<path class="mo" d="M%s A%.1f,%.1f 0 %d %d %s" fill="none" stroke="%s" '
            'stroke-width="%.1f" stroke-linecap="round"/>'
            '<path class="mof" d="M%s L%s L%s Z" fill="%s"/>'
            % (_pt(p0), r, r, large, swf, _pt(p1), color, width,
               _pt(tip), _pt(a), _pt(b), color))


def note(x, y, text, size=15, anchor="middle"):
    return ('<text class="note" x="%.1f" y="%.1f" text-anchor="%s" font-size="%d" '
            'font-style="italic" fill="%s">%s</text>'
            % (x, y, anchor, size, MUTED, esc(text)))


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


# ---------------------------------------------------------------- the pose

class Pose:
    """One frozen position of the official.

    la / ra   the figure's Left and Right arm, as (upper, forearm) angles
    ll / rl   the figure's Left and Right leg
    lh / rh   hand style: fist, open, flat, point, thumb, or None
    view      'front' (default), 'back', or 'side'
    facing    side view only: +1 faces right, -1 faces left
    lean      degrees of bend at the waist (positive leans toward +x)
    """

    def __init__(self, la=(6, 6), ra=(6, 6), ll=(7, 7), rl=(7, 7),
                 lh=None, rh=None, view="front", facing=1, lean=0.0,
                 shift_x=0.0, head_turn=0.0, annotate=None):
        self.la, self.ra, self.ll, self.rl = la, ra, ll, rl
        self.lh, self.rh = lh, rh
        self.view, self.facing, self.lean = view, facing, lean
        self.shift_x = shift_x
        self.head_turn = head_turn
        self.annotate = annotate

    # -- skeleton ---------------------------------------------------------
    def joints(self):
        side_view = self.view == "side"
        f = self.facing if side_view else 1
        cx = CX + self.shift_x
        hip = (cx, HIP_Y)
        sw = 0.0 if side_view else SHOULDER_W
        hw = 0.0 if side_view else HIP_W

        neck = rot((cx, NECK_Y), hip, self.lean)
        head = rot((cx, HEAD_Y), hip, self.lean)
        sc = rot((cx, SHOULDER_Y), hip, self.lean)
        sl = rot((cx + sw, SHOULDER_Y), hip, self.lean)
        sr = rot((cx - sw, SHOULDER_Y), hip, self.lean)

        # in side view both arms swing toward `facing`
        lside, rside = (f, f) if side_view else (1, -1)

        el = _limb(sl, self.la[0], UPPER_ARM, lside)
        hl = _limb(el, self.la[1], FOREARM, lside)
        er = _limb(sr, self.ra[0], UPPER_ARM, rside)
        hr = _limb(er, self.ra[1], FOREARM, rside)

        hipl, hipr = (cx + hw, HIP_Y), (cx - hw, HIP_Y)
        kl = _limb(hipl, self.ll[0], THIGH, lside)
        fl = _limb(kl, self.ll[1], SHIN, lside)
        kr = _limb(hipr, self.rl[0], THIGH, rside)
        fr = _limb(kr, self.rl[1], SHIN, rside)

        return dict(head=head, neck=neck, sc=sc, sl=sl, sr=sr,
                    el=el, hl=hl, er=er, hr=hr,
                    hip=hip, hipl=hipl, hipr=hipr,
                    kl=kl, fl=fl, kr=kr, fr=fr,
                    lean=self.lean, facing=f, view=self.view)

    # -- ink --------------------------------------------------------------
    def _hand(self, style, wrist, elbow, side):
        if not style:
            return ""
        dx, dy = wrist[0] - elbow[0], wrist[1] - elbow[1]
        L = math.hypot(dx, dy) or 1.0
        ux, uy = dx / L, dy / L
        px, py = -uy, ux
        if style == "fist":
            return ('<circle class="ink-f" cx="%.1f" cy="%.1f" r="9" fill="%s"/>'
                    % (wrist[0], wrist[1], INK))
        if style == "thumb":                    # fist with the thumb cocked up
            t = (wrist[0] + px * 4 * side - uy * 0, wrist[1] - 20)
            return ('<circle class="ink-f" cx="%.1f" cy="%.1f" r="9" fill="%s"/>'
                    '<path class="ink" d="M%s L%s" stroke="%s" stroke-width="7" '
                    'stroke-linecap="round" fill="none"/>'
                    % (wrist[0], wrist[1], INK, _pt(wrist), _pt(t), INK))
        if style == "flat":                     # blade of the hand, chopping
            a = (wrist[0] + px * 15, wrist[1] + py * 15)
            b = (wrist[0] - px * 15, wrist[1] - py * 15)
            return ('<path class="ink" d="M%s L%s" stroke="%s" stroke-width="7" '
                    'stroke-linecap="round" fill="none"/>' % (_pt(a), _pt(b), INK))
        if style == "point":                    # finger carrying on past the wrist
            t = (wrist[0] + ux * 16, wrist[1] + uy * 16)
            return ('<path class="ink" d="M%s L%s" stroke="%s" stroke-width="5" '
                    'stroke-linecap="round" fill="none"/>' % (_pt(wrist), _pt(t), INK))
        if style == "open":                     # open palm, fingers spread
            out = []
            for k in (-1.0, -0.35, 0.35, 1.0):
                fx = wrist[0] + ux * 17 + px * k * 9
                fy = wrist[1] + uy * 17 + py * k * 9
                out.append('<path class="ink" d="M%s L%.1f,%.1f" stroke="%s" '
                           'stroke-width="5" stroke-linecap="round" fill="none"/>'
                           % (_pt(wrist), fx, fy, INK))
            return "".join(out)
        return ""

    def _head(self, J):
        hx, hy = J["head"]
        lean = self.lean
        parts = []
        parts.append('<circle class="ink-s" cx="%.1f" cy="%.1f" r="%.1f" fill="none" '
                     'stroke="%s" stroke-width="7"/>' % (hx, hy, HEAD_R, INK))
        # the white hat: dome across the top, brim toward the facing direction
        d = math.radians(lean)
        ux, uy = math.sin(d), -math.cos(d)          # "up" in the head's frame
        rx, ry = math.cos(d), math.sin(d)           # "right" in the head's frame
        by = 7.0                                    # brim sits this far above centre
        base = (hx + ux * by, hy + uy * by)
        a = (base[0] - rx * (HEAD_R + 1), base[1] - ry * (HEAD_R + 1))
        b = (base[0] + rx * (HEAD_R + 1), base[1] + ry * (HEAD_R + 1))
        k = HEAD_R * 1.15
        c1 = (a[0] + ux * k, a[1] + uy * k)
        c2 = (b[0] + ux * k, b[1] + uy * k)
        parts.append('<path class="ink-s cap" d="M%s C%s %s %s" fill="#ffffff" '
                     'stroke="%s" stroke-width="6" stroke-linejoin="round"/>'
                     % (_pt(a), _pt(c1), _pt(c2), _pt(b), INK))
        if self.view == "side":
            f = self.facing
            b1 = (base[0] + rx * (HEAD_R + 1) * f, base[1] + ry * (HEAD_R + 1) * f)
            b2 = (b1[0] + rx * 20 * f, b1[1] + ry * 20 * f)
            parts.append('<path class="ink" d="M%s L%s" stroke="%s" stroke-width="7" '
                         'stroke-linecap="round" fill="none"/>' % (_pt(b1), _pt(b2), INK))
        elif self.view != "back":
            parts.append('<path class="ink" d="M%s L%s" stroke="%s" stroke-width="7" '
                         'stroke-linecap="round" fill="none"/>' % (_pt(a), _pt(b), INK))
        return "".join(parts)

    def _torso(self, J):
        p = []
        stripe_top, stripe_bot = 0.30, 0.80
        neck, hip = J["neck"], J["hip"]
        p.append('<path class="ink" d="M%s L%s" stroke="%s" stroke-width="9" '
                 'stroke-linecap="round" fill="none"/>' % (_pt(neck), _pt(hip), INK))
        # shoulder and hip bars
        p.append('<path class="ink" d="M%s L%s" stroke="%s" stroke-width="8" '
                 'stroke-linecap="round" fill="none"/>' % (_pt(J["sl"]), _pt(J["sr"]), INK))
        if self.view != "side":
            p.append('<path class="ink" d="M%s L%s" stroke="%s" stroke-width="8" '
                     'stroke-linecap="round" fill="none"/>'
                     % (_pt(J["hipl"]), _pt(J["hipr"]), INK))
        # three referee stripes across the torso
        for t in (0.34, 0.52, 0.70):
            c = mid(neck, hip, t)
            d = math.radians(self.lean)
            rx, ry = math.cos(d), math.sin(d)
            wdt = 13 if self.view != "side" else 7
            p.append('<path class="ink" d="M%.1f,%.1f L%.1f,%.1f" stroke="%s" '
                     'stroke-width="4" stroke-linecap="round" opacity="0.55" fill="none"/>'
                     % (c[0] - rx * wdt, c[1] - ry * wdt,
                        c[0] + rx * wdt, c[1] + ry * wdt, INK))
        return "".join(p)

    def _limbs(self, J):
        p = []
        far = 'opacity="0.42" ' if self.view == "side" else ""
        # far side first so the near side overlaps it
        p.append('<path class="ink" %sd="M%s L%s L%s" stroke="%s" stroke-width="8" '
                 'fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
                 % (far, _pt(J["hipr"]), _pt(J["kr"]), _pt(J["fr"]), INK))
        p.append('<path class="ink" d="M%s L%s L%s" stroke="%s" stroke-width="8" '
                 'fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
                 % (_pt(J["hipl"]), _pt(J["kl"]), _pt(J["fl"]), INK))
        p.append('<path class="ink" %sd="M%s L%s L%s" stroke="%s" stroke-width="8" '
                 'fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
                 % (far, _pt(J["sr"]), _pt(J["er"]), _pt(J["hr"]), INK))
        p.append(self._hand(self.rh, J["hr"], J["er"], -1))
        p.append('<path class="ink" d="M%s L%s L%s" stroke="%s" stroke-width="8" '
                 'fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
                 % (_pt(J["sl"]), _pt(J["el"]), _pt(J["hl"]), INK))
        p.append(self._hand(self.lh, J["hl"], J["el"], 1))
        return "".join(p)

    def draw(self):
        J = self.joints()
        body = self._limbs(J) + self._torso(J) + self._head(J)
        extra = self.annotate(J) if self.annotate else ""
        return body + extra


# ---------------------------------------------------------------- the page

_STYLE = """
  :root { color-scheme: light dark; }
  .bg   { fill: #ffffff; }
  .ink, .ink-s { stroke: %(ink)s; }
  .ink-f { fill: %(ink)s; }
  .cap  { fill: #ffffff; }
  .num  { fill: %(ink)s; }
  .cap-t{ fill: %(ink)s; }
  .note { fill: %(muted)s; }
  .rule { stroke: #d7dbe0; }
  @media (prefers-color-scheme: dark) {
    .bg    { fill: #16191d; }
    .ink, .ink-s { stroke: #eef1f4; }
    .ink-f { fill: #eef1f4; }
    .cap   { fill: #16191d; }
    .num   { fill: #eef1f4; }
    .cap-t { fill: #eef1f4; }
    .note  { fill: #9aa3ad; }
    .rule  { stroke: #2c333a; }
    .mo    { stroke: #ff7a5c; }
    .mof   { fill: #ff7a5c; }
  }
""" % dict(ink=INK, muted=MUTED)


def _wrap(text, width=26):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if len(t) > width and cur:
            lines.append(cur)
            cur = w
        else:
            cur = t
    if cur:
        lines.append(cur)
    return lines


def render(number, name, pose, also=None, motion=None,
           show_caption=True, show_number=True):
    """Return a complete standalone SVG document for one signal.

    also   extra captions the chart prints under the same drawing
    motion one line on how the signal moves
    """
    label = name if not also else name + " / " + " / ".join(also)
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" '
           'height="%d" role="img" aria-label="NFHS football signal %s: %s">'
           % (W, H, W, H, number, esc(label))]
    out.append("<title>%s. %s</title>" % (number, esc(label)))
    out.append("<style>%s</style>" % _STYLE)
    out.append('<rect class="bg" x="0" y="0" width="%d" height="%d"/>' % (W, H))
    out.append('<g font-family="Helvetica Neue, Helvetica, Arial, sans-serif">')

    if show_number:
        out.append('<circle cx="34" cy="34" r="23" fill="none" class="ink-s" '
                   'stroke-width="4"/>')
        out.append('<text class="num" x="34" y="42" text-anchor="middle" '
                   'font-size="24" font-weight="700">%s</text>' % number)

    out.append(pose.draw())
    out.append('<path class="rule" d="M50,%.1f L350,%.1f" stroke-width="3" '
               'stroke-linecap="round"/>' % (GROUND, GROUND))

    if show_caption:
        y = 464
        for line in _wrap(name.upper(), 19):
            out.append('<text class="cap-t" x="200" y="%.1f" text-anchor="middle" '
                       'font-size="22" font-weight="700" letter-spacing="0.5">%s</text>'
                       % (y, esc(line)))
            y += 25
        if also:
            for line in _wrap(" \u00b7 ".join(also), 40):
                out.append('<text class="cap-t" x="200" y="%.1f" text-anchor="middle" '
                           'font-size="16" font-weight="600">%s</text>' % (y, esc(line)))
                y += 19
        if motion:
            y += 4
            for line in _wrap(motion, 46):
                out.append('<text class="note" x="200" y="%.1f" text-anchor="middle" '
                           'font-size="14.5" font-style="italic">%s</text>'
                           % (y, esc(line)))
                y += 18
    out.append("</g></svg>")
    return "\n".join(out)
