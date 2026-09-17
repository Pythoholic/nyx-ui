import { NyxDialog, type NyxDialogCloseReason } from "./dialog.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { isResultDisabled, NyxResultList } from "./internal/result-list.js";

export interface NyxCommandPaletteOptions {
  root?: ParentNode;
}

export interface NyxCommandPaletteEventDetail {
  command?: HTMLElement;
  palette: NyxCommandPalette;
  query?: string;
  value?: string;
  visibleCount?: number;
}

export interface NyxCommandPaletteEventMap {
  "nyx:command-palette:before-run": CustomEvent<NyxCommandPaletteEventDetail>;
  "nyx:command-palette:filter": CustomEvent<NyxCommandPaletteEventDetail>;
  "nyx:command-palette:run": CustomEvent<NyxCommandPaletteEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxCommandPaletteEventMap {}
}

const selector = "dialog[data-nyx-command-palette]";
const instances = new WeakMap<HTMLDialogElement, NyxCommandPalette>();
let generatedId = 0;

export class NyxCommandPalette {
  readonly dialog: NyxDialog;
  readonly element: HTMLDialogElement;
  readonly input: HTMLInputElement;
  readonly listbox: HTMLElement;

  private readonly empty: HTMLElement | undefined;
  private readonly groups: HTMLElement[];
  private readonly options: HTMLElement[];
  private readonly results: NyxResultList;

  constructor(element: HTMLDialogElement, options: NyxCommandPaletteOptions = {}) {
    this.element = element;
    const input = element.querySelector<HTMLInputElement>("input[role='combobox']");
    const listbox = element.querySelector<HTMLElement>("[role='listbox']");
    if (!input || !listbox) throw new Error("NyxCommandPalette requires a search input with role=combobox and a result listbox.");
    if (!input.id) input.id = `nyx-command-input-${++generatedId}`;
    if (!listbox.id) listbox.id = `nyx-command-listbox-${generatedId}`;
    this.input = input;
    this.listbox = listbox;
    this.options = Array.from(listbox.querySelectorAll<HTMLElement>("[role='option']"));
    this.groups = Array.from(listbox.querySelectorAll<HTMLElement>("[role='group']"));
    this.options.forEach((option, index) => { if (!option.id) option.id = `${listbox.id}-option-${index + 1}`; });
    this.empty = listbox.querySelector<HTMLElement>("[data-nyx-command-palette-empty]") ?? undefined;
    this.results = new NyxResultList({
      input,
      listbox,
      options: this.options,
      groups: this.groups,
      ...(this.empty ? { empty: this.empty } : {}),
    });
    this.dialog = new NyxDialog(element, { root: options.root ?? element.ownerDocument, initialFocus: `#${input.id}` });

    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", listbox.id);
    input.setAttribute("aria-expanded", "false");
    input.addEventListener("input", this.handleInput);
    input.addEventListener("keydown", this.handleKeydown);
    listbox.addEventListener("click", this.handleCommandClick);
    listbox.addEventListener("pointerdown", this.handlePointerDown);
    element.addEventListener("nyx:dialog:open", this.handleDialogOpen);
    element.addEventListener("nyx:dialog:close", this.handleDialogClose);
    this.filter("");
    this.results.clearActive();
  }

  get value(): boolean {
    return this.dialog.value;
  }

  get query(): string {
    return this.input.value;
  }

  set query(value: string) {
    this.input.value = value;
    this.filter(value);
  }

  open(trigger?: HTMLElement): void {
    this.dialog.open(trigger);
  }

  close(reason: NyxDialogCloseReason = "api"): void {
    this.dialog.close(reason);
  }

  filter(query = this.input.value): number {
    const visibleCount = this.results.filter(query);
    dispatchNyxEvent(this.element, "nyx:command-palette:filter", { palette: this, query, visibleCount });
    return visibleCount;
  }

  run(command: HTMLElement): void {
    if (!this.options.includes(command) || command.hidden || isResultDisabled(command)) return;
    const value = command.dataset.value ?? command.textContent?.trim() ?? "";
    const detail: NyxCommandPaletteEventDetail = { command, palette: this, value };
    if (!dispatchNyxEvent(this.element, "nyx:command-palette:before-run", detail, true)) return;
    this.close("api");
    dispatchNyxEvent(this.element, "nyx:command-palette:run", detail);
  }

  destroy(): void {
    this.dialog.destroy();
    this.results.destroy();
    this.input.removeEventListener("input", this.handleInput);
    this.input.removeEventListener("keydown", this.handleKeydown);
    this.listbox.removeEventListener("click", this.handleCommandClick);
    this.listbox.removeEventListener("pointerdown", this.handlePointerDown);
    this.element.removeEventListener("nyx:dialog:open", this.handleDialogOpen);
    this.element.removeEventListener("nyx:dialog:close", this.handleDialogClose);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private readonly handleInput = (): void => { this.filter(); };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      this.results.move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      this.results.first();
    } else if (event.key === "End") {
      event.preventDefault();
      this.results.last();
    } else if (event.key === "Enter") {
      event.preventDefault();
      const command = this.results.activeOption;
      if (command) this.run(command);
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.close("escape");
    }
  };

  private readonly handleCommandClick = (event: MouseEvent): void => {
    const command = event.target instanceof Element ? event.target.closest<HTMLElement>("[role='option']") : null;
    if (command) this.run(command);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.target instanceof Element && event.target.closest("[role='option']")) event.preventDefault();
  };

  private readonly handleDialogOpen = (event: Event): void => {
    if (event.target !== this.element) return;
    this.input.setAttribute("aria-expanded", "true");
    this.filter();
  };

  private readonly handleDialogClose = (event: Event): void => {
    if (event.target !== this.element) return;
    this.input.setAttribute("aria-expanded", "false");
    this.input.value = "";
    this.filter("");
    this.results.clearActive();
  };
}

export function initCommandPalettes(root: ParentNode = document): NyxCommandPalette[] {
  return queryAllIncludingRoot<HTMLDialogElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxCommandPalette(element, { root });
    instances.set(element, instance);
    return instance;
  });
}
