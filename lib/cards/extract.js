/**
 * Works out which parts of an article become the printable card.
 *
 * The article markdown is the only source: the web page and the card are two
 * renderings of it. They want slightly different content, though — the page
 * opens with framing prose and a link to download itself, which on the card
 * would be a link to the thing already in your hand.
 *
 * The rules here are conventions, not markup, so an editor writes the article
 * and the card follows. `card-omit` / `card-only` classes are the escape hatch
 * for the exceptions; nothing in the eleven articles needs them today.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';

/** The tag that marks an article as having a printable card. */
export const PRINTABLE_TAG = 'Printable';

/**
 * Articles tagged `Printable` that link an artefact rather than a generated
 * card. The 2022 slide deck is a scan of someone else's document; there is no
 * article text it could be rendered from.
 */
export const NOT_GENERATED = new Set(['7-man-mechanics']);

/**
 * Same markdown-it configuration Eleventy builds the pages with (see
 * `@11ty/eleventy/src/Engines/Markdown.js`): `html: true`, indented code
 * blocks disabled. The card must parse the article exactly as the page does,
 * or the two can disagree about what the content is.
 */
export function markdownLibrary() {
  return new MarkdownIt({ html: true }).disable('code');
}

const md = markdownLibrary();

/** Where a generated card is published, and where the old committed one lived. */
export const cardUrl = (slug) => `/cards/${slug}.pdf`;
const legacyCardUrl = (slug) => `/uploads/${slug}.pdf`;

/** Reads one article off disk. `slug` is its URL segment, i.e. the file stem. */
export function readArticle(file) {
  const raw = readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  return { slug: path.basename(file, '.md'), file, data, body: content };
}

