/**
 * The run-and-pass crew card: initial positions, then the run, the pass and
 * the goal line, for crews of five and four.
 */
import { RUN, PASS, GOAL_LINE , highlighting } from './crew-of-five.js';

const EVERY_DOWN_5 = {
  file: "run-pass-plays/every-down-crew-of-5.svg",
  view: 'runPass',
  title: "Every down initial positions, crew of 5",
  players: [
    { kind: 'k', at: { across: -7.4667, down: -1 } },
    { kind: 'k', at: { across: -3.7333, down: -1 } },
    { kind: 'k', at: { across: 0, down: -1 } },
    { kind: 'k', at: { across: 3.7333, down: -1 } },
    { kind: 'k', at: { across: 7.4667, down: -1 } },
    { kind: 'k', at: { across: 11.2, down: -1 } },
    { kind: 'k', at: { across: -19.2, down: -1 } },
    { kind: 'k', at: { across: 17.0667, down: -2.25 } },
    { kind: 'k', at: { across: 0, down: -4 } },
    { kind: 'k', at: { across: -3.2, down: -7 } },
    { kind: 'r', at: { across: -5.6, down: 1.25 } },
    { kind: 'r', at: { across: -1.8667, down: 1.25 } },
    { kind: 'r', at: { across: 1.8667, down: 1.25 } },
    { kind: 'r', at: { across: 5.6, down: 1.25 } },
    { kind: 'r', at: { across: -10.6667, down: 5.5 } },
    { kind: 'r', at: { across: -1.6, down: 5.5 } },
    { kind: 'r', at: { across: 10.6667, down: 5.5 } },
    { kind: 'r', at: { across: -18.6667, down: 6 } },
    { kind: 'r', at: { across: 16.5333, down: 6 } },
    { kind: 'r', at: { across: -5.3333, down: 11.5 } },
    { kind: 'r', at: { across: 9.0667, down: 13 } },
  ],
  officials: [
    { mark: 'R', at: { across: 9.0667, down: -15 }, highlight: true },
    { mark: 'U', at: { across: 4.2667, down: 7 } },
    { mark: 'HL', at: { across: -24, down: 0 } },
    { mark: 'LJ', at: { across: 24, down: 0 } },
    { mark: 'BJ', at: { across: 0, down: 17 } },
  ],
  notes: [
    { text: "QB", at: { across: -2.4, down: -3.5 }, anchor: 'end' },
    { text: "RB", at: { across: -5.6, down: -6.5 }, anchor: 'end' },
    { text: "wide side · 15 back, 8 wide", at: { across: 9.0667, down: -18.5 } },
    { text: "7 off the line", at: { across: -7.4667, down: 7.75 }, anchor: 'end' },
    { text: "17 off the line", at: { across: 14.4, down: 17.75 }, anchor: 'start' },
  ],
};

const EVERY_DOWN_4 = {
  file: "run-pass-plays/every-down-crew-of-4.svg",
  view: 'runPass',
  title: "Every down initial positions, crew of 4",
  players: [
    { kind: 'k', at: { across: -7.4667, down: -1 } },
    { kind: 'k', at: { across: -3.7333, down: -1 } },
    { kind: 'k', at: { across: 0, down: -1 } },
    { kind: 'k', at: { across: 3.7333, down: -1 } },
    { kind: 'k', at: { across: 7.4667, down: -1 } },
    { kind: 'k', at: { across: 11.2, down: -1 } },
    { kind: 'k', at: { across: -19.2, down: -1 } },
    { kind: 'k', at: { across: 17.0667, down: -2.25 } },
    { kind: 'k', at: { across: 0, down: -4 } },
    { kind: 'k', at: { across: -3.2, down: -7 } },
    { kind: 'r', at: { across: -5.6, down: 1.25 } },
    { kind: 'r', at: { across: -1.8667, down: 1.25 } },
    { kind: 'r', at: { across: 1.8667, down: 1.25 } },
    { kind: 'r', at: { across: 5.6, down: 1.25 } },
    { kind: 'r', at: { across: -10.6667, down: 5.5 } },
    { kind: 'r', at: { across: -1.6, down: 5.5 } },
    { kind: 'r', at: { across: 10.6667, down: 5.5 } },
    { kind: 'r', at: { across: -18.6667, down: 6 } },
    { kind: 'r', at: { across: 16.5333, down: 6 } },
    { kind: 'r', at: { across: -5.3333, down: 11.5 } },
    { kind: 'r', at: { across: 9.0667, down: 13 } },
  ],
  officials: [
    { mark: 'R', at: { across: 9.0667, down: -15 }, highlight: true },
    { mark: 'U', at: { across: 4.2667, down: 7 } },
    { mark: 'HL', at: { across: -24, down: 0 } },
    { mark: 'LJ', at: { across: 24, down: 0 } },
  ],
  notes: [
    { text: "QB", at: { across: -2.4, down: -3.5 }, anchor: 'end' },
    { text: "RB", at: { across: -5.6, down: -6.5 }, anchor: 'end' },
    { text: "wide side · 15 back, 8 wide", at: { across: 9.0667, down: -18.5 } },
    { text: "7 off the line", at: { across: -7.4667, down: 7.75 }, anchor: 'end' },
    { text: "no deep official — wings and U cover", at: { across: 0, down: 18 } },
  ],
};

