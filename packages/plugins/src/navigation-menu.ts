import { NyxOverlayDismissal, type NyxOverlayDismissReason } from "./internal/dismissal.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { positionOverlay } from "./internal/positioning.js";

export type NyxNavigationMenuCloseReason =
  | "api"
  | "destroy"
  | "escape"
  | "focus-leave"
  | "outside"
  | "switch"
  | "trigger";

export interface NyxNavigationMenuEventDetail {
  navigationMenu: NyxNavigationMenu;
  panel: HTMLElement;
  reason?: NyxNavigationMenuCloseReason;
  trigger: HTMLButtonElement;
}

export interface NyxNavigationMenuEventMap {
  "nyx:navigation-menu:before-close": CustomEvent<NyxNavigationMenuEventDetail>;
  "nyx:navigation-menu:before-open": CustomEvent<NyxNavigationMenuEventDetail>;
  "nyx:navigation-menu:close": CustomEvent<NyxNavigationMenuEventDetail>;
  "nyx:navigation-menu:open": CustomEvent<NyxNavigationMenuEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxNavigationMenuEventMap {}
}

interface NavigationItem {
  cleanup: ReturnType<typeof positionOverlay> | undefined;
  dismissal: NyxOverlayDismissal;
  inline: boolean;
  panel: HTMLElement;
  trigger: HTMLButtonElement;
  usesNativePopover: boolean;
}

const selector = "[data-nyx-navigation-menu]";
const instances = new WeakMap<HTMLElement, NyxNavigationMenu>();

export class NyxNavigationMenu {
  readonly element: HTMLElement;
  readonly items: NavigationItem[];

  private active: NavigationItem | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
    const triggers = Array.from(
      element.querySelectorAll<HTMLButtonElement>("[data-nyx-navigation-menu-trigger]"),
    );
    this.items = triggers.flatMap((trigger) => {
      const panelId = trigger.dataset.nyxNavigationMenuTrigger;
      const panel = panelId ? element.ownerDocument.getElementById(panelId) : null;
      if (!panel?.matches("[data-nyx-navigation-menu-content]")) return [];
      const inline = panel.hasAttribute("data-nyx-navigation-menu-inline");
      const item = {} as NavigationItem;
      Object.assign(item, {
        cleanup: undefined,
        inline,
        panel,
        trigger,
        usesNativePopover:
          !inline &&
          typeof panel.showPopover === "function" &&
          typeof panel.hidePopover === "function",
      });
      item.dismissal = new NyxOverlayDismissal({
        element: panel,
        onDismiss: (reason) => this.handleDismiss(item, reason),
        pointerInside: [trigger],
      });
      return [item];
    });
    if (this.items.length === 0) {
      throw new Error("NyxNavigationMenu requires at least one disclosure panel.");
    }

    this.items.forEach((item) => {
      item.trigger.setAttribute("aria-controls", item.panel.id);
      item.trigger.setAttribute("aria-expanded", "false");
      if (!item.inline) item.panel.setAttribute("popover", "manual");
      item.panel.hidden = true;
      item.trigger.addEventListener("click", this.handleTriggerClick);
      item.trigger.addEventListener("keydown", this.handleTriggerKeydown);
    });
    this.syncState();
  }

  get value(): number {
    return this.active ? this.items.indexOf(this.active) : -1;
  }

  open(index: number, focusFirst = false): void {
    const item = this.items[index];
    if (!item || item === this.active) {
      if (item && focusFirst) this.focusFirstLink(item);
      return;
    }
    const detail = this.detail(item);
    if (!dispatchNyxEvent(this.element, "nyx:navigation-menu:before-open", detail, true)) return;
    if (this.active) this.close("switch");

    item.panel.hidden = false;
    if (item.usesNativePopover) item.panel.showPopover();
    this.active = item;
    item.dismissal.activate();
    if (!item.inline) {
      item.cleanup?.();
      item.cleanup = positionOverlay(item.trigger, item.panel);
    }
    this.syncState();
    if (focusFirst) this.focusFirstLink(item);
    dispatchNyxEvent(this.element, "nyx:navigation-menu:open", detail);
  }

  close(reason: NyxNavigationMenuCloseReason = "api"): void {
    const item = this.active;
    if (!item) return;
    const detail = this.detail(item, reason);
    if (
      !dispatchNyxEvent(
        this.element,
        "nyx:navigation-menu:before-close",
        detail,
        reason !== "destroy" && reason !== "switch",
      )
    ) return;

    // Preserve the last anchored coordinates while the browser completes the
    // discrete popover exit. A later open or destroy performs the full reset.
    item.cleanup?.({ preservePlacement: true });
    item.dismissal.deactivate();
    if (item.usesNativePopover) item.panel.hidePopover();
    item.panel.hidden = true;
    this.active = null;
    this.syncState();
    if (reason === "escape") item.trigger.focus();
    dispatchNyxEvent(this.element, "nyx:navigation-menu:close", detail);
  }

  destroy(): void {
    this.close("destroy");
    this.items.forEach((item) => {
      item.cleanup?.();
      item.cleanup = undefined;
      item.dismissal.destroy();
      item.trigger.removeEventListener("click", this.handleTriggerClick);
      item.trigger.removeEventListener("keydown", this.handleTriggerKeydown);
    });
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private readonly handleTriggerClick = (event: Event): void => {
    const item = this.items.find(({ trigger }) => trigger === event.currentTarget);
    if (!item) return;
    if (this.active === item) this.close("trigger");
    else this.open(this.items.indexOf(item));
  };

  private readonly handleTriggerKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "ArrowDown" && event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const item = this.items.find(({ trigger }) => trigger === event.currentTarget);
    if (item) this.open(this.items.indexOf(item), event.key === "ArrowDown");
  };

  private handleDismiss(item: NavigationItem, reason: NyxOverlayDismissReason): void {
    if (this.active !== item) return;
    this.close(reason);
  }

  private detail(item: NavigationItem, reason?: NyxNavigationMenuCloseReason): NyxNavigationMenuEventDetail {
    const detail: NyxNavigationMenuEventDetail = {
      navigationMenu: this,
      panel: item.panel,
      trigger: item.trigger,
    };
    if (reason) detail.reason = reason;
    return detail;
  }

  private focusFirstLink(item: NavigationItem): void {
    item.panel.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus();
  }

  private syncState(): void {
    this.element.dataset.state = this.active ? "open" : "closed";
    this.items.forEach((item) => {
      const open = item === this.active;
      item.trigger.dataset.state = open ? "open" : "closed";
      item.trigger.setAttribute("aria-expanded", String(open));
      item.panel.dataset.state = open ? "open" : "closed";
    });
  }
}

export function initNavigationMenus(root: ParentNode = document): NyxNavigationMenu[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxNavigationMenu(element);
    instances.set(element, instance);
    return instance;
  });
}
