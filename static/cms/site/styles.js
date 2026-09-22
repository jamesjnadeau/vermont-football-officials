// The page's half of the site's editor CSS. It goes in the page, not the
// editor's shadow root, because the region being edited is the page's own
// element, and it only marks things while they are being edited: every rule
// hangs off ContentEdit's .ce-element class, which exists only then. The
// toolbox's half is chrome.css, which the editor adopts itself (extension.js).

export const PAGE_CSS = `
.ce-element.card-omit, .ce-element.card-only { position: relative; outline: 2px dashed #6c757d; outline-offset: 6px; margin-top: 2em; }
.ce-element.card-omit::before, .ce-element.card-only::before {
  position: absolute; top: -1.9em; left: -6px; padding: 1px 6px; border-radius: 3px;
  font: 600 11px/1.4 system-ui, sans-serif; color: #fff; background: #6c757d; pointer-events: none;
}
.ce-element.card-omit::before { content: "Web only — left off the printed card"; }
.ce-element.card-only { display: block !important; }
.ce-element.card-only::before { content: "Card only — hidden on the web page"; background: #0d6efd; }
.ce-element.card-only { outline-color: #0d6efd; }
.ct-site-component { position: relative; outline: 2px dashed #198754; outline-offset: 6px; margin-top: 2.5em; cursor: pointer; }
.ct-site-component::before {
  content: attr(data-ct-site-label) " — select, then use the grid button in the toolbox to change it";
  position: absolute; top: -2.2em; left: -6px; padding: 1px 6px; border-radius: 3px;
  font: 600 11px/1.4 system-ui, sans-serif; color: #fff; background: #198754; pointer-events: none;
}
.ct-site-component.ce-element--focused { outline-style: solid; }
.ct-site-preview { position: relative; outline: 1px dotted #adb5bd; outline-offset: 6px; margin-top: 2em; }
.ct-site-preview::before {
  content: "Shown as it appears on the page — change it in /admin/"; position: absolute; top: -1.9em; left: -6px;
  font: 11px/1.4 system-ui, sans-serif; color: #6c757d; pointer-events: none;
}
`;

export function installStyles() {
  if (document.getElementById('ct-site-page-css')) return;
  const style = document.createElement('style');
  style.id = 'ct-site-page-css';
  style.textContent = PAGE_CSS;
  document.head.append(style);
}
