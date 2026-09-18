import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initPasswordInputs, scorePassword, type NyxPasswordInput } from "../src/password-input.js";

function renderPasswordInput(): HTMLElement {
  document.body.innerHTML = `<div data-nyx-password data-nyx-password-min-length="8">
    <input data-nyx-password-control id="password" minlength="8" required type="password">
    <button data-nyx-password-toggle><span data-nyx-password-toggle-label>Show</span></button>
    <meter data-nyx-password-meter></meter>
    <span data-nyx-password-status></span>
  </div>`;
  return document.querySelector<HTMLElement>("[data-nyx-password]")!;
}

describe("NyxPasswordInput", () => {
  let initialized: NyxPasswordInput[] = [];

  beforeEach(renderPasswordInput);
  afterEach(() => { initialized.forEach((input) => input.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-password]")!;
    const first = initPasswordInputs(root)[0]!;
    initialized = [first];
    expect(initPasswordInputs(root)[0]).toBe(first);
    first.visible = true;
    first.destroy();
    expect(first.input.type).toBe("password");
    const next = initPasswordInputs(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("scores accepted values and synchronizes meter, status, state, and validity", () => {
    initialized = initPasswordInputs();
    const password = initialized[0]!;
    expect(password.element.dataset.state).toBe("empty");
    expect(password.input.getAttribute("aria-invalid")).toBe("true");
    password.value = "Longer-Passphrase-42";
    expect(password.score).toBe(4);
    expect(password.strength).toBe("strong");
    expect(password.meter.value).toBe(4);
    expect(password.status.textContent).toBe("Strength: strong");
    expect(password.element.dataset.strength).toBe("strong");
    expect(password.input.getAttribute("aria-describedby")).toContain(password.status.id);
    expect(password.input.getAttribute("aria-invalid")).toBe("false");
    expect(scorePassword("a")).toBe(1);
  });

  it("toggles visibility with paired events and synchronized pressed state", () => {
    initialized = initPasswordInputs();
    const password = initialized[0]!;
    const shown = vi.fn();
    password.element.addEventListener("nyx:password:show", shown);
    password.toggleButton.click();
    expect(password.visible).toBe(true);
    expect(password.input.type).toBe("text");
    expect(password.element.dataset.visibility).toBe("visible");
    expect(password.toggleButton.getAttribute("aria-pressed")).toBe("true");
    expect(password.toggleButton.getAttribute("aria-label")).toBe("Hide password");
    expect(shown).toHaveBeenCalledOnce();

    password.element.addEventListener("nyx:password:before-hide", (event) => event.preventDefault(), { once: true });
    expect(password.setVisible(false)).toBe(false);
    expect(password.visible).toBe(true);
  });

  it("pairs cancelable value events and restores a vetoed direct edit", () => {
    initialized = initPasswordInputs();
    const password = initialized[0]!;
    password.value = "accepted-value";
    const changed = vi.fn();
    password.element.addEventListener("nyx:password:change", changed);
    password.element.addEventListener("nyx:password:before-change", (event) => event.preventDefault(), { once: true });
    password.input.value = "blocked-value";
    password.input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(password.value).toBe("accepted-value");
    expect(changed).not.toHaveBeenCalled();
    password.value = "next-value";
    expect(password.value).toBe("next-value");
    expect(changed).toHaveBeenCalledOnce();
  });
});
