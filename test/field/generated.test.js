// The committed SVGs under `static/images/` are build output. This test is
// what stops them rotting: render every scene in memory and compare it with
// the file on disk. A hand-edited diagram fails here rather than surviving
// until someone runs `npm run diagrams` and silently reverts it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allDiagrams } from '../../lib/field/scenes/index.js';
import { renderDiagram } from '../../lib/field/render.js';

const IMAGES = fileURLToPath(new URL('../../static/images/', import.meta.url));
const diagrams = allDiagrams();

test('every diagram on disk matches the scene it came from', () => {
  const stale = [];
  for (const { file, ...scene } of diagrams) {
    let onDisk;
    try {
      onDisk = readFileSync(path.join(IMAGES, file), 'utf8');
    } catch {
      stale.push(`${file}: missing`);
      continue;
    }
    if (onDisk !== renderDiagram(scene)) stale.push(`${file}: drifted`);
  }
  assert.deepEqual(stale, [], `run \`npm run diagrams\` to regenerate:\n${stale.join('\n')}`);
});

test('rendering is deterministic', () => {
  // Two renders of one scene must be byte-identical, or the drift test above
  // fails at random and everyone learns to ignore it.
  const { file: _file, ...scene } = diagrams[0];
  assert.equal(renderDiagram(scene), renderDiagram(scene));
});

test('every diagram declares a title, and it is the accessible name', () => {
  const bad = [];
  for (const { file, ...scene } of diagrams) {
    const svg = renderDiagram(scene);
    const title = svg.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const label = svg.match(/aria-label="([^"]*)"/)?.[1];
    if (!title) bad.push(`${file}: no title`);
    else if (title !== label) bad.push(`${file}: title ${title} != aria-label ${label}`);
  }
  assert.deepEqual(bad, []);
});

test('no two scenes write the same file', () => {
  const seen = new Map();
  const dupes = [];
  for (const { file } of diagrams) {
    if (seen.has(file)) dupes.push(file);
    seen.set(file, true);
  }
  assert.deepEqual(dupes, []);
});

// A scene deleted without its output leaves an orphan that no longer tracks
// anything but still ships; an output added without a scene is a file the
// generator will never touch again.
test('no field diagram is committed without a scene', () => {
  const FAMILIES = [
    'position-cards',
    'kicking-plays',
    'run-pass-plays',
    'between-downs',
    'fouls-enforcement',
    '7-man-mechanics',
  ];
  const onDisk = [];
  for (const family of FAMILIES) {
    const base = path.join(IMAGES, family);
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        for (const f of readdirSync(path.join(base, entry.name))) {
          if (f.endsWith('.svg')) onDisk.push(`${family}/${entry.name}/${f}`);
        }
      } else if (entry.name.endsWith('.svg')) {
        onDisk.push(`${family}/${entry.name}`);
      }
    }
  }
  const generated = new Set(diagrams.map((d) => d.file));
  assert.deepEqual(
    onDisk.filter((f) => !generated.has(f)).sort(),
    [],
    'orphaned diagram: no scene produces it',
  );
});
