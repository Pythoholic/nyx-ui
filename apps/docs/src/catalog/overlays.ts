import { icon } from "../icons.js";
import { card, section } from "./shared.js";

export const overlaysSection = section(
  "overlays",
  "09",
  "Overlays",
  "Tooltips clarify compact controls; native popovers serve lightweight menus; modal dialogs and drawers use one focus-safe controller.",
  `<div class="docs-grid">
    ${card("Tooltip and popover", `<div class="docs-row"><span class="nyx-tooltip-wrap"><button class="nyx-button nyx-icon-button" aria-label="Open settings">${icon("settings")}</button><span class="nyx-tooltip" role="tooltip">Workspace settings</span></span><button class="nyx-button" popovertarget="action-menu">Open menu ${icon("chevron")}</button><div class="nyx-popover" id="action-menu" popover><div class="nyx-menu"><button class="nyx-menu-item">Duplicate <kbd>Ctrl D</kbd></button><button class="nyx-menu-item">Archive <kbd>Ctrl A</kbd></button><button class="nyx-menu-item" style="color:var(--nyx-danger)">Delete</button></div></div></div>`, "Native popover")}
    ${card("Modal and drawer", `<div class="docs-row"><button class="nyx-button" data-variant="primary" data-nyx-dialog-trigger="catalog-dialog">Open dialog</button><button class="nyx-button" data-nyx-dialog-trigger="catalog-drawer">Open drawer</button></div>`)}
  </div>
  <dialog class="nyx-dialog" id="catalog-dialog" data-nyx-dialog aria-labelledby="catalog-dialog-title" aria-describedby="catalog-dialog-description"><header class="nyx-dialog-header"><div><span class="nyx-eyebrow">Confirmation</span><h2 class="nyx-dialog-title" id="catalog-dialog-title">Apply configuration?</h2></div><button class="nyx-button nyx-icon-button" type="button" data-nyx-dialog-close data-variant="quiet" aria-label="Close">${icon("close")}</button></header><div class="nyx-dialog-body"><p class="nyx-dialog-description" id="catalog-dialog-description">The new configuration will become active immediately.</p><label class="nyx-field" for="change-note"><span class="nyx-label">Change note</span><input class="nyx-input" id="change-note" placeholder="Describe this change"/></label></div><footer class="nyx-dialog-footer"><button class="nyx-button" type="button" data-nyx-dialog-close>Cancel</button><button class="nyx-button" type="button" data-variant="primary">Apply</button></footer></dialog>
  <dialog class="nyx-dialog" id="catalog-drawer" data-nyx-dialog data-layout="drawer" aria-labelledby="catalog-drawer-title"><header class="nyx-dialog-header"><h2 class="nyx-dialog-title" id="catalog-drawer-title">Record details</h2><button class="nyx-button nyx-icon-button" type="button" data-nyx-dialog-close data-variant="quiet" aria-label="Close">${icon("close")}</button></header><div class="nyx-dialog-body"><dl class="nyx-description-list"><dt>Status</dt><dd>Operational</dd><dt>Region</dt><dd>Tokyo</dd><dt>Version</dt><dd>0.1.0</dd></dl></div></dialog>`,
  "overlay tooltip popover dropdown menu dialog drawer confirmation focus escape backdrop",
);
