// The two grid dialogs, built on ContentTools' own DialogUI so they open,
// close and look like the editor's Image and Video dialogs (header, close
// button, Esc to cancel). Each dispatches `save` with `{ model }`.
import { LIBRARY } from './vendor.js';
import { SIGNALS } from './signals.js';
import { signalModel, figureModel, moveRow } from './models.js';

// The editor's own instances: index.js checks, before this module is used,
// that they are the ones the editor was handed.
const { ContentTools, ContentEdit } = LIBRARY;

function el(tag, attrs = {}, text) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(dialog, label, extra = []) {
  const b = dialog.constructor.createDiv(['ct-control', 'ct-control--text', ...extra]);
  b.textContent = ContentEdit._(label);
  return b;
}

export class SignalDialog extends ContentTools.DialogUI {
  constructor(model) {
    super(model ? 'Edit signal grid' : 'Insert signal grid');
    this._model = model;
  }

  mount() {
    super.mount();
    ContentEdit.addCSSClass(this._domElement, 'ct-site-dialog');
    const ticked = new Set((this._model?.items ?? []).map((i) => i.src));
    this._domList = el('div', { class: 'ct-site-signals' });
    for (const signal of SIGNALS) {
      const label = el('label', { class: 'ct-site-signal' });
      const box = el('input', { type: 'checkbox', value: signal.src });
      box.checked = ticked.has(signal.src);
      label.append(box, el('img', { src: signal.src, alt: '' }), el('span', {}, signal.caption));
      this._domList.append(label);
    }
    this._domView.append(this._domList);

    const group = this.constructor.createDiv(['ct-control-group']);
    const captions = el('label', { class: 'ct-site-option' });
    this._domCaptions = el('input', { type: 'checkbox' });
    this._domCaptions.checked = this._model?.captioned ?? false;
    captions.append(this._domCaptions, document.createTextNode(' Show captions'));
    this._domButton = button(this, this._model ? 'Update' : 'Insert', ['ct-control--insert']);
    group.append(captions, this._domButton);
    this._domControls.append(group);
    this._refresh();
    return this._addDOMEventListeners();
  }

  _ticked() {
    return new Set([...this._domList.querySelectorAll('input:checked')].map((b) => b.value));
  }

  _refresh() {
    const empty = !signalModel(this._model, this._ticked(), this._domCaptions.checked, SIGNALS);
    this._domButton.classList.toggle('ct-control--muted', empty);
  }

  save() {
    const model = signalModel(this._model, this._ticked(), this._domCaptions.checked, SIGNALS);
    if (model) this.dispatchEvent(this.createEvent('save', { model }));
  }

  _addDOMEventListeners() {
    super._addDOMEventListeners();
    this._domList.addEventListener('change', () => this._refresh());
    this._domButton.addEventListener('click', (ev) => {
      ev.preventDefault();
      this.save();
    });
  }
}

export class FigureDialog extends ContentTools.DialogUI {
  constructor(model) {
    super(model ? 'Edit figure grid' : 'Insert figure grid');
    this._rows = (model?.items ?? [{ src: '', alt: '', caption: '' }]).map((i) => ({ src: i.src, alt: i.alt, caption: i.caption ?? '' }));
    this._editing = !!model;
  }

  mount() {
    super.mount();
    ContentEdit.addCSSClass(this._domElement, 'ct-site-dialog');
    this._domRows = el('div', { class: 'ct-site-rows' });
    this._domErrors = el('p', { class: 'ct-site-errors', role: 'alert' });
    this._domView.append(this._domRows, this._domErrors);
    const group = this.constructor.createDiv(['ct-control-group']);
    this._domAdd = button(this, 'Add figure');
    this._domButton = button(this, this._editing ? 'Update' : 'Insert', ['ct-control--insert']);
    group.append(this._domAdd, this._domButton);
    this._domControls.append(group);
    this._render();
    return this._addDOMEventListeners();
  }

  _render() {
    this._domRows.replaceChildren(...this._rows.map((row, n) => {
      const fieldset = el('fieldset', { class: 'ct-site-row', 'data-row': String(n) });
      fieldset.append(el('legend', {}, `Figure ${n + 1}`));
      for (const [key, label, hint] of [['src', 'Image path', '/images/…'], ['alt', 'Alt text', 'What the picture shows'], ['caption', 'Caption', 'Optional']]) {
        const input = el('input', { type: 'text', name: key, placeholder: hint, 'aria-label': `${label}, figure ${n + 1}` });
        input.value = row[key];
        fieldset.append(el('label', {}, label), input);
      }
      const actions = el('div', { class: 'ct-site-row__actions' });
      actions.append(el('button', { type: 'button', 'data-act': 'up' }, '↑'), el('button', { type: 'button', 'data-act': 'down' }, '↓'), el('button', { type: 'button', 'data-act': 'remove' }, 'Remove'));
      fieldset.append(actions);
      return fieldset;
    }));
  }

  save() {
    const { model, errors } = figureModel(this._rows);
    this._domErrors.textContent = errors.join(' ');
    if (model) this.dispatchEvent(this.createEvent('save', { model }));
  }

  _addDOMEventListeners() {
    super._addDOMEventListeners();
    this._domRows.addEventListener('input', (ev) => {
      const n = Number(ev.target.closest('[data-row]').dataset.row);
      this._rows[n] = { ...this._rows[n], [ev.target.name]: ev.target.value };
    });
    this._domRows.addEventListener('click', (ev) => {
      const act = ev.target.dataset?.act;
      if (!act) return;
      const n = Number(ev.target.closest('[data-row]').dataset.row);
      if (act === 'up') this._rows = moveRow(this._rows, n, n - 1);
      if (act === 'down') this._rows = moveRow(this._rows, n, n + 1);
      if (act === 'remove') this._rows = this._rows.filter((_, i) => i !== n);
      this._render();
    });
    this._domAdd.addEventListener('click', (ev) => {
      ev.preventDefault();
      this._rows = [...this._rows, { src: '', alt: '', caption: '' }];
      this._render();
    });
    this._domButton.addEventListener('click', (ev) => {
      ev.preventDefault();
      this.save();
    });
  }
}
