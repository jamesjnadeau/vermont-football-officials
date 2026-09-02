#!/usr/bin/env node
/**
 * Writes every field diagram to `static/images/`.
 *
 *   npm run diagrams
 *
 * The output is committed, so Eleventy's passthrough copy of `static/` needs
 * no build ordering and the site builds without ever running this. What keeps
 * the committed files honest is `test/field/generated.test.js`, which renders
 * the same scenes in memory and fails if a file on disk has drifted — so a
 * hand-edited SVG breaks the build rather than surviving until the next
 * regeneration silently reverts it.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allDiagrams } from '../lib/field/scenes/index.js';
import { renderDiagram } from '../lib/field/render.js';

const OUT = fileURLToPath(new URL('../static/images/', import.meta.url));

let written = 0;
let unchanged = 0;
for (const { file, ...scene } of allDiagrams()) {
  const dest = path.join(OUT, file);
  const svg = renderDiagram(scene);
  let current = null;
  try {
    current = readFileSync(dest, 'utf8');
  } catch {
    /* new file */
  }
  if (current === svg) {
    unchanged++;
    continue;
  }
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, svg);
  written++;
  console.log(`wrote ${file}`);
}
console.log(`${written} written, ${unchanged} unchanged`);
