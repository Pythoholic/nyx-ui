export function queryAllIncludingRoot<T extends Element>(
  root: ParentNode,
  selector: string,
): T[] {
  const matches = root instanceof Element && root.matches(selector) ? [root as T] : [];
  return [...matches, ...root.querySelectorAll<T>(selector)];
}

export function dispatchNyxEvent<T>(
  target: HTMLElement,
  type: string,
  detail: T,
  cancelable = false,
): boolean {
  return target.dispatchEvent(
    new CustomEvent<T>(type, {
      bubbles: true,
      cancelable,
      detail,
    }),
  );
}
