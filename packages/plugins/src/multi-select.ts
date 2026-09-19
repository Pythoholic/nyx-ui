import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { NyxOverlayDismissal, type NyxOverlayDismissReason } from "./internal/dismissal.js";
import { positionOverlay, type NyxOverlayPlacement } from "./internal/positioning.js";
import { isResultDisabled, NyxResultList, resultText } from "./internal/result-list.js";

export type NyxMultiSelectCloseReason = "api" | "destroy" | "escape" | "focus-leave" | "outside" | "tab";
export type NyxMultiSelectChangeReason = "api" | "backspace" | "clear" | "option" | "tag";

export interface NyxMultiSelectOptions {
  placement?: NyxOverlayPlacement;
}

export interface NyxMultiSelectEventDetail {
  multiSelect: NyxMultiSelect;
  option?: HTMLElement;
  query?: string;
  reason?: NyxMultiSelectChangeReason | NyxMultiSelectCloseReason;
  value?: string;
  values?: readonly string[];
  visibleCount?: number;
}

export interface NyxMultiSelectEventMap {
  "nyx:multi-select:add": CustomEvent<NyxMultiSelectEventDetail>;
  "nyx:multi-select:before-add": CustomEvent<NyxMultiSelectEventDetail>;
  "nyx:multi-select:before-clear": CustomEvent<NyxMultiSelectEventDetail>;
  "nyx:multi-select:before-close": CustomEvent<NyxMultiSelectEventDetail>;
  "nyx:multi-select:before-open": CustomEvent<NyxMultiSelectEventDetail>;
  "nyx:multi-select:before-remove": CustomEvent<NyxMultiSelectEventDetail>;
  "nyx:multi-select:clear": CustomEvent<NyxMultiSelectEventDetail>;
  "nyx:multi-select:close": CustomEvent<NyxMultiSelectEventDetail>;
  "nyx:multi-select:filter": CustomEvent<NyxMultiSelectEventDetail>;
  "nyx:multi-select:open": CustomEvent<NyxMultiSelectEventDetail>;
  "nyx:multi-select:remove": CustomEvent<NyxMultiSelectEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxMultiSelectEventMap {}
}

const selector = "[data-nyx-multi-select]";
const instances = new WeakMap<HTMLElement, NyxMultiSelect>();
let generatedId = 0;

export class NyxMultiSelect {
  readonly element: HTMLElement;
  readonly input: HTMLInputElement;
  readonly listbox: HTMLElement;
  readonly tags: HTMLElement;

  private readonly dismissal: NyxOverlayDismissal;
  private readonly empty: HTMLElement | undefined;
  private readonly max: number;
  private readonly name: string;
  private readonly options: HTMLElement[];
  private readonly placement: NyxOverlayPlacement;
  private readonly results: NyxResultList;
  private readonly valuesContainer: HTMLElement;
  private openState = false;
  private stopPositioning: (() => void) | undefined;

  constructor(element: HTMLElement, options: NyxMultiSelectOptions = {}) {
    this.element = element;
    const input = element.querySelector<HTMLInputElement>("input[role='combobox']");
    const listbox = element.querySelector<HTMLElement>("[role='listbox']");
    const tags = element.querySelector<HTMLElement>("[data-nyx-multi-select-tags]");
    const valuesContainer = element.querySelector<HTMLElement>("[data-nyx-multi-select-values]");
    if (!input || !listbox || !tags || !valuesContainer) throw new Error("NyxMultiSelect requires a combobox input, listbox, tag container, and value container.");
    if (!listbox.id) listbox.id = `nyx-multi-select-listbox-${++generatedId}`;
    this.input = input;
    this.listbox = listbox;
    this.tags = tags;
    this.valuesContainer = valuesContainer;
    if (!tags.id) tags.id = `nyx-multi-select-tags-${++generatedId}`;
    this.name = element.dataset.nyxMultiSelectName ?? "";
    const parsedMax = Number(element.dataset.nyxMultiSelectMax);
    this.max = Number.isInteger(parsedMax) && parsedMax > 0 ? parsedMax : Number.POSITIVE_INFINITY;
    this.options = Array.from(listbox.querySelectorAll<HTMLElement>("[role='option']"));
    let selectedCount = 0;
    this.options.forEach((option, index) => {
      if (!option.id) option.id = `${listbox.id}-option-${index + 1}`;
      const selected = option.getAttribute("aria-selected") === "true" && !isResultDisabled(option) && selectedCount < this.max;
      if (selected) selectedCount += 1;
      option.setAttribute("aria-selected", String(selected));
    });
    this.empty = listbox.querySelector<HTMLElement>("[data-nyx-multi-select-empty]") ?? undefined;
    this.placement = options.placement ?? (element.dataset.nyxMultiSelectPlacement as NyxOverlayPlacement | undefined) ?? "bottom-start";
    this.results = new NyxResultList({ input, listbox, options: this.options, ...(this.empty ? { empty: this.empty } : {}) });
    this.dismissal = new NyxOverlayDismissal({ element, onDismiss: this.handleDismiss });

    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", listbox.id);
    input.setAttribute("aria-expanded", "false");
    listbox.setAttribute("aria-multiselectable", "true");
    listbox.setAttribute("popover", "manual");
    listbox.hidden = true;
    this.element.dataset.popupState = "closed";
    this.syncSelection();

    input.addEventListener("click", this.handleInputClick);
    input.addEventListener("focus", this.handleInputFocus);
    input.addEventListener("input", this.handleInput);
    input.addEventListener("keydown", this.handleKeydown);
    listbox.addEventListener("click", this.handleOptionClick);
    listbox.addEventListener("pointerdown", this.handlePointerDown);
    tags.addEventListener("click", this.handleTagClick);
  }

