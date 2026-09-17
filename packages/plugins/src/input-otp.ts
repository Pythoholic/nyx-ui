import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxInputOtpChangeReason = "api" | "backspace" | "clear" | "input" | "paste";

export interface NyxInputOtpEventDetail {
  inputOtp: NyxInputOtp;
  previousValue: string;
  reason: NyxInputOtpChangeReason;
  value: string;
}

export interface NyxInputOtpEventMap {
  "nyx:input-otp:before-change": CustomEvent<NyxInputOtpEventDetail>;
  "nyx:input-otp:change": CustomEvent<NyxInputOtpEventDetail>;
  "nyx:input-otp:complete": CustomEvent<NyxInputOtpEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxInputOtpEventMap {}
}

const selector = "[data-nyx-input-otp]";
const instances = new WeakMap<HTMLElement, NyxInputOtp>();

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

export class NyxInputOtp {
  readonly cells: HTMLInputElement[];
  readonly element: HTMLElement;
  readonly hiddenInput: HTMLInputElement;

  private cellValues: string[] = [];
  private lastCompleteValue = "";

  constructor(element: HTMLElement) {
    this.element = element;
    this.cells = Array.from(element.querySelectorAll<HTMLInputElement>("input[data-nyx-input-otp-cell]"));
    const hiddenInput = element.querySelector<HTMLInputElement>("input[type='hidden'][data-nyx-input-otp-value]");
    if (!this.cells.length || !hiddenInput) {
      throw new Error("NyxInputOtp requires cell inputs and a hidden value input.");
    }
    this.hiddenInput = hiddenInput;

    this.cells.forEach((cell, index) => {
      if (cell.type === "number") throw new Error("NyxInputOtp cells must not use type=number.");
      cell.type = "text";
      cell.inputMode = "numeric";
      cell.autocomplete = index === 0 ? "one-time-code" : "off";
      cell.setAttribute("pattern", "[0-9]*");
      if (!cell.hasAttribute("aria-label")) cell.setAttribute("aria-label", `Digit ${index + 1} of ${this.cells.length}`);
      cell.addEventListener("input", this.handleInput);
      cell.addEventListener("keydown", this.handleKeydown);
      cell.addEventListener("paste", this.handlePaste);
      cell.addEventListener("focus", this.handleFocus);
    });

    const initial = digits(this.hiddenInput.value || this.cells.map((cell) => cell.value).join(""));
    this.write(initial.slice(0, this.cells.length));
    this.syncState();
  }

  get complete(): boolean {
    return this.cellValues.length === this.cells.length && this.cellValues.every(Boolean);
  }

  get value(): string {
    return this.hiddenInput.value;
  }

  set value(value: string) {
    this.setValue(value, "api");
  }

  clear(): void {
    if (this.setValue("", "clear")) this.cells[0]?.focus();
  }

  setValue(value: string, reason: NyxInputOtpChangeReason = "api"): boolean {
    const nextValue = digits(value).slice(0, this.cells.length);
    const previousValue = this.value;
    if (nextValue === previousValue) return true;
    const detail: NyxInputOtpEventDetail = { inputOtp: this, previousValue, reason, value: nextValue };
    if (!dispatchNyxEvent(this.element, "nyx:input-otp:before-change", detail, true)) return false;
    this.write(nextValue);
    this.syncState();
    dispatchNyxEvent(this.element, "nyx:input-otp:change", detail);
    this.dispatchComplete(detail);
    return true;
  }

