import { beforeEach, describe, expect, it, vi } from "vitest";
import { initDialogs } from "../src/dialog.js";

function installDialogMethods(): void {
  HTMLDialogElement.prototype.showModal = function showModal(): void {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(): void {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

function renderDialogs(): void {
  document.body.innerHTML = `
    <button data-nyx-dialog-trigger="outer">Open outer</button>
    <dialog data-nyx-dialog id="outer" data-nyx-dialog-initial-focus="[data-primary]">
      <button data-secondary>Secondary</button>
      <button data-primary>Primary</button>
    </dialog>
    <dialog data-nyx-dialog id="inner">
      <button data-nyx-dialog-close>Close</button>
    </dialog>
  `;
}

describe("NyxDialog", () => {
  beforeEach(() => {
    installDialogMethods();
    renderDialogs();
  });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const element = document.querySelector<HTMLDialogElement>("#outer");
    if (!element) throw new Error("Dialog fixture was not rendered.");

    const first = initDialogs(element)[0];
    expect(first).toBeDefined();
    expect(initDialogs(element)[0]).toBe(first);

    first?.destroy();
    expect(initDialogs(element)[0]).not.toBe(first);
  });

  it("supports cancelable lifecycle events and synchronizes state and ARIA", () => {
    const trigger = document.querySelector<HTMLButtonElement>(
      "[data-nyx-dialog-trigger='outer']",
    );
    const element = document.querySelector<HTMLDialogElement>("#outer");
    if (!trigger || !element) throw new Error("Dialog fixture was not rendered.");
    const dialog = initDialogs()[0];
    if (!dialog) throw new Error("Dialog was not initialized.");
    const open = vi.fn();
    const preventOpen = (event: Event): void => event.preventDefault();
    element.addEventListener("nyx:dialog:open", open);
    element.addEventListener("nyx:dialog:before-open", preventOpen);

    trigger.click();
    expect(element.open).toBe(false);
    expect(open).not.toHaveBeenCalled();

    element.removeEventListener("nyx:dialog:before-open", preventOpen);
    trigger.click();
    expect(element.dataset.state).toBe("open");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(
      element.querySelector("[data-primary]"),
    );
    expect(open).toHaveBeenCalledOnce();

    const preventClose = (event: Event): void => event.preventDefault();
    element.addEventListener("nyx:dialog:before-close", preventClose);
    dialog.close();
    expect(element.open).toBe(true);
    element.removeEventListener("nyx:dialog:before-close", preventClose);
    dialog.close();
    expect(element.dataset.state).toBe("closed");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("retains the body scroll lock until the last stacked dialog closes", () => {
    const [outer, inner] = initDialogs();
    if (!outer || !inner) throw new Error("Dialogs were not initialized.");

    outer.open();
    inner.open();
    outer.close();
    expect(document.body.dataset.nyxScrollLocked).toBe("true");

    inner.close();
    expect(document.body.dataset.nyxScrollLocked).toBeUndefined();
  });

  it("can disable Escape and backdrop dismissal independently", () => {
    const element = document.querySelector<HTMLDialogElement>("#outer");
    if (!element) throw new Error("Dialog fixture was not rendered.");
    element.dataset.nyxDialogCloseOnBackdrop = "false";
    element.dataset.nyxDialogCloseOnEscape = "false";
    const dialog = initDialogs()[0];
    if (!dialog) throw new Error("Dialog was not initialized.");
    dialog.open();

    element.dispatchEvent(new Event("cancel", { cancelable: true }));
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(element.open).toBe(true);
  });
});
