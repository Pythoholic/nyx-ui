import { NyxDialog, type NyxDialogCloseReason, type NyxDialogEventDetail } from "./dialog.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxImageLightboxChangeReason = "api" | "keyboard" | "next" | "previous" | "trigger";

export interface NyxImageLightboxEventDetail {
  imageLightbox: NyxImageLightbox;
  index: number;
  previousIndex: number;
  reason: NyxDialogCloseReason | NyxImageLightboxChangeReason;
  trigger?: HTMLElement;
}

export interface NyxImageLightboxEventMap {
  "nyx:image-lightbox:before-change": CustomEvent<NyxImageLightboxEventDetail>;
  "nyx:image-lightbox:before-close": CustomEvent<NyxImageLightboxEventDetail>;
  "nyx:image-lightbox:before-open": CustomEvent<NyxImageLightboxEventDetail>;
  "nyx:image-lightbox:change": CustomEvent<NyxImageLightboxEventDetail>;
  "nyx:image-lightbox:close": CustomEvent<NyxImageLightboxEventDetail>;
  "nyx:image-lightbox:open": CustomEvent<NyxImageLightboxEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxImageLightboxEventMap {}
}

const selector = "[data-nyx-image-lightbox]";
const instances = new WeakMap<HTMLElement, NyxImageLightbox>();

function integer(value: number): number | undefined {
  return Number.isInteger(value) ? value : undefined;
}

export class NyxImageLightbox {
  readonly element: HTMLElement;
  readonly dialog: HTMLDialogElement;
  readonly triggers: HTMLElement[];

  private activeIndex: number;
  private readonly caption: HTMLElement;
  private readonly dialogController: NyxDialog;
  private readonly image: HTMLImageElement;
  private readonly nextButton: HTMLButtonElement | null;
  private pendingIndex: number | undefined;
  private pendingPreviousIndex: number | undefined;
  private pendingReason: NyxImageLightboxChangeReason = "api";
  private readonly previousButton: HTMLButtonElement | null;
  private readonly status: HTMLOutputElement | null;

  constructor(element: HTMLElement) {
    this.element = element;
    const dialog = element.querySelector<HTMLDialogElement>("dialog[data-nyx-image-lightbox-dialog]");
    const image = dialog?.querySelector<HTMLImageElement>("[data-nyx-image-lightbox-image]");
    const caption = dialog?.querySelector<HTMLElement>("[data-nyx-image-lightbox-caption]");
    if (!dialog || !image || !caption) {
      throw new Error("NyxImageLightbox requires a dialog, image, and caption.");
    }
    if (!dialog.id) throw new Error("NyxImageLightbox requires its dialog to have an id.");

    this.dialog = dialog;
    this.image = image;
    this.caption = caption;
    this.triggers = Array.from(element.querySelectorAll<HTMLElement>("[data-nyx-image-lightbox-trigger]"));
    if (this.triggers.length === 0) throw new Error("NyxImageLightbox requires at least one trigger.");
    this.previousButton = dialog.querySelector<HTMLButtonElement>("[data-nyx-image-lightbox-previous]");
    this.nextButton = dialog.querySelector<HTMLButtonElement>("[data-nyx-image-lightbox-next]");
    this.status = dialog.querySelector<HTMLOutputElement>("[data-nyx-image-lightbox-status]");
    const declared = Number(element.dataset.nyxImageLightboxIndex ?? 0);
    this.activeIndex = this.clamp(integer(declared) ?? 0);

    dialog.addEventListener("nyx:dialog:before-open", this.handleDialogBeforeOpen);
    dialog.addEventListener("nyx:dialog:open", this.handleDialogOpen);
    dialog.addEventListener("nyx:dialog:before-close", this.handleDialogBeforeClose);
    dialog.addEventListener("nyx:dialog:close", this.handleDialogClose);
    this.dialogController = new NyxDialog(dialog, {
      initialFocus: "[data-nyx-dialog-close]",
      root: element,
    });
    element.addEventListener("click", this.handleClick);
    dialog.addEventListener("keydown", this.handleKeyDown);
    this.sync();
  }

