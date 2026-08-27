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

export const CARD_CSS_PATH = fileURLToPath(new URL('./card.css', import.meta.url));

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
export function renderCardHtml(model, { assets = new Map(), css = readFileSync(CARD_CSS_PATH, 'utf8') } = {}) {
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
