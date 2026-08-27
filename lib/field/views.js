/**
 * The six crops the diagrams use.
 *
 * Each is a window onto the field: how much is in frame, how hard it is
 * squashed down the field, and which lines are drawn. See `geometry.js` for
 * what each field means and why `scaleY` differs between them.
 *
 * `anchorY`, `fieldTopY` and `height` are content-driven — how deep an
 * official stands, how much room the notes need — so they were measured from
 * the diagrams these replace rather than derived. Everything else follows from
 * `scaleY` and the yard values.
 */

/** Line of scrimmage / dead-ball spot / restraining line, at yard 0. */
const LOS = { yard: 0, label: 'LOS' };

export const views = {
  /**
   * The spot. Between-downs and fouls-enforcement: a stretch of field around
   * a dead-ball spot, no goal line in frame.
   */
  spot: {
    scaleY: 4,
    anchorY: 46,
    fieldTopY: 10,
    bottomYard: 30,
    goalYard: null,
    height: 178,
    // The spot itself, drawn but not labelled — the notes name it.
    scrimmage: { yard: 0, label: null },
    yardLines: [
      { yard: 5, label: '+5' },
      { yard: 10, label: '+10' },
      { yard: 15, label: '+15' },
      { yard: 20, label: '+20' },
    ],
  },

  /** Run and pass from scrimmage in open field. */
  runPass: {
    scaleY: 4,
    anchorY: 90,
    fieldTopY: 10,
    bottomYard: 20.5,
    goalYard: null,
    height: 186,
    scrimmage: LOS,
    yardLines: [
      { yard: -10, label: '-10' },
      { yard: -5, label: '-5' },
      { yard: 5, label: '+5' },
      { yard: 10, label: '+10' },
      { yard: 15, label: '+15' },
      { yard: 20, label: '+20' },
    ],
  },

  /** Goal line: snap from the ten, end zone and uprights in frame. */
  goalLine: {
    scaleY: 4.2,
    anchorY: 88,
    fieldTopY: 14,
    bottomYard: 20,
    goalYard: 10,
    goalPosts: true,
    height: 206,
    scrimmage: LOS,
    yardLines: [{ yard: -5, label: '-5' }],
  },

  /**
   * Field goal and try: a snap from the three. The tightest crop on the site,
   * which is why `scaleY` is so much larger than the others.
   */
  fieldGoal: {
    scaleY: 6.6,
    anchorY: 122,
    fieldTopY: 16,
    bottomYard: 13,
    goalYard: 3,
    goalPosts: true,
    height: 237.8,
    scrimmage: LOS,
    yardLines: [],
  },

  /** Punt from R's 40: the punter behind, the returner deep. */
  punt: {
    scaleY: 4.5,
    anchorY: 96,
    fieldTopY: 20,
    bottomYard: 50,
    goalYard: 40,
    height: 339,
    scrimmage: LOS,
    yardLines: [
      { yard: 10, label: '+10' },
      { yard: 20, label: '+20' },
      { yard: 30, label: '+30' },
    ],
  },

  /**
   * Free kick from K's 40 to R's end line — sixty yards of field, and the
   * only view whose labels are absolute yard numbers rather than offsets.
   */
  kickoff: {
    scaleY: 4.8,
    anchorY: 40,
    fieldTopY: 14,
    bottomYard: 70,
    goalYard: 60,
    height: 394,
    scrimmage: { yard: 0, label: 'K 40' },
    yardLines: [
      { yard: 10, label: '50' },
      { yard: 20, label: '40' },
      { yard: 30, label: '30' },
      { yard: 40, label: '20' },
      { yard: 50, label: '10' },
    ],
  },
};

export const viewNames = Object.keys(views);
