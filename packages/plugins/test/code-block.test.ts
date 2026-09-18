import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initCodeBlocks, NyxCodeBlock, type NyxCodeBlockEventDetail } from "../src/code-block.js";

function renderCodeBlock(): HTMLElement {
  document.body.innerHTML = `<div data-nyx-code-block>
    <button data-nyx-code-copy aria-controls="source"><span data-nyx-code-copy-label>Copy</span></button>
    <span data-nyx-code-status></span>
    <pre><code id="source" data-nyx-code-source>const signal = "ready";</code></pre>
  </div>`;
  return document.querySelector<HTMLElement>("[data-nyx-code-block]")!;
}

describe("NyxCodeBlock", () => {
  const controllers: NyxCodeBlock[] = [];

  beforeEach(renderCodeBlock);
  afterEach(() => {
    controllers.splice(0).forEach((controller) => controller.destroy());
    vi.useRealTimers();
  });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-code-block]")!;
    const first = initCodeBlocks(root, { copy: vi.fn() })[0]!;
    controllers.push(first);
    expect(initCodeBlocks(root)[0]).toBe(first);
    expect(first.element.dataset.state).toBe("idle");
    expect(first.element.getAttribute("aria-busy")).toBe("false");
    expect(first.button.getAttribute("aria-controls")).toBe(first.source.id);
    expect(first.button.getAttribute("aria-describedby")).toContain(first.status.id);

    first.destroy();
    const next = initCodeBlocks(root, { copy: vi.fn() })[0]!;
    controllers.push(next);
    expect(next).not.toBe(first);
  });

  it("copies exact source text and pairs cancelable and completed events", async () => {
    vi.useFakeTimers();
    const writer = vi.fn(async () => undefined);
    const codeBlock = initCodeBlocks(document, { copy: writer, resetDelay: 50 })[0]!;
    controllers.push(codeBlock);
    const completed = vi.fn<(event: CustomEvent<NyxCodeBlockEventDetail>) => void>();
    codeBlock.element.addEventListener("nyx:code-block:copy", completed);

    expect(await codeBlock.copy()).toBe(true);
    expect(writer).toHaveBeenCalledWith('const signal = "ready";');
    expect(codeBlock.state).toBe("copied");
    expect(codeBlock.button.dataset.state).toBe("copied");
    expect(codeBlock.button.getAttribute("aria-label")).toBe("Copied");
    expect(codeBlock.status.textContent).toBe("Code copied to clipboard.");
    expect(completed).toHaveBeenCalledOnce();
    expect(completed.mock.calls[0]?.[0].detail.reason).toBe("api");

    await vi.advanceTimersByTimeAsync(50);
    expect(codeBlock.state).toBe("idle");
    expect(codeBlock.status.textContent).toBe("");

    codeBlock.element.addEventListener("nyx:code-block:before-copy", (event) => event.preventDefault(), { once: true });
    expect(await codeBlock.copy("button")).toBe(false);
    expect(writer).toHaveBeenCalledOnce();
  });

  it("exposes an error state and error event when clipboard writing fails", async () => {
    const failure = new Error("denied");
    const codeBlock = initCodeBlocks(document, { copy: async () => { throw failure; }, resetDelay: 10_000 })[0]!;
    controllers.push(codeBlock);
    const errors = vi.fn();
    codeBlock.element.addEventListener("nyx:code-block:error", errors);

    expect(await codeBlock.copy()).toBe(false);
    expect(codeBlock.state).toBe("error");
    expect(codeBlock.element.getAttribute("aria-busy")).toBe("false");
    expect(codeBlock.status.textContent).toContain("Copy failed");
    expect(errors).toHaveBeenCalledOnce();
    expect(errors.mock.calls[0]?.[0].detail.error).toBe(failure);
  });

  it("keeps nested code blocks independently owned", () => {
    const outer = document.querySelector<HTMLElement>("[data-nyx-code-block]")!;
    outer.insertAdjacentHTML("beforeend", `<div data-nyx-code-block>
      <button data-nyx-code-copy><span data-nyx-code-copy-label>Copy</span></button>
      <span data-nyx-code-status></span><code data-nyx-code-source>nested</code>
    </div>`);
    const initialized = initCodeBlocks(document, { copy: vi.fn() });
    controllers.push(...initialized);
    expect(initialized).toHaveLength(2);
    expect(initialized[0]?.value).toBe('const signal = "ready";');
    expect(initialized[1]?.value).toBe("nested");
  });

  it("initializes the canonical registry source and declares its package requirements", () => {
    document.body.innerHTML = readFileSync(resolve(process.cwd(), "../../registry/components/code-block.html"), "utf8");
    const codeBlock = initCodeBlocks(document, { copy: vi.fn() })[0]!;
    controllers.push(codeBlock);
    expect(codeBlock.source.textContent).toContain("await deploy");
    expect(codeBlock.button.type).toBe("button");
    expect(codeBlock.status.getAttribute("aria-live")).toBe("polite");

    const registry = JSON.parse(readFileSync(resolve(process.cwd(), "../../registry/registry.json"), "utf8")) as {
      items: Array<{ name: string; files: string[]; requires: string[] }>;
    };
    const item = registry.items.find((candidate) => candidate.name === "code-block");
    expect(item?.files).toEqual(["components/code-block.html"]);
    expect(item?.requires).toEqual(["@nyx-ui/core", "@nyx-ui/plugins/code-block"]);
  });
});
