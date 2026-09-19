import contextMenuMarkup from "../../../../registry/components/context-menu.html?raw";
import dialogMarkup from "../../../../registry/components/dialog.html?raw";
import alertDialogMarkup from "../../../../registry/components/alert-dialog.html?raw";
import commandPaletteMarkup from "../../../../registry/components/command-palette.html?raw";
import hoverCardMarkup from "../../../../registry/components/hover-card.html?raw";
import overlaysMarkup from "../../../../registry/components/overlays.html?raw";
import tooltipMarkup from "../../../../registry/components/tooltip.html?raw";
import { paths } from "../routes.js";
import { card, page, selectMarkup } from "./shared.js";

export const overlayPages = [
  page({
    path: paths.components.overlays.tooltip,
    categoryId: "overlays",
    categoryLabel: "Overlays",
    title: "Tooltip",
    description: "Tooltips clarify compact controls without replacing a visible accessible name.",
    searchTerms: "overlay tooltip provider hover focus delay skip label compact control",
    plugins: ["tooltip"],
    body: `<section class="docs-prose-section"><h2>Coordinated intent delays</h2><p>The provider applies an initial delay to avoid accidental activation, a short close grace period, and a skip window that makes adjacent tooltips immediate after one has opened. Tooltips are non-interactive descriptions; use Hover Card when the floating content needs links, buttons, or pointer access.</p></section>${card("Tooltip provider", tooltipMarkup, "Registry source", tooltipMarkup)}`,
  }),
  page({
    path: paths.components.overlays.hoverCard,
    categoryId: "overlays",
    categoryLabel: "Overlays",
    title: "Hover Card",
    description: "Rich supplementary content opens for pointer intent and keyboard focus, remains interactive across the trigger gap, and dismisses with Escape.",
    searchTerms: "overlay hover card preview rich content focus pointer intent delay escape",
    plugins: ["hover-card"],
    body: `<section class="docs-prose-section"><h2>Hover intent without hover-only access</h2><p>A short open delay filters accidental passes. On departure, a geometric corridor spanning the trigger and positioned card preserves the close grace period while the pointer crosses the gap. Focus follows the same open and close contract, and the content deliberately does not use tooltip semantics.</p></section>${card("Operator hover card", hoverCardMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.overlays.dropdownMenu,
    categoryId: "overlays",
    categoryLabel: "Overlays",
    title: "Dropdown Menu",
    description: "Use Dropdown Menu to place related application commands behind one trigger when keeping every action visible would add more noise than clarity.",
    searchTerms: "overlay dropdown menu popover submenu checkbox radio typeahead keyboard",
    plugins: ["dropdown-menu"],
    body: `<section class="docs-prose-section"><h2>Use a menu for compact command sets</h2><p>Keep frequent or high-consequence actions visible when space allows. A dropdown is a better fit for secondary commands that belong together and can be understood from a concise trigger. Use native buttons for actions and links only when an item navigates; the menu roles describe keyboard behavior, not visual styling.</p><p>Nyx coordinates the popover, anchored position, roving focus, typeahead, submenus, dismissal, and focus return. Your application still performs the selected command. Use the cancelable before-events when a controlled workflow must veto opening, closing, or selection.</p></section>${card("Dropdown menu", selectMarkup(overlaysMarkup, ["[data-nyx-dropdown-menu-trigger='nyx-action-menu']", "#nyx-action-menu"]), "Registry source")}`,
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
    body: card("Dialog", selectMarkup(dialogMarkup, ["[data-nyx-dialog-trigger='nyx-example-dialog']", "#nyx-example-dialog"]), "Registry source"),
  }),
  page({
    path: paths.components.overlays.alertDialog,
    categoryId: "overlays",
    categoryLabel: "Overlays",
    title: "Alert Dialog",
    description: "A constrained Dialog composition for destructive confirmation, with alertdialog semantics and initial focus on the safe action.",
    searchTerms: "overlay alert dialog destructive confirmation cancel safe focus escape backdrop",
    plugins: ["dialog"],
    body: `<section class="docs-prose-section"><h2>Composition, not another modal</h2><p>Alert Dialog uses <code>NyxDialog</code> directly. The canonical markup supplies <code>role="alertdialog"</code>, label and description relationships, safe initial focus, and dismissal opt-outs, so a separate class or package export would add no behavior.</p></section>${card("Alert dialog", alertDialogMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.overlays.drawer,
    categoryId: "overlays",
    categoryLabel: "Overlays",
    title: "Drawer",
    description: "Drawer is a spatial Dialog composition and deliberately shares the same controller and accessibility contract.",
    searchTerms: "overlay drawer sheet dialog side panel record details",
    plugins: ["dialog"],
    body: card("Drawer", selectMarkup(dialogMarkup, ["[data-nyx-dialog-trigger='nyx-example-drawer']", "#nyx-example-drawer"]), "Registry source"),
  }),
  page({
    path: paths.components.overlays.commandPalette,
    categoryId: "overlays",
    categoryLabel: "Overlays",
    title: "Command Palette",
    description: "A centred modal palette composes Dialog focus management with filterable, grouped listbox results and active-descendant navigation.",
    searchTerms: "command palette dialog modal search grouped results keyboard shortcut",
    plugins: ["command-palette"],
    body: card("Command palette", commandPaletteMarkup, "Registry source"),
  }),
];
