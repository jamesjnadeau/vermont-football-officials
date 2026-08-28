/**
 * Preset boards: a fixed situation or formation dropped onto the field in
 * one step.
 *
 * Two groups, kept structurally identical but never confused for one
 * another (see `group` below):
 *
 *   - **Situations** carry officials. Their positions are lifted verbatim
 *     from `.../scratchpad/extract/positions.json` — the output of a
 *     verification gate that parsed them back out of the committed position
 *     cards and crew cards (`static/images/position-cards/*`,
 *     `static/images/kicking-plays/`) rather than having them typed in from
 *     memory. A crew-of-4 preset is deliberately absent: the gate measured
 *     the real crew-of-4 art and it does not agree with "crew-of-5 minus the
 *     Back Judge" — the officials left redistribute coverage, moving by up
 *     to fifty yards (the measurements are in
 *     `docs/superpowers/plans/2026-08-28-field-drawing-tool.md`) — so
 *     shipping that derivation would teach four officials to stand in the
 *     wrong places. A crew-of-4 preset needs its own extraction from that
 *     art, not a formula applied to this data.
 *
 *   - **Formations** are the offense alone, with no officials, taken from
 *     named public coaching sources rather than this association's own
 *     material — see `docs/sources.md` for the citation and the numbers
 *     pulled from each. They are scenery for building a play, not a
 *     mechanic to learn, which is why the UI (`app.js`) labels this group
 *     as starting points and styles it apart from Situations.
 *
 * A preset never goes through `state.js`'s `openSpot`: that helper exists so
 * a person adding tokens one click at a time can see each new one land
 * somewhere distinct, and it does that by stepping diagonally off whatever
 * is already there — which is exactly wrong for a batch of tokens that must
 * land at specific, independently-sourced coordinates. `boardFromPreset`
 * calls `addToken` directly with each token's own `across`/`down` instead.
 */
import { addToken, emptyBoard } from './state.js';

// ---------------------------------------------------------------------------
// Situations — officials and players, from positions.json verbatim
// ---------------------------------------------------------------------------

/**
 * `positions.json`'s player `kind` is the English word the extraction script
 * read off the diagrams' own class names; `state.js`'s `PLAYERS` allowlist
 * spells the same two sides `'k'` / `'r'` because that is also the mark
 * `markers.js` draws. One line of translation here beats renaming either
 * end to match the other for no reason but this file's convenience.
 */
const PLAYER_KIND = { kicking: 'k', receiving: 'r' };

function situationTokens({ officials, players }) {
  return [
    ...officials.map(({ mark, across, down }) => ({ type: 'official', mark, across, down })),
    ...players.map(({ kind, across, down }) => ({
      type: 'player',
      kind: PLAYER_KIND[kind],
      across,
      down,
    })),
  ];
}

/**
 * Kickoff: 5 officials, 21 players (11 kicking, 10 receiving). Free kick from
 * K's 40 — the `kickoff` view is 70 yards deep because the ball, the coverage
 * unit and the receiving unit's return lanes all have to be in frame at once.
 */
const KICKOFF = {
  id: 'kickoff',
  label: 'Kickoff',
  group: 'situation',
  view: 'kickoff',
  tokens: situationTokens({
    officials: [
      { mark: 'BJ', across: 30.67, down: 0 },
      { mark: 'LJ', across: 30.67, down: 60 },
      { mark: 'LM', across: -30.67, down: 60 },
      { mark: 'R', across: 1.07, down: 60 },
      { mark: 'U', across: -30.67, down: 10 },
    ],
    players: [
      { kind: 'kicking', across: 0, down: -3.12 },
      { kind: 'kicking', across: -22.93, down: -1.04 },
      { kind: 'kicking', across: -17.87, down: -1.04 },
      { kind: 'kicking', across: -12.8, down: -1.04 },
      { kind: 'kicking', across: -7.73, down: -1.04 },
      { kind: 'kicking', across: -2.67, down: -1.04 },
      { kind: 'kicking', across: 2.4, down: -1.04 },
      { kind: 'kicking', across: 7.47, down: -1.04 },
      { kind: 'kicking', across: 12.53, down: -1.04 },
      { kind: 'kicking', across: 17.6, down: -1.04 },
      { kind: 'kicking', across: 22.67, down: -1.04 },
      { kind: 'receiving', across: -20.8, down: 11.25 },
      { kind: 'receiving', across: -12, down: 11.25 },
      { kind: 'receiving', across: -3.73, down: 11.25 },
      { kind: 'receiving', across: 5.33, down: 11.25 },
      { kind: 'receiving', across: 12.8, down: 11.25 },
      { kind: 'receiving', across: 21.33, down: 11.25 },
      { kind: 'receiving', across: -9.07, down: 30.83 },
      { kind: 'receiving', across: 10.67, down: 32.08 },
      { kind: 'receiving', across: -1.07, down: 48.33 },
      { kind: 'receiving', across: 8, down: 50.83 },
    ],
  }),
};

