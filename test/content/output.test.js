// Asserts invariants about the built site. Requires `npm run build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const SITE = '_site';

if (!existsSync(SITE)) {
  throw new Error(`${SITE}/ not found — run \`npm run build\` before these tests`);
}

const html = readdirSync(SITE, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.html'))
  .map((f) => path.join(SITE, f));

const read = (f) => readFileSync(f, 'utf8');

test('build produced a home page', () => {
  assert.ok(existsSync(path.join(SITE, 'index.html')), 'missing _site/index.html');
});

test('every page has <html lang> and a non-empty <title>', () => {
  const bad = html.flatMap((f) => {
    const s = read(f);
    const errs = [];
    if (!/<html[^>]+lang=/.test(s)) errs.push(`${f}: missing <html lang>`);
    if (!/<title>[^<]+<\/title>/.test(s)) errs.push(`${f}: missing or empty <title>`);
    return errs;
  });
  assert.deepEqual(bad, []);
});

test('every page emits a meta description', () => {
  const bad = html.filter((f) => !/<meta name="description" content="[^"]+"/.test(read(f)));
  assert.deepEqual(bad, []);
});

test('front-end JS is self-hosted, not loaded from a CDN', () => {
  const bad = html.filter((f) => /<script[^>]+src="https?:\/\//.test(read(f)));
  assert.deepEqual(bad, []);
});

test('no page renders "Invalid Date" or a bare undefined', () => {
  const bad = html.filter((f) => /Invalid Date|>undefined</.test(read(f)));
  assert.deepEqual(bad, []);
});

test('the stylesheet was compiled and is real CSS, not HTML-wrapped', () => {
  const css = path.join(SITE, 'styles', 'main.css');
  assert.ok(existsSync(css), 'missing _site/styles/main.css');
  assert.ok(!read(css).includes('<html'), 'main.css contains HTML — css.liquid layout not applied');
});

test('kept static assets are copied through', () => {
  for (const f of [
    'images/vermont.svg',
    'uploads/7-man-mechanics-2022.pdf',
    'uploads/first-year-officials-quiz-1.docx',
    'uploads/first-year-officials-quiz-2.docx',
  ]) {
    assert.ok(existsSync(path.join(SITE, f)), `missing _site/${f}`);
  }
});
