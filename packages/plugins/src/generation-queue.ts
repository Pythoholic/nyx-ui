import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxGenerationState = "queued" | "running" | "complete" | "failed" | "canceled";
export type NyxGenerationQueueReason = "api" | "control";

export interface NyxGenerationQueueItem {
  id: string;
  progress: number;
  state: NyxGenerationState;
}

export interface NyxGenerationQueueEventDetail {
  generationQueue: NyxGenerationQueue;
  id: string;
  item: HTMLElement;
  next: NyxGenerationQueueItem | null;
  previous: NyxGenerationQueueItem;
  reason: NyxGenerationQueueReason;
}

export interface NyxGenerationQueueEventMap {
  "nyx:generation-queue:before-change": CustomEvent<NyxGenerationQueueEventDetail>;
  "nyx:generation-queue:change": CustomEvent<NyxGenerationQueueEventDetail>;
  "nyx:generation-queue:before-remove": CustomEvent<NyxGenerationQueueEventDetail>;
  "nyx:generation-queue:remove": CustomEvent<NyxGenerationQueueEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxGenerationQueueEventMap {}
}

const selector = "[data-nyx-generation-queue]";
const itemSelector = "[data-nyx-generation-item]";
const states = new Set<NyxGenerationState>(["queued", "running", "complete", "failed", "canceled"]);
const instances = new WeakMap<HTMLElement, NyxGenerationQueue>();
let generatedId = 0;

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

export class NyxGenerationQueue {
  readonly element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
    element.addEventListener("click", this.handleClick);
    this.refresh();
  }

  get items(): HTMLElement[] {
    return Array.from(this.element.querySelectorAll<HTMLElement>(itemSelector)).filter(
      (item) => item.closest(selector) === this.element,
    );
  }

  get value(): NyxGenerationQueueItem[] {
    return this.items.map((item) => this.read(item));
  }

  set value(value: readonly NyxGenerationQueueItem[]) {
    value.forEach((entry) => this.setStatus(entry.id, entry.state, entry.progress));
  }

  setStatus(
    itemOrId: HTMLElement | string,
    state: NyxGenerationState,
    progress?: number,
    reason: NyxGenerationQueueReason = "api",
  ): boolean {
    const item = this.resolve(itemOrId);
    if (!item || !states.has(state)) return false;
    const previous = this.read(item);
    const nextProgress = clampProgress(progress ?? (state === "complete" ? 100 : previous.progress));
    if (previous.state === state && previous.progress === nextProgress) return false;
    const next = { id: previous.id, progress: nextProgress, state };
    const detail = { generationQueue: this, id: previous.id, item, next, previous, reason };
    if (!dispatchNyxEvent(this.element, "nyx:generation-queue:before-change", detail, true)) return false;
    item.dataset.state = state;
    item.dataset.progress = String(nextProgress);
    this.syncItem(item);
    this.syncQueue();
    detail.next = this.read(item);
    dispatchNyxEvent(this.element, "nyx:generation-queue:change", detail);
    return true;
  }

  remove(itemOrId: HTMLElement | string, reason: NyxGenerationQueueReason = "api"): boolean {
    const item = this.resolve(itemOrId);
    if (!item) return false;
    const previous = this.read(item);
    const detail: NyxGenerationQueueEventDetail = {
      generationQueue: this,
      id: previous.id,
      item,
      next: null,
      previous,
      reason,
    };
    if (!dispatchNyxEvent(this.element, "nyx:generation-queue:before-remove", detail, true)) return false;
    item.remove();
    this.syncQueue();
    dispatchNyxEvent(this.element, "nyx:generation-queue:remove", detail);
    return true;
  }

  refresh(): void {
    this.items.forEach((item) => {
      if (!item.dataset.nyxGenerationId) item.dataset.nyxGenerationId = `generation-${++generatedId}`;
      if (!states.has(item.dataset.state as NyxGenerationState)) item.dataset.state = "queued";
      item.dataset.progress = String(clampProgress(Number(item.dataset.progress ?? 0)));
      this.syncItem(item);
    });
    this.syncQueue();
  }

  destroy(): void {
    this.element.removeEventListener("click", this.handleClick);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private read(item: HTMLElement): NyxGenerationQueueItem {
    return {
      id: item.dataset.nyxGenerationId!,
      progress: clampProgress(Number(item.dataset.progress ?? 0)),
      state: item.dataset.state as NyxGenerationState,
    };
  }

  private resolve(itemOrId: HTMLElement | string): HTMLElement | undefined {
    if (typeof itemOrId !== "string") {
      return itemOrId.matches(itemSelector) && itemOrId.closest(selector) === this.element ? itemOrId : undefined;
    }
    return this.items.find((item) => item.dataset.nyxGenerationId === itemOrId);
  }

  private syncItem(item: HTMLElement): void {
    const entry = this.read(item);
    const active = entry.state === "queued" || entry.state === "running";
    item.setAttribute("aria-busy", String(active));
    const progress = item.querySelector<HTMLProgressElement>("[data-nyx-generation-progress]");
    if (progress) {
      progress.max = 100;
      progress.value = entry.progress;
      progress.setAttribute("aria-valuetext", `${entry.progress}% ${entry.state}`);
    }
    item.querySelectorAll<HTMLButtonElement>("[data-nyx-generation-action]").forEach((button) => {
      const action = button.dataset.nyxGenerationAction;
      button.hidden = (action === "cancel" && !active)
        || (action === "retry" && entry.state !== "failed")
        || (action === "remove" && active);
    });
    const status = item.querySelector<HTMLOutputElement>("[data-nyx-generation-status]");
    if (status) status.value = entry.state === "running" ? `${entry.progress}% running` : entry.state;
  }

  private syncQueue(): void {
    const entries = this.value;
    const active = entries.filter((entry) => entry.state === "queued" || entry.state === "running").length;
    const failed = entries.filter((entry) => entry.state === "failed").length;
    this.element.dataset.state = entries.length === 0 ? "empty" : failed > 0 ? "attention" : active > 0 ? "active" : "settled";
    this.element.dataset.activeCount = String(active);
    this.element.setAttribute("aria-busy", String(active > 0));
    const count = this.element.querySelector<HTMLOutputElement>("[data-nyx-generation-count]");
    if (count) count.value = `${active} active / ${entries.length} total`;
    const empty = this.element.querySelector<HTMLElement>("[data-nyx-generation-empty]");
    if (empty) empty.hidden = entries.length !== 0;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("[data-nyx-generation-action]");
    if (!button || button.closest(selector) !== this.element || button.disabled) return;
    const item = button.closest<HTMLElement>(itemSelector);
    if (!item) return;
    const action = button.dataset.nyxGenerationAction;
    if (action === "cancel") this.setStatus(item, "canceled", undefined, "control");
    else if (action === "retry") this.setStatus(item, "queued", 0, "control");
    else if (action === "remove") this.remove(item, "control");
  };
}

export function initGenerationQueues(root: ParentNode = document): NyxGenerationQueue[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxGenerationQueue(element);
    instances.set(element, instance);
    return instance;
  });
}
