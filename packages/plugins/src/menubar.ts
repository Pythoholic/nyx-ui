import {
  getOrCreateDropdownMenu,
  type NyxDropdownMenu,
  type NyxDropdownMenuCloseReason,
  type NyxDropdownMenuEventDetail,
} from "./dropdown-menu.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { NyxRovingFocus } from "./internal/roving-focus.js";

export interface NyxMenubarEventDetail {
  menubar: NyxMenubar;
  menu: NyxDropdownMenu;
  reason?: NyxDropdownMenuCloseReason;
  trigger: HTMLElement;
}

export interface NyxMenubarEventMap {
  "nyx:menubar:before-close": CustomEvent<NyxMenubarEventDetail>;
  "nyx:menubar:before-open": CustomEvent<NyxMenubarEventDetail>;
  "nyx:menubar:close": CustomEvent<NyxMenubarEventDetail>;
  "nyx:menubar:open": CustomEvent<NyxMenubarEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxMenubarEventMap {}
}

const selector = "[data-nyx-menubar]";
const triggerSelector = ":scope > [data-nyx-dropdown-menu-trigger], :scope > * > [data-nyx-dropdown-menu-trigger]";
const instances = new WeakMap<HTMLElement, NyxMenubar>();

interface MenubarItem {
  menu: NyxDropdownMenu;
  trigger: HTMLElement;
}

export class NyxMenubar {
  readonly element: HTMLElement;
  readonly items: MenubarItem[];

  private active: MenubarItem | null = null;
  private readonly rovingFocus: NyxRovingFocus;

  constructor(element: HTMLElement) {
    this.element = element;
    const triggers = Array.from(
      element.querySelectorAll<HTMLElement>(triggerSelector),
    ).filter((trigger) => !trigger.closest("[data-nyx-dropdown-menu]"));
    this.items = triggers.flatMap((trigger) => {
      const menuId = trigger.dataset.nyxDropdownMenuTrigger;
      const menuElement = menuId
        ? element.ownerDocument.getElementById(menuId)
        : null;
      if (!menuElement?.matches("[data-nyx-dropdown-menu]")) return [];
      return [{
        menu: getOrCreateDropdownMenu(menuElement, element.ownerDocument),
        trigger,
      }];
    });
    if (this.items.length === 0) {
      throw new Error("NyxMenubar requires at least one top-level dropdown menu.");
    }

    element.setAttribute("role", "menubar");
    this.items.forEach(({ trigger }) => trigger.setAttribute("role", "menuitem"));
    this.rovingFocus = new NyxRovingFocus(
      this.items.map(({ trigger }) => trigger),
      "horizontal",
    );
    element.addEventListener("keydown", this.handleKeydown);
    element.addEventListener("focusin", this.handleFocusIn);
    this.items.forEach(({ menu }) => {
      menu.element.addEventListener(
        "nyx:dropdown-menu:before-open",
        this.handleBeforeOpen,
      );
      menu.element.addEventListener("nyx:dropdown-menu:open", this.handleOpen);
      menu.element.addEventListener(
        "nyx:dropdown-menu:before-close",
        this.handleBeforeClose,
      );
      menu.element.addEventListener("nyx:dropdown-menu:close", this.handleClose);
    });
    this.syncState();
  }

  get value(): number {
    return this.active ? this.items.indexOf(this.active) : -1;
  }

  open(index: number): void {
    const item = this.items[index];
    item?.menu.open(item.trigger);
  }

  close(reason: NyxDropdownMenuCloseReason = "api"): void {
    this.active?.menu.close(reason);
  }

  destroy(): void {
    this.items.forEach(({ menu }) => menu.destroy());
    this.element.removeEventListener("keydown", this.handleKeydown);
    this.element.removeEventListener("focusin", this.handleFocusIn);
    this.items.forEach(({ menu }) => {
      menu.element.removeEventListener(
        "nyx:dropdown-menu:before-open",
        this.handleBeforeOpen,
      );
      menu.element.removeEventListener(
        "nyx:dropdown-menu:open",
        this.handleOpen,
      );
      menu.element.removeEventListener(
        "nyx:dropdown-menu:before-close",
        this.handleBeforeClose,
      );
      menu.element.removeEventListener(
        "nyx:dropdown-menu:close",
        this.handleClose,
      );
    });
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const topLevel = this.items.find((item) => item.trigger === target);
    const insideTopLevelMenu = this.items.some(({ menu }) =>
      menu.element.contains(target),
    );
    if (!topLevel && !insideTopLevelMenu) return;

    if (topLevel && event.key === "ArrowDown") {
      event.preventDefault();
      topLevel.menu.open(topLevel.trigger);
      return;
    }

    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }
    event.preventDefault();
    const currentIndex = topLevel
      ? this.items.indexOf(topLevel)
      : Math.max(this.value, 0);
    let nextIndex = currentIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = this.items.length - 1;
    else if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % this.items.length;
    else nextIndex = (currentIndex - 1 + this.items.length) % this.items.length;
    const shouldOpen = Boolean(this.active);
    const next = this.items[nextIndex];
    if (!next) return;
    this.rovingFocus.focus(next.trigger);
    if (shouldOpen) next.menu.open(next.trigger);
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    if (!(event.target instanceof HTMLElement)) return;
    const item = this.items.find(({ trigger }) => trigger === event.target);
    if (item) this.rovingFocus.setCurrent(item.trigger);
  };

  private readonly handleBeforeOpen = (event: CustomEvent<NyxDropdownMenuEventDetail>): void => {
    const item = this.itemForEvent(event);
    if (!item) return;
    if (!dispatchNyxEvent(this.element, "nyx:menubar:before-open", this.detail(item), true)) {
      event.preventDefault();
      return;
    }
    if (this.active && this.active !== item) this.active.menu.close("parent");
  };

  private readonly handleOpen = (event: CustomEvent<NyxDropdownMenuEventDetail>): void => {
    const item = this.itemForEvent(event);
    if (!item) return;
    this.active = item;
    this.rovingFocus.setCurrent(item.trigger);
    this.syncState();
    dispatchNyxEvent(this.element, "nyx:menubar:open", this.detail(item));
  };

  private readonly handleBeforeClose = (event: CustomEvent<NyxDropdownMenuEventDetail>): void => {
    const item = this.itemForEvent(event);
    if (!item) return;
    if (!dispatchNyxEvent(
      this.element,
      "nyx:menubar:before-close",
      this.detail(item, event.detail.reason),
      event.cancelable,
    )) event.preventDefault();
  };

  private readonly handleClose = (event: CustomEvent<NyxDropdownMenuEventDetail>): void => {
    const item = this.itemForEvent(event);
    if (!item) return;
    if (this.active === item) this.active = null;
    this.syncState();
    dispatchNyxEvent(
      this.element,
      "nyx:menubar:close",
      this.detail(item, event.detail.reason),
    );
  };

  private itemForEvent(event: Event): MenubarItem | undefined {
    return this.items.find(({ menu }) => menu.element === event.target);
  }

  private detail(item: MenubarItem, reason?: NyxDropdownMenuCloseReason): NyxMenubarEventDetail {
    const detail: NyxMenubarEventDetail = {
      menubar: this,
      menu: item.menu,
      trigger: item.trigger,
    };
    if (reason) detail.reason = reason;
    return detail;
  }

  private syncState(): void {
    this.element.dataset.state = this.active ? "open" : "closed";
  }
}

export function initMenubars(root: ParentNode = document): NyxMenubar[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxMenubar(element);
    instances.set(element, instance);
    return instance;
  });
}
