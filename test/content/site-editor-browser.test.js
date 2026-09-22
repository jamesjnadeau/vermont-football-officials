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
import { serializeGrid } from '../../static/cms/site/grids.js';
import { SIGNALS } from '../../static/cms/site/signals.js';

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

// A card note's inner markup is spliced straight into the region. Checked
// on its own it can look fine, but in the region the HTML parser carries an
// unclosed <a> or <b> on into every following block, and an unclosed comment
// swallows the rest of the region — so a no-edit save would link, bolden or
// delete paragraphs nobody touched. Even a well-formed comment is lost,
// because ContentEdit drops comments. Each of these must fall through to the
// static preview, leave the blocks after it alone, and round-trip exactly.
test('a malformed card note never leaks into the blocks after it', async () => {
  const { page } = await openPage();
  const notes = [
    '<p class="card-omit">see <a href="/x/">here</p>',
    '<p class="card-omit">see <b>bold</p>',
    '<p class="card-omit">note <!-- todo</p>',
    '<p class="card-omit">note <!-- todo --> end</p>',
  ];
  const cases = notes.map((note) => `Intro paragraph.\n\n${note}\n\nNext paragraph stays plain.\n\n## Heading\n\nLast paragraph.\n`);
  const results = await page.evaluate(async (sources) => {
    const h = await import('/__test/harness.js');
    (await import('/cms/site/document.js')).installDocument();
    return sources.map((source) => {
      const doc = h.MarkdownDocument.parse(source);
      const html = doc.toHTML();
      const saved = h.regionHTML(html);
      const after = [...document.querySelectorAll('#region > p, #region > h2')].slice(-3).map((el) => el.innerHTML.trim());
      return { html, after, updated: doc.update(saved) };
    });
  }, cases);
  for (const [i, { html, after, updated }] of results.entries()) {
    assert.match(html, /<div data-ce-tag="static" class="ct-md-static ct-site-preview" data-ct-md="\d+">/, `case ${i} should render as the static preview`);
    assert.doesNotMatch(html, /<p class="card-omit" data-ct-md/, `case ${i} should not be an editable card note`);
    assert.deepEqual(after, ['Next paragraph stays plain.', 'Heading', 'Last paragraph.'], `case ${i} should leave the following blocks alone`);
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

// The helpers below run inside the page; `setup` gives each test a patched
// document and a mounted region for one markdown file.
const SETUP = `
  const h = await import('/__test/harness.js');
  const { installDocument } = await import('/cms/site/document.js');
  const { defineComponent } = await import('/cms/site/component.js');
  installDocument();
  const SiteComponent = defineComponent(h.ContentEdit);
  const source = await h.markdown(NAME);
  const doc = h.MarkdownDocument.parse(source);
  const host = document.getElementById('region');
  host.innerHTML = doc.toHTML();
  const region = new h.ContentEdit.Region(host);
  const blocks = () => region.children;
`;

async function inPage(page, name, body) {
  return page.evaluate(new Function('NAME', `return (async () => { ${SETUP} ${body} })();`), name);
}

test('grids come into the editor as components, with their models', async () => {
  const { page, errors } = await openPage();
  const result = await inPage(page, 'official-signals.md', `
    const grids = blocks().filter((b) => b.type() === 'SiteComponent');
    return { count: grids.length, first: grids[0].model(), label: grids[0].domElement().getAttribute('data-ct-site-label'), same: doc.update(region.html()) === source };
  `);
  assert.equal(result.count, 11);
  assert.equal(result.first.kind, 'signal-grid');
  assert.equal(result.first.items[0].src, '/images/official-signals/07-dead-ball-foul.svg');
  assert.equal(result.label, 'Signal grid');
  assert.ok(result.same);
  assert.deepEqual(errors, []);
  await page.close();
});

test('changing one grid rewrites that grid and nothing else', async () => {
  const { page } = await openPage();
  const { before, after } = await inPage(page, '7-man-mechanics.md', `
    const grid = blocks().find((b) => b.type() === 'SiteComponent');
    const model = grid.model();
    grid.model({ ...model, items: [...model.items].reverse() });
    return { before: source, after: doc.update(region.html()) };
  `);
  const changed = (a, b) => a.split('\n').filter((line, i) => line !== b.split('\n')[i]);
  assert.notEqual(after, before);
  assert.equal(after.length, before.length);
  for (const line of changed(after, before)) assert.match(line, /<img |<figcaption /, line);
  await page.close();
});

test('a component survives the session feeding its HTML back in', async () => {
  const { page } = await openPage();
  const out = await inPage(page, 'official-signals.md', `
    const grid = blocks().find((b) => b.type() === 'SiteComponent');
    grid.model({ ...grid.model(), captioned: true, items: grid.model().items.map((i) => ({ ...i, caption: 'Edited' })) });
    const saved = region.html();
    host.innerHTML = saved;                              // what EditingSession._dress() does on resume
    const again = new h.ContentEdit.Region(host);
    return { again: again.html() === saved, text: doc.update(again.html()) };
  `);
  assert.ok(out.again);
  assert.match(out.text, /<figcaption class="figure-caption">Edited<\/figcaption>/);
  await page.close();
});

test('removing a grid removes it from the file; a new one is written in house style', async () => {
  const { page } = await openPage();
  const { removed, inserted } = await inPage(page, 'official-signals.md', `
    const grid = blocks().find((b) => b.type() === 'SiteComponent');
    const index = region.children.indexOf(grid);
    region.detach(grid);
    const removed = doc.update(region.html());
    region.attach(new SiteComponent('div', {}, { kind: 'figure-grid', items: [{ src: '/images/x.svg', alt: 'X', caption: 'Ex' }] }), index);
    return { removed, inserted: doc.update(region.html()) };
  `);
  const grids = (s) => (s.match(/^<div class="row/gm) ?? []).length;
  const source = readFileSync(path.join(INFO, 'official-signals.md'), 'utf8');
  assert.equal(grids(removed), grids(source) - 1);
  assert.match(inserted, /\n\n<div class="row g-3 my-4">\n  <div class="col-sm-6">\n    <figure class="figure d-block">\n      <img src="\/images\/x.svg" alt="X" class="figure-img img-fluid border rounded p-2 bg-white">\n      <figcaption class="figure-caption">Ex<\/figcaption>\n    <\/figure>\n  <\/div>\n<\/div>\n\n/);
  await page.close();
});

test('the card note is an editable paragraph that keeps its class and links', async () => {
  const { page, errors } = await openPage();
  const out = await inPage(page, 'flag-football-vs-high-school.md', `
    const note = blocks().find((b) => b.type() === 'Text' && b.hasCSSClass('card-omit'));
    const untouched = doc.update(region.html());
    note.content = note.content.concat(new h.HTMLString.String(' Added.'));
    note.taint();
    const edited = doc.update(region.html());
    note.removeCSSClass('card-omit');
    const plain = doc.update(region.html());
    return { type: note.type(), untouched, edited, plain };
  `);
  const source = readFileSync(path.join(INFO, 'flag-football-vs-high-school.md'), 'utf8');
  assert.equal(out.untouched, source);
  const note = out.edited.split('\n').find((l) => l.startsWith('<p class="card-omit">'));
  assert.ok(note.endsWith(' Added.</p>'), note);
  assert.match(note, /<a href="\/information\/flag-football-rules\/">Youth Flag Football Rules<\/a>/);
  assert.equal(out.edited.replace(note, ''), source.replace(source.split('\n').find((l) => l.startsWith('<p class="card-omit">')), ''));
  assert.doesNotMatch(out.plain, /<p class="card-omit">/);
  assert.match(out.plain, /^This card is a summary and nothing more\. The rules behind it are on \[Youth Flag Football Rules\]\(\/information\/flag-football-rules\/\)/m);
  assert.deepEqual(errors, []);
  await page.close();
});

// What edit.js does with window.contentToolsEdit, step by step (the fork's
// extend(), which isn't exported): await setup, check every allowed name is
// stowed, then widen the markdown profile and append the group.
test('siteExtension sets up everything the editor will ask for', async () => {
  const { page, errors } = await openPage();
  const out = await page.evaluate(async () => {
    const { siteExtension } = await import('/cms/site/extension.js');
    const { LIBRARY, MARKDOWN_PROFILE, allowTools, filterToolGroups } = await import('/cms/site/vendor.js');
    const { ContentTools } = LIBRARY;
    await siteExtension.setup(LIBRARY);
    await siteExtension.setup(LIBRARY);             // a second editor on the page must not break the first
    const unstowed = siteExtension.allowTools.filter((name) => {
      try { ContentTools.ToolShelf.fetch(name); return false; } catch { return true; }
    });
    const profile = allowTools(MARKDOWN_PROFILE, siteExtension.allowTools);
    const groups = filterToolGroups(profile, [...ContentTools.DEFAULT_TOOLS, siteExtension.allowTools]);
    const css = await (await fetch(siteExtension.styles)).text();
    return {
      unstowed,
      last: groups.at(-1),
      untouchedProfile: !MARKDOWN_PROFILE.tools.has('site-signals'),
      untouchedDefaults: !ContentTools.DEFAULT_TOOLS.flat().includes('site-signals'),
      styles: siteExtension.styles,
      css,
      component: typeof LIBRARY.ContentEdit.SiteComponent,
    };
  });
  assert.deepEqual(out.unstowed, []);
  assert.deepEqual(out.last, ['site-signals', 'site-figures', 'site-web-only', 'site-card-only']);
  assert.ok(out.untouchedProfile, 'the shared MARKDOWN_PROFILE is not mutated');
  assert.ok(out.untouchedDefaults, 'ContentTools.DEFAULT_TOOLS is not mutated');
  assert.match(out.styles, /\/cms\/site\/chrome\.css$/);
  assert.doesNotMatch(out.styles, /\{/);           // adoptStyles reads a string with `{` as CSS text, not a URL
  assert.match(out.css, /\.ct-tool--site-signals:before/);
  assert.equal(out.component, 'function');
  assert.deepEqual(errors, []);
  await page.close();
});

test('install refuses a library that is not the one vendor.js imports', async () => {
  const { page } = await openPage();
  const message = await page.evaluate(async () => {
    const { install } = await import('/cms/site/index.js');
    const { LIBRARY } = await import('/cms/site/vendor.js');
    try {
      install({ ...LIBRARY });
      return null;
    } catch (error) {
      return error.message;
    }
  });
  assert.match(message, /different ContentTools/);
  await page.close();
});

test('the visibility buttons switch a paragraph between web-only, card-only and plain', async () => {
  const { page } = await openPage();
  const out = await page.evaluate(async () => {
    const { LIBRARY: { ContentEdit } } = await import('/cms/site/vendor.js');
    const { toggleVisibility } = await import('/cms/site/tools.js');
    const host = document.getElementById('region');
    host.innerHTML = '<p>Hello</p>';
    const p = new ContentEdit.Region(host).children[0];
    const steps = [];
    steps.push([toggleVisibility(p, 'card-omit'), p.attr('class')]);
    steps.push([toggleVisibility(p, 'card-only'), p.attr('class')]);
    steps.push([toggleVisibility(p, 'card-only'), p.attr('class') ?? '']);
    return steps;
  });
  assert.deepEqual(out.map(([on]) => on), [true, true, false]);
  assert.match(out[0][1], /\bcard-omit\b/);
  assert.match(out[1][1], /\bcard-only\b/);
  assert.doesNotMatch(out[1][1], /card-omit/);
  assert.doesNotMatch(out[2][1], /card-/);
  await page.close();
});

// A card note is written back as raw HTML and only reopens as an editable
// paragraph if its contents are plain inline markup, so the buttons only
// offer to mark a paragraph that will survive the trip. A paragraph already
// marked can always be unmarked.
test('the visibility buttons only mark a paragraph that can stay a card note', async () => {
  const { page } = await openPage();
  const out = await page.evaluate(async () => {
    const { LIBRARY: { ContentTools, ContentEdit } } = await import('/cms/site/vendor.js');
    const { installTools } = await import('/cms/site/tools.js');
    const { TOOL_GROUP } = await import('/cms/site/names.js');
    installTools();
    const webOnly = ContentTools.ToolShelf.fetch(TOOL_GROUP[2]);
    const cardOnly = ContentTools.ToolShelf.fetch(TOOL_GROUP[3]);
    const host = document.getElementById('region');
    host.innerHTML = [
      '<p>Plain <b>bold</b> <a href="/x/">link</a><br>line</p>',
      '<p>Has <span class="x">a span</span></p>',
      '<p>Has <u>underline</u></p>',
      '<p class="card-omit">Marked <span>already</span></p>',
      '<h2>Heading</h2>',
    ].join('');
    return new ContentEdit.Region(host).children.map((el) => [webOnly.canApply(el), cardOnly.canApply(el)]);
  });
  assert.deepEqual(out, [[true, true], [false, false], [false, false], [true, true], [false, false]]);
  await page.close();
});

// A grid's model rides along in its HTML; one that doesn't describe a grid
// (hand-edited, or from an older editor) is kept as the block it was rather
// than crashing the region.
test('a grid whose model is unreadable is kept as a static block', async () => {
  const { page, errors } = await openPage();
  const out = await page.evaluate(async () => {
    const { LIBRARY: { ContentEdit } } = await import('/cms/site/vendor.js');
    const { defineComponent } = await import('/cms/site/component.js');
    defineComponent(ContentEdit);
    const host = document.getElementById('region');
    host.innerHTML = ['null', '{"kind":"carousel","items":[{"src":"/a","alt":"a"}]}', '{"kind":"figure-grid","items":[]}', 'not json']
      .map((m) => `<div data-ce-tag="site-component" data-site-model="${m.replace(/"/g, '&quot;')}"><p>kept</p></div>`).join('');
    return new ContentEdit.Region(host).children.map((el) => [el.type(), el.html()]);
  });
  assert.deepEqual(out.map(([type]) => type), ['Static', 'Static', 'Static', 'Static']);
  for (const [, html] of out) assert.match(html, /<p>kept<\/p>/);
  assert.deepEqual(errors, []);
  await page.close();
});

// The one end-to-end check: the real <content-tools-editor> element, set
// up from siteExtension the way edit.js sets it up (profile, tools and
// styles before it is connected), a real click on a paragraph and on the
// toolbox button, and the HTML the editor saves.
test('in the real editor, Web only marks the paragraph and the save carries it', async () => {
  const { page, errors } = await openPage();
  await page.evaluate(async () => {
    const { siteExtension } = await import('/cms/site/extension.js');
    const { LIBRARY, MARKDOWN_PROFILE, allowTools, ContentToolsEditor, EDITOR_TAG } = await import('/cms/site/vendor.js');
    if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, ContentToolsEditor);
    await siteExtension.setup(LIBRARY);
    document.getElementById('region').innerHTML = '<p>First paragraph.</p><p>Second paragraph.</p>';
    const editor = document.createElement(EDITOR_TAG);
    editor.setAttribute('mode', 'markdown');
    // A selector on `regions` is queried against the editor's own light DOM
    // (see the fork's ShadowRootContext, Mode A), which this harness's
    // `#region` sits outside of. `regionElements` is what edit.js's real
    // surface uses for the same reason: a DOM reference works regardless of
    // where the region lives.
    editor.regionElements = [document.getElementById('region')];
    editor.profile = allowTools(MARKDOWN_PROFILE, siteExtension.allowTools);
    editor.tools = [...LIBRARY.ContentTools.DEFAULT_TOOLS, siteExtension.allowTools];
    editor.adoptStyles(siteExtension.styles);
    editor.addEventListener('ct-saved', (ev) => { window.__saved = Object.values(ev.detail.regions)[0]; });
    document.body.append(editor);
    window.__editor = editor;
    editor.start();
  });
  await page.locator('#region p').nth(1).click();
  // The toolbox re-checks canApply() on a 100ms poll (ContentTools.ToolShelf),
  // so the button starts out `ct-tool--disabled` right after the paragraph is
  // clicked. Waiting for the class to clear is what a real author's next
  // click would find true anyway; without it Playwright's click can land
  // before the poll has caught up and do nothing.
  await page.locator('.ct-tool--site-web-only:not(.ct-tool--disabled)').click();
  await page.evaluate(() => window.__editor.stop(true));
  await page.waitForFunction(() => typeof window.__saved === 'string');
  const saved = await page.evaluate(() => window.__saved);
  assert.match(saved, /<p class="card-omit"[^>]*>\s*Second paragraph\.\s*<\/p>/);
  assert.doesNotMatch(saved, /<p class="card-omit"[^>]*>\s*First/);
  const linked = await page.evaluate(() => [...window.__editor.shadowRoot.querySelectorAll('link[data-content-tools="adopted"]')].map((l) => l.href));
  assert.deepEqual(linked.filter((href) => href.endsWith('/cms/site/chrome.css')).length, 1, 'the toolbox stylesheet was linked into the shadow root');
  assert.deepEqual(errors, []);
  await page.close();
});

// The grid tools lean on ContentTools internals no public API promises —
// DialogUI's _domView, _domControls and _addDOMEventListeners, Tool's
// _insertAt, EditorApp.get(), ModalUI — and vendor.sh follows the fork's
// master, so a re-vendor could quietly break inserting or editing a grid
// while every model-level test above stays green. This drives both dialogs
// through real clicks in the real editor and checks the markdown that comes
// out: the new grid and the edited one in house markup, and every block
// nobody touched exactly as it was.
test('in the real editor, the grid dialogs insert and edit grids and the save carries them', async () => {
  const figureGrid = serializeGrid({ kind: 'figure-grid', items: [{ src: '/images/a.png', alt: 'A', caption: 'Cap A' }] });
  const blocks = [
    'Intro paragraph.',
    '<p class="card-omit">A web-only note with <a href="/x/">a link</a>.</p>',
    figureGrid,
    '<div class="alert alert-info">Some raw HTML.</div>',
    '## Heading',
    'Last paragraph.',
  ];
  const source = blocks.join('\n\n') + '\n';
  const { page, errors } = await openPage();
  await page.evaluate(async (src) => {
    const { siteExtension } = await import('/cms/site/extension.js');
    const { LIBRARY, MARKDOWN_PROFILE, allowTools, ContentToolsEditor, EDITOR_TAG, MarkdownDocument } = await import('/cms/site/vendor.js');
    if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, ContentToolsEditor);
    await siteExtension.setup(LIBRARY);
    window.__doc = MarkdownDocument.parse(src);
    document.getElementById('region').innerHTML = window.__doc.toHTML();
    const editor = document.createElement(EDITOR_TAG);
    editor.setAttribute('mode', 'markdown');
    editor.regionElements = [document.getElementById('region')];
    editor.profile = allowTools(MARKDOWN_PROFILE, siteExtension.allowTools);
    editor.tools = [...LIBRARY.ContentTools.DEFAULT_TOOLS, siteExtension.allowTools];
    editor.adoptStyles(siteExtension.styles);
    editor.addEventListener('ct-saved', (ev) => { window.__saved = Object.values(ev.detail.regions)[0]; });
    document.body.append(editor);
    window.__editor = editor;
    editor.start();
  }, source);
  const components = page.locator('#region .ct-site-component');
  assert.equal(await components.count(), 1);

  // Insert a signal grid after the intro. With nothing ticked, Insert must
  // do nothing: no grid, and the dialog stays open for the author.
  await page.locator('#region p').first().click();
  await page.locator('.ct-tool--site-signals:not(.ct-tool--disabled)').click();
  const signals = page.locator('.ct-site-dialog');
  await signals.waitFor();
  assert.equal(await signals.locator('.ct-dialog__caption').textContent(), 'Insert signal grid');
  await signals.locator('.ct-control--insert').click();
  // A hidden dialog loses ct-widget--active at once and is only unmounted
  // after its fade, so "still open" means still active.
  assert.equal(await page.locator('.ct-site-dialog.ct-widget--active').count(), 1, 'the dialog stays open when nothing is ticked');
  assert.equal(await components.count(), 1, 'nothing is inserted when nothing is ticked');
  const boxes = signals.locator('.ct-site-signals input');
  await boxes.nth(0).check();
  await boxes.nth(2).check();
  await signals.locator('.ct-control--insert').click();
  await page.waitForFunction(() => document.querySelectorAll('#region .ct-site-component').length === 2);
  await signals.waitFor({ state: 'detached' });

  // Edit the existing figure grid: a new caption, and a second figure whose
  // alt text needs escaping in an attribute.
  await page.locator('#region .ct-site-component[data-ct-site-label="Figure grid"]').click();
  await page.locator('.ct-tool--site-figures:not(.ct-tool--disabled)').click();
  const figures = page.locator('.ct-site-dialog');
  await figures.waitFor();
  assert.equal(await figures.locator('.ct-dialog__caption').textContent(), 'Edit figure grid');
  await figures.locator('input[name=caption]').first().fill('New caption');
  await figures.locator('.ct-control', { hasText: 'Add figure' }).click();
  await figures.locator('input[name=src]').nth(1).fill('/images/b.png');
  await figures.locator('input[name=alt]').nth(1).fill('B "quoted" & <x>');
  await figures.locator('input[name=caption]').nth(1).fill('Cap B');
  await figures.locator('.ct-control--insert').click();
  await page.waitForFunction(() => document.querySelector('#region .ct-site-component[data-ct-site-label="Figure grid"]')?.textContent.includes('Cap B'));
  await figures.waitFor({ state: 'detached' });

  await page.evaluate(() => window.__editor.stop(true));
  await page.waitForFunction(() => typeof window.__saved === 'string');
  const markdown = await page.evaluate(() => window.__doc.update(window.__saved));

  const pick = ({ src, alt, caption }) => ({ src, alt, caption });
  const signalGrid = serializeGrid({ kind: 'signal-grid', captioned: false, items: [pick(SIGNALS[0]), pick(SIGNALS[2])] });
  const editedFigures = serializeGrid({ kind: 'figure-grid', items: [
    { src: '/images/a.png', alt: 'A', caption: 'New caption' },
    { src: '/images/b.png', alt: 'B "quoted" & <x>', caption: 'Cap B' },
  ] });
  assert.match(editedFigures, /alt="B &quot;quoted&quot; &amp; <x>"/);
  const expected = [blocks[0], signalGrid, blocks[1], editedFigures, ...blocks.slice(3)].join('\n\n') + '\n';
  assert.equal(markdown, expected);
  assert.deepEqual(errors, []);
  await page.close();
});
