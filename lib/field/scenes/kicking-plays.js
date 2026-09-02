/**
 * The kicking-plays crew card: four phases, two crew sizes.
 *
 * Crew of five reuses the shared plays where the card shows the same picture
 * the position cards do; the onside kick and every crew-of-four alignment are
 * their own scenes, because a crew of four is not a crew of five with the
 * Back Judge deleted — the other four move.
 */
import { KICKOFF, PUNT, FIELD_GOAL , highlighting } from './crew-of-five.js';

const KICKOFF_5 = {
  file: "kicking-plays/kickoff-crew-of-5.svg",
  ...highlighting(KICKOFF, 'R'),
  title: "Kickoff, crew of 5",
};

const KICKOFF_4 = {
  file: "kicking-plays/kickoff-crew-of-4.svg",
  view: 'kickoff',
  title: "Kickoff, crew of 4",
  players: [
    { kind: 'k', at: { across: -22.9333, down: -1.0417 } },
    { kind: 'k', at: { across: -17.8667, down: -1.0417 } },
    { kind: 'k', at: { across: -12.8, down: -1.0417 } },
    { kind: 'k', at: { across: -7.7333, down: -1.0417 } },
    { kind: 'k', at: { across: -2.6667, down: -1.0417 } },
    { kind: 'k', at: { across: 2.4, down: -1.0417 } },
    { kind: 'k', at: { across: 7.4667, down: -1.0417 } },
    { kind: 'k', at: { across: 12.5333, down: -1.0417 } },
    { kind: 'k', at: { across: 17.6, down: -1.0417 } },
    { kind: 'k', at: { across: 22.6667, down: -1.0417 } },
    { kind: 'k', at: { across: 0, down: -3.125 } },
    { kind: 'r', at: { across: -20.8, down: 11.25 } },
    { kind: 'r', at: { across: -12, down: 11.25 } },
    { kind: 'r', at: { across: -3.7333, down: 11.25 } },
    { kind: 'r', at: { across: 5.3333, down: 11.25 } },
    { kind: 'r', at: { across: 12.8, down: 11.25 } },
    { kind: 'r', at: { across: 21.3333, down: 11.25 } },
    { kind: 'r', at: { across: -9.0667, down: 30.8333 } },
    { kind: 'r', at: { across: 10.6667, down: 32.0833 } },
    { kind: 'r', at: { across: -1.0667, down: 48.3333 } },
    { kind: 'r', at: { across: 8, down: 50.8333 } },
  ],
  officials: [
    { mark: 'U', at: { across: -30.6667, down: 0 } },
    { mark: 'LJ', at: { across: 30.6667, down: 10 } },
    { mark: 'R', at: { across: 13.8667, down: 50 }, highlight: true },
    { mark: 'LM', at: { across: -13.8667, down: 50 } },
  ],
  movements: [
    { points: [{ across: 13.8667, down: 47.0833 }, { across: 13.8667, down: 31.25 }] },
  ],
  notes: [
    { text: "K's restraining line • free-kick line", at: { across: 0, down: -6.4583 } },
    { text: "R's restraining line", at: { across: 0, down: 8.75 } },
    { text: "after the catch", at: { across: 13.8667, down: 29.1667 } },
  ],
};

const ONSIDE_5 = {
  file: "kicking-plays/onside-crew-of-5.svg",
  view: 'kickoff',
  title: "Onside and short free kick, crew of 5",
  players: [
    { kind: 'k', at: { across: -22.9333, down: -1.0417 } },
    { kind: 'k', at: { across: -17.8667, down: -1.0417 } },
    { kind: 'k', at: { across: -12.8, down: -1.0417 } },
    { kind: 'k', at: { across: -7.7333, down: -1.0417 } },
    { kind: 'k', at: { across: -2.6667, down: -1.0417 } },
    { kind: 'k', at: { across: 2.4, down: -1.0417 } },
    { kind: 'k', at: { across: 7.4667, down: -1.0417 } },
    { kind: 'k', at: { across: 12.5333, down: -1.0417 } },
    { kind: 'k', at: { across: 17.6, down: -1.0417 } },
    { kind: 'k', at: { across: 22.6667, down: -1.0417 } },
    { kind: 'k', at: { across: 0, down: -3.125 } },
    { kind: 'r', at: { across: -20.8, down: 11.25 } },
    { kind: 'r', at: { across: -12, down: 11.25 } },
    { kind: 'r', at: { across: -3.7333, down: 11.25 } },
    { kind: 'r', at: { across: 5.3333, down: 11.25 } },
    { kind: 'r', at: { across: 12.8, down: 11.25 } },
    { kind: 'r', at: { across: 21.3333, down: 11.25 } },
    { kind: 'r', at: { across: -9.0667, down: 30.8333 } },
    { kind: 'r', at: { across: 10.6667, down: 32.0833 } },
  ],
  officials: [
    { mark: 'BJ', at: { across: 30.6667, down: 0 } },
    { mark: 'U', at: { across: -30.6667, down: 0 } },
    { mark: 'LJ', at: { across: 30.6667, down: 10 } },
    { mark: 'LM', at: { across: -30.6667, down: 10 } },
    { mark: 'R', at: { across: 0, down: 60 }, highlight: true },
  ],
  notes: [
    { text: "K's restraining line • free-kick line", at: { across: 0, down: -6.4583 } },
    { text: "R's restraining line", at: { across: 0, down: 8.75 } },
  ],
};

