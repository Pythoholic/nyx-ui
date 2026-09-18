import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initInputOtps, type NyxInputOtp } from "../src/input-otp.js";

function renderOtp(): void {
  document.body.innerHTML = `<form id="form"><div data-nyx-input-otp id="otp">
    ${Array.from({ length: 6 }, () => '<input data-nyx-input-otp-cell type="text">').join("")}
    <input data-nyx-input-otp-value name="code" type="hidden">
  </div></form>`;
}

function paste(target: HTMLInputElement, value: string): void {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { getData: () => value } });
  target.dispatchEvent(event);
}

describe("NyxInputOtp", () => {
  let initialized: NyxInputOtp[] = [];

  beforeEach(renderOtp);
  afterEach(() => { initialized.forEach((otp) => otp.destroy()); initialized = []; });

  it("initializes idempotently, includes its root, and reinitializes after destroy", () => {
    const root = document.querySelector<HTMLElement>("#otp");
    if (!root) throw new Error("OTP fixture missing.");
    const first = initInputOtps(root)[0];
    expect(initInputOtps(root)[0]).toBe(first);
    first?.destroy();
    const next = initInputOtps(root)[0];
    initialized = next ? [next] : [];
    expect(next).not.toBe(first);
  });

  it("fills every cell when a full code is pasted anywhere and emits completion once", () => {
    initialized = initInputOtps();
    const [otp] = initialized;
    if (!otp) throw new Error("OTP did not initialize.");
    const complete = vi.fn();
    otp.element.addEventListener("nyx:input-otp:complete", complete);
    paste(otp.cells[3]!, "12 3456");
    expect(otp.cells.map((cell) => cell.value)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(otp.value).toBe("123456");
    expect(document.activeElement).toBe(otp.cells[5]);
    expect(new FormData(document.querySelector<HTMLFormElement>("#form") ?? undefined).get("code")).toBe("123456");
    expect(complete).toHaveBeenCalledOnce();
  });

  it("supports arrow and Backspace navigation and cancelable changes", () => {
    initialized = initInputOtps();
    const [otp] = initialized;
    if (!otp) throw new Error("OTP did not initialize.");
    otp.value = "12";
    otp.cells[2]?.focus();
    otp.cells[2]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    expect(document.activeElement).toBe(otp.cells[1]);
    otp.cells[2]?.focus();
    otp.cells[2]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Backspace" }));
    expect(otp.value).toBe("1");
    expect(document.activeElement).toBe(otp.cells[1]);

    otp.value = "123456";
    otp.cells[2]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Backspace" }));
    expect(otp.cells.map((cell) => cell.value)).toEqual(["1", "2", "", "4", "5", "6"]);
    expect(otp.complete).toBe(false);

    otp.element.addEventListener("nyx:input-otp:before-change", (event) => event.preventDefault(), { once: true });
    otp.value = "999999";
    expect(otp.value).toBe("12456");
  });

  it("mirrors physical arrow navigation in an RTL subtree", () => {
    document.querySelector<HTMLElement>("#otp")?.setAttribute("dir", "rtl");
    initialized = initInputOtps();
    const [otp] = initialized;
    if (!otp) throw new Error("OTP did not initialize.");
    otp.cells[2]?.focus();
    otp.cells[2]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    expect(document.activeElement).toBe(otp.cells[3]);
  });

  it("configures numeric text inputs and autofill on the first cell only", () => {
    initialized = initInputOtps();
    const [otp] = initialized;
    if (!otp) throw new Error("OTP did not initialize.");
    expect(otp.cells.every((cell) => cell.type === "text" && cell.inputMode === "numeric")).toBe(true);
    expect(otp.cells[0]?.autocomplete).toBe("one-time-code");
    expect(otp.cells.slice(1).every((cell) => cell.autocomplete === "off")).toBe(true);
  });
});
