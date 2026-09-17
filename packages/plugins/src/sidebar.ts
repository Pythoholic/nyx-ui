import { NyxDialog } from "./dialog.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxSidebarMode = "desktop" | "mobile";
export type NyxSidebarReason = "api" | "dialog" | "toggle";
export type NyxSidebarState = "collapsed" | "closed" | "expanded" | "open";

export interface NyxSidebarOptions {
  mediaQuery?: string;
  storage?: Storage;
}

export interface NyxSidebarEventDetail {
  collapsed: boolean;
  mode: NyxSidebarMode;
  reason: NyxSidebarReason;
  sidebar: NyxSidebar;
  state: NyxSidebarState;
}

export interface NyxSidebarEventMap {
  "nyx:sidebar:before-change": CustomEvent<NyxSidebarEventDetail>;
  "nyx:sidebar:change": CustomEvent<NyxSidebarEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxSidebarEventMap {}
}

const selector = "[data-nyx-sidebar]";
const instances = new WeakMap<HTMLElement, NyxSidebar>();

export class NyxSidebar {
  readonly dialog: NyxDialog;
  readonly element: HTMLElement;
  readonly panel: HTMLDialogElement;

  private collapsedState: boolean;
  private readonly media: MediaQueryList;
  private modeState: NyxSidebarMode;
  private readonly storage: Storage | undefined;
  private readonly storageKey: string | undefined;
  private suppressDialogEvents = false;
  private readonly toggles: HTMLElement[];

  constructor(element: HTMLElement, options: NyxSidebarOptions = {}) {
    this.element = element;
    const panel = element.querySelector<HTMLDialogElement>("dialog[data-nyx-sidebar-panel]");
    if (!panel?.id) throw new Error("NyxSidebar requires an identified dialog with data-nyx-sidebar-panel.");
    this.panel = panel;
    this.toggles = Array.from(element.querySelectorAll<HTMLElement>("[data-nyx-sidebar-toggle]"));
    if (!this.toggles.length) throw new Error("NyxSidebar requires at least one toggle.");
    this.toggles.forEach((toggle) => {
      toggle.setAttribute("aria-controls", panel.id);
      toggle.addEventListener("click", this.handleToggle);
    });

    const mediaQuery = options.mediaQuery ?? element.dataset.nyxSidebarMedia ?? "(max-width: 48rem)";
    this.media = window.matchMedia(mediaQuery);
    this.modeState = this.media.matches ? "mobile" : "desktop";
    this.storageKey = this.persistenceKey();
    this.storage = options.storage ?? this.getStorage();
    this.collapsedState = this.restoreCollapsed();
    this.dialog = new NyxDialog(panel, { initialFocus: "[data-nyx-sidebar-close]", root: element });

    panel.addEventListener("nyx:dialog:before-open", this.handleDialogBeforeOpen);
    panel.addEventListener("nyx:dialog:before-close", this.handleDialogBeforeClose);
    panel.addEventListener("nyx:dialog:open", this.handleDialogOpen);
    panel.addEventListener("nyx:dialog:close", this.handleDialogClose);
    this.media.addEventListener("change", this.handleMediaChange);
    this.applyMode();
    this.sync();
    element.setAttribute("data-nyx-sidebar-ready", "");
  }

  get collapsed(): boolean {
    return this.collapsedState;
  }

  set collapsed(value: boolean) {
    this.setCollapsed(value);
  }

  get mode(): NyxSidebarMode {
    return this.modeState;
  }

  get open(): boolean {
    return this.modeState === "desktop" || this.panel.open;
  }

  expand(): void {
    this.setCollapsed(false);
  }

  collapse(): void {
    this.setCollapsed(true);
  }

  toggle(): void {
    if (this.modeState === "mobile") {
      if (this.panel.open) this.dialog.close("api");
      else this.dialog.open(this.toggles[0]);
      return;
    }
    this.setCollapsed(!this.collapsedState, "toggle");
  }

  setCollapsed(collapsed: boolean, reason: NyxSidebarReason = "api"): void {
    if (collapsed === this.collapsedState) return;
    const state: NyxSidebarState = collapsed ? "collapsed" : "expanded";
    const detail = this.detail(state, reason, collapsed);
    if (!dispatchNyxEvent(this.element, "nyx:sidebar:before-change", detail, true)) return;
    this.collapsedState = collapsed;
    this.persist();
    this.sync();
    dispatchNyxEvent(this.element, "nyx:sidebar:change", detail);
  }

