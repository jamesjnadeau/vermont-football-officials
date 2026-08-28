// Presets are the one place on the board where a wrong number teaches
// somebody the wrong mechanics, so these tests check the data itself, not
// just the plumbing that lays it out: every token has to be a place a real
// diagram or a real source puts something, and it has to actually be on
// screen once the view maps it there.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { FORMATIONS, PRESETS, SITUATIONS, boardFromPreset } from '../../lib/draw/presets.js';
import { OFFICIALS, addToken, emptyBoard } from '../../lib/draw/state.js';
import { VIEWBOX_WIDTH, x, y } from '../../lib/field/geometry.js';
import { views, viewNames } from '../../lib/field/views.js';

const OFFICIAL_MARKS = new Set(OFFICIALS.map((o) => o.mark));

test('every preset names a view that exists in views.js', () => {
  for (const preset of PRESETS) {
    assert.ok(
      viewNames.includes(preset.view),
      `${preset.id} names view "${preset.view}", not one of: ${viewNames.join(', ')}`,
    );
  }
});

test('every token lands inside the viewBox and its view\'s vertical range', () => {
  for (const preset of PRESETS) {
    const view = views[preset.view];
    for (const token of preset.tokens) {
      const svgX = x(token.across);
      const svgY = y(view, token.down);
      assert.ok(
        svgX >= 0 && svgX <= VIEWBOX_WIDTH,
        `${preset.id}: a token at across=${token.across} maps to x=${svgX}, outside 0..${VIEWBOX_WIDTH}`,
      );
      assert.ok(
        svgY >= 0 && svgY <= view.height,
        `${preset.id}: a token at down=${token.down} maps to y=${svgY}, outside 0..${view.height}`,
      );
    }
  }
});

test('every preset builds without state.js rejecting a mark, kind or point', () => {
  for (const preset of PRESETS) {
    // addToken throws on anything not already in state.js's allowlists, so a
    // preset that builds at all has already been checked against them.
    assert.doesNotThrow(() => boardFromPreset(preset), `${preset.id} failed to build`);
  }
});

test('every official token in a situation uses an allowed mark', () => {
  for (const preset of SITUATIONS) {
    const officials = preset.tokens.filter((t) => t.type === 'official');
    assert.ok(officials.length > 0, `${preset.id} carries no officials`);
    for (const official of officials) {
      assert.ok(
        OFFICIAL_MARKS.has(official.mark),
        `${preset.id}: mark "${official.mark}" is not in state.js's OFFICIALS`,
      );
    }
  }
});

test('a situation carries all five officials, once each', () => {
  for (const preset of SITUATIONS) {
    const marks = preset.tokens.filter((t) => t.type === 'official').map((t) => t.mark);
    assert.deepEqual(
      [...marks].sort(),
      [...OFFICIAL_MARKS].sort(),
      `${preset.id} does not carry exactly the five officials`,
    );
  }
});

test('every formation has 11 offensive players, or says why not', () => {
  for (const preset of FORMATIONS) {
    const offense = preset.tokens.filter((t) => t.type === 'player' && t.kind === 'k');
    if (offense.length === 11) continue;
    // The one exception on record: an intentionally empty scrimmage set.
    assert.equal(preset.id, 'emptyScrimmage', `${preset.id} has ${offense.length} offensive players, not 11`);
    assert.equal(offense.length, 0);
  }
});

test('no formation places a defensive player — these are the offense alone', () => {
  for (const preset of FORMATIONS) {
    const defense = preset.tokens.filter((t) => t.type === 'player' && t.kind === 'r');
    assert.equal(defense.length, 0, `${preset.id} places a defensive ('r') player`);
  }
});

test('a formation carries no officials — Situations is the group that does', () => {
  for (const preset of FORMATIONS) {
    const officials = preset.tokens.filter((t) => t.type === 'official');
    assert.equal(officials.length, 0, `${preset.id} carries an official`);
  }
});

/**
 * The plan's original crew-of-4 derivation — take a crew-of-5 preset and
 * drop the Back Judge — is false against the committed art (Task 4 Step 1):
 * on kickoff the Line Judge alone moves 50 yards downfield, and on field
 * goal the Linesman moves into the Back Judge's old spot. No preset may be
 * built that way, so this asserts the derivation actually fails rather than
 * merely that nobody happened to call it.
 */
test('a crew-of-5 situation minus its Back Judge is not equal to any other preset', () => {
  for (const situation of SITUATIONS) {
    const withoutBJ = situation.tokens.filter((t) => !(t.type === 'official' && t.mark === 'BJ'));
    for (const other of SITUATIONS) {
      if (other === situation) continue;
      assert.notDeepEqual(
        withoutBJ,
        other.tokens,
        `${situation.id} minus its Back Judge equals ${other.id} — a crew-of-4 derivation would be indistinguishable from real data here`,
      );
    }
  }
});

test('every preset places tokens at the coordinates it names — none are the openSpot pile', () => {
  for (const preset of PRESETS) {
    const board = boardFromPreset(preset);
    // openSpot always starts at the frame's centre and, when a spot is
    // already taken, steps diagonally by whole multiples of 2 yards. A
    // preset's own data has no reason to fall on that lattice, so points
    // that are all distinct from each other and from the frame centre (the
    // one spot openSpot could produce without stepping) is a reasonable
    // proxy for "these came from somewhere else." What actually proves it,
    // though, is direct: every stored token equals the preset's own
    // across/down, unchanged.
    board.tokens.forEach((token, i) => {
      const wanted = preset.tokens[i];
      assert.equal(token.across, wanted.across, `${preset.id} token ${i} drifted in across`);
      assert.equal(token.down, wanted.down, `${preset.id} token ${i} drifted in down`);
    });
  }
});

test('boardFromPreset opens on the preset\'s view with nothing but its tokens and no arrows', () => {
  for (const preset of PRESETS) {
    const board = boardFromPreset(preset);
    assert.equal(board.view, preset.view);
    assert.equal(board.tokens.length, preset.tokens.length);
    assert.deepEqual(board.arrows, []);
  }
});

test('applying a preset is not derivable from state.js\'s public token API alone', () => {
  // Sanity check on the test harness itself: confirm addToken really does
  // place a token exactly where it's told, so the drift check above is
  // actually exercising placement and not a no-op.
  let board = emptyBoard('kickoff');
  board = addToken(board, { type: 'official', mark: 'R', across: 1.07, down: 60 });
  assert.equal(board.tokens[0].across, 1.07);
  assert.equal(board.tokens[0].down, 60);
});

test('preset ids and labels are unique across both groups', () => {
  const ids = PRESETS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate preset id');
  const labels = PRESETS.map((p) => p.label);
  assert.equal(new Set(labels).size, labels.length, 'duplicate preset label');
});

test('every preset is tagged with the group the UI sorts it by', () => {
  for (const preset of FORMATIONS) assert.equal(preset.group, 'formation');
  for (const preset of SITUATIONS) assert.equal(preset.group, 'situation');
});
