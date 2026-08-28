/**
 * The drawing board's entry point, and the only module under lib/field/ or
 * lib/draw/ that touches `document`. Everything else stays importable by
 * `node --test` with no DOM and no `node:` builtins, because it is also
 * served straight to the browser (see the passthrough copy in .eleventy.js)
 * and must run unchanged in both places.
 *
 * This task only puts the field on screen — no tokens, no presets, no
 * dragging. Those hang off `renderBoard()`'s empty layers in later tasks.
 */
import { renderBoard } from './board.js';

// Nothing picks a crop yet (that's Task 4's presets), so the board opens on
// the general run/pass view: no goal line, no kicking specifics, the crop
// closest to an "ordinary down" a viewer would expect to see first.
const DEFAULT_VIEW = 'runPass';

function mount(viewName) {
  const svg = document.getElementById('board');
  if (!svg) return;
  const { viewBox, markup } = renderBoard(viewName);
  svg.setAttribute('viewBox', viewBox);
  // Setting innerHTML on an <svg> element parses the fragment in the SVG
  // namespace (the browser uses the context element's namespace for fragment
  // parsing), so the nested <style>, <defs> and <g> land as real SVG nodes
  // rather than opaque HTML — no separate DOM-building code needed here.
  svg.innerHTML = markup;
}

mount(DEFAULT_VIEW);
