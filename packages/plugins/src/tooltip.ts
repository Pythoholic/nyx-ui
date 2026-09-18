import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { positionOverlay, type NyxOverlayPlacement } from "./internal/positioning.js";

export type NyxTooltipOpenReason = "api" | "focus" | "pointer";
export type NyxTooltipCloseReason =
  | "api"
  | "destroy"
  | "escape"
  | "focus-leave"
  | "pointer-leave"
  | "provider-change";

export interface NyxTooltipOptions {
  closeDelay?: number;
  openDelay?: number;
  placement?: NyxOverlayPlacement;
  root?: ParentNode;
  skipDelay?: number;
}

export interface NyxTooltipEventDetail {
  reason: NyxTooltipCloseReason | NyxTooltipOpenReason;
  tooltip: NyxTooltip;
  trigger: HTMLElement | undefined;
}

export interface NyxTooltipEventMap {
  "nyx:tooltip:before-close": CustomEvent<NyxTooltipEventDetail>;
  "nyx:tooltip:before-open": CustomEvent<NyxTooltipEventDetail>;
  "nyx:tooltip:close": CustomEvent<NyxTooltipEventDetail>;
  "nyx:tooltip:open": CustomEvent<NyxTooltipEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxTooltipEventMap {}
}

interface ProviderState {
  active: NyxTooltip | undefined;
  references: number;
  warmUntil: number;
}

const selector = "[data-nyx-tooltip]";
const providerSelector = "[data-nyx-tooltip-provider]";
const triggerSelector = "[data-nyx-tooltip-trigger]";
const instances = new WeakMap<HTMLElement, NyxTooltip>();
const providers = new WeakMap<HTMLElement, ProviderState>();

