// The share link's payload. Half of this file is a round trip and the other
// half is hostility, because the payload arrives off a URL: anyone can hand
// an official a link to the real /draw with anything at all after the `#`,
// and from the captions on it carries free text, a colour, a size and an
// angle that all end up in the document.
//
// So the assertions here are mostly about what does *not* happen. A crafted
// value is dropped and never repaired into a plausible one; a bad payload
// comes back as `null` and never as a throw, because the caller's answer to
// `null` is the default board and a notice, and a page that threw instead
// would be a blank screen and a console nobody holding the link will open.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_ARROWS,
  MAX_ARROW_POINTS,
  MAX_PAYLOAD_CHARS,
  MAX_TOKENS,
  VERSION,
  decode,
  encode,
  tooBigForALink,
} from '../../lib/draw/codec.js';
import {
  COORD_BOUNDS,
  TEXT_MAX_LENGTH,
  TEXT_SIZE_MAX,
  addArrow,
  addToken,
  emptyBoard,
} from '../../lib/draw/state.js';
import { PRESETS, boardFromPreset } from '../../lib/draw/presets.js';
import { label } from '../../lib/field/markers.js';
import { views } from '../../lib/field/views.js';

/**
 * Builds a payload from raw JSON text, which is the only way to write the
 * values this file most needs to test: `JSON.stringify` turns `Infinity`
 * and `NaN` into `null`, and an object literal cannot carry a real
 * `__proto__` key at all.
 */
