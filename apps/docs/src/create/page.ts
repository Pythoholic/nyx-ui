import activityFeedMarkup from "../../../../registry/components/activity-feed.html?raw";
import batchProgressMarkup from "../../../../registry/components/batch-progress-monitor.html?raw";
import calendarMarkup from "../../../../registry/components/calendar.html?raw";
import commandPaletteMarkup from "../../../../registry/components/command-palette.html?raw";
import dataTableMarkup from "../../../../registry/components/data-table.html?raw";
import feedbackMarkup from "../../../../registry/components/feedback.html?raw";
import formsMarkup from "../../../../registry/components/forms.html?raw";
import generationQueueMarkup from "../../../../registry/components/generation-queue.html?raw";
import modelSelectorMarkup from "../../../../registry/components/model-selector.html?raw";
import navigationMarkup from "../../../../registry/components/navigation.html?raw";
import notificationCenterMarkup from "../../../../registry/components/notification-center.html?raw";
import parameterInspectorMarkup from "../../../../registry/components/parameter-inspector.html?raw";
import promptComposerMarkup from "../../../../registry/components/prompt-composer.html?raw";
import visualizationMarkup from "../../../../registry/components/visualization.html?raw";
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

function selectedMarkup(markup: string, selector: string): string {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content.querySelector(selector)?.outerHTML ?? "";
}

function prefixedMarkup(markup: string, prefix: string): string {
  const template = document.createElement("template");
  template.innerHTML = markup;
  const ids = new Map<string, string>();
  template.content.querySelectorAll<HTMLElement>("[id]").forEach((element) => {
    const current = element.id;
    const next = `${prefix}-${current}`;
    ids.set(current, next);
    element.id = next;
  });
  const referenceAttributes = ["for", "aria-controls", "aria-labelledby", "aria-describedby"];
  template.content.querySelectorAll<HTMLElement>("*").forEach((element) => {
    referenceAttributes.forEach((name) => {
      const value = element.getAttribute(name);
      if (!value) return;
      element.setAttribute(name, value.split(" ").map((part) => ids.get(part) ?? part).join(" "));
    });
  });
  return template.innerHTML;
}

function inlineCommandPalette(): string {
  const template = document.createElement("template");
  template.innerHTML = commandPaletteMarkup;
  const dialog = template.content.querySelector("dialog");
  dialog?.querySelector("[data-nyx-dialog-close]")?.remove();
  return dialog ? `<div class="nyx-command-palette create-inline-command">${dialog.innerHTML}</div>` : "";
}

function promptComposerPreview(): string {
  const template = document.createElement("template");
  template.innerHTML = promptComposerMarkup;
  const composer = template.content.querySelector("form");
  const input = composer?.querySelector("textarea");
  if (input) {
    input.removeAttribute("placeholder");
    input.textContent = "Draft a concise release brief for the completed render batch.";
  }
  return composer?.outerHTML ?? "";
}

function tabsPreview(): string {
  const template = document.createElement("template");
  template.innerHTML = selectedMarkup(navigationMarkup, "[data-nyx-tabs]");
  const tabs = template.content.querySelector<HTMLElement>("[data-nyx-tabs]");
  const [summary, events] = Array.from(tabs?.querySelectorAll<HTMLElement>("[role='tabpanel']") ?? []);
  if (summary) {
    summary.innerHTML = `<dl class="create-tab-metrics"><div><dt>Status</dt><dd><span class="nyx-badge" data-tone="success">Ready</span></dd></div><div><dt>Active jobs</dt><dd>3</dd></div><div><dt>Last sync</dt><dd>2 min ago</dd></div></dl>`;
  }
  if (events) {
    events.innerHTML = `<ol class="create-tab-events"><li><time datetime="2026-09-27T14:42:00+09:00">14:42</time><span>Render batch completed</span></li><li><time datetime="2026-09-27T14:36:00+09:00">14:36</time><span>Review link created</span></li></ol>`;
  }
  return tabs?.outerHTML ?? "";
}

function card(title: string, markup: string, prefix: string, span = ""): string {
  return `<article class="create-card ${span}" data-create-card><header><span>${title}</span><span aria-hidden="true">${prefix.padStart(2, "0")}</span></header><div class="create-card-body">${prefixedMarkup(markup, `create-${prefix}`)}</div></article>`;
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

const cards = [
  card("Generation queue", generationQueueMarkup, "01", "create-card-wide"),
  card("Prompt composer", promptComposerPreview(), "02", "create-card-wide"),
  card("Model selector", modelSelectorMarkup, "03"),
  card("Parameter inspector", parameterInspectorMarkup, "04"),
  card("Batch progress", batchProgressMarkup, "05", "create-card-wide"),
  card("Activity feed", activityFeedMarkup, "06", "create-card-wide"),
  card("Advanced data table", dataTableMarkup, "07", "create-card-wide"),
  card("Command palette", inlineCommandPalette(), "08"),
  card("Notification centre", notificationCenterMarkup, "09"),
  card("Tabs", tabsPreview(), "10"),
  card("Calendar", selectedMarkup(calendarMarkup, "[data-nyx-calendar]"), "11"),
  card("Throughput", selectedMarkup(visualizationMarkup, "[data-nyx-example='chart-populated']"), "12", "create-card-wide"),
  card("Toast stack", selectedMarkup(feedbackMarkup, ".nyx-toast-showcase"), "13"),
  card("Project form", selectedMarkup(formsMarkup, "[data-nyx-example='text-fields']"), "14"),
].join("");

export const createPage: DocPage = page({
  path: paths.create,
  categoryLabel: "Create",
  title: "Create your Nyx",
  navigationLabel: "Create",
  description: "Tune real components, then copy the exact theme setup.",
  searchTerms: "create theme builder custom accent palette radius font border shadow motion generator",
  plugins: ["generation-queue", "prompt-composer", "model-selector", "parameter-inspector", "activity-feed", "data-table", "notification-center", "tabs", "calendar", "toast", "dialog", "code-block"],
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
  const panel = root.querySelector<HTMLElement>("#create-control-panel");
  const toggle = root.querySelector<HTMLButtonElement>("[data-create-panel-toggle]");
  if (!form || !canvas || !panel || !toggle) throw new Error("Create controls did not render.");

  let options = decodeCreateOptions(window.location.search);
  let fontLink: HTMLLinkElement | undefined;
  syncForm(form, options);

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

  return () => {
    abortController.abort();
    fontLink?.remove();
  };
}
