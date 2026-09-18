import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxNumberInputChangeReason = "api" | "decrement" | "increment" | "input" | "keyboard";

export interface NyxNumberInputEventDetail {
  numberInput: NyxNumberInput;
  previousValue: number | null;
  reason: NyxNumberInputChangeReason;
  value: number | null;
}

export interface NyxNumberInputEventMap {
  "nyx:number-input:before-change": CustomEvent<NyxNumberInputEventDetail>;
  "nyx:number-input:change": CustomEvent<NyxNumberInputEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxNumberInputEventMap {}
}

const selector = "[data-nyx-number-input]";
const instances = new WeakMap<HTMLElement, NyxNumberInput>();
let generatedId = 0;

function finiteAttribute(input: HTMLInputElement, name: "max" | "min"): number | undefined {
  const value = Number(input.getAttribute(name));
  return input.hasAttribute(name) && Number.isFinite(value) ? value : undefined;
}

function decimalPlaces(value: number): number {
  const text = String(value).toLowerCase();
  if (text.includes("e-")) return Number(text.split("e-")[1]) || 0;
  return text.includes(".") ? text.length - text.indexOf(".") - 1 : 0;
}

export class NyxNumberInput {
  readonly decrementButton: HTMLButtonElement;
  readonly element: HTMLElement;
  readonly incrementButton: HTMLButtonElement;
  readonly input: HTMLInputElement;
  readonly output: HTMLOutputElement | null;

  private acceptedRawValue: string;

  constructor(element: HTMLElement) {
    this.element = element;
    const input = element.querySelector<HTMLInputElement>("[data-nyx-number-input-control]");
    const decrementButton = element.querySelector<HTMLButtonElement>("[data-nyx-number-input-decrement]");
    const incrementButton = element.querySelector<HTMLButtonElement>("[data-nyx-number-input-increment]");
    if (!input || input.type !== "number" || !decrementButton || !incrementButton) {
      throw new Error("NyxNumberInput requires a number input and increment/decrement buttons.");
    }
    this.input = input;
    this.decrementButton = decrementButton;
    this.incrementButton = incrementButton;
    this.output = element.querySelector<HTMLOutputElement>("[data-nyx-number-input-output]");
    if (!input.id) input.id = `nyx-number-input-${++generatedId}`;
    [decrementButton, incrementButton].forEach((button) => button.setAttribute("aria-controls", input.id));
    this.acceptedRawValue = input.value;
    element.addEventListener("click", this.handleClick);
    input.addEventListener("input", this.handleInput);
    input.addEventListener("keydown", this.handleKeydown);
    this.sync();
  }

  get value(): number | null {
    return this.parse(this.input.value);
  }

  set value(value: number | null) {
    this.setValue(value);
  }

  decrement(multiplier = 1, reason: NyxNumberInputChangeReason = "decrement"): boolean {
    return this.step(-1, multiplier, reason);
  }

  increment(multiplier = 1, reason: NyxNumberInputChangeReason = "increment"): boolean {
    return this.step(1, multiplier, reason);
  }

  setValue(value: number | null, reason: NyxNumberInputChangeReason = "api"): boolean {
    if (value !== null && !Number.isFinite(value)) return false;
    const nextRaw = value === null ? "" : String(this.constrain(value));
    return this.commit(nextRaw, reason);
  }

  destroy(): void {
    this.element.removeEventListener("click", this.handleClick);
    this.input.removeEventListener("input", this.handleInput);
    this.input.removeEventListener("keydown", this.handleKeydown);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private get stepAmount(): number {
    const declared = Number(this.input.step);
    return this.input.step === "any" || !Number.isFinite(declared) || declared <= 0 ? 1 : declared;
  }

  private parse(raw: string): number | null {
    if (raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  private constrain(value: number): number {
    const min = finiteAttribute(this.input, "min");
    const max = finiteAttribute(this.input, "max");
    const constrained = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value));
    const precision = Math.max(decimalPlaces(this.stepAmount), decimalPlaces(min ?? 0));
    return Number(constrained.toFixed(Math.min(precision, 12)));
  }

  private step(direction: -1 | 1, multiplier: number, reason: NyxNumberInputChangeReason): boolean {
    if (this.input.disabled || this.input.readOnly || !Number.isFinite(multiplier) || multiplier <= 0) return false;
    const min = finiteAttribute(this.input, "min");
    const base = this.value ?? (direction > 0 && min !== undefined ? min - this.stepAmount : 0);
    return this.setValue(base + direction * this.stepAmount * multiplier, reason);
  }

  private commit(nextRaw: string, reason: NyxNumberInputChangeReason, previousRaw = this.acceptedRawValue): boolean {
    if (nextRaw === previousRaw) {
      this.input.value = nextRaw;
      this.sync();
      return true;
    }
    const detail: NyxNumberInputEventDetail = {
      numberInput: this,
      previousValue: this.parse(previousRaw),
      reason,
      value: this.parse(nextRaw),
    };
    if (!dispatchNyxEvent(this.element, "nyx:number-input:before-change", detail, true)) {
      this.input.value = previousRaw;
      this.sync();
      return false;
    }
    this.input.value = nextRaw;
    this.acceptedRawValue = this.input.value;
    this.sync();
    detail.value = this.value;
    dispatchNyxEvent(this.element, "nyx:number-input:change", detail);
    return true;
  }

  private sync(): void {
    const value = this.value;
    const empty = this.input.value === "";
    const valid = this.input.checkValidity();
    this.element.dataset.state = empty ? "empty" : valid ? "valid" : "invalid";
    this.input.setAttribute("aria-invalid", String(!valid));
    const min = finiteAttribute(this.input, "min");
    const max = finiteAttribute(this.input, "max");
    const unavailable = this.input.disabled || this.input.readOnly;
    this.decrementButton.disabled = unavailable || value !== null && min !== undefined && value <= min;
    this.incrementButton.disabled = unavailable || value !== null && max !== undefined && value >= max;
    this.decrementButton.setAttribute("aria-disabled", String(this.decrementButton.disabled));
    this.incrementButton.setAttribute("aria-disabled", String(this.incrementButton.disabled));
    if (this.output) {
      this.output.value = value === null ? "Not set" : `${this.format(value)}${this.element.dataset.nyxNumberInputUnit ?? ""}`;
    }
  }

  private format(value: number): string {
    const locale = this.element.dataset.nyxNumberInputLocale;
    const maximumFractionDigits = Math.max(0, Math.min(12, decimalPlaces(this.stepAmount)));
    return new Intl.NumberFormat(locale || undefined, { maximumFractionDigits }).format(value);
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button") : null;
    if (!target || target.closest(selector) !== this.element) return;
    if (target === this.decrementButton) this.decrement();
    else if (target === this.incrementButton) this.increment();
  };

  private readonly handleInput = (): void => {
    this.commit(this.input.value, "input");
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      this.step(event.key === "PageUp" ? 1 : -1, 10, "keyboard");
      return;
    }
    const boundary = event.key === "Home" ? finiteAttribute(this.input, "min") : event.key === "End" ? finiteAttribute(this.input, "max") : undefined;
    if (boundary === undefined) return;
    event.preventDefault();
    this.setValue(boundary, "keyboard");
  };
}

export function initNumberInputs(root: ParentNode = document): NyxNumberInput[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxNumberInput(element);
    instances.set(element, instance);
    return instance;
  });
}
