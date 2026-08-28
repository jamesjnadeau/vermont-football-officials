/**
 * The drawing board's entry point, and the only module under lib/field/ or
 * lib/draw/ that touches `document`. Everything else stays importable by
 * `node --test` with no DOM and no `node:` builtins, because it is also
 * served straight to the browser (see the passthrough copy in .eleventy.js)
 * and must run unchanged in both places.
 *
 * The split this file keeps: `state.js` decides what is on the board and
 * `markers.js` decides what each thing looks like. What is left here — and
 * all that should ever be here — is the wiring between a pointer, a key
 * press and those two: no coordinate arithmetic beyond asking `geometry.js`
 * to run its own conversion backwards, and no shape of its own.
 *
 * The share link is the same split again: `codec.js` turns a board into a
 * string and back, and all this file adds is the fragment it lives in, the
 * debounce that keeps a drag from writing it sixty times, and the button
 * that copies it. Nothing decoded is checked here — `codec.js` hands back a
 * board that has already been through `state.js`, or `null`.
 */
import { renderBoard, layerId } from './board.js';
import { official, player, movement, movementPath, label } from '../field/markers.js';
import { escapeText } from '../field/escape.js';
import { x as toSvgX, y as toSvgY, num, xToYards, yToYards } from '../field/geometry.js';
import { views } from '../field/views.js';
import {
  DEFAULT_VIEW,
  OFFICIALS,
  PLAYERS,
  TEXT_DEFAULTS,
  TEXT_MAX_LENGTH,
  TEXT_SIZE_MAX,
  TEXT_SIZE_MIN,
  TEXT_SWATCHES,
  addArrow,
  addToken,
  clampToFrame,
  commitText,
  editText,
  emptyBoard,
  findArrow,
  findToken,
  moveToken,
  openSpot,
  removeArrow,
  removeToken,
  tokenName,
} from './state.js';
import { decode, encode } from './codec.js';
import { FORMATIONS, PRESETS, SITUATIONS, boardFromPreset } from './presets.js';

const PRESETS_BY_ID = new Map(PRESETS.map((preset) => [preset.id, preset]));

/**
 * A quarter yard is the smallest nudge worth having: it is finer than
 * anybody can place a token by hand, and coarse enough that crossing the
 * width of the field does not take a hundred key presses. Shift gives the
 * unit the mechanics are actually described in — "two yards outside the
 * widest receiver" is a yard-level instruction.
 */
const NUDGE_YARDS = 0.25;
const NUDGE_YARDS_SHIFT = 1;

/**
 * Fifty past boards. The whole state is a few hundred bytes, so the cap is
 * about bounding an unbounded array rather than about memory.
 */
const HISTORY_LIMIT = 50;

/**
 * An invisible disc under every token, and the reason it exists: a defense
 * player is an unfilled circle and an offense player is two crossed lines,
 * so hit-testing the drawn shape alone means a click only counts if it
 * lands on a stroke a yard and a half wide. This is a hit target, not a
 * mark — it paints nothing, and it is sized for a fingertip on a phone
 * rather than to match any shape in `markers.js`.
 */
const HIT_RADIUS = 10;

/** Clears the biggest mark (an official's disc, r=9.5) by a visible margin. */
const SELECTION_RADIUS = 13;

/**
 * Below this, in yards, a press or a segment reads as a mis-click rather
 * than a deliberate mark. One number does both jobs it needs to: it is the
 * line between a "click" (extend the path) and a "drag" (place a straight
 * arrow in one motion), and it is the minimum finished length below which
 * the whole attempt is thrown away instead of committed as a path too short
 * to ever mean anything. Matches `SPREAD_YARDS` in state.js — both are the
 * same "too close to read as separate" distance, just applied to a path
 * instead of two tokens.
 */
const ARROW_MIN_YARDS = 2;

/**
 * Two presses this close in time and space read as one double-click rather
 * than two more points on the path — the gesture that finishes a bent arrow.
 */
const DOUBLE_CLICK_MS = 400;

/**
 * Flat, and reading up or down a sideline. Those three angles are most of
 * what anybody actually wants, and a slider dragged by hand lands one or two
 * degrees off every time — close enough to look like a mistake rather than a
 * choice. Only the slider snaps; the number input beside it exists precisely
 * so an angle can be given exactly, and snapping there would make 1 and 2
 * unreachable on the way to typing 12.
 */
const ROTATE_SNAP = [0, 90, -90];
const ROTATE_SNAP_DEGREES = 2;

/**
 * The angle controls' own range. `state.js` folds every angle into
 * (-180, 180], so these are exactly the values that survive that fold
 * unchanged — a slider whose ends normalised to something else would jump
 * from one end to the other the moment it was dragged all the way over.
 */
const ROTATE_MIN = -179;
const ROTATE_MAX = 180;

/**
 * The board lives after the `#`, in `?`-style pairs so a later task can add
 * a second key without moving this one.
 *
 * The fragment and not the query string, and that is the whole point of it:
 * a fragment is never sent to a server, so no board anybody draws is logged
 * by GitHub Pages or by anything between the person who made the link and
 * the person who opens it. It is also the only place that can work here at
 * all — this is a static host with nothing running that could read a query.
 */
const SHARE_KEY = 'd';

/**
 * Long enough that a drag, a run of nudges or a caption being typed writes
 * the URL once when it settles rather than on every frame, and short enough
 * that the address bar is right by the time anybody looks at it or reaches
 * for the button.
 */
const URL_DEBOUNCE_MS = 200;

let board = emptyBoard(DEFAULT_VIEW);

/** Past boards, oldest first. `undo()` pops. */
const history = [];

/**
 * Consecutive nudges of one token collapse into a single undo step. Without
 * this, holding an arrow key down fills all fifty slots with quarter-yard
 * moves and the board before the nudging started is gone.
 */
let lastChange = null;

let selectedId = null;
let drag = null;

/**
 * `'select'` (the default) drags and picks things; `'arrow'` draws them;
 * `'text'` writes on the board. A mode, not a modifier key, because a
 * modifier held for the length of a multi-click bent arrow is a modifier
 * nobody can actually hold.
 */
let mode = 'select';

/**
 * How the next caption will look. Every formatting control writes back here
 * as well as onto the caption it is editing, so a crew that wants all its
 * captions 18pt and red sets that once rather than on every one.
 */
let textDefaults = {
  size: TEXT_DEFAULTS.size,
  color: TEXT_DEFAULTS.color,
  bold: TEXT_DEFAULTS.bold,
  underline: TEXT_DEFAULTS.underline,
  rotate: TEXT_DEFAULTS.rotate,
};

/**
 * A caption placed but not yet given any words. It matters only to the undo
 * stack: dropping one of these has to take the history entry that placed it
 * with it (see `dropBlankCaption`), and emptying a caption that already
 * existed must not.
 */
