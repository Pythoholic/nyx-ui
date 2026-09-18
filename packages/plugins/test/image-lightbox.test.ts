import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initImageLightboxes, type NyxImageLightbox } from "../src/image-lightbox.js";

function renderLightbox(loop = false): HTMLElement {
  document.body.innerHTML = `<section data-nyx-image-lightbox ${loop ? "data-nyx-image-lightbox-loop" : ""}>
    <button data-nyx-image-lightbox-trigger><img src="/one.png" alt="First"><span data-nyx-image-lightbox-trigger-caption>First caption</span></button>
    <button data-nyx-image-lightbox-trigger><img src="/two.png" alt="Second"><span data-nyx-image-lightbox-trigger-caption>Second caption</span></button>
    <button data-nyx-image-lightbox-trigger><img src="/three.png" alt="Third"><span data-nyx-image-lightbox-trigger-caption>Third caption</span></button>
    <dialog data-nyx-image-lightbox-dialog id="viewer" aria-labelledby="caption">
      <output data-nyx-image-lightbox-status></output>
      <button data-nyx-dialog-close>Close</button>
      <img data-nyx-image-lightbox-image alt="">
      <figcaption data-nyx-image-lightbox-caption id="caption"></figcaption>
      <button data-nyx-image-lightbox-previous>Previous</button>
      <button data-nyx-image-lightbox-next>Next</button>
    </dialog>
  </section>`;
  return document.querySelector<HTMLElement>("[data-nyx-image-lightbox]")!;
}

describe("NyxImageLightbox", () => {
  let initialized: NyxImageLightbox[] = [];

  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal(): void { this.open = true; };
    HTMLDialogElement.prototype.close = function close(): void {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    };
    renderLightbox();
  });

  afterEach(() => {
    initialized.forEach((lightbox) => lightbox.destroy());
    initialized = [];
    document.body.removeAttribute("data-nyx-scroll-locked");
  });

  it("includes its root, initializes idempotently, and reinitializes after destroy", () => {
    const root = renderLightbox();
    const first = initImageLightboxes(root)[0]!;
    expect(initImageLightboxes(root)[0]).toBe(first);
    first.destroy();
    const next = initImageLightboxes(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("opens the selected image and synchronizes source, caption, state, ARIA, and focus", () => {
    initialized = initImageLightboxes();
    const lightbox = initialized[0]!;
    const opened = vi.fn();
    lightbox.element.addEventListener("nyx:image-lightbox:open", opened);
    lightbox.triggers[1]?.click();
    expect(lightbox.openState).toBe(true);
    expect(lightbox.value).toBe(1);
    expect(lightbox.element.dataset.state).toBe("open");
    expect(lightbox.dialog.querySelector<HTMLImageElement>("img")?.src).toContain("/two.png");
    expect(lightbox.dialog.querySelector<HTMLImageElement>("img")?.alt).toBe("Second");
    expect(lightbox.dialog.querySelector("figcaption")?.textContent).toBe("Second caption");
    expect(lightbox.triggers[1]?.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(lightbox.dialog.querySelector("[data-nyx-dialog-close]"));
    expect(document.body.dataset.nyxScrollLocked).toBe("true");
    expect(opened).toHaveBeenCalledOnce();
  });

  it("pairs cancelable change events with keyboard navigation and looping", () => {
    const root = renderLightbox(true);
    initialized = initImageLightboxes(root);
    const lightbox = initialized[0]!;
    lightbox.open(2);
    const changed = vi.fn();
    lightbox.element.addEventListener("nyx:image-lightbox:change", changed);
    lightbox.dialog.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }));
    expect(lightbox.value).toBe(0);
    expect(changed).toHaveBeenCalledOnce();
    lightbox.element.addEventListener("nyx:image-lightbox:before-change", (event) => event.preventDefault(), { once: true });
    expect(lightbox.next()).toBe(false);
    expect(lightbox.value).toBe(0);
  });

  it("mirrors image navigation arrows in RTL", () => {
    const root = renderLightbox(true);
    root.dir = "rtl";
    initialized = initImageLightboxes(root);
    const lightbox = initialized[0]!;
    lightbox.open(0);
    lightbox.dialog.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowLeft" }));
    expect(lightbox.value).toBe(1);
    lightbox.dialog.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }));
    expect(lightbox.value).toBe(0);
  });

  it("allows close vetoes and returns focus after accepted dismissal", () => {
    initialized = initImageLightboxes();
    const lightbox = initialized[0]!;
    const trigger = lightbox.triggers[0]!;
    trigger.focus();
    trigger.click();
    lightbox.element.addEventListener("nyx:image-lightbox:before-close", (event) => event.preventDefault(), { once: true });
    expect(lightbox.close()).toBe(false);
    expect(lightbox.openState).toBe(true);
    expect(lightbox.close()).toBe(true);
    expect(lightbox.element.dataset.state).toBe("closed");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });
});
