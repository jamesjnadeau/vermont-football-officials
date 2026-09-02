/**
 * Crew of seven, from Part 5 of the 2026 and 2027 NFHS Football Game Officials
 * Manual (pp. 183–216).
 *
 * These replace seven JPEG screenshots taken from the VFOA's 2022 slide deck.
 * Positions come from §5.7 Positioning and the MechaniGrams on pp. 205–212,
 * read for geometry only — the artwork is copyright Referee Enterprises and is
 * neither reproduced nor traced.
 *
 * **Reading the manual's diagrams into this coordinate system.** The manual
 * draws the press box on the LEFT; this site draws it on the RIGHT (positive
 * `across`). Every side in a MechaniGram is therefore mirrored on its way in.
 * What survives the mirror is who pairs with whom, and that is what the prose
 * states independently: the umpire works the side opposite the press box and
 * the back judge the press box side (§5.7, p. 205); the field judge is on the
 * line judge's side and the side judge on the head line judge's.
 *
 * Vermont crews work four and five. This exists because the association has a
 * 7-man deck and officials working out of state ask about it.
 */
import { KICKOFF, PUNT } from './crew-of-five.js';

// The sideline, as every other scene on the site draws an official standing on
// it: a little outside, so the disc reads against the turf rather than on the
// line itself.
const OUT = 30.6667;
// A wing straddling the line of scrimmage, drawn inside the frame's labels.
const WING = 24;
// The uprights, from `goalPostsX()` in football units.
const UPRIGHT = 70 / 9 / 2;

// ---------------------------------------------------------------------------
// Free kicks
// ---------------------------------------------------------------------------

const FREE_KICK = {
  file: '7-man-mechanics/free-kick.svg',
  view: 'kickoff',
  title: 'Free kick, crew of 7',
  players: KICKOFF.players,
  officials: [
    // §5.7, p. 205. R centre of the field on the goal line; the wings at their
    // own pylons on it; SJ and FJ on R's restraining line; U and BJ on K's,
    // U opposite the press box and BJ on it.
    { mark: 'U', at: { across: -OUT, down: 0 } },
    { mark: 'BJ', at: { across: OUT, down: 0 } },
    { mark: 'SJ', at: { across: -OUT, down: 10 } },
    { mark: 'FJ', at: { across: OUT, down: 10 } },
    { mark: 'R', at: { across: 0, down: 60 } },
    { mark: 'HL', at: { across: -OUT, down: 60 } },
    { mark: 'LJ', at: { across: OUT, down: 60 } },
  ],
  notes: [
    { text: "K's restraining line • free-kick line", at: { across: 0, down: -6.4583 } },
    { text: "R's restraining line", at: { across: 0, down: 8.75 } },
    { text: 'wings at their own pylon', at: { across: 0, down: 64.5 } },
  ],
};

const ONSIDE_KICK = {
  file: '7-man-mechanics/onside-kick.svg',
  view: 'kickoff',
  title: 'Onside kick, crew of 7',
  players: KICKOFF.players.filter((p) => p.at.down < 35),
  officials: [
    // §5.7, p. 207. Three lines: U and BJ on K's restraining line, the wings
    // up on K's 45, SJ and FJ on R's restraining line. Nobody moves until the
    // ball passes R's line or is recovered.
    { mark: 'U', at: { across: -OUT, down: 0 } },
    { mark: 'BJ', at: { across: OUT, down: 0 } },
    { mark: 'HL', at: { across: -OUT, down: 5 } },
    { mark: 'LJ', at: { across: OUT, down: 5 } },
    { mark: 'SJ', at: { across: -OUT, down: 10 } },
    { mark: 'FJ', at: { across: OUT, down: 10 } },
    { mark: 'R', at: { across: -2, down: 44 } },
  ],
  notes: [
    { text: "K's line — a true line, unbroken", at: { across: 0, down: -6.4583 } },
    { text: "K's 45 — wings rule early blocks", at: { across: 0, down: 3 } },
    { text: "R's line — SJ and FJ rule ten yards", at: { across: 0, down: 13.4 } },
    { text: 'deeper than the deepest receiver', at: { across: -2, down: 48.5 } },
  ],
};

// ---------------------------------------------------------------------------
// Scrimmage plays
// ---------------------------------------------------------------------------

