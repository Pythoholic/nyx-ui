export type NyxOverlayDismissReason = "escape" | "focus-leave" | "outside";

export interface NyxOverlayDismissOptions {
  element: HTMLElement;
  onDismiss: (reason: NyxOverlayDismissReason) => void;
  pointerInside?: readonly Element[];
}

const activeDismissals: NyxOverlayDismissal[] = [];

export class NyxOverlayDismissal {
  private active = false;
  private readonly document: Document;
  private readonly element: HTMLElement;
  private readonly onDismiss: (reason: NyxOverlayDismissReason) => void;
  private readonly pointerInside: readonly Element[];

  constructor(options: NyxOverlayDismissOptions) {
    this.element = options.element;
    this.document = options.element.ownerDocument;
    this.onDismiss = options.onDismiss;
    this.pointerInside = options.pointerInside ?? [];
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    activeDismissals.push(this);
    this.document.addEventListener("pointerdown", this.handlePointerDown, true);
    this.document.addEventListener("keydown", this.handleKeydown, true);
    this.document.addEventListener("focusin", this.handleFocusIn, true);
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    const index = activeDismissals.lastIndexOf(this);
    if (index >= 0) activeDismissals.splice(index, 1);
    this.document.removeEventListener("pointerdown", this.handlePointerDown, true);
    this.document.removeEventListener("keydown", this.handleKeydown, true);
    this.document.removeEventListener("focusin", this.handleFocusIn, true);
  }

  destroy(): void {
    this.deactivate();
  }

  private isTopmost(): boolean {
    for (let index = activeDismissals.length - 1; index >= 0; index -= 1) {
      const dismissal = activeDismissals[index];
      if (dismissal?.document === this.document) return dismissal === this;
    }
    return false;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.isTopmost()) return;
    const path = event.composedPath();
    const inside = [this.element, ...this.pointerInside].some((element) =>
      path.includes(element),
    );
    if (inside) return;

    this.onDismiss("outside");
    if (this.active) event.preventDefault();
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (!this.isTopmost() || event.key !== "Escape") return;
    this.onDismiss("escape");
    event.preventDefault();
    event.stopPropagation();
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    if (!this.isTopmost()) return;
    const target = event.target;
    if (
      target instanceof Node &&
      (this.element.contains(target) ||
        this.pointerInside.some((element) => element.contains(target)))
    ) return;
    this.onDismiss("focus-leave");
  };
}