  get value(): number {
    return this.activeIndex;
  }

  set value(index: number) {
    this.goTo(index);
  }

  get openState(): boolean {
    return this.dialog.open;
  }

  open(index = this.activeIndex, trigger?: HTMLElement): boolean {
    if (!Number.isInteger(index)) return false;
    const nextIndex = this.normalize(index);
    if (nextIndex === undefined) return false;
    if (this.dialog.open) return this.goTo(nextIndex, trigger ? "trigger" : "api");
    this.pendingIndex = nextIndex;
    this.pendingPreviousIndex = this.activeIndex;
    this.pendingReason = trigger ? "trigger" : "api";
    this.dialogController.open(trigger);
    if (!this.dialog.open) {
      if (this.pendingPreviousIndex !== undefined) this.activeIndex = this.pendingPreviousIndex;
      this.sync();
    }
    this.pendingIndex = undefined;
    this.pendingPreviousIndex = undefined;
    return this.dialog.open;
  }

  close(reason: NyxDialogCloseReason = "api"): boolean {
    if (!this.dialog.open) return false;
    this.dialogController.close(reason);
    return !this.dialog.open;
  }

  goTo(index: number, reason: NyxImageLightboxChangeReason = "api"): boolean {
    const nextIndex = this.normalize(index);
    if (nextIndex === undefined || nextIndex === this.activeIndex) return false;
    const detail = this.detail(reason, nextIndex);
    if (!dispatchNyxEvent(this.element, "nyx:image-lightbox:before-change", detail, true)) return false;
    this.activeIndex = nextIndex;
    this.sync();
    dispatchNyxEvent(this.element, "nyx:image-lightbox:change", detail);
    return true;
  }

  next(reason: NyxImageLightboxChangeReason = "next"): boolean {
    return this.goTo(this.activeIndex + 1, reason);
  }

  previous(reason: NyxImageLightboxChangeReason = "previous"): boolean {
    return this.goTo(this.activeIndex - 1, reason);
  }

