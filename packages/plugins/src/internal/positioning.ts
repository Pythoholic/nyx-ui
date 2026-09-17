import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
  type Placement,
  type ReferenceElement,
  type VirtualElement,
} from "@floating-ui/dom";

export type NyxOverlayPlacement = Placement;
export type NyxOverlayReference = Element | VirtualElement;

export interface NyxOverlayPositionOptions {
  offset?: number;
  placement?: NyxOverlayPlacement;
}

export function positionOverlay(
  reference: NyxOverlayReference,
  overlay: HTMLElement,
  options: NyxOverlayPositionOptions = {},
): () => void {
  const padding = 8;
  let active = true;
  overlay.removeAttribute("data-nyx-positioned");

  const update = async (): Promise<void> => {
    const result = await computePosition(reference, overlay, {
      middleware: [
        offset(options.offset ?? 6),
        flip({ padding }),
        shift({ padding }),
        size({
          padding,
          apply({ availableHeight, availableWidth, rects }) {
            overlay.style.setProperty(
              "--nyx-overlay-available-height",
              `${Math.max(0, availableHeight)}px`,
            );
            overlay.style.setProperty(
              "--nyx-overlay-available-width",
              `${Math.max(0, availableWidth)}px`,
            );
            overlay.style.setProperty(
              "--nyx-overlay-anchor-width",
              `${rects.reference.width}px`,
            );
          },
        }),
      ],
      placement: options.placement ?? "bottom-start",
      strategy: "fixed",
    });

    if (!active) return;
    overlay.dataset.placement = result.placement;
    overlay.style.setProperty("--nyx-overlay-x", `${result.x}px`);
    overlay.style.setProperty("--nyx-overlay-y", `${result.y}px`);
    overlay.setAttribute("data-nyx-positioned", "");
  };

  const stopAutoUpdate = autoUpdate(
    reference as ReferenceElement,
    overlay,
    update,
  );

  return () => {
    active = false;
    stopAutoUpdate();
    overlay.removeAttribute("data-nyx-positioned");
    overlay.style.removeProperty("--nyx-overlay-x");
    overlay.style.removeProperty("--nyx-overlay-y");
    overlay.style.removeProperty("--nyx-overlay-available-height");
    overlay.style.removeProperty("--nyx-overlay-available-width");
    overlay.style.removeProperty("--nyx-overlay-anchor-width");
  };
}
