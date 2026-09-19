import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initNotificationCenters, type NyxNotificationCenter } from "../src/notification-center.js";

function renderNotificationCenter(): HTMLElement {
  document.body.innerHTML = `<section data-nyx-notification-center>
    <output data-nyx-notification-count></output>
    <button data-nyx-notification-mark-all type="button">Mark all read</button>
    <ul>
      <li data-nyx-notification data-nyx-notification-id="alpha" data-state="unread">
        Alpha
        <button data-nyx-notification-read type="button">Read</button>
        <button data-nyx-notification-dismiss type="button">Dismiss</button>
      </li>
      <li data-nyx-notification data-nyx-notification-id="beta" data-state="read">
        Beta
        <button data-nyx-notification-read type="button">Unread</button>
        <button data-nyx-notification-dismiss type="button">Dismiss</button>
      </li>
    </ul>
    <p data-nyx-notification-empty hidden>Empty</p>
  </section>`;
  return document.querySelector<HTMLElement>("[data-nyx-notification-center]")!;
}

describe("NyxNotificationCenter", () => {
  let initialized: NyxNotificationCenter[] = [];

  beforeEach(() => renderNotificationCenter());
  afterEach(() => { initialized.forEach((center) => center.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("[data-nyx-notification-center]")!;
    const first = initNotificationCenters(root)[0]!;
    expect(initNotificationCenters(root)[0]).toBe(first);
    first.destroy();
    const next = initNotificationCenters(root)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("synchronizes unread value, collection state, count, and native controls", () => {
    initialized = initNotificationCenters();
    const center = initialized[0]!;
    const alpha = center.notifications[0]!;
    const betaToggle = center.notifications[1]!.querySelector<HTMLButtonElement>("[data-nyx-notification-read]")!;
    expect(center.value).toEqual(["alpha"]);
    expect(center.element.dataset.state).toBe("unread");
    expect(center.element.querySelector("[data-nyx-notification-count]")?.textContent).toBe("1 unread");
    expect(betaToggle.getAttribute("aria-pressed")).toBe("true");
    expect(betaToggle.getAttribute("aria-label")).toBe("Mark notification unread");
    expect(betaToggle.textContent).toBe("Mark unread");

    center.value = ["beta"];
    expect(alpha.dataset.state).toBe("read");
    expect(center.notifications[1]?.dataset.state).toBe("unread");
    expect(betaToggle.getAttribute("aria-label")).toBe("Mark notification read");
    expect(betaToggle.textContent).toBe("Mark read");
    expect(center.value).toEqual(["beta"]);
  });

  it("pairs cancelable read events with after-events fired from synchronized DOM", () => {
    initialized = initNotificationCenters();
    const center = initialized[0]!;
    const changed = vi.fn((event: CustomEvent) => {
      expect(event.detail.notification.dataset.state).toBe("read");
      expect(center.value).toEqual([]);
    });
    const prevent = (event: Event): void => event.preventDefault();
    center.element.addEventListener("nyx:notification-center:read", changed);
    center.element.addEventListener("nyx:notification-center:before-read", prevent);
    expect(center.setRead("alpha")).toBe(false);
    expect(center.value).toEqual(["alpha"]);
    center.element.removeEventListener("nyx:notification-center:before-read", prevent);
    expect(center.setRead("alpha")).toBe(true);
    expect(changed).toHaveBeenCalledOnce();
    expect(center.element.dataset.state).toBe("all-read");
  });

  it("supports bulk read and cancelable dismissal through native controls", () => {
    initialized = initNotificationCenters();
    const center = initialized[0]!;
    center.element.querySelector<HTMLButtonElement>("[data-nyx-notification-mark-all]")?.click();
    expect(center.value).toEqual([]);
    expect(center.element.querySelector<HTMLButtonElement>("[data-nyx-notification-mark-all]")?.disabled).toBe(true);

    const prevent = (event: Event): void => event.preventDefault();
    center.element.addEventListener("nyx:notification-center:before-dismiss", prevent);
    expect(center.dismiss("alpha")).toBe(false);
    center.element.removeEventListener("nyx:notification-center:before-dismiss", prevent);
    expect(center.dismiss("alpha")).toBe(true);
    expect(center.dismiss("beta")).toBe(true);
    expect(center.notifications).toHaveLength(0);
    expect(center.element.querySelectorAll("[data-nyx-motion='removing']")).toHaveLength(0);
    expect(center.element.dataset.state).toBe("empty");
    expect((center.element.querySelector("[data-nyx-notification-empty]") as HTMLElement).hidden).toBe(false);
  });
});