const RUNNING_5 = {
  file: "run-pass-plays/running-crew-of-5.svg",
  ...highlighting(RUN, 'R'),
  title: "Running plays, crew of 5",
};

const RUNNING_4 = {
  file: "run-pass-plays/running-crew-of-4.svg",
  view: 'runPass',
  title: "Running plays, crew of 4",
  players: [
    { kind: 'k', at: { across: -7.4667, down: -1 } },
    { kind: 'k', at: { across: -3.7333, down: -1 } },
    { kind: 'k', at: { across: 0, down: -1 } },
    { kind: 'k', at: { across: 3.7333, down: -1 } },
    { kind: 'k', at: { across: 7.4667, down: -1 } },
    { kind: 'k', at: { across: 11.2, down: -1 } },
    { kind: 'k', at: { across: -19.2, down: -1 } },
    { kind: 'k', at: { across: 17.0667, down: -2.25 } },
    { kind: 'k', at: { across: 0, down: -4 } },
    { kind: 'k', at: { across: -3.2, down: -7 } },
    { kind: 'r', at: { across: -5.6, down: 1.25 } },
    { kind: 'r', at: { across: -1.8667, down: 1.25 } },
    { kind: 'r', at: { across: 1.8667, down: 1.25 } },
    { kind: 'r', at: { across: 5.6, down: 1.25 } },
    { kind: 'r', at: { across: -10.6667, down: 5.5 } },
    { kind: 'r', at: { across: -1.6, down: 5.5 } },
    { kind: 'r', at: { across: 10.6667, down: 5.5 } },
    { kind: 'r', at: { across: -18.6667, down: 6 } },
    { kind: 'r', at: { across: 16.5333, down: 6 } },
    { kind: 'r', at: { across: -5.3333, down: 11.5 } },
    { kind: 'r', at: { across: 9.0667, down: 13 } },
  ],
  officials: [
    { mark: 'R', at: { across: 9.0667, down: -15 }, highlight: true },
    { mark: 'U', at: { across: 4.2667, down: 7 } },
    { mark: 'HL', at: { across: -24, down: 0 } },
    { mark: 'LJ', at: { across: 24, down: 0 } },
  ],
  movements: [
    { points: [{ across: -3.2, down: -5.5 }, { across: 12.2667, down: 4.5, via: [{ across: 2.1333, down: -2 }, { across: 8, down: -1 }] }] },
    { points: [{ across: 9.0667, down: -12 }, { across: 8, down: -8 }] },
    { points: [{ across: 4.2667, down: 5 }, { across: 8, down: 1.5 }] },
    { points: [{ across: 24, down: 2 }, { across: 22.4, down: 6.5 }] },
    { points: [{ across: -24, down: 2 }, { across: -16.5333, down: 8.5 }] },
  ],
  notes: [
    { text: "QB", at: { across: -2.4, down: -3.5 }, anchor: 'end' },
    { text: "RB", at: { across: -5.6, down: -6.5 }, anchor: 'end' },
    { text: "point of attack", at: { across: 10.6667, down: 9.5 } },
    { text: "clean up behind", at: { across: -14.9333, down: 10.5 }, anchor: 'start' },
  ],
};

const PASSING_5 = {
  file: "run-pass-plays/passing-crew-of-5.svg",
  ...highlighting(PASS, 'R'),
  title: "Passing plays, crew of 5",
};

