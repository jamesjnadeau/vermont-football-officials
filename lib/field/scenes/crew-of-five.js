/**
 * The six crew-of-five plays every mechanics page draws.
 *
 * Each is the whole crew on the field for one phase, with nobody
 * highlighted. A position card renders the same scene with one official
 * marked as "you"; the crew card renders it as it stands. That is why these
 * live here rather than in either consumer: thirty position-card files and
 * six crew-card files are six scenes, and any other arrangement is the same
 * play stored six times and drifting.
 *
 * Coordinates are football units — yards across from the middle of the
 * field, yards down from the view's reference line. `lib/field/geometry.js`
 * is the only thing that turns them into SVG.
 */

export const RUN = {
  view: 'runPass',
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
    // §4.7, p. 139: the referee is on the QUARTERBACK'S PASSING-ARM SIDE,
    // 10-12 yards deep and at least as wide as the tight end — not 15 back
    // and 8 wide on the wide side. The back judge favours the strong side,
    // 20-25 beyond the line and deeper than the deepest defender; the frame
    // stops at 20, so the note carries the depth.
    { mark: 'R', at: { across: 12.5, down: -11 } },
    { mark: 'U', at: { across: 4.2667, down: 7 } },
    { mark: 'HL', at: { across: -24, down: 0 } },
    { mark: 'LJ', at: { across: 24, down: 0 } },
    { mark: 'BJ', at: { across: 5, down: 19 } },
  ],
  movements: [
    { points: [{ across: -3.2, down: -5.5 }, { across: 12.2667, down: 4.5, via: [{ across: 2.1333, down: -2 }, { across: 8, down: -1 }] }] },
    { points: [{ across: 12.5, down: -8.5 }, { across: 10, down: -5 }] },
    { points: [{ across: 4.2667, down: 5 }, { across: 8, down: 1.5 }] },
    { points: [{ across: 24, down: 2 }, { across: 22.4, down: 6.5 }] },
    { points: [{ across: -24, down: 2 }, { across: -16.5333, down: 8.5 }] },
  ],
  notes: [
    { text: "QB", at: { across: -2.4, down: -3.5 }, anchor: 'end' },
    { text: "RB", at: { across: -5.6, down: -6.5 }, anchor: 'end' },
    { text: "point of attack", at: { across: 10.6667, down: 9.5 } },
    { text: "clean up behind", at: { across: -14.9333, down: 10.5 }, anchor: 'start' },
    { text: "20–25 deep, strong side", at: { across: 3, down: 16.5 }, anchor: 'end' },
  ],
};

export const PASS = {
  view: 'runPass',
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
    { mark: 'R', at: { across: 12.5, down: -11 } },
    { mark: 'U', at: { across: 4.2667, down: 7 } },
    { mark: 'HL', at: { across: -24, down: 0 } },
    { mark: 'LJ', at: { across: 24, down: 0 } },
    { mark: 'BJ', at: { across: 5, down: 19 } },
  ],
  movements: [
    { points: [{ across: -24, down: 2 }, { across: -24, down: 5.5 }] },
    { points: [{ across: 24, down: 2 }, { across: 24, down: 5.5 }] },
  ],
  notes: [
    { text: "QB", at: { across: -2.4, down: -3.5 }, anchor: 'end' },
    { text: "RB", at: { across: -5.6, down: -6.5 }, anchor: 'end' },
    { text: "outside receivers", at: { across: -25.6, down: 8.5 }, anchor: 'start' },
    { text: "outside receivers", at: { across: 25.6, down: 11.5 }, anchor: 'end' },
    { text: "inside receivers,", at: { across: -4.2667, down: 16.5 }, anchor: 'end' },
    { text: "back off slowly", at: { across: -4.2667, down: 19 }, anchor: 'end' },
    { text: "10-yard buffer if he rolls", at: { across: 1, down: -14.5 } },
  ],
};

export const GOAL_LINE = {
  view: 'goalLine',
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
    { mark: 'R', at: { across: 12.5, down: -11 } },
    { mark: 'U', at: { across: 8, down: 7 } },
    { mark: 'HL', at: { across: -29.0667, down: 10 } },
    { mark: 'LJ', at: { across: 29.0667, down: 10 } },
    { mark: 'BJ', at: { across: 0, down: 17.1429 } },
  ],
  notes: [
    { text: "BJ on the end line, between the uprights", at: { across: 0, down: 25.9524 } },
    { text: "wings on the goal line, 2 yds outside", at: { across: 0, down: 23.3333 } },
  ],
};

