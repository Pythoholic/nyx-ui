import { moveFocusTo } from "./internal/focus.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxFileUploadState = "complete" | "error" | "queued" | "uploading";

export interface NyxFileUploadItem {
  error?: string;
  file: File;
  id: string;
  objectUrl?: string;
  progress: number;
  result?: unknown;
  state: NyxFileUploadState;
}

export interface NyxFileUploadAdapterContext {
  reportProgress(progress: number): void;
  signal: AbortSignal;
}

export type NyxFileUploadAdapter = (file: File, context: NyxFileUploadAdapterContext) => Promise<unknown>;

export interface NyxFileUploadOptions {
  maxFiles?: number;
  maxSize?: number;
  transport?: NyxFileUploadAdapter;
}

export interface NyxFileUploadEventDetail {
  errors?: string[];
  fileUpload: NyxFileUpload;
  item?: NyxFileUploadItem;
  items?: NyxFileUploadItem[];
  progress?: number;
  result?: unknown;
}

export interface NyxFileUploadEventMap {
  "nyx:file-upload:add": CustomEvent<NyxFileUploadEventDetail>;
  "nyx:file-upload:before-add": CustomEvent<NyxFileUploadEventDetail>;
  "nyx:file-upload:before-remove": CustomEvent<NyxFileUploadEventDetail>;
  "nyx:file-upload:before-upload": CustomEvent<NyxFileUploadEventDetail>;
  "nyx:file-upload:complete": CustomEvent<NyxFileUploadEventDetail>;
  "nyx:file-upload:error": CustomEvent<NyxFileUploadEventDetail>;
  "nyx:file-upload:progress": CustomEvent<NyxFileUploadEventDetail>;
  "nyx:file-upload:remove": CustomEvent<NyxFileUploadEventDetail>;
  "nyx:file-upload:upload": CustomEvent<NyxFileUploadEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxFileUploadEventMap {}
}

const selector = "[data-nyx-file-upload]";
const instances = new WeakMap<HTMLElement, NyxFileUpload>();
let generatedId = 0;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matchesAccept(file: File, accept: string): boolean {
  if (!accept.trim()) return true;
  return accept.split(",").map((value) => value.trim().toLowerCase()).some((rule) => {
    if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule);
    if (rule.endsWith("/*")) return file.type.toLowerCase().startsWith(rule.slice(0, -1));
    return file.type.toLowerCase() === rule;
  });
}

export class NyxFileUpload {
  readonly element: HTMLElement;
  readonly input: HTMLInputElement;
  readonly queueElement: HTMLElement;

  private readonly abortControllers = new Map<string, AbortController>();
  private dragDepth = 0;
  private readonly errorElement: HTMLElement;
  private readonly items: NyxFileUploadItem[] = [];
  private readonly maxFiles: number;
  private readonly maxSize: number;
  private readonly startButton: HTMLButtonElement | null;
  private transport: NyxFileUploadAdapter | undefined;

