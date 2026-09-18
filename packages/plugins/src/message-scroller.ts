import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxMessageScrollerReason = "api" | "content" | "control" | "scroll";

export interface NyxMessageScrollerEventDetail {
  following: boolean;
  messageScroller: NyxMessageScroller;
  reason: NyxMessageScrollerReason;
  unread: number;
}

export interface NyxMessageScrollerMessagesEventDetail extends NyxMessageScrollerEventDetail {
  count: number;
}

export interface NyxMessageScrollerEventMap {
  "nyx:message-scroller:before-follow": CustomEvent<NyxMessageScrollerEventDetail>;
  "nyx:message-scroller:follow": CustomEvent<NyxMessageScrollerEventDetail>;
  "nyx:message-scroller:before-pause": CustomEvent<NyxMessageScrollerEventDetail>;
  "nyx:message-scroller:pause": CustomEvent<NyxMessageScrollerEventDetail>;
  "nyx:message-scroller:new-messages": CustomEvent<NyxMessageScrollerMessagesEventDetail>;
}

export interface NyxMessageScrollerOptions {
  endThreshold?: number;
}

declare global {
  interface HTMLElementEventMap extends NyxMessageScrollerEventMap {}
}

const selector = "[data-nyx-message-scroller]";
const messageSelector = "[data-nyx-message-scroller-message]";
const instances = new WeakMap<HTMLElement, NyxMessageScroller>();
let generatedId = 0;

export class NyxMessageScroller {
  readonly element: HTMLElement;
  readonly jumpButton: HTMLButtonElement | null;
  readonly status: HTMLOutputElement | null;
  readonly viewport: HTMLElement;

  private followingState: boolean;
  private readonly observer: MutationObserver;
  private readonly threshold: number;
  private unreadCount = 0;

  constructor(element: HTMLElement, options: NyxMessageScrollerOptions = {}) {
    this.element = element;
    const viewport = element.querySelector<HTMLElement>("[data-nyx-message-scroller-viewport]");
    if (!viewport) throw new Error("NyxMessageScroller requires a scroll viewport.");
    this.viewport = viewport;
    this.jumpButton = element.querySelector<HTMLButtonElement>("[data-nyx-message-scroller-jump]");
    this.status = element.querySelector<HTMLOutputElement>("[data-nyx-message-scroller-status]");
    const declaredThreshold = Number(element.dataset.nyxMessageScrollerThreshold);
    this.threshold = Math.max(0, options.endThreshold ?? (Number.isFinite(declaredThreshold) ? declaredThreshold : 24));
    this.followingState = element.dataset.state !== "paused";
    this.unreadCount = this.followingState ? 0 : Math.max(0, Number(element.dataset.unread) || 0);

    if (!viewport.id) viewport.id = `nyx-message-scroller-${++generatedId}`;
    if (this.jumpButton) this.jumpButton.setAttribute("aria-controls", viewport.id);
    viewport.addEventListener("scroll", this.handleScroll, { passive: true });
    this.jumpButton?.addEventListener("click", this.handleJump);
    this.observer = new MutationObserver(this.handleMutations);
    this.observer.observe(viewport, { childList: true, subtree: true });
    if (this.followingState) this.scrollToEnd();
    this.sync();
  }

  get following(): boolean {
    return this.followingState;
  }

  set following(value: boolean) {
    if (value) this.follow();
    else this.pause();
  }

  get unread(): number {
    return this.unreadCount;
  }

  follow(reason: NyxMessageScrollerReason = "api"): boolean {
    if (this.followingState && this.unreadCount === 0 && this.isAtEnd()) return false;
    const detail: NyxMessageScrollerEventDetail = {
      following: true,
      messageScroller: this,
      reason,
      unread: 0,
    };
    if (!dispatchNyxEvent(this.element, "nyx:message-scroller:before-follow", detail, true)) return false;
    this.followingState = true;
    this.unreadCount = 0;
    this.scrollToEnd();
    this.sync();
    dispatchNyxEvent(this.element, "nyx:message-scroller:follow", detail);
    return true;
  }

  pause(reason: NyxMessageScrollerReason = "api"): boolean {
    if (!this.followingState) return false;
    const detail: NyxMessageScrollerEventDetail = {
      following: false,
      messageScroller: this,
      reason,
      unread: this.unreadCount,
    };
    if (!dispatchNyxEvent(this.element, "nyx:message-scroller:before-pause", detail, true)) {
      this.scrollToEnd();
      return false;
    }
    this.followingState = false;
    this.sync();
    dispatchNyxEvent(this.element, "nyx:message-scroller:pause", detail);
    return true;
  }

  refresh(): void {
    if (this.followingState) this.scrollToEnd();
    this.sync();
  }

  destroy(): void {
    this.observer.disconnect();
    this.viewport.removeEventListener("scroll", this.handleScroll);
    this.jumpButton?.removeEventListener("click", this.handleJump);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private isAtEnd(): boolean {
    return this.viewport.scrollHeight - this.viewport.clientHeight - this.viewport.scrollTop <= this.threshold;
  }

  private scrollToEnd(): void {
    this.viewport.scrollTop = Math.max(0, this.viewport.scrollHeight - this.viewport.clientHeight);
  }

  private sync(): void {
    const atEnd = this.isAtEnd();
    this.element.dataset.state = this.followingState ? "following" : "paused";
    this.element.dataset.atEnd = String(atEnd);
    this.element.dataset.unread = String(this.unreadCount);
    this.viewport.setAttribute("aria-busy", "false");
    if (this.jumpButton) {
      this.jumpButton.hidden = this.followingState;
      this.jumpButton.textContent = this.unreadCount > 0
        ? `${this.unreadCount} new ${this.unreadCount === 1 ? "message" : "messages"}`
        : "Jump to latest";
    }
    if (this.status) {
      this.status.value = this.unreadCount > 0
        ? `${this.unreadCount} new ${this.unreadCount === 1 ? "message" : "messages"}`
        : "";
    }
  }

  private countAddedMessages(mutations: MutationRecord[]): number {
    return mutations.reduce((total, mutation) => total + Array.from(mutation.addedNodes).reduce((count, node) => {
      if (!(node instanceof Element)) return count;
      return count + Number(node.matches(messageSelector)) + node.querySelectorAll(messageSelector).length;
    }, 0), 0);
  }

  private readonly handleMutations = (mutations: MutationRecord[]): void => {
    const count = this.countAddedMessages(mutations);
    if (count === 0) {
      this.refresh();
      return;
    }
    if (this.followingState) this.scrollToEnd();
    else this.unreadCount += count;
    this.sync();
    const detail: NyxMessageScrollerMessagesEventDetail = {
      count,
      following: this.followingState,
      messageScroller: this,
      reason: "content",
      unread: this.unreadCount,
    };
    dispatchNyxEvent(this.element, "nyx:message-scroller:new-messages", detail);
  };

  private readonly handleScroll = (): void => {
    if (this.isAtEnd()) {
      if (!this.followingState) this.follow("scroll");
      else this.sync();
    } else if (this.followingState) {
      this.pause("scroll");
    } else {
      this.sync();
    }
  };

  private readonly handleJump = (): void => {
    this.follow("control");
  };
}

export function initMessageScrollers(
  root: ParentNode = document,
  options: NyxMessageScrollerOptions = {},
): NyxMessageScroller[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxMessageScroller(element, options);
    instances.set(element, instance);
    return instance;
  });
}
