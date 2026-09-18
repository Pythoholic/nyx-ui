import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { actionPages } from "../../../apps/docs/src/catalog/actions.js";
import { aiPages } from "../../../apps/docs/src/catalog/ai.js";
import { chartPages } from "../../../apps/docs/src/catalog/charts.js";
import { dataPages } from "../../../apps/docs/src/catalog/data.js";
import { feedbackPages } from "../../../apps/docs/src/catalog/feedback.js";
import { formPages } from "../../../apps/docs/src/catalog/forms.js";
import { layoutPages } from "../../../apps/docs/src/catalog/layouts.js";
import { mediaPages } from "../../../apps/docs/src/catalog/media.js";
import { navigationPages } from "../../../apps/docs/src/catalog/navigation.js";
import { overlayPages } from "../../../apps/docs/src/catalog/overlays.js";
import { primitivePages } from "../../../apps/docs/src/catalog/primitives.js";

interface RegistryItem {
  name: string;
  status: "preview" | "stable";
  files: string[];
}

const repositoryRoot = resolve(process.cwd(), "../..");

function normalizeMarkup(markup: string): string {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  return template.innerHTML.replace(/\s+/g, " ").trim();
}

describe("release registry contract", () => {
  it("keeps only the architecture-approved components in preview", () => {
    const registry = JSON.parse(readFileSync(resolve(repositoryRoot, "registry/registry.json"), "utf8")) as { items: RegistryItem[] };
    const previewNames = registry.items.filter((item) => item.status === "preview").map((item) => item.name);
    expect(previewNames).toEqual(["calendar", "date-picker", "advanced-data-table"]);
    expect(registry.items.every((item) => item.status === "stable" || previewNames.includes(item.name))).toBe(true);
  });

  it("ships every declared registry source without documentation-only classes", () => {
    const registry = JSON.parse(readFileSync(resolve(repositoryRoot, "registry/registry.json"), "utf8")) as { items: RegistryItem[] };
    const files = new Set(registry.items.flatMap((item) => item.files));
    for (const file of files) {
      const source = readFileSync(resolve(repositoryRoot, "registry", file), "utf8");
      expect(source, file).not.toMatch(/class=["'][^"']*\bdocs-/);
    }
  });

  it("renders the same canonical markup shown in every component HTML tab", () => {
    const pages = [
      ...actionPages,
      ...aiPages,
      ...chartPages,
      ...dataPages,
      ...feedbackPages,
      ...formPages,
      ...layoutPages,
      ...mediaPages,
      ...navigationPages,
      ...overlayPages,
      ...primitivePages,
    ];

    for (const page of pages) {
      const template = document.createElement("template");
      template.innerHTML = page.body;
      for (const example of template.content.querySelectorAll<HTMLElement>("[data-docs-example]")) {
        const preview = example.querySelector<HTMLElement>("[data-example-preview]");
        const source = example.querySelector<HTMLElement>(".docs-example-panels > .docs-code [data-nyx-code-source]");
        expect(preview, page.path).not.toBeNull();
        expect(source, page.path).not.toBeNull();
        expect(normalizeMarkup(preview?.innerHTML ?? ""), page.path).toBe(normalizeMarkup(source?.textContent ?? ""));
      }
    }
  });
});
