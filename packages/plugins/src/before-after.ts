import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxBeforeAfterReason = "api" | "input";

export interface NyxBeforeAfterEventDetail {
  beforeAfter: NyxBeforeAfter;
  previousValue: number;
  reason: NyxBeforeAfterReason;
  value: number;
}

export interface NyxBeforeAfterEventMap {
  "nyx:before-after:before-change": CustomEvent<NyxBeforeAfterEventDetail>;
  "nyx:before-after:change": CustomEvent<NyxBeforeAfterEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxBeforeAfterEventMap {}
}

const selector = "[data-nyx-before-after]";
const instances = new WeakMap<HTMLElement, NyxBeforeAfter>();

export class NyxBeforeAfter {
  readonly element: HTMLElement;
  readonly input: HTMLInputElement;
  private acceptedValue: number;

  constructor(element: HTMLElement) {
    this.element = element;
    const input = element.querySelector<HTMLInputElement>("input[type='range'][data-nyx-before-after-control]");
    if (!input) throw new Error("NyxBeforeAfter requires a range input.");
    this.input = input;
    this.acceptedValue = this.normalize(input.valueAsNumber);
    input.addEventListener("input", this.handleInput);
    input.addEventListener("change", this.handleInput);
    this.sync();
  }

  get value(): number {
    return this.normalize(this.input.valueAsNumber);
  }

  set value(value: number) {
    this.setValue(value);
  }

  setValue(value: number, reason: NyxBeforeAfterReason = "api"): boolean {
    const next = this.normalize(value);
    const previousValue = this.acceptedValue;
    if (next === previousValue) {
      this.input.value = String(next);
      this.sync();
      return false;
    }
    const detail = { beforeAfter: this, previousValue, reason, value: next };
    if (!dispatchNyxEvent(this.element, "nyx:before-after:before-change", detail, true)) {
      this.input.value = String(previousValue);
      this.sync();
      return false;
    }
    this.input.value = String(next);
    this.acceptedValue = next;
    this.sync();
    dispatchNyxEvent(this.element, "nyx:before-after:change", detail);
    return true;
  }

  destroy(): void {
    this.input.removeEventListener("input", this.handleInput);
    this.input.removeEventListener("change", this.handleInput);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private normalize(value: number): number {
    const parsedMin = Number(this.input.min || 0);
    const parsedMax = Number(this.input.max || 100);
    const min = Number.isFinite(parsedMin) ? parsedMin : 0;
    const max = Number.isFinite(parsedMax) ? parsedMax : 100;
    return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  }

  private sync(): void {
    const min = Number(this.input.min || 0);
    const max = Number(this.input.max || 100);
    const percent = max === min ? 0 : ((this.value - min) / (max - min)) * 100;
    const rounded = Math.round(percent);
    this.element.style.setProperty("--nyx-before-after-position", `${percent}%`);
    this.element.dataset.position = String(this.value);
    this.element.dataset.state = percent <= 0 ? "before" : percent >= 100 ? "after" : "mixed";
    this.input.setAttribute("aria-valuetext", `${rounded}% after`);
    const output = this.element.querySelector<HTMLOutputElement>("[data-nyx-before-after-output]");
    if (output) output.value = `${rounded}% after`;
  }

  private readonly handleInput = (): void => {
    this.setValue(this.input.valueAsNumber, "input");
  };
}

export function initBeforeAfters(root: ParentNode = document): NyxBeforeAfter[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxBeforeAfter(element);
    instances.set(element, instance);
    return instance;
  });
}