  get expanded(): boolean {
    return this.openState;
  }

  get value(): string[] {
    return this.options.filter((option) => option.getAttribute("aria-selected") === "true").map((option) => this.optionValue(option));
  }

  set value(values: readonly string[]) {
    const available = new Set(this.options.filter((option) => !isResultDisabled(option)).map((option) => this.optionValue(option)));
    const allowed = new Set(Array.from(new Set(values.filter((value) => available.has(value)))).slice(0, this.max));
    this.options.forEach((option) => option.setAttribute("aria-selected", String(allowed.has(this.optionValue(option)) && !isResultDisabled(option))));
    this.syncSelection();
  }

  open(): void {
    if (this.openState || this.input.disabled) return;
    if (!dispatchNyxEvent(this.element, "nyx:multi-select:before-open", { multiSelect: this }, true)) return;
    this.openState = true;
    this.listbox.hidden = false;
    this.listbox.showPopover?.();
    this.input.setAttribute("aria-expanded", "true");
    this.element.dataset.popupState = "open";
    this.filter();
    this.stopPositioning = positionOverlay(this.input, this.listbox, { placement: this.placement });
    this.dismissal.activate();
    dispatchNyxEvent(this.element, "nyx:multi-select:open", { multiSelect: this });
  }

  close(reason: NyxMultiSelectCloseReason = "api"): void {
    if (!this.openState) return;
    const cancelable = reason !== "destroy";
    if (!dispatchNyxEvent(this.element, "nyx:multi-select:before-close", { multiSelect: this, reason }, cancelable)) return;
    this.openState = false;
    this.stopPositioning?.();
    this.stopPositioning = undefined;
    this.dismissal.deactivate();
    this.listbox.hidePopover?.();
    this.listbox.hidden = true;
    this.input.setAttribute("aria-expanded", "false");
    this.results.clearActive();
    this.element.dataset.popupState = "closed";
    dispatchNyxEvent(this.element, "nyx:multi-select:close", { multiSelect: this, reason });
  }

  add(optionOrValue: HTMLElement | string, reason: NyxMultiSelectChangeReason = "api"): boolean {
    const option = typeof optionOrValue === "string"
      ? this.options.find((candidate) => this.optionValue(candidate) === optionOrValue)
      : optionOrValue;
    if (!option || !this.options.includes(option) || isResultDisabled(option) || option.getAttribute("aria-selected") === "true" || this.value.length >= this.max) return false;
    const value = this.optionValue(option);
    const values = [...this.value, value];
    const detail: NyxMultiSelectEventDetail = { multiSelect: this, option, reason, value, values };
    if (!dispatchNyxEvent(this.element, "nyx:multi-select:before-add", detail, true)) return false;
    option.setAttribute("aria-selected", "true");
    this.syncSelection();
    dispatchNyxEvent(this.element, "nyx:multi-select:add", detail);
    return true;
  }

  remove(optionOrValue: HTMLElement | string, reason: NyxMultiSelectChangeReason = "api"): boolean {
    const option = typeof optionOrValue === "string"
      ? this.options.find((candidate) => this.optionValue(candidate) === optionOrValue)
      : optionOrValue;
    if (!option || option.getAttribute("aria-selected") !== "true") return false;
    const value = this.optionValue(option);
    const values = this.value.filter((candidate) => candidate !== value);
    const detail: NyxMultiSelectEventDetail = { multiSelect: this, option, reason, value, values };
    if (!dispatchNyxEvent(this.element, "nyx:multi-select:before-remove", detail, true)) return false;
    option.setAttribute("aria-selected", "false");
    this.syncSelection();
    dispatchNyxEvent(this.element, "nyx:multi-select:remove", detail);
    return true;
  }

