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
  for (let n = 1; n <= doc.numPages; n += 1) {
    const content = await (await doc.getPage(n)).getTextContent();
    pages.push(content.items.map((item) => item.str ?? '').join(''));
  }
  return { pageCount: doc.numPages, pages, text: pages.join('') };
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
    .map((m) => m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
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
