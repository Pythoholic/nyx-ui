import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { NyxOverlayDismissal, type NyxOverlayDismissReason } from "./internal/dismissal.js";
import { positionOverlay, type NyxOverlayPlacement } from "./internal/positioning.js";
import { isResultDisabled, NyxResultList, resultText } from "./internal/result-list.js";

export type NyxSearchBoxCloseReason = "api" | "destroy" | "escape" | "focus-leave" | "outside" | "search" | "tab";
export type NyxSearchBoxSearchReason = "api" | "enter" | "suggestion" | "submit";

export interface NyxSearchBoxOptions {
  placement?: NyxOverlayPlacement;
}

export interface NyxSearchBoxEventDetail {
  option?: HTMLElement;
  query?: string;
  reason?: NyxSearchBoxCloseReason | NyxSearchBoxSearchReason;
  searchBox: NyxSearchBox;
  visibleCount?: number;
}

export interface NyxSearchBoxEventMap {
  "nyx:search-box:before-clear": CustomEvent<NyxSearchBoxEventDetail>;
  "nyx:search-box:before-close": CustomEvent<NyxSearchBoxEventDetail>;
  "nyx:search-box:before-open": CustomEvent<NyxSearchBoxEventDetail>;
  "nyx:search-box:before-search": CustomEvent<NyxSearchBoxEventDetail>;
  "nyx:search-box:clear": CustomEvent<NyxSearchBoxEventDetail>;
  "nyx:search-box:close": CustomEvent<NyxSearchBoxEventDetail>;
  "nyx:search-box:filter": CustomEvent<NyxSearchBoxEventDetail>;
  "nyx:search-box:open": CustomEvent<NyxSearchBoxEventDetail>;
  "nyx:search-box:search": CustomEvent<NyxSearchBoxEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxSearchBoxEventMap {}
}

const selector = "[data-nyx-search-box]";
const instances = new WeakMap<HTMLElement, NyxSearchBox>();
let generatedId = 0;

export class NyxSearchBox {
  readonly clearButton: HTMLButtonElement | null;
  readonly element: HTMLElement;
  readonly input: HTMLInputElement;
  readonly listbox: HTMLElement;

  private readonly dismissal: NyxOverlayDismissal;
  private readonly empty: HTMLElement | undefined;
  private readonly groups: HTMLElement[];
  private readonly options: HTMLElement[];
  private readonly placement: NyxOverlayPlacement;
  private readonly results: NyxResultList;
  private openState = false;
  private stopPositioning: (() => void) | undefined;

  constructor(element: HTMLElement, options: NyxSearchBoxOptions = {}) {
    this.element = element;
    const input = element.querySelector<HTMLInputElement>("input[role='combobox']");
    const listbox = element.querySelector<HTMLElement>("[role='listbox']");
    if (!input || !listbox) throw new Error("NyxSearchBox requires an input with role=combobox and a listbox.");
    if (!listbox.id) listbox.id = `nyx-search-box-listbox-${++generatedId}`;
    this.input = input;
    this.listbox = listbox;
    this.clearButton = element.querySelector<HTMLButtonElement>("[data-nyx-search-box-clear]");
    this.options = Array.from(listbox.querySelectorAll<HTMLElement>("[role='option']"));
    this.groups = Array.from(listbox.querySelectorAll<HTMLElement>("[role='group']"));
    this.options.forEach((option, index) => { if (!option.id) option.id = `${listbox.id}-option-${index + 1}`; });
    this.empty = listbox.querySelector<HTMLElement>("[data-nyx-search-box-empty]") ?? undefined;
    this.placement = options.placement ?? (element.dataset.nyxSearchBoxPlacement as NyxOverlayPlacement | undefined) ?? "bottom-start";
    this.results = new NyxResultList({ input, listbox, options: this.options, groups: this.groups, ...(this.empty ? { empty: this.empty } : {}) });
    this.dismissal = new NyxOverlayDismissal({ element, onDismiss: this.handleDismiss });

    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", listbox.id);
    input.setAttribute("aria-expanded", "false");
    listbox.setAttribute("popover", "manual");
    listbox.hidden = true;
    this.element.dataset.state = "closed";
    this.syncClearButton();

    input.addEventListener("click", this.handleInputClick);
    input.addEventListener("focus", this.handleInputFocus);
    input.addEventListener("input", this.handleInput);
    input.addEventListener("keydown", this.handleKeydown);
    this.clearButton?.addEventListener("click", this.handleClearClick);
    listbox.addEventListener("click", this.handleOptionClick);
    listbox.addEventListener("pointerdown", this.handlePointerDown);
    if (element instanceof HTMLFormElement) element.addEventListener("submit", this.handleSubmit);
  }

  get expanded(): boolean {
    return this.openState;
  }

  get value(): string {
    return this.input.value;
  }

  set value(value: string) {
    this.input.value = value;
    this.syncClearButton();
    this.filter(value);
  }

