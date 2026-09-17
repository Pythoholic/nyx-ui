import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initComboboxes, type NyxCombobox } from "../src/combobox.js";

const floating = vi.hoisted(() => ({
  autoUpdate: vi.fn(),
  cleanup: vi.fn(),
  computePosition: vi.fn(),
  size: vi.fn(),
}));

vi.mock("@floating-ui/dom", async () => {
  const actual = await vi.importActual<typeof import("@floating-ui/dom")>("@floating-ui/dom");
  return { ...actual, autoUpdate: floating.autoUpdate, computePosition: floating.computePosition, size: floating.size };
});

function renderCombobox(): void {
  document.body.innerHTML = `<form id="form"><div data-nyx-combobox id="combo">
    <input id="query" role="combobox" />
    <input data-nyx-combobox-value name="region" type="hidden" />
    <div id="regions" role="listbox">
      <div data-value="alpha" id="alpha" role="option">Alpha</div>
      <div aria-disabled="true" data-value="bravo" id="bravo" role="option">Bravo</div>
      <div data-value="charlie" id="charlie" role="option">Charlie</div>
      <p data-nyx-combobox-empty hidden>No results</p>
    </div>
  </div></form>`;
}

describe("NyxCombobox", () => {
  let initialized: NyxCombobox[] = [];

  beforeEach(() => {
    floating.cleanup.mockReset();
    floating.computePosition.mockReset();
    floating.computePosition.mockResolvedValue({ middlewareData: {}, placement: "bottom-start", strategy: "fixed", x: 10, y: 20 });
    floating.size.mockReset();
    floating.size.mockImplementation((options) => ({ name: "size", options }));
    floating.autoUpdate.mockReset();
    floating.autoUpdate.mockImplementation((_reference, _overlay, update) => { void update(); return floating.cleanup; });
    renderCombobox();
  });

  afterEach(() => { initialized.forEach((combobox) => combobox.destroy()); initialized = []; });

  it("initializes idempotently, includes a matching root, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("#combo");
    if (!root) throw new Error("Combobox fixture missing.");
    const first = initComboboxes(root)[0];
    expect(first).toBeDefined();
    expect(initComboboxes(root)[0]).toBe(first);
    first?.destroy();
    const next = initComboboxes(root)[0];
    initialized = next ? [next] : [];
    expect(next).not.toBe(first);
  });

  it("filters options, exposes an empty state, and keeps combobox ARIA synchronized", () => {
    initialized = initComboboxes();
    const [combobox] = initialized;
    if (!combobox) throw new Error("Combobox did not initialize.");
    const input = combobox.input;
    input.click();
    expect(combobox.listbox.hidden).toBe(false);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(input.getAttribute("aria-controls")).toBe("regions");
    expect(input.getAttribute("aria-activedescendant")).toBe("alpha");

    input.value = "char";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(document.querySelector<HTMLElement>("#alpha")?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>("#charlie")?.hidden).toBe(false);
    expect(input.getAttribute("aria-activedescendant")).toBe("charlie");

    input.value = "missing";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(document.querySelector<HTMLElement>("[data-nyx-combobox-empty]")?.hidden).toBe(false);
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("skips disabled options, selects with Enter, and synchronizes form data", () => {
    initialized = initComboboxes();
    const [combobox] = initialized;
    if (!combobox) throw new Error("Combobox did not initialize.");
    const selected = vi.fn();
    combobox.element.addEventListener("nyx:combobox:select", selected);
    combobox.input.click();
    combobox.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(combobox.input.getAttribute("aria-activedescendant")).toBe("charlie");
    combobox.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(combobox.value).toBe("charlie");
    expect(combobox.input.value).toBe("Charlie");
    expect(combobox.input.getAttribute("aria-expanded")).toBe("false");
    expect(new FormData(document.querySelector<HTMLFormElement>("#form") ?? undefined).get("region")).toBe("charlie");
    expect(selected).toHaveBeenCalledOnce();
  });

  it("supports cancelable selection and Escape dismissal", () => {
    initialized = initComboboxes();
    const [combobox] = initialized;
    const alpha = document.querySelector<HTMLElement>("#alpha");
    if (!combobox || !alpha) throw new Error("Combobox fixture missing.");
    const prevent = (event: Event): void => event.preventDefault();
    combobox.element.addEventListener("nyx:combobox:before-select", prevent);
    combobox.open();
    combobox.select(alpha);
    expect(combobox.value).toBe("");
    expect(combobox.expanded).toBe(true);
    combobox.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(combobox.expanded).toBe(false);
  });
});
