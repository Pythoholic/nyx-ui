import { moveFocusTo } from "./internal/focus.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { isDisabledItem, NyxRovingFocus } from "./internal/roving-focus.js";

export type NyxBulkActionChangeReason = "api" | "clear" | "control" | "select-all";
export type NyxBulkActionRunReason = "api" | "control";

export interface NyxBulkActionChangeEventDetail {
  bulkActionToolbar: NyxBulkActionToolbar;
  control?: HTMLInputElement;
  previousValue: string[];
  reason: NyxBulkActionChangeReason;
  value: string[];
}

export interface NyxBulkActionRunEventDetail {
  action: HTMLButtonElement;
  bulkActionToolbar: NyxBulkActionToolbar;
  reason: NyxBulkActionRunReason;
  selection: string[];
  value: string;
}

export interface NyxBulkActionToolbarEventMap {
  "nyx:bulk-action-toolbar:before-change": CustomEvent<NyxBulkActionChangeEventDetail>;
  "nyx:bulk-action-toolbar:change": CustomEvent<NyxBulkActionChangeEventDetail>;
  "nyx:bulk-action-toolbar:before-run": CustomEvent<NyxBulkActionRunEventDetail>;
  "nyx:bulk-action-toolbar:run": CustomEvent<NyxBulkActionRunEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxBulkActionToolbarEventMap {}
}

const selector = "[data-nyx-bulk-action-toolbar]";
const selectionSelector = "input[data-nyx-bulk-select]";
const instances = new WeakMap<HTMLElement, NyxBulkActionToolbar>();
let generatedActionId = 0;

function equalValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export class NyxBulkActionToolbar {
  readonly element: HTMLElement;

  private readonly count: HTMLElement | undefined;
  private readonly authoredDisabled = new WeakMap<HTMLElement, boolean>();
  private readonly selectAll: HTMLInputElement | undefined;
  private readonly toolbar: HTMLElement;
  private committed: string[];
  private rovingFocus: NyxRovingFocus;

  constructor(element: HTMLElement) {
    this.element = element;
    this.toolbar = element.querySelector<HTMLElement>("[data-nyx-bulk-toolbar]") ?? element;
    this.count = element.querySelector<HTMLElement>("[data-nyx-bulk-count]") ?? undefined;
    this.selectAll = element.querySelector<HTMLInputElement>("input[data-nyx-bulk-select-all]") ?? undefined;
    this.toolbar.setAttribute("role", "toolbar");
    this.toolbar.setAttribute("aria-orientation", "horizontal");
    this.prepareActions();
    this.committed = this.readSelection();
    this.rovingFocus = new NyxRovingFocus(this.toolbarControls, "horizontal");
    element.addEventListener("change", this.handleChange);
    element.addEventListener("click", this.handleClick);
    this.toolbar.addEventListener("focusin", this.handleFocusIn);
    this.toolbar.addEventListener("keydown", this.handleKeydown);
    this.sync();
  }

  get selections(): HTMLInputElement[] {
    return Array.from(this.element.querySelectorAll<HTMLInputElement>(selectionSelector)).filter(
      (control) => control.closest(selector) === this.element && !control.disabled && Boolean(control.value),
    );
  }

  get value(): string[] {
    return [...this.committed];
  }

  set value(value: readonly string[]) {
    this.setValue(value);
  }

  setValue(value: readonly string[], reason: NyxBulkActionChangeReason = "api"): boolean {
    const allowed = new Set(value);
    const normalized = this.selections.filter((control) => allowed.has(control.value)).map((control) => control.value);
    return this.request(normalized, reason);
  }

  clear(): boolean {
    return this.request([], "clear");
  }

  run(actionOrValue: HTMLButtonElement | string, reason: NyxBulkActionRunReason = "api"): boolean {
    const action = this.resolveAction(actionOrValue);
    if (!action || isDisabledItem(action) || this.committed.length === 0) return false;
    const value = action.dataset.nyxBulkAction!;
    const detail: NyxBulkActionRunEventDetail = {
      action,
      bulkActionToolbar: this,
      reason,
      selection: this.value,
      value,
    };
    if (!dispatchNyxEvent(this.element, "nyx:bulk-action-toolbar:before-run", detail, true)) return false;
    this.rovingFocus.setCurrent(action);
    this.sync();
    dispatchNyxEvent(this.element, "nyx:bulk-action-toolbar:run", detail);
    return true;
  }

  refresh(): void {
    this.prepareActions();
    this.committed = this.readSelection();
    this.rovingFocus = new NyxRovingFocus(this.toolbarControls, "horizontal");
    this.sync();
  }

  destroy(): void {
    this.element.removeEventListener("change", this.handleChange);
    this.element.removeEventListener("click", this.handleClick);
    this.toolbar.removeEventListener("focusin", this.handleFocusIn);
    this.toolbar.removeEventListener("keydown", this.handleKeydown);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private get actions(): HTMLButtonElement[] {
    return Array.from(this.toolbar.querySelectorAll<HTMLButtonElement>("button[data-nyx-bulk-action]")).filter(
      (action) => action.closest(selector) === this.element,
    );
  }

  private get toolbarControls(): HTMLElement[] {
    return Array.from(this.toolbar.querySelectorAll<HTMLElement>("[data-nyx-bulk-action], [data-nyx-bulk-clear]")).filter(
      (control) => control.closest(selector) === this.element,
    );
  }

  private prepareActions(): void {
    this.actions.forEach((action) => {
      if (!action.dataset.nyxBulkAction) action.dataset.nyxBulkAction = `nyx-bulk-action-${++generatedActionId}`;
    });
    this.toolbarControls.forEach((control) => {
      if (!this.authoredDisabled.has(control)) this.authoredDisabled.set(control, isDisabledItem(control));
    });
  }

  private readSelection(): string[] {
    return this.selections.filter((control) => control.checked).map((control) => control.value);
  }

  private writeSelection(value: readonly string[]): void {
    const selected = new Set(value);
    this.selections.forEach((control) => { control.checked = selected.has(control.value); });
  }

  private request(value: readonly string[], reason: NyxBulkActionChangeReason, control?: HTMLInputElement): boolean {
    const previousValue = this.value;
    const selected = new Set(value);
    const normalized = this.selections.filter((candidate) => selected.has(candidate.value)).map((candidate) => candidate.value);
    if (equalValues(previousValue, normalized)) {
      this.writeSelection(previousValue);
      this.sync();
      return false;
    }
    const detail: NyxBulkActionChangeEventDetail = {
      bulkActionToolbar: this,
      ...(control ? { control } : {}),
      previousValue,
      reason,
      value: [...normalized],
    };
    this.writeSelection(previousValue);
    this.sync();
    if (!dispatchNyxEvent(this.element, "nyx:bulk-action-toolbar:before-change", detail, true)) {
      return false;
    }
    this.writeSelection(normalized);
    this.committed = normalized;
    this.sync();
    dispatchNyxEvent(this.element, "nyx:bulk-action-toolbar:change", detail);
    return true;
  }

  private resolveAction(actionOrValue: HTMLButtonElement | string): HTMLButtonElement | undefined {
    if (typeof actionOrValue !== "string") {
      return actionOrValue.matches("[data-nyx-bulk-action]") && actionOrValue.closest(selector) === this.element
        ? actionOrValue
        : undefined;
    }
    return this.actions.find((action) => action.dataset.nyxBulkAction === actionOrValue);
  }

  private sync(): void {
    const selected = new Set(this.committed);
    this.selections.forEach((control) => {
      const checked = selected.has(control.value);
      control.checked = checked;
      control.dataset.state = checked ? "checked" : "unchecked";
      control.setAttribute("aria-checked", String(checked));
      control.closest<HTMLElement>("[data-nyx-bulk-item]")?.toggleAttribute("data-selected", checked);
    });
    const active = this.committed.length > 0;
    this.element.dataset.state = active ? "active" : "inactive";
    this.toolbar.dataset.state = active ? "active" : "inactive";
    if (!this.element.hasAttribute("data-nyx-bulk-persistent")) {
      if (!active) moveFocusTo(this.toolbar, this.selectAll ?? this.selections[0] ?? this.element);
      this.toolbar.hidden = !active;
    }
    if (this.count) this.count.textContent = `${this.committed.length} selected`;
    if (this.selectAll) {
      const total = this.selections.length;
      this.selectAll.checked = total > 0 && this.committed.length === total;
      this.selectAll.indeterminate = this.committed.length > 0 && this.committed.length < total;
      this.selectAll.disabled = total === 0;
      this.selectAll.dataset.state = this.selectAll.indeterminate ? "mixed" : this.selectAll.checked ? "checked" : "unchecked";
      this.selectAll.setAttribute("aria-checked", this.selectAll.indeterminate ? "mixed" : String(this.selectAll.checked));
      this.selectAll.setAttribute("aria-disabled", String(this.selectAll.disabled));
    }
    this.toolbarControls.forEach((control) => {
      const disabled = !active || this.authoredDisabled.get(control) === true;
      if (control instanceof HTMLButtonElement) control.disabled = disabled;
      control.setAttribute("aria-disabled", String(disabled));
      control.dataset.state = disabled ? "disabled" : control.tabIndex === 0 ? "current" : "idle";
    });
  }

  private readonly handleChange = (event: Event): void => {
    const control = event.target instanceof HTMLInputElement ? event.target : null;
    if (!control || control.closest(selector) !== this.element) return;
    if (control === this.selectAll) {
      const value = control.checked ? this.selections.map((selection) => selection.value) : [];
      this.request(value, "select-all", control);
      return;
    }
    if (!control.matches(selectionSelector) || control.disabled) return;
    const next = this.readSelection();
    this.request(next, "control", control);
  };

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("button");
    if (!button || button.closest(selector) !== this.element || button.disabled) return;
    if (button.hasAttribute("data-nyx-bulk-clear")) {
      if (this.clear() && this.toolbar.hidden) (this.selectAll ?? this.selections[0])?.focus();
      return;
    }
    if (button.hasAttribute("data-nyx-bulk-action") && !this.run(button, "control")) event.preventDefault();
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const control = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>("[data-nyx-bulk-action], [data-nyx-bulk-clear]") : null;
    if (!control || control.closest(selector) !== this.element || isDisabledItem(control)) return;
    this.rovingFocus.setCurrent(control);
    this.sync();
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    const control = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>("[data-nyx-bulk-action], [data-nyx-bulk-clear]") : null;
    if (!control || control.closest(selector) !== this.element) return;
    if (this.rovingFocus.handleKeydown(event)) this.sync();
  };
}

export function initBulkActionToolbars(root: ParentNode = document): NyxBulkActionToolbar[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxBulkActionToolbar(element);
    instances.set(element, instance);
    return instance;
  });
}
