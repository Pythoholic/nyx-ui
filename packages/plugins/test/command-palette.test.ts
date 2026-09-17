import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initCommandPalettes, type NyxCommandPalette } from "../src/command-palette.js";

function installDialogMethods(): void {
  HTMLDialogElement.prototype.showModal = function showModal(): void { this.open = true; };
  HTMLDialogElement.prototype.close = function close(): void { this.open = false; this.dispatchEvent(new Event("close")); };
}

function renderPalette(): void {
  document.body.innerHTML = `<button id="trigger" data-nyx-dialog-trigger="palette">Search</button>
    <dialog aria-label="Commands" data-nyx-command-palette id="palette">
      <input id="command-query" role="combobox" />
      <div id="commands" role="listbox">
        <div aria-labelledby="navigation-label" id="navigation" role="group">
          <div id="navigation-label">Navigation</div>
          <div data-value="overview" id="overview" role="option">Open overview</div>
          <div aria-disabled="true" data-value="settings" id="settings" role="option">Open settings</div>
        </div>
        <div aria-labelledby="actions-label" id="actions" role="group">
          <div id="actions-label">Actions</div>
          <div data-value="theme" id="theme" role="option">Cycle theme</div>
        </div>
        <p data-nyx-command-palette-empty hidden>No commands</p>
      </div>
    </dialog>`;
}

describe("NyxCommandPalette", () => {
  let initialized: NyxCommandPalette[] = [];

  beforeEach(() => { installDialogMethods(); renderPalette(); });
  afterEach(() => { initialized.forEach((palette) => palette.destroy()); initialized = []; });

  it("initializes idempotently and reinitializes after destroy", () => {
    const element = document.querySelector<HTMLDialogElement>("#palette");
    if (!element) throw new Error("Palette fixture missing.");
    const first = initCommandPalettes(element)[0];
    expect(initCommandPalettes(element)[0]).toBe(first);
    first?.destroy();
    const next = initCommandPalettes(element)[0];
    initialized = next ? [next] : [];
    expect(next).not.toBe(first);
  });

  it("composes Dialog initial focus and filters grouped results", () => {
    initialized = initCommandPalettes();
    const [palette] = initialized;
    const trigger = document.querySelector<HTMLButtonElement>("#trigger");
    if (!palette || !trigger) throw new Error("Palette did not initialize.");
    trigger.click();
    expect(palette.value).toBe(true);
    expect(document.activeElement).toBe(palette.input);
    expect(palette.input.getAttribute("aria-expanded")).toBe("true");
    palette.query = "cycle";
    expect(document.querySelector<HTMLElement>("#navigation")?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>("#actions")?.hidden).toBe(false);
    expect(palette.input.getAttribute("aria-activedescendant")).toBe("theme");
  });

  it("skips disabled results and runs the active command with Enter", () => {
    initialized = initCommandPalettes();
    const [palette] = initialized;
    if (!palette) throw new Error("Palette did not initialize.");
    const run = vi.fn();
    palette.element.addEventListener("nyx:command-palette:run", run);
    palette.open();
    palette.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(palette.input.getAttribute("aria-activedescendant")).toBe("theme");
    palette.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(run).toHaveBeenCalledOnce();
    expect(run.mock.calls[0]?.[0].detail.value).toBe("theme");
    expect(palette.value).toBe(false);
  });

  it("supports cancelable command execution and Escape dismissal", () => {
    initialized = initCommandPalettes();
    const [palette] = initialized;
    const overview = document.querySelector<HTMLElement>("#overview");
    if (!palette || !overview) throw new Error("Palette fixture missing.");
    palette.element.addEventListener("nyx:command-palette:before-run", (event) => event.preventDefault());
    palette.open();
    palette.run(overview);
    expect(palette.value).toBe(true);
    palette.input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(palette.value).toBe(false);
  });
});
