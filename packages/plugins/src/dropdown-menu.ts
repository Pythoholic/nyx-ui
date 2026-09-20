import { NyxOverlayDismissal, type NyxOverlayDismissReason } from "./internal/dismissal.js";
import { getTextDirection, inlineBackwardArrow, inlineForwardArrow } from "./internal/direction.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import {
  positionOverlay,
  type NyxOverlayPositionCleanupOptions,
  type NyxOverlayPlacement,
  type NyxOverlayReference,
} from "./internal/positioning.js";
import { isDisabledItem, NyxRovingFocus, type NyxRovingFocusEdge } from "./internal/roving-focus.js";
import { NyxTypeahead } from "./internal/typeahead.js";

export type NyxDropdownMenuCloseReason =
  | "api"
  | "destroy"
  | "escape"
  | "focus-leave"
  | "native"
  | "outside"
  | "parent"
  | "select"
  | "trigger";

export interface NyxDropdownMenuOptions {
  closeOnCheckboxSelect?: boolean;
  closeOnSelect?: boolean;
  placement?: NyxOverlayPlacement;
  reference?: NyxOverlayReference;
  root?: ParentNode;
}

export interface NyxDropdownMenuEventDetail {
  item?: HTMLElement;
  menu: NyxDropdownMenu;
  reason?: NyxDropdownMenuCloseReason;
  trigger?: HTMLElement;
}

export interface NyxDropdownMenuEventMap {
  "nyx:dropdown-menu:before-close": CustomEvent<NyxDropdownMenuEventDetail>;
  "nyx:dropdown-menu:before-open": CustomEvent<NyxDropdownMenuEventDetail>;
  "nyx:dropdown-menu:close": CustomEvent<NyxDropdownMenuEventDetail>;
  "nyx:dropdown-menu:open": CustomEvent<NyxDropdownMenuEventDetail>;
  "nyx:dropdown-menu:select": CustomEvent<NyxDropdownMenuEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxDropdownMenuEventMap {}
}

const menuSelector = "[data-nyx-dropdown-menu]";
const itemSelector =
  "[role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio']";
const triggerSelector = "[data-nyx-dropdown-menu-trigger]";
const instances = new WeakMap<HTMLElement, NyxDropdownMenu>();

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function isPopoverOpen(element: HTMLElement): boolean {
  try {
    return element.matches(":popover-open");
  } catch {
    return false;
  }
}

export class NyxDropdownMenu {
  readonly element: HTMLElement;

  private readonly closeOnCheckboxSelect: boolean;
  private readonly closeOnSelect: boolean;
  private readonly dismissal: NyxOverlayDismissal;
  private internalToggle = false;
  private readonly items: HTMLElement[];
  private openState: boolean;
  private placement: NyxOverlayPlacement;
  private positionCleanup: ((options?: NyxOverlayPositionCleanupOptions) => void) | undefined;
  private reference: NyxOverlayReference | undefined;
  private readonly root: ParentNode;
  private parentInstance: NyxDropdownMenu | null = null;
  private readonly rovingFocus: NyxRovingFocus;
  private returnFocusTo: HTMLElement | null = null;
  private restoreAfterNativeClose = false;
  private readonly triggers: HTMLElement[];
  private readonly typeahead: NyxTypeahead;
  private readonly usesNativePopover: boolean;