// A balanced formation: split end and flanker to the line judge's side, tight
// end and flanker to the head line judge's. Strength in a balanced formation
// is always declared to the line judge's side (§5.3, p. 187).
const BALANCED = [
  { kind: 'k', at: { across: -7.5, down: -1 } },
  { kind: 'k', at: { across: -3.7, down: -1 } },
  { kind: 'k', at: { across: 0, down: -1 } },
  { kind: 'k', at: { across: 3.7, down: -1 } },
  { kind: 'k', at: { across: 7.5, down: -1 } },
  { kind: 'k', at: { across: -11.2, down: -1 } },
  { kind: 'k', at: { across: 19, down: -1 } },
  { kind: 'k', at: { across: 12.5, down: -3 } },
  { kind: 'k', at: { across: -18, down: -3 } },
  { kind: 'k', at: { across: 0, down: -4.5 } },
  { kind: 'k', at: { across: -2.5, down: -8 } },
  { kind: 'r', at: { across: -9, down: 1.5 } },
  { kind: 'r', at: { across: -4.5, down: 1.5 } },
  { kind: 'r', at: { across: 0, down: 1.5 } },
  { kind: 'r', at: { across: 4.5, down: 1.5 } },
  { kind: 'r', at: { across: 9, down: 1.5 } },
  { kind: 'r', at: { across: -6, down: 6 } },
  { kind: 'r', at: { across: 6, down: 6 } },
  { kind: 'r', at: { across: -16, down: 8 } },
  { kind: 'r', at: { across: 17, down: 8 } },
  { kind: 'r', at: { across: -3, down: 15.5 } },
];

const SCRIMMAGE = {
  file: '7-man-mechanics/scrimmage-play.svg',
  view: 'scrimmage7',
  title: 'Scrimmage play, crew of 7',
  players: BALANCED,
  officials: [
    // §5.7, p. 209.
    { mark: 'R', at: { across: 13, down: -14 } },
    { mark: 'U', at: { across: -2, down: 7 } },
    { mark: 'HL', at: { across: -WING, down: 0 } },
    { mark: 'LJ', at: { across: WING, down: 0 } },
    { mark: 'SJ', at: { across: -WING, down: 21 } },
    { mark: 'FJ', at: { across: WING, down: 21 } },
    { mark: 'BJ', at: { across: 1, down: 27 } },
  ],
  notes: [
    { text: '13–15 deep, passing-arm side', at: { across: -7, down: -15.5 } },
    { text: 'U: 5–10 deep, inside the tackle', at: { across: 0, down: 11.5 } },
    { text: '20–22 deep', at: { across: -WING + 4, down: 24 }, anchor: 'start' },
    { text: '25–30 deep', at: { across: 7, down: 30 }, anchor: 'start' },
  ],
};

// ---------------------------------------------------------------------------
// Kicks from scrimmage
// ---------------------------------------------------------------------------

// The crew-of-five punt formation with the returner brought in, because a
// crew of seven puts three officials behind him and the frame ends at R's
// goal line.
const PUNT_PLAYERS = PUNT.players.map((p) =>
  p.kind === 'r' && p.at.down > 30 ? { ...p, at: { across: p.at.across, down: 21 } } : p,
);

const SCRIMMAGE_KICK = {
  file: '7-man-mechanics/scrimmage-kick.svg',
  view: 'punt',
  title: 'Scrimmage kick, crew of 7',
  players: PUNT_PLAYERS,
  officials: [
    // §5.7, p. 210.
    { mark: 'R', at: { across: 15, down: -15.5 } },
    { mark: 'U', at: { across: -3, down: 10 } },
    { mark: 'HL', at: { across: -OUT, down: 0 } },
    { mark: 'LJ', at: { across: OUT, down: 0 } },
    { mark: 'SJ', at: { across: -WING, down: 31 } },
    { mark: 'FJ', at: { across: WING, down: 31 } },
    { mark: 'BJ', at: { across: 2, down: 30 } },
  ],
  notes: [
    { text: 'punter', at: { across: -4, down: -13.6 }, anchor: 'end' },
    { text: '3 behind, wider than the TE', at: { across: 8, down: -18.4 } },
    { text: '10 deep', at: { across: -7, down: 11.5 }, anchor: 'end' },
    { text: 'returner', at: { across: 5, down: 21.8 }, anchor: 'start' },
    { text: 'BJ between the hashes, 8–10 deeper', at: { across: 0, down: 35.5 } },
    { text: 'SJ and FJ 10 behind the receiver', at: { across: 0, down: 37.5 } },
    { text: 'hold the line until the kick crosses', at: { across: -26, down: 4.6 }, anchor: 'start' },
  ],
};

