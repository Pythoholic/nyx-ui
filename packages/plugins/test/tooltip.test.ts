import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initTooltips, type NyxTooltip } from "../src/tooltip.js";

const floating = vi.hoisted(() => ({ autoUpdate: vi.fn(), computePosition: vi.fn() }));
vi.mock("@floating-ui/dom", async () => {
  const actual = await vi.importActual<typeof import("@floating-ui/dom")>("@floating-ui/dom");
  return { ...actual, autoUpdate: floating.autoUpdate, computePosition: floating.computePosition };
});

function renderTooltips(): HTMLElement {
  document.body.innerHTML = `<div data-nyx-tooltip-provider data-nyx-tooltip-open-delay="500" data-nyx-tooltip-close-delay="100" data-nyx-tooltip-skip-delay="300">
    <button aria-describedby="existing-description" data-nyx-tooltip-trigger="first-tip">First</button>
    <span id="existing-description">Existing description</span>
    <span class="nyx-tooltip" data-nyx-tooltip id="first-tip">First tip</span>
    <button data-nyx-tooltip-trigger="second-tip">Second</button>
    <span class="nyx-tooltip" data-nyx-tooltip id="second-tip">Second tip</span>
  </div>`;
  return document.querySelector<HTMLElement>("[data-nyx-tooltip-provider]")!;
}

describe("NyxTooltip", () => {
  let initialized: NyxTooltip[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    floating.computePosition.mockResolvedValue({ middlewareData: {}, placement: "top", strategy: "fixed", x: 12, y: 4 });
    floating.autoUpdate.mockImplementation((_reference, _overlay, update) => { void update(); return vi.fn(); });
    Object.defineProperties(HTMLElement.prototype, {
      hidePopover: { configurable: true, value(): void {}, writable: true },
      showPopover: { configurable: true, value(): void {}, writable: true },
    });
    renderTooltips();
  });

  afterEach(() => {
    initialized.forEach((tooltip) => tooltip.destroy());
    initialized = [];
    vi.useRealTimers();
  });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const element = document.querySelector<HTMLElement>("[data-nyx-tooltip]")!;
    const first = initTooltips(element)[0]!;
    initialized = [first];
    expect(initTooltips(element)[0]).toBe(first);
    first.destroy();
    const next = initTooltips(element)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("applies the initial delay, close grace period, and provider skip window", () => {
    initialized = initTooltips();
    const [first, second] = initialized;
    const firstTrigger = first!.triggers[0]!;
    const secondTrigger = second!.triggers[0]!;

    firstTrigger.dispatchEvent(new Event("pointerenter"));
    vi.advanceTimersByTime(499);
    expect(first!.value).toBe(false);
    vi.advanceTimersByTime(1);
    expect(first!.value).toBe(true);
    expect(firstTrigger.getAttribute("aria-describedby")).toBe("existing-description first-tip");
    expect(firstTrigger.dataset.state).toBe("open");

    firstTrigger.dispatchEvent(new Event("pointerleave"));
    vi.advanceTimersByTime(99);
    expect(first!.value).toBe(true);
    vi.advanceTimersByTime(1);
    expect(first!.value).toBe(false);
    expect(firstTrigger.getAttribute("aria-describedby")).toBe("existing-description");

    secondTrigger.dispatchEvent(new Event("pointerenter"));
    vi.advanceTimersByTime(0);
    expect(second!.value).toBe(true);
    expect(second!.element.dataset.state).toBe("open");
  });

  it("keeps only one tooltip open in a provider and supports focus and Escape", () => {
    initialized = initTooltips();
    const [first, second] = initialized;
    first!.open();
    second!.triggers[0]!.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    vi.advanceTimersByTime(0);
    expect(first!.value).toBe(false);
    expect(second!.value).toBe(true);
    expect(second!.triggers[0]!.getAttribute("aria-describedby")).toBe("second-tip");

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }));
    expect(second!.value).toBe(false);
    expect(second!.triggers[0]!.hasAttribute("aria-describedby")).toBe(false);
  });

  it("pairs cancelable before-events with after-events and makes destroy closure final", () => {
    initialized = initTooltips();
    const tooltip = initialized[0]!;
    const opened = vi.fn();
    const closed = vi.fn();
    const preventOpen = (event: Event): void => event.preventDefault();
    tooltip.element.addEventListener("nyx:tooltip:open", opened);
    tooltip.element.addEventListener("nyx:tooltip:close", closed);
    tooltip.element.addEventListener("nyx:tooltip:before-open", preventOpen);
    expect(tooltip.open()).toBe(false);
    expect(opened).not.toHaveBeenCalled();

    tooltip.element.removeEventListener("nyx:tooltip:before-open", preventOpen);
    expect(tooltip.open()).toBe(true);
    const preventClose = (event: Event): void => event.preventDefault();
    tooltip.element.addEventListener("nyx:tooltip:before-close", preventClose);
    expect(tooltip.close()).toBe(false);
    expect(tooltip.value).toBe(true);
    tooltip.destroy();
    initialized = [];
    expect(tooltip.value).toBe(false);
    expect(closed).toHaveBeenCalledOnce();
  });
});
