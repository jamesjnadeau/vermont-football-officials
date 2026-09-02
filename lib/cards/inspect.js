/**
 * Reads a rendered card back out of its PDF.
 *
 * The gates in `test/cards/output.test.js` are only as good as what can be
 * seen in the finished file, so everything here works from the PDF bytes and
 * the card model — never from the HTML that sat in between.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { cardImages } from './extract.js';

/**
 * Page count and text, straight from the file. `page.pdf()` reporting a page
 * count is the reason this pipeline uses Chromium at all.
 */
export async function readPdf(bytes) {
  const doc = await getDocument({ data: new Uint8Array(bytes), useSystemFonts: true }).promise;
  const pages = [];
  const items = [];
  for (let n = 1; n <= doc.numPages; n += 1) {
    const page = await doc.getPage(n);
    const width = page.getViewport({ scale: 1 }).width;
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str ?? '').join(''));
    for (const item of content.items) {
      if (!(item.str ?? '').trim()) continue;
      const [, , , , x, y] = item.transform;
      // Which column of the two-column card this landed in. The card has one
      // gutter down the middle of the page box, so the midpoint separates them.
      items.push({ page: n, column: x < width / 2 ? 0 : 1, x, y, str: item.str });
    }
  }
  return { pageCount: doc.numPages, pages, text: pages.join(''), items };
}

/**
 * Text as the comparison sees it: letters and digits only.
 *
 * Everything between words is noise here — the card hyphenates at column
 * breaks, `text-transform` uppercases its headings, and a line wrap inside a
 * table cell is not a missing word. What survives is what was actually said.
 */
export const flatten = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');

const occurrences = (haystack, needle) =>
  needle ? haystack.split(needle).length - 1 : 0;

/**
 * Chromium repeats a table's header row on each side of a column break, so a
 * header can land in the middle of a cell that wrapped. These are the strings
 * to allow through as interruptions — long ones only, since deleting a short
 * one from the text could hide a genuine drop.
 */
function repeatedHeaders(model) {
  const headers = new Set();
  for (const section of model.sections) {
    for (const m of section.html.matchAll(/<thead>([\s\S]*?)<\/thead>/g)) {
      const text = flatten(m[1].replace(/<[^>]*>/g, ' '));
      if (text.length >= 8) headers.add(text);
    }
  }
  return [...headers];
}

/**
 * The parts of the card that did not make it into the PDF.
 *
 * Overflow is the quiet failure: content pushed past the page box renders as a
 * clean-looking card with a bullet missing, and nobody notices until someone
 * needs that bullet on a Friday night.
 *
 * A chunk has to appear whole and unbroken, with one allowance: a table header
 * Chromium repeated across a column break may sit inside it.
 */
export function droppedContent(model, pdfText) {
  const found = flatten(pdfText);
  const headers = repeatedHeaders(model);
  const withoutHeaders = headers.reduce((text, h) => text.split(h).join(''), found);

  return model.sections.flatMap((section) =>
    section.chunks
      .filter((chunk) => {
        const want = flatten(chunk);
        return !found.includes(want) && !withoutHeaders.includes(want);
      })
      .map((chunk) => ({ section: section.title, chunk })),
  );
}

/** The labels drawn inside one SVG diagram, in document order. */
export function figureLabels(file) {
  return [...readFileSync(file, 'utf8').matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)]
    .map((m) => decodeEntities(m[1].replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/**
 * Markup in, the text a reader sees out.
 *
 * The comparison downstream is against text extracted from a PDF, where an
 * apostrophe is an apostrophe. The generator escapes one as `&#39;` because
 * the same escaper also serves attribute values, so a label reaching here as
 * markup has to be decoded before it can be matched against rendered text —
 * otherwise every diagram carrying a possessive looks like it failed to
 * render. `&amp;` is decoded last so `&amp;#39;` survives as `&#39;`.
 */
function decodeEntities(markup) {
  return markup
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * The figures that are not in the PDF.
 *
 * A field diagram carries its own words — yard numbers, position markers, the
 * press box — so a figure that failed to render leaves a hole in the text as
 * well as on the page. A broken data URI produces blank space rather than an
 * error, which is the only reason this check exists.
 *
 * Matched on a prefix of each label, because a label the diagram itself clips
 * at the edge of its viewBox arrives truncated and is not the card's fault.
 */
export function missingFigures(model, pdfText, { staticDir = 'static' } = {}) {
  const found = flatten(pdfText);
  const missing = [];

  for (const src of cardImages(model)) {
    const labels = figureLabels(path.join(staticDir, src.slice(1)));
    const needed = new Map();
    for (const label of labels) {
      const key = flatten(label).slice(0, 10);
      if (key) needed.set(key, (needed.get(key) ?? 0) + 1);
    }
    // Counted, not merely present: eight diagrams share their yard numbers, so
    // "the label appears somewhere" would pass with seven of them gone.
    const short = [...needed].filter(([key, n]) => occurrences(found, key) < n);
    if (short.length) missing.push({ src, labels: short.map(([key]) => key) });
  }

  // Count each figure once per card; the same diagram drawn twice would need
  // twice the labels, which the per-figure loop above already accumulates.
  return missing;
}


/** Every heading the card prints, in document order. */
export function headings(model) {
  const out = [];
  for (const section of model.sections) {
    if (section.title) out.push(section.title);
    for (const m of section.html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)) {
      const text = m[1].replace(/<[^>]*>/g, '').trim();
      if (text) out.push(text);
    }
  }
  return out;
}

/** Where a string of text starts and ends in the placed items, from `from` on. */
function locate(items, flatItems, want, from) {
  for (let i = from; i < items.length; i += 1) {
    let acc = '';
    let j = i;
    for (; j < items.length && acc.length < want.length; j += 1) acc += flatItems[j];
    if (acc.startsWith(want)) return { start: i, end: j };
  }
  return null;
}

/**
 * Headings left at the foot of a column with almost none of their own content.
 *
 * Chromium honours `break-after: avoid` for the one box that follows a heading
 * and does not chain it, so a section opening with a one-line lede would put
 * the heading and the lede at the bottom of a column and everything they
 * introduce in the next one — which is what this catches. Two lines is the
 * ordinary typographic minimum; body type is 7.4pt on 1.28, so a line is about
 * 9.5pt.
 *
 * A heading at the very end of the card is exempt: nothing continues past it,
 * so the short column is where the content ran out, not where it was split.
 */
export function strandedHeadings(model, items, { minPoints = 17 } = {}) {
  const flatItems = items.map((i) => flatten(i.str));
  const stranded = [];
  let cursor = 0;

  for (const text of headings(model)) {
    const at = locate(items, flatItems, flatten(text), cursor);
    if (!at) continue;
    cursor = at.end;

    const head = items[at.end - 1];
    let lowest = head.y;
    for (let i = at.end; i < items.length; i += 1) {
      const item = items[i];
      if (item.page !== head.page || item.column !== head.column) break;
      lowest = Math.min(lowest, item.y);
    }

    const continues = items
      .slice(at.end)
      .some((i) => i.page !== head.page || i.column !== head.column);
    if (!continues) continue;

    const followedBy = head.y - lowest;
    if (followedBy < minPoints) {
      stranded.push({
        heading: text,
        page: head.page,
        column: head.column + 1,
        followedBy,
      });
    }
  }
  return stranded;
}
