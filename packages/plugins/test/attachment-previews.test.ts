import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initAttachmentPreviews, type NyxAttachmentPreviews } from "../src/attachment-previews.js";

function renderPreviews(): HTMLElement {
  document.body.innerHTML = `<section data-nyx-attachment-previews>
    <output data-nyx-attachment-count></output>
    <ul>
      <li data-nyx-attachment-preview data-nyx-attachment-id="alpha"><strong>alpha.png</strong><button data-nyx-attachment-remove type="button">Remove</button></li>
      <li data-nyx-attachment-preview data-nyx-attachment-id="beta"><strong>beta.pdf</strong><button data-nyx-attachment-remove type="button">Remove</button></li>
    </ul>
    <p data-nyx-attachment-empty hidden>Empty</p>
  </section>`;
  return document.querySelector<HTMLElement>("[data-nyx-attachment-previews]")!;
}

describe("NyxAttachmentPreviews", () => {
  let initialized: NyxAttachmentPreviews[] = [];

  beforeEach(renderPreviews);
  afterEach(() => { initialized.forEach((previews) => previews.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-attachment-previews]")!;
    const first = initAttachmentPreviews(root)[0]!;
    expect(initAttachmentPreviews(root)[0]).toBe(first);
    first.destroy();
    const next = initAttachmentPreviews(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("synchronizes active value, count, state, control relationships, and empty state", () => {
    initialized = initAttachmentPreviews();
    const previews = initialized[0]!;
    expect(previews.value).toEqual(["alpha", "beta"]);
    expect(previews.element.dataset.state).toBe("ready");
    expect(previews.element.dataset.count).toBe("2");
    expect(previews.element.querySelector<HTMLOutputElement>("[data-nyx-attachment-count]")?.value).toBe("2 attachments");
    const first = previews.attachments[0]!;
    expect(first.dataset.state).toBe("active");
    expect(first.getAttribute("aria-hidden")).toBe("false");
    expect(first.querySelector("button")?.getAttribute("aria-controls")).toBe(first.id);

    expect(previews.clear()).toBe(true);
    expect(previews.value).toEqual([]);
    expect(previews.element.dataset.state).toBe("empty");
    expect(previews.attachments.every((attachment) => attachment.hidden)).toBe(true);
    expect(previews.element.querySelector<HTMLElement>("[data-nyx-attachment-empty]")?.hidden).toBe(false);
  });

  it("pairs cancelable removal with an after-event fired from synchronized DOM", () => {
    initialized = initAttachmentPreviews();
    const previews = initialized[0]!;
    const removed = vi.fn((event: CustomEvent) => {
      expect(event.detail.attachment.hidden).toBe(true);
      expect(event.detail.attachment.getAttribute("aria-hidden")).toBe("true");
      expect(event.detail.activeIds).toEqual(["beta"]);
    });
    const prevent = (event: Event): void => event.preventDefault();
    previews.element.addEventListener("nyx:attachment-previews:remove", removed);
    previews.element.addEventListener("nyx:attachment-previews:before-remove", prevent);
    expect(previews.remove("alpha")).toBe(false);
    expect(previews.value).toEqual(["alpha", "beta"]);
    previews.element.removeEventListener("nyx:attachment-previews:before-remove", prevent);
    previews.attachments[0]?.querySelector<HTMLButtonElement>("button")?.click();
    expect(removed).toHaveBeenCalledOnce();
    expect(removed.mock.calls[0]?.[0].detail.reason).toBe("control");
  });

  it("restores individual items and supports cancelable controlled values", () => {
    initialized = initAttachmentPreviews();
    const previews = initialized[0]!;
    previews.remove("alpha");
    const restored = vi.fn();
    previews.element.addEventListener("nyx:attachment-previews:restore", restored);
    expect(previews.restore("alpha")).toBe(true);
    expect(previews.value).toEqual(["alpha", "beta"]);
    expect(restored).toHaveBeenCalledOnce();

    previews.element.addEventListener("nyx:attachment-previews:before-change", (event) => event.preventDefault(), { once: true });
    expect(previews.setValue(["beta"])).toBe(false);
    expect(previews.value).toEqual(["alpha", "beta"]);
    expect(previews.setValue(["beta"])).toBe(true);
    expect(previews.value).toEqual(["beta"]);
  });
});
