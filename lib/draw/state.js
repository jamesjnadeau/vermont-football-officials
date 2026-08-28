/**
 * The board as data: what is on the field, and which crop is looking at it.
 *
 * Everything here is a pure function over a plain object, so `node --test`
 * runs it and so a board can be handed around — pushed onto an undo stack,
 * encoded into a share link — without anything having to walk the DOM to
 * find out what is on screen. `app.js` owns the only copy of the board that
 * a page is currently showing; this module never keeps one.
 *
 * The state:
 *
 *   { view: 'runPass',
 *     tokens: [{ id, type: 'official', mark, across, down },
 *              { id, type: 'player', kind, across, down },
 *              { id, type: 'text', text, across, down,
 *                size, color, bold, underline, rotate }],
 *     arrows: [{ id, points: [{ across, down }, ...] }] }
 *
 * `across` is yards from the middle of the field (negative is left) and
 * `down` is yards from the view's anchor line — exactly what `markers.js`
 * takes, so nothing between here and the screen converts anything.
 *
 * **The view is a camera.** It says what is in frame; it is not part of a
 * token, and changing it moves nothing. That is what lets a preset switch
 * and a share link both be a one-field change rather than a migration of
 * every coordinate on the board, and it is why a link made today still
 * opens correctly after somebody retunes a view's `scaleY`.
 */
import { VIEWBOX_WIDTH, xToYards, yToYards } from '../field/geometry.js';
import { views, viewNames } from '../field/views.js';

/**
 * The crop the board opens on: no goal line, no kicking specifics — the one
 * closest to an ordinary down, which is what somebody arriving with no
 * particular play in mind is most likely to want.
 */
export const DEFAULT_VIEW = 'runPass';

/**
 * What can be put on the field, and what it is called out loud.
 *
 * The marks are read off the diagrams in `static/images/position-cards/`
 * rather than chosen here, because a crew that says "H" and a diagram that
 * draws "LM" is the kind of small disagreement that costs somebody a
 * pregame argument. The names are the accessible ones: they are what a
 * screen reader reads for a token, so they have to be words, not initials.
 *
 * These double as the allowlist. Nothing reaches the board without matching
 * an entry here, which is what makes a decoded share link (Task 7) safe by
 * construction rather than by remembering to check it at the call site.
 */
export const OFFICIALS = [
  { mark: 'R', name: 'Referee' },
  { mark: 'U', name: 'Umpire' },
  { mark: 'LM', name: 'Linesman' },
  { mark: 'LJ', name: 'Line Judge' },
  { mark: 'BJ', name: 'Back Judge' },
];

/**
 * `k` and `r` are the kicking and receiving sides in `markers.js`, which is
 * also how it tells offense from defense — one shape, two readings. The
 * names here are the scrimmage-down ones because that is the view the board
 * opens on. An official's palette button says its mark, because that is what
 * a diagram draws; a player has no mark to say, so it gets a word instead.
 */
export const PLAYERS = [
  { kind: 'k', label: 'Offense', name: 'offense player' },
  { kind: 'r', label: 'Defense', name: 'defense player' },
];

// ---------------------------------------------------------------------------
// Captions
//
// A caption is the one thing on the board carrying words rather than a
// position, and the one thing a user may colour. Everything about how it
// looks is bounded here — a size with a floor and a ceiling, an angle with
// one encoding, a colour with one shape, two booleans — because all six of
// these values ride in a share link (Task 7) and end up as attributes on a
// `<text>` in a page on this association's domain. The escaping in
// `escape.js` keeps the *words* harmless; this keeps the *styling* harmless,
// and neither is enough on its own.
// ---------------------------------------------------------------------------

/**
 * The rest of the board's type lives in this space: `.mk` is 10 units and
 * `.note` is 8.6. So 6 is "smaller than a diagram caption" and 36 is "a
 * banner across the field", and there is no useful text outside that.
 */
