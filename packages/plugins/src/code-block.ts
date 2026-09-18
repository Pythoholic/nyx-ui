import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxCodeBlockCopyReason = "api" | "button";
export type NyxCodeBlockState = "idle" | "copying" | "copied" | "error";

export interface NyxCodeBlockOptions {
  copy?: (text: string) => Promise<void> | void;
  resetDelay?: number;
}

export interface NyxCodeBlockEventDetail {
  codeBlock: NyxCodeBlock;
  reason: NyxCodeBlockCopyReason;
  text: string;
}

export interface NyxCodeBlockErrorEventDetail extends NyxCodeBlockEventDetail {
  error: unknown;
}

export interface NyxCodeBlockEventMap {
  "nyx:code-block:before-copy": CustomEvent<NyxCodeBlockEventDetail>;
  "nyx:code-block:copy": CustomEvent<NyxCodeBlockEventDetail>;
  "nyx:code-block:error": CustomEvent<NyxCodeBlockErrorEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxCodeBlockEventMap {}
}

const selector = "[data-nyx-code-block]";
const instances = new WeakMap<HTMLElement, NyxCodeBlock>();
let generatedId = 0;

function owned<T extends Element>(element: HTMLElement, childSelector: string): T | null {
  return Array.from(element.querySelectorAll<T>(childSelector))
    .find((candidate) => candidate.closest(selector) === element) ?? null;
}

function declaredDelay(element: HTMLElement, fallback: number): number {
  const value = Number(element.dataset.nyxCodeResetDelay);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export class NyxCodeBlock {
  readonly element: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly source: HTMLElement;
  readonly status: HTMLElement;

  private readonly copyText: (text: string) => Promise<void>;
  private readonly idleLabel: string;
  private readonly resetDelay: number;
  private resetTimer: number | undefined;
  private destroyed = false;

  constructor(element: HTMLElement, options: NyxCodeBlockOptions = {}) {
    this.element = element;
    const button = owned<HTMLButtonElement>(element, "[data-nyx-code-copy]");
    const status = owned<HTMLElement>(element, "[data-nyx-code-status]");
    if (!button || !status) {
      throw new Error("NyxCodeBlock requires an owned copy button and status element.");
    }

    const controlledId = button.getAttribute("aria-controls");
    const controlled = controlledId ? element.ownerDocument.getElementById(controlledId) : null;
    const source = controlled && controlled.closest(selector) === element
      ? controlled
      : owned<HTMLElement>(element, "[data-nyx-code-source], code");
    if (!source) throw new Error("NyxCodeBlock requires an owned code source.");

    this.button = button;
    this.source = source;
    this.status = status;
    this.idleLabel = button.dataset.nyxCodeLabel ?? "Copy";
    this.resetDelay = options.resetDelay ?? declaredDelay(element, 2000);
    this.copyText = async (text) => {
      if (options.copy) {
        await options.copy(text);
        return;
      }
      await this.writeToClipboard(text);
    };

    if (!source.id) source.id = `nyx-code-source-${++generatedId}`;
    if (!status.id) status.id = `nyx-code-status-${++generatedId}`;
    button.setAttribute("aria-controls", source.id);
    const descriptions = new Set((button.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    descriptions.add(status.id);
    button.setAttribute("aria-describedby", Array.from(descriptions).join(" "));
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    button.addEventListener("click", this.handleClick);
    this.sync("idle", "");
  }

  get state(): NyxCodeBlockState {
    return (this.element.dataset.state as NyxCodeBlockState | undefined) ?? "idle";
  }

  get value(): string {
    return this.source.textContent ?? "";
  }

  async copy(reason: NyxCodeBlockCopyReason = "api"): Promise<boolean> {
    if (this.destroyed || this.state === "copying") return false;
    const detail: NyxCodeBlockEventDetail = { codeBlock: this, reason, text: this.value };
    if (!dispatchNyxEvent(this.element, "nyx:code-block:before-copy", detail, true)) return false;

    this.clearReset();
    this.sync("copying", "Copying code.");
    try {
      await this.copyText(detail.text);
      if (this.destroyed) return false;
      this.sync("copied", "Code copied to clipboard.");
      dispatchNyxEvent(this.element, "nyx:code-block:copy", detail);
      this.scheduleReset();
      return true;
    } catch (error) {
      if (this.destroyed) return false;
      this.sync("error", "Copy failed. Select the code and copy it manually.");
      dispatchNyxEvent(this.element, "nyx:code-block:error", { ...detail, error });
      this.scheduleReset();
      return false;
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.clearReset();
    this.button.removeEventListener("click", this.handleClick);
    this.sync("idle", "");
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private sync(state: NyxCodeBlockState, message: string): void {
    this.element.dataset.state = state;
    this.element.setAttribute("aria-busy", String(state === "copying"));
    this.button.dataset.state = state;
    this.button.setAttribute("aria-disabled", String(state === "copying"));
    const label = state === "copied" ? "Copied" : state === "error" ? "Copy failed" : this.idleLabel;
    const labelElement = this.button.querySelector<HTMLElement>("[data-nyx-code-copy-label]");
    if (labelElement) labelElement.textContent = label;
    this.button.setAttribute("aria-label", label);
    this.status.textContent = message;
  }

  private clearReset(): void {
    if (this.resetTimer !== undefined) window.clearTimeout(this.resetTimer);
    this.resetTimer = undefined;
  }

  private scheduleReset(): void {
    if (this.resetDelay === 0) {
      this.sync("idle", "");
      return;
    }
    this.resetTimer = window.setTimeout(() => {
      this.resetTimer = undefined;
      if (!this.destroyed) this.sync("idle", "");
    }, this.resetDelay);
  }

  private async writeToClipboard(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const document = this.element.ownerDocument;
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand?.("copy") ?? false;
    textarea.remove();
    if (!copied) throw new Error("Copy command was rejected.");
  }

  private readonly handleClick = (): void => {
    void this.copy("button");
  };
}

export function initCodeBlocks(
  root: ParentNode = document,
  options: NyxCodeBlockOptions = {},
): NyxCodeBlock[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxCodeBlock(element, options);
    instances.set(element, instance);
    return instance;
  });
}
