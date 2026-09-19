/**
 * Turns a card model into one self-contained HTML document.
 *
 * Self-contained is the requirement, not a nicety: the renderer loads this
 * string into a browser page with no web server behind it, so anything left as
 * a URL simply does not arrive. Every image is inlined as a data URI and the
 * stylesheet is inlined as text.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CARD_SIZES, DEFAULT_CARD_SIZE } from './extract.js';

export const CARD_CSS_PATH = fileURLToPath(new URL('./card.css', import.meta.url));

const sizeCssPath = (file) => fileURLToPath(new URL(`./${file}`, import.meta.url));

/**
 * Every stylesheet the cards are made of, by file name: the base sheet plus
 * one per size that redefines the page box. All of them are hashed into every
 * card's cache key (see `cardSources`), because which sheets exist is itself
 * an input — cheaper than reasoning about which card reads which.
 */
export const CARD_STYLESHEET_PATHS = {
  'card.css': CARD_CSS_PATH,
  ...Object.fromEntries(
    Object.values(CARD_SIZES)
      .filter((s) => s.stylesheet)
      .map((s) => [s.stylesheet, sizeCssPath(s.stylesheet)]),
  ),
};

/**
 * The stylesheet a card of this size is printed with: the base sheet, then the
 * size sheet's overrides. Concatenated rather than swapped, so a size sheet
 * only has to say what differs.
 */
export function cardCss(size = DEFAULT_CARD_SIZE) {
  const base = readFileSync(CARD_CSS_PATH, 'utf8');
  const extra = CARD_SIZES[size]?.stylesheet;
  return extra ? `${base}\n${readFileSync(sizeCssPath(extra), 'utf8')}` : base;
}

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Rewrites every `src` in `html` through `assets`, a Map from the site-root
 * path an article writes to the data URI that stands in for it.
 *
 * A missing asset throws. The alternative — leaving the URL in place — renders
 * as a blank rectangle that no gate downstream can tell from a diagram the
 * editor meant to leave out.
 */
function inlineAssets(html, assets) {
  return html.replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/g, (whole, before, src, after) => {
    const inlined = assets.get(src);
    if (!inlined) throw new Error(`card asset not inlined: ${src}`);
    return `${before}${inlined}${after}`;
  });
}

/** The document the renderer prints. `assets` maps image src -> data URI. */
export function renderCardHtml(model, { assets = new Map(), css = cardCss(model.size) } = {}) {
  const sections = model.sections
    .map((section) => {
      const heading = section.title ? `<h2>${escapeHtml(section.title)}</h2>` : '';
      return `<section class="card-section">${heading}${inlineAssets(section.html, assets)}</section>`;
    })
    .join('\n');

  const subtitle = model.subtitle ? `<p class="card-sub">${escapeHtml(model.subtitle)}</p>` : '';
  const provenance = model.provenance
    ? `<p class="card-prov">${escapeHtml(model.provenance)}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(model.title)}</title>
<style>
${css}
</style>
</head>
<body>
<div class="card">
<header class="card-head"><h1>${escapeHtml(model.title)}</h1>${subtitle}</header>
${sections}
${provenance}
</div>
</body>
</html>
`;
}
