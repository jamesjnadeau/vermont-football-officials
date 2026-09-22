// window.contentToolsEdit for this site: see "The in-page surface" in the
// ContentTools fork's docs/custom-tools.md. boot.js sets it before edit.js
// loads.
//
// This module imports nothing but the tool names, so a signed-in visitor who
// never opens the editor downloads none of the site code: the editor calls
// `setup` only once the author presses the pencil.
import { TOOL_GROUP } from './names.js';

export const siteExtension = {
  async setup(library) {
    const { install } = await import('./index.js');
    install(library);
  },
  // Lets the tools past markdown mode and adds them to the end of the
  // default toolbox as a group of their own. They are safe in markdown: the
  // grids and notes they write are raw HTML blocks that document.js turns
  // back into the house markup.
  allowTools: TOOL_GROUP,
  styles: new URL('./chrome.css', import.meta.url).href,
};
