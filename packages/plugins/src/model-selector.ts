import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxModelSelectorReason = "api" | "input";

export interface NyxModelSelectorEventDetail {
  modelSelector: NyxModelSelector;
  previousValue: string;
  reason: NyxModelSelectorReason;
  value: string;
}

export interface NyxModelSelectorEventMap {
  "nyx:model-selector:before-change": CustomEvent<NyxModelSelectorEventDetail>;
  "nyx:model-selector:change": CustomEvent<NyxModelSelectorEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxModelSelectorEventMap {}
}

const selector = "[data-nyx-model-selector]";
const instances = new WeakMap<HTMLElement, NyxModelSelector>();

export class NyxModelSelector {
  readonly element: HTMLElement;
  private acceptedValue: string;

  constructor(element: HTMLElement) {
    this.element = element;
    this.acceptedValue = this.selectedInput?.value ?? "";
    element.addEventListener("change", this.handleChange);
    this.sync();
  }

  get inputs(): HTMLInputElement[] {
    return Array.from(this.element.querySelectorAll<HTMLInputElement>("input[type='radio'][data-nyx-model-value]"));
  }

  get value(): string {
    return this.selectedInput?.value ?? "";
  }

  set value(value: string) {
    this.setValue(value);
  }

  setValue(value: string, reason: NyxModelSelectorReason = "api"): boolean {
    const input = this.inputs.find((candidate) => candidate.value === value && !candidate.disabled);
    if (!input || value === this.acceptedValue) {
      this.sync();
      return false;
    }
    const detail = { modelSelector: this, previousValue: this.acceptedValue, reason, value };
    if (!dispatchNyxEvent(this.element, "nyx:model-selector:before-change", detail, true)) {
      this.restoreAccepted();
      return false;
    }
    input.checked = true;
    this.acceptedValue = value;
    this.sync();
    dispatchNyxEvent(this.element, "nyx:model-selector:change", detail);
    return true;
  }

  destroy(): void {
    this.element.removeEventListener("change", this.handleChange);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private get selectedInput(): HTMLInputElement | undefined {
    return this.inputs.find((input) => input.checked);
  }

  private restoreAccepted(): void {
    this.inputs.forEach((input) => { input.checked = input.value === this.acceptedValue; });
    this.sync();
  }

  private sync(): void {
    const disabled = this.inputs.length === 0 || this.inputs.every((input) => input.disabled);
    this.element.dataset.state = disabled ? "disabled" : this.value ? "ready" : "empty";
    this.inputs.forEach((input) => {
      const option = input.closest<HTMLElement>("[data-nyx-model-option]");
      if (option) option.dataset.state = input.checked ? "selected" : "unselected";
    });
  }

  private readonly handleChange = (event: Event): void => {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    if (!input?.matches("input[type='radio'][data-nyx-model-value]") || !this.element.contains(input)) return;
    this.setValue(input.value, "input");
  };
}

export function initModelSelectors(root: ParentNode = document): NyxModelSelector[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxModelSelector(element);
    instances.set(element, instance);
    return instance;
  });
}
