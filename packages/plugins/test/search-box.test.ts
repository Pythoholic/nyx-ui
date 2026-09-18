import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initSearchBoxes, type NyxSearchBox } from "../src/search-box.js";

const floating = vi.hoisted(() => ({ autoUpdate: vi.fn(), cleanup: vi.fn(), computePosition: vi.fn(), size: vi.fn() }));

vi.mock("@floating-ui/dom", async () => {
  const actual = await vi.importActual<typeof import("@floating-ui/dom")>("@floating-ui/dom");
  return { ...actual, autoUpdate: floating.autoUpdate, computePosition: floating.computePosition, size: floating.size };
});

function renderSearchBox(): void {
  document.body.innerHTML = `<form data-nyx-search-box id="search">
    <input role="combobox" type="search">
    <button data-nyx-search-box-clear type="button">Clear</button>
    <div id="results" role="listbox">
      <div id="recent-group" role="group">
        <div data-nyx-search-box-recent data-value="incident report" id="recent" role="option">Incident report</div>
      </div>
      <div id="suggestion-group" role="group">
        <div data-value="deploy status" id="deploy" role="option">Deploy status</div>
        <div aria-disabled="true" id="disabled" role="option">Disabled result</div>
      </div>
      <p data-nyx-search-box-empty hidden>No results</p>
    </div>
  </form>`;
}

describe("NyxSearchBox", () => {
  let initialized: NyxSearchBox[] = [];

  beforeEach(() => {
    floating.cleanup.mockReset();
    floating.computePosition.mockReset();
    floating.computePosition.mockResolvedValue({ middlewareData: {}, placement: "bottom-start", strategy: "fixed", x: 10, y: 20 });
    floating.size.mockReset();
    floating.size.mockImplementation((options) => ({ name: "size", options }));
    floating.autoUpdate.mockReset();
    floating.autoUpdate.mockImplementation((_reference, _overlay, update) => { void update(); return floating.cleanup; });
    renderSearchBox();
  });

  afterEach(() => { initialized.forEach((searchBox) => searchBox.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("#search")!;
    const first = initSearchBoxes(root)[0]!;
    expect(initSearchBoxes(root)[0]).toBe(first);
    first.destroy();
    const next = initSearchBoxes(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("shows only recent searches for a blank query and filters suggestions for text", () => {
    initialized = initSearchBoxes();
    const searchBox = initialized[0]!;
    searchBox.input.focus();
    expect(searchBox.expanded).toBe(true);
    expect(searchBox.element.dataset.state).toBe("open");
    expect(searchBox.input.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector<HTMLElement>("#recent")?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>("#deploy")?.hidden).toBe(true);

    searchBox.input.value = "deploy";
    searchBox.input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(document.querySelector<HTMLElement>("#recent")?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>("#deploy")?.hidden).toBe(false);
    expect(searchBox.input.getAttribute("aria-activedescendant")).toBe("deploy");
  });

  it("searches the active suggestion with Enter and synchronizes state first", () => {
    initialized = initSearchBoxes();
    const searchBox = initialized[0]!;
    const searched = vi.fn();
    searchBox.element.addEventListener("nyx:search-box:search", searched);
    searchBox.input.value = "deploy";
    searchBox.open();
    searchBox.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }));
    expect(searchBox.value).toBe("deploy status");
    expect(searchBox.expanded).toBe(false);
    expect(searchBox.input.getAttribute("aria-expanded")).toBe("false");
    expect(searched).toHaveBeenCalledOnce();
    expect(searched.mock.calls[0]?.[0].detail.reason).toBe("suggestion");
  });

  it("supports cancelable search and clear actions", () => {
    initialized = initSearchBoxes();
    const searchBox = initialized[0]!;
    searchBox.value = "incident";
    searchBox.element.addEventListener("nyx:search-box:before-search", (event) => event.preventDefault());
    expect(searchBox.search()).toBe(false);
    expect(searchBox.value).toBe("incident");
    searchBox.element.addEventListener("nyx:search-box:before-clear", (event) => event.preventDefault());
    expect(searchBox.clear()).toBe(false);
    expect(searchBox.value).toBe("incident");
  });
});
