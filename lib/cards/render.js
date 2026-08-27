/**
 * Renders card models to PDF through headless Chromium, behind the
 * content-addressed cache. One browser for the whole run, one page reused,
 * and a card re-renders only when one of its inputs changed.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { cacheKey, cacheKeyParts, changedParts, CardCache } from './cache.js';
import { CARD_CSS_PATH, renderCardHtml } from './card-template.js';
import { cardImages } from './extract.js';

const TEMPLATE_PATH = new URL('./card-template.js', import.meta.url);

/** Where a site-root image path resolves to on disk. */
export const DEFAULT_STATIC_DIR = 'static';

/**
 * The Chromium the cards come out of. A browser upgrade changes layout, so the
 * build it rendered with is a cache input like any other.
 *
 * Resolved rather than assumed: `CARD_CHROMIUM_PATH` wins, then Playwright's
 * own download, then a browser the environment placed on the standard
 * Playwright path. Reading `--version` costs one short-lived process and
 * avoids launching a browser on a run where every card is already cached.
 */
export function chromiumExecutable() {
  const candidates = [
    process.env.CARD_CHROMIUM_PATH,
    (() => {
      try {
        return chromium.executablePath();
      } catch {
        return null;
      }
    })(),
    process.env.PLAYWRIGHT_BROWSERS_PATH
      ? path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium')
      : null,
  ].filter(Boolean);

  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      `no Chromium found for card rendering (looked at: ${candidates.join(', ') || 'nothing'}). ` +
        'Run `npx playwright install chromium`, or set CARD_CHROMIUM_PATH.',
    );
  }
  return found;
}

let chromiumIdentityCache;

/** e.g. "Chromium 141.0.7390.54" — the identity that goes in the cache key. */
export function chromiumIdentity() {
  if (chromiumIdentityCache) return chromiumIdentityCache;
  const exe = chromiumExecutable();
  const version = execFileSync(exe, ['--version'], { encoding: 'utf8' }).trim();
  chromiumIdentityCache = version || exe;
  return chromiumIdentityCache;
}

const mediaType = (file) => {
  if (file.endsWith('.svg')) return 'image/svg+xml';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  if (file.endsWith('.webp')) return 'image/webp';
  throw new Error(`card asset has no known media type: ${file}`);
};

/**
 * The bytes behind every image a card references, keyed by the site-root path
 * the article writes. Both the template (which inlines them) and the cache key
 * (which hashes them) read this, so the two can never disagree about what the
 * card is made of.
 */
export function loadCardAssets(model, { staticDir = DEFAULT_STATIC_DIR } = {}) {
  const assets = new Map();
  for (const src of cardImages(model)) {
    if (!src.startsWith('/')) {
      throw new Error(`${model.slug}: card image is not a site-root path: ${src}`);
    }
    const file = path.join(staticDir, src.slice(1));
    if (!existsSync(file)) {
      throw new Error(`${model.slug}: card image not found on disk: ${src} (${file})`);
    }
    assets.set(src, readFileSync(file));
  }
  return assets;
}

const dataUri = (src, bytes) =>
  `data:${mediaType(src)};base64,${bytes.toString('base64')}`;

/** The template's view of the assets: the same map, as data URIs. */
export const inlineAssetMap = (assets) =>
  new Map([...assets].map(([src, bytes]) => [src, dataUri(src, bytes)]));

/** The template and stylesheet sources, hashed into every card's cache key. */
export function cardSources() {
  return {
    'card.css': readFileSync(CARD_CSS_PATH, 'utf8'),
    'card-template.js': readFileSync(TEMPLATE_PATH, 'utf8'),
  };
}

/**
 * A Chromium held open for a whole build. Launching costs about a second, and
 * a site with eleven cards would otherwise pay it eleven times.
 */
export async function openRenderer() {
  let browser = null;
  let page = null;

  const ready = async () => {
    if (page) return page;
    browser = await chromium.launch({ executablePath: chromiumExecutable() });
    page = await browser.newPage();
    return page;
  };

  return {
    /** HTML in, a two-sided Letter PDF out. */
    async pdf(html) {
      const p = await ready();
      await p.setContent(html, { waitUntil: 'load' });
      await p.evaluate(() => document.fonts.ready);
      return p.pdf({ format: 'Letter', printBackground: true, preferCSSPageSize: true });
    },
    async close() {
      await browser?.close();
      browser = null;
      page = null;
    },
  };
}

/**
 * One card, from cache when its inputs are unchanged.
 *
 * `renderer` is optional: pass one from `openRenderer()` to share a browser
 * across a build. Without it, a cache hit costs no browser at all and a miss
 * throws rather than quietly launching one per card.
 */
export async function renderCard(
  model,
  { article, cacheDir = '.cache/cards', staticDir = DEFAULT_STATIC_DIR, renderer, log } = {},
) {
  const cache = cacheDir ? new CardCache(cacheDir) : null;
  const assets = loadCardAssets(model, { staticDir });
  const parts = cacheKeyParts({
    article,
    assets,
    sources: cardSources(),
    chromium: chromiumIdentity(),
  });
  const key = cacheKey(parts);

  const hit = cache?.get(key);
  if (hit) {
    log?.(`cards: ${model.slug} — cache hit`);
    return { pdf: hit, cached: true, key, parts };
  }

  const changed = changedParts(cache?.lastParts(model.slug), parts);
  const why = cache?.lastParts(model.slug) ? changed.join(', ') : 'not rendered before';
  log?.(`cards: ${model.slug} — rendering (${why})`);

  if (!renderer) throw new Error(`${model.slug}: cache miss with no renderer to render it`);
  const html = renderCardHtml(model, { assets: inlineAssetMap(assets) });
  const pdf = await renderer.pdf(html);

  cache?.put(key, pdf);
  cache?.recordParts(model.slug, parts);
  return { pdf, cached: false, key, parts, changed };
}
