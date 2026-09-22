// Signs ContentTools authors in with Netlify Identity instead of GitHub.
//
// ContentTools (vendored beside this file by tools/content-tools/vendor.sh)
// edits the repository through GitHub's REST API with a bearer token. Here the
// token is the author's Netlify Identity JWT, and every request goes to
// Netlify's Git Gateway (/.netlify/git/github/...) instead of api.github.com.
// The gateway checks the JWT and makes the call with a GitHub token that
// lives in the Netlify dashboard, so authors need a site login and nothing
// else — no GitHub account, no personal access token.
//
// Two things make that work without changing ContentTools itself (and a
// third makes it say who did it — see `signed`):
//
// - `gatewayFetch` rewrites the URLs. ContentTools always asks for
//   https://api.github.com/repos/<owner>/<repo>/<rest>; the gateway serves
//   the same API at /.netlify/git/github/<rest> for the one repository it is
//   configured with. It also puts a fresh JWT on each request, because
//   Identity tokens last an hour and an editing session can outlast one.
// - `IdentityAdapter` is ContentTools' AuthAdapter interface over the Netlify
//   Identity widget, so /admin/ shows a "Sign in" button that opens the
//   widget's login modal.
//
// Both /admin/ (content/admin/index.pug) and the in-page editor loader
// (boot.js) import this.

// Where ContentTools keeps a personal access token in sessionStorage
// (src/auth/storage.ts). The in-page editor only wakes up when a tab holds
// one, and a token handed across from /admin/ must be filed under a key it
// accepts, so the JWT is kept here too. Spelled out rather than imported,
// because the chunk that exports it is renamed by every build.
export const TOKEN_KEY = 'content-tools:github-token';

// The repository ContentTools is configured to edit (/cms-config.yml). Only
// requests for it are rerouted; anything else passes through untouched.
const REPO = 'jamesjnadeau/vermont-football-officials';
const BRANCH = 'master';

const GITHUB = 'https://api.github.com';
const GATEWAY = '/.netlify/git/github';

// A page of results after the first comes back from GitHub (via the
// gateway's proxied Link header) spelled with the numeric repository id.
const REPO_PREFIXES = [
  new RegExp(`^${GITHUB}/repos/${REPO}(?=/|\\?|$)`),
  new RegExp(`^${GITHUB}/repositories/\\d+(?=/|\\?|$)`),
];

// The widget, loaded once, on demand. It is 180 kB and only an author needs
// it, so no page carries it in a <script> tag. Loaded after the document has
// parsed, it initialises synchronously as it runs, so by the time `onload`
// fires `currentUser()` has its answer.
let widget;
export function identity() {
  widget ??= new Promise((resolve, reject) => {
    if (window.netlifyIdentity) return resolve(window.netlifyIdentity);
    const script = document.createElement('script');
    script.src = '/js/netlify-identity-widget.js';
    script.onload = () => resolve(window.netlifyIdentity);
    script.onerror = () => reject(new Error('The Netlify Identity widget failed to load.'));
    document.head.append(script);
  });
  return widget;
}

// Whether this browser has a Netlify Identity session, asked without loading
// the widget: it keeps the signed-in user in localStorage under this key.
export function hasSession() {
  try {
    return localStorage.getItem('gotrue.user') !== null;
  } catch {
    return false;
  }
}

// Set beside TOKEN_KEY when the token there is this origin's Identity
// session's rather than one handed across from /admin/, so that when the
// session ends the token goes with it.
const FROM_SESSION = 'vfo:token-from-identity';

// Files the signed-in author's JWT where edit.js looks for one, or, with
// nobody signed in any more, takes back the one a session filed. Signing out
// reloads the page, and a token left behind would bring the editor straight
// back up. A token handed across from /admin/ (a deploy preview has no
// session of its own) is left alone.
export async function fileSessionToken() {
  const user = hasSession() ? (await identity()).currentUser() : null;
  try {
    if (user) {
      sessionStorage.setItem(TOKEN_KEY, await user.jwt());
      sessionStorage.setItem(FROM_SESSION, '');
    } else if (sessionStorage.getItem(FROM_SESSION) !== null) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(FROM_SESSION);
    }
  } catch {
    // Storage refused (a sandboxed frame, some private modes): edit.js
    // will say nobody is signed in, which is true as far as it can tell.
  }
}

