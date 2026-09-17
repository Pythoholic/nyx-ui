import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initContextMenus, type NyxContextMenu } from "../src/context-menu.js";

const floating = vi.hoisted(() => ({ autoUpdate: vi.fn(), computePosition: vi.fn() }));

vi.mock("@floating-ui/dom", async () => ({
  ...(await vi.importActual<typeof import("@floating-ui/dom")>("@floating-ui/dom")),
  autoUpdate: floating.autoUpdate,
  computePosition: floating.computePosition,
}));

function render(): HTMLElement {
  document.body.innerHTML = `
    <button id="outside">Outside</button>
    <div data-nyx-context-menu="context-actions"><span id="target">Target</span></div>
    <div data-nyx-dropdown-menu id="context-actions"><button id="action" role="menuitem">Action</button></div>`;
  const root = document.querySelector<HTMLElement>("[data-nyx-context-menu]");
  if (!root) throw new Error("Context menu fixture was not rendered.");
  return root;
}

describe("NyxContextMenu", () => {
  let initialized: NyxContextMenu[] = [];

  beforeEach(() => {
    Object.defineProperties(HTMLElement.prototype, {
      hidePopover: { configurable: true, value(): void {}, writable: true },
      showPopover: { configurable: true, value(): void {}, writable: true },
    });
    floating.computePosition.mockResolvedValue({ middlewareData: {}, placement: "right-start", strategy: "fixed", x: 20, y: 30 });
    floating.autoUpdate.mockImplementation((_reference, _overlay, update) => {
      void update();
      return vi.fn();
    });
  });

  afterEach(() => initialized.forEach((instance) => instance.destroy()));

  it("initializes root-inclusively and reinitializes after destroy", () => {
    const root = render();
    const first = initContextMenus(root)[0];
    expect(initContextMenus(root)[0]).toBe(first);
    first?.destroy();
    const next = initContextMenus(root)[0];
    initialized = next ? [next] : [];
    expect(next).not.toBe(first);
  });

  it("opens at pointer coordinates and suppresses the native menu only in its region", () => {
    const root = render();
    initialized = initContextMenus();
    const contextMenu = initialized[0];
    if (!contextMenu) throw new Error("Context menu was not initialized.");

    const inside = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 44, clientY: 55 });
    expect(root.dispatchEvent(inside)).toBe(false);
    expect(contextMenu.value).toBe(true);
    expect(root.getAttribute("aria-expanded")).toBe("true");
    const reference = floating.autoUpdate.mock.calls[0]?.[0] as { getBoundingClientRect(): DOMRect };
    expect(reference.getBoundingClientRect().x).toBe(44);
    expect(reference.getBoundingClientRect().y).toBe(55);

    const outside = document.querySelector<HTMLElement>("#outside");
    expect(outside?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }))).toBe(true);
  });

  it("supports keyboard invocation, cancelable lifecycle events, and focus restoration", () => {
    const root = render();
    initialized = initContextMenus();
    const contextMenu = initialized[0];
    if (!contextMenu) throw new Error("Context menu was not initialized.");
    const prevent = (event: Event): void => event.preventDefault();
    root.addEventListener("nyx:context-menu:before-open", prevent);
    root.focus();
    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "F10", shiftKey: true }));
    expect(contextMenu.value).toBe(false);

    root.removeEventListener("nyx:context-menu:before-open", prevent);
    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ContextMenu" }));
    expect(contextMenu.value).toBe(true);
    expect(document.activeElement?.id).toBe("action");
    contextMenu.close("escape");
    expect(document.activeElement).toBe(root);
    expect(root.dataset.state).toBe("closed");
  });
});