const SCORING_KICK = {
  file: '7-man-mechanics/scoring-kick.svg',
  view: 'scoringKick7',
  title: 'Scoring kick, crew of 7',
  players: [
    { kind: 'k', at: { across: -12.8, down: -0.8 } },
    { kind: 'k', at: { across: -9.6, down: -0.8 } },
    { kind: 'k', at: { across: -6.4, down: -0.8 } },
    { kind: 'k', at: { across: -3.2, down: -0.8 } },
    { kind: 'k', at: { across: 0, down: -0.8 } },
    { kind: 'k', at: { across: 3.2, down: -0.8 } },
    { kind: 'k', at: { across: 6.4, down: -0.8 } },
    { kind: 'k', at: { across: 9.6, down: -0.8 } },
    { kind: 'k', at: { across: 12.8, down: -0.8 } },
    { kind: 'k', at: { across: 0, down: -7 } },
    { kind: 'k', at: { across: -4.3, down: -9 } },
    { kind: 'r', at: { across: -12.8, down: 0.9 } },
    { kind: 'r', at: { across: -9.6, down: 0.9 } },
    { kind: 'r', at: { across: -6.4, down: 0.9 } },
    { kind: 'r', at: { across: -3.2, down: 0.9 } },
    { kind: 'r', at: { across: 0, down: 0.9 } },
    { kind: 'r', at: { across: 3.2, down: 0.9 } },
    { kind: 'r', at: { across: 6.4, down: 0.9 } },
    { kind: 'r', at: { across: 9.6, down: 0.9 } },
    { kind: 'r', at: { across: 12.8, down: 0.9 } },
  ],
  officials: [
    // §5.7, p. 212. FJ and BJ under the goal post; SJ works as a second
    // umpire on the defensive strength side; everyone else takes their
    // regular position.
    { mark: 'R', at: { across: -9, down: -10.5 } },
    { mark: 'U', at: { across: 5, down: 6 } },
    { mark: 'SJ', at: { across: -7, down: 6 } },
    { mark: 'HL', at: { across: -WING, down: 0 } },
    { mark: 'LJ', at: { across: WING, down: 0 } },
    { mark: 'BJ', at: { across: -UPRIGHT, down: 26.2 } },
    { mark: 'FJ', at: { across: UPRIGHT, down: 26.2 } },
  ],
  notes: [
    { text: 'holder', at: { across: 2.1, down: -6.5 }, anchor: 'start' },
    { text: 'kicker', at: { across: -2.6, down: -9.6 }, anchor: 'start' },
    { text: 'facing the holder', at: { across: -9, down: -13.2 } },
    { text: 'SJ works as a second umpire', at: { across: -7, down: 9 } },
    { text: 'FJ and BJ rule the kick', at: { across: 0, down: 29.6 } },
    { text: 'BJ has the crossbar', at: { across: 0, down: 31.5 } },
  ],
};

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

/**
 * A keying diagram: the same formation each time, with a dotted line from
 * each official to the player he keys. The lines carry no arrowhead — a key
 * is an assignment, not a movement, and an arrow would read as one.
 */
function keys(file, title, formation, assignments, notes = []) {
  const officials = [
    { mark: 'R', at: { across: 13, down: -14 } },
    { mark: 'U', at: { across: -2, down: 7 } },
    { mark: 'HL', at: { across: -WING, down: 0 } },
    { mark: 'LJ', at: { across: WING, down: 0 } },
    { mark: 'SJ', at: { across: -WING, down: 21 } },
    { mark: 'FJ', at: { across: WING, down: 21 } },
    { mark: 'BJ', at: { across: 1, down: 27 } },
  ];
  const at = (mark) => officials.find((o) => o.mark === mark).at;
  return {
    file: `7-man-mechanics/${file}.svg`,
    view: 'scrimmage7',
    title,
    players: formation,
    officials,
    movements: assignments.map(([mark, target]) => ({
      points: [at(mark), target],
      arrow: false,
    })),
    notes,
  };
}

// Balanced, strength declared to the line judge's side (§5.3, p. 187).
const SE_LJ = { across: 19, down: -1 };
const FL_LJ = { across: 12.5, down: -3 };
const TE_HL = { across: -11.2, down: -1 };
const FL_HL = { across: -18, down: -3 };
const BACK = { across: -2.5, down: -8 };

const KEYS_BALANCED = keys(
  'keys-balanced',
  'Keys — balanced formation, strength to the Line Judge',
  BALANCED,
  [
    ['FJ', SE_LJ],
    ['BJ', FL_LJ],
    ['LJ', BACK],
    ['HL', TE_HL],
    ['SJ', FL_HL],
  ],
  [
    { text: 'balanced: strength is the Line Judge’s', at: { across: 0, down: 33.7 } },
  ],
);