export const TEXT_SIZE_MIN = 6;
export const TEXT_SIZE_MAX = 36;

/**
 * Long enough for a down-and-distance, a formation name or a short
 * instruction, which is every caption anyone has asked for. The cap is not
 * about the picture — it is that this string is copied into a URL and back
 * out of one, and an unbounded field there is an unbounded field in the
 * document.
 */
export const TEXT_MAX_LENGTH = 120;

/**
 * What a caption looks like before anyone touches a control: the same black
 * as the rest of the board, at roughly the size the diagrams' own captions
 * are set in. Somebody who never opens the formatting controls gets
 * something that matches the field it is written on.
 */
export const TEXT_DEFAULTS = Object.freeze({
  text: '',
  size: 12,
  color: 'black',
  bold: false,
  underline: false,
  rotate: 0,
});

/**
 * The colours offered as one-tap swatches. Chosen to stay readable as thin
 * strokes on white at the small end of the size range — a pale colour is
 * already close to invisible on screen and gone entirely off a photocopier.
 * The picker beside them can still reach any hex value; these are what a
 * phone user will actually hit.
 */
export const TEXT_SWATCHES = [
  { color: 'black', name: 'Black' },
  { color: '#c00000', name: 'Red' },
  { color: '#0d47a1', name: 'Blue' },
  { color: '#1b5e20', name: 'Green' },
  { color: '#b35300', name: 'Orange' },
];


// ---------------------------------------------------------------------------
// Validation
//
// These throw rather than coerce. A bad token is a caller bug today and a
// crafted URL tomorrow, and both want the same answer: nothing reaches the
// board unless it matches something already known here.
// ---------------------------------------------------------------------------

/**
 * `Object.hasOwn` and not a plain `views[name]` truth test, because
 * `views['__proto__']` is `Object.prototype` — an object, and therefore
 * truthy. So is `views['constructor']`, and `views['toString']`. A payload
 * naming one of those would pass a bare lookup and hand every later
 * `view.scaleY` and `view.anchorY` an `undefined` to do arithmetic with,
 * and a board whose every coordinate is `NaN` is a board that silently
 * isn't there — from a word a stranger put in a URL.
 */
function requireView(name) {
  if (!Object.hasOwn(views, name)) {
    throw new Error(`unknown view "${name}" — must be one of: ${viewNames.join(', ')}`);
  }
  return name;
}

