// The gates. An automatic pipeline that ships a broken card is worse than a
// manual one, so these run against the rendered PDFs and fail the deploy —
// which for a CMS editor means the site keeps serving the last good build
// while someone looks. A stale card a human is about to fix beats a wrong one
// nobody noticed.
//
// Requires `npm run build` first, same as test/content/output.test.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cardImages, cardModel, printableArticles } from '../../lib/cards/extract.js';
import { droppedContent, figureLabels, flatten, missingFigures, readPdf } from '../../lib/cards/inspect.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const CARDS = path.join(ROOT, '_site', 'cards');
const STATIC = path.join(ROOT, 'static');

if (!existsSync(CARDS)) {
  throw new Error(`${CARDS}/ not found — run \`npm run build\` before these tests`);
}

/** The card's CMS title, because that is what an editor is looking at. */
const named = (model) => `"${model.title}"`;

const cards = await Promise.all(
  printableArticles(path.join(ROOT, 'content/information')).map(async (article) => {
    const model = cardModel(article);
    const file = path.join(CARDS, `${model.slug}.pdf`);
    assert.ok(existsSync(file), `${named(model)}: the build wrote no card at ${file}`);
    return { model, ...(await readPdf(readFileSync(file))) };
  }),
);

test('the build wrote a card for every printable article', () => {
  assert.ok(cards.length >= 11, `only ${cards.length} cards were built`);
});

for (const { model, pageCount, text } of cards) {
  // The gate that makes the whole design safe. Two pages, printed two-sided
  // and flipped on the long edge, is the constraint the cards exist under, and
  // a third page is the failure a CMS editor is most likely to cause and least
  // likely to notice.
  test(`${model.slug}: is exactly two pages`, () => {
    assert.equal(
      pageCount,
      2,
      `${named(model)} came out at ${pageCount} pages. Two pages is the constraint; ` +
        'see docs/cards/README.md for the three knobs to turn before cutting content.',
    );
  });

  test(`${model.slug}: says everything the article says`, () => {
    const dropped = droppedContent(model, text);
    assert.deepEqual(
      dropped.map((d) => `${d.section || '(opening)'}: ${d.chunk}`),
      [],
      `${named(model)} lost content between the article and the card — overflow past ` +
        'the page box renders as a clean-looking card with something missing.',
    );
  });

  test(`${model.slug}: shows every figure it references`, () => {
    const missing = missingFigures(model, text, { staticDir: STATIC });
    assert.deepEqual(
      missing.map((m) => m.src),
      [],
      `${named(model)} is missing a diagram. A broken data URI leaves blank space ` +
        'rather than raising an error, which is why this is checked in the PDF.',
    );
  });

  test(`${model.slug}: carries its title and its date`, () => {
    const found = flatten(text);
    assert.ok(found.includes(flatten(model.title)), `${named(model)} has no title on it`);
    assert.ok(
      found.includes(flatten(model.provenance.slice(0, 40))),
      `${named(model)} has no provenance line — a card with no date on it is one ` +
        'nobody can trust two seasons later',
    );
  });

  test(`${model.slug}: does not print a link to itself`, () => {
    assert.ok(
      !flatten(text).includes(flatten(`/cards/${model.slug}.pdf`)),
      `${named(model)} offers to download the thing already in your hand`,
    );
  });
}

// --- The gates' own gates ------------------------------------------------
// A check that cannot fail is decoration. These assert that each one reports
// the failure it exists for.

const sample = cards.find((c) => cardImages(c.model).length > 0);

test('a dropped bullet is caught', () => {
  const { model, text } = sample;
  const bullet = model.sections.flatMap((s) => s.chunks).find((c) => c.length > 60);
  const mangled = text.replace(bullet.slice(0, 30), '');
  const dropped = droppedContent(model, mangled);
  assert.ok(
    dropped.some((d) => d.chunk === bullet),
    'removing a bullet from the PDF text did not fail the completeness check',
  );
});

test('a figure that did not render is caught', () => {
  const { model, text } = sample;
  const src = cardImages(model)[0];
  const labels = figureLabels(path.join(STATIC, src.slice(1)));
  // Blank the whole diagram, the way a data URI the browser could not decode
  // would: the labels drawn inside it are simply not there.
  let mangled = text;
  for (const label of labels) mangled = mangled.split(label).join('');
  const missing = missingFigures(model, mangled, { staticDir: STATIC });
  assert.ok(
    missing.some((m) => m.src === src),
    `blanking ${src} did not fail the figure check`,
  );
});

test('the page-count gate reads the real page count', () => {
  // Cheap proof that the count comes from the file rather than from a constant.
  assert.deepEqual([...new Set(cards.map((c) => c.pageCount))], [2]);
  assert.ok(cards.every((c) => c.pages.length === c.pageCount));
  assert.ok(cards.every((c) => c.pages.every((p) => p.trim().length > 0)), 'a blank page shipped');
});
