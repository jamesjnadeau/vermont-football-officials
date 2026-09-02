// The card model, asserted against the real articles rather than fixtures:
// a fixture can agree with the extractor while both disagree with the content
// an editor actually writes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import {
  cardImages,
  cardModel,
  cardText,
  declaresCard,
  printableArticles,
  readArticle,
} from '../../lib/cards/extract.js';

const DIR = fileURLToPath(new URL('../../content/information/', import.meta.url));
const articles = printableArticles(DIR);

test('every article tagged Printable that is a generated card was found', () => {
  assert.deepEqual(
    articles.map((a) => a.slug),
    [
      'back-judge-position-card',
      'between-downs-crew-card',
      'clock-officials-cheat-sheet',
      'clock-timing-crew-card',
      'fouls-enforcement-crew-card',
      'head-line-judge-position-card',
      'kicking-plays-crew-card',
      'line-judge-position-card',
      'pregame-conference',
      'referee-position-card',
      'run-pass-plays-crew-card',
      'umpire-position-card',
    ],
  );
});

// `Printable` marks "there is something here to print", which is not the same
// as "the build renders this". These articles are all tagged Printable and all
// link a document somebody else produced: the 2022 slide deck, and the league's
// own rules PDFs behind the NVYFL transcriptions. Rendering them would fail the
// two-page gate on content that was never meant to be a card — which is exactly
// what happened when the NVYFL pages picked up the tag.
for (const slug of [
  '7-man-mechanics',
  'nvyfl-youth-football-rules-2025',
  'nvyfl-youth-football-rules-2026',
]) {
  test(`${slug} is tagged Printable but is not a generated card`, () => {
    const article = readArticle(path.join(DIR, `${slug}.md`));
    assert.ok(
      (article.data.tags ?? []).includes('Printable'),
      `${slug} is no longer tagged Printable — this test is guarding nothing`,
    );
    assert.ok(!declaresCard(article), `${slug} links a card at /cards/${slug}.pdf`);
    assert.ok(!articles.some((a) => a.slug === slug));
  });
}

// The rule that decides, stated once: an article is a generated card when it
// links its own card. Nothing an editor writes in the CMS can put a page into
// this set by accident, and nothing outside the markdown decides.
test('every card the build renders links its own card, and only those', () => {
  const all = readdirSync(DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => readArticle(path.join(DIR, f)));
  const declaring = all.filter(declaresCard).map((a) => a.slug).sort();
  assert.deepEqual(articles.map((a) => a.slug), declaring);
});

for (const article of articles) {
  test(`${article.slug}: the card model is complete`, () => {
    const model = cardModel(article);
    assert.equal(model.title, article.data.title);
    assert.ok(model.subtitle.length > 0, 'no subtitle — the lede was not picked up');
    assert.ok(model.sections.length > 0, 'no sections');
    assert.ok(
      model.sections.some((s) => s.title),
      'no titled section — the h2 split did not fire',
    );
    assert.ok(cardText(model).length > 500, 'suspiciously little text on the card');
  });

  test(`${article.slug}: the card does not offer to download itself`, () => {
    const html = cardModel(article)
      .sections.map((s) => s.html)
      .join('');
    for (const url of [`/cards/${article.slug}.pdf`, `/uploads/${article.slug}.pdf`]) {
      assert.ok(!html.includes(url), `card links its own PDF at ${url}`);
    }
  });

  test(`${article.slug}: the lede is not repeated in the body`, () => {
    const model = cardModel(article);
    const body = model.sections.map((s) => s.text).join(' ');
    assert.ok(!body.includes(model.subtitle), 'the subtitle appears again as body text');
  });

  test(`${article.slug}: provenance carries a date`, () => {
    const { provenance } = cardModel(article);
    assert.ok(provenance.length > 0, 'no provenance line');
    if (article.data.verified) {
      assert.match(provenance, /Last checked \w+ \d+, \d{4}\./);
    }
  });

  test(`${article.slug}: every referenced figure resolves to a file`, () => {
    const images = cardImages(cardModel(article));
    for (const src of images) {
      assert.match(src, /^\/images\//, `${src} is not a site-root image path`);
    }
  });
}

// An article with no card link must come through untouched — the extractor is
// run over content it does not own.
test('an article with no download link keeps its opening paragraph', () => {
  const article = readArticle(path.join(DIR, 'becoming-an-official.md'));
  const model = cardModel(article);
  assert.equal(model.subtitle, '', 'a lede was taken from an article with no card link');
  assert.ok(cardText(model).includes('official'), 'body text went missing');
});

// The escape hatch, asserted directly: the convention rules cover all eleven
// articles today, so nothing in content/ exercises this.
test('card-omit keeps a block off the card, and the default keeps it on', () => {
  const body = [
    'Lede paragraph.',
    '',
    '**[Download the thing (PDF, 2 pages)](/cards/x.pdf)** — print it.',
    '',
    '## Section',
    '',
    '<div class="card-omit"><p>Web only.</p></div>',
    '',
    '<div class="note"><p>Both.</p></div>',
  ].join('\n');
  const model = cardModel({ slug: 'x', file: 'x.md', data: { title: 'X' }, body });
  const text = cardText(model);
  assert.ok(!text.includes('Web only'), 'card-omit block reached the card');
  assert.ok(model.sections.some((s) => s.html.includes('Both.')), 'unmarked block was dropped');
  assert.equal(model.subtitle, 'Lede paragraph.');
});


// A named entity this does not decode reaches the completeness gate as the
// literal letters "ndash", which no PDF contains — reporting content dropped
// that was never dropped. The NVYFL pages write en dashes this way.
test('HTML entities in a raw block are decoded, not carried as letters', () => {
  const body = [
    'Lede.',
    '',
    '**[Download it (PDF, 2 pages)](/cards/x.pdf)** — print it.',
    '',
    '## Numbers',
    '',
    '<p>Linemen: 50&ndash;79 &amp; backs 1&ndash;49&hellip;</p>',
  ].join('\n');
  const model = cardModel({ slug: 'x', file: 'x.md', data: { title: 'X' }, body });
  const chunks = model.sections.flatMap((s) => s.chunks);
  assert.ok(
    chunks.some((c) => c.includes('50\u201379') && c.includes('&') && c.includes('\u2026')),
    `entities survived undecoded: ${JSON.stringify(chunks)}`,
  );
  for (const c of chunks) assert.doesNotMatch(c, /&[a-z]+;|ndash|hellip/i);
});
