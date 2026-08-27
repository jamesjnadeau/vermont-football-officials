# Site Navigation & Trust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Information page is a single flat list sorted by date. At 16
articles that already buries the useful things; after plans 1–3 it will be
around 25 and unusable. This plan makes the site navigable, searchable, usable
in a parking lot with one bar of service, and honest about what it is and when
it was last checked.

**Architecture:** Four independent pieces. Grouped navigation on the Information
index driven by a new `category` front matter field. A client-side search over a
build-generated JSON index — no service, no external dependency. A service
worker that caches the reference pages for offline use. And a site-wide footer
disclaimer plus a staleness surface built on plan 1's `verified` field.

**Tech Stack:** No new runtime dependencies for navigation or the disclaimer.
Search uses a build-time JSON index plus vanilla JS, or `minisearch` if
weighting proves necessary — decided in Task 2. Offline uses a hand-written
service worker; no Workbox.

## Global Constraints

- All constraints from `2026-07-26-eleventy-migration.md` apply. In particular:
  **no CDN `<script src>`** — a test enforces it. Any search library must be
  self-hosted through passthrough copy from `node_modules`, same pattern as
  Bootstrap's JS.
- Depends on **plan 1, Task 1** for the `verified` front matter that Task 4
  surfaces.
- Task 1 should run after plans 1–3 have landed most of their articles, so the
  categories are drawn from real content rather than guessed at.
- Tasks 2, 3, and 4 are independent of each other and of plans 1–3. Task 4 in
  particular is cheap and high-value and can be done at any time.
- **Progressive enhancement.** Search and offline are additions; the site must
  work fully with JavaScript disabled and the service worker unregistered.
- Watch the existing `no-dup-id`, `wcag/h30`, `wcag/h32`, and `empty-heading`
  rules in `.htmlvalidate.json` — new markup has to pass them.

---

### Task 1: Categorized Information index

**Files:**
- Modify: `content/information/index.pug`
- Modify: `content/index.pug`
- Modify: `.pages.yml`
- Modify: `test/content/frontmatter.test.js`
- Modify: every file in `content/information/` (add `category`)

**Interfaces:**
- Produces: a `category` front matter field with a closed vocabulary, consumed
  by both index pages, validated by a test.

- [ ] **Step 1: Write the failing test**

Append to `test/content/frontmatter.test.js`:

```js
// A closed vocabulary — a typo'd category would silently create an orphan
// group that no index renders under a heading anyone expects.
const CATEGORIES = [
  'vermont',        // VPA rules, policies, calendar, game administration
  'crew-cards',     // topic cards for the whole crew
  'position-cards', // per-position cards
  'mechanics',      // crew mechanics manuals
  'getting-started',// recruiting, first season, assignment, equipment
  'reference',      // rules summaries, reading, everything else
];

test('every article declares a known category', () => {
  const bad = articles
    .filter((a) => !CATEGORIES.includes(a.data.category))
    .map((a) => `${a.name}: ${JSON.stringify(a.data.category)}`);
  assert.deepEqual(bad, []);
});
```

Run it. Expect FAIL listing every article — that's the work list.

- [ ] **Step 2: Categorize every article**

Add `category:` to each file's front matter. Suggested assignment for the
current set:

- `vermont` — vermont-rules-and-policies, game-day-administration,
  ejections-and-reporting, season-calendar
- `crew-cards` — kicking-plays, run-pass-plays, fouls-enforcement, between-downs,
  clock-timing, plus the new signals, equipment, enforcement-overtime, and
  pregame cards from plan 3
- `position-cards` — referee, umpire, linesman, line-judge, back-judge
- `mechanics` — crew-mechanics-4-and-5, 7-man-mechanics
- `getting-started` — becoming-an-official, your-first-season, getting-assigned,
  information-for-new-folks
- `reference` — football-rules-summary, clock-officials-cheat-sheet,
  foul-weather-procedures, recommend-reading

- [ ] **Step 3: Add the field to Pages CMS**

In `.pages.yml`, add to the information collection's fields:

```yaml
      - name: category
        label: Category
        type: select
        required: true
        options:
          values: [vermont, crew-cards, position-cards, mechanics, getting-started, reference]
```

Add `category` to `view.fields`.

- [ ] **Step 4: Rewrite the Information index**

Group by category with a heading per group, in a deliberate order — put
`getting-started` and `vermont` above the cards, because a first-time visitor
needs orientation more than a veteran needs a card they already know how to
find. Sort within groups by title, not date; date order is meaningless for
reference material.

Keep the date rendering on each row, and add the `verified` date where present.

- [ ] **Step 5: Rework the home page**

