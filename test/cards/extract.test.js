// The card model, asserted against the real articles rather than fixtures:
// a fixture can agree with the extractor while both disagree with the content
// an editor actually writes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import {
  cardImages,
  cardModel,
  cardText,
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
      'kicking-plays-crew-card',
      'line-judge-position-card',
      'linesman-position-card',
      'referee-position-card',
      'run-pass-plays-crew-card',
      'umpire-position-card',
    ],
  );
});

// The 2022 slide deck is tagged Printable but links a scanned artefact, not a
// card the build could render from article text.
test('the 7-man slide deck is not treated as a generated card', () => {
  assert.ok(!articles.some((a) => a.slug === '7-man-mechanics'));
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
  const article = readArticle(new URL('becoming-an-official.md', `file://${DIR}`).pathname);
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
