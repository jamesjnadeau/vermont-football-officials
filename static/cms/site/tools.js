// The site's toolbox group: insert or edit a signal grid, insert or edit a
// figure grid, and mark a paragraph web-only (card-omit) or card-only.
//
// This module only stows the tools on ContentTools' ToolShelf. Letting them
// past markdown mode and putting them in the toolbox is the editor's job,
// asked for by name in window.contentToolsEdit.allowTools (extension.js).
import { LIBRARY } from './vendor.js';
import { TOOL_GROUP } from './names.js';
import { VISIBILITY } from './card-note.js';
import { SignalDialog, FigureDialog } from './dialogs.js';

const { ContentTools, ContentEdit } = LIBRARY;

class GridTool extends ContentTools.Tool {
  static requiresElement = true;

  static canApply(element) {
    return !!element && !element.isFixed();
  }

  static isApplied(element) {
    return !!element && element.type() === 'SiteComponent' && element.model().kind === this.kind;
  }

  static apply(element, selection, callback) {
    const toolDetail = { tool: this, element, selection };
    if (!this.dispatchEditorEvent('tool-apply', toolDetail)) return;
    const editing = this.isApplied(element) ? element : null;
    element.storeState?.();
    const app = ContentTools.EditorApp.get();
    const modal = new ContentTools.ModalUI();
    const dialog = new this.Dialog(editing ? editing.model() : null);
    const close = () => {
      modal.hide();
      dialog.hide();
    };
    dialog.addEventListener('cancel', () => {
      close();
      element.restoreState?.();
      callback(false);
    });
    dialog.addEventListener('save', (ev) => {
      const { model } = ev.detail();
      close();
      if (editing) {
        editing.model(model);
        editing.focus();
      } else {
        const component = new ContentEdit.SiteComponent('div', {}, model);
        const [node, index] = this._insertAt(element);
        node.parent().attach(component, index);
        component.focus();
      }
      callback(true);
      this.dispatchEditorEvent('tool-applied', toolDetail);
    });
    app.attach(modal);
    app.attach(dialog);
    modal.show();
    dialog.show();
  }
}

class SignalGridTool extends GridTool {
  static label = 'Signal grid';
  static icon = 'site-signals';
  static kind = 'signal-grid';
  static Dialog = SignalDialog;
}

class FigureGridTool extends GridTool {
  static label = 'Figure grid';
  static icon = 'site-figures';
  static kind = 'figure-grid';
  static Dialog = FigureDialog;
}

// card-omit and card-only exclude each other: a paragraph is on the web,
// on the card, or (neither class) on both.
export function toggleVisibility(element, className) {
  const on = !element.hasCSSClass(className);
  for (const c of VISIBILITY) {
    if (element.hasCSSClass(c)) element.removeCSSClass(c);
  }
  if (on) element.addCSSClass(className);
  return on;
}

class VisibilityTool extends ContentTools.Tool {
  static requiresElement = true;

  static canApply(element) {
    return !!element && element.type() === 'Text' && element.tagName() === 'p';
  }

  static isApplied(element) {
    return this.canApply(element) && element.hasCSSClass(this.className);
  }

  static apply(element, selection, callback) {
    const toolDetail = { tool: this, element, selection };
    if (!this.dispatchEditorEvent('tool-apply', toolDetail)) return;
    toggleVisibility(element, this.className);
    callback(true);
    this.dispatchEditorEvent('tool-applied', toolDetail);
  }
}

class WebOnlyTool extends VisibilityTool {
  static label = 'Web only (left off the printed card)';
  static icon = 'site-web-only';
  static className = 'card-omit';
}

class CardOnlyTool extends VisibilityTool {
  static label = 'Card only (hidden on the web page)';
  static icon = 'site-card-only';
  static className = 'card-only';
}

// Stowing again replaces the tool under the same name, so this is safe to
// call more than once.
export function installTools() {
  const tools = [SignalGridTool, FigureGridTool, WebOnlyTool, CardOnlyTool];
  TOOL_GROUP.forEach((name, i) => ContentTools.ToolShelf.stow(tools[i], name));
}
