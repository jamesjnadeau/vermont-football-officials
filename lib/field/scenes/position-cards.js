/**
 * The position cards' diagrams: every crew-of-five play, once per official,
 * with that official wearing the halo.
 *
 * Thirty files, six scenes, one loop. The highlight is a render-time
 * parameter (`markers.js`), so an official's card and the crew card behind
 * it can never disagree about where anybody stands — there is only one copy
 * of the play.
 */
import { RUN, PASS, GOAL_LINE, KICKOFF, PUNT, FIELD_GOAL, highlighting } from './crew-of-five.js';

const PLAYS = [
  { slug: 'run', label: 'Run', scene: RUN },
  { slug: 'pass', label: 'Pass', scene: PASS },
  { slug: 'goal-line', label: 'Goal line', scene: GOAL_LINE },
  { slug: 'kickoff', label: 'Kickoff', scene: KICKOFF },
  { slug: 'punt', label: 'Punt', scene: PUNT },
  { slug: 'field-goal', label: 'Field goal & try', scene: FIELD_GOAL },
];

const OFFICIALS = [
  { dir: 'referee', mark: 'R', name: 'Referee' },
  { dir: 'umpire', mark: 'U', name: 'Umpire' },
  { dir: 'head-line-judge', mark: 'HL', name: 'Head Line Judge' },
  { dir: 'line-judge', mark: 'LJ', name: 'Line Judge' },
  { dir: 'back-judge', mark: 'BJ', name: 'Back Judge' },
];

export function positionCardDiagrams() {
  const out = [];
  for (const { dir, mark, name } of OFFICIALS) {
    for (const { slug, label, scene } of PLAYS) {
      out.push({
        file: `position-cards/${dir}/${slug}.svg`,
        ...highlighting(scene, mark),
        title: `${label} — ${name} position, crew of 5`,
      });
    }
  }
  return out;
}
