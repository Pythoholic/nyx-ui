import { initToasts } from "@nyx-raul/plugins/toast";
import { getOrCreateDropdownMenu } from "@nyx-raul/plugins/dropdown-menu";
import { eyebrow as eyebrowLabel, icon, type IconName } from "../icons.js";
import { page, type DocPage } from "../catalog/shared.js";
import { paths } from "../routes.js";
import {
  accentNames,
  borderNames,
  createShareUrl,
  decodeCreateOptions,
  defaultCreateOptions,
  encodeCreateOptions,
  fontDefinitions,
  fontNames,
  generateTheme,
  motionNames,
  paletteNames,
  radiusNames,
  shadowNames,
  tokensForOptions,
  type CreateOptions,
} from "./generate.js";

const labels = {
  accent: { solar: "Solar", signal: "Signal", flux: "Flux", plasma: "Plasma", custom: "Custom" },
  palette: { void: "Void", graphite: "Graphite", slate: "Slate", midnight: "Midnight" },
  radius: { sharp: "Sharp", default: "Default", soft: "Soft", round: "Round" },
  font: { jetbrains: "JetBrains Mono", "ibm-plex": "IBM Plex Mono", space: "Space Mono", "source-code": "Source Code Pro" },
  borders: { hairline: "Hairline", default: "Default" },
  shadows: { flat: "Flat", elevated: "Elevated" },
  motion: { calm: "Calm", default: "Default", snappy: "Snappy" },
} as const;

type PickerName = Exclude<keyof CreateOptions, "customColor">;

const pickerDefinitions = [
  { name: "accent", label: "Accent", values: accentNames },
  { name: "palette", label: "Base palette", values: paletteNames },
  { name: "radius", label: "Radius", values: radiusNames },
  { name: "font", label: "Font", values: fontNames },
  { name: "borders", label: "Borders", values: borderNames },
  { name: "shadows", label: "Shadows", values: shadowNames },
  { name: "motion", label: "Motion", values: motionNames },
] as const;

function optionLabel(name: PickerName, value: string): string {
  return (labels as Record<PickerName, Record<string, string>>)[name][value] ?? value;
}

function previewMarkup(name: PickerName, value: string): string {
  if (name === "font") {
    const family = fontDefinitions[value as keyof typeof fontDefinitions].family;
    return `<span aria-hidden="true" class="create-option-preview" data-create-preview="font" data-preview-value="${value}"><span class="create-preview-font" style='font-family:${family}'>Aa</span></span>`;
  }
  const content = {
    accent: '<i class="create-preview-accent"></i>',
    palette: '<i></i><i></i><i></i>',
    radius: '<i class="create-preview-radius"></i>',
    borders: '<i class="create-preview-border"></i>',
    shadows: '<i class="create-preview-shadow"></i>',
    motion: '<i class="create-preview-motion"><b></b><b></b><b></b></i><span class="create-preview-motion-label"></span>',
  }[name];
  return `<span aria-hidden="true" class="create-option-preview" data-create-preview="${name}" data-preview-value="${value}">${content}</span>`;
}

