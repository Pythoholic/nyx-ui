import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initNumberInputs, type NyxNumberInput } from "../src/number-input.js";

function renderNumberInput(): HTMLElement {
  document.body.innerHTML = `<div data-nyx-number-input data-nyx-number-input-unit=" replicas">
    <button data-nyx-number-input-decrement>Decrease</button>
    <input data-nyx-number-input-control type="number" min="0" max="10" step="0.5" value="2">
    <button data-nyx-number-input-increment>Increase</button>
    <output data-nyx-number-input-output></output>
  </div>`;
  return document.querySelector<HTMLElement>("[data-nyx-number-input]")!;
}

describe("NyxNumberInput", () => {
  let initialized: NyxNumberInput[] = [];

  beforeEach(renderNumberInput);
  afterEach(() => { initialized.forEach((input) => input.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-number-input]")!;
    const first = initNumberInputs(root)[0]!;
    initialized = [first];
    expect(initNumberInputs(root)[0]).toBe(first);
    first.destroy();
    const next = initNumberInputs(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("steps, clamps, and synchronizes buttons, output, state, and ARIA", () => {
    initialized = initNumberInputs();
    const input = initialized[0]!;
    input.incrementButton.click();
    expect(input.value).toBe(2.5);
    expect(input.output?.value).toBe("2.5 replicas");
    expect(input.element.dataset.state).toBe("valid");
    expect(input.input.getAttribute("aria-invalid")).toBe("false");

    input.value = 99;
    expect(input.value).toBe(10);
    expect(input.incrementButton.disabled).toBe(true);
    input.value = -4;
    expect(input.value).toBe(0);
    expect(input.decrementButton.disabled).toBe(true);
    input.value = null;
    expect(input.element.dataset.state).toBe("empty");
    expect(input.output?.value).toBe("Not set");
  });

  it("pairs cancelable before-change with change and restores vetoed direct input", () => {
    initialized = initNumberInputs();
    const input = initialized[0]!;
    const changed = vi.fn();
    const prevent = (event: Event): void => event.preventDefault();
    input.element.addEventListener("nyx:number-input:change", changed);
    input.element.addEventListener("nyx:number-input:before-change", prevent);
    input.input.value = "4";
    input.input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(input.value).toBe(2);
    expect(changed).not.toHaveBeenCalled();
    input.element.removeEventListener("nyx:number-input:before-change", prevent);
    input.increment();
    expect(input.value).toBe(2.5);
    expect(changed).toHaveBeenCalledOnce();
  });

  it("supports coarse Page keys and finite Home/End boundaries", () => {
    initialized = initNumberInputs();
    const input = initialized[0]!;
    input.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "PageUp" }));
    expect(input.value).toBe(7);
    input.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "End" }));
    expect(input.value).toBe(10);
    input.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Home" }));
    expect(input.value).toBe(0);
  });
});
