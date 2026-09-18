import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function loadComponent(name: string): DocumentFragment {
  const source = readFileSync(resolve(process.cwd(), `../../registry/components/${name}.html`), "utf8");
  const template = document.createElement("template");
  template.innerHTML = source;
  return template.content;
}

describe("small primitive registry markup", () => {
  it("keeps aspect-ratio geometry separate from media semantics", () => {
    const component = loadComponent("aspect-ratio");
    const wrapper = component.querySelector<HTMLElement>(".nyx-aspect-ratio")!;
    const graphic = wrapper.querySelector<SVGElement>("svg[role='img']")!;
    expect(wrapper.dataset.ratio).toBe("video");
    expect(graphic.getAttribute("aria-labelledby")).toBeTruthy();
    expect(component.querySelector("figcaption")?.textContent).toContain("16:9");
  });

  it("preserves source order and landmarks in responsive columns", () => {
    const component = loadComponent("container-columns");
    const container = component.querySelector<HTMLElement>(".nyx-container")!;
    const columns = component.querySelector<HTMLElement>(".nyx-columns")!;
    expect(container.getAttribute("aria-labelledby")).toBe("nyx-columns-title");
    expect(columns.dataset.columns).toBe("3");
    expect(Array.from(columns.querySelectorAll("article strong"), (item) => item.textContent)).toEqual(["Tokyo", "Frankfurt", "Virginia"]);
  });

  it("uses native anchors with destinations for every styled link", () => {
    const component = loadComponent("styled-links");
    const links = Array.from(component.querySelectorAll<HTMLAnchorElement>("a.nyx-link"));
    expect(links).toHaveLength(3);
    expect(links.every((link) => link.hasAttribute("href"))).toBe(true);
    expect(links.map((link) => link.dataset.variant ?? "default")).toEqual(["default", "muted", "standalone"]);
  });

  it("uses native quotation and citation elements", () => {
    const component = loadComponent("blockquote");
    const quote = component.querySelector<HTMLQuoteElement>("blockquote.nyx-blockquote")!;
    expect(quote.getAttribute("cite")).toBeTruthy();
    expect(quote.querySelector(":scope > p")).not.toBeNull();
    expect(quote.querySelector("footer cite")?.textContent).toBe("Incident review 184");
  });

  it("publishes decorative inline SVG icons under the shared icon contract", () => {
    const component = loadComponent("icon-catalog");
    const catalog = component.querySelector<HTMLElement>(".nyx-icon-catalog")!;
    const samples = Array.from(catalog.querySelectorAll<HTMLElement>(".nyx-icon-sample"));
    expect(catalog.getAttribute("aria-label")).toBeTruthy();
    expect(samples).toHaveLength(8);
    expect(samples.every((sample) => sample.querySelector("svg.nyx-icon[aria-hidden='true'][viewBox='0 0 24 24']"))).toBe(true);
    expect(samples.map((sample) => sample.querySelector("code")?.textContent)).toContain("search");
  });

  it("keeps visually hidden text semantic and provides a focus-revealed skip target", () => {
    const component = loadComponent("visually-hidden");
    const hidden = Array.from(component.querySelectorAll<HTMLElement>(".nyx-visually-hidden"));
    const focusable = component.querySelector<HTMLAnchorElement>("a.nyx-visually-hidden-focusable");
    expect(hidden.length).toBeGreaterThanOrEqual(3);
    expect(component.querySelector("button .nyx-visually-hidden")?.textContent).toContain("Cancel transfer");
    expect(component.querySelector("[role='status'][aria-live='polite']")).not.toBeNull();
    expect(focusable?.getAttribute("href")).toBe("#nyx-visually-hidden-example-end");
  });

  it("declares localized RTL content and isolates bidirectional identifiers", () => {
    const component = loadComponent("direction");
    const surface = component.querySelector<HTMLElement>("[dir='rtl'][lang='ar']");
    expect(surface).not.toBeNull();
    expect(surface?.querySelector(".nyx-blockquote")).not.toBeNull();
    expect(surface?.querySelector(".nyx-select")).not.toBeNull();
    expect(surface?.querySelector("bdi")?.textContent).toBe("edge-api-204");
  });

  it("exposes a bounded loading status while making covered content inert", () => {
    const component = loadComponent("loading-overlay");
    const surface = component.querySelector<HTMLElement>(".nyx-loading-surface")!;
    const content = surface.querySelector<HTMLElement>("[data-nyx-loading-content]")!;
    const overlay = surface.querySelector<HTMLElement>("[data-nyx-loading-overlay]")!;
    expect(surface.dataset.state).toBe("loading");
    expect(content.getAttribute("aria-busy")).toBe("true");
    expect(content.hasAttribute("inert")).toBe(true);
    expect(overlay.getAttribute("role")).toBe("status");
    expect(overlay.getAttribute("aria-live")).toBe("polite");
    expect(overlay.getAttribute("aria-atomic")).toBe("true");
    expect(overlay.querySelector(".nyx-spinner")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("pairs every decorative status dot with a visible state label", () => {
    const component = loadComponent("status-indicator");
    const indicators = Array.from(component.querySelectorAll<HTMLElement>(".nyx-status-indicator"));
    expect(indicators).toHaveLength(4);
    expect(indicators.every((indicator) => indicator.textContent?.trim())).toBe(true);
    expect(indicators.every((indicator) => indicator.querySelector(".nyx-status-dot")?.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(indicators.map((indicator) => indicator.dataset.tone)).toEqual(["success", "neutral", "warning", "danger"]);
  });

  it("uses list semantics for static tags and exposes tone and size variants", () => {
    const component = loadComponent("tags");
    const list = component.querySelector<HTMLUListElement>("ul.nyx-tag-list")!;
    const tags = Array.from(list.querySelectorAll<HTMLLIElement>(":scope > li.nyx-tag"));
    expect(list.getAttribute("aria-label")).toBe("Applied filters");
    expect(tags).toHaveLength(5);
    expect(tags.map((tag) => tag.dataset.tone ?? "neutral")).toEqual(["neutral", "success", "warning", "danger", "neutral"]);
    expect(tags.at(-1)?.dataset.size).toBe("small");
  });

  it("publishes one registry record for each canonical source", () => {
    const registry = JSON.parse(readFileSync(resolve(process.cwd(), "../../registry/registry.json"), "utf8")) as {
      items: Array<{ name: string; files: string[]; requires: string[] }>;
    };
    const expected = new Map([
      ["aspect-ratio", "components/aspect-ratio.html"],
      ["container-responsive-columns", "components/container-columns.html"],
      ["styled-links", "components/styled-links.html"],
      ["blockquote", "components/blockquote.html"],
      ["icon-catalog", "components/icon-catalog.html"],
      ["visually-hidden", "components/visually-hidden.html"],
      ["direction", "components/direction.html"],
      ["loading-overlay", "components/loading-overlay.html"],
      ["status-indicator", "components/status-indicator.html"],
      ["tags", "components/tags.html"],
    ]);
    expected.forEach((file, name) => {
      const item = registry.items.find((candidate) => candidate.name === name);
      expect(item?.files).toEqual([file]);
      expect(item?.requires).toContain("@nyx-ui/core");
    });
  });
});
