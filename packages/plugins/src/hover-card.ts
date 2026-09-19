import { NyxOverlayDismissal, type NyxOverlayDismissReason } from "./internal/dismissal.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";
import { positionOverlay, type NyxOverlayPlacement } from "./internal/positioning.js";

export type NyxHoverCardCloseReason =
  | "api"
  | "destroy"
  | "escape"
  | "focus-leave"
  | "outside"
  | "pointer-leave";

export interface NyxHoverCardOptions {
  closeDelay?: number;
  openDelay?: number;
  placement?: NyxOverlayPlacement;
  root?: ParentNode;
}

export interface NyxHoverCardEventDetail {
  card: NyxHoverCard;
  reason?: NyxHoverCardCloseReason;
  trigger?: HTMLElement;
}

export interface NyxHoverCardEventMap {
  "nyx:hover-card:before-close": CustomEvent<NyxHoverCardEventDetail>;
  "nyx:hover-card:before-open": CustomEvent<NyxHoverCardEventDetail>;
  "nyx:hover-card:close": CustomEvent<NyxHoverCardEventDetail>;
  "nyx:hover-card:open": CustomEvent<NyxHoverCardEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxHoverCardEventMap {}
}

const selector = "[data-nyx-hover-card]";
const triggerSelector = "[data-nyx-hover-card-trigger]";
const instances = new WeakMap<HTMLElement, NyxHoverCard>();

