// Card notes: a paragraph written as raw HTML only so that it can carry a
// class saying where it appears. `card-omit` is on the web page but left off
// the printed card; `card-only` is on the card and hidden on the web (see
// `.card-only` in content/styles/main.scss).
//
// Markdown can't put a class on a paragraph, so these stay raw HTML in the
// file — but in the editor they are ordinary paragraphs an author can type
// in. Only paragraphs whose contents the editor's paragraph can represent
// faithfully (text, links, bold, italic, code, line breaks) qualify; anything
// else is left to the read-only preview.
//
// Pure: used in the browser and by the tests in Node.

export const VISIBILITY = ['card-omit', 'card-only'];
const NOTE = /^<p class="(card-omit|card-only)">([\s\S]*)<\/p>$/;
// Exported so document.js can re-check a note's inner markup with the
// browser's own HTML parser (see its safeInlineMarkup) — the regex checks
// below are a cheap first pass, not the security boundary.
export const INLINE = new Set(['a', 'b', 'strong', 'i', 'em', 'code', 'br']);

export function parseCardNote(raw) {
  const m = NOTE.exec(raw.trim());
  if (!m) return null;
  const inner = m[2];
  if (inner.includes('\n\n')) return null;
  for (const [, name] of inner.matchAll(/<\/?([a-zA-Z][\w-]*)/g)) {
    if (!INLINE.has(name.toLowerCase())) return null;
  }
  if (/\son[a-z]+\s*=/i.test(inner) || /javascript:/i.test(inner)) return null;
  return { visibility: m[1], inner };
}

// The editor indents a paragraph's contents over several lines when it
// writes it out. A blank line would end the HTML block in markdown and spill
// the rest of the note into the page as text, so the note is kept to one line.
export function serializeCardNote(visibility, inner) {
  if (!VISIBILITY.includes(visibility)) throw new Error(`unknown card visibility ${visibility}`);
  return `<p class="${visibility}">${inner.trim().replace(/\s*\n\s*/g, ' ')}</p>`;
}
