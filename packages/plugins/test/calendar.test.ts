import { beforeEach, describe, expect, it, vi } from "vitest";
import { initCalendars, type NyxCalendar } from "../src/calendar.js";

function renderCalendar(selection = "single"): HTMLElement {
  document.body.innerHTML = `<div data-nyx-calendar data-nyx-calendar-selection="${selection}" data-nyx-calendar-value="2026-09-18">
    <button data-nyx-calendar-previous>Previous</button><h2 data-nyx-calendar-heading id="heading"></h2><button data-nyx-calendar-next>Next</button>
    <table role="grid" aria-labelledby="heading"><thead><tr data-nyx-calendar-weekdays></tr></thead><tbody data-nyx-calendar-grid></tbody></table>
    <input data-nyx-calendar-value type="hidden"><span data-nyx-calendar-announcer></span>
  </div>`;
  const element = document.querySelector<HTMLElement>("[data-nyx-calendar]");
  if (!element) throw new Error("Calendar fixture missing.");
  return element;
}

describe("NyxCalendar", () => {
  let calendar: NyxCalendar | undefined;

  beforeEach(() => { document.body.innerHTML = ""; calendar = undefined; });

  it("initializes idempotently, includes the root, and reinitializes after destroy", () => {
    const root = renderCalendar();
    calendar = initCalendars(root)[0];
    expect(initCalendars(root)[0]).toBe(calendar);
    calendar?.destroy();
    const next = initCalendars(root)[0];
    expect(next).not.toBe(calendar);
    next?.destroy();
  });

  it("renders a semantic six-week grid with localized labels and roving focus", () => {
    const root = renderCalendar();
    calendar = initCalendars(root, { locale: "en-US", weekStartsOn: 1 })[0];
    expect(root.querySelectorAll("tbody [role='row']")).toHaveLength(6);
    expect(root.querySelectorAll("[role='gridcell']")).toHaveLength(42);
    expect(root.querySelectorAll("[role='columnheader']")).toHaveLength(7);
    expect(root.querySelector<HTMLButtonElement>("[data-nyx-calendar-date='2026-09-18']")?.tabIndex).toBe(0);
    expect(root.querySelector("[data-nyx-calendar-heading]")?.textContent).toContain("September");
  });

  it("moves by keyboard, skips disabled dates, changes month, and announces focus", () => {
    const root = renderCalendar();
    calendar = initCalendars(root, { disabled: (_date, value) => value === "2026-09-19" })[0];
    const active = root.querySelector<HTMLButtonElement>("[data-nyx-calendar-date='2026-09-18']");
    active?.focus();
    active?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(calendar?.focusedValue).toBe("2026-09-20");
    expect(document.activeElement).toBe(root.querySelector("[data-nyx-calendar-date='2026-09-20']"));
    expect(root.querySelector("[data-nyx-calendar-announcer]")?.textContent).toContain("September");

    document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "PageDown", shiftKey: true }));
    expect(calendar?.focusedValue).toBe("2027-09-20");
  });

  it("mirrors horizontal date movement in an RTL subtree", () => {
    const root = renderCalendar();
    root.dir = "rtl";
    calendar = initCalendars(root)[0];
    const active = root.querySelector<HTMLButtonElement>("[data-nyx-calendar-date='2026-09-18']");
    active?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    expect(calendar?.focusedValue).toBe("2026-09-19");
    document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(calendar?.focusedValue).toBe("2026-09-18");
  });

  it("supports cancelable single selection and ordered range selection", () => {
    const root = renderCalendar("range");
    calendar = initCalendars(root)[0];
    calendar!.value = undefined;
    calendar!.select("2026-09-22");
    calendar!.select("2026-09-20");
    expect(calendar!.value).toEqual({ start: "2026-09-20", end: "2026-09-22" });
    expect((root.querySelector("[data-nyx-calendar-value]") as HTMLInputElement).value).toBe("2026-09-20/2026-09-22");

    const prevent = vi.fn((event: Event) => event.preventDefault());
    root.addEventListener("nyx:calendar:before-select", prevent);
    expect(calendar!.select("2026-09-24")).toBe(false);
    expect(prevent).toHaveBeenCalledOnce();
    expect(calendar!.value).toEqual({ start: "2026-09-20", end: "2026-09-22" });
  });
});
