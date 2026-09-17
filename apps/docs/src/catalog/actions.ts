import buttonMarkup from "../../../../registry/components/button.html?raw";
import togglesMarkup from "../../../../registry/components/toggles.html?raw";
import { icon } from "../icons.js";
import { paths } from "../routes.js";
import { card, page } from "./shared.js";

export const actionPages = [
  page({
    path: paths.components.actions.button,
    categoryId: "actions",
    categoryLabel: "Actions",
    title: "Button",
    description: "Buttons share stable geometry and clear priority across variants, sizes, icon-only controls, disabled state, and loading state.",
    searchTerms: "button action primary secondary quiet destructive icon group loading disabled sizes",
    body: `<div class="docs-grid">
      ${card("Canonical button", `<div class="docs-row">${buttonMarkup}</div>`, "Registry source", buttonMarkup)}
      ${card("Variants", `<div class="docs-row"><button class="nyx-button" data-variant="primary">Primary ${icon("arrow")}</button><button class="nyx-button">Secondary</button><button class="nyx-button" data-variant="quiet">Quiet</button><button class="nyx-button" data-variant="danger">Destructive</button></div>`)}
      ${card("Sizes and states", `<div class="docs-row"><button class="nyx-button" data-size="small">Small</button><button class="nyx-button">Default</button><button class="nyx-button" data-size="large">Large</button><button class="nyx-button" disabled>Disabled</button><button class="nyx-button" data-loading="true"><span class="nyx-spinner"></span>Loading</button></div>`)}
      ${card("Icon controls", `<div class="docs-row"><span class="nyx-tooltip-wrap"><button class="nyx-button nyx-icon-button" aria-label="Add item">${icon("plus")}</button><span class="nyx-tooltip" role="tooltip">Add item</span></span><button class="nyx-button nyx-icon-button" aria-label="Settings">${icon("settings")}</button><button class="nyx-button nyx-icon-button" aria-label="Account">${icon("user")}</button></div>`, "Named")}
    </div>`,
  }),
  page({
    path: paths.components.actions.toggles,
    categoryId: "actions",
    categoryLabel: "Actions",
    title: "Toggle and Toggle Group",
    description: "Pressed buttons express independent choices; native radio controls remain the baseline for exclusive selection.",
    searchTerms: "toggle pressed radio segmented group button selection",
    body: card("Toggle patterns", `<div class="docs-column">${togglesMarkup}</div>`, "Registry source", togglesMarkup),
  }),
];
