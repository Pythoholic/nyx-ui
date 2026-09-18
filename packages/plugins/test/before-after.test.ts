import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initBeforeAfters, type NyxBeforeAfter } from "../src/before-after.js";

function renderComparison(): HTMLElement {
  document.body.innerHTML = `<figure data-nyx-before-after><input data-nyx-before-after-control type="range" min="0" max="100" value="50"><output data-nyx-before-after-output></output></figure>`;
  return document.querySelector<HTMLElement>("figure")!;
}

describe("NyxBeforeAfter", () => {
  let initialized: NyxBeforeAfter[] = [];
  beforeEach(renderComparison);
  afterEach(() => { initialized.forEach((comparison) => comparison.destroy()); initialized = []; });

  it("is root-inclusive, idempotent, and cache-safe after destroy", () => {
    const root = renderComparison();
    const first = initBeforeAfters(root)[0]!;
    expect(initBeforeAfters(root)[0]).toBe(first);
    first.destroy();
    const next = initBeforeAfters(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("clamps values and synchronizes visual, text, data, and ARIA state", () => {
    initialized = initBeforeAfters();
    const comparison = initialized[0]!;
    expect(comparison.element.dataset.state).toBe("mixed");
    expect(comparison.input.getAttribute("aria-valuetext")).toBe("50% after");
    expect(comparison.setValue(120)).toBe(true);
    expect(comparison.value).toBe(100);
    expect(comparison.element.dataset.state).toBe("after");
    expect(comparison.element.style.getPropertyValue("--nyx-before-after-position")).toBe("100%");
    expect(comparison.element.querySelector<HTMLOutputElement>("output")?.value).toBe("100% after");
  });

  it("vetoes input changes and emits after synchronization", () => {
    initialized = initBeforeAfters();
    const comparison = initialized[0]!;
    comparison.element.addEventListener("nyx:before-after:before-change", (event) => event.preventDefault(), { once: true });
    comparison.input.value = "70";
    comparison.input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(comparison.value).toBe(50);
    const changed = vi.fn((event: CustomEvent) => expect(event.detail.beforeAfter.element.dataset.position).toBe("70"));
    comparison.element.addEventListener("nyx:before-after:change", changed);
    comparison.input.value = "70";
    comparison.input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(changed).toHaveBeenCalledOnce();
    expect(changed.mock.calls[0]?.[0].detail.reason).toBe("input");
  });
});
