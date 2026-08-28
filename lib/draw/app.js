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
 * Captions and the share link are later tasks; `board-text` is rendered
 * empty here.
 */
import { renderBoard, layerId } from './board.js';
import { official, player, movement } from '../field/markers.js';
import { escapeText } from '../field/escape.js';
import { x as toSvgX, y as toSvgY, num, xToYards, yToYards } from '../field/geometry.js';
import { views } from '../field/views.js';
import {
  DEFAULT_VIEW,
  OFFICIALS,
  PLAYERS,
  addArrow,
  addToken,
  clampToFrame,
  emptyBoard,
  findArrow,
  findToken,
  moveToken,
  openSpot,
  removeArrow,
  removeToken,
  tokenName,
} from './state.js';
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
 * `'select'` (the default) drags and picks things; `'arrow'` draws them. A
 * mode, not a modifier key, because a modifier held for the length of a
 * multi-click bent arrow is a modifier nobody can actually hold.
 */
let mode = 'select';

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
      : player({ kind: token.kind });
  return (
    `<g class="draw-token" data-id="${escapeText(token.id)}" tabindex="0" role="button"` +
    ` aria-label="${escapeText(tokenName(token))}" transform="${placement(token)}">` +
    `<circle r="${HIT_RADIUS}" class="draw-hit"/>${shape}</g>`
  );
}

function placement({ across, down }) {
  return `translate(${num(toSvgX(across))} ${num(toSvgY(views[board.view], down))})`;
}

/**
 * The `d` a set of football-unit points turns into on the current view.
 * Goes through `movement()` and pulls the attribute back out rather than
 * walking `points` itself, so the one place that knows how a path is built
 * stays `markers.js` — this only ever reads what that function already
 * decided.
 */
function pathD(points) {
  return /d="([^"]*)"/.exec(movement({ points }, views[board.view]))[1];
}

/**
 * One arrow: `movement()`'s dotted path and arrowhead, plus a fat invisible
 * twin of the same `d` for hit-testing. The dots `movement()` draws are too
 * sparse to reliably click, the same problem `HIT_RADIUS` solves for tokens.
 */
function arrowMarkup(arrow) {
  const d = pathD(arrow.points);
  return (
    `<g class="draw-arrow" data-id="${escapeText(arrow.id)}" tabindex="0" role="button"` +
    ` aria-label="Movement arrow">` +
    `<path d="${d}" class="draw-hit-line"/>${movement({ points: arrow.points }, views[board.view])}</g>`
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
  if (arrow) return `<path d="${pathD(arrow.points)}" class="draw-selection"/>`;
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
  layer('overlay').innerHTML = overlayMarkup();

  if (focusedId) (tokenElement(focusedId) ?? arrowElement(focusedId))?.focus({ preventScroll: true });
  if (undoButton) undoButton.disabled = history.length === 0;
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
  lastChange = null;
  if (selectedId && !findToken(board, selectedId) && !findArrow(board, selectedId)) selectedId = null;
  paintView(board.view);
  render();
}

function select(id) {
  if (id === selectedId) return;
  selectedId = id;
  // A focus change mid-draw (e.g. a stray Tab) must not paint over the
  // preview with a selection outline for a token the draft isn't about.
  if (!arrowDraft) layer('overlay').innerHTML = selectionMarkup();
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
  mode = next;
  // The board's own cursor (crosshair vs. grab) is the one hint that Arrow
  // mode changes what a plain click does, for anyone not reading the toolbar.
  svg?.classList.toggle('draw-mode-arrow', mode === 'arrow');
  updateModeButtons();
}

/** Keeps the toolbar's radio-style pair honest with `mode` — one visibly and audibly on. */
function updateModeButtons() {
  modeButtons?.forEach((btn) => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
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
    `<button type="button" class="btn btn-outline-secondary btn-sm" data-undo disabled>Undo</button>`;

  toolbar.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.undo !== undefined) undo();
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
    'a double-click or Enter for a bent one; Delete removes a selected arrow, Escape backs ' +
    'out to Select from anywhere.';
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
  paintView(board.view);

  buildToolbar();

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
