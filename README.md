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

If your change doesn't appear on the site after about 5 minutes, email James so he can take a look.

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
