# Eleventy Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the abandoned Pelican site for Vermont Football Officials to Eleventy 3 using the architecture of jamesjnadeau.com (Pug + Sass/Bootstrap), deployed on GitHub Pages, with Pages CMS so non-technical editors can update content.

**Architecture:** In-place rewrite of this repo. Eleventy 3 (ESM config) with the Pug template plugin, `eleventy-sass` compiling a Bootstrap 5 Sass entry point, PurgeCSS in production, and `HtmlBasePlugin` so the site works under the GitHub Pages project path `/vermont-football-officials/`. Content lives in `content/` (markdown articles + Pug index pages), static assets in `static/` (passthrough-copied to site root). A GitHub Actions workflow builds and deploys to GitHub Pages. A `.pages.yml` config lets editors manage `content/information/` via app.pagescms.org (login with GitHub → simple form + rich-text editor → Save commits to master → auto-deploy).

**Tech Stack:** Node ≥24, Eleventy `^3.0.0`, `@11ty/eleventy-plugin-pug` `^1.0.0`, `eleventy-sass`, `sass`, Bootstrap `^5.3.3`, `eleventy-plugin-purgecss`, tests via `node --test` + `gray-matter` + `html-validate` + `linkinator`, GitHub Actions (`actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`), Pages CMS (hosted, config-only).

## Global Constraints

