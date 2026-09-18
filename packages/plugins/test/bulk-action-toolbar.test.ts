import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initBulkActionToolbars, type NyxBulkActionToolbar } from "../src/bulk-action-toolbar.js";

function renderBulkActionToolbar(): HTMLElement {
  document.body.innerHTML = `<section data-nyx-bulk-action-toolbar>
    <label><input data-nyx-bulk-select-all type="checkbox">Select all</label>
    <div data-nyx-bulk-toolbar aria-label="Selected item actions">
      <output data-nyx-bulk-count></output>
      <button data-nyx-bulk-action="archive" type="button">Archive</button>
      <button data-nyx-bulk-action="delete" type="button">Delete</button>
      <button data-nyx-bulk-clear type="button">Clear</button>
    </div>
    <label data-nyx-bulk-item><input data-nyx-bulk-select type="checkbox" value="alpha" checked>Alpha</label>
    <label data-nyx-bulk-item><input data-nyx-bulk-select type="checkbox" value="beta">Beta</label>
  </section>`;
  return document.querySelector<HTMLElement>("[data-nyx-bulk-action-toolbar]")!;
}

describe("NyxBulkActionToolbar", () => {
  let initialized: NyxBulkActionToolbar[] = [];

  beforeEach(() => renderBulkActionToolbar());
  afterEach(() => { initialized.forEach((toolbar) => toolbar.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-bulk-action-toolbar]")!;
    const first = initBulkActionToolbars(root)[0]!;
    expect(initBulkActionToolbars(root)[0]).toBe(first);
    first.destroy();
    const next = initBulkActionToolbars(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("synchronizes selection, mixed state, count, visibility, and selected rows", () => {
    initialized = initBulkActionToolbars();
    const bulk = initialized[0]!;
    const selectAll = bulk.element.querySelector<HTMLInputElement>("[data-nyx-bulk-select-all]")!;
    const toolbar = bulk.element.querySelector<HTMLElement>("[data-nyx-bulk-toolbar]")!;
    expect(bulk.value).toEqual(["alpha"]);
    expect(bulk.element.dataset.state).toBe("active");
    expect(toolbar.hidden).toBe(false);
    expect(toolbar.getAttribute("role")).toBe("toolbar");
    expect(bulk.element.querySelector("[data-nyx-bulk-count]")?.textContent).toBe("1 selected");
    expect(selectAll.indeterminate).toBe(true);
    expect(selectAll.getAttribute("aria-checked")).toBe("mixed");
    expect(bulk.selections[0]?.closest("[data-nyx-bulk-item]")?.hasAttribute("data-selected")).toBe(true);

    bulk.value = ["beta"];
    expect(bulk.value).toEqual(["beta"]);
    expect(bulk.selections.map((selection) => selection.checked)).toEqual([false, true]);
  });

  it("commits native and select-all changes through cancelable events", () => {
    initialized = initBulkActionToolbars();
    const bulk = initialized[0]!;
    const beta = bulk.selections[1]!;
    bulk.element.addEventListener("nyx:bulk-action-toolbar:before-change", (event) => event.preventDefault(), { once: true });
    beta.checked = true;
    beta.dispatchEvent(new Event("change", { bubbles: true }));
    expect(beta.checked).toBe(false);
    expect(bulk.value).toEqual(["alpha"]);

    const selectAll = bulk.element.querySelector<HTMLInputElement>("[data-nyx-bulk-select-all]")!;
    const changed = vi.fn((event: CustomEvent) => {
      expect(event.detail.value).toEqual(["alpha", "beta"]);
      expect(bulk.value).toEqual(["alpha", "beta"]);
      expect(bulk.element.querySelector("[data-nyx-bulk-count]")?.textContent).toBe("2 selected");
    });
    bulk.element.addEventListener("nyx:bulk-action-toolbar:change", changed);
    selectAll.checked = true;
    selectAll.dispatchEvent(new Event("change", { bubbles: true }));
    expect(bulk.value).toEqual(["alpha", "beta"]);
    expect(selectAll.indeterminate).toBe(false);
    expect(selectAll.getAttribute("aria-checked")).toBe("true");
    expect(changed).toHaveBeenCalledOnce();
  });

  it("pairs cancelable action events with synchronized selection details", () => {
    initialized = initBulkActionToolbars();
    const bulk = initialized[0]!;
    const archive = bulk.element.querySelector<HTMLButtonElement>('[data-nyx-bulk-action="archive"]')!;
    const ran = vi.fn((event: CustomEvent) => {
      expect(event.detail.value).toBe("archive");
      expect(event.detail.selection).toEqual(["alpha"]);
      expect(bulk.element.dataset.state).toBe("active");
    });
    bulk.element.addEventListener("nyx:bulk-action-toolbar:run", ran);
    bulk.element.addEventListener("nyx:bulk-action-toolbar:before-run", (event) => event.preventDefault(), { once: true });
    archive.click();
    archive.click();
    expect(ran).toHaveBeenCalledOnce();
  });

  it("clears through the native control, hides the toolbar, and returns focus", () => {
    initialized = initBulkActionToolbars();
    const bulk = initialized[0]!;
    const clear = bulk.element.querySelector<HTMLButtonElement>("[data-nyx-bulk-clear]")!;
    const selectAll = bulk.element.querySelector<HTMLInputElement>("[data-nyx-bulk-select-all]")!;
    clear.focus();
    clear.click();
    expect(bulk.value).toEqual([]);
    expect(bulk.element.dataset.state).toBe("inactive");
    expect(bulk.element.querySelector<HTMLElement>("[data-nyx-bulk-toolbar]")?.hidden).toBe(true);
    expect(document.activeElement).toBe(selectAll);
  });
});
