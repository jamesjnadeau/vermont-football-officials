/**
 * The share link's payload: a board in, a string safe to put in a URL out,
 * and — the half that matters — back again from a string somebody else
 * wrote.
 *
 * A decoded payload is **untrusted input on this association's domain**.
 * Anyone can hand an official a link to the real `/draw` with anything at
 * all after the `#`, and that payload carries free text, a colour, a size
 * and an angle that all end up as content and attributes in the document.
 * So this file has exactly one security rule, and it is a rule about where
 * the checking happens rather than what it checks:
 *
 *   **Nothing is validated here.** Every value goes to `state.js` —
 *   `emptyBoard`, `addToken`, `addArrow` — which already throws on a view
 *   that is not a view, a mark that is not on the crew, a colour that is
 *   really a `url(#…)` reference, a size off the end of the slider, a
 *   number that is not finite or is not on the field. This file's whole job
 *   is to parse, to hand each item over, and to **catch the throw and drop
 *   that item** so one bad token cannot take the page down with it.
 *
 * A second copy of those bounds living here would be two allowlists that
 * agree today and drift apart the first time either is edited, and the one
 * that drifts is the one nobody is looking at. What this file does own is
 * the shape of the wire format and how much of it a link may carry, since
 * `state.js` sees one token at a time and has no opinion about how many
 * there are.
 *
 * Pure: no DOM, no `node:` imports, no globals beyond `TextEncoder`,
 * `TextDecoder`, `btoa` and `atob`, which Node and the browser both have.
 * `app.js` is the only thing that knows this ends up in a URL.
 *
 * ---------------------------------------------------------------------------
 * The wire format, version 1
 * ---------------------------------------------------------------------------
 *
 *   { "v": 1, "w": "runPass",
 *     "t": [ ["o", "R",  -4,  -7],
 *            ["p", "k",   0,   0],
 *            ["x", "Watch the wing", 0, 5],
 *            ["x", "Blitz", 2, 3, { "s": 18, "c": "#c00000", "b": 1 }] ],
 *     "a": [ [0, 0, 0, 5] ] }
 *
 * `v` is the version and is checked; `w` is the view. A token is a
 * positional row — tag, then the one string that tag carries (an official's
 * mark, a player's side, a caption's words), then `across` and `down`. A
 * caption with any styling off its default appends one object holding just
 * the fields that moved. An arrow is a flat run of alternating `across` and
 * `down`, the way an SVG polyline's `points` are.
 *
 * Positional rather than named because the length of this string is the
 * whole point of the format: a full kickoff board is 26 tokens, and
 * `["p","k",-2.5,0]` against `{"k":"p","m":"k","x":-2.5,"y":0}` is the
 * difference between a link that pastes into a text message and one that
 * gets wrapped. For the same reason coordinates are rounded to one decimal
 * (a tenth of a yard is a third of an SVG unit — under half a pixel on a
 * printed card) and every caption field still at its default is left out
 * rather than written.
 *
 * Ids are not carried at all. `state.js` derives them from the order tokens
 * were added, so re-adding them in order rebuilds the same ids — a UUID per
 * token in the URL would buy no reader of a link anything.
 */
import { TEXT_DEFAULTS, addArrow, addToken, emptyBoard } from './state.js';

/**
 * The only version there is. It is written on every payload and checked on
 * every decode so that the day there is a version 2, it can still open the
 * links people have already sent — and, until that day, a payload claiming
 * to be from the future fails whole rather than half-loading into a board
 * that is missing whatever version 2 added.
 */
export const VERSION = 1;

/**
 * How much a link may carry. These are not bounds on what a token is —
 * `state.js` owns those — they are bounds on how much work a stranger's URL
 * may ask the page to do before it has drawn anything. A crafted payload
 * with a hundred thousand tokens in it must not be a page that hangs
 * building a hundred thousand nodes.
 *
 * The generous end of what anyone builds by hand: the biggest preset on the
 * board is 26 tokens, and a bent arrow costs a click per point.
 *
 * `tooBigForALink` below reads the same three from the sharing side, so a
 * board that would not survive the trip is refused with a reason rather
 * than handed over as a link that quietly loses part of it.
 */
