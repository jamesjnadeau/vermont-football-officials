// The site's editor additions in a real browser: the ContentEdit element
// model, the editor's own HTML round trip and the live previews only exist
// in a page. The page is a blank harness over static/ — no site build, no
// GitHub — so these check the editing code, not the site.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { chromiumExecutable } from '../../lib/cards/render.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const STATIC = path.join(ROOT, 'static');
const INFO = path.join(ROOT, 'content/information');
const PAGES = readdirSync(INFO).filter((f) => f.endsWith('.md'));

const HARNESS_PAGE = '<!doctype html><html lang="en"><meta charset="utf-8"><title>harness</title><body><div id="region" data-editable></div></body></html>';
const MIME_TYPES = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.png': 'image/png' };

function respond(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(req.url.split('?')[0]);
      if (pathname === '/__harness.html') return respond(res, 200, 'text/html; charset=utf-8', HARNESS_PAGE);
      if (pathname === '/__test/harness.js') return respond(res, 200, MIME_TYPES['.js'], readFileSync(path.join(ROOT, 'test/content/site-editor-harness.js')));
      if (pathname.startsWith('/__md/')) {
        const name = path.basename(pathname);
        return PAGES.includes(name) ? respond(res, 200, 'text/plain; charset=utf-8', readFileSync(path.join(INFO, name))) : respond(res, 404, 'text/plain', 'not found');
      }
      const file = path.join(STATIC, pathname);
      if (!file.startsWith(STATIC) || !existsSync(file) || statSync(file).isDirectory()) return respond(res, 404, 'text/plain', 'not found');
      respond(res, 200, MIME_TYPES[path.extname(file)] ?? 'application/octet-stream', readFileSync(file));
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
  browser = await chromium.launch({ executablePath: chromiumExecutable() });
});

after(async () => {
  await browser?.close();
  server?.close();
});

