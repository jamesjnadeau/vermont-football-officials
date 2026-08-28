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
 * Arrows, captions and the share link are later tasks; the layers they fill
 * (`board-arrows`, `board-text`) are rendered empty here.
 */
import { renderBoard, layerId } from './board.js';
import { official, player } from '../field/markers.js';
import { escapeText } from '../field/escape.js';
import { x as toSvgX, y as toSvgY, num, xToYards, yToYards } from '../field/geometry.js';
import { views } from '../field/views.js';
import {
  DEFAULT_VIEW,
  OFFICIALS,
  PLAYERS,
  addToken,
  clampToFrame,
  emptyBoard,
  findToken,
  moveToken,
  openSpot,
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

let svg = null;
let undoButton = null;

// ---------------------------------------------------------------------------
// Drawing what is in the state
// ---------------------------------------------------------------------------

const layer = (name) => svg.querySelector(`#${layerId(name)}`);
const tokenElement = (id) => svg.querySelector(`.draw-token[data-id="${id}"]`);

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
 * The selection outline lives in the overlay layer and nowhere else. It is
 * chrome — it says which token the arrow keys will move — and the overlay
 * is the one layer that is never part of a shared or printed board, so it
 * cannot leak into either by being forgotten about later.
 */
function selectionMarkup() {
  const token = selectedId ? findToken(board, selectedId) : null;
  if (!token) return '';
  return `<circle r="${SELECTION_RADIUS}" class="draw-selection" transform="${placement(token)}"/>`;
}

function render() {
  // Re-rendering a layer destroys the element that had focus, which for a
  // keyboard user is the whole board disappearing under them. Put it back.
  const focusedId = document.activeElement?.closest?.('.draw-token')?.dataset.id ?? null;

  const drawnAs = (type) =>
    board.tokens
      .filter((token) => token.type === type)
      .map(tokenMarkup)
      .join('');

  layer('players').innerHTML = drawnAs('player');
  layer('officials').innerHTML = drawnAs('official');
  layer('overlay').innerHTML = selectionMarkup();

  if (focusedId) tokenElement(focusedId)?.focus({ preventScroll: true });
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
  board = history.pop();
  lastChange = null;
  if (selectedId && !findToken(board, selectedId)) selectedId = null;
  paintView(board.view);
  render();
}

function select(id) {
  if (id === selectedId) return;
  selectedId = id;
  layer('overlay').innerHTML = selectionMarkup();
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
  if (!drag || event.pointerId !== drag.pointerId) return;
  const { id, at, moved } = drag;
  drag = null;
  if (moved && findToken(board, id)) {
    remember();
    board = moveToken(board, id, at);
  }
  render();
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
  if (!(event.ctrlKey || event.metaKey) || event.shiftKey) return;
  if (event.key.toLowerCase() !== 'z') return;
  // Undo belongs to whatever the caret is in, if it is in anything.
  const active = document.activeElement;
  if (active?.matches?.('input, textarea, [contenteditable]')) return;
  event.preventDefault();
  undo();
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

  // Formations get a different outline colour than everything else on the
  // toolbar on purpose: they are the one group here that is not this
  // association's mechanics (see presets.js), and a person reaching for
  // "how a crew lines up" should feel, before reading a word, that these
  // buttons are a different kind of thing than Kickoff or Goal Line.
  toolbar.innerHTML =
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
  });

  undoButton = toolbar.querySelector('[data-undo]');

  const hint = document.createElement('p');
  hint.className = 'small text-body-secondary';
  hint.textContent =
    'Start from a Situation (crew positions from the position cards) or a Formation ' +
    '(an offense-only starting point, not a mechanic) — either replaces the board and can ' +
    'be undone. Add a marker, then drag it into place. Or tab to one and nudge it with the ' +
    'arrow keys — hold Shift for a full yard — and remove it with Delete. Ctrl/Cmd-Z undoes.';
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
  svg.addEventListener('pointercancel', onPointerUp);
  svg.addEventListener('keydown', onBoardKeyDown);
  // Tabbing to a token selects it, so the outline always says what the
  // arrow keys are about to move.
  svg.addEventListener('focusin', (event) => {
    const element = event.target.closest?.('.draw-token');
    if (element) select(element.dataset.id);
  });
  document.addEventListener('keydown', onDocumentKeyDown);

  render();
}

mount();