/** Every article in `dir` that the build should render a card for. */
export function printableArticles(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => readArticle(path.join(dir, f)))
    .filter((a) => (a.data.tags ?? []).includes(PRINTABLE_TAG))
    .filter((a) => !NOT_GENERATED.has(a.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Splits a markdown-it token stream into top-level blocks — one group of
 * tokens per element of the document. Working on tokens rather than on the
 * rendered HTML means the card sees the same document structure the page does,
 * with no parser of our own to disagree with markdown-it.
 */
function topLevelBlocks(tokens) {
  const blocks = [];
  let group = [];
  let depth = 0;
  for (const token of tokens) {
    group.push(token);
    depth += token.nesting;
    if (depth === 0) {
      blocks.push(group);
      group = [];
    }
  }
  return blocks;
}

/** All text an inline token tree contains, in reading order. */
function inlineText(token) {
  if (token.type === 'text' || token.type === 'code_inline') return token.content;
  // A wrapped line is one sentence, not two words run together.
  if (token.type === 'softbreak' || token.type === 'hardbreak') return ' ';
  if (!token.children) return '';
  return token.children.map(inlineText).join('');
}

const blockText = (group) =>
  group
    .filter((t) => t.type === 'inline')
    .map(inlineText)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Every link href in a block, from markdown links and from raw HTML alike. */
function blockLinks(group) {
  const hrefs = [];
  for (const token of group) {
    if (token.type === 'html_block' || token.type === 'html_inline') {
      for (const m of token.content.matchAll(/href="([^"]*)"/g)) hrefs.push(m[1]);
      continue;
    }
    const walk = (t) => {
      if (t.type === 'link_open') hrefs.push(t.attrGet('href') ?? '');
      t.children?.forEach(walk);
    };
    walk(token);
  }
  return hrefs;
}

/** Every image source a block references, from markdown images and raw HTML. */
function blockImages(group) {
  const srcs = [];
  for (const token of group) {
    if (token.type === 'html_block' || token.type === 'html_inline') {
      for (const m of token.content.matchAll(/<img\b[^>]*\bsrc="([^"]*)"/g)) srcs.push(m[1]);
      continue;
    }
    const walk = (t) => {
      if (t.type === 'image') srcs.push(t.attrGet('src') ?? '');
      t.children?.forEach(walk);
    };
    walk(token);
  }
  return srcs;
}

/** The class list on the first HTML tag of a raw block, if it has one. */
function blockClasses(group) {
  const first = group[0];
  if (first?.type !== 'html_block') return [];
  const m = first.content.match(/^\s*<[a-zA-Z][^>]*\bclass="([^"]*)"/);
  return m ? m[1].split(/\s+/) : [];
}

/**
 * True for the paragraph that offers the card for download. Recognised rather
 * than marked up: it is the paragraph whose links all point at this article's
 * own card. On the card itself it would be a link to the paper in your hand.
 */
function isDownloadBlock(group, slug) {
  if (group[0]?.type !== 'paragraph_open') return false;
  const own = new Set([cardUrl(slug), legacyCardUrl(slug)]);
  const hrefs = blockLinks(group);
  return hrefs.length > 0 && hrefs.every((h) => own.has(h));
}

/**
 * Builds the card's content model from a parsed article.
 *
 * Returns `{ slug, title, subtitle, sections, provenance }`, where each section
 * is `{ title, html, text, images }` — the h2 heading and everything under it,
 * ready for the template. Blocks that belong to the page and not the card are
 * already gone.
 */
export function cardModel(article) {
  const tokens = md.parse(article.body, {});
  const blocks = topLevelBlocks(tokens);

  const downloadAt = blocks.findIndex((b) => isDownloadBlock(b, article.slug));

  // The lede — the article's opening paragraph — is already a one-line
  // statement of what the card is for, so it becomes the subtitle rather than
  // being repeated as the first thing on the card. Only when it really is the
  // opening and really does precede the download link: the cheat sheet puts a
  // source note between the two, and that note is card content.
  const ledeAt =
    downloadAt > 0 && blocks[0][0]?.type === 'paragraph_open' && !isDownloadBlock(blocks[0], article.slug)
      ? 0
      : -1;
  const subtitle = ledeAt === 0 ? blockText(blocks[0]) : '';

  const sections = [];
  let current = { title: '', blocks: [] };
  const flush = () => {
    if (current.title || current.blocks.length) sections.push(current);
  };

  blocks.forEach((group, i) => {
    if (i === ledeAt || i === downloadAt) return;
    // Every `---` in these articles separates two `##` sections. The card
    // separates sections itself, so the rules would double up.
    if (group[0]?.type === 'hr') return;
    if (blockClasses(group).includes('card-omit')) return;

    if (group[0]?.type === 'heading_open' && group[0].tag === 'h2') {
      flush();
      current = { title: blockText(group), blocks: [] };
      return;
    }
    current.blocks.push(group);
  });
  flush();

  return {
    slug: article.slug,
    title: article.data.title ?? '',
    subtitle,
    sections: sections
      .filter((s) => s.title || s.blocks.length)
      .map((s) => ({
        title: s.title,
        html: s.blocks.map((g) => md.renderer.render(g, md.options, {})).join(''),
        text: [s.title, ...s.blocks.map(blockText)].filter(Boolean).join(' '),
        images: s.blocks.flatMap(blockImages),
      })),
    provenance: provenanceOf(article.data),
  };
}

/**
 * The footer line. A printed card with no date on it is a card nobody can
 * trust two seasons later, so this is not optional dressing.
 */
function provenanceOf(data) {
  const parts = [];
  if (data.ruleYear) parts.push(`Reflects the ${data.ruleYear} NFHS rules year.`);
  if (data.source) parts.push(`Built from ${data.source}.`);
  if (data.verified) {
    const when = new Date(data.verified).toLocaleDateString('en-US', {
      dateStyle: 'long',
      timeZone: 'UTC',
    });
    parts.push(`Last checked ${when}.`);
  }
  parts.push('Confirm with the association before relying on this.');
  return parts.join(' ');
}

/** Everything the card is meant to say, for the "nothing was dropped" gate. */
export const cardText = (model) =>
  [model.title, model.subtitle, ...model.sections.map((s) => s.text)].filter(Boolean).join(' ');

/** Every image the card references, deduplicated, in document order. */
export const cardImages = (model) => [...new Set(model.sections.flatMap((s) => s.images))];
