// The cache key is the fragile part of this pipeline: everything else fails
// loudly, but a missing input in the key fails silently, months later, as a
// card that does not match its page. These are the invalidation tests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CARD_FORMAT_VERSION,
  CardCache,
  cacheKey,
  cacheKeyParts,
  changedParts,
} from '../../lib/cards/cache.js';
import { cardModel, printableArticles } from '../../lib/cards/extract.js';
import { cardSources, loadCardAssets } from '../../lib/cards/render.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const article = printableArticles(path.join(ROOT, 'content/information')).find(
  (a) => a.slug === 'kicking-plays-crew-card',
);
const model = cardModel(article);
const assets = loadCardAssets(model, { staticDir: path.join(ROOT, 'static') });
const sources = cardSources();
const chromium = 'Chromium 141.0.0.0';

const keyFor = (over = {}) =>
  cacheKey(cacheKeyParts({ article, assets, sources, chromium, ...over }));

const base = keyFor();

test('the same inputs produce the same key', () => {
  assert.equal(keyFor(), base);
});

test('changing the markdown body invalidates the card', () => {
  const changed = { ...article, body: `${article.body}\n\nOne more line.\n` };
  assert.notEqual(keyFor({ article: changed }), base);
});

test('changing a front-matter field the card uses invalidates it', () => {
  const changed = { ...article, data: { ...article.data, verified: '2027-01-01' } };
  assert.notEqual(keyFor({ article: changed }), base);
});

test('changing a front-matter field the card ignores does not', () => {
  const changed = { ...article, data: { ...article.data, draft: true } };
  assert.equal(keyFor({ article: changed }), base);
});

// The one that matters most. A regenerated field diagram keeps its path, so a
// key over paths would serve a card showing the old diagram for ever.
test('changing the bytes of a referenced figure, path unchanged, invalidates it', () => {
  const [src, bytes] = [...assets][0];
  const edited = new Map(assets);
  edited.set(src, Buffer.concat([bytes, Buffer.from('<!-- redrawn -->')]));
  assert.notEqual(keyFor({ assets: edited }), base);
  assert.deepEqual(
    changedParts(
      cacheKeyParts({ article, assets, sources, chromium }),
      cacheKeyParts({ article, assets: edited, sources, chromium }),
    ),
    [`image:${src}`],
    'the rebuild could not be explained by the figure that changed',
  );
});

test('changing the stylesheet or the template invalidates every card', () => {
  for (const name of ['card.css', 'card-template.js']) {
    const edited = { ...sources, [name]: `${sources[name]}\n/* nudge */\n` };
    assert.notEqual(keyFor({ sources: edited }), base, `${name} is not in the key`);
  }
});

test('bumping CARD_FORMAT_VERSION invalidates every card', () => {
  const parts = cacheKeyParts({ article, assets, sources, chromium });
  const bumped = parts.map((p) =>
    p.name === 'format-version' ? { ...p, sha: 'bumped' } : p,
  );
  assert.notEqual(cacheKey(bumped), base);
  assert.ok(
    parts.some((p) => p.name === 'format-version'),
    'the format version is not in the key',
  );
  assert.equal(typeof CARD_FORMAT_VERSION, 'number');
});

test('a Chromium upgrade invalidates every card', () => {
  assert.notEqual(keyFor({ chromium: 'Chromium 142.0.0.0' }), base);
});

test('the key parts are sorted and named, so a rebuild can be explained', () => {
  const parts = cacheKeyParts({ article, assets, sources, chromium });
  assert.deepEqual(
    parts.map((p) => p.name),
    [...parts.map((p) => p.name)].sort(),
  );
  for (const p of parts) assert.match(p.sha, /^[0-9a-f]{64}$/);
  assert.ok(parts.some((p) => p.name.startsWith('image:')));
  assert.ok(parts.some((p) => p.name.startsWith('source:')));
});

// --- The store on disk ---------------------------------------------------

const scratch = () => mkdtempSync(path.join(tmpdir(), 'card-cache-'));
const PDF = Buffer.concat([
  Buffer.from('%PDF-1.4\n'),
  Buffer.alloc(2000, 0x20),
  Buffer.from('\n%%EOF\n'),
]);

test('a stored card comes back byte for byte', () => {
  const cache = new CardCache(scratch());
  assert.equal(cache.get(base), null);
  cache.put(base, PDF);
  assert.deepEqual(cache.get(base), PDF);
});

test('a truncated cache entry is a miss, not a broken PDF', () => {
  const dir = scratch();
  const cache = new CardCache(dir);
  cache.put(base, PDF);
  writeFileSync(path.join(dir, `${base}.pdf`), PDF.subarray(0, 1500));
  assert.equal(cache.get(base), null, 'served a PDF with no trailer');
  assert.equal(cache.get(base), null, 'the corrupt entry was left on disk');
});

test('a cache entry that is not a PDF at all is a miss', () => {
  const dir = scratch();
  const cache = new CardCache(dir);
  writeFileSync(path.join(dir, `${base}.pdf`), Buffer.alloc(4000, 0x41));
  assert.equal(cache.get(base), null);
});

test('the recorded inputs are what explains the next rebuild', () => {
  const dir = scratch();
  const cache = new CardCache(dir);
  assert.equal(cache.lastParts(model.slug), null);
  const parts = cacheKeyParts({ article, assets, sources, chromium });
  cache.recordParts(model.slug, parts);
  assert.deepEqual(cache.lastParts(model.slug), JSON.parse(JSON.stringify(parts)));
  const next = cacheKeyParts({ article, assets, sources, chromium: 'Chromium 142.0.0.0' });
  assert.deepEqual(changedParts(cache.lastParts(model.slug), next), ['chromium']);
});

test('every figure the card shows is in the key', () => {
  const names = new Set(
    cacheKeyParts({ article, assets, sources, chromium })
      .filter((p) => p.name.startsWith('image:'))
      .map((p) => p.name.slice('image:'.length)),
  );
  for (const src of assets.keys()) assert.ok(names.has(src), `${src} is not in the key`);
  assert.equal(names.size, assets.size);
});

// A key over file contents has to actually read them: a card whose figure is
// hashed from the wrong file is the silent failure this whole design guards.
test('figure bytes come from the file the article points at', () => {
  const [src, bytes] = [...assets][0];
  const onDisk = readFileSync(path.join(ROOT, 'static', src.slice(1)));
  assert.deepEqual(bytes, onDisk);
});
