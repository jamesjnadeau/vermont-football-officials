import { HtmlBasePlugin } from "@11ty/eleventy";
import pugPlugin from "@11ty/eleventy-plugin-pug";
import purgeCssPlugin from "eleventy-plugin-purgecss";
import eleventySass from "eleventy-sass";
import path from "node:path";

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

  // Authoring docs that sit beside the quiz content but aren't pages: the
  // folder README and the ledger that keeps questions from being reused.
  eleventyConfig.ignores.add("content/quizzes/README.md");
  eleventyConfig.ignores.add("content/quizzes/asked-questions.md");

  // Copy static/ to the site root; self-host Bootstrap's JS so the built
  // site is self-contained and reproducible.
  eleventyConfig.addPassthroughCopy({ static: "/" });
  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js": "js/bootstrap.bundle.min.js",
  });

  // Serve lib/field/ and lib/draw/ to the browser at matching subpaths. The
  // mirroring is deliberate, not incidental: a relative import inside those
  // files, such as `../field/geometry.js`, then resolves identically whether
  // the importer is `node --test` or a browser loading /js/draw/app.js — no
  // module needs a second spelling of its own dependencies for the two
  // runtimes. Everything under both directories must therefore stay
  // DOM-free and `node:`-import-free except lib/draw/app.js, which says so
  // in its own header.
  eleventyConfig.addPassthroughCopy({ "lib/field": "js/field", "lib/draw": "js/draw" });

  // Sass -> CSS (see https://www.11ty.dev/docs/languages/custom/)
  eleventyConfig.addTemplateFormats("scss");
  eleventyConfig.addPlugin(eleventySass, {
    sass: {
      loadPaths: ["./node_modules"],
      quietDeps: true,
      style: "compressed",
      sourceMap: process.env.NODE_ENV !== "production",
    },
  });

  // Strip unused Bootstrap CSS from production builds.
  if (process.env.NODE_ENV === "production") {
    eleventyConfig.addPlugin(purgeCssPlugin, {
      config: {
        content: ["./_site/**/*.html", "./_site/**/*.js"],
        css: ["./_site/**/*.css"],
        // `card-only` marks a block that belongs on the printed card and not
        // on the page, so by definition no built HTML uses it until an editor
        // reaches for it — and by then the rule that hides it would be gone.
        safelist: ["card-only"],
      },
      quiet: false,
    });
  }

  // The printable cards. An article that is tagged `Printable` and links its
  // own /cards/<slug>.pdf is rendered to a two-page PDF there, so the article
  // is the only source for both the web page and the card an official carries
  // (docs/cards/README.md).
  //
  // /cards/ and not /uploads/: `static/uploads/` is the Pages CMS media
  // directory that editors upload into, and a generated file living there
  // would eventually collide with one someone put there by hand. `uploads/` is
  // what people put in; `cards/` is what the build makes.
  //
  // Skipped while serving or watching unless CARDS=1, because a live-reload
  // cycle must not wait on a browser. The import is dynamic for the same
  // reason: `npm run dev` should not pay to load Playwright to skip it.
  eleventyConfig.on("eleventy.after", async ({ directories, runMode }) => {
    if (runMode !== "build" && process.env.CARDS !== "1") return;
    const { writeCards } = await import("./lib/cards/render.js");
    await writeCards({ outputDir: path.join(directories.output, "cards") });
  });

  // Code blocks scroll horizontally, which makes them a scrollable region.
  // Those must be keyboard-focusable (axe: scrollable-region-focusable).
  eleventyConfig.addTransform("focusableCodeBlocks", function (content) {
    if (!this.page.outputPath?.endsWith(".html")) return content;
    return content.replace(/<pre(?![^>]*\btabindex=)/g, '<pre tabindex="0"');
  });
}
