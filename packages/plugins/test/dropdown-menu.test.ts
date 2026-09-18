import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  initDropdownMenus,
  type NyxDropdownMenu,
} from "../src/dropdown-menu.js";

const floating = vi.hoisted(() => ({
  autoUpdate: vi.fn(),
  cleanup: vi.fn(),
  computePosition: vi.fn(),
  size: vi.fn(),
}));

vi.mock("@floating-ui/dom", async () => {
  const actual = await vi.importActual<typeof import("@floating-ui/dom")>(
    "@floating-ui/dom",
  );
  return {
    ...actual,
    autoUpdate: floating.autoUpdate,
    computePosition: floating.computePosition,
    size: floating.size,
  };
});

function installPopoverMethods(): void {
  Object.defineProperties(HTMLElement.prototype, {
    hidePopover: {
      configurable: true,
      value(): void {},
      writable: true,
    },
    showPopover: {
      configurable: true,
      value(): void {},
      writable: true,
    },
  });
}

function renderDropdownMenu(): void {
  document.body.innerHTML = `
    <button id="trigger" data-nyx-dropdown-menu-trigger="actions">Actions</button>
    <div data-nyx-dropdown-menu id="actions" popover role="menu">
      <button id="alpha" role="menuitem">Alpha</button>
      <button id="bravo-disabled" aria-disabled="true" role="menuitem">Bravo disabled</button>
      <button id="beta" aria-checked="false" data-nyx-dropdown-menu-close-on-select="false" role="menuitemcheckbox">Beta option</button>
      <div aria-label="Mode" role="group">
        <button id="radio-one" aria-checked="true" data-nyx-dropdown-menu-close-on-select="false" role="menuitemradio">Mode one</button>
        <button id="radio-two" aria-checked="false" data-nyx-dropdown-menu-close-on-select="false" role="menuitemradio">Mode two</button>
      </div>
      <div role="separator"></div>
      <button id="more" data-nyx-dropdown-menu-trigger="more-menu" role="menuitem">More</button>
      <div data-nyx-dropdown-menu id="more-menu" popover role="menu">
        <button id="nested-alpha" role="menuitem">Nested alpha</button>
        <button id="nested-beta" role="menuitem">Nested beta</button>
      </div>
    </div>
  `;
}

