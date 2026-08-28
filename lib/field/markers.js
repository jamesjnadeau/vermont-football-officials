/**
 * The marks painted onto a field: officials, players, movement, notes,
 * flags, and free-standing labels.
 *
 * `field.js` draws the field a diagram sits on; this draws what happens on
 * it — kept separate so the diagram renderer (which places everything by
 * absolute football coordinate) and the drawing page (which drags one token
 * at a time) can share a single implementation of every shape instead of
 * each growing its own.
 *
 * Pure string building: no DOM, no `node:` imports, no globals, so this
 * loads the same as a `<script type="module">` in a browser and under
 * `node --test`.
 */
import { x, y as yardToY, num } from './geometry.js';
import { escapeText } from './escape.js';

// ---------------------------------------------------------------------------
// The shapes, in the units they're drawn at. Named so the numbers measured
// off the committed SVGs don't turn into unlabelled magic numbers here.
// ---------------------------------------------------------------------------

const OFFICIAL_RADIUS = 9.5;
const HIGHLIGHT_HALO_RADIUS = 14.5;
/** Nudges a mark's label baseline down so it centres inside the circle. */
const MARK_BASELINE_OFFSET = 4.2;

/** Half the width, and half the height, of a kicking player's crossed-line X. */
const PLAYER_X_HALF = 3.6;
const PLAYER_CIRCLE_RADIUS = 3.8;

/** The penalty flag's kite: half-width and half-height, tip to centre. */
const FLAG_KITE_HALF_WIDTH = 5;
const FLAG_KITE_HALF_HEIGHT = 4;
/** How far the pole runs past the kite's centre. */
const FLAG_POLE_DX = 9;
const FLAG_POLE_DY = 6;

/** How far above its point a movement's caption sits. */
const MOVEMENT_LABEL_OFFSET_Y = 8;

const LABEL_DEFAULT_SIZE = 12;
const LABEL_DEFAULT_COLOR = 'black';

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

/**
 * Step 2 of the plan: a mark must be renderable at the origin, so the
 * drawing page can move it many times a second by updating a wrapper
 * `<g transform="translate(...)">` instead of re-serialising it every frame.
 *
 * Rather than give every function its own `origin` flag, `at` itself carries
 * the mode: pass it and the mark is placed in football coordinates through
 * the view, same as `field.js`; omit it (`at` is `null` or `undefined`) and
 * the mark is placed at SVG `(0, 0)`, leaving it to whatever wrapper the
 * caller puts around it. Both callers — the diagram renderer and the
 * drawing page — produce the same picture either way, because a circle (or
 * text, or line) at `(cx, cy)` and the same shape at the origin wrapped in
 * `translate(cx, cy)` are the same picture by construction, not by anything
 * this module has to arrange.
 *
 * `movement()` doesn't go through this: it has no single anchor to place —
 * it always names at least two points, and those points are typically two
 * other marks already being positioned independently — so it always
 * converts every point through the view itself.
 */
function place(at, view) {
  return at == null ? [0, 0] : [x(at.across), yardToY(view, at.down)];
}

function noteMarkup(cx, cy, text, anchor) {
  return `<text x="${num(cx)}" y="${num(cy)}" class="note ${anchor}">${escapeText(text)}</text>`;
}

// ---------------------------------------------------------------------------
// Marks
// ---------------------------------------------------------------------------

/**
 * An official. `highlight` is a parameter, not a separate scene: the crew
 * page and the position cards need to say "this one is you" without a second
 * copy of the shape, which is what lets 30 position-card files collapse
 * into 6.
 */
export function official({ mark, at, highlight = false }, view) {
  const [cx, cy] = place(at, view);
  const cxs = num(cx);
  const cys = num(cy);
  const baseline = num(cy + MARK_BASELINE_OFFSET);
  const text = escapeText(mark);
  if (highlight) {
    return (
      `<g class="you">` +
      `<circle cx="${cxs}" cy="${cys}" r="${num(HIGHLIGHT_HALO_RADIUS)}" class="halo"/>` +
      `<circle cx="${cxs}" cy="${cys}" r="${num(OFFICIAL_RADIUS)}" class="hat-w"/>` +
      `<text x="${cxs}" y="${baseline}" class="mk mk-d">${text}</text>` +
      `</g>`
    );
  }
  return (
    `<g>` +
    `<circle cx="${cxs}" cy="${cys}" r="${num(OFFICIAL_RADIUS)}" class="hat-b"/>` +
    `<text x="${cxs}" y="${baseline}" class="mk mk-l">${text}</text>` +
    `</g>`
  );
}

/**
 * A player. `'k'` is the offense/kicking side, drawn as a crossed-line X so
 * it reads as distinct from an official's disc even in black and white;
 * `'r'` is the defense/receiving side, an outlined circle with no fill to
 * hatch through.
 */
