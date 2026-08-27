# Proofing a card on paper

Read this before a print run. It is short on purpose.

The build already checks what a machine can see: that every card is exactly two
pages, that nothing the article says fell off the page box, and that every
diagram rendered. It cannot see toner, paper or a duplexer. **This step is
manual and cannot be skipped** — it is the only check that a card works as an
object.

## The print

Print **all eleven**, on the black-and-white laser the association actually
uses, **two-sided, flipped on the long edge, at 100%** — no "fit to page", which
silently rescales the diagrams and makes the type smaller than it was designed
to be.

```bash
npm run build     # cards land in _site/cards/
```

## What only a person can catch

- **The flip.** Turn each card over on its long edge. If page 2 is upside down,
  the printer is set to flip on the short edge — a card whose back is upside
  down is a card nobody uses twice.
- **The diagrams in toner.** The end-zone hatching, the white Referee marker
  against the field, the dashed movement arrows: on screen these separate by a
  hair, and a tired laser drum closes that gap. If you cannot tell the Referee
  from the other officials at arm's length, the diagram has failed.
- **Legibility in bad light.** Hold it at arm's length under a poor lamp. That
  is the reading condition the card exists for. The type size is already set for
  it; if it does not survive, say so rather than living with it.
- **The bottom of page 2.** The provenance line carries the date the content was
  last checked. A card with no date on it is one nobody can trust two seasons
  later.
- **Whether it survives a pocket.** Fold it. Read it again.

## What the build already covers

Do not spend the proof re-checking these; they fail the deploy on their own
(`test/cards/output.test.js`):

- exactly two pages
- every bullet, table cell and caption from the article present in the PDF
- every diagram the article references actually rendered
- no heading stranded at the foot of a column, away from its content
- the title and the provenance line present

## If something is wrong

Fix the **article**, not the PDF — the card is generated from
`content/information/<slug>.md` and there is nothing else to edit. If the card
no longer fits, `docs/cards/README.md` names the three knobs to turn before
cutting content.
