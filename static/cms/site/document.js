// Teaches the vendored MarkdownDocument about the site's raw-HTML blocks.
//
// Out of the box, a raw-HTML block in a markdown file is shown in the editor
// as its source in a <pre>, and written back untouched. Here:
//
//   - a signal or figure grid becomes a SiteComponent (see component.js);
//   - a card note becomes an ordinary editable paragraph with its class;
//   - anything else is shown as itself — sanitized, read-only — instead of
//     as source.
//
// On the way back, the vendored fromHTML() only knows plain markdown blocks
// and statics, and silently DROPS any element it doesn't know — a component
// among them. So update() first swaps every component and card note for a
// static placeholder, remembering the markdown each one should become (a
// "slot"), and emit() puts those in where fromHTML() reports the statics.
// A slot is null — keep the original bytes — whenever the block is
// unchanged.
//
// Only prototype methods are patched, so every MarkdownDocument the editing
// session creates gets this, and nothing in the vendored files changes.
import { MarkdownDocument, blockToHTML } from './vendor.js';
import { parseGrid, serializeGrid } from './grids.js';
import { VISIBILITY, INLINE, parseCardNote, serializeCardNote } from './card-note.js';
import { COMPONENT_TAG, MODEL_ATTRIBUTE, componentHTML } from './component.js';
import { sanitize } from './sanitize.js';

const INSTALLED = Symbol.for('vfo.site-document');
const SLOTS = Symbol('vfo.site-slots');
const MARKER = 'data-ct-md';
// Protocols an `<a href>` inside a card note may use, read back from a real
// anchor element rather than matched with a regex. A relative, fragment-only
// or query-only href resolves against the page's own URL, so it always comes
// back as one of these — there is no separate "looks relative" case to
// special-case here.
const SAFE_HREF_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
// A C0 control character (NUL through the character before space) anywhere
// in a raw href — including one spelled out as a numeric character
// reference, which arrives here already decoded — is the same thing
// sanitize.js's unsafeURL strips before it looks at a URL's scheme. A plain
// interior space is not flagged: it isn't a control character. This is a
// second, independent check on top of the protocol check below, and not
// merely because a control character can hide a scheme from a naive regex.
// The browser's own URL parser silently drops a leading control character
// (and strips tab/newline anywhere), so el.protocol below already reads
// `javascript:` correctly for e.g. `\x01javascript:...` — but ContentEdit's
// own editing surface does its *own*, different, incidental rewriting of
// such bytes (e.g. a raw tab typed into a link often comes back as a plain
// space), and relying on that rewriting to "fix" the href would silently
// change the saved bytes of a note nobody edited. So any control character
// disqualifies the note as an editable paragraph at all, regardless of what
// the protocol resolves to, and it falls through to the static preview
// instead, which is untouched by ContentEdit and round-trips byte for byte.
const RAW_CONTROL_CHARS = /[\u0000-\u001f]/;

// A fresh, plain anchor — never one pulled out of a <template>'s content,
// whose fragment belongs to a separate "template contents owner document"
// with no URL of its own, so a relative href inside a template resolves
// against about:blank instead of the page. This one is a normal element of
// the current document, so `.protocol` resolves a relative, fragment-only or
// query-only href exactly as a real click on the page would.
const HREF_PROBE = document.createElement('a');

function safeHref(raw) {
  if (RAW_CONTROL_CHARS.test(raw)) return false;
  HREF_PROBE.href = raw;
  return SAFE_HREF_PROTOCOLS.has(HREF_PROBE.protocol);
}

// parseCardNote's tag and `on`-attribute checks are regex over the raw
// source: cheap, but not a security boundary — `<b/onmouseover=x>` slips
// past a regex that requires whitespace before `on`, and an entity-encoded
// `&#106;avascript:` slips past a literal string match. This re-parses the
// same markup with the browser's own HTML parser, whose attribute values
// come back already decoded, and checks the actual element tree: every tag
// must be one of card-note.js's inline tags, and the only attribute allowed
// anywhere is `href` on `<a>`, restricted to a safe scheme, a relative
// reference, or `#`. Anything else means the note isn't shown as an editable
// paragraph at all — it falls through to the sanitized, read-only preview.
function safeInlineMarkup(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  for (const el of template.content.querySelectorAll('*')) {
    if (!INLINE.has(el.localName)) return false;
    for (const { name, value } of el.attributes) {
      if (!(el.localName === 'a' && name === 'href' && safeHref(value))) return false;
    }
  }
  return true;
}

