import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initFilterBars, type NyxFilterBar } from "../src/filter-bar.js";

function renderFilterBar(): HTMLElement {
  document.body.innerHTML = `<form data-nyx-filter-bar>
    <input data-nyx-filter-label="Search" name="query" type="search">
    <select data-nyx-filter-label="Status" name="status">
      <option value="">Any</option><option value="running" selected>Running</option><option value="failed">Failed</option>
    </select>
    <label><input data-nyx-filter-label="Owner" name="owner" type="checkbox" value="me" checked>Mine</label>
    <div data-nyx-filter-bar-active></div>
    <output data-nyx-filter-bar-count></output>
    <button data-nyx-filter-bar-clear type="button">Clear</button>
  </form>`;
  return document.querySelector<HTMLElement>("[data-nyx-filter-bar]")!;
}

describe("NyxFilterBar", () => {
  let initialized: NyxFilterBar[] = [];

  beforeEach(() => renderFilterBar());
  afterEach(() => { initialized.forEach((filterBar) => filterBar.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-filter-bar]")!;
    const first = initFilterBars(root)[0]!;
    expect(initFilterBars(root)[0]).toBe(first);
    expect(root.querySelectorAll(".nyx-filter-chip")).toHaveLength(2);
    first.destroy();
    expect(root.querySelectorAll(".nyx-filter-chip")).toHaveLength(0);
    const next = initFilterBars(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("normalizes native values and synchronizes summaries, state, and controls", () => {
    initialized = initFilterBars();
    const filterBar = initialized[0]!;
    expect(filterBar.value).toEqual({ owner: ["me"], status: ["running"] });
    expect(filterBar.element.dataset.state).toBe("active");
    expect(filterBar.element.querySelector("[data-nyx-filter-bar-count]")?.textContent).toBe("2 active filters");
    expect(Array.from(filterBar.element.querySelectorAll(".nyx-filter-chip")).map((chip) => chip.textContent)).toEqual([
      "Status: Running×",
      "Owner: me×",
    ]);
    expect(filterBar.element.querySelector<HTMLButtonElement>("[data-nyx-filter-bar-clear]")?.getAttribute("aria-disabled")).toBe("false");

    expect(filterBar.clear()).toBe(true);
    expect(filterBar.value).toEqual({});
    expect(filterBar.element.dataset.state).toBe("inactive");
    expect(filterBar.element.querySelector<HTMLButtonElement>("[data-nyx-filter-bar-clear]")?.disabled).toBe(true);
  });

  it("commits native changes through cancelable events and restores vetoed controls", () => {
    initialized = initFilterBars();
    const filterBar = initialized[0]!;
    const select = filterBar.element.querySelector<HTMLSelectElement>("select")!;
    const changed = vi.fn((event: CustomEvent) => {
      expect(event.detail.value.status).toEqual(["failed"]);
      expect(select.value).toBe("failed");
    });
    filterBar.element.addEventListener("nyx:filter-bar:change", changed);
    select.value = "failed";
    select.dispatchEvent(new Event("input", { bubbles: true }));
    expect(filterBar.value.status).toEqual(["failed"]);
    expect(changed).toHaveBeenCalledOnce();

    filterBar.element.addEventListener("nyx:filter-bar:before-change", (event) => event.preventDefault(), { once: true });
    select.value = "";
    select.dispatchEvent(new Event("input", { bubbles: true }));
    expect(select.value).toBe("failed");
    expect(filterBar.value.status).toEqual(["failed"]);
  });

  it("supports API assignment and generated remove buttons", () => {
    initialized = initFilterBars();
    const filterBar = initialized[0]!;
    expect(filterBar.setValue({ query: ["release 24"], status: ["failed"] })).toBe(true);
    expect(filterBar.value).toEqual({ query: ["release 24"], status: ["failed"] });
    const statusRemove = filterBar.element.querySelector<HTMLButtonElement>('[data-nyx-filter-remove="status"]')!;
    expect(statusRemove.getAttribute("aria-label")).toBe("Remove Status: Failed");
    statusRemove.click();
    expect(filterBar.value).toEqual({ query: ["release 24"] });
  });
});