function pickerControl(definition: (typeof pickerDefinitions)[number]): string {
  const { label, name, values } = definition;
  const initialValue = defaultCreateOptions[name];
  const menuId = `create-picker-${name}`;
  const customColour = name === "accent"
    ? `<label class="create-picker-colour"><span>Custom colour</span><span><input aria-label="Custom accent colour" data-create-option="customColor" name="customColor" type="color" value="${defaultCreateOptions.customColor}"><output data-create-color-value>${defaultCreateOptions.customColor.toLocaleUpperCase()}</output></span></label>`
    : "";
  return `<div class="create-option-row">
    <input data-create-option="${name}" name="${name}" type="hidden" value="${initialValue}">
    <button class="create-option-trigger" data-create-trigger="${name}" data-nyx-dropdown-menu-trigger="${menuId}" type="button">
      <span class="create-option-copy"><span>${label}</span><strong data-create-current-value="${name}">${optionLabel(name, initialValue)}</strong></span>
      <span data-create-current-preview="${name}">${previewMarkup(name, initialValue)}</span><span aria-hidden="true" class="create-option-chevron">&#8964;</span>
    </button>
    <div class="nyx-popover nyx-menu create-option-picker" data-create-picker="${name}" data-nyx-dropdown-menu data-nyx-dropdown-menu-placement="bottom-start" id="${menuId}">
      <span class="nyx-menu-label">${label}</span>
      ${values.map((value) => `<button aria-checked="${String(value === initialValue)}" class="nyx-menu-item create-picker-option" data-create-option-value="${value}" role="menuitemradio" type="button"><span aria-hidden="true" class="nyx-menu-item-indicator">&#10003;</span><span class="create-picker-option-name">${optionLabel(name, value)}</span>${previewMarkup(name, value)}</button>`).join("")}
      ${customColour}
    </div>
  </div>`;
}

function card(title: string, eyebrow: string, markup: string, className = ""): string {
  const icons: Record<string, IconName> = {
    "batch progress": "activity",
    calendar: "calendar",
    "chosen font": "type",
    collaboration: "users",
    "data table": "table",
    "form card": "form",
    "generation controls": "sliders",
    "generation queue": "sparkle",
    "interactive primitives": "sliders",
    "live colour system": "palette",
    "live statistics": "chart",
    "model selector": "cpu",
    "new message": "message",
    "notification centre": "bell",
    "quick actions": "list",
    readiness: "checklist",
    "recent renders": "image",
    "service status": "shield",
    "status messages": "bell",
    "workspace feed": "activity",
  };
  return `<article class="create-card ${className}" data-create-card data-create-card-title="${title}">
    <header class="create-card-header">${eyebrowLabel(eyebrow, icons[eyebrow] ?? "box")}<h2>${title}</h2></header>
    <div class="create-card-body">${markup}</div>
  </article>`;
}

const controls = `<form class="create-controls-form" data-create-controls>
  <div class="create-option-list">${pickerDefinitions.map(pickerControl).join("")}</div>
  <div class="create-control-actions"><button class="nyx-button" data-create-shuffle type="button">Shuffle</button><button class="nyx-button" data-create-reset data-variant="quiet" type="button">Reset</button></div>
</form><div class="create-control-cta"><button class="nyx-button" data-nyx-dialog-trigger="create-code-dialog" data-variant="primary" type="button">Get code</button></div>`;

const installTabs = `<div class="create-code-tabs" data-nyx-tabs>
  <div class="nyx-tabs-list" role="tablist" aria-label="Package manager">
    ${(["pnpm", "npm", "yarn", "bun"] as const).map((manager, index) => `<button class="nyx-tab" id="create-${manager}-tab" role="tab" aria-controls="create-${manager}-panel" aria-selected="${String(index === 0)}" type="button">${manager}</button>`).join("")}
  </div>
  ${(["pnpm", "npm", "yarn", "bun"] as const).map((manager, index) => `<div class="nyx-tab-panel" id="create-${manager}-panel" role="tabpanel" aria-labelledby="create-${manager}-tab"${index === 0 ? "" : " hidden"}>${dialogCodeBlock(`data-create-install="${manager}"`, "Shell")}</div>`).join("")}
</div>`;

function dialogCodeBlock(sourceAttribute: string, label: string): string {
  return `<div class="nyx-code-block" data-nyx-code-block><div class="nyx-code-block-toolbar"><span class="nyx-label">${label}</span><span class="nyx-code-status" data-nyx-code-status></span><button class="nyx-button" data-nyx-code-copy data-size="small" type="button"><span data-nyx-code-copy-label>Copy</span></button></div><pre class="nyx-code nyx-scrollable-overlay" tabindex="0"><code ${sourceAttribute} data-nyx-code-source></code></pre></div>`;
}

function codeStep(number: number, title: string, description: string, content: string, attributes = ""): string {
  return `<section class="create-code-step" ${attributes}><span aria-hidden="true" class="create-code-step-number">${String(number).padStart(2, "0")}</span><div class="create-code-step-content"><h3>${title}</h3><p>${description}</p>${content}</div></section>`;
}

const summaryBadges = pickerDefinitions.map(({ name }) => `<span class="nyx-badge" data-appearance="solid" data-create-summary="${name}" data-tone="neutral">${optionLabel(name, defaultCreateOptions[name])}</span>`).join("");

const codeDialog = `<dialog aria-labelledby="create-code-title" class="nyx-dialog create-code-dialog" data-nyx-dialog id="create-code-dialog">
  <header class="nyx-dialog-header"><div class="create-code-heading"><h2 class="nyx-dialog-title" id="create-code-title">Get code</h2><p class="nyx-dialog-description">Add this setup to your project, then copy only the optional behaviour you need.</p><div class="create-code-summary" aria-label="Selected theme choices">${summaryBadges}</div></div><button aria-label="Close" class="nyx-button nyx-icon-button" data-nyx-dialog-close data-variant="quiet" type="button">${icon("close")}</button></header>
  <div class="nyx-dialog-body">
    ${codeStep(1, "Install packages", "Install the style foundation and optional component behaviour.", installTabs)}
    ${codeStep(2, "Load the font", "Add the selected font weights to your document head; self-hosting the same weights works too.", dialogCodeBlock("data-create-font-link", "Document head"), "data-create-font-block")}
    ${codeStep(3, "Import Nyx in your stylesheet", "Register your application and Nyx source locations, then import the stylesheet.", `${dialogCodeBlock("data-create-stylesheet", "CSS")}<p class="create-code-note">For a plain-CSS build, use <code data-create-plain-css></code>.</p>`)}
    ${codeStep(4, "Set the theme", "Place the generated theme attribute on the document root.", dialogCodeBlock("data-create-html", "HTML"))}
    ${codeStep(5, "Add your overrides", "Place generated token changes after the Nyx import in your stylesheet.", `<p class="create-code-empty" data-create-empty-overrides>Your choices match the defaults, so no overrides are needed.</p><div data-create-overrides-block hidden>${dialogCodeBlock("data-create-css", "CSS")}</div>`)}
    ${codeStep(6, "Add behaviour (optional)", `Initialize only the interactive components you use, retain the controllers, and destroy them with their rendered subtree. <a class="nyx-link" data-docs-link data-docs-path="/guides/behavior" href="/guides/behavior">Behavior guide</a>`, dialogCodeBlock("data-create-behavior", "JavaScript"))}
  </div>
  <footer class="nyx-dialog-footer"><div class="create-code-copy-actions"><span class="create-code-copy-action" data-nyx-code-block><code class="sr-only" data-create-share data-nyx-code-source></code><span class="sr-only" data-nyx-code-status></span><button class="nyx-button" data-nyx-code-copy data-nyx-code-label="Copy share link" type="button"><span data-nyx-code-copy-label>Copy share link</span></button></span><span class="create-code-copy-action" data-nyx-code-block><code class="sr-only" data-create-copy-all data-nyx-code-source></code><span class="sr-only" data-nyx-code-status></span><button class="nyx-button" data-nyx-code-copy data-nyx-code-label="Copy all" type="button"><span data-nyx-code-copy-label>Copy all</span></button></span></div><div class="create-code-footer-end"><a class="nyx-link" data-docs-link data-docs-path="/guides/installation" href="/guides/installation">Installation guide</a><button class="nyx-button" data-nyx-dialog-close data-variant="primary" type="button">Done</button></div></footer>
</dialog>`;

const queueItems = `<ol class="create-job-list">
  <li data-nyx-generation-item data-state="running"><span class="create-job-code">04</span><span><strong>Orbital station</strong><small>1024 × 1024 · high detail</small></span><output>68%</output><progress max="100" value="68">68%</progress></li>
  <li data-nyx-generation-item data-state="queued"><span class="create-job-code">05</span><span><strong>Docking bay</strong><small>1024 × 1024 · balanced</small></span><output>Queued</output><progress max="100" value="0">0%</progress></li>
  <li data-nyx-generation-item data-state="complete"><span class="create-job-code">02</span><span><strong>Transit corridor</strong><small>1024 × 1024 · high detail</small></span><output>Ready</output><progress max="100" value="100">100%</progress></li>
</ol>`;

const cards = [
  card("Type specimen", "chosen font", `<div class="create-type-specimen"><span class="create-choice-label" data-create-font-name>Chosen font</span><strong>Signal through the noise.</strong><p>Operational interfaces stay precise, calm, and readable at every density.</p><div><span>Aa</span><span>0123456789</span></div></div>`, "create-card-type"),
  card("Token swatches", "live colour system", `<div class="create-token-groups"><div><span class="create-choice-label" data-create-accent-name>Signal accent</span><ul class="create-swatches create-swatches-accent"><li style="--create-swatch:var(--nyx-accent)"><i></i><span>accent</span></li><li style="--create-swatch:var(--nyx-accent-hi)"><i></i><span>highlight</span></li><li style="--create-swatch:var(--nyx-accent-soft)"><i></i><span>soft</span></li><li style="--create-swatch:var(--nyx-accent-line)"><i></i><span>line</span></li></ul></div><div><span class="create-choice-label" data-create-palette-name>Void palette</span><ul class="create-swatches create-swatches-base"><li style="--create-swatch:var(--nyx-void)"><i></i><span>void</span></li><li style="--create-swatch:var(--nyx-panel)"><i></i><span>panel</span></li><li style="--create-swatch:var(--nyx-panel-raised)"><i></i><span>raised</span></li><li style="--create-swatch:var(--nyx-input)"><i></i><span>input</span></li><li style="--create-swatch:var(--nyx-line)"><i></i><span>line</span></li><li style="--create-swatch:var(--nyx-ink)"><i></i><span>ink</span></li></ul></div></div>`, "create-card-tokens"),
  card("Controls sampler", "interactive primitives", `<div class="create-control-sampler"><div class="create-button-row"><button class="nyx-button" data-variant="primary" type="button">Primary</button><button class="nyx-button" type="button">Default</button><button class="nyx-button" data-variant="quiet" type="button">Quiet</button></div><div class="create-badge-row"><span class="nyx-badge" data-tone="success">Ready</span><span class="nyx-badge">Draft</span><span class="nyx-badge" data-tone="warning">Review</span></div><label class="nyx-field"><span class="nyx-label">Project name</span><input class="nyx-input" value="night-operations"></label><label class="create-sampler-range"><span>Guidance <output>7</output></span><input class="nyx-range" type="range" min="1" max="10" value="7"></label><div class="create-choice-row"><label class="nyx-switch"><input type="checkbox" checked><span class="nyx-switch-track"></span><span>Enhance</span></label><label><input type="checkbox" checked> Private</label><label><input name="quality" type="radio" checked> Balanced</label></div></div>`, "create-card-controls"),
  card("Render queue", "generation queue", `<div class="create-card-meta"><span>2 active</span><span>3 total</span></div>${queueItems}`, "create-card-queue"),
  card("Model profile", "model selector", `<fieldset class="create-model-options"><legend class="sr-only">Model profile</legend><label><input name="create-model" type="radio"><span><strong>Swift</strong><small>Fast drafts and iteration</small></span><span class="nyx-badge">Low latency</span></label><label data-selected="true"><input name="create-model" type="radio" checked><span><strong>Balanced</strong><small>General generation work</small></span><span class="nyx-badge" data-tone="success">Recommended</span></label><label><input name="create-model" type="radio"><span><strong>Precision</strong><small>Maximum detail and adherence</small></span><span class="nyx-badge">High fidelity</span></label></fieldset>`),
  card("Parameters", "generation controls", `<form class="create-parameter-list"><label class="nyx-field"><span class="nyx-label">Aspect ratio</span><select class="nyx-select"><option>Square · 1:1</option><option>Landscape · 4:3</option></select></label><label class="create-sampler-range"><span>Guidance <output>7</output></span><input class="nyx-range" type="range" min="1" max="20" value="7"></label><label class="nyx-field"><span class="nyx-label">Steps</span><input class="nyx-input" type="number" value="32"></label><label class="nyx-switch"><input type="checkbox" checked><span class="nyx-switch-track"></span><span>Prompt enhancement</span></label></form>`),
  card("Prompt composer", "new message", `<form class="create-prompt"><label class="sr-only" for="create-prompt-input">Prompt</label><textarea class="nyx-textarea" id="create-prompt-input" rows="5">Draft a concise release brief for the completed render batch.</textarea><footer><span>61 / 2000</span><button class="nyx-button" data-variant="primary" type="button">Send prompt</button></footer></form>`, "create-card-prompt"),
  card("Campaign deliverables", "batch progress", `<div class="create-batch-list"><div><span><strong>Social square set</strong><small>12 files · optimized</small></span><output>72%</output><progress max="100" value="72">72%</progress></div><div><span><strong>Wide header set</strong><small>6 files · queued</small></span><output>Queued</output><progress max="100" value="0">0%</progress></div><div><span><strong>Source archive</strong><small>18 files · verified</small></span><output>Ready</output><progress max="100" value="100">100%</progress></div></div>`),
  card("Activity", "workspace feed", `<ol class="create-activity-list"><li><span class="nyx-avatar">AK</span><p><strong>Akira K.</strong> added release notes to <a class="nyx-link" href="#release-024">release 024</a>.<time>10 min ago</time></p></li><li><span class="nyx-avatar">SM</span><p><strong>Sora M.</strong> attached five campaign images.<time>54 min ago</time></p></li><li><span class="create-activity-mark">✓</span><p>Validation completed with no failures.<time>2 hr ago</time></p></li></ol>`),
  card("Notifications", "notification centre", `<div class="create-card-meta"><span>2 unread</span><button class="nyx-button" data-size="small" type="button">Mark read</button></div><ul class="create-notification-list"><li data-state="unread"><i></i><span><strong>Release ready</strong><small>Version 0.2 passed validation and is ready for review.</small><time>2 min ago</time></span></li><li data-state="unread"><i></i><span><strong>Policy update</strong><small>Two deployment rules now require owner approval.</small><time>1 hr ago</time></span></li></ul>`),
  card("Command palette", "quick actions", `<div class="create-command"><input class="nyx-input" aria-label="Command" placeholder="Type a command"><span class="create-command-group">Navigation</span><button type="button"><span>Open overview</span><kbd class="nyx-kbd">G O</kbd></button><button type="button"><span>Browse components</span><kbd class="nyx-kbd">G C</kbd></button><span class="create-command-group">Actions</span><button type="button"><span>Cycle accent theme</span><kbd class="nyx-kbd">T</kbd></button></div>`),
  card("September 2026", "calendar", `<div class="create-calendar"><div class="create-calendar-nav"><button class="nyx-button" data-size="small" aria-label="Previous month" type="button">←</button><strong>September</strong><button class="nyx-button" data-size="small" aria-label="Next month" type="button">→</button></div><div class="create-calendar-grid" aria-label="September 2026"><b>Su</b><b>Mo</b><b>Tu</b><b>We</b><b>Th</b><b>Fr</b><b>Sa</b>${Array.from({ length: 35 }, (_, index) => { const day = index - 1; return day > 0 && day < 31 ? `<button type="button"${day === 18 ? ' aria-current="date"' : ""}>${day}</button>` : "<span></span>"; }).join("")}</div></div>`),
  card("Deployment jobs", "data table", `<div class="create-table-tools"><input class="nyx-input" type="search" placeholder="Filter jobs"><span>3 records</span></div><div class="create-table-wrap"><table><thead><tr><th>Job</th><th>Status</th><th>Owner</th></tr></thead><tbody><tr><td>render-024</td><td><span class="nyx-badge" data-tone="success">Complete</span></td><td>Aiko</td></tr><tr><td>render-025</td><td><span class="nyx-badge">Running</span></td><td>Noah</td></tr><tr><td>render-026</td><td><span class="nyx-badge">Queued</span></td><td>Mina</td></tr></tbody></table></div>`),
  card("Toast stack", "status messages", `<div class="create-toast-region nyx-toast-region" data-layout="inline" data-nyx-toast-region></div>`, "create-card-toasts"),
  card("Throughput", "live statistics", `<div class="create-stat-lead"><span>Requests today</span><strong>24,891</strong><span class="nyx-badge" data-tone="success">+12.4%</span></div><div class="create-bars" aria-label="Hourly throughput"><i style="--bar:34%"></i><i style="--bar:58%"></i><i style="--bar:46%"></i><i style="--bar:82%"></i><i style="--bar:67%"></i><i style="--bar:91%"></i><i style="--bar:74%"></i><i style="--bar:88%"></i></div><dl class="create-stat-grid"><div><dt>Latency</dt><dd>48 ms</dd></div><div><dt>Success</dt><dd>99.98%</dd></div></dl>`),
  card("Project details", "form card", `<form class="create-project-form"><label class="nyx-field"><span class="nyx-label">Project name</span><input class="nyx-input" value="night-operations"></label><label class="nyx-field"><span class="nyx-label">Region</span><select class="nyx-select"><option>Tokyo</option><option>Singapore</option></select></label><label class="nyx-field"><span class="nyx-label">Description</span><textarea class="nyx-textarea" rows="3">Reusable operational interface components.</textarea></label><button class="nyx-button" data-variant="primary" type="button">Save project</button></form>`),
  card("System health", "service status", `<ul class="create-health-list"><li><span><i data-tone="success"></i><strong>Render service</strong></span><span>Operational</span></li><li><span><i data-tone="success"></i><strong>Asset storage</strong></span><span>Operational</span></li><li><span><i data-tone="warning"></i><strong>Review links</strong></span><span>Elevated latency</span></li></ul><div class="create-health-note"><span>Last 30 days</span><strong>99.97% uptime</strong></div>`),
  card("Release checklist", "readiness", `<div class="create-checklist-summary"><strong>7 of 8 complete</strong><progress max="8" value="7">7 of 8</progress></div><ul class="create-checklist"><li><input type="checkbox" checked><span>Visual review approved</span></li><li><input type="checkbox" checked><span>Accessibility checks passed</span></li><li><input type="checkbox" checked><span>Release notes drafted</span></li><li><input type="checkbox"><span>Owner sign-off</span></li></ul>`),
  card("Team access", "collaboration", `<div class="create-team-list"><div><span class="nyx-avatar">AK</span><span><strong>Akira K.</strong><small>Owner</small></span><span class="nyx-badge">Full access</span></div><div><span class="nyx-avatar">SM</span><span><strong>Sora M.</strong><small>Design</small></span><span class="nyx-badge">Editor</span></div><div><span class="nyx-avatar">YN</span><span><strong>Yui N.</strong><small>Engineering</small></span><span class="nyx-badge">Editor</span></div></div><button class="nyx-button" type="button">Invite member</button>`),
  card("Asset library", "recent renders", `<div class="create-asset-grid"><button type="button"><span>ORBITAL</span><small>Station study</small></button><button type="button"><span>HABITAT</span><small>Ring detail</small></button><button type="button"><span>TRANSIT</span><small>Night corridor</small></button><button type="button"><span>DOCK 04</span><small>Bay lighting</small></button></div><footer><span>24 assets</span><button class="nyx-button" data-size="small" type="button">Browse all</button></footer>`),
].join("");

export const createPage: DocPage = page({
  path: paths.create,
  categoryLabel: "Create",
  title: "Create your Nyx",
  navigationLabel: "Create",
  description: "Tune real components, then copy the exact theme setup.",
  searchTerms: "create theme builder custom accent palette radius font border shadow motion generator",
  plugins: ["tabs", "dialog", "code-block", "dropdown-menu"],
  body: `<div class="create-toolbar"><button class="nyx-button create-customize-toggle" data-create-panel-toggle aria-controls="create-control-panel" aria-expanded="false" type="button">Customize</button></div>
  <div data-create-scope><div class="create-workspace">
    <aside class="create-control-panel" data-mobile-open="false" id="create-control-panel" aria-label="Customize theme">${controls}</aside>
    <section class="create-canvas" data-create-canvas aria-label="Live component canvas"><div class="create-canvas-grid">${cards}</div></section>
  </div>${codeDialog}</div>`,
});

function optionFromForm(form: HTMLFormElement): CreateOptions {
  const data = new FormData(form);
  return decodeCreateOptions(new URLSearchParams([
    ["accent", String(data.get("accent") ?? defaultCreateOptions.accent)],
    ["palette", String(data.get("palette") ?? defaultCreateOptions.palette)],
    ["radius", String(data.get("radius") ?? defaultCreateOptions.radius)],
    ["font", String(data.get("font") ?? defaultCreateOptions.font)],
    ["borders", String(data.get("borders") ?? defaultCreateOptions.borders)],
    ["shadows", String(data.get("shadows") ?? defaultCreateOptions.shadows)],
    ["motion", String(data.get("motion") ?? defaultCreateOptions.motion)],
    ["custom", String(data.get("customColor") ?? defaultCreateOptions.customColor)],
  ]));
}

function syncForm(form: HTMLFormElement, options: CreateOptions): void {
  Object.entries(options).forEach(([name, value]) => {
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[data-create-option="${name}"]`).forEach((control) => {
      if (control instanceof HTMLInputElement && control.type === "radio") control.checked = control.value === value;
      else control.value = value;
    });
  });
  pickerDefinitions.forEach(({ name }) => {
    const value = options[name];
    const currentValue = form.querySelector<HTMLElement>(`[data-create-current-value="${name}"]`);
    const currentPreview = form.querySelector<HTMLElement>(`[data-create-current-preview="${name}"]`);
    if (currentValue) currentValue.textContent = optionLabel(name, value);
    if (currentPreview) currentPreview.innerHTML = previewMarkup(name, value);
    form.querySelectorAll<HTMLElement>(`[data-create-picker="${name}"] [data-create-option-value]`).forEach((item) => {
      const checked = item.dataset.createOptionValue === value;
      item.setAttribute("aria-checked", String(checked));
      item.dataset.state = checked ? "checked" : "unchecked";
    });
  });
}