  destroy(): void {
    this.cells.forEach((cell) => {
      cell.removeEventListener("input", this.handleInput);
      cell.removeEventListener("keydown", this.handleKeydown);
      cell.removeEventListener("paste", this.handlePaste);
      cell.removeEventListener("focus", this.handleFocus);
    });
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private write(value: string): void {
    this.writeCells(this.cells.map((_cell, index) => value[index] ?? ""));
  }

  private writeCells(values: string[]): void {
    this.cellValues = this.cells.map((_cell, index) => digits(values[index] ?? "").slice(0, 1));
    this.cells.forEach((cell, index) => { cell.value = this.cellValues[index] ?? ""; });
    this.hiddenInput.value = this.cellValues.join("");
  }

  private syncState(): void {
    const complete = this.complete;
    this.element.dataset.state = complete ? "complete" : "incomplete";
    this.element.setAttribute("aria-invalid", "false");
    if (!complete) this.lastCompleteValue = "";
  }

  private dispatchComplete(detail: NyxInputOtpEventDetail): void {
    if (!this.complete || this.value === this.lastCompleteValue) return;
    this.lastCompleteValue = this.value;
    dispatchNyxEvent(this.element, "nyx:input-otp:complete", { ...detail, value: this.value });
  }

  private focusAfterFill(): void {
    const firstEmpty = this.cells.find((cell) => !cell.value);
    (firstEmpty ?? this.cells.at(-1))?.focus();
  }

  private readonly handleFocus = (event: FocusEvent): void => {
    (event.currentTarget as HTMLInputElement).select();
  };

  private readonly handleInput = (event: Event): void => {
    const cell = event.currentTarget as HTMLInputElement;
    const index = this.cells.indexOf(cell);
    const inserted = digits(cell.value);
    const previousValue = this.value;
    const previousCells = [...this.cellValues];
    const values = [...previousCells];
    values[index] = "";
    const start = inserted.length >= this.cells.length ? 0 : index;
    inserted.split("").slice(0, this.cells.length - start).forEach((digit, offset) => { values[start + offset] = digit; });
    const nextValue = values.join("");
    const detail: NyxInputOtpEventDetail = { inputOtp: this, previousValue, reason: "input", value: nextValue };
    if (!dispatchNyxEvent(this.element, "nyx:input-otp:before-change", detail, true)) {
      this.writeCells(previousCells);
      return;
    }
    this.writeCells(values);
    this.syncState();
    dispatchNyxEvent(this.element, "nyx:input-otp:change", detail);
    this.dispatchComplete(detail);
    if (inserted) this.focusAfterFill();
  };

  private readonly handlePaste = (event: ClipboardEvent): void => {
    const pasted = digits(event.clipboardData?.getData("text") ?? "");
    if (!pasted) return;
    event.preventDefault();
    const index = this.cells.indexOf(event.currentTarget as HTMLInputElement);
    const values = [...this.cellValues];
    const start = pasted.length >= this.cells.length ? 0 : index;
    pasted.split("").slice(0, this.cells.length - start).forEach((digit, offset) => { values[start + offset] = digit; });
    const previousValue = this.value;
    const detail: NyxInputOtpEventDetail = { inputOtp: this, previousValue, reason: "paste", value: values.join("") };
    if (!dispatchNyxEvent(this.element, "nyx:input-otp:before-change", detail, true)) return;
    this.writeCells(values);
    this.syncState();
    dispatchNyxEvent(this.element, "nyx:input-otp:change", detail);
    this.dispatchComplete(detail);
    this.focusAfterFill();
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    const cell = event.currentTarget as HTMLInputElement;
    const index = this.cells.indexOf(cell);
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const offset = event.key === "ArrowLeft" ? -1 : 1;
      this.cells[Math.max(0, Math.min(this.cells.length - 1, index + offset))]?.focus();
      return;
    }
    if (event.key !== "Backspace") return;
    event.preventDefault();
    const targetIndex = cell.value ? index : Math.max(0, index - 1);
    const values = [...this.cellValues];
    values[targetIndex] = "";
    const previousValue = this.value;
    const detail: NyxInputOtpEventDetail = { inputOtp: this, previousValue, reason: "backspace", value: values.join("") };
    if (!dispatchNyxEvent(this.element, "nyx:input-otp:before-change", detail, true)) return;
    this.writeCells(values);
    this.syncState();
    dispatchNyxEvent(this.element, "nyx:input-otp:change", detail);
    this.cells[targetIndex]?.focus();
  };
}

export function initInputOtps(root: ParentNode = document): NyxInputOtp[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxInputOtp(element);
    instances.set(element, instance);
    return instance;
  });
}