export function player({ kind, at }, view) {
  const [cx, cy] = place(at, view);
  if (kind === 'k') {
    const xLo = num(cx - PLAYER_X_HALF);
    const xHi = num(cx + PLAYER_X_HALF);
    const yLo = num(cy - PLAYER_X_HALF);
    const yHi = num(cy + PLAYER_X_HALF);
    return (
      `<g class="kp">` +
      `<line x1="${xLo}" y1="${yLo}" x2="${xHi}" y2="${yHi}"/>` +
      `<line x1="${xLo}" y1="${yHi}" x2="${xHi}" y2="${yLo}"/>` +
      `</g>`
    );
  }
  return `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(PLAYER_CIRCLE_RADIUS)}" class="rp"/>`;
}

function movementCoords(points, view) {
  return points.map((p) => [x(p.across), yardToY(view, p.down)]);
}

function coordsToD(coords) {
  return coords.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${num(px)} ${num(py)}`).join(' ');
}

/**
 * The `d` a movement's points turn into on `view` — the path geometry alone,
 * no `<path>` wrapper, no marker, no label. `lib/draw/app.js` needs exactly
 * this for an arrow's hit-testing stroke and its selection outline; without
 * it, the only way to get a `d` string out of this module is to call
 * `movement()` and pick the attribute back out of the markup it returns,
 * which ties a caller to the order `movement()` happens to emit its
 * attributes in. Keep this exported rather than let that parsing spread.
 */
export function movementPath(points, view) {
  return coordsToD(movementCoords(points, view));
}

/**
 * A movement path: a dotted line with an arrowhead, straight `L` segments
 * between however many `points` are given — a straight arrow is just the
 * two-point case, a bent one needs no function of its own. `label`, if
 * given, is a `note`-styled caption sitting above the path's last point.
 */
export function movement({ points, label }, view) {
  const coords = movementCoords(points, view);
  const d = coordsToD(coords);
  let svg = `<path d="${d}" class="mv" marker-end="url(#ar)"/>`;
  if (label != null) {
    const [lastX, lastY] = coords[coords.length - 1];
    svg += noteMarkup(lastX, lastY - MOVEMENT_LABEL_OFFSET_Y, label, 'middle');
  }
  return svg;
}

/** The diagrams' fixed italic caption. */
export function note({ text, at, anchor = 'middle' }, view) {
  const [cx, cy] = place(at, view);
  return noteMarkup(cx, cy, text, anchor);
}

/** A penalty flag: a thrown kite on a short pole, both fixed in shape. */
export function flag({ at }, view) {
  const [cx, cy] = place(at, view);
  const tipX = num(cx - FLAG_KITE_HALF_WIDTH);
  const kite =
    `<path d="M ${tipX} ${num(cy)} ` +
    `l ${num(FLAG_KITE_HALF_WIDTH)} ${num(-FLAG_KITE_HALF_HEIGHT)} ` +
    `l ${num(FLAG_KITE_HALF_WIDTH)} ${num(FLAG_KITE_HALF_HEIGHT)} ` +
    `l ${num(-FLAG_KITE_HALF_WIDTH)} ${num(FLAG_KITE_HALF_HEIGHT)} z" class="flagk"/>`;
  const pole =
    `<line x1="${num(cx)}" y1="${num(cy)}" x2="${num(cx + FLAG_POLE_DX)}" y2="${num(cy + FLAG_POLE_DY)}" class="flagt"/>`;
  return kite + pole;
}

/**
 * User-written text on the drawing page — the one mark whose styling can't
 * live in the shared `STYLE` block. Every other mark is monochrome by
 * constraint (they're `STYLE`'s classes, and `STYLE` is fixed); a label's
 * size and colour are the user's choice, an unbounded vocabulary that a
 * shared stylesheet can't enumerate up front. So it carries its look as
 * inline presentation attributes instead of a class. Keep it that way — the
 * temptation is to fold this into `note()` once someone needs a coloured
 * note, and that's exactly the drift this split exists to avoid.
 *
 * Attributes at their default are omitted rather than written out: these
 * values ride in a URL later, and every byte there counts.
 */
export function label(
  { text, at, size = LABEL_DEFAULT_SIZE, color = LABEL_DEFAULT_COLOR, bold = false, underline = false, rotate = 0 },
  view,
) {
  const [cx, cy] = place(at, view);
  const cxs = num(cx);
  const cys = num(cy);
  const attrs = [`x="${cxs}"`, `y="${cys}"`];
  if (size !== LABEL_DEFAULT_SIZE) attrs.push(`font-size="${num(size)}"`);
  if (color !== LABEL_DEFAULT_COLOR) attrs.push(`fill="${escapeText(color)}"`);
  if (bold) attrs.push(`font-weight="bold"`);
  if (underline) attrs.push(`text-decoration="underline"`);
  // Rotate about the label's own anchor, not the field's origin, so turning
  // the angle spins the text in place instead of swinging it across the page.
  if (rotate) attrs.push(`transform="rotate(${num(rotate)} ${cxs} ${cys})"`);
  return `<text ${attrs.join(' ')}>${escapeText(text)}</text>`;
}
