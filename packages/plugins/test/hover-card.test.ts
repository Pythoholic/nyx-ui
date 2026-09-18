import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initHoverCards, type NyxHoverCard } from "../src/hover-card.js";

const floating = vi.hoisted(() => ({ autoUpdate: vi.fn(), computePosition: vi.fn() }));
vi.mock("@floating-ui/dom", async () => {
  const actual = await vi.importActual<typeof import("@floating-ui/dom")>("@floating-ui/dom");
  return { ...actual, autoUpdate: floating.autoUpdate, computePosition: floating.computePosition };
});

describe("NyxHoverCard", () => {
  let initialized: NyxHoverCard[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    floating.computePosition.mockResolvedValue({ middlewareData: {}, placement: "bottom-start", strategy: "fixed", x: 0, y: 24 });
    floating.autoUpdate.mockImplementation((_reference, _overlay, update) => { void update(); return vi.fn(); });
    Object.defineProperties(HTMLElement.prototype, {
      hidePopover: { configurable: true, value(): void {}, writable: true },
      showPopover: { configurable: true, value(): void {}, writable: true },
    });
    document.body.innerHTML = `<a data-nyx-hover-card-trigger="profile" href="#profile">Ada</a><div data-nyx-hover-card data-nyx-hover-card-open-delay="100" data-nyx-hover-card-close-delay="50" id="profile"><a href="/ada">View profile</a></div>`;
  });
  afterEach(() => { initialized.forEach((card) => card.destroy()); initialized = []; vi.useRealTimers(); });

  it("opens for pointer and keyboard focus after a delay without tooltip semantics", () => {
    initialized = initHoverCards();
    const trigger = document.querySelector<HTMLElement>("[data-nyx-hover-card-trigger]")!;
    const card = initialized[0]!;
    trigger.dispatchEvent(new Event("pointerenter"));
    vi.advanceTimersByTime(99);
    expect(card.value).toBe(false);
    vi.advanceTimersByTime(1);
    expect(card.value).toBe(true);
    expect(card.element.getAttribute("role")).not.toBe("tooltip");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    card.close();
    trigger.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    vi.advanceTimersByTime(100);
    expect(card.value).toBe(true);
  });

  it("keeps the card open across the geometric trigger-to-card corridor", () => {
    initialized = initHoverCards();
    const trigger = document.querySelector<HTMLElement>("[data-nyx-hover-card-trigger]")!;
    const card = initialized[0]!;
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({ left: 0, right: 100, top: 0, bottom: 20, width: 100, height: 20, x: 0, y: 0, toJSON: () => ({}) });
    vi.spyOn(card.element, "getBoundingClientRect").mockReturnValue({ left: 0, right: 180, top: 30, bottom: 100, width: 180, height: 70, x: 0, y: 30, toJSON: () => ({}) });
    card.open(trigger);
    trigger.dispatchEvent(new Event("pointerleave"));
    document.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 50, clientY: 25 }));
    vi.advanceTimersByTime(40);
    document.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 60, clientY: 29 }));
    vi.advanceTimersByTime(40);
    card.element.dispatchEvent(new Event("pointerenter"));
    vi.advanceTimersByTime(100);
    expect(card.value).toBe(true);
  });

  it("supports cancelable lifecycle events, Escape, and cache-safe destroy", () => {
    const element = document.querySelector<HTMLElement>("[data-nyx-hover-card]")!;
    const first = initHoverCards(element)[0]!;
    const prevent = (event: Event): void => event.preventDefault();
    element.addEventListener("nyx:hover-card:before-open", prevent);
    first.open();
    expect(first.value).toBe(false);
    element.removeEventListener("nyx:hover-card:before-open", prevent);
    first.open();
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(first.value).toBe(false);
    first.destroy();
    const next = initHoverCards(element)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });
});
