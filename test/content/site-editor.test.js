// The site's own additions to the in-page editor (static/cms/site/). The
// modules tested here are pure — no DOM — so they run under `node --test`;
// test/content/site-editor-browser.test.js covers the ones that need a page.
// Needs no build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NAMES, OUT, exportsOf, render } from '../../tools/content-tools/link-site.mjs';

// vendor.js maps the chunks' one-letter export aliases back to real names.
// The aliases change with every ContentTools build, so a vendor.js left
// over from the previous build imports names that no longer exist, and
// the editor's site tools vanish the first time an author opens a page.
test('static/cms/site/vendor.js matches the vendored chunks', () => {
  assert.equal(readFileSync(OUT, 'utf8'), render('static/cms/chunks'));
});

test('vendor.js names everything the site code imports', () => {
  const src = readFileSync(OUT, 'utf8');
  for (const name of NAMES) assert.match(src, new RegExp(`\\bas ${name}\\b`), name);
});

// What vendor.sh prints when a new build dropped something: the name, not
// a SyntaxError from a browser the first time an author opens a page.
test('render names an export the build no longer has', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'chunks-'));
  writeFileSync(path.join(dir, 'a.js'), 'export {\n  LIBRARY as L\n};\n');
  assert.throws(() => render(dir), /no longer exports MarkdownDocument, blockToHTML/);
});

test('exportsOf reads a chunk\'s trailing export block', () => {
  assert.deepEqual(exportsOf('const a = 1;\nexport {\n  ContentTools as C,\n  plain\n};\n'), [
    { local: 'ContentTools', alias: 'C' },
    { local: 'plain', alias: 'plain' },
  ]);
});

import { findGrids, parseGrid, serializeGrid, SIGNAL_ROW, FIGURE_ROW } from '../../static/cms/site/grids.js';

const INFO = 'content/information';
const pages = readdirSync(INFO).filter((f) => f.endsWith('.md'));
const allGrids = pages.flatMap((f) => findGrids(readFileSync(`${INFO}/${f}`, 'utf8')).map((raw) => ({ file: f, raw })));

// A grid is only ever edited as a grid when writing its model back out gives
// the same bytes, so the test that matters is that every grid on the site
// qualifies. One that doesn't is shown read-only rather than rewritten, which
// is safe but means an author can't edit it — so it fails here.
test('every grid on the site is recognised and round-trips byte for byte', () => {
  const rows = pages.flatMap((f) => readFileSync(`${INFO}/${f}`, 'utf8').split('\n').filter((l) => l.startsWith('<div class="row')));
  assert.equal(allGrids.length, rows.length);
  assert.ok(allGrids.length >= 38, `found ${allGrids.length} grids`);
  for (const { file, raw } of allGrids) {
    const model = parseGrid(raw);
    assert.ok(model, `${file}: ${raw.slice(0, 80)}`);
    assert.equal(serializeGrid(model), raw, file);
  }
});

test('a bare signal grid', () => {
  const model = { kind: 'signal-grid', captioned: false, items: [{ src: '/images/official-signals/07-dead-ball-foul.svg', alt: 'Signal 7 & "dead ball"' }] };
  assert.equal(serializeGrid(model), [
    `<div class="${SIGNAL_ROW}">`,
    '  <div class="col">',
    '    <img src="/images/official-signals/07-dead-ball-foul.svg" alt="Signal 7 &amp; &quot;dead ball&quot;" class="img-fluid border rounded bg-white">',
    '  </div>',
    '</div>',
  ].join('\n'));
  assert.deepEqual(parseGrid(serializeGrid(model)), model);
});

test('a captioned signal grid', () => {
  const model = { kind: 'signal-grid', captioned: true, items: [{ src: '/a.svg', alt: 'A', caption: 'S1 — <Ball> ready' }] };
  const raw = serializeGrid(model);
  assert.match(raw, /<figure class="figure d-block text-center">/);
  assert.match(raw, /<figcaption class="figure-caption">S1 — &lt;Ball> ready<\/figcaption>/);
  assert.deepEqual(parseGrid(raw), model);
});

test('a figure grid', () => {
  const model = { kind: 'figure-grid', items: [{ src: '/r/run.svg', alt: 'Run', caption: 'Run' }, { src: '/r/pass.svg', alt: 'Pass', caption: '' }] };
  const raw = serializeGrid(model);
  assert.ok(raw.startsWith(`<div class="${FIGURE_ROW}">\n  <div class="col-sm-6">\n    <figure class="figure d-block">\n      <img src="/r/run.svg" alt="Run" class="figure-img img-fluid border rounded p-2 bg-white">\n      <figcaption class="figure-caption">Run</figcaption>`));
  assert.deepEqual(parseGrid(raw), model);
});

// The dialog marks a caption "Optional": leaving it blank means no caption
// at all, not an empty one the page would still lay out.
test('a figure grid leaves out the caption of a picture that has none', () => {
  const raw = serializeGrid({ kind: 'figure-grid', items: [{ src: '/r/pass.svg', alt: 'Pass', caption: '' }] });
  assert.doesNotMatch(raw, /figcaption/);
  assert.equal(raw.split('\n')[3], '      <img src="/r/pass.svg" alt="Pass" class="figure-img img-fluid border rounded p-2 bg-white">');
  assert.equal(raw.split('\n')[4], '    </figure>');
});