  destroy(): void {
    this.suppressDialogEvents = true;
    this.dialog.destroy();
    this.suppressDialogEvents = false;
    this.media.removeEventListener("change", this.handleMediaChange);
    this.toggles.forEach((toggle) => toggle.removeEventListener("click", this.handleToggle));
    this.panel.removeEventListener("nyx:dialog:before-open", this.handleDialogBeforeOpen);
    this.panel.removeEventListener("nyx:dialog:before-close", this.handleDialogBeforeClose);
    this.panel.removeEventListener("nyx:dialog:open", this.handleDialogOpen);
    this.panel.removeEventListener("nyx:dialog:close", this.handleDialogClose);
    this.panel.removeAttribute("open");
    this.element.removeAttribute("data-nyx-sidebar-ready");
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private persistenceKey(): string | undefined {
    if (!this.element.hasAttribute("data-nyx-sidebar-persist")) return undefined;
    return this.element.dataset.nyxSidebarPersist || `${this.panel.id}:collapsed`;
  }

  private getStorage(): Storage | undefined {
    if (!this.storageKey) return undefined;
    try { return window.localStorage; } catch { return undefined; }
  }

  private restoreCollapsed(): boolean {
    if (!this.storageKey || !this.storage) return this.element.dataset.nyxSidebarCollapsed === "true";
    try { return this.storage.getItem(this.storageKey) === "true"; } catch { return false; }
  }

  private persist(): void {
    if (!this.storageKey || !this.storage) return;
    try { this.storage.setItem(this.storageKey, String(this.collapsedState)); } catch { /* Storage may be unavailable. */ }
  }

  private applyMode(): void {
    this.element.dataset.nyxSidebarMode = this.modeState;
    this.suppressDialogEvents = true;
    if (this.modeState === "desktop") {
      if (this.panel.open) this.dialog.close("api");
      this.panel.setAttribute("open", "");
      this.panel.dataset.state = "open";
      this.panel.removeAttribute("aria-modal");
    } else {
      if (this.panel.open) this.dialog.close("api");
      this.panel.removeAttribute("open");
      this.panel.dataset.state = "closed";
      this.panel.setAttribute("aria-modal", "true");
    }
    this.suppressDialogEvents = false;
  }

  private sync(): void {
    this.element.dataset.nyxSidebarCollapsed = String(this.collapsedState);
    const expanded = this.modeState === "desktop" ? !this.collapsedState : this.panel.open;
    this.toggles.forEach((toggle) => toggle.setAttribute("aria-expanded", String(expanded)));
    this.element.dataset.state = this.modeState === "desktop"
      ? this.collapsedState ? "collapsed" : "expanded"
      : this.panel.open ? "open" : "closed";
  }

  private detail(state: NyxSidebarState, reason: NyxSidebarReason, collapsed = this.collapsedState): NyxSidebarEventDetail {
    return { collapsed, mode: this.modeState, reason, sidebar: this, state };
  }

  private readonly handleToggle = (): void => { this.toggle(); };

  private readonly handleMediaChange = (event: MediaQueryListEvent): void => {
    this.modeState = event.matches ? "mobile" : "desktop";
    this.applyMode();
    this.sync();
  };

  private readonly handleDialogBeforeOpen = (event: Event): void => {
    if (this.suppressDialogEvents || this.modeState !== "mobile") return;
    if (!dispatchNyxEvent(this.element, "nyx:sidebar:before-change", this.detail("open", "dialog"), true)) event.preventDefault();
  };

  private readonly handleDialogBeforeClose = (event: Event): void => {
    if (this.suppressDialogEvents || this.modeState !== "mobile") return;
    if (!dispatchNyxEvent(this.element, "nyx:sidebar:before-change", this.detail("closed", "dialog"), true)) event.preventDefault();
  };

  private readonly handleDialogOpen = (): void => {
    if (this.suppressDialogEvents || this.modeState !== "mobile") return;
    this.sync();
    dispatchNyxEvent(this.element, "nyx:sidebar:change", this.detail("open", "dialog"));
  };

  private readonly handleDialogClose = (): void => {
    if (this.suppressDialogEvents || this.modeState !== "mobile") return;
    this.sync();
    dispatchNyxEvent(this.element, "nyx:sidebar:change", this.detail("closed", "dialog"));
  };
}

export function initSidebars(root: ParentNode = document): NyxSidebar[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxSidebar(element);
    instances.set(element, instance);
    return instance;
  });
}