function numberAttribute(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export class NyxHoverCard {
  readonly element: HTMLElement;

  private activeTrigger: HTMLElement | undefined;
  private closeTimer: number | undefined;
  private readonly closeDelay: number;
  private readonly dismissal: NyxOverlayDismissal;
  private openState = false;
  private openTimer: number | undefined;
  private readonly openDelay: number;
  private readonly placement: NyxOverlayPlacement;
  private positionCleanup: (() => void) | undefined;
  private readonly triggers: HTMLElement[];
  private readonly view: Window;

  constructor(element: HTMLElement, options: NyxHoverCardOptions = {}) {
    if (!element.id) throw new Error("NyxHoverCard requires the card element to have an id.");
    this.element = element;
    const root = options.root === element ? element.ownerDocument : options.root ?? element.ownerDocument;
    this.view = element.ownerDocument.defaultView ?? window;
    this.triggers = queryAllIncludingRoot<HTMLElement>(root, triggerSelector).filter(
      (trigger) => trigger.dataset.nyxHoverCardTrigger === element.id,
    );
    if (!this.triggers.length) throw new Error("NyxHoverCard requires at least one associated trigger.");
    this.openDelay = options.openDelay ?? numberAttribute(element.dataset.nyxHoverCardOpenDelay, 300);
    this.closeDelay = options.closeDelay ?? numberAttribute(element.dataset.nyxHoverCardCloseDelay, 120);
    this.placement =
      options.placement ??
      (element.dataset.nyxHoverCardPlacement as NyxOverlayPlacement | undefined) ??
      "bottom-start";
    this.dismissal = new NyxOverlayDismissal({
      element,
      onDismiss: this.handleDismiss,
      pointerInside: this.triggers,
    });

    element.setAttribute("popover", "manual");
    element.hidden = true;
    element.addEventListener("pointerenter", this.handleCardPointerEnter);
    element.addEventListener("pointerleave", this.handleCardPointerLeave);
    element.addEventListener("focusin", this.handleCardFocusIn);
    element.addEventListener("focusout", this.handleCardFocusOut);
    this.triggers.forEach((trigger) => {
      trigger.setAttribute("aria-controls", element.id);
      trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("pointerenter", this.handleTriggerPointerEnter);
      trigger.addEventListener("pointerleave", this.handleTriggerPointerLeave);
      trigger.addEventListener("focusin", this.handleTriggerFocusIn);
      trigger.addEventListener("focusout", this.handleTriggerFocusOut);
    });
    this.syncState();
  }

  get value(): boolean {
    return this.openState;
  }

  open(trigger: HTMLElement = this.triggers[0]!): void {
    this.clearTimers();
    if (this.openState) return;
    const detail: NyxHoverCardEventDetail = { card: this, trigger };
    if (!dispatchNyxEvent(this.element, "nyx:hover-card:before-open", detail, true)) return;
    this.activeTrigger = trigger;
    this.element.hidden = false;
    try { this.element.showPopover?.(); } catch { /* Hidden fallback remains visible. */ }
    this.openState = true;
    this.syncState();
    this.dismissal.activate();
    this.positionCleanup = positionOverlay(trigger, this.element, { placement: this.placement });
    dispatchNyxEvent(this.element, "nyx:hover-card:open", detail);
  }

  close(reason: NyxHoverCardCloseReason = "api"): void {
    this.clearTimers();
    if (!this.openState) return;
    const detail: NyxHoverCardEventDetail = { card: this, reason };
    if (!dispatchNyxEvent(this.element, "nyx:hover-card:before-close", detail, reason !== "destroy")) return;
    this.positionCleanup?.();
    this.positionCleanup = undefined;
    this.dismissal.deactivate();
    const nativePopover = typeof this.element.hidePopover === "function";
    try { this.element.hidePopover?.(); } catch { /* Hidden fallback closes it. */ }
    if (!nativePopover) this.element.hidden = true;
    this.openState = false;
    this.syncState();
    this.activeTrigger = undefined;
    dispatchNyxEvent(this.element, "nyx:hover-card:close", detail);
  }

  destroy(): void {
    this.clearTimers();
    this.close("destroy");
    this.dismissal.destroy();
    this.element.removeEventListener("pointerenter", this.handleCardPointerEnter);
    this.element.removeEventListener("pointerleave", this.handleCardPointerLeave);
    this.element.removeEventListener("focusin", this.handleCardFocusIn);
    this.element.removeEventListener("focusout", this.handleCardFocusOut);
    this.triggers.forEach((trigger) => {
      trigger.removeEventListener("pointerenter", this.handleTriggerPointerEnter);
      trigger.removeEventListener("pointerleave", this.handleTriggerPointerLeave);
      trigger.removeEventListener("focusin", this.handleTriggerFocusIn);
      trigger.removeEventListener("focusout", this.handleTriggerFocusOut);
    });
    this.element.ownerDocument.removeEventListener("pointermove", this.handleTransitPointerMove, true);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private scheduleOpen(trigger: HTMLElement, delay: number): void {
    this.cancelClose();
    this.activeTrigger = trigger;
    if (this.openState) return;
    if (this.openTimer !== undefined) this.view.clearTimeout(this.openTimer);
    this.openTimer = this.view.setTimeout(() => {
      this.openTimer = undefined;
      this.open(trigger);
    }, delay);
  }

  private scheduleClose(reason: NyxHoverCardCloseReason): void {
    if (this.openTimer !== undefined) this.view.clearTimeout(this.openTimer);
    this.openTimer = undefined;
    if (!this.openState) return;
    if (this.closeTimer !== undefined) this.view.clearTimeout(this.closeTimer);
    this.closeTimer = this.view.setTimeout(() => {
      this.closeTimer = undefined;
      this.close(reason);
    }, this.closeDelay);
  }

  private cancelClose(): void {
    if (this.closeTimer !== undefined) this.view.clearTimeout(this.closeTimer);
    this.closeTimer = undefined;
    this.element.ownerDocument.removeEventListener("pointermove", this.handleTransitPointerMove, true);
  }

  private clearTimers(): void {
    if (this.openTimer !== undefined) this.view.clearTimeout(this.openTimer);
    if (this.closeTimer !== undefined) this.view.clearTimeout(this.closeTimer);
    this.openTimer = undefined;
    this.closeTimer = undefined;
    this.element.ownerDocument.removeEventListener("pointermove", this.handleTransitPointerMove, true);
  }

  private isWithinComponent(node: EventTarget | null): boolean {
    return node instanceof Node &&
      (this.element.contains(node) || this.triggers.some((trigger) => trigger.contains(node)));
  }

  private inIntentBridge(x: number, y: number): boolean {
    const trigger = this.activeTrigger;
    if (!trigger) return false;
    const a = trigger.getBoundingClientRect();
    const b = this.element.getBoundingClientRect();
    const padding = 8;
    return x >= Math.min(a.left, b.left) - padding &&
      x <= Math.max(a.right, b.right) + padding &&
      y >= Math.min(a.top, b.top) - padding &&
      y <= Math.max(a.bottom, b.bottom) + padding;
  }

  private syncState(): void {
    this.element.dataset.state = this.openState ? "open" : "closed";
    this.triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", String(this.openState)));
  }

  private readonly handleTriggerPointerEnter = (event: PointerEvent): void => {
    this.scheduleOpen(event.currentTarget as HTMLElement, this.openDelay);
  };

  private readonly handleTriggerPointerLeave = (): void => {
    if (this.openTimer !== undefined) this.view.clearTimeout(this.openTimer);
    this.openTimer = undefined;
    if (!this.openState) return;
    this.element.ownerDocument.addEventListener("pointermove", this.handleTransitPointerMove, true);
    this.scheduleClose("pointer-leave");
  };

  private readonly handleCardPointerEnter = (): void => { this.cancelClose(); };
  private readonly handleCardPointerLeave = (): void => { this.scheduleClose("pointer-leave"); };
  private readonly handleTriggerFocusIn = (event: FocusEvent): void => {
    this.scheduleOpen(event.currentTarget as HTMLElement, this.openDelay);
  };
  private readonly handleTriggerFocusOut = (event: FocusEvent): void => {
    if (!this.isWithinComponent(event.relatedTarget)) this.scheduleClose("focus-leave");
  };
  private readonly handleCardFocusIn = (): void => { this.cancelClose(); };
  private readonly handleCardFocusOut = (event: FocusEvent): void => {
    if (!this.isWithinComponent(event.relatedTarget)) this.scheduleClose("focus-leave");
  };

  private readonly handleTransitPointerMove = (event: PointerEvent): void => {
    if (this.isWithinComponent(event.target)) {
      this.cancelClose();
      return;
    }
    if (this.inIntentBridge(event.clientX, event.clientY)) {
      this.scheduleClose("pointer-leave");
      return;
    }
    this.scheduleClose("pointer-leave");
    this.element.ownerDocument.removeEventListener("pointermove", this.handleTransitPointerMove, true);
  };

  private readonly handleDismiss = (reason: NyxOverlayDismissReason): void => {
    if (reason === "focus-leave") this.scheduleClose(reason);
    else this.close(reason);
  };
}

export function initHoverCards(root: ParentNode = document): NyxHoverCard[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxHoverCard(element, { root });
    instances.set(element, instance);
    return instance;
  });
}
