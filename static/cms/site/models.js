// What the grid dialogs do with what the author picked, as plain data so it
// can be tested without a page.

// Ticking and unticking signals on an existing grid must not throw away
// what's already there: the grid keeps its own order and alt text, a
// newly ticked signal is added at the end with the site's standard wording,
// and an image that isn't one of the 47 (the dialog can't show it, so the
// author can't have meant to untick it) always stays.
export function signalModel(current, ticked, captioned, manifest) {
  const known = new Map(manifest.map((s) => [s.src, s]));
  const existing = current?.items ?? [];
  const had = new Set(existing.map((i) => i.src));
  const kept = existing.filter((i) => ticked.has(i.src) || !known.has(i.src));
  const added = manifest.filter((s) => ticked.has(s.src) && !had.has(s.src)).map(({ src, alt, caption }) => ({ src, alt, caption }));
  const items = [...kept, ...added].map((i) => (captioned && i.caption === undefined ? { ...i, caption: known.get(i.src)?.caption ?? '' } : i));
  return items.length ? { kind: 'signal-grid', captioned, items } : null;
}

export function figureModel(rows) {
  const items = rows.map((r) => ({ src: r.src.trim(), alt: r.alt.trim(), caption: r.caption.trim() }));
  const errors = [];
  if (!items.length) errors.push('Add at least one figure.');
  items.forEach((item, n) => {
    if (!item.src) errors.push(`Figure ${n + 1} needs an image path.`);
    if (!item.alt) errors.push(`Figure ${n + 1} needs alt text.`);
  });
  return errors.length ? { errors } : { model: { kind: 'figure-grid', items }, errors };
}

export function moveRow(rows, from, to) {
  if (to < 0 || to >= rows.length || from === to) return rows;
  const next = [...rows];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}
