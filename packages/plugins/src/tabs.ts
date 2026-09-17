export class NyxTabs {
  readonly element: HTMLElement;

  private readonly tabs: HTMLButtonElement[];
  private readonly panels: HTMLElement[];

  constructor(element: HTMLElement) {
    this.element = element;
    this.tabs = Array.from(
      element.querySelectorAll<HTMLButtonElement>("[role='tab']"),
    );
    this.panels = this.tabs.flatMap((tab) => {
      const panelId = tab.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      return panel ? [panel] : [];
    });

    if (this.tabs.length === 0 || this.panels.length !== this.tabs.length) {
      throw new Error("NyxTabs requires every tab to reference one panel.");
    }

    this.tabs.forEach((tab, index) => {
      tab.addEventListener("click", this.handleClick);
      tab.addEventListener("keydown", this.handleKeydown);
      if (tab.getAttribute("aria-selected") === "true") this.activate(index, false);
    });

    if (!this.tabs.some((tab) => tab.getAttribute("aria-selected") === "true")) {
      this.activate(0, false);
    }
  }

  activate(index: number, moveFocus = true): void {
    const nextIndex = (index + this.tabs.length) % this.tabs.length;

    this.tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === nextIndex;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      this.panels[tabIndex]?.toggleAttribute("hidden", !active);
    });

    if (moveFocus) this.tabs[nextIndex]?.focus();
    this.element.dispatchEvent(
      new CustomEvent("nyx:tabs:change", {
        bubbles: true,
        detail: { index: nextIndex, tab: this.tabs[nextIndex] },
      }),
    );
  }

  destroy(): void {
    this.tabs.forEach((tab) => {
      tab.removeEventListener("click", this.handleClick);
      tab.removeEventListener("keydown", this.handleKeydown);
    });
  }

  private readonly handleClick = (event: Event): void => {
    const index = this.tabs.indexOf(event.currentTarget as HTMLButtonElement);
    if (index >= 0) this.activate(index, false);
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    const currentIndex = this.tabs.indexOf(event.currentTarget as HTMLButtonElement);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex += 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex -= 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = this.tabs.length - 1;
    else return;

    event.preventDefault();
    this.activate(nextIndex);
  };
}

const instances = new WeakMap<HTMLElement, NyxTabs>();

export function initTabs(root: ParentNode = document): NyxTabs[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-nyx-tabs]")).map(
    (element) => {
      const current = instances.get(element);
      if (current) return current;
      const instance = new NyxTabs(element);
      instances.set(element, instance);
      return instance;
    },
  );
}

