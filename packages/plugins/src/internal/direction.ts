export type NyxTextDirection = "ltr" | "rtl";

export function getTextDirection(element: Element): NyxTextDirection {
  const declared = element.closest<HTMLElement>("[dir]")?.getAttribute("dir")?.toLowerCase();
  if (declared === "rtl" || declared === "ltr") return declared;

  const direction = element.ownerDocument.defaultView
    ?.getComputedStyle(element)
    .direction;
  return direction === "rtl" ? "rtl" : "ltr";
}

export function horizontalArrowDelta(
  key: string,
  element: Element,
): -1 | 0 | 1 {
  if (key !== "ArrowLeft" && key !== "ArrowRight") return 0;
  const physicalDelta = key === "ArrowRight" ? 1 : -1;
  return getTextDirection(element) === "rtl"
    ? (physicalDelta * -1) as -1 | 1
    : physicalDelta;
}

export function inlineForwardArrow(element: Element): "ArrowLeft" | "ArrowRight" {
  return getTextDirection(element) === "rtl" ? "ArrowLeft" : "ArrowRight";
}

export function inlineBackwardArrow(element: Element): "ArrowLeft" | "ArrowRight" {
  return getTextDirection(element) === "rtl" ? "ArrowRight" : "ArrowLeft";
}
