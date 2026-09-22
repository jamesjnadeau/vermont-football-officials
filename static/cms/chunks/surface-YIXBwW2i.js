import { E as EntrySession, m as mediaUploader, R as REGION, h, b as buildFields, f as fieldsNeeded, d as describeError, N as NOTHING_TO_SAVE, l as loadConfig, a as declaredEntry, e as entryForUrl, c as adapterFor, C as CmsRepo, M as MediaStore, g as formState, i as findCollection, j as ConfigError, k as bodySelector } from "./session-CDqd4jNF.js";
import { M as MarkdownDocument } from "./index-DsHjQCH9.js";
import { T as TAG_NAME, L as LIBRARY, C as ContentToolsEditor } from "./content-tools-editor-CbCd3mmt.js";
import { s as sheetFactory } from "./constructed-styles-BEftmh6P.js";
import { d as allowTools, P as PROFILES } from "./remove-PhizlUwg.js";
const EDITOR_REGIONS = "[data-editable]";
class EditingSession extends EntrySession {
  constructor(options) {
    super(options);
    this.store = options.store;
    this._region = options.region;
    this._original = options.region.innerHTML;
    this._edited = null;
    this._dressed = null;
    this._started = false;
    this._saving = false;
    this._watcher = null;
    this.editor = this._build(options);
  }
  /** Whether the switch is on: the tools are up and the body is ours. */
  started() {
    return this._started;
  }
  /**
   * Be told when the switch is pressed.
   *
   * One watcher, set by whoever is showing the bar. The switch is the
   * only thing on this surface that changes state without anybody
   * calling a method here, so it is the only thing that needs to push
   * rather than be asked -- and one caller means a plain field rather
   * than a subscriber list whose removal path no test could reach.
   */
  watch(fn) {
    this._watcher = fn;
  }
  /** Take the editor back off the page. */
  close() {
    this.editor.remove();
  }
  /**
   * What a save would write, with the body as the editor holds it.
   *
   * The media rewrite belongs in the same pass for the reason the base
   * class gives about `pending` generally: it happens on the way to the
   * commit, so it has to happen on the way to the comparison. Rewriting
   * the HTML and asking separately what to commit can disagree, and the
   * way they disagree is an entry referencing an image nobody uploaded.
   *
   * `update` rather than the base's `updateFrontmatter`, because here
   * the body genuinely has been through an editor and every block has
   * to be re-compared against the source.
   */
  pending() {
    const merged = this.merged();
    const { html, media } = this.store.rewrite(this.html());
    return {
      content: this.doc.update(html, merged === null ? void 0 : { frontmatter: merged }),
      media
    };
  }
  /**
   * The body HTML as it stands right now.
   *
   * `save(true)` is passive: it reports without unmounting the
   * regions, so the caret stays where the person left it. It fills
   * `_edited` synchronously through the handler below, and the cache
   * is why this may be called twice -- the dirty check and the submit
   * both want the answer, and the second caller would otherwise be
   * told nothing had changed.
   *
   * Asked of the editor even while the switch is OFF, and a
   * `state === 'editing'` guard was written here and deleted after
   * mutation testing could not kill it. It is measured rather than
   * assumed: `save()` with no regions reports `{}` -- by the early
   * return when nothing has moved since the last start, and by an
   * empty loop otherwise -- so `_remember` skips and the cached
   * answer stands either way. The one thing it does touch,
   * `_domRegions`, is recomputed from the region list at the top of
   * the next `syncRegions()`, which is the first line of `start()`.
   *
   * So with the switch off the answer is what the last editing
   * session left behind, or the branch as it was read if there has
   * not been one. That is what makes Submit mean something after a
   * tick: the edits are kept, the tools are gone, and the button
   * still commits them.
   */
  html() {
    this.editor.save(true);
    return this._edited ?? this.doc.toHTML();
  }
  /**
   * The editor element for this entry, built and not yet connected.
   *
   * Everything is in place before it enters the DOM, because
   * `connectedCallback` boots immediately: an element connected first
   * and configured afterwards boots against the defaults and then has
   * to be rebooted, which tears down and re-claims the lease for
   * nothing.
   */
  _build(options) {
    const document = options.document;
    const editor = document.createElement(TAG_NAME);
    editor.setAttribute("regions", EDITOR_REGIONS);
    editor.setAttribute("mode", "markdown");
    editor.setAttribute("ignition", "");
    editor.imageUploader = mediaUploader({ store: this.store });
    const region = options.region;
    region.setAttribute("data-name", REGION);
    editor.regionElements = [region];
    editor.addEventListener("ct-start", () => this._dress());
    editor.addEventListener("ct-started", () => {
      var _a;
      this._started = true;
      (_a = this._watcher) == null ? void 0 : _a.call(this);
    });
    editor.addEventListener("ct-stop", (ev) => {
      var _a;
      this._saving = ((_a = ev.detail) == null ? void 0 : _a.save) === true;
    });
    editor.addEventListener("ct-saved", (ev) => this._remember(ev));
    editor.addEventListener("ct-stopped", () => this._undress());
    return editor;
  }
  /** Put our render of the branch in the page, ready to be edited. */
  _dress() {
    this._dressed = this._edited;
    this._region.innerHTML = this._edited ?? this.doc.toHTML();
  }
  /** Hand the page back, as it was or as it has been edited. */
  _undress() {
    var _a;
    this._started = false;
    if (!this._saving) {
      this._edited = this._dressed;
      if (this._dressed === null) {
        this._region.innerHTML = this._original;
      }
    }
    (_a = this._watcher) == null ? void 0 : _a.call(this);
  }
  /**
   * Remember what the editor last reported for the body.
   *
   * Only when the region is actually in the map. `save()` reports the
   * regions whose content moved since the last save and then RESETS
   * that baseline, so an unchanged save reports none -- and reading
   * the absent key as "the body is empty now" would make the next
   * submit write an empty file over somebody's post.
   */
  _remember(ev) {
    var _a;
    const regions = (_a = ev.detail) == null ? void 0 : _a.regions;
    const html = regions ? regions[REGION] : void 0;
    if (typeof html === "string") {
      this._edited = html;
    }
  }
}
const editCSS = "/**\n * Local replacements for the handful of Bourbon mixins this project used.\n *\n * Bourbon existed here only to emit vendor prefixes for transform, transition,\n * animation, @keyframes, box-sizing, user-select and hyphens. All of those are\n * unprefixed standards in every browser this library targets, so the mixins are\n * gone and the properties are written directly -- except where a prefix is still\n * genuinely required (see `user-select` and `hyphens` below).\n */\n/**\n * The one Bourbon *variable* this project used, inlined verbatim from\n * bourbon/addons/_font-family.scss so the `pre` styling is unchanged.\n */\n/**\n * Contain floats. The one Bourbon mixin worth keeping as a mixin, since it\n * expands to a pseudo-element rather than a single declaration.\n */\n/**\n * Safari still requires -webkit-user-select; the -moz- and -ms- forms are long\n * obsolete and are not emitted.\n */\n/**\n * Safari still requires -webkit-hyphens.\n */\n/**\n * All widgets are assigned a z-index equal to or higher than this setting. The\n * base z-index can be adjusted to overcome z-index conflicts with existing page\n * elements.\n */\n/**\n * For UI widgets that appear on the page (as opposed to appearing in front of a\n * modal screen) we define a base background colour.\n */\n/**\n * The colour used when casting shadows for widgets that appear to float.\n */\n/**\n * Confirm, Cancel and Edit actions are common amoung the various ui components.\n * Each action has an associated/common colour.\n */\n/**\n * Tooltips feature for a number of components, their base appearance is\n * configured using a mixin.\n */\n/**\n * The following settings relate to typography. For portability we limit the the\n * use of fonts to:\n *\n * - `type-icon` used for displaying icons (courtesy of http://icomoon.io).\n * - `type-text` used for displaying text.\n *\n */\n:host {\n  all: initial;\n  display: block;\n  position: fixed;\n  right: 12px;\n  top: 12px;\n  width: max-content;\n  z-index: 9998;\n}\n\n.ct-edit {\n  background: rgba(233, 233, 233, 0.9);\n  border: 1px solid rgba(255, 255, 255, 0.5);\n  box-shadow: 0 3px 3px rgba(0, 0, 0, 0.35);\n  box-sizing: border-box;\n  color: #646464;\n  display: flex;\n  flex-direction: column;\n  max-width: min(320px, 100vw - 24px);\n  padding: 0 8px 8px;\n  font-family: arial, sans-serif;\n  font-size: 14px;\n  line-height: 18px;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.ct-edit--dragging {\n  opacity: 0.5;\n}\n\n.ct-grip {\n  cursor: move;\n  flex: none;\n  font-size: 0;\n  padding: 8px 0;\n  text-align: center;\n  touch-action: none;\n  user-select: none;\n}\n\n.ct-grip__bump {\n  background: rgba(70, 70, 70, 0.15);\n  border-radius: 12px;\n  display: inline-block;\n  height: 12px;\n  margin-left: 12px;\n  width: 12px;\n}\n.ct-grip__bump:first-child {\n  margin-left: 0;\n}\n\n.ct-edit__title {\n  color: black;\n  font-weight: bold;\n  margin: 0;\n}\n\n.ct-edit__hint {\n  margin: 4px 0 0;\n}\n\n.ct-edit--broken .ct-edit__title,\n.ct-edit--no-body .ct-edit__title,\n.ct-edit--failed .ct-edit__title {\n  color: #e74c3c;\n}\n\n.ct-edit--loading .ct-edit__hint {\n  font-style: italic;\n}\n\n.ct-edit {\n  max-height: calc(100vh - 24px);\n}\n\n.ct-edit__body {\n  min-height: 0;\n  overflow-y: auto;\n}\n\n.ct-edit__actions {\n  align-items: center;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  margin: 8px 0 0;\n}\n.ct-edit__actions[hidden][hidden] {\n  display: none;\n}\n\n.ct-edit__submit,\n.ct-edit__details {\n  background: #f7f7f7;\n  border: 1px solid #d0d0d0;\n  border-radius: 2px;\n  color: #646464;\n  cursor: pointer;\n  padding: 4px 10px;\n  font-family: arial, sans-serif;\n  font-size: 12px;\n  line-height: 16px;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n.ct-edit__submit:focus-visible,\n.ct-edit__details:focus-visible {\n  outline: 2px solid #2980b9;\n  outline-offset: 1px;\n}\n.ct-edit__submit:disabled,\n.ct-edit__details:disabled {\n  color: #646464;\n  cursor: default;\n}\n\n.ct-edit__submit {\n  background: #2980b9;\n  border-color: #2980b9;\n  color: white;\n  font-weight: bold;\n}\n.ct-edit__submit:disabled {\n  background: #f7f7f7;\n  border-color: #d0d0d0;\n}\n\n.ct-edit__pull {\n  color: #2980b9;\n  font-family: arial, sans-serif;\n  font-size: 12px;\n  line-height: 16px;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.ct-edit__note {\n  margin: 8px 0 0;\n  font-family: arial, sans-serif;\n  font-size: 12px;\n  line-height: 16px;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n.ct-edit__note:empty {\n  display: none;\n}\n\n.ct-edit__note--refused {\n  color: #e74c3c;\n}\n\n.ct-edit__conflict {\n  box-sizing: border-box;\n  border: 1px solid #d0d0d0;\n  display: block;\n  height: 120px;\n  margin: 8px 0 0;\n  resize: vertical;\n  white-space: pre;\n  width: 100%;\n}\n.ct-edit__conflict[hidden][hidden] {\n  display: none;\n}\n\n.ct-fields {\n  border-top: 1px solid #d0d0d0;\n  margin: 8px 0 0;\n  padding: 8px 0 0;\n}\n\n.ct-fields__heading {\n  display: none;\n}\n\n.ct-fields__note {\n  color: #646464;\n  margin: 0 0 8px;\n  font-family: arial, sans-serif;\n  font-size: 12px;\n  line-height: 16px;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n.ct-fields__note:empty {\n  display: none;\n}\n\n.ct-fields__rows {\n  display: grid;\n  gap: 8px;\n}\n\n.ct-field__label {\n  display: block;\n  font-weight: bold;\n  margin: 0 0 2px;\n  font-family: arial, sans-serif;\n  font-size: 12px;\n  line-height: 16px;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.ct-field__input {\n  border: 1px solid #d0d0d0;\n  box-sizing: border-box;\n  display: block;\n  padding: 4px 6px;\n  width: 100%;\n  font-family: arial, sans-serif;\n  font-size: 12px;\n  line-height: 16px;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n.ct-field__input:focus-visible {\n  outline: 2px solid #2980b9;\n  outline-offset: -1px;\n}\n.ct-field__input[readonly] {\n  background: #f7f7f7;\n  color: #646464;\n}\n\ntextarea.ct-field__input {\n  min-height: 48px;\n  resize: vertical;\n}\n\n.ct-field__check {\n  display: block;\n  margin: 2px 0;\n}\n\n.ct-field__hint {\n  color: #646464;\n  margin: 2px 0 0;\n  font-family: arial, sans-serif;\n  font-size: 11px;\n  line-height: 15px;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.ct-field__error {\n  color: #e74c3c;\n  margin: 2px 0 0;\n  font-family: arial, sans-serif;\n  font-size: 11px;\n  line-height: 15px;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.ct-field__preview {\n  border: 1px solid #d0d0d0;\n  display: block;\n  margin: 4px 0 0;\n  max-height: 80px;\n  max-width: 100%;\n}";
const BAR_TAG = "content-tools-edit-bar";
const barStyleSheet = sheetFactory(editCSS);
const FIELDS_ID = "ct-edit-fields";
function buildBar(doc, handlers) {
  const node = doc.createElement(BAR_TAG);
  const root = node.attachShadow({ mode: "open" });
  const sheet = barStyleSheet(doc);
  if (sheet) {
    root.adoptedStyleSheets = [sheet];
  }
  const title = h(doc, "p", { class: "ct-edit__title" });
  const hint = h(doc, "p", { class: "ct-edit__hint" });
  let open2 = false;
  const details = h(doc, "button", {
    class: "ct-edit__details",
    type: "button",
    "aria-controls": FIELDS_ID,
    "aria-expanded": "false",
    onclick: () => handlers.showFields(!open2)
  }, ["Details"]);
  const pull = h(doc, "a", {
    class: "ct-edit__pull",
    target: "_blank",
    rel: "noopener noreferrer"
  });
  const submit = h(doc, "button", {
    class: "ct-edit__submit",
    type: "button",
    onclick: () => handlers.submit()
  }, [SUBMIT_LABEL]);
  const actions = h(doc, "div", { class: "ct-edit__actions" }, [details, pull, submit]);
  const note = h(doc, "p", { class: "ct-edit__note" });
  const conflict = h(doc, "textarea", {
    class: "ct-edit__conflict",
    readonly: "readonly",
    spellcheck: "false",
    "aria-label": "The markdown this submit would have written"
  });
  const fields = buildFields(doc);
  fields.node.setAttribute("id", FIELDS_ID);
  const grip = h(
    doc,
    "div",
    { class: "ct-edit__grip ct-grip", "aria-hidden": "true" },
    [0, 1, 2].map(() => h(doc, "div", { class: "ct-grip__bump" }))
  );
  const body = h(
    doc,
    "div",
    { class: "ct-edit__body" },
    [title, hint, actions, note, fields.node, conflict]
  );
  const panel = h(doc, "div", { class: "ct-edit", role: "status" }, [grip, body]);
  root.appendChild(panel);
  let held = false;
  const drag = draggable(node, grip, (dragging) => {
    held = dragging;
    panel.classList.toggle("ct-edit--dragging", dragging);
  });
  return {
    node,
    values: () => fields.values(),
    errors: () => fields.errors(),
    update(state) {
      const said2 = describe(state);
      panel.className = `ct-edit ct-edit--${state.kind}`;
      panel.classList.toggle("ct-edit--dragging", held);
      title.textContent = said2.title;
      hint.textContent = said2.hint;
      const editing = state.kind === "editing" ? state : null;
      actions.hidden = editing === null;
      fields.update(editing ? editing.fields : null);
      const form = !fields.node.hidden;
      details.hidden = !form;
      if (form) {
        open2 = editing.fieldsOpen;
        fields.node.hidden = !open2;
        details.setAttribute("aria-expanded", String(open2));
      }
      const save = editing ? editing.save : null;
      submit.disabled = save === null || save.busy;
      submit.textContent = (save == null ? void 0 : save.busy) ? "Submitting…" : SUBMIT_LABEL;
      note.textContent = save ? save.note : "";
      note.classList.toggle(
        "ct-edit__note--refused",
        save !== null && save.refused
      );
      const open_pull = save ? save.pull : null;
      pull.textContent = open_pull ? `Pull request #${open_pull.number}` : "";
      if (open_pull) {
        pull.setAttribute("href", open_pull.url);
      } else {
        pull.removeAttribute("href");
      }
      pull.hidden = open_pull === null;
      conflict.value = (save == null ? void 0 : save.conflict) ?? "";
      conflict.hidden = !(save == null ? void 0 : save.conflict);
      drag.contain();
    }
  };
}
const BAR_POSITION_KEY = "ct-edit-bar-position";
function storage(view) {
  try {
    return view ? view.localStorage : null;
  } catch {
    return null;
  }
}
function draggable(node, grip, dragging) {
  var _a;
  const doc = node.ownerDocument;
  const view = doc.defaultView;
  let offset = null;
  const place = (left, top) => {
    node.style.left = `${Math.round(left)}px`;
    node.style.top = `${Math.round(top)}px`;
    node.style.right = "auto";
  };
  const contain = () => {
    if (!node.isConnected || !node.style.left) {
      return;
    }
    const width = doc.documentElement.clientWidth;
    const height = doc.documentElement.clientHeight;
    const rect = node.getBoundingClientRect();
    place(
      Math.max(0, Math.min(rect.left, width - rect.width)),
      Math.max(0, Math.min(rect.top, height - rect.height))
    );
  };
  const onMove = (ev) => {
    if (offset) {
      place(ev.clientX - offset.x, ev.clientY - offset.y);
    }
  };
  const onStop = () => {
    var _a2;
    if (!offset) {
      return;
    }
    offset = null;
    doc.removeEventListener("pointermove", onMove);
    doc.removeEventListener("pointerup", onStop);
    doc.removeEventListener("pointercancel", onStop);
    dragging(false);
    contain();
    try {
      (_a2 = storage(view)) == null ? void 0 : _a2.setItem(
        BAR_POSITION_KEY,
        `${parseInt(node.style.left)},${parseInt(node.style.top)}`
      );
    } catch {
    }
  };
  grip.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 || offset) {
      return;
    }
    ev.preventDefault();
    const rect = node.getBoundingClientRect();
    offset = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onStop);
    doc.addEventListener("pointercancel", onStop);
    dragging(true);
  });
  const saved = (_a = storage(view)) == null ? void 0 : _a.getItem(BAR_POSITION_KEY);
  if (saved && /^\d+,\d+$/.test(saved)) {
    const [left, top] = saved.split(",").map(Number);
    place(left, top);
  }
  view == null ? void 0 : view.addEventListener("resize", contain);
  return { contain };
}
const SUBMIT_LABEL = "Submit for review";
function describe(state) {
  switch (state.kind) {
    case "broken":
      return { title: "The CMS config could not be read", hint: state.hint };
    case "not-an-entry":
      return { title: "Not an editable page", hint: state.hint };
    case "no-body":
      return { title: entryName(state.entry), hint: state.hint };
    /* NONE of the four below names the element the `body` selector
       matched, and they used to. `Found article#post-1.post, matched
       by article.post.` is a deployment check written where an
       author reads it, so every one of them paid for a line that
       answered a question they had not asked -- on every page, every
       time. The check itself is not lost: `no-body` still says
       exactly what was looked for when nothing matched, which is the
       arrangement that actually breaks. What went is the reassurance
       in the case where it worked. */
    case "ready":
      return { title: entryName(state.entry), hint: "Ready to edit." };
    case "editing":
      return {
        title: entryName(state.entry),
        /* "Editing" is claimed only once something is. With the
           switch off the page is still the site's own, and a bar
           saying otherwise over the reader's markup is the one
           thing this state must not do. */
        hint: state.started ? "Editing this page." : "Press the pencil, top left of the page, to edit it."
      };
    case "signed-out":
      return {
        title: entryName(state.entry),
        hint: "Sign in through the admin screens in this tab, then come back to edit it."
      };
    case "loading":
      return {
        title: entryName(state.entry),
        /* "the branch" rather than "the repository", because that
           is the surprising part: the words about to replace what
           is on screen are the ones under review, not the ones
           this page was built from. */
        hint: "Reading the version on the branch..."
      };
    case "failed":
      return { title: entryName(state.entry), hint: state.hint };
  }
}
function entryName(entry) {
  return `${entry.collection}/${entry.slug}`;
}
class PageEdit {
  constructor(options) {
    this.session = options.session;
    this._bar = options.bar;
    this._repo = options.repo;
    this._seen = options.seen;
    this._fields = options.fields;
    this._open = false;
    this._busy = false;
    this._note = "";
    this._refused = false;
    this._conflict = null;
    this.session.watch(() => this.render());
  }
  /**
   * Put the current state on the bar.
   *
   * The form starts CLOSED, which is the one place this surface
   * differs from the shell's and it is not a style choice. Under
   * /admin the form is a pane beside the editor and the screen is
   * ours; here the bar floats over somebody's published page, and a
   * panel that opens itself to the height of a nine-field form covers
   * the words the author came to read.
   */
  render() {
    this._bar.update({
      kind: "editing",
      ...this._seen,
      fields: this._fields,
      fieldsOpen: this._open,
      /* Asked of the session at render time rather than
         remembered here. The switch changes it, and the switch is
         not ours -- a copy kept beside it would be a second
         answer that goes stale exactly when somebody presses the
         thing this whole surface is about. */
      started: this.session.started(),
      save: this._state()
    });
  }
  /** Show or hide the frontmatter form. */
  show(open2) {
    this._open = open2;
    this.render();
  }
  /**
   * Commit what is in the editor, and open or update the pull request.
   *
   * Returns nothing and never rejects: it is a click handler, and the
   * promise it starts is one nobody is holding. The `void` is what
   * says so at the one call site that matters.
   */
  submit() {
    void this._submit();
  }
  async _submit() {
    const errors = this._bar.errors();
    if (errors.length > 0) {
      this._say(fieldsNeeded(errors));
      return;
    }
    const pending = this.session.pending();
    this._busy = true;
    this._note = "";
    this._refused = false;
    this._conflict = null;
    this.render();
    let result;
    try {
      result = await this.session.commit(this._repo, pending);
    } catch (error) {
      this._busy = false;
      const said2 = describeError(error);
      this._say(said2, said2.kind === "conflict" ? pending.content : null);
      return;
    }
    this._busy = false;
    if (result.commit === null) {
      this._say(NOTHING_TO_SAVE);
      return;
    }
    this._note = `Submitted as ${result.commit.slice(0, 7)}.`;
    this._refused = false;
    this._conflict = null;
    this.render();
  }
  /** Say a described outcome, and show it. */
  _say(said2, conflict = null) {
    this._note = `${said2.title} ${said2.detail}`;
    this._refused = said2.kind !== "notice";
    this._conflict = conflict;
    this.render();
  }
  _state() {
    const pull = this.session.entry.pull;
    return {
      busy: this._busy,
      note: this._note,
      refused: this._refused,
      pull: pull ? { number: pull.number, url: pull.html_url } : null,
      conflict: this._conflict
    };
  }
}
const { ContentTools } = LIBRARY;
const setUp = /* @__PURE__ */ new WeakSet();
async function extend(editor, extension) {
  if (extension === null || extension === void 0) {
    return;
  }
  if (typeof extension !== "object") {
    throw new Error("contentToolsEdit must be an object.");
  }
  if (extension.setup !== void 0) {
    if (typeof extension.setup !== "function") {
      throw new Error("contentToolsEdit.setup must be a function.");
    }
    if (!setUp.has(extension)) {
      setUp.add(extension);
      await extension.setup(LIBRARY);
    }
  }
  const allowed = names(extension.allowTools, "contentToolsEdit.allowTools");
  if (allowed.length) {
    editor.profile = allowTools(PROFILES[editor.mode], allowed);
  }
  let tools = null;
  if (extension.tools !== void 0) {
    if (!Array.isArray(extension.tools)) {
      throw new Error("contentToolsEdit.tools must be an array of arrays of tool names.");
    }
    tools = extension.tools.map(
      (group, i) => names(group, `contentToolsEdit.tools[${i}]`)
    );
  } else if (allowed.length) {
    tools = [...ContentTools.DEFAULT_TOOLS, allowed];
  }
  if (tools) {
    for (const group of tools) {
      for (const name of group) {
        try {
          ContentTools.ToolShelf.fetch(name);
        } catch {
          throw new Error(
            `\`${name}\` is in the toolbox but nothing stowed it on the tool shelf. Stow it in contentToolsEdit.setup.`
          );
        }
      }
    }
    editor.tools = tools;
  }
  const styles = extension.styles;
  for (const sheet of Array.isArray(styles) ? styles : [styles]) {
    if (sheet !== void 0 && sheet !== null) {
      editor.adoptStyles(sheet);
    }
  }
}
function names(value, where) {
  if (value === void 0) {
    return [];
  }
  if (!Array.isArray(value) || !value.every((name) => typeof name === "string")) {
    throw new Error(`${where} must be an array of tool names.`);
  }
  return [...value];
}
const DEFAULT_CONFIG_URL = "/cms-config.yml";
const CONFIG_META = "cms:config";
const CONTENT_STYLES_MARK = "ct-edit-content-styles";
async function open(where, options = {}) {
  const doc = where.document;
  const live = { editing: null };
  const bar = buildBar(doc, {
    submit: () => {
      var _a;
      return (_a = live.editing) == null ? void 0 : _a.submit();
    },
    showFields: (open2) => {
      var _a;
      return (_a = live.editing) == null ? void 0 : _a.show(open2);
    }
  });
  doc.body.appendChild(bar.node);
  let located2;
  try {
    located2 = await resolve(where, options);
  } catch (error) {
    bar.update(failure(error));
    return { bar, editing: null, session: null };
  }
  bar.update(located2);
  if (located2.kind !== "ready") {
    return { bar, editing: null, session: null };
  }
  const seen = {
    entry: located2.entry,
    selector: located2.selector,
    body: located2.body
  };
  try {
    const editing = await start(where, bar, located2.config, seen, options);
    live.editing = editing;
    editing == null ? void 0 : editing.render();
    return { bar, editing, session: editing ? editing.session : null };
  } catch (error) {
    bar.update({ kind: "failed", ...seen, hint: said(error) });
    return { bar, editing: null, session: null };
  }
}
async function resolve(where, options = {}) {
  const doc = where.document;
  const config = await loadConfig(configUrl(doc), { fetch: options.fetch });
  const entry = declaredEntry(config, doc) ?? entryForUrl(config, where.location.href);
  if (!entry) {
    return { kind: "not-an-entry", hint: unmapped(config) };
  }
  return located(config, entry, doc);
}
async function start(where, bar, config, seen, options) {
  const token = adapterFor(config).currentToken();
  if (token === null) {
    bar.update({ kind: "signed-out", ...seen });
    return null;
  }
  bar.update({ kind: "loading", ...seen });
  const repo = new CmsRepo({ config, token, fetch: options.fetch });
  const [entry, folder] = await Promise.all([
    repo.readEntry(seen.entry.collection, seen.entry.slug),
    repo.github.listDirectory(config.media.folder, repo.base)
  ]);
  linkContentStyles(where.document, options.contentStyles);
  defineEditor();
  const doc = MarkdownDocument.parse(entry.content ?? "");
  const session = new EditingSession({
    document: where.document,
    entry,
    doc,
    store: new MediaStore({ config, taken: folder.map((file) => file.name) }),
    /* The BAR's form, asked at the moment of the comparison. It
       answers null for a collection with no fields and for a block
       the form refused, and null is exactly how a session is told
       there is none -- it then reaches `update` with no options
       object at all, which is what preserves the block byte for
       byte. */
    values: () => bar.values(),
    /* THE site's own element, edited where it stands. */
    region: seen.body
  });
  await extend(session.editor, options.extension);
  where.document.body.appendChild(session.editor);
  const editing = new PageEdit({
    bar,
    session,
    repo,
    seen,
    /* Non-null for the reason `located` gives one line at a time:
       an entry in hand names a collection this config holds,
       because both mappings resolve the name against it. */
    fields: formState(
      findCollection(config, seen.entry.collection),
      seen.entry.slug,
      doc
    )
  });
  return editing;
}
function defineEditor() {
  if (typeof customElements === "undefined" || customElements.get(TAG_NAME)) {
    return;
  }
  customElements.define(TAG_NAME, ContentToolsEditor);
}
function linkContentStyles(doc, href) {
  if (!href || doc.querySelector(`link[data-content-tools="${CONTENT_STYLES_MARK}"]`)) {
    return;
  }
  const link = doc.createElement("link");
  link.setAttribute("data-content-tools", CONTENT_STYLES_MARK);
  link.rel = "stylesheet";
  link.href = href;
  doc.head.appendChild(link);
}
function located(config, entry, doc) {
  const collection = findCollection(config, entry.collection);
  const selector = bodySelector(collection, doc);
  if (selector === null) {
    return {
      kind: "no-body",
      entry,
      hint: `\`${entry.collection}\` has no \`body\` selector, so nothing on this page can be edited in place.`
    };
  }
  const body = doc.querySelector(selector);
  if (!(body instanceof HTMLElement)) {
    return {
      kind: "no-body",
      entry,
      hint: `Nothing on this page matches \`${selector}\`.`
    };
  }
  return { kind: "ready", config, entry, selector, body };
}
function unmapped(config) {
  const mapped = config.collections.some((collection) => collection.kind === "file" ? collection.files.some((file) => file.page !== null) : collection.page !== null);
  return mapped ? "This page is not one of the entries this site can edit." : "No collection says where its entries are published, so no page maps to an entry.";
}
function failure(error) {
  return { kind: "broken", hint: said(error) };
}
function said(error) {
  if (error instanceof ConfigError && error.path !== "") {
    return `${error.path}: ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}
function configUrl(doc) {
  var _a, _b;
  const said2 = (_b = (_a = doc.querySelector(`meta[name="${CONFIG_META}"]`)) == null ? void 0 : _a.getAttribute("content")) == null ? void 0 : _b.trim();
  return said2 ? said2 : DEFAULT_CONFIG_URL;
}
export {
  CONFIG_META,
  CONTENT_STYLES_MARK,
  DEFAULT_CONFIG_URL,
  open,
  resolve
};
