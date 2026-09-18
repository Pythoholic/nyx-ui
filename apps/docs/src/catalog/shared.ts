export type PluginName =
  | "calendar"
  | "combobox"
  | "command-palette"
  | "context-menu"
  | "dialog"
  | "dropdown-menu"
  | "file-upload"
  | "input-otp"
  | "menubar"
  | "navigation-menu"
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
