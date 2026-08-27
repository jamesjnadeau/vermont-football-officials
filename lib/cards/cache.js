/**
 * The content-addressed cache that makes card rendering incremental.
 *
 * The cache key is the fragile part of this pipeline. Everything else here
 * fails loudly; a missing input in the key fails silently, months later, as a
 * card that does not match its page. So the key is a hash of everything that
 * can change the output, written as a sorted list of `name: sha256` pairs so a
 * rebuild can always be explained by one diff. When in doubt, add the input.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Bump by hand whenever the renderer, the template or the page geometry
 * changes in a way the file hashes below would not catch — a different
 * `page.pdf()` option, say. A bump invalidates every card.
 */
export const CARD_FORMAT_VERSION = 1;

/** The front-matter fields the card reads. Changing one must rebuild the card. */
export const CARD_FRONTMATTER_FIELDS = ['title', 'source', 'verified', 'ruleYear'];

export const sha256 = (data) => createHash('sha256').update(data).digest('hex');

/**
 * Every input that can change one card's PDF, as a sorted list of
 * `{ name, sha }`. `assets` maps each image src the card references to the
 * bytes of the file behind it — the contents, not the path, so a regenerated
 * field diagram invalidates every card that shows it.
 */
export function cacheKeyParts({ article, assets, sources, chromium }) {
  const frontmatter = Object.fromEntries(
    CARD_FRONTMATTER_FIELDS.map((f) => [f, article.data[f] ?? null]).map(([f, v]) => [
      f,
      v instanceof Date ? v.toISOString() : v,
    ]),
  );

  const parts = [
    { name: 'article:body', sha: sha256(article.body) },
    { name: 'article:frontmatter', sha: sha256(JSON.stringify(frontmatter)) },
    { name: 'format-version', sha: sha256(String(CARD_FORMAT_VERSION)) },
    { name: 'chromium', sha: sha256(String(chromium)) },
    ...Object.entries(sources).map(([name, contents]) => ({
      name: `source:${name}`,
      sha: sha256(contents),
    })),
    ...[...assets].map(([src, bytes]) => ({ name: `image:${src}`, sha: sha256(bytes) })),
  ];

  return parts.sort((a, b) => a.name.localeCompare(b.name));
}

export const cacheKey = (parts) =>
  sha256(parts.map((p) => `${p.name}: ${p.sha}`).join('\n'));

/**
 * Which inputs differ between two part lists. This is what turns "the card
 * rebuilt" into "the card rebuilt because kickoff-crew-of-5.svg changed".
 */
export function changedParts(before, after) {
  const prev = new Map((before ?? []).map((p) => [p.name, p.sha]));
  const next = new Map(after.map((p) => [p.name, p.sha]));
  const names = new Set([...prev.keys(), ...next.keys()]);
  return [...names].filter((n) => prev.get(n) !== next.get(n)).sort();
}

/** A PDF that was truncated mid-write is a miss, not a broken card. */
const looksLikePdf = (buf) =>
  buf.length > 1000 &&
  buf.subarray(0, 5).toString('latin1') === '%PDF-' &&
  buf.subarray(-1024).toString('latin1').includes('%%EOF');

/**
 * Rendered cards on disk, keyed by content, plus the last-seen inputs per card
 * so a miss can say what changed.
 */
export class CardCache {
  constructor(dir) {
    this.dir = dir;
    mkdirSync(dir, { recursive: true });
  }

  #pdfPath(key) {
    return path.join(this.dir, `${key}.pdf`);
  }

  #partsPath(slug) {
    return path.join(this.dir, `${slug}.parts.json`);
  }

  /** The PDF for `key`, or null on a miss — including a corrupt entry. */
  get(key) {
    let buf;
    try {
      buf = readFileSync(this.#pdfPath(key));
    } catch {
      return null;
    }
    if (looksLikePdf(buf)) return buf;
    rmSync(this.#pdfPath(key), { force: true });
    return null;
  }

  /** Stores through a temporary file, so an interrupted build leaves no half-PDF. */
  put(key, buf) {
    const tmp = `${this.#pdfPath(key)}.${process.pid}.tmp`;
    writeFileSync(tmp, buf);
    renameSync(tmp, this.#pdfPath(key));
    return buf;
  }

  /** The inputs recorded the last time this card was rendered, if any. */
  lastParts(slug) {
    try {
      return JSON.parse(readFileSync(this.#partsPath(slug), 'utf8'));
    } catch {
      return null;
    }
  }

  recordParts(slug, parts) {
    writeFileSync(this.#partsPath(slug), `${JSON.stringify(parts, null, 2)}\n`);
  }
}
