import { icon } from "../icons.js";
import { card, section } from "./shared.js";

export const navigationSection = section(
  "navigation",
  "08",
  "Navigation",
  "Navigation patterns use native links and buttons, explicit current states, predictable keyboard behavior, and responsive wrapping.",
  `<div class="docs-stack">
    ${card("Application top bar", `<div class="nyx-topbar"><div class="docs-brand"><span class="docs-mark">N</span><strong>Workspace</strong></div><div class="docs-row"><span class="nyx-badge" data-tone="success"><span class="nyx-status-dot"></span>Operational</span><button class="nyx-button nyx-icon-button" aria-label="Account">${icon("user")}</button></div></div>`)}
    <div class="docs-grid">
      ${card("Breadcrumbs and pagination", `<div class="docs-column"><nav class="nyx-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#navigation">Workspace</a></li><li><a href="#navigation">Library</a></li><li aria-current="page">Record 024</li></ol></nav><nav class="nyx-pagination" aria-label="Pagination"><a class="nyx-page" href="#navigation" aria-label="Previous page"><span class="docs-icon-reverse">${icon("chevron")}</span></a><a class="nyx-page" href="#navigation">1</a><a class="nyx-page" href="#navigation" aria-current="page">2</a><a class="nyx-page" href="#navigation">3</a><a class="nyx-page" href="#navigation" aria-label="Next page">${icon("chevron")}</a></nav></div>`)}
      ${card("Accordion", `<details class="nyx-accordion" open><summary>Parameters</summary><div class="nyx-accordion-body">Expanded settings remain reachable without a custom script.</div></details><details class="nyx-accordion"><summary>Advanced controls</summary><div class="nyx-accordion-body">Secondary controls are progressively disclosed.</div></details>`, "Native")}
    </div>
    ${card("Tabs", `<div data-nyx-tabs><div class="nyx-tabs-list" role="tablist" aria-label="Analysis views"><button class="nyx-tab" id="tab-summary" role="tab" aria-controls="panel-summary" aria-selected="true">Summary</button><button class="nyx-tab" id="tab-events" role="tab" aria-controls="panel-events" aria-selected="false">Events</button><button class="nyx-tab" id="tab-config" role="tab" aria-controls="panel-config" aria-selected="false">Configuration</button></div><div class="nyx-tab-panel" id="panel-summary" role="tabpanel" aria-labelledby="tab-summary">System summary is visible. Use Arrow keys, Home, and End to move between tabs.</div><div class="nyx-tab-panel" id="panel-events" role="tabpanel" aria-labelledby="tab-events" hidden>Event stream selected.</div><div class="nyx-tab-panel" id="panel-config" role="tabpanel" aria-labelledby="tab-config" hidden>Configuration selected.</div></div>`, "Plugin")}
  </div>`,
  "navigation topbar tabs breadcrumbs pagination sidebar account menu mobile accordion",
);
