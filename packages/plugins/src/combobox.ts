import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { NyxOverlayDismissal, type NyxOverlayDismissReason } from "./internal/dismissal.js";
import { positionOverlay, type NyxOverlayPlacement } from "./internal/positioning.js";
import { isResultDisabled, NyxResultList, resultText } from "./internal/result-list.js";

export type NyxComboboxCloseReason = "api" | "destroy" | "escape" | "focus-leave" | "outside" | "select" | "tab";

export interface NyxComboboxOptions {
  placement?: NyxOverlayPlacement;
}

export interface NyxComboboxEventDetail {
  combobox: NyxCombobox;
  option?: HTMLElement;
  query?: string;
  reason?: NyxComboboxCloseReason;
  value?: string;
  visibleCount?: number;
}

export interface NyxComboboxEventMap {
  "nyx:combobox:before-close": CustomEvent<NyxComboboxEventDetail>;
  "nyx:combobox:before-open": CustomEvent<NyxComboboxEventDetail>;
  "nyx:combobox:before-select": CustomEvent<NyxComboboxEventDetail>;
  "nyx:combobox:close": CustomEvent<NyxComboboxEventDetail>;
  "nyx:combobox:filter": CustomEvent<NyxComboboxEventDetail>;
  "nyx:combobox:open": CustomEvent<NyxComboboxEventDetail>;
  "nyx:combobox:select": CustomEvent<NyxComboboxEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxComboboxEventMap {}
}

const selector = "[data-nyx-combobox]";
const instances = new WeakMap<HTMLElement, NyxCombobox>();
let generatedId = 0;

export class NyxCombobox {
  readonly element: HTMLElement;
  readonly input: HTMLInputElement;
  readonly listbox: HTMLElement;

  private readonly dismissal: NyxOverlayDismissal;
  private readonly empty: HTMLElement | undefined;
  private readonly hiddenInput: HTMLInputElement | undefined;
  private readonly options: HTMLElement[];
  private readonly placement: NyxOverlayPlacement;
  private readonly results: NyxResultList;
  private readonly selectOnly: boolean;
  private committedOption: HTMLElement | null = null;
  private openState = false;
  private selectedOption: HTMLElement | null = null;
  private stopPositioning: (() => void) | undefined;

  constructor(element: HTMLElement, options: NyxComboboxOptions = {}) {
    this.element = element;
    const input = element.querySelector<HTMLInputElement>("input[role='combobox']");
    const listbox = element.querySelector<HTMLElement>("[role='listbox']");
    if (!input || !listbox) throw new Error("NyxCombobox requires an input with role=combobox and a listbox.");
    if (!listbox.id) listbox.id = `nyx-combobox-listbox-${++generatedId}`;
    this.input = input;
    this.listbox = listbox;
    this.options = Array.from(listbox.querySelectorAll<HTMLElement>("[role='option']"));
    this.options.forEach((option, index) => { if (!option.id) option.id = `${listbox.id}-option-${index + 1}`; });
    this.empty = listbox.querySelector<HTMLElement>("[data-nyx-combobox-empty]") ?? undefined;
    this.hiddenInput = element.querySelector<HTMLInputElement>("input[type='hidden'][data-nyx-combobox-value]") ?? undefined;
    this.placement = options.placement ?? (element.dataset.nyxComboboxPlacement as NyxOverlayPlacement | undefined) ?? "bottom-start";
    this.selectOnly = element.dataset.nyxComboboxMode === "select";
    this.results = new NyxResultList({ input, listbox, options: this.options, ...(this.empty ? { empty: this.empty } : {}) });
    this.dismissal = new NyxOverlayDismissal({ element, onDismiss: this.handleDismiss });

    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", listbox.id);
    input.setAttribute("aria-expanded", "false");
    listbox.setAttribute("popover", "manual");
    listbox.hidden = true;
    this.options.forEach((option) => option.setAttribute("aria-selected", option.getAttribute("aria-selected") === "true" ? "true" : "false"));
    this.selectedOption = this.options.find((option) => option.getAttribute("aria-selected") === "true") ?? null;
    this.committedOption = this.selectedOption;
    if (this.selectedOption) this.commit(this.selectedOption, false);
    else if (this.hiddenInput?.value) this.value = this.hiddenInput.value;

    input.addEventListener("input", this.handleInput);
    input.addEventListener("click", this.handleInputClick);
    input.addEventListener("keydown", this.handleKeydown);
    listbox.addEventListener("click", this.handleOptionClick);
    listbox.addEventListener("pointerdown", this.handlePointerDown);
  }

  get value(): string {
    return this.hiddenInput?.value ?? this.selectedOption?.dataset.value ?? "";
  }

  set value(value: string) {
    const option = this.options.find((candidate) => candidate.dataset.value === value) ?? null;
    if (option && !isResultDisabled(option)) this.commit(option, false);
    else this.clearSelection();
  }

  get expanded(): boolean {
    return this.openState;
  }

