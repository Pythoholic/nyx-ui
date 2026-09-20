import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxActivityFeedReason = "api" | "control";

export interface NyxActivityFeedEventDetail {
  activityFeed: NyxActivityFeed;
  expanded: boolean;
  reason: NyxActivityFeedReason;
}

export interface NyxActivityFeedEventMap {
  "nyx:activity-feed:before-change": CustomEvent<NyxActivityFeedEventDetail>;
  "nyx:activity-feed:change": CustomEvent<NyxActivityFeedEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxActivityFeedEventMap {}
}

const selector = "[data-nyx-activity-feed]";
const instances = new WeakMap<HTMLElement, NyxActivityFeed>();
let generatedId = 0;

export class NyxActivityFeed {
  readonly element: HTMLElement;
  readonly history: HTMLElement;
  readonly toggle: HTMLButtonElement;

  constructor(element: HTMLElement) {
    this.element = element;
    const history = element.querySelector<HTMLElement>("[data-nyx-activity-history]");
    const toggle = element.querySelector<HTMLButtonElement>("[data-nyx-activity-toggle]");
    if (!history || !toggle) throw new Error("NyxActivityFeed requires a history region and toggle button.");
    this.history = history;
    this.toggle = toggle;
    history.id ||= `nyx-activity-history-${++generatedId}`;
    toggle.setAttribute("aria-controls", history.id);
    toggle.addEventListener("click", this.handleClick);
    this.sync(!history.hidden);
  }

  get expanded(): boolean {
    return !this.history.hidden;
  }

  set expanded(value: boolean) {
    this.setExpanded(value);
  }

  setExpanded(expanded: boolean, reason: NyxActivityFeedReason = "api"): boolean {
    if (expanded === this.expanded) return false;
    const detail: NyxActivityFeedEventDetail = { activityFeed: this, expanded, reason };
    if (!dispatchNyxEvent(this.element, "nyx:activity-feed:before-change", detail, true)) return false;
    this.sync(expanded);
    dispatchNyxEvent(this.element, "nyx:activity-feed:change", detail);
    if (expanded && reason === "control") {
      this.history.querySelector<HTMLElement>("a, button, [tabindex]:not([tabindex='-1'])")?.focus();
    }
    return true;
  }

  destroy(): void {
    this.toggle.removeEventListener("click", this.handleClick);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private sync(expanded: boolean): void {
    this.history.hidden = !expanded;
    this.toggle.setAttribute("aria-expanded", String(expanded));
    this.toggle.textContent = expanded ? "Hide older activity" : this.toggle.dataset.collapsedLabel ?? "Show older activity";
    this.element.dataset.state = expanded ? "expanded" : "collapsed";
  }

  private readonly handleClick = (): void => {
    this.setExpanded(!this.expanded, "control");
  };
}

export function initActivityFeeds(root: ParentNode = document): NyxActivityFeed[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxActivityFeed(element);
    instances.set(element, instance);
    return instance;
  });
}
