// The board as data. These assert the rules the rest of the tool leans on —
// that nothing mutates in place, that ids survive a deletion, and above all
// that the view is a camera: a preset switch and a shared link both work by
// changing one field and moving nothing, and the day that stops being true
// every diagram made before it silently reads wrong.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  COORD_LIMIT_YARDS,
  DEFAULT_VIEW,
  OFFICIALS,
  PLAYERS,
  TEXT_DEFAULTS,
  TEXT_MAX_LENGTH,
  TEXT_SIZE_MAX,
  TEXT_SIZE_MIN,
  TEXT_SWATCHES,
  addArrow,
  addToken,
  clampToFrame,
  commitText,
  editText,
  emptyBoard,
  findArrow,
  findToken,
  frameCentre,
  moveToken,
  openSpot,
  removeArrow,
  removeToken,
  setView,
  tokenName,
} from '../../lib/draw/state.js';
import { SIDELINE_LEFT, VIEWBOX_WIDTH, x, xToYards, y, yToYards } from '../../lib/field/geometry.js';
import { views, viewNames } from '../../lib/field/views.js';

const crew = () => {
  let board = emptyBoard();
  board = addToken(board, { type: 'official', mark: 'R', across: -4, down: -7 });
  board = addToken(board, { type: 'player', kind: 'k', across: 0, down: 0 });
  board = addToken(board, { type: 'official', mark: 'BJ', across: 12, down: 18 });
  return board;
};

test('a new board is the run/pass crop with nothing on it', () => {
  const board = emptyBoard();
  assert.equal(board.view, DEFAULT_VIEW);
  assert.deepEqual(board.tokens, []);
  assert.deepEqual(board.arrows, []);
});

test('every mutation returns a new board and leaves the old one untouched', () => {
  const before = crew();
  const snapshot = structuredClone(before);
  const after = [
    addToken(before, { type: 'player', kind: 'r', across: 3, down: 3 }),
    moveToken(before, 't1', { across: 9, down: 9 }),
    removeToken(before, 't1'),
    setView(before, 'punt'),
    addArrow(before, { points: [{ across: 0, down: 0 }, { across: 0, down: 5 }] }),
  ];
  for (const board of after) assert.notEqual(board, before);
  // The three that touch tokens rebuild the array rather than writing into
  // it; the two that don't are asserted to leave it alone further down.
  for (const board of after.slice(0, 3)) assert.notEqual(board.tokens, before.tokens);
  assert.deepEqual(before, snapshot);
});

test('a token moved twice ends where the second move put it', () => {
  let board = crew();
  board = moveToken(board, 't1', { across: 5, down: 5 });
  board = moveToken(board, 't1', { across: -11.25, down: 2.5 });
  assert.deepEqual(findToken(board, 't1'), {
    id: 't1',
    type: 'official',
    mark: 'R',
    across: -11.25,
    down: 2.5,
  });
  // The move is absolute, not a delta: the second call replaced the first.
  assert.equal(findToken(board, 't3').across, 12);
});

test('removing a token leaves the others alone, ids included', () => {
  const board = removeToken(crew(), 't2');
  assert.deepEqual(
    board.tokens.map((token) => token.id),
    ['t1', 't3'],
  );
  assert.deepEqual(findToken(board, 't3'), crew().tokens[2]);
  assert.equal(findToken(board, 't2'), null);
});

test('an id freed by a removal is reused rather than left as a hole', () => {
  // Ids are dense and derived from the board, so the same edits always make
  // the same board — which is what keeps a shared link from carrying a
  // stranger's counter along with the play.
  let board = addToken(emptyBoard(), { type: 'official', mark: 'U', across: 0, down: 1 });
  board = removeToken(board, 't1');
  board = addToken(board, { type: 'official', mark: 'U', across: 0, down: 1 });
  assert.deepEqual(
    board.tokens.map((token) => token.id),
    ['t1'],
  );
});

