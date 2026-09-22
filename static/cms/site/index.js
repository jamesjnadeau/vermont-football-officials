// The site's additions to the in-page editor: card notes and grids that edit
// as what they are, live previews of other raw HTML, and the tools for them.
// Installed by window.contentToolsEdit.setup (extension.js), which the
// editor calls once an author opens it, after it has parsed the file and
// before it builds the region or the toolbox.
import { LIBRARY } from './vendor.js';
import { installDocument } from './document.js';
import { defineComponent } from './component.js';
import { installTools } from './tools.js';
import { installStyles } from './styles.js';

// `library` is what the editor is about to run on. The site code reaches the
// same objects through vendor.js, because ES modules are singletons by URL;
// if a build ever bundles the library twice, tools stowed through vendor.js
// would land on a shelf the toolbox never reads, and the author would see
// buttons that do nothing. Saying so here puts the sentence on the edit bar.
export function install(library) {
  if (library !== LIBRARY) {
    throw new Error('The editor was handed a different ContentTools from the one static/cms/site/vendor.js imports — re-run node tools/content-tools/link-site.mjs, or update static/cms/site/ for this build.');
  }
  installDocument();
  defineComponent(library.ContentEdit);
  installTools();
  installStyles();
}
