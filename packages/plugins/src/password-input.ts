import { acquireValidation } from "./internal/validation.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxPasswordChangeReason = "api" | "input";
export type NyxPasswordStrength = "empty" | "fair" | "good" | "strong" | "weak";
export type NyxPasswordVisibilityReason = "api" | "toggle";

export interface NyxPasswordChangeEventDetail {
  passwordInput: NyxPasswordInput;
  previousValue: string;
  reason: NyxPasswordChangeReason;
  score: number;
  strength: NyxPasswordStrength;
  value: string;
}

export interface NyxPasswordVisibilityEventDetail {
  passwordInput: NyxPasswordInput;
  reason: NyxPasswordVisibilityReason;
  visible: boolean;
}

export interface NyxPasswordEventMap {
  "nyx:password:before-change": CustomEvent<NyxPasswordChangeEventDetail>;
  "nyx:password:change": CustomEvent<NyxPasswordChangeEventDetail>;
  "nyx:password:before-hide": CustomEvent<NyxPasswordVisibilityEventDetail>;
  "nyx:password:before-show": CustomEvent<NyxPasswordVisibilityEventDetail>;
  "nyx:password:hide": CustomEvent<NyxPasswordVisibilityEventDetail>;
  "nyx:password:show": CustomEvent<NyxPasswordVisibilityEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxPasswordEventMap {}
}

const selector = "[data-nyx-password]";
const instances = new WeakMap<HTMLElement, NyxPasswordInput>();
let generatedId = 0;

export function scorePassword(value: string, minimumLength = 8): number {
  if (!value) return 0;
  let score = 1;
  if (value.length >= minimumLength) score += 1;
  if (value.length >= Math.max(12, minimumLength + 4)) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^\p{L}\p{N}\s]/u.test(value)) score += 1;
  return Math.min(4, score);
}

function strengthFor(score: number): NyxPasswordStrength {
  return (["empty", "weak", "fair", "good", "strong"] as const)[score] ?? "empty";
}

export class NyxPasswordInput {
  readonly element: HTMLElement;
  readonly input: HTMLInputElement;
  readonly meter: HTMLMeterElement;
  readonly status: HTMLElement;
  readonly toggleButton: HTMLButtonElement;

  private acceptedValue: string;

  private readonly validation: ReturnType<typeof acquireValidation>;