/** Field goal / try: 5 officials, 20 players (11 kicking, 9 receiving). */
const FIELD_GOAL = {
  id: 'fieldGoal',
  label: 'Field Goal',
  group: 'situation',
  view: 'fieldGoal',
  tokens: situationTokens({
    officials: [
      { mark: 'BJ', across: 4, down: 10.73 },
      { mark: 'LJ', across: 17.6, down: 0 },
      { mark: 'LM', across: -17.6, down: 0 },
      { mark: 'R', across: -13.87, down: -12 },
      { mark: 'U', across: -4, down: 10.73 },
    ],
    players: [
      { kind: 'kicking', across: -4.27, down: -9 },
      { kind: 'kicking', across: 0, down: -7 },
      { kind: 'kicking', across: -12.8, down: -0.76 },
      { kind: 'kicking', across: -9.6, down: -0.76 },
      { kind: 'kicking', across: -6.4, down: -0.76 },
      { kind: 'kicking', across: -3.2, down: -0.76 },
      { kind: 'kicking', across: 0, down: -0.76 },
      { kind: 'kicking', across: 3.2, down: -0.76 },
      { kind: 'kicking', across: 6.4, down: -0.76 },
      { kind: 'kicking', across: 9.6, down: -0.76 },
      { kind: 'kicking', across: 12.8, down: -0.76 },
      { kind: 'receiving', across: -12.8, down: 0.91 },
      { kind: 'receiving', across: -9.6, down: 0.91 },
      { kind: 'receiving', across: -6.4, down: 0.91 },
      { kind: 'receiving', across: -3.2, down: 0.91 },
      { kind: 'receiving', across: 0, down: 0.91 },
      { kind: 'receiving', across: 3.2, down: 0.91 },
      { kind: 'receiving', across: 6.4, down: 0.91 },
      { kind: 'receiving', across: 9.6, down: 0.91 },
      { kind: 'receiving', across: 12.8, down: 0.91 },
    ],
  }),
};

/** Goal line: 5 officials, 17 players (9 kicking, 8 receiving). */
const GOAL_LINE = {
  id: 'goalLine',
  label: 'Goal Line',
  group: 'situation',
  view: 'goalLine',
  tokens: situationTokens({
    officials: [
      { mark: 'BJ', across: 0, down: 17.14 },
      { mark: 'LJ', across: 29.07, down: 10 },
      { mark: 'LM', across: -29.07, down: 10 },
      { mark: 'R', across: 8, down: -15 },
      { mark: 'U', across: 8, down: 7 },
    ],
    players: [
      { kind: 'kicking', across: -3.73, down: -7.14 },
      { kind: 'kicking', across: 0, down: -4.29 },
      { kind: 'kicking', across: -15.47, down: -0.95 },
      { kind: 'kicking', across: -6.4, down: -0.95 },
      { kind: 'kicking', across: -3.2, down: -0.95 },
      { kind: 'kicking', across: 0, down: -0.95 },
      { kind: 'kicking', across: 3.2, down: -0.95 },
      { kind: 'kicking', across: 6.4, down: -0.95 },
      { kind: 'kicking', across: 9.6, down: -0.95 },
      { kind: 'receiving', across: -4.8, down: 1.19 },
      { kind: 'receiving', across: -1.6, down: 1.19 },
      { kind: 'receiving', across: 1.6, down: 1.19 },
      { kind: 'receiving', across: 4.8, down: 1.19 },
      { kind: 'receiving', across: -9.07, down: 4.76 },
      { kind: 'receiving', across: 9.07, down: 4.76 },
      { kind: 'receiving', across: -14.93, down: 5.71 },
      { kind: 'receiving', across: 13.87, down: 5.71 },
    ],
  }),
};

/**
 * Punt: 5 officials, 20 players (10 kicking, 10 receiving). Sourced the same
 * way as the three above — six agreeing diagrams (5 position cards + the
 * crew-of-5 card), 0 spread between them, every point round-tripped. See
 * `docs/sources.md`.
 */
