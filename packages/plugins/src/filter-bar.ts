import { moveFocusTo } from "./internal/focus.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxFilterBarReason = "api" | "change" | "clear" | "remove";
export type NyxFilterBarValue = Record<string, string[]>;

export interface NyxFilterBarEventDetail {
  control?: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  filterBar: NyxFilterBar;
  previousValue: NyxFilterBarValue;
  reason: NyxFilterBarReason;
  value: NyxFilterBarValue;
}

export interface NyxFilterBarEventMap {
  "nyx:filter-bar:before-change": CustomEvent<NyxFilterBarEventDetail>;
  "nyx:filter-bar:change": CustomEvent<NyxFilterBarEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxFilterBarEventMap {}
}

type FilterControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const selector = "[data-nyx-filter-bar]";
const instances = new WeakMap<HTMLElement, NyxFilterBar>();

function cloneValue(value: NyxFilterBarValue): NyxFilterBarValue {
  return Object.fromEntries(Object.entries(value).map(([name, values]) => [name, [...values]]));
}

function equalValues(left: NyxFilterBarValue, right: NyxFilterBarValue): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length && leftKeys.every((key) => {
    const leftValues = left[key] ?? [];
    const rightValues = right[key] ?? [];
    return leftValues.length === rightValues.length && leftValues.every((value, index) => value === rightValues[index]);
  });
}

export class NyxFilterBar {
  readonly element: HTMLElement;

  private readonly active: HTMLElement | undefined;
  private readonly clearButton: HTMLButtonElement | undefined;
  private readonly controls: FilterControl[];
  private readonly count: HTMLElement | undefined;
  private committed: NyxFilterBarValue;

  constructor(element: HTMLElement) {
    this.element = element;
    this.controls = Array.from(element.querySelectorAll<FilterControl>("input[name], select[name], textarea[name]")).filter(
      (control) => control.closest(selector) === element && !control.disabled && !["button", "reset", "submit"].includes(control instanceof HTMLInputElement ? control.type : ""),
    );
    this.active = element.querySelector<HTMLElement>("[data-nyx-filter-bar-active]") ?? undefined;
    this.count = element.querySelector<HTMLElement>("[data-nyx-filter-bar-count]") ?? undefined;
    this.clearButton = element.querySelector<HTMLButtonElement>("[data-nyx-filter-bar-clear]") ?? undefined;
    this.committed = this.readControls();
    element.addEventListener("input", this.handleControlChange);
    element.addEventListener("change", this.handleControlChange);
    element.addEventListener("click", this.handleClick);
    this.sync();
  }

  get value(): NyxFilterBarValue {
    return cloneValue(this.committed);
  }

  set value(value: NyxFilterBarValue) {
    this.setValue(value);
  }

  setValue(value: NyxFilterBarValue, reason: NyxFilterBarReason = "api"): boolean {
    return this.request(value, reason);
  }

  clear(): boolean {
    return this.request({}, "clear");
  }

  remove(name: string, value: string): boolean {
    const next = this.value;
    const values = (next[name] ?? []).filter((candidate) => candidate !== value);
    if (values.length) next[name] = values;
    else delete next[name];
    return this.request(next, "remove");
  }

