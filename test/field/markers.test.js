// The marks painted onto a field. These assert structure — which classes and
// how many, escaping, rounding, placement — not pixels: a marker that draws
// the right shape in the wrong spot is a `geometry.js` bug, not this file's.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { official, player, movement, note, flag, label } from '../../lib/field/markers.js';
import { x, y as yardToY } from '../../lib/field/geometry.js';
import { views } from '../../lib/field/views.js';

const view = views.fieldGoal; // scaleY 6.6 — fractional yards land off-grid.
const at = { across: -3.4, down: 2.7 };

const count = (svg, needle) => svg.split(needle).length - 1;

test('a highlighted official is a halo, a white hat and a dark mark — nothing else', () => {
  const svg = official({ mark: 'R', at, highlight: true }, view);
  assert.equal(count(svg, 'class="halo"'), 1);
  assert.equal(count(svg, 'class="hat-w"'), 1);
  assert.equal(count(svg, 'class="mk mk-d"'), 1);
  assert.equal(count(svg, 'hat-b'), 0);
});

test('an unhighlighted official is a black hat and a light mark, no halo', () => {
  const svg = official({ mark: 'U', at }, view);
  assert.equal(count(svg, 'class="hat-b"'), 1);
  assert.equal(count(svg, 'class="mk mk-l"'), 1);
  assert.equal(count(svg, 'halo'), 0);
  assert.equal(count(svg, 'hat-w'), 0);
});

test('every mark renders the same thing every time', () => {
  assert.equal(
    official({ mark: 'BJ', at, highlight: true }, view),
    official({ mark: 'BJ', at, highlight: true }, view),
  );
  assert.equal(player({ kind: 'k', at }, view), player({ kind: 'k', at }, view));
  assert.equal(
    movement({ points: [at, { across: 1, down: 4 }], label: 'go' }, view),
    movement({ points: [at, { across: 1, down: 4 }], label: 'go' }, view),
  );
});

test('note() escapes text that could break out of the markup', () => {
  const svg = note({ text: `<script>&"'`, at }, view);
  assert.ok(svg.includes('&lt;script&gt;&amp;&quot;&#39;'));
  assert.ok(!svg.includes('<script>'));
});

test('label() escapes text and colour that could break out of the markup', () => {
  const svg = label({ text: `<b>&`, color: `red" onclick="x`, at }, view);
  assert.ok(svg.includes('&lt;b&gt;&amp;'));
  assert.ok(svg.includes('fill="red&quot; onclick=&quot;x"'));
  assert.ok(!svg.includes('<b>'));
});

test('no emitted coordinate carries more than two decimals', () => {
  const svgs = [
    official({ mark: 'LJ', at, highlight: true }, view),
    player({ kind: 'k', at }, view),
    player({ kind: 'r', at }, view),
    movement({ points: [at, { across: 2.222, down: 5.555 }], label: 'run' }, view),
    note({ text: 'spot', at }, view),
    flag({ at }, view),
    label({ text: 'X', at, size: 13.333, rotate: 12.345 }, view),
  ];
  // Scanning the whole string, not just whole-attribute values: movement()'s
  // and flag()'s primary geometry lives inside one quoted `d="M 1.23 4.56 L
  // …"` attribute holding several space-separated numbers, which a pattern
  // anchored to `"..."` would skip entirely.
  for (const svg of svgs) {
    for (const [, digits] of svg.matchAll(/-?\d+\.(\d+)/g)) {
      assert.ok(digits.length <= 2, `.${digits} in ${svg}`);
    }
  }
});

test('label() emits size, colour, weight and decoration only when set, and omits the defaults', () => {
  const plain = label({ text: 'Blitz', at }, view);
  assert.ok(!plain.includes('font-size'));
  assert.ok(!plain.includes('fill='));
  assert.ok(!plain.includes('font-weight'));
  assert.ok(!plain.includes('text-decoration'));
  assert.ok(!plain.includes('transform'));

  const styled = label(
    { text: 'Blitz', at, size: 18, color: 'red', bold: true, underline: true, rotate: 90 },
    view,
  );
  assert.ok(styled.includes('font-size="18"'));
  assert.ok(styled.includes('fill="red"'));
  assert.ok(styled.includes('font-weight="bold"'));
  assert.ok(styled.includes('text-decoration="underline"'));
  assert.ok(styled.includes('transform="rotate(90'));

  // Explicitly re-stating the defaults (black, size 12) is still the default.
  const restated = label({ text: 'Blitz', at, size: 12, color: 'black' }, view);
  assert.ok(!restated.includes('font-size'));
  assert.ok(!restated.includes('fill='));
});

