// Signal grids and figure grids: the two raw-HTML layouts the site's
// articles use for rows of pictures, as data the editor can change and write
// back out in exactly the form the rest of the content is written in.
//
// parseGrid is deliberately strict — it accepts a block only if serializing
// what it read gives back the very same bytes. So a grid someone wrote by
// hand in some other shape is never "tidied" by opening it in the editor: it
// fails to parse, and the editor shows it read-only instead.
//
// Pure: used by the editor in the browser, and by tools/content-tools and the
// tests in Node.

export const SIGNAL_ROW = 'row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3 my-4';
export const FIGURE_ROW = 'row g-3 my-4';
const SIGNAL_IMG = 'img-fluid border rounded bg-white';
const SIGNAL_FIGURE_IMG = 'figure-img img-fluid border rounded bg-white';
const FIGURE_IMG = 'figure-img img-fluid border rounded p-2 bg-white';

export const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
export const escapeText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ENTITIES[e]);

// Each grid starts with a `<div class="row` line and ends at the first
// `</div>` in column 0 — the columns inside are always indented.
export function findGrids(markdown) {
  return [...markdown.matchAll(/^<div class="row[^\n]*\n[\s\S]*?^<\/div>$/gm)].map((m) => m[0]);
}

const img = (src, alt, cls) => `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" class="${cls}">`;
const caption = (text) => `<figcaption class="figure-caption">${escapeText(text ?? '')}</figcaption>`;

function signalItem(item, captioned) {
  if (!captioned) return `  <div class="col">\n    ${img(item.src, item.alt, SIGNAL_IMG)}\n  </div>`;
  return [
    '  <div class="col">',
    '    <figure class="figure d-block text-center">',
    `      ${img(item.src, item.alt, SIGNAL_FIGURE_IMG)}`,
    `      ${caption(item.caption)}`,
    '    </figure>',
    '  </div>',
  ].join('\n');
}

function figureItem(item) {
  return [
    '  <div class="col-sm-6">',
    '    <figure class="figure d-block">',
    `      ${img(item.src, item.alt, FIGURE_IMG)}`,
    `      ${caption(item.caption)}`,
    '    </figure>',
    '  </div>',
  ].join('\n');
}

export function serializeGrid(model) {
  if (!model || !Array.isArray(model.items) || !model.items.length) throw new Error('a grid needs at least one picture');
  if (model.kind === 'signal-grid') {
    return [`<div class="${SIGNAL_ROW}">`, ...model.items.map((i) => signalItem(i, model.captioned)), '</div>'].join('\n');
  }
  if (model.kind === 'figure-grid') {
    return [`<div class="${FIGURE_ROW}">`, ...model.items.map(figureItem), '</div>'].join('\n');
  }
  throw new Error(`unknown grid kind ${model.kind}`);
}

const ITEM = /<img src="([^"]*)" alt="([^"]*)" class="[^"]*">(?:\s*<figcaption class="figure-caption">([^<]*)<\/figcaption>)?/g;

export function parseGrid(raw) {
  const first = raw.slice(0, raw.indexOf('\n'));
  const items = [...raw.matchAll(ITEM)].map(([, src, alt, cap]) => {
    const item = { src: decode(src), alt: decode(alt) };
    if (cap !== undefined) item.caption = decode(cap);
    return item;
  });
  if (!items.length) return null;
  let model;
  if (first === `<div class="${SIGNAL_ROW}">`) {
    const captioned = items.every((i) => 'caption' in i);
    model = { kind: 'signal-grid', captioned, items };
  } else if (first === `<div class="${FIGURE_ROW}">`) {
    model = { kind: 'figure-grid', items: items.map((i) => ({ ...i, caption: i.caption ?? '' })) };
  } else {
    return null;
  }
  try {
    return serializeGrid(model) === raw ? model : null;
  } catch {
    return null;
  }
}