test('anything that is not exactly a house grid is left alone', () => {
  const good = serializeGrid({ kind: 'figure-grid', items: [{ src: '/a.svg', alt: 'A', caption: 'A' }] });
  for (const raw of [
    good.replace('col-sm-6', 'col-md-4'),          // another layout
    good.replace('alt="A"', 'alt="A" loading="lazy"'), // an extra attribute
    good.replace('</figure>', '</figure>\n    <p>note</p>'), // extra content
    good.replace('\n', '\n\n'),                     // spacing
    '<div class="row g-3 my-4">\n</div>',             // empty
    '<p>not a grid</p>',
  ]) assert.equal(parseGrid(raw), null, raw);
});

test('serializeGrid refuses an empty or unknown grid', () => {
  assert.throws(() => serializeGrid({ kind: 'signal-grid', captioned: false, items: [] }));
  assert.throws(() => serializeGrid({ kind: 'carousel', items: [{ src: '/a', alt: 'a' }] }));
});

import { VISIBILITY, parseCardNote, serializeCardNote } from '../../static/cms/site/card-note.js';

test('the flag football note is a card note, links and all', () => {
  const line = readFileSync(`${INFO}/flag-football-vs-high-school.md`, 'utf8').split('\n').find((l) => l.startsWith('<p class="card-omit">'));
  const note = parseCardNote(line);
  assert.equal(note.visibility, 'card-omit');
  assert.match(note.inner, /<a href="\/information\/flag-football-rules\/">Youth Flag Football Rules<\/a>/);
  assert.equal(serializeCardNote(note.visibility, note.inner), line);
});

test('card notes: both classes, and only simple inline markup', () => {
  assert.deepEqual(VISIBILITY, ['card-omit', 'card-only']);
  assert.deepEqual(parseCardNote('<p class="card-only">Only <b>here</b>.</p>'), { visibility: 'card-only', inner: 'Only <b>here</b>.' });
  for (const raw of [
    '<p class="lead">Lead</p>',
    '<p class="card-omit extra">Two classes</p>',
    '<p class="card-omit">A <div>block</div></p>',
    '<p class="card-omit"><img src="x" onerror="alert(1)"></p>',
    '<p class="card-omit"><a href="javascript:alert(1)">x</a></p>',
    '<p class="card-omit"><a href="/" onclick="x()">x</a></p>',
  ]) assert.equal(parseCardNote(raw), null, raw);
});

test('serializeCardNote keeps the note on one line', () => {
  assert.equal(serializeCardNote('card-omit', '\n    Hello\n    <a href="/x">there</a>\n'), '<p class="card-omit">Hello <a href="/x">there</a></p>');
  assert.throws(() => serializeCardNote('card-maybe', 'x'));
});

import { existsSync } from 'node:fs';
import { SIGNALS } from '../../static/cms/site/signals.js';
import { OUT as SIGNALS_OUT, render as renderSignals } from '../../tools/content-tools/signals.mjs';

// The signal dialog offers exactly these, with this wording, so it has to
// follow all-signals-listed-and-diagrammed.md when that page changes.
test('static/cms/site/signals.js matches the all-signals page', () => {
  assert.equal(readFileSync(SIGNALS_OUT, 'utf8'), renderSignals());
});

test('the signal manifest covers every signal drawing, once', () => {
  const svgs = readdirSync('static/images/official-signals').filter((f) => f.endsWith('.svg')).map((f) => `/images/official-signals/${f}`).sort();
  assert.equal(SIGNALS.length, 47);
  assert.deepEqual(SIGNALS.map((s) => s.src).sort(), svgs);
  for (const s of SIGNALS) {
    assert.ok(existsSync(`static${s.src}`), s.src);
    assert.ok(s.alt && s.caption, s.src);
  }
});

import { signalModel, figureModel, moveRow } from '../../static/cms/site/models.js';

const S = (n) => SIGNALS[n - 1];

test('signalModel: new grids take the manifest wording, in the order ticked on the list', () => {
  const model = signalModel(null, new Set([S(9).src, S(1).src]), true, SIGNALS);
  assert.deepEqual(model, { kind: 'signal-grid', captioned: true, items: [S(1), S(9)] });
});

test('signalModel: an existing grid keeps its own alt text, order and foreign images', () => {
  const current = { kind: 'signal-grid', captioned: false, items: [
    { src: S(7).src, alt: 'our own words' },
    { src: '/images/other/not-a-signal.svg', alt: 'kept' },
    { src: S(18).src, alt: 'unticked' },
  ] };
  const model = signalModel(current, new Set([S(7).src, S(2).src]), false, SIGNALS);
  assert.deepEqual(model.items.map((i) => i.alt), ['our own words', 'kept', S(2).alt]);
});

test('signalModel: captions come from the manifest when a bare grid gains them', () => {
  const current = { kind: 'signal-grid', captioned: false, items: [{ src: S(7).src, alt: 'a' }] };
  assert.equal(signalModel(current, new Set([S(7).src]), true, SIGNALS).items[0].caption, S(7).caption);
});

test('signalModel: nothing ticked is no grid', () => {
  assert.equal(signalModel(null, new Set(), false, SIGNALS), null);
});

test('figureModel requires a path and alt text for every figure', () => {
  assert.deepEqual(figureModel([{ src: ' /a.svg ', alt: 'A', caption: ' Cap ' }]), { model: { kind: 'figure-grid', items: [{ src: '/a.svg', alt: 'A', caption: 'Cap' }] }, errors: [] });
  assert.deepEqual(figureModel([{ src: '', alt: '', caption: '' }]).errors, ['Figure 1 needs an image path.', 'Figure 1 needs alt text.']);
  assert.deepEqual(figureModel([]).errors, ['Add at least one figure.']);
});

test('moveRow', () => {
  assert.deepEqual(moveRow(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a']);
  assert.deepEqual(moveRow(['a', 'b', 'c'], 0, -1), ['a', 'b', 'c']);
});
