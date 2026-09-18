import {
  initCalendars,
  parseCalendarDate,
  type NyxCalendar,
  type NyxCalendarOptions,
  type NyxCalendarRange,
  type NyxCalendarSelectEventDetail,
  type NyxCalendarValue,
} from "./calendar.js";
import { NyxOverlayDismissal, type NyxOverlayDismissReason } from "./internal/dismissal.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { positionOverlay, type NyxOverlayPlacement } from "./internal/positioning.js";

export interface NyxDatePickerOptions extends NyxCalendarOptions {
  placement?: NyxOverlayPlacement;
}

export interface NyxDatePickerChangeEventDetail {
  datePicker: NyxDatePicker;
  previousValue: NyxCalendarValue;
  reason: "calendar" | "clear" | "input";
  value: NyxCalendarValue;
}

export interface NyxDatePickerOpenEventDetail {
  datePicker: NyxDatePicker;
  reason?: NyxOverlayDismissReason | "api" | "selection" | "trigger";
}

export interface NyxDatePickerEventMap {
  "nyx:date-picker:before-change": CustomEvent<NyxDatePickerChangeEventDetail>;
  "nyx:date-picker:change": CustomEvent<NyxDatePickerChangeEventDetail>;
  "nyx:date-picker:before-open": CustomEvent<NyxDatePickerOpenEventDetail>;
  "nyx:date-picker:open": CustomEvent<NyxDatePickerOpenEventDetail>;
  "nyx:date-picker:before-close": CustomEvent<NyxDatePickerOpenEventDetail>;
  "nyx:date-picker:close": CustomEvent<NyxDatePickerOpenEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxDatePickerEventMap {}
}

const pickerSelector = "[data-nyx-date-picker]";
const instances = new WeakMap<HTMLElement, NyxDatePicker>();

function cloneValue(value: NyxCalendarValue): NyxCalendarValue {
  return value && typeof value === "object" ? { ...value } : value;
}