function numberAttribute(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function providerFor(element: HTMLElement): HTMLElement {
  return element.closest<HTMLElement>(providerSelector) ?? element.ownerDocument.documentElement;
}

function providerStateFor(provider: HTMLElement): ProviderState {
  const current = providers.get(provider);
  if (current) return current;
  const state: ProviderState = { active: undefined, references: 0, warmUntil: 0 };
  providers.set(provider, state);
  return state;
}

export class NyxTooltip {
  readonly element: HTMLElement;
  readonly triggers: HTMLElement[];

  private activeTrigger: HTMLElement | undefined;
  private readonly closeDelay: number;
  private closeTimer: number | undefined;
  private readonly describedBy = new Map<HTMLElement, string | null>();
  private destroyed = false;
  private readonly focusedTriggers = new Set<HTMLElement>();
  private openState = false;
  private readonly openDelay: number;
  private openTimer: number | undefined;
  private readonly placement: NyxOverlayPlacement;
  private readonly pointerTriggers = new Set<HTMLElement>();
  private positionCleanup: (() => void) | undefined;
  private readonly provider: HTMLElement;
  private readonly providerState: ProviderState;
  private readonly skipDelay: number;
  private readonly view: Window;

  constructor(element: HTMLElement, options: NyxTooltipOptions = {}) {
    if (!element.id) throw new Error("NyxTooltip requires the tooltip element to have an id.");
    this.element = element;
    this.provider = providerFor(element);
    const root = options.root === element ? element.ownerDocument : options.root ?? this.provider;
    this.triggers = queryAllIncludingRoot<HTMLElement>(root, triggerSelector).filter((trigger) =>
      trigger.dataset.nyxTooltipTrigger === element.id && providerFor(trigger) === this.provider,
    );
    if (!this.triggers.length) throw new Error("NyxTooltip requires at least one associated trigger in the same provider.");

    this.view = element.ownerDocument.defaultView ?? window;
    this.openDelay = options.openDelay ?? numberAttribute(this.provider.dataset.nyxTooltipOpenDelay, 500);
    this.closeDelay = options.closeDelay ?? numberAttribute(this.provider.dataset.nyxTooltipCloseDelay, 100);
    this.skipDelay = options.skipDelay ?? numberAttribute(this.provider.dataset.nyxTooltipSkipDelay, 300);
    this.placement = options.placement ??
      (element.dataset.nyxTooltipPlacement as NyxOverlayPlacement | undefined) ??
      "top";
    this.providerState = providerStateFor(this.provider);
    this.providerState.references += 1;

    element.setAttribute("popover", "manual");
    element.setAttribute("role", "tooltip");
    element.hidden = true;
    this.triggers.forEach((trigger) => {
      this.describedBy.set(trigger, trigger.getAttribute("aria-describedby"));
      trigger.addEventListener("pointerenter", this.handlePointerEnter);
      trigger.addEventListener("pointerleave", this.handlePointerLeave);
      trigger.addEventListener("focusin", this.handleFocusIn);
      trigger.addEventListener("focusout", this.handleFocusOut);
    });
    this.syncState();
  }

  get value(): boolean {
    return this.openState;
  }

  set value(open: boolean) {
    if (open) this.open();
    else this.close();
  }

  open(trigger: HTMLElement = this.triggers[0]!, reason: NyxTooltipOpenReason = "api"): boolean {
    if (this.destroyed) return false;
    this.clearTimers();
    if (this.openState) return true;
    if (!this.triggers.includes(trigger)) throw new Error("NyxTooltip can only open from an associated trigger.");
    const detail: NyxTooltipEventDetail = { reason, tooltip: this, trigger };
    if (!dispatchNyxEvent(this.element, "nyx:tooltip:before-open", detail, true)) return false;
    const active = this.providerState.active;
    if (active && active !== this && !active.close("provider-change")) return false;

    this.activeTrigger = trigger;
    this.openState = true;
    this.providerState.active = this;
    this.element.hidden = false;
    try { this.element.showPopover?.(); } catch { /* The hidden fallback remains visible. */ }
    this.syncState();
    this.positionCleanup = positionOverlay(trigger, this.element, { placement: this.placement });
    this.element.ownerDocument.addEventListener("keydown", this.handleKeyDown, true);
    dispatchNyxEvent(this.element, "nyx:tooltip:open", detail);
    return true;
  }

  close(reason: NyxTooltipCloseReason = "api"): boolean {
    this.clearTimers();
    if (!this.openState) return true;
    const detail: NyxTooltipEventDetail = { reason, tooltip: this, trigger: this.activeTrigger };
    if (!dispatchNyxEvent(this.element, "nyx:tooltip:before-close", detail, reason !== "destroy")) return false;

    this.positionCleanup?.();
    this.positionCleanup = undefined;
    this.element.ownerDocument.removeEventListener("keydown", this.handleKeyDown, true);
    try { this.element.hidePopover?.(); } catch { /* The hidden fallback closes it. */ }
    this.element.hidden = true;
    this.openState = false;
    if (this.providerState.active === this) this.providerState.active = undefined;
    this.providerState.warmUntil = Date.now() + this.skipDelay;
    this.syncState();
    this.activeTrigger = undefined;
    dispatchNyxEvent(this.element, "nyx:tooltip:close", detail);
    return true;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearTimers();
    this.close("destroy");
    this.triggers.forEach((trigger) => {
      trigger.removeEventListener("pointerenter", this.handlePointerEnter);
      trigger.removeEventListener("pointerleave", this.handlePointerLeave);
      trigger.removeEventListener("focusin", this.handleFocusIn);
      trigger.removeEventListener("focusout", this.handleFocusOut);
      this.restoreDescription(trigger);
    });
    this.pointerTriggers.clear();
    this.focusedTriggers.clear();
    this.element.ownerDocument.removeEventListener("keydown", this.handleKeyDown, true);
    this.providerState.references -= 1;
    if (this.providerState.references === 0) providers.delete(this.provider);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private scheduleOpen(trigger: HTMLElement, reason: NyxTooltipOpenReason): void {
    this.cancelClose();
    if (this.openState) return;
    if (this.openTimer !== undefined) this.view.clearTimeout(this.openTimer);
    const providerIsWarm = this.providerState.active !== undefined || Date.now() < this.providerState.warmUntil;
    this.openTimer = this.view.setTimeout(() => {
      this.openTimer = undefined;
      this.open(trigger, reason);
    }, providerIsWarm ? 0 : this.openDelay);
  }

  private scheduleClose(reason: NyxTooltipCloseReason): void {
    if (this.openTimer !== undefined) this.view.clearTimeout(this.openTimer);
    this.openTimer = undefined;
    if (!this.openState || this.pointerTriggers.size || this.focusedTriggers.size) return;
    if (this.closeTimer !== undefined) this.view.clearTimeout(this.closeTimer);
    this.closeTimer = this.view.setTimeout(() => {
      this.closeTimer = undefined;
      this.close(reason);
    }, this.closeDelay);
  }

  private cancelClose(): void {
    if (this.closeTimer !== undefined) this.view.clearTimeout(this.closeTimer);
    this.closeTimer = undefined;
  }

  private clearTimers(): void {
    if (this.openTimer !== undefined) this.view.clearTimeout(this.openTimer);
    if (this.closeTimer !== undefined) this.view.clearTimeout(this.closeTimer);
    this.openTimer = undefined;
    this.closeTimer = undefined;
  }

  private syncState(): void {
    this.element.dataset.state = this.openState ? "open" : "closed";
    this.triggers.forEach((trigger) => {
      const active = this.openState && trigger === this.activeTrigger;
      trigger.dataset.state = active ? "open" : "closed";
      if (active) this.applyDescription(trigger);
      else this.restoreDescription(trigger);
    });
  }

  private applyDescription(trigger: HTMLElement): void {
    const values = new Set((this.describedBy.get(trigger) ?? "").split(/\s+/).filter(Boolean));
    values.add(this.element.id);
    trigger.setAttribute("aria-describedby", Array.from(values).join(" "));
  }

  private restoreDescription(trigger: HTMLElement): void {
    const original = this.describedBy.get(trigger);
    if (original === null || original === undefined) trigger.removeAttribute("aria-describedby");
    else trigger.setAttribute("aria-describedby", original);
  }

  private readonly handlePointerEnter = (event: Event): void => {
    const trigger = event.currentTarget as HTMLElement;
    this.pointerTriggers.add(trigger);
    this.scheduleOpen(trigger, "pointer");
  };

  private readonly handlePointerLeave = (event: Event): void => {
    this.pointerTriggers.delete(event.currentTarget as HTMLElement);
    this.scheduleClose("pointer-leave");
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const trigger = event.currentTarget as HTMLElement;
    this.focusedTriggers.add(trigger);
    this.scheduleOpen(trigger, "focus");
  };

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const trigger = event.currentTarget as HTMLElement;
    if (event.relatedTarget instanceof Node && trigger.contains(event.relatedTarget)) return;
    this.focusedTriggers.delete(trigger);
    this.scheduleClose("focus-leave");
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    if (this.close("escape")) event.preventDefault();
  };
}

export function initTooltips(root: ParentNode = document): NyxTooltip[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxTooltip(element, { root });
    instances.set(element, instance);
    return instance;
  });
}
