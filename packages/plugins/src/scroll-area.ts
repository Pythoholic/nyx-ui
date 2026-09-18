import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export interface NyxScrollAreaEventDetail {
  area: NyxScrollArea;
  atBlockEnd: boolean;
  atBlockStart: boolean;
  atInlineEnd: boolean;
  atInlineStart: boolean;
  overflowX: boolean;
  overflowY: boolean;
}

export interface NyxScrollAreaEventMap {
  "nyx:scroll-area:change": CustomEvent<NyxScrollAreaEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxScrollAreaEventMap {}
}

const selector = "[data-nyx-scroll-area]";
const instances = new WeakMap<HTMLElement, NyxScrollArea>();

export class NyxScrollArea {
  readonly element: HTMLElement;
  readonly viewport: HTMLElement;

  private frame: number | undefined;
  private lastState = "";
  private readonly resizeObserver: ResizeObserver | undefined;
  private readonly view: Window;

  constructor(element: HTMLElement) {
    this.element = element;
    this.viewport =
      element.querySelector<HTMLElement>("[data-nyx-scroll-area-viewport]") ??
      element;
    this.view = element.ownerDocument.defaultView ?? window;
    if (!this.viewport.hasAttribute("tabindex")) this.viewport.tabIndex = 0;
    if (
      !this.viewport.hasAttribute("role") &&
      (this.viewport.hasAttribute("aria-label") || this.viewport.hasAttribute("aria-labelledby"))
    ) this.viewport.setAttribute("role", "region");
    this.viewport.addEventListener("scroll", this.scheduleRefresh, { passive: true });
    this.view.addEventListener("resize", this.scheduleRefresh);
    const Observer = typeof ResizeObserver === "undefined" ? undefined : ResizeObserver;
    this.resizeObserver = Observer ? new Observer(this.scheduleRefresh) : undefined;
    this.resizeObserver?.observe(this.viewport);
    this.refresh();
  }

  refresh(): void {
    if (this.frame !== undefined) {
      this.view.cancelAnimationFrame(this.frame);
      this.frame = undefined;
    }
    const epsilon = 1;
    const overflowX = this.viewport.scrollWidth > this.viewport.clientWidth + epsilon;
    const overflowY = this.viewport.scrollHeight > this.viewport.clientHeight + epsilon;
    const atInlineStart = !overflowX || this.viewport.scrollLeft <= epsilon;
    const atInlineEnd =
      !overflowX ||
      this.viewport.scrollLeft + this.viewport.clientWidth >=
        this.viewport.scrollWidth - epsilon;
    const atBlockStart = !overflowY || this.viewport.scrollTop <= epsilon;
    const atBlockEnd =
      !overflowY ||
      this.viewport.scrollTop + this.viewport.clientHeight >=
        this.viewport.scrollHeight - epsilon;
    const state = [
      overflowX,
      overflowY,
      atInlineStart,
      atInlineEnd,
      atBlockStart,
      atBlockEnd,
    ].join(":");

    this.element.dataset.overflowX = String(overflowX);
    this.element.dataset.overflowY = String(overflowY);
    this.element.dataset.atInlineStart = String(atInlineStart);
    this.element.dataset.atInlineEnd = String(atInlineEnd);
    this.element.dataset.atBlockStart = String(atBlockStart);
    this.element.dataset.atBlockEnd = String(atBlockEnd);
    this.element.dataset.state = overflowX || overflowY ? "overflow" : "idle";
    if (state === this.lastState) return;
    this.lastState = state;
    dispatchNyxEvent(this.element, "nyx:scroll-area:change", {
      area: this,
      atBlockEnd,
      atBlockStart,
      atInlineEnd,
      atInlineStart,
      overflowX,
      overflowY,
    });
  }

  destroy(): void {
    if (this.frame !== undefined) this.view.cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.resizeObserver?.disconnect();
    this.viewport.removeEventListener("scroll", this.scheduleRefresh);
    this.view.removeEventListener("resize", this.scheduleRefresh);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private readonly scheduleRefresh = (): void => {
    if (this.frame !== undefined) return;
    this.frame = this.view.requestAnimationFrame(() => {
      this.frame = undefined;
      this.refresh();
    });
  };
}

export function initScrollAreas(root: ParentNode = document): NyxScrollArea[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxScrollArea(element);
    instances.set(element, instance);
    return instance;
  });
}
