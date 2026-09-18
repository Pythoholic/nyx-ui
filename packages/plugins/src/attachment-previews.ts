import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxAttachmentPreviewsReason = "api" | "clear" | "control";

export interface NyxAttachmentPreviewsEventDetail {
  activeIds: string[];
  attachment: HTMLElement | null;
  attachmentPreviews: NyxAttachmentPreviews;
  id: string | null;
  reason: NyxAttachmentPreviewsReason;
}

export interface NyxAttachmentPreviewsEventMap {
  "nyx:attachment-previews:before-change": CustomEvent<NyxAttachmentPreviewsEventDetail>;
  "nyx:attachment-previews:change": CustomEvent<NyxAttachmentPreviewsEventDetail>;
  "nyx:attachment-previews:before-remove": CustomEvent<NyxAttachmentPreviewsEventDetail>;
  "nyx:attachment-previews:remove": CustomEvent<NyxAttachmentPreviewsEventDetail>;
  "nyx:attachment-previews:before-restore": CustomEvent<NyxAttachmentPreviewsEventDetail>;
  "nyx:attachment-previews:restore": CustomEvent<NyxAttachmentPreviewsEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxAttachmentPreviewsEventMap {}
}

const selector = "[data-nyx-attachment-previews]";
const attachmentSelector = "[data-nyx-attachment-preview]";
const instances = new WeakMap<HTMLElement, NyxAttachmentPreviews>();
let generatedId = 0;

export class NyxAttachmentPreviews {
  readonly element: HTMLElement;

  private readonly observer: MutationObserver;

  constructor(element: HTMLElement) {
    this.element = element;
    this.normalizeAttachments();
    element.addEventListener("click", this.handleClick);
    this.observer = new MutationObserver(() => this.refresh());
    this.observer.observe(element, { childList: true, subtree: true });
    this.sync();
  }

  get attachments(): HTMLElement[] {
    return Array.from(this.element.querySelectorAll<HTMLElement>(attachmentSelector)).filter(
      (attachment) => attachment.closest(selector) === this.element,
    );
  }

  get value(): string[] {
    return this.attachments
      .filter((attachment) => attachment.dataset.state !== "removed")
      .map((attachment) => attachment.dataset.nyxAttachmentId!);
  }

  set value(activeIds: readonly string[]) {
    this.setValue(activeIds);
  }

  setValue(activeIds: readonly string[], reason: NyxAttachmentPreviewsReason = "api"): boolean {
    const known = new Set(this.attachments.map((attachment) => attachment.dataset.nyxAttachmentId!));
    const next = Array.from(new Set(activeIds.filter((id) => known.has(id))));
    if (next.length === this.value.length && next.every((id) => this.value.includes(id))) return false;
    const detail = this.detail(null, null, reason, next);
    if (!dispatchNyxEvent(this.element, "nyx:attachment-previews:before-change", detail, true)) return false;
    const active = new Set(next);
    this.attachments.forEach((attachment) => {
      this.setAttachmentState(attachment, active.has(attachment.dataset.nyxAttachmentId!), false);
    });
    this.sync();
    detail.activeIds = this.value;
    dispatchNyxEvent(this.element, "nyx:attachment-previews:change", detail);
    return true;
  }

  remove(
    attachmentOrId: HTMLElement | string,
    reason: NyxAttachmentPreviewsReason = "api",
  ): boolean {
    const attachment = this.resolve(attachmentOrId);
    if (!attachment || attachment.dataset.state === "removed") return false;
    const id = attachment.dataset.nyxAttachmentId!;
    const next = this.value.filter((activeId) => activeId !== id);
    const detail = this.detail(attachment, id, reason, next);
    if (!dispatchNyxEvent(this.element, "nyx:attachment-previews:before-remove", detail, true)) return false;
    this.setAttachmentState(attachment, false, false);
    this.sync();
    detail.activeIds = this.value;
    dispatchNyxEvent(this.element, "nyx:attachment-previews:remove", detail);
    return true;
  }

  restore(
    attachmentOrId: HTMLElement | string,
    reason: NyxAttachmentPreviewsReason = "api",
  ): boolean {
    const attachment = this.resolve(attachmentOrId);
    if (!attachment || attachment.dataset.state !== "removed") return false;
    const id = attachment.dataset.nyxAttachmentId!;
    const detail = this.detail(attachment, id, reason, [...this.value, id]);
    if (!dispatchNyxEvent(this.element, "nyx:attachment-previews:before-restore", detail, true)) return false;
    this.setAttachmentState(attachment, true, false);
    this.sync();
    detail.activeIds = this.value;
    dispatchNyxEvent(this.element, "nyx:attachment-previews:restore", detail);
    return true;
  }

  clear(): boolean {
    return this.setValue([], "clear");
  }

  refresh(): void {
    this.normalizeAttachments();
    this.sync();
  }

  destroy(): void {
    this.observer.disconnect();
    this.element.removeEventListener("click", this.handleClick);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private detail(
    attachment: HTMLElement | null,
    id: string | null,
    reason: NyxAttachmentPreviewsReason,
    activeIds = this.value,
  ): NyxAttachmentPreviewsEventDetail {
    return { activeIds, attachment, attachmentPreviews: this, id, reason };
  }

  private normalizeAttachments(): void {
    this.attachments.forEach((attachment) => {
      if (!attachment.dataset.nyxAttachmentId) {
        attachment.dataset.nyxAttachmentId = `attachment-${++generatedId}`;
      }
      if (!attachment.id) attachment.id = `nyx-attachment-preview-${++generatedId}`;
      const active = attachment.dataset.state !== "removed" && !attachment.hidden;
      this.setAttachmentState(attachment, active, true);
      attachment.querySelectorAll<HTMLButtonElement>("[data-nyx-attachment-remove]").forEach((button) => {
        button.setAttribute("aria-controls", attachment.id);
      });
    });
  }

  private resolve(attachmentOrId: HTMLElement | string): HTMLElement | undefined {
    if (typeof attachmentOrId !== "string") {
      return attachmentOrId.matches(attachmentSelector) && attachmentOrId.closest(selector) === this.element
        ? attachmentOrId
        : undefined;
    }
    return this.attachments.find((attachment) => attachment.dataset.nyxAttachmentId === attachmentOrId);
  }

  private setAttachmentState(attachment: HTMLElement, active: boolean, preserveAuthoredHidden: boolean): void {
    attachment.dataset.state = active ? "active" : "removed";
    if (!preserveAuthoredHidden || !active) attachment.hidden = !active;
    attachment.setAttribute("aria-hidden", String(!active));
  }

  private sync(): void {
    const count = this.value.length;
    this.element.dataset.state = count === 0 ? "empty" : "ready";
    this.element.dataset.count = String(count);
    const countOutput = this.element.querySelector<HTMLOutputElement>("[data-nyx-attachment-count]");
    if (countOutput) countOutput.value = `${count} ${count === 1 ? "attachment" : "attachments"}`;
    const empty = this.element.querySelector<HTMLElement>("[data-nyx-attachment-empty]");
    if (empty) empty.hidden = count !== 0;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("[data-nyx-attachment-remove]");
    if (!button || button.closest(selector) !== this.element || button.disabled) return;
    const attachment = button.closest<HTMLElement>(attachmentSelector);
    if (attachment) this.remove(attachment, "control");
  };
}

export function initAttachmentPreviews(root: ParentNode = document): NyxAttachmentPreviews[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxAttachmentPreviews(element);
    instances.set(element, instance);
    return instance;
  });
}