export const KICKOFF = {
  view: 'kickoff',
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
    // The umpire is outside the sideline "on the side opposite the chains"
    // (§4.7, p. 136) and the chains are opposite the press box (§1.6, p. 25),
    // which puts him on the press box side and the back judge on the head
    // line judge's. The MechaniGram on p. 137 shows the same.
    { mark: 'BJ', at: { across: -30.6667, down: 0 } },
    { mark: 'U', at: { across: 30.6667, down: 10 } },
    { mark: 'R', at: { across: 1.0667, down: 60 } },
    { mark: 'HL', at: { across: -30.6667, down: 60 } },
    { mark: 'LJ', at: { across: 30.6667, down: 60 } },
  ],
  movements: [
    { points: [{ across: 1.0667, down: 57.0833 }, { across: 1.0667, down: 41.25 }] },
  ],
  notes: [
    { text: "K's restraining line • free-kick line", at: { across: 0, down: -6.4583 } },
    { text: "R's restraining line", at: { across: 0, down: 8.75 } },
    { text: "after the catch", at: { across: 1.0667, down: 39.5833 } },
  ],
};

export const PUNT = {
  view: 'punt',
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
    // §4.7, p. 140. The referee is behind the kicker on the kicking-leg side,
    // not in front of him; the umpire favours the line judge's sideline
    // because the line judge releases at the snap and someone has to cover
    // for it; the back judge is 10-12 wider than and 2-3 behind the deepest
    // receiver, on the head line judge's side.
    { mark: 'R', at: { across: 5, down: -16.5 } },
    { mark: 'U', at: { across: 9.6, down: 6 } },
    { mark: 'HL', at: { across: -30.6667, down: 0 } },
    { mark: 'LJ', at: { across: 30.6667, down: 0 } },
    { mark: 'BJ', at: { across: -9.4, down: 35.5 } },
  ],
  movements: [
    { points: [{ across: 5, down: -13.5 }, { across: 7, down: -5 }] },
    // §4.8, p. 149: the line judge releases on the snap, the head line judge
    // stays on the line until the kick crosses the neutral zone.
    { points: [{ across: 30.6667, down: 3 }, { across: 28.5, down: 14 }] },
  ],
  notes: [
    { text: "punter", at: { across: -4, down: -13.6 }, anchor: 'end' },
    { text: "returner", at: { across: 5.8667, down: 33.8889 }, anchor: 'start' },
    { text: "releases at the snap", at: { across: 22, down: 17.5 }, anchor: 'end' },
    { text: "holds the line until the kick crosses", at: { across: -26, down: 4.6 }, anchor: 'start' },
  ],
};

export const FIELD_GOAL = {
  view: 'fieldGoal',
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
    // §4.7, p. 141 and the MechaniGram on the same page: the referee is 2-3
    // yards to the rear and 3-5 to the side of the kicker facing the holder;
    // the wings straddle the line of scrimmage on their sidelines; the umpire
    // and back judge are BEYOND the end line, each behind his own upright,
    // the umpire on the press box side and the back judge opposite.
    { mark: 'R', at: { across: -10, down: -11.5 } },
    { mark: 'HL', at: { across: -24, down: 0 } },
    { mark: 'LJ', at: { across: 24, down: 0 } },
    { mark: 'BJ', at: { across: -3.8889, down: 13.6 } },
    { mark: 'U', at: { across: 3.8889, down: 13.6 } },
  ],
  notes: [
    { text: "holder", at: { across: 2.1333, down: -6.5455 }, anchor: 'start' },
    { text: "kicker", at: { across: -2.6, down: -9.6 }, anchor: 'start' },
    { text: "facing the holder", at: { across: -10, down: -14.2 } },
    { text: "beyond the end line, behind your own upright", at: { across: 0, down: 16.0303 } },
  ],
};

/**
 * The same play with one official wearing the halo.
 *
 * Both consumers need this and neither owns it: a position card highlights
 * whoever's card it is, and a crew card highlights the Referee, because the
 * cards tell their reader "the white marker is the Referee". Doing it here
 * keeps the base scenes free of any one page's idea of who "you" is.
 */
export function highlighting(scene, mark) {
  return {
    ...scene,
    officials: scene.officials.map((o) => (o.mark === mark ? { ...o, highlight: true } : o)),
  };
}
