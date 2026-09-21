import { moveFocusBeforeRemoval } from "./internal/focus.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxToastTone = "neutral" | "success" | "warning" | "danger";
export type NyxToastProgress = number | "indeterminate";
export type NyxToastDismissReason =
  | "action"
  | "api"
  | "close-control"
  | "destroy"
  | "timeout";

export interface NyxToastAction {
  label: string;
  value?: string;
}

export interface NyxToastOptions {
  title: string;
  action?: NyxToastAction;
  description?: string;
  progress?: NyxToastProgress;
  tone?: NyxToastTone;
  duration?: number;
}

export interface NyxToastEventDetail {
  action?: NyxToastAction;
  options: NyxToastOptions;
  reason?: NyxToastDismissReason;
  toast: HTMLElement;
  toasts: NyxToast;
}

export interface NyxToastEventMap {
  "nyx:toast:action": CustomEvent<NyxToastEventDetail>;
  "nyx:toast:before-dismiss": CustomEvent<NyxToastEventDetail>;
  "nyx:toast:before-notify": CustomEvent<NyxToastEventDetail>;
  "nyx:toast:dismiss": CustomEvent<NyxToastEventDetail>;
  "nyx:toast:notify": CustomEvent<NyxToastEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxToastEventMap {}
}

interface ToastRecord {
  readonly action?: HTMLButtonElement;
  readonly returnFocus: HTMLElement | null;
  readonly close: HTMLButtonElement;
  readonly handleClose: () => void;
  readonly handleAction?: () => void;
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

    const close = toast.querySelector<HTMLButtonElement>("[data-nyx-toast-dismiss]");
    if (!close) throw new Error("NyxToast could not create its close control.");
    const handleClose = (): void => this.dismiss(toast, "close-control");
    const active = this.region.ownerDocument.activeElement;
    const returnFocus = active instanceof HTMLElement && active !== this.region.ownerDocument.body ? active : null;
    const action = toast.querySelector<HTMLButtonElement>("[data-nyx-toast-action]") ?? undefined;
    const actionOptions = options.action;
    const handleAction = action && actionOptions ? (): void => {
      const detail: NyxToastEventDetail = { action: actionOptions, options, toast, toasts: this };
      if (dispatchNyxEvent(this.region, "nyx:toast:action", detail, true)) this.dismiss(toast, "action");
    } : undefined;
    const record: ToastRecord = {
      close,
      handleClose,
      options,
      returnFocus,
      ...(action ? { action } : {}),
      ...(handleAction ? { handleAction } : {}),
    };
    close.addEventListener("click", handleClose);
    if (action && handleAction) action.addEventListener("click", handleAction);
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
    const fallback = record.returnFocus?.isConnected && !record.returnFocus.closest('[hidden], [inert], [data-state="closing"]')
      ? record.returnFocus : this.region;
    moveFocusBeforeRemoval(toast, this.region, "button", fallback);
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
      if (record.action && record.handleAction) record.action.removeEventListener("click", record.handleAction);
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

    const icon = this.region.ownerDocument.createElement("span");
    icon.className = "nyx-toast-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = options.progress === "indeterminate"
      ? `<span class="nyx-spinner"></span>`
      : `<svg class="nyx-icon" viewBox="0 0 24 24">${tone === "success"
        ? '<path d="m5 12 4 4L19 6" />'
        : tone === "warning"
          ? '<path d="M12 9v4m0 4h.01" /><path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.8 3h16a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />'
          : tone === "danger"
            ? '<circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" />'
            : '<circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" />'}</svg>`;

    const content = this.region.ownerDocument.createElement("div");
    content.className = "nyx-toast-content";
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

    if (options.action) {
      const action = this.region.ownerDocument.createElement("button");
      action.className = "nyx-toast-action";
      action.dataset.nyxToastAction = options.action.value ?? options.action.label;
      action.type = "button";
      action.textContent = options.action.label;
      content.append(action);
    }

    const close = this.region.ownerDocument.createElement("button");
    close.className = "nyx-button nyx-icon-button";
    close.dataset.size = "small";
    close.dataset.nyxToastDismiss = "";
    close.dataset.variant = "quiet";
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss notification");
    close.innerHTML = `<svg aria-hidden="true" class="nyx-icon" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>`;

    toast.append(icon, content, close);

    if (options.progress !== undefined) {
      const progress = this.region.ownerDocument.createElement("div");
      const bar = this.region.ownerDocument.createElement("span");
      progress.className = "nyx-progress nyx-toast-progress";
      progress.setAttribute("aria-label", `${options.title} progress`);
      progress.setAttribute("role", "progressbar");
      bar.className = "nyx-progress-bar";
      if (options.progress === "indeterminate") {
        progress.dataset.indeterminate = "true";
      } else {
        const value = Math.min(100, Math.max(0, options.progress));
        progress.setAttribute("aria-valuemin", "0");
        progress.setAttribute("aria-valuemax", "100");
        progress.setAttribute("aria-valuenow", String(value));
        bar.style.setProperty("--nyx-progress", `${value}%`);
      }
      progress.append(bar);
      toast.append(progress);
    }
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
    if (record.action && record.handleAction) record.action.removeEventListener("click", record.handleAction);
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
