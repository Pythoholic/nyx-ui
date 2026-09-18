import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initPromptComposers, type NyxPromptComposer } from "../src/prompt-composer.js";

function renderComposer(): HTMLFormElement {
  document.body.innerHTML = `<form data-nyx-prompt-composer>
    <textarea data-nyx-prompt-composer-input required maxlength="20"></textarea>
    <output data-nyx-prompt-composer-count></output>
    <button data-nyx-prompt-composer-submit type="submit">Send</button>
  </form>`;
  return document.querySelector<HTMLFormElement>("[data-nyx-prompt-composer]")!;
}

describe("NyxPromptComposer", () => {
  let initialized: NyxPromptComposer[] = [];

  beforeEach(renderComposer);
  afterEach(() => { initialized.forEach((composer) => composer.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLFormElement>("[data-nyx-prompt-composer]")!;
    const first = initPromptComposers(root)[0]!;
    expect(initPromptComposers(root)[0]).toBe(first);
    first.destroy();
    const next = initPromptComposers(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("synchronizes value, validity, count, controls, state, and ARIA", () => {
    initialized = initPromptComposers();
    const composer = initialized[0]!;
    expect(composer.element.dataset.state).toBe("empty");
    expect(composer.input.getAttribute("aria-invalid")).toBe("false");
    expect(composer.submitButton.disabled).toBe(true);
    expect(composer.count?.value).toBe("0 / 20");

    composer.value = "Ship the release";
    expect(composer.element.dataset.state).toBe("ready");
    expect(composer.submitButton.disabled).toBe(false);
    expect(composer.submitButton.getAttribute("aria-controls")).toBe(composer.input.id);
    expect(composer.count?.value).toBe("16 / 20");

    composer.clear();
    expect(composer.value).toBe("");
    expect(composer.submit()).toBe(false);
    expect(composer.element.dataset.state).toBe("invalid");
    expect(composer.input.getAttribute("aria-invalid")).toBe("true");
    expect(composer.input.hasAttribute("data-invalid")).toBe(true);
  });

  it("pairs cancelable change events and restores a vetoed direct edit", () => {
    initialized = initPromptComposers();
    const composer = initialized[0]!;
    composer.value = "Accepted";
    const changed = vi.fn();
    const prevent = (event: Event): void => event.preventDefault();
    composer.element.addEventListener("nyx:prompt-composer:change", changed);
    composer.element.addEventListener("nyx:prompt-composer:before-change", prevent);
    composer.input.value = "Rejected";
    composer.input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(composer.value).toBe("Accepted");
    expect(changed).not.toHaveBeenCalled();
    composer.element.removeEventListener("nyx:prompt-composer:before-change", prevent);
    expect(composer.clear()).toBe(true);
    expect(changed).toHaveBeenCalledOnce();
  });

  it("submits through the form and keyboard only after a cancelable boundary", () => {
    initialized = initPromptComposers();
    const composer = initialized[0]!;
    composer.value = "Review focus order";
    const submitted = vi.fn((event: CustomEvent) => {
      expect(event.detail.value).toBe("Review focus order");
      expect(composer.element.dataset.state).toBe("ready");
    });
    composer.element.addEventListener("nyx:prompt-composer:submit", submitted);
    composer.element.addEventListener("nyx:prompt-composer:before-submit", (event) => event.preventDefault(), { once: true });
    expect(composer.submitButton.click()).toBeUndefined();
    expect(submitted).not.toHaveBeenCalled();

    composer.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ctrlKey: true, key: "Enter" }));
    expect(submitted).toHaveBeenCalledOnce();
    expect(submitted.mock.calls[0]?.[0].detail.reason).toBe("keyboard");
  });
});