// Double tight ends, strength to the head line judge's side (§5.3, p. 188).
const DOUBLE_TIGHT = [
  { kind: 'k', at: { across: -7.5, down: -1 } },
  { kind: 'k', at: { across: -3.7, down: -1 } },
  { kind: 'k', at: { across: 0, down: -1 } },
  { kind: 'k', at: { across: 3.7, down: -1 } },
  { kind: 'k', at: { across: 7.5, down: -1 } },
  { kind: 'k', at: { across: -11.2, down: -1 } },
  { kind: 'k', at: { across: 11.2, down: -1 } },
  { kind: 'k', at: { across: -15, down: -2.5 } },
  { kind: 'k', at: { across: 0, down: -4.5 } },
  { kind: 'k', at: { across: -3, down: -8 } },
  { kind: 'k', at: { across: 3, down: -8 } },
  { kind: 'r', at: { across: -9, down: 1.5 } },
  { kind: 'r', at: { across: -4.5, down: 1.5 } },
  { kind: 'r', at: { across: 0, down: 1.5 } },
  { kind: 'r', at: { across: 4.5, down: 1.5 } },
  { kind: 'r', at: { across: 9, down: 1.5 } },
  { kind: 'r', at: { across: -6, down: 6 } },
  { kind: 'r', at: { across: 6, down: 6 } },
  { kind: 'r', at: { across: -14, down: 8 } },
  { kind: 'r', at: { across: 13, down: 8 } },
  { kind: 'r', at: { across: 0, down: 14 } },
];

const KEYS_DOUBLE_TIGHT = keys(
  'keys-double-tight-ends',
  'Keys — double tight ends, strength to the Head Line Judge',
  DOUBLE_TIGHT,
  [
    ['SJ', { across: -15, down: -2.5 }],
    ['HL', { across: -3, down: -8 }],
    ['BJ', { across: -11.2, down: -1 }],
    ['LJ', { across: 3, down: -8 }],
    ['FJ', { across: 11.2, down: -1 }],
  ],
  [
    { text: 'short yardage — but they throw from it', at: { across: 0, down: 33.7 } },
  ],
);

// Trips to the line judge's side (§5.3, p. 192).
const TRIPS = [
  { kind: 'k', at: { across: -7.5, down: -1 } },
  { kind: 'k', at: { across: -3.7, down: -1 } },
  { kind: 'k', at: { across: 0, down: -1 } },
  { kind: 'k', at: { across: 3.7, down: -1 } },
  { kind: 'k', at: { across: 7.5, down: -1 } },
  { kind: 'k', at: { across: -11.2, down: -1 } },
  { kind: 'k', at: { across: 20, down: -1 } },
  { kind: 'k', at: { across: 15, down: -3 } },
  { kind: 'k', at: { across: 11, down: -3 } },
  { kind: 'k', at: { across: 0, down: -4.5 } },
  { kind: 'k', at: { across: -3, down: -8 } },
  { kind: 'r', at: { across: -9, down: 1.5 } },
  { kind: 'r', at: { across: -4.5, down: 1.5 } },
  { kind: 'r', at: { across: 0, down: 1.5 } },
  { kind: 'r', at: { across: 4.5, down: 1.5 } },
  { kind: 'r', at: { across: 9, down: 1.5 } },
  { kind: 'r', at: { across: -5, down: 6 } },
  { kind: 'r', at: { across: 8, down: 6 } },
  { kind: 'r', at: { across: 18, down: 8 } },
  { kind: 'r', at: { across: -14, down: 8 } },
  { kind: 'r', at: { across: 4, down: 14 } },
];

const KEYS_TRIPS = keys(
  'keys-trips',
  'Keys — trips to the Line Judge',
  TRIPS,
  [
    ['FJ', { across: 20, down: -1 }],
    ['LJ', { across: 15, down: -3 }],
    ['BJ', { across: 11, down: -3 }],
    ['HL', { across: -3, down: -8 }],
    ['SJ', { across: -11.2, down: -1 }],
  ],
  [
    { text: 'FJ takes the widest, BJ the third in', at: { across: 0, down: 33.7 } },
  ],
);

