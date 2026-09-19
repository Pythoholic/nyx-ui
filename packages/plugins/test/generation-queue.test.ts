import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initGenerationQueues, type NyxGenerationQueue } from "../src/generation-queue.js";

function renderQueue(): HTMLElement {
  document.body.innerHTML = `<section data-nyx-generation-queue><output data-nyx-generation-count></output><ol>
    <li data-nyx-generation-item data-nyx-generation-id="one" data-state="running" data-progress="25"><progress data-nyx-generation-progress></progress><output data-nyx-generation-status></output><button data-nyx-generation-action="cancel">Cancel</button><button data-nyx-generation-action="retry">Retry</button><button data-nyx-generation-action="remove">Remove</button></li>
    <li data-nyx-generation-item data-nyx-generation-id="two" data-state="failed" data-progress="40"><progress data-nyx-generation-progress></progress><output data-nyx-generation-status></output><button data-nyx-generation-action="cancel">Cancel</button><button data-nyx-generation-action="retry">Retry</button><button data-nyx-generation-action="remove">Remove</button></li>
  </ol><p data-nyx-generation-empty hidden>Empty</p></section>`;
  return document.querySelector<HTMLElement>("[data-nyx-generation-queue]")!;
}

describe("NyxGenerationQueue", () => {
  let initialized: NyxGenerationQueue[] = [];
  beforeEach(renderQueue);
  afterEach(() => { initialized.forEach((queue) => queue.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = renderQueue();
    const first = initGenerationQueues(root)[0]!;
    expect(initGenerationQueues(root)[0]).toBe(first);
    first.destroy();
    const next = initGenerationQueues(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("synchronizes queue state, progress, ARIA, and state-specific actions", () => {
    initialized = initGenerationQueues();
    const queue = initialized[0]!;
    const running = queue.items[0]!;
    expect(queue.element.dataset.state).toBe("attention");
    expect(queue.element.getAttribute("aria-busy")).toBe("true");
    expect(running.getAttribute("aria-busy")).toBe("true");
    expect(running.querySelector<HTMLProgressElement>("progress")?.value).toBe(25);
    expect(running.querySelector<HTMLButtonElement>("[data-nyx-generation-action='remove']")?.hidden).toBe(true);
    expect(queue.setStatus("one", "complete")).toBe(true);
    expect(running.dataset.progress).toBe("100");
    expect(running.querySelector<HTMLButtonElement>("[data-nyx-generation-action='cancel']")?.hidden).toBe(true);
  });

  it("pairs cancelable state and removal events with synchronized after-events", () => {
    initialized = initGenerationQueues();
    const queue = initialized[0]!;
    queue.element.addEventListener("nyx:generation-queue:before-change", (event) => event.preventDefault(), { once: true });
    expect(queue.setStatus("one", "canceled")).toBe(false);
    expect(queue.value[0]?.state).toBe("running");
    const changed = vi.fn((event: CustomEvent) => expect(event.detail.item.getAttribute("aria-busy")).toBe("false"));
    queue.element.addEventListener("nyx:generation-queue:change", changed);
    queue.items[0]?.querySelector<HTMLButtonElement>("[data-nyx-generation-action='cancel']")?.click();
    expect(changed).toHaveBeenCalledOnce();
    expect(changed.mock.calls[0]?.[0].detail.reason).toBe("control");

    queue.element.addEventListener("nyx:generation-queue:before-remove", (event) => event.preventDefault(), { once: true });
    expect(queue.remove("two")).toBe(false);
    expect(queue.remove("two")).toBe(true);
    expect(queue.value).toHaveLength(1);
    expect(queue.element.querySelector("[data-nyx-generation-id='two']")).toBeNull();
  });
});
