// Asserts that the footer's "Edit this page" links point at real Pages CMS
// editors. Runs against the source config, so it needs no build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COLLECTIONS, HOME_URL, editLink } from '../../lib/pages-cms.js';

const CMS = readFileSync(fileURLToPath(new URL('../../.pages.yml', import.meta.url)), 'utf8');

// The `content:` entries of .pages.yml, which are the only two-space-indented
// `- name:` lines in the file (field names are nested deeper).
const configured = CMS.split(/^ {2}- name: /m)
  .slice(1)
  .map((chunk) => ({
    name: chunk.split('\n')[0].trim(),
    path: (chunk.match(/^ {4}path: (.+)$/m) ?? [])[1]?.trim(),
  }));

// A collection renamed or moved in .pages.yml without updating lib/pages-cms.js
// leaves the edit link pointing at an editor that no longer exists.
test('the edit links know exactly the collections .pages.yml defines', () => {
  const asText = (c) => `${c.name} -> ${c.path}`;
  assert.deepEqual(COLLECTIONS.map(asText).sort(), configured.map(asText).sort());
});

// Pages CMS puts the whole file path in one URL segment and reads it back with
// decodeURIComponent, so the slashes have to survive as %2F.
test('a markdown page links to its own entry in the editor', () => {
  assert.deepEqual(editLink('./content/information/7-man-mechanics.md'), {
    url: `${HOME_URL}/collection/information/edit/content%2Finformation%2F7-man-mechanics.md`,
    label: 'Edit this page',
  });
  assert.deepEqual(editLink('./content/quizzes/quiz-001-expert-mixed.md'), {
    url: `${HOME_URL}/collection/quizzes/edit/content%2Fquizzes%2Fquiz-001-expert-mixed.md`,
    label: 'Edit this page',
  });
});

// The Pug pages aren't CMS entries. Linking them to an editor would 404, so
// they get the collection list instead.
test('pages that are not CMS entries fall back to the collection list', () => {
  for (const input of [
    './content/index.pug',
    './content/contact/index.pug',
    './content/information/index.pug',
    './content/quizzes/index.pug',
    './content/tags/topic/topic.pug',
    undefined,
  ]) {
    assert.deepEqual(editLink(input), { url: HOME_URL, label: 'Edit site content' }, String(input));
  }
});
