// Everything else under test/draw exercises the board as data — pure
// functions, no DOM. This file is the one witness that a real browser gives
// and a `node --test` file cannot: that the page actually boots, that a
// preset actually paints tokens, and — the two cases this file exists for —
// that a stranger's mangled link cannot wedge the page and a stranger's
// caption text cannot become an element. An assertion in Node that a string
// was escaped is not the same as a browser confirming it never became one.
//
// Requires `npm run build` first, same as test/content/output.test.js and
// test/cards/output.test.js.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { chromiumExecutable } from '../../lib/cards/render.js';
import { addToken, emptyBoard } from '../../lib/draw/state.js';
import { encode } from '../../lib/draw/codec.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SITE = path.join(ROOT, '_site');

if (!existsSync(SITE)) {
  throw new Error(`${SITE}/ not found — run \`npm run build\` before these tests`);
}

// ---------------------------------------------------------------------------
// A tiny static server over _site
//
// `file://` blocks the page's own `import` of app.js — the one thing a
// browser smoke test needs that no other test file here does. Node's own
// `http`, not a dependency: the plan rules out adding one for this.
// ---------------------------------------------------------------------------

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

function fileFor(requestUrl) {
  const pathname = decodeURIComponent(requestUrl.split('?')[0]);
  let file = path.join(SITE, pathname);
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  return file;
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // The extension has to come off the resolved file, not the request
      // path: "/draw/" itself has none, and Chromium reads a missing or
      // wrong Content-Type on an HTML response as a download to offer
      // rather than a page to render.
      const file = fileFor(req.url);
      try {
        const body = readFileSync(file);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(file)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end('not found');
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

let server;
let browser;
let base;

before(async () => {
  server = await startServer();
  base = `http://127.0.0.1:${server.address().port}`;
  // Reuses the same lookup the cards do (`CARD_CHROMIUM_PATH`, then
  // Playwright's own download, then the environment's own copy), rather than
  // `chromium.launch()` bare, so this fails with the same useful message the
  // cards' own tests would if Chromium were missing.
  browser = await chromium.launch({ executablePath: chromiumExecutable() });
});

after(async () => {
  await browser?.close();
  await new Promise((resolve) => server?.close(resolve));
});

/**
 * A fresh tab, with its own record of uncaught page errors and any dialog it
 * fires. One page per test, so a stray listener or an unresolved dialog from
 * one case can never leak into the next.
 */
async function openPage() {
  const page = await browser.newPage();
  const errors = [];
  const dialogs = [];
  page.on('pageerror', (error) => errors.push(error));
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.message());
    dialog.dismiss();
  });
  return { page, errors, dialogs };
}

