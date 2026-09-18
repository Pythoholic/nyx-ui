import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { getTextDirection, horizontalArrowDelta } from "./internal/direction.js";

export type NyxResizableOrientation = "horizontal" | "vertical";
export type NyxResizableReason = "api" | "keyboard" | "pointer" | "restore";

export interface NyxResizablePanelsOptions {
  storage?: Storage;
}

export interface NyxResizablePanelsEventDetail {
  collapsed: boolean;
  group: NyxResizablePanels;
  reason: NyxResizableReason;
  size: number;
}

export interface NyxResizablePanelsEventMap {
  "nyx:resizable:before-collapse": CustomEvent<NyxResizablePanelsEventDetail>;
  "nyx:resizable:before-expand": CustomEvent<NyxResizablePanelsEventDetail>;
  "nyx:resizable:before-resize": CustomEvent<NyxResizablePanelsEventDetail>;
  "nyx:resizable:collapse": CustomEvent<NyxResizablePanelsEventDetail>;
  "nyx:resizable:expand": CustomEvent<NyxResizablePanelsEventDetail>;
  "nyx:resizable:resize": CustomEvent<NyxResizablePanelsEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxResizablePanelsEventMap {}
}

const selector = "[data-nyx-resizable]";
const instances = new WeakMap<HTMLElement, NyxResizablePanels>();

