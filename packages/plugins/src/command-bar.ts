import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { isDisabledItem, NyxRovingFocus } from "./internal/roving-focus.js";

export type NyxCommandBarRunReason = "api" | "control";

export interface NyxCommandBarEventDetail {
  command: HTMLElement;
  commandBar: NyxCommandBar;
  reason: NyxCommandBarRunReason;
  value: string;
}

export interface NyxCommandBarEventMap {
  "nyx:command-bar:before-run": CustomEvent<NyxCommandBarEventDetail>;
  "nyx:command-bar:run": CustomEvent<NyxCommandBarEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxCommandBarEventMap {}
}

const selector = "[data-nyx-command-bar]";
const commandSelector = "[data-nyx-command]";
const instances = new WeakMap<HTMLElement, NyxCommandBar>();
let generatedId = 0;

export class NyxCommandBar {
  readonly element: HTMLElement;

  private rovingFocus: NyxRovingFocus;

  constructor(element: HTMLElement) {
    this.element = element;
    element.setAttribute("role", "toolbar");
    element.setAttribute("aria-orientation", this.orientation);
    this.prepareCommands();
    this.rovingFocus = new NyxRovingFocus(this.commands, this.orientation);
    element.addEventListener("click", this.handleClick);
    element.addEventListener("focusin", this.handleFocusIn);
    element.addEventListener("keydown", this.handleKeydown);
    this.sync();
  }

  get commands(): HTMLElement[] {
    return Array.from(this.element.querySelectorAll<HTMLElement>(commandSelector)).filter(
      (command) => command.closest(selector) === this.element,
    );
  }

  get value(): string | null {
    const command = this.commands.find((candidate) => candidate.tabIndex === 0 && !isDisabledItem(candidate));
    return command?.dataset.value ?? null;
  }

  set value(value: string | null) {
    if (value === null) return;
    const command = this.resolve(value);
    if (command && !isDisabledItem(command)) {
      this.rovingFocus.setCurrent(command);
      this.sync();
    }
  }

  focus(commandOrValue: HTMLElement | string = "first"): HTMLElement | null {
    if (commandOrValue === "first" || commandOrValue === "last") {
      return this.rovingFocus.focus(commandOrValue);
    }
    const command = this.resolve(commandOrValue);
    return command ? this.rovingFocus.focus(command) : null;
  }

  run(commandOrValue: HTMLElement | string, reason: NyxCommandBarRunReason = "api"): boolean {
    const command = this.resolve(commandOrValue);
    if (!command || isDisabledItem(command)) return false;
    const value = command.dataset.value!;
    const detail: NyxCommandBarEventDetail = { command, commandBar: this, reason, value };
    if (!dispatchNyxEvent(this.element, "nyx:command-bar:before-run", detail, true)) return false;
    this.rovingFocus.setCurrent(command);
    this.sync();
    dispatchNyxEvent(this.element, "nyx:command-bar:run", detail);
    return true;
  }

  refresh(): void {
    this.prepareCommands();
    this.rovingFocus = new NyxRovingFocus(this.commands, this.orientation);
    this.sync();
  }

  destroy(): void {
    this.element.removeEventListener("click", this.handleClick);
    this.element.removeEventListener("focusin", this.handleFocusIn);
    this.element.removeEventListener("keydown", this.handleKeydown);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private get orientation(): "horizontal" | "vertical" {
    return this.element.dataset.nyxCommandBarOrientation === "vertical" ? "vertical" : "horizontal";
  }

  private prepareCommands(): void {
    this.commands.forEach((command) => {
      if (!command.dataset.value) command.dataset.value = `nyx-command-${++generatedId}`;
    });
  }

  private resolve(commandOrValue: HTMLElement | string): HTMLElement | undefined {
    if (typeof commandOrValue !== "string") {
      return commandOrValue.matches(commandSelector) && commandOrValue.closest(selector) === this.element
        ? commandOrValue
        : undefined;
    }
    return this.commands.find((command) => command.dataset.value === commandOrValue);
  }

  private sync(): void {
    const commands = this.commands;
    const enabled = commands.filter((command) => !isDisabledItem(command));
    this.element.dataset.state = enabled.length ? "active" : "disabled";
    commands.forEach((command) => {
      const disabled = isDisabledItem(command);
      command.dataset.state = disabled ? "disabled" : command.tabIndex === 0 ? "current" : "idle";
      command.setAttribute("aria-disabled", String(disabled));
    });
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const command = target?.closest<HTMLElement>(commandSelector);
    if (!command || command.closest(selector) !== this.element) return;
    if (!this.run(command, "control")) event.preventDefault();
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const command = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>(commandSelector) : null;
    if (!command || command.closest(selector) !== this.element || isDisabledItem(command)) return;
    this.rovingFocus.setCurrent(command);
    this.sync();
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    const command = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>(commandSelector) : null;
    if (!command || command.closest(selector) !== this.element) return;
    if (this.rovingFocus.handleKeydown(event)) this.sync();
  };
}

export function initCommandBars(root: ParentNode = document): NyxCommandBar[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxCommandBar(element);
    instances.set(element, instance);
    return instance;
  });
}
