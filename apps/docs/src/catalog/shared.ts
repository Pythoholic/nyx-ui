export type PluginName =
  | "carousel"
  | "calendar"
  | "combobox"
  | "command-palette"
  | "context-menu"
  | "dialog"
  | "dropdown-menu"
  | "file-upload"
  | "input-otp"
  | "multi-select"
  | "number-input"
  | "password-input"
  | "search-box"
  | "menubar"
  | "navigation-menu"
  | "scroll-area"
  | "hover-card"
  | "tree-view"
  | "resizable-panels"
  | "stepper"
  | "notification-center"
  | "filter-bar"
  | "command-bar"
  | "bulk-action-toolbar"
  | "prompt-composer"
  | "message-scroller"
  | "attachment-previews"
  | "sidebar"
  | "date-picker"
  | "data-table"
  | "tabs"
  | "toast";

export type CodeLanguage = "css" | "html" | "js" | "shell";

export interface ReferenceRow {
  name: string;
  description: string;
  value?: string;
}

export interface BehaviorReference {
  accessibility: string;
  attributes: ReferenceRow[];
  events: ReferenceRow[];
  keyboard: ReferenceRow[];
  methods: ReferenceRow[];
  options?: ReferenceRow[];
}

export interface DocPage {
  body: string;
  categoryId?: string;
  categoryLabel: string;
  description: string;
  navigationLabel?: string;
  path: string;
  plugins?: PluginName[];
  searchTerms: string;
  title: string;
}

export interface NavigationCategory {
  id: string;
  label: string;
  pages: DocPage[];
}

interface PluginApi {
  className: string;
  initName: string;
  selector: string;
  reference: BehaviorReference;
}