let pendingCaptionId = null;

/**
 * The points committed so far in a bent arrow, or `null` when nothing is
 * being drawn. A straight arrow never populates this — it is built and
 * committed in one `commitArrow` call from a single drag — so this only
 * exists between the first click of a multi-point path and the click, Enter
 * press or Escape that ends it.
 */
let arrowDraft = null;

/**
 * One pointer press in Arrow mode, from `pointerdown` to `pointerup`, kept
 * only to tell a drag from a click when the button comes back up: `moved`
 * says whether the press ever travelled far enough from `start` to count as
 * one, and `current` is where the pointer last was, for a release that
 * fires with no intervening `pointermove`.
 */
let arrowGesture = null;

/** The point and time of the last click that extended a bent arrow, for `isDoubleClick`. */
let lastArrowClick = null;

let svg = null;
let undoButton = null;
let modeButtons = null;
/** The caption editor and its controls, or `null` before `mount()`. */
let props = null;
/** The live region "Copy link" speaks through, and the manual-copy field. */
let shareStatus = null;
let shareManual = null;
/** The pending debounced URL write, or `null` when there is none. */
let urlTimer = null;
/** Cleared the first time the browser refuses to rewrite the URL. */
let urlWritable = true;

// ---------------------------------------------------------------------------
// Drawing what is in the state
// ---------------------------------------------------------------------------

const layer = (name) => svg.querySelector(`#${layerId(name)}`);
const tokenElement = (id) => svg.querySelector(`.draw-token[data-id="${id}"]`);
const arrowElement = (id) => svg.querySelector(`.draw-arrow[data-id="${id}"]`);

/**
 * One token, drawn at the origin by `markers.js` and put in place by the
 * wrapper's transform. That indirection is what makes a drag cheap: moving
 * a token is one attribute write, not a re-serialisation of its shape.
 */
function tokenMarkup(token) {
  const shape =
    token.type === 'official'
      ? official({ mark: token.mark })
      : token.type === 'text'
        ? // The caption goes to `label()` whole: it already holds exactly the
          // fields that function takes, and every one of them — the words,
          // the colour, the angle — is escaped or written as a fixed value
          // there. Nothing on this side of the call builds an attribute.
          label(token)
        : player({ kind: token.kind });
  // A caption is a token like any other here — the same wrapper, the same
  // hit disc, the same tab stop — and carries one extra class only so the
  // stylesheet can let a click land on the words themselves. Its own
  // rotation is `label()`'s `transform` on the `<text>` *inside* this
  // wrapper, which is what makes the two compose as translate-then-rotate:
  // written the other way round, turning the angle would swing the caption
  // across the field instead of spinning it where it sits.
  const captionClass = token.type === 'text' ? ' draw-caption' : '';
  return (
    `<g class="draw-token${captionClass}" data-id="${escapeText(token.id)}" tabindex="0" role="button"` +
    ` aria-label="${escapeText(tokenName(token))}" transform="${placement(token)}">` +
    `<circle r="${HIT_RADIUS}" class="draw-hit"/>${shape}</g>`
  );
}

function placement({ across, down }) {
  return `translate(${num(toSvgX(across))} ${num(toSvgY(views[board.view], down))})`;
}

/**
 * One arrow: `movement()`'s dotted path and arrowhead, plus a fat invisible
 * twin of the same `d` for hit-testing. The dots `movement()` draws are too
 * sparse to reliably click, the same problem `HIT_RADIUS` solves for tokens.
 * `movementPath()` (markers.js) gives that `d` directly — one `movement()`
 * call for the visible shape, no second call and no parsing its markup back
 * apart just to recover geometry `markers.js` already has in hand.
 */
function arrowMarkup(arrow) {
  const view = views[board.view];
  const d = movementPath(arrow.points, view);
  return (
    `<g class="draw-arrow" data-id="${escapeText(arrow.id)}" tabindex="0" role="button"` +
    ` aria-label="Movement arrow">` +
    `<path d="${d}" class="draw-hit-line"/>${movement({ points: arrow.points }, view)}</g>`
  );
}

/**
 * The selection outline lives in the overlay layer and nowhere else. It is
 * chrome — it says what the Delete key is about to remove — and the overlay
 * is the one layer that is never part of a shared or printed board, so it
 * cannot leak into either by being forgotten about later.
 */
function selectionMarkup() {
  if (!selectedId) return '';
  const token = findToken(board, selectedId);
  if (token) return `<circle r="${SELECTION_RADIUS}" class="draw-selection" transform="${placement(token)}"/>`;
  const arrow = findArrow(board, selectedId);
  if (arrow) return `<path d="${movementPath(arrow.points, views[board.view])}" class="draw-selection"/>`;
  return '';
}

/**
 * A not-yet-committed arrow, styled distinctly (main.scss) so it reads as
 * provisional rather than as a mark already on the board. Used both for the
 * rubber band during a drag or a hover between clicks, and — through
 * `overlayMarkup` — for whatever a bent path has committed so far whenever
 * something else forces a full `render()` mid-draw.
 */
function previewMarkup(points) {
  return `<g class="draw-arrow-preview">${movement({ points }, views[board.view])}</g>`;
}

/**
 * What the overlay shows: an in-progress bent arrow takes it over completely
 * — there is nothing useful to select while one is being drawn — otherwise
 * it falls back to whatever is selected.
 */
function overlayMarkup() {
  if (arrowDraft) return previewMarkup(arrowDraft.points);
  return selectionMarkup();
}

function render() {
  // Re-rendering a layer destroys the element that had focus, which for a
  // keyboard user is the whole board disappearing under them. Put it back.
  const focusedId =
    document.activeElement?.closest?.('.draw-token, .draw-arrow')?.dataset.id ?? null;

  const drawnAs = (type) =>
    board.tokens
      .filter((token) => token.type === type)
      .map(tokenMarkup)
      .join('');

  layer('players').innerHTML = drawnAs('player');
  layer('officials').innerHTML = drawnAs('official');
  layer('arrows').innerHTML = board.arrows.map(arrowMarkup).join('');
  layer('text').innerHTML = drawnAs('text');
  layer('overlay').innerHTML = overlayMarkup();

  if (focusedId) (tokenElement(focusedId) ?? arrowElement(focusedId))?.focus({ preventScroll: true });
  if (undoButton) undoButton.disabled = history.length === 0;
  syncProperties();
  // Every change to the board comes through here, so this is the one place
  // the URL has to be kept honest from — rather than a call beside each of
  // the dozen edits, one of which would eventually be forgotten and leave a
  // link that shares the board as it was two moves ago.
  scheduleUrlUpdate();
}

// ---------------------------------------------------------------------------
// Editing
// ---------------------------------------------------------------------------

