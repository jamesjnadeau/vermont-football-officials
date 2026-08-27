# The printable cards

Eleven articles double as printed reference cards, carried in a pocket and read
on a sideline. **The article is the card.** There is no second document: the
build renders each article tagged `Printable` to a two-page PDF at
`/cards/<slug>.pdf`, so an editor who fixes a mechanic in Pages CMS has fixed
the card too, with nothing to rebuild.

## The rules

- **Two pages, Letter, two-sided, flip on the long edge.** Not a convention
  someone has to remember — `test/cards/output.test.js` reads the page count
  back out of the rendered PDF and fails the build on anything else.
- **Monochrome first.** The cards are printed on whatever laser the association
  has. Colour may add, never carry.
- **PDFs are build output, never committed.** Same status as the compiled CSS.
  A committed PDF is a PDF that can be stale. `static/uploads/` is the CMS media
  directory that editors upload into; generated cards live at `/cards/` so the
  two can never collide.
- **Editors learn nothing new.** Write the article; the card follows.

## What of the article becomes the card

Worked out in `lib/cards/extract.js`, by convention rather than markup:

| Article | Card |
| --- | --- |
| The opening paragraph (the lede) | The subtitle under the title |
| The paragraph linking this article's own PDF | Dropped — you are holding it |
| `---` rules between `##` sections | Dropped — the card separates sections itself |
| Everything else, in document order | Card content |
| `source` / `verified` / `ruleYear` front matter | The footer line |

The escape hatch, for the exception this does not cover: `class="card-omit"` on
a block keeps it off the card, and `class="card-only"` keeps it off the web
page. Nothing in `content/` needs either today.

## Building

```bash
npm run build          # renders every card into _site/cards/
npm run test:cards     # extraction, cache and output gates
CARDS=1 npm run dev    # dev server, with cards
```

`npm run dev` **skips cards** unless `CARDS=1` is set. A live-reload cycle must
not wait on a browser, and the page you are editing does not change when the
card does.

Rendering needs a Chromium. Playwright's own download is used when it is there
(`npx playwright install chromium`); otherwise set `CARD_CHROMIUM_PATH` to a
browser binary.

## When a card comes out at three pages

The build fails and names the card. Three knobs decide whether a card fits, and
they are at the top of `lib/cards/card.css` with the same list in a comment:

1. `--card-columns` — two is the densest that stays readable at this size.
2. `--card-font-size` — 7pt is the floor. Below that the card is decoration.
3. `--card-figure-width` — two diagrams sit side by side in one column, so this
   is a little under half the column measure. Field diagrams are about 1.46 as
   tall as they are wide, which makes them the expensive part of a card.

Push these before you start cutting content, and stop before the type stops
being readable at arm's length on a wet evening — that is the whole point of the
card. If they run out, cut content rather than shrinking type further.

## Before you ship a card

**Proof it on an actual black-and-white laser**, two-sided, flipped on the long
edge. The gates catch page count, dropped content and missing figures; they
cannot see whether a diagram is legible in toner or whether the back of the card
came out upside down. See [proofing.md](proofing.md).

## Why Chromium

One toolchain. `page.pdf()` reports the page count directly, which is how the
two-page gate is enforced, and the same browser renders a proof image. The cards
this pipeline replaces were themselves produced by Chromium — their PDFs carry
`/Producer (Skia/PDF m141)` — so nothing is lost by staying with it. If the
cards ever need running headers or "page 1 of 2", that is the point to
reconsider: those are the things Chromium's paged media is worst at.
