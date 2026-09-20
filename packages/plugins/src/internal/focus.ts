/** Focus a noninteractive fallback without adding it to the Tab sequence. */
export function focusElement(element: HTMLElement): void {
  if (element.tabIndex < 0 && !element.hasAttribute("tabindex")) element.tabIndex = -1;
  element.focus({ preventScroll: true });
}

/** Only repair focus when the disappearing subtree currently owns it. */
export function moveFocusBeforeRemoval(element: HTMLElement, scope: HTMLElement, selector = "button, a[href], input, select, textarea, [tabindex]"): void {
  const active = element.ownerDocument.activeElement;
  if (!active || !element.contains(active)) return;
  const candidates = Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter(candidate =>
    !element.contains(candidate) && !candidate.matches(":disabled") &&
    !candidate.closest('[hidden], [inert], [data-nyx-motion="removing"], [data-state="closing"]'),
  );
  const next = candidates.find(candidate => Boolean(element.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING));
  focusElement(next ?? candidates.at(-1) ?? scope);
}

export function moveFocusTo(element: HTMLElement, destination: HTMLElement): void {
  if (element.contains(element.ownerDocument.activeElement)) focusElement(destination);
}