The home page currently duplicates the full flat list. Replace with a short
orientation: three or four entry points (new to officiating / working a game
this week / Vermont rules / quizzes) and a link to the full index. Keep the
closing call to action pointing at `becoming-an-official`.

- [ ] **Step 6: Verify and commit**

```bash
npm test
npm run dev   # eyeball both indexes
git add -A
git commit -m "feat: categorize information articles and group both indexes"
```

---

### Task 2: Client-side search

**Files:**
- Create: `content/search-index.json.11ty.js` (or a Pug/Liquid template emitting JSON)
- Create: `static/js/search.js`
- Modify: `content/_includes/layouts/main.pug` (search field in the navbar)
- Create: `content/search/index.pug` (results page, for the no-JS path)
- Modify: `test/content/output.test.js`

**Interfaces:**
- Produces: `/search-index.json` — an array of `{ title, url, category, text }`
  for every article, generated at build time; consumed by `search.js`.

- [ ] **Step 1: Write the failing output test**

Append to `test/content/output.test.js`:

```js
test('a search index was generated and covers every article page', () => {
  const idxPath = path.join(SITE, 'search-index.json');
  assert.ok(existsSync(idxPath), 'missing _site/search-index.json');
  const idx = JSON.parse(read(idxPath));
  assert.ok(Array.isArray(idx) && idx.length > 0, 'search index is empty');

  const articlePages = html
    .filter((f) => f.includes(path.join('information', path.sep)))
    .filter((f) => !f.endsWith(path.join('information', 'index.html')));
  assert.equal(
    idx.length,
    articlePages.length,
    `index has ${idx.length} entries for ${articlePages.length} article pages`,
  );

  for (const entry of idx) {
    for (const key of ['title', 'url', 'category', 'text']) {
      assert.ok(entry[key], `index entry missing ${key}: ${JSON.stringify(entry)}`);
    }
  }
});
```

Run `npm run build && node --test "test/content/output.test.js"` — expect FAIL.

- [ ] **Step 2: Generate the index**

Emit `search-index.json` from `collections.information`, stripping markdown and
HTML from bodies to plain text. Keep entries reasonably sized — full bodies of
25 articles is a large payload for a phone on a rural connection. Truncating
`text` to the first ~1500 characters plus all headings usually retains recall
while cutting the payload substantially; measure the built file and decide.

Check the built size: `ls -lh _site/search-index.json`. Over ~150KB, revisit.

- [ ] **Step 3: Decide on a search library**

Try substring-and-token matching in plain JS first — for a corpus this small it
is often enough and adds zero bytes. If ranking is visibly poor (a query for
"running clock" not surfacing the Vermont page first), add `minisearch`, and
self-host it via passthrough copy from `node_modules`. Do **not** load it from a
CDN; the output test forbids it and will fail.

- [ ] **Step 4: Build the UI**

Search field in the navbar. Results as a dropdown on keystroke, with a full
results page at `/search/?q=` for the Enter path. Show title, category, and a
matching snippet.

Accessibility: `role="search"` on the form, a real label (visually hidden is
fine), keyboard navigation through results, and `aria-live` on the result count.
The `wcag/h32` rule requires a submit button on the form — include one even
though JS intercepts it.

- [ ] **Step 5: No-JS path**

`/search/` must render something useful without JS: the full categorized article
list. Someone with JS off gets a browsable page rather than an empty box.

- [ ] **Step 6: Verify and commit**

```bash
npm test
git add -A
git commit -m "feat: client-side search over the information articles"
```

---

### Task 3: Offline access

Officials check things at rural fields with poor service. Everything on this
site is static, so it's fully cacheable — this is mostly a matter of deciding
what to cache and being careful about staleness.

**Files:**
- Create: `static/sw.js`
- Create: `static/manifest.webmanifest`
- Modify: `content/_includes/layouts/main.pug`
- Modify: `test/content/output.test.js`

**Interfaces:**
- Produces: a service worker caching the reference pages, their PDFs, the
  stylesheet, and the search index.

- [ ] **Step 1: Decide the cache scope**

Precache: the two index pages, all `crew-cards` and `position-cards` articles,
the Vermont pages, the stylesheet, Bootstrap JS, and the search index.

Do **not** precache all the PDFs — the card set is large and most people want
the web page on a phone, not a print PDF. Cache PDFs on first fetch instead.

- [ ] **Step 2: Write the service worker**

Hand-written, no Workbox. Network-first with cache fallback for HTML, so a
connected user always gets current content and staleness only appears when
genuinely offline. Cache-first for the stylesheet and JS. Version the cache name
and clean up old versions on `activate`.

