import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxPromptComposerChangeReason = "api" | "clear" | "input";
export type NyxPromptComposerSubmitReason = "api" | "form" | "keyboard";

export interface NyxPromptComposerChangeEventDetail {
  promptComposer: NyxPromptComposer;
  previousValue: string;
  reason: NyxPromptComposerChangeReason;
  value: string;
}

export interface NyxPromptComposerSubmitEventDetail {
  promptComposer: NyxPromptComposer;
  reason: NyxPromptComposerSubmitReason;
  value: string;
}

export interface NyxPromptComposerEventMap {
  "nyx:prompt-composer:before-change": CustomEvent<NyxPromptComposerChangeEventDetail>;
  "nyx:prompt-composer:change": CustomEvent<NyxPromptComposerChangeEventDetail>;
  "nyx:prompt-composer:before-submit": CustomEvent<NyxPromptComposerSubmitEventDetail>;
  "nyx:prompt-composer:submit": CustomEvent<NyxPromptComposerSubmitEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxPromptComposerEventMap {}
}

const selector = "[data-nyx-prompt-composer]";
const instances = new WeakMap<HTMLFormElement, NyxPromptComposer>();
let generatedId = 0;

export class NyxPromptComposer {
  readonly count: HTMLOutputElement | null;
  readonly element: HTMLFormElement;
  readonly input: HTMLTextAreaElement;
  readonly submitButton: HTMLButtonElement;

  private acceptedValue: string;
  private validationRequested = false;

  constructor(element: HTMLFormElement) {
    this.element = element;
    const input = element.querySelector<HTMLTextAreaElement>("[data-nyx-prompt-composer-input]");
    const submitButton = element.querySelector<HTMLButtonElement>("[data-nyx-prompt-composer-submit]");
    if (!input || !submitButton) {
      throw new Error("NyxPromptComposer requires a textarea and submit button.");
    }
    this.input = input;
    this.submitButton = submitButton;
    this.count = element.querySelector<HTMLOutputElement>("[data-nyx-prompt-composer-count]");
    if (!input.id) input.id = `nyx-prompt-composer-${++generatedId}`;
    submitButton.setAttribute("aria-controls", input.id);
    input.setAttribute("aria-keyshortcuts", "Control+Enter Meta+Enter");
    this.acceptedValue = input.value;
    input.addEventListener("input", this.handleInput);
    input.addEventListener("keydown", this.handleKeydown);
    element.addEventListener("submit", this.handleSubmit);
    this.sync();
  }

  get value(): string {
    return this.input.value;
  }

  set value(value: string) {
    this.setValue(value);
  }

  clear(): boolean {
    return this.setValue("", "clear");
  }

  setValue(value: string, reason: NyxPromptComposerChangeReason = "api"): boolean {
    return this.commit(String(value), reason);
  }

  submit(reason: NyxPromptComposerSubmitReason = "api"): boolean {
    this.validationRequested = true;
    this.sync();
    if (!this.isValid || this.input.disabled || this.input.readOnly) return false;
    const detail: NyxPromptComposerSubmitEventDetail = {
      promptComposer: this,
      reason,
      value: this.value,
    };
    if (!dispatchNyxEvent(this.element, "nyx:prompt-composer:before-submit", detail, true)) return false;
    this.sync();
    dispatchNyxEvent(this.element, "nyx:prompt-composer:submit", detail);
    return true;
  }

  destroy(): void {
    this.input.removeEventListener("input", this.handleInput);
    this.input.removeEventListener("keydown", this.handleKeydown);
    this.element.removeEventListener("submit", this.handleSubmit);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private get isValid(): boolean {
    const withinLength = this.input.maxLength < 0 || this.value.length <= this.input.maxLength;
    return this.value.trim().length > 0 && withinLength && this.input.validity.valid;
  }

  private commit(nextValue: string, reason: NyxPromptComposerChangeReason, previousValue = this.acceptedValue): boolean {
    if (nextValue === previousValue) {
      this.input.value = nextValue;
      this.sync();
      return true;
    }
    const detail: NyxPromptComposerChangeEventDetail = {
      promptComposer: this,
      previousValue,
      reason,
      value: nextValue,
    };
    if (!dispatchNyxEvent(this.element, "nyx:prompt-composer:before-change", detail, true)) {
      this.input.value = previousValue;
      this.sync();
      return false;
    }
    this.input.value = nextValue;
    this.acceptedValue = nextValue;
    this.sync();
    detail.value = this.value;
    dispatchNyxEvent(this.element, "nyx:prompt-composer:change", detail);
    return true;
  }

  private sync(): void {
    const empty = this.value.trim().length === 0;
    const invalid = this.validationRequested && !this.isValid;
    const unavailable = this.input.disabled || this.input.readOnly;
    this.element.dataset.state = unavailable ? "disabled" : invalid ? "invalid" : empty ? "empty" : "ready";
    this.input.setAttribute("aria-invalid", String(invalid));
    this.input.toggleAttribute("data-invalid", invalid);
    this.submitButton.disabled = unavailable || !this.isValid;
    this.submitButton.setAttribute("aria-disabled", String(this.submitButton.disabled));
    if (this.count) {
      const maximum = this.input.maxLength >= 0 ? ` / ${this.input.maxLength}` : "";
      this.count.value = `${this.value.length}${maximum}`;
    }
  }

  private readonly handleInput = (): void => {
    this.commit(this.input.value, "input");
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" || (!event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    this.submit("keyboard");
  };

  private readonly handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    this.submit("form");
  };
}

export function initPromptComposers(root: ParentNode = document): NyxPromptComposer[] {
  return queryAllIncludingRoot<HTMLFormElement>(root, selector).map((element) => {
    if (!(element instanceof HTMLFormElement)) {
      throw new Error("data-nyx-prompt-composer must be placed on a form element.");
    }
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxPromptComposer(element);
    instances.set(element, instance);
    return instance;
  });
}