test('setView changes the crop and not one coordinate on the field', () => {
  // An arrow on the board too, not just tokens: `crew()` alone would leave
  // `before.arrows` as emptyBoard()'s `[]` forever, so the identity assertion
  // below would hold even if setView started copying or touching arrows.
  const before = addArrow(crew(), { points: [{ across: 0, down: 0 }, { across: 5, down: 5 }] });
  for (const name of viewNames) {
    const after = setView(before, name);
    assert.equal(after.view, name);
    // By identity, not just by value: there is no coordinate fixup here to
    // get subtly wrong, because there is no copy of the tokens or arrows.
    assert.equal(after.tokens, before.tokens);
    assert.equal(after.arrows, before.arrows);
  }
});

test('a token carries only the field its own type uses', () => {
  const board = crew();
  assert.deepEqual(Object.keys(findToken(board, 't1')), ['id', 'type', 'mark', 'across', 'down']);
  assert.deepEqual(Object.keys(findToken(board, 't2')), ['id', 'type', 'kind', 'across', 'down']);
});

test('nothing outside the allowlist reaches the board', () => {
  const board = emptyBoard();
  assert.throws(() => addToken(board, { type: 'referee', mark: 'R', across: 0, down: 0 }), /token type/);
  assert.throws(() => addToken(board, { type: 'official', mark: 'H', across: 0, down: 0 }), /official mark/);
  assert.throws(() => addToken(board, { type: 'player', kind: 'x', across: 0, down: 0 }), /player kind/);
  assert.throws(() => addToken(board, { type: 'official', mark: 'R', across: '3', down: 0 }), /finite number/);
  assert.throws(() => addToken(board, { type: 'official', mark: 'R', across: 0, down: NaN }), /finite number/);
  assert.throws(() => setView(board, 'endZone'), /unknown view/);
  assert.throws(() => moveToken(board, 't9', { across: 0, down: 0 }), /no token/);
  assert.throws(() => removeToken(board, 't9'), /no token/);
  assert.throws(() => addArrow(board, { points: [{ across: 0, down: 0 }] }), /two points/);
});

test('a view named off the prototype chain is not a view', () => {
  // `views['__proto__']` is `Object.prototype`, and `views['constructor']`
  // is a function: both truthy, so a lookup checked for truth alone lets
  // them through and every later `view.scaleY` becomes `undefined`. That is
  // a whole board of NaN coordinates, arrived at from a word a stranger put
  // in a share link.
  const board = emptyBoard();
  for (const name of ['__proto__', 'constructor', 'toString', 'valueOf', 'hasOwnProperty']) {
    assert.throws(() => setView(board, name), /unknown view/, name);
    assert.throws(() => emptyBoard(name), /unknown view/, name);
    assert.throws(() => clampToFrame({ across: 0, down: 0 }, name), /unknown view/, name);
  }
});

test('a coordinate off the end of the world is refused, not folded onto the field', () => {
  // Finite is not enough: `across: 1e9` is a perfectly good number and a
  // token nobody can ever see or click, still in the tab order and still
  // read out. It cannot be clamped either — putting it at the edge of the
  // frame would make a token nobody placed look like one somebody did.
  const board = emptyBoard();
  const far = COORD_LIMIT_YARDS + 0.5;
  assert.throws(() => addToken(board, { type: 'player', kind: 'k', across: 1e9, down: 0 }), /within/);
  assert.throws(() => addToken(board, { type: 'player', kind: 'k', across: 0, down: -far }), /within/);
  assert.throws(
    () => addArrow(board, { points: [{ across: 0, down: 0 }, { across: far, down: 0 }] }),
    /within/,
  );
  const placed = addToken(board, { type: 'player', kind: 'k', across: COORD_LIMIT_YARDS, down: 0 });
  assert.equal(placed.tokens[0].across, COORD_LIMIT_YARDS);
  assert.throws(() => moveToken(placed, 't1', { across: far, down: 0 }), /within/);
});

test('the coordinate limit is far outside anything a view can show', () => {
  // If it were not, a legitimate drag to the corner of the deepest crop
  // would start throwing — the limit is about numbers that are not
  // coordinates at all, never about where on the field a token may go.
  for (const name of viewNames) {
    const corner = clampToFrame({ across: -1e6, down: 1e6 }, name);
    assert.ok(Math.abs(corner.across) < COORD_LIMIT_YARDS, name);
    assert.ok(Math.abs(corner.down) < COORD_LIMIT_YARDS, name);
    assert.ok(Math.abs(clampToFrame({ across: 1e6, down: -1e6 }, name).down) < COORD_LIMIT_YARDS, name);
  }
});