  constructor(element: HTMLElement) {
    this.element = element;
    const input = element.querySelector<HTMLInputElement>("[data-nyx-password-control]");
    const toggleButton = element.querySelector<HTMLButtonElement>("[data-nyx-password-toggle]");
    const meter = element.querySelector<HTMLMeterElement>("[data-nyx-password-meter]");
    const status = element.querySelector<HTMLElement>("[data-nyx-password-status]");
    if (!input || input.type !== "password" || !toggleButton || !meter || !status) {
      throw new Error("NyxPasswordInput requires a password input, toggle button, meter, and status.");
    }
    this.input = input;
    this.validation = acquireValidation(input);
    input.form?.addEventListener("reset", this.handleFormReset);
    this.toggleButton = toggleButton;
    this.meter = meter;
    this.status = status;
    if (!input.id) input.id = `nyx-password-${++generatedId}`;
    if (!status.id) status.id = `nyx-password-status-${++generatedId}`;
    toggleButton.setAttribute("aria-controls", input.id);
    const descriptions = new Set((input.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    descriptions.add(status.id);
    input.setAttribute("aria-describedby", Array.from(descriptions).join(" "));
    meter.min = 0;
    meter.max = 4;
    meter.low = 2;
    meter.high = 3;
    meter.optimum = 4;
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    this.acceptedValue = input.value;
    toggleButton.addEventListener("click", this.handleToggle);
    input.addEventListener("input", this.handleInput);
    this.syncStrength();
    this.syncVisibility();
  }

  get score(): number {
    const declared = Number(this.element.dataset.nyxPasswordMinLength);
    const minimumLength = Number.isFinite(declared) && declared > 0 ? declared : 8;
    return scorePassword(this.value, minimumLength);
  }

  get strength(): NyxPasswordStrength {
    return strengthFor(this.score);
  }

  get value(): string {
    return this.input.value;
  }

  set value(value: string) {
    this.setValue(value);
  }

  get visible(): boolean {
    return this.input.type === "text";
  }

  set visible(visible: boolean) {
    this.setVisible(visible);
  }

  setValue(value: string, reason: NyxPasswordChangeReason = "api"): boolean {
    return this.commit(value, reason);
  }

  setVisible(visible: boolean, reason: NyxPasswordVisibilityReason = "api"): boolean {
    if (visible === this.visible) return true;
    const detail: NyxPasswordVisibilityEventDetail = { passwordInput: this, reason, visible };
    const action = visible ? "show" : "hide";
    if (!dispatchNyxEvent(this.element, `nyx:password:before-${action}`, detail, true)) return false;
    const selectionStart = this.input.selectionStart;
    const selectionEnd = this.input.selectionEnd;
    this.input.type = visible ? "text" : "password";
    if (selectionStart !== null && selectionEnd !== null) this.input.setSelectionRange(selectionStart, selectionEnd);
    this.syncVisibility();
    dispatchNyxEvent(this.element, `nyx:password:${action}`, detail);
    return true;
  }

  toggleVisibility(): boolean {
    return this.setVisible(!this.visible, "toggle");
  }

  destroy(): void {
    this.validation.destroy();
    this.input.form?.removeEventListener("reset", this.handleFormReset);
    this.toggleButton.removeEventListener("click", this.handleToggle);
    this.input.removeEventListener("input", this.handleInput);
    if (this.visible) {
      this.input.type = "password";
      this.syncVisibility();
    }
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private commit(value: string, reason: NyxPasswordChangeReason, previousValue = this.acceptedValue): boolean {
    if (value === previousValue) {
      if (this.input.value !== value) this.input.value = value;
      this.syncStrength();
      return true;
    }
    const score = (() => {
      const current = this.input.value;
      if (current === value) return this.score;
      this.input.value = value;
      const result = this.score;
      this.input.value = current;
      return result;
    })();
    const detail: NyxPasswordChangeEventDetail = {
      passwordInput: this,
      previousValue,
      reason,
      score,
      strength: strengthFor(score),
      value,
    };
    if (!dispatchNyxEvent(this.element, "nyx:password:before-change", detail, true)) {
      this.input.value = previousValue;
      this.syncStrength();
      return false;
    }
    if (this.input.value !== value) this.input.value = value;
    this.acceptedValue = value;
    this.syncStrength();
    dispatchNyxEvent(this.element, "nyx:password:change", detail);
    return true;
  }

  private syncStrength(): void {
    const strength = this.strength;
    this.element.dataset.state = strength;
    this.element.dataset.strength = strength;
    this.meter.value = this.score;
    this.meter.setAttribute("aria-valuetext", strength === "empty" ? "No password entered" : `${strength} password strength`);
    this.status.textContent = strength === "empty" ? "Enter a password" : `Strength: ${strength}`;
    this.validation.sync();
  }

  private syncVisibility(): void {
    const visible = this.visible;
    this.element.dataset.visibility = visible ? "visible" : "hidden";
    this.toggleButton.setAttribute("aria-pressed", String(visible));
    const label = visible ? "Hide password" : "Show password";
    this.toggleButton.setAttribute("aria-label", label);
    this.toggleButton.title = label;
    const labelElement = this.toggleButton.querySelector<HTMLElement>("[data-nyx-password-toggle-label]");
    if (labelElement) labelElement.textContent = visible ? "Hide" : "Show";
  }

  private readonly handleFormReset = (event: Event): void => {
    queueMicrotask(() => {
      if (event.defaultPrevented) return;
      this.acceptedValue = this.input.value;
      this.syncStrength();
    });
  };

  private readonly handleInput = (): void => {
    this.commit(this.input.value, "input");
  };

  private readonly handleToggle = (): void => {
    this.toggleVisibility();
  };
}

export function initPasswordInputs(root: ParentNode = document): NyxPasswordInput[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxPasswordInput(element);
    instances.set(element, instance);
    return instance;
  });
}
