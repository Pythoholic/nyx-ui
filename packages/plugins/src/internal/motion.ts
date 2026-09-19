function finishAnimations(element: HTMLElement, finish: () => void): void {
  const animations = element.getAnimations?.() ?? [];
  if (!animations.length) {
    finish();
    return;
  }
  void Promise.allSettled(animations.map((animation) => animation.finished)).then(finish);
}

export function animateRemoval(element: HTMLElement): void {
  element.dataset.nyxMotion = "removing";
  element.setAttribute("aria-hidden", "true");
  element.inert = true;
  finishAnimations(element, () => element.remove());
}

export function animateReorder(element: HTMLElement): void {
  element.dataset.nyxMotion = "reordered";
  finishAnimations(element, () => delete element.dataset.nyxMotion);
}