export const MAX_TOKENS = 200;
export const MAX_ARROWS = 50;
export const MAX_ARROW_POINTS = 40;

/**
 * A coarse ceiling on the string itself, checked before `atob` or
 * `JSON.parse` ever see it — those are the two steps whose cost is set by
 * an input nobody here chose. A real board is about a kilobyte; half a
 * megabyte is well past anything this file can produce, so a payload that
 * big is not a board that got long, it is a fragment somebody pasted.
 */
export const MAX_PAYLOAD_CHARS = 500_000;

/**
 * The tag in slot 0 of a token row, the state type it means, and the field
 * slot 1 holds for it. One table read from both ends, so the encoder and
 * the decoder cannot end up disagreeing about either.
 */
const TOKEN_KINDS = [
  { tag: 'o', type: 'official', field: 'mark' },
  { tag: 'p', type: 'player', field: 'kind' },
  { tag: 'x', type: 'text', field: 'text' },
];

/**
 * `1` is how a set flag is written on the wire; anything else is handed on
 * untouched so `requireBoolean` in `state.js` stays the one thing that
 * decides what a boolean is. Reading `"yes"` or `[]` as true here would be
 * this file inventing a second rule for a value that already has one.
 */
const asFlag = (value) => (value === 1 ? true : value);

/** Passed through exactly as it arrived, for `state.js` to accept or refuse. */
const asIs = (value) => value;

/**
 * A caption's five styling fields: the wire key, the state field, and the
 * conversion each way. One table, so the shortening on the way out and the
 * widening on the way back can never describe different formats.
 *
 * The sixth thing a caption carries — its words — is not here: `text` rides
 * in slot 1 of the row itself, alongside an official's mark and a player's
 * side, because every token has something in that slot and only a caption
 * has any of these.
 */
const STYLE_KEYS = [
  { key: 's', field: 'size', toWire: round1, fromWire: asIs },
  { key: 'c', field: 'color', toWire: asIs, fromWire: asIs },
  // Three characters saved on every bold caption, and there is nothing else
  // a flag in this slot could mean.
  { key: 'b', field: 'bold', toWire: () => 1, fromWire: asFlag },
  { key: 'u', field: 'underline', toWire: () => 1, fromWire: asFlag },
  { key: 'r', field: 'rotate', toWire: round1, fromWire: asIs },
];

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

/**
 * One decimal, with `-0` flattened to `0` the way `num()` in `geometry.js`
 * does it. Without that, a token dragged to exactly the middle of the field
 * encodes as `-0`, comes back as `0`, and a board compared against its own
 * round trip fails on a difference nothing can see.
 */
