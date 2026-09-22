// Loaded into the browser test's page as /__test/harness.js. Mirrors what the
// editing session does with a page — MarkdownDocument.toHTML() into an
// editable region, the editor's region.html() back out, then update() — but
// without GitHub or an author, so a whole file's round trip can be checked.
import { LIBRARY, MarkdownDocument } from '/cms/site/vendor.js';

const { ContentEdit, HTMLString } = LIBRARY;

export async function markdown(name) {
  const res = await fetch(`/__md/${name}`);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  return res.text();
}

export function regionHTML(html) {
  const host = document.getElementById('region');
  host.innerHTML = html;
  return new ContentEdit.Region(host).html();
}

export async function roundTrip(name) {
  const doc = MarkdownDocument.parse(await markdown(name));
  return doc.update(regionHTML(doc.toHTML()));
}

export { ContentEdit, HTMLString, MarkdownDocument };
