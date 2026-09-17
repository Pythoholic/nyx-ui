import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxDialogCloseReason =
  | "api"
  | "backdrop"
  | "close-control"
  | "destroy"
  | "escape";

export interface NyxDialogOptions {
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  initialFocus?: string;
  root?: ParentNode;
}

export interface NyxDialogEventDetail {
  dialog: NyxDialog;
  reason?: NyxDialogCloseReason;
  trigger?: HTMLElement;
}

export interface NyxDialogEventMap {
  "nyx:dialog:before-close": CustomEvent<NyxDialogEventDetail>;
  "nyx:dialog:before-open": CustomEvent<NyxDialogEventDetail>;
  "nyx:dialog:close": CustomEvent<NyxDialogEventDetail>;
  "nyx:dialog:open": CustomEvent<NyxDialogEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxDialogEventMap {}
}

const dialogSelector = "dialog[data-nyx-dialog]";
const tabbableSelector = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "details > summary:first-of-type",
  "[tabindex]:not([tabindex='-1'])",
].join(",");
const instances = new WeakMap<HTMLDialogElement, NyxDialog>();
const scrollLocks = new WeakMap<Document, number>();

function acquireScrollLock(document: Document): void {
  const count = (scrollLocks.get(document) ?? 0) + 1;
  scrollLocks.set(document, count);
  document.body.dataset.nyxScrollLocked = "true";
}

function releaseScrollLock(document: Document): void {
  const count = Math.max((scrollLocks.get(document) ?? 1) - 1, 0);
  if (count === 0) {
    scrollLocks.delete(document);
    delete document.body.dataset.nyxScrollLocked;
    return;
  }

  scrollLocks.set(document, count);
}

export class NyxDialog {
  readonly element: HTMLDialogElement;

  private readonly closeControls: HTMLElement[];
  private readonly closeOnBackdrop: boolean;
  private readonly closeOnEscape: boolean;
  private readonly initialFocusSelector: string | undefined;
  private readonly triggers: HTMLElement[];
  private closeReason: NyxDialogCloseReason = "api";
  private ownsScrollLock = false;
  private returnFocusTo: HTMLElement | null = null;

  constructor(element: HTMLDialogElement, options: NyxDialogOptions = {}) {
    if (!element.id) {
      throw new Error("NyxDialog requires the dialog element to have an id.");
    }

    const root = options.root ?? element.ownerDocument;
    this.element = element;
    this.triggers = queryAllIncludingRoot<HTMLElement>(
      root,
      "[data-nyx-dialog-trigger]",
    ).filter((trigger) => trigger.dataset.nyxDialogTrigger === element.id);
    this.closeControls = queryAllIncludingRoot<HTMLElement>(
      element,
      "[data-nyx-dialog-close]",
    );
    this.closeOnBackdrop =
      options.closeOnBackdrop ??
      element.dataset.nyxDialogCloseOnBackdrop !== "false";
    this.closeOnEscape =
      options.closeOnEscape ??
      element.dataset.nyxDialogCloseOnEscape !== "false";
    this.initialFocusSelector =
      options.initialFocus ?? element.dataset.nyxDialogInitialFocus;

    this.element.setAttribute("aria-modal", "true");
    this.syncState();
    this.triggers.forEach((trigger) => {
      trigger.setAttribute("aria-controls", element.id);
      trigger.addEventListener("click", this.handleTriggerClick);
    });
    this.closeControls.forEach((control) => {
      control.addEventListener("click", this.handleCloseClick);
    });
    this.element.addEventListener("cancel", this.handleCancel);
    this.element.addEventListener("click", this.handleBackdropClick);
    this.element.addEventListener("close", this.handleNativeClose);
  }

  get value(): boolean {
    return this.element.open;
  }

  set value(open: boolean) {
    if (open) this.open();
    else this.close();
  }

  open(trigger?: HTMLElement): void {
    if (this.element.open) return;

    const initialFocus = this.getInitialFocusElement();
    const detail: NyxDialogEventDetail = { dialog: this };
    if (trigger) detail.trigger = trigger;
    if (
      !dispatchNyxEvent(
        this.element,
        "nyx:dialog:before-open",
        detail,
        true,
      )
    ) {
      return;
    }

    this.returnFocusTo = trigger ?? this.getActiveElement();
    this.element.showModal();
    this.acquireScrollLock();
    this.syncState();
    initialFocus.focus();
    dispatchNyxEvent(this.element, "nyx:dialog:open", detail);
  }