function round1(value) {
  const rounded = Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function encodeToken(token) {
  const kind = TOKEN_KINDS.find((k) => k.type === token.type);
  if (!kind) throw new Error(`cannot encode token type "${token.type}"`);
  const row = [kind.tag, token[kind.field], round1(token.across), round1(token.down)];
  if (token.type !== 'text') return row;

  // Only what has moved off the default. A caption is the one thing on the
  // board that costs real length in a link — its words plus five styling
  // fields — and most captions are the default black 12pt.
  const style = {};
  for (const { key, field, toWire } of STYLE_KEYS) {
    if (token[field] === TEXT_DEFAULTS[field]) continue;
    style[key] = toWire(token[field]);
  }
  if (Object.keys(style).length > 0) row.push(style);
  return row;
}

const encodeArrow = (arrow) => arrow.points.flatMap((p) => [round1(p.across), round1(p.down)]);

/**
 * What about this board would not survive being made into a link, said in
 * words somebody can act on — or `null` when the whole thing fits.
 *
 * `encode` will happily write a board past the caps `decode` enforces, and
 * the two failures that produces are both silent at the point they matter:
 * over the token or arrow cap the link does not open at all and the
 * recipient gets the default board and a notice, and over the point cap it
 * opens with a path missing that nobody is told about. The person who
 * pressed the button sees neither. So the check belongs on this side too,
 * and it has to name the thing that would be lost — "something will not fit"
 * leaves them looking for it.
 *
 * Counts against the caps rather than `decode(encode(state))`, because the
 * counts are the entire answer and this runs on a click.
 */
export function tooBigForALink(state) {
  const spare = (count, cap) => `Remove ${count - cap} and try again.`;
  if (state.tokens.length > MAX_TOKENS) {
    return `This board has ${state.tokens.length} markers and captions on it, and a link can carry ${MAX_TOKENS}. ${spare(state.tokens.length, MAX_TOKENS)}`;
  }
  if (state.arrows.length > MAX_ARROWS) {
    return `This board has ${state.arrows.length} arrows on it, and a link can carry ${MAX_ARROWS}. ${spare(state.arrows.length, MAX_ARROWS)}`;
  }
  const long = state.arrows.find((arrow) => arrow.points.length > MAX_ARROW_POINTS);
  if (long) {
    return `One arrow has ${long.points.length} points, and a link can carry ${MAX_ARROW_POINTS}. Redraw it with fewer corners, or remove it.`;
  }
  return null;
}

/** A board as a base64url string, ready to go straight after `#d=`. */
export function encode(state) {
  const payload = { v: VERSION, w: state.view };
  if (state.tokens.length > 0) payload.t = state.tokens.map(encodeToken);
  if (state.arrows.length > 0) payload.a = state.arrows.map(encodeArrow);
  return toBase64Url(JSON.stringify(payload));
}

/**
 * base64url — `-` and `_` for `+` and `/`, and no `=` padding — because all
 * three of the characters plain base64 uses need percent-encoding in a URL,
 * and a link that has to survive being pasted through a text message, a
 * mail client and a group chat is a link that should not contain any of
 * them in the first place.
 *
 * UTF-8 first, and never `btoa(json)`: `btoa` throws on any character above
 * U+00FF, and a caption can hold anything a keyboard produces.
 */
function toBase64Url(json) {
  const bytes = new TextEncoder().encode(json);
  // A byte at a time rather than `String.fromCharCode(...bytes)`: the spread
  // form passes one argument per byte, and a board at the caps above — two
  // hundred captions, each a hundred and twenty characters that may be
  // several bytes apiece — is well past the argument limit that survives.
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

/**
 * A board from a payload, or `null` if it cannot be one.
 *
 * `null` and never a throw: this is called from `app.js` with whatever was
 * after the `#`, and the caller's job on `null` is to open the default board
 * and say so. A bad link must not be a blank page, and must not be an error
 * in a console nobody holding the link will ever open.
 *
 * A payload that parses but carries a token that does not survive
 * `state.js` comes back as a board without that token — the rest of a play
 * is still worth showing. Only a failure of the payload itself returns
 * `null`.
 */
export function decode(payload) {
  try {
    return readBoard(parsePayload(payload));
  } catch {
    return null;
  }
}

function parsePayload(payload) {
  if (typeof payload !== 'string' || payload === '') throw new Error('no payload');
  if (payload.length > MAX_PAYLOAD_CHARS) {
    throw new Error(`payload is ${payload.length} characters, over the ${MAX_PAYLOAD_CHARS} limit`);
  }
  // Checked before `atob` rather than left to it: `atob` accepts plain
  // base64's `+` and `/` too, and a payload holding those did not come from
  // `encode` — it came from something that mangled the link, and guessing
  // at what it used to be is how a half-corrupt board gets drawn.
  if (!/^[A-Za-z0-9_-]+$/.test(payload)) throw new Error('payload is not base64url');

  const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  // `fatal`, so bytes that are not UTF-8 stop here instead of arriving as
  // U+FFFD. A replacement character is a guess about what a stranger meant,
  // and this file does not make guesses about a stranger's input.
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

function readBoard(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('a payload is a JSON object');
  }
  if (data.v !== VERSION) {
    throw new Error(`payload version ${JSON.stringify(data.v)}, and this reads version ${VERSION}`);
  }

  const tokenRows = list(data.t, MAX_TOKENS, 'tokens');
  const arrowRows = list(data.a, MAX_ARROWS, 'arrows');

  // `emptyBoard`'s parameter default would quietly make a payload with no
  // view at all the default crop, which is the one guess about a stranger's
  // input this file must not make. `w` is always written, so a payload
  // without one did not come from `encode`.
  if (typeof data.w !== 'string') throw new Error('a payload names its view');

  // `emptyBoard` is the view check — `requireView` there rejects anything
  // that is not a key of `views`. An unknown view fails the whole payload
  // rather than falling back to the default one: every coordinate on the
  // board is read against the view's anchor line, and a board drawn under a
  // crop nobody asked for is a wrong play shown confidently. Better the
  // default board and a notice saying the link could not be read.
  let board = emptyBoard(data.w);

  // Each item in its own `try`. This is the line the whole file exists for:
  // `state.js` throws on anything it does not recognise, and here that
  // throw means "leave this one out", not "give up on the play".
  for (const row of tokenRows) {
    try {
      board = addToken(board, tokenSpec(row));
    } catch {
      // Dropped, never repaired. A mark that is not a mark or a colour that
      // is really a reference has no nearest legal value worth guessing at.
    }
  }
  for (const row of arrowRows) {
    try {
      board = addArrow(board, arrowSpec(row));
    } catch {
      // Same rule as a token.
    }
  }
  return board;
}

/** A payload's `t` or `a`: absent means none, and too many fails the payload. */
function list(value, cap, what) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${what} must be a list`);
  if (value.length > cap) {
    throw new Error(`${value.length} ${what} is past the ${cap} a link may carry`);
  }
  return value;
}

/**
 * A token row, turned into the object `addToken` takes — and nothing more.
 * Every field is named explicitly here rather than spread out of the parsed
 * row, so no key a stranger invented reaches `state.js` at all, `__proto__`
 * included.
 */
function tokenSpec(row) {
  if (!Array.isArray(row) || row.length < 4) {
    throw new Error('a token is [tag, name, across, down]');
  }
  const kind = TOKEN_KINDS.find((k) => k.tag === row[0]);
  if (!kind) throw new Error(`unknown token tag ${JSON.stringify(row[0])}`);

  // Deliberately not rounded, coerced or clamped on the way in. Rounding is
  // something `encode` does to keep a link short; doing it here would turn
  // the string "5" into the number 5 and a crafted value into a plausible
  // one. What arrives is what `state.js` is asked to accept.
  const spec = { type: kind.type, [kind.field]: row[1], across: row[2], down: row[3] };
  if (kind.type !== 'text') return spec;

  // No fifth slot means no styling, and so does an explicit `null` in it —
  // `??` folds both to the empty object, which is what a caption sitting at
  // every default encodes to in the first place. Anything else in that slot
  // is not something `encode` wrote, so the caption goes.
  const style = row[4] ?? {};
  if (typeof style !== 'object' || Array.isArray(style)) {
    throw new Error("a caption's styling must be an object");
  }
  for (const { key, field, fromWire } of STYLE_KEYS) {
    // Absent means the default, which `addToken` fills in. Only what the
    // payload actually said is passed on. `hasOwn` and not `in`, so a key
    // that is only on the prototype chain counts as absent.
    if (!Object.hasOwn(style, key)) continue;
    spec[field] = fromWire(style[key]);
  }
  return spec;
}

function arrowSpec(flat) {
  if (!Array.isArray(flat)) throw new Error('an arrow is a flat list of across/down numbers');
  if (flat.length % 2 !== 0) throw new Error('an arrow has a coordinate with no pair');
  if (flat.length / 2 > MAX_ARROW_POINTS) {
    throw new Error(`an arrow may have at most ${MAX_ARROW_POINTS} points`);
  }
  const points = [];
  for (let i = 0; i < flat.length; i += 2) points.push({ across: flat[i], down: flat[i + 1] });
  return { points };
}
