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

// Third-party libraries (Bootstrap et al) must be self-hosted from node_modules.
// Our own services are exempt: their widget script has to be served from the same
// origin as the API it talks to, so it can't be vendored into the build.
const FIRST_PARTY_SCRIPT_HOSTS = ['rules-bot.james-nadeau.workers.dev'];

test('front-end JS is self-hosted, not loaded from a third-party CDN', () => {
  const bad = html.flatMap((f) => {
    const remote = [...read(f).matchAll(/<script[^>]+src="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
    return remote
      .filter((url) => !FIRST_PARTY_SCRIPT_HOSTS.includes(new URL(url).host))
      .map((url) => `${f}: ${url}`);
  });
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

// The Quizzes landing page is generated from the `quizzes` collection, so a new
// quiz file should appear there with no other edit. Guards the data file/tag wiring.
test('the quizzes landing page links every quiz that was built', () => {
  const page = path.join(SITE, 'quizzes', 'index.html');
  assert.ok(existsSync(page), 'missing _site/quizzes/index.html');
  const listed = read(page);
  const built = readdirSync(path.join(SITE, 'quizzes'), { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('index.html') && f !== 'index.html')
    .map((f) => `/quizzes/${path.dirname(f)}/`);
  assert.ok(built.length > 0, 'no quiz pages were built');
  assert.deepEqual(built.filter((url) => !listed.includes(`href="${url}"`)), []);
});

// Authoring docs, not pages — and their relative .md links would 404 if published.
test('quiz authoring docs are not published', () => {
  for (const f of ['quizzes/README/index.html', 'quizzes/asked-questions/index.html']) {
    assert.ok(!existsSync(path.join(SITE, f)), `${f} should not be published`);
  }
});

test('kept static assets are copied through', () => {
  for (const f of [
    'images/vermont.svg',
    'uploads/7-man-mechanics-2022.pdf',
    'uploads/clock-officials-cheat-sheet.pdf',
    'uploads/first-year-officials-quiz-1.docx',
    'uploads/first-year-officials-quiz-2.docx',
    'uploads/kicking-plays-crew-card.pdf',
    'images/kicking-plays/kickoff-crew-of-5.svg',
    'images/kicking-plays/field-goal-crew-of-4.svg',
    'uploads/run-pass-plays-crew-card.pdf',
    'images/run-pass-plays/every-down-crew-of-5.svg',
    'images/run-pass-plays/goal-line-crew-of-4.svg',
    'uploads/between-downs-crew-card.pdf',
    'uploads/clock-timing-crew-card.pdf',
    'uploads/fouls-enforcement-crew-card.pdf',
    'images/between-downs/getting-it-back-crew-of-5.svg',
    'images/fouls-enforcement/flag-down-crew-of-4.svg',
  ]) {
    assert.ok(existsSync(path.join(SITE, f)), `missing _site/${f}`);
  }
});
