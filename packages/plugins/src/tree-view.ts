import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxTreeSelectionMode = "multiple" | "none" | "single";
export type NyxTreeChangeReason = "api" | "keyboard" | "pointer";

export interface NyxTreeViewEventDetail {
  item: HTMLElement;
  reason: NyxTreeChangeReason;
  selected?: boolean;
  tree: NyxTreeView;
}

export interface NyxTreeViewEventMap {
  "nyx:tree:before-collapse": CustomEvent<NyxTreeViewEventDetail>;
  "nyx:tree:before-expand": CustomEvent<NyxTreeViewEventDetail>;
  "nyx:tree:before-select": CustomEvent<NyxTreeViewEventDetail>;
  "nyx:tree:collapse": CustomEvent<NyxTreeViewEventDetail>;
  "nyx:tree:expand": CustomEvent<NyxTreeViewEventDetail>;
  "nyx:tree:select": CustomEvent<NyxTreeViewEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxTreeViewEventMap {}
}

const selector = "[data-nyx-tree]";
const itemSelector = "[data-nyx-tree-item]";
const instances = new WeakMap<HTMLElement, NyxTreeView>();

export class NyxTreeView {
  readonly element: HTMLElement;
  readonly selectionMode: NyxTreeSelectionMode;

  private readonly items: HTMLElement[];
  private typeaheadBuffer = "";
  private typeaheadTimer: number | undefined;
  private readonly view: Window;

  constructor(element: HTMLElement) {
    this.element = element;
    this.view = element.ownerDocument.defaultView ?? window;
    this.selectionMode =
      (element.dataset.nyxTreeSelection as NyxTreeSelectionMode | undefined) ?? "single";
    this.items = Array.from(element.querySelectorAll<HTMLElement>(itemSelector)).filter(
      (item) => item.closest(selector) === element,
    );
    element.setAttribute("role", "tree");
    if (this.selectionMode === "multiple") element.setAttribute("aria-multiselectable", "true");
    else element.removeAttribute("aria-multiselectable");
    this.syncStructure();
    this.syncRovingFocus();
    element.addEventListener("click", this.handleClick);
    element.addEventListener("keydown", this.handleKeydown);
  }

  get selectedItems(): HTMLElement[] {
    return this.items.filter((item) => item.getAttribute("aria-selected") === "true");
  }

  expand(item: HTMLElement, reason: NyxTreeChangeReason = "api"): boolean {
    const group = this.childGroup(item);
    if (!group || item.getAttribute("aria-expanded") === "true") return false;
    const detail = { item, reason, tree: this };
    if (!dispatchNyxEvent(this.element, "nyx:tree:before-expand", detail, true)) return false;
    item.setAttribute("aria-expanded", "true");
    item.dataset.state = "expanded";
    group.hidden = false;
    this.syncRovingFocus(item);
    dispatchNyxEvent(this.element, "nyx:tree:expand", detail);
    return true;
  }

  collapse(item: HTMLElement, reason: NyxTreeChangeReason = "api"): boolean {
    const group = this.childGroup(item);
    if (!group || item.getAttribute("aria-expanded") !== "true") return false;
    const detail = { item, reason, tree: this };
    if (!dispatchNyxEvent(this.element, "nyx:tree:before-collapse", detail, true)) return false;
    item.setAttribute("aria-expanded", "false");
    item.dataset.state = "collapsed";
    group.hidden = true;
    this.syncRovingFocus(item);
    dispatchNyxEvent(this.element, "nyx:tree:collapse", detail);
    return true;
  }

  select(item: HTMLElement, selected = true, reason: NyxTreeChangeReason = "api"): boolean {
    if (this.selectionMode === "none" || !this.items.includes(item)) return false;
    const next = this.selectionMode === "single" ? true : selected;
    if (item.getAttribute("aria-selected") === String(next) &&
      (this.selectionMode !== "single" || this.selectedItems.length === 1)) return false;
    const detail = { item, reason, selected: next, tree: this };
    if (!dispatchNyxEvent(this.element, "nyx:tree:before-select", detail, true)) return false;
    if (this.selectionMode === "single") {
      this.items.forEach((candidate) => {
        candidate.setAttribute("aria-selected", String(candidate === item));
        candidate.toggleAttribute("data-selected", candidate === item);
      });
    } else {
      item.setAttribute("aria-selected", String(next));
      item.toggleAttribute("data-selected", next);
    }
    dispatchNyxEvent(this.element, "nyx:tree:select", detail);
    return true;
  }

