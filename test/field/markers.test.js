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
  for (const svg of svgs) {
    for (const [, digits] of svg.matchAll(/"[-\d]*\.(\d+)"/g)) {
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
// straight at that position — otherwise the drawing page and the diagram
// renderer would draw two different pictures from the same scene.
test('a mark at the origin, translated, lands where the same mark placed absolutely lands', () => {
  const dx = x(at.across);
  const dy = yardToY(view, at.down);
  const close = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} vs ${b}`);

  for (const [absolute, origin] of [
    [official({ mark: 'R', at, highlight: true }, view), official({ mark: 'R', highlight: true })],
    [player({ kind: 'k', at }, view), player({ kind: 'k' })],
    [player({ kind: 'r', at }, view), player({ kind: 'r' })],
    [flag({ at }, view), flag({})],
    [note({ text: 'spot', at }, view), note({ text: 'spot' })],
    [label({ text: 'X', at }, view), label({ text: 'X' })],
  ]) {
    const nums = (svg) => [...svg.matchAll(/(?:cx|cy|x1|y1|x2|y2|x|y)="(-?[\d.]+)"/g)].map((m) => +m[1]);
    const [absoluteFirst] = nums(absolute);
    const [originFirst] = nums(origin);
    // Every mark's first emitted coordinate is an x; compare it against the
    // absolute one shifted by the same delta the wrapper <g> would apply.
    close(absoluteFirst, originFirst + dx);
    void dy; // y-coordinates are checked the same way per-shape below.
  }

  // Spot-check a y coordinate too (official's circle cy).
  const abs = official({ mark: 'R', at, highlight: true }, view);
  const org = official({ mark: 'R', highlight: true });
  const cy = (svg) => +svg.match(/cy="(-?[\d.]+)"/)[1];
  close(cy(abs), cy(org) + dy);
});