const PASSING_4 = {
  file: "run-pass-plays/passing-crew-of-4.svg",
  view: 'runPass',
  title: "Passing plays, crew of 4",
  players: [
    { kind: 'k', at: { across: -7.4667, down: -1 } },
    { kind: 'k', at: { across: -3.7333, down: -1 } },
    { kind: 'k', at: { across: 0, down: -1 } },
    { kind: 'k', at: { across: 3.7333, down: -1 } },
    { kind: 'k', at: { across: 7.4667, down: -1 } },
    { kind: 'k', at: { across: 11.2, down: -1 } },
    { kind: 'k', at: { across: -19.2, down: -1 } },
    { kind: 'k', at: { across: 17.0667, down: -2.25 } },
    { kind: 'k', at: { across: 0, down: -4 } },
    { kind: 'k', at: { across: -3.2, down: -7 } },
    { kind: 'r', at: { across: -5.6, down: 1.25 } },
    { kind: 'r', at: { across: -1.8667, down: 1.25 } },
    { kind: 'r', at: { across: 1.8667, down: 1.25 } },
    { kind: 'r', at: { across: 5.6, down: 1.25 } },
    { kind: 'r', at: { across: -10.6667, down: 5.5 } },
    { kind: 'r', at: { across: -1.6, down: 5.5 } },
    { kind: 'r', at: { across: 10.6667, down: 5.5 } },
    { kind: 'r', at: { across: -18.6667, down: 6 } },
    { kind: 'r', at: { across: 16.5333, down: 6 } },
    { kind: 'r', at: { across: -5.3333, down: 11.5 } },
    { kind: 'r', at: { across: 9.0667, down: 13 } },
  ],
  officials: [
    { mark: 'R', at: { across: 9.0667, down: -15 }, highlight: true },
    { mark: 'U', at: { across: 4.2667, down: 7 } },
    { mark: 'HL', at: { across: -24, down: 0 } },
    { mark: 'LJ', at: { across: 24, down: 0 } },
  ],
  movements: [
    { points: [{ across: -24, down: 2 }, { across: -24, down: 5.5 }] },
    { points: [{ across: 24, down: 2 }, { across: 24, down: 5.5 }] },
    { points: [{ across: -13.8667, down: 12 }, { across: 13.8667, down: 12, via: [{ across: 0, down: 17 }] }], arrow: false },
  ],
  notes: [
    { text: "QB", at: { across: -2.4, down: -3.5 }, anchor: 'end' },
    { text: "RB", at: { across: -5.6, down: -6.5 }, anchor: 'end' },
    { text: "every receiver", at: { across: -25.6, down: 8.5 }, anchor: 'start' },
    { text: "on your side", at: { across: -25.6, down: 11 }, anchor: 'start' },
    { text: "every receiver", at: { across: 25.6, down: 8.5 }, anchor: 'end' },
    { text: "on your side", at: { across: 25.6, down: 11 }, anchor: 'end' },
    { text: "middle is shared — dual coverage", at: { across: 0, down: 19.5 } },
    { text: "5-yard cushion on the passer", at: { across: 9.0667, down: -18.5 } },
  ],
};

const GOAL_LINE_5 = {
  file: "run-pass-plays/goal-line-crew-of-5.svg",
  ...highlighting(GOAL_LINE, 'R'),
  title: "Goal line, crew of 5",
};

const GOAL_LINE_4 = {
  file: "run-pass-plays/goal-line-crew-of-4.svg",
  view: 'goalLine',
  title: "Goal line, crew of 4",
  players: [
    { kind: 'k', at: { across: -6.4, down: -0.9524 } },
    { kind: 'k', at: { across: -3.2, down: -0.9524 } },
    { kind: 'k', at: { across: 0, down: -0.9524 } },
    { kind: 'k', at: { across: 3.2, down: -0.9524 } },
    { kind: 'k', at: { across: 6.4, down: -0.9524 } },
    { kind: 'k', at: { across: 9.6, down: -0.9524 } },
    { kind: 'k', at: { across: -15.4667, down: -0.9524 } },
    { kind: 'k', at: { across: 0, down: -4.2857 } },
    { kind: 'k', at: { across: -3.7333, down: -7.1429 } },
    { kind: 'r', at: { across: -4.8, down: 1.1905 } },
    { kind: 'r', at: { across: -1.6, down: 1.1905 } },
    { kind: 'r', at: { across: 1.6, down: 1.1905 } },
    { kind: 'r', at: { across: 4.8, down: 1.1905 } },
    { kind: 'r', at: { across: -9.0667, down: 4.7619 } },
    { kind: 'r', at: { across: 9.0667, down: 4.7619 } },
    { kind: 'r', at: { across: -14.9333, down: 5.7143 } },
    { kind: 'r', at: { across: 13.8667, down: 5.7143 } },
  ],
  officials: [
    { mark: 'R', at: { across: 8, down: -15 }, highlight: true },
    { mark: 'U', at: { across: 8, down: 7 } },
    { mark: 'HL', at: { across: -29.0667, down: 10 } },
    { mark: 'LJ', at: { across: 29.0667, down: 10 } },
  ],
  movements: [
    { points: [{ across: -29.0667, down: 12.8571 }, { across: -22.9333, down: 16.6667 }] },
    { points: [{ across: 29.0667, down: 12.8571 }, { across: 22.9333, down: 16.6667 }] },
  ],
  notes: [
    { text: "no BJ — wings step into the end zone", at: { across: 0, down: 23.3333 } },
  ],
};

export const diagrams = [EVERY_DOWN_5, EVERY_DOWN_4, RUNNING_5, RUNNING_4, PASSING_5, PASSING_4, GOAL_LINE_5, GOAL_LINE_4];
