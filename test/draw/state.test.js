// The board as data. These assert the rules the rest of the tool leans on —
// that nothing mutates in place, that ids survive a deletion, and above all
// that the view is a camera: a preset switch and a shared link both work by
// changing one field and moving nothing, and the day that stops being true
// every diagram made before it silently reads wrong.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_VIEW,
  OFFICIALS,
  PLAYERS,
  addArrow,
  addToken,
  clampToFrame,
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
  const before = crew();
  for (const name of viewNames) {
    const after = setView(before, name);
    assert.equal(after.view, name);
    // By identity, not just by value: there is no coordinate fixup here to
    // get subtly wrong, because there is no copy of the tokens at all.
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
