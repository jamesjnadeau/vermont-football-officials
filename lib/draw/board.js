/**
 * Assembles the drawing board's SVG out of the same pieces the diagram
 * renderer uses — `renderField()`, `STYLE`, `DEFS` — so `/draw` cannot
 * disagree with the field the committed diagrams already draw. Nothing here
 * computes a coordinate or a shape of its own; a view that can't produce
 * what the board needs is a change to `lib/field/`, not to this file.
 *
 * Pure string building: no DOM, no `node:` imports, no globals. `app.js` is
 * the only module that puts this output into a page.
 */
import { VIEWBOX_WIDTH } from '../field/geometry.js';
import { renderField } from '../field/field.js';
import { STYLE, DEFS } from '../field/style.js';
import { views, viewNames } from '../field/views.js';

/**
 * Paint order, fixed and created once: a caption must never end up under a
 * player, and the way to guarantee that is structural rather than something
 * every future call site has to get right on its own. `text` is the topmost
 * *content* layer; `overlay` sits above it holding only UI chrome (a
 * selection outline, an in-progress arrow preview) that is never part of a
 * shared or printed board.
 */
export const LAYER_NAMES = ['field', 'players', 'officials', 'arrows', 'text', 'overlay'];

/** The `<g>` id for a given layer, e.g. `layerId('players')` -> `'board-players'`. */
export function layerId(name) {
  return `board-${name}`;
}

/**
 * Renders one view's board. Returns everything `<svg id="board">` needs:
 * the `viewBox` and `height` (views range from 178 to 394 units tall), and
 * `markup` — the `<style>`, `<defs>` and all six layers, `board-field`
 * already filled in and the other five left empty for `app.js` to write the
 * tokens, arrows, captions and chrome into.
 */
export function renderBoard(viewName) {
  // `hasOwn` rather than a truth test on the lookup: `views['__proto__']`
  // is `Object.prototype` and would pass one. Same check, same reason, as
  // `requireView` in state.js — see the comment there.
  if (!Object.hasOwn(views, viewName)) {
    throw new Error(`unknown view "${viewName}" — must be one of: ${viewNames.join(', ')}`);
  }
  const view = views[viewName];

  const { svg: fieldSvg, height } = renderField(view);

  const layers = LAYER_NAMES.map((name) => {
    const body = name === 'field' ? fieldSvg : '';
    // Only the overlay layer carries a styling class (main.scss keeps it out
    // of the way of pointer input on the layers under it: it covers the whole
    // board and holds nothing of its own to click on). Every layer still gets
    // an id, because that — not a class — is what `app.js` targets to write a
    // token or an arrow into the right stack position.
    const cls = name === 'overlay' ? ' class="draw-layer-overlay"' : '';
    return `<g id="${layerId(name)}"${cls}>${body}</g>`;
  }).join('');

  return {
    viewBox: `0 0 ${VIEWBOX_WIDTH} ${height}`,
    height,
    markup: `<style>${STYLE}</style>${DEFS}${layers}`,
  };
}
