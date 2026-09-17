import { icon } from "../icons.js";
import togglesMarkup from "../../../../registry/components/toggles.html?raw";
import { card, section } from "./shared.js";

export const actionsSection = section(
  "actions",
  "06",
  "Actions",
  "Buttons share stable geometry and clear priority. The catalog includes variants, sizes, icon-only controls, groups, disabled state, and loading state.",
  `<div class="docs-grid">
    ${card("Variants", `<div class="docs-row"><button class="nyx-button" data-variant="primary">Primary ${icon("arrow")}</button><button class="nyx-button">Secondary</button><button class="nyx-button" data-variant="quiet">Quiet</button><button class="nyx-button" data-variant="danger">Destructive</button></div>`)}
    ${card("Sizes and states", `<div class="docs-row"><button class="nyx-button" data-size="small">Small</button><button class="nyx-button">Default</button><button class="nyx-button" data-size="large">Large</button><button class="nyx-button" disabled>Disabled</button><button class="nyx-button" data-loading="true"><span class="nyx-spinner"></span>Loading</button></div>`)}
    ${card("Icon controls", `<div class="docs-row"><span class="nyx-tooltip-wrap"><button class="nyx-button nyx-icon-button" aria-label="Add item">${icon("plus")}</button><span class="nyx-tooltip" role="tooltip">Add item</span></span><button class="nyx-button nyx-icon-button" aria-label="Settings">${icon("settings")}</button><button class="nyx-button nyx-icon-button" aria-label="Account">${icon("user")}</button></div>`, "Named")}
    ${card("Toggle and toggle group", `<div class="docs-column">${togglesMarkup}</div>`, "Native state")}
  </div>`,
  "button action primary secondary quiet destructive icon group toggle pressed radio segmented loading disabled sizes",
);
