import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initTreeViews, type NyxTreeView } from "../src/tree-view.js";

function renderTree(selection = "single"): void {
  document.body.innerHTML = `<ul data-nyx-tree data-nyx-tree-selection="${selection}" aria-label="Files">
    <li data-nyx-tree-item aria-expanded="false"><div><span data-nyx-tree-toggle>+</span><span data-nyx-tree-label>Alpha</span></div>
      <ul><li data-nyx-tree-item><div><span data-nyx-tree-label>Alpha child</span></div></li></ul>
    </li>
    <li data-nyx-tree-item><div><span data-nyx-tree-label>Bravo</span></div></li>
    <li data-nyx-tree-item><div><span data-nyx-tree-label>Charlie</span></div></li>
  </ul>`;
}

describe("NyxTreeView", () => {
  let initialized: NyxTreeView[] = [];
  beforeEach(() => renderTree());
  afterEach(() => { initialized.forEach((tree) => tree.destroy()); initialized = []; vi.useRealTimers(); });

  it("owns semantic positions and initializes idempotently", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-tree]")!;
    const first = initTreeViews(root)[0]!;
    initialized = [first];
    const items = root.querySelectorAll<HTMLElement>("[data-nyx-tree-item]");
    expect(initTreeViews(root)[0]).toBe(first);
    expect(root.getAttribute("role")).toBe("tree");
    expect(items[0]?.getAttribute("aria-level")).toBe("1");
    expect(items[0]?.getAttribute("aria-setsize")).toBe("3");
    expect(items[1]?.getAttribute("aria-level")).toBe("2");
    first.destroy();
    const next = initTreeViews(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("moves only through visible items and follows tree arrow behavior", () => {
    initialized = initTreeViews();
    const [alpha, child, bravo, charlie] = document.querySelectorAll<HTMLElement>("[data-nyx-tree-item]");
    alpha!.focus();
    alpha!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(bravo);
    bravo!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" }));
    alpha!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(alpha!.getAttribute("aria-expanded")).toBe("true");
    alpha!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(document.activeElement).toBe(child);
    child!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    expect(document.activeElement).toBe(alpha);
    alpha!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));
    expect(document.activeElement).toBe(charlie);
  });

  it("typeahead searches the current visible set", () => {
    vi.useFakeTimers();
    initialized = initTreeViews();
    const [alpha, child, bravo] = document.querySelectorAll<HTMLElement>("[data-nyx-tree-item]");
    alpha!.focus();
    alpha!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a" }));
    expect(document.activeElement).toBe(alpha);
    alpha!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "b" }));
    expect(document.activeElement).toBe(alpha);
    vi.advanceTimersByTime(500);
    alpha!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "b" }));
    expect(document.activeElement).toBe(bravo);
    expect(document.activeElement).not.toBe(child);
  });

  it("supports cancelable expansion and multiple selection", () => {
    renderTree("multiple");
    initialized = initTreeViews();
    const tree = initialized[0]!;
    const [alpha, , bravo] = document.querySelectorAll<HTMLElement>("[data-nyx-tree-item]");
    const prevent = (event: Event): void => event.preventDefault();
    tree.element.addEventListener("nyx:tree:before-expand", prevent);
    expect(tree.expand(alpha!)).toBe(false);
    tree.element.removeEventListener("nyx:tree:before-expand", prevent);
    tree.select(alpha!);
    tree.select(bravo!);
    expect(tree.selectedItems).toEqual([alpha, bravo]);
    expect(tree.element.getAttribute("aria-multiselectable")).toBe("true");
  });
});
