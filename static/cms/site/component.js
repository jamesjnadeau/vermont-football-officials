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

export const KIND_LABELS = { 'signal-grid': 'Signal grid', 'figure-grid': 'Figure grid' };

// Defined on demand, not at import, because the class extends ContentEdit's
// own Element and has to be registered on the very TagNames instance the
// editor parses regions with.
export function defineComponent(ContentEdit) {
  if (ContentEdit.SiteComponent) return ContentEdit.SiteComponent;

  class SiteComponent extends ContentEdit.Element {
    constructor(tagName, attributes, model) {
      super(tagName, attributes);
      this._model = model;
    }

    cssTypeName() { return 'site-component'; }
    type() { return 'SiteComponent'; }
    typeName() { return KIND_LABELS[this._model.kind] ?? 'Component'; }

    model(next) {
      if (next === undefined) return this._model;
      this._model = next;
      if (this.isMounted()) this._render();
      this.taint();
      return next;
    }

    html(indent = '') {
      const marker = this._attributes['data-ct-md'];
      return indent + componentHTML(this._model, marker ?? null);
    }

    mount() {
      this._domElement = document.createElement('div');
      this._domElement.setAttribute('class', 'ct-site-component');
      this._render();
      return super.mount();
    }

    _render() {
      this._domElement.setAttribute('data-ct-site-label', this.typeName());
      this._domElement.innerHTML = serializeGrid(this._model);
    }

    createDraggingDOMElement() {
      const helper = super.createDraggingDOMElement();
      if (helper) helper.textContent = this.typeName();
      return helper;
    }

    // Hold the mouse down on a grid to drag it, as with a static block.
    _onMouseDown(ev) {
      super._onMouseDown(ev);
      clearTimeout(this._dragTimeout);
      this._dragTimeout = setTimeout(() => this.drag(ev.pageX, ev.pageY), 150);
    }

    _onMouseUp(ev) {
      super._onMouseUp(ev);
      clearTimeout(this._dragTimeout);
    }

    static fromDOMElement(domElement) {
      const attributes = this.getDOMElementAttributes(domElement);
      try {
        return new this('div', attributes, JSON.parse(domElement.getAttribute(MODEL_ATTRIBUTE)));
      } catch {
        // Unreadable model: keep the block exactly as it was in the file.
        return new ContentEdit.Static('div', { ...attributes, 'data-ce-tag': 'static' }, domElement.innerHTML);
      }
    }
  }

  const drop = ContentEdit.Element._dropVert;
  SiteComponent.droppers = { Image: drop, List: drop, PreText: drop, SiteComponent: drop, Static: drop, Table: drop, Text: drop };
  SiteComponent.mergers = {};
  SiteComponent.placements = ['above', 'below'];

  ContentEdit.TagNames.get().register(SiteComponent, COMPONENT_TAG);
  ContentEdit.SiteComponent = SiteComponent;
  return SiteComponent;
}
