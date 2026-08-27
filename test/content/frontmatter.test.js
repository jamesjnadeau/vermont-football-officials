// Asserts invariants about the source front matter that a generic HTML
// validator can't know about. Runs against `content/`, so it needs no build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const DIR = fileURLToPath(new URL('../../content/information/', import.meta.url));
const files = readdirSync(DIR);

// The topic (tag) vocabulary. Articles may only be tagged with these names, so
// that every tag has a page at /tags/<slug>/ to link to.
const TOPICS = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../content/_data/topics.json', import.meta.url)), 'utf8'),
);
const TOPIC_NAMES = TOPICS.map((t) => t.name);

test('every file in information/ has a known extension', () => {
  // Catches extension-less files (Decap once wrote "7-man-mechanics" with no .md),
  // which Eleventy silently skips.
  const bad = files.filter((f) => !/\.(md|pug|json)$/.test(f));
  assert.deepEqual(bad, []);
});

const articles = files
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({
    name: f,
    raw: readFileSync(path.join(DIR, f), 'utf8'),
    ...matter(readFileSync(path.join(DIR, f), 'utf8')),
  }));

test('all expected articles exist as markdown', () => {
  const want = [
    '7-man-mechanics.md',
    'back-judge-position-card.md',
    'becoming-an-official.md',
    'between-downs-crew-card.md',
    'clock-officials-cheat-sheet.md',
    'clock-timing-crew-card.md',
    'football-rules-summary.md',
    'foul-weather-procedures.md',
    'fouls-enforcement-crew-card.md',
    'getting-assigned.md',
    'information-for-new-folks.md',
    'kicking-plays-crew-card.md',
    'line-judge-position-card.md',
    'linesman-position-card.md',
    'nvyfl-youth-football-rules-2025.md',
    'nvyfl-youth-football-rules-2026.md',
    'recommend-reading.md',
    'referee-position-card.md',
    'run-pass-plays-crew-card.md',
    'umpire-position-card.md',
    'your-first-season.md',
  ];
  assert.deepEqual(articles.map((a) => a.name).sort(), want);
});

test('every article has a title', () => {
  assert.deepEqual(articles.filter((a) => !a.data.title).map((a) => a.name), []);
});

// Eleventy parses `date:` with Luxon, which requires ISO 8601.
test('every article has an ISO 8601 date', () => {
  const bad = articles
    .filter((a) => {
      const d = a.data.date;
      if (d === undefined) return true;
      const s = d instanceof Date ? d.toISOString() : String(d);
      return !/^\d{4}-\d{2}-\d{2}/.test(s) || Number.isNaN(new Date(s).getTime());
    })
    .map((a) => `${a.name}: ${JSON.stringify(a.data.date)}`);
  assert.deepEqual(bad, []);
});

// Decap's editor left zero-width BOM characters and trailing-backslash
// hard breaks in bodies; both render as garbage or surprise <br>s.
test('no editor artifacts (zero-width chars, trailing backslashes) in bodies', () => {
  const bad = articles
    .filter((a) => /[\uFEFF\u200B]/.test(a.content) || /\\\s*$/m.test(a.content))
    .map((a) => a.name);
  assert.deepEqual(bad, []);
});

// --- Topics (tags) -----------------------------------------------------
// content/_data/topics.json drives the topic pages, the pills on each article
// and the "Browse by topic" row, so it has to stay well-formed.
test('every topic has a name, a URL-safe slug and a description', () => {
  const bad = TOPICS.flatMap((t, i) => {
    const errs = [];
    if (!t.name) errs.push(`topics[${i}]: missing name`);
    if (!t.description) errs.push(`topics[${i}]: missing description`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(t.slug))) {
      errs.push(`topics[${i}]: slug ${JSON.stringify(t.slug)} is not URL-safe`);
    }
    return errs;
  });
  assert.deepEqual(bad, []);
});

test('topic names and slugs are unique', () => {
  assert.equal(new Set(TOPIC_NAMES).size, TOPICS.length, 'duplicate topic name');
  assert.equal(new Set(TOPICS.map((t) => t.slug)).size, TOPICS.length, 'duplicate topic slug');
});

// An untagged article is reachable only from the full list — it never shows up
// under any topic.
test('every article is tagged with at least one topic', () => {
  const bad = articles.filter((a) => !(a.data.tags || []).length).map((a) => a.name);
  assert.deepEqual(bad, []);
});

// A tag outside the vocabulary has no page, so layouts/article.pug drops it
// rather than linking to a 404.
test('every article tag is a known topic', () => {
  const bad = articles.flatMap((a) =>
    (a.data.tags || [])
      .filter((t) => !TOPIC_NAMES.includes(t))
      .map((t) => `${a.name}: unknown topic ${JSON.stringify(t)}`),
  );
  assert.deepEqual(bad, []);
});

// `information` comes from information.11tydata.json and is merged in by
// Eleventy; repeating it in front matter would double it up in the pills.
test('no article repeats the collection tag in its front matter', () => {
  const bad = articles.filter((a) => (a.data.tags || []).includes('information')).map((a) => a.name);
  assert.deepEqual(bad, []);
});

