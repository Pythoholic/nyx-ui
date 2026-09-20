import { moveFocusTo } from "./internal/focus.js";
import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxCarouselChangeReason = "api" | "indicator" | "next" | "previous";

export interface NyxCarouselEventDetail {
  carousel: NyxCarousel;
  index: number;
  previousIndex: number;
  reason: NyxCarouselChangeReason;
  slide: HTMLElement;
}

export interface NyxCarouselEventMap {
  "nyx:carousel:before-change": CustomEvent<NyxCarouselEventDetail>;
  "nyx:carousel:change": CustomEvent<NyxCarouselEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxCarouselEventMap {}
}

const selector = "[data-nyx-carousel]";
const instances = new WeakMap<HTMLElement, NyxCarousel>();
let generatedId = 0;

function parsedIndex(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const index = Number(value);
  return Number.isInteger(index) ? index : undefined;
}

export class NyxCarousel {
  readonly element: HTMLElement;
  readonly slides: HTMLElement[];

  private readonly indicators: HTMLButtonElement[];
  private readonly nextButtons: HTMLButtonElement[];
  private readonly previousButtons: HTMLButtonElement[];
  private readonly status: HTMLElement | undefined;
  private activeIndex: number;

  constructor(element: HTMLElement) {
    this.element = element;
    this.slides = Array.from(
      element.querySelectorAll<HTMLElement>("[data-nyx-carousel-slide]"),
    ).filter((slide) => slide.closest(selector) === element);
    if (this.slides.length === 0) {
      throw new Error("NyxCarousel requires at least one owned slide.");
    }

    this.indicators = this.ownedButtons("[data-nyx-carousel-go-to]");
    this.nextButtons = this.ownedButtons("[data-nyx-carousel-next]");
    this.previousButtons = this.ownedButtons("[data-nyx-carousel-previous]");
    this.status = Array.from(
      element.querySelectorAll<HTMLElement>("[data-nyx-carousel-status]"),
    ).find((candidate) => candidate.closest(selector) === element);

    const declaredIndex = parsedIndex(element.dataset.nyxCarouselIndex);
    const activeSlide = this.slides.findIndex((slide) => slide.dataset.state === "active");
    this.activeIndex = this.clamp(declaredIndex ?? (activeSlide >= 0 ? activeSlide : 0));

    if (!element.hasAttribute("role")) element.setAttribute("role", "region");
    element.setAttribute("aria-roledescription", "carousel");
    element.addEventListener("click", this.handleClick);
    this.sync();
  }

  get value(): number {
    return this.activeIndex;
  }

  set value(index: number) {
    this.goTo(index);
  }

  get loop(): boolean {
    return this.element.hasAttribute("data-nyx-carousel-loop");
  }

  goTo(index: number, reason: NyxCarouselChangeReason = "api"): boolean {
    if (!Number.isInteger(index)) return false;
    const nextIndex = this.loop
      ? ((index % this.slides.length) + this.slides.length) % this.slides.length
      : this.clamp(index);
    if (nextIndex === this.activeIndex) return false;
    const slide = this.slides[nextIndex];
    if (!slide) return false;
    const detail: NyxCarouselEventDetail = {
      carousel: this,
      index: nextIndex,
      previousIndex: this.activeIndex,
      reason,
      slide,
    };
    if (!dispatchNyxEvent(this.element, "nyx:carousel:before-change", detail, true)) return false;
    this.activeIndex = nextIndex;
    this.sync();
    dispatchNyxEvent(this.element, "nyx:carousel:change", detail);
    return true;
  }

  next(reason: NyxCarouselChangeReason = "next"): boolean {
    return this.goTo(this.activeIndex + 1, reason);
  }

  previous(reason: NyxCarouselChangeReason = "previous"): boolean {
    return this.goTo(this.activeIndex - 1, reason);
  }

  destroy(): void {
    this.element.removeEventListener("click", this.handleClick);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private ownedButtons(buttonSelector: string): HTMLButtonElement[] {
    return Array.from(this.element.querySelectorAll<HTMLButtonElement>(buttonSelector)).filter(
      (button) => button.closest(selector) === this.element,
    );
  }

  private clamp(index: number): number {
    return Math.max(0, Math.min(this.slides.length - 1, index));
  }

  private sync(): void {
    this.element.dataset.state = "active";
    this.element.dataset.nyxCarouselIndex = String(this.activeIndex);
    this.slides[this.activeIndex]!.hidden = false;
    this.slides.forEach((slide, index) => {
      const active = index === this.activeIndex;
      if (!slide.id) slide.id = `nyx-carousel-slide-${++generatedId}`;
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      if (!slide.hasAttribute("aria-label")) {
        slide.setAttribute("aria-label", `${index + 1} of ${this.slides.length}`);
      }
      slide.setAttribute("aria-hidden", String(!active));
      slide.dataset.state = active ? "active" : "inactive";
      if (!active) moveFocusTo(slide, this.slides[this.activeIndex]!);
      slide.hidden = !active;
    });
    this.indicators.forEach((indicator, fallbackIndex) => {
      const index = parsedIndex(indicator.dataset.nyxCarouselGoTo) ?? fallbackIndex;
      const slide = this.slides[index];
      const active = index === this.activeIndex;
      indicator.disabled = !slide;
      indicator.setAttribute("aria-disabled", String(!slide));
      indicator.setAttribute("aria-current", String(active));
      indicator.dataset.state = active ? "active" : "inactive";
      if (slide) indicator.setAttribute("aria-controls", slide.id);
      else indicator.removeAttribute("aria-controls");
    });
    const atStart = this.activeIndex === 0;
    const atEnd = this.activeIndex === this.slides.length - 1;
    this.previousButtons.forEach((button) => {
      if (!this.loop && atStart) moveFocusTo(button, this.slides[this.activeIndex]!);
      button.disabled = !this.loop && atStart;
      button.setAttribute("aria-disabled", String(button.disabled));
    });
    this.nextButtons.forEach((button) => {
      if (!this.loop && atEnd) moveFocusTo(button, this.slides[this.activeIndex]!);
      button.disabled = !this.loop && atEnd;
      button.setAttribute("aria-disabled", String(button.disabled));
    });
    if (this.status) this.status.textContent = `Slide ${this.activeIndex + 1} of ${this.slides.length}`;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>("button");
    if (!button || button.closest(selector) !== this.element || button.disabled) return;
    if (button.hasAttribute("data-nyx-carousel-next")) this.next();
    else if (button.hasAttribute("data-nyx-carousel-previous")) this.previous();
    else if (button.hasAttribute("data-nyx-carousel-go-to")) {
      const fallbackIndex = this.indicators.indexOf(button);
      const index = parsedIndex(button.dataset.nyxCarouselGoTo) ?? fallbackIndex;
      this.goTo(index, "indicator");
    }
  };
}

export function initCarousels(root: ParentNode = document): NyxCarousel[] {
  return queryAllIncludingRoot<HTMLElement>(root, selector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxCarousel(element);
    instances.set(element, instance);
    return instance;
  });
}
