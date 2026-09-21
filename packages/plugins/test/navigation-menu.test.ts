import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initNavigationMenus, type NyxNavigationMenu } from "../src/navigation-menu.js";

const floating = vi.hoisted(() => ({ autoUpdate: vi.fn(), cleanup: vi.fn(), computePosition: vi.fn() }));
vi.mock("@floating-ui/dom", async () => ({
  ...(await vi.importActual<typeof import("@floating-ui/dom")>("@floating-ui/dom")),
  autoUpdate: floating.autoUpdate,
  computePosition: floating.computePosition,
}));

function render(): HTMLElement {
  document.body.innerHTML = `<nav data-nyx-navigation-menu aria-label="Product"><ul>
    <li><a id="direct" href="/direct">Direct</a></li>
    <li><button id="products" data-nyx-navigation-menu-trigger="product-panel">Products</button></li>
    <li><button id="learn" data-nyx-navigation-menu-trigger="learn-panel">Learn</button></li>
  </ul>
  <div data-nyx-navigation-menu-content id="product-panel"><a id="alpha" href="/alpha">Alpha</a></div>
  <div data-nyx-navigation-menu-content data-nyx-navigation-menu-inline id="learn-panel"><a href="/docs">Docs</a></div>
  </nav>`;
  const root = document.querySelector<HTMLElement>("[data-nyx-navigation-menu]");
  if (!root) throw new Error("Navigation menu fixture was not rendered.");
  return root;
}

describe("NyxNavigationMenu", () => {
  let initialized: NyxNavigationMenu[] = [];
  beforeEach(() => {
    floating.cleanup.mockReset();
    Object.defineProperties(HTMLElement.prototype, {
      hidePopover: { configurable: true, value(): void {}, writable: true },
      showPopover: { configurable: true, value(): void {}, writable: true },
    });
    floating.computePosition.mockResolvedValue({ middlewareData: {}, placement: "bottom-start", strategy: "fixed", x: 10, y: 20 });
    floating.autoUpdate.mockImplementation((_reference, _overlay, update) => { void update(); return floating.cleanup; });
  });
  afterEach(() => initialized.forEach((instance) => instance.destroy()));

  it("is root-inclusive, idempotent, and cache-safe after destroy", () => {
    const root = render();
    const first = initNavigationMenus(root)[0];
    expect(initNavigationMenus(root)[0]).toBe(first);
    first?.destroy();
    const next = initNavigationMenus(root)[0];
    initialized = next ? [next] : [];
    expect(next).not.toBe(first);
  });

  it("keeps navigation semantics while synchronizing disclosure state", () => {
    const root = render();
    initialized = initNavigationMenus();
    const navigation = initialized[0];
    const trigger = root.querySelector<HTMLButtonElement>("#products");
    const direct = root.querySelector<HTMLAnchorElement>("#direct");
    if (!navigation || !trigger || !direct) throw new Error("Navigation menu was not initialized.");
    trigger.click();
    expect(root.getAttribute("role")).toBeNull();
    expect(direct.getAttribute("role")).toBeNull();
    expect(trigger.getAttribute("role")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(root.dataset.state).toBe("open");
    expect(floating.autoUpdate).toHaveBeenCalledOnce();
  });

  it("supports cancelable lifecycle events, one open disclosure, and keyboard focus", () => {
    const root = render();
    initialized = initNavigationMenus();
    const navigation = initialized[0];
    const products = root.querySelector<HTMLButtonElement>("#products");
    const learn = root.querySelector<HTMLButtonElement>("#learn");
    if (!navigation || !products || !learn) throw new Error("Navigation menu was not initialized.");
    const prevent = (event: Event): void => event.preventDefault();
    root.addEventListener("nyx:navigation-menu:before-open", prevent);
    products.click();
    expect(navigation.value).toBe(-1);
    root.removeEventListener("nyx:navigation-menu:before-open", prevent);

    products.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement?.id).toBe("alpha");
    learn.click();
    expect(products.getAttribute("aria-expanded")).toBe("false");
    expect(learn.getAttribute("aria-expanded")).toBe("true");
  });

  it("keeps anchored coordinates after dismissal and clears them on destroy", async () => {
    const root = render();
    initialized = initNavigationMenus();
    const navigation = initialized[0];
    const products = root.querySelector<HTMLButtonElement>("#products");
    const panel = root.querySelector<HTMLElement>("#product-panel");
    if (!navigation || !products || !panel) throw new Error("Navigation menu was not initialized.");

    products.click();
    await vi.waitFor(() => expect(panel.hasAttribute("data-nyx-positioned")).toBe(true));
    navigation.close("outside");
    expect(floating.cleanup).toHaveBeenCalledOnce();
    expect(panel.hasAttribute("data-nyx-positioned")).toBe(true);
    expect(panel.style.getPropertyValue("--nyx-overlay-x")).toBe("10px");
    expect(panel.style.getPropertyValue("--nyx-overlay-y")).toBe("20px");

    navigation.destroy();
    expect(panel.hasAttribute("data-nyx-positioned")).toBe(false);
    initialized = [];
  });
});
