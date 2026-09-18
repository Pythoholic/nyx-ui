import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initModelSelectors, type NyxModelSelector } from "../src/model-selector.js";

function renderSelector(): HTMLElement {
  document.body.innerHTML = `<fieldset data-nyx-model-selector><label data-nyx-model-option><input data-nyx-model-value name="model" type="radio" value="swift"></label><label data-nyx-model-option><input data-nyx-model-value name="model" type="radio" value="balanced" checked></label><label data-nyx-model-option><input data-nyx-model-value name="model" type="radio" value="disabled" disabled></label></fieldset>`;
  return document.querySelector<HTMLElement>("[data-nyx-model-selector]")!;
}

describe("NyxModelSelector", () => {
  let initialized: NyxModelSelector[] = [];
  beforeEach(renderSelector);
  afterEach(() => { initialized.forEach((selector) => selector.destroy()); initialized = []; });

  it("is root-inclusive, idempotent, and cache-safe after destroy", () => {
    const root = renderSelector();
    const first = initModelSelectors(root)[0]!;
    expect(initModelSelectors(root)[0]).toBe(first);
    first.destroy();
    const next = initModelSelectors(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("synchronizes native checked state and option data state", () => {
    initialized = initModelSelectors();
    const selector = initialized[0]!;
    expect(selector.value).toBe("balanced");
    expect(selector.inputs[1]?.closest<HTMLElement>("label")?.dataset.state).toBe("selected");
    expect(selector.setValue("swift")).toBe(true);
    expect(selector.inputs[0]?.checked).toBe(true);
    expect(selector.inputs[1]?.closest<HTMLElement>("label")?.dataset.state).toBe("unselected");
    expect(selector.setValue("disabled")).toBe(false);
  });

  it("vetoes and reports direct native selection changes", () => {
    initialized = initModelSelectors();
    const selector = initialized[0]!;
    const swift = selector.inputs[0]!;
    selector.element.addEventListener("nyx:model-selector:before-change", (event) => event.preventDefault(), { once: true });
    swift.click();
    expect(selector.value).toBe("balanced");
    const changed = vi.fn();
    selector.element.addEventListener("nyx:model-selector:change", changed);
    swift.click();
    expect(selector.value).toBe("swift");
    expect(changed).toHaveBeenCalledOnce();
  });
});