/**
 * Snapshots the board before changing it. `mergeKey` names the change so a
 * run of the same kind on the same token counts once; pass nothing and the
 * change always gets its own step.
 */
function remember(mergeKey = null) {
  if (mergeKey !== null && mergeKey === lastChange) return;
  history.push(board);
  if (history.length > HISTORY_LIMIT) history.shift();
  lastChange = mergeKey;
}

function undo() {
  if (history.length === 0) return;
  // Undoing while a bent arrow is half-drawn would apply the reverted board
  // underneath a draft that still thinks it belongs to the board being
  // undone — cancel it rather than let two changes race.
  cancelArrowDrawing();
  board = history.pop();
  pendingCaptionId = null;
  lastChange = null;
  if (selectedId && !findToken(board, selectedId) && !findArrow(board, selectedId)) selectedId = null;
  paintView(board.view);
  render();
}

function select(id) {
  if (id === selectedId) return;
  const previous = selectedId;
  selectedId = id;
  // Moving to something else ends a run of edits to one caption, so the next
  // one starts its own undo step rather than merging into the last caption's.
  lastChange = null;
  // Whatever was being written is settled on the way out; a blank one goes.
  // That already repaints everything, so there is nothing left to do here.
  if (dropBlankCaption(previous)) return;
  // A focus change mid-draw (e.g. a stray Tab) must not paint over the
  // preview with a selection outline for a token the draft isn't about.
  if (!arrowDraft) layer('overlay').innerHTML = selectionMarkup();
  syncProperties();
}

function add(spec) {
  remember();
  board = addToken(board, { ...spec, ...openSpot(board) });
  selectedId = board.tokens[board.tokens.length - 1].id;
  render();
  tokenElement(selectedId)?.focus({ preventScroll: true });
}

/**
 * Replaces the whole board with one preset's, in one undo step: the person
 * choosing "Kickoff" wants the kickoff, not the kickoff stacked on top of
 * whatever was already on the field, and if it isn't what they wanted, Ctrl-Z
 * should hand back exactly what was there before — not the preset's tokens
 * removed one at a time.
 *
 * `boardFromPreset` (presets.js) builds the new board through `addToken`
 * with each token's own coordinates, never through `openSpot` above, which
 * exists for placing one hand-picked token at a time and piles same-mark
 * tokens into a corner well before a kickoff's 21 players are on it.
 */
function applyPreset(preset) {
  if (!preset) return;
  // The preset's view may not be the one a draft's points were dropped on.
  cancelArrowDrawing();
  pendingCaptionId = null;
  remember();
  board = boardFromPreset(preset);
  selectedId = null;
  paintView(board.view);
  render();
}

/**
 * Deleting leaves focus nowhere, which drops a keyboard user back to the
 * top of the page. Hand it on to whatever is next in the list, or to the
 * undo button when the board is empty — the one control that is certainly
 * still there, and the one they are most likely to want next.
 */
function removeAndMoveOn(id) {
  // Tab order runs through one layer at a time, so the token that inherits
  // focus is the neighbouring one of the same kind, not of the whole board.
  const siblings = board.tokens.filter((token) => token.type === findToken(board, id).type);
  const index = siblings.findIndex((token) => token.id === id);
  const heir = siblings[index + 1] ?? siblings[index - 1] ?? null;
  remember();
  board = removeToken(board, id);
  if (selectedId === id) selectedId = heir ? heir.id : null;
  render();
  (heir ? tokenElement(heir.id) : undoButton)?.focus({ preventScroll: true });
}

/** The arrow half of `removeAndMoveOn` — same reasoning, one list instead of two. */
function removeArrowAndMoveOn(id) {
  const index = board.arrows.findIndex((arrow) => arrow.id === id);
  const heir = board.arrows[index + 1] ?? board.arrows[index - 1] ?? null;
  remember();
  board = removeArrow(board, id);
  if (selectedId === id) selectedId = heir ? heir.id : null;
  render();
  (heir ? arrowElement(heir.id) : undoButton)?.focus({ preventScroll: true });
}

// ---------------------------------------------------------------------------
// Captions
// ---------------------------------------------------------------------------

/** The selected token if it is a caption, and `null` for anything else. */
function selectedCaption() {
  const token = selectedId === null ? null : findToken(board, selectedId);
  return token?.type === 'text' ? token : null;
}

/**
 * Every edit to one caption merges into a single undo step, the way a run of
 * nudges to one token does: typing a word, then sizing it, then colouring
 * it is one act of writing a caption, and Ctrl-Z after it should hand back
 * the board from before that caption rather than replay the formatting in
 * reverse. `select()` and the editor losing focus both end the run.
 */
const captionKey = (id) => `caption:${id}`;

/**
 * Puts a caption where the pointer went down and hands the keyboard straight
 * to the text field, so placing one and writing it is a single gesture
 * rather than a click followed by hunting for where to type.
 */
function placeCaption(at) {
  dropBlankCaption(selectedId);
  remember();
  board = addToken(board, {
    type: 'text',
    ...textDefaults,
    text: '',
    ...clampToFrame(at, board.view),
  });
  selectedId = board.tokens[board.tokens.length - 1].id;
  pendingCaptionId = selectedId;
  // Everything typed from here merges into the snapshot just taken, so one
  // undo gives back the board from before the caption existed — not an empty
  // caption sitting where this one was.
  lastChange = captionKey(selectedId);
  render();
  props?.querySelector('[data-field="text"]')?.focus();
}

/**
 * Changes one caption and repaints. `changes` reaches `state.js` as it came
 * off the control; the clamping, the folding of the angle and the refusal of
 * anything that is not a colour all happen there, because that is also where
 * a decoded share link will arrive and the two must not be checked twice by
 * two different rules.
 */
function applyEdit(id, changes) {
  remember(captionKey(id));
  board = editText(board, id, changes);
  const token = findToken(board, id);
  // The look carries to the next caption; the words obviously do not.
  if (!('text' in changes)) {
    textDefaults = {
      size: token.size,
      color: token.color,
      bold: token.bold,
      underline: token.underline,
      rotate: token.rotate,
    };
  }
  render();
}

/**
 * Settles a caption that is losing the editor: an empty one is dropped,
 * because an invisible zero-width `<text>` can only ever be selected by
 * accident. Returns whether the board changed.
 */
function dropBlankCaption(id) {
  if (!id) return false;
  const settled = commitText(board, id);
  const wasPending = id === pendingCaptionId;
  if (wasPending) pendingCaptionId = null;
  if (settled === board) return false;
  board = settled;
  // A caption placed and never given any words leaves nothing behind, undo
  // stack included: the entry `placeCaption` pushed describes a board
  // identical to this one, and an Undo button that spends a press putting
  // things back the way they already are reads as broken. Emptying a caption
  // that existed before this edit is a real deletion and keeps its step.
  if (wasPending) {
    history.pop();
    lastChange = null;
  }
  if (selectedId === id) selectedId = null;
  render();
  return true;
}

