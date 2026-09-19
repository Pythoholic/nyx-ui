import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxNotificationCenterReason = "api" | "control" | "mark-all";

export interface NyxNotificationCenterEventDetail {
  id: string;
  notification: HTMLElement;
  notificationCenter: NyxNotificationCenter;
  read: boolean;
  reason: NyxNotificationCenterReason;
}

export interface NyxNotificationCenterEventMap {
  "nyx:notification-center:before-dismiss": CustomEvent<NyxNotificationCenterEventDetail>;
  "nyx:notification-center:before-read": CustomEvent<NyxNotificationCenterEventDetail>;
  "nyx:notification-center:before-unread": CustomEvent<NyxNotificationCenterEventDetail>;
  "nyx:notification-center:dismiss": CustomEvent<NyxNotificationCenterEventDetail>;
  "nyx:notification-center:read": CustomEvent<NyxNotificationCenterEventDetail>;
  "nyx:notification-center:unread": CustomEvent<NyxNotificationCenterEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxNotificationCenterEventMap {}
}

const selector = "[data-nyx-notification-center]";
const notificationSelector = "[data-nyx-notification]";
const instances = new WeakMap<HTMLElement, NyxNotificationCenter>();
let generatedId = 0;

export class NyxNotificationCenter {
  readonly element: HTMLElement;

  private readonly count: HTMLElement | undefined;
  private readonly empty: HTMLElement | undefined;
  private readonly markAllButton: HTMLButtonElement | undefined;

  constructor(element: HTMLElement) {
    this.element = element;
    this.count = element.querySelector<HTMLElement>("[data-nyx-notification-count]") ?? undefined;
    this.empty = element.querySelector<HTMLElement>("[data-nyx-notification-empty]") ?? undefined;
    this.markAllButton = element.querySelector<HTMLButtonElement>("[data-nyx-notification-mark-all]") ?? undefined;
    this.notifications.forEach((notification) => {
      if (!notification.dataset.nyxNotificationId) {
        notification.dataset.nyxNotificationId = `nyx-notification-${++generatedId}`;
      }
      notification.dataset.state = notification.dataset.state === "read" ? "read" : "unread";
    });
    element.addEventListener("click", this.handleClick);
    this.sync();
  }

  get notifications(): HTMLElement[] {
    return Array.from(this.element.querySelectorAll<HTMLElement>(notificationSelector)).filter(
      (notification) => notification.closest(selector) === this.element,
    );
  }

  get value(): string[] {
    return this.notifications
      .filter((notification) => notification.dataset.state !== "read")
      .map((notification) => notification.dataset.nyxNotificationId!);
  }

  set value(unreadIds: readonly string[]) {
    const unread = new Set(unreadIds);
    this.notifications.forEach((notification) => {
      this.setRead(notification, !unread.has(notification.dataset.nyxNotificationId!), "api");
    });
  }

  setRead(
    notificationOrId: HTMLElement | string,
    read = true,
    reason: NyxNotificationCenterReason = "api",
  ): boolean {
    const notification = this.resolve(notificationOrId);
    if (!notification) return false;
    const current = notification.dataset.state === "read";
    if (current === read) return false;
    const id = notification.dataset.nyxNotificationId!;
    const detail: NyxNotificationCenterEventDetail = { id, notification, notificationCenter: this, read, reason };
    const action = read ? "read" : "unread";
    if (!dispatchNyxEvent(this.element, `nyx:notification-center:before-${action}`, detail, true)) return false;
    notification.dataset.state = action;
    this.sync();
    dispatchNyxEvent(this.element, `nyx:notification-center:${action}`, detail);
    return true;
  }

  markAllRead(): number {
    return this.notifications.reduce(
      (total, notification) => total + Number(this.setRead(notification, true, "mark-all")),
      0,
    );
  }

  dismiss(
    notificationOrId: HTMLElement | string,
    reason: NyxNotificationCenterReason = "api",
  ): boolean {
    const notification = this.resolve(notificationOrId);
    if (!notification) return false;
    const id = notification.dataset.nyxNotificationId!;
    const read = notification.dataset.state === "read";
    const detail: NyxNotificationCenterEventDetail = { id, notification, notificationCenter: this, read, reason };
    if (!dispatchNyxEvent(this.element, "nyx:notification-center:before-dismiss", detail, true)) return false;
    notification.remove();
    this.sync();
    dispatchNyxEvent(this.element, "nyx:notification-center:dismiss", detail);
    return true;
  }

  destroy(): void {
    this.element.removeEventListener("click", this.handleClick);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private resolve(notificationOrId: HTMLElement | string): HTMLElement | undefined {
    if (typeof notificationOrId !== "string") {
      return notificationOrId.closest(selector) === this.element && notificationOrId.matches(notificationSelector)
        ? notificationOrId
        : undefined;
    }
    return this.notifications.find((notification) => notification.dataset.nyxNotificationId === notificationOrId);
  }

  private sync(): void {
    const notifications = this.notifications;
    const unread = notifications.filter((notification) => notification.dataset.state !== "read");
    this.element.dataset.state = notifications.length === 0 ? "empty" : unread.length === 0 ? "all-read" : "unread";
    notifications.forEach((notification) => {
      const read = notification.dataset.state === "read";
      const toggle = notification.querySelector<HTMLButtonElement>("[data-nyx-notification-read]");
      if (toggle) {
        toggle.setAttribute("aria-pressed", String(read));
        toggle.setAttribute("aria-label", read ? "Mark notification unread" : "Mark notification read");
        toggle.textContent = read ? "Mark unread" : "Mark read";
      }
    });
    if (this.count) this.count.textContent = `${unread.length} unread`;
    if (this.markAllButton) {
      this.markAllButton.disabled = unread.length === 0;
      this.markAllButton.setAttribute("aria-disabled", String(this.markAllButton.disabled));
    }
    if (this.empty) this.empty.hidden = notifications.length !== 0;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("button");
    if (!button || button.closest(selector) !== this.element || button.disabled) return;
    if (button.hasAttribute("data-nyx-notification-mark-all")) {
      this.markAllRead();
      return;
    }
    const notification = button.closest<HTMLElement>(notificationSelector);
    if (!notification) return;
    if (button.hasAttribute("data-nyx-notification-read")) {
      this.setRead(notification, notification.dataset.state !== "read", "control");
    } else if (button.hasAttribute("data-nyx-notification-dismiss")) {
      this.dismiss(notification, "control");
    }
  };
}

export function initNotificationCenters(root: ParentNode = document): NyxNotificationCenter[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxNotificationCenter(element);
    instances.set(element, instance);
    return instance;
  });
}
