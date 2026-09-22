// Asserts the ContentTools editor (/admin/ and in-page) is wired to this site:
// its config agrees with Pages CMS, the vendored build is whole, and its
// GitHub calls are routed through Netlify's Git Gateway. Needs no build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import matter from 'gray-matter';

const yaml = (file) => matter(`---\n${readFileSync(file, 'utf8')}\n---\n`).data;

const CT = yaml('static/cms-config.yml');
const PAGES = yaml('.pages.yml');

// Two editors write the same files. A collection or field that one knows
// and the other doesn't is content that one of them silently can't edit.
test('ContentTools edits the same collections as Pages CMS', () => {
  const pair = (c) => `${c.name} -> ${c.folder ?? c.path}`;
  assert.deepEqual(CT.collections.map(pair).sort(), PAGES.content.map(pair).sort());
});

test('ContentTools offers every front matter field Pages CMS does', () => {
  for (const pages of PAGES.content) {
    const ct = CT.collections.find((c) => c.name === pages.name);
    // `body` is the page itself in ContentTools, not a field.
    const want = pages.fields.map((f) => f.name).filter((n) => n !== 'body').sort();
    assert.deepEqual(ct.fields.map((f) => f.name).sort(), want, pages.name);
  }
});

test('the select fields offer the same choices in both editors', () => {
  for (const pages of PAGES.content) {
    const ct = CT.collections.find((c) => c.name === pages.name);
    for (const field of ct.fields.filter((f) => f.widget === 'select')) {
      const theirs = pages.fields.find((f) => f.name === field.name);
      assert.deepEqual(field.options, theirs.options.values, `${pages.name}.${field.name}`);
    }
  }
});

// The glue reroutes calls for one repository and branch; a config pointed
// anywhere else would go straight to api.github.com with a Netlify JWT.
test('the Git Gateway glue and the config name the same repository', () => {
  const glue = readFileSync('static/cms/netlify.js', 'utf8');
  assert.equal(glue.match(/const REPO = '([^']+)'/)[1], CT.backend.repo);
  assert.equal(glue.match(/const BRANCH = '([^']+)'/)[1], CT.backend.branch);
});

// Chunk names are content-hashed, so a partial copy of a new build 404s on
// an import only when an author opens the editor.
test('every chunk the vendored editor imports is there', () => {
  const missing = ['edit.js', 'shell.js', ...readdirSync('static/cms/chunks').map((f) => `chunks/${f}`)]
    .flatMap((file) => {
      const dir = file.includes('/') ? 'static/cms/chunks' : 'static/cms';
      const src = readFileSync(`static/cms/${file}`, 'utf8');
      return [...src.matchAll(/(?:from|import\()\s*["'](\.{1,2}\/[^"']+)["']/g)]
        .map(([, rel]) => new URL(rel, `file://${process.cwd()}/${dir}/`).pathname)
        .filter((abs) => !existsSync(abs));
    });
  assert.deepEqual(missing, []);
  for (const file of ['content-tools-content.min.css', 'images/icons.woff', 'VERSION']) {
    assert.ok(existsSync(`static/cms/${file}`), file);
  }
});

// --- gatewayFetch --------------------------------------------------------

async function gateway() {
  const calls = [];
  globalThis.window = {
    fetch: async (url, init) => {
      calls.push({ url, init });
      return new Response('[]');
    },
  };
  const { gatewayFetch } = await import('../../static/cms/netlify.js');
  return { fetch: gatewayFetch(), calls };
}

test('repository API calls go to the Git Gateway, with the rest of the path', async () => {
  const { fetch, calls } = await gateway();
  const repo = `https://api.github.com/repos/${CT.backend.repo}`;
  await fetch(`${repo}/contents/content%2Finformation?ref=master`, {
    headers: { Authorization: 'Bearer handed-over', 'X-GitHub-Api-Version': '2022-11-28' },
  });
  await fetch(`${repo}/git/blobs`, { method: 'POST', body: '{}' });
  await fetch('https://api.github.com/repositories/123/pulls?state=open&page=2');

  assert.deepEqual(calls.map((c) => c.url), [
    '/.netlify/git/github/contents/content%2Finformation?ref=master',
    '/.netlify/git/github/git/blobs',
    '/.netlify/git/github/pulls?state=open&page=2',
  ]);
  // With no Identity session in this browser, the token already on the
  // request (handed over from /admin/) is left alone.
  assert.equal(calls[0].init.headers.get('Authorization'), 'Bearer handed-over');
  assert.equal(calls[0].init.headers.has('X-GitHub-Api-Version'), false);
  assert.equal(calls[1].init.method, 'POST');
});

// The gateway does not proxy the repository's own metadata, which the admin
// screens read once at sign-in to check the author may push.
test('repository metadata is answered locally', async () => {
  const { fetch, calls } = await gateway();
  const response = await fetch(`https://api.github.com/repos/${CT.backend.repo}`);
  assert.deepEqual(await response.json(), {
    default_branch: CT.backend.branch,
    permissions: { push: true },
  });
  assert.deepEqual(calls, []);
});

test('everything else is fetched untouched', async () => {
  const { fetch, calls } = await gateway();
  await fetch('/cms-config.yml');
  await fetch('https://api.github.com/repos/someone/else/contents/x');
  assert.deepEqual(calls.map((c) => c.url), [
    '/cms-config.yml',
    'https://api.github.com/repos/someone/else/contents/x',
  ]);
});

// Every change reaches GitHub as the Git Gateway's one account, so the glue
// names the signed-in editor on the pull request and as each commit's author.
test('pull requests and commits name the signed-in editor', async () => {
  const { fetch, calls } = await gateway();
  globalThis.window.netlifyIdentity = {
    currentUser: () => ({
      email: 'ref@example.com',
      user_metadata: { full_name: 'Pat Referee' },
      jwt: async () => 'fresh-jwt',
    }),
  };
  globalThis.localStorage = { getItem: () => '{}' };
  try {
    const repo = `https://api.github.com/repos/${CT.backend.repo}`;
    const post = (rest, body) => fetch(`${repo}${rest}`, { method: 'POST', body: JSON.stringify(body) });
    await post('/pulls', { title: 'Update information/x', body: '', head: 'cms/x', base: 'master' });
    await post('/git/commits', { message: 'Update information/x', tree: 't', parents: ['p'] });
    await post('/git/blobs', { content: 'x' });

    const [pull, commit, blob] = calls.map((c) => JSON.parse(c.init.body));
    assert.equal(pull.body, 'Submitted by Pat Referee (ref@example.com) through the site editor.');
    assert.equal(pull.title, 'Update information/x');
    assert.equal(commit.author.name, 'Pat Referee');
    assert.equal(commit.author.email, 'ref@example.com');
    assert.equal(commit.message, 'Update information/x');
    assert.deepEqual(blob, { content: 'x' });
    assert.equal(calls[0].init.headers.get('Authorization'), 'Bearer fresh-jwt');
  } finally {
    delete globalThis.localStorage;
  }
});