  constructor(element: HTMLElement, options: NyxDropdownMenuOptions = {}) {
    if (!element.id) {
      throw new Error("NyxDropdownMenu requires the menu element to have an id.");
    }

    this.element = element;
    this.root = options.root ?? element.ownerDocument;
    this.items = Array.from(element.querySelectorAll<HTMLElement>(itemSelector)).filter(
      (item) => item.closest(menuSelector) === element,
    );
    this.triggers = queryAllIncludingRoot<HTMLElement>(
      this.root,
      triggerSelector,
    ).filter((trigger) => trigger.dataset.nyxDropdownMenuTrigger === element.id);
    this.closeOnSelect =
      options.closeOnSelect ??
      readBoolean(element.dataset.nyxDropdownMenuCloseOnSelect, true);
    this.closeOnCheckboxSelect =
      options.closeOnCheckboxSelect ??
      readBoolean(
        element.dataset.nyxDropdownMenuCloseOnCheckboxSelect,
        this.closeOnSelect,
      );
    this.placement =
      options.placement ??
      (element.dataset.nyxDropdownMenuPlacement as
        | NyxOverlayPlacement
        | undefined) ??
      (this.isSubmenu()
        ? getTextDirection(element) === "rtl" ? "left-start" : "right-start"
        : "bottom-start");
    this.reference = options.reference;
    this.usesNativePopover =
      typeof element.showPopover === "function" &&
      typeof element.hidePopover === "function";
    this.openState = isPopoverOpen(element);
    this.rovingFocus = new NyxRovingFocus(this.items);
    this.typeahead = new NyxTypeahead(this.items);
    this.dismissal = new NyxOverlayDismissal({
      element,
      onDismiss: this.handleDismiss,
      pointerInside: this.triggers,
    });

    this.element.setAttribute("role", "menu");
    this.element.setAttribute("popover", "auto");
    if (!this.usesNativePopover) this.element.hidden = !this.openState;
    this.items.forEach((item) => {
      const role = item.getAttribute("role");
      if (
        (role === "menuitemcheckbox" || role === "menuitemradio") &&
        !item.hasAttribute("aria-checked")
      ) {
        item.setAttribute("aria-checked", "false");
      }
      this.syncCheckedState(item);
    });
    this.triggers.forEach((trigger) => {
      trigger.setAttribute("aria-controls", element.id);
      trigger.setAttribute("aria-haspopup", "menu");
      if (trigger.closest(menuSelector)) return;
      trigger.addEventListener("click", this.handleTriggerClick);
      trigger.addEventListener("keydown", this.handleTriggerKeydown);
    });
    this.element.addEventListener("beforetoggle", this.handleBeforeToggle);
    this.element.addEventListener("toggle", this.handleToggle);
    this.element.addEventListener("click", this.handleClick);
    this.element.addEventListener("keydown", this.handleKeydown);
    this.syncState();

    if (this.openState) this.activateOpenState();
  }

  get value(): boolean {
    return this.openState;
  }

  set value(open: boolean) {
    if (open) this.open();
    else this.close();
  }

  setPositioning(
    reference: NyxOverlayReference,
    placement: NyxOverlayPlacement = this.placement,
  ): void {
    this.reference = reference;
    this.placement = placement;
    if (this.openState) this.activateOpenState();
  }

  open(
    trigger?: HTMLElement,
    focus: NyxRovingFocusEdge = "first",
  ): void {
    if (this.openState) {
      this.rovingFocus.focus(focus);
      return;
    }

    const detail: NyxDropdownMenuEventDetail = { menu: this };
    if (trigger) detail.trigger = trigger;
    if (
      !dispatchNyxEvent(
        this.element,
        "nyx:dropdown-menu:before-open",
        detail,
        true,
      )
    ) {
      return;
    }

    this.closeSiblingSubmenus();
    this.returnFocusTo = trigger ?? this.getActiveElement();
    this.internalToggle = true;
    try {
      if (this.usesNativePopover) this.element.showPopover();
      else this.element.hidden = false;
    } finally {
      this.internalToggle = false;
    }
    this.openState = true;
    this.syncState();
    this.activateOpenState();
    this.rovingFocus.focus(focus);
    dispatchNyxEvent(this.element, "nyx:dropdown-menu:open", detail);
  }

  close(reason: NyxDropdownMenuCloseReason = "api"): void {
    if (!this.openState) return;

    const detail: NyxDropdownMenuEventDetail = { menu: this, reason };
    if (
      !dispatchNyxEvent(
        this.element,
        "nyx:dropdown-menu:before-close",
        detail,
        reason !== "destroy" && reason !== "parent",
      )
    ) {
      return;
    }

    this.openSubmenus().forEach((submenu) => submenu.close("parent"));
    this.internalToggle = true;
    try {
      if (this.usesNativePopover) this.element.hidePopover();
      else this.element.hidden = true;
    } finally {
      this.internalToggle = false;
    }
    this.finalizeClose(detail);
  }

  destroy(): void {
    if (this.openState) this.close("destroy");
    this.positionCleanup?.();
    this.positionCleanup = undefined;
    this.dismissal.destroy();
    this.typeahead.destroy();
    this.triggers.forEach((trigger) => {
      trigger.removeEventListener("click", this.handleTriggerClick);
      trigger.removeEventListener("keydown", this.handleTriggerKeydown);
    });
    this.element.removeEventListener("beforetoggle", this.handleBeforeToggle);
    this.element.removeEventListener("toggle", this.handleToggle);
    this.element.removeEventListener("click", this.handleClick);
    this.element.removeEventListener("keydown", this.handleKeydown);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private readonly handleTriggerClick = (event: Event): void => {
    const trigger = event.currentTarget as HTMLElement;
    if (this.openState) this.close("trigger");
    else this.open(trigger);
  };

  private readonly handleTriggerKeydown = (event: KeyboardEvent): void => {
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }

    event.preventDefault();
    this.open(
      event.currentTarget as HTMLElement,
      event.key === "ArrowUp" ? "last" : "first",
    );
  };

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLElement>(itemSelector);
    if (!item || !this.items.includes(item)) return;
    if (isDisabledItem(item)) {
      event.preventDefault();
      return;
    }

