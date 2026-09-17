export type NyxDialogCloseReason =
  | "api"
  | "backdrop"
  | "close-control"
  | "destroy"
  | "escape";

export interface NyxDialogEventDetail {
  dialog: NyxDialog;
  reason?: NyxDialogCloseReason;
}

export class NyxDialog {
  readonly element: HTMLDialogElement;

  private readonly triggers: HTMLElement[];
  private readonly closeControls: HTMLElement[];
  private returnFocusTo: HTMLElement | null = null;
  private closeReason: NyxDialogCloseReason = "api";

  constructor(element: HTMLDialogElement, root: ParentNode = document) {
    if (!element.id) {
      throw new Error("NyxDialog requires the dialog element to have an id.");
    }

    this.element = element;
    this.triggers = Array.from(
      root.querySelectorAll<HTMLElement>("[data-nyx-dialog-trigger]"),
    ).filter((trigger) => trigger.dataset.nyxDialogTrigger === element.id);
    this.closeControls = Array.from(
      element.querySelectorAll<HTMLElement>("[data-nyx-dialog-close]"),
    );

    this.element.setAttribute("aria-modal", "true");
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

  open(trigger?: HTMLElement): void {
    if (this.element.open) return;

    this.returnFocusTo = trigger ?? this.getActiveElement();
    this.element.dataset.state = "open";
    document.body.dataset.nyxScrollLocked = "true";
    this.element.showModal();
    this.element.dispatchEvent(
      new CustomEvent<NyxDialogEventDetail>("nyx:dialog:open", {
        bubbles: true,
        detail: { dialog: this },
      }),
    );
  }

  close(reason: NyxDialogCloseReason = "api"): void {
    if (!this.element.open) return;
    this.closeReason = reason;
    this.element.close();
  }

  destroy(): void {
    if (this.element.open) this.close("destroy");
    this.triggers.forEach((trigger) => {
      trigger.removeEventListener("click", this.handleTriggerClick);
    });
    this.closeControls.forEach((control) => {
      control.removeEventListener("click", this.handleCloseClick);
    });
    this.element.removeEventListener("cancel", this.handleCancel);
    this.element.removeEventListener("click", this.handleBackdropClick);
    this.element.removeEventListener("close", this.handleNativeClose);
  }

  private readonly handleTriggerClick = (event: Event): void => {
    this.open(event.currentTarget as HTMLElement);
  };

  private readonly handleCloseClick = (): void => {
    this.close("close-control");
  };

  private readonly handleCancel = (event: Event): void => {
    event.preventDefault();
    this.close("escape");
  };

  private readonly handleBackdropClick = (event: MouseEvent): void => {
    if (event.target === this.element) this.close("backdrop");
  };

  private readonly handleNativeClose = (): void => {
    const reason = this.closeReason;
    this.closeReason = "api";
    this.element.dataset.state = "closed";
    delete document.body.dataset.nyxScrollLocked;
    this.returnFocusTo?.focus();
    this.element.dispatchEvent(
      new CustomEvent<NyxDialogEventDetail>("nyx:dialog:close", {
        bubbles: true,
        detail: { dialog: this, reason },
      }),
    );
  };

  private getActiveElement(): HTMLElement | null {
    return document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  }
}

const instances = new WeakMap<HTMLDialogElement, NyxDialog>();

export function initDialogs(root: ParentNode = document): NyxDialog[] {
  return Array.from(
    root.querySelectorAll<HTMLDialogElement>("dialog[data-nyx-dialog]"),
  ).map((element) => {
    const current = instances.get(element);
    if (current) return current;

    const instance = new NyxDialog(element, root);
    instances.set(element, instance);
    return instance;
  });
}

