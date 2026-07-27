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
    'football-rules-summary.md',
    'foul-weather-procedures.md',
    'information-for-new-folks.md',
    'recommend-reading.md',
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

// Uploads were renamed to URL-safe names in static/uploads/; any link still
// pointing at the old space-laden filenames is broken.
test('article links point at the renamed uploads', () => {
  const bad = articles
    .filter((a) => /%20|1ST YEAR|7-MAN MECHANICS/.test(a.content))
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
