import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxToastTone = "neutral" | "success" | "warning" | "danger";
export type NyxToastDismissReason =
  | "api"
  | "close-control"
  | "destroy"
  | "timeout";

export interface NyxToastOptions {
  title: string;
  description?: string;
  tone?: NyxToastTone;
  duration?: number;
}

export interface NyxToastEventDetail {
  options: NyxToastOptions;
  reason?: NyxToastDismissReason;
  toast: HTMLElement;
  toasts: NyxToast;
}

export interface NyxToastEventMap {
  "nyx:toast:before-dismiss": CustomEvent<NyxToastEventDetail>;
  "nyx:toast:before-notify": CustomEvent<NyxToastEventDetail>;
  "nyx:toast:dismiss": CustomEvent<NyxToastEventDetail>;
  "nyx:toast:notify": CustomEvent<NyxToastEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxToastEventMap {}
}

interface ToastRecord {
  readonly close: HTMLButtonElement;
  readonly handleClose: () => void;
  readonly options: NyxToastOptions;
  handleAnimationEnd?: () => void;
  removalTimer?: number;
  timer?: number;
}

const instances = new WeakMap<HTMLElement, NyxToast>();
const toastRegionSelector = "[data-nyx-toast-region]";

export class NyxToast {
  readonly region: HTMLElement;

  private readonly records = new Map<HTMLElement, ToastRecord>();

  constructor(region: HTMLElement) {
    this.region = region;
    this.region.setAttribute("aria-live", "polite");
    this.region.setAttribute("aria-label", "Notifications");
    this.region.setAttribute("aria-atomic", "false");
    this.syncState();
  }

  get value(): readonly HTMLElement[] {
    return Array.from(this.records.keys());
  }

  notify(options: NyxToastOptions): HTMLElement {
    const toast = this.createToast(options);
    const detail: NyxToastEventDetail = { options, toast, toasts: this };
    if (
      !dispatchNyxEvent(
        this.region,
        "nyx:toast:before-notify",
        detail,
        true,
      )
    ) {
      return toast;
    }

    const close = toast.querySelector<HTMLButtonElement>("button");
    if (!close) throw new Error("NyxToast could not create its close control.");
    const handleClose = (): void => this.dismiss(toast, "close-control");
    const record: ToastRecord = { close, handleClose, options };
    close.addEventListener("click", handleClose);
    this.records.set(toast, record);
    this.region.append(toast);
    this.syncState();

    const duration = options.duration ?? 5000;
    if (duration > 0) {
      record.timer = window.setTimeout(
        () => this.dismiss(toast, "timeout"),
        duration,
      );
    }
    dispatchNyxEvent(this.region, "nyx:toast:notify", detail);
    return toast;
  }

  dismiss(
    toast: HTMLElement,
    reason: NyxToastDismissReason = "api",
  ): void {
    const record = this.records.get(toast);
    if (!record || toast.dataset.state === "closing") return;

    const detail: NyxToastEventDetail = {
      options: record.options,
      reason,
      toast,
      toasts: this,
    };
    const cancelable = reason !== "destroy";
    if (
      !dispatchNyxEvent(
        this.region,
        "nyx:toast:before-dismiss",
        detail,
        cancelable,
      )
    ) {
      return;
    }

    if (record.timer !== undefined) window.clearTimeout(record.timer);
    toast.dataset.state = "closing";
    const remove = (): void => this.removeToast(toast, detail);
    record.handleAnimationEnd = remove;
    toast.addEventListener("animationend", remove, { once: true });
    record.removalTimer = window.setTimeout(remove, 400);
  }

  destroy(): void {
    Array.from(this.records.keys()).forEach((toast) => {
      const record = this.records.get(toast);
      if (!record) return;
      if (record.timer !== undefined) window.clearTimeout(record.timer);
      if (record.removalTimer !== undefined) {
        window.clearTimeout(record.removalTimer);
      }
      record.close.removeEventListener("click", record.handleClose);
      if (record.handleAnimationEnd) {
        toast.removeEventListener("animationend", record.handleAnimationEnd);
      }
      dispatchNyxEvent(this.region, "nyx:toast:before-dismiss", {
        options: record.options,
        reason: "destroy",
        toast,
        toasts: this,
      });
      toast.remove();
      this.records.delete(toast);
      dispatchNyxEvent(this.region, "nyx:toast:dismiss", {
        options: record.options,
        reason: "destroy",
        toast,
        toasts: this,
      });
    });
    this.syncState();
    if (instances.get(this.region) === this) instances.delete(this.region);
  }

  private createToast(options: NyxToastOptions): HTMLElement {
    const toast = this.region.ownerDocument.createElement("article");
    const tone = options.tone ?? "neutral";

    toast.className = "nyx-toast";
    toast.dataset.tone = tone;
    toast.dataset.state = "open";
    toast.setAttribute("role", tone === "danger" ? "alert" : "status");

    const content = this.region.ownerDocument.createElement("div");
    const title = this.region.ownerDocument.createElement("strong");
    title.className = "nyx-toast-title";
    title.textContent = options.title;
    content.append(title);

    if (options.description) {
      const description = this.region.ownerDocument.createElement("p");
      description.className = "nyx-toast-description";
      description.textContent = options.description;
      content.append(description);
    }

    const close = this.region.ownerDocument.createElement("button");
    close.className = "nyx-button nyx-icon-button";
    close.dataset.size = "small";
    close.dataset.variant = "quiet";
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss notification");
    close.innerHTML = `<svg aria-hidden="true" class="nyx-icon" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>`;

    toast.append(content, close);
    return toast;
  }

  private removeToast(
    toast: HTMLElement,
    detail: NyxToastEventDetail,
  ): void {
    const record = this.records.get(toast);
    if (!record) return;
    if (record.removalTimer !== undefined) {
      window.clearTimeout(record.removalTimer);
    }
    record.close.removeEventListener("click", record.handleClose);
    if (record.handleAnimationEnd) {
      toast.removeEventListener("animationend", record.handleAnimationEnd);
    }
    toast.remove();
    this.records.delete(toast);
    this.syncState();
    dispatchNyxEvent(this.region, "nyx:toast:dismiss", detail);
  }

  private syncState(): void {
    this.region.dataset.state = this.records.size > 0 ? "active" : "inactive";
  }
}

export function initToasts(root: ParentNode = document): NyxToast[] {
  return queryAllIncludingRoot<HTMLElement>(root, toastRegionSelector).map(
    (region) => {
      const current = instances.get(region);
      if (current) return current;
      const instance = new NyxToast(region);
      instances.set(region, instance);
      return instance;
    },
  );
}
