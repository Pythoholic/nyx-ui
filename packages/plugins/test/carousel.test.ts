import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initCarousels, type NyxCarousel } from "../src/carousel.js";

function renderCarousel(loop = false): HTMLElement {
  document.body.innerHTML = `<section data-nyx-carousel ${loop ? "data-nyx-carousel-loop" : ""} aria-label="Highlights">
    <article id="slide-one" data-nyx-carousel-slide data-state="active">One</article>
    <article id="slide-two" data-nyx-carousel-slide>Two</article>
    <article id="slide-three" data-nyx-carousel-slide>Three</article>
    <button data-nyx-carousel-previous>Previous</button>
    <span data-nyx-carousel-status></span>
    <button data-nyx-carousel-next>Next</button>
    <button data-nyx-carousel-go-to="0">One</button>
    <button data-nyx-carousel-go-to="1">Two</button>
    <button data-nyx-carousel-go-to="2">Three</button>
  </section>`;
  return document.querySelector<HTMLElement>("[data-nyx-carousel]")!;
}

describe("NyxCarousel", () => {
  let initialized: NyxCarousel[] = [];
  beforeEach(() => renderCarousel());
  afterEach(() => { initialized.forEach((carousel) => carousel.destroy()); initialized = []; });

  it("includes a matching root, initializes idempotently, and reinitializes after destroy", () => {
    const element = document.querySelector<HTMLElement>("[data-nyx-carousel]")!;
    const first = initCarousels(element)[0]!;
    initialized = [first];
    expect(initCarousels(element)[0]).toBe(first);
    first.destroy();
    const next = initCarousels(element)[0]!;
    initialized = [next];
    expect(next).not.toBe(first);
  });

  it("synchronizes slides, controls, indicators, status, and ARIA", () => {
    initialized = initCarousels();
    const carousel = initialized[0]!;
    const slides = carousel.slides;
    const previous = carousel.element.querySelector<HTMLButtonElement>("[data-nyx-carousel-previous]")!;
    const next = carousel.element.querySelector<HTMLButtonElement>("[data-nyx-carousel-next]")!;
    const indicators = carousel.element.querySelectorAll<HTMLButtonElement>("[data-nyx-carousel-go-to]");
    expect(carousel.element.getAttribute("aria-roledescription")).toBe("carousel");
    expect(slides[0]?.hidden).toBe(false);
    expect(slides[1]?.hidden).toBe(true);
    expect(slides[0]?.getAttribute("aria-label")).toBe("1 of 3");
    expect(previous.disabled).toBe(true);

    next.click();
    expect(carousel.value).toBe(1);
    expect(slides[0]?.dataset.state).toBe("inactive");
    expect(slides[1]?.dataset.state).toBe("active");
    expect(slides[1]?.getAttribute("aria-hidden")).toBe("false");
    expect(indicators[1]?.getAttribute("aria-current")).toBe("true");
    expect(indicators[1]?.getAttribute("aria-controls")).toBe("slide-two");
    expect(carousel.element.querySelector("[data-nyx-carousel-status]")?.textContent).toBe("Slide 2 of 3");

    carousel.goTo(2);
    expect(next.disabled).toBe(true);
  });

  it("pairs a cancelable before-event with an after-event", () => {
    initialized = initCarousels();
    const carousel = initialized[0]!;
    const changed = vi.fn();
    const prevent = (event: Event): void => event.preventDefault();
    carousel.element.addEventListener("nyx:carousel:change", changed);
    carousel.element.addEventListener("nyx:carousel:before-change", prevent);
    expect(carousel.goTo(2)).toBe(false);
    expect(carousel.value).toBe(0);
    expect(changed).not.toHaveBeenCalled();
    carousel.element.removeEventListener("nyx:carousel:before-change", prevent);
    expect(carousel.goTo(2)).toBe(true);
    expect(changed).toHaveBeenCalledOnce();
  });

  it("wraps only when loop is enabled and keeps nested carousels isolated", () => {
    const outer = renderCarousel(true);
    outer.querySelector("[data-nyx-carousel-slide]")?.insertAdjacentHTML("beforeend", `<section data-nyx-carousel aria-label="Nested"><div data-nyx-carousel-slide>Nested one</div><div data-nyx-carousel-slide>Nested two</div><button data-nyx-carousel-next>Next nested</button></section>`);
    initialized = initCarousels();
    const [outerCarousel, innerCarousel] = initialized;
    expect(outerCarousel?.slides).toHaveLength(3);
    expect(innerCarousel?.slides).toHaveLength(2);
    expect(outerCarousel?.previous()).toBe(true);
    expect(outerCarousel?.value).toBe(2);
    innerCarousel?.next();
    expect(innerCarousel?.value).toBe(1);
    expect(outerCarousel?.value).toBe(2);
  });
});
