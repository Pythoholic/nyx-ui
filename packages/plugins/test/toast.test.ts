import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initToasts } from "../src/toast.js";

describe("NyxToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `<div data-nyx-toast-region></div>`;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const region = document.querySelector<HTMLElement>("[data-nyx-toast-region]");
    if (!region) throw new Error("Toast fixture was not rendered.");
    const first = initToasts(region)[0];
    expect(initToasts(region)[0]).toBe(first);

    first?.destroy();
    expect(initToasts(region)[0]).not.toBe(first);
  });

  it("fires lifecycle events, allows vetoes, and synchronizes region state", () => {
    const region = document.querySelector<HTMLElement>("[data-nyx-toast-region]");
    if (!region) throw new Error("Toast fixture was not rendered.");
    const toasts = initToasts(region)[0];
    if (!toasts) throw new Error("Toast region was not initialized.");
    const notify = vi.fn();
    const dismiss = vi.fn();
    region.addEventListener("nyx:toast:notify", notify);
    region.addEventListener("nyx:toast:dismiss", dismiss);

    const toast = toasts.notify({ title: "Saved", duration: 0 });
    expect(toast.isConnected).toBe(true);
    expect(region.dataset.state).toBe("active");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(notify).toHaveBeenCalledOnce();

    const preventDismiss = (event: Event): void => event.preventDefault();
    region.addEventListener("nyx:toast:before-dismiss", preventDismiss);
    toasts.dismiss(toast);
    expect(toast.dataset.state).toBe("open");

    region.removeEventListener("nyx:toast:before-dismiss", preventDismiss);
    toasts.dismiss(toast);
    toast.dispatchEvent(new Event("animationend"));
    expect(toast.isConnected).toBe(false);
    expect(region.dataset.state).toBe("inactive");
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it("does not append a notification when before-notify is canceled", () => {
    const region = document.querySelector<HTMLElement>("[data-nyx-toast-region]");
    if (!region) throw new Error("Toast fixture was not rendered.");
    const toasts = initToasts(region)[0];
    if (!toasts) throw new Error("Toast region was not initialized.");
    region.addEventListener("nyx:toast:before-notify", (event) => {
      event.preventDefault();
    });

    const toast = toasts.notify({ title: "Blocked" });
    expect(toast.isConnected).toBe(false);
    expect(toasts.value).toHaveLength(0);
  });

  it("renders determinate and indeterminate progress semantics", () => {
    const region = document.querySelector<HTMLElement>("[data-nyx-toast-region]");
    if (!region) throw new Error("Toast fixture was not rendered.");
    const toasts = initToasts(region)[0];
    if (!toasts) throw new Error("Toast region was not initialized.");

    const determinate = toasts.notify({ title: "Uploading", progress: 68, duration: 0 });
    const determinateProgress = determinate.querySelector<HTMLElement>("[role='progressbar']");
    expect(determinateProgress?.getAttribute("aria-valuenow")).toBe("68");
    expect(determinateProgress?.querySelector<HTMLElement>(".nyx-progress-bar")?.style.getPropertyValue("--nyx-progress")).toBe("68%");

    const indeterminate = toasts.notify({ title: "Preparing", progress: "indeterminate", duration: 0 });
    const indeterminateProgress = indeterminate.querySelector<HTMLElement>("[role='progressbar']");
    expect(indeterminateProgress?.dataset.indeterminate).toBe("true");
    expect(indeterminateProgress?.hasAttribute("aria-valuenow")).toBe(false);
  });

  it("emits optional actions and dismisses with the action reason", () => {
    const region = document.querySelector<HTMLElement>("[data-nyx-toast-region]");
    if (!region) throw new Error("Toast fixture was not rendered.");
    const toasts = initToasts(region)[0];
    if (!toasts) throw new Error("Toast region was not initialized.");
    const action = vi.fn();
    const dismiss = vi.fn();
    region.addEventListener("nyx:toast:action", action);
    region.addEventListener("nyx:toast:dismiss", dismiss);

    const toast = toasts.notify({
      title: "Uploading",
      action: { label: "View upload", value: "view-upload" },
      duration: 0,
    });
    toast.querySelector<HTMLButtonElement>("[data-nyx-toast-action]")?.click();
    expect(action).toHaveBeenCalledOnce();
    expect(toast.dataset.state).toBe("closing");
    toast.dispatchEvent(new Event("animationend"));
    expect(dismiss.mock.calls[0]?.[0].detail.reason).toBe("action");
    expect(toast.isConnected).toBe(false);
  });
});