// ---------------------------------------------------------------------------
// Arrow drawing
// ---------------------------------------------------------------------------

/** The drawn length of a path — segment by segment, not point-to-point. */
function pathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i].across - points[i - 1].across, points[i].down - points[i - 1].down);
  }
  return total;
}

/**
 * Commits an arrow if it's long enough to be one, silently drops it if not.
 * The one path both a straight drag (Step 2) and a finished bent path (Step
 * 3) end at, so "too short to mean anything" is judged in exactly one place
 * for both — a click-to-click path made of several tiny segments is exactly
 * as much a mis-click as a two-point drag that barely moved.
 */
function commitArrow(points) {
  arrowDraft = null;
  if (points.length < 2 || pathLength(points) < ARROW_MIN_YARDS) {
    render();
    return;
  }
  remember();
  board = addArrow(board, { points });
  // render() before select(): a multi-click draw never moves focus (arrow-mode
  // presses preventDefault it away), so whatever was focused before this
  // commit is still focused, and render()'s own restoration re-focuses it —
  // firing a stale `focusin` that would otherwise overwrite the selection
  // this function is about to make. Calling select() after settles it.
  render();
  select(board.arrows[board.arrows.length - 1].id);
  arrowElement(selectedId)?.focus({ preventScroll: true });
}

function finishArrowDraft() {
  if (!arrowDraft) return;
  commitArrow(arrowDraft.points);
}

/**
 * Drops whatever is mid-flight — a held press, a started-but-unfinished
 * bent path — without touching the board. Called on Escape and on anything
 * that replaces the board out from under a draft (`undo`, `applyPreset`).
 */
function cancelArrowDrawing() {
  arrowGesture = null;
  lastArrowClick = null;
  if (arrowDraft === null) return;
  arrowDraft = null;
  layer('overlay').innerHTML = selectionMarkup();
}

/** Two presses this close together read as the double-click that ends a path. */
function isDoubleClick(at) {
  return (
    lastArrowClick !== null &&
    performance.now() - lastArrowClick.time < DOUBLE_CLICK_MS &&
    Math.hypot(at.across - lastArrowClick.at.across, at.down - lastArrowClick.at.down) < ARROW_MIN_YARDS
  );
}

function onArrowPointerDown(event) {
  // Without this the browser starts a text selection over the board instead
  // of letting the press become the first point of a path.
  event.preventDefault();
  const at = pointerYards(event);
  if (!at) return;
  svg.setPointerCapture(event.pointerId);
  arrowGesture = { pointerId: event.pointerId, start: clampToFrame(at, board.view), moved: false };
}

function onArrowPointerMove(event) {
  const at = pointerYards(event);
  if (!at) return;
  const current = clampToFrame(at, board.view);

  if (!arrowGesture || event.pointerId !== arrowGesture.pointerId) {
    // No press down: this is the hover between two clicks of a bent path,
    // previewing the segment a click would add next.
    if (arrowDraft) layer('overlay').innerHTML = previewMarkup([...arrowDraft.points, current]);
    return;
  }

  arrowGesture.current = current;
  arrowGesture.moved =
    Math.hypot(current.across - arrowGesture.start.across, current.down - arrowGesture.start.down) >=
    ARROW_MIN_YARDS;
  const base = arrowDraft ? arrowDraft.points : [arrowGesture.start];
  layer('overlay').innerHTML = previewMarkup([...base, current]);
}

function onArrowPointerUp(event) {
  if (!arrowGesture || event.pointerId !== arrowGesture.pointerId) return;
  const { start, moved, current } = arrowGesture;
  const at = current ?? start;
  arrowGesture = null;

  // A drag with nothing drawn yet is the Step 2 case: commit the straight
  // line right away rather than waiting for a click that will never come.
  if (moved && !arrowDraft) {
    commitArrow([start, at]);
    return;
  }
  // A plain click landing where the last one did, soon enough after it, is
  // the double-click that finishes a bent path — this release's own point
  // is the previous click's point again, so it is dropped, not appended.
  if (!moved && arrowDraft && isDoubleClick(at)) {
    lastArrowClick = null;
    finishArrowDraft();
    return;
  }
  arrowDraft = { points: [...(arrowDraft?.points ?? []), at] };
  lastArrowClick = { at, time: performance.now() };
  layer('overlay').innerHTML = previewMarkup(arrowDraft.points);
}

// ---------------------------------------------------------------------------
// Pointer input
// ---------------------------------------------------------------------------

/**
 * Where a pointer is, in yards.
 *
 * Through the SVG's own `getScreenCTM()` and then `geometry.js` backwards,
 * rather than by scaling against the element's bounding box: the board is
 * displayed at whatever size the page gives it (`.draw-board` has a
 * `max-height`), so the CSS-to-user-unit factor is not something this file
 * can work out on its own and stay right.
 */
function pointerYards(event) {
  const screen = svg.getScreenCTM();
  if (!screen) return null;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(screen.inverse());
  return { across: xToYards(point.x), down: yToYards(views[board.view], point.y) };
}

function onPointerDown(event) {
  if (mode === 'arrow') {
    onArrowPointerDown(event);
    return;
  }

  if (mode === 'text') {
    // Without this the browser starts a text selection over the board rather
    // than letting the press be where the caption goes.
    event.preventDefault();
    const at = pointerYards(event);
    if (at) placeCaption(at);
    return;
  }

  const arrow = event.target.closest?.('.draw-arrow');
  if (arrow) {
    event.preventDefault();
    select(arrow.dataset.id);
    arrow.focus({ preventScroll: true });
    return;
  }

  const element = event.target.closest?.('.draw-token');
  if (!element) {
    select(null);
    return;
  }
  const at = pointerYards(event);
  const token = findToken(board, element.dataset.id);
  if (!at || !token) return;

  // Without this the browser starts a text selection or an image drag over
  // the board instead, and neither ends where the finger lifts.
  event.preventDefault();
  select(token.id);
  element.focus({ preventScroll: true });
  // Capture, so a fast drag that outruns the token keeps tracking it rather
  // than stopping dead the moment the pointer leaves the shape.
  element.setPointerCapture(event.pointerId);

  drag = {
    element,
    id: token.id,
    pointerId: event.pointerId,
    // The grab offset: pick a token up by its edge and it stays held by its
    // edge, instead of jumping so its centre is under the pointer.
    offset: { across: token.across - at.across, down: token.down - at.down },
    at: { across: token.across, down: token.down },
    moved: false,
  };
}