  destroy(): void {
    this.element.removeEventListener("input", this.handleControlChange);
    this.element.removeEventListener("change", this.handleControlChange);
    this.element.removeEventListener("click", this.handleClick);
    this.active?.replaceChildren();
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private request(value: NyxFilterBarValue, reason: NyxFilterBarReason, control?: FilterControl): boolean {
    const previousValue = this.value;
    this.writeControls(value);
    const normalized = this.readControls();
    this.writeControls(previousValue);
    if (equalValues(previousValue, normalized)) return false;
    const detail: NyxFilterBarEventDetail = {
      ...(control ? { control } : {}),
      filterBar: this,
      previousValue,
      reason,
      value: cloneValue(normalized),
    };
    if (!dispatchNyxEvent(this.element, "nyx:filter-bar:before-change", detail, true)) return false;
    this.writeControls(normalized);
    this.committed = normalized;
    this.sync();
    dispatchNyxEvent(this.element, "nyx:filter-bar:change", detail);
    return true;
  }

  private readControls(): NyxFilterBarValue {
    const value: NyxFilterBarValue = {};
    this.controls.forEach((control) => {
      const name = control.name;
      let values: string[];
      if (control instanceof HTMLSelectElement && control.multiple) {
        values = Array.from(control.selectedOptions).map((option) => option.value).filter(Boolean);
      } else if (control instanceof HTMLInputElement && ["checkbox", "radio"].includes(control.type)) {
        values = control.checked && control.value ? [control.value] : [];
      } else {
        values = control.value.trim() ? [control.value.trim()] : [];
      }
      if (values.length) value[name] = [...(value[name] ?? []), ...values];
    });
    return value;
  }

  private writeControls(value: NyxFilterBarValue): void {
    this.controls.forEach((control) => {
      const values = value[control.name] ?? [];
      if (control instanceof HTMLSelectElement && control.multiple) {
        Array.from(control.options).forEach((option) => { option.selected = values.includes(option.value); });
      } else if (control instanceof HTMLInputElement && ["checkbox", "radio"].includes(control.type)) {
        control.checked = values.includes(control.value);
      } else {
        control.value = values[0] ?? "";
      }
    });
  }

  private sync(): void {
    const entries = Object.entries(this.committed).flatMap(([name, values]) => values.map((value) => ({ name, value })));
    this.element.dataset.state = entries.length ? "active" : "inactive";
    if (this.count) this.count.textContent = `${entries.length} active ${entries.length === 1 ? "filter" : "filters"}`;
    if (this.clearButton) {
      if (!entries.length) moveFocusTo(this.clearButton, this.controls[0] ?? this.element);
      this.clearButton.disabled = entries.length === 0;
      this.clearButton.setAttribute("aria-disabled", String(this.clearButton.disabled));
    }
    if (!this.active) return;
    const chips = entries.map(({ name, value }) => {
      const chip = document.createElement("span");
      chip.className = "nyx-filter-chip nyx-motion-fade";
      const control = this.controls.find((candidate) => candidate.name === name && (!(candidate instanceof HTMLInputElement) || !["checkbox", "radio"].includes(candidate.type) || candidate.value === value));
      const label = control?.dataset.nyxFilterLabel ?? name;
      const displayValue = control instanceof HTMLSelectElement
        ? Array.from(control.options).find((option) => option.value === value)?.textContent?.trim() ?? value
        : value;
      const text = document.createElement("span");
      text.textContent = `${label}: ${displayValue}`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.nyxFilterRemove = name;
      remove.dataset.nyxFilterValue = value;
      remove.setAttribute("aria-label", `Remove ${label}: ${displayValue}`);
      remove.textContent = "×";
      chip.append(text, remove);
      return chip;
    });
    moveFocusTo(this.active, this.controls[0] ?? this.element);
    this.active.replaceChildren(...chips);
  }

  private readonly handleControlChange = (event: Event): void => {
    const control = event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement
      ? event.target
      : undefined;
    if (!control || !this.controls.includes(control)) return;
    const next = this.readControls();
    this.writeControls(this.committed);
    this.request(next, "change", control);
  };

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("button");
    if (!button || button.closest(selector) !== this.element || button.disabled) return;
    if (button.hasAttribute("data-nyx-filter-bar-clear")) {
      this.clear();
      return;
    }
    const name = button.dataset.nyxFilterRemove;
    const value = button.dataset.nyxFilterValue;
    if (name !== undefined && value !== undefined) this.remove(name, value);
  };
}

export function initFilterBars(root: ParentNode = document): NyxFilterBar[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxFilterBar(element);
    instances.set(element, instance);
    return instance;
  });
}