function requireNumber(value, what) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${what} must be a finite number, got ${JSON.stringify(value)}`);
  }
  return value;
}

/**
 * How far a coordinate may be from the middle of the field and still be a
 * coordinate at all. Wider than the field is long and nearly three times
 * the deepest view, so nothing a drag, a nudge or a preset can produce
 * comes within sight of it.
 *
 * It exists for the numbers that arrive off a share link (`codec.js`), where
 * a finite-and-therefore-legal `across: 1e9` would otherwise be a token a
 * billion yards away: never visible, never clickable, and still in the tab
 * order and still read out by a screen reader.
 *
 * A limit and not a clamp, deliberately. `clampToFrame` folds a value back
 * because a drag that overshoots plainly meant the edge; a coordinate this
 * far out meant nothing, and moving it to the edge of the frame would put a
 * token nobody placed where it can be mistaken for one somebody did.
 */
export const COORD_LIMIT_YARDS = 200;

function requireCoordinate(value, what) {
  requireNumber(value, what);
  if (Math.abs(value) > COORD_LIMIT_YARDS) {
    throw new Error(`${what} must be within ${COORD_LIMIT_YARDS} yards of the middle of the field, got ${value}`);
  }
  return value;
}

function requirePoint(point, what) {
  if (point == null || typeof point !== 'object') {
    throw new Error(`${what} must be a { across, down } point`);
  }
  return {
    across: requireCoordinate(point.across, `${what}.across`),
    down: requireCoordinate(point.down, `${what}.down`),
  };
}

function requireBoolean(value, what) {
  if (typeof value !== 'boolean') {
    throw new Error(`${what} must be true or false, got ${JSON.stringify(value)}`);
  }
  return value;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * A colour is the word `black` or a six-digit hex triple, and nothing else.
 *
 * This is an allowlist of *shapes* rather than a list of bad strings on
 * purpose. SVG's `fill` accepts `url(#thing)`, which points at another
 * element in the document — so "whatever the user typed" is not a colour,
 * it is a reference, and the value arrives here off a URL a stranger wrote.
 *
 * `#000000` normalises to `black` so the picker set to black and the
 * untouched default are one value rather than two spellings of it — the
 * same rule the angle gets below, and the reason `label()` can leave the
 * `fill` attribute off entirely at the default.
 */
function requireColor(value) {
  if (value === 'black') return value;
  if (typeof value === 'string' && HEX_COLOR.test(value)) {
    const hex = value.toLowerCase();
    return hex === '#000000' ? 'black' : hex;
  }
  throw new Error(`color must be "black" or a #rrggbb value, got ${JSON.stringify(value)}`);
}

/**
 * Degrees, folded into (-180, 180]. Two spellings of the same angle — 450
 * and 90, -270 and 90 — have to be one stored value, or a board and the
 * board it round-trips through a share link stop comparing equal while
 * looking identical.
 *
 * Out of range is normalised rather than rejected because an angle has no
 * out of range: every real number names a real direction.
 */
function normaliseRotation(value) {
  requireNumber(value, 'rotate');
  const turn = ((value % 360) + 360) % 360;
  return turn > 180 ? turn - 360 : turn;
}

/**
 * The six fields a caption carries beyond its position, each pinned to
 * something a `<text>` can safely be told.
 *
 * Size is clamped and the angle is folded, but the colour and the two
 * booleans throw: a number outside a range is a slider somebody dragged too
 * far, and the nearest legal value is obviously what they meant. A colour
 * that is not a colour is not a near miss — it is either a bug or an
 * attempt, and neither has a "nearest legal value" worth guessing.
 */
function textFields(source) {
  return {
    text: requireString(source.text, 'text').slice(0, TEXT_MAX_LENGTH),
    size: clamp(requireNumber(source.size, 'size'), TEXT_SIZE_MIN, TEXT_SIZE_MAX),
    color: requireColor(source.color),
    bold: requireBoolean(source.bold, 'bold'),
    underline: requireBoolean(source.underline, 'underline'),
    rotate: normaliseRotation(source.rotate),
  };
}

function requireString(value, what) {
  if (typeof value !== 'string') {
    throw new Error(`${what} must be a string, got ${JSON.stringify(value)}`);
  }
  return value;
}

/**
 * Ids are dense and derived from the board rather than random, so the same
 * sequence of edits produces the same board every time — which is what lets
 * a test compare two states directly, and keeps a share link from carrying
 * a UUID per token for no reader's benefit.
 */
function nextId(items, prefix) {
  let highest = 0;
  for (const item of items) {
    const match = /^(.)(\d+)$/.exec(item.id);
    if (match && match[1] === prefix) highest = Math.max(highest, Number(match[2]));
  }
  return `${prefix}${highest + 1}`;
}

function requireToken(state, id) {
  const token = findToken(state, id);
  if (!token) throw new Error(`no token "${id}" on this board`);
  return token;
}

function requireArrow(state, id) {
  const arrow = findArrow(state, id);
  if (!arrow) throw new Error(`no arrow "${id}" on this board`);
  return arrow;
}

// ---------------------------------------------------------------------------
// The board
// ---------------------------------------------------------------------------

/** A board with the camera set and nothing on the field. */
export function emptyBoard(view = DEFAULT_VIEW) {
  return { view: requireView(view), tokens: [], arrows: [] };
}

export function findToken(state, id) {
  return state.tokens.find((token) => token.id === id) ?? null;
}

/**
 * What a screen reader calls a token, and what its palette button says.
 *
 * A caption is called by its own words: a reader who hears "text item 3"
 * has to go looking for what it says, which for the one item on the board
 * that is nothing but words is the whole content missing.
 */
export function tokenName(token) {
  if (token.type === 'text') return token.text.trim() || 'Empty caption';
  if (token.type === 'official') {
    return OFFICIALS.find((o) => o.mark === token.mark)?.name ?? token.mark;
  }
  return PLAYERS.find((p) => p.kind === token.kind)?.name ?? 'player';
}

/**
 * Adds one token and returns the new board; the token added is always the
 * last one in `tokens`, which is how a caller finds the id it just made.
 *
 * The stored token carries only the field its type uses — a `mark` for an
 * official, a `kind` for a player — rather than both with one left empty,
 * so there is never a second, contradictory way to read what a token is.
 */
export function addToken(state, { type, mark, kind, across, down, ...style }) {
  const at = requirePoint({ across, down }, 'token');
  let token;
  if (type === 'official') {
    if (!OFFICIALS.some((o) => o.mark === mark)) {
      throw new Error(
        `unknown official mark "${mark}" — must be one of: ${OFFICIALS.map((o) => o.mark).join(', ')}`,
      );
    }
    token = { id: nextId(state.tokens, 't'), type, mark, ...at };
  } else if (type === 'player') {
    if (!PLAYERS.some((p) => p.kind === kind)) {
      throw new Error(
        `unknown player kind "${kind}" — must be one of: ${PLAYERS.map((p) => p.kind).join(', ')}`,
      );
    }
    token = { id: nextId(state.tokens, 't'), type, kind, ...at };
  } else if (type === 'text') {
    // Every caption is stored complete, with each of the six styling fields
    // written out even when it is the default. A half-populated token would
    // make every reader of one — `label()`, the properties strip, the share
    // link — carry its own copy of what the missing values mean.
    token = { id: nextId(state.tokens, 't'), type, ...textFields({ ...TEXT_DEFAULTS, ...style }), ...at };
  } else {
    throw new Error(`unknown token type "${type}" — must be one of: official, player, text`);
  }
  return { ...state, tokens: [...state.tokens, token] };
}

/**
 * Changes a caption's words or its look, one or several fields at a time.
 * Position is not among them — that is `moveToken`, the same call a drag of
 * any other token makes, because a caption is a token everywhere else on
 * this page and there is no reason for it to be two things here.
 *
 * Every change re-runs the whole validation rather than only the field that
 * moved: the cost is nothing, and it means there is no path to a stored
 * caption that was legal when it was made and is not now.
 */
export function editText(state, id, changes) {
  const token = requireToken(state, id);
  if (token.type !== 'text') throw new Error(`token "${id}" is not a caption`);
  const next = { ...token, ...textFields({ ...token, ...changes }) };
  return { ...state, tokens: state.tokens.map((t) => (t.id === id ? next : t)) };
}

/**
 * Settles a caption once editing it is over: an empty one is not a caption,
 * it is an invisible zero-width `<text>` that can only be selected by
 * accident, so it is dropped. Same rule as the too-short arrow.
 *
 * Returns the board unchanged — by identity, so a caller can tell — when
 * there is nothing to drop, and says nothing about an id that has already
 * gone: this runs from a blur, and by then the caption may well have been
 * deleted by the very click that moved the focus.
 */
export function commitText(state, id) {
  const token = findToken(state, id);
  if (!token || token.type !== 'text' || token.text.trim() !== '') return state;
  return removeToken(state, id);
}

/**
 * Moves one token to an absolute position. Absolute and not a delta because
 * a drag already knows where the pointer is: expressing it as a difference
 * would mean the board and the pointer each keeping their own running total
 * of the same drag, and those two drift apart the first time one update is
 * dropped.
 */
export function moveToken(state, id, { across, down }) {
  requireToken(state, id);
  const at = requirePoint({ across, down }, 'token');
  return {
    ...state,
    tokens: state.tokens.map((token) => (token.id === id ? { ...token, ...at } : token)),
  };
}

/** Removes one token. The others keep the ids they had. */
export function removeToken(state, id) {
  requireToken(state, id);
  return { ...state, tokens: state.tokens.filter((token) => token.id !== id) };
}

/**
 * Points the camera somewhere else. Nothing on the field moves — the token
 * array comes through untouched, by identity and not just by value, so this
 * cannot quietly acquire a coordinate fixup later.
 */
export function setView(state, view) {
  return { ...state, view: requireView(view) };
}

/** Adds a movement path. Two points is the straight-arrow case. */
export function addArrow(state, { points }) {
  if (!Array.isArray(points) || points.length < 2) {
    throw new Error('an arrow needs at least two points');
  }
  const arrow = {
    id: nextId(state.arrows, 'a'),
    points: points.map((point, i) => requirePoint(point, `arrow point ${i}`)),
  };
  return { ...state, arrows: [...state.arrows, arrow] };
}

export function findArrow(state, id) {
  return state.arrows.find((arrow) => arrow.id === id) ?? null;
}

/** Removes one arrow. The others keep the ids they had. */
export function removeArrow(state, id) {
  requireArrow(state, id);
  return { ...state, arrows: state.arrows.filter((arrow) => arrow.id !== id) };
}

// ---------------------------------------------------------------------------
// The frame
// ---------------------------------------------------------------------------

/**
 * Holds a point inside what is on screen.
 *
 * The limit is the 270-unit viewBox, deliberately **not** the sidelines: the
 * wings work the sideline from out of bounds and the committed diagrams put
 * them at x=20 and x=250, outside the touchlines at 35 and 235. A tool that
 * refused to place an official where an official actually stands would be
 * teaching the wrong mechanics to enforce a rule nobody asked for.
 *
 * The centre of the token is what is clamped, so a token dragged hard into
 * a corner half hangs off the frame rather than stopping short of it — the
 * alternative needs a per-mark radius here, which is the shape knowledge
 * this module exists not to hold.
 */
export function clampToFrame({ across, down }, view = DEFAULT_VIEW) {
  const frame = views[requireView(view)];
  return {
    across: clamp(across, xToYards(0), xToYards(VIEWBOX_WIDTH)),
    down: clamp(down, yToYards(frame, 0), yToYards(frame, frame.height)),
  };
}

/** The middle of what is on screen. */
export function frameCentre(view = DEFAULT_VIEW) {
  const frame = views[requireView(view)];
  return { across: 0, down: yToYards(frame, frame.height / 2) };
}

/**
 * Two tokens closer together than this read as one smudge at diagram scale.
 * It is a legibility number, not a rule: nothing stops a drag from putting
 * two officials on top of each other, because sometimes that is the picture.
 */
const SPREAD_YARDS = 2;

/**
 * Where to drop a newly added token: the middle of the frame, stepped off
 * the pile if something is already sitting there.
 *
 * Adding a crew is one click per official, and without this every one of
 * them lands on the same spot and the board looks unchanged after the first
 * — the tool appears broken while it is working perfectly. The step is a
 * plain diagonal rather than any kind of layout: whoever added the token is
 * about to drag it somewhere real, and all this has to do is let them see
 * that it arrived.
 */
export function openSpot(state, from) {
  const start = from ?? frameCentre(state.view);
  const taken = ({ across, down }) =>
    state.tokens.some((t) => Math.hypot(t.across - across, t.down - down) < SPREAD_YARDS);
  let spot = clampToFrame(start, state.view);
  for (let step = 1; taken(spot) && step <= 16; step += 1) {
    spot = clampToFrame(
      { across: start.across + step * SPREAD_YARDS, down: start.down + step * SPREAD_YARDS },
      state.view,
    );
  }
  return spot;
}

function clamp(value, low, high) {
  return Math.min(Math.max(value, low), high);
}
