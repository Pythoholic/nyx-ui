export interface NyxResultListOptions {
  empty?: HTMLElement;
  groups?: readonly HTMLElement[];
  input: HTMLInputElement;
  listbox: HTMLElement;
  options: readonly HTMLElement[];
}

export type NyxResultFilter = (option: HTMLElement, normalizedQuery: string) => boolean;

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function resultText(option: HTMLElement): string {
  return option.dataset.nyxSearchText ?? option.textContent ?? "";
}

export function isResultDisabled(option: HTMLElement): boolean {
  return option.getAttribute("aria-disabled") === "true" || option.hasAttribute("disabled");
}

export class NyxResultList {
  private active: HTMLElement | null = null;
  private readonly empty: HTMLElement | undefined;
  private readonly groups: readonly HTMLElement[];
  private readonly input: HTMLInputElement;
  private readonly listbox: HTMLElement;
  private readonly options: readonly HTMLElement[];

  constructor(options: NyxResultListOptions) {
    this.input = options.input;
    this.listbox = options.listbox;
    this.options = options.options;
    this.groups = options.groups ?? [];
    this.empty = options.empty;
  }

  get activeOption(): HTMLElement | null {
    return this.active;
  }

  get visibleOptions(): HTMLElement[] {
    return this.options.filter((option) => !option.hidden);
  }

  get enabledOptions(): HTMLElement[] {
    return this.visibleOptions.filter((option) => !isResultDisabled(option));
  }

  filter(query: string, matches?: NyxResultFilter): number {
    const needle = normalized(query);
    this.options.forEach((option) => {
      option.hidden = matches
        ? !matches(option, needle)
        : Boolean(needle) && !normalized(resultText(option)).includes(needle);
    });
    this.groups.forEach((group) => {
      group.hidden = !this.options.some((option) => group.contains(option) && !option.hidden);
    });
    const visible = this.visibleOptions;
    if (this.empty) this.empty.hidden = visible.length > 0;
    if (!this.active || this.active.hidden || isResultDisabled(this.active)) this.first();
    return visible.length;
  }

  first(): HTMLElement | null {
    return this.setActive(this.enabledOptions[0] ?? null);
  }

  last(): HTMLElement | null {
    return this.setActive(this.enabledOptions.at(-1) ?? null);
  }

  move(delta: 1 | -1): HTMLElement | null {
    const enabled = this.enabledOptions;
    if (!enabled.length) return this.setActive(null);
    const current = this.active ? enabled.indexOf(this.active) : -1;
    const fallback = delta === 1 ? 0 : enabled.length - 1;
    const index = current < 0 ? fallback : (current + delta + enabled.length) % enabled.length;
    return this.setActive(enabled[index] ?? null);
  }

  setActive(option: HTMLElement | null): HTMLElement | null {
    if (option && (option.hidden || isResultDisabled(option))) return this.active;
    this.options.forEach((candidate) => candidate.toggleAttribute("data-active", candidate === option));
    this.active = option;
    if (option) {
      this.input.setAttribute("aria-activedescendant", option.id);
      option.scrollIntoView?.({ block: "nearest" });
    } else {
      this.input.removeAttribute("aria-activedescendant");
    }
    return option;
  }

  clearActive(): void {
    this.setActive(null);
  }

  destroy(): void {
    this.clearActive();
    this.options.forEach((option) => {
      option.hidden = false;
      option.removeAttribute("data-active");
    });
    this.groups.forEach((group) => { group.hidden = false; });
    if (this.empty) this.empty.hidden = true;
  }
}