  constructor(element: HTMLElement, options: NyxFileUploadOptions = {}) {
    this.element = element;
    const input = element.querySelector<HTMLInputElement>("input[type='file']");
    const queue = element.querySelector<HTMLElement>("[data-nyx-file-upload-queue]");
    const errors = element.querySelector<HTMLElement>("[data-nyx-file-upload-errors]");
    if (!input || !queue || !errors) throw new Error("NyxFileUpload requires a file input, queue, and error region.");
    this.input = input;
    this.queueElement = queue;
    this.errorElement = errors;
    this.startButton = element.querySelector<HTMLButtonElement>("[data-nyx-file-upload-start]");
    this.maxFiles = options.maxFiles ?? Number(element.dataset.nyxFileUploadMaxFiles || (input.multiple ? Infinity : 1));
    this.maxSize = options.maxSize ?? Number(element.dataset.nyxFileUploadMaxSize || Infinity);
    this.transport = options.transport;
    if (!errors.id) errors.id = `nyx-file-upload-errors-${++generatedId}`;
    const describedBy = new Set((input.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    describedBy.add(errors.id);
    input.setAttribute("aria-describedby", Array.from(describedBy).join(" "));
    input.addEventListener("change", this.handleInputChange);
    element.addEventListener("dragenter", this.handleDragEnter);
    element.addEventListener("dragleave", this.handleDragLeave);
    element.addEventListener("dragover", this.handleDragOver);
    element.addEventListener("drop", this.handleDrop);
    queue.addEventListener("click", this.handleQueueClick);
    this.startButton?.addEventListener("click", this.handleStartClick);
    this.sync();
  }

  get value(): readonly NyxFileUploadItem[] {
    return this.items;
  }

  setTransport(transport: NyxFileUploadAdapter | undefined): void {
    this.transport = transport;
    this.sync();
  }

  add(files: Iterable<File>): NyxFileUploadItem[] {
    const incoming = Array.from(files);
    const errors: string[] = [];
    const accepted: File[] = [];
    incoming.forEach((file) => {
      if (this.items.length + accepted.length >= this.maxFiles) {
        errors.push(`${file.name}: the ${this.maxFiles}-file limit has been reached.`);
      } else if (file.size > this.maxSize) {
        errors.push(`${file.name}: ${formatBytes(file.size)} exceeds the ${formatBytes(this.maxSize)} limit.`);
      } else if (!matchesAccept(file, this.input.accept)) {
        errors.push(`${file.name}: this file type is not accepted.`);
      } else accepted.push(file);
    });

    const proposed = accepted.map((file) => this.createItem(file));
    const detail: NyxFileUploadEventDetail = { errors, fileUpload: this, items: proposed };
    if (proposed.length && !dispatchNyxEvent(this.element, "nyx:file-upload:before-add", detail, true)) {
      proposed.forEach((item) => this.revoke(item));
      return [];
    }
    this.items.push(...proposed);
    this.reportErrors(errors);
    this.sync();
    if (proposed.length) dispatchNyxEvent(this.element, "nyx:file-upload:add", detail);
    if (errors.length) dispatchNyxEvent(this.element, "nyx:file-upload:error", detail);
    return proposed;
  }

  remove(id: string): void {
    const index = this.items.findIndex((item) => item.id === id);
    const item = this.items[index];
    if (!item) return;
    const detail: NyxFileUploadEventDetail = { fileUpload: this, item };
    if (!dispatchNyxEvent(this.element, "nyx:file-upload:before-remove", detail, true)) return;
    this.abortControllers.get(id)?.abort();
    this.abortControllers.delete(id);
    this.revoke(item);
    this.items.splice(index, 1);
    this.reportErrors([]);
    this.sync();
    dispatchNyxEvent(this.element, "nyx:file-upload:remove", detail);
  }

  setProgress(id: string, progress: number): void {
    const item = this.items.find((candidate) => candidate.id === id);
    if (!item || item.state === "complete") return;
    item.progress = Math.max(0, Math.min(100, progress));
    item.state = "uploading";
    this.sync();
    dispatchNyxEvent(this.element, "nyx:file-upload:progress", { fileUpload: this, item, progress: item.progress });
  }

  async upload(id: string): Promise<unknown> {
    const item = this.items.find((candidate) => candidate.id === id);
    if (!item || !this.transport || item.state === "uploading" || item.state === "complete") return undefined;
    const detail: NyxFileUploadEventDetail = { fileUpload: this, item };
    if (!dispatchNyxEvent(this.element, "nyx:file-upload:before-upload", detail, true)) return undefined;
    const controller = new AbortController();
    this.abortControllers.set(id, controller);
    delete item.error;
    item.state = "uploading";
    item.progress = 0;
    this.sync();
    dispatchNyxEvent(this.element, "nyx:file-upload:upload", detail);
    try {
      const result = await this.transport(item.file, {
        reportProgress: (progress) => this.setProgress(id, progress),
        signal: controller.signal,
      });
      if (controller.signal.aborted || !this.items.includes(item)) return undefined;
      item.progress = 100;
      item.result = result;
      item.state = "complete";
      this.sync();
      dispatchNyxEvent(this.element, "nyx:file-upload:complete", { ...detail, progress: 100, result });
      return result;
    } catch (error) {
      if (controller.signal.aborted || !this.items.includes(item)) return undefined;
      item.error = error instanceof Error ? error.message : "Upload failed.";
      item.state = "error";
      this.reportErrors([`${item.file.name}: ${item.error}`], false);
      this.sync();
      dispatchNyxEvent(this.element, "nyx:file-upload:error", { ...detail, errors: [item.error] });
      return undefined;
    } finally {
      this.abortControllers.delete(id);
    }
  }

  async uploadAll(): Promise<unknown[]> {
    return Promise.all(this.items.filter((item) => item.state === "queued" || item.state === "error").map((item) => this.upload(item.id)));
  }

  destroy(): void {
    this.input.removeEventListener("change", this.handleInputChange);
    this.element.removeEventListener("dragenter", this.handleDragEnter);
    this.element.removeEventListener("dragleave", this.handleDragLeave);
    this.element.removeEventListener("dragover", this.handleDragOver);
    this.element.removeEventListener("drop", this.handleDrop);
    this.queueElement.removeEventListener("click", this.handleQueueClick);
    this.startButton?.removeEventListener("click", this.handleStartClick);
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
    this.items.forEach((item) => this.revoke(item));
    this.items.length = 0;
    this.queueElement.replaceChildren();
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private createItem(file: File): NyxFileUploadItem {
    const item: NyxFileUploadItem = { file, id: `nyx-file-${++generatedId}`, progress: 0, state: "queued" };
    if (file.type.startsWith("image/") && typeof URL.createObjectURL === "function") item.objectUrl = URL.createObjectURL(file);
    return item;
  }

  private revoke(item: NyxFileUploadItem): void {
    if (!item.objectUrl) return;
    URL.revokeObjectURL(item.objectUrl);
    delete item.objectUrl;
  }

  private reportErrors(errors: string[], invalid = errors.length > 0): void {
    this.errorElement.textContent = errors.join(" ");
    this.errorElement.hidden = errors.length === 0;
    this.input.setAttribute("aria-invalid", String(invalid));
  }

  private sync(): void {
    this.element.dataset.state = this.items.some((item) => item.state === "uploading") ? "uploading" : this.items.length ? "ready" : "empty";
    if (this.startButton && !this.items.some(item => item.state === "queued" || item.state === "error")) moveFocusTo(this.startButton, this.input);
    this.startButton?.toggleAttribute("disabled", !this.transport || !this.items.some((item) => item.state === "queued" || item.state === "error"));
    const document = this.element.ownerDocument;
    const nodes = this.items.map((item) => {
      const row = document.createElement("li");
      row.className = "nyx-file-item nyx-motion-fade";
      row.dataset.state = item.state;
      row.dataset.nyxFileId = item.id;
      if (item.objectUrl) {
        const image = document.createElement("img");
        image.className = "nyx-file-preview";
        image.src = item.objectUrl;
        image.alt = "";
        row.append(image);
      }
      const details = document.createElement("div");
      details.className = "nyx-file-details";
      const name = document.createElement("strong");
      name.textContent = item.file.name;
      const meta = document.createElement("span");
      meta.className = "nyx-field-hint";
      meta.textContent = `${formatBytes(item.file.size)} · ${item.state}`;
      const progress = document.createElement("progress");
      progress.className = "nyx-file-progress";
      progress.max = 100;
      progress.value = item.progress;
      progress.setAttribute("aria-label", `Upload progress for ${item.file.name}`);
      details.append(name, meta, progress);
      if (item.error) {
        const error = document.createElement("span");
        error.className = "nyx-field-error";
        error.textContent = item.error;
        details.append(error);
      }
      const remove = document.createElement("button");
      remove.className = "nyx-button nyx-icon-button";
      remove.dataset.nyxFileUploadRemove = item.id;
      remove.dataset.size = "small";
      remove.dataset.variant = "quiet";
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${item.file.name}`);
      remove.textContent = "×";
      row.append(details, remove);
      return row;
    });
    moveFocusTo(this.queueElement, this.input);
    this.queueElement.replaceChildren(...nodes);
  }

  private readonly handleInputChange = (): void => {
    if (this.input.files) this.add(this.input.files);
    this.input.value = "";
  };

  private readonly handleDragEnter = (event: DragEvent): void => {
    event.preventDefault();
    this.dragDepth += 1;
    this.element.dataset.dragging = "true";
  };

  private readonly handleDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) delete this.element.dataset.dragging;
  };

  private readonly handleDragOver = (event: DragEvent): void => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  };

  private readonly handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    this.dragDepth = 0;
    delete this.element.dataset.dragging;
    if (event.dataTransfer?.files) this.add(event.dataTransfer.files);
  };

  private readonly handleQueueClick = (event: MouseEvent): void => {
    const button = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-nyx-file-upload-remove]") : null;
    const id = button?.dataset.nyxFileUploadRemove;
    if (id) this.remove(id);
  };

  private readonly handleStartClick = (): void => { void this.uploadAll(); };
}

export function initFileUploads(root: ParentNode = document, options: NyxFileUploadOptions = {}): NyxFileUpload[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxFileUpload(element, options);
    instances.set(element, instance);
    return instance;
  });
}