function wireJson(json) {
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const wire = (value) => wireJson(JSON.stringify(value));

/** The JSON a payload actually carries, for asserting what was left out of it. */
function unwire(payload) {
  const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

/** A payload holding one caption, with `style` as its styling object. */
const caption = (style, text = 'Caption') =>
  wire({ v: VERSION, w: 'runPass', t: [['x', text, 0, 0, style]] });

const board = () => {
  let state = emptyBoard('punt');
  state = addToken(state, { type: 'official', mark: 'HL', across: -30.7, down: 12.5 });
  state = addToken(state, { type: 'player', kind: 'k', across: 0, down: 0 });
  state = addToken(state, { type: 'player', kind: 'r', across: 4.5, down: -3.2 });
  state = addToken(state, {
    type: 'text',
    text: 'Wing holds the sideline',
    across: 2.5,
    down: 5.5,
    size: 18,
    color: '#c00000',
    bold: true,
    underline: true,
    rotate: 90,
  });
  return addArrow(state, {
    points: [
      { across: 0, down: 0 },
      { across: 1.5, down: 5.5 },
      { across: -2, down: 9 },
    ],
  });
};

// ---------------------------------------------------------------------------
// The round trip
// ---------------------------------------------------------------------------

test('a board with tokens, arrows and a styled caption survives a round trip', () => {
  const before = board();
  assert.deepEqual(decode(encode(before)), before);
});

test('every view round-trips, and the view is what comes back', () => {
  for (const view of Object.keys(views)) {
    assert.equal(decode(encode(emptyBoard(view))).view, view);
  }
});

test('a caption round-trips text no `btoa` could take on its own', () => {
  // Anything above U+00FF is what `btoa(json)` throws on, which is why the
  // encoder goes through TextEncoder first. Every one of these is something
  // a keyboard on a phone produces.
  for (const text of ['Über der Seitenlinie', 'サイドライン', '🏈 first and ten', 'naïve — “quoted”']) {
    const state = addToken(emptyBoard(), { type: 'text', text, across: 0, down: 0 });
    assert.equal(decode(encode(state)).tokens[0].text, text);
  }
});

test('the encoding is base64url and nothing else', () => {
  const payload = encode(board());
  assert.match(payload, /^[A-Za-z0-9_-]+$/);
  // Spelled out as well as covered by the class above, because these three
  // are the whole reason the alphabet is what it is: each needs
  // percent-encoding in a URL and each gets mangled somewhere on the way.
  for (const character of ['+', '/', '=']) assert.equal(payload.includes(character), false);
});

test('coordinates are rounded to one decimal, and that is what comes back', () => {
  const state = addToken(emptyBoard(), { type: 'player', kind: 'k', across: 3.14159, down: -2.71828 });
  const token = decode(encode(state)).tokens[0];
  assert.equal(token.across, 3.1);
  assert.equal(token.down, -2.7);
});

test('a caption still at its defaults writes no styling at all', () => {
  const state = addToken(emptyBoard(), { type: 'text', text: 'Plain', across: 0, down: 0 });
  const json = unwire(encode(state));
  assert.equal(json, '{"v":1,"w":"runPass","t":[["x","Plain",0,0]]}');
});

test('a caption writes only the fields that moved off their defaults', () => {
  const state = addToken(emptyBoard(), {
    type: 'text',
    text: 'Bold',
    across: 0,
    down: 0,
    bold: true,
    size: 24,
  });
  const json = unwire(encode(state));
  assert.equal(json.includes('"s":24'), true);
  assert.equal(json.includes('"b":1'), true);
  // The three untouched ones cost nothing.
  for (const key of ['"c"', '"u"', '"r"']) assert.equal(json.includes(key), false);
});

test('an empty board is a payload with no token or arrow list at all', () => {
  assert.equal(unwire(encode(emptyBoard())), '{"v":1,"w":"runPass"}');
});

test('a full board of a crew and both teams stays short enough to paste', () => {
  // The size claim the format exists for: 26 tokens is the biggest preset on
  // the board, and it has to land somewhere a text message will not wrap.
  let state = emptyBoard('kickoff');
  for (let i = 0; i < 5; i += 1) {
    state = addToken(state, { type: 'official', mark: 'R', across: i * 2, down: i });
  }
  for (let i = 0; i < 22; i += 1) {
    state = addToken(state, { type: 'player', kind: i < 11 ? 'k' : 'r', across: i - 11, down: i * 0.5 });
  }
  assert.equal(state.tokens.length, 27);
  assert.ok(encode(state).length < 1000, `27 tokens encoded to ${encode(state).length} characters`);
});

// ---------------------------------------------------------------------------
// Payloads that are not payloads
//
// Every one of these returns `null`. None of them throws — `assert.doesNotThrow`
// is not enough on its own here, so each is checked for the value as well.
// ---------------------------------------------------------------------------

test('decode returns null, and never throws, for anything that is not a payload', () => {
  const rubbish = {
    'an empty string': '',
    'not a string at all': null,
    'a number': 42,
    'an object': {},
    'punctuation outside the alphabet': '!!!!',
    'plain base64, with the characters base64url replaces': 'e3YiOjF9+/==',
    'a run of letters that decodes to nothing meaningful': 'notvalidbase64',
    'base64 of text that is not JSON': wireJson('this is not JSON'),
    'base64 of a JSON fragment': wireJson('{"v":1,'),
    'a length no base64 can have': 'A',
    'bytes that are not UTF-8': btoa('\xff\xfe\xff').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  };
  for (const [what, payload] of Object.entries(rubbish)) {
    assert.equal(decode(payload), null, what);
  }
});

test('valid JSON that is not an object is not a board', () => {
  for (const value of [null, 5, 'a board', true, [1, 2, 3], [{ v: 1 }]]) {
    assert.equal(decode(wire(value)), null, JSON.stringify(value));
  }
});

test('a payload with no version, or a version this does not read, fails whole', () => {
  assert.equal(decode(wire({ w: 'runPass', t: [] })), null, 'no version');
  assert.equal(decode(wire({ v: '1', w: 'runPass' })), null, 'the version as a string');
  assert.equal(decode(wire({ v: 0, w: 'runPass' })), null, 'version 0');
  // The point of the field: a link from a future version fails cleanly here
  // rather than half-loading a board missing whatever that version added.
  assert.equal(decode(wire({ v: 2, w: 'runPass' })), null, 'a version from the future');
  assert.deepEqual(decode(wire({ v: 1, w: 'runPass' })), emptyBoard('runPass'));
});

test('a payload naming no view, or a view this site does not have, fails whole', () => {
  // Not defaulted to the run/pass crop. Every coordinate on the board is
  // read against the view's anchor line, so a board drawn under a crop
  // nobody asked for is a wrong play shown confidently.
  assert.equal(decode(wire({ v: 1, t: [['p', 'k', 0, 0]] })), null, 'no view');
  assert.equal(decode(wire({ v: 1, w: 'sideline', t: [] })), null, 'a view that does not exist');
  assert.equal(decode(wire({ v: 1, w: '__proto__', t: [] })), null, 'a view named off the prototype');
  assert.equal(decode(wire({ v: 1, w: 42, t: [] })), null, 'a view that is not a string');
});

test('a payload too long to be a board is refused before it is parsed', () => {
  assert.equal(decode('A'.repeat(MAX_PAYLOAD_CHARS + 1)), null);
});

// ---------------------------------------------------------------------------
// Hostile items: dropped, never repaired
// ---------------------------------------------------------------------------

test('a mark that is not a mark is dropped, not turned into one', () => {
  for (const mark of ['<script>', 'R"', '', 'RR', 'r', 'ZZ', 42, null, ['R']]) {
    const state = decode(wire({ v: 1, w: 'runPass', t: [['o', mark, 0, 0]] }));
    assert.deepEqual(state.tokens, [], JSON.stringify(mark));
  }
});

test('a token tag that is not one of the three is dropped', () => {
  for (const tag of ['q', 'O', '', 'official', 0, null, {}]) {
    const state = decode(wire({ v: 1, w: 'runPass', t: [[tag, 'R', 0, 0]] }));
    assert.deepEqual(state.tokens, [], JSON.stringify(tag));
  }
});

test('a player side that is not a side is dropped', () => {
  for (const kind of ['x', 'K', 'offense', 1, null]) {
    assert.deepEqual(decode(wire({ v: 1, w: 'runPass', t: [['p', kind, 0, 0]] })).tokens, []);
  }
});

test('a coordinate that is not a finite number on the field is dropped', () => {
  // `1e999` is how a payload writes Infinity — `JSON.stringify` cannot, but
  // `JSON.parse` reads it, so this is exactly what would arrive off a URL.
  const infinite = wireJson('{"v":1,"w":"runPass","t":[["p","k",1e999,0]]}');
  assert.deepEqual(decode(infinite).tokens, [], 'Infinity');

  for (const across of [1e9, -1e9, 201, '0', null, true, {}, [0]]) {
    const state = decode(wire({ v: 1, w: 'runPass', t: [['p', 'k', across, 0]] }));
    assert.deepEqual(state.tokens, [], JSON.stringify(across));
  }
  // Dropped and not clamped: a token a billion yards out must not come back
  // as one sitting at the edge of the frame, where it looks placed.
  assert.deepEqual(decode(wire({ v: 1, w: 'runPass', t: [['p', 'k', 1e9, 0]] })).tokens, []);
});

test('a coordinate no view could show is dropped, however modest the number', () => {
  // The harm is not the size of the number, it is that the token lands
  // where nobody can see or click it while still holding a tabindex and an
  // accessible name — so a keyboard or screen-reader user tabs through
  // phantoms. 199.9 does that as thoroughly as 1e9 does.
  const state = decode(
    wire({ v: 1, w: 'runPass', t: [['p', 'k', 199.9, -199.9], ['p', 'r', 0, 0]] }),
  );
  assert.equal(state.tokens.length, 1, 'the off-screen token should be gone');
  assert.deepEqual(state.tokens[0].kind, 'r');

  // Just outside every edge of the bound, and just inside it.
  for (const at of [
    { across: COORD_BOUNDS.across[1] + 0.1, down: 0 },
    { across: COORD_BOUNDS.across[0] - 0.1, down: 0 },
    { across: 0, down: COORD_BOUNDS.down[1] + 0.1 },
    { across: 0, down: COORD_BOUNDS.down[0] - 0.1 },
  ]) {
    const payload = wire({ v: 1, w: 'runPass', t: [['p', 'k', at.across, at.down]] });
    assert.deepEqual(decode(payload).tokens, [], JSON.stringify(at));
  }
  const edge = wire({
    v: 1,
    w: 'runPass',
    t: [['p', 'k', COORD_BOUNDS.across[1], COORD_BOUNDS.down[1]]],
  });
  assert.equal(decode(edge).tokens.length, 1, 'the bound itself is legal');
});

test('a token row that is not a row of four is dropped', () => {
  for (const row of [[], ['p'], ['p', 'k'], ['p', 'k', 0], 'pk00', { 0: 'p' }, null]) {
    assert.deepEqual(decode(wire({ v: 1, w: 'runPass', t: [row] })).tokens, [], JSON.stringify(row));
  }
});

test('one bad token does not cost the rest of the play', () => {
  const state = decode(
    wire({
      v: 1,
      w: 'runPass',
      t: [
        ['o', 'R', -4, -7],
        ['o', '<script>', 0, 0],
        ['p', 'k', 0, 0],
        ['x', 'ok', 1, 1, { c: 'url(#x)' }],
        ['p', 'r', 2, 2],
      ],
    }),
  );
  assert.equal(state.tokens.length, 3);
  assert.deepEqual(
    state.tokens.map((token) => token.type),
    ['official', 'player', 'player'],
  );
  // Ids are re-derived in the order the survivors were added, so they are
  // dense: a dropped token leaves no gap behind it.
  assert.deepEqual(
    state.tokens.map((token) => token.id),
    ['t1', 't2', 't3'],
  );
});

test('a `__proto__` key pollutes nothing and reaches no token', () => {
  const payloads = [
    '{"v":1,"w":"runPass","__proto__":{"polluted":"yes"},"t":[["p","k",0,0]]}',
    '{"v":1,"w":"runPass","t":[["x","hi",0,0,{"s":18,"__proto__":{"polluted":"yes"}}]]}',
    '{"v":1,"w":"runPass","t":[["x","hi",0,0,{"constructor":{"prototype":{"polluted":"yes"}}}]]}',
  ];
  for (const json of payloads) {
    const state = decode(wireJson(json));
    assert.notEqual(state, null, json);
    assert.equal({}.polluted, undefined, json);
    assert.equal(Object.prototype.polluted, undefined, json);
    for (const token of state.tokens) {
      assert.equal(Object.hasOwn(token, 'polluted'), false);
      assert.equal(Object.hasOwn(token, '__proto__'), false);
    }
  }
});

test('ten thousand tokens is not a board, and is refused rather than drawn', () => {
  const many = Array.from({ length: 10_000 }, () => ['p', 'k', 0, 0]);
  assert.equal(decode(wire({ v: 1, w: 'runPass', t: many })), null);
  // The boundary, so the cap is a real number rather than an approximate one.
  const atCap = Array.from({ length: MAX_TOKENS }, () => ['p', 'k', 0, 0]);
  assert.equal(decode(wire({ v: 1, w: 'runPass', t: atCap })).tokens.length, MAX_TOKENS);
  assert.equal(decode(wire({ v: 1, w: 'runPass', t: [...atCap, ['p', 'k', 0, 0]] })), null);
});

test('a token or arrow list that is not a list fails the payload', () => {
  assert.equal(decode(wire({ v: 1, w: 'runPass', t: 'many' })), null);
  assert.equal(decode(wire({ v: 1, w: 'runPass', t: { 0: ['p', 'k', 0, 0] } })), null);
  assert.equal(decode(wire({ v: 1, w: 'runPass', a: 5 })), null);
});

// ---------------------------------------------------------------------------
// Arrows
// ---------------------------------------------------------------------------

test('an arrow that is not a run of coordinate pairs is dropped', () => {
  for (const flat of [[0, 0], [0], [0, 0, 0], 'line', null, { points: [] }, [0, 0, '1', 1]]) {
    const state = decode(wire({ v: 1, w: 'runPass', a: [flat] }));
    assert.deepEqual(state.arrows, [], JSON.stringify(flat));
  }
});

test('an arrow with more points than a link may carry is dropped, and only it', () => {
  const long = Array.from({ length: (MAX_ARROW_POINTS + 1) * 2 }, (unused, i) => i % 7);
  const state = decode(wire({ v: 1, w: 'runPass', a: [[0, 0, 0, 5], long] }));
  assert.equal(state.arrows.length, 1);
});

test('too many arrows fails the payload rather than drawing the cap of them', () => {
  const many = Array.from({ length: MAX_ARROWS + 1 }, () => [0, 0, 0, 5]);
  assert.equal(decode(wire({ v: 1, w: 'runPass', a: many })), null);
});

// ---------------------------------------------------------------------------
// Captions
//
// The only free text in the payload, and so the only part a stranger fully
// controls. Each of these is a different mistake, so each is its own case.
// ---------------------------------------------------------------------------

test('a colour that is really a reference is dropped, and takes its caption with it', () => {
  // SVG's `fill` accepts `url(#thing)`. A colour that is a reference is how
  // a well-formed payload starts pointing at something it should not, so
  // there is no repairing this into a colour — the caption goes.
  assert.deepEqual(decode(caption({ c: 'url(#x)' })).tokens, []);
  assert.deepEqual(decode(caption({ c: "url('#x')" })).tokens, []);
  assert.deepEqual(decode(caption({ c: 'url(#x) black' })).tokens, []);
});

test('a named colour that is not the board’s own black is dropped', () => {
  for (const c of ['red', 'currentColor', 'inherit', 'rgb(255,0,0)', '#c00000 ']) {
    assert.deepEqual(decode(caption({ c })).tokens, [], c);
  }
  assert.equal(decode(caption({ c: 'black' })).tokens.length, 1);
});

test('a three-digit hex colour is dropped, not expanded to six', () => {
  // Decided rather than inherited: `state.js` takes `#rrggbb` and nothing
  // else, and widening `#fff` here would be this file keeping a second,
  // looser idea of what a colour is.
  assert.deepEqual(decode(caption({ c: '#fff' })).tokens, []);
  assert.deepEqual(decode(caption({ c: '#ffff' })).tokens, []);
  assert.deepEqual(decode(caption({ c: '#ffffff00' })).tokens, []);
  assert.equal(decode(caption({ c: '#ffffff' })).tokens[0].color, '#ffffff');
});

test('a colour that is not a string at all is dropped', () => {
  for (const c of [0, null, true, ['#ffffff'], { color: '#ffffff' }]) {
    assert.deepEqual(decode(caption({ c })).tokens, [], JSON.stringify(c));
  }
});

test('an absurd size is clamped to the range the slider has, not dropped', () => {
  // A number off the end of a range is a control dragged too far, and the
  // nearest legal value is obviously what was meant — unlike a colour.
  assert.equal(decode(caption({ s: 1e6 })).tokens[0].size, TEXT_SIZE_MAX);
  assert.equal(decode(caption({ s: -1e6 })).tokens[0].size, 6);
});

test('a size that is not a number is dropped', () => {
  for (const s of ['18', null, true, [18], {}]) {
    assert.deepEqual(decode(caption({ s })).tokens, [], JSON.stringify(s));
  }
  assert.deepEqual(decode(wireJson('{"v":1,"w":"runPass","t":[["x","c",0,0,{"s":1e999}]]}')).tokens, []);
});

test('an angle that is not a number is dropped', () => {
  // `NaN` cannot be written in JSON at all: `JSON.stringify(NaN)` is `null`,
  // which is the shape a NaN angle would actually arrive in. Silently
  // accepting it would produce a `transform` the browser ignores and a
  // caption that vanishes with no error anywhere.
  assert.deepEqual(decode(caption({ r: null })).tokens, [], 'a NaN written to JSON');
  assert.deepEqual(decode(wireJson('{"v":1,"w":"runPass","t":[["x","c",0,0,{"r":1e999}]]}')).tokens, []);
  for (const r of ['90', true, [90], {}]) {
    assert.deepEqual(decode(caption({ r })).tokens, [], JSON.stringify(r));
  }
});

test('an angle is folded into the one turn, so two spellings are one board', () => {
  assert.equal(decode(caption({ r: 450 })).tokens[0].rotate, 90);
  assert.equal(decode(caption({ r: -270 })).tokens[0].rotate, 90);
});

test('a flag that is not the wire’s `1` is dropped rather than read as true', () => {
  for (const b of ['yes', 'true', 2, [], {}, 'false', 0]) {
    assert.deepEqual(decode(caption({ b })).tokens, [], JSON.stringify(b));
  }
  assert.equal(decode(caption({ b: 1 })).tokens[0].bold, true);
  assert.equal(decode(caption({ u: 1 })).tokens[0].underline, true);
  assert.equal(decode(caption({ s: 18 })).tokens[0].bold, false, 'absent means the default');
});

test('a caption’s styling that is not an object is dropped', () => {
  for (const style of ['bold', 5, ['s', 18], true]) {
    const payload = wire({ v: 1, w: 'runPass', t: [['x', 'c', 0, 0, style]] });
    assert.deepEqual(decode(payload).tokens, [], JSON.stringify(style));
  }
  assert.equal(decode(wire({ v: 1, w: 'runPass', t: [['x', 'c', 0, 0, null]] })).tokens.length, 1);
});

test('a caption that is not a string is dropped', () => {
  for (const text of [0, null, true, ['words'], {}]) {
    assert.deepEqual(decode(wire({ v: 1, w: 'runPass', t: [['x', text, 0, 0]] })).tokens, []);
  }
});

test('a caption longer than the field allows is cut to length', () => {
  const long = 'x'.repeat(10_000);
  const token = decode(wire({ v: 1, w: 'runPass', t: [['x', long, 0, 0]] })).tokens[0];
  assert.equal(token.text.length, TEXT_MAX_LENGTH);
});

test('a caption of a megabyte is refused before anything is parsed', () => {
  // Over the payload ceiling, so this never reaches `atob` or `JSON.parse`
  // at all — which is the point of having a ceiling on the string itself.
  const payload = wire({ v: 1, w: 'runPass', t: [['x', 'x'.repeat(1024 * 1024), 0, 0]] });
  assert.ok(payload.length > MAX_PAYLOAD_CHARS);
  assert.equal(decode(payload), null);
});

test('a caption of markup survives as those literal characters and as nothing else', () => {
  const text = '<script>alert(1)</script>';
  const token = decode(wire({ v: 1, w: 'runPass', t: [['x', text, 0, 0]] })).tokens[0];
  // It is text. Not stripped, not rewritten — a caption reading
  // "<script>alert(1)</script>" is a caption somebody is allowed to write.
  assert.equal(token.text, text);

  // And what the board draws for it is escaped, which is the half that
  // matters: `label()` is the only path a caption takes to the document.
  const svg = label({ ...token, at: { across: token.across, down: token.down } }, views.runPass);
  assert.equal(svg.includes('<script'), false);
  assert.equal(svg.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), true);
});

test('a caption cannot break out of an attribute either', () => {
  const text = '" onload="alert(1)';
  const token = decode(wire({ v: 1, w: 'runPass', t: [['x', text, 0, 0]] })).tokens[0];
  assert.equal(token.text, text);
  const svg = label({ ...token, at: { across: 0, down: 0 } }, views.runPass);
  // The words are still there and still say what they said — it is only the
  // quote that closes an attribute that is gone.
  assert.equal(svg.includes('" onload="'), false);
  assert.equal(svg.includes('&quot; onload=&quot;alert(1)'), true);
});

// ---------------------------------------------------------------------------
// The links people have already sent
// ---------------------------------------------------------------------------

/**
 * A version-1 payload written out by hand and frozen here, decoding to the
 * board below it. Deliberately **not** produced by `encode` at test time:
 * generating it would make this test agree with whatever the encoder does
 * today, which is exactly the agreement a refactor breaks silently. This is
 * the one test that fails when a change to the format quietly invalidates
 * every link anybody has already shared.
 *
 * The JSON inside it, for anyone reading this later:
 *
 *   {"v":1,"w":"runPass",
 *    "t":[["o","R",-4,-7],
 *         ["p","k",0,0],
 *         ["x","Hold the wing",2.5,5.5,{"s":18,"c":"#c00000","b":1,"r":90}]],
 *    "a":[[0,0,0,5,3,9]]}
 */
const VERSION_1_LINK =
  'eyJ2IjoxLCJ3IjoicnVuUGFzcyIsInQiOltbIm8iLCJSIiwtNCwtN10sWyJwIiwiayIsMCwwXSxbIngiLCJIb2xkIH' +
  'RoZSB3aW5nIiwyLjUsNS41LHsicyI6MTgsImMiOiIjYzAwMDAwIiwiYiI6MSwiciI6OTB9XV0sImEiOltbMCwwLDAs' +
  'NSwzLDldXX0';

test('a version-1 link written before any of this still opens', () => {
  assert.deepEqual(decode(VERSION_1_LINK), {
    view: 'runPass',
    tokens: [
      { id: 't1', type: 'official', mark: 'R', across: -4, down: -7 },
      { id: 't2', type: 'player', kind: 'k', across: 0, down: 0 },
      {
        id: 't3',
        type: 'text',
        text: 'Hold the wing',
        size: 18,
        color: '#c00000',
        bold: true,
        underline: false,
        rotate: 90,
        across: 2.5,
        down: 5.5,
      },
    ],
    arrows: [
      {
        id: 'a1',
        points: [
          { across: 0, down: 0 },
          { across: 0, down: 5 },
          { across: 3, down: 9 },
        ],
      },
    ],
  });
});

test('that same link re-encodes to itself, so a board opened and shared again is unchanged', () => {
  assert.equal(encode(decode(VERSION_1_LINK)), VERSION_1_LINK);
});

// ---------------------------------------------------------------------------
// Boards too big for a link
// ---------------------------------------------------------------------------

test('every preset survives the trip with nothing dropped', () => {
  // The ten boards this tool actually ships. A cap or a bound that ever
  // started refusing one of these would be silently breaking the mechanics
  // the page exists to teach, and it would break them only for the people
  // who shared a link rather than for the person who drew it.
  for (const preset of PRESETS) {
    const before = boardFromPreset(preset);
    const after = decode(encode(before));
    assert.notEqual(after, null, preset.id);
    assert.equal(after.view, before.view, preset.id);
    assert.equal(after.tokens.length, before.tokens.length, preset.id);
    assert.equal(after.arrows.length, before.arrows.length, preset.id);
    for (const [i, token] of before.tokens.entries()) {
      const back = after.tokens[i];
      assert.equal(back.id, token.id, `${preset.id} token ${i}`);
      assert.equal(back.type, token.type, `${preset.id} token ${i}`);
      assert.equal(back.mark, token.mark, `${preset.id} token ${i}`);
      assert.equal(back.kind, token.kind, `${preset.id} token ${i}`);
      // The only difference allowed is the one-decimal rounding, and it has
      // to be exactly that — asserted against the rounding itself rather
      // than against a tolerance, so a coordinate that drifted for any
      // other reason cannot hide inside the allowance.
      const to1 = (value) => Math.round(value * 10) / 10;
      assert.equal(back.across, to1(token.across), `${preset.id} token ${i} across`);
      assert.equal(back.down, to1(token.down), `${preset.id} token ${i} down`);
    }
    assert.equal(tooBigForALink(before), null, preset.id);
  }
});

test('a board that fits says nothing', () => {
  assert.equal(tooBigForALink(emptyBoard()), null);
  assert.equal(tooBigForALink(board()), null);
});

test('a board past a cap says which cap, and by how much', () => {
  // `encode` will happily write these; `decode` will not read them back the
  // same. The point of the message is that somebody pressing Copy link is
  // told what to take off, rather than handed a link that quietly is not
  // the board they are looking at.
  const many = { ...emptyBoard(), tokens: Array.from({ length: MAX_TOKENS + 3 }, () => ({})) };
  assert.match(tooBigForALink(many), /203 markers and captions/);
  assert.match(tooBigForALink(many), new RegExp(`link can carry ${MAX_TOKENS}`));
  assert.match(tooBigForALink(many), /Remove 3/);

  const crowded = { ...emptyBoard(), arrows: Array.from({ length: MAX_ARROWS + 1 }, () => ({ points: [] })) };
  assert.match(tooBigForALink(crowded), /51 arrows/);
  assert.match(tooBigForALink(crowded), /Remove 1/);

  const bent = {
    ...emptyBoard(),
    arrows: [{ id: 'a1', points: Array.from({ length: MAX_ARROW_POINTS + 1 }, () => ({ across: 0, down: 0 })) }],
  };
  assert.match(tooBigForALink(bent), /One arrow has 41 points/);
  assert.match(tooBigForALink(bent), new RegExp(`link can carry ${MAX_ARROW_POINTS}`));
});

test('the warning fires exactly where the decoder would lose something', () => {
  // The two have to agree on the boundary, or the button reassures somebody
  // about a link that does not open — or refuses one that would have.
  const atCap = { ...emptyBoard(), arrows: [{ id: 'a1', points: straight(MAX_ARROW_POINTS) }] };
  assert.equal(tooBigForALink(atCap), null);
  assert.equal(decode(encode(atCap)).arrows.length, 1);

  const overCap = { ...emptyBoard(), arrows: [{ id: 'a1', points: straight(MAX_ARROW_POINTS + 1) }] };
  assert.notEqual(tooBigForALink(overCap), null);
  // What the warning is standing in front of: the arrow simply vanishes.
  assert.equal(decode(encode(overCap)).arrows.length, 0);
});

/** A path of `count` points, each a tenth of a yard further down the field. */
const straight = (count) => Array.from({ length: count }, (unused, i) => ({ across: 0, down: i * 0.1 }));

// --- The Head Line Judge rename ------------------------------------------
// The 2026 NFHS manual renamed the Head Linesman to Head Line Judge and
// letters him HL. Links written before that carry the old mark, and one an
// official already texted to a crewmate has to keep opening the same board.
test('a share link written before the Head Line Judge rename still decodes', () => {
  const state = decode(wire({ v: VERSION, w: 'runPass', t: [['o', 'LM', -30.7, 12.5]] }));
  assert.equal(state.tokens.length, 1, 'the old mark was dropped as an unknown official');
  assert.equal(state.tokens[0].mark, 'HL');
});

test('a link written after the rename round-trips as HL', () => {
  const state = decode(wire({ v: VERSION, w: 'runPass', t: [['o', 'HL', -30.7, 12.5]] }));
  assert.equal(state.tokens[0].mark, 'HL');
  assert.equal(decode(encode(state)).tokens[0].mark, 'HL');
});
