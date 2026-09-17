import contextMenuMarkup from "../../../../registry/components/context-menu.html?raw";
import dialogMarkup from "../../../../registry/components/dialog.html?raw";
import overlaysMarkup from "../../../../registry/components/overlays.html?raw";
import { paths } from "../routes.js";
import { card, page, selectMarkup } from "./shared.js";

export const overlayPages = [
  page({
    path: paths.components.overlays.tooltip,
    categoryId: "overlays",
    categoryLabel: "Overlays",
    title: "Tooltip",
    description: "Tooltips clarify compact controls without replacing a visible accessible name.",
    searchTerms: "overlay tooltip hover focus label compact control",
    body: card("Tooltip", `<div class="docs-row">${selectMarkup(overlaysMarkup, [".nyx-tooltip-wrap"])}</div>`, "Registry source"),
  }),
  page({
    path: paths.components.overlays.dropdownMenu,
    categoryId: "overlays",
    categoryLabel: "Overlays",
    title: "Dropdown Menu",
    description: "Action menus use the Popover API, explicit menu semantics, roving focus, typeahead, submenus, and focus-safe dismissal.",
    searchTerms: "overlay dropdown menu popover submenu checkbox radio typeahead keyboard",
    plugins: ["dropdown-menu"],
    body: card("Dropdown menu", `<div class="docs-row">${selectMarkup(overlaysMarkup, ["[data-nyx-dropdown-menu-trigger='nyx-action-menu']", "#nyx-action-menu"])}</div>`, "Registry source"),
  }),
  page({
    path: paths.components.overlays.contextMenu,
    categoryId: "overlays",
    categoryLabel: "Overlays",
    title: "Context Menu",
    description: "Context Menu reuses action-menu behavior at pointer or keyboard invocation coordinates.",
    searchTerms: "overlay context menu right click shift f10 keyboard actions",
    plugins: ["context-menu"],
    body: card("Context menu", contextMenuMarkup, "Registry source"),
  }),
  page({
    path: paths.components.overlays.dialog,
    categoryId: "overlays",
    categoryLabel: "Overlays",
    title: "Dialog",
    description: "Modal dialogs use the native dialog element with controlled initial focus, dismissal, focus return, and scroll locking.",
    searchTerms: "overlay modal dialog confirmation focus escape backdrop",
    plugins: ["dialog"],
    body: card("Dialog", `<div class="docs-row">${selectMarkup(dialogMarkup, ["[data-nyx-dialog-trigger='nyx-example-dialog']", "#nyx-example-dialog"])}</div>`, "Registry source"),
  }),
  page({
    path: paths.components.overlays.drawer,
    categoryId: "overlays",
    categoryLabel: "Overlays",
    title: "Drawer",
    description: "Drawer is a spatial Dialog composition and deliberately shares the same controller and accessibility contract.",
    searchTerms: "overlay drawer sheet dialog side panel record details",
    plugins: ["dialog"],
    body: card("Drawer", `<div class="docs-row">${selectMarkup(dialogMarkup, ["[data-nyx-dialog-trigger='nyx-example-drawer']", "#nyx-example-drawer"])}</div>`, "Registry source"),
  }),
];
