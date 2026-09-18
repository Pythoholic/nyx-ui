import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxParameterValue = string | number | boolean;
export type NyxParameterInspectorValue = Record<string, NyxParameterValue>;
export type NyxParameterInspectorReason = "api" | "input" | "reset";

export interface NyxParameterInspectorEventDetail {
  parameterInspector: NyxParameterInspector;
  previousValue: NyxParameterInspectorValue;
  reason: NyxParameterInspectorReason;
  value: NyxParameterInspectorValue;
}

export interface NyxParameterInspectorEventMap {
  "nyx:parameter-inspector:before-change": CustomEvent<NyxParameterInspectorEventDetail>;
  "nyx:parameter-inspector:change": CustomEvent<NyxParameterInspectorEventDetail>;
  "nyx:parameter-inspector:before-reset": CustomEvent<NyxParameterInspectorEventDetail>;
  "nyx:parameter-inspector:reset": CustomEvent<NyxParameterInspectorEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxParameterInspectorEventMap {}
}

type ParameterControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const selector = "[data-nyx-parameter-inspector]";
const controlSelector = "[data-nyx-parameter]";
const instances = new WeakMap<HTMLFormElement, NyxParameterInspector>();

function valuesEqual(left: NyxParameterInspectorValue, right: NyxParameterInspectorValue): boolean {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => left[key] === right[key]);
}

export class NyxParameterInspector {
  readonly element: HTMLFormElement;
  readonly defaults: NyxParameterInspectorValue;
  private acceptedValue: NyxParameterInspectorValue;

  constructor(element: HTMLFormElement) {
    this.element = element;
    this.acceptedValue = this.read();
    this.defaults = { ...this.acceptedValue };
    element.addEventListener("input", this.handleInput);
    element.addEventListener("change", this.handleInput);
    element.addEventListener("reset", this.handleReset);
    this.sync();
  }

  get controls(): ParameterControl[] {
    return Array.from(this.element.querySelectorAll<ParameterControl>(controlSelector)).filter(
      (control) => Boolean(control.name) && control.closest(selector) === this.element,
    );
  }

  get value(): NyxParameterInspectorValue {
    return this.read();
  }

  set value(value: NyxParameterInspectorValue) {
    this.setValue(value);
  }

  setValue(value: NyxParameterInspectorValue, reason: NyxParameterInspectorReason = "api"): boolean {
    const previousValue = { ...this.acceptedValue };
    const next = { ...previousValue, ...value };
    if (valuesEqual(previousValue, next)) {
      this.write(previousValue);
      this.sync();
      return false;
    }
    const detail = { parameterInspector: this, previousValue, reason, value: next };
    if (!dispatchNyxEvent(this.element, "nyx:parameter-inspector:before-change", detail, true)) {
      this.write(previousValue);
      this.sync();
      return false;
    }
    this.write(next);
    this.acceptedValue = this.read();
    this.sync();
    detail.value = this.value;
    dispatchNyxEvent(this.element, "nyx:parameter-inspector:change", detail);
    return true;
  }

  reset(reason: NyxParameterInspectorReason = "reset"): boolean {
    const previousValue = { ...this.acceptedValue };
    if (valuesEqual(previousValue, this.defaults)) return false;
    const detail = { parameterInspector: this, previousValue, reason, value: { ...this.defaults } };
    if (!dispatchNyxEvent(this.element, "nyx:parameter-inspector:before-reset", detail, true)) return false;
    this.write(this.defaults);
    this.acceptedValue = this.read();
    this.sync();
    detail.value = this.value;
    dispatchNyxEvent(this.element, "nyx:parameter-inspector:reset", detail);
    return true;
  }

  destroy(): void {
    this.element.removeEventListener("input", this.handleInput);
    this.element.removeEventListener("change", this.handleInput);
    this.element.removeEventListener("reset", this.handleReset);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private read(): NyxParameterInspectorValue {
    return Object.fromEntries(this.controls.map((control) => {
      if (control instanceof HTMLInputElement && control.type === "checkbox") return [control.name, control.checked];
      if (control instanceof HTMLInputElement && (control.type === "number" || control.type === "range")) {
        return [control.name, Number.isNaN(control.valueAsNumber) ? control.value : control.valueAsNumber];
      }
      return [control.name, control.value];
    }));
  }

  private write(value: NyxParameterInspectorValue): void {
    this.controls.forEach((control) => {
      if (!(control.name in value)) return;
      const next = value[control.name]!;
      if (control instanceof HTMLInputElement && control.type === "checkbox") control.checked = Boolean(next);
      else control.value = String(next);
    });
  }

  private sync(): void {
    const invalid = this.controls.some((control) => !control.checkValidity());
    const modified = !valuesEqual(this.value, this.defaults);
    this.element.dataset.state = invalid ? "invalid" : modified ? "modified" : "pristine";
    this.element.toggleAttribute("data-invalid", invalid);
    this.controls.forEach((control) => {
      const controlInvalid = !control.checkValidity();
      control.setAttribute("aria-invalid", String(controlInvalid));
      const output = Array.from(this.element.querySelectorAll<HTMLOutputElement>("[data-nyx-parameter-output]"))
        .find((candidate) => candidate.dataset.nyxParameterOutput === control.name);
      if (output) output.value = String(this.readControl(control));
    });
    const reset = this.element.querySelector<HTMLButtonElement>("[data-nyx-parameter-reset]");
    if (reset) reset.disabled = !modified;
  }

  private readControl(control: ParameterControl): NyxParameterValue {
    if (control instanceof HTMLInputElement && control.type === "checkbox") return control.checked;
    if (control instanceof HTMLInputElement && (control.type === "number" || control.type === "range")) {
      return Number.isNaN(control.valueAsNumber) ? control.value : control.valueAsNumber;
    }
    return control.value;
  }

  private readonly handleInput = (event: Event): void => {
    const control = event.target instanceof Element ? event.target.closest<ParameterControl>(controlSelector) : null;
    if (!control || control.closest(selector) !== this.element) return;
    const next = this.read();
    if (valuesEqual(next, this.acceptedValue)) return;
    this.setValue(next, "input");
  };

  private readonly handleReset = (event: Event): void => {
    event.preventDefault();
    this.reset();
  };
}

export function initParameterInspectors(root: ParentNode = document): NyxParameterInspector[] {
  return queryAllIncludingRoot<HTMLFormElement>(root, selector).map((element) => {
    if (!(element instanceof HTMLFormElement)) throw new Error("data-nyx-parameter-inspector must be placed on a form element.");
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxParameterInspector(element);
    instances.set(element, instance);
    return instance;
  });
}
