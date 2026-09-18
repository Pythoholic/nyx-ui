import { beforeEach, describe, expect, it } from "vitest";
import { card } from "../../../apps/docs/src/catalog/shared.js";
import { initCodeBlocks } from "../src/code-block.js";
import { initTabs } from "../src/tabs.js";

describe("documentation example tabs", () => {
  beforeEach(() => { document.body.innerHTML = ""; });

  it("generates unique relationships and switches one mutually exclusive surface", () => {
    document.body.innerHTML = `${card("First", "<button>Live one</button>", "ignored", "<button>Source one</button>")}${card("Second", "<p>Live two</p>", "ignored", "<p>Source two</p>")}`;
    const ids = Array.from(document.querySelectorAll<HTMLElement>("[id]")).map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    const examples = document.querySelectorAll<HTMLElement>("[data-docs-example]");
    expect(examples).toHaveLength(2);
    const controllers = initTabs(document);
    expect(controllers).toHaveLength(2);

    const first = examples[0]!;
    const tabs = first.querySelectorAll<HTMLButtonElement>("[role='tab']");
    const panels = first.querySelectorAll<HTMLElement>("[role='tabpanel']");
    tabs[1]?.click();
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[0]?.hidden).toBe(true);
    expect(panels[1]?.hidden).toBe(false);
    expect(first.querySelector("code")?.textContent).toBe("<button>Source one</button>");
    controllers.forEach((controller) => controller.destroy());
  });

  it("binds each example copy button to its displayed canonical source", async () => {
    document.body.innerHTML = `${card("First", "<code>Preview decoy</code>", "ignored", "<button>Canonical one</button>")}${card("Second", "<p>Live two</p>", "ignored", "<p>Canonical two</p>")}`;
    const copied: string[] = [];
    const controllers = initCodeBlocks(document, { copy: (text) => { copied.push(text); }, resetDelay: 0 });
    const buttons = document.querySelectorAll<HTMLButtonElement>("[data-nyx-code-copy]");
    buttons[0]?.click();
    buttons[1]?.click();
    await Promise.resolve();
    expect(copied).toEqual(["<button>Canonical one</button>", "<p>Canonical two</p>"]);
    controllers.forEach((controller) => controller.destroy());
  });
});
