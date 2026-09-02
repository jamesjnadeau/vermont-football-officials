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
    // §3.7, p. 67. The referee starts near the top of the numbers at R's 5 or
    // 10 on the line judge's side; the head line judge is on K's free-kick
    // line and moves toward the middle once the players are on; the line
    // judge is on R's free-kick line at the top of the numbers; the umpire is
    // on the sideline at R's 20.
    { mark: 'HL', at: { across: -30.6667, down: 0 } },
    { mark: 'LJ', at: { across: 30.6667, down: 10 } },
    { mark: 'U', at: { across: -30.6667, down: 40 } },
    { mark: 'R', at: { across: 17.6, down: 50 }, highlight: true },
  ],
  movements: [
    // Both wings start on their sidelines and come in: the head line judge
    // toward the middle once the players are on, the line judge to the top of
    // the numbers.
    { points: [{ across: -27.5, down: 0 }, { across: -14, down: 0 }] },
    { points: [{ across: 27.5, down: 10 }, { across: 18.5, down: 10 }] },
    { points: [{ across: 14, down: 47.0833 }, { across: 14, down: 31.25 }] },
  ],
  notes: [
    { text: "K's restraining line • free-kick line", at: { across: 0, down: -6.4583 } },
    { text: "R's restraining line", at: { across: -8, down: 8.75 } },
    { text: "after the catch", at: { across: 12, down: 29.1667 } },
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
    // §4.7, p. 138: two officials on each restraining line, one per sideline.
    // The umpire is on the line judge's side of R's free-kick line; the back
    // judge on the head line judge's side of K's.
    { mark: 'BJ', at: { across: -30.6667, down: 0 } },
    { mark: 'LJ', at: { across: 30.6667, down: 0 } },
    { mark: 'U', at: { across: 30.6667, down: 10 } },
    { mark: 'HL', at: { across: -30.6667, down: 10 } },
    // Deeper than the deepest receiver, not on the goal line.
    { mark: 'R', at: { across: 0, down: 42 }, highlight: true },
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
    // §3.7, p. 68: the wings keep their regular free-kick positions — head
    // line judge on K's line, line judge on R's — while the referee comes up
    // to about R's 10 and the umpire moves to R's free-kick line.
    { mark: 'HL', at: { across: -30.6667, down: 0 } },
    { mark: 'U', at: { across: -30.6667, down: 10 } },
    { mark: 'LJ', at: { across: 30.6667, down: 10 } },
    { mark: 'R', at: { across: 0, down: 50 }, highlight: true },
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
    // §3.7, p. 72. The deep official in a crew of four is the LINE JUDGE —
    // 7 to 10 yards wider than and in front of the deepest receiver — not the
    // umpire, who stays 10 yards deep favouring the line judge's sideline.
    { mark: 'R', at: { across: 4, down: -16.5 }, highlight: true },
    { mark: 'HL', at: { across: -30.6667, down: 0 } },
    { mark: 'U', at: { across: 6, down: 10 } },
    { mark: 'LJ', at: { across: 10.1, down: 30 } },
  ],
  movements: [
    { points: [{ across: 4, down: -13.5 }, { across: 6, down: -5 }] },
  ],
  notes: [
    { text: "punter", at: { across: -4, down: -13.6 }, anchor: 'end' },
    { text: "returner", at: { across: 5.8667, down: 33.8889 }, anchor: 'start' },
    { text: "LJ has all the deep receivers", at: { across: -22, down: 26 }, anchor: 'start' },
    { text: "holds the line until the kick crosses", at: { across: -26, down: 4.6 }, anchor: 'start' },
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
    // §3.7, p. 74 — the snap is on or inside R's 15, which is the case this
    // crop shows. The LINE JUDGE starts on the line 5-7 yards outside the
    // offensive end and moves hard to the end line at the snap to rule the
    // crossbar; the referee rules whether it went through the uprights. The
    // umpire is 10 yards off the line favouring the line judge's side, the
    // head line judge on the line not closer than 9 yards outside the widest
    // offensive player.
    { mark: 'R', at: { across: -9, down: -10.5 }, highlight: true },
    { mark: 'HL', at: { across: -24, down: 0 } },
    { mark: 'LJ', at: { across: 19, down: 0 } },
    { mark: 'U', at: { across: 6, down: 10 } },
  ],
  movements: [
    { points: [{ across: 19, down: 2 }, { across: 11, down: 12 }] },
  ],
  notes: [
    { text: "holder", at: { across: 2.1333, down: -6.5455 }, anchor: 'start' },
    { text: "kicker", at: { across: -2.6, down: -9.6 }, anchor: 'start' },
    { text: "facing the holder", at: { across: -9, down: -13.2 } },
    { text: "LJ to the end line — crossbar", at: { across: 0, down: 16.0303 } },
  ],
};

export const diagrams = [KICKOFF_5, KICKOFF_4, ONSIDE_5, ONSIDE_4, PUNT_5, PUNT_4, FIELD_GOAL_5, FIELD_GOAL_4];