function equalValues(left: NyxCalendarValue, right: NyxCalendarValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parseInputValue(value: string, range: boolean): NyxCalendarValue | null {
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (!range) return parseCalendarDate(normalized) ? normalized : null;
  const parts = normalized.split(/\s*(?:\/|–|—)\s*/).filter(Boolean);
  if (parts.length < 1 || parts.length > 2 || parts.some((part) => !parseCalendarDate(part))) return null;
  const start = parts[0];
  const end = parts[1];
  if (!start) return null;
  if (!end) return { start };
  return end < start ? { end: start, start: end } : { end, start };
}

function formatInputValue(value: NyxCalendarValue): string {
  if (typeof value === "string") return value;
  if (!value?.start) return "";
  return `${value.start}${value.end ? ` / ${value.end}` : ""}`;
}

export class NyxDatePicker {
  readonly calendar: NyxCalendar;
  readonly element: HTMLElement;
  readonly input: HTMLInputElement;
  readonly popover: HTMLElement;
  readonly trigger: HTMLButtonElement;

  private readonly dismissal: NyxOverlayDismissal;
  private readonly error: HTMLElement | undefined;
  private readonly placement: NyxOverlayPlacement;
  private stopPositioning: (() => void) | undefined;

  constructor(element: HTMLElement, options: NyxDatePickerOptions = {}) {
    this.element = element;
    this.input = this.required<HTMLInputElement>("[data-nyx-date-picker-input]");
    this.trigger = this.required<HTMLButtonElement>("[data-nyx-date-picker-trigger]");
    this.popover = this.required<HTMLElement>("[data-nyx-date-picker-popover]");
    this.error = element.querySelector<HTMLElement>("[data-nyx-date-picker-error]") ?? undefined;
    const calendarElement = this.required<HTMLElement>("[data-nyx-calendar]");
    this.calendar = initCalendars(calendarElement, options)[0] ?? (() => { throw new Error("NyxDatePicker could not initialize its Calendar."); })();
    this.placement = options.placement ?? (element.dataset.nyxDatePickerPlacement as NyxOverlayPlacement | undefined) ?? "bottom-start";
    this.dismissal = new NyxOverlayDismissal({ element, onDismiss: (reason) => this.close(reason) });

    if (!this.popover.id) this.popover.id = `nyx-date-picker-${Math.random().toString(36).slice(2)}`;
    this.trigger.setAttribute("aria-controls", this.popover.id);
    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.setAttribute("aria-haspopup", "dialog");
    this.input.setAttribute("aria-controls", this.popover.id);
    this.input.setAttribute("aria-haspopup", "dialog");
    this.syncInput(this.calendar.value);

    this.trigger.addEventListener("click", this.handleTriggerClick);
    this.input.addEventListener("change", this.handleInputChange);
    this.input.addEventListener("keydown", this.handleInputKeydown);
    calendarElement.addEventListener("nyx:calendar:before-select", this.handleBeforeCalendarSelect);
    calendarElement.addEventListener("nyx:calendar:select", this.handleCalendarSelect);
  }

  get openState(): boolean {
    return !this.popover.hidden;
  }

  get value(): NyxCalendarValue {
    return this.calendar.value;
  }

  set value(value: NyxCalendarValue) {
    this.calendar.value = value;
    this.syncInput(this.calendar.value);
  }

  open(reason: NyxDatePickerOpenEventDetail["reason"] = "api", focusCalendar = false): boolean {
    if (this.openState) {
      if (focusCalendar) this.calendar.focus();
      return true;
    }
    const detail: NyxDatePickerOpenEventDetail = { datePicker: this, reason };
    if (!dispatchNyxEvent(this.element, "nyx:date-picker:before-open", detail, true)) return false;
    this.popover.hidden = false;
    this.trigger.setAttribute("aria-expanded", "true");
    this.stopPositioning = positionOverlay(this.trigger, this.popover, { placement: this.placement });
    this.dismissal.activate();
    dispatchNyxEvent(this.element, "nyx:date-picker:open", detail);
    if (focusCalendar) this.calendar.focus();
    return true;
  }

  close(reason: NyxDatePickerOpenEventDetail["reason"] = "api"): boolean {
    if (!this.openState) return true;
    const detail: NyxDatePickerOpenEventDetail = { datePicker: this, reason };
    if (!dispatchNyxEvent(this.element, "nyx:date-picker:before-close", detail, reason !== "api")) return false;
    this.dismissal.deactivate();
    this.stopPositioning?.();
    this.stopPositioning = undefined;
    this.popover.hidden = true;
    this.trigger.setAttribute("aria-expanded", "false");
    if (reason === "escape" || reason === "selection") this.trigger.focus();
    dispatchNyxEvent(this.element, "nyx:date-picker:close", detail);
    return true;
  }

  destroy(): void {
    this.close("api");
    this.dismissal.destroy();
    this.trigger.removeEventListener("click", this.handleTriggerClick);
    this.input.removeEventListener("change", this.handleInputChange);
    this.input.removeEventListener("keydown", this.handleInputKeydown);
    this.calendar.element.removeEventListener("nyx:calendar:before-select", this.handleBeforeCalendarSelect);
    this.calendar.element.removeEventListener("nyx:calendar:select", this.handleCalendarSelect);
    this.calendar.destroy();
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private required<T extends Element>(selector: string): T {
    const value = this.element.querySelector<T>(selector);
    if (!value) throw new Error(`NyxDatePicker requires ${selector}.`);
    return value;
  }

  private syncInput(value: NyxCalendarValue): void {
    this.input.value = formatInputValue(value);
    this.input.removeAttribute("aria-invalid");
    if (this.error) this.error.textContent = "";
  }

  private requestValue(value: NyxCalendarValue, reason: NyxDatePickerChangeEventDetail["reason"]): boolean {
    const previousValue = cloneValue(this.calendar.value);
    if (equalValues(value, previousValue)) {
      this.syncInput(previousValue);
      return true;
    }
    const dates = typeof value === "string" ? [value] : [value?.start, value?.end].filter((item): item is string => Boolean(item));
    if (dates.some((date) => this.calendar.isDateDisabled(date))) {
      this.input.setAttribute("aria-invalid", "true");
      if (this.error) this.error.textContent = "That date is unavailable.";
      return false;
    }
    const detail: NyxDatePickerChangeEventDetail = { datePicker: this, previousValue, reason, value: cloneValue(value) };
    if (!dispatchNyxEvent(this.element, "nyx:date-picker:before-change", detail, true)) {
      this.syncInput(previousValue);
      return false;
    }
    this.calendar.value = value;
    this.syncInput(this.calendar.value);
    dispatchNyxEvent(this.element, "nyx:date-picker:change", detail);
    return true;
  }

  private readonly handleTriggerClick = (): void => {
    if (this.openState) this.close("trigger");
    else this.open("trigger", true);
  };

  private readonly handleInputKeydown = (event: KeyboardEvent): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.open("trigger", true);
    } else if (event.key === "Escape" && this.openState) {
      event.preventDefault();
      this.close("escape");
    }
  };

  private readonly handleInputChange = (): void => {
    const parsed = parseInputValue(this.input.value, this.calendar.selectionMode === "range");
    if (parsed === null) {
      this.input.setAttribute("aria-invalid", "true");
      if (this.error) this.error.textContent = this.calendar.selectionMode === "range" ? "Enter YYYY-MM-DD / YYYY-MM-DD." : "Enter a date as YYYY-MM-DD.";
      return;
    }
    this.requestValue(parsed, parsed ? "input" : "clear");
  };

  private readonly handleBeforeCalendarSelect = (event: CustomEvent<NyxCalendarSelectEventDetail>): void => {
    const detail: NyxDatePickerChangeEventDetail = {
      datePicker: this,
      previousValue: cloneValue(event.detail.previousValue),
      reason: "calendar",
      value: cloneValue(event.detail.value),
    };
    if (!dispatchNyxEvent(this.element, "nyx:date-picker:before-change", detail, true)) event.preventDefault();
  };

  private readonly handleCalendarSelect = (event: CustomEvent<NyxCalendarSelectEventDetail>): void => {
    this.syncInput(event.detail.value);
    const detail: NyxDatePickerChangeEventDetail = {
      datePicker: this,
      previousValue: cloneValue(event.detail.previousValue),
      reason: "calendar",
      value: cloneValue(event.detail.value),
    };
    dispatchNyxEvent(this.element, "nyx:date-picker:change", detail);
    const range = event.detail.value as NyxCalendarRange | undefined;
    if (this.calendar.selectionMode === "single" || (range?.start && range.end)) this.close("selection");
  };
}

export function initDatePickers(root: ParentNode = document, options: NyxDatePickerOptions = {}): NyxDatePicker[] {
  return queryAllIncludingRoot<HTMLElement>(root, pickerSelector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxDatePicker(element, options);
    instances.set(element, instance);
    return instance;
  });
}