    const submenu = this.getSubmenuForItem(item);
    if (submenu) {
      event.preventDefault();
      if (submenu.value) submenu.close("trigger");
      else submenu.open(item);
      return;
    }

    this.select(item);
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !this.items.includes(target)) return;

    if (this.rovingFocus.handleKeydown(event)) return;

    if (event.key === inlineForwardArrow(this.element)) {
      const submenu = this.getSubmenuForItem(target);
      if (submenu) {
        event.preventDefault();
        submenu.open(target);
      }
      return;
    }

    if (event.key === inlineBackwardArrow(this.element) && this.isSubmenu()) {
      event.preventDefault();
      this.close("api");
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      target.click();
      return;
    }

    const match = this.typeahead.match(event);
    if (!match) return;
    event.preventDefault();
    this.rovingFocus.focus(match);
  };

  private readonly handleDismiss = (reason: NyxOverlayDismissReason): void => {
    if (reason === "escape") {
      this.close("escape");
      return;
    }

    const root = this.rootMenu();
    root.close(reason);
    if (reason === "focus-leave" && root.value) {
      const current = root.items.find((item) => item.tabIndex === 0);
      root.rovingFocus.focus(current ?? "first");
    }
  };

  private readonly handleBeforeToggle = (event: Event): void => {
    if (this.internalToggle) return;
    const toggleEvent = event as ToggleEvent;
    if (toggleEvent.newState === "open" && !this.openState) {
      const detail: NyxDropdownMenuEventDetail = { menu: this };
      if (
        !dispatchNyxEvent(
          this.element,
          "nyx:dropdown-menu:before-open",
          detail,
          true,
        )
      ) {
        event.preventDefault();
      }
      return;
    }

    if (toggleEvent.newState === "closed" && this.openState) {
      const detail: NyxDropdownMenuEventDetail = {
        menu: this,
        reason: "native",
      };
      if (
        !dispatchNyxEvent(
          this.element,
          "nyx:dropdown-menu:before-close",
          detail,
          true,
        )
      ) {
        event.preventDefault();
        this.restoreAfterNativeClose = !event.cancelable;
      }
    }
  };

  private readonly handleToggle = (event: Event): void => {
    if (this.internalToggle) return;
    const toggleEvent = event as ToggleEvent;
    if (toggleEvent.newState === "open" && !this.openState) {
      this.returnFocusTo = this.getActiveElement();
      this.openState = true;
      this.syncState();
      this.activateOpenState();
      this.rovingFocus.focus("first");
      dispatchNyxEvent(this.element, "nyx:dropdown-menu:open", { menu: this });
      return;
    }

    if (toggleEvent.newState === "closed" && this.openState) {
      if (this.restoreAfterNativeClose) {
        this.restoreAfterNativeClose = false;
        this.internalToggle = true;
        try {
          this.element.showPopover();
        } finally {
          this.internalToggle = false;
        }
        return;
      }
      this.finalizeClose({ menu: this, reason: "native" });
    }
  };

  private activateOpenState(): void {
    this.dismissal.activate();
    this.positionCleanup?.();
    const reference = this.reference ?? this.triggers[0];
    if (reference) {
      this.positionCleanup = positionOverlay(reference, this.element, {
        placement: this.placement,
      });
    }
  }

  private finalizeClose(detail: NyxDropdownMenuEventDetail): void {
    this.openState = false;
    // Keep the final anchored coordinates while the discrete popover exit runs.
    // The next open or destroy performs the full placement reset.
    this.positionCleanup?.({ preservePlacement: true });
    this.dismissal.deactivate();
    this.syncState();
    if (!this.usesNativePopover) this.element.hidden = true;
    if (this.returnFocusTo?.isConnected) this.returnFocusTo.focus();
    this.returnFocusTo = null;
    dispatchNyxEvent(this.element, "nyx:dropdown-menu:close", detail);
  }

  private select(item: HTMLElement): void {
    const role = item.getAttribute("role");
    if (role === "menuitemcheckbox") {
      item.setAttribute(
        "aria-checked",
        String(item.getAttribute("aria-checked") !== "true"),
      );
      this.syncCheckedState(item);
    } else if (role === "menuitemradio") {
      const group = item.closest<HTMLElement>("[role='group']") ?? this.element;
      Array.from(
        group.querySelectorAll<HTMLElement>("[role='menuitemradio']"),
      )
        .filter(
          (candidate) =>
            candidate.closest(menuSelector) === this.element &&
            (candidate.closest("[role='group']") ?? this.element) === group,
        )
        .forEach((candidate) => {
          candidate.setAttribute("aria-checked", String(candidate === item));
          this.syncCheckedState(candidate);
        });
    }

    dispatchNyxEvent(this.element, "nyx:dropdown-menu:select", {
      item,
      menu: this,
    });
    if (this.shouldCloseOnSelect(item)) this.closeMenuTree("select");
  }

  private shouldCloseOnSelect(item: HTMLElement): boolean {
    const itemPreference = item.dataset.nyxDropdownMenuCloseOnSelect;
    if (itemPreference !== undefined) {
      return readBoolean(itemPreference, this.closeOnSelect);
    }
    return item.getAttribute("role") === "menuitemcheckbox"
      ? this.closeOnCheckboxSelect
      : this.closeOnSelect;
  }

  private syncCheckedState(item: HTMLElement): void {
    const role = item.getAttribute("role");
    if (role !== "menuitemcheckbox" && role !== "menuitemradio") return;
    item.dataset.state =
      item.getAttribute("aria-checked") === "true" ? "checked" : "unchecked";
  }

  private syncState(): void {
    this.element.dataset.state = this.openState ? "open" : "closed";
    this.triggers.forEach((trigger) => {
      trigger.setAttribute("aria-expanded", String(this.openState));
    });
  }

  private getSubmenuForItem(item: HTMLElement): NyxDropdownMenu | null {
    const id = item.dataset.nyxDropdownMenuTrigger;
    if (!id) return null;
    const element = this.element.ownerDocument.getElementById(id);
    if (!element?.matches(menuSelector)) return null;
    const submenu = getOrCreateDropdownMenu(element, this.root);
    submenu.parentInstance = this;
    return submenu;
  }

  private submenuInstances(): NyxDropdownMenu[] {
    return this.items.flatMap((item) => {
      const submenu = this.getSubmenuForItem(item);
      return submenu ? [submenu] : [];
    });
  }

  private openSubmenus(): NyxDropdownMenu[] {
    return this.submenuInstances().filter((submenu) => submenu.value);
  }

  private closeSiblingSubmenus(): void {
    const parent = this.parentMenu();
    parent?.openSubmenus().forEach((submenu) => {
      if (submenu !== this) submenu.close("parent");
    });
  }

  private closeMenuTree(reason: NyxDropdownMenuCloseReason): void {
    let current: NyxDropdownMenu | null = this;
    while (current) {
      const parent = current.parentMenu();
      current.close(reason);
      current = parent;
    }
  }

  private parentMenu(): NyxDropdownMenu | null {
    if (this.parentInstance) return this.parentInstance;
    const trigger = this.triggers.find((candidate) =>
      candidate.closest(menuSelector),
    );
    const element = trigger?.closest<HTMLElement>(menuSelector);
    return element ? instances.get(element) ?? null : null;
  }

  private rootMenu(): NyxDropdownMenu {
    let root: NyxDropdownMenu = this;
    let parent = root.parentMenu();
    while (parent) {
      root = parent;
      parent = root.parentMenu();
    }
    return root;
  }

  private isSubmenu(): boolean {
    return this.triggers.some((trigger) => trigger.closest(menuSelector));
  }

  private getActiveElement(): HTMLElement | null {
    const activeElement = this.element.ownerDocument.activeElement;
    return activeElement instanceof HTMLElement ? activeElement : null;
  }
}

export function getOrCreateDropdownMenu(
  element: HTMLElement,
  root: ParentNode,
  options: Omit<NyxDropdownMenuOptions, "root"> = {},
): NyxDropdownMenu {
  const current = instances.get(element);
  if (current) {
    if (options.reference) {
      current.setPositioning(options.reference, options.placement);
    }
    return current;
  }
  const instance = new NyxDropdownMenu(element, { ...options, root });
  instances.set(element, instance);
  return instance;
}

export function initDropdownMenus(
  root: ParentNode = document,
): NyxDropdownMenu[] {
  return queryAllIncludingRoot<HTMLElement>(root, menuSelector).map((element) =>
    getOrCreateDropdownMenu(element, root),
  );
}