const PUNT = {
  id: 'punt',
  label: 'Punt',
  group: 'situation',
  view: 'punt',
  tokens: situationTokens({
    officials: [
      { mark: 'BJ', across: -8.53, down: 31 },
      { mark: 'LJ', across: 30.67, down: 0 },
      { mark: 'LM', across: -30.67, down: 0 },
      { mark: 'R', across: 14.93, down: -9.11 },
      { mark: 'U', across: -9.6, down: 6.67 },
    ],
    players: [
      { kind: 'kicking', across: 0, down: -14 },
      { kind: 'kicking', across: -6.4, down: -5.33 },
      { kind: 'kicking', across: 6.4, down: -5.33 },
      { kind: 'kicking', across: -14.4, down: -1.11 },
      { kind: 'kicking', across: -9.6, down: -1.11 },
      { kind: 'kicking', across: -4.8, down: -1.11 },
      { kind: 'kicking', across: 0, down: -1.11 },
      { kind: 'kicking', across: 4.8, down: -1.11 },
      { kind: 'kicking', across: 9.6, down: -1.11 },
      { kind: 'kicking', across: 14.4, down: -1.11 },
      { kind: 'receiving', across: -13.87, down: 1.33 },
      { kind: 'receiving', across: -9.07, down: 1.33 },
      { kind: 'receiving', across: -4.27, down: 1.33 },
      { kind: 'receiving', across: 0.53, down: 1.33 },
      { kind: 'receiving', across: 5.33, down: 1.33 },
      { kind: 'receiving', across: 10.13, down: 1.33 },
      { kind: 'receiving', across: 14.93, down: 1.33 },
      { kind: 'receiving', across: -8, down: 16 },
      { kind: 'receiving', across: 9.07, down: 18 },
      { kind: 'receiving', across: 1.6, down: 33 },
    ],
  }),
};

/**
 * Spot (between-downs): 5 officials, no players. `positions.json` also
 * carries one point for this scene at `kind: "player"` — a single `rp`-style
 * circle on `between-downs/getting-it-back-crew-of-5.svg`, the *only* art
 * this scene has at all (no position cards exist for it, so nothing
 * corroborates any of it — see `docs/sources.md`). That one marker is
 * deliberately dropped here rather than placed: `state.js`'s `PLAYERS`
 * allowlist and `markers.js`'s `player()` both know exactly two kinds, `'k'`
 * (crossed X) and `'r'` (open circle), and forcing a neutral, no-team-side
 * marker through either would render it as a receiving-team player —
 * asserting a side the source diagram never draws. Officials only.
 */
const SPOT = {
  id: 'spot',
  label: 'Spot',
  group: 'situation',
  view: 'spot',
  tokens: situationTokens({
    officials: [
      { mark: 'BJ', across: -8.36, down: 7 },
      { mark: 'LJ', across: 23.2, down: 14 },
      { mark: 'LM', across: -23.2, down: 14 },
      { mark: 'R', across: -8, down: 21 },
      { mark: 'U', across: 2.67, down: 0 },
    ],
    players: [],
  }),
};

export const SITUATIONS = [KICKOFF, FIELD_GOAL, GOAL_LINE, PUNT, SPOT];

// ---------------------------------------------------------------------------
// Formations — offense only, from named public sources (docs/sources.md)
// ---------------------------------------------------------------------------
//
// Horizontal positions are the sourced alignments with every distance from the
// middle of the field DOUBLED. That is a legibility decision, not a claim about
// where players really stand: a real guard splits two feet from the centre,
// which is a quarter of the width of the X that draws him at diagram scale, so
// a truthful line renders as one smear. Doubling separates the marks while
// keeping the shape of each formation — who is inside whom, and which side is
// strong — which is what a preset is for. Depths down the field are untouched;
// they were already legible. `docs/sources.md` records the sourced numbers, so
// the two can always be compared.
//
// One formation cannot take it: see the note on the trips receivers below.

/** Offense in `state.js`'s vocabulary; `'r'` (defense) never appears here. */
const OFFENSE = 'k';

function lineman(across) {
  return { type: 'player', kind: OFFENSE, across, down: 0 };
}

function back(across, down) {
  return { type: 'player', kind: OFFENSE, across, down };
}

/**
 * Wing-T, base personnel (one tight end, one split end). Line splits, the
 * fullback's depth, and the wingback's and halfback's alignment rules are
 * quoted numbers from wing-t-coach.com (see `docs/sources.md`); the split
 * end's width has no cited figure and uses the generic wide-receiver split
 * also used in Shotgun and Trips below.
 */
const WING_T = {
  id: 'wingT',
  label: 'Wing-T',
  group: 'formation',
  view: 'runPass',
  tokens: [
    lineman(0), // C
    lineman(-1.33), // LG — 2' split from the centre, per source
    lineman(1.33), // RG
    lineman(-2.67), // LT — 2' split from the guard
    lineman(2.67), // RT
    lineman(4.0), // TE, strong side — 2' split from the tackle
    lineman(-18.67), // SE, weak side — generic wide split, no TE that side
    back(0, -1), // QB, under center
    back(0, -4), // FB, "heels four yards behind the football"
    back(6.0, -1), // Wingback — "1 yard deep, 1 yard outside the TE"
    back(-2.67, -4), // HB, weak side — FB's depth, outside foot of the tackle
  ],
};

