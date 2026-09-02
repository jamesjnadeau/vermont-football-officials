/**
 * A scene in, a complete SVG document out.
 *
 * This is the only place that knows what a whole diagram file looks like:
 * the XML declaration, the `<svg>` element and its accessible name, the
 * shared stylesheet and defs, and the order the marks are painted in. A
 * scene says *what is on the field* in football terms; nothing in a scene
 * mentions SVG.
 *
 * **Paint order is fixed here, not by the scene.** Players first, then
 * officials, then movement, then notes — so a caption is never buried under
 * a player and an official's disc never hides behind a receiver. A scene
 * listing its marks in some other order still renders the same picture,
 * which is what makes the drift test in `test/field/generated.test.js`
 * meaningful: the same scene must produce the same bytes every run, on any
 * machine, regardless of how the scene happened to be written.
 *
 * Pure: no DOM, no `node:` imports. `tools/diagrams.js` is what writes the
 * strings to disk.
 */
import { VIEWBOX_WIDTH, num } from './geometry.js';
import { STYLE, DEFS } from './style.js';
import { renderField } from './field.js';
import { official, player, movement, note, flag } from './markers.js';
import { views } from './views.js';
import { escapeText } from './escape.js';

/**
 * @param {object} scene
 * @param {string} scene.view    a key of `views`
 * @param {string} scene.title   the document title and accessible name
 * @param {Array}  [scene.officials]  `{ mark, at: {across, down}, highlight }`
 * @param {Array}  [scene.players]    `{ kind, at }`
 * @param {Array}  [scene.movements]  `{ points, label, arrow }`
 * @param {Array}  [scene.notes]      `{ text, at, anchor }`
 * @param {Array}  [scene.flags]      `{ at }`
 * @returns {string} a complete SVG document
 */
export function renderDiagram(scene) {
  const view = views[scene.view];
  if (!view) throw new Error(`unknown view: ${scene.view}`);
  if (!scene.title) throw new Error('a scene must have a title');

  const { svg: field, height } = renderField(view);

  const marks = [
    ...(scene.players ?? []).map((m) => player(m, view)),
    ...(scene.officials ?? []).map((m) => official(m, view)),
    ...(scene.flags ?? []).map((m) => flag(m, view)),
    ...(scene.movements ?? []).map((m) => movement(m, view)),
    ...(scene.notes ?? []).map((m) => note(m, view)),
  ].join('');

  const title = escapeText(scene.title);
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg viewBox="0 0 ${num(VIEWBOX_WIDTH)} ${num(height)}" xmlns="http://www.w3.org/2000/svg"` +
    ` role="img" aria-label="${title}">` +
    `<title>${title}</title>` +
    `<style>${STYLE}</style>` +
    DEFS +
    field +
    marks +
    `</svg>\n`
  );
}
