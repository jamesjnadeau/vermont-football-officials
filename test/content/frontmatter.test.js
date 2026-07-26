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

test('all four expected articles exist as markdown', () => {
  const want = [
    '7-man-mechanics.md',
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
