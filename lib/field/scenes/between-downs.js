/** The between-downs crew card: getting the ball back in play. */

const GETTING_IT_BACK_5 = {
  file: "between-downs/getting-it-back-crew-of-5.svg",
  view: 'spot',
  title: "Getting the ball back in play, crew of 5",
  players: [
    { kind: 'r', at: { across: -17.0667, down: 14 } },
  ],
  officials: [
    { mark: 'U', at: { across: 2.6667, down: 0 } },
    { mark: 'LM', at: { across: -23.2, down: 14 } },
    { mark: 'LJ', at: { across: 23.2, down: 14 } },
    { mark: 'BJ', at: { across: -8.3556, down: 7 } },
    { mark: 'R', at: { across: -8, down: 21 }, highlight: true },
  ],
  movements: [
    { points: [{ across: -19.7333, down: 13 }, { across: -11.2889, down: 8 }] },
    { points: [{ across: -5.4222, down: 6.25 }, { across: -0.5333, down: 1.75 }] },
  ],
  notes: [
    { text: "next spot", at: { across: -25.6, down: -1.5 }, anchor: 'start' },
    { text: "spots it, then clears", at: { across: 2.6667, down: -3.5 } },
    { text: "holds the spot,", at: { across: -23.2, down: 17.75 } },
    { text: "downfield foot", at: { across: -23.2, down: 20.125 } },
    { text: "holds it too", at: { across: 23.2, down: 17.75 }, anchor: 'end' },
    { text: "relays 10+ yard gains", at: { across: -8.3556, down: 10.75 } },
    { text: "relays the short ones,", at: { across: -8, down: 24.75 } },
    { text: "marks it ready", at: { across: -8, down: 27.125 } },
  ],
};

const GETTING_IT_BACK_4 = {
  file: "between-downs/getting-it-back-crew-of-4.svg",
  view: 'spot',
  title: "Getting the ball back in play, crew of 4",
  players: [
    { kind: 'r', at: { across: -17.0667, down: 14 } },
  ],
  officials: [
    { mark: 'U', at: { across: 2.6667, down: 0 } },
    { mark: 'LM', at: { across: -23.2, down: 14 } },
    { mark: 'LJ', at: { across: 23.2, down: 14 } },
    { mark: 'R', at: { across: -8.3556, down: 7 }, highlight: true },
  ],
  movements: [
    { points: [{ across: -19.7333, down: 13 }, { across: -11.2889, down: 8 }] },
    { points: [{ across: -5.4222, down: 6.25 }, { across: -0.5333, down: 1.75 }] },
  ],
  notes: [
    { text: "next spot", at: { across: -25.6, down: -1.5 }, anchor: 'start' },
    { text: "spots it, then clears", at: { across: 2.6667, down: -3.5 } },
    { text: "holds the spot,", at: { across: -23.2, down: 17.75 } },
    { text: "downfield foot", at: { across: -23.2, down: 20.125 } },
    { text: "holds it too", at: { across: 23.2, down: 17.75 }, anchor: 'end' },
    { text: "relays, then marks ready", at: { across: -8.3556, down: 10.75 } },
  ],
};

export const diagrams = [GETTING_IT_BACK_5, GETTING_IT_BACK_4];
