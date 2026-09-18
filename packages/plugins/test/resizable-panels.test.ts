import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initResizablePanels, NyxResizablePanels } from "../src/resizable-panels.js";

function renderPanels(persist = false): void {
  document.body.innerHTML = `<div id="workspace" data-nyx-resizable data-nyx-resizable-orientation="horizontal" data-nyx-resizable-step="5" ${persist ? 'data-nyx-resizable-persist="workspace-size"' : ""}>
    <section data-nyx-resizable-panel data-nyx-size="40" data-nyx-min-size="20" data-nyx-max-size="80" data-nyx-collapsible>Editor</section>
    <div data-nyx-resizable-handle aria-label="Resize editor"></div>
    <section data-nyx-resizable-panel data-nyx-min-size="25" data-nyx-max-size="90">Preview</section>
  </div>`;
}

describe("NyxResizablePanels", () => {
  let initialized: NyxResizablePanels[] = [];
  beforeEach(() => renderPanels());
  afterEach(() => { initialized.forEach((group) => group.destroy()); initialized = []; vi.restoreAllMocks(); });

  it("initializes root-inclusively and maintains separator ARIA", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-resizable]")!;
    const first = initResizablePanels(root)[0]!;
    initialized = [first];
    expect(initResizablePanels(root)[0]).toBe(first);
    expect(first.handle.getAttribute("role")).toBe("separator");
    expect(first.handle.getAttribute("aria-orientation")).toBe("vertical");
    expect(first.handle.getAttribute("aria-valuenow")).toBe("40");
    first.destroy();
    const next = initResizablePanels(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("resizes by keyboard, clamps to panel constraints, and toggles collapse", () => {
    initialized = initResizablePanels();
    const group = initialized[0]!;
    group.handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(group.size).toBe(45);
    group.handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));
    expect(group.size).toBe(75);
    group.handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(group.collapsed).toBe(true);
    expect(group.handle.getAttribute("aria-valuenow")).toBe("0");
    group.handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(group.size).toBe(75);
  });

  it("captures pointer drag, suppresses selection, and stops on pointer cancel", () => {
    initialized = initResizablePanels();
    const group = initialized[0]!;
    vi.spyOn(group.element, "getBoundingClientRect").mockReturnValue({ left: 0, right: 400, top: 0, bottom: 200, width: 400, height: 200, x: 0, y: 0, toJSON: () => ({}) });
    const capture = vi.fn();
    Object.defineProperty(group.handle, "setPointerCapture", { configurable: true, value: capture });
    group.handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 160, pointerId: 7 }));
    expect(capture).toHaveBeenCalledWith(7);
    expect(document.documentElement.classList.contains("nyx-resizing")).toBe(true);
    group.handle.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 200, pointerId: 7 }));
    expect(group.size).toBe(50);
    group.handle.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 7 }));
    expect(document.documentElement.classList.contains("nyx-resizing")).toBe(false);
  });

  it("makes persistence opt-in and respects cancelable resize", () => {
    renderPanels(true);
    const storage = { getItem: vi.fn(() => "60"), setItem: vi.fn() } as unknown as Storage;
    const root = document.querySelector<HTMLElement>("[data-nyx-resizable]")!;
    const group = new NyxResizablePanels(root, { storage });
    initialized = [group];
    expect(group.size).toBe(60);
    root.addEventListener("nyx:resizable:before-resize", (event) => event.preventDefault());
    group.resize(70);
    expect(group.size).toBe(60);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("uses vertical arrow keys and keeps nested groups independently owned", () => {
    document.body.innerHTML = `<div data-nyx-resizable data-nyx-resizable-orientation="horizontal">
      <section data-nyx-resizable-panel data-nyx-size="50">
        <div data-nyx-resizable data-nyx-resizable-orientation="vertical">
          <section data-nyx-resizable-panel data-nyx-size="30">Top</section>
          <div data-nyx-resizable-handle aria-label="Resize rows"></div>
          <section data-nyx-resizable-panel>Bottom</section>
        </div>
      </section>
      <div data-nyx-resizable-handle aria-label="Resize columns"></div>
      <section data-nyx-resizable-panel>Right</section>
    </div>`;
    initialized = initResizablePanels();
    expect(initialized).toHaveLength(2);
    const outer = initialized[0]!;
    const inner = initialized[1]!;
    expect(outer.orientation).toBe("horizontal");
    expect(inner.orientation).toBe("vertical");
    inner.handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(inner.size).toBe(35);
    expect(outer.size).toBe(50);
    expect(inner.handle.getAttribute("aria-orientation")).toBe("horizontal");
  });
});