// A current JWT for the signed-in user, refreshed if it has expired; null if
// nobody is signed in.
async function freshToken() {
  const user = (await identity()).currentUser();
  return user ? user.jwt() : null;
}

// Who is signed in, as a name and an email, or null.
async function author() {
  const user = hasSession() ? (await identity()).currentUser() : null;
  if (!user?.email) return null;
  return { name: user.user_metadata?.full_name?.trim() || user.email, email: user.email };
}

// Every change reaches GitHub as the one account behind the Git Gateway, so
// the pull request and its commits would otherwise say nothing about who
// made it. ContentTools opens one pull request per entry and adds a commit
// for each later save, so the pull request says who opened it and each
// commit is authored by whoever saved it — which is what GitHub shows in
// the pull request's commit list.
async function signed(method, rest, body) {
  if (method !== 'POST' || typeof body !== 'string') return body;
  const path = rest.split('?')[0];
  if (path !== '/pulls' && path !== '/git/commits') return body;
  const who = await author();
  if (!who) return body;

  const payload = JSON.parse(body);
  if (path === '/pulls') {
    const line = `Submitted by ${who.name} (${who.email}) through the site editor.`;
    payload.body = payload.body ? `${payload.body}\n\n${line}` : line;
  } else {
    payload.author = { ...who, date: new Date().toISOString() };
  }
  return JSON.stringify(payload);
}

function json(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// `fetch`, with GitHub API calls for REPO sent through the Git Gateway.
export function gatewayFetch() {
  const http = window.fetch.bind(window);

  return async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const prefix = REPO_PREFIXES.find((p) => p.test(url));
    if (!prefix) return http(input, init);

    const rest = url.replace(prefix, '');

    // The repository's own metadata. The gateway only proxies the
    // endpoints under a repository (contents, git data, pulls, labels…),
    // and ContentTools asks for this once at sign-in, to check the token
    // can push. Anyone the gateway lets through can.
    if (rest === '' || rest.startsWith('?')) {
      return json({ default_branch: BRANCH, permissions: { push: true } });
    }

    const headers = new Headers(init.headers ?? (typeof input === 'string' ? undefined : input.headers));
    // Without a session of its own — a deploy preview opened from /admin/
    // is a different origin — the token /admin/ handed across, which
    // ContentTools has already put on the request, is all there is.
    const token = hasSession() ? await freshToken() : null;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    // Only meaningful to api.github.com; harmless, but not ours to send.
    headers.delete('X-GitHub-Api-Version');

    const body = await signed((init.method ?? 'GET').toUpperCase(), rest, init.body);

    return http(`${GATEWAY}${rest}`, { ...init, headers, body });
  };
}

// ContentTools' AuthAdapter over Netlify Identity.
export class IdentityAdapter {
  gate = {
    label: 'Sign in',
    note: 'Sign in with your Vermont Football Officials site account.',
  };

  #netlify = null;

  // Called once by the shell before its first screen, so the gate knows
  // whether someone is already signed in.
  async resume() {
    this.#netlify = await identity();
  }

  currentToken() {
    // Possibly an hour-old token; `gatewayFetch` refreshes it per request.
    // Here it only answers "is somebody signed in?".
    return this.#netlify?.currentUser()?.token?.access_token ?? null;
  }

  async authenticate() {
    const netlify = this.#netlify ?? (this.#netlify = await identity());
    const held = netlify.currentUser();
    if (held) return { token: await held.jwt() };

    return new Promise((resolve, reject) => {
      const done = () => {
        netlify.off('login', onLogin);
        netlify.off('close', onClose);
      };
      const onLogin = async (user) => {
        done();
        netlify.close();
        resolve({ token: await user.jwt() });
      };
      const onClose = () => {
        done();
        const user = netlify.currentUser();
        if (user) user.jwt().then((token) => resolve({ token }), reject);
        else reject(new Error('Sign-in was cancelled.'));
      };
      netlify.on('login', onLogin);
      netlify.on('close', onClose);
      netlify.open('login');
    });
  }

  async logout() {
    await (this.#netlify ?? (await identity())).logout();
  }

  // What the shell's "Edit" link carries to the page it opens. On this site
  // that page is usually the same origin and the Identity session is already
  // there, but a draft opens on its pull request's deploy preview, which is
  // another origin; this gets the author an hour there.
  handoff() {
    const token = this.currentToken();
    return token ? { key: TOKEN_KEY, value: token } : null;
  }
}
