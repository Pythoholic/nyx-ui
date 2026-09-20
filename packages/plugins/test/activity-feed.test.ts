import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initActivityFeeds, type NyxActivityFeed } from "../src/activity-feed.js";

function render(): HTMLElement {
  document.body.innerHTML = `<section data-nyx-activity-feed><ol><li>Recent</li></ol>
    <ol id="older" data-nyx-activity-history hidden><li><a href="#old">Older item</a></li></ol>
    <button data-nyx-activity-toggle data-collapsed-label="Show 3 older events" aria-expanded="false" aria-controls="older">Show 3 older events</button>
  </section>`;
  return document.querySelector<HTMLElement>("[data-nyx-activity-feed]")!;
}

describe("NyxActivityFeed", () => {
  let initialized: NyxActivityFeed[] = [];
  beforeEach(() => render());
  afterEach(() => { initialized.forEach((feed) => feed.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-activity-feed]")!;
    const first = initActivityFeeds(root)[0]!;
    expect(initActivityFeeds(root)[0]).toBe(first);
    first.destroy();
    const next = initActivityFeeds(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("synchronizes native disclosure state and focuses revealed interactive content", () => {
    initialized = initActivityFeeds();
    const feed = initialized[0]!;
    feed.toggle.click();
    expect(feed.expanded).toBe(true);
    expect(feed.history.hidden).toBe(false);
    expect(feed.element.dataset.state).toBe("expanded");
    expect(feed.toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(feed.history.querySelector("a"));
    feed.toggle.click();
    expect(feed.element.dataset.state).toBe("collapsed");
    expect(feed.toggle.textContent).toBe("Show 3 older events");
  });

  it("pairs a cancelable before-event with an after-event from synchronized DOM", () => {
    initialized = initActivityFeeds();
    const feed = initialized[0]!;
    const prevent = (event: Event): void => event.preventDefault();
    const changed = vi.fn(() => expect(feed.element.dataset.state).toBe("expanded"));
    feed.element.addEventListener("nyx:activity-feed:before-change", prevent);
    expect(feed.setExpanded(true)).toBe(false);
    expect(feed.expanded).toBe(false);
    feed.element.removeEventListener("nyx:activity-feed:before-change", prevent);
    feed.element.addEventListener("nyx:activity-feed:change", changed);
    expect(feed.setExpanded(true)).toBe(true);
    expect(changed).toHaveBeenCalledOnce();
  });
});