  open(): void {
    if (this.openState || this.input.disabled) return;
    if (!dispatchNyxEvent(this.element, "nyx:combobox:before-open", { combobox: this }, true)) return;
    this.openState = true;
    this.listbox.hidden = false;
    this.listbox.showPopover?.();
    this.input.setAttribute("aria-expanded", "true");
    this.element.dataset.state = "open";
    this.results.filter(this.input.value);
    this.stopPositioning = positionOverlay(this.input, this.listbox, { placement: this.placement });
    this.dismissal.activate();
    dispatchNyxEvent(this.element, "nyx:combobox:open", { combobox: this });
  }

  close(reason: NyxComboboxCloseReason = "api"): void {
    if (!this.openState) return;
    const cancelable = reason !== "destroy";
    if (!dispatchNyxEvent(this.element, "nyx:combobox:before-close", { combobox: this, reason }, cancelable)) return;
    if (this.selectOnly && reason !== "destroy" && reason !== "select") this.restoreCommittedSelection();
    this.openState = false;
    this.stopPositioning?.();
    this.stopPositioning = undefined;
    this.dismissal.deactivate();
    this.listbox.hidePopover?.();
    this.listbox.hidden = true;
    this.input.setAttribute("aria-expanded", "false");
    this.input.removeAttribute("aria-activedescendant");
    this.element.dataset.state = "closed";
    dispatchNyxEvent(this.element, "nyx:combobox:close", { combobox: this, reason });
  }

  select(option: HTMLElement): void {
    if (!this.options.includes(option) || option.hidden || isResultDisabled(option)) return;
    const value = option.dataset.value ?? resultText(option).trim();
    const detail: NyxComboboxEventDetail = { combobox: this, option, value };
    if (!dispatchNyxEvent(this.element, "nyx:combobox:before-select", detail, true)) return;
    this.commit(option, true);
    this.close("select");
    dispatchNyxEvent(this.element, "nyx:combobox:select", detail);
  }

  filter(query = this.input.value): number {
    const visibleCount = this.results.filter(query);
    dispatchNyxEvent(this.element, "nyx:combobox:filter", { combobox: this, query, visibleCount });
    return visibleCount;
  }

  destroy(): void {
    this.close("destroy");
    this.dismissal.destroy();
    this.results.destroy();
    this.input.removeEventListener("input", this.handleInput);
    this.input.removeEventListener("click", this.handleInputClick);
    this.input.removeEventListener("keydown", this.handleKeydown);
    this.listbox.removeEventListener("click", this.handleOptionClick);
    this.listbox.removeEventListener("pointerdown", this.handlePointerDown);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private commit(option: HTMLElement, updateInput: boolean): void {
    this.selectedOption = option;
    this.committedOption = option;
    this.options.forEach((candidate) => candidate.setAttribute("aria-selected", String(candidate === option)));
    const value = option.dataset.value ?? resultText(option).trim();
    if (this.hiddenInput) this.hiddenInput.value = value;
    if (updateInput || !this.input.value) this.input.value = option.dataset.nyxComboboxLabel ?? resultText(option).trim();
  }

  private clearSelection(preserveCommitted = false): void {
    this.selectedOption = null;
    if (!preserveCommitted) this.committedOption = null;
    this.options.forEach((option) => option.setAttribute("aria-selected", "false"));
    if (this.hiddenInput) this.hiddenInput.value = "";
  }

  private restoreCommittedSelection(): void {
    this.selectedOption = this.committedOption;
    this.options.forEach((option) => option.setAttribute("aria-selected", String(option === this.committedOption)));
    if (this.committedOption) {
      this.input.value = this.committedOption.dataset.nyxComboboxLabel ?? resultText(this.committedOption).trim();
      if (this.hiddenInput) this.hiddenInput.value = this.committedOption.dataset.value ?? resultText(this.committedOption).trim();
    } else {
      this.input.value = "";
      if (this.hiddenInput) this.hiddenInput.value = "";
    }
  }

  private readonly handleInput = (): void => {
    this.clearSelection(this.selectOnly);
    if (!this.openState) this.open();
    this.filter();
  };

  private readonly handleInputClick = (): void => { this.open(); };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!this.openState) this.open();
      else this.results.move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home" && this.openState) {
      event.preventDefault();
      this.results.first();
    } else if (event.key === "End" && this.openState) {
      event.preventDefault();
      this.results.last();
    } else if (event.key === "Enter" && this.openState) {
      event.preventDefault();
      const option = this.results.activeOption;
      if (option) this.select(option);
    } else if (event.key === "Escape" && this.openState) {
      event.preventDefault();
      this.close("escape");
    } else if (event.key === "Tab" && this.openState) {
      this.close("tab");
    }
  };

  private readonly handleOptionClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[role='option']") : null;
    if (target) this.select(target);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.target instanceof Element && event.target.closest("[role='option']")) event.preventDefault();
  };

  private readonly handleDismiss = (reason: NyxOverlayDismissReason): void => {
    this.close(reason);
  };
}

export function initComboboxes(root: ParentNode = document): NyxCombobox[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxCombobox(element);
    instances.set(element, instance);
    return instance;
  });
}