- Node engine: `>=24` (local machine runs v24.18.0; CI uses `node-version: 24`).
- Branch is `master` — CI triggers, Pages CMS, and commit instructions all use `master`.
- ESM everywhere: `"type": "module"` in package.json; `.eleventy.js` uses `import`/`export default`.
- Input dir `content/`, output dir `_site/`, static passthrough `static/` → site root.
- All internal URLs in templates are root-relative (`/styles/main.css`); never hardcode the `/vermont-football-officials/` prefix — `HtmlBasePlugin` + `--pathprefix` adds it at build time in CI only.
- Front-end JS is self-hosted from `node_modules` passthrough — no CDN `<script src="https://...">` (a test enforces this).
- Old code (Pelican, Netlify functions, CockroachDB, Decap admin) is deleted, not carried over; it survives in git history.
- Site name: "Vermont Football Officials". Look: green Vermont SVG in a dark navbar + referee-stripe body background from the old theme.
- Contact page is a `mailto:` link to james.nadeau@gmail.com (Netlify Forms doesn't work on GitHub Pages).
- Plan follows jamesjnadeau.com's patterns but deliberately omits: barba.js transitions, headroom.js, RSS feed, eleventy-navigation plugin (nav links are hardcoded in the layout, same as the reference site does anyway).

## Reference repo

A clone of jamesjnadeau.com (the pattern source) is at
`/tmp/claude-1000/-home-jamesn-Code-vermont-football-officials/424726c0-78fd-4b00-9fc1-ff2369304d41/scratchpad/jamesjnadeau.com`.
If it's gone, re-clone: `git clone --depth 1 https://github.com/jamesjnadeau/jamesjnadeau.com.git`.
You should not need it — every file this plan needs is written out in full below — but it's useful for comparing behavior.

## File structure after migration

```
.eleventy.js                      Eleventy config (ESM)
.htmlvalidate.json                html-validate config
.pages.yml                        Pages CMS config (editors' UI schema)
.github/workflows/deploy.yml      test + build + deploy to GitHub Pages
package.json                      scripts + deps
content/
  index.pug                       home page (lists information articles)
  _includes/layouts/main.pug      site chrome: navbar, container, scripts
  _includes/layouts/article.pug   article wrapper: h1 title + date (chains to main.pug)
  _includes/layouts/css.liquid    bare `{{ content }}` so compiled CSS isn't wrapped in HTML layout
  styles/main.scss                Bootstrap + referee stripes
  styles/styles.11tydata.json     points styles at css.liquid layout
  information/
    index.pug                     listing page
    information.11tydata.json     tags all articles "information"
    foul-weather-procedures.md
    information-for-new-folks.md
    recommend-reading.md
    7-man-mechanics.md
  contact/index.pug               mailto contact page
static/
  images/vermont.svg              (moved from theme/static/images/)
  uploads/
    7-man-mechanics-2022.pdf      (renamed, no spaces)
    first-year-officials-quiz-1.docx
    first-year-officials-quiz-2.docx
test/content/frontmatter.test.js  source-level invariants (no build needed)
test/content/output.test.js       built-site invariants (needs _site/)
README.md                         editor guide + developer guide
docs/superpowers/plans/           this plan
```

Deleted: `pelicanconf.py`, `publishconf.py`, `Makefile`, `tasks.py`, `requirements.txt`, `runtime.txt`, `netlify.toml`, `theme/`, `functions/`, `content/admin/`, `content/pages/`, `content/uploads/` (moved), old `package.json` deps (knex/pg/serverless-postgres), `package-lock.json` (regenerated).

---

### Task 1: Remove legacy code, relocate assets

Clear out Pelican, Netlify, and the CockroachDB experiment. Move the two assets the new site keeps (Vermont SVG, uploaded documents) into their new `static/` homes, renaming uploads to URL-safe names.

**Files:**
- Move: `theme/static/images/vermont.svg` → `static/images/vermont.svg`
- Move+rename: `content/uploads/7-MAN MECHANICS 2022.pdf` → `static/uploads/7-man-mechanics-2022.pdf`
- Move+rename: `content/uploads/1ST YEAR OFFICIALS - Quiz 1.docx` → `static/uploads/first-year-officials-quiz-1.docx`
- Move+rename: `content/uploads/1ST YEAR OFFICIALS - Quiz 2.docx` → `static/uploads/first-year-officials-quiz-2.docx`
- Delete: `pelicanconf.py`, `publishconf.py`, `Makefile`, `tasks.py`, `requirements.txt`, `runtime.txt`, `netlify.toml`, `theme/`, `functions/`, `content/admin/`, `content/pages/`, `content/uploads/first.txt`, `package-lock.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `static/images/vermont.svg` and the three renamed files under `static/uploads/` at exactly the paths above — Tasks 2 and 3 reference them verbatim. `content/information/` still holds the four original article files (one has no extension), untouched until Task 3.

- [ ] **Step 1: Move kept assets**

```bash
mkdir -p static/images static/uploads
git mv theme/static/images/vermont.svg static/images/vermont.svg
git mv "content/uploads/7-MAN MECHANICS 2022.pdf" static/uploads/7-man-mechanics-2022.pdf
git mv "content/uploads/1ST YEAR OFFICIALS - Quiz 1.docx" static/uploads/first-year-officials-quiz-1.docx
git mv "content/uploads/1ST YEAR OFFICIALS - Quiz 2.docx" static/uploads/first-year-officials-quiz-2.docx
```

- [ ] **Step 2: Delete legacy files**

```bash
git rm -r --quiet pelicanconf.py publishconf.py Makefile tasks.py requirements.txt runtime.txt \
  netlify.toml theme functions content/admin content/pages content/uploads package-lock.json
```

(`content/uploads` at this point only contains `first.txt`, which nothing links to.)

- [ ] **Step 3: Replace .gitignore contents**

Overwrite `.gitignore` with:

```
_site
node_modules
.env
```

- [ ] **Step 4: Verify what remains**

Run: `git status --short && find . -type f -not -path './.git/*' -not -path './node_modules/*' | sort`

Expected remaining tracked files (plus this plan under `docs/`): `.gitignore`, `README.md`, `package.json`,
`content/information/7-man-mechanics`, `content/information/foul-weather-procedures.md`,
`content/information/information-for-new-folks.md`, `content/information/recommend-reading.md`,
`static/images/vermont.svg`, `static/uploads/7-man-mechanics-2022.pdf`,
`static/uploads/first-year-officials-quiz-1.docx`, `static/uploads/first-year-officials-quiz-2.docx`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Pelican/Netlify/CockroachDB legacy, relocate kept assets"
```

---

### Task 2: Eleventy scaffold — config, layout, styles, home page

Stand up a building Eleventy site with the VFO look: dark navbar with the Vermont SVG, referee-stripe background, Bootstrap via Sass. Test-first: the output test is written before any of it exists.

**Files:**
- Create: `test/content/output.test.js`
- Create: `package.json` (overwrite existing)
- Create: `.eleventy.js`
- Create: `content/_includes/layouts/main.pug`
- Create: `content/_includes/layouts/css.liquid`
- Create: `content/styles/main.scss`
- Create: `content/styles/styles.11tydata.json`
- Create: `content/index.pug`

**Interfaces:**
- Consumes: `static/images/vermont.svg` (Task 1).
- Produces: layout `layouts/main.pug` — renders any page's `title` (string), `description` (string), and `content` (HTML) inside the site chrome; set as the **global default layout** in `.eleventy.js`, so markdown files need no `layout` key. Global data: `title` = "Vermont Football Officials", `description` = "Information and resources for high school football officials in the state of Vermont.". npm scripts `dev`, `build`, `clean`, `test:output`. `content/index.pug` iterates `collections.information` (empty until Task 3 tags articles — the `each` loop renders nothing, which is valid).

- [ ] **Step 1: Write the failing output test**

Create `test/content/output.test.js`:

```js
// Asserts invariants about the built site. Requires `npm run build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const SITE = '_site';

if (!existsSync(SITE)) {
  throw new Error(`${SITE}/ not found — run \`npm run build\` before these tests`);
}

const html = readdirSync(SITE, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.html'))
  .map((f) => path.join(SITE, f));

const read = (f) => readFileSync(f, 'utf8');

test('build produced a home page', () => {
  assert.ok(existsSync(path.join(SITE, 'index.html')), 'missing _site/index.html');
});

test('every page has <html lang> and a non-empty <title>', () => {
  const bad = html.flatMap((f) => {
    const s = read(f);
    const errs = [];
    if (!/<html[^>]+lang=/.test(s)) errs.push(`${f}: missing <html lang>`);
    if (!/<title>[^<]+<\/title>/.test(s)) errs.push(`${f}: missing or empty <title>`);
    return errs;
  });
  assert.deepEqual(bad, []);
});

test('every page emits a meta description', () => {
  const bad = html.filter((f) => !/<meta name="description" content="[^"]+"/.test(read(f)));
  assert.deepEqual(bad, []);
});

test('front-end JS is self-hosted, not loaded from a CDN', () => {
  const bad = html.filter((f) => /<script[^>]+src="https?:\/\//.test(read(f)));
  assert.deepEqual(bad, []);
});

test('no page renders "Invalid Date" or a bare undefined', () => {
  const bad = html.filter((f) => /Invalid Date|>undefined</.test(read(f)));
  assert.deepEqual(bad, []);
});

test('the stylesheet was compiled and is real CSS, not HTML-wrapped', () => {
  const css = path.join(SITE, 'styles', 'main.css');
  assert.ok(existsSync(css), 'missing _site/styles/main.css');
  assert.ok(!read(css).includes('<html'), 'main.css contains HTML — css.liquid layout not applied');
});

test('kept static assets are copied through', () => {
  for (const f of [
    'images/vermont.svg',
    'uploads/7-man-mechanics-2022.pdf',
    'uploads/first-year-officials-quiz-1.docx',
    'uploads/first-year-officials-quiz-2.docx',
  ]) {
    assert.ok(existsSync(path.join(SITE, f)), `missing _site/${f}`);
  }
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test "test/content/output.test.js"`
Expected: FAIL — the module throws `_site/ not found`.

- [ ] **Step 3: Replace package.json**

Overwrite `package.json` with:

```json
{
  "name": "vermont-football-officials",
  "description": "Website of the Vermont Football Officials, built with Eleventy.",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "license": "WTFPL",
  "engines": {
    "node": ">=24"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jamesjnadeau/vermont-football-officials.git"
  },
  "scripts": {
    "dev": "eleventy --config .eleventy.js --serve",
    "build": "npm run clean && NODE_ENV=production eleventy --config .eleventy.js",
    "clean": "rm -rf _site",
    "test": "npm run build && npm run test:content && npm run test:output && npm run test:html && npm run test:links",
    "test:content": "node --test \"test/content/frontmatter.test.js\"",
    "test:output": "node --test \"test/content/output.test.js\"",
    "test:html": "html-validate \"_site/**/*.html\"",
    "test:links": "linkinator _site --recurse --silent --skip \"^https?://\""
  },
  "dependencies": {
    "@11ty/eleventy": "^3.0.0",
    "@11ty/eleventy-plugin-pug": "^1.0.0",
    "bootstrap": "^5.3.3",
    "eleventy-plugin-purgecss": "^0.5.0",
    "eleventy-sass": "^3.0.0-beta.0",
    "sass": "^1.85.1"
  },
  "devDependencies": {
    "gray-matter": "^4.0.3",
    "html-validate": "^11.5.6",
    "linkinator": "^8.0.2"
  }
}
```

Note: `npm run test:content` will fail until Task 3 creates `test/content/frontmatter.test.js`, and `test:html`/`test:links` need Task 4's config — this task only runs `build` and `test:output` directly.

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: exits 0, creates `package-lock.json` and `node_modules/`.

- [ ] **Step 5: Create .eleventy.js**

```js
import { HtmlBasePlugin } from "@11ty/eleventy";
import pugPlugin from "@11ty/eleventy-plugin-pug";
import purgeCssPlugin from "eleventy-plugin-purgecss";
import eleventySass from "eleventy-sass";

const default_title = "Vermont Football Officials";
const default_description = "Information and resources for high school football officials in the state of Vermont.";

export default async function (eleventyConfig) {
  eleventyConfig.setInputDirectory("content");
  eleventyConfig.setOutputDirectory("_site");

  eleventyConfig.addPlugin(pugPlugin);

  // Rewrites root-relative URLs in the output HTML when --pathprefix is set.
  // CI passes --pathprefix=/vermont-football-officials/ for GitHub Pages;
  // local builds use the default "/" and are unaffected.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Global default layout + metadata; pages override via front matter.
  eleventyConfig.addGlobalData("layout", "layouts/main.pug");
  eleventyConfig.addGlobalData("title", default_title);
  eleventyConfig.addGlobalData("description", default_description);

  // Copy static/ to the site root; self-host Bootstrap's JS so the built
  // site is self-contained and reproducible.
  eleventyConfig.addPassthroughCopy({ static: "/" });
  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js": "js/bootstrap.bundle.min.js",
  });

  // Sass -> CSS (see https://www.11ty.dev/docs/languages/custom/)
  eleventyConfig.addTemplateFormats("scss");
  eleventyConfig.addPlugin(eleventySass, {
    sass: {
      loadPaths: ["./node_modules"],
      quietDeps: true,
      style: "compressed",
      sourceMap: true,
    },
  });

  // Strip unused Bootstrap CSS from production builds.
  if (process.env.NODE_ENV === "production") {
    eleventyConfig.addPlugin(purgeCssPlugin, {
      config: {
        content: ["./_site/**/*.html", "./_site/**/*.js"],
        css: ["./_site/**/*.css"],
      },
      quiet: false,
    });
  }

  // Code blocks scroll horizontally, which makes them a scrollable region.
  // Those must be keyboard-focusable (axe: scrollable-region-focusable).
  eleventyConfig.addTransform("focusableCodeBlocks", function (content) {
    if (!this.page.outputPath?.endsWith(".html")) return content;
    return content.replace(/<pre(?![^>]*\btabindex=)/g, '<pre tabindex="0"');
  });
}
```

- [ ] **Step 6: Create the main layout**

Create `content/_includes/layouts/main.pug`:

```pug
doctype html
html(lang='en')
  head
    meta(charset='utf-8')
    meta(name='viewport' content='width=device-width,initial-scale=1.0')
    meta(name='theme-color' content='#212529')
    title=title
    if description
      meta(name='description', content=description)
    link(rel='icon' type='image/svg+xml' href='/images/vermont.svg')
    link(rel='stylesheet', href='/styles/main.css')

  body
    nav#header.navbar.navbar-expand-md.navbar-dark.bg-dark
      .container.p-2
        a.navbar-brand.d-flex.align-items-center(href='/')
          img.me-2(src='/images/vermont.svg' alt='' height='32')
          | Vermont Football Officials
        button.navbar-toggler(type='button' data-bs-toggle='collapse' data-bs-target='#mainNav' aria-controls='mainNav' aria-label='Toggle main navigation')
          span.navbar-toggler-icon
        #mainNav.navbar-collapse.collapse
          .navbar-nav.ms-auto
            a.nav-item.nav-link.text-white.p-2(href='/information/') Information
            a.nav-item.nav-link.text-white.p-2(href='/contact/') Contact Us
    main#content.container.my-4.p-4.bg-white.rounded.shadow-sm
      | !{content}

    script(src='/js/bootstrap.bundle.min.js')
```

- [ ] **Step 7: Create the CSS passthrough layout and styles**

Create `content/_includes/layouts/css.liquid` (this file is exactly one line — it stops the global pug layout from wrapping compiled CSS in HTML):

```liquid
{{ content }}
```

Create `content/styles/styles.11tydata.json`:

```json
{
    "layout": "layouts/css.liquid"
}
```

Create `content/styles/main.scss`:

```scss
// Bootstrap's default link blue is 4.15:1 on white, just short of the 4.5:1
// WCAG AA threshold. Darken it so body links pass.
@use "bootstrap/scss/bootstrap" with (
  $link-color: #0a58ca,
);

// Referee-stripe background, carried over from the old Pelican theme.
body {
  background: repeating-linear-gradient(
    to right,
    #fff 0px,
    #fff 40px,
    #ddd 40px,
    #ddd 80px
  );
}

#content {
  background-color: #fff;
}
```

- [ ] **Step 8: Create the home page**

Create `content/index.pug`:

```pug
---
title: Vermont Football Officials
---

h1.text-center Vermont Football Officials
p.lead.text-center Resources and information for high school football officials in Vermont.

h2.mt-4 Information
div.list-group
  - var byDate = function(a, b) { return new Date(b.date) - new Date(a.date); }
  each item in (collections.information || []).slice().sort(byDate)
    a.list-group-item.list-group-item-action(href=item.url)
      .row
        .col
          | #{item.data.title}
        .col-auto.text-secondary
          time(datetime=new Date(item.date).toISOString())
            | #{new Date(item.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}

p.mt-4
  | Interested in becoming an official? 
  a(href='/contact/') Get in touch.
```

- [ ] **Step 9: Build**

Run: `npm run build`
Expected: exits 0. `_site/index.html`, `_site/styles/main.css`, `_site/js/bootstrap.bundle.min.js`, `_site/images/vermont.svg`, `_site/uploads/*` all exist. (The four legacy markdown articles under `content/information/` also render into `_site/information/…/` using the default layout — that's expected; Task 3 cleans them up.)

- [ ] **Step 10: Run the output test — passes now**

Run: `node --test "test/content/output.test.js"`
Expected: PASS (all 7 tests). If "meta description" fails on the legacy article pages, check that `addGlobalData("description", ...)` is present in `.eleventy.js`.

- [ ] **Step 11: Eyeball it**

Run: `npm run dev` and open http://localhost:8080/ (Eleventy prints the port; default 8080).
Expected: dark navbar with green Vermont silhouette + "Vermont Football Officials", referee-stripe background, white content card, "Information" list showing nothing yet (collection is empty until Task 3), working nav links to /information/ (404 for now) and /contact/ (404 for now). Stop the server.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: Eleventy 3 scaffold with Pug layout, Bootstrap Sass, VFO theme"
```

---

### Task 3: Content migration — articles, listing page, contact page

Move the four articles to clean markdown with an article layout (title + date header), create the Information listing page and the Contact page. Test-first: source-level invariants are written before the cleanup, and fail against the current files.

**Files:**
- Create: `test/content/frontmatter.test.js`
- Create: `content/_includes/layouts/article.pug`
- Create: `content/information/information.11tydata.json`
- Create: `content/information/index.pug`
- Create: `content/contact/index.pug`
- Modify: `content/information/recommend-reading.md`, `content/information/information-for-new-folks.md`
- Rename: `content/information/7-man-mechanics` → `content/information/7-man-mechanics.md` (and fix its link)

**Interfaces:**
- Consumes: layout `layouts/main.pug` and global default layout (Task 2); `static/uploads/*` filenames (Task 1).
- Produces: `collections.information` — the 4 articles, each with `data.title` (string), `date` (Date), `url` like `/information/foul-weather-procedures/`; consumed by `content/index.pug` (Task 2) and `content/information/index.pug` (this task). Layout `layouts/article.pug` (chains to `layouts/main.pug` via its own front matter). Page URLs `/information/` and `/contact/` that the Task 2 navbar already links to.

- [ ] **Step 1: Write the failing source test**

Create `test/content/frontmatter.test.js`:

```js
// Asserts invariants about the source front matter that a generic HTML
// validator can't know about. Runs against `content/`, so it needs no build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const DIR = fileURLToPath(new URL('../../content/information/', import.meta.url));
const files = readdirSync(DIR);

test('every file in information/ has a known extension', () => {
  // Catches extension-less files (Decap once wrote "7-man-mechanics" with no .md),
  // which Eleventy silently skips.
  const bad = files.filter((f) => !/\.(md|pug|json)$/.test(f));
  assert.deepEqual(bad, []);
});

const articles = files
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({
    name: f,
    raw: readFileSync(path.join(DIR, f), 'utf8'),
    ...matter(readFileSync(path.join(DIR, f), 'utf8')),
  }));

test('all four expected articles exist as markdown', () => {
  const want = [
    '7-man-mechanics.md',
    'foul-weather-procedures.md',
    'information-for-new-folks.md',
    'recommend-reading.md',
  ];
  assert.deepEqual(articles.map((a) => a.name).sort(), want);
});

test('every article has a title', () => {
  assert.deepEqual(articles.filter((a) => !a.data.title).map((a) => a.name), []);
});

// Eleventy parses `date:` with Luxon, which requires ISO 8601.
test('every article has an ISO 8601 date', () => {
  const bad = articles
    .filter((a) => {
      const d = a.data.date;
      if (d === undefined) return true;
      const s = d instanceof Date ? d.toISOString() : String(d);
      return !/^\d{4}-\d{2}-\d{2}/.test(s) || Number.isNaN(new Date(s).getTime());
    })
    .map((a) => `${a.name}: ${JSON.stringify(a.data.date)}`);
  assert.deepEqual(bad, []);
});

// Decap's editor left zero-width BOM characters and trailing-backslash
// hard breaks in bodies; both render as garbage or surprise <br>s.
test('no editor artifacts (zero-width chars, trailing backslashes) in bodies', () => {
  const bad = articles
    .filter((a) => /[\uFEFF\u200B]/.test(a.content) || /\\\s*$/m.test(a.content))
    .map((a) => a.name);
  assert.deepEqual(bad, []);
});

// Uploads were renamed to URL-safe names in static/uploads/; any link still
// pointing at the old space-laden filenames is broken.
test('article links point at the renamed uploads', () => {
  const bad = articles
    .filter((a) => /%20|1ST YEAR|7-MAN MECHANICS/.test(a.content))
    .map((a) => a.name);
  assert.deepEqual(bad, []);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test "test/content/frontmatter.test.js"`
Expected: FAIL — at minimum: "known extension" (the bare `7-man-mechanics` file), "all four expected articles", "no editor artifacts" (BOM in recommend-reading.md, `\` breaks in information-for-new-folks.md), and "renamed uploads" (old quiz/PDF links).

- [ ] **Step 3: Create the article layout**

Create `content/_includes/layouts/article.pug` (front matter chains it into the main layout):

```pug
---
layout: layouts/main.pug
---

article
  h1= title
  if date
    p.text-secondary
      time(datetime=new Date(date).toISOString())
        | #{new Date(date).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}
  | !{content}
```

- [ ] **Step 4: Create the information directory data file**

Create `content/information/information.11tydata.json` (tags every file in the directory into `collections.information` and gives articles the title/date header):

```json
{
    "tags": "information",
    "layout": "layouts/article.pug"
}
```

- [ ] **Step 5: Create the Information listing page**

Create `content/information/index.pug`. Its front matter opts back out of the directory defaults (a listing page is not an article and must not list itself):

```pug
---
title: Information | Vermont Football Officials
description: Articles and resources for Vermont high school football officials.
layout: layouts/main.pug
eleventyExcludeFromCollections: true
---

h1 Information
p.lead Articles and resources for Vermont high school football officials.
div.list-group
  - var byDate = function(a, b) { return new Date(b.date) - new Date(a.date); }
  each item in (collections.information || []).slice().sort(byDate)
    a.list-group-item.list-group-item-action(href=item.url)
      .row
        .col
          | #{item.data.title}
        .col-auto.text-secondary
          time(datetime=new Date(item.date).toISOString())
            | #{new Date(item.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
```

- [ ] **Step 6: Rename and fix 7-man-mechanics**

```bash
git mv content/information/7-man-mechanics content/information/7-man-mechanics.md
```

Then overwrite `content/information/7-man-mechanics.md` with:

```markdown
---
title: 7 Man Mechanics
date: 2023-11-01T12:35:02.577Z
---

[View the 2022 7-man mechanics manual (PDF)](/uploads/7-man-mechanics-2022.pdf)
```

- [ ] **Step 7: Clean recommend-reading.md**

Overwrite `content/information/recommend-reading.md` with (the old file had a zero-width BOM inside "T﻿he" and a stray `\` line):

```markdown
---
title: Recommend Reading
date: 2023-06-30T12:04:26.155Z
---

The referee training manuals available on this site are great:

<https://store.referee.com/>
```

- [ ] **Step 8: Clean information-for-new-folks.md**

Edit `content/information/information-for-new-folks.md`, keeping all prose exactly as written except these three mechanical fixes:

1. Quiz links — replace:
   - `[Quiz 1](/uploads/1ST YEAR OFFICIALS - Quiz 1.docx)` → `[Quiz 1](/uploads/first-year-officials-quiz-1.docx)`
   - `[Quiz 2](/uploads/1ST YEAR OFFICIALS - Quiz 2.docx)` → `[Quiz 2](/uploads/first-year-officials-quiz-2.docx)`
2. Remove every trailing ` \` at end-of-line (Decap hard-break artifacts — there is one after "…through the first two weeks of youth games." and any others a search for `\` at line end turns up).
3. Leave the `?You will be provided a physical rule book during training?` line as-is — it is an intentional open question for the human editors, not an artifact.

(`foul-weather-procedures.md` needs no changes.)

- [ ] **Step 9: Create the Contact page**

Create `content/contact/index.pug` (Netlify Forms doesn't exist on GitHub Pages, so the old form becomes a mailto link):

```pug
---
title: Contact Us | Vermont Football Officials
description: Get in touch with the Vermont Football Officials — questions, or information on becoming an official.
layout: layouts/main.pug
---

h1 Contact Us
p.lead
  | Have a question, or interested in becoming a football official in Vermont?
p
  | Email us at 
  a(href='mailto:james.nadeau@gmail.com') james.nadeau@gmail.com
  |  and we'll get back to you.
```

- [ ] **Step 10: Run the source test — passes now**

Run: `node --test "test/content/frontmatter.test.js"`
Expected: PASS (all 6 tests).

- [ ] **Step 11: Build and run the output test**

Run: `npm run build && node --test "test/content/output.test.js"`
Expected: build exits 0 and produces `_site/information/index.html`, `_site/information/7-man-mechanics/index.html`, `_site/information/foul-weather-procedures/index.html`, `_site/information/information-for-new-folks/index.html`, `_site/information/recommend-reading/index.html`, `_site/contact/index.html`. Output test: PASS.

Spot-check article chrome: `grep -c 'navbar' _site/information/foul-weather-procedures/index.html` should be ≥ 1 (proves `article.pug` chained into `main.pug`) and `grep '<h1>' _site/information/foul-weather-procedures/index.html` shows `Foul Weather Procedures`.

- [ ] **Step 12: Eyeball it**

Run: `npm run dev`. Home page now lists 4 articles newest-first; `/information/` shows the same list; each article shows title + date + body; `/contact/` shows the mailto link; the PDF/quiz links download. Stop the server.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: migrate information articles, listing page, and contact page"
```

---

### Task 4: Full automated test suite (html-validate + linkinator + npm test)

Wire the remaining checks so `npm test` is the single command CI and humans run.

**Files:**
- Create: `.htmlvalidate.json`
- Modify: none (the `test`, `test:html`, `test:links` scripts already exist from Task 2)

**Interfaces:**
- Consumes: `_site/` build output (Tasks 2–3); npm scripts from Task 2's package.json.
- Produces: a green `npm test` — the command Task 5's CI job runs verbatim.

- [ ] **Step 1: Run the not-yet-configured html-validate to see it fail (or misfire)**

Run: `npm run build && npm run test:html`
Expected: FAIL or noisy warnings — without a config, html-validate's defaults flag things like Pug's unquoted attributes. (If it happens to pass, continue anyway; the config below pins the ruleset so results are stable.)

- [ ] **Step 2: Create .htmlvalidate.json**

Same ruleset as jamesjnadeau.com:

```json
{
  "root": true,
  "extends": ["html-validate:recommended"],
  "rules": {
    "attr-quotes": "off",
    "void-style": "off",
    "no-trailing-whitespace": "off",
    "no-inline-style": "off",
    "require-sri": "off",
    "long-title": "warn",
    "no-implicit-button-type": "warn",
    "wcag/h37": "warn",

    "element-required-content": "error",
    "element-permitted-content": "error",
    "element-permitted-parent": "error",
    "element-required-attributes": "error",
    "attribute-allowed-values": "error",
    "attribute-misuse": "error",
    "no-dup-id": "error",
    "no-raw-characters": "error",
    "valid-id": "error",
    "element-name": "error",
    "empty-heading": "error",
    "wcag/h30": "error",
    "wcag/h32": "error",
    "wcag/h63": "error",
    "wcag/h71": "error"
  }
}
```

- [ ] **Step 3: Run html-validate — passes**

Run: `npm run test:html`
Expected: PASS (exit 0). If it flags real markup errors in a layout, fix the layout — do not silence the rule.

- [ ] **Step 4: Run the link checker**

Run: `npm run test:links`
Expected: PASS — linkinator crawls `_site/` and finds no broken internal links (external `https://` links are skipped by the script's `--skip` pattern; they change without our involvement and shouldn't break CI).

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS end-to-end — build, content tests, output tests, html-validate, linkinator.

- [ ] **Step 6: Commit**

```bash
git add .htmlvalidate.json
git commit -m "test: wire html-validate and linkinator into npm test"
```

---

### Task 5: GitHub Pages deployment via Actions

Build with the project-path prefix and deploy on every push to master. The site will live at `https://jamesjnadeau.github.io/vermont-football-officials/` (until/unless a custom domain is added, at which point `configure-pages` reports an empty base path and everything keeps working).

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm test` (Task 4), `npm run build` accepting extra Eleventy CLI args appended by `npm run build -- <args>` (Task 2's script chain ends with the `eleventy` command, so appended args reach Eleventy), `HtmlBasePlugin` registered in `.eleventy.js` (Task 2).
- Produces: a deployed site; the URL appears in the workflow's `deploy` job output.

- [ ] **Step 1: Verify the pathprefix mechanism locally**

Run: `npm run build -- --pathprefix=/vermont-football-officials/ && grep -o 'href="/vermont-football-officials/styles/main.css"' _site/index.html`
Expected: prints `href="/vermont-football-officials/styles/main.css"` — HtmlBasePlugin rewrote the root-relative URL. Then rebuild clean: `npm run build` (tests and local dev always use the unprefixed build).

- [ ] **Step 2: Create the workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Test and deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      # npm test builds without a path prefix, so internal links resolve
      # against the _site/ root for linkinator.
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - id: pages
        uses: actions/configure-pages@v5
      # base_path is "/vermont-football-officials" for a project page and ""
      # once a custom domain is configured; either way the trailing slash
      # completes a valid Eleventy pathprefix.
      - run: npm run build -- --pathprefix="${{ steps.pages.outputs.base_path }}/"
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: test, build, and deploy to GitHub Pages"
git push origin master
```

- [ ] **Step 4: One-time repo setting (manual, requires James)**

On github.com → `jamesjnadeau/vermont-football-officials` → Settings → Pages → **Build and deployment → Source: "GitHub Actions"**. Without this, the `deploy` job fails with "Pages not enabled". Re-run the workflow after flipping it if needed.

- [ ] **Step 5: Verify the deploy**

Watch the Actions run (github.com → repo → Actions). Expected: all three jobs green. Open `https://jamesjnadeau.github.io/vermont-football-officials/` — navbar, stripes, article list all render; click into an article and the PDF link; confirm styles load (if the page is unstyled, the pathprefix didn't apply — check Step 1's mechanism and the workflow's build line).

---

### Task 6: Pages CMS config + README rewrite

Give editors a WYSIWYG: `.pages.yml` tells app.pagescms.org how to edit `content/information/`. Rewrite the README as two guides — one for editors (no git vocabulary), one for developers.

**Files:**
- Create: `.pages.yml`
- Overwrite: `README.md`

**Interfaces:**
- Consumes: `content/information/*.md` front matter shape (`title` string, `date` datetime, markdown body) from Task 3; `static/uploads/` media location from Task 1.
- Produces: editor-facing config only; nothing downstream consumes it in code.

- [ ] **Step 1: Create .pages.yml**

```yaml
# Configuration for Pages CMS (https://pagescms.org) — the editing UI at
# https://app.pagescms.org. Editors log in with GitHub, pick this repo, and
# get a simple form + rich-text editor. Saving commits to master, which
# triggers the GitHub Pages deploy.

media:
  input: static/uploads
  output: /uploads

content:
  - name: information
    label: Information
    description: Articles shown on the Information page and the home page.
    type: collection
    path: content/information
    extension: md
    format: yaml-frontmatter
    filename: "{primary}.md"
    view:
      fields: [title, date]
      sort: [date, title]
      default:
        sort: date
        order: desc
    fields:
      - name: title
        label: Title
        type: string
        required: true
      - name: date
        label: Publish date
        type: date
        required: true
        options:
          time: false
      - name: body
        label: Body
        type: rich-text
```

- [ ] **Step 2: Sanity-check the YAML parses**

Run (uses gray-matter's YAML engine, already a devDependency):

```bash
node --input-type=module -e "
import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
matter('---\n' + readFileSync('.pages.yml', 'utf8') + '\n---');
console.log('YAML OK');
"
```

Expected: prints `YAML OK`; any YAML syntax error throws instead.

- [ ] **Step 3: Overwrite README.md**

```markdown
# Vermont Football Officials

Website collecting knowledge for high school football officials in Vermont.
Live at https://jamesjnadeau.github.io/vermont-football-officials/

## Editing the site (no coding needed)

Articles are edited through **Pages CMS** — a simple editor that works like
writing an email.

One-time setup (James can walk you through it, ~10 minutes):

1. Create a free account at https://github.com/signup using your email.
2. Tell James your username so he can give you access.
3. Accept the invitation email from GitHub.

Editing:

1. Go to https://app.pagescms.org and click **Sign in with GitHub**.
2. Choose **vermont-football-officials**.
3. Click **Information** in the left menu.
4. Click an article to edit it, or **Add an entry** to write a new one.
5. Click **Save**. That's it — the site updates itself within a few minutes.

To attach a PDF or document: use the **Media** section to upload it, then
link to it from your article with the editor's link button.

## Developing

Requires Node 24+.

    npm install
    npm run dev        # local preview at http://localhost:8080
    npm test           # build + content/output tests + html-validate + link check

Built with [Eleventy](https://www.11ty.dev/) (Pug templates, Bootstrap via
Sass), following the architecture of
[jamesjnadeau.com](https://github.com/jamesjnadeau/jamesjnadeau.com).

- Content lives in `content/` — markdown articles in `content/information/`,
  Pug pages elsewhere. Layouts are in `content/_includes/layouts/`.
- Static files (PDFs, images) live in `static/` and are copied to the site
  root, so `static/uploads/x.pdf` is served at `/uploads/x.pdf`.
- `.pages.yml` configures the Pages CMS editing UI.

## Deploying

Every push to `master` runs `.github/workflows/deploy.yml`: `npm test`, then
an Eleventy build with `--pathprefix` for the GitHub Pages project path, then
a deploy. Nothing manual to do.
```

- [ ] **Step 4: Run the full suite one last time**

Run: `npm test`
Expected: PASS — the two new files are not site content and change nothing in the build.

- [ ] **Step 5: Commit and push**

```bash
git add .pages.yml README.md
git commit -m "feat: Pages CMS editor config and README guides"
git push origin master
```

- [ ] **Step 6: One-time CMS activation (manual, requires James)**

1. Go to https://app.pagescms.org, sign in with GitHub, and open `jamesjnadeau/vermont-football-officials` — confirm the **Information** collection lists the 4 articles and an edit → Save round-trip creates a commit on master (and a deploy).
2. For each future editor: GitHub → repo → Settings → Collaborators → invite their username with **Write** access.

---

## Post-migration notes (not tasks)

- **Custom domain later:** add it in repo Settings → Pages; `configure-pages` then emits an empty `base_path` and the workflow keeps working unchanged.
- **Contact form later:** if a real form is wanted, create a free Formspree form and swap the mailto paragraph in `content/contact/index.pug` for a `form(action='https://formspree.io/f/<id>' method='POST')` — no build changes needed.
- **Old schedule/CockroachDB experiment:** recoverable from git history before the Task 1 commit if ever wanted.
