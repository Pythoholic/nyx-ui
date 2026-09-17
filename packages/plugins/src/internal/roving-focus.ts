export type NyxRovingFocusEdge = "first" | "last";
export type NyxRovingFocusOrientation = "horizontal" | "vertical";

export function isDisabledItem(item: HTMLElement): boolean {
  return (
    (item instanceof HTMLButtonElement && item.disabled) ||
    item.getAttribute("aria-disabled") === "true" ||
    item.hasAttribute("data-disabled")
  );
}

export class NyxRovingFocus {
  private readonly items: readonly HTMLElement[];
  private readonly orientation: NyxRovingFocusOrientation;

  constructor(
    items: readonly HTMLElement[],
    orientation: NyxRovingFocusOrientation = "vertical",
  ) {
    this.items = items;
    this.orientation = orientation;
    this.sync();
  }

  focus(target: HTMLElement | NyxRovingFocusEdge): HTMLElement | null {
    const enabled = this.enabledItems();
    const item =
      typeof target === "string"
        ? target === "first"
          ? enabled[0]
          : enabled.at(-1)
        : enabled.includes(target)
          ? target
          : undefined;
    if (!item) return null;

    this.setCurrent(item);
    item.focus();
    return item;
  }

  handleKeydown(event: KeyboardEvent): boolean {
    const nextKey = this.orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    const previousKey =
      this.orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    if (
      event.key !== nextKey &&
      event.key !== previousKey &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return false;
    }

    const enabled = this.enabledItems();
    if (enabled.length === 0) return false;
    const current =
      event.target instanceof HTMLElement && enabled.includes(event.target)
        ? event.target
        : enabled.find((item) => item.tabIndex === 0) ?? enabled[0];
    if (!current) return false;
    let index = Math.max(enabled.indexOf(current), 0);

    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = enabled.length - 1;
    else if (event.key === nextKey) index = (index + 1) % enabled.length;
    else index = (index - 1 + enabled.length) % enabled.length;

    const item = enabled[index];
    if (!item) return false;
    event.preventDefault();
    this.focus(item);
    return true;
  }

  setCurrent(item: HTMLElement): void {
    this.items.forEach((candidate) => {
      candidate.tabIndex = candidate === item && !isDisabledItem(candidate) ? 0 : -1;
    });
  }

  private sync(): void {
    const enabled = this.enabledItems();
    const current = enabled.find((item) => item.tabIndex === 0) ?? enabled[0];
    this.items.forEach((item) => {
      item.tabIndex = item === current && !isDisabledItem(item) ? 0 : -1;
    });
  }

  private enabledItems(): HTMLElement[] {
    return this.items.filter((item) => !isDisabledItem(item));
  }
}