test('/draw renders the field: two sidelines and hash marks are on it', async () => {
  const { page, errors } = await openPage();
  try {
    await page.goto(`${base}/draw/`);
    // waitForFunction, not waitForSelector's default 'visible' state: a
    // vertical <line> has a zero-width bounding box, which Playwright's
    // own visibility check reads as not visible even though it is drawn.
    // Deterministic either way — this waits on the shape actually landing
    // in the DOM, not on a timer.
    await page.waitForFunction(() => document.querySelectorAll('#board .sl').length === 2, null, { timeout: 5000 });
    assert.equal(await page.locator('#board .sl').count(), 2, 'expected exactly two sideline lines');
    assert.ok((await page.locator('#board .hash').count()) > 0, 'expected at least one hash mark');
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test('clicking a preset puts the expected number of tokens on the board', async () => {
  const { page, errors } = await openPage();
  try {
    await page.goto(`${base}/draw/`);
    // Kickoff: 5 officials + 21 players (presets.js), independent of this test.
    await page.click('button[data-preset="kickoff"]');
    await page.waitForFunction(() => document.querySelectorAll('.draw-token').length === 26, null, { timeout: 5000 });
    assert.equal(await page.locator('.draw-token').count(), 26);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test('dragging a token updates the share link, and reopening it reproduces the same board', async () => {
  let fragment;
  {
    const { page, errors } = await openPage();
    try {
      await page.goto(`${base}/draw/`);
      await page.click('button[data-add-official="R"]');
      await page.waitForSelector('.draw-token', { timeout: 5000 });

      const box = await page.locator('.draw-token').first().boundingBox();
      assert.ok(box, 'the added token has no bounding box to drag from');
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      // `steps` so intermediate pointermove events fire — a single jump from
      // down to up never crosses the "this was a drag" threshold app.js checks.
      await page.mouse.move(startX + 40, startY + 30, { steps: 5 });
      await page.mouse.up();

      // The write is debounced 200ms (app.js), so this is the real condition
      // to wait on rather than a sleep timed to outlast it.
      await page.waitForFunction(() => location.hash.startsWith('#d='), null, { timeout: 5000 });
      fragment = await page.evaluate(() => location.hash);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  }

  // A fresh tab and a real `goto`, not `page.reload()`. `reload()` keeps the
  // current URL — hash included — so `location.hash` would already equal
  // `fragment` the instant the reloaded page started running, before
  // `app.js` had decoded a single byte of it: a wait on that equality would
  // pass on the first, trivial check and never observe what this page's own
  // `decode()` actually produced. A brand new tab that has never held any
  // hash but this one, opened the way a recipient of the link actually
  // would, is what makes the check about what the *link* carries rather
  // than about what one tab's address bar still happened to say.
  const { page: opened, errors: openedErrors } = await openPage();
  try {
    await opened.goto(`${base}/draw/${fragment}`);
    await opened.waitForFunction(() => document.querySelectorAll('.draw-token').length === 1, null, {
      timeout: 5000,
    });

    // The URL already reads `fragment` — that's just the address just
    // navigated to, and proves nothing yet. What proves the round trip is
    // whether `app.js`'s own debounced `writeUrl()` (200ms) leaves it alone
    // or rewrites it: decoding this fragment into a board and re-encoding
    // that board (test/draw/codec.test.js asserts this is deterministic)
    // has to land back on the same string, or the token this link describes
    // is not the token it opens to. There is no positive DOM signal for
    // "nothing changed", so this races a real condition — the hash actually
    // moving — against a timeout comfortably past the debounce, and a
    // timeout here is the pass: settled, and unchanged.
    await opened
      .waitForFunction((initial) => location.hash !== initial, fragment, { timeout: 500 })
      .catch(() => {});
    assert.equal(
      await opened.evaluate(() => location.hash),
      fragment,
      'reopening the link changed the board it opened to — the round trip through codec.js is not stable',
    );
    assert.deepEqual(openedErrors, []);
  } finally {
    await opened.close();
  }
});

test('opening a garbage share link shows the default board and the notice, with no uncaught error', async () => {
  const { page, errors } = await openPage();
  try {
    await page.goto(`${base}/draw/#d=notvalidbase64`);
    await page.waitForSelector('.draw-notice .alert', { state: 'visible', timeout: 5000 });
    assert.equal(await page.locator('.draw-token').count(), 0, 'a garbage link should draw no tokens');
    assert.equal(await page.locator('.draw-arrow').count(), 0, 'a garbage link should draw no arrows');
    assert.deepEqual(errors, [], `a garbage link logged: ${errors.map(String).join('; ')}`);
  } finally {
    await page.close();
  }
});

// --- The two cases this file exists for -----------------------------------

test('a caption of literal script tags renders as words, not as an element, and fires no dialog', async () => {
  // The baseline is its own page load: proof that opening the malicious link
  // below adds no <script> the plain page did not already have, rather than
  // an assertion that the count is some specific number this file has to
  // keep in sync with the page's own markup.
  const baseline = await openPage();
  await baseline.page.goto(`${base}/draw/`);
  const scriptsBefore = await baseline.page.locator('script').count();
  await baseline.page.close();

  // Built the same way the tool's own "Text" mode would produce it — through
  // state.js's own validation and codec.js's own encoder — because this
  // string reaches the page exactly as any caption's words do. The attack is
  // in the words, not in how they got encoded.
  let board = emptyBoard('runPass');
  board = addToken(board, { type: 'text', text: '<script>alert(1)</script>', across: 0, down: 5 });
  const fragment = `#d=${encode(board)}`;

  const { page, errors, dialogs } = await openPage();
  try {
    await page.goto(`${base}/draw/${fragment}`);
    await page.waitForSelector('.draw-caption text', { timeout: 5000 });
    const shown = await page.locator('.draw-caption text').first().textContent();
    assert.equal(shown, '<script>alert(1)</script>', 'the caption was not shown verbatim as words');
    assert.equal(
      await page.locator('script').count(),
      scriptsBefore,
      'opening the link added a <script> element to the document',
    );
    assert.equal(
      await page.locator('#board script').count(),
      0,
      'a <script> element ended up inside the board itself',
    );
    assert.deepEqual(dialogs, [], `opening the link fired a dialog: ${dialogs.join('; ')}`);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("a caption's colour of url(#x) never reaches a fill attribute", async () => {
  // Not reachable through state.js's own addToken — requireColor throws on
  // exactly this shape (state.js), which is the point of that function. So
  // this is a hand-built payload, the way a crafted link would carry it,
  // rather than anything this tool's own UI could ever produce — codec.js
  // exists precisely for the input this simulates.
  const payload = { v: 1, w: 'runPass', t: [['x', 'Blitz', 0, 5, { s: 12, c: 'url(#x)' }]] };
  const fragment = `#d=${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`;

  const { page, errors } = await openPage();
  try {
    await page.goto(`${base}/draw/${fragment}`);
    // The payload as a whole is well-formed — only this one caption's colour
    // is not — so codec.js drops that item and keeps the rest of the link
    // working (see codec.js): no notice, just a board with nothing on it.
    // Waiting on the field itself, rather than on an absence, is what makes
    // this deterministic. waitForFunction, not waitForSelector's default
    // 'visible' state, for the same reason as the first test above: a
    // vertical <line> has a zero-width bounding box.
    await page.waitForFunction(() => document.querySelectorAll('#board .sl').length === 2, null, { timeout: 5000 });
    assert.equal(
      await page.locator('.draw-caption').count(),
      0,
      'the malformed caption should have been dropped, not drawn',
    );
    const fillsWithUrlReference = await page.evaluate(() =>
      [...document.querySelectorAll('[fill]')].some((el) => el.getAttribute('fill').includes('url(')),
    );
    assert.ok(!fillsWithUrlReference, 'a url(...) reference reached a fill attribute');
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});