// Editors pick topics from a dropdown in Pages CMS. If that list drifts from
// topics.json they can save a tag that has no page.
test('the Pages CMS topic dropdown offers exactly the known topics', () => {
  const cms = readFileSync(fileURLToPath(new URL('../../.pages.yml', import.meta.url)), 'utf8');
  const field = cms.match(/\n {6}- name: tags\n(?: {8}.*\n| {10}.*\n| {12}.*\n)*/);
  assert.ok(field, 'no `tags` field found in .pages.yml');
  const offered = [...field[0].matchAll(/^ {12}- (.+)$/gm)].map((m) => m[1].trim());
  assert.deepEqual(offered.slice().sort(), TOPIC_NAMES.slice().sort());
});

// Uploads were renamed to URL-safe names in static/uploads/; any link still
// pointing at the old space-laden filenames is broken.
test('article links point at the renamed uploads', () => {
  const bad = articles
    .filter((a) => /%20|1ST YEAR|7-MAN MECHANICS/.test(a.content))
    .map((a) => a.name);
  assert.deepEqual(bad, []);
});

// --- Provenance ------------------------------------------------------
// Optional front matter lets an article declare which NFHS rules year it
// reflects (`ruleYear`), what it was built from (`source`), and when a human
// last read it against that source (`verified`). layouts/article.pug renders
// them as a footnote. Articles that set none of them are unaffected.

// A page that claims a source must say when a human last checked it against
// that source. Rules change annually; a stale verification date is worse than
// none because it looks authoritative.
test('any article with a source also has a verified date', () => {
  const bad = articles.filter((a) => a.data.source && !a.data.verified).map((a) => a.name);
  assert.deepEqual(bad, []);
});

test('no verified date is in the future or more than 400 days old', () => {
  const now = Date.now();
  const MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000;
  const bad = articles
    .filter((a) => a.data.verified)
    .filter((a) => {
      const d = a.data.verified;
      const t = (d instanceof Date ? d : new Date(String(d))).getTime();
      if (Number.isNaN(t)) return true;
      return t > now || now - t > MAX_AGE_MS;
    })
    .map((a) => `${a.name}: ${JSON.stringify(a.data.verified)}`);
  assert.deepEqual(bad, []);
});

// Vermont-specific pages are the ones where being out of date does real harm,
// so they are required to carry the full provenance triple. This passes
// vacuously until those files exist, then binds automatically — the guard is
// in place before the content it guards.
const VERMONT_PAGES = [
  'vermont-rules-and-policies.md',
  'game-day-administration.md',
  'ejections-and-reporting.md',
  'season-calendar.md',
];

test('Vermont-specific pages declare ruleYear, source, and verified', () => {
  const bad = articles
    .filter((a) => VERMONT_PAGES.includes(a.name))
    .filter((a) => !(a.data.ruleYear && a.data.source && a.data.verified))
    .map((a) => a.name);
  assert.deepEqual(bad, []);
});

// --- Quizzes -----------------------------------------------------------
// README.md and asked-questions.md are authoring docs, not pages; Eleventy
// ignores them (see .eleventy.js), so the front-matter rules don't apply.
const QUIZ_DIR = fileURLToPath(new URL('../../content/quizzes/', import.meta.url));
const NOT_A_QUIZ = new Set(['README.md', 'asked-questions.md']);

const quizzes = readdirSync(QUIZ_DIR)
  .filter((f) => f.endsWith('.md') && !NOT_A_QUIZ.has(f))
  .map((f) => ({ name: f, ...matter(readFileSync(path.join(QUIZ_DIR, f), 'utf8')) }));

test('quizzes/ contains quizzes', () => {
  assert.ok(quizzes.length > 0, 'no quiz markdown found in content/quizzes/');
});

test('every quiz has the front matter the list and layout need', () => {
  const required = ['title', 'description', 'source', 'level', 'questions'];
  const bad = quizzes.flatMap((q) =>
    required.filter((k) => q.data[k] === undefined).map((k) => `${q.name}: missing ${k}`),
  );
  assert.deepEqual(bad, []);
});

// Eleventy parses `date:` with Luxon, which requires ISO 8601.
test('every quiz has an ISO 8601 date', () => {
  const bad = quizzes
    .filter((q) => {
      const d = q.data.date;
      if (d === undefined) return true;
      const s = d instanceof Date ? d.toISOString() : String(d);
      return !/^\d{4}-\d{2}-\d{2}/.test(s) || Number.isNaN(new Date(s).getTime());
    })
    .map((q) => `${q.name}: ${JSON.stringify(q.data.date)}`);
  assert.deepEqual(bad, []);
});

// The quiz lists sort on title, so the number has to lead for them to stay in order.
test('every quiz title starts with its number', () => {
  const bad = quizzes.filter((q) => !/^Quiz \d{3} /.test(String(q.data.title))).map((q) => q.name);
  assert.deepEqual(bad, []);
});

// layouts/quiz.pug renders the title; an H1 in the body would duplicate it.
test('no quiz body repeats the title as an H1', () => {
  const bad = quizzes.filter((q) => /^# /m.test(q.content)).map((q) => q.name);
  assert.deepEqual(bad, []);
});

test('no editor artifacts in quiz bodies', () => {
  const bad = quizzes
    .filter((q) => /[\uFEFF\u200B]/.test(q.content) || /\\\s*$/m.test(q.content))
    .map((q) => q.name);
  assert.deepEqual(bad, []);
});