const ONSIDE_4 = {
  file: "kicking-plays/onside-crew-of-4.svg",
  view: 'kickoff',
  title: "Onside and short free kick, crew of 4",
  players: [
    { kind: 'k', at: { across: -22.9333, down: -1.0417 } },
    { kind: 'k', at: { across: -17.8667, down: -1.0417 } },
    { kind: 'k', at: { across: -12.8, down: -1.0417 } },
    { kind: 'k', at: { across: -7.7333, down: -1.0417 } },
    { kind: 'k', at: { across: -2.6667, down: -1.0417 } },
    { kind: 'k', at: { across: 2.4, down: -1.0417 } },
    { kind: 'k', at: { across: 7.4667, down: -1.0417 } },
    { kind: 'k', at: { across: 12.5333, down: -1.0417 } },
    { kind: 'k', at: { across: 17.6, down: -1.0417 } },
    { kind: 'k', at: { across: 22.6667, down: -1.0417 } },
    { kind: 'k', at: { across: 0, down: -3.125 } },
    { kind: 'r', at: { across: -20.8, down: 11.25 } },
    { kind: 'r', at: { across: -12, down: 11.25 } },
    { kind: 'r', at: { across: -3.7333, down: 11.25 } },
    { kind: 'r', at: { across: 5.3333, down: 11.25 } },
    { kind: 'r', at: { across: 12.8, down: 11.25 } },
    { kind: 'r', at: { across: 21.3333, down: 11.25 } },
    { kind: 'r', at: { across: -9.0667, down: 30.8333 } },
    { kind: 'r', at: { across: 10.6667, down: 32.0833 } },
  ],
  officials: [
    { mark: 'U', at: { across: -30.6667, down: 0 } },
    { mark: 'LJ', at: { across: 30.6667, down: 10 } },
    { mark: 'LM', at: { across: -30.6667, down: 10 } },
    { mark: 'R', at: { across: 0, down: 60 }, highlight: true },
  ],
  notes: [
    { text: "K's restraining line • free-kick line", at: { across: 0, down: -6.4583 } },
    { text: "R's restraining line", at: { across: 0, down: 8.75 } },
  ],
};

const PUNT_5 = {
  file: "kicking-plays/punt-crew-of-5.svg",
  ...highlighting(PUNT, 'R'),
  title: "Punt, crew of 5",
};