export function renderBlock(entry, source) {
  if (entry.editable || entry.node.type !== 'html') return null;
  const raw = source.slice(entry.start, entry.end);
  const grid = parseGrid(raw);
  if (grid) return componentHTML(grid, entry.index);
  const note = parseCardNote(raw);
  if (note && safeInlineMarkup(note.inner)) return `<p class="${note.visibility}" ${MARKER}="${entry.index}">${note.inner}</p>`;
  return `<div data-ce-tag="static" class="ct-md-static ct-site-preview" ${MARKER}="${entry.index}">${sanitize(raw)}</div>`;
}

// The markdown an element should be written as: a string, null for "can't
// tell — keep the original", or undefined for "not ours, let fromHTML()
// handle it".
function replacementFor(el) {
  if (el.getAttribute('data-ce-tag') === COMPONENT_TAG) {
    try {
      return serializeGrid(JSON.parse(el.getAttribute(MODEL_ATTRIBUTE)));
    } catch {
      return null;
    }
  }
  if (el.localName === 'p') {
    const visibility = VISIBILITY.find((c) => el.classList.contains(c));
    if (visibility) return serializeCardNote(visibility, el.innerHTML);
  }
  return undefined;
}

// Markup compared the way a browser sees it: attribute order, quoting and
// runs of whitespace don't count. The editor rewrites a paragraph's markup
// in its own style, and that alone is not an edit.
function canonical(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.data.replace(/\s+/g, ' ');
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const attrs = [...node.attributes].map((a) => `${a.name}=${JSON.stringify(a.value)}`).sort().join(' ');
    return `<${node.localName} ${attrs}>${[...node.childNodes].map(walk).join('').trim()}</${node.localName}>`;
  };
  return [...template.content.childNodes].map(walk).join('');
}

export function prepare(doc, html) {
  const { source, blocks } = doc.parsed;
  const template = document.createElement('template');
  template.innerHTML = html;
  const slots = [];
  const claimed = new Set();
  for (const el of [...template.content.children]) {
    // fromHTML() honours a marker only the first time it sees it, so a
    // paragraph the editor split in two keeps its block only in the first
    // half. Mirror that, or the second half would be "unchanged" and vanish.
    let marker = el.getAttribute(MARKER);
    if (marker !== null && claimed.has(marker)) marker = null;
    if (marker !== null) claimed.add(marker);
    if (el.getAttribute('data-ce-tag') === 'static') {
      slots.push(null);
      continue;
    }
    const next = replacementFor(el);
    if (next === undefined) continue;
    const original = marker === null ? null : blocks[Number(marker)];
    const unchanged = next !== null && original && canonical(next) === canonical(source.slice(original.start, original.end));
    slots.push(next === null || unchanged ? null : next);
    const placeholder = document.createElement('div');
    placeholder.setAttribute('data-ce-tag', 'static');
    if (marker !== null) placeholder.setAttribute(MARKER, marker);
    el.replaceWith(placeholder);
  }
  return { html: template.innerHTML, slots };
}

export function installDocument() {
  const proto = MarkdownDocument.prototype;
  if (proto[INSTALLED]) return;
  for (const name of ['toHTML', 'update', 'emit']) {
    if (typeof proto[name] !== 'function') {
      throw new Error(`MarkdownDocument.${name} is gone from the vendored ContentTools — static/cms/site/document.js needs updating`);
    }
  }
  const { update, emit } = proto;

  proto.toHTML = function toHTML() {
    const { blocks, source } = this.parsed;
    return blocks.map((entry) => renderBlock(entry, source) ?? blockToHTML(entry, source)).join('');
  };

  proto.update = function patchedUpdate(html, options) {
    const prepared = prepare(this, html);
    this[SLOTS] = prepared.slots;
    try {
      return update.call(this, prepared.html, options);
    } finally {
      delete this[SLOTS];
    }
  };

  // fromHTML() reports statics in document order, as verbatim entries, and
  // prepare() recorded one slot per static in the same order.
  proto.emit = function patchedEmit(edited) {
    const slots = this[SLOTS];
    if (slots) {
      let k = 0;
      edited = edited.map((entry) => {
        if (!entry.verbatim) return entry;
        const slot = slots[k++];
        return slot == null ? entry : { index: entry.index, node: { type: 'html', value: slot }, verbatim: false };
      });
    }
    return emit.call(this, edited);
  };

  proto[INSTALLED] = true;
}
