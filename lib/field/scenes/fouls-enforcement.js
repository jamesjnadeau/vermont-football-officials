/** The fouls-and-enforcement crew card: where everyone goes on a flag. */

const FLAG_DOWN_5 = {
  file: "fouls-enforcement/flag-down-crew-of-5.svg",
  view: 'spot',
  title: "Flag down, crew of 5",
  players: [
    { kind: 'r', at: { across: -4.2667, down: 14 } },
  ],
  officials: [
    { mark: 'U', at: { across: 1.6, down: 0 } },
    { mark: 'LM', at: { across: -23.2, down: 8 } },
    { mark: 'LJ', at: { across: 23.2, down: 8 } },
    { mark: 'R', at: { across: -13.8667, down: 19 }, highlight: true },
    { mark: 'BJ', at: { across: 14.4, down: 19 } },
  ],
  flags: [
    { at: { across: 1.8667, down: 8 } },
  ],
  movements: [
    { points: [{ across: -23.2, down: 6.5 }, { across: -23.2, down: 1.5 }] },
    { points: [{ across: 20.2667, down: 7 }, { across: 14.9333, down: 3 }] },
  ],
  notes: [
    { text: "previous spot", at: { across: -25.6, down: -1.5 }, anchor: 'start' },
    { text: "enforcement spot · has the ball", at: { across: 1.6, down: -3.5 } },
    { text: "foul spot", at: { across: 6.4, down: 8.75 }, anchor: 'start' },
    { text: "dead-ball spot", at: { across: -6.4, down: 14.75 }, anchor: 'end' },
    { text: "walks it off", at: { across: -23.2, down: 11.75 } },
    { text: "calling official", at: { across: 23.2, down: 11.75 }, anchor: 'end' },
    { text: "open space,", at: { across: -13.8667, down: 22.75 } },
    { text: "face the box", at: { across: -13.8667, down: 25.125 } },
    { text: "half distance,", at: { across: 14.4, down: 22.75 } },
    { text: "loss of down", at: { across: 14.4, down: 25.125 } },
  ],
};

const FLAG_DOWN_4 = {
  file: "fouls-enforcement/flag-down-crew-of-4.svg",
  view: 'spot',
  title: "Flag down, crew of 4",
  players: [
    { kind: 'r', at: { across: -4.2667, down: 14 } },
  ],
  officials: [
    { mark: 'U', at: { across: 1.6, down: 0 } },
    { mark: 'LM', at: { across: -23.2, down: 8 } },
    { mark: 'LJ', at: { across: 23.2, down: 8 } },
    { mark: 'R', at: { across: -13.8667, down: 19 }, highlight: true },
  ],
  flags: [
    { at: { across: 1.8667, down: 8 } },
  ],
  movements: [
    { points: [{ across: -23.2, down: 6.5 }, { across: -23.2, down: 1.5 }] },
    { points: [{ across: 20.2667, down: 7 }, { across: 14.9333, down: 3 }] },
  ],
  notes: [
    { text: "previous spot", at: { across: -25.6, down: -1.5 }, anchor: 'start' },
    { text: "enforcement spot · has the ball", at: { across: 1.6, down: -3.5 } },
    { text: "foul spot", at: { across: 6.4, down: 8.75 }, anchor: 'start' },
    { text: "dead-ball spot", at: { across: -6.4, down: 14.75 }, anchor: 'end' },
    { text: "walks it off", at: { across: -23.2, down: 11.75 } },
    { text: "calling official", at: { across: 23.2, down: 11.75 }, anchor: 'end' },
    { text: "open space,", at: { across: -13.8667, down: 22.75 } },
    { text: "face the box", at: { across: -13.8667, down: 25.125 } },
    { text: "no BJ — R and the wings", at: { across: 13.3333, down: 19.5 } },
    { text: "carry half distance", at: { across: 13.3333, down: 21.75 } },
    { text: "and loss of down", at: { across: 13.3333, down: 24 } },
  ],
};

export const diagrams = [FLAG_DOWN_5, FLAG_DOWN_4];
