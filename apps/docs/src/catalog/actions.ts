import buttonMarkup from "../../../../registry/components/button.html?raw";
import bulkActionToolbarMarkup from "../../../../registry/components/bulk-action-toolbar.html?raw";
import commandBarMarkup from "../../../../registry/components/command-bar.html?raw";
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
  page({
    path: paths.components.actions.commandBar,
    categoryId: "actions",
    categoryLabel: "Actions",
    title: "Command Bar",
    description: "A compact application toolbar groups frequent commands behind native buttons with one roving tab stop and cancelable execution events.",
    searchTerms: "command bar toolbar actions buttons roving focus keyboard shortcuts execute workspace",
    plugins: ["command-bar"],
    body: `<section class="docs-prose-section"><h2>Frequent actions, not menu navigation</h2><p>The command bar is a toolbar of visible native buttons. Arrow keys move within the composite widget, while command execution remains an event boundary the application can veto or handle. Use a menu when commands must remain hidden until disclosure.</p></section>${card("Document commands", commandBarMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.actions.bulkActionToolbar,
    categoryId: "actions",
    categoryLabel: "Actions",
    title: "Bulk-action Toolbar",
    description: "Native item checkboxes drive a contextual toolbar with mixed select-all state, a polite count, focus-safe clearing, and cancelable bulk execution.",
    searchTerms: "bulk action toolbar selection selected rows checkbox mixed select all batch contextual actions",
    plugins: ["bulk-action-toolbar"],
    body: `<section class="docs-prose-section"><h2>Selection is the source of truth</h2><p>The controller owns only selection and action dispatch. Item checkboxes remain ordinary form controls, select all exposes its mixed state, and the contextual toolbar appears only while at least one item is selected. The application performs the actual archive, retry, or delete work after the run event.</p></section>${card("Deployment target actions", bulkActionToolbarMarkup, "Registry source")}`,
  }),
];