const PUNT_4 = {
  file: "kicking-plays/punt-crew-of-4.svg",
  view: 'punt',
  title: "Punt, crew of 4",
  players: [
    { kind: 'k', at: { across: -14.4, down: -1.1111 } },
    { kind: 'k', at: { across: -9.6, down: -1.1111 } },
    { kind: 'k', at: { across: -4.8, down: -1.1111 } },
    { kind: 'k', at: { across: 0, down: -1.1111 } },
    { kind: 'k', at: { across: 4.8, down: -1.1111 } },
    { kind: 'k', at: { across: 9.6, down: -1.1111 } },
    { kind: 'k', at: { across: 14.4, down: -1.1111 } },
    { kind: 'k', at: { across: -6.4, down: -5.3333 } },
    { kind: 'k', at: { across: 6.4, down: -5.3333 } },
    { kind: 'k', at: { across: 0, down: -14 } },
    { kind: 'r', at: { across: -13.8667, down: 1.3333 } },
    { kind: 'r', at: { across: -9.0667, down: 1.3333 } },
    { kind: 'r', at: { across: -4.2667, down: 1.3333 } },
    { kind: 'r', at: { across: 0.5333, down: 1.3333 } },
    { kind: 'r', at: { across: 5.3333, down: 1.3333 } },
    { kind: 'r', at: { across: 10.1333, down: 1.3333 } },
    { kind: 'r', at: { across: 14.9333, down: 1.3333 } },
    { kind: 'r', at: { across: -8, down: 16 } },
    { kind: 'r', at: { across: 9.0667, down: 18 } },
    { kind: 'r', at: { across: 1.6, down: 33 } },
  ],
  officials: [
    { mark: 'R', at: { across: 14.9333, down: -9.1111 }, highlight: true },
    { mark: 'LM', at: { across: -30.6667, down: 0 } },
    { mark: 'LJ', at: { across: 30.6667, down: 0 } },
    { mark: 'U', at: { across: -8.5333, down: 31 } },
  ],
  movements: [
    { points: [{ across: 14.9333, down: -6 }, { across: 11.7333, down: -2 }] },
  ],
  notes: [
    { text: "punter", at: { across: 0, down: -16 } },
    { text: "returner", at: { across: 5.8667, down: 33.8889 }, anchor: 'start' },
    { text: "U takes the 5-man BJ spot", at: { across: -9.0667, down: 27.4444 } },
  ],
};

const FIELD_GOAL_5 = {
  file: "kicking-plays/field-goal-crew-of-5.svg",
  ...highlighting(FIELD_GOAL, 'R'),
  title: "Field goal and try, crew of 5",
};

const FIELD_GOAL_4 = {
  file: "kicking-plays/field-goal-crew-of-4.svg",
  view: 'fieldGoal',
  title: "Field goal and try, crew of 4",
  players: [
    { kind: 'k', at: { across: -12.8, down: -0.7576 } },
    { kind: 'k', at: { across: -9.6, down: -0.7576 } },
    { kind: 'k', at: { across: -6.4, down: -0.7576 } },
    { kind: 'k', at: { across: -3.2, down: -0.7576 } },
    { kind: 'k', at: { across: 0, down: -0.7576 } },
    { kind: 'k', at: { across: 3.2, down: -0.7576 } },
    { kind: 'k', at: { across: 6.4, down: -0.7576 } },
    { kind: 'k', at: { across: 9.6, down: -0.7576 } },
    { kind: 'k', at: { across: 12.8, down: -0.7576 } },
    { kind: 'k', at: { across: 0, down: -7 } },
    { kind: 'k', at: { across: -4.2667, down: -9 } },
    { kind: 'r', at: { across: -12.8, down: 0.9091 } },
    { kind: 'r', at: { across: -9.6, down: 0.9091 } },
    { kind: 'r', at: { across: -6.4, down: 0.9091 } },
    { kind: 'r', at: { across: -3.2, down: 0.9091 } },
    { kind: 'r', at: { across: 0, down: 0.9091 } },
    { kind: 'r', at: { across: 3.2, down: 0.9091 } },
    { kind: 'r', at: { across: 6.4, down: 0.9091 } },
    { kind: 'r', at: { across: 9.6, down: 0.9091 } },
    { kind: 'r', at: { across: 12.8, down: 0.9091 } },
  ],
  officials: [
    { mark: 'R', at: { across: -13.8667, down: -12 }, highlight: true },
    { mark: 'LJ', at: { across: 17.6, down: 0 } },
    { mark: 'U', at: { across: -4, down: 10.7273 } },
    { mark: 'LM', at: { across: 4, down: 10.7273 } },
  ],
  movements: [
    { points: [{ across: -13.8667, down: -9.8788 }, { across: -10.6667, down: -9.9091 }] },
  ],
  notes: [
    { text: "holder", at: { across: 2.1333, down: -6.5455 }, anchor: 'start' },
    { text: "kicker", at: { across: -6.4, down: -8.5455 }, anchor: 'end' },
    { text: "plant-leg side", at: { across: -13.8667, down: -14.5758 } },
    { text: "the wing on your side releases to the end line", at: { across: 0, down: 16.0303 } },
  ],
};

export const diagrams = [KICKOFF_5, KICKOFF_4, ONSIDE_5, ONSIDE_4, PUNT_5, PUNT_4, FIELD_GOAL_5, FIELD_GOAL_4];
