import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initDatePickers, type NyxDatePicker } from "../src/date-picker.js";

const floating = vi.hoisted(() => ({ autoUpdate: vi.fn(), cleanup: vi.fn(), computePosition: vi.fn() }));
vi.mock("@floating-ui/dom", async () => {
  const actual = await vi.importActual<typeof import("@floating-ui/dom")>("@floating-ui/dom");
  return { ...actual, autoUpdate: floating.autoUpdate, computePosition: floating.computePosition };
});

function renderPicker(): HTMLElement {
  document.body.innerHTML = `<div data-nyx-date-picker><input data-nyx-date-picker-input><button data-nyx-date-picker-trigger>Open</button><span data-nyx-date-picker-error></span>
    <div data-nyx-date-picker-popover hidden><div data-nyx-calendar data-nyx-calendar-min="2026-09-01" data-nyx-calendar-value="2026-09-18">
      <button data-nyx-calendar-previous>Previous</button><h2 data-nyx-calendar-heading id="heading"></h2><button data-nyx-calendar-next>Next</button>
      <table role="grid"><thead><tr data-nyx-calendar-weekdays></tr></thead><tbody data-nyx-calendar-grid></tbody></table><span data-nyx-calendar-announcer></span>
    </div></div></div>`;
  const root = document.querySelector<HTMLElement>("[data-nyx-date-picker]");
  if (!root) throw new Error("Picker fixture missing.");
  return root;
}

describe("NyxDatePicker", () => {
  let picker: NyxDatePicker | undefined;

  beforeEach(() => {
    floating.cleanup.mockReset();
    floating.computePosition.mockReset();
    floating.computePosition.mockResolvedValue({ middlewareData: {}, placement: "bottom-start", strategy: "fixed", x: 10, y: 20 });
    floating.autoUpdate.mockReset();
    floating.autoUpdate.mockImplementation((_reference, _overlay, update) => { void update(); return floating.cleanup; });
  });
  afterEach(() => picker?.destroy());

  it("composes Calendar, positions on open, and cleans up idempotently", () => {
    const root = renderPicker();
    picker = initDatePickers(root)[0];
    expect(initDatePickers(root)[0]).toBe(picker);
    expect(picker?.input.value).toBe("2026-09-18");
    expect(root.dataset.state).toBe("closed");
    expect(picker?.input.getAttribute("aria-invalid")).toBe("false");
    expect(picker?.input.hasAttribute("data-invalid")).toBe(false);
    picker?.open("api", true);
    expect(picker?.popover.hidden).toBe(false);
    expect(picker?.trigger.getAttribute("aria-expanded")).toBe("true");
    expect(root.dataset.state).toBe("open");
    picker?.close("api");
    expect(root.dataset.state).toBe("closed");
    expect(floating.cleanup).toHaveBeenCalledOnce();
  });

  it("parses typed ISO values, reports invalid input, and enforces constraints", () => {
    renderPicker();
    picker = initDatePickers()[0];
    picker!.input.value = "2026-10-04";
    picker!.input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(picker!.value).toBe("2026-10-04");

    picker!.input.value = "04/10/2026";
    picker!.input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(picker!.input.getAttribute("aria-invalid")).toBe("true");
    expect(picker!.input.hasAttribute("data-invalid")).toBe(true);
    expect(picker!.value).toBe("2026-10-04");

    picker!.input.value = "2026-08-31";
    picker!.input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(picker!.input.getAttribute("aria-invalid")).toBe("true");
    expect(picker!.input.hasAttribute("data-invalid")).toBe(true);
    expect(picker!.value).toBe("2026-10-04");

    picker!.input.value = "2026-10-05";
    picker!.input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(picker!.input.getAttribute("aria-invalid")).toBe("false");
    expect(picker!.input.hasAttribute("data-invalid")).toBe(false);
    expect(picker!.value).toBe("2026-10-05");
  });

  it("synchronizes calendar selection, supports cancellation, and closes on a complete value", () => {
    const root = renderPicker();
    picker = initDatePickers()[0];
    picker!.open();
    const prevent = (event: Event): void => event.preventDefault();
    root.addEventListener("nyx:date-picker:before-change", prevent);
    expect(picker!.calendar.select("2026-09-20")).toBe(false);
    expect(picker!.value).toBe("2026-09-18");
    root.removeEventListener("nyx:date-picker:before-change", prevent);
    expect(picker!.calendar.select("2026-09-20")).toBe(true);
    expect(picker!.input.value).toBe("2026-09-20");
    expect(picker!.popover.hidden).toBe(true);
  });
});
