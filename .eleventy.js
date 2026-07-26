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
      sourceMap: process.env.NODE_ENV !== "production",
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