export function initializeCreatePage(root: HTMLElement): () => void {
  const abortController = new AbortController();
  const form = root.querySelector<HTMLFormElement>("[data-create-controls]");
  const canvas = root.querySelector<HTMLElement>("[data-create-canvas]");
  const scope = root.querySelector<HTMLElement>("[data-create-scope]");
  const masonry = root.querySelector<HTMLElement>(".create-canvas-grid");
  const panel = root.querySelector<HTMLElement>("#create-control-panel");
  const toggle = root.querySelector<HTMLButtonElement>("[data-create-panel-toggle]");
  if (!form || !canvas || !scope || !masonry || !panel || !toggle) throw new Error("Create controls did not render.");

  let options = decodeCreateOptions(window.location.search);
  let fontLink: HTMLLinkElement | undefined;
  let layoutFrame = 0;
  let layoutWidth = 0;
  syncForm(form, options);

  const pickerMenus = Array.from(form.querySelectorAll<HTMLElement>("[data-create-picker]")).map((element) => ({
    instance: getOrCreateDropdownMenu(element, root),
    trigger: form.querySelector<HTMLElement>(`[data-nyx-dropdown-menu-trigger="${element.id}"]`),
  }));
  const positionPickers = (): void => {
    const placement = window.matchMedia("(max-width: 62rem)").matches ? "bottom-start" : "right-start";
    pickerMenus.forEach(({ instance, trigger }) => {
      if (trigger) instance.setPositioning(trigger, placement);
    });
  };
  positionPickers();
  window.addEventListener("resize", positionPickers, { signal: abortController.signal });

  const masonryCards = Array.from(masonry.querySelectorAll<HTMLElement>("[data-create-card]"));
  const layoutMasonry = (): void => {
    const width = masonry.clientWidth;
    if (!width) return;
    const gap = Number.parseFloat(getComputedStyle(masonry).columnGap) || 20;
    const columnCount = Math.max(1, Math.min(7, Math.floor((width + gap) / (288 + gap))));
    const columns = Array.from({ length: columnCount }, (_, index) => {
      const column = document.createElement("div");
      column.className = "create-masonry-column";
      column.dataset.createColumn = String(index + 1);
      return column;
    });
    masonry.style.setProperty("--create-column-count", String(columnCount));
    masonry.replaceChildren(...columns);
    masonryCards.forEach((cardElement) => {
      const shortest = columns.reduce((current, candidate) => candidate.getBoundingClientRect().height < current.getBoundingClientRect().height ? candidate : current);
      shortest.append(cardElement);
    });
    masonry.dataset.createColumns = String(columnCount);
  };
  layoutMasonry();
  const resizeObserver = new ResizeObserver(([entry]) => {
    const nextWidth = Math.round(entry?.contentRect.width ?? masonry.clientWidth);
    if (nextWidth === layoutWidth) return;
    layoutWidth = nextWidth;
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(layoutMasonry);
  });
  resizeObserver.observe(masonry);

  const updateOutputs = (): void => {
    const generated = generateTheme(options);
    root.querySelectorAll<HTMLElement>("[data-create-install]").forEach((element) => {
      const manager = element.dataset.createInstall as keyof typeof generated.installCommands;
      element.textContent = generated.installCommands[manager];
    });
    const css = root.querySelector<HTMLElement>("[data-create-css]");
    const font = root.querySelector<HTMLElement>("[data-create-font-link]");
    const html = root.querySelector<HTMLElement>("[data-create-html]");
    const stylesheet = root.querySelector<HTMLElement>("[data-create-stylesheet]");
    const plainCss = root.querySelector<HTMLElement>("[data-create-plain-css]");
    const behavior = root.querySelector<HTMLElement>("[data-create-behavior]");
    const copyAll = root.querySelector<HTMLElement>("[data-create-copy-all]");
    const share = root.querySelector<HTMLElement>("[data-create-share]");
    const overridesBlock = root.querySelector<HTMLElement>("[data-create-overrides-block]");
    const emptyOverrides = root.querySelector<HTMLElement>("[data-create-empty-overrides]");
    if (css) css.textContent = generated.css;
    if (font) font.textContent = generated.fontLink;
    if (html) html.textContent = generated.htmlAttribute;
    if (stylesheet) stylesheet.textContent = generated.stylesheetEntry;
    if (plainCss) plainCss.textContent = generated.plainCssEntry;
    if (behavior) behavior.textContent = generated.behavior;
    if (copyAll) copyAll.textContent = generated.copyAll;
    if (share) share.textContent = createShareUrl(window.location.href, options);
    if (emptyOverrides) emptyOverrides.textContent = generated.emptyOverridesMessage;
    overridesBlock?.toggleAttribute("hidden", !generated.hasOverrides);
    emptyOverrides?.toggleAttribute("hidden", generated.hasOverrides);
    pickerDefinitions.forEach(({ name }) => {
      const summary = root.querySelector<HTMLElement>(`[data-create-summary="${name}"]`);
      if (summary) summary.textContent = optionLabel(name, options[name]);
    });
  };

  const apply = (): void => {
    Object.entries(tokensForOptions(options)).forEach(([token, value]) => scope.style.setProperty(token, value));
    scope.style.setProperty("--create-custom-color", options.customColor);
    scope.dataset.accent = options.accent;
    scope.dataset.palette = options.palette;
    canvas.dataset.accent = options.accent;
    canvas.dataset.palette = options.palette;
    const colorValue = form.querySelector<HTMLOutputElement>("[data-create-color-value]");
    if (colorValue) colorValue.value = options.customColor.toLocaleUpperCase();
    syncForm(form, options);
    const fontName = root.querySelector<HTMLElement>("[data-create-font-name]");
    const accentName = root.querySelector<HTMLElement>("[data-create-accent-name]");
    const paletteName = root.querySelector<HTMLElement>("[data-create-palette-name]");
    if (fontName) fontName.textContent = labels.font[options.font];
    if (accentName) accentName.textContent = `${labels.accent[options.accent]} accent`;
    if (paletteName) paletteName.textContent = `${labels.palette[options.palette]} palette`;
    fontLink?.remove();
    fontLink = undefined;
    const href = fontDefinitions[options.font].href;
    if (href) {
      fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.href = href;
      fontLink.dataset.createFont = options.font;
      document.head.append(fontLink);
    }
    updateOutputs();
  };

  const writeUrl = (replace = false): void => {
    const next = `${window.location.pathname}?${encodeCreateOptions(options)}`;
    if (replace) history.replaceState(null, "", next);
    else history.pushState(null, "", next);
  };

  form.addEventListener("change", (event) => {
    options = optionFromForm(form);
    apply();
    if (event.target instanceof HTMLInputElement && event.target.type === "color") writeUrl(true);
    else writeUrl();
  }, { signal: abortController.signal });
  form.querySelectorAll<HTMLElement>("[data-create-picker]").forEach((picker) => {
    picker.addEventListener("nyx:dropdown-menu:select", (event) => {
      const item = (event as CustomEvent<{ item?: HTMLElement }>).detail.item;
      const name = picker.dataset.createPicker as PickerName | undefined;
      const value = item?.dataset.createOptionValue;
      const input = name ? form.querySelector<HTMLInputElement>(`input[name="${name}"]`) : null;
      if (!name || !value || !input) return;
      input.value = value;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, { signal: abortController.signal });
  });
  form.querySelector<HTMLInputElement>('input[type="color"]')?.addEventListener("input", () => {
    const accent = form.querySelector<HTMLInputElement>('input[name="accent"]');
    if (accent) accent.value = "custom";
    options = optionFromForm(form);
    apply();
    writeUrl(true);
  }, { signal: abortController.signal });
  form.querySelector<HTMLButtonElement>("[data-create-shuffle]")?.addEventListener("click", () => {
    const pick = <T,>(values: readonly T[]): T => values[Math.floor(Math.random() * values.length)]!;
    options = {
      accent: pick(accentNames), palette: pick(paletteNames), radius: pick(radiusNames), font: pick(fontNames),
      borders: pick(borderNames), shadows: pick(shadowNames), motion: pick(motionNames),
      customColor: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`,
    };
    syncForm(form, options);
    apply();
    writeUrl();
  }, { signal: abortController.signal });
  form.querySelector<HTMLButtonElement>("[data-create-reset]")?.addEventListener("click", () => {
    options = { ...defaultCreateOptions };
    syncForm(form, options);
    apply();
    history.pushState(null, "", window.location.pathname);
  }, { signal: abortController.signal });
  toggle.addEventListener("click", () => {
    const open = panel.dataset.mobileOpen !== "true";
    panel.dataset.mobileOpen = String(open);
    toggle.setAttribute("aria-expanded", String(open));
  }, { signal: abortController.signal });

  apply();
  const toast = initToasts(root.querySelector<HTMLElement>("[data-nyx-toast-region]") ?? root)[0];
  toast?.notify({ title: "Theme ready", description: "Canvas synced.", tone: "success", duration: 0 });
  toast?.notify({ title: "Queue active", description: "Three jobs rendering.", progress: 68, duration: 0 });
  layoutFrame = requestAnimationFrame(layoutMasonry);
  void document.fonts.ready.then(() => {
    layoutMasonry();
  });

  return () => {
    abortController.abort();
    resizeObserver.disconnect();
    cancelAnimationFrame(layoutFrame);
    fontLink?.remove();
  };
}
