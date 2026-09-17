export type PluginName =
  | "context-menu"
  | "dialog"
  | "dropdown-menu"
  | "menubar"
  | "navigation-menu"
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
  return `<section class="docs-section" data-docs-page="${page.path}"><div class="docs-section-heading"><div><span class="nyx-eyebrow">// ${page.categoryLabel}</span><h1 tabindex="-1">${page.title}</h1></div><p class="docs-section-copy">${page.description}</p></div>${page.body}${reference}</section>`;
}

export function card(title: string, body: string, badge = "Ready", source = body): string {
  return `<article class="docs-component-card"><header class="docs-component-head"><h2>${title}</h2><span class="nyx-badge">${badge}</span></header><div class="docs-component-body" data-example-preview>${body}</div>${codeBlock(source, "html", "HTML")}</article>`;
}

export function selectMarkup(markup: string, selectors: string[]): string {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return selectors.flatMap((selector) => Array.from(template.content.querySelectorAll(selector))).map((element) => element.outerHTML).join("\n\n");
}
