import { initComboboxes } from "@nyx-raul/plugins/combobox";
import { initCarousels } from "@nyx-raul/plugins/carousel";
import { initImageLightboxes } from "@nyx-raul/plugins/image-lightbox";
import { initMediaCarousels } from "@nyx-raul/plugins/media-carousel";
import { initUploadDropzones } from "@nyx-raul/plugins/upload-dropzone";
import { initBatchProgressMonitors } from "@nyx-raul/plugins/batch-progress-monitor";
import { initCalendars } from "@nyx-raul/plugins/calendar";
import { initCommandPalettes, type NyxCommandPalette, type NyxCommandPaletteEventDetail } from "@nyx-raul/plugins/command-palette";
import { initContextMenus } from "@nyx-raul/plugins/context-menu";
import { initDialogs } from "@nyx-raul/plugins/dialog";
import { initDataTables } from "@nyx-raul/plugins/data-table";
import { initDatePickers } from "@nyx-raul/plugins/date-picker";
import { initDropdownMenus } from "@nyx-raul/plugins/dropdown-menu";
import { initFileUploads, type NyxFileUploadAdapter } from "@nyx-raul/plugins/file-upload";
import { initInputOtps } from "@nyx-raul/plugins/input-otp";
import { initMultiSelects } from "@nyx-raul/plugins/multi-select";
import { initNumberInputs } from "@nyx-raul/plugins/number-input";
import { initPasswordInputs } from "@nyx-raul/plugins/password-input";
import { initPromptComposers } from "@nyx-raul/plugins/prompt-composer";
import { initMessageScrollers } from "@nyx-raul/plugins/message-scroller";
import { initAttachmentPreviews } from "@nyx-raul/plugins/attachment-previews";
import { initGenerationQueues } from "@nyx-raul/plugins/generation-queue";
import { initModelSelectors } from "@nyx-raul/plugins/model-selector";
import { initParameterInspectors } from "@nyx-raul/plugins/parameter-inspector";
import { initBeforeAfters } from "@nyx-raul/plugins/before-after";
import { initCodeBlocks } from "@nyx-raul/plugins/code-block";
import { initSearchBoxes } from "@nyx-raul/plugins/search-box";
import { initMenubars } from "@nyx-raul/plugins/menubar";
import { initNavigationMenus } from "@nyx-raul/plugins/navigation-menu";
import { initHoverCards } from "@nyx-raul/plugins/hover-card";
import { initTooltips } from "@nyx-raul/plugins/tooltip";
import { initResizablePanels } from "@nyx-raul/plugins/resizable-panels";
import { initScrollAreas } from "@nyx-raul/plugins/scroll-area";
import { initTreeViews } from "@nyx-raul/plugins/tree-view";
import { initSidebars } from "@nyx-raul/plugins/sidebar";
import { initSteppers } from "@nyx-raul/plugins/stepper";
import { initNotificationCenters } from "@nyx-raul/plugins/notification-center";
import { initActivityFeeds } from "@nyx-raul/plugins/activity-feed";
import { initFilterBars } from "@nyx-raul/plugins/filter-bar";
import { initCommandBars } from "@nyx-raul/plugins/command-bar";
import { initBulkActionToolbars } from "@nyx-raul/plugins/bulk-action-toolbar";
import { initTabs } from "@nyx-raul/plugins/tabs";
import { initToasts, type NyxToast, type NyxToastOptions } from "@nyx-raul/plugins/toast";
import {
  componentCategories,
  foundationPages,
  guidePages,
  overviewPage,
  pages,
  type DocPage,
} from "./catalog/index.js";
import { renderPage, type PluginName } from "./catalog/shared.js";
import { icon } from "./icons.js";
import { consolidatedRoutes, legacyHashRedirects } from "./routes.js";
import "./styles.css";
import "../../../registry/examples/render-workspace/app.css";
import { mountWorkspace } from "../../../registry/examples/render-workspace/app.js";

