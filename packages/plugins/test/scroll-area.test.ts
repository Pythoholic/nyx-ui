import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initScrollAreas, type NyxScrollArea } from "../src/scroll-area.js";

describe("NyxScrollArea", () => {
  let initialized: NyxScrollArea[] = [];

  beforeEach(() => {
    document.body.innerHTML = `<div data-nyx-scroll-area><div aria-label="Activity" data-nyx-scroll-area-viewport><p>Content</p></div></div>`;
  });
  afterEach(() => { initialized.forEach((area) => area.destroy()); initialized = []; vi.restoreAllMocks(); });

  it("initializes root-inclusively, idempotently, and cache-safely", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-scroll-area]")!;
    const first = initScrollAreas(root)[0]!;
    expect(initScrollAreas(root)[0]).toBe(first);
    first.destroy();
    const next = initScrollAreas(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("keeps a native focusable viewport and reflects scroll edges", () => {
    const viewport = document.querySelector<HTMLElement>("[data-nyx-scroll-area-viewport]")!;
    Object.defineProperties(viewport, {
      clientHeight: { configurable: true, value: 100 },
      clientWidth: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 300 },
      scrollWidth: { configurable: true, value: 200 },
    });
    const changed = vi.fn();
    document.body.addEventListener("nyx:scroll-area:change", changed);
    initialized = initScrollAreas();
    const [area] = initialized;
    expect(viewport.tabIndex).toBe(0);
    const keyboard = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "PageDown" });
    viewport.dispatchEvent(keyboard);
    expect(keyboard.defaultPrevented).toBe(false);
    expect(area?.element.dataset.overflowY).toBe("true");
    expect(area?.element.dataset.atBlockStart).toBe("true");
    viewport.scrollTop = 200;
    area?.refresh();
    expect(area?.element.dataset.atBlockEnd).toBe("true");
    expect(changed).toHaveBeenCalledTimes(2);
  });
});
