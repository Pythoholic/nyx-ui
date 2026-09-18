import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { horizontalArrowDelta } from "./internal/direction.js";

export type NyxStepperChangeReason = "api" | "next" | "previous" | "step";

export interface NyxStepperEventDetail {
  index: number;
  panel: HTMLElement;
  previousIndex: number;
  reason: NyxStepperChangeReason;
  step: HTMLElement;
  stepper: NyxStepper;
}

export interface NyxStepperEventMap {
  "nyx:stepper:before-change": CustomEvent<NyxStepperEventDetail>;
  "nyx:stepper:change": CustomEvent<NyxStepperEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxStepperEventMap {}
}

const selector = "[data-nyx-stepper]";
const instances = new WeakMap<HTMLElement, NyxStepper>();
let generatedId = 0;

export class NyxStepper {
  readonly element: HTMLElement;
  readonly steps: HTMLElement[];
  readonly panels: HTMLElement[];

  private readonly triggers: HTMLButtonElement[];
  private readonly nextButtons: HTMLButtonElement[];
  private readonly previousButtons: HTMLButtonElement[];
  private activeIndex: number;
  private furthestIndex: number;

  constructor(element: HTMLElement) {
    this.element = element;
    this.steps = Array.from(
      element.querySelectorAll<HTMLElement>("[data-nyx-stepper-step]"),
    ).filter((step) => step.closest(selector) === element);
    this.triggers = this.steps.flatMap((step) => {
      const trigger = step.querySelector<HTMLButtonElement>("[data-nyx-stepper-trigger]");
      return trigger ? [trigger] : [];
    });
    this.panels = Array.from(
      element.querySelectorAll<HTMLElement>("[data-nyx-stepper-panel]"),
    ).filter((panel) => panel.closest(selector) === element);
    if (this.steps.length === 0 || this.triggers.length !== this.steps.length || this.panels.length !== this.steps.length) {
      throw new Error("NyxStepper requires every owned step to have one trigger and one matching panel.");
    }
    this.nextButtons = this.ownedButtons("[data-nyx-stepper-next]");
    this.previousButtons = this.ownedButtons("[data-nyx-stepper-previous]");
    const declared = Number(element.dataset.nyxStepperIndex);
    const current = this.steps.findIndex((step) => step.dataset.state === "current");
    this.activeIndex = this.clamp(Number.isInteger(declared) ? declared : current >= 0 ? current : 0);
    this.furthestIndex = Math.max(
      this.activeIndex,
      this.steps.reduce((furthest, step, index) => step.dataset.state === "complete" ? index + 1 : furthest, 0),
    );
    this.furthestIndex = this.clamp(this.furthestIndex);
    element.addEventListener("click", this.handleClick);
    element.addEventListener("keydown", this.handleKeydown);
    this.sync();
  }

  get value(): number {
    return this.activeIndex;
  }

  set value(index: number) {
    this.goTo(index);
  }

  get linear(): boolean {
    return this.element.hasAttribute("data-nyx-stepper-linear");
  }

  goTo(index: number, reason: NyxStepperChangeReason = "api"): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= this.steps.length || index === this.activeIndex) return false;
    if (this.linear && index > this.furthestIndex + 1) return false;
    const step = this.steps[index];
    const panel = this.panels[index];
    if (!step || !panel) return false;
    const detail: NyxStepperEventDetail = {
      index,
      panel,
      previousIndex: this.activeIndex,
      reason,
      step,
      stepper: this,
    };
    if (!dispatchNyxEvent(this.element, "nyx:stepper:before-change", detail, true)) return false;
    this.activeIndex = index;
    this.furthestIndex = Math.max(this.furthestIndex, index);
    this.sync();
    dispatchNyxEvent(this.element, "nyx:stepper:change", detail);
    return true;
  }

  next(reason: NyxStepperChangeReason = "next"): boolean {
    return this.goTo(this.activeIndex + 1, reason);
  }

  previous(reason: NyxStepperChangeReason = "previous"): boolean {
    return this.goTo(this.activeIndex - 1, reason);
  }

  destroy(): void {
    this.element.removeEventListener("click", this.handleClick);
    this.element.removeEventListener("keydown", this.handleKeydown);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private ownedButtons(buttonSelector: string): HTMLButtonElement[] {
    return Array.from(this.element.querySelectorAll<HTMLButtonElement>(buttonSelector)).filter(
      (button) => button.closest(selector) === this.element,
    );
  }

  private clamp(index: number): number {
    return Math.max(0, Math.min(this.steps.length - 1, index));
  }

  private sync(): void {
    const complete = this.activeIndex === this.steps.length - 1;
    this.element.dataset.state = complete ? "complete" : "in-progress";
    this.element.dataset.nyxStepperIndex = String(this.activeIndex);
    this.steps.forEach((step, index) => {
      const trigger = this.triggers[index];
      const panel = this.panels[index];
      if (!trigger || !panel) return;
      const state = index < this.activeIndex ? "complete" : index === this.activeIndex ? "current" : "pending";
      if (!trigger.id) trigger.id = `nyx-stepper-trigger-${++generatedId}`;
      if (!panel.id) panel.id = `nyx-stepper-panel-${++generatedId}`;
      step.dataset.state = state;
      if (state === "current") step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
      trigger.setAttribute("aria-controls", panel.id);
      trigger.setAttribute("aria-expanded", String(index === this.activeIndex));
      trigger.tabIndex = index === this.activeIndex ? 0 : -1;
      const unavailable = this.linear && index > this.furthestIndex + 1;
      trigger.disabled = unavailable;
      trigger.setAttribute("aria-disabled", String(unavailable));
      panel.setAttribute("aria-labelledby", trigger.id);
      panel.setAttribute("aria-hidden", String(index !== this.activeIndex));
      panel.dataset.state = index === this.activeIndex ? "active" : "inactive";
      panel.hidden = index !== this.activeIndex;
    });
    this.previousButtons.forEach((button) => {
      button.disabled = this.activeIndex === 0;
      button.setAttribute("aria-disabled", String(button.disabled));
    });
    this.nextButtons.forEach((button) => {
      button.disabled = complete;
      button.setAttribute("aria-disabled", String(button.disabled));
    });
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("button");
    if (!button || button.closest(selector) !== this.element || button.disabled) return;
    if (button.hasAttribute("data-nyx-stepper-next")) this.next();
    else if (button.hasAttribute("data-nyx-stepper-previous")) this.previous();
    else if (button.hasAttribute("data-nyx-stepper-trigger")) {
      const index = this.triggers.indexOf(button);
      if (index >= 0) this.goTo(index, "step");
    }
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    const target = event.target instanceof HTMLButtonElement ? event.target : null;
    const current = target ? this.triggers.indexOf(target) : -1;
    if (current < 0) return;
    const available = this.triggers.filter((trigger) => !trigger.disabled);
    const availableIndex = target ? available.indexOf(target) : -1;
    let next: HTMLButtonElement | undefined;
    const horizontalDelta = horizontalArrowDelta(event.key, this.element);
    if (horizontalDelta !== 0) next = available[(availableIndex + horizontalDelta + available.length) % available.length];
    else if (event.key === "ArrowDown") next = available[(availableIndex + 1) % available.length];
    else if (event.key === "ArrowUp") next = available[(availableIndex - 1 + available.length) % available.length];
    else if (event.key === "Home") next = available[0];
    else if (event.key === "End") next = available.at(-1);
    else return;
    event.preventDefault();
    next?.focus();
  };
}

export function initSteppers(root: ParentNode = document): NyxStepper[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxStepper(element);
    instances.set(element, instance);
    return instance;
  });
}
