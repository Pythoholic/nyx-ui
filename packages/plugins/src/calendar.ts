import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { horizontalArrowDelta } from "./internal/direction.js";

type CalendarRowElement = HTMLTableSectionElement["rows"][number];

export interface NyxCalendarDate {
  day: number;
  month: number;
  year: number;
}

export interface NyxCalendarRange {
  end?: string;
  start?: string;
}

export type NyxCalendarSelectionMode = "range" | "single";
export type NyxCalendarValue = string | NyxCalendarRange | undefined;
export type NyxCalendarDisabledPredicate = (date: NyxCalendarDate, value: string) => boolean;

export interface NyxCalendarOptions {
  disabled?: NyxCalendarDisabledPredicate;
  locale?: string;
  max?: string;
  min?: string;
  selectionMode?: NyxCalendarSelectionMode;
  value?: NyxCalendarValue;
  weekStartsOn?: number;
}

export interface NyxCalendarSelectEventDetail {
  calendar: NyxCalendar;
  date: string;
  previousValue: NyxCalendarValue;
  value: NyxCalendarValue;
}

export interface NyxCalendarMonthEventDetail {
  calendar: NyxCalendar;
  month: string;
  previousMonth: string;
}

export interface NyxCalendarEventMap {
  "nyx:calendar:before-month-change": CustomEvent<NyxCalendarMonthEventDetail>;
  "nyx:calendar:month-change": CustomEvent<NyxCalendarMonthEventDetail>;
  "nyx:calendar:before-select": CustomEvent<NyxCalendarSelectEventDetail>;
  "nyx:calendar:select": CustomEvent<NyxCalendarSelectEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxCalendarEventMap {}
}

const calendarSelector = "[data-nyx-calendar]";
const instances = new WeakMap<HTMLElement, NyxCalendar>();
const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseCalendarDate(value: string): NyxCalendarDate | undefined {
  const match = isoPattern.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = { day, month, year };
  const normalized = fromEpochDay(toEpochDay(date));
  return compareCalendarDates(date, normalized) === 0 ? date : undefined;
}

