import dialogMarkup from "../../../../registry/components/dialog.html?raw";
import overlaysMarkup from "../../../../registry/components/overlays.html?raw";
import { card, section } from "./shared.js";

export const overlaysSection = section(
  "overlays",
  "10",
  "Overlays",
  "Tooltips clarify compact controls; native popovers serve lightweight menus; modal dialogs and drawers use one focus-safe controller.",
  `<div class="docs-grid">
    ${card("Tooltip and popover", `<div class="docs-row">${overlaysMarkup}</div>`, "Native popover")}
    ${card("Modal and drawer", `<div class="docs-row">${dialogMarkup}</div>`)}
  </div>`,
  "overlay tooltip popover dropdown menu dialog drawer confirmation focus escape backdrop",
);