  destroy(): void {
    this.element.removeEventListener("click", this.handleClick);
    this.dialog.removeEventListener("keydown", this.handleKeyDown);
    this.dialog.removeEventListener("nyx:dialog:before-open", this.handleDialogBeforeOpen);
    this.dialog.removeEventListener("nyx:dialog:open", this.handleDialogOpen);
    this.dialog.removeEventListener("nyx:dialog:before-close", this.handleDialogBeforeClose);
    this.dialog.removeEventListener("nyx:dialog:close", this.handleDialogClose);
    this.dialogController.destroy();
    this.sync();
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private detail(
    reason: NyxDialogCloseReason | NyxImageLightboxChangeReason,
    index = this.activeIndex,
    trigger?: HTMLElement,
    previousIndex = this.activeIndex,
  ): NyxImageLightboxEventDetail {
    const detail: NyxImageLightboxEventDetail = {
      imageLightbox: this,
      index,
      previousIndex,
      reason,
    };
    if (trigger) detail.trigger = trigger;
    return detail;
  }

  private get loop(): boolean {
    return this.element.hasAttribute("data-nyx-image-lightbox-loop");
  }

  private normalize(index: number): number | undefined {
    if (!Number.isInteger(index)) return undefined;
    if (this.loop) return ((index % this.triggers.length) + this.triggers.length) % this.triggers.length;
    if (index < 0 || index >= this.triggers.length) return undefined;
    return index;
  }

  private clamp(index: number): number {
    return Math.max(0, Math.min(this.triggers.length - 1, index));
  }

  private sync(): void {
    const trigger = this.triggers[this.activeIndex];
    const preview = trigger?.querySelector<HTMLImageElement>("img");
    const source = trigger?.dataset.nyxImageLightboxSrc || preview?.currentSrc || preview?.src || "";
    const alt = trigger?.dataset.nyxImageLightboxAlt ?? preview?.alt ?? "";
    const description = trigger?.dataset.nyxImageLightboxCaption
      ?? trigger?.querySelector<HTMLElement>("[data-nyx-image-lightbox-trigger-caption]")?.textContent?.trim()
      ?? "";
    this.element.dataset.state = this.dialog.open ? "open" : "closed";
    this.element.dataset.nyxImageLightboxIndex = String(this.activeIndex);
    this.image.src = source;
    this.image.alt = alt;
    this.caption.textContent = description;
    this.caption.hidden = description.length === 0;
    if (this.status) this.status.value = `Image ${this.activeIndex + 1} of ${this.triggers.length}`;
    this.triggers.forEach((candidate, index) => {
      const active = index === this.activeIndex;
      candidate.setAttribute("aria-controls", this.dialog.id);
      candidate.setAttribute("aria-expanded", String(active && this.dialog.open));
      candidate.setAttribute("aria-haspopup", "dialog");
      candidate.dataset.state = active ? "active" : "inactive";
    });
    if (this.previousButton) this.previousButton.disabled = !this.loop && this.activeIndex === 0;
    if (this.nextButton) this.nextButton.disabled = !this.loop && this.activeIndex === this.triggers.length - 1;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const trigger = target?.closest<HTMLElement>("[data-nyx-image-lightbox-trigger]");
    if (trigger && this.element.contains(trigger) && !this.dialog.contains(trigger)) {
      const index = this.triggers.indexOf(trigger);
      if (index >= 0) this.open(index, trigger);
      return;
    }
    const control = target?.closest<HTMLElement>("[data-nyx-image-lightbox-previous], [data-nyx-image-lightbox-next]");
    if (!control || !this.dialog.contains(control)) return;
    if (control.hasAttribute("data-nyx-image-lightbox-previous")) this.previous();
    else this.next();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    let handled = true;
    if (event.key === "ArrowLeft") this.previous("keyboard");
    else if (event.key === "ArrowRight") this.next("keyboard");
    else if (event.key === "Home") this.goTo(0, "keyboard");
    else if (event.key === "End") this.goTo(this.triggers.length - 1, "keyboard");
    else handled = false;
    if (handled) event.preventDefault();
  };

  private readonly handleDialogBeforeOpen = (event: CustomEvent<NyxDialogEventDetail>): void => {
    const index = this.pendingIndex ?? this.activeIndex;
    const detail = this.detail(this.pendingReason, index, event.detail.trigger, this.pendingPreviousIndex);
    if (!dispatchNyxEvent(this.element, "nyx:image-lightbox:before-open", detail, true)) {
      event.preventDefault();
      return;
    }
    this.activeIndex = index;
    this.sync();
  };

  private readonly handleDialogOpen = (event: CustomEvent<NyxDialogEventDetail>): void => {
    this.sync();
    dispatchNyxEvent(this.element, "nyx:image-lightbox:open", this.detail(this.pendingReason, this.activeIndex, event.detail.trigger, this.pendingPreviousIndex));
  };

  private readonly handleDialogBeforeClose = (event: CustomEvent<NyxDialogEventDetail>): void => {
    const reason = event.detail.reason ?? "api";
    if (!dispatchNyxEvent(this.element, "nyx:image-lightbox:before-close", this.detail(reason), event.cancelable)) {
      event.preventDefault();
    }
  };

  private readonly handleDialogClose = (event: CustomEvent<NyxDialogEventDetail>): void => {
    this.sync();
    dispatchNyxEvent(this.element, "nyx:image-lightbox:close", this.detail(event.detail.reason ?? "api"));
  };
}

export function initImageLightboxes(root: ParentNode = document): NyxImageLightbox[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxImageLightbox(element);
    instances.set(element, instance);
    return instance;
  });
}