interface Destroyable {
  destroy(): void;
}

const docsThemes = ["solar", "signal", "flux", "plasma"] as const;
type DocsTheme = (typeof docsThemes)[number];
const themeStorageKey = "nyx-docs-theme";

function isDocsTheme(value: string | null | undefined): value is DocsTheme {
  return docsThemes.includes(value as DocsTheme);
}

function storedTheme(): DocsTheme | undefined {
  try {
    const value = localStorage.getItem(themeStorageKey);
    return isDocsTheme(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

const initialTheme = storedTheme() ?? (isDocsTheme(document.documentElement.dataset.nyxTheme)
  ? document.documentElement.dataset.nyxTheme
  : "signal");
document.documentElement.dataset.nyxTheme = initialTheme;

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Nyx documentation root was not found.");

document.documentElement.classList.add("nyx-scrollable-overlay");
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

const basePath = import.meta.env.BASE_URL === "/"
  ? ""
  : `/${import.meta.env.BASE_URL.replace(/^\/+|\/+$/g, "")}`;
const pageByPath = new Map(pages.map((page) => [page.path, page]));

function normalizePath(pathname: string): string {
  const withoutBase = basePath && pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;
  const normalized = `/${withoutBase.replace(/^\/+|\/+$/g, "")}`;
  return normalized === "/" ? normalized : normalized.replace(/\/$/, "");
}

function hrefFor(path: string): string {
  return path === "/" ? `${basePath}/` : `${basePath}${path}`;
}

function pageLink(page: DocPage, nested = false): string {
  return `<a${nested ? ' class="docs-nav-child"' : ""} data-docs-link data-docs-path="${page.path}" href="${hrefFor(page.path)}"><span>${page.navigationLabel ?? page.title}</span></a>`;
}

function categoryMarkup(category: (typeof componentCategories)[number]): string {
  const controlsId = `docs-nav-${category.id}`;
  return `<section class="docs-nav-category" data-nav-category="${category.id}">
    <h3><button class="docs-nav-parent" type="button" aria-expanded="false" aria-controls="${controlsId}"><span>${category.label}</span>${icon("chevron")}</button></h3>
    <ul id="${controlsId}" hidden>${category.pages.map((page) => `<li>${pageLink(page, true)}</li>`).join("")}</ul>
  </section>`;
}

const sidebarMarkup = `<nav class="docs-navigation" aria-label="Documentation">
  <div class="docs-nav-group"><span class="docs-nav-label">Templates</span><div class="docs-nav"><a href="${hrefFor('/admin/')}" data-admin-demo>Admin dashboard ↗</a></div></div>
  <div class="docs-nav-group"><span class="docs-nav-label">Start</span><div class="docs-nav">${pageLink(overviewPage)}</div></div>
  <div class="docs-nav-group"><span class="docs-nav-label">Getting started</span><div class="docs-nav">${guidePages.filter(page => page.categoryLabel === "Getting started").map((page) => pageLink(page)).join("")}</div></div>
  <div class="docs-nav-group"><span class="docs-nav-label">Integration</span><div class="docs-nav">${guidePages.filter(page => page.categoryLabel === "Integration").map((page) => pageLink(page)).join("")}</div></div>
  <div class="docs-nav-group"><span class="docs-nav-label">Foundations</span><div class="docs-nav">${foundationPages.map((page) => pageLink(page)).join("")}</div></div>
  <div class="docs-nav-group"><span class="docs-nav-label">Components</span><div class="docs-nav-categories">${componentCategories.map(categoryMarkup).join("")}</div></div>
</nav>`;

function attribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

const searchGroupMap = new Map<string, DocPage[]>();
pages.forEach((page) => searchGroupMap.set(page.categoryLabel, [...(searchGroupMap.get(page.categoryLabel) ?? []), page]));
const searchGroups = Array.from(searchGroupMap);
const searchPaletteMarkup = `<dialog aria-label="Search documentation" class="nyx-dialog nyx-command-palette docs-command-palette" data-nyx-command-palette id="docs-command-palette">
  <div class="nyx-command-search"><label class="sr-only" for="docs-command-query">Search documentation</label>${icon("search")}<input autocomplete="off" class="nyx-input" id="docs-command-query" placeholder="Search documentation" role="combobox" type="search"/><button aria-label="Close search" class="nyx-button" data-nyx-dialog-close data-size="small" data-variant="quiet" type="button">Esc</button></div>
  <div aria-label="Documentation pages" class="nyx-command-results nyx-scrollable-overlay" id="docs-command-results" role="listbox">${searchGroups.map(([label, group], groupIndex) => `<div aria-labelledby="docs-command-group-${groupIndex}" class="nyx-command-group" role="group"><div class="nyx-command-group-label" id="docs-command-group-${groupIndex}">${label}</div>${group.map((page, pageIndex) => `<div class="nyx-command docs-command-result" data-nyx-search-text="${attribute(`${page.title} ${page.categoryLabel} ${page.searchTerms} ${page.description}`)}" data-value="${page.path}" id="docs-command-${groupIndex}-${pageIndex}" role="option"><span>${page.title}</span><small>${page.categoryLabel}</small></div>`).join("")}</div>`).join("")}<p class="nyx-listbox-empty" data-nyx-command-palette-empty hidden>No matching documentation page.</p></div>
</dialog>`;

app.innerHTML = `<div class="docs-shell">
  <header class="docs-topbar">
    <a class="docs-brand" data-docs-link data-docs-path="/" href="${hrefFor("/")}" aria-label="Nyx UI documentation overview"><span class="docs-mark" aria-hidden="true">N</span><span><span class="docs-brand-name">Nyx UI</span><span class="docs-version">System catalog · 0.2.0-beta.3</span></span></a>
    <button class="docs-search-trigger" data-nyx-dialog-trigger="docs-command-palette" type="button">${icon("search")}<span>Search documentation</span><span class="nyx-kbd-chord" aria-hidden="true"><kbd class="nyx-kbd">Ctrl</kbd><kbd class="nyx-kbd">K</kbd></span></button>
    <div class="docs-theme-list" aria-label="Accent theme" role="group">${docsThemes.map((theme) => `<button class="nyx-button docs-theme-button" data-size="small" data-theme-value="${theme}" aria-pressed="${String(theme === initialTheme)}">${theme[0]?.toUpperCase()}${theme.slice(1)}</button>`).join("")}</div>
  </header>
  <div class="docs-layout">
    <aside class="docs-sidebar nyx-scrollable-overlay">${sidebarMarkup}</aside>
    <main class="docs-main" id="docs-main" tabindex="-1"></main>
  </div>
</div>${searchPaletteMarkup}`;

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Nyx documentation shell is missing ${selector}.`);
  return element;
}

const main = requiredElement<HTMLElement>(app, "#docs-main");
const sidebar = requiredElement<HTMLElement>(app, ".docs-sidebar");
const searchPaletteElement = requiredElement<HTMLDialogElement>(app, "#docs-command-palette");
const searchPalette: NyxCommandPalette = initCommandPalettes(app)[0] ?? (() => { throw new Error("Documentation search failed to initialize."); })();

let destroyCurrentPage: (() => void) | undefined;

function setCategoryExpanded(button: HTMLButtonElement, expanded: boolean): void {
  button.setAttribute("aria-expanded", String(expanded));
  const controls = button.getAttribute("aria-controls");
  const list = controls ? document.getElementById(controls) : null;
  list?.toggleAttribute("hidden", !expanded);
}

sidebar.querySelectorAll<HTMLButtonElement>(".docs-nav-parent").forEach((button) => {
  button.addEventListener("click", () => {
    setCategoryExpanded(button, button.getAttribute("aria-expanded") !== "true");
  });
});

app.querySelectorAll<HTMLButtonElement>("[data-theme-value]").forEach((button) => {
  button.addEventListener("click", () => {
    const theme = button.dataset.themeValue;
    if (!isDocsTheme(theme)) return;
    document.documentElement.dataset.nyxTheme = theme;
    try { localStorage.setItem(themeStorageKey, theme); } catch { /* Theme still applies for this page. */ }
    app.querySelectorAll<HTMLButtonElement>("[data-theme-value]").forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === button));
    });
  });
});

function updateNavigation(page: DocPage | undefined): void {
  sidebar.querySelectorAll<HTMLAnchorElement>("[data-docs-path]").forEach((link) => {
    if (page && link.dataset.docsPath === page.path) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (!page?.categoryId) return;
  const category = sidebar.querySelector<HTMLElement>(`[data-nav-category="${page.categoryId}"]`);
  const button = category?.querySelector<HTMLButtonElement>(".docs-nav-parent");
  if (button) setCategoryExpanded(button, true);
}

function addDestroyables(target: Destroyable[], values: Destroyable[]): void {
  values.forEach((value) => {
    if (!target.includes(value)) target.push(value);
  });
}

const demoUpload: NyxFileUploadAdapter = (file, { reportProgress, signal }) => new Promise((resolve, reject) => {
  let progress = 0;
  const timer = window.setInterval(() => {
    progress = Math.min(100, progress + 10);
    reportProgress(progress);
    if (progress === 100) {
      window.clearInterval(timer);
      resolve({ fileName: file.name, status: "demo-complete" });
    }
  }, 100);
  signal.addEventListener("abort", () => {
    window.clearInterval(timer);
    reject(new DOMException("Upload canceled", "AbortError"));
  }, { once: true });
});

function initializePlugin(plugin: PluginName, root: ParentNode, destroyables: Destroyable[]): NyxToast | undefined {
  switch (plugin) {
    case "image-lightbox": addDestroyables(destroyables, initImageLightboxes(root)); break;
    case "media-carousel": addDestroyables(destroyables, initMediaCarousels(root)); break;
    case "upload-dropzone": addDestroyables(destroyables, initUploadDropzones(root, { transport: demoUpload })); break;
    case "batch-progress-monitor": addDestroyables(destroyables, initBatchProgressMonitors(root)); break;
    case "calendar": addDestroyables(destroyables, initCalendars(root)); break;
    case "carousel": addDestroyables(destroyables, initCarousels(root)); break;
    case "combobox": addDestroyables(destroyables, initComboboxes(root)); break;
    case "command-palette": addDestroyables(destroyables, initCommandPalettes(root)); break;
    case "context-menu": addDestroyables(destroyables, initContextMenus(root)); break;
    case "dialog": addDestroyables(destroyables, initDialogs(root)); break;
    case "data-table": addDestroyables(destroyables, initDataTables(root)); break;
    case "date-picker": addDestroyables(destroyables, initDatePickers(root)); break;
    case "dropdown-menu": addDestroyables(destroyables, initDropdownMenus(root)); break;
    case "file-upload": addDestroyables(destroyables, initFileUploads(root, { transport: demoUpload })); break;
    case "input-otp": addDestroyables(destroyables, initInputOtps(root)); break;
    case "multi-select": addDestroyables(destroyables, initMultiSelects(root)); break;
    case "number-input": addDestroyables(destroyables, initNumberInputs(root)); break;
    case "password-input": addDestroyables(destroyables, initPasswordInputs(root)); break;
    case "prompt-composer": addDestroyables(destroyables, initPromptComposers(root)); break;
    case "message-scroller": addDestroyables(destroyables, initMessageScrollers(root)); break;
    case "attachment-previews": addDestroyables(destroyables, initAttachmentPreviews(root)); break;
    case "generation-queue": addDestroyables(destroyables, initGenerationQueues(root)); break;
    case "model-selector": addDestroyables(destroyables, initModelSelectors(root)); break;
    case "parameter-inspector": addDestroyables(destroyables, initParameterInspectors(root)); break;
    case "before-after": addDestroyables(destroyables, initBeforeAfters(root)); break;
    case "search-box": addDestroyables(destroyables, initSearchBoxes(root)); break;
    case "menubar": addDestroyables(destroyables, initMenubars(root)); break;
    case "navigation-menu": addDestroyables(destroyables, initNavigationMenus(root)); break;
    case "hover-card": addDestroyables(destroyables, initHoverCards(root)); break;
    case "tooltip": addDestroyables(destroyables, initTooltips(root)); break;
    case "resizable-panels": addDestroyables(destroyables, initResizablePanels(root)); break;
    case "scroll-area": addDestroyables(destroyables, initScrollAreas(root)); break;
    case "tree-view": addDestroyables(destroyables, initTreeViews(root)); break;
    case "sidebar": addDestroyables(destroyables, initSidebars(root)); break;
    case "stepper": addDestroyables(destroyables, initSteppers(root)); break;
    case "notification-center": addDestroyables(destroyables, initNotificationCenters(root)); break;
    case "activity-feed": addDestroyables(destroyables, initActivityFeeds(root)); break;
    case "filter-bar": addDestroyables(destroyables, initFilterBars(root)); break;
    case "command-bar": addDestroyables(destroyables, initCommandBars(root)); break;
    case "bulk-action-toolbar": addDestroyables(destroyables, initBulkActionToolbars(root)); break;
    case "code-block": break;
    case "tabs": addDestroyables(destroyables, initTabs(root)); break;
    case "toast": {
      const toasts = initToasts(root);
      addDestroyables(destroyables, toasts);
      return toasts[0];
    }
  }
  return undefined;
}

function initializePage(page: DocPage): () => void {
  const abortController = new AbortController();
  const destroyables: Destroyable[] = [];
  main.querySelectorAll<HTMLElement>("[data-render-workspace]").forEach(root => {
    destroyables.push({ destroy: mountWorkspace(root) });
  });
  let toast: NyxToast | undefined;
  addDestroyables(destroyables, initTabs(main));
  addDestroyables(destroyables, initCodeBlocks(main));
  page.plugins?.forEach((plugin) => {
    toast = initializePlugin(plugin, main, destroyables) ?? toast;
  });

  main.querySelectorAll<HTMLButtonElement>("[data-nyx-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
    }, { signal: abortController.signal });
  });

  main.querySelectorAll<HTMLElement>("[data-nyx-sensitive]").forEach((sensitive) => {
    const concealment = sensitive.querySelector<HTMLElement>("[data-nyx-sensitive-concealment]");
    const content = sensitive.querySelector<HTMLElement>("[data-nyx-sensitive-content]");
    const reveal = sensitive.querySelector<HTMLButtonElement>("[data-nyx-sensitive-reveal]");
    const conceal = sensitive.querySelector<HTMLButtonElement>("[data-nyx-sensitive-conceal]");
    const setRevealed = (revealed: boolean): void => {
      sensitive.dataset.state = revealed ? "revealed" : "concealed";
      concealment?.toggleAttribute("hidden", revealed);
      content?.toggleAttribute("hidden", !revealed);
      reveal?.setAttribute("aria-expanded", String(revealed));
      if (revealed) conceal?.focus();
      else reveal?.focus();
    };
    reveal?.addEventListener("click", () => setRevealed(true), { signal: abortController.signal });
    conceal?.addEventListener("click", () => setRevealed(false), { signal: abortController.signal });
  });

  main.querySelectorAll<HTMLElement>("[data-nyx-example='application-shell'], [data-nyx-sidebar]").forEach((shell) => {
    const buttons = [...shell.querySelectorAll<HTMLElement>("[data-nyx-shell-navigation] :is(a, button)[aria-controls]")];
    const panels = [...shell.querySelectorAll<HTMLElement>("[data-nyx-shell-panel]")];
    const title = shell.querySelector<HTMLElement>("[data-nyx-shell-title]");
    buttons.forEach((button) => button.addEventListener("click", (event) => {
      event.preventDefault();
      const panelId = button.getAttribute("aria-controls");
      buttons.forEach((candidate) => {
        if (candidate === button) candidate.setAttribute("aria-current", "page");
        else candidate.removeAttribute("aria-current");
      });
      panels.forEach((panel) => panel.toggleAttribute("hidden", panel.id !== panelId));
      if (title) title.textContent = button.dataset.title ?? button.textContent?.trim() ?? "Workspace";
      if (shell.dataset.nyxSidebarMode === "mobile") shell.querySelector<HTMLElement>("[data-nyx-sidebar-toggle]")?.click();
    }, { signal: abortController.signal }));
  });

  main.querySelectorAll<HTMLFormElement>("[data-nyx-batch-plan]").forEach((form) => {
    const name = form.querySelector<HTMLElement>("[data-nyx-batch-plan-name]");
    const summary = form.querySelector<HTMLElement>("[data-nyx-batch-plan-summary]");
    const submit = form.querySelector<HTMLButtonElement>("button[type='submit']");
    const syncPlan = (): void => {
      const selected = form.querySelector<HTMLInputElement>("input[name='batch-plan']:checked");
      if (!selected) return;
      if (name) name.textContent = `${selected.value} plan`;
      if (summary) summary.textContent = `${selected.dataset.outputs} outputs · approximately ${selected.dataset.duration} minutes`;
      if (submit) submit.textContent = `Start ${selected.value.toLocaleLowerCase()} batch`;
    };
    form.addEventListener("change", syncPlan, { signal: abortController.signal });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const selected = form.querySelector<HTMLInputElement>("input[name='batch-plan']:checked");
      if (!selected || !submit) return;
      submit.textContent = `${selected.value} batch queued`;
      submit.disabled = true;
    }, { signal: abortController.signal });
    syncPlan();
  });

  const rangeInput = main.querySelector<HTMLInputElement>("[data-range-input]");
  const rangeOutput = main.querySelector<HTMLOutputElement>("[data-range-output]");
  rangeInput?.addEventListener("input", () => {
    if (rangeOutput) rangeOutput.value = rangeInput.value;
  }, { signal: abortController.signal });

  main.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-motion-replay], [data-motion-replay-all]") : null;
    if (!target) return;
    const replay = (element: HTMLElement): void => {
      const replacement = element.cloneNode(true) as HTMLElement;
      if (replacement.classList.contains("docs-motion-exit")) replacement.dataset.motionPlaying = "true";
      element.replaceWith(replacement);
    };
    if (target.hasAttribute("data-motion-replay-all")) {
      main.querySelectorAll<HTMLElement>("[data-motion-stage] [id^='motion-']").forEach(replay);
      return;
    }
    const id = target.dataset.motionTarget;
    const element = id ? main.querySelector<HTMLElement>(`#${id}`) : null;
    if (element) replay(element);
  }, { signal: abortController.signal });

  const toastStatus = main.querySelector<HTMLOutputElement>("[data-toast-demo-status]");
  const toastExamples: Record<string, NyxToastOptions> = {
    neutral: {
      title: "Settings saved",
      description: "Workspace preferences are up to date.",
    },
    success: {
      title: "Release validated",
      description: "All component contracts passed.",
      tone: "success",
    },
    warning: {
      title: "Capacity approaching limit",
      description: "Only 12% of the monthly allocation remains.",
      tone: "warning",
      duration: 0,
    },
    danger: {
      title: "Deployment failed",
      description: "Review the build log before trying again.",
      tone: "danger",
      duration: 0,
    },
    loading: {
      title: "Preparing deployment",
      description: "Validating the release bundle.",
      progress: "indeterminate",
    },
    progress: {
      title: "Uploading release bundle",
      description: "68% complete · about 12 seconds remaining.",
      progress: 68,
      duration: 0,
    },
    action: {
      title: "Release bundle uploaded",
      description: "The artifact is ready for review.",
      tone: "success",
      action: { label: "View upload", value: "view-upload" },
      duration: 0,
    },
  };
  main.querySelectorAll<HTMLButtonElement>("[data-toast-demo]").forEach((button) => {
    button.addEventListener("click", () => {
      const options = toastExamples[button.dataset.toastDemo ?? "neutral"];
      const showcase = button.closest<HTMLElement>(".nyx-toast-showcase");
      const region = showcase?.querySelector<HTMLElement>("[data-nyx-toast-region]");
      const targetToast = region ? initToasts(region)[0] : toast;
      if (!targetToast || !options) return;
      targetToast.notify(options);
      const status = showcase?.querySelector<HTMLOutputElement>("[data-toast-demo-status]") ?? toastStatus;
      if (status) status.value = `Created: ${options.title}.`;
    }, { signal: abortController.signal });
  });
  main.querySelectorAll<HTMLElement>("[data-nyx-toast-region]").forEach((region) => {
    region.addEventListener("nyx:toast:action", (event) => {
      const toastEvent = event as CustomEvent<{ action?: { label: string } }>;
      const status = region.closest<HTMLElement>(".nyx-toast-showcase")?.querySelector<HTMLOutputElement>("[data-toast-demo-status]");
      if (status && toastEvent.detail.action) {
        status.value = `Action selected: ${toastEvent.detail.action.label}.`;
      }
    }, { signal: abortController.signal });
  });

  return () => {
    abortController.abort();
    [...destroyables].reverse().forEach((instance) => instance.destroy());
  };
}

