// The field's geometry. These assert the numbers rather than the output
// string: a diagram that draws a wrong field teaches wrong mechanics to
// someone who is going to stand on a real one.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CENTRE_X,
  FIELD_WIDTH_YARDS,
  GOAL_POST_SPACING_YARDS,
  HASH_PITCH_YARDS,
  SIDELINE_LEFT,
  SIDELINE_RIGHT,
  UNITS_PER_YARD_X,
  goalPostsX,
  hashCentresX,
  hashYards,
  num,
  playingFieldBottomYard,
  topYard,
  x,
  xToYards,
  y,
  yToYards,
} from '../../lib/field/geometry.js';
import { views, viewNames } from '../../lib/field/views.js';
import { renderField } from '../../lib/field/field.js';

const round = (n, places = 2) => Math.round(n * 10 ** places) / 10 ** places;

test('the field is 53 1/3 yards wide, at 3.75 units per yard', () => {
  assert.equal(SIDELINE_RIGHT - SIDELINE_LEFT, 200);
  assert.equal(round(FIELD_WIDTH_YARDS, 4), 53.3333);
  assert.equal(UNITS_PER_YARD_X, 3.75);
  assert.equal(x(0), CENTRE_X);
  assert.equal(x(-FIELD_WIDTH_YARDS / 2), SIDELINE_LEFT);
  assert.equal(x(FIELD_WIDTH_YARDS / 2), SIDELINE_RIGHT);
});

// This is the one number in the whole system that encodes an actual rule. A
// regression here draws a field nobody plays on.
test("hash marks sit 53'4\" in from each sideline", () => {
  const [left, right] = hashCentresX();
  assert.equal(round(left), 101.67);
  assert.equal(round(right), 168.33);
  const fromSideline = (left - SIDELINE_LEFT) / UNITS_PER_YARD_X;
  assert.equal(round(fromSideline * 3, 2), 53.33); // feet
});

test("the uprights are 23'4\" apart", () => {
  const [left, right] = goalPostsX();
  assert.equal(round((right - left) / UNITS_PER_YARD_X * 3, 2), 23.33); // feet
  assert.equal(round((left + right) / 2), CENTRE_X);
});

test('every view is exactly ten yards of end zone, or none at all', () => {
  for (const name of viewNames) {
    const v = views[name];
    if (v.goalYard == null) continue;
    assert.equal(v.bottomYard - v.goalYard, 10, `${name} end zone`);
  }
});

// The six views reverse-engineered from the fifty committed SVGs. Changing one
// of these heights moves every diagram that uses it, so they are pinned; views
// added later (the crew-of-seven crops) are free to be whatever they need.
test('the six original viewBox heights are unchanged', () => {
  assert.deepEqual(
    ['spot', 'runPass', 'goalLine', 'fieldGoal', 'punt', 'kickoff'].map((n) => views[n].height),
    [178, 186, 206, 237.8, 339, 394],
  );
});

// A frame shorter than the field it draws silently clips the end line, and the
// only way anyone finds out is by looking at all of them.
test('every view is tall enough for the field it draws', () => {
  for (const name of viewNames) {
    const v = views[name];
    assert.ok(
      v.height >= y(v, v.bottomYard),
      `${name}: height ${v.height} clips the field, which ends at ${y(v, v.bottomYard)}`,
    );
  }
});

test('hash marks fall on a five-yard grid and never enter the end zone', () => {
  for (const name of viewNames) {
    const v = views[name];
    const yards = hashYards(v);
    assert.ok(yards.length > 0, `${name} has no hash marks`);
    for (const yd of yards) {
      // Math.abs because -5 % 5 is -0, which assert.equal tells apart from 0.
      assert.equal(Math.abs(round(yd % HASH_PITCH_YARDS, 6)), 0, `${name}: ${yd} off grid`);
      assert.ok(yd >= topYard(v) - 1e-9, `${name}: ${yd} above the field`);
      assert.ok(
        yd <= playingFieldBottomYard(v) + 1e-9,
        `${name}: ${yd} is in the end zone`,
      );
    }
  }
});

test('the press box legend is centred on the drawn field', () => {
  for (const name of viewNames) {
    const v = views[name];
    const mid = (v.fieldTopY + y(v, v.bottomYard)) / 2;
    assert.match(
      renderField(v).svg,
      new RegExp(`class="pb" transform="rotate\\(90 257 ${num(mid)}\\)"`),
      `${name} press box`,
    );
  }
});

// The diagrams this replaces carried coordinates like 121.60000000000001,
// which is what a lost generator leaves behind. Two decimals, always.
test('no rendered coordinate carries more than two decimals', () => {
  for (const name of viewNames) {
    for (const [, digits] of renderField(views[name]).svg.matchAll(/"[-\d]*\.(\d+)"/g)) {
      assert.ok(digits.length <= 2, `${name}: .${digits} in output`);
    }
  }
});

test('turf and end zone together cover the drawn field, without overlapping', () => {
  for (const name of viewNames) {
    const v = views[name];
    const svg = renderField(v).svg;
    const rects = [...svg.matchAll(/<rect x="35" y="([-\d.]+)" width="200" height="([-\d.]+)" class="(turf|ez)"/g)]
      .map(([, top, h, cls]) => ({ top: +top, bottom: +top + +h, cls }));
    assert.equal(rects[0].top, v.fieldTopY, `${name} starts at the top of the field`);
    assert.equal(round(rects.at(-1).bottom), round(y(v, v.bottomYard)), `${name} ends at the bottom`);
    for (let i = 1; i < rects.length; i += 1) {
      assert.equal(rects[i].top, rects[i - 1].bottom, `${name} rects ${i} abut`);
    }
    assert.equal(rects.length, v.goalYard == null ? 1 : 2, `${name} rect count`);
  }
});

test('a view renders the same thing every time', () => {
  for (const name of viewNames) {
    assert.equal(renderField(views[name]).svg, renderField(views[name]).svg, name);
  }
});

// The drawing page reads a pointer position back out of the picture, which is
// the only direction the diagrams never go. A conversion that doesn't survive
// the round trip puts a token somewhere other than where it was dropped.
test('every conversion survives a round trip in both directions', () => {
  for (const yards of [-36, -26.5, 0, 3.75, 26.5, 36]) {
    assert.equal(round(xToYards(x(yards)), 6), yards);
  }
  for (const name of viewNames) {
    const view = views[name];
    for (const yards of [-10, 0, 7.5, view.bottomYard]) {
      assert.equal(round(yToYards(view, y(view, yards)), 6), yards);
    }
    // The frame's own edges, which is what a drag is clamped against.
    assert.equal(round(y(view, yToYards(view, 0)), 6), 0);
    assert.equal(round(y(view, yToYards(view, view.height)), 6), view.height);
  }
});

test('num() rounds, trims and never emits negative zero', () => {
  assert.equal(num(121.60000000000001), '121.6');
  assert.equal(num(35.0), '35');
  assert.equal(num(101.66666666666667), '101.67');
  assert.equal(num(-0.001), '0');
});
