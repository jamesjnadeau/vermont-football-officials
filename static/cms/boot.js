// Starts ContentTools' in-page editor (edit.js) on a page of the site.
//
// Not on every page: the inline script at the bottom of
// content/_includes/layouts/main.pug imports this only when there is an
// editor to serve — a Netlify Identity session in this browser, a token
// handed over from /admin/, or `?cms-edit` on the URL. A reader downloads
// none of it.
//
// edit.js decides for itself whether to put its bar up, by asking whether
// this tab holds a ContentTools token, and talks to api.github.com. Before
// it loads, this files the author's Identity JWT where it looks and routes
// its GitHub calls through Netlify's Git Gateway (see netlify.js).

import { TOKEN_KEY, gatewayFetch, hasSession, identity } from './netlify.js';
import { siteExtension } from './site/extension.js';

// edit.js builds its GitHub client with the global `fetch`, so the gateway
// has to be installed there. It only reroutes calls for this site's own
// repository; every other request goes out exactly as it would have.
window.fetch = gatewayFetch();

if (hasSession()) {
  const user = (await identity()).currentUser();
  if (user) {
    try {
      sessionStorage.setItem(TOKEN_KEY, await user.jwt());
    } catch {
      // Storage refused (a sandboxed frame, some private modes): edit.js
      // will say nobody is signed in, which is true as far as it can tell.
    }
  }
}

// The site's own tools (static/cms/site/): grids, card notes and the toolbox
// buttons for them. edit.js reads this when it opens the editor, and says on
// its bar if they fail to install.
window.contentToolsEdit = siteExtension;

await import('./edit.js');
