import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export interface NyxTabsEventDetail {
  index: number;
  previousIndex: number;
  tab: HTMLButtonElement;
  tabs: NyxTabs;
}

export interface NyxTabsEventMap {
  "nyx:tabs:before-change": CustomEvent<NyxTabsEventDetail>;
  "nyx:tabs:change": CustomEvent<NyxTabsEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxTabsEventMap {}
}

const instances = new WeakMap<HTMLElement, NyxTabs>();
const tabsSelector = "[data-nyx-tabs]";

export class NyxTabs {
  readonly element: HTMLElement;

  private readonly panels: HTMLElement[];
  private readonly tabs: HTMLButtonElement[];
  private activeIndex = 0;

  constructor(element: HTMLElement) {
    this.element = element;
    this.tabs = Array.from(
      element.querySelectorAll<HTMLButtonElement>("[role='tab']"),
    );
    this.panels = this.tabs.flatMap((tab) => {
      const panelId = tab.getAttribute("aria-controls");
      const panel = panelId
        ? element.ownerDocument.getElementById(panelId)
        : null;
      return panel ? [panel] : [];
    });

    if (this.tabs.length === 0 || this.panels.length !== this.tabs.length) {
      throw new Error("NyxTabs requires every tab to reference one panel.");
    }

    const selectedIndex = this.tabs.findIndex(
      (tab) => tab.getAttribute("aria-selected") === "true",
    );
    this.activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", this.handleClick);
      tab.addEventListener("keydown", this.handleKeydown);
    });
    this.syncState();
  }

  get value(): number {
    return this.activeIndex;
  }

  set value(index: number) {
    this.activate(index, false);
  }

  activate(index: number, moveFocus = true): void {
    const nextIndex =
      ((index % this.tabs.length) + this.tabs.length) % this.tabs.length;
    if (nextIndex === this.activeIndex) {
      if (moveFocus) this.tabs[nextIndex]?.focus();
      return;
    }

    const tab = this.tabs[nextIndex];
    if (!tab) return;
    const detail: NyxTabsEventDetail = {
      index: nextIndex,
      previousIndex: this.activeIndex,
      tab,
      tabs: this,
    };
    if (
      !dispatchNyxEvent(
        this.element,
        "nyx:tabs:before-change",
        detail,
        true,
      )
    ) {
      return;
    }

    this.activeIndex = nextIndex;
    this.syncState();
    if (moveFocus) tab.focus();
    dispatchNyxEvent(this.element, "nyx:tabs:change", detail);
  }

  destroy(): void {
    this.tabs.forEach((tab) => {
      tab.removeEventListener("click", this.handleClick);
      tab.removeEventListener("keydown", this.handleKeydown);
    });
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private readonly handleClick = (event: Event): void => {
    const index = this.tabs.indexOf(event.currentTarget as HTMLButtonElement);
    if (index >= 0) this.activate(index, false);
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    const currentIndex = this.tabs.indexOf(
      event.currentTarget as HTMLButtonElement,
    );
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex += 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex -= 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = this.tabs.length - 1;
    else return;

    event.preventDefault();
    this.activate(nextIndex);
  };

  private syncState(): void {
    this.tabs.forEach((tab, index) => {
      const active = index === this.activeIndex;
      tab.dataset.state = active ? "active" : "inactive";
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      this.panels[index]?.toggleAttribute("hidden", !active);
      if (this.panels[index]) {
        this.panels[index].dataset.state = active ? "active" : "inactive";
      }
    });
  }
}

export function initTabs(root: ParentNode = document): NyxTabs[] {
  return queryAllIncludingRoot<HTMLElement>(root, tabsSelector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxTabs(element);
    instances.set(element, instance);
    return instance;
  });
}