test('the marks on the palette are the ones the position cards already draw', () => {
  assert.deepEqual(
    OFFICIALS.map((o) => o.mark),
    ['R', 'U', 'LM', 'LJ', 'BJ'],
  );
  assert.deepEqual(
    PLAYERS.map((p) => p.kind),
    ['k', 'r'],
  );
});

test('every token has a name a screen reader can read out', () => {
  assert.equal(tokenName({ type: 'official', mark: 'LJ' }), 'Line Judge');
  assert.equal(tokenName({ type: 'player', kind: 'k' }), 'offense player');
  assert.equal(tokenName({ type: 'player', kind: 'r' }), 'defense player');
  for (const official of OFFICIALS) assert.match(official.name, /^[A-Z][a-z]/);
});

test('the frame, not the sidelines, is what a token is held inside', () => {
  // The wings work from out of bounds. A tool that pulled them back onto the
  // field would be teaching a mechanic nobody uses.
  const outside = { across: xToYards(SIDELINE_LEFT) - 4, down: 2 };
  assert.deepEqual(clampToFrame(outside, 'runPass'), outside);

  const far = clampToFrame({ across: 999, down: 999 }, 'runPass');
  assert.equal(x(far.across), VIEWBOX_WIDTH);
  assert.equal(y(views.runPass, far.down), views.runPass.height);

  const near = clampToFrame({ across: -999, down: -999 }, 'runPass');
  assert.equal(x(near.across), 0);
  assert.equal(y(views.runPass, near.down), 0);
});

test('a new token lands in the middle of whatever is in frame', () => {
  for (const name of viewNames) {
    const centre = frameCentre(name);
    assert.equal(centre.across, 0);
    assert.equal(yToYards(views[name], views[name].height / 2), centre.down);
  }
});

test('a second token added to the same spot steps off the first', () => {
  // Adding a crew is one click per official. If they all land on the same
  // spot the board looks unchanged after the first one, and the tool reads
  // as broken while it is working.
  let board = emptyBoard();
  const spots = [];
  for (const mark of ['R', 'U', 'LM', 'LJ', 'BJ']) {
    const spot = openSpot(board);
    spots.push(spot);
    board = addToken(board, { type: 'official', mark, ...spot });
  }
  assert.deepEqual(spots[0], frameCentre(board.view));
  for (let i = 0; i < spots.length; i += 1) {
    for (let j = i + 1; j < spots.length; j += 1) {
      const apart = Math.hypot(spots[i].across - spots[j].across, spots[i].down - spots[j].down);
      assert.ok(apart >= 2, `${i} and ${j} are ${apart} yards apart`);
    }
  }
  // And it never steps a token off the edge of what is on screen.
  for (const spot of spots) assert.deepEqual(clampToFrame(spot, board.view), spot);
});

test('an arrow keeps its points in order and gets an id of its own', () => {
  const points = [
    { across: 0, down: 0 },
    { across: 4, down: -6 },
    { across: 8, down: -6 },
  ];
  const board = addArrow(addArrow(emptyBoard(), { points }), { points });
  assert.deepEqual(
    board.arrows.map((arrow) => arrow.id),
    ['a1', 'a2'],
  );
  assert.deepEqual(board.arrows[0].points, points);
  assert.notEqual(board.arrows[0].points, points);
});

test('an arrow is findable and removable the same way a token is', () => {
  const points = [
    { across: 0, down: 0 },
    { across: 4, down: -6 },
  ];
  let board = addArrow(addArrow(emptyBoard(), { points }), { points });
  assert.deepEqual(findArrow(board, 'a1'), { id: 'a1', points });
  assert.equal(findArrow(board, 'a9'), null);

  board = removeArrow(board, 'a1');
  assert.deepEqual(
    board.arrows.map((arrow) => arrow.id),
    ['a2'],
  );
  assert.throws(() => removeArrow(board, 'a1'), /no arrow/);
});

