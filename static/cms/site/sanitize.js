// Makes a raw-HTML block from a markdown file safe to show as a live preview
// in the editor.
//
// The editor runs with the author's Netlify Identity session, and the file
// it opens may be somebody else's pull request, so the preview must never
// run anything: no scripts, frames, plugins or forms, no event handlers, no
// javascript: or data: documents. Styling and plain markup stay, so the
// preview still looks like the page. It is display-only — the block itself
// is written back to the file from the original source, never from this.

const DROP = 'script, style, iframe, frame, frameset, object, embed, link, meta, base, form, noscript, template';
const URL_ATTRIBUTES = new Set(['href', 'src', 'xlink:href', 'action', 'formaction', 'poster', 'srcset', 'background']);

function unsafeURL(name, value) {
  if (!URL_ATTRIBUTES.has(name)) return false;
  const url = value.replace(/[\u0000- ]/g, '').toLowerCase();
  if (url.startsWith('javascript:') || url.startsWith('vbscript:')) return true;
  return url.startsWith('data:') && !(name === 'src' && url.startsWith('data:image/') && !url.startsWith('data:image/svg'));
}

export function sanitize(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  for (const el of template.content.querySelectorAll(DROP)) el.remove();
  for (const el of template.content.querySelectorAll('*')) {
    for (const { name, value } of [...el.attributes]) {
      const n = name.toLowerCase();
      if (n.startsWith('on') || n === 'srcdoc' || n.startsWith('data-ce') || n === 'data-ct-md' || unsafeURL(n, value)) {
        el.removeAttribute(name);
      }
    }
  }
  return template.innerHTML;
}
