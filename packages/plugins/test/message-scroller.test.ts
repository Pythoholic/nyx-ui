import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initMessageScrollers, type NyxMessageScroller } from "../src/message-scroller.js";

function renderScroller(): HTMLElement {
  document.body.innerHTML = `<section data-nyx-message-scroller>
    <div data-nyx-message-scroller-viewport tabindex="0">
      <ol><li data-nyx-message-scroller-message>First</li></ol>
    </div>
    <button data-nyx-message-scroller-jump hidden type="button">Jump</button>
    <output data-nyx-message-scroller-status></output>
  </section>`;
  const viewport = document.querySelector<HTMLElement>("[data-nyx-message-scroller-viewport]")!;
  Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 100 });
  Object.defineProperty(viewport, "scrollHeight", { configurable: true, get: () => 300 });
  return document.querySelector<HTMLElement>("[data-nyx-message-scroller]")!;
}

describe("NyxMessageScroller", () => {
  let initialized: NyxMessageScroller[] = [];

  beforeEach(renderScroller);
  afterEach(() => { initialized.forEach((scroller) => scroller.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-message-scroller]")!;
    const first = initMessageScrollers(root)[0]!;
    expect(initMessageScrollers(root)[0]).toBe(first);
    first.destroy();
    const next = initMessageScrollers(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("synchronizes initial following state, scroll position, controls, and ARIA", () => {
    initialized = initMessageScrollers();
    const scroller = initialized[0]!;
    expect(scroller.following).toBe(true);
    expect(scroller.viewport.scrollTop).toBe(200);
    expect(scroller.element.dataset.state).toBe("following");
    expect(scroller.element.dataset.atEnd).toBe("true");
    expect(scroller.element.dataset.unread).toBe("0");
    expect(scroller.jumpButton?.hidden).toBe(true);
    expect(scroller.jumpButton?.getAttribute("aria-controls")).toBe(scroller.viewport.id);
  });

  it("pauses on reader scroll, counts inserted messages, and follows from the jump control", async () => {
    initialized = initMessageScrollers();
    const scroller = initialized[0]!;
    const paused = vi.fn();
    const messages = vi.fn();
    const followed = vi.fn();
    scroller.element.addEventListener("nyx:message-scroller:pause", paused);
    scroller.element.addEventListener("nyx:message-scroller:new-messages", messages);
    scroller.element.addEventListener("nyx:message-scroller:follow", followed);

    scroller.viewport.scrollTop = 40;
    scroller.viewport.dispatchEvent(new Event("scroll"));
    expect(scroller.following).toBe(false);
    expect(scroller.element.dataset.state).toBe("paused");
    expect(paused).toHaveBeenCalledOnce();
    expect(scroller.jumpButton?.hidden).toBe(false);
    expect(scroller.jumpButton?.textContent).toBe("Jump to latest");

    scroller.viewport.querySelector("ol")?.insertAdjacentHTML("beforeend", '<li data-nyx-message-scroller-message>Second</li>');
    await vi.waitFor(() => expect(scroller.unread).toBe(1));
    expect(scroller.element.dataset.unread).toBe("1");
    expect(scroller.jumpButton?.textContent).toBe("1 new message");
    expect(scroller.status?.value).toBe("1 new message");
    expect(messages.mock.calls[0]?.[0].detail.count).toBe(1);

    scroller.jumpButton?.click();
    expect(scroller.following).toBe(true);
    expect(scroller.unread).toBe(0);
    expect(scroller.viewport.scrollTop).toBe(200);
    expect(followed.mock.calls[0]?.[0].detail.reason).toBe("control");
  });

  it("honors cancelable pause and follow transitions", () => {
    initialized = initMessageScrollers();
    const scroller = initialized[0]!;
    const preventPause = (event: Event): void => event.preventDefault();
    scroller.element.addEventListener("nyx:message-scroller:before-pause", preventPause);
    scroller.viewport.scrollTop = 0;
    scroller.viewport.dispatchEvent(new Event("scroll"));
    expect(scroller.following).toBe(true);
    expect(scroller.viewport.scrollTop).toBe(200);

    scroller.element.removeEventListener("nyx:message-scroller:before-pause", preventPause);
    expect(scroller.pause()).toBe(true);
    scroller.element.addEventListener("nyx:message-scroller:before-follow", (event) => event.preventDefault(), { once: true });
    expect(scroller.follow()).toBe(false);
    expect(scroller.following).toBe(false);
  });
});
