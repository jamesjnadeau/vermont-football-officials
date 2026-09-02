/**
 * Every field diagram the site publishes, as one list.
 *
 * `tools/diagrams.js` writes these to `static/images/`; the drift test
 * renders the same list in memory and fails if a committed file has been
 * hand-edited away from its scene. Adding a diagram means adding a scene
 * here and nowhere else.
 */
import { positionCardDiagrams } from './position-cards.js';
import { diagrams as kickingPlays } from './kicking-plays.js';
import { diagrams as runPassPlays } from './run-pass-plays.js';
import { diagrams as betweenDowns } from './between-downs.js';
import { diagrams as foulsEnforcement } from './fouls-enforcement.js';

export function allDiagrams() {
  return [
    ...positionCardDiagrams(),
    ...kickingPlays,
    ...runPassPlays,
    ...betweenDowns,
    ...foulsEnforcement,
  ];
}