/**
 * Power I: two tight ends and no wide receiver, an I-backfield plus an
 * offset H-back. Backfield depths are quoted from footballadvantage.com
 * (see `docs/sources.md`); "three steps" for the fullback is read as three
 * yards, noted there as a judgement call. Line splits use the same generic
 * convention as Shotgun below, since the source gives none.
 */
const POWER_I = {
  id: 'powerI',
  label: 'Power I',
  group: 'formation',
  view: 'runPass',
  tokens: [
    lineman(0), // C
    lineman(-2), // LG
    lineman(2), // RG
    lineman(-5), // LT
    lineman(5), // RT
    lineman(-7.4), // TE, weak side — no WR in this formation
    lineman(7.4), // TE, strong side
    back(0, -1), // QB, under center
    back(0, -4), // FB, ~3 yd behind the QB
    back(0, -6), // RB (tailback), ~2 yd behind the FB, stacked
    back(-6, -4), // H-back, FB's depth, offset to a side
  ],
};

/**
 * Shotgun, 4-wide: two backfield (QB, RB) and four receivers, two of them
 * inside slots. The quarterback's and running back's depths are quoted from
 * footballadvantage.com; receiver splits use the generic convention below,
 * since the source only says a receiver off the line is "a step or two"
 * deeper than one on it.
 */
const SHOTGUN = {
  id: 'shotgun',
  label: 'Shotgun',
  group: 'formation',
  view: 'runPass',
  tokens: [
    lineman(0), // C
    lineman(-2), // LG
    lineman(2), // RG
    lineman(-5), // LT
    lineman(5), // RT
    back(0, -5), // QB, shotgun depth
    back(-4, -5), // RB, alongside the QB
    back(-24, 0), // X, split end, on the line
    back(-12, -1), // H, inside slot, a step off the line
    back(12, -1), // Y, inside slot, a step off the line
    back(24, -1), // Z, flanker, off the line
  ],
};

/**
 * Trips right, shotgun: three receivers to one side spaced 5–10 yards apart
 * (northeastern18.com, see `docs/sources.md`), a single receiver isolated
 * backside (cfbtrack.com's naming for the personnel), and the same
 * backfield depths as Shotgun above.
 */
const TRIPS = {
  id: 'trips',
  label: 'Trips',
  group: 'formation',
  view: 'runPass',
  tokens: [
    lineman(0), // C
    lineman(-2), // LG
    lineman(2), // RG
    lineman(-5), // LT
    lineman(5), // RT
    back(0, -5), // QB, shotgun depth
    back(-4, -5), // RB, backside
    back(-24, 0), // Z, single receiver, isolated backside
    // The three trips receivers are widened, not doubled. Doubling their
    // 6-yard spacing would put #1 at 36 yards from the middle of the field —
    // nine yards out of bounds — and 12-yard gaps would also break the 5-to-10
    // yards this formation's own source states. 6.5 fits both.
    back(12, 0), // #3, innermost trips receiver, attached
    back(18.5, -1), // #2, trips slot, a step off the line
    back(25, 0), // #1, trips outside receiver, on the line
  ],
};

/**
 * An empty run/pass crop with nothing placed: the crop a scrimmage set most
 * often wants, with no formation assumed. Zero offensive players is
 * intentional, not an 11-man formation with nine left out — this is the
 * "plus an empty scrimmage set" the plan asks for beside the four named
 * formations, for a play that doesn't start from a named look.
 */
const EMPTY_SCRIMMAGE = {
  id: 'emptyScrimmage',
  label: 'Empty (scrimmage)',
  group: 'formation',
  view: 'runPass',
  tokens: [],
};

export const FORMATIONS = [WING_T, TRIPS, POWER_I, SHOTGUN, EMPTY_SCRIMMAGE];

export const PRESETS = [...FORMATIONS, ...SITUATIONS];

// ---------------------------------------------------------------------------
// Applying one
// ---------------------------------------------------------------------------

/**
 * Builds a fresh board from a preset. Goes through `addToken` — which
 * validates every mark and kind against `state.js`'s allowlists exactly as
 * a hand-placed token does — rather than assembling the token array by
 * hand, so a typo in a preset's data fails the same way a bad share link
 * would rather than reaching the screen unchecked.
 */
export function boardFromPreset(preset) {
  let board = emptyBoard(preset.view);
  for (const token of preset.tokens) board = addToken(board, token);
  return board;
}