function numberValue(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export class NyxResizablePanels {
  readonly element: HTMLElement;
  readonly handle: HTMLElement;
  readonly orientation: NyxResizableOrientation;
  readonly panels: [HTMLElement, HTMLElement];

  private collapsedState = false;
  private expandedSize = 50;
  private pointerId: number | undefined;
  private pointerStart = 0;
  private sizeStart = 0;
  private sizeState: number;
  private readonly storage: Storage | undefined;
  private readonly storageKey: string | undefined;

  constructor(element: HTMLElement, options: NyxResizablePanelsOptions = {}) {
    this.element = element;
    this.orientation = element.dataset.nyxResizableOrientation === "vertical" ? "vertical" : "horizontal";
    const panels = Array.from(element.querySelectorAll<HTMLElement>("[data-nyx-resizable-panel]")).filter(
      (panel) => panel.closest(selector) === element,
    );
    const handle = Array.from(element.querySelectorAll<HTMLElement>("[data-nyx-resizable-handle]")).find(
      (candidate) => candidate.closest(selector) === element,
    );
    if (panels.length !== 2 || !handle) {
      throw new Error("NyxResizablePanels requires exactly two owned panels and one owned handle.");
    }
    this.panels = [panels[0]!, panels[1]!];
    this.handle = handle;
    this.storageKey = element.hasAttribute("data-nyx-resizable-persist")
      ? element.dataset.nyxResizablePersist || (element.id ? `${element.id}:size` : undefined)
      : undefined;
    this.storage = options.storage ?? this.getStorage();
    const restored = this.restoreSize();
    this.sizeState = this.clamp(restored ?? numberValue(this.panels[0].dataset.nyxSize, 50));
    this.expandedSize = this.sizeState || this.minimum;

    handle.setAttribute("role", "separator");
    handle.tabIndex = handle.tabIndex >= 0 ? handle.tabIndex : 0;
    handle.addEventListener("keydown", this.handleKeydown);
    handle.addEventListener("pointerdown", this.handlePointerDown);
    handle.addEventListener("pointermove", this.handlePointerMove);
    handle.addEventListener("pointerup", this.handlePointerEnd);
    handle.addEventListener("pointercancel", this.handlePointerEnd);
    handle.addEventListener("lostpointercapture", this.handleLostPointerCapture);
    this.sync();
    element.setAttribute("data-nyx-resizable-ready", "");
  }

  get size(): number { return this.sizeState; }
  get collapsed(): boolean { return this.collapsedState; }
  get minimum(): number {
    return Math.max(
      numberValue(this.panels[0].dataset.nyxMinSize, 10),
      100 - numberValue(this.panels[1].dataset.nyxMaxSize, 90),
    );
  }
  get maximum(): number {
    return Math.min(
      numberValue(this.panels[0].dataset.nyxMaxSize, 90),
      100 - numberValue(this.panels[1].dataset.nyxMinSize, 10),
    );
  }

  resize(size: number, reason: NyxResizableReason = "api"): boolean {
    const next = this.clamp(size);
    if (next === this.sizeState && !this.collapsedState) return false;
    const detail = { collapsed: false, group: this, reason, size: next };
    if (!dispatchNyxEvent(this.element, "nyx:resizable:before-resize", detail, true)) return false;
    this.sizeState = next;
    this.collapsedState = false;
    this.expandedSize = next;
    this.persist();
    this.sync();
    dispatchNyxEvent(this.element, "nyx:resizable:resize", detail);
    return true;
  }

  collapse(reason: NyxResizableReason = "api"): boolean {
    if (!this.collapsible || this.collapsedState) return false;
    const detail = { collapsed: true, group: this, reason, size: 0 };
    if (!dispatchNyxEvent(this.element, "nyx:resizable:before-collapse", detail, true)) return false;
    this.expandedSize = this.sizeState;
    this.sizeState = 0;
    this.collapsedState = true;
    this.persist();
    this.sync();
    dispatchNyxEvent(this.element, "nyx:resizable:collapse", detail);
    return true;
  }

  expand(reason: NyxResizableReason = "api"): boolean {
    if (!this.collapsedState) return false;
    const next = this.clamp(this.expandedSize || this.minimum);
    const detail = { collapsed: false, group: this, reason, size: next };
    if (!dispatchNyxEvent(this.element, "nyx:resizable:before-expand", detail, true)) return false;
    this.sizeState = next;
    this.collapsedState = false;
    this.expandedSize = next;
    this.persist();
    this.sync();
    dispatchNyxEvent(this.element, "nyx:resizable:expand", detail);
    return true;
  }

  toggleCollapse(reason: NyxResizableReason = "api"): boolean {
    return this.collapsedState ? this.expand(reason) : this.collapse(reason);
  }

  destroy(): void {
    this.finishPointer();
    this.handle.removeEventListener("keydown", this.handleKeydown);
    this.handle.removeEventListener("pointerdown", this.handlePointerDown);
    this.handle.removeEventListener("pointermove", this.handlePointerMove);
    this.handle.removeEventListener("pointerup", this.handlePointerEnd);
    this.handle.removeEventListener("pointercancel", this.handlePointerEnd);
    this.handle.removeEventListener("lostpointercapture", this.handleLostPointerCapture);
    this.element.removeAttribute("data-nyx-resizable-ready");
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private get collapsible(): boolean { return this.panels[0].hasAttribute("data-nyx-collapsible"); }
  private get step(): number { return Math.max(0.1, numberValue(this.element.dataset.nyxResizableStep, 5)); }
  private clamp(value: number): number { return Math.min(this.maximum, Math.max(this.minimum, value)); }

  private getStorage(): Storage | undefined {
    if (!this.storageKey) return undefined;
    try { return window.localStorage; } catch { return undefined; }
  }

  private restoreSize(): number | undefined {
    if (!this.storageKey || !this.storage) return undefined;
    try {
      const value = this.storage.getItem(this.storageKey);
      if (value === null) return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    } catch { return undefined; }
  }

  private persist(): void {
    if (!this.storageKey || !this.storage) return;
    try { this.storage.setItem(this.storageKey, String(this.sizeState)); } catch { /* Storage may be unavailable. */ }
  }

  private sync(): void {
    const first = this.sizeState;
    const second = 100 - first;
    this.element.style.setProperty("--nyx-resizable-first", `${first}%`);
    this.element.style.setProperty("--nyx-resizable-second", `${second}%`);
    this.element.dataset.state = this.collapsedState ? "collapsed" : "expanded";
    this.panels[0].dataset.state = this.collapsedState ? "collapsed" : "expanded";
    this.handle.setAttribute("aria-orientation", this.orientation === "horizontal" ? "vertical" : "horizontal");
    this.handle.setAttribute("aria-valuemin", String(this.collapsible ? 0 : this.minimum));
    this.handle.setAttribute("aria-valuemax", String(this.maximum));
    this.handle.setAttribute("aria-valuenow", String(Math.round(first * 10) / 10));
    this.handle.setAttribute("aria-valuetext", this.collapsedState ? "Collapsed" : `${Math.round(first)} percent`);
  }

  private finishPointer(): void {
    if (this.pointerId === undefined) return;
    try {
      if (this.handle.hasPointerCapture?.(this.pointerId)) this.handle.releasePointerCapture(this.pointerId);
    } catch { /* Capture may already be released. */ }
    this.pointerId = undefined;
    this.element.removeAttribute("data-nyx-resizing");
    this.element.ownerDocument.documentElement.classList.remove("nyx-resizing");
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    const horizontal = this.orientation === "horizontal";
    let next: number | undefined;
    if (event.key === "Home") next = this.collapsible ? 0 : this.minimum;
    else if (event.key === "End") next = this.maximum;
    else if (horizontal && horizontalArrowDelta(event.key, this.element) !== 0) {
      next = this.sizeState + horizontalArrowDelta(event.key, this.element) * this.step;
    }
    else if (!horizontal && event.key === "ArrowUp") next = this.sizeState - this.step;
    else if (!horizontal && event.key === "ArrowDown") next = this.sizeState + this.step;
    else if (event.key === "Enter" && this.collapsible) {
      event.preventDefault();
      this.toggleCollapse("keyboard");
      return;
    } else return;
    event.preventDefault();
    if (next === 0 && this.collapsible) this.collapse("keyboard");
    else this.resize(next, "keyboard");
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    event.preventDefault();
    this.pointerId = event.pointerId;
    this.pointerStart = this.orientation === "horizontal" ? event.clientX : event.clientY;
    this.sizeStart = this.collapsedState ? 0 : this.sizeState;
    this.element.setAttribute("data-nyx-resizing", "");
    this.element.ownerDocument.documentElement.classList.add("nyx-resizing");
    try { this.handle.setPointerCapture?.(event.pointerId); } catch { /* Pointer capture is best effort. */ }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    const rect = this.element.getBoundingClientRect();
    const extent = this.orientation === "horizontal" ? rect.width : rect.height;
    if (extent <= 0) return;
    const coordinate = this.orientation === "horizontal" ? event.clientX : event.clientY;
    const direction = this.orientation === "horizontal" && getTextDirection(this.element) === "rtl" ? -1 : 1;
    this.resize(this.sizeStart + ((coordinate - this.pointerStart) / extent) * 100 * direction, "pointer");
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (event.pointerId === this.pointerId) this.finishPointer();
  };
  private readonly handleLostPointerCapture = (): void => { this.finishPointer(); };
}

export function initResizablePanels(root: ParentNode = document): NyxResizablePanels[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxResizablePanels(element);
    instances.set(element, instance);
    return instance;
  });
}
