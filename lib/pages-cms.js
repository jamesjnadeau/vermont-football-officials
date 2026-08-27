// Links into Pages CMS (https://app.pagescms.org), the editing UI configured by
// .pages.yml. Editors sign in with GitHub and save straight to `master`, which
// deploys the site.
//
// Lives outside content/_data/ on purpose: every .js file in the global data
// directory is loaded as data, and Eleventy reads the whole module namespace,
// so exporting these helpers from there would inject them into the data
// cascade. content/_data/eleventyComputed.js imports this instead.

const APP = 'https://app.pagescms.org';
const REPO = 'jamesjnadeau/vermont-football-officials';

// The branch Pages CMS reads and commits to — the one GitHub Pages deploys
// from (see .github/workflows/deploy.yml).
const BRANCH = 'master';

// CMS collection name -> the folder it edits. Must match the `content:`
// entries in .pages.yml; a test asserts the two agree.
export const COLLECTIONS = [
  { name: 'information', path: 'content/information' },
  { name: 'quizzes', path: 'content/quizzes' },
];

// Where an editor lands with no particular page in mind: the collection list.
export const HOME_URL = `${APP}/${REPO}/${BRANCH}`;

// The footer's edit link for the page built from `inputPath` (Eleventy's
// `page.inputPath`, e.g. "./content/information/7-man-mechanics.md").
//
// Markdown pages are CMS entries and deep-link straight to their own editor.
// The Pug pages (home, Contact, the list pages) aren't in the CMS at all, so
// they point at the collection list rather than promise an editor for
// themselves that doesn't exist.
export function editLink(inputPath) {
  const file = String(inputPath ?? '').replace(/^\.\//, '');
  const collection = file.endsWith('.md')
    ? COLLECTIONS.find((c) => file.startsWith(`${c.path}/`))
    : undefined;

  if (!collection) return { url: HOME_URL, label: 'Edit site content' };

  // Pages CMS carries the file path in a single URL segment and reads it back
  // with decodeURIComponent, so the slashes have to be percent-encoded.
  return {
    url: `${HOME_URL}/collection/${collection.name}/edit/${encodeURIComponent(file)}`,
    label: 'Edit this page',
  };
}