  destroy(): void {
    if (this.typeaheadTimer !== undefined) this.view.clearTimeout(this.typeaheadTimer);
    this.element.removeEventListener("click", this.handleClick);
    this.element.removeEventListener("keydown", this.handleKeydown);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private childGroup(item: HTMLElement): HTMLElement | null {
    return Array.from(item.children).find(
      (child): child is HTMLElement => child instanceof HTMLElement && child.getAttribute("role") === "group",
    ) ?? null;
  }

  private parentItem(item: HTMLElement): HTMLElement | null {
    const group = item.parentElement;
    if (group?.getAttribute("role") !== "group") return null;
    const parent = group.parentElement;
    return parent instanceof HTMLElement && parent.matches(itemSelector) ? parent : null;
  }

  private siblingItems(item: HTMLElement): HTMLElement[] {
    const parent = item.parentElement;
    if (!parent) return [];
    return Array.from(parent.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.matches(itemSelector),
    );
  }

  private visibleItems(): HTMLElement[] {
    return this.items.filter((item) => {
      let parent = this.parentItem(item);
      while (parent) {
        if (parent.getAttribute("aria-expanded") !== "true") return false;
        parent = this.parentItem(parent);
      }
      return !item.hidden;
    });
  }

  private syncStructure(): void {
    this.items.forEach((item) => {
      item.setAttribute("role", "treeitem");
      const siblings = this.siblingItems(item);
      item.setAttribute("aria-level", String(this.level(item)));
      item.setAttribute("aria-setsize", String(siblings.length));
      item.setAttribute("aria-posinset", String(siblings.indexOf(item) + 1));
      if (this.selectionMode !== "none" && !item.hasAttribute("aria-selected")) {
        item.setAttribute("aria-selected", "false");
      }
      const group = Array.from(item.children).find(
        (child): child is HTMLUListElement => child instanceof HTMLUListElement,
      );
      if (!group) return;
      group.setAttribute("role", "group");
      const expanded = item.getAttribute("aria-expanded") !== "false";
      item.setAttribute("aria-expanded", String(expanded));
      item.dataset.state = expanded ? "expanded" : "collapsed";
      group.hidden = !expanded;
    });
  }

  private level(item: HTMLElement): number {
    let level = 1;
    let parent = this.parentItem(item);
    while (parent) { level += 1; parent = this.parentItem(parent); }
    return level;
  }

  private syncRovingFocus(preferred?: HTMLElement): void {
    const visible = this.visibleItems();
    const current = preferred && visible.includes(preferred)
      ? preferred
      : visible.find((item) => item.tabIndex === 0) ?? visible[0];
    this.items.forEach((item) => { item.tabIndex = item === current ? 0 : -1; });
  }

  private focus(item: HTMLElement | undefined): void {
    if (!item) return;
    this.syncRovingFocus(item);
    item.focus();
  }

  private label(item: HTMLElement): string {
    const label = Array.from(item.querySelectorAll<HTMLElement>("[data-nyx-tree-label]")).find(
      (candidate) => candidate.closest(itemSelector) === item,
    );
    return (label?.textContent ?? item.dataset.nyxTreeLabel ?? "").trim().toLocaleLowerCase();
  }

  private typeahead(event: KeyboardEvent): boolean {
    if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey || !event.key.trim()) return false;
    if (this.typeaheadTimer !== undefined) this.view.clearTimeout(this.typeaheadTimer);
    this.typeaheadBuffer += event.key.toLocaleLowerCase();
    this.typeaheadTimer = this.view.setTimeout(() => { this.typeaheadBuffer = ""; }, 500);
    const visible = this.visibleItems();
    const repeated = Array.from(this.typeaheadBuffer).every((character) => character === this.typeaheadBuffer[0]);
    const query = repeated ? this.typeaheadBuffer[0] ?? "" : this.typeaheadBuffer;
    const current = event.target instanceof HTMLElement ? visible.indexOf(event.target) : -1;
    const ordered = [...visible.slice(current + 1), ...visible.slice(0, current + 1)];
    const match = ordered.find((item) => this.label(item).startsWith(query));
    if (!match) return false;
    event.preventDefault();
    this.focus(match);
    return true;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const item = target?.closest<HTMLElement>(itemSelector);
    if (!item || !this.items.includes(item)) return;
    this.focus(item);
    if (target?.closest("[data-nyx-tree-toggle]")) {
      if (item.getAttribute("aria-expanded") === "true") this.collapse(item, "pointer");
      else this.expand(item, "pointer");
      return;
    }
    if (this.selectionMode === "multiple") {
      this.select(item, item.getAttribute("aria-selected") !== "true", "pointer");
    } else this.select(item, true, "pointer");
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    const item = event.target instanceof HTMLElement && this.items.includes(event.target)
      ? event.target
      : undefined;
    if (!item) return;
    const visible = this.visibleItems();
    const index = visible.indexOf(item);
    let next: HTMLElement | undefined;
    if (event.key === "ArrowDown") next = visible[Math.min(index + 1, visible.length - 1)];
    else if (event.key === "ArrowUp") next = visible[Math.max(index - 1, 0)];
    else if (event.key === "Home") next = visible[0];
    else if (event.key === "End") next = visible.at(-1);
    else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (item.getAttribute("aria-expanded") === "false") this.expand(item, "keyboard");
      else {
        const child = Array.from(this.childGroup(item)?.children ?? []).find(
          (candidate): candidate is HTMLElement => candidate instanceof HTMLElement && candidate.matches(itemSelector),
        );
        this.focus(child);
      }
      return;
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (item.getAttribute("aria-expanded") === "true") this.collapse(item, "keyboard");
      else this.focus(this.parentItem(item) ?? undefined);
      return;
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const selected = this.selectionMode === "multiple"
        ? item.getAttribute("aria-selected") !== "true"
        : true;
      this.select(item, selected, "keyboard");
      return;
    } else {
      this.typeahead(event);
      return;
    }
    event.preventDefault();
    this.focus(next);
  };
}

export function initTreeViews(root: ParentNode = document): NyxTreeView[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxTreeView(element);
    instances.set(element, instance);
    return instance;
  });
}
