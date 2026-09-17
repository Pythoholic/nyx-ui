export type NyxToastTone = "neutral" | "success" | "warning" | "danger";

export interface NyxToastOptions {
  title: string;
  description?: string;
  tone?: NyxToastTone;
  duration?: number;
}

export class NyxToast {
  readonly region: HTMLElement;

  constructor(region: HTMLElement) {
    this.region = region;
    this.region.setAttribute("aria-live", "polite");
    this.region.setAttribute("aria-label", "Notifications");
  }

  notify(options: NyxToastOptions): HTMLElement {
    const toast = document.createElement("article");
    const tone = options.tone ?? "neutral";
    const duration = options.duration ?? 5000;

    toast.className = "nyx-toast";
    toast.dataset.tone = tone;
    toast.dataset.state = "open";
    toast.setAttribute("role", tone === "danger" ? "alert" : "status");

    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.className = "nyx-toast-title";
    title.textContent = options.title;
    content.append(title);

    if (options.description) {
      const description = document.createElement("p");
      description.className = "nyx-toast-description";
      description.textContent = options.description;
      content.append(description);
    }

    const close = document.createElement("button");
    close.className = "nyx-button nyx-icon-button";
    close.dataset.size = "small";
    close.dataset.variant = "quiet";
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss notification");
    close.innerHTML = `<svg aria-hidden="true" class="nyx-icon" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>`;
    close.addEventListener("click", () => this.dismiss(toast));

    toast.append(content, close);
    this.region.append(toast);

    if (duration > 0) window.setTimeout(() => this.dismiss(toast), duration);
    return toast;
  }

  dismiss(toast: HTMLElement): void {
    if (!toast.isConnected || toast.dataset.state === "closing") return;
    toast.dataset.state = "closing";
    const remove = (): void => toast.remove();
    toast.addEventListener("animationend", remove, { once: true });
    window.setTimeout(remove, 400);
  }
}