const pluginApis: Record<PluginName, PluginApi> = {
  "message-scroller": {
    className: "NyxMessageScroller",
    initName: "initMessageScrollers",
    selector: "[data-nyx-message-scroller]",
    reference: {
      attributes: [
        { name: "data-nyx-message-scroller", value: "presence", description: "Marks the message viewport, jump control, and following-state ownership boundary." },
        { name: "data-nyx-message-scroller-viewport", value: "presence", description: "Marks the required native scrolling region." },
        { name: "data-nyx-message-scroller-message", value: "presence", description: "Marks a newly inserted message that contributes to the unread count while paused." },
        { name: "data-nyx-message-scroller-jump / status", value: "presence", description: "Marks the optional jump button and polite unread-count output." },
        { name: "data-nyx-message-scroller-threshold", value: "CSS pixels", description: "Sets the distance from the end that counts as following; the default is 24." },
        { name: "data-state", value: "following | paused", description: "Reflects whether new content keeps the viewport pinned to the end." },
        { name: "data-at-end / data-unread", value: "boolean / number", description: "Reflects scroll-edge and accumulated new-message state." },
      ],
      options: [{ name: "endThreshold", value: "number", description: "Overrides the authored distance from the scroll end that resumes following." }],
      methods: [
        { name: "following", value: "boolean", description: "Gets or requests automatic following through the same cancelable transition boundary." },
        { name: "unread", value: "number", description: "Reads the number of messages accumulated while the viewport is paused." },
        { name: "follow(reason?) / pause(reason?)", value: "boolean", description: "Requests a following-state transition and reports whether it occurred." },
        { name: "refresh()", value: "void", description: "Recomputes edge state after layout or content changes." },
        { name: "destroy()", value: "void", description: "Disconnects observation, removes listeners, and releases the cached instance." },
      ],
      events: [
        { name: "nyx:message-scroller:before-follow / before-pause", value: "cancelable", description: "Fires before automatic following changes." },
        { name: "nyx:message-scroller:follow / pause", value: "not cancelable", description: "Fires after scroll position, unread count, data state, and controls synchronize." },
        { name: "nyx:message-scroller:new-messages", value: "not cancelable", description: "Fires after inserted marked messages are followed or counted." },
      ],
      keyboard: [
        { name: "Arrow keys / Page Up / Page Down / Home / End", description: "Use native scrolling while the named viewport has focus; scrolling away pauses following." },
        { name: "Tab / Shift+Tab", description: "Moves to the viewport and, while paused, the jump-to-latest button." },
        { name: "Enter / Space", description: "Activates the jump button and resumes following." },
      ],
      accessibility: "The focusable viewport remains a named native scrolling region instead of a live log, so historical transcript content is not repeatedly announced. A separate polite output announces only the unread count while reading is paused. Following never moves keyboard focus, and the native jump button provides an explicit route back to the newest content.",
    },
  },
  "attachment-previews": {
    className: "NyxAttachmentPreviews",
    initName: "initAttachmentPreviews",
    selector: "[data-nyx-attachment-previews]",
    reference: {
      attributes: [
        { name: "data-nyx-attachment-previews", value: "presence", description: "Marks the attachment collection and removal ownership boundary." },
        { name: "data-nyx-attachment-preview", value: "presence", description: "Marks one semantic list item retained for reversible controlled state." },
        { name: "data-nyx-attachment-id", value: "unique string", description: "Provides the stable value used by methods and event details." },
        { name: "data-nyx-attachment-remove", value: "presence", description: "Marks a native remove button within one attachment." },
        { name: "data-nyx-attachment-count / empty", value: "presence", description: "Marks optional synchronized count and empty-state elements." },
        { name: "data-state", value: "ready | empty / active | removed", description: "Reflects collection and per-attachment state; removed items are hidden and aria-hidden." },
        { name: "data-count", value: "number", description: "Reflects the number of active attachments." },
      ],
      methods: [
        { name: "value", value: "string[]", description: "Gets or requests the active attachment identifiers without destroying authored preview DOM." },
        { name: "attachments", value: "HTMLElement[]", description: "Reads every owned attachment, including currently removed items." },
        { name: "setValue(ids, reason?)", value: "boolean", description: "Requests a bulk active-set change and reports whether it occurred." },
        { name: "remove(itemOrId, reason?) / restore(itemOrId, reason?)", value: "boolean", description: "Requests one reversible item transition." },
        { name: "clear()", value: "boolean", description: "Requests an empty active set through the bulk change boundary." },
        { name: "refresh() / destroy()", value: "void", description: "Synchronizes newly authored items, or disconnects observation and releases the cached instance." },
      ],
      events: [
        { name: "nyx:attachment-previews:before-change", value: "cancelable", description: "Fires before a bulk value or clear request is applied." },
        { name: "nyx:attachment-previews:change", value: "not cancelable", description: "Fires after bulk item visibility, count, state, and ARIA synchronize." },
        { name: "nyx:attachment-previews:before-remove / before-restore", value: "cancelable", description: "Fires before one attachment changes active state." },
        { name: "nyx:attachment-previews:remove / restore", value: "not cancelable", description: "Fires after the requested attachment and collection state synchronize." },
      ],
      keyboard: [
        { name: "Tab / Shift+Tab", description: "Moves among active attachments' native remove buttons and surrounding controls." },
        { name: "Enter / Space", description: "Activates the focused remove button." },
      ],
      accessibility: "Attachments remain a semantic list with visible file names and metadata. Decorative previews are hidden from assistive technology, while each native remove button names its file. Removed items stay in the DOM only to support controlled restoration and are hidden from every input modality with hidden and aria-hidden.",
    },
  },
  "prompt-composer": {
    className: "NyxPromptComposer",
    initName: "initPromptComposers",
    selector: "[data-nyx-prompt-composer]",
    reference: {
      attributes: [
        { name: "data-nyx-prompt-composer", value: "presence on form", description: "Marks the native form and component ownership boundary." },
        { name: "data-nyx-prompt-composer-input", value: "presence", description: "Marks the required textarea that owns the prompt value." },
        { name: "data-nyx-prompt-composer-submit", value: "presence", description: "Marks the native submit button synchronized with validity." },
        { name: "data-nyx-prompt-composer-count", value: "presence", description: "Marks the optional output showing current and maximum character counts." },
        { name: "data-state", value: "empty | ready | invalid | disabled", description: "Reflects the composer's synchronized interaction state." },
        { name: "data-invalid / aria-invalid", value: "presence / true | false", description: "Reflects invalid state after a submission attempt." },
      ],
      methods: [
        { name: "value", value: "string", description: "Gets or requests a change to the textarea value." },
        { name: "setValue(value, reason?)", value: "boolean", description: "Requests a value change and reports whether it was accepted." },
        { name: "clear()", value: "boolean", description: "Requests an empty value through the same cancelable change boundary." },
        { name: "submit(reason?)", value: "boolean", description: "Validates and requests prompt submission without performing transport." },
        { name: "destroy()", value: "void", description: "Removes listeners and releases the cached instance." },
      ],
      events: [
        { name: "nyx:prompt-composer:before-change", value: "cancelable", description: "Fires before an API, clear, or direct-input value change is accepted." },
        { name: "nyx:prompt-composer:change", value: "not cancelable", description: "Fires after value, count, validity, state, and controls synchronize." },
        { name: "nyx:prompt-composer:before-submit", value: "cancelable", description: "Fires with a valid prompt before the application submission boundary." },
        { name: "nyx:prompt-composer:submit", value: "not cancelable", description: "Fires after a valid submission request is accepted." },
      ],
      keyboard: [
        { name: "Enter", description: "Inserts a new line through native textarea behavior." },
        { name: "Ctrl+Enter / Command+Enter", description: "Requests submission when the prompt is valid." },
        { name: "Tab / Shift+Tab", description: "Moves between the textarea and submit button through native form navigation." },
      ],
      accessibility: "The composer is a native form with a labelled textarea, native validity, a descriptive character-count output, and a submit button whose disabled and aria-disabled states stay synchronized. The documented shortcut supplements rather than replaces the submit button, and the component does not announce transport state it does not own.",
    },
  },
  "number-input": {
    className: "NyxNumberInput",
    initName: "initNumberInputs",
    selector: "[data-nyx-number-input]",
    reference: {
      attributes: [
        { name: "data-nyx-number-input", value: "presence", description: "Marks the number control, buttons, and output ownership boundary." },
        { name: "data-nyx-number-input-control", value: "presence", description: "Marks the required native input[type=number]." },
        { name: "data-nyx-number-input-decrement / data-nyx-number-input-increment", value: "presence", description: "Marks the native buttons that move by one declared step." },
        { name: "data-nyx-number-input-output", value: "presence", description: "Marks the optional localized value summary." },
        { name: "data-nyx-number-input-locale", value: "BCP 47 language tag", description: "Overrides the browser locale used by the optional output." },
        { name: "data-nyx-number-input-unit", value: "string", description: "Appends a unit to the optional output without changing the submitted number." },
        { name: "data-state", value: "empty | valid | invalid", description: "Reflects native constraint-validation state." },
      ],
      methods: [
        { name: "value", value: "number | null", description: "Gets or sets the native input value; null clears it." },
        { name: "setValue(value, reason?)", value: "boolean", description: "Requests a bounded value change and reports whether it was accepted." },
        { name: "increment(multiplier?, reason?) / decrement(multiplier?, reason?)", value: "boolean", description: "Moves by the declared step and clamps to native min/max boundaries." },
        { name: "destroy()", value: "void", description: "Removes listeners and releases the cached instance." },
      ],
      events: [
        { name: "nyx:number-input:before-change", value: "cancelable", description: "Fires before an API, button, keyboard, or accepted input change is committed." },
        { name: "nyx:number-input:change", value: "not cancelable", description: "Fires after the value, constraints, controls, output, data-state, and ARIA synchronize." },
      ],
      keyboard: [
        { name: "Arrow Up / Arrow Down", description: "Uses the browser's native number-input stepping behavior." },
        { name: "Page Up / Page Down", description: "Moves by ten declared steps." },
        { name: "Home / End", description: "Moves to min or max when that boundary is declared." },
        { name: "Tab / Shift+Tab", description: "Moves through the decrement button, native input, and increment button." },
      ],
      accessibility: "The editable control remains a native number input with spinbutton semantics, constraint validation, and mobile keyboard hints. Native buttons have stable accessible names and point to the input with aria-controls. Disabled boundaries are synchronized without blocking direct entry, and the optional output is descriptive rather than a replacement label.",
    },
  },
  "password-input": {
    className: "NyxPasswordInput",
    initName: "initPasswordInputs",
    selector: "[data-nyx-password]",
    reference: {
      attributes: [
        { name: "data-nyx-password", value: "presence", description: "Marks the password field and feedback ownership boundary." },
        { name: "data-nyx-password-control", value: "presence", description: "Marks the required native input[type=password]." },
        { name: "data-nyx-password-toggle", value: "presence", description: "Marks the native visibility toggle button." },
        { name: "data-nyx-password-meter / data-nyx-password-status", value: "presence", description: "Marks the native meter and its polite text equivalent." },
        { name: "data-nyx-password-min-length", value: "positive integer", description: "Sets the advisory scoring length threshold; native minlength remains the validity rule." },
        { name: "data-state / data-strength", value: "empty | weak | fair | good | strong", description: "Reflects advisory strength after every accepted change." },
        { name: "data-visibility", value: "hidden | visible", description: "Reflects whether the input currently exposes text." },
      ],
      methods: [
        { name: "value", value: "string", description: "Gets or sets the current password value." },
        { name: "score / strength", value: "number / string", description: "Reads the advisory score from zero through four and its named state." },
        { name: "visible", value: "boolean", description: "Gets or sets visibility through the same cancelable event path." },
        { name: "setValue(value, reason?)", value: "boolean", description: "Requests a value change and reports whether it was accepted." },
        { name: "setVisible(visible, reason?) / toggleVisibility()", value: "boolean", description: "Requests a visibility change while preserving focus and selection." },
        { name: "destroy()", value: "void", description: "Removes listeners and releases the cached instance." },
      ],
      events: [
        { name: "nyx:password:before-change", value: "cancelable", description: "Fires before a typed or API value is accepted." },
        { name: "nyx:password:change", value: "not cancelable", description: "Fires after value, strength, native validity, data-state, and feedback synchronize." },
        { name: "nyx:password:before-show / before-hide", value: "cancelable", description: "Fires before password visibility changes." },
        { name: "nyx:password:show / hide", value: "not cancelable", description: "Fires after input type, toggle state, labels, and visibility state synchronize." },
      ],
      keyboard: [
        { name: "Tab / Shift+Tab", description: "Moves between the native password input, visibility button, and surrounding form controls." },
        { name: "Enter / Space", description: "Activates the focused native visibility button." },
      ],
      accessibility: "The password remains a native input with autocomplete, minlength, required state, and password-manager compatibility. The toggle is a pressed button with a changing accessible name. A native meter has an aria-valuetext equivalent and a polite text status; strength is explicitly advisory and must not replace server-side policy or breach checks.",
    },
  },
  carousel: {
    className: "NyxCarousel",
    initName: "initCarousels",
    selector: "[data-nyx-carousel]",
    reference: {
      attributes: [
        { name: "data-nyx-carousel", value: "presence", description: "Marks the carousel region and ownership boundary." },
        { name: "data-nyx-carousel-slide", value: "presence", description: "Marks an ordered slide; inactive slides are hidden from every input modality." },
        { name: "data-nyx-carousel-previous / data-nyx-carousel-next", value: "presence", description: "Marks native buttons that move one slide." },
        { name: "data-nyx-carousel-go-to", value: "zero-based index", description: "Marks a native indicator button that selects one slide." },
        { name: "data-nyx-carousel-loop", value: "presence", description: "Allows previous and next navigation to wrap at either end." },
        { name: "data-nyx-carousel-index", value: "zero-based index", description: "Declares and reflects the active slide index." },
        { name: "data-nyx-carousel-status", value: "presence", description: "Marks the polite text status synchronized to the active position." },
      ],
      methods: [
        { name: "value", value: "number", description: "Gets or sets the zero-based active index." },
        { name: "goTo(index, reason?)", value: "boolean", description: "Requests an indexed transition and reports whether it occurred." },
        { name: "next(reason?) / previous(reason?)", value: "boolean", description: "Requests an adjacent transition, respecting the loop setting." },
        { name: "destroy()", value: "void", description: "Removes listeners and releases the cached instance." },
      ],
      events: [
        { name: "nyx:carousel:before-change", value: "cancelable", description: "Fires before the active slide changes." },
        { name: "nyx:carousel:change", value: "not cancelable", description: "Fires after slide visibility, controls, indicators, status, and ARIA synchronize." },
      ],
      keyboard: [
        { name: "Tab / Shift+Tab", description: "Moves through the native previous, next, and slide-indicator buttons." },
        { name: "Enter / Space", description: "Activates the focused native navigation button." },
      ],
      accessibility: "The named region uses the carousel roledescription. Each slide is a labelled group with its position in the set, and inactive slides are both hidden and aria-hidden. Native navigation buttons expose disabled boundaries, while a polite atomic status announces the new position without automatic rotation.",
    },
  },
  stepper: {
    className: "NyxStepper",
    initName: "initSteppers",
    selector: "[data-nyx-stepper]",
    reference: {
      attributes: [
        { name: "data-nyx-stepper", value: "presence", description: "Marks the stepper root and ownership boundary." },
        { name: "data-nyx-stepper-linear", value: "presence", description: "Prevents jumping beyond the next unvisited step." },
        { name: "data-nyx-stepper-step", value: "presence", description: "Marks each ordered step and receives current, complete, or pending state." },
        { name: "data-nyx-stepper-trigger", value: "presence", description: "Marks the native button associated with one panel." },
        { name: "data-nyx-stepper-panel", value: "presence", description: "Marks one panel in the same order as its step." },
        { name: "data-nyx-stepper-previous / data-nyx-stepper-next", value: "presence", description: "Marks native buttons for adjacent transitions." },
        { name: "data-nyx-stepper-index", value: "zero-based index", description: "Declares and reflects the current step index." },
      ],
      methods: [
        { name: "value", value: "number", description: "Gets or sets the zero-based current step index." },
        { name: "goTo(index, reason?)", value: "boolean", description: "Requests an indexed transition and reports whether it occurred." },
        { name: "next(reason?) / previous(reason?)", value: "boolean", description: "Requests an adjacent transition." },
        { name: "destroy()", value: "void", description: "Removes listeners and releases the cached instance." },
      ],
      events: [
        { name: "nyx:stepper:before-change", value: "cancelable", description: "Fires before the current step changes." },
        { name: "nyx:stepper:change", value: "not cancelable", description: "Fires after step, panel, control, data-state, and ARIA synchronization." },
      ],
      keyboard: [
        { name: "Arrow keys", description: "Moves focus among currently available step buttons without changing the current step." },
        { name: "Home / End", description: "Moves focus to the first or last currently available step button." },
        { name: "Enter / Space", description: "Activates the focused step, previous, or next button." },
      ],
      accessibility: "The ordered list preserves sequence. The current item uses aria-current=step, one step trigger participates in the tab order, and every trigger controls a labelled panel. Hidden panels are removed from navigation, and unavailable future steps in a linear flow are disabled.",
    },
  },
  "scroll-area": {
    className: "NyxScrollArea",
    initName: "initScrollAreas",
    selector: "[data-nyx-scroll-area]",
    reference: {
      attributes: [
        { name: "data-nyx-scroll-area", value: "presence", description: "Marks the scroll-area root that owns edge state and optional fades." },
        { name: "data-nyx-scroll-area-viewport", value: "presence", description: "Marks the native overflow viewport; keep its accessible name when it is focusable." },
        { name: "--nyx-scroll-area-size", value: "CSS length", description: "Sets the viewport's maximum block size." },
        { name: "data-at-block-start / data-at-block-end", value: "boolean", description: "Reflects the current vertical edges for fade affordances." },
      ],
      methods: [
        { name: "viewport", value: "HTMLElement", description: "Exposes the native scrolling element." },
        { name: "refresh()", value: "void", description: "Recomputes overflow and edge state after content changes." },
        { name: "destroy()", value: "void", description: "Removes observation and listeners and releases the cached instance." },
      ],
      events: [{ name: "nyx:scroll-area:change", value: "not cancelable", description: "Fires after passive overflow-edge state changes; native scrolling itself is never intercepted." }],
      keyboard: [{ name: "Arrow keys / Page Up / Page Down / Home / End", description: "Use the browser's native scrolling behavior while the viewport has focus." }],
      accessibility: "The focusable viewport keeps native scrolling, momentum, and platform keyboard behavior. Give it an accessible name that describes the region. Edge fades are decorative and never cover the scrollbar or intercept input.",
    },
  },
  "hover-card": {
    className: "NyxHoverCard",
    initName: "initHoverCards",
    selector: "[data-nyx-hover-card]",
    reference: {
      attributes: [
        { name: "data-nyx-hover-card", value: "presence", description: "Marks rich hover-card content." },
        { name: "data-nyx-hover-card-trigger", value: "card id", description: "Associates one or more pointer and keyboard triggers." },
        { name: "data-nyx-hover-card-open-delay", value: "milliseconds", description: "Sets the intent delay before opening." },
        { name: "data-nyx-hover-card-close-delay", value: "milliseconds", description: "Sets the dismissal grace period." },
        { name: "data-nyx-hover-card-placement", value: "placement", description: "Sets the preferred anchored placement." },
      ],
      options: [
        { name: "openDelay / closeDelay", value: "number", description: "Overrides markup delays." },
        { name: "placement", value: "NyxOverlayPlacement", description: "Overrides the preferred placement." },
      ],
      methods: [
        { name: "value", value: "boolean", description: "Reads whether the card is open." },
        { name: "open(trigger?)", value: "void", description: "Opens and positions the card for an associated trigger." },
        { name: "close(reason?)", value: "void", description: "Closes with an optional reason." },
        { name: "destroy()", value: "void", description: "Closes, clears timers, and releases positioning, dismissal, and listeners." },
      ],
      events: [
        { name: "nyx:hover-card:before-open / before-close", value: "cancelable", description: "Fires before state changes; destroy closure cannot be canceled." },
        { name: "nyx:hover-card:open / close", value: "not cancelable", description: "Fires after visibility, data-state, and ARIA synchronize." },
      ],
      keyboard: [
        { name: "Tab / Shift+Tab", description: "Opening is triggered by focus, and rich interactive content remains reachable." },
        { name: "Escape", description: "Closes the card through the shared dismissal layer." },
      ],
      accessibility: "Hover Card is rich supplementary content, so it deliberately has no tooltip role. It opens from both pointer hover and keyboard focus, remains open while pointer or focus is inside, and exposes aria-controls and aria-expanded on its triggers.",
    },
  },
  "tree-view": {
    className: "NyxTreeView",
    initName: "initTreeViews",
    selector: "[data-nyx-tree]",
    reference: {
      attributes: [
        { name: "data-nyx-tree", value: "presence", description: "Marks the root ul and receives role=tree." },
        { name: "data-nyx-tree-item", value: "presence", description: "Marks each nested li tree item." },
        { name: "data-nyx-tree-label", value: "presence", description: "Provides the direct label used by typeahead." },
        { name: "data-nyx-tree-toggle", value: "presence", description: "Marks the pointer expansion affordance inside a parent row." },
        { name: "data-nyx-tree-selection", value: "none | single | multiple", description: "Sets the selection model; the default is single." },
      ],
      methods: [
        { name: "selectedItems", value: "HTMLElement[]", description: "Returns the currently selected items." },
        { name: "expand(item) / collapse(item)", value: "boolean", description: "Requests a parent state transition." },
        { name: "select(item, selected?)", value: "boolean", description: "Requests a selection transition." },
        { name: "destroy()", value: "void", description: "Clears typeahead and listeners and releases the cached instance." },
      ],
      events: [
        { name: "nyx:tree:before-expand / before-collapse", value: "cancelable", description: "Fires before a branch changes." },
        { name: "nyx:tree:expand / collapse", value: "not cancelable", description: "Fires after aria-expanded, data-state, and group visibility synchronize." },
        { name: "nyx:tree:before-select", value: "cancelable", description: "Fires before selection changes." },
        { name: "nyx:tree:select", value: "not cancelable", description: "Fires after aria-selected synchronizes." },
      ],
      keyboard: [
        { name: "Arrow Down / Arrow Up", description: "Moves through the current visible item set without wrapping." },
        { name: "Arrow Right", description: "Expands a collapsed parent, then moves into its first child." },
        { name: "Arrow Left", description: "Collapses an expanded parent, then moves to its parent." },
        { name: "Home / End", description: "Moves to the first or last visible item." },
        { name: "Printable characters", description: "Moves to the next visible item whose label matches the typeahead buffer." },
        { name: "Enter / Space", description: "Selects, or toggles selection in a multiple-selection tree." },
      ],
      accessibility: "Nested ul and li elements retain the content hierarchy while the controller supplies tree, treeitem, and group roles; aria-level, aria-setsize, and aria-posinset; parent expansion; selection state; and one roving tab stop.",
    },
  },
  "resizable-panels": {
    className: "NyxResizablePanels",
    initName: "initResizablePanels",
    selector: "[data-nyx-resizable]",
    reference: {
      attributes: [
        { name: "data-nyx-resizable", value: "presence", description: "Marks one two-panel splitter group." },
        { name: "data-nyx-resizable-orientation", value: "horizontal | vertical", description: "Sets panel flow; separator ARIA reports the perpendicular handle orientation." },
        { name: "data-nyx-resizable-panel", value: "presence", description: "Marks exactly two panels owned by the nearest group." },
        { name: "data-nyx-resizable-handle", value: "presence", description: "Marks the focusable pointer and keyboard separator." },
        { name: "data-nyx-min-size / data-nyx-max-size", value: "percent", description: "Constrains each panel." },
        { name: "data-nyx-collapsible", value: "presence", description: "Allows the leading panel to collapse with Enter or Home." },
        { name: "data-nyx-resizable-persist", value: "storage key", description: "Opts into local size persistence; omitted means no storage access." },
      ],
      options: [{ name: "storage", value: "Storage", description: "Injects storage for an explicitly persistent group." }],
      methods: [
        { name: "size / collapsed", value: "number / boolean", description: "Reads leading-panel percentage and collapse state." },
        { name: "resize(size)", value: "boolean", description: "Requests a constrained resize." },
        { name: "collapse() / expand() / toggleCollapse()", value: "boolean", description: "Requests a supported collapse transition." },
        { name: "destroy()", value: "void", description: "Ends any drag, removes listeners, and releases the cached instance." },
      ],
      events: [
        { name: "nyx:resizable:before-resize", value: "cancelable", description: "Fires before pointer, keyboard, or API sizing is committed." },
        { name: "nyx:resizable:resize", value: "not cancelable", description: "Fires after size, styles, ARIA, and optional persistence synchronize." },
        { name: "nyx:resizable:before-collapse / before-expand", value: "cancelable", description: "Fires before an enabled collapse transition." },
        { name: "nyx:resizable:collapse / expand", value: "not cancelable", description: "Fires after collapse state synchronizes." },
      ],
      keyboard: [
        { name: "Arrow Left / Right", description: "Resizes a horizontal panel flow by the configured step." },
        { name: "Arrow Up / Down", description: "Resizes a vertical panel flow by the configured step." },
        { name: "Home / End", description: "Moves to minimum or maximum; Home collapses a collapsible leading panel." },
        { name: "Enter", description: "Toggles the leading panel when it is explicitly collapsible." },
      ],
      accessibility: "The focusable handle uses separator semantics and continuously synchronized aria-valuenow, aria-valuemin, aria-valuemax, aria-valuetext, and aria-orientation. Nested groups discover only their direct ownership scope.",
    },
  },
  "search-box": {
    className: "NyxSearchBox",
    initName: "initSearchBoxes",
    selector: "[data-nyx-search-box]",
    reference: {
      attributes: [
        { name: "data-nyx-search-box", value: "presence", description: "Marks the search input, clear button, and result-list ownership boundary." },
        { name: "data-nyx-search-box-recent", value: "presence", description: "Keeps an option visible when the query is blank." },
        { name: "data-nyx-search-box-clear", value: "presence", description: "Marks the native clear button synchronized to query state." },
        { name: "data-nyx-search-box-empty", value: "presence", description: "Marks the no-results message." },
        { name: "data-nyx-search-box-placement", value: "placement", description: "Sets the preferred anchored popup placement." },
        { name: "data-nyx-search-text / data-value", value: "string", description: "Overrides an option's filter text or submitted search text." },
        { name: "data-state", value: "open | closed", description: "Reflects suggestion-list visibility." },
      ],
      options: [{ name: "placement", value: "NyxOverlayPlacement", description: "Sets the preferred anchored popup placement." }],
      methods: [
        { name: "value", value: "string", description: "Gets or sets the current query and refreshes filtering." },
        { name: "expanded", value: "boolean", description: "Reads whether the suggestion list is open." },
        { name: "open() / close(reason?)", value: "void", description: "Controls the positioned suggestion list and dismissal lifecycle." },
        { name: "filter(query?)", value: "number", description: "Shows recent options for a blank query or matching suggestions for text." },
        { name: "search(query?, reason?, option?)", value: "boolean", description: "Requests a search and reports whether it was accepted." },
        { name: "clear()", value: "boolean", description: "Requests clearing the query, restores recent options, and preserves focus." },
        { name: "destroy()", value: "void", description: "Closes and removes positioning, dismissal, result state, and listeners." },
      ],
      events: [
        { name: "nyx:search-box:before-open / before-close", value: "cancelable", description: "Fires before suggestion-list state changes; destroy closure cannot be canceled." },
        { name: "nyx:search-box:open / close", value: "not cancelable", description: "Fires after popup, data-state, and ARIA synchronize." },
        { name: "nyx:search-box:filter", value: "not cancelable", description: "Reports the query and visible result count." },
        { name: "nyx:search-box:before-search / search", value: "cancelable / not cancelable", description: "Brackets a submitted query or chosen suggestion." },
        { name: "nyx:search-box:before-clear / clear", value: "cancelable / not cancelable", description: "Brackets clearing the current query." },
      ],
      keyboard: [
        { name: "Arrow Down / Arrow Up", description: "Opens the list and moves through enabled visible recent searches or suggestions." },
        { name: "Home / End", description: "Moves to the first or last enabled visible option while open." },
        { name: "Enter", description: "Searches the active suggestion, or submits the typed query when no option is active." },
        { name: "Escape", description: "Closes suggestions without clearing the query." },
        { name: "Tab", description: "Closes suggestions and continues normal focus navigation." },
      ],
      accessibility: "The semantic search form contains an editable combobox whose DOM focus remains on the input. The listbox uses aria-controls, aria-expanded, and aria-activedescendant; grouped recent searches and suggestions have accessible labels, and disabled options are skipped. Search execution is application-owned through events rather than hidden navigation.",
    },
  },
  "multi-select": {
    className: "NyxMultiSelect",
    initName: "initMultiSelects",
    selector: "[data-nyx-multi-select]",
    reference: {
      attributes: [
        { name: "data-nyx-multi-select", value: "presence", description: "Marks the multi-value input ownership boundary." },
        { name: "data-nyx-multi-select-name", value: "field name", description: "Names the repeated hidden inputs used for form submission." },
        { name: "data-nyx-multi-select-max", value: "positive integer", description: "Limits the number of selected options." },
        { name: "data-nyx-multi-select-tags / values", value: "presence", description: "Marks generated tag and hidden-input containers." },
        { name: "data-nyx-multi-select-empty", value: "presence", description: "Marks the no-results message." },
        { name: "data-nyx-multi-select-placement", value: "placement", description: "Sets the preferred anchored popup placement." },
        { name: "data-state", value: "empty | filled | max", description: "Reflects the selected-value state." },
        { name: "data-popup-state", value: "open | closed", description: "Reflects suggestion-list visibility." },
      ],
      options: [{ name: "placement", value: "NyxOverlayPlacement", description: "Sets the preferred anchored popup placement." }],
      methods: [
        { name: "value", value: "string[]", description: "Gets or sets selected values in option order." },
        { name: "expanded", value: "boolean", description: "Reads whether the option list is open." },
        { name: "open() / close(reason?)", value: "void", description: "Controls the positioned listbox and dismissal lifecycle." },
        { name: "add(optionOrValue, reason?)", value: "boolean", description: "Adds an enabled option within the declared maximum." },
        { name: "remove(optionOrValue, reason?)", value: "boolean", description: "Removes a selected option." },
        { name: "toggle(option, reason?) / clear()", value: "boolean", description: "Toggles one option or requests clearing all selected values." },
        { name: "filter(query?)", value: "number", description: "Filters options and returns the visible count." },
        { name: "destroy()", value: "void", description: "Removes listeners, generated tags and values, positioning, dismissal, and cached state." },
      ],
      events: [
        { name: "nyx:multi-select:before-open / before-close", value: "cancelable", description: "Fires before listbox state changes; destroy closure cannot be canceled." },
        { name: "nyx:multi-select:open / close", value: "not cancelable", description: "Fires after popup and ARIA state synchronize." },
        { name: "nyx:multi-select:filter", value: "not cancelable", description: "Reports the query and visible option count." },
        { name: "nyx:multi-select:before-add / add", value: "cancelable / not cancelable", description: "Brackets adding a tag and repeated form value." },
        { name: "nyx:multi-select:before-remove / remove", value: "cancelable / not cancelable", description: "Brackets removing a tag and repeated form value." },
        { name: "nyx:multi-select:before-clear / clear", value: "cancelable / not cancelable", description: "Brackets clearing the complete selection." },
      ],
      keyboard: [
        { name: "Arrow Down / Arrow Up", description: "Opens the list and moves the active descendant through enabled visible options." },
        { name: "Home / End", description: "Moves to the first or last enabled visible option while open." },
        { name: "Enter", description: "Toggles the active option and clears the filter for another choice." },
        { name: "Backspace", description: "Removes the last selected value when the query is empty." },
        { name: "Escape / Tab", description: "Closes the list; Tab continues normal focus navigation." },
      ],
      accessibility: "The input uses the editable combobox pattern with a multiselectable listbox; DOM focus remains on the input while aria-activedescendant tracks suggestions. Every generated tag has a native remove button with a specific accessible name. Repeated hidden inputs submit selected values without replacing the visible labels or listbox semantics.",
    },
  },
  combobox: {
    className: "NyxCombobox",
    initName: "initComboboxes",
    selector: "[data-nyx-combobox]",
    reference: {
      attributes: [
        { name: "data-nyx-combobox", value: "presence", description: "Marks the input, form value, and listbox owner." },
        { name: "data-nyx-combobox-value", value: "presence", description: "Marks the hidden input synchronized for form submission." },
        { name: "data-value", value: "string", description: "Sets the submitted value for an option." },
        { name: "data-nyx-search-text", value: "string", description: "Overrides the option text used for filtering." },
        { name: "data-nyx-combobox-placement", value: "placement", description: "Sets the preferred anchored popup placement." },
        { name: "data-nyx-combobox-empty", value: "presence", description: "Marks the no-results message." },
      ],
      options: [{ name: "placement", value: "NyxOverlayPlacement", description: "Sets the preferred anchored popup placement." }],
      methods: [
        { name: "value", value: "string", description: "Gets or sets the selected form value." },
        { name: "expanded", value: "boolean", description: "Reads whether the listbox is open." },
        { name: "open()", value: "void", description: "Opens, filters, positions, and activates dismissal." },
        { name: "close(reason?)", value: "void", description: "Closes with an optional reason." },
        { name: "filter(query?)", value: "number", description: "Filters options and returns the visible count." },
        { name: "select(option)", value: "void", description: "Selects an enabled option and synchronizes the form value." },
        { name: "destroy()", value: "void", description: "Closes and removes positioning, dismissal, result state, and listeners." },
      ],
      events: [
        { name: "nyx:combobox:before-open / before-close", value: "cancelable", description: "Fires before popup state changes; destroy closure cannot be canceled." },
        { name: "nyx:combobox:open / close", value: "not cancelable", description: "Fires after popup and ARIA state synchronize." },
        { name: "nyx:combobox:filter", value: "not cancelable", description: "Reports the query and visible result count." },
        { name: "nyx:combobox:before-select", value: "cancelable", description: "Fires before committing an option." },
        { name: "nyx:combobox:select", value: "not cancelable", description: "Fires after input, option state, and form value synchronize." },
      ],
      keyboard: [
        { name: "Arrow Down / Arrow Up", description: "Opens the listbox, then moves the active descendant through enabled visible options." },
        { name: "Home / End", description: "Moves to the first or last enabled visible option while open." },
        { name: "Enter", description: "Selects the active option." },
        { name: "Escape", description: "Closes without changing focus." },
        { name: "Tab", description: "Closes and continues normal focus navigation." },
      ],
      accessibility: "The editable input keeps DOM focus and uses role=combobox, aria-expanded, aria-controls, and aria-activedescendant. Results use listbox and option semantics—not menu roles—and disabled options are skipped. A named hidden input carries the selected value into form submission.",
    },
  },
  "command-palette": {
    className: "NyxCommandPalette",
    initName: "initCommandPalettes",
    selector: "dialog[data-nyx-command-palette]",
    reference: {
      attributes: [
        { name: "data-nyx-command-palette", value: "presence", description: "Marks the native dialog composed as a command palette." },
        { name: "data-nyx-dialog-trigger", value: "dialog id", description: "Associates an opener with the palette through Dialog." },
        { name: "data-value", value: "string", description: "Sets the stable value emitted for a result." },
        { name: "data-nyx-search-text", value: "string", description: "Overrides result text used for filtering." },
        { name: "data-nyx-command-palette-empty", value: "presence", description: "Marks the no-results message." },
      ],
      options: [{ name: "root", value: "ParentNode", description: "Scopes discovery of Dialog triggers." }],
      methods: [
        { name: "value", value: "boolean", description: "Reads whether the composed Dialog is open." },
        { name: "query", value: "string", description: "Gets or sets the filter query." },
        { name: "open(trigger?)", value: "void", description: "Opens through Dialog with focus on the search input." },
        { name: "close(reason?)", value: "void", description: "Closes through Dialog." },
        { name: "filter(query?)", value: "number", description: "Filters grouped commands and returns the visible count." },
        { name: "run(command)", value: "void", description: "Runs an enabled command result." },
        { name: "destroy()", value: "void", description: "Destroys the result controller and composed Dialog." },
      ],
      events: [
        { name: "nyx:command-palette:filter", value: "not cancelable", description: "Reports the query and visible result count." },
        { name: "nyx:command-palette:before-run", value: "cancelable", description: "Fires before closing and committing a command." },
        { name: "nyx:command-palette:run", value: "not cancelable", description: "Fires with the command element and stable value after close." },
        { name: "nyx:dialog:*", value: "Dialog contract", description: "Open and close lifecycle is inherited from the composed Dialog." },
      ],
      keyboard: [
        { name: "Arrow Down / Arrow Up", description: "Moves the active descendant through enabled visible results, wrapping at the ends." },
        { name: "Home / End", description: "Moves to the first or last enabled visible result." },
        { name: "Enter", description: "Runs the active command." },
        { name: "Escape", description: "Dismisses through Dialog and returns focus to the opener." },
      ],
      accessibility: "The native modal Dialog owns focus containment, initial focus, Escape dismissal, scroll lock, and focus return. The search input uses active-descendant listbox navigation; role=group and accessible labels preserve result grouping.",
    },
  },
  "input-otp": {
    className: "NyxInputOtp",
    initName: "initInputOtps",
    selector: "[data-nyx-input-otp]",
    reference: {
      attributes: [
        { name: "data-nyx-input-otp", value: "presence", description: "Marks the controller root." },
        { name: "data-nyx-input-otp-cell", value: "presence", description: "Marks each real text input cell in visual order." },
        { name: "data-nyx-input-otp-value", value: "presence", description: "Marks the hidden input that carries the combined form value." },
      ],
      methods: [
        { name: "value", value: "string", description: "Gets or sets the sanitized combined value." },
        { name: "complete", value: "boolean", description: "Reports whether every cell contains one digit." },
        { name: "setValue(value, reason?)", value: "boolean", description: "Requests a value change and reports whether it was accepted." },
        { name: "clear()", value: "void", description: "Clears every cell and focuses the first cell." },
        { name: "destroy()", value: "void", description: "Removes listeners and releases the cached instance." },
      ],
      events: [
        { name: "nyx:input-otp:before-change", value: "cancelable", description: "Fires before an input, paste, Backspace, clear, or API change is committed." },
        { name: "nyx:input-otp:change", value: "not cancelable", description: "Fires after cells and the hidden form value synchronize." },
        { name: "nyx:input-otp:complete", value: "not cancelable", description: "Fires once when a new value fills every cell." },
      ],
      keyboard: [
        { name: "Arrow Left / Arrow Right", description: "Moves focus between adjacent cells without changing digits." },
        { name: "Backspace", description: "Clears the current digit, or moves backward and clears the previous digit when current is empty." },
        { name: "Paste", description: "A full-length numeric code fills all cells from the first cell regardless of paste location; focus lands on the first empty cell or final cell." },
      ],
      accessibility: "Every cell is a real text input with a positional accessible name and numeric input mode. Only the first cell requests one-time-code autofill. A single hidden input submits the combined value. For the most robust password-manager, autofill, and screen-reader behavior, prefer one native input when the multi-cell visual is not required.",
    },
  },
  "file-upload": {
    className: "NyxFileUpload",
    initName: "initFileUploads",
    selector: "[data-nyx-file-upload]",
    reference: {
      attributes: [
        { name: "data-nyx-file-upload", value: "presence", description: "Marks the upload controller root and drop target." },
        { name: "data-nyx-file-upload-max-files", value: "number", description: "Sets the accepted queue count; defaults to one unless the input is multiple." },
        { name: "data-nyx-file-upload-max-size", value: "bytes", description: "Sets the maximum size of each file." },
        { name: "data-nyx-file-upload-errors", value: "presence", description: "Marks the accessible validation-error region." },
        { name: "data-nyx-file-upload-queue", value: "presence", description: "Marks the rendered per-file queue." },
        { name: "data-nyx-file-upload-start", value: "presence", description: "Uploads queued items through the consumer adapter." },
      ],
      options: [
        { name: "maxFiles", value: "number", description: "Overrides the queue count limit." },
        { name: "maxSize", value: "number", description: "Overrides the per-file byte limit." },
        { name: "transport", value: "(file, context) => Promise<unknown>", description: "Consumer-owned upload function; context supplies AbortSignal and reportProgress." },
      ],
      methods: [
        { name: "value", value: "readonly NyxFileUploadItem[]", description: "Returns the queue and each item's state, progress, result, and preview URL." },
        { name: "add(files)", value: "NyxFileUploadItem[]", description: "Validates and queues an iterable of files." },
        { name: "remove(id)", value: "void", description: "Aborts, removes, and revokes any preview for one queue item." },
        { name: "setTransport(adapter)", value: "void", description: "Sets or replaces the consumer-owned transport adapter." },
        { name: "setProgress(id, progress)", value: "void", description: "Updates a queue item's displayed progress." },
        { name: "upload(id) / uploadAll()", value: "Promise", description: "Runs the supplied adapter for one or all queued items." },
        { name: "destroy()", value: "void", description: "Aborts work, revokes all object URLs, clears generated queue UI, and releases listeners." },
      ],
      events: [
        { name: "nyx:file-upload:before-add / before-remove / before-upload", value: "cancelable", description: "Fires before queue mutations or transport start." },
        { name: "nyx:file-upload:add / remove / upload", value: "not cancelable", description: "Fires after the corresponding queue transition." },
        { name: "nyx:file-upload:progress", value: "not cancelable", description: "Reports adapter-driven progress after display synchronization." },
        { name: "nyx:file-upload:complete / error", value: "not cancelable", description: "Reports transport results or validation/transport errors." },
      ],
      keyboard: [
        { name: "Enter / Space", description: "Activates the native file input through its label, the upload button, or a per-file remove button." },
        { name: "Tab", description: "Moves through the native file input and queue actions in document order." },
      ],
      accessibility: "The native file input remains the selection foundation. Validation is associated through aria-describedby and announced by a role=alert region. Queue progress uses named native progress elements, and every remove control names its file.",
    },
  },
  sidebar: {
    className: "NyxSidebar",
    initName: "initSidebars",
    selector: "[data-nyx-sidebar]",
    reference: {
      attributes: [
        { name: "data-nyx-sidebar", value: "presence", description: "Marks the responsive application-shell owner." },
        { name: "data-nyx-sidebar-panel", value: "presence", description: "Marks the existing Dialog drawer that contains the aside and nav landmarks." },
        { name: "data-nyx-sidebar-toggle", value: "presence", description: "Marks a desktop collapse and mobile open/close control." },
        { name: "data-nyx-sidebar-label", value: "presence", description: "Marks text hidden visually in desktop rail mode; icon controls still require aria-label." },
        { name: "data-nyx-sidebar-media", value: "media query", description: "Sets the responsive query; it must match the CSS breakpoint." },
        { name: "data-nyx-sidebar-persist", value: "storage key", description: "Opts into collapsed-state persistence; absent means no storage." },
      ],
      options: [
        { name: "mediaQuery", value: "string", description: "Overrides the default max-width: 48rem responsive query." },
        { name: "storage", value: "Storage", description: "Overrides localStorage, useful for isolated hosts and tests." },
      ],
      methods: [
        { name: "collapsed", value: "boolean", description: "Gets or sets desktop rail state." },
        { name: "mode", value: "desktop | mobile", description: "Reports the media-query mode." },
        { name: "open", value: "boolean", description: "Reports desktop presence or mobile Dialog open state." },
        { name: "expand() / collapse()", value: "void", description: "Changes desktop rail state." },
        { name: "toggle()", value: "void", description: "Collapses the desktop rail or opens/closes the mobile Dialog." },
        { name: "destroy()", value: "void", description: "Destroys the composed Dialog and removes media/toggle listeners." },
      ],
      events: [
        { name: "nyx:sidebar:before-change", value: "cancelable", description: "Fires before a rail or mobile Dialog state change." },
        { name: "nyx:sidebar:change", value: "not cancelable", description: "Fires after state and ARIA synchronize." },
        { name: "nyx:dialog:*", value: "Dialog contract", description: "Mobile modal open/close lifecycle is inherited from the composed Dialog." },
      ],
      keyboard: [
        { name: "Enter / Space", description: "Activates the toggle, links, and mobile close control through native behavior." },
        { name: "Tab / Shift+Tab", description: "Moves normally through the desktop rail; native Dialog containment applies while mobile navigation is modal." },
        { name: "Escape", description: "Closes the mobile drawer through the composed Dialog and returns focus to the toggle." },
      ],
      accessibility: "The aside and nav landmarks remain in the DOM in both modes. Desktop collapse leaves a usable icon rail with explicitly named links. The toggle owns aria-controls and aria-expanded. Mobile uses native modal Dialog focus containment and document inertness.",
    },
  },
  calendar: {
    className: "NyxCalendar",
    initName: "initCalendars",
    selector: "[data-nyx-calendar]",
    reference: {
      attributes: [
        { name: "data-nyx-calendar", value: "presence", description: "Marks the standalone month-grid controller." },
        { name: "data-nyx-calendar-selection", value: "single | range", description: "Selects one date or an inclusive date range." },
        { name: "data-nyx-calendar-value", value: "YYYY-MM-DD[/YYYY-MM-DD]", description: "Sets the initial value and marks an optional synchronized hidden input." },
        { name: "data-nyx-calendar-locale", value: "BCP 47 language tag", description: "Controls localized month, weekday, and announced date labels." },
        { name: "data-nyx-calendar-week-start", value: "0–6", description: "Overrides the locale-derived first weekday; zero is Sunday." },
        { name: "data-nyx-calendar-min / max", value: "YYYY-MM-DD", description: "Constrains selectable calendar dates without introducing time or zone semantics." },
      ],
      options: [
        { name: "locale", value: "string", description: "Overrides the language used by Intl.DateTimeFormat and Intl.Locale." },
        { name: "weekStartsOn", value: "number", description: "Overrides the locale week start with Sunday=0 through Saturday=6." },
        { name: "selectionMode", value: "single | range", description: "Controls the value model." },
        { name: "min / max", value: "YYYY-MM-DD", description: "Sets inclusive date bounds." },
        { name: "disabled", value: "(date, value) => boolean", description: "Disables application-specific dates in addition to min/max." },
      ],
      methods: [
        { name: "value", value: "string | range | undefined", description: "Gets or sets the selected date or range." },
        { name: "focusedValue", value: "string", description: "Returns the roving-focus date as YYYY-MM-DD." },
        { name: "isDateDisabled(value)", value: "boolean", description: "Tests min, max, and the consumer disabled-date predicate." },
        { name: "focus()", value: "void", description: "Moves DOM focus to the active date." },
        { name: "showMonth(value)", value: "boolean", description: "Requests a month change and reports whether it was accepted." },
        { name: "select(value)", value: "boolean", description: "Requests selection of an enabled calendar date." },
        { name: "destroy()", value: "void", description: "Removes delegated grid listeners and releases the cached instance." },
      ],
      events: [
        { name: "nyx:calendar:before-select", value: "cancelable", description: "Fires before a single or range value changes." },
        { name: "nyx:calendar:select", value: "not cancelable", description: "Fires after selection, hidden value, and grid state synchronize." },
        { name: "nyx:calendar:before-month-change", value: "cancelable", description: "Fires before navigation changes the displayed month." },
        { name: "nyx:calendar:month-change", value: "not cancelable", description: "Fires after the month grid has rendered." },
      ],
      keyboard: [
        { name: "Arrow keys", description: "Moves by one day horizontally or one week vertically, skipping disabled dates." },
        { name: "Home / End", description: "Moves to the first or last enabled date in the current week." },
        { name: "Page Up / Page Down", description: "Moves by month; hold Shift to move by year." },
        { name: "Enter / Space", description: "Selects the focused date." },
      ],
      accessibility: "The semantic table exposes grid, row, columnheader, and gridcell roles. Date buttons use roving tabindex, full localized accessible names, aria-current for today, disabled state, and gridcell aria-selected. A polite live region announces the focused date.",
    },
  },
  "date-picker": {
    className: "NyxDatePicker",
    initName: "initDatePickers",
    selector: "[data-nyx-date-picker]",
    reference: {
      attributes: [
        { name: "data-nyx-date-picker", value: "presence", description: "Marks the input, trigger, popover, and Calendar owner." },
        { name: "data-nyx-date-picker-input", value: "presence", description: "Marks the editable ISO date input." },
        { name: "data-nyx-date-picker-trigger", value: "presence", description: "Opens or closes the positioned calendar." },
        { name: "data-nyx-date-picker-popover", value: "presence", description: "Marks the dialog-like positioned surface." },
        { name: "data-nyx-date-picker-placement", value: "placement", description: "Sets the preferred anchored popup placement." },
      ],
      options: [
        { name: "placement", value: "NyxOverlayPlacement", description: "Overrides the preferred popup placement." },
        { name: "Calendar options", value: "NyxCalendarOptions", description: "Passes locale, week start, selection, constraints, and the disabled predicate to the composed Calendar." },
      ],
      methods: [
        { name: "value", value: "string | range | undefined", description: "Gets or sets the synchronized Calendar and input value." },
        { name: "openState", value: "boolean", description: "Reads whether the calendar popover is open." },
        { name: "open(reason?, focusCalendar?)", value: "boolean", description: "Opens, positions, and activates dismissal." },
        { name: "close(reason?)", value: "boolean", description: "Closes and removes positioning and dismissal listeners." },
        { name: "destroy()", value: "void", description: "Destroys the composed Calendar and all picker listeners." },
      ],
      events: [
        { name: "nyx:date-picker:before-open / before-close", value: "cancelable", description: "Fires before popup state changes; API and destroy closure cannot be vetoed." },
        { name: "nyx:date-picker:open / close", value: "not cancelable", description: "Fires after popup state, ARIA, positioning, and focus synchronize." },
        { name: "nyx:date-picker:before-change", value: "cancelable", description: "Fires before a typed or Calendar value is committed." },
        { name: "nyx:date-picker:change", value: "not cancelable", description: "Fires after input and Calendar values synchronize." },
      ],
      keyboard: [
        { name: "Arrow Down", description: "Opens from the input and focuses the active calendar date." },
        { name: "Escape", description: "Closes the popup and returns focus to the trigger." },
        { name: "Calendar keys", description: "Uses the full Calendar grid contract while the popover is open." },
      ],
      accessibility: "The text input remains directly editable and labelled. The trigger owns aria-controls, aria-expanded, and aria-haspopup=dialog. The positioned surface composes Calendar semantics, closes on outside interaction or Escape, and preserves ISO calendar-date values without time-zone conversion.",
    },
  },
  "data-table": {
    className: "NyxDataTable",
    initName: "initDataTables",
    selector: "[data-nyx-data-table]",
    reference: {
      attributes: [
        { name: "data-nyx-data-table", value: "presence", description: "Marks the semantic table enhancement owner." },
        { name: "data-row-key", value: "unique string", description: "Provides stable row identity for selection across transforms and pages." },
        { name: "data-column", value: "column key", description: "Maps cell text or data-sort-value to a sortable column." },
        { name: "data-nyx-data-table-sort", value: "column key", description: "Marks a real header button as sortable." },
        { name: "data-nyx-data-table-page-size", value: "number", description: "Sets the client page size." },
        { name: "data-nyx-data-table-controlled", value: "true", description: "Emits requested state while leaving row transforms to the consumer." },
      ],
      options: [
        { name: "comparators", value: "Record<string, comparator>", description: "Overrides client ordering per column." },
        { name: "predicate", value: "(row, query) => boolean", description: "Overrides client filtering." },
        { name: "controlled", value: "boolean", description: "Disables client row transforms for server-owned data." },
        { name: "pageSize / totalRows", value: "number", description: "Controls pagination and server-mode page counts." },
      ],
      methods: [
        { name: "state", value: "NyxDataTableState", description: "Gets or sets filter, sort, page, and page-size state." },
        { name: "selectedKeys", value: "readonly string[]", description: "Returns stable selected row keys across pages." },
        { name: "sort / filter / goToPage", value: "boolean", description: "Requests a state transition and reports whether it was accepted." },
        { name: "select(key, selected)", value: "boolean", description: "Changes persistent row selection through cancelable events." },
        { name: "refresh()", value: "void", description: "Re-reads server-replaced or application-mutated body rows." },
        { name: "destroy()", value: "void", description: "Removes delegated controls and releases the cached instance." },
      ],
      events: [
        { name: "nyx:data-table:before-sort / filter / page", value: "cancelable", description: "Fires before client transforms or controlled-mode requests are committed." },
        { name: "nyx:data-table:sort / filter / page", value: "not cancelable", description: "Fires with previous and requested state after UI synchronization." },
        { name: "nyx:data-table:before-select", value: "cancelable", description: "Fires before one row or the current page selection changes." },
        { name: "nyx:data-table:select", value: "not cancelable", description: "Fires with the full persistent selected-key set." },
      ],
      keyboard: [
        { name: "Tab", description: "Moves through the filter, selection checkboxes, sortable header buttons, and pagination." },
        { name: "Enter / Space", description: "Activates native sort, selection, and page controls." },
      ],
      accessibility: "The component retains native table, caption, thead, tbody, th, and td semantics. Sort controls are buttons inside column headers, aria-sort is maintained on each th, selection uses labelled checkboxes, and page status is announced politely.",
    },
  },
  tabs: {
    className: "NyxTabs",
    initName: "initTabs",
    selector: "[data-nyx-tabs]",
    reference: {
      attributes: [{ name: "data-nyx-tabs", value: "presence", description: "Marks the root that owns the tab list and panels." }],
      methods: [
        { name: "value", value: "number", description: "Gets or sets the active zero-based tab index." },
        { name: "activate(index, moveFocus?)", value: "void", description: "Activates a tab; focus moves by default." },
        { name: "destroy()", value: "void", description: "Removes listeners and releases the cached instance." },
      ],
      events: [
        { name: "nyx:tabs:before-change", value: "cancelable", description: "Fires before the active tab changes." },
        { name: "nyx:tabs:change", value: "not cancelable", description: "Fires after selection, focus state, and panels are synchronized." },
      ],
      keyboard: [
        { name: "Arrow Right / Arrow Down", description: "Moves to the next tab, wrapping at the end." },
        { name: "Arrow Left / Arrow Up", description: "Moves to the previous tab, wrapping at the start." },
        { name: "Home / End", description: "Moves to the first or last tab." },
      ],
      accessibility: "The controller keeps role=tab selection, roving tabindex, aria-controls, role=tabpanel, hidden state, and aria-labelledby relationships synchronized.",
    },
  },
  dialog: {
    className: "NyxDialog",
    initName: "initDialogs",
    selector: "dialog[data-nyx-dialog]",
    reference: {
      attributes: [
        { name: "data-nyx-dialog", value: "presence", description: "Marks a native dialog for initialization." },
        { name: "data-nyx-dialog-trigger", value: "dialog id", description: "Associates an opener with its dialog." },
        { name: "data-nyx-dialog-close", value: "presence", description: "Closes the containing dialog." },
        { name: "data-nyx-dialog-initial-focus", value: "selector", description: "Selects the element focused after opening." },
        { name: "data-nyx-dialog-close-on-escape", value: "true | false", description: "Controls Escape dismissal; defaults to true." },
        { name: "data-nyx-dialog-close-on-backdrop", value: "true | false", description: "Controls backdrop dismissal; defaults to true." },
      ],
      options: [
        { name: "closeOnBackdrop", value: "boolean", description: "Overrides backdrop dismissal." },
        { name: "closeOnEscape", value: "boolean", description: "Overrides Escape dismissal." },
        { name: "initialFocus", value: "string", description: "Overrides the initial-focus selector." },
        { name: "root", value: "ParentNode", description: "Scopes discovery of associated triggers." },
      ],
      methods: [
        { name: "value", value: "boolean", description: "Gets or sets the open state." },
        { name: "open(trigger?)", value: "void", description: "Opens modally and records the focus-return target." },
        { name: "close(reason?)", value: "void", description: "Requests closure with an optional reason." },
        { name: "destroy()", value: "void", description: "Closes safely, releases scroll lock, and removes listeners." },
      ],
      events: [
        { name: "nyx:dialog:before-open", value: "cancelable", description: "Fires before showModal()." },
        { name: "nyx:dialog:open", value: "not cancelable", description: "Fires after the dialog opens and initial focus moves." },
        { name: "nyx:dialog:before-close", value: "cancelable except destroy", description: "Fires before the dialog closes." },
        { name: "nyx:dialog:close", value: "not cancelable", description: "Fires after state, scroll lock, and focus return are settled." },
      ],
      keyboard: [
        { name: "Escape", description: "Closes when enabled; a canceled before-close event keeps it open." },
        { name: "Tab / Shift+Tab", description: "Uses the native modal dialog focus boundary." },
      ],
      accessibility: "Nyx uses the native dialog element, sets aria-modal, connects triggers with aria-controls and aria-expanded, moves initial focus, returns focus on close, and preserves the supplied label and description relationships.",
    },
  },
  "dropdown-menu": {
    className: "NyxDropdownMenu",
    initName: "initDropdownMenus",
    selector: "[data-nyx-dropdown-menu]",
    reference: {
      attributes: [
        { name: "data-nyx-dropdown-menu", value: "presence", description: "Marks the menu root." },
        { name: "data-nyx-dropdown-menu-trigger", value: "menu id", description: "Associates a trigger or submenu item with a menu." },
        { name: "data-nyx-dropdown-menu-close-on-select", value: "true | false", description: "Overrides selection dismissal for a menu or item." },
        { name: "data-nyx-dropdown-menu-close-on-checkbox-select", value: "true | false", description: "Controls dismissal for checkbox items." },
        { name: "data-nyx-dropdown-menu-placement", value: "placement", description: "Sets the preferred anchored placement." },
      ],
      options: [
        { name: "closeOnCheckboxSelect", value: "boolean", description: "Overrides checkbox-item dismissal." },
        { name: "closeOnSelect", value: "boolean", description: "Overrides standard item dismissal." },
        { name: "placement", value: "NyxOverlayPlacement", description: "Sets the preferred anchored placement." },
        { name: "reference", value: "NyxOverlayReference", description: "Uses an element or virtual positioning reference." },
        { name: "root", value: "ParentNode", description: "Scopes discovery of associated triggers." },
      ],
      methods: [
        { name: "value", value: "boolean", description: "Gets or sets the open state." },
        { name: "open(trigger?, focus?)", value: "void", description: "Opens the menu and focuses the first or last enabled item." },
        { name: "close(reason?)", value: "void", description: "Closes the menu tree with a reason." },
        { name: "setPositioning(reference, placement?)", value: "void", description: "Updates the anchor or virtual reference." },
        { name: "destroy()", value: "void", description: "Closes and removes positioning, dismissal, typeahead, and DOM listeners." },
      ],
      events: [
        { name: "nyx:dropdown-menu:before-open", value: "cancelable", description: "Fires before opening." },
        { name: "nyx:dropdown-menu:open", value: "not cancelable", description: "Fires after opening and focus placement." },
        { name: "nyx:dropdown-menu:before-close", value: "cancelable except destroy or parent", description: "Fires before closure." },
        { name: "nyx:dropdown-menu:close", value: "not cancelable", description: "Fires after closure and focus return." },
        { name: "nyx:dropdown-menu:select", value: "not cancelable", description: "Fires when an enabled item is selected." },
      ],
      keyboard: [
        { name: "Enter / Space / Arrow Down", description: "Opens from a trigger and focuses the first item." },
        { name: "Arrow Up", description: "Opens from a trigger at the last item; within a menu moves upward." },
        { name: "Arrow Down / Home / End", description: "Moves through enabled items with wrapping and edge shortcuts." },
        { name: "Arrow Right / Arrow Left", description: "Opens a submenu or returns to its parent." },
        { name: "Escape", description: "Closes and returns focus." },
        { name: "Printable characters", description: "Moves focus by typeahead." },
      ],
      accessibility: "The controller assigns menu relationships to triggers, maintains aria-expanded and checked states, skips disabled items, uses roving focus, and returns focus after dismissal.",
    },
  },
  "context-menu": {
    className: "NyxContextMenu",
    initName: "initContextMenus",
    selector: "[data-nyx-context-menu]",
    reference: {
      attributes: [
        { name: "data-nyx-context-menu", value: "menu id", description: "Associates the invoker region with a dropdown menu." },
        { name: "data-nyx-dropdown-menu", value: "presence", description: "Marks the associated menu root." },
      ],
      methods: [
        { name: "value", value: "boolean", description: "Reads whether the associated menu is open." },
        { name: "openAt(x, y, returnFocusTo?)", value: "void", description: "Opens at pointer or keyboard-derived coordinates." },
        { name: "close(reason?)", value: "void", description: "Closes the associated menu." },
        { name: "destroy()", value: "void", description: "Destroys both the context binding and its menu controller." },
      ],
      events: [
        { name: "nyx:context-menu:before-open", value: "cancelable", description: "Fires before the associated menu opens." },
        { name: "nyx:context-menu:open", value: "not cancelable", description: "Fires after opening." },
        { name: "nyx:context-menu:before-close", value: "cancelable when the underlying close is cancelable", description: "Fires before closing." },
        { name: "nyx:context-menu:close", value: "not cancelable", description: "Fires after closing." },
      ],
      keyboard: [
        { name: "Context Menu key / Shift+F10", description: "Opens beside the focused target." },
        { name: "Menu keys", description: "Uses the associated dropdown menu keyboard contract after opening." },
      ],
      accessibility: "The invoker is made keyboard focusable and receives aria-controls, aria-haspopup=menu, and aria-expanded. The associated dropdown controller owns menu focus and selection semantics.",
    },
  },
  menubar: {
    className: "NyxMenubar",
    initName: "initMenubars",
    selector: "[data-nyx-menubar]",
    reference: {
      attributes: [
        { name: "data-nyx-menubar", value: "presence", description: "Marks the application command bar." },
        { name: "data-nyx-dropdown-menu-trigger", value: "menu id", description: "Associates each top-level command with its menu." },
        { name: "data-nyx-dropdown-menu", value: "presence", description: "Marks each owned menu." },
      ],
      methods: [
        { name: "value", value: "number", description: "Returns the open top-level item index, or -1." },
        { name: "open(index)", value: "void", description: "Opens a top-level menu by index." },
        { name: "close(reason?)", value: "void", description: "Closes the active menu." },
        { name: "destroy()", value: "void", description: "Destroys owned menu controllers and removes listeners." },
      ],
      events: [
        { name: "nyx:menubar:before-open", value: "cancelable", description: "Fires before a top-level menu opens." },
        { name: "nyx:menubar:open", value: "not cancelable", description: "Fires after opening." },
        { name: "nyx:menubar:before-close", value: "inherits underlying cancelability", description: "Fires before closure." },
        { name: "nyx:menubar:close", value: "not cancelable", description: "Fires after closure." },
      ],
      keyboard: [
        { name: "Arrow Left / Arrow Right", description: "Moves among top-level commands; an open menu follows focus." },
        { name: "Home / End", description: "Moves to the first or last command." },
        { name: "Arrow Down", description: "Opens the focused command menu." },
        { name: "Menu keys", description: "Uses dropdown menu navigation within an open menu." },
      ],
      accessibility: "The root receives role=menubar, top-level triggers receive role=menuitem, and horizontal roving focus is coordinated with each owned menu's ARIA state.",
    },
  },
  "navigation-menu": {
    className: "NyxNavigationMenu",
    initName: "initNavigationMenus",
    selector: "[data-nyx-navigation-menu]",
    reference: {
      attributes: [
        { name: "data-nyx-navigation-menu", value: "presence", description: "Marks the semantic navigation root." },
        { name: "data-nyx-navigation-menu-trigger", value: "panel id", description: "Associates a disclosure button with a panel." },
        { name: "data-nyx-navigation-menu-content", value: "presence", description: "Marks a disclosure panel." },
        { name: "data-nyx-navigation-menu-inline", value: "presence", description: "Keeps a panel in document flow instead of positioning it as a popover." },
      ],
      methods: [
        { name: "value", value: "number", description: "Returns the open item index, or -1." },
        { name: "open(index, focusFirst?)", value: "void", description: "Opens a panel and can move focus to its first link." },
        { name: "close(reason?)", value: "void", description: "Closes the active panel." },
        { name: "destroy()", value: "void", description: "Closes the menu and removes positioning, dismissal, and trigger listeners." },
      ],
      events: [
        { name: "nyx:navigation-menu:before-open", value: "cancelable", description: "Fires before a panel opens." },
        { name: "nyx:navigation-menu:open", value: "not cancelable", description: "Fires after opening." },
        { name: "nyx:navigation-menu:before-close", value: "cancelable except destroy or switch", description: "Fires before closure." },
        { name: "nyx:navigation-menu:close", value: "not cancelable", description: "Fires after closure." },
      ],
      keyboard: [
        { name: "Enter / Space", description: "Opens the focused disclosure." },
        { name: "Arrow Down", description: "Opens and focuses the first link or enabled button." },
        { name: "Escape", description: "Closes an open panel and returns focus to its trigger." },
      ],
      accessibility: "The root remains a semantic nav instead of a menu widget. Nyx connects each button and panel with aria-controls, updates aria-expanded, and leaves links with their native behavior.",
    },
  },
  "notification-center": {
    className: "NyxNotificationCenter",
    initName: "initNotificationCenters",
    selector: "[data-nyx-notification-center]",
    reference: {
      attributes: [
        { name: "data-nyx-notification-center", value: "presence", description: "Marks the notification collection and ownership boundary." },
        { name: "data-nyx-notification", value: "presence", description: "Marks an item whose read state and dismissal are managed." },
        { name: "data-nyx-notification-id", value: "unique string", description: "Provides the stable value used by the API; an ID is generated when omitted." },
        { name: "data-state", value: "unread | all-read | empty; unread | read", description: "Reflects collection state on the root and read state on each item." },
        { name: "data-nyx-notification-read / data-nyx-notification-dismiss", value: "presence", description: "Marks native item action buttons." },
        { name: "data-nyx-notification-mark-all", value: "presence", description: "Marks the native bulk read button." },
        { name: "data-nyx-notification-count / data-nyx-notification-empty", value: "presence", description: "Marks the polite unread summary and empty state." },
      ],
      methods: [
        { name: "value", value: "string[]", description: "Gets or sets the stable IDs currently marked unread." },
        { name: "notifications", value: "HTMLElement[]", description: "Returns the currently owned notification elements." },
        { name: "setRead(itemOrId, read?, reason?)", value: "boolean", description: "Requests a read or unread transition." },
        { name: "markAllRead()", value: "number", description: "Marks every accepted unread item read and returns the changed count." },
        { name: "dismiss(itemOrId, reason?)", value: "boolean", description: "Requests removal of one notification." },
        { name: "destroy()", value: "void", description: "Removes listeners and releases the cached instance without deleting authored items." },
      ],
      events: [
        { name: "nyx:notification-center:before-read / before-unread", value: "cancelable", description: "Fires before an item's read state changes." },
        { name: "nyx:notification-center:read / unread", value: "not cancelable", description: "Fires after item, count, controls, data-state, and ARIA synchronize." },
        { name: "nyx:notification-center:before-dismiss", value: "cancelable", description: "Fires before an item is removed." },
        { name: "nyx:notification-center:dismiss", value: "not cancelable", description: "Fires after removal and collection-state synchronization." },
      ],
      keyboard: [
        { name: "Tab / Shift+Tab", description: "Moves through notification links and native action buttons." },
        { name: "Enter / Space", description: "Activates the focused native button; Enter follows a focused link." },
      ],
      accessibility: "Notifications remain a semantic labelled section containing a list. A polite output announces unread-count changes, read toggles expose aria-pressed with stable accessible names, disabled bulk state is synchronized, and removal never steals focus programmatically.",
    },
  },
  "filter-bar": {
    className: "NyxFilterBar",
    initName: "initFilterBars",
    selector: "[data-nyx-filter-bar]",
    reference: {
      attributes: [
        { name: "data-nyx-filter-bar", value: "presence", description: "Marks the native form controls and active-summary ownership boundary." },
        { name: "data-nyx-filter-label", value: "string", description: "Provides the compact label used in a generated active-filter chip." },
        { name: "data-nyx-filter-bar-active", value: "presence", description: "Marks the container that receives removable active-filter chips." },
        { name: "data-nyx-filter-bar-count", value: "presence", description: "Marks the polite active-filter count." },
        { name: "data-nyx-filter-bar-clear", value: "presence", description: "Marks the native clear-all button." },
        { name: "data-state", value: "active | inactive", description: "Reflects whether any named control has a non-empty value." },
      ],
      methods: [
        { name: "value", value: "Record<string, string[]>", description: "Gets or sets normalized values keyed by native control name." },
        { name: "setValue(value, reason?)", value: "boolean", description: "Requests an atomic filter change and reports whether it was accepted." },
        { name: "remove(name, value)", value: "boolean", description: "Requests removal of one named filter value." },
        { name: "clear()", value: "boolean", description: "Requests removal of every active filter." },
        { name: "destroy()", value: "void", description: "Removes listeners and generated chips, then releases the cached instance." },
      ],
      events: [
        { name: "nyx:filter-bar:before-change", value: "cancelable", description: "Fires before a native, API, chip-removal, or clear-all change is committed." },
        { name: "nyx:filter-bar:change", value: "not cancelable", description: "Fires after controls, chips, count, data-state, and clear-button ARIA synchronize." },
      ],
      keyboard: [
        { name: "Tab / Shift+Tab", description: "Moves through native filter controls, generated remove buttons, and clear all." },
        { name: "Control-specific keys", description: "Search, select, and checkbox controls retain their native keyboard behavior." },
        { name: "Enter / Space", description: "Activates a focused remove or clear button." },
      ],
      accessibility: "The root is a labelled native form with persistent labels. Active values are summarized as operable buttons with precise names, the count is announced politely, and vetoed changes restore the previously committed native control state.",
    },
  },
  "command-bar": {
    className: "NyxCommandBar",
    initName: "initCommandBars",
    selector: "[data-nyx-command-bar]",
    reference: {
      attributes: [
        { name: "data-nyx-command-bar", value: "presence", description: "Marks the toolbar ownership boundary." },
        { name: "data-nyx-command", value: "presence", description: "Marks a native command control managed by roving focus and execution events." },
        { name: "data-value", value: "unique string", description: "Provides the stable command value; one is generated when omitted." },
        { name: "data-nyx-command-bar-orientation", value: "horizontal | vertical", description: "Selects the arrow-key axis; horizontal is the default." },
        { name: "data-state", value: "active | disabled; current | idle | disabled", description: "Reflects toolbar availability and each command's synchronized state." },
      ],
      methods: [
        { name: "value", value: "string | null", description: "Gets or sets the current roving command without moving focus." },
        { name: "commands", value: "HTMLElement[]", description: "Returns the currently owned command controls." },
        { name: "focus(commandOrValue?)", value: "HTMLElement | null", description: "Focuses a command, or the first or last enabled command." },
        { name: "run(commandOrValue, reason?)", value: "boolean", description: "Requests command execution and reports whether it was accepted." },
        { name: "refresh()", value: "void", description: "Rebuilds roving focus after commands or disabled states change." },
        { name: "destroy()", value: "void", description: "Removes listeners and releases the cached instance." },
      ],
      events: [
        { name: "nyx:command-bar:before-run", value: "cancelable", description: "Fires before a control or API command is committed." },
        { name: "nyx:command-bar:run", value: "not cancelable", description: "Fires after the current command, data-state, and ARIA synchronize." },
      ],
      keyboard: [
        { name: "Arrow Left / Arrow Right", description: "Moves focus among enabled commands in a horizontal toolbar." },
        { name: "Arrow Up / Arrow Down", description: "Moves focus among enabled commands when vertical orientation is configured." },
        { name: "Home / End", description: "Moves to the first or last enabled command." },
        { name: "Enter / Space", description: "Activates the focused native button and emits the command event pair." },
      ],
      accessibility: "The root exposes the toolbar role and orientation, native buttons retain activation semantics, disabled commands are skipped, and roving tabindex reduces the toolbar to one stop in the page tab sequence. Every toolbar needs an accessible name.",
    },
  },
  "bulk-action-toolbar": {
    className: "NyxBulkActionToolbar",
    initName: "initBulkActionToolbars",
    selector: "[data-nyx-bulk-action-toolbar]",
    reference: {
      attributes: [
        { name: "data-nyx-bulk-action-toolbar", value: "presence", description: "Marks the selection and toolbar ownership boundary." },
        { name: "data-nyx-bulk-select / data-nyx-bulk-select-all", value: "presence", description: "Marks native item and select-all checkboxes." },
        { name: "data-nyx-bulk-toolbar / data-nyx-bulk-count", value: "presence", description: "Marks the contextual toolbar and its polite selection summary." },
        { name: "data-nyx-bulk-action", value: "unique action string", description: "Marks a native button and supplies its stable action value." },
        { name: "data-nyx-bulk-clear", value: "presence", description: "Marks the native clear-selection button." },
        { name: "data-nyx-bulk-persistent", value: "presence", description: "Keeps the inactive toolbar visible instead of toggling hidden." },
        { name: "data-state", value: "active | inactive; checked | unchecked | mixed", description: "Reflects toolbar and checkbox state alongside native properties and ARIA." },
      ],
      methods: [
        { name: "value", value: "string[]", description: "Gets or sets selected item values in DOM order." },
        { name: "selections", value: "HTMLInputElement[]", description: "Returns enabled owned item checkboxes with non-empty values." },
        { name: "setValue(value, reason?)", value: "boolean", description: "Requests an atomic selection change and reports whether it was accepted." },
        { name: "clear()", value: "boolean", description: "Requests removal of the complete selection." },
        { name: "run(actionOrValue, reason?)", value: "boolean", description: "Requests a bulk action with a snapshot of selected values." },
        { name: "refresh()", value: "void", description: "Re-reads selection and controls after the application changes the collection." },
        { name: "destroy()", value: "void", description: "Removes listeners and releases the cached instance without altering authored items." },
      ],
      events: [
        { name: "nyx:bulk-action-toolbar:before-change", value: "cancelable", description: "Fires before a checkbox, select-all, clear, or API selection change commits." },
        { name: "nyx:bulk-action-toolbar:change", value: "not cancelable", description: "Fires after checkboxes, rows, count, visibility, mixed state, data-state, and ARIA synchronize." },
        { name: "nyx:bulk-action-toolbar:before-run", value: "cancelable", description: "Fires before a selected-item action is dispatched." },
        { name: "nyx:bulk-action-toolbar:run", value: "not cancelable", description: "Fires with the action value and a stable selection snapshot." },
      ],
      keyboard: [
        { name: "Tab / Shift+Tab", description: "Moves between native selection controls and the contextual toolbar." },
        { name: "Arrow Left / Arrow Right", description: "Moves among enabled toolbar controls while the toolbar is active." },
        { name: "Home / End", description: "Moves to the first or last enabled toolbar control." },
        { name: "Space", description: "Toggles a focused checkbox or activates a focused native button." },
      ],
      accessibility: "Selection uses native checkboxes, including a programmatic mixed select-all state. A polite output reports the count, the contextual toolbar is named, and clearing from within a toolbar that becomes hidden returns focus to select all.",
    },
  },
  toast: {
    className: "NyxToast",
    initName: "initToasts",
    selector: "[data-nyx-toast-region]",
    reference: {
      attributes: [{ name: "data-nyx-toast-region", value: "presence", description: "Marks the notification region managed by the controller." }],
      options: [
        { name: "title", value: "string", description: "Required notification heading." },
        { name: "description", value: "string", description: "Optional supporting message." },
        { name: "tone", value: "neutral | success | warning | danger", description: "Controls semantic tone and live-region role." },
        { name: "duration", value: "number", description: "Auto-dismiss delay in milliseconds; zero keeps the toast open." },
      ],
      methods: [
        { name: "value", value: "readonly HTMLElement[]", description: "Returns the active toast elements." },
        { name: "notify(options)", value: "HTMLElement", description: "Creates and announces a notification." },
        { name: "dismiss(toast, reason?)", value: "void", description: "Dismisses one managed notification." },
        { name: "destroy()", value: "void", description: "Clears timers, removes toasts and listeners, and releases the cached instance." },
      ],
      events: [
        { name: "nyx:toast:before-notify", value: "cancelable", description: "Fires before insertion into the live region." },
        { name: "nyx:toast:notify", value: "not cancelable", description: "Fires after insertion." },
        { name: "nyx:toast:before-dismiss", value: "cancelable except destroy", description: "Fires before dismissal." },
        { name: "nyx:toast:dismiss", value: "not cancelable", description: "Fires after removal." },
      ],
      keyboard: [{ name: "Tab / Enter / Space", description: "Reaches and activates each notification's dismiss button through native button behavior." }],
      accessibility: "The region is a polite, non-atomic live region labeled Notifications. Each generated toast uses status, or alert for danger, and includes an accessible dismiss button.",
    },
  },
};

