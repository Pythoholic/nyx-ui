import {
  getOrCreateDropdownMenu,
  type NyxDropdownMenu,
  type NyxDropdownMenuCloseReason,
  type NyxDropdownMenuEventDetail,
} from "./dropdown-menu.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export interface NyxContextMenuEventDetail {
  contextMenu: NyxContextMenu;
  menu: NyxDropdownMenu;
  reason?: NyxDropdownMenuCloseReason;
}

export interface NyxContextMenuEventMap {
  "nyx:context-menu:before-close": CustomEvent<NyxContextMenuEventDetail>;
  "nyx:context-menu:before-open": CustomEvent<NyxContextMenuEventDetail>;
  "nyx:context-menu:close": CustomEvent<NyxContextMenuEventDetail>;
  "nyx:context-menu:open": CustomEvent<NyxContextMenuEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxContextMenuEventMap {}
}

const selector = "[data-nyx-context-menu]";
const instances = new WeakMap<HTMLElement, NyxContextMenu>();

export class NyxContextMenu {
  readonly element: HTMLElement;
  readonly menu: NyxDropdownMenu;

  private point = { x: 0, y: 0 };
  private readonly reference = {
    contextElement: undefined as Element | undefined,
    getBoundingClientRect: (): DOMRect =>
      new DOMRect(this.point.x, this.point.y, 0, 0),
  };

  constructor(element: HTMLElement) {
    const menuId = element.dataset.nyxContextMenu;
    const menuElement = menuId
      ? element.ownerDocument.getElementById(menuId)
      : null;
    if (!menuId || !menuElement?.matches("[data-nyx-dropdown-menu]")) {
      throw new Error(
        "NyxContextMenu requires data-nyx-context-menu to reference a dropdown menu.",
      );
    }

    this.element = element;
    this.reference.contextElement = element;
    this.menu = getOrCreateDropdownMenu(menuElement, element.ownerDocument, {
      placement: "right-start",
      reference: this.reference,
    });

    if (element.tabIndex < 0) element.tabIndex = 0;
    element.setAttribute("aria-controls", menuId);
    element.setAttribute("aria-haspopup", "menu");
    element.addEventListener("contextmenu", this.handleContextMenu);
    element.addEventListener("keydown", this.handleKeydown);
    menuElement.addEventListener(
      "nyx:dropdown-menu:before-open",
      this.handleBeforeOpen,
    );
    menuElement.addEventListener("nyx:dropdown-menu:open", this.handleOpen);
    menuElement.addEventListener(
      "nyx:dropdown-menu:before-close",
      this.handleBeforeClose,
    );
    menuElement.addEventListener("nyx:dropdown-menu:close", this.handleClose);
    this.syncState();
  }

  get value(): boolean {
    return this.menu.value;
  }

  close(reason: NyxDropdownMenuCloseReason = "api"): void {
    this.menu.close(reason);
  }

  openAt(x: number, y: number, returnFocusTo?: HTMLElement): void {
    this.point = { x, y };
    this.menu.setPositioning(this.reference, "right-start");
    this.menu.open(returnFocusTo ?? this.activeElement());
  }

  destroy(): void {
    this.menu.destroy();
    this.element.removeEventListener("contextmenu", this.handleContextMenu);
    this.element.removeEventListener("keydown", this.handleKeydown);
    this.menu.element.removeEventListener(
      "nyx:dropdown-menu:before-open",
      this.handleBeforeOpen,
    );
    this.menu.element.removeEventListener(
      "nyx:dropdown-menu:open",
      this.handleOpen,
    );
    this.menu.element.removeEventListener(
      "nyx:dropdown-menu:before-close",
      this.handleBeforeClose,
    );
    this.menu.element.removeEventListener(
      "nyx:dropdown-menu:close",
      this.handleClose,
    );
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private readonly handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    this.openAt(event.clientX, event.clientY);
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) {
      return;
    }
    event.preventDefault();
    const target = event.target instanceof HTMLElement ? event.target : this.element;
    const rect = target.getBoundingClientRect();
    this.openAt(rect.left, rect.bottom, target);
  };

  private readonly handleBeforeOpen = (event: CustomEvent<NyxDropdownMenuEventDetail>): void => {
    if (event.target !== this.menu.element) return;
    if (!dispatchNyxEvent(this.element, "nyx:context-menu:before-open", this.detail(), true)) {
      event.preventDefault();
    }
  };

  private readonly handleOpen = (event: CustomEvent<NyxDropdownMenuEventDetail>): void => {
    if (event.target !== this.menu.element) return;
    this.syncState();
    dispatchNyxEvent(this.element, "nyx:context-menu:open", this.detail());
  };

  private readonly handleBeforeClose = (event: CustomEvent<NyxDropdownMenuEventDetail>): void => {
    if (event.target !== this.menu.element) return;
    const detail = this.detail(event.detail.reason);
    if (!dispatchNyxEvent(this.element, "nyx:context-menu:before-close", detail, event.cancelable)) {
      event.preventDefault();
    }
  };

  private readonly handleClose = (event: CustomEvent<NyxDropdownMenuEventDetail>): void => {
    if (event.target !== this.menu.element) return;
    this.syncState();
    dispatchNyxEvent(this.element, "nyx:context-menu:close", this.detail(event.detail.reason));
  };

  private detail(reason?: NyxDropdownMenuCloseReason): NyxContextMenuEventDetail {
    const detail: NyxContextMenuEventDetail = { contextMenu: this, menu: this.menu };
    if (reason) detail.reason = reason;
    return detail;
  }

  private syncState(): void {
    const state = this.menu.value ? "open" : "closed";
    this.element.dataset.state = state;
    this.element.setAttribute("aria-expanded", String(this.menu.value));
  }

  private activeElement(): HTMLElement {
    const active = this.element.ownerDocument.activeElement;
    return active instanceof HTMLElement ? active : this.element;
  }
}

export function initContextMenus(root: ParentNode = document): NyxContextMenu[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxContextMenu(element);
    instances.set(element, instance);
    return instance;
  });
}