async function openPage() {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/__harness.html`);
  return { page, errors };
}

// Everything the patched editor does to a file nobody edited must be
// nothing at all. The baseline is the vendored editor's own round trip,
// taken in a page where the site code was never installed.
test('opening and saving any page changes nothing the unpatched editor would not', async () => {
  const { page: plain } = await openPage();
  const baseline = await plain.evaluate(async (pages) => {
    const h = await import('/__test/harness.js');
    const out = {};
    for (const name of pages) out[name] = await h.roundTrip(name);
    return out;
  }, PAGES);
  await plain.close();

  const { page, errors } = await openPage();
  const patched = await page.evaluate(async (pages) => {
    const h = await import('/__test/harness.js');
    (await import('/cms/site/document.js')).installDocument();
    const out = {};
    for (const name of pages) out[name] = await h.roundTrip(name);
    return out;
  }, PAGES);
  for (const name of PAGES) assert.equal(patched[name], baseline[name], name);
  for (const name of ['official-signals.md', 'flag-football-vs-high-school.md', '7-man-mechanics.md', 'all-signals-listed-and-diagrammed.md']) {
    assert.equal(patched[name], readFileSync(path.join(INFO, name), 'utf8'), `${name} is not byte-identical after a save`);
  }
  assert.deepEqual(errors, []);
  await page.close();
});

test('grids, card notes and other HTML render as themselves, not as source', async () => {
  const { page } = await openPage();
  const html = await page.evaluate(async () => {
    const h = await import('/__test/harness.js');
    (await import('/cms/site/document.js')).installDocument();
    const doc = h.MarkdownDocument.parse(await h.markdown('flag-football-vs-high-school.md') + '\n' + await h.markdown('official-signals.md'));
    return doc.toHTML();
  });
  assert.match(html, /<p class="card-omit" data-ct-md="\d+">This card is a summary/);
  assert.match(html, /<div data-ce-tag="site-component" data-site-model="[^"]*" data-ct-md="\d+"><div class="row row-cols-2/);
  assert.doesNotMatch(html, /<pre>&lt;div class="row/);
  assert.doesNotMatch(html, /<pre>&lt;p class="card-omit"/);
  await page.close();
});

// Two more bypasses beyond plain event-handler attributes and `javascript:`
// literals: a card note whose inner markup carries a hostile attribute that
// parseCardNote's regex misses (a `/`-separated attribute, an entity-encoded
// scheme), and an SVG SMIL element (`<set>`) that rewrites a safe attribute
// to an unsafe one after the element is already in the page. Both must be
// caught before anything reaches the live region, since a synthetic event
// still runs an attribute-based handler even though it can't trigger real
// navigation.
test('a live preview never runs what the file contains', async () => {
  const { page, errors } = await openPage();
  const html = await page.evaluate(async () => {
    const h = await import('/__test/harness.js');
    (await import('/cms/site/document.js')).installDocument();
    const hostile = [
      '<div class="alert"><img src="x" onerror="window.__pwned=1"><script>window.__pwned=2</script></div>',
      '',
      '<div><a href="javascript:window.__pwned=3">x</a><iframe srcdoc="<script>parent.__pwned=4</script>"></iframe><svg><script>window.__pwned=5</script></svg></div>',
      '',
      '<figure onmouseover="window.__pwned=6" data-ce-tag="text"><img src="data:text/html,x" style="color:red"></figure>',
      '',
      '<p class="card-omit"><b/onmouseover=window.__pwned=7>x</b> <a href="&#106;avascript:window.__pwned=8">y</a></p>',
      '',
      '<div><svg><a href="#"><set attributeName="href" to="javascript:window.__pwned=9" begin="0s"/>z</a></svg></div>',
      '',
      '<p class="card-omit"><a href="&#1;&#106;avascript:window.__pwned=10">c0</a></p>',
      '',
      '<p class="card-omit"><a href="&#27;javascript:window.__pwned=11">esc</a></p>',
      '',
      '<p class="card-omit"><a href="java&#9;script:window.__pwned=12">tab</a></p>',
      '',
    ].join('\n');
    const out = h.regionHTML(h.MarkdownDocument.parse(hostile).toHTML());
    await new Promise((r) => setTimeout(r, 200));
    for (const el of document.querySelectorAll('#region *')) el.dispatchEvent(new MouseEvent('mouseover'));
    for (const el of document.querySelectorAll('#region *')) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 100));
    return out;
  });
  assert.equal(await page.evaluate(() => window.__pwned), undefined);
  assert.doesNotMatch(html, /onerror|onmouseover|<script|javascript:|srcdoc|data:text|attributename/i);
  assert.match(html, /class="ct-md-static ct-site-preview"/);
  assert.deepEqual(errors, []);
  await page.close();
});

// A leading or embedded C0 control character (a raw control byte, or the
// same thing spelled as a numeric character reference — `&#1;`, `&#27;`,
// `&#9;`) stops a plain `^scheme:` regex from ever matching a scheme, so a
// naive check reads the href as scheme-less and therefore "relative, safe".
// The browser disagrees: its URL parser strips a leading C0 control (and any
// tab or newline anywhere) before it looks at the scheme, so the same href
// resolves to a real `javascript:` URL when clicked. Each case below must be
// rejected outright — falling through to the sanitized static preview — and
// must still round-trip the source file byte for byte, rather than being
// "fixed" implicitly by ContentEdit rewriting the control character during
// editing (which would silently change the saved bytes of an untouched note).
test('a card note href with a hidden control character is never editable', async () => {
  const { page } = await openPage();
  const cases = [
    '<p class="card-omit"><a href="&#1;&#106;avascript:window.__pwned=13">c0</a></p>',
    '<p class="card-omit"><a href="&#27;javascript:window.__pwned=14">esc</a></p>',
    '<p class="card-omit"><a href="java&#9;script:window.__pwned=15">tab</a></p>',
  ];
  const results = await page.evaluate(async (sources) => {
    const h = await import('/__test/harness.js');
    (await import('/cms/site/document.js')).installDocument();
    return sources.map((source) => {
      const doc = h.MarkdownDocument.parse(source);
      const html = doc.toHTML();
      const updated = doc.update(h.regionHTML(html));
      return { html, updated };
    });
  }, cases);
  for (const [i, { html, updated }] of results.entries()) {
    assert.match(html, /^<div data-ce-tag="static" class="ct-md-static ct-site-preview"/, `case ${i} should render as the static preview, not an editable card note`);
    assert.doesNotMatch(html, /href/, `case ${i}'s hostile href should be stripped from the static preview`);
    assert.equal(updated, cases[i], `case ${i} should round-trip byte for byte`);
  }
  await page.close();
});

// The one real card note in the site's content, with ordinary relative
// hrefs, must still come through as an editable paragraph — the new
// protocol-based check must not reject what it used to accept.
test('a real card note with relative hrefs is still editable', async () => {
  const { page } = await openPage();
  const html = await page.evaluate(async () => {
    const h = await import('/__test/harness.js');
    (await import('/cms/site/document.js')).installDocument();
    const doc = h.MarkdownDocument.parse(await h.markdown('flag-football-vs-high-school.md'));
    return doc.toHTML();
  });
  assert.match(html, /<p class="card-omit" data-ct-md="\d+">This card is a summary.*<a href="\/information\/flag-football-rules\/">/s);
  await page.close();
});