function onPointerMove(event) {
  if (mode === 'arrow') {
    onArrowPointerMove(event);
    return;
  }
  if (!drag || event.pointerId !== drag.pointerId) return;
  const at = pointerYards(event);
  if (!at) return;
  drag.at = clampToFrame(
    { across: at.across + drag.offset.across, down: at.down + drag.offset.down },
    board.view,
  );
  drag.moved = true;
  // The DOM moves during the drag and the state only at the end of it: a
  // push per `pointermove` would fill the undo stack with one drag.
  const where = placement(drag.at);
  drag.element.setAttribute('transform', where);
  layer('overlay').firstElementChild?.setAttribute('transform', where);
}

function onPointerUp(event) {
  if (mode === 'arrow') {
    onArrowPointerUp(event);
    return;
  }
  if (!drag || event.pointerId !== drag.pointerId) return;
  const { id, at, moved } = drag;
  drag = null;
  if (moved && findToken(board, id)) {
    remember();
    board = moveToken(board, id, at);
  }
  render();
}

/**
 * A cancelled press (the pointer was yanked away — an alert, a browser
 * gesture) drops only that press, not a bent path already under way: the
 * points already clicked in are still good, so only Escape or finishing the
 * path should give those up.
 */
function onArrowPointerCancel(event) {
  if (!arrowGesture || event.pointerId !== arrowGesture.pointerId) return;
  arrowGesture = null;
  layer('overlay').innerHTML = arrowDraft ? previewMarkup(arrowDraft.points) : selectionMarkup();
}

/** `pointercancel` needs its own arrow handling; a token drag keeps its existing one. */
function onPointerCancel(event) {
  if (mode === 'arrow') {
    onArrowPointerCancel(event);
    return;
  }
  onPointerUp(event);
}

// ---------------------------------------------------------------------------
// Keyboard input
// ---------------------------------------------------------------------------

const NUDGES = {
  ArrowLeft: { across: -1, down: 0 },
  ArrowRight: { across: 1, down: 0 },
  ArrowUp: { across: 0, down: -1 },
  ArrowDown: { across: 0, down: 1 },
};

function onBoardKeyDown(event) {
  const arrow = event.target.closest?.('.draw-arrow');
  if (arrow) {
    // An arrow has no single position to nudge, only an existence to end.
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeArrowAndMoveOn(arrow.dataset.id);
    }
    return;
  }

  const element = event.target.closest?.('.draw-token');
  if (!element) return;
  const token = findToken(board, element.dataset.id);
  if (!token) return;

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    removeAndMoveOn(token.id);
    return;
  }

  // A caption is `role="button"`, and what activating it does is open the
  // one control that can change it. Without this a keyboard user can reach
  // a caption and move it but never rewrite it.
  if (token.type === 'text' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    props?.querySelector('[data-field="text"]')?.focus();
    return;
  }

  const nudge = NUDGES[event.key];
  if (!nudge) return;
  event.preventDefault();
  const step = event.shiftKey ? NUDGE_YARDS_SHIFT : NUDGE_YARDS;
  const at = clampToFrame(
    { across: token.across + nudge.across * step, down: token.down + nudge.down * step },
    board.view,
  );
  remember(`nudge:${token.id}`);
  board = moveToken(board, token.id, at);
  select(token.id);
  render();
}

function onDocumentKeyDown(event) {
  // The way out of a drawing mode has to work from anywhere, including with
  // a press still down or a bent path half-finished — so this is checked
  // before anything else here, and regardless of what has focus.
  if (event.key === 'Escape') {
    // Leaving text mode with the caret still in the caption field would
    // leave the board deaf to its own keys, and the blur is also what
    // settles a caption that never got any words.
    if (props?.contains(document.activeElement)) document.activeElement.blur();
    setMode('select');
    return;
  }

  if (event.key === 'Enter' && mode === 'arrow' && arrowDraft) {
    // A focused button or link still wants its own Enter; only take it over
    // when nothing on the page has a better claim to the key.
    const active = document.activeElement;
    if (active?.matches?.('button, a, input, textarea, [contenteditable]')) return;
    event.preventDefault();
    finishArrowDraft();
    return;
  }

  if (!(event.ctrlKey || event.metaKey) || event.shiftKey) return;
  if (event.key.toLowerCase() !== 'z') return;
  // Undo belongs to whatever the caret is in, if it is in anything.
  const active = document.activeElement;
  if (active?.matches?.('input, textarea, [contenteditable]')) return;
  event.preventDefault();
  undo();
}

// ---------------------------------------------------------------------------
// Tool mode
// ---------------------------------------------------------------------------

/**
 * Switches between picking things up and drawing arrows. Cancels a draw in
 * flight rather than let it survive a mode change with nowhere to finish:
 * once the pointer or keyboard input that would extend or end it stops
 * reaching the arrow handlers, an orphaned draft can never be completed.
 */
function setMode(next) {
  cancelArrowDrawing();
  dropBlankCaption(selectedId);
  mode = next;
  // The board's own cursor (crosshair to draw, caret to write, grab to pick
  // up) is the one hint that a plain click does something different now, for
  // anyone not reading the toolbar.
  svg?.classList.toggle('draw-mode-arrow', mode === 'arrow');
  svg?.classList.toggle('draw-mode-text', mode === 'text');
  updateModeButtons();
}

/** Keeps the toolbar's radio-style trio honest with `mode` — one visibly and audibly on. */
function updateModeButtons() {
  modeButtons?.forEach((btn) => setPressed(btn, btn.dataset.mode === mode));
}

/** A toggle button that says out loud, and shows, whether it is on. */
function setPressed(button, on) {
  button.classList.toggle('active', on);
  button.setAttribute('aria-pressed', String(on));
}

// ---------------------------------------------------------------------------
// The caption editor
//
// Real form controls in the page, not an editable `<text>` in the SVG. SVG
// has no dependable `contenteditable`, and an `<input>` brings the mobile
// keyboard, IME, text selection, its own undo and screen-reader support that
// hand-rolling this on the board would have to reinvent badly.
//
// Everything here reads a control and hands the value to `state.js`. Nothing
// here decides what a legal size, angle or colour is — the same values
// arrive off a share link, and one rule checked in one place is the only
// version of that check that cannot drift.
// ---------------------------------------------------------------------------

/** `<input type="color">` speaks only hex; `black` is the board's spelling of it. */
const asHex = (color) => (color === 'black' ? '#000000' : color);

/**
 * Puts a value into a control — unless that control is the one being typed
 * in, which is left strictly alone until its owner leaves it.
 *
 * Writing a value a control already holds moves the caret in it for nothing;
 * writing one into a control mid-keystroke is worse than nothing. `state.js`
 * clamps a size to 6-36, so the "1" of a size 12 comes back from it as "6"
 * before the "2" is ever pressed, and every two-digit size — which is most
 * of the legal range — becomes unreachable by typing. The same trap the
 * angle's *snap* is kept out of its number field for; the size's *clamp*
 * needs the same exemption, and one guard here is cheaper than two.
 *
 * The board still follows every keystroke: only the text somebody is in the
 * middle of is left as they typed it, and `reconcile` settles it against
 * what the board actually drew the moment focus leaves.
 */
