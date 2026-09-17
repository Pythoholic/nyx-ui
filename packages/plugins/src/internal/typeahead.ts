import { isDisabledItem } from "./roving-focus.js";

export class NyxTypeahead {
  private buffer = "";
  private readonly items: readonly HTMLElement[];
  private resetTimer: number | undefined;
  private readonly timeout: number;
  private readonly window: Window;

  constructor(items: readonly HTMLElement[], timeout = 500) {
    this.items = items;
    this.timeout = timeout;
    this.window = items[0]?.ownerDocument.defaultView ?? window;
  }

  match(event: KeyboardEvent): HTMLElement | null {
    if (
      event.key.length !== 1 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      !event.key.trim()
    ) {
      return null;
    }

    if (this.resetTimer !== undefined) this.window.clearTimeout(this.resetTimer);
    this.buffer += event.key.toLocaleLowerCase();
    this.resetTimer = this.window.setTimeout(() => {
      this.buffer = "";
      this.resetTimer = undefined;
    }, this.timeout);

    const enabled = this.items.filter((item) => !isDisabledItem(item));
    if (enabled.length === 0) return null;
    const repeated = Array.from(this.buffer).every(
      (character) => character === this.buffer[0],
    );
    const query = repeated ? this.buffer[0] ?? "" : this.buffer;
    const currentIndex =
      event.target instanceof HTMLElement ? enabled.indexOf(event.target) : -1;
    const ordered = [
      ...enabled.slice(currentIndex + 1),
      ...enabled.slice(0, currentIndex + 1),
    ];
    return (
      ordered.find((item) =>
        (item.textContent ?? "").trim().toLocaleLowerCase().startsWith(query),
      ) ?? null
    );
  }

  destroy(): void {
    if (this.resetTimer !== undefined) this.window.clearTimeout(this.resetTimer);
    this.resetTimer = undefined;
    this.buffer = "";
  }
}