describe("NyxDropdownMenu", () => {
  let initialized: NyxDropdownMenu[] = [];

  beforeEach(() => {
    floating.cleanup.mockReset();
    floating.computePosition.mockReset();
    floating.computePosition.mockResolvedValue({
      middlewareData: {},
      placement: "bottom-start",
      strategy: "fixed",
      x: 112,
      y: 248,
    });
    floating.autoUpdate.mockReset();
    floating.size.mockReset();
    floating.size.mockImplementation((options) => ({ name: "size", options }));
    floating.autoUpdate.mockImplementation((_reference, _overlay, update) => {
      void update();
      return floating.cleanup;
    });
    installPopoverMethods();
    renderDropdownMenu();
  });

  afterEach(() => {
    [...initialized].reverse().forEach((menu) => menu.destroy());
    initialized = [];
    vi.useRealTimers();
  });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const element = document.querySelector<HTMLElement>("#actions");
    if (!element) throw new Error("Dropdown menu fixture was not rendered.");

    const first = initDropdownMenus(element)[0];
    expect(first).toBeDefined();
    expect(initDropdownMenus(element)[0]).toBe(first);

    first?.destroy();
    const next = initDropdownMenus(element)[0];
    initialized = next ? [next] : [];
    expect(next).not.toBe(first);
  });

  it("fires cancelable lifecycle events and synchronizes state and ARIA", () => {
    initialized = initDropdownMenus();
    const [menu] = initialized;
    const element = document.querySelector<HTMLElement>("#actions");
    const trigger = document.querySelector<HTMLElement>("#trigger");
    if (!menu || !element || !trigger) throw new Error("Menu was not initialized.");
    const open = vi.fn();
    const close = vi.fn();
    const preventOpen = (event: Event): void => event.preventDefault();
    element.addEventListener("nyx:dropdown-menu:open", open);
    element.addEventListener("nyx:dropdown-menu:close", close);
    element.addEventListener("nyx:dropdown-menu:before-open", preventOpen);

    trigger.click();
    expect(menu.value).toBe(false);
    expect(open).not.toHaveBeenCalled();

    element.removeEventListener("nyx:dropdown-menu:before-open", preventOpen);
    trigger.click();
    expect(menu.value).toBe(true);
    expect(element.dataset.state).toBe("open");
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(open).toHaveBeenCalledOnce();

    const preventClose = (event: Event): void => event.preventDefault();
    element.addEventListener("nyx:dropdown-menu:before-close", preventClose);
    menu.close();
    expect(menu.value).toBe(true);
    element.removeEventListener("nyx:dropdown-menu:before-close", preventClose);
    menu.close();
    expect(element.dataset.state).toBe("closed");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(close).toHaveBeenCalledOnce();
  });

  it("commits computed coordinates before marking an open menu as positioned", async () => {
    initialized = initDropdownMenus();
    const [menu] = initialized;
    const element = document.querySelector<HTMLElement>("#actions");
    const trigger = document.querySelector<HTMLElement>("#trigger");
    if (!menu || !element || !trigger) throw new Error("Menu was not initialized.");

    trigger.click();

    await vi.waitFor(() => {
      expect(element.style.getPropertyValue("--nyx-overlay-x")).toBe("112px");
      expect(element.style.getPropertyValue("--nyx-overlay-y")).toBe("248px");
      expect(element.hasAttribute("data-nyx-positioned")).toBe(true);
    });
    expect(floating.autoUpdate).toHaveBeenCalled();

    menu.close();
    expect(floating.cleanup).toHaveBeenCalled();
    expect(element.hasAttribute("data-nyx-positioned")).toBe(false);
    expect(element.style.getPropertyValue("--nyx-overlay-x")).toBe("");
    expect(element.style.getPropertyValue("--nyx-overlay-y")).toBe("");
  });

  it("keeps viewport padding in the size middleware", () => {
    initialized = initDropdownMenus();
    const trigger = document.querySelector<HTMLElement>("#trigger");
    trigger?.click();
    expect(floating.size).toHaveBeenCalledWith(expect.objectContaining({ padding: 8 }));
  });

  it("wraps roving focus and skips disabled items", () => {
    initialized = initDropdownMenus();
    const [menu] = initialized;
    const alpha = document.querySelector<HTMLElement>("#alpha");
    const beta = document.querySelector<HTMLElement>("#beta");
    const more = document.querySelector<HTMLElement>("#more");
    if (!menu || !alpha || !beta || !more) throw new Error("Menu was not initialized.");

    menu.open();
    expect(document.activeElement).toBe(alpha);
    alpha.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(beta);
    beta.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }));
    expect(document.activeElement).toBe(alpha);
    alpha.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));
    expect(document.activeElement).toBe(more);
    more.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(alpha);
  });

  it("matches printable typeahead text and skips disabled matches", () => {
    vi.useFakeTimers();
    initialized = initDropdownMenus();
    const [menu] = initialized;
    const alpha = document.querySelector<HTMLElement>("#alpha");
    const beta = document.querySelector<HTMLElement>("#beta");
    if (!menu || !alpha || !beta) throw new Error("Menu was not initialized.");

    menu.open();
    alpha.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "b" }));
    expect(document.activeElement).toBe(beta);

    vi.advanceTimersByTime(500);
    beta.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a" }));
    expect(document.activeElement).toBe(alpha);
  });

  it("opens and closes submenus with the expected arrow keys", () => {
    initialized = initDropdownMenus();
    const [menu, submenu] = initialized;
    const more = document.querySelector<HTMLElement>("#more");
    const nestedAlpha = document.querySelector<HTMLElement>("#nested-alpha");
    if (!menu || !submenu || !more || !nestedAlpha) {
      throw new Error("Menus were not initialized.");
    }

    menu.open();
    more.focus();
    more.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(submenu.value).toBe(true);
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(nestedAlpha);

    nestedAlpha.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    expect(submenu.value).toBe(false);
    expect(document.activeElement).toBe(more);
  });

  it("mirrors submenu arrow keys and default placement in RTL", async () => {
    document.querySelector<HTMLElement>("#actions")?.setAttribute("dir", "rtl");
    initialized = initDropdownMenus();
    const [menu, submenu] = initialized;
    const more = document.querySelector<HTMLElement>("#more");
    const nestedAlpha = document.querySelector<HTMLElement>("#nested-alpha");
    if (!menu || !submenu || !more || !nestedAlpha) throw new Error("Menus were not initialized.");

    menu.open();
    more.focus();
    more.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    expect(submenu.value).toBe(true);
    await vi.waitFor(() => expect(floating.computePosition).toHaveBeenCalledWith(
      more,
      submenu.element,
      expect.objectContaining({ placement: "left-start" }),
    ));
    nestedAlpha.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(submenu.value).toBe(false);
    expect(document.activeElement).toBe(more);
  });

  it("updates checkbox and radio states with group exclusivity", () => {
    initialized = initDropdownMenus();
    const [menu] = initialized;
    const checkbox = document.querySelector<HTMLElement>("#beta");
    const radioOne = document.querySelector<HTMLElement>("#radio-one");
    const radioTwo = document.querySelector<HTMLElement>("#radio-two");
    if (!menu || !checkbox || !radioOne || !radioTwo) {
      throw new Error("Menu was not initialized.");
    }
    const select = vi.fn();
    menu.element.addEventListener("nyx:dropdown-menu:select", select);

    menu.open();
    checkbox.click();
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    expect(checkbox.dataset.state).toBe("checked");
    expect(menu.value).toBe(true);

    radioTwo.click();
    expect(radioOne.getAttribute("aria-checked")).toBe("false");
    expect(radioTwo.getAttribute("aria-checked")).toBe("true");
    expect(radioOne.dataset.state).toBe("unchecked");
    expect(radioTwo.dataset.state).toBe("checked");
    expect(select).toHaveBeenCalledTimes(2);
  });

  it("supports checkbox close-on-select overrides", () => {
    initialized = initDropdownMenus();
    const [menu] = initialized;
    const checkbox = document.querySelector<HTMLElement>("#beta");
    if (!menu || !checkbox) throw new Error("Menu was not initialized.");
    checkbox.dataset.nyxDropdownMenuCloseOnSelect = "true";

    menu.open();
    checkbox.click();
    expect(menu.value).toBe(false);
  });

  it("returns focus to the trigger after close", () => {
    initialized = initDropdownMenus();
    const [menu] = initialized;
    const trigger = document.querySelector<HTMLElement>("#trigger");
    const alpha = document.querySelector<HTMLElement>("#alpha");
    if (!menu || !trigger || !alpha) throw new Error("Menu was not initialized.");

    trigger.focus();
    trigger.click();
    expect(document.activeElement).toBe(alpha);
    alpha.click();
    expect(menu.value).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });
});
