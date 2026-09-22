// A grid in the editor: one ContentEdit element that stands for a whole
// signal or figure grid, holding its model and rendering the real markup.
//
// Its HTML carries the model as JSON in data-site-model, because the editing
// session feeds the editor's saved HTML straight back in as the region's
// innerHTML when editing resumes, and the element has to rebuild itself from
// that alone.
import { escapeAttr, serializeGrid } from './grids.js';

export const COMPONENT_TAG = 'site-component';
export const MODEL_ATTRIBUTE = 'data-site-model';

export function componentHTML(model, index) {
  const marker = index == null ? '' : ` data-ct-md="${index}"`;
  return `<div data-ce-tag="${COMPONENT_TAG}" ${MODEL_ATTRIBUTE}="${escapeAttr(JSON.stringify(model))}"${marker}>${serializeGrid(model)}</div>`;
}