export function formatCalendarDate(date: NyxCalendarDate): string {
  return `${String(date.year).padStart(4, "0")}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

export function compareCalendarDates(left: NyxCalendarDate, right: NyxCalendarDate): number {
  return toEpochDay(left) - toEpochDay(right);
}

function toEpochDay(date: NyxCalendarDate): number {
  const value = new Date(0);
  value.setUTCFullYear(date.year, date.month - 1, date.day);
  value.setUTCHours(0, 0, 0, 0);
  return Math.floor(value.getTime() / 86_400_000);
}

function fromEpochDay(value: number): NyxCalendarDate {
  const date = new Date(value * 86_400_000);
  return { day: date.getUTCDate(), month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}

function addDays(date: NyxCalendarDate, amount: number): NyxCalendarDate {
  return fromEpochDay(toEpochDay(date) + amount);
}

function addMonths(date: NyxCalendarDate, amount: number): NyxCalendarDate {
  const monthIndex = date.year * 12 + date.month - 1 + amount;
  const year = Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12 + 1;
  const followingMonth = month === 12 ? { day: 1, month: 1, year: year + 1 } : { day: 1, month: month + 1, year };
  const lastDay = toEpochDay(followingMonth) - toEpochDay({ day: 1, month, year });
  return { day: Math.min(date.day, lastDay), month, year };
}

function dayOfWeek(date: NyxCalendarDate): number {
  return ((toEpochDay(date) + 4) % 7 + 7) % 7;
}

function today(): NyxCalendarDate {
  const date = new Date();
  return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() };
}

function intlDate(date: NyxCalendarDate): Date {
  const value = new Date(0);
  value.setUTCFullYear(date.year, date.month - 1, date.day);
  value.setUTCHours(12, 0, 0, 0);
  return value;
}

function cloneValue(value: NyxCalendarValue): NyxCalendarValue {
  return value && typeof value === "object" ? { ...value } : value;
}

function defaultWeekStart(locale: string): number {
  try {
    const intlLocale = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const firstDay = intlLocale.getWeekInfo?.().firstDay ?? intlLocale.weekInfo?.firstDay;
    if (firstDay !== undefined) return firstDay % 7;
  } catch {
    // Invalid or unsupported locale metadata falls back to Sunday.
  }
  return 0;
}

function normalizeWeekStart(value: number): number {
  return ((Math.trunc(value) % 7) + 7) % 7;
}

export class NyxCalendar {
  readonly element: HTMLElement;
  readonly locale: string;
  readonly selectionMode: NyxCalendarSelectionMode;
  readonly weekStartsOn: number;

  private readonly announcer: HTMLElement;
  private readonly disabledPredicate: NyxCalendarDisabledPredicate | undefined;
  private readonly gridBody: HTMLTableSectionElement;
  private readonly heading: HTMLElement;
  private readonly max: NyxCalendarDate | undefined;
  private readonly min: NyxCalendarDate | undefined;
  private readonly nextButton: HTMLButtonElement;
  private readonly previousButton: HTMLButtonElement;
  private readonly valueInput: HTMLInputElement | undefined;
  private readonly weekdayRow: CalendarRowElement;
  private focusedDate: NyxCalendarDate;
  private monthDate: NyxCalendarDate;
  private selectedValue: NyxCalendarValue;

  constructor(element: HTMLElement, options: NyxCalendarOptions = {}) {
    this.element = element;
    this.locale = options.locale ?? element.dataset.nyxCalendarLocale ?? navigator.language ?? "en";
    this.selectionMode = options.selectionMode ?? (element.dataset.nyxCalendarSelection === "range" ? "range" : "single");
    const declaredWeekStart = options.weekStartsOn ?? Number(element.dataset.nyxCalendarWeekStart);
    this.weekStartsOn = Number.isFinite(declaredWeekStart) ? normalizeWeekStart(declaredWeekStart) : defaultWeekStart(this.locale);
    this.min = parseCalendarDate(options.min ?? element.dataset.nyxCalendarMin ?? "");
    this.max = parseCalendarDate(options.max ?? element.dataset.nyxCalendarMax ?? "");
    this.disabledPredicate = options.disabled;
    this.heading = this.required<HTMLElement>("[data-nyx-calendar-heading]");
    this.previousButton = this.required<HTMLButtonElement>("[data-nyx-calendar-previous]");
    this.nextButton = this.required<HTMLButtonElement>("[data-nyx-calendar-next]");
    this.weekdayRow = this.required<CalendarRowElement>("[data-nyx-calendar-weekdays]");
    this.gridBody = this.required<HTMLTableSectionElement>("[data-nyx-calendar-grid]");
    this.announcer = this.required<HTMLElement>("[data-nyx-calendar-announcer]");
    this.valueInput = element.querySelector<HTMLInputElement>("[data-nyx-calendar-value]") ?? undefined;

    const declaredValue = options.value !== undefined
      ? options.value
      : this.valueInput?.value || element.dataset.nyxCalendarValue;
    const normalizedValue = this.normalizeValue(declaredValue);
    const normalizedDates = typeof normalizedValue === "string" ? [normalizedValue] : [normalizedValue?.start, normalizedValue?.end].filter((item): item is string => Boolean(item));
    this.selectedValue = normalizedDates.some((item) => this.isDisabled(parseCalendarDate(item) ?? today())) ? undefined : normalizedValue;
    const selectedStart = typeof this.selectedValue === "string" ? this.selectedValue : this.selectedValue?.start;
    this.focusedDate = parseCalendarDate(selectedStart ?? "") ?? this.firstEnabled(today(), 1) ?? this.firstEnabled(today(), -1) ?? today();
    this.monthDate = { ...this.focusedDate, day: 1 };

    this.element.addEventListener("click", this.handleClick);
    this.element.addEventListener("keydown", this.handleKeydown);
    this.element.addEventListener("focusin", this.handleFocusIn);
    this.render();
  }

  get value(): NyxCalendarValue {
    return cloneValue(this.selectedValue);
  }

  set value(value: NyxCalendarValue) {
    const normalized = this.normalizeValue(value);
    const selectedDates = typeof normalized === "string" ? [normalized] : [normalized?.start, normalized?.end].filter((item): item is string => Boolean(item));
    this.selectedValue = selectedDates.some((item) => this.isDisabled(parseCalendarDate(item) ?? today())) ? undefined : normalized;
    const start = typeof this.selectedValue === "string" ? this.selectedValue : this.selectedValue?.start;
    const date = parseCalendarDate(start ?? "");
    if (date) {
      this.focusedDate = date;
      this.monthDate = { ...date, day: 1 };
    }
    this.render();
  }

  get focusedValue(): string {
    return formatCalendarDate(this.focusedDate);
  }

  isDateDisabled(value: string | NyxCalendarDate): boolean {
    const date = typeof value === "string" ? parseCalendarDate(value) : value;
    return !date || this.isDisabled(date);
  }

  focus(): void {
    this.buttonFor(this.focusedDate)?.focus();
  }

  showMonth(value: string | NyxCalendarDate): boolean {
    const date = typeof value === "string" ? parseCalendarDate(value) : value;
    if (!date) return false;
    return this.changeMonth({ ...date, day: 1 }, false);
  }

  select(value: string | NyxCalendarDate): boolean {
    const date = typeof value === "string" ? parseCalendarDate(value) : value;
    if (!date || this.isDisabled(date)) return false;
    const iso = formatCalendarDate(date);
    const previousValue = cloneValue(this.selectedValue);
    let nextValue: NyxCalendarValue;
    if (this.selectionMode === "single") nextValue = iso;
    else {
      const current = typeof this.selectedValue === "object" ? this.selectedValue : undefined;
      const start = current?.start;
      if (!start || current.end) nextValue = { start: iso };
      else nextValue = iso < start ? { end: start, start: iso } : { end: iso, start };
    }
    const detail: NyxCalendarSelectEventDetail = { calendar: this, date: iso, previousValue, value: cloneValue(nextValue) };
    if (!dispatchNyxEvent(this.element, "nyx:calendar:before-select", detail, true)) return false;
    this.selectedValue = nextValue;
    this.focusedDate = date;
    this.monthDate = { ...date, day: 1 };
    this.render();
    dispatchNyxEvent(this.element, "nyx:calendar:select", detail);
    return true;
  }

  destroy(): void {
    this.element.removeEventListener("click", this.handleClick);
    this.element.removeEventListener("keydown", this.handleKeydown);
    this.element.removeEventListener("focusin", this.handleFocusIn);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private required<T extends Element>(selector: string): T {
    const value = this.element.querySelector<T>(selector);
    if (!value) throw new Error(`NyxCalendar requires ${selector}.`);
    return value;
  }

  private normalizeValue(value: NyxCalendarValue): NyxCalendarValue {
    if (!value) return undefined;
    if (typeof value === "string") {
      if (this.selectionMode === "range" && value.includes("/")) {
        const [start, end] = value.split("/", 2);
        if (!start || !parseCalendarDate(start) || (end && !parseCalendarDate(end))) return undefined;
        return end ? { end, start } : { start };
      }
      return parseCalendarDate(value) ? value : undefined;
    }
    const start = value.start && parseCalendarDate(value.start) ? value.start : undefined;
    const end = value.end && parseCalendarDate(value.end) ? value.end : undefined;
    if (!start) return undefined;
    if (end && end < start) return { end: start, start: end };
    return end ? { end, start } : { start };
  }

  private isDisabled(date: NyxCalendarDate): boolean {
    if (this.min && compareCalendarDates(date, this.min) < 0) return true;
    if (this.max && compareCalendarDates(date, this.max) > 0) return true;
    return this.disabledPredicate?.(date, formatCalendarDate(date)) ?? false;
  }

  private firstEnabled(date: NyxCalendarDate, direction: 1 | -1, limit = 3_660): NyxCalendarDate | undefined {
    let candidate = date;
    for (let index = 0; index <= limit; index += 1) {
      if (!this.isDisabled(candidate)) return candidate;
      candidate = addDays(candidate, direction);
      if ((this.max && compareCalendarDates(candidate, this.max) > 0) || (this.min && compareCalendarDates(candidate, this.min) < 0)) break;
    }
    return undefined;
  }

  private enabledWithin(start: NyxCalendarDate, direction: 1 | -1, count: number): NyxCalendarDate | undefined {
    let candidate = start;
    for (let index = 0; index < count; index += 1) {
      if (!this.isDisabled(candidate)) return candidate;
      candidate = addDays(candidate, direction);
    }
    return undefined;
  }

  private buttonFor(date: NyxCalendarDate): HTMLButtonElement | null {
    return this.element.querySelector<HTMLButtonElement>(`[data-nyx-calendar-date="${formatCalendarDate(date)}"]`);
  }

  private render(): void {
    const monthFormatter = new Intl.DateTimeFormat(this.locale, { month: "long", timeZone: "UTC", year: "numeric" });
    const weekdayFormatter = new Intl.DateTimeFormat(this.locale, { timeZone: "UTC", weekday: "short" });
    const fullFormatter = new Intl.DateTimeFormat(this.locale, { dateStyle: "full", timeZone: "UTC" });
    this.heading.textContent = monthFormatter.format(intlDate(this.monthDate));

    const sunday = { day: 4, month: 1, year: 2026 };
    this.weekdayRow.innerHTML = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(sunday, (this.weekStartsOn + index) % 7);
      return `<th scope="col" role="columnheader"><abbr title="${fullFormatter.format(intlDate(date))}">${weekdayFormatter.format(intlDate(date))}</abbr></th>`;
    }).join("");

    const firstWeekday = dayOfWeek(this.monthDate);
    const offset = (firstWeekday - this.weekStartsOn + 7) % 7;
    const gridStart = addDays(this.monthDate, -offset);
    const todayValue = formatCalendarDate(today());
    const selected = typeof this.selectedValue === "string" ? { end: this.selectedValue, start: this.selectedValue } : this.selectedValue;
    const rows: string[] = [];
    for (let row = 0; row < 6; row += 1) {
      const cells: string[] = [];
      for (let column = 0; column < 7; column += 1) {
        const date = addDays(gridStart, row * 7 + column);
        const value = formatCalendarDate(date);
        const disabled = this.isDisabled(date);
        const outside = date.month !== this.monthDate.month;
        const isSelected = value === selected?.start || value === selected?.end;
        const inRange = Boolean(selected?.start && selected.end && value > selected.start && value < selected.end);
        const tabIndex = compareCalendarDates(date, this.focusedDate) === 0 && !disabled ? 0 : -1;
        cells.push(`<td role="gridcell" aria-selected="${isSelected}"${outside ? ' data-outside="true"' : ""}${inRange ? ' data-in-range="true"' : ""}><button type="button" data-nyx-calendar-date="${value}" aria-label="${fullFormatter.format(intlDate(date))}" aria-disabled="${disabled}" tabindex="${tabIndex}"${disabled ? " disabled" : ""}${value === todayValue ? ' aria-current="date"' : ""}>${date.day}</button></td>`);
      }
      rows.push(`<tr role="row">${cells.join("")}</tr>`);
    }
    this.gridBody.innerHTML = rows.join("");
    this.previousButton.disabled = Boolean(this.min && compareCalendarDates(addMonths(this.monthDate, -1), { ...this.min, day: 1 }) < 0);
    this.nextButton.disabled = Boolean(this.max && compareCalendarDates(addMonths(this.monthDate, 1), { ...this.max, day: 1 }) > 0);
    if (this.valueInput) this.valueInput.value = typeof this.selectedValue === "string" ? this.selectedValue : this.selectedValue?.start ? `${this.selectedValue.start}${this.selectedValue.end ? `/${this.selectedValue.end}` : ""}` : "";
  }

  private announce(date: NyxCalendarDate): void {
    this.announcer.textContent = new Intl.DateTimeFormat(this.locale, { dateStyle: "full", timeZone: "UTC" }).format(intlDate(date));
  }

  private moveFocus(target: NyxCalendarDate, direction: 1 | -1, focus = true): void {
    const enabled = this.firstEnabled(target, direction);
    if (!enabled) return;
    const monthChanged = enabled.month !== this.monthDate.month || enabled.year !== this.monthDate.year;
    if (monthChanged && !this.changeMonth({ ...enabled, day: 1 }, false)) return;
    this.focusedDate = enabled;
    this.render();
    this.announce(enabled);
    if (focus) this.buttonFor(enabled)?.focus();
  }

  private changeMonth(nextMonth: NyxCalendarDate, focus = true): boolean {
    const previousMonth = formatCalendarDate(this.monthDate).slice(0, 7);
    const month = formatCalendarDate(nextMonth).slice(0, 7);
    if (month === previousMonth) return true;
    const detail: NyxCalendarMonthEventDetail = { calendar: this, month, previousMonth };
    if (!dispatchNyxEvent(this.element, "nyx:calendar:before-month-change", detail, true)) return false;
    this.monthDate = { ...nextMonth, day: 1 };
    const target = addMonths(this.focusedDate, (nextMonth.year - this.focusedDate.year) * 12 + nextMonth.month - this.focusedDate.month);
    this.focusedDate = this.firstEnabled(target, month > previousMonth ? 1 : -1) ?? target;
    this.render();
    if (focus) this.buttonFor(this.focusedDate)?.focus();
    dispatchNyxEvent(this.element, "nyx:calendar:month-change", detail);
    return true;
  }

  private readonly handleClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-nyx-calendar-previous]")) {
      this.changeMonth(addMonths(this.monthDate, -1));
      return;
    }
    if (target.closest("[data-nyx-calendar-next]")) {
      this.changeMonth(addMonths(this.monthDate, 1));
      return;
    }
    const button = target.closest<HTMLButtonElement>("[data-nyx-calendar-date]");
    if (button?.dataset.nyxCalendarDate) this.select(button.dataset.nyxCalendarDate);
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.nyxCalendarDate) return;
    const date = parseCalendarDate(target.dataset.nyxCalendarDate);
    if (!date) return;
    this.focusedDate = date;
    this.announce(date);
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.nyxCalendarDate) return;
    const current = parseCalendarDate(target.dataset.nyxCalendarDate);
    if (!current) return;
    let next: NyxCalendarDate | undefined;
    let direction: 1 | -1 = 1;
    const horizontalDelta = horizontalArrowDelta(event.key, this.element);
    if (horizontalDelta !== 0) {
      next = addDays(current, horizontalDelta);
      direction = horizontalDelta;
    }
    else if (event.key === "ArrowDown") next = addDays(current, 7);
    else if (event.key === "ArrowUp") { next = addDays(current, -7); direction = -1; }
    else if (event.key === "Home") { next = this.enabledWithin(addDays(current, -((dayOfWeek(current) - this.weekStartsOn + 7) % 7)), 1, 7); direction = 1; }
    else if (event.key === "End") { next = this.enabledWithin(addDays(current, 6 - ((dayOfWeek(current) - this.weekStartsOn + 7) % 7)), -1, 7); direction = -1; }
    else if (event.key === "PageUp") { next = addMonths(current, event.shiftKey ? -12 : -1); direction = -1; }
    else if (event.key === "PageDown") next = addMonths(current, event.shiftKey ? 12 : 1);
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.select(current);
      return;
    } else return;
    event.preventDefault();
    if (!next) return;
    this.moveFocus(next, direction);
  };
}

export function initCalendars(root: ParentNode = document, options: NyxCalendarOptions = {}): NyxCalendar[] {
  return queryAllIncludingRoot<HTMLElement>(root, calendarSelector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxCalendar(element, options);
    instances.set(element, instance);
    return instance;
  });
}