// ---------------------------------------------------------------------------
// Captions
//
// A caption is the one item on the board that carries free-form words and a
// colour, and from Task 7 on both of those ride in a URL a stranger can
// write. So these are not only "does the feature work" tests: the size, the
// angle and the colour each have exactly one legal shape, and these are what
// say so.
// ---------------------------------------------------------------------------

const caption = (props = {}) =>
  addToken(emptyBoard(), { type: 'text', text: 'Trips right', across: 0, down: 0, ...props })
    .tokens[0];

test('a caption with nothing set is black, 12, upright and plain', () => {
  const token = caption();
  assert.equal(token.type, 'text');
  assert.equal(token.size, TEXT_DEFAULTS.size);
  assert.equal(token.color, TEXT_DEFAULTS.color);
  assert.equal(token.bold, false);
  assert.equal(token.underline, false);
  assert.equal(token.rotate, 0);
});

test('a caption survives a change of view unmoved, like everything else', () => {
  // The view is a camera. A caption placed on the run/pass crop is at the
  // same yards on the kickoff crop; only what is in frame changes.
  let board = addToken(emptyBoard(), { type: 'text', text: 'Blitz', across: -7.5, down: 3.25 });
  const before = structuredClone(board.tokens);
  for (const name of viewNames) {
    const after = setView(board, name);
    assert.deepEqual(after.tokens, before);
    // By identity, not just by value: this cannot quietly acquire a
    // coordinate fixup for captions later.
    assert.equal(after.tokens, board.tokens);
    board = after;
  }
});

test('an angle is stored in one encoding, whichever one it arrives in', () => {
  // 450 and -270 are both 90. If the board kept them apart, a board and the
  // same board round-tripped through a share link would stop comparing
  // equal while drawing exactly the same picture.
  assert.equal(caption({ rotate: 450 }).rotate, 90);
  assert.equal(caption({ rotate: -270 }).rotate, 90);
  assert.equal(caption({ rotate: 90 }).rotate, 90);
  assert.equal(caption({ rotate: 360 }).rotate, 0);
  assert.equal(caption({ rotate: -360 }).rotate, 0);
  assert.equal(caption({ rotate: 180 }).rotate, 180);
  assert.equal(caption({ rotate: -180 }).rotate, 180);
  assert.equal(caption({ rotate: -90 }).rotate, -90);
  assert.equal(caption({ rotate: 271 }).rotate, -89);
  assert.throws(() => caption({ rotate: 'sideways' }), /rotate must be a finite number/);
});

test('a size outside the range is clamped, not rejected into a broken caption', () => {
  assert.equal(caption({ size: 1 }).size, TEXT_SIZE_MIN);
  assert.equal(caption({ size: 500 }).size, TEXT_SIZE_MAX);
  assert.equal(caption({ size: 24 }).size, 24);
  assert.throws(() => caption({ size: 'big' }), /size must be a finite number/);
});

test('a colour is black or a hex triple and is never a raw CSS string', () => {
  // `fill` accepts url(#...), so a colour that is whatever the user typed is
  // a way to point a caption at another element in the document. The value
  // comes off a URL; the check is a shape, not a list of known-bad strings.
  for (const swatch of TEXT_SWATCHES) assert.equal(caption({ color: swatch.color }).color, swatch.color);
  assert.equal(caption({ color: '#C00000' }).color, '#c00000');
  // One spelling of black, so an untouched default and the picker set to
  // black are the same stored value.
  assert.equal(caption({ color: '#000000' }).color, 'black');
  for (const bad of ['url(#ar)', 'red', 'rgb(1,2,3)', '#fff', '#0000001', 'black;fill:red', 12, null]) {
    assert.throws(() => caption({ color: bad }), /color must be/, `accepted ${JSON.stringify(bad)}`);
  }
});

test('bold and underline are booleans, not anything that happens to be truthy', () => {
  assert.equal(caption({ bold: true }).bold, true);
  assert.throws(() => caption({ bold: 'bold' }), /bold must be true or false/);
  assert.throws(() => caption({ underline: 1 }), /underline must be true or false/);
});