function setValue(control, value) {
  if (control === document.activeElement) return;
  if (control.value !== value) control.value = value;
}

/** What one control should read, given the caption that is selected. */
function controlValue(field, token) {
  return field === 'color' ? asHex(token.color) : String(token[field]);
}

/**
 * Settles one control against the caption after it has stopped being typed
 * in. Somebody who types 99 into Size and clicks away has to end up looking
 * at the 36 the board is drawing, not at a 99 that agrees with nothing.
 */
function reconcile(control) {
  const field = control?.dataset?.field;
  const token = selectedCaption();
  if (!field || !token) return;
  setValue(control, controlValue(field, token));
}

/**
 * The nearest of the three angles anybody actually asks for, if the slider
 * landed within a degree or two of it.
 */
function snapAngle(degrees) {
  const near = ROTATE_SNAP.find((target) => Math.abs(degrees - target) <= ROTATE_SNAP_DEGREES);
  return near ?? degrees;
}

function buildProperties() {
  props = document.querySelector('.draw-props');
  if (!props) return;

  const pair = (field, name, min, max, id) =>
    `<div class="draw-props-group">` +
    `<label class="form-label mb-0" for="${id}">${escapeText(name)}</label>` +
    // A slider and a number for the same value: the slider is what a thumb
    // on a phone can drive, and the number is the only one of the two that
    // can be given an exact figure from a keyboard.
    `<input type="range" class="form-range draw-props-slider" data-field="${field}"` +
    ` min="${min}" max="${max}" step="1" aria-label="${escapeText(name)} slider">` +
    `<input type="number" class="form-control form-control-sm draw-props-number" id="${id}"` +
    ` data-field="${field}" min="${min}" max="${max}" step="1">` +
    `</div>`;

  const toggle = (field, name) =>
    `<button type="button" class="btn btn-outline-dark btn-sm" data-toggle="${field}"` +
    ` aria-pressed="false">${escapeText(name)}</button>`;

  // The swatch is its own value: a coloured square, not a word for a colour.
  // Its `style` is a fixed string from `state.js`, never anything typed.
  const swatch = ({ color, name }) =>
    `<button type="button" class="draw-swatch" data-swatch="${escapeText(color)}"` +
    ` style="background: ${escapeText(color)}" aria-pressed="false"` +
    ` aria-label="${escapeText(name)}"></button>`;

  props.innerHTML =
    `<div class="draw-props-group">` +
    `<label class="form-label mb-0" for="draw-caption-text">Caption</label>` +
    `<input type="text" class="form-control form-control-sm" id="draw-caption-text"` +
    ` data-field="text" maxlength="${TEXT_MAX_LENGTH}" autocomplete="off"` +
    ` placeholder="Type a caption">` +
    `</div>` +
    pair('size', 'Size', TEXT_SIZE_MIN, TEXT_SIZE_MAX, 'draw-caption-size') +
    `<div class="draw-props-group" role="group" aria-label="Caption colour">` +
    `<label class="form-label mb-0" for="draw-caption-color">Colour</label>` +
    TEXT_SWATCHES.map(swatch).join('') +
    `<input type="color" class="form-control form-control-sm form-control-color"` +
    ` id="draw-caption-color" data-field="color" aria-describedby="draw-caption-print-note">` +
    `</div>` +
    `<div class="draw-props-group" role="group" aria-label="Caption weight">` +
    toggle('bold', 'Bold') +
    toggle('underline', 'Underline') +
    `</div>` +
    pair('rotate', 'Angle', ROTATE_MIN, ROTATE_MAX, 'draw-caption-angle') +
    // Said once, here, because this is the only control on the page that can
    // put colour on something that leaves the screen: the diagrams this site
    // publishes are black and white because they get photocopied and read on
    // a sideline, and a caption that means something only by being red means
    // nothing on that copy.
    `<p class="draw-props-print-note small text-body-secondary" id="draw-caption-print-note">` +
    `Colour is for the screen. On a black-and-white copier every caption prints flat grey ` +
    `and a pale one all but vanishes, so never let colour be the only thing a caption means.` +
    `</p>`;

  props.addEventListener('input', onPropsInput);
  props.addEventListener('click', onPropsClick);
  props.addEventListener('keydown', onPropsKeyDown);
  props.addEventListener('focusout', onPropsFocusOut);
  syncProperties();
}

/** Puts the selected caption into the controls, or hides them when there is none. */
function syncProperties() {
  if (!props) return;
  const token = selectedCaption();
  props.hidden = token === null;
  if (!token) return;
  for (const control of props.querySelectorAll('[data-field]')) {
    setValue(control, controlValue(control.dataset.field, token));
  }
  for (const button of props.querySelectorAll('[data-toggle]')) {
    setPressed(button, token[button.dataset.toggle]);
  }
  for (const button of props.querySelectorAll('[data-swatch]')) {
    setPressed(button, button.dataset.swatch === token.color);
  }
}

function onPropsInput(event) {
  const field = event.target.dataset.field;
  const token = selectedCaption();
  if (!field || !token) return;

  if (field === 'text' || field === 'color') {
    applyEdit(token.id, { [field]: event.target.value });
    return;
  }

  // A number input reads as an empty string while it is being retyped, and
  // there is no size or angle to apply until it is a number again.
  const value = Number(event.target.value);
  if (event.target.value === '' || !Number.isFinite(value)) return;
  applyEdit(token.id, {
    [field]: field === 'rotate' && event.target.type === 'range' ? snapAngle(value) : value,
  });
}

function onPropsClick(event) {
  const button = event.target.closest('button');
  const token = selectedCaption();
  if (!button || !token) return;
  if (button.dataset.swatch) applyEdit(token.id, { color: button.dataset.swatch });
  else if (button.dataset.toggle) {
    applyEdit(token.id, { [button.dataset.toggle]: !token[button.dataset.toggle] });
  }
}

/**
 * Enter finishes whichever control it is pressed in, the way it finishes a
 * bent arrow. Letting go of the focus is what settles it, so this is one
 * rule for the caption's words and for the numbers beside them rather than
 * a gesture that only the text field answers.
 */
function onPropsKeyDown(event) {
  if (event.key !== 'Enter' || event.target.dataset.field === undefined) return;
  event.preventDefault();
  event.target.blur();
}

function onPropsFocusOut(event) {
  // Before anything else, and whether or not the focus is staying in the
  // strip: the control being left has been showing whatever was typed into
  // it rather than what the board drew (see `setValue`), and it has to agree
  // with the caption again now that nobody is typing in it.
  reconcile(event.target);
  // Reaching from the text field for the Bold button is not leaving the
  // caption, and a caption you are about to write must not vanish on the way.
  if (props.contains(event.relatedTarget)) return;
  lastChange = null;
  dropBlankCaption(selectedId);
}

