import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initParameterInspectors, type NyxParameterInspector } from "../src/parameter-inspector.js";

function renderInspector(): HTMLFormElement {
  document.body.innerHTML = `<form data-nyx-parameter-inspector><select data-nyx-parameter name="aspect"><option value="1:1">Square</option><option value="16:9">Wide</option></select><input data-nyx-parameter name="guidance" type="range" min="1" max="20" value="7"><output data-nyx-parameter-output="guidance"></output><input data-nyx-parameter name="steps" type="number" min="1" max="100" value="32" required><input data-nyx-parameter name="enhance" type="checkbox" checked><button data-nyx-parameter-reset type="reset">Reset</button></form>`;
  return document.querySelector<HTMLFormElement>("form")!;
}

describe("NyxParameterInspector", () => {
  let initialized: NyxParameterInspector[] = [];
  beforeEach(renderInspector);
  afterEach(() => { initialized.forEach((inspector) => inspector.destroy()); initialized = []; });

  it("is root-inclusive, idempotent, and cache-safe after destroy", () => {
    const root = renderInspector();
    const first = initParameterInspectors(root)[0]!;
    expect(initParameterInspectors(root)[0]).toBe(first);
    first.destroy();
    const next = initParameterInspectors(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("exposes typed values and synchronizes outputs, modified state, validity, and reset", () => {
    initialized = initParameterInspectors();
    const inspector = initialized[0]!;
    expect(inspector.value).toEqual({ aspect: "1:1", enhance: true, guidance: 7, steps: 32 });
    expect(inspector.element.dataset.state).toBe("pristine");
    expect(inspector.element.querySelector<HTMLOutputElement>("output")?.value).toBe("7");
    expect(inspector.setValue({ aspect: "16:9", guidance: 12 })).toBe(true);
    expect(inspector.element.dataset.state).toBe("modified");
    expect(inspector.element.querySelector<HTMLButtonElement>("button")?.disabled).toBe(false);
    expect(inspector.reset()).toBe(true);
    expect(inspector.value.aspect).toBe("1:1");
    expect(inspector.element.dataset.state).toBe("pristine");
  });

  it("pairs cancelable direct changes and reset with synchronized after-events", () => {
    initialized = initParameterInspectors();
    const inspector = initialized[0]!;
    const guidance = inspector.element.querySelector<HTMLInputElement>("[name='guidance']")!;
    inspector.element.addEventListener("nyx:parameter-inspector:before-change", (event) => event.preventDefault(), { once: true });
    guidance.value = "15";
    guidance.dispatchEvent(new Event("input", { bubbles: true }));
    expect(guidance.value).toBe("7");
    const changed = vi.fn((event: CustomEvent) => expect(event.detail.value.guidance).toBe(15));
    inspector.element.addEventListener("nyx:parameter-inspector:change", changed);
    guidance.value = "15";
    guidance.dispatchEvent(new Event("input", { bubbles: true }));
    expect(changed).toHaveBeenCalledOnce();
    inspector.element.addEventListener("nyx:parameter-inspector:before-reset", (event) => event.preventDefault(), { once: true });
    expect(inspector.reset()).toBe(false);
    expect(guidance.value).toBe("15");
  });
});