function notFoundMarkup(): string {
  return `<section class="docs-section"><header class="docs-page-header"><span class="nyx-eyebrow">// 404</span><h1 class="docs-title" tabindex="-1">Page not found</h1><p class="docs-intro">This documentation route does not exist.</p></header><a class="nyx-button" data-docs-link data-docs-path="/" href="${hrefFor("/")}">Return to overview</a></section>`;
}

function render(pathname = window.location.pathname): void {
  destroyCurrentPage?.();
  destroyCurrentPage = undefined;
  const path = normalizePath(pathname);
  const canonical = consolidatedRoutes[path] ?? path;
  if (canonical !== path) history.replaceState(null, "", hrefFor(canonical));
  const page = pageByPath.get(canonical);
  main.innerHTML = page
    ? `${renderPage(page)}<footer class="docs-footer"><span>Nyx UI · v0.2.0-beta.3 · Apache-2.0</span><a href="https://github.com/Pythoholic/nyx-ui">Source repository</a></footer>`
    : notFoundMarkup();
  updateNavigation(page);
  document.title = page ? `${page.title} — Nyx UI` : "Page not found — Nyx UI";
  if (page) destroyCurrentPage = initializePage(page);
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

function navigate(path: string, replace = false): void {
  const page = pageByPath.get(normalizePath(path));
  if (!page) return;
  const href = hrefFor(page.path);
  if (replace) history.replaceState(null, "", href);
  else history.pushState(null, "", href);
  searchPalette.close();
  searchPalette.query = "";
  render(page.path);
}

searchPaletteElement.addEventListener("nyx:command-palette:run", (event: CustomEvent<NyxCommandPaletteEventDetail>) => {
  const path = event.detail.value;
  if (path) navigate(path);
});

window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
    event.preventDefault();
    searchPalette.open(document.querySelector<HTMLElement>("[data-nyx-dialog-trigger='docs-command-palette']") ?? undefined);
  }
});

app.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-docs-link]") : null;
  const path = target?.dataset.docsPath;
  if (!target || !path || target.target === "_blank" || target.hasAttribute("download")) return;
  event.preventDefault();
  navigate(path);
});

window.addEventListener("popstate", () => {
  searchPalette.close();
  searchPalette.query = "";
  render();
});

const legacyPath = legacyHashRedirects[window.location.hash.slice(1)];
if (legacyPath) navigate(legacyPath, true);
else render();