  open(): void {
    if (this.openState || this.input.disabled) return;
    if (!dispatchNyxEvent(this.element, "nyx:search-box:before-open", { searchBox: this }, true)) return;
    this.openState = true;
    this.listbox.hidden = false;
    this.listbox.showPopover?.();
    this.input.setAttribute("aria-expanded", "true");
    this.element.dataset.state = "open";
    this.filter();
    this.stopPositioning = positionOverlay(this.input, this.listbox, { placement: this.placement });
    this.dismissal.activate();
    dispatchNyxEvent(this.element, "nyx:search-box:open", { searchBox: this });
  }

  close(reason: NyxSearchBoxCloseReason = "api"): void {
    if (!this.openState) return;
    const cancelable = reason !== "destroy";
    if (!dispatchNyxEvent(this.element, "nyx:search-box:before-close", { reason, searchBox: this }, cancelable)) return;
    this.openState = false;
    this.stopPositioning?.();
    this.stopPositioning = undefined;
    this.dismissal.deactivate();
    this.listbox.hidePopover?.();
    this.listbox.hidden = true;
    this.input.setAttribute("aria-expanded", "false");
    this.results.clearActive();
    this.element.dataset.state = "closed";
    dispatchNyxEvent(this.element, "nyx:search-box:close", { reason, searchBox: this });
  }

  clear(): boolean {
    const query = this.input.value;
    if (!query) return false;
    const detail: NyxSearchBoxEventDetail = { query, searchBox: this };
    if (!dispatchNyxEvent(this.element, "nyx:search-box:before-clear", detail, true)) return false;
    this.input.value = "";
    this.syncClearButton();
    this.open();
    this.filter("");
    this.input.focus();
    dispatchNyxEvent(this.element, "nyx:search-box:clear", { query: "", searchBox: this });
    return true;
  }

  filter(query = this.input.value): number {
    const visibleCount = this.results.filter(query, (option, needle) => needle
      ? (option.dataset.nyxSearchText ?? option.textContent ?? "").trim().toLocaleLowerCase().includes(needle)
      : option.hasAttribute("data-nyx-search-box-recent"));
    dispatchNyxEvent(this.element, "nyx:search-box:filter", { query, searchBox: this, visibleCount });
    return visibleCount;
  }

  search(query = this.input.value, reason: NyxSearchBoxSearchReason = "api", option?: HTMLElement): boolean {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return false;
    const detail: NyxSearchBoxEventDetail = { ...(option ? { option } : {}), query: normalizedQuery, reason, searchBox: this };
    if (!dispatchNyxEvent(this.element, "nyx:search-box:before-search", detail, true)) return false;
    this.input.value = normalizedQuery;
    this.syncClearButton();
    this.close("search");
    dispatchNyxEvent(this.element, "nyx:search-box:search", detail);
    return true;
  }

  destroy(): void {
    this.close("destroy");
    this.dismissal.destroy();
    this.results.destroy();
    this.input.removeEventListener("click", this.handleInputClick);
    this.input.removeEventListener("focus", this.handleInputFocus);
    this.input.removeEventListener("input", this.handleInput);
    this.input.removeEventListener("keydown", this.handleKeydown);
    this.clearButton?.removeEventListener("click", this.handleClearClick);
    this.listbox.removeEventListener("click", this.handleOptionClick);
    this.listbox.removeEventListener("pointerdown", this.handlePointerDown);
    if (this.element instanceof HTMLFormElement) this.element.removeEventListener("submit", this.handleSubmit);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private syncClearButton(): void {
    if (this.clearButton) this.clearButton.hidden = !this.input.value;
  }

  private readonly handleClearClick = (): void => { this.clear(); };
  private readonly handleInputClick = (): void => { this.open(); };
  private readonly handleInputFocus = (): void => { this.open(); };

  private readonly handleInput = (): void => {
    this.syncClearButton();
    if (!this.openState) this.open();
    this.filter();
  };

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
    } else if (event.key === "Enter") {
      const option = this.openState ? this.results.activeOption : null;
      event.preventDefault();
      if (option) this.search(option.dataset.value ?? resultText(option), "suggestion", option);
      else this.search(this.input.value, "enter");
    } else if (event.key === "Escape" && this.openState) {
      event.preventDefault();
      this.close("escape");
    } else if (event.key === "Tab" && this.openState) {
      this.close("tab");
    }
  };

  private readonly handleOptionClick = (event: MouseEvent): void => {
    const option = event.target instanceof Element ? event.target.closest<HTMLElement>("[role='option']") : null;
    if (option && this.options.includes(option) && !option.hidden && !isResultDisabled(option)) {
      this.search(option.dataset.value ?? resultText(option), "suggestion", option);
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.target instanceof Element && event.target.closest("[role='option']")) event.preventDefault();
  };

  private readonly handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    this.search(this.input.value, "submit");
  };

  private readonly handleDismiss = (reason: NyxOverlayDismissReason): void => { this.close(reason); };
}

export function initSearchBoxes(root: ParentNode = document): NyxSearchBox[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxSearchBox(element);
    instances.set(element, instance);
    return instance;
  });
}
