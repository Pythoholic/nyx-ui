import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initMenubars, type NyxMenubar } from "../src/menubar.js";

const floating = vi.hoisted(() => ({ autoUpdate: vi.fn(), computePosition: vi.fn() }));
vi.mock("@floating-ui/dom", async () => ({
  ...(await vi.importActual<typeof import("@floating-ui/dom")>("@floating-ui/dom")),
  autoUpdate: floating.autoUpdate,
  computePosition: floating.computePosition,
}));

function render(): HTMLElement {
  document.body.innerHTML = `<div data-nyx-menubar>
    <button id="file-trigger" data-nyx-dropdown-menu-trigger="file">File</button>
    <button id="edit-trigger" data-nyx-dropdown-menu-trigger="edit">Edit</button>
    <div data-nyx-dropdown-menu id="file"><button id="new" role="menuitem">New</button></div>
    <div data-nyx-dropdown-menu id="edit"><button id="undo" role="menuitem">Undo</button></div>
  </div>`;
  const root = document.querySelector<HTMLElement>("[data-nyx-menubar]");
  if (!root) throw new Error("Menubar fixture was not rendered.");
  return root;
}

describe("NyxMenubar", () => {
  let initialized: NyxMenubar[] = [];
  beforeEach(() => {
    Object.defineProperties(HTMLElement.prototype, {
      hidePopover: { configurable: true, value(): void {}, writable: true },
      showPopover: { configurable: true, value(): void {}, writable: true },
    });
    floating.computePosition.mockResolvedValue({ middlewareData: {}, placement: "bottom-start", strategy: "fixed", x: 10, y: 20 });
    floating.autoUpdate.mockImplementation((_reference, _overlay, update) => { void update(); return vi.fn(); });
  });
  afterEach(() => initialized.forEach((instance) => instance.destroy()));

  it("is root-inclusive, idempotent, and cache-safe after destroy", () => {
    const root = render();
    const first = initMenubars(root)[0];
    expect(initMenubars(root)[0]).toBe(first);
    first?.destroy();
    const next = initMenubars(root)[0];
    initialized = next ? [next] : [];
    expect(next).not.toBe(first);
  });

  it("implements horizontal root navigation and switches open menus", () => {
    const root = render();
    initialized = initMenubars();
    const menubar = initialized[0];
    const file = root.querySelector<HTMLElement>("#file-trigger");
    const edit = root.querySelector<HTMLElement>("#edit-trigger");
    const firstItem = root.querySelector<HTMLElement>("#new");
    if (!menubar || !file || !edit || !firstItem) throw new Error("Menubar was not initialized.");

    file.focus();
    file.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(document.activeElement).toBe(edit);
    edit.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(menubar.value).toBe(1);
    expect(document.activeElement?.id).toBe("undo");
    document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    expect(menubar.value).toBe(0);
    expect(document.activeElement).toBe(firstItem);
  });

  it("emits cancelable lifecycle events and keeps only one root menu open", () => {
    const root = render();
    initialized = initMenubars();
    const menubar = initialized[0];
    if (!menubar) throw new Error("Menubar was not initialized.");
    const prevent = (event: Event): void => event.preventDefault();
    root.addEventListener("nyx:menubar:before-open", prevent);
    menubar.open(0);
    expect(menubar.value).toBe(-1);
    root.removeEventListener("nyx:menubar:before-open", prevent);
    menubar.open(0);
    menubar.open(1);
    expect(menubar.items[0]?.menu.value).toBe(false);
    expect(menubar.items[1]?.menu.value).toBe(true);
    expect(root.dataset.state).toBe("open");
  });
});
