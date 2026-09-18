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

  it("publishes one registry record for each canonical source", () => {
    const registry = JSON.parse(readFileSync(resolve(process.cwd(), "../../registry/registry.json"), "utf8")) as {
      items: Array<{ name: string; files: string[]; requires: string[] }>;
    };
    const expected = new Map([
      ["aspect-ratio", "components/aspect-ratio.html"],
      ["container-responsive-columns", "components/container-columns.html"],
      ["styled-links", "components/styled-links.html"],
      ["blockquote", "components/blockquote.html"],
    ]);
    expected.forEach((file, name) => {
      const item = registry.items.find((candidate) => candidate.name === name);
      expect(item?.files).toEqual([file]);
      expect(item?.requires).toContain("@nyx-ui/core");
    });
  });
});