test('rotating a label does not move its anchor', () => {
  const plain = label({ text: 'Blitz', at, rotate: 0 }, view);
  const rotated = label({ text: 'Blitz', at, rotate: 45 }, view);
  const anchor = (svg) => svg.match(/x="([^"]+)" y="([^"]+)"/).slice(1, 3);
  assert.deepEqual(anchor(plain), anchor(rotated));
  // And the rotation pivots on that same point, not the field's origin.
  const [ax, ay] = anchor(rotated);
  assert.ok(rotated.includes(`transform="rotate(45 ${ax} ${ay})"`));
});

// Step 2: the drawing page moves a token by wrapping it in a translated <g>
// instead of re-placing it. A mark rendered at the origin and then shifted
// by a transform has to land on the same point as the same mark rendered
// straight at that position — on *both* axes, and including whatever lives
// inside a `d="…"` path, not only bare `cx=`/`x=`-style attributes — or the
// drawing page and the diagram renderer would draw two different pictures
// from the same scene.
test('a mark at the origin, translated, lands where the same mark placed absolutely lands', () => {
  const dx = x(at.across);
  const dy = yardToY(view, at.down);
  const TOL = 0.01;

  // Every number in the string, in emission order — attribute values and
  // whatever is packed into a `d="…"` path alike, so flag()'s kite (which is
  // entirely a `d` attribute) is covered as fully as official()'s cx/cy.
  const allNumbers = (svg) => [...svg.matchAll(/-?\d+(?:\.\d+)?/g)].map(Number);

  // A number that reappears unshifted between the two renders is a shape
  // constant (a radius, a relative path delta) — expected, and not what this
  // test is checking. What it must find, per shape, is at least one number
  // that shifted by exactly dx and at least one that shifted by exactly dy;
  // finding neither means an axis went untested, and finding a shift that is
  // none of {0, dx, dy} means placement and translation disagree.
  function assertTranslatesCleanly(shapeName, absoluteSvg, originSvg) {
    const abs = allNumbers(absoluteSvg);
    const org = allNumbers(originSvg);
    assert.equal(
      abs.length,
      org.length,
      `${shapeName}: origin and absolute renders have different shapes (${abs.length} vs ${org.length} numbers)`,
    );
    let sawDxShift = false;
    let sawDyShift = false;
    for (let i = 0; i < abs.length; i += 1) {
      const diff = abs[i] - org[i];
      if (Math.abs(diff) < TOL) continue; // an unshifted constant — fine
      if (Math.abs(diff - dx) < TOL) {
        sawDxShift = true;
        continue;
      }
      if (Math.abs(diff - dy) < TOL) {
        sawDyShift = true;
        continue;
      }
      assert.fail(
        `${shapeName}: number #${i} (${org[i]} -> ${abs[i]}, diff ${diff}) is not a translation by dx (${dx}) or dy (${dy})`,
      );
    }
    assert.ok(sawDxShift, `${shapeName}: nothing shifted by dx — the x-axis went unchecked`);
    assert.ok(sawDyShift, `${shapeName}: nothing shifted by dy — the y-axis went unchecked`);
  }

  assertTranslatesCleanly(
    'official (highlighted)',
    official({ mark: 'R', at, highlight: true }, view),
    official({ mark: 'R', highlight: true }),
  );
  assertTranslatesCleanly('player (k)', player({ kind: 'k', at }, view), player({ kind: 'k' }));
  assertTranslatesCleanly('player (r)', player({ kind: 'r', at }, view), player({ kind: 'r' }));
  // flag()'s kite is entirely a `d="M … l … l … l … z"` path: the leading
  // M is the only absolute point in it, the three `l`s are relative deltas
  // that must stay put — exactly the case allNumbers()/assertTranslatesCleanly
  // has to get right for this test to mean anything for this shape.
  assertTranslatesCleanly('flag', flag({ at }, view), flag({}));
  assertTranslatesCleanly('note', note({ text: 'spot', at }, view), note({ text: 'spot' }));
  assertTranslatesCleanly('label', label({ text: 'X', at }, view), label({ text: 'X' }));
});