test('a caption is text and only text', () => {
  assert.throws(() => caption({ text: 42 }), /text must be a string/);
  assert.equal(caption({ text: 'x'.repeat(500) }).text.length, TEXT_MAX_LENGTH);
});

test('the words a caption carries are stored exactly as typed', () => {
  // Escaping is markers.js's job and happens on the way to the document, not
  // on the way into the state — if it happened here the same string would be
  // escaped again every time it was edited.
  const typed = '<script>alert(1)</script>';
  assert.equal(caption({ text: typed }).text, typed);
});

test('editing a caption changes what was asked and nothing else', () => {
  let board = addToken(emptyBoard(), { type: 'text', text: 'Trips', across: 2, down: -3 });
  const before = structuredClone(board);
  board = editText(board, 't1', { text: 'Trips right', size: 18, bold: true });
  assert.deepEqual(board.tokens[0], {
    id: 't1',
    type: 'text',
    text: 'Trips right',
    size: 18,
    color: 'black',
    bold: true,
    underline: false,
    rotate: 0,
    across: 2,
    down: -3,
  });
  assert.deepEqual(before, structuredClone(before));
  assert.equal(before.tokens[0].text, 'Trips');
  // An edit revalidates every field, so there is no path to a stored caption
  // that was legal when it was made and is not now.
  assert.throws(() => editText(board, 't1', { color: 'url(#ar)' }), /color must be/);
  assert.throws(() => editText(board, 't1', { rotate: Infinity }), /rotate must be/);
});

test('only a caption can be edited as one', () => {
  let board = addToken(emptyBoard(), { type: 'official', mark: 'R', across: 0, down: 0 });
  assert.throws(() => editText(board, 't1', { text: 'hi' }), /not a caption/);
  assert.throws(() => editText(board, 't9', { text: 'hi' }), /no token/);
});

test('a caption left blank is dropped, and one with words is kept', () => {
  // An empty caption is an invisible zero-width <text> that can only be
  // selected by accident. Same rule as the arrow too short to mean anything.
  let board = addToken(emptyBoard(), { type: 'text', text: '', across: 0, down: 0 });
  assert.equal(commitText(board, 't1').tokens.length, 0);

  board = editText(board, 't1', { text: '   ' });
  assert.equal(commitText(board, 't1').tokens.length, 0);

  board = editText(board, 't1', { text: 'Blitz' });
  // Unchanged by identity, so a caller can tell whether anything happened.
  assert.equal(commitText(board, 't1'), board);

  // A blur can land after the caption has already gone; that is not an error.
  assert.equal(commitText(board, 't9'), board);
  const official = addToken(emptyBoard(), { type: 'official', mark: 'R', across: 0, down: 0 });
  assert.equal(commitText(official, 't1'), official);
});

test('a caption answers to its own words, and says so when it has none', () => {
  assert.equal(tokenName(caption({ text: 'Trips right' })), 'Trips right');
  assert.equal(tokenName(caption({ text: '' })), 'Empty caption');
});

test('a caption is a token: it is found, moved, removed and numbered like one', () => {
  let board = crew();
  board = addToken(board, { type: 'text', text: 'Blitz', across: 0, down: 0 });
  assert.equal(board.tokens.length, 4);
  assert.equal(findToken(board, 't4').text, 'Blitz');
  board = moveToken(board, 't4', { across: -10, down: 6 });
  assert.deepEqual(
    { across: findToken(board, 't4').across, down: findToken(board, 't4').down },
    { across: -10, down: 6 },
  );
  assert.equal(findToken(board, 't4').text, 'Blitz');
  board = removeToken(board, 't4');
  assert.equal(findToken(board, 't4'), null);
  assert.equal(board.tokens.length, 3);
});

test('a caption is stepped off the pile like any other new token', () => {
  let board = emptyBoard();
  board = addToken(board, { type: 'official', mark: 'R', ...frameCentre(board.view) });
  const spot = openSpot(board);
  assert.notDeepEqual(spot, frameCentre(board.view));
  board = addToken(board, { type: 'text', text: 'Blitz', ...spot });
  assert.deepEqual(clampToFrame(spot, board.view), spot);
});
