import { beforeEach, describe, expect, it, vi } from "vitest";
import { initTabs } from "../src/tabs.js";

function renderTabs(): HTMLElement {
  document.body.innerHTML = `
    <div data-nyx-tabs>
      <div role="tablist">
        <button aria-controls="panel-one" aria-selected="true" role="tab">One</button>
        <button aria-controls="panel-two" role="tab">Two</button>
        <button aria-controls="panel-three" role="tab">Three</button>
      </div>
      <section id="panel-one" role="tabpanel">One panel</section>
      <section id="panel-two" role="tabpanel">Two panel</section>
      <section id="panel-three" role="tabpanel">Three panel</section>
    </div>
  `;
  const element = document.querySelector<HTMLElement>("[data-nyx-tabs]");
  if (!element) throw new Error("Tabs fixture was not rendered.");
  return element;
}

describe("NyxTabs", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const element = renderTabs();
    const first = initTabs(element)[0];
    expect(initTabs(element)[0]).toBe(first);

    first?.destroy();
    expect(initTabs(element)[0]).not.toBe(first);
  });

  it("fires cancelable change events and synchronizes tab and panel state", () => {
    const element = renderTabs();
    const tabs = initTabs(element)[0];
    if (!tabs) throw new Error("Tabs were not initialized.");
    const change = vi.fn();
    const preventChange = (event: Event): void => event.preventDefault();
    element.addEventListener("nyx:tabs:change", change);
    element.addEventListener("nyx:tabs:before-change", preventChange);

    tabs.activate(1);
    expect(tabs.value).toBe(0);
    expect(change).not.toHaveBeenCalled();

    element.removeEventListener("nyx:tabs:before-change", preventChange);
    tabs.activate(1, false);
    const tabButtons = element.querySelectorAll<HTMLButtonElement>("[role='tab']");
    const panels = element.querySelectorAll<HTMLElement>("[role='tabpanel']");
    expect(tabButtons[1]?.getAttribute("aria-selected")).toBe("true");
    expect(tabButtons[1]?.dataset.state).toBe("active");
    expect(panels[0]?.hidden).toBe(true);
    expect(panels[1]?.hidden).toBe(false);
    expect(change).toHaveBeenCalledOnce();
  });

  it("supports wrapping arrow navigation plus Home and End", () => {
    const element = renderTabs();
    initTabs(element);
    const tabs = Array.from(
      element.querySelectorAll<HTMLButtonElement>("[role='tab']"),
    );

    tabs[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(document.activeElement).toBe(tabs[2]);
    expect(tabs[2]?.getAttribute("aria-selected")).toBe("true");

    tabs[2]?.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
    expect(document.activeElement).toBe(tabs[0]);

    tabs[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
    expect(document.activeElement).toBe(tabs[2]);
  });

  it("mirrors horizontal arrow navigation in an RTL subtree", () => {
    const element = renderTabs();
    element.dir = "rtl";
    initTabs(element);
    const tabs = Array.from(element.querySelectorAll<HTMLButtonElement>("[role='tab']"));
    tabs[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(document.activeElement).toBe(tabs[2]);
    tabs[2]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(document.activeElement).toBe(tabs[0]);
  });

  it("keeps nested tab sets isolated", () => {
    document.body.innerHTML = `<div data-nyx-tabs id="outer"><div role="tablist"><button aria-controls="outer-preview" aria-selected="true" role="tab">Preview</button><button aria-controls="outer-code" role="tab">HTML</button></div>
      <section id="outer-preview" role="tabpanel"><div data-nyx-tabs id="inner"><div role="tablist"><button aria-controls="inner-one" aria-selected="true" role="tab">One</button><button aria-controls="inner-two" role="tab">Two</button></div><section id="inner-one" role="tabpanel">One</section><section id="inner-two" role="tabpanel">Two</section></div></section>
      <section id="outer-code" role="tabpanel">Code</section></div>`;
    const [outer, inner] = initTabs();
    if (!outer || !inner) throw new Error("Nested tabs did not initialize.");
    inner.activate(1, false);
    expect(inner.value).toBe(1);
    expect(outer.value).toBe(0);
    expect(document.querySelector<HTMLElement>("#outer-preview")?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>("#inner-one")?.hidden).toBe(true);
    outer.destroy();
    inner.destroy();
  });
});
