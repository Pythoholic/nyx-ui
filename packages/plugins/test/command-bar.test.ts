import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initCommandBars, type NyxCommandBar } from "../src/command-bar.js";

function renderCommandBar(): HTMLElement {
  document.body.innerHTML = `<div data-nyx-command-bar aria-label="Editor commands">
    <button data-nyx-command data-value="save" type="button">Save</button>
    <button data-nyx-command data-value="share" type="button" disabled>Share</button>
    <button data-nyx-command data-value="archive" type="button">Archive</button>
  </div>`;
  return document.querySelector<HTMLElement>("[data-nyx-command-bar]")!;
}

describe("NyxCommandBar", () => {
  let initialized: NyxCommandBar[] = [];

  beforeEach(() => renderCommandBar());
  afterEach(() => { initialized.forEach((commandBar) => commandBar.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-command-bar]")!;
    const first = initCommandBars(root)[0]!;
    expect(initCommandBars(root)[0]).toBe(first);
    first.destroy();
    const next = initCommandBars(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("synchronizes toolbar semantics, disabled state, and one roving tab stop", () => {
    initialized = initCommandBars();
    const commandBar = initialized[0]!;
    expect(commandBar.element.getAttribute("role")).toBe("toolbar");
    expect(commandBar.element.getAttribute("aria-orientation")).toBe("horizontal");
    expect(commandBar.element.dataset.state).toBe("active");
    expect(commandBar.commands.map((command) => command.tabIndex)).toEqual([0, -1, -1]);
    expect(commandBar.commands[1]?.dataset.state).toBe("disabled");
    expect(commandBar.commands[1]?.getAttribute("aria-disabled")).toBe("true");
    expect(commandBar.value).toBe("save");
  });

  it("moves focus with toolbar keys while skipping disabled commands", () => {
    initialized = initCommandBars();
    const commandBar = initialized[0]!;
    commandBar.focus("save");
    commandBar.commands[0]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(document.activeElement).toBe(commandBar.commands[2]);
    expect(commandBar.value).toBe("archive");
    expect(commandBar.commands[2]?.dataset.state).toBe("current");
  });

  it("pairs cancelable run events with an after-event from synchronized DOM", () => {
    initialized = initCommandBars();
    const commandBar = initialized[0]!;
    const archive = commandBar.commands[2]!;
    const ran = vi.fn((event: CustomEvent) => {
      expect(event.detail.value).toBe("archive");
      expect(commandBar.value).toBe("archive");
    });
    commandBar.element.addEventListener("nyx:command-bar:run", ran);
    commandBar.element.addEventListener("nyx:command-bar:before-run", (event) => event.preventDefault(), { once: true });
    archive.click();
    expect(commandBar.value).toBe("save");
    archive.click();
    expect(ran).toHaveBeenCalledOnce();
    expect(commandBar.run("share")).toBe(false);
  });
});
