// The site's own additions to the in-page editor (static/cms/site/). The
// modules tested here are pure — no DOM — so they run under `node --test`;
// test/content/site-editor-browser.test.js covers the ones that need a page.
// Needs no build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
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
