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
 *              { id, type: 'player', kind, across, down }],
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
// Validation
//
// These throw rather than coerce. A bad token is a caller bug today and a
// crafted URL tomorrow, and both want the same answer: nothing reaches the
// board unless it matches something already known here.
// ---------------------------------------------------------------------------

function requireView(name) {
  if (!views[name]) {
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

function requirePoint(point, what) {
  if (point == null || typeof point !== 'object') {
    throw new Error(`${what} must be a { across, down } point`);
  }
  return {
    across: requireNumber(point.across, `${what}.across`),
    down: requireNumber(point.down, `${what}.down`),
  };
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

/** What a screen reader calls a token, and what its palette button says. */
export function tokenName(token) {
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
export function addToken(state, { type, mark, kind, across, down }) {
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
  } else {
    throw new Error(`unknown token type "${type}" — must be one of: official, player`);
  }
  return { ...state, tokens: [...state.tokens, token] };
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