**The staleness risk is the real concern here.** A cached page carrying a rules
statement that has since been corrected is exactly the failure mode plan 1's
verification work exists to prevent. Mitigations: network-first for HTML, a
short cache lifetime, and a visible "showing an offline copy" indicator when a
response comes from cache. Do not skip the indicator.

- [ ] **Step 3: Register it, path-prefix aware**

Register from the main layout. The scope must respect the GitHub Pages project
path — a service worker registered at `/` on
`jamesjnadeau.github.io/vermont-football-officials/` would scope over the whole
`github.io` origin and fail. Use a root-relative path that `HtmlBasePlugin`
rewrites, and verify against a prefixed build:

```bash
npm run build -- --pathprefix=/vermont-football-officials/ && grep -r 'sw.js' _site/index.html
```

- [ ] **Step 4: Add the web app manifest**

Name, short name, theme color `#212529` to match the existing meta tag, the
Vermont SVG as the icon, `display: standalone`, and a `start_url` that respects
the path prefix.

- [ ] **Step 5: Test offline for real**

Build, serve, load the site, then kill the network in devtools and navigate.
Confirm: precached pages load, the offline indicator appears, an uncached page
fails gracefully rather than showing a browser error. Then test on an actual
phone — desktop devtools emulation misses real conditions.

- [ ] **Step 6: Add an output test**

Assert `_site/sw.js` and `_site/manifest.webmanifest` exist and that the layout
references both.

- [ ] **Step 7: Commit**

```bash
npm test
git add -A
git commit -m "feat: offline access via service worker and web app manifest"
```

---

### Task 4: Disclaimer and staleness surface

Cheap, fast, and the highest trust-per-line-of-code in this plan. Can be done
first if desired.

**Files:**
- Modify: `content/_includes/layouts/main.pug`
- Modify: `content/information/index.pug`
- Create: `content/about/index.pug`
- Modify: `test/content/output.test.js`

**Interfaces:**
- Consumes: plan 1 Task 1's `verified` front matter.
- Produces: a site-wide footer, an About page, and a staleness column on the
  Information index.

- [ ] **Step 1: Add a site footer**

The site currently has no footer at all. Add one to `main.pug` carrying:

- What this site is: an unofficial resource maintained by a Vermont official,
  not a VPA or VFOA publication.
- What governs: the current NFHS rule book and the VPA Football Guide. Link
  both.
- The standing caveat, stated once site-wide rather than repeated per article:
  verify against current Vermont guidance before teaching any of this as
  authoritative.
- A link to About and to Contact.

This is the same caveat the crew cards carry inline. Keeping it in the footer
too means a page someone lands on directly still carries it.

- [ ] **Step 2: Write the About page**

Who maintains the site and why, what it covers, how it's built, how to report an
error, and how to contribute. Include the review commitment: pages are
re-verified annually before week 1, and every page shows its own last-checked
date.

An explicit "found something wrong?" line with a direct email matters more than
it looks — the fastest correction path for a rules error is another official
noticing it.

- [ ] **Step 3: Surface staleness on the index**

Render each article's `verified` date in the index rows. Where it's more than
one rules year old, mark it visibly — text or an icon, not color alone, per the
site's existing monochrome discipline and for accessibility.

This makes the maintenance backlog visible to the maintainer on the page they
look at most, which is the point.

- [ ] **Step 4: Add navbar links**

The navbar is Information / Quizzes / Contact Us. Add About. Note that
`content/rules-bot/index.pug` exists and is **not linked from the navbar at
all** — decide whether it's a live feature or an experiment, and either link it
or remove the page. An unreachable page is a maintenance liability.

- [ ] **Step 5: Add an output test**

Assert every page contains the footer disclaimer text, in the same style as the
existing meta-description test.

- [ ] **Step 6: Commit**

```bash
npm test
git add -A
git commit -m "feat: site footer disclaimer, About page, and staleness surface"
```

---

## Post-plan notes (not tasks)

- **A combined print bundle** — all cards as one PDF, plus a per-card index page
  — is a natural follow-on now that the stylesheet is unified (plan 3, Task 1).
  Deferred deliberately: worth doing once the card set has stopped growing.
- **Analytics.** There's currently no measurement, so decisions about what to
  build next are guesses. A privacy-respecting counter would tell you whether
  anyone reads the position cards or whether everyone goes straight to the
  rules summary. Worth a conversation before adding anything that sets cookies.
- **The 400-day staleness check from plan 1 fails the build** when a page goes
  unverified. Task 4's index surface is the early warning that lets you fix it
  before it becomes a red CI run in the middle of August.
- **`content/quizzes/asked-questions.md`** is an existing ledger preventing
  question reuse. If quiz content grows, that pattern probably wants extending
  — a similar ledger for which rules areas have coverage would show where the
  gaps are.