  close(reason: NyxDialogCloseReason = "api"): void {
    if (!this.element.open) return;

    const detail: NyxDialogEventDetail = { dialog: this, reason };
    const cancelable = reason !== "destroy";
    if (
      !dispatchNyxEvent(
        this.element,
        "nyx:dialog:before-close",
        detail,
        cancelable,
      )
    ) {
      return;
    }

    this.closeReason = reason;
    this.element.close();
    if (this.element.dataset.state !== "closed" || this.ownsScrollLock) {
      this.finalizeClose();
    }
  }

  destroy(): void {
    if (this.element.open) this.close("destroy");
    this.releaseScrollLock();
    this.triggers.forEach((trigger) => {
      trigger.removeEventListener("click", this.handleTriggerClick);
    });
    this.closeControls.forEach((control) => {
      control.removeEventListener("click", this.handleCloseClick);
    });
    this.element.removeEventListener("cancel", this.handleCancel);
    this.element.removeEventListener("click", this.handleBackdropClick);
    this.element.removeEventListener("close", this.handleNativeClose);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private readonly handleTriggerClick = (event: Event): void => {
    this.open(event.currentTarget as HTMLElement);
  };

  private readonly handleCloseClick = (): void => {
    this.close("close-control");
  };

  private readonly handleCancel = (event: Event): void => {
    event.preventDefault();
    if (this.closeOnEscape) this.close("escape");
  };

  private readonly handleBackdropClick = (event: MouseEvent): void => {
    if (this.closeOnBackdrop && event.target === this.element) {
      this.close("backdrop");
    }
  };

  private readonly handleNativeClose = (): void => {
    if (this.element.dataset.state === "closed" && !this.ownsScrollLock) return;
    this.finalizeClose();
  };

  private finalizeClose(): void {
    const reason = this.closeReason;
    this.closeReason = "api";
    this.releaseScrollLock();
    this.syncState();
    this.returnFocusTo?.focus();
    dispatchNyxEvent(this.element, "nyx:dialog:close", {
      dialog: this,
      reason,
    });
  }

  private acquireScrollLock(): void {
    if (this.ownsScrollLock) return;
    acquireScrollLock(this.element.ownerDocument);
    this.ownsScrollLock = true;
  }

  private releaseScrollLock(): void {
    if (!this.ownsScrollLock) return;
    releaseScrollLock(this.element.ownerDocument);
    this.ownsScrollLock = false;
  }

  private syncState(): void {
    const open = this.element.open;
    this.element.dataset.state = open ? "open" : "closed";
    this.triggers.forEach((trigger) => {
      trigger.setAttribute("aria-expanded", String(open));
    });
  }

  private getInitialFocusElement(): HTMLElement {
    let target: HTMLElement | null = null;
    if (this.initialFocusSelector) {
      try {
        target = this.element.querySelector<HTMLElement>(this.initialFocusSelector);
      } catch {
        throw new Error(
          `NyxDialog received an invalid initial-focus selector: ${this.initialFocusSelector}`,
        );
      }
    }

    target ??= Array.from(
      this.element.querySelectorAll<HTMLElement>(tabbableSelector),
    ).find(
      (candidate) =>
        !candidate.hidden && candidate.getAttribute("aria-hidden") !== "true",
    ) ?? null;
    return target ?? this.element;
  }

  private getActiveElement(): HTMLElement | null {
    const activeElement = this.element.ownerDocument.activeElement;
    return activeElement instanceof HTMLElement ? activeElement : null;
  }
}

export function initDialogs(root: ParentNode = document): NyxDialog[] {
  return queryAllIncludingRoot<HTMLDialogElement>(root, dialogSelector).map(
    (element) => {
      const current = instances.get(element);
      if (current) return current;

      const instance = new NyxDialog(element, { root });
      instances.set(element, instance);
      return instance;
    },
  );
}
