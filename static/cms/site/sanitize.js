// Makes a raw-HTML block from a markdown file safe to show as a live preview
// in the editor.
//
// The editor runs with the author's Netlify Identity session, and the file
// it opens may be somebody else's pull request, so the preview must never
// run anything: no scripts, frames, plugins or forms, no event handlers, no
// javascript: or data: documents. Styling and plain markup stay, so the
// preview still looks like the page. It is display-only — the block itself
// is written back to the file from the original source, never from this.

// A CSS type selector only matches an SVG element name case-insensitively
// when it is spelled the way the HTML parser's foreign-content algorithm
// case-adjusts it (`animateMotion`, not `animatemotion`), so this list is
// checked against `localName` directly instead of used as a selector.
const DROP = new Set([
  'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'link', 'meta', 'base',
  'form', 'noscript', 'template',
  // SMIL animation elements: dropped outright rather than merely stripped of
  // their attributes, because one of them (`<set>`) exists only to rewrite
  // another element's attribute — including a URL attribute — after that
  // element is already in the page and past the attribute checks below.
  'animate', 'set', 'animatemotion', 'animatetransform', 'discard',
]);
const URL_ATTRIBUTES = new Set(['href', 'src', 'xlink:href', 'action', 'formaction', 'poster', 'srcset', 'background']);
// A scheme allowlist rather than a denylist: an attacker only has to find one
// scheme a denylist forgot (`vbscript:` was one; SMIL rewriting a safe
// attribute to an unsafe scheme after the fact was another), and browsers
// keep adding schemes a denylist would have to keep up with. `data:` is
// allowed only for an <img src> pointing at a raster image, never at
// `data:image/svg+xml`, which can itself carry a <script>.
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto']);

// True when `value`, as the browser's HTML parser has already decoded it,
// names an attribute this element should not carry: a scheme outside the
// allowlist, on an attribute that navigates or loads a resource.
function unsafeURL(name, value) {
  if (!URL_ATTRIBUTES.has(name)) return false;
  // Browsers ignore ASCII whitespace and control characters anywhere in a
  // URL before looking at its scheme, so `java\tscript:` is still a
  // `javascript:` URL to them and has to be treated as one here too.
  const url = value.replace(/[\u0000- ]/g, '');
  if (url === '' || url.startsWith('#') || url.startsWith('/') || url.startsWith('.')) return false;
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(url)?.[1].toLowerCase();
  if (!scheme) return false; // no scheme at all: a relative reference, safe
  if (scheme === 'data') {
    const lower = url.toLowerCase();
    return !(name === 'src' && lower.startsWith('data:image/') && !lower.startsWith('data:image/svg'));
  }
  return !SAFE_SCHEMES.has(scheme);
}

// True for an element that carries `attributeName`: the marker every SMIL
// animation element shares, kept as a second, name-independent check in case
// a future SVG element does the same thing under a name not in DROP yet.
function isAnimationElement(el) {
  return [...el.attributes].some(({ name }) => name.toLowerCase() === 'attributename');
}

export function sanitize(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  for (const el of [...template.content.querySelectorAll('*')]) {
    if (DROP.has(el.localName.toLowerCase()) || isAnimationElement(el)) {
      el.remove();
      continue;
    }
    for (const { name, value } of [...el.attributes]) {
      const n = name.toLowerCase();
      if (n.startsWith('on') || n === 'srcdoc' || n.startsWith('data-ce') || n === 'data-ct-md' || unsafeURL(n, value)) {
        el.removeAttribute(name);
      }
    }
  }
  return template.innerHTML;
}