// ---------------------------------------------------------------------------
// The share link
//
// The board is the URL. Everything on screen is in the fragment, so the
// address bar is always a link to what is on it and "Copy link" is only a
// convenience over selecting that — there is no separate save, and nothing
// to lose by closing the tab.
//
// Nothing here validates anything. `codec.js` returns a board that has been
// through `state.js` or it returns `null`, and those are the only two things
// this side has to deal with.
// ---------------------------------------------------------------------------

/** The payload in the current fragment, or `null` if there isn't one. */
function readShareFragment() {
  const hash = location.hash.replace(/^#/, '');
  if (hash === '') return null;
  return new URLSearchParams(hash).get(SHARE_KEY);
}

/**
 * The page's own address for the board as it stands.
 *
 * An untouched default board is the bare page: arriving at /draw and
 * touching nothing should not leave a fragment in the address bar, in the
 * history entry or in whatever somebody copies out of it by hand.
 */
function boardUrl() {
  const here = location.pathname + location.search;
  const untouched =
    board.view === DEFAULT_VIEW && board.tokens.length === 0 && board.arrows.length === 0;
  return untouched ? here : `${here}#${SHARE_KEY}=${encode(board)}`;
}

function scheduleUrlUpdate() {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(writeUrl, URL_DEBOUNCE_MS);
}

/**
 * Puts the board in the address bar, and cancels any pending write so a
 * caller that needs the URL right now (the button) can flush it first.
 *
 * `replaceState` and never `pushState`. A board is edited dozens of times
 * in a sitting, and a history entry per drag is a Back button that walks
 * backwards through the drawing instead of leaving the page — which is the
 * one thing Back is for.
 */
function writeUrl() {
  clearTimeout(urlTimer);
  urlTimer = null;
  if (!urlWritable) return;
  const next = boardUrl();
  if (next === location.pathname + location.search + location.hash) return;
  try {
    // `window.history` spelled out, because `history` in this module is the
    // undo stack a few hundred lines up and shadows the global one. Written
    // bare, this is `[].replaceState` — undefined, and a TypeError swallowed
    // by the catch below, and a share link that silently never updates.
    window.history.replaceState(null, '', next);
  } catch {
    // A `file://` open refuses to rewrite the URL at all. The board still
    // works and only the link does not, so give up rather than throw again
    // on every edit for the rest of the sitting. "Copy link" still builds
    // the URL itself and still has the fallback field to show it in.
    urlWritable = false;
  }
}

/**
 * Says something in the live region, so the confirmation is heard and not
 * only seen. A colour change or an icon says nothing to a screen reader,
 * and "did that copy?" is exactly the question this button has to answer.
 */
function announce(message) {
  if (!shareStatus) return;
  // A live region speaks when its contents *change*, so pressing the button
  // twice with the same result would announce nothing the second time. The
  // clear has to land as its own change before the message does.
  shareStatus.textContent = '';
  setTimeout(() => {
    shareStatus.textContent = message;
  }, 0);
}

/** Shows the link for copying by hand, or puts the field away again. */
function showManualCopy(url) {
  if (!shareManual) return;
  shareManual.hidden = url === null;
  if (url === null) return;
  const field = shareManual.querySelector('input');
  field.value = url;
  field.focus();
  field.select();
}

/**
 * Copies the whole absolute URL, and falls back to showing it.
 *
 * `navigator.clipboard` needs a user gesture *and* a secure context. A
 * click is the gesture; `http://localhost` counts as secure and so does the
 * live site, but a `file://` open does not, and neither does a plain-http
 * page opened over a network — so the fallback is not a nicety. It puts the
 * link in a visible field and selects it, which is the same two keystrokes
 * away from copied.
 */
async function copyLink() {
  // The debounced write may not have landed. What gets copied has to be the
  // board on screen, not the board as it was a fifth of a second ago.
  writeUrl();
  const url = new URL(boardUrl(), location.href).href;
  try {
    await navigator.clipboard.writeText(url);
    showManualCopy(null);
    announce('Link copied. Paste it to send this board to somebody.');
  } catch {
    showManualCopy(url);
    announce('This browser would not let the page reach the clipboard. The link is selected in the box below — copy it with Ctrl-C, or Cmd-C on a Mac.');
  }
}

function buildShare() {
  const strip = document.querySelector('.draw-share');
  if (!strip) return;
  strip.innerHTML =
    `<p class="draw-share-status small mb-0" role="status"></p>` +
    `<div class="draw-share-manual" hidden>` +
    `<label class="form-label mb-0" for="draw-share-url">Link</label>` +
    `<input type="text" class="form-control form-control-sm" id="draw-share-url" readonly>` +
    `</div>`;
  shareStatus = strip.querySelector('.draw-share-status');
  shareManual = strip.querySelector('.draw-share-manual');
}

/**
 * What a link that will not open says, and it says it on the page rather
 * than in a console: the person holding a broken link has no idea what went
 * wrong and no way to ask. The board underneath is the default one, so the
 * page is still usable while they go back and ask for the link again.
 */
function showBadLinkNotice() {
  const notice = document.querySelector('.draw-notice');
  if (!notice) return;
  notice.innerHTML =
    `<div class="alert alert-warning" role="alert">` +
    `<p class="mb-2">That link could not be read, so this is a blank board rather than the play ` +
    `somebody meant to send. Long links get cut short by the apps they travel through — ask them ` +
    `to send it again, or to send it as a file.</p>` +
    `<button type="button" class="btn btn-sm btn-outline-dark" data-dismiss-notice>Dismiss</button>` +
    `</div>`;
  notice.hidden = false;
  notice.addEventListener('click', (event) => {
    if (!event.target.closest('[data-dismiss-notice]')) return;
    notice.hidden = true;
    notice.innerHTML = '';
  });
}

/**
 * Opens whatever the fragment holds. Called before the first paint, because
 * the shared board may be on a different crop than the default and painting
 * that one first would show the wrong field for a frame.
 */
function openShareLink() {
  const payload = readShareFragment();
  if (payload === null) return;
  const shared = decode(payload);
  if (shared) {
    board = shared;
    return;
  }
  showBadLinkNotice();
}

// ---------------------------------------------------------------------------
// The palette
// ---------------------------------------------------------------------------

/**
 * Officials go on the palette by their mark and players by their side,
 * because that is how each is named on a diagram and in a pregame. The
 * spoken name comes from `state.js` either way, so the button and the token
 * a click produces can never end up calling the same thing two things.
 */
function buildToolbar() {
  const toolbar = document.querySelector('.draw-toolbar');
  if (!toolbar) return;

  const button = (label, name, attribute, variant = 'btn-outline-dark') =>
    `<button type="button" class="btn ${variant} btn-sm" ${attribute}` +
    ` aria-label="${escapeText(name)}">${escapeText(label)}</button>`;

  const presetGroup = (presets, groupLabel, variant) =>
    `<div class="btn-group" role="group" aria-label="${escapeText(groupLabel)}">` +
    presets
      .map((preset) => button(preset.label, preset.ariaLabel, `data-preset="${preset.id}"`, variant))
      .join('') +
    `</div>`;

  // Radio-style: exactly one of the pair is ever the active one, which is
  // what `role="group"` plus `aria-pressed` on each button says out loud.
  const modeGroup =
    `<div class="btn-group" role="group" aria-label="Tool">` +
    button('Select', 'Select tool — click, drag and delete', 'data-mode="select" aria-pressed="false"') +
    button('Arrow', 'Arrow tool — draw a movement path', 'data-mode="arrow" aria-pressed="false"') +
    button('Text', 'Text tool — write a caption on the board', 'data-mode="text" aria-pressed="false"') +
    `</div>`;

  // Formations get a different outline colour than everything else on the
  // toolbar on purpose: they are the one group here that is not this
  // association's mechanics (see presets.js), and a person reaching for
  // "how a crew lines up" should feel, before reading a word, that these
  // buttons are a different kind of thing than Kickoff or Goal Line.
  toolbar.innerHTML =
    modeGroup +
    presetGroup(
      FORMATIONS.map((p) => ({ ...p, ariaLabel: `Start from the ${p.label} formation — a starting point, not officiating mechanics` })),
      'Formations — starting points',
      'btn-outline-primary',
    ) +
    presetGroup(
      SITUATIONS.map((p) => ({ ...p, ariaLabel: `Load the ${p.label} situation, with crew positions from the position cards` })),
      'Situations — crew mechanics',
      'btn-outline-dark',
    ) +
    `<div class="btn-group" role="group" aria-label="Officials">` +
    OFFICIALS.map((o) => button(o.mark, `Add ${o.name}`, `data-add-official="${o.mark}"`)).join('') +
    `</div>` +
    `<div class="btn-group" role="group" aria-label="Players">` +
    PLAYERS.map((p) => button(p.label, `Add ${p.name}`, `data-add-player="${p.kind}"`)).join('') +
    `</div>` +
    `<button type="button" class="btn btn-outline-secondary btn-sm" data-undo disabled>Undo</button>` +
    // Never disabled, even on an empty board: the link to a blank board is
    // still the link to this page, and a control that greys out for reasons
    // a person has to work out is worse than one that always answers.
    button('Copy link', 'Copy a link to this board', 'data-share', 'btn-outline-secondary');

  toolbar.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.undo !== undefined) undo();
    else if (target.dataset.share !== undefined) copyLink();
    else if (target.dataset.addOfficial) add({ type: 'official', mark: target.dataset.addOfficial });
    else if (target.dataset.addPlayer) add({ type: 'player', kind: target.dataset.addPlayer });
    else if (target.dataset.preset) applyPreset(PRESETS_BY_ID.get(target.dataset.preset));
    else if (target.dataset.mode) {
      setMode(target.dataset.mode);
      // A clicked <button> keeps focus by default, which would swallow the
      // Enter that is supposed to finish a bent path — a real <button>
      // answers Enter itself before it ever reaches onDocumentKeyDown. Its
      // job here is done; let focus go so the board can hear that key.
      target.blur();
    }
  });

  undoButton = toolbar.querySelector('[data-undo]');
  modeButtons = toolbar.querySelectorAll('[data-mode]');
  updateModeButtons();

  const hint = document.createElement('p');
  hint.className = 'small text-body-secondary';
  hint.textContent =
    'Start from a Situation (crew positions from the position cards) or a Formation ' +
    '(an offense-only starting point, not a mechanic) — either replaces the board and can ' +
    'be undone. Add a marker, then drag it into place. Or tab to one and nudge it with the ' +
    'arrow keys — hold Shift for a full yard — and remove it with Delete. Ctrl/Cmd-Z undoes. ' +
    'Switch to Arrow, then drag for a straight line or click point to point and finish with ' +
    'a double-click or Enter for a bent one; Delete removes a selected arrow. Switch to Text ' +
    'and click where a caption goes, then type it in the strip that appears — Enter or a ' +
    'click elsewhere finishes it, and one left empty is dropped. Escape backs out to Select ' +
    'from anywhere. Copy link puts the whole board in the address bar, so what you copy is ' +
    'what somebody else opens.';
  toolbar.insertAdjacentElement('afterend', hint);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

