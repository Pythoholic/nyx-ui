import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initMultiSelects, type NyxMultiSelect } from "../src/multi-select.js";

const floating = vi.hoisted(() => ({ autoUpdate: vi.fn(), cleanup: vi.fn(), computePosition: vi.fn(), size: vi.fn() }));

vi.mock("@floating-ui/dom", async () => {
  const actual = await vi.importActual<typeof import("@floating-ui/dom")>("@floating-ui/dom");
  return { ...actual, autoUpdate: floating.autoUpdate, computePosition: floating.computePosition, size: floating.size };
});

function renderMultiSelect(): void {
  document.body.innerHTML = `<form id="form"><div data-nyx-multi-select data-nyx-multi-select-max="2" data-nyx-multi-select-name="teams" id="multi">
    <div data-nyx-multi-select-tags id="tags"></div>
    <input role="combobox">
    <div data-nyx-multi-select-values></div>
    <div id="options" role="listbox">
      <div aria-selected="true" data-value="atlas" id="atlas" role="option">Atlas</div>
      <div data-value="helix" id="helix" role="option">Helix</div>
      <div aria-disabled="true" data-value="vector" id="vector" role="option">Vector</div>
      <p data-nyx-multi-select-empty hidden>No results</p>
    </div>
  </div></form>`;
}

describe("NyxMultiSelect", () => {
  let initialized: NyxMultiSelect[] = [];

  beforeEach(() => {
    floating.cleanup.mockReset();
    floating.computePosition.mockReset();
    floating.computePosition.mockResolvedValue({ middlewareData: {}, placement: "bottom-start", strategy: "fixed", x: 10, y: 20 });
    floating.size.mockReset();
    floating.size.mockImplementation((options) => ({ name: "size", options }));
    floating.autoUpdate.mockReset();
    floating.autoUpdate.mockImplementation((_reference, _overlay, update) => { void update(); return floating.cleanup; });
    renderMultiSelect();
  });

  afterEach(() => { initialized.forEach((multiSelect) => multiSelect.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("#multi")!;
    const first = initMultiSelects(root)[0]!;
    expect(initMultiSelects(root)[0]).toBe(first);
    first.destroy();
    const next = initMultiSelects(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("hydrates selected options into removable tags and repeated form values", () => {
    initialized = initMultiSelects();
    const multiSelect = initialized[0]!;
    expect(multiSelect.value).toEqual(["atlas"]);
    expect(multiSelect.element.dataset.state).toBe("filled");
    expect(multiSelect.tags.textContent).toContain("Atlas");
    expect(new FormData(document.querySelector<HTMLFormElement>("#form")!).getAll("teams")).toEqual(["atlas"]);
    expect(multiSelect.listbox.getAttribute("aria-multiselectable")).toBe("true");
  });

  it("filters, adds the active option, enforces max, and removes with Backspace", () => {
    initialized = initMultiSelects();
    const multiSelect = initialized[0]!;
    multiSelect.input.value = "hel";
    multiSelect.input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(multiSelect.input.getAttribute("aria-activedescendant")).toBe("helix");
    multiSelect.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }));
    expect(multiSelect.value).toEqual(["atlas", "helix"]);
    expect(multiSelect.element.dataset.state).toBe("max");
    expect(multiSelect.add("vector")).toBe(false);
    expect(new FormData(document.querySelector<HTMLFormElement>("#form")!).getAll("teams")).toEqual(["atlas", "helix"]);
    multiSelect.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Backspace" }));
    expect(multiSelect.value).toEqual(["atlas"]);
  });

  it("pairs cancelable add and remove events with synchronized after-events", () => {
    initialized = initMultiSelects();
    const multiSelect = initialized[0]!;
    const added = vi.fn();
    const removed = vi.fn();
    const prevent = (event: Event): void => event.preventDefault();
    multiSelect.element.addEventListener("nyx:multi-select:add", added);
    multiSelect.element.addEventListener("nyx:multi-select:remove", removed);
    multiSelect.element.addEventListener("nyx:multi-select:before-add", prevent);
    expect(multiSelect.add("helix")).toBe(false);
    expect(added).not.toHaveBeenCalled();
    multiSelect.element.removeEventListener("nyx:multi-select:before-add", prevent);
    expect(multiSelect.add("helix")).toBe(true);
    expect(added).toHaveBeenCalledOnce();
    multiSelect.element.addEventListener("nyx:multi-select:before-remove", prevent);
    expect(multiSelect.remove("atlas")).toBe(false);
    expect(removed).not.toHaveBeenCalled();
  });

  it("supports value assignment, tag-button removal, and clear veto", () => {
    initialized = initMultiSelects();
    const multiSelect = initialized[0]!;
    multiSelect.value = ["helix"];
    expect(multiSelect.value).toEqual(["helix"]);
    multiSelect.tags.querySelector<HTMLButtonElement>("[data-nyx-multi-select-remove='helix']")?.click();
    expect(multiSelect.value).toEqual([]);
    multiSelect.value = ["atlas", "helix"];
    multiSelect.element.addEventListener("nyx:multi-select:before-clear", (event) => event.preventDefault());
    expect(multiSelect.clear()).toBe(false);
    expect(multiSelect.value).toEqual(["atlas", "helix"]);
  });
});