  toggle(option: HTMLElement, reason: NyxMultiSelectChangeReason = "option"): boolean {
    return option.getAttribute("aria-selected") === "true" ? this.remove(option, reason) : this.add(option, reason);
  }

  clear(): boolean {
    const values = this.value;
    if (!values.length) return false;
    const detail: NyxMultiSelectEventDetail = { multiSelect: this, reason: "clear", values: [] };
    if (!dispatchNyxEvent(this.element, "nyx:multi-select:before-clear", detail, true)) return false;
    this.options.forEach((option) => option.setAttribute("aria-selected", "false"));
    this.syncSelection();
    dispatchNyxEvent(this.element, "nyx:multi-select:clear", detail);
    return true;
  }

  filter(query = this.input.value): number {
    const visibleCount = this.results.filter(query);
    dispatchNyxEvent(this.element, "nyx:multi-select:filter", { multiSelect: this, query, visibleCount });
    return visibleCount;
  }

  destroy(): void {
    this.close("destroy");
    this.dismissal.destroy();
    this.results.destroy();
    this.input.removeEventListener("click", this.handleInputClick);
    this.input.removeEventListener("focus", this.handleInputFocus);
    this.input.removeEventListener("input", this.handleInput);
    this.input.removeEventListener("keydown", this.handleKeydown);
    this.listbox.removeEventListener("click", this.handleOptionClick);
    this.listbox.removeEventListener("pointerdown", this.handlePointerDown);
    this.tags.removeEventListener("click", this.handleTagClick);
    this.tags.replaceChildren();
    this.valuesContainer.replaceChildren();
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private optionValue(option: HTMLElement): string {
    return option.dataset.value ?? resultText(option).trim();
  }

  private syncSelection(): void {
    const selected = this.options.filter((option) => option.getAttribute("aria-selected") === "true");
    const atMax = selected.length >= this.max;
    this.element.dataset.state = atMax ? "max" : selected.length ? "filled" : "empty";
    const descriptions = new Set((this.input.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    descriptions.add(this.tags.id);
    this.input.setAttribute("aria-describedby", Array.from(descriptions).join(" "));
    const ownerDocument = this.element.ownerDocument;
    this.tags.replaceChildren(...selected.map((option) => {
      const value = this.optionValue(option);
      const tag = ownerDocument.createElement("span");
      tag.className = "nyx-tag nyx-motion-fade";
      tag.dataset.value = value;
      const label = ownerDocument.createElement("span");
      label.textContent = option.dataset.nyxMultiSelectLabel ?? resultText(option).trim();
      const remove = ownerDocument.createElement("button");
      remove.type = "button";
      remove.dataset.nyxMultiSelectRemove = value;
      remove.setAttribute("aria-label", `Remove ${label.textContent}`);
      remove.textContent = "×";
      tag.append(label, remove);
      return tag;
    }));
    this.valuesContainer.replaceChildren(...selected.map((option) => {
      const hidden = ownerDocument.createElement("input");
      hidden.type = "hidden";
      hidden.name = this.name;
      hidden.value = this.optionValue(option);
      return hidden;
    }));
  }

  private readonly handleInputClick = (): void => { this.open(); };
  private readonly handleInputFocus = (): void => { this.open(); };
  private readonly handleInput = (): void => { if (!this.openState) this.open(); this.filter(); };

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
      if (option && this.toggle(option)) {
        this.input.value = "";
        this.filter("");
      }
    } else if (event.key === "Backspace" && !this.input.value) {
      const last = this.value.at(-1);
      if (last) this.remove(last, "backspace");
    } else if (event.key === "Escape" && this.openState) {
      event.preventDefault();
      this.close("escape");
    } else if (event.key === "Tab" && this.openState) {
      this.close("tab");
    }
  };

  private readonly handleOptionClick = (event: MouseEvent): void => {
    const option = event.target instanceof Element ? event.target.closest<HTMLElement>("[role='option']") : null;
    if (option && this.options.includes(option) && !option.hidden) {
      this.toggle(option);
      this.input.value = "";
      this.filter("");
      this.input.focus();
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.target instanceof Element && event.target.closest("[role='option']")) event.preventDefault();
  };

  private readonly handleTagClick = (event: MouseEvent): void => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-nyx-multi-select-remove]") : null;
    const value = button?.dataset.nyxMultiSelectRemove;
    if (value) this.remove(value, "tag");
  };

  private readonly handleDismiss = (reason: NyxOverlayDismissReason): void => { this.close(reason); };
}

export function initMultiSelects(root: ParentNode = document): NyxMultiSelect[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxMultiSelect(element);
    instances.set(element, instance);
    return instance;
  });
}
