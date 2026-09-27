import { initToasts } from "@nyx-raul/plugins/toast";
import { page, type DocPage } from "../catalog/shared.js";
import { paths } from "../routes.js";
import {
  accentNames,
  borderNames,
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

function card(title: string, eyebrow: string, markup: string, className = ""): string {
  return `<article class="create-card ${className}" data-create-card data-create-card-title="${title}">
    <header class="create-card-header"><span class="nyx-eyebrow">// ${eyebrow}</span><h2>${title}</h2></header>
    <div class="create-card-body">${markup}</div>
  </article>`;
}

function selectControl(name: "accent" | "palette" | "font", values: readonly string[]): string {
  const controlLabel = name === "palette" ? "Base palette" : `${name[0]?.toUpperCase()}${name.slice(1)}`;
  return `<label class="nyx-field create-select"><span class="nyx-label">${controlLabel}</span><select class="nyx-select" data-create-option="${name}" name="${name}">${values.map((value) => `<option value="${value}">${labels[name][value as keyof typeof labels[typeof name]]}</option>`).join("")}</select></label>`;
}

function segmentedControl(name: "radius" | "borders" | "shadows" | "motion", legend: string, values: readonly string[]): string {
  return `<fieldset class="nyx-segmented-fieldset create-segment"><legend class="nyx-label">${legend}</legend><div class="nyx-segmented">${values.map((value) => {
    const id = `create-${name}-${value}`;
    return `<input data-create-option="${name}" id="${id}" name="${name}" type="radio" value="${value}"><label for="${id}">${labels[name][value as keyof typeof labels[typeof name]]}</label>`;
  }).join("")}</div></fieldset>`;
}

const controls = `<form class="create-controls-form" data-create-controls>
  ${selectControl("accent", accentNames)}
  <label class="nyx-field create-custom-color" data-create-custom><span class="nyx-label">Custom accent</span><span class="create-color-row"><input aria-label="Custom accent colour" data-create-option="customColor" name="customColor" type="color"><output data-create-color-value></output></span></label>
  ${selectControl("palette", paletteNames)}
  ${segmentedControl("radius", "Radius", radiusNames)}
  ${selectControl("font", fontNames)}
  ${segmentedControl("borders", "Borders", borderNames)}
  ${segmentedControl("shadows", "Shadows", shadowNames)}
  ${segmentedControl("motion", "Motion", motionNames)}
  <div class="create-control-actions"><button class="nyx-button" data-create-shuffle type="button">Shuffle</button><button class="nyx-button" data-create-reset data-variant="quiet" type="button">Reset</button></div>
</form><div class="create-control-cta"><button class="nyx-button" data-nyx-dialog-trigger="create-code-dialog" data-variant="primary" type="button">Get code</button></div>`;

const installTabs = `<div class="create-code-tabs" data-nyx-tabs>
  <div class="nyx-tabs-list" role="tablist" aria-label="Package manager">
    ${(["pnpm", "npm", "yarn", "bun"] as const).map((manager, index) => `<button class="nyx-tab" id="create-${manager}-tab" role="tab" aria-controls="create-${manager}-panel" aria-selected="${String(index === 0)}" type="button">${manager}</button>`).join("")}
  </div>
  ${(["pnpm", "npm", "yarn", "bun"] as const).map((manager, index) => `<div class="nyx-tab-panel" id="create-${manager}-panel" role="tabpanel" aria-labelledby="create-${manager}-tab"${index === 0 ? "" : " hidden"}><div class="nyx-code-block" data-nyx-code-block><div class="nyx-code-block-toolbar"><span class="nyx-label">Install</span><span class="nyx-code-status" data-nyx-code-status></span><button class="nyx-button" data-nyx-code-copy data-size="small" type="button"><span data-nyx-code-copy-label>Copy</span></button></div><pre class="nyx-code nyx-scrollable-overlay" tabindex="0"><code data-create-install="${manager}" data-nyx-code-source></code></pre></div></div>`).join("")}
</div>`;

const codeDialog = `<dialog aria-labelledby="create-code-title" class="nyx-dialog create-code-dialog" data-nyx-dialog id="create-code-dialog">
  <header class="nyx-dialog-header"><div><h2 class="nyx-dialog-title" id="create-code-title">Get code</h2><p class="nyx-dialog-description">Install the packages, then add the generated theme overrides.</p></div><button aria-label="Close code dialog" class="nyx-button" data-nyx-dialog-close data-size="small" data-variant="quiet" type="button">Close</button></header>
  <div class="nyx-dialog-body">
    <p class="create-code-step">1 / Install packages</p>
    ${installTabs}
    <div class="nyx-code-block create-code-primary" data-nyx-code-block><div class="nyx-code-block-toolbar"><span class="nyx-label">2 / Apply accent preset</span><span class="nyx-code-status" data-nyx-code-status></span><button class="nyx-button" data-nyx-code-copy data-size="small" type="button"><span data-nyx-code-copy-label>Copy</span></button></div><pre class="nyx-code nyx-scrollable-overlay" tabindex="0"><code data-create-html data-nyx-code-source></code></pre></div>
    <div class="nyx-code-block" data-nyx-code-block><div class="nyx-code-block-toolbar"><span class="nyx-label" data-create-css-label>3 / Theme CSS</span><span class="nyx-code-status" data-nyx-code-status></span><button class="nyx-button" data-nyx-code-copy data-size="small" type="button"><span data-nyx-code-copy-label>Copy</span></button></div><pre class="nyx-code nyx-scrollable-overlay" tabindex="0"><code data-create-css data-nyx-code-source></code></pre></div>
    <div class="nyx-code-block" data-create-font-block data-nyx-code-block><div class="nyx-code-block-toolbar"><span class="nyx-label">4 / Font link</span><span class="nyx-code-status" data-nyx-code-status></span><button class="nyx-button" data-nyx-code-copy data-size="small" type="button"><span data-nyx-code-copy-label>Copy</span></button></div><pre class="nyx-code nyx-scrollable-overlay" tabindex="0"><code data-create-font-link data-nyx-code-source></code></pre></div>
  </div>
  <footer class="nyx-dialog-footer"><a class="nyx-link" data-docs-link data-docs-path="/guides/installation" href="/guides/installation">Installation guide</a><button class="nyx-button" data-nyx-dialog-close data-variant="primary" type="button">Done</button></footer>
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
  plugins: ["tabs", "dialog", "code-block"],
  body: `<div class="create-toolbar"><button class="nyx-button create-customize-toggle" data-create-panel-toggle aria-controls="create-control-panel" aria-expanded="false" type="button">Customize</button></div>
  <div class="create-workspace">
    <aside class="create-control-panel" data-mobile-open="false" id="create-control-panel" aria-label="Theme controls"><div class="create-panel-head"><span class="nyx-eyebrow">Theme controls</span><output data-create-summary>Signal · Void</output></div>${controls}</aside>
    <section class="create-canvas" data-create-canvas aria-label="Live component canvas"><div class="create-canvas-grid">${cards}</div></section>
  </div>${codeDialog}`,
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
}

export function initializeCreatePage(root: HTMLElement): () => void {
  const abortController = new AbortController();
  const form = root.querySelector<HTMLFormElement>("[data-create-controls]");
  const canvas = root.querySelector<HTMLElement>("[data-create-canvas]");
  const masonry = root.querySelector<HTMLElement>(".create-canvas-grid");
  const panel = root.querySelector<HTMLElement>("#create-control-panel");
  const toggle = root.querySelector<HTMLButtonElement>("[data-create-panel-toggle]");
  if (!form || !canvas || !masonry || !panel || !toggle) throw new Error("Create controls did not render.");

  let options = decodeCreateOptions(window.location.search);
  let fontLink: HTMLLinkElement | undefined;
  let layoutFrame = 0;
  let layoutWidth = 0;
  syncForm(form, options);

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
    const fontBlock = root.querySelector<HTMLElement>("[data-create-font-block]");
    const cssLabel = root.querySelector<HTMLElement>("[data-create-css-label]");
    if (css) css.textContent = generated.css;
    if (font) font.textContent = generated.fontLink;
    if (html) html.textContent = generated.htmlAttribute;
    if (cssLabel) cssLabel.textContent = generated.css.endsWith(":root {\n}") ? "3 / No CSS overrides needed" : "3 / Theme CSS";
    fontBlock?.toggleAttribute("hidden", !generated.fontLink);
  };

  const apply = (): void => {
    Object.entries(tokensForOptions(options)).forEach(([token, value]) => canvas.style.setProperty(token, value));
    canvas.dataset.accent = options.accent;
    canvas.dataset.palette = options.palette;
    const custom = form.querySelector<HTMLElement>("[data-create-custom]");
    custom?.toggleAttribute("hidden", options.accent !== "custom");
    const colorValue = form.querySelector<HTMLOutputElement>("[data-create-color-value]");
    if (colorValue) colorValue.value = options.customColor.toLocaleUpperCase();
    const summary = root.querySelector<HTMLOutputElement>("[data-create-summary]");
    if (summary) summary.value = `${labels.accent[options.accent]} · ${labels.palette[options.palette]} · ${labels.radius[options.radius]}`;
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
  form.querySelector<HTMLInputElement>('input[type="color"]')?.addEventListener("input", () => {
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
  toast?.notify({ title: "Theme ready", description: "Canvas tokens are synchronized.", tone: "success", duration: 0 });
  toast?.notify({ title: "Queue active", description: "Three render jobs are in progress.", progress: 68, duration: 0 });
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
