import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initSteppers, type NyxStepper } from "../src/stepper.js";

function renderStepper(linear = true): HTMLElement {
  document.body.innerHTML = `<section data-nyx-stepper ${linear ? "data-nyx-stepper-linear" : ""}>
    <ol>
      <li data-nyx-stepper-step data-state="current"><button data-nyx-stepper-trigger>Configure</button></li>
      <li data-nyx-stepper-step><button data-nyx-stepper-trigger>Validate</button></li>
      <li data-nyx-stepper-step><button data-nyx-stepper-trigger>Deploy</button></li>
    </ol>
    <section data-nyx-stepper-panel>Configuration</section>
    <section data-nyx-stepper-panel>Validation</section>
    <section data-nyx-stepper-panel>Deployment</section>
    <button data-nyx-stepper-previous>Previous</button>
    <button data-nyx-stepper-next>Next</button>
  </section>`;
  return document.querySelector<HTMLElement>("[data-nyx-stepper]")!;
}

describe("NyxStepper", () => {
  let initialized: NyxStepper[] = [];
  beforeEach(() => renderStepper());
  afterEach(() => { initialized.forEach((stepper) => stepper.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const element = document.querySelector<HTMLElement>("[data-nyx-stepper]")!;
    const first = initSteppers(element)[0]!;
    initialized = [first];
    expect(initSteppers(element)[0]).toBe(first);
    first.destroy();
    const next = initSteppers(element)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("manages a linear sequence and synchronizes controls, panels, state, and ARIA", () => {
    initialized = initSteppers();
    const stepper = initialized[0]!;
    const triggers = stepper.element.querySelectorAll<HTMLButtonElement>("[data-nyx-stepper-trigger]");
    const previous = stepper.element.querySelector<HTMLButtonElement>("[data-nyx-stepper-previous]")!;
    const next = stepper.element.querySelector<HTMLButtonElement>("[data-nyx-stepper-next]")!;
    expect(previous.disabled).toBe(true);
    expect(triggers[2]?.disabled).toBe(true);
    expect(stepper.steps[0]?.getAttribute("aria-current")).toBe("step");
    expect(stepper.panels[1]?.hidden).toBe(true);

    next.click();
    expect(stepper.value).toBe(1);
    expect(stepper.steps[0]?.dataset.state).toBe("complete");
    expect(stepper.steps[1]?.dataset.state).toBe("current");
    expect(stepper.panels[1]?.dataset.state).toBe("active");
    expect(stepper.panels[1]?.getAttribute("aria-labelledby")).toBe(triggers[1]?.id);
    expect(triggers[2]?.disabled).toBe(false);

    next.click();
    expect(stepper.element.dataset.state).toBe("complete");
    expect(next.disabled).toBe(true);
    previous.click();
    expect(stepper.value).toBe(1);
    expect(stepper.goTo(2)).toBe(true);
  });

  it("pairs a cancelable before-event with an after-event", () => {
    initialized = initSteppers();
    const stepper = initialized[0]!;
    const changed = vi.fn();
    const prevent = (event: Event): void => event.preventDefault();
    stepper.element.addEventListener("nyx:stepper:change", changed);
    stepper.element.addEventListener("nyx:stepper:before-change", prevent);
    expect(stepper.next()).toBe(false);
    expect(stepper.value).toBe(0);
    stepper.element.removeEventListener("nyx:stepper:before-change", prevent);
    expect(stepper.next()).toBe(true);
    expect(changed).toHaveBeenCalledOnce();
  });

  it("uses roving focus without changing the step until activation", () => {
    initialized = initSteppers();
    const stepper = initialized[0]!;
    const triggers = stepper.element.querySelectorAll<HTMLButtonElement>("[data-nyx-stepper-trigger]");
    triggers[0]?.focus();
    triggers[0]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));
    expect(document.activeElement).toBe(triggers[1]);
    expect(stepper.value).toBe(0);
    triggers[1]?.click();
    expect(stepper.value).toBe(1);
    triggers[1]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    expect(document.activeElement).toBe(triggers[0]);
    expect(stepper.value).toBe(1);
  });

  it("mirrors horizontal step focus in RTL", () => {
    const root = renderStepper(false);
    root.dir = "rtl";
    initialized = initSteppers(root);
    const stepper = initialized[0]!;
    const triggers = stepper.element.querySelectorAll<HTMLButtonElement>("[data-nyx-stepper-trigger]");
    triggers[0]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(document.activeElement).toBe(triggers[2]);
    triggers[2]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    expect(document.activeElement).toBe(triggers[0]);
  });
});