/**
 * Repaints the field itself for one view: the crop, the yard lines, the hash
 * marks — everything `renderBoard` bakes into the `field` layer, which
 * differs from view to view and so has to be rebuilt whenever a preset (or
 * an undo) lands on a different one. Rewriting `svg`'s children this way
 * loses nothing attached to `svg` itself, since every pointer and keyboard
 * listener below is bound to that element once, not to whatever happens to
 * be inside it.
 */
function paintView(viewName) {
  const { viewBox, markup } = renderBoard(viewName);
  svg.setAttribute('viewBox', viewBox);
  // Setting innerHTML on an <svg> element parses the fragment in the SVG
  // namespace (the browser uses the context element's namespace for fragment
  // parsing), so the nested <style>, <defs> and <g> land as real SVG nodes
  // rather than opaque HTML — no separate DOM-building code needed here.
  svg.innerHTML = markup;
}

function mount() {
  svg = document.getElementById('board');
  if (!svg) return;

  // Chromium puts an <svg> holding focusable children into the tab order
  // itself. Focusing the board does nothing, and a stop with no accessible
  // name and no behaviour is exactly the defect the tokens' tabindex is
  // there to avoid; -1 keeps it reachable in code and out of the sequence.
  svg.setAttribute('tabindex', '-1');

  // Before the first paint: a shared board may be on a different crop, and
  // painting the default one first would show the wrong field for a frame.
  openShareLink();
  paintView(board.view);

  buildToolbar();
  buildProperties();
  buildShare();

  // Delegated, so nothing has to be rebound every time a layer is redrawn.
  // `setPointerCapture` still works from here: it retargets the pointer's
  // events at the token, and they reach this listener by bubbling.
  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', onPointerUp);
  svg.addEventListener('pointercancel', onPointerCancel);
  svg.addEventListener('keydown', onBoardKeyDown);
  // Tabbing to a token or an arrow selects it, so the outline always says
  // what Delete (and, for a token, the arrow keys) is about to act on.
  svg.addEventListener('focusin', (event) => {
    const element = event.target.closest?.('.draw-token, .draw-arrow');
    if (element) select(element.dataset.id);
  });
  document.addEventListener('keydown', onDocumentKeyDown);

  render();
}

mount();