// Motion changes strength, from the head line judge's side to the line
// judge's (§5.3, p. 190).
const MOTION = [
  { kind: 'k', at: { across: -7.5, down: -1 } },
  { kind: 'k', at: { across: -3.7, down: -1 } },
  { kind: 'k', at: { across: 0, down: -1 } },
  { kind: 'k', at: { across: 3.7, down: -1 } },
  { kind: 'k', at: { across: 7.5, down: -1 } },
  { kind: 'k', at: { across: 19, down: -1 } },
  { kind: 'k', at: { across: -11.2, down: -1 } },
  { kind: 'k', at: { across: -16, down: -3 } },
  { kind: 'k', at: { across: 0, down: -4.5 } },
  { kind: 'k', at: { across: -3, down: -8 } },
  { kind: 'r', at: { across: -9, down: 1.5 } },
  { kind: 'r', at: { across: -4.5, down: 1.5 } },
  { kind: 'r', at: { across: 0, down: 1.5 } },
  { kind: 'r', at: { across: 4.5, down: 1.5 } },
  { kind: 'r', at: { across: 9, down: 1.5 } },
  { kind: 'r', at: { across: -6, down: 6 } },
  { kind: 'r', at: { across: 6, down: 6 } },
  { kind: 'r', at: { across: -14, down: 8 } },
  { kind: 'r', at: { across: 16, down: 8 } },
  { kind: 'r', at: { across: 2, down: 14 } },
];

const KEYS_MOTION = {
  ...keys(
    'keys-motion-changes-strength',
    'Keys — motion changes strength',
    MOTION,
    [
      ['FJ', { across: 19, down: -1 }],
      ['BJ', { across: 8, down: -3 }],
      ['LJ', { across: -3, down: -8 }],
      ['SJ', { across: -16, down: -3 }],
      ['HL', { across: -11.2, down: -1 }],
    ],
    [
      { text: 'BJ keys the motion man after the snap', at: { across: 0, down: 33.7 } },
      { text: 'HL has whether he cut upfield before it', at: { across: 0, down: 35.8 } },
    ],
  ),
};
// The motion path itself: the flanker crosses from the head line judge's side
// to the line judge's, which is what moves the strength.
KEYS_MOTION.movements = [
  { points: [{ across: -16, down: -3.6 }, { across: 8, down: -3.6 }] },
  ...KEYS_MOTION.movements,
];

// ---------------------------------------------------------------------------
// Coin toss
// ---------------------------------------------------------------------------

const COIN_TOSS = {
  file: '7-man-mechanics/coin-toss.svg',
  view: 'midfield',
  title: 'Coin toss, crew of 7',
  players: [
    { kind: 'k', at: { across: -2.6, down: -2.2 } },
    { kind: 'k', at: { across: -2.6, down: 2.2 } },
    { kind: 'r', at: { across: 2.6, down: -2.2 } },
    { kind: 'r', at: { across: 2.6, down: 2.2 } },
  ],
  officials: [
    // §5.2, p. 184. R and U in the centre facing each other, backs to their
    // own sidelines. HL stays near his sideline with the line-to-gain crew.
    // FJ and SJ collect the captains at five minutes and release them at the
    // hash. LJ and BJ get the teams onto the field at three minutes.
    { mark: 'R', at: { across: 8, down: 0 } },
    { mark: 'U', at: { across: -8, down: 0 } },
    { mark: 'FJ', at: { across: 8.9, down: -8 } },
    { mark: 'SJ', at: { across: -8.9, down: -8 } },
    // Kept off the yard-line rows: an official standing outside the sideline
    // sits in the same band as that row's yard number and would hide it.
    { mark: 'HL', at: { across: -OUT, down: 6 } },
    { mark: 'LJ', at: { across: OUT, down: -13 } },
    { mark: 'BJ', at: { across: OUT, down: 13 } },
  ],
  movements: [
    { points: [{ across: 8.9, down: -6.5 }, { across: 5.2, down: -3 }], arrow: false },
    { points: [{ across: -8.9, down: -6.5 }, { across: -5.2, down: -3 }], arrow: false },
  ],
  notes: [
    { text: 'FJ and SJ bring the captains in at 5:00', at: { across: 0, down: -12 } },
    { text: 'and release them at the hash', at: { across: 0, down: -10 } },
    { text: 'captains face their own goal line', at: { across: 0, down: 4.5 } },
    { text: 'HL: the line-to-gain crew', at: { across: -24, down: 9 }, anchor: 'start' },
    { text: 'LJ and BJ: teams on at 3:00', at: { across: 0, down: 17.5 } },
  ],
};

export const diagrams = [
  COIN_TOSS,
  FREE_KICK,
  ONSIDE_KICK,
  SCRIMMAGE,
  SCRIMMAGE_KICK,
  SCORING_KICK,
  KEYS_BALANCED,
  KEYS_DOUBLE_TIGHT,
  KEYS_TRIPS,
  KEYS_MOTION,
];