export function page(options: DocPage): DocPage {
  return options;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function highlightMarkup(source: string): string {
  const pattern = /<!--[\s\S]*?-->|<![^>]*>|<\/?[A-Za-z][^>]*>/g;
  let output = "";
  let cursor = 0;
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    output += escapeHtml(source.slice(cursor, index));
    const token = match[0];
    if (token.startsWith("<!--")) output += `<span class="tok-comment">${escapeHtml(token)}</span>`;
    else {
      const escaped = escapeHtml(token)
        .replace(/^(&lt;\/?)([\w:-]+)/, '$1<span class="tok-tag">$2</span>')
        .replace(/([\w:-]+)=(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="tok-attr">$1</span>=<span class="tok-string">$2</span>');
      output += escaped;
    }
    cursor = index + token.length;
  }
  return output + escapeHtml(source.slice(cursor));
}

function highlightScript(source: string): string {
  const pattern = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\.|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(import|from|const|let|new|return|if|else|function|class|extends|export|true|false|null|undefined|await)\b|\b(\d+(?:\.\d+)?)\b/g;
  let output = "";
  let cursor = 0;
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    output += escapeHtml(source.slice(cursor, index));
    const value = match[0];
    const className = match[1] ? value.startsWith("//") || value.startsWith("/*") ? "tok-comment" : "tok-string" : match[2] ? "tok-keyword" : "tok-number";
    output += `<span class="${className}">${escapeHtml(value)}</span>`;
    cursor = index + value.length;
  }
  return output + escapeHtml(source.slice(cursor));
}

let codeBlockIndex = 0;
let exampleIndex = 0;

export function codeBlock(source: string, language: CodeLanguage, label: string): string {
  const normalized = source.trim();
  const highlighted = language === "html" ? highlightMarkup(normalized) : highlightScript(normalized);
  const statusId = `copy-status-${codeBlockIndex++}`;
  return `<div class="docs-code" data-code-language="${language}"><div class="docs-code-toolbar"><span>${label}</span><button class="docs-copy-button" type="button" data-copy-code aria-describedby="${statusId}">Copy</button><span class="sr-only" id="${statusId}" role="status" aria-live="polite" data-copy-status></span></div><pre class="nyx-scrollable-overlay" tabindex="0"><code>${highlighted}</code></pre></div>`;
}

function table(title: string, headings: string[], rows: ReferenceRow[]): string {
  if (!rows.length) return "";
  return `<section class="docs-reference-section"><h2>${title}</h2><div class="docs-table-wrap nyx-scrollable-overlay"><table class="nyx-table docs-reference-table"><thead><tr>${headings.map((heading) => `<th scope="col">${heading}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr><th scope="row"><code>${escapeHtml(row.name)}</code></th>${row.value !== undefined ? `<td><code>${escapeHtml(row.value)}</code></td>` : ""}<td>${row.description}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function initialization(plugin: PluginName): string {
  const api = pluginApis[plugin];
  const source = `import { ${api.initName}, ${api.className} } from "@nyx-ui/plugins/${plugin}";\n\n// Initialize every matching component in a subtree.\nconst instances = ${api.initName}(root);\n\n// Or construct one known component explicitly.\nconst element = root.querySelector("${api.selector}");\nconst instance = new ${api.className}(element);\n\n// Release listeners before replacing the subtree.\ninstances.forEach((item) => item.destroy());\ninstance.destroy();`;
  return `<section class="docs-reference-section"><h2>JavaScript initialization</h2><p>Use the root-scoped initializer for rendered subtrees, or construct one controller when you already own its element.</p>${codeBlock(source, "js", "JavaScript")}</section>`;
}

function componentReference(page: DocPage): string {
  const plugin = page.plugins?.[0];
  if (!plugin) {
    const template = document.createElement("template");
    template.innerHTML = page.body;
    const values = new Map<string, Set<string>>();
    template.content.querySelectorAll("[data-example-preview] *").forEach((element) => {
      Array.from(element.attributes).filter((attribute) => attribute.name.startsWith("data-")).forEach((attribute) => {
        const current = values.get(attribute.name) ?? new Set<string>();
        current.add(attribute.value || "presence");
        values.set(attribute.name, current);
      });
    });
    const attributes = Array.from(values, ([name, observed]) => ({
      name,
      value: Array.from(observed).join(" | "),
      description: name.startsWith("data-nyx-") ? "Nyx enhancement or styling hook used by the example." : "Semantic styling or state hook used by the example.",
    }));
    return `<div class="docs-reference">${table("Data attributes", ["Attribute", "Values shown", "Purpose"], attributes)}<section class="docs-reference-section"><h2>Keyboard interaction</h2><div class="docs-table-wrap nyx-scrollable-overlay"><table class="nyx-table docs-reference-table"><thead><tr><th scope="col">Key</th><th scope="col">Behavior</th></tr></thead><tbody><tr><th scope="row"><code>Native controls</code></th><td>Nyx adds no keyboard handler. Links, buttons, form controls, details, and other native elements keep their platform behavior.</td></tr></tbody></table></div></section><section class="docs-reference-section"><h2>Accessibility</h2><p>There is no JavaScript-managed ARIA state. Preserve the semantic elements, accessible names, labels, descriptions, and relationships shown in the source when adapting it.</p></section></div>`;
  }
  const reference = pluginApis[plugin].reference;
  return `<div class="docs-reference">${initialization(plugin)}${table("Data attributes", ["Attribute", "Value", "Purpose"], reference.attributes)}${table("Options", ["Option", "Type", "Purpose"], reference.options ?? [])}${table("Public methods", ["Member", "Returns", "Purpose"], reference.methods)}${table("Events", ["Event", "Cancelable", "When it fires"], reference.events)}${table("Keyboard interaction", ["Key", "Behavior"], reference.keyboard)}<section class="docs-reference-section"><h2>Accessibility</h2><p>${reference.accessibility}</p></section></div>`;
}

export function renderPage(page: DocPage): string {
  const reference = page.categoryId ? componentReference(page) : "";
  return `<section class="docs-section" data-docs-page="${page.path}"><header class="docs-page-header"><span class="nyx-eyebrow">// ${page.categoryLabel}</span><h1 class="docs-title" tabindex="-1">${page.title}</h1><p class="docs-intro">${page.description}</p></header>${page.body}${reference}</section>`;
}

export function card(title: string, body: string, _badge = "Ready", source = body): string {
  const normalized = source.trim();
  const highlighted = highlightMarkup(normalized);
  const index = exampleIndex++;
  const prefix = `docs-example-${index}`;
  const previewTabId = `${prefix}-preview-tab`;
  const htmlTabId = `${prefix}-html-tab`;
  const previewPanelId = `${prefix}-preview-panel`;
  const htmlPanelId = `${prefix}-html-panel`;
  const statusId = `${prefix}-copy-status`;
  return `<article class="docs-component-card" data-docs-example><header class="docs-component-head"><h2>${title}</h2></header><div class="docs-example" data-nyx-tabs><div class="docs-example-toolbar"><div class="nyx-tabs-list docs-example-tabs" role="tablist" aria-label="${escapeHtml(title)} example views"><button class="nyx-tab" id="${previewTabId}" type="button" role="tab" aria-controls="${previewPanelId}" aria-selected="true">Preview</button><button class="nyx-tab" id="${htmlTabId}" type="button" role="tab" aria-controls="${htmlPanelId}" aria-selected="false">HTML</button></div><button class="docs-copy-button" type="button" data-copy-code aria-describedby="${statusId}">Copy</button><span class="sr-only" id="${statusId}" role="status" aria-live="polite" data-copy-status></span></div><div class="docs-example-panels"><div class="docs-component-body docs-example-panel" id="${previewPanelId}" role="tabpanel" aria-labelledby="${previewTabId}" data-example-preview>${body}</div><div class="docs-code docs-example-panel" id="${htmlPanelId}" role="tabpanel" aria-labelledby="${htmlTabId}" hidden><pre class="nyx-scrollable-overlay" tabindex="0"><code>${highlighted}</code></pre></div></div></div></article>`;
}

export function selectMarkup(markup: string, selectors: string[]): string {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return selectors.flatMap((selector) => Array.from(template.content.querySelectorAll(selector))).map((element) => element.outerHTML).join("\n\n");
}
