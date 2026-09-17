import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initSidebars, NyxSidebar } from "../src/sidebar.js";

interface MutableMedia extends MediaQueryList {
  setMatches(matches: boolean): void;
}

function installDialogMethods(): void {
  HTMLDialogElement.prototype.showModal = function showModal(): void { this.open = true; };
  HTMLDialogElement.prototype.close = function close(): void { this.open = false; this.dispatchEvent(new Event("close")); };
}

function mediaQuery(initial = false): MutableMedia {
  let matches = initial;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  return {
    get matches() { return matches; },
    media: "(max-width: 48rem)", onchange: null,
    addEventListener: (_type, listener) => listeners.add(listener as (event: MediaQueryListEvent) => void),
    removeEventListener: (_type, listener) => listeners.delete(listener as (event: MediaQueryListEvent) => void),
    addListener: () => undefined, removeListener: () => undefined, dispatchEvent: () => true,
    setMatches(value) {
      matches = value;
      listeners.forEach((listener) => listener({ matches: value } as MediaQueryListEvent));
    },
  };
}

function renderSidebar(persist = false): void {
  document.body.innerHTML = `<div data-nyx-sidebar ${persist ? 'data-nyx-sidebar-persist="test-sidebar"' : ""}>
    <dialog data-nyx-sidebar-panel id="sidebar"><aside><nav aria-label="Workspace"><a aria-label="Overview"><span data-nyx-sidebar-label>Overview</span></a></nav><button data-nyx-dialog-close data-nyx-sidebar-close>Close</button></aside></dialog>
    <main><button data-nyx-sidebar-toggle>Toggle</button></main>
  </div>`;
}

describe("NyxSidebar", () => {
  let initialized: NyxSidebar[] = [];
  let media: MutableMedia;

  beforeEach(() => {
    installDialogMethods();
    media = mediaQuery();
    vi.stubGlobal("matchMedia", () => media);
    renderSidebar();
  });
  afterEach(() => { initialized.forEach((sidebar) => sidebar.destroy()); initialized = []; vi.unstubAllGlobals(); });

  it("initializes idempotently, includes its root, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-sidebar]");
    if (!root) throw new Error("Sidebar fixture missing.");
    const first = initSidebars(root)[0];
    expect(initSidebars(root)[0]).toBe(first);
    first?.destroy();
    const next = initSidebars(root)[0];
    initialized = next ? [next] : [];
    expect(next).not.toBe(first);
  });

  it("collapses to a desktop rail while keeping the panel and landmarks present", () => {
    initialized = initSidebars();
    const [sidebar] = initialized;
    if (!sidebar) throw new Error("Sidebar did not initialize.");
    const toggle = sidebar.element.querySelector<HTMLElement>("[data-nyx-sidebar-toggle]");
    expect(sidebar.panel.open).toBe(true);
    expect(sidebar.element.querySelector("aside nav")).toBeTruthy();
    toggle?.click();
    expect(sidebar.collapsed).toBe(true);
    expect(sidebar.element.dataset.state).toBe("collapsed");
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(sidebar.panel.open).toBe(true);
  });

  it("switches to the composed modal Dialog on mobile and returns focus", () => {
    initialized = initSidebars();
    const [sidebar] = initialized;
    const toggle = sidebar?.element.querySelector<HTMLButtonElement>("[data-nyx-sidebar-toggle]");
    if (!sidebar || !toggle) throw new Error("Sidebar did not initialize.");
    media.setMatches(true);
    expect(sidebar.mode).toBe("mobile");
    expect(sidebar.panel.open).toBe(false);
    toggle.focus();
    toggle.click();
    expect(sidebar.panel.open).toBe(true);
    expect(sidebar.panel.getAttribute("aria-modal")).toBe("true");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    sidebar.dialog.close();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });

  it("restores opt-in persistence before marking the component ready", () => {
    renderSidebar(true);
    const storage = { getItem: vi.fn(() => "true"), setItem: vi.fn() } as unknown as Storage;
    const root = document.querySelector<HTMLElement>("[data-nyx-sidebar]");
    if (!root) throw new Error("Sidebar fixture missing.");
    const sidebar = new NyxSidebar(root, { storage });
    initialized = [sidebar];
    expect(root.dataset.nyxSidebarCollapsed).toBe("true");
    expect(root.hasAttribute("data-nyx-sidebar-ready")).toBe(true);
    sidebar.expand();
    expect(storage.setItem).toHaveBeenCalledWith("test-sidebar", "false");
  });

  it("supports cancelable state changes", () => {
    initialized = initSidebars();
    const [sidebar] = initialized;
    if (!sidebar) throw new Error("Sidebar did not initialize.");
    sidebar.element.addEventListener("nyx:sidebar:before-change", (event) => event.preventDefault());
    sidebar.collapse();
    expect(sidebar.collapsed).toBe(false);
  });
});
