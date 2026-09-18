import { initComboboxes } from "@nyx-ui/plugins/combobox";
import { initCarousels } from "@nyx-ui/plugins/carousel";
import { initCalendars } from "@nyx-ui/plugins/calendar";
import { initCommandPalettes, type NyxCommandPalette, type NyxCommandPaletteEventDetail } from "@nyx-ui/plugins/command-palette";
import { initContextMenus } from "@nyx-ui/plugins/context-menu";
import { initDialogs } from "@nyx-ui/plugins/dialog";
import { initDataTables } from "@nyx-ui/plugins/data-table";
import { initDatePickers } from "@nyx-ui/plugins/date-picker";
import { initDropdownMenus } from "@nyx-ui/plugins/dropdown-menu";
import { initFileUploads, type NyxFileUploadAdapter } from "@nyx-ui/plugins/file-upload";
import { initInputOtps } from "@nyx-ui/plugins/input-otp";
import { initMultiSelects } from "@nyx-ui/plugins/multi-select";
import { initNumberInputs } from "@nyx-ui/plugins/number-input";
import { initPasswordInputs } from "@nyx-ui/plugins/password-input";
import { initSearchBoxes } from "@nyx-ui/plugins/search-box";
import { initMenubars } from "@nyx-ui/plugins/menubar";
import { initNavigationMenus } from "@nyx-ui/plugins/navigation-menu";
import { initHoverCards } from "@nyx-ui/plugins/hover-card";
import { initResizablePanels } from "@nyx-ui/plugins/resizable-panels";
import { initScrollAreas } from "@nyx-ui/plugins/scroll-area";
import { initTreeViews } from "@nyx-ui/plugins/tree-view";
import { initSidebars } from "@nyx-ui/plugins/sidebar";
import { initSteppers } from "@nyx-ui/plugins/stepper";
import { initNotificationCenters } from "@nyx-ui/plugins/notification-center";
import { initFilterBars } from "@nyx-ui/plugins/filter-bar";
import { initCommandBars } from "@nyx-ui/plugins/command-bar";
import { initBulkActionToolbars } from "@nyx-ui/plugins/bulk-action-toolbar";
import { initTabs } from "@nyx-ui/plugins/tabs";
import { initToasts, type NyxToast } from "@nyx-ui/plugins/toast";
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
import { legacyHashRedirects } from "./routes.js";
import "./styles.css";

interface Destroyable {
  destroy(): void;
}

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
  <div class="docs-nav-group"><span class="docs-nav-label">Start</span><div class="docs-nav">${pageLink(overviewPage)}</div></div>
  <div class="docs-nav-group"><span class="docs-nav-label">Getting started</span><div class="docs-nav">${guidePages.slice(0, 5).map((page) => pageLink(page)).join("")}</div></div>
  <div class="docs-nav-group"><span class="docs-nav-label">Integration</span><div class="docs-nav">${guidePages.slice(5).map((page) => pageLink(page)).join("")}</div></div>
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
    <a class="docs-brand" data-docs-link data-docs-path="/" href="${hrefFor("/")}" aria-label="Nyx UI documentation overview"><span class="docs-mark" aria-hidden="true">N</span><span><span class="docs-brand-name">Nyx UI</span><span class="docs-version">System catalog · 0.1.0</span></span></a>
    <button class="docs-search-trigger" data-nyx-dialog-trigger="docs-command-palette" type="button">${icon("search")}<span>Search documentation</span><span class="nyx-kbd-chord" aria-hidden="true"><kbd class="nyx-kbd">Ctrl</kbd><kbd class="nyx-kbd">K</kbd></span></button>
    <div class="docs-theme-list" aria-label="Accent theme" role="group"><button class="nyx-button docs-theme-button" data-size="small" data-theme-value="solar" aria-pressed="true">Solar</button><button class="nyx-button docs-theme-button" data-size="small" data-theme-value="signal" aria-pressed="false">Signal</button><button class="nyx-button docs-theme-button" data-size="small" data-theme-value="flux" aria-pressed="false">Flux</button><button class="nyx-button docs-theme-button" data-size="small" data-theme-value="plasma" aria-pressed="false">Plasma</button></div>
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
    if (!theme) return;
    document.documentElement.dataset.nyxTheme = theme;
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
    case "search-box": addDestroyables(destroyables, initSearchBoxes(root)); break;
    case "menubar": addDestroyables(destroyables, initMenubars(root)); break;
    case "navigation-menu": addDestroyables(destroyables, initNavigationMenus(root)); break;
    case "hover-card": addDestroyables(destroyables, initHoverCards(root)); break;
    case "resizable-panels": addDestroyables(destroyables, initResizablePanels(root)); break;
    case "scroll-area": addDestroyables(destroyables, initScrollAreas(root)); break;
    case "tree-view": addDestroyables(destroyables, initTreeViews(root)); break;
    case "sidebar": addDestroyables(destroyables, initSidebars(root)); break;
    case "stepper": addDestroyables(destroyables, initSteppers(root)); break;
    case "notification-center": addDestroyables(destroyables, initNotificationCenters(root)); break;
    case "filter-bar": addDestroyables(destroyables, initFilterBars(root)); break;
    case "command-bar": addDestroyables(destroyables, initCommandBars(root)); break;
    case "bulk-action-toolbar": addDestroyables(destroyables, initBulkActionToolbars(root)); break;
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
  const copyResetTimers: number[] = [];
  let toast: NyxToast | undefined;
  addDestroyables(destroyables, initTabs(main));
  page.plugins?.forEach((plugin) => {
    toast = initializePlugin(plugin, main, destroyables) ?? toast;
  });

  main.querySelectorAll<HTMLButtonElement>("[data-nyx-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
    }, { signal: abortController.signal });
  });

  const rangeInput = main.querySelector<HTMLInputElement>("[data-range-input]");
  const rangeOutput = main.querySelector<HTMLOutputElement>("[data-range-output]");
  rangeInput?.addEventListener("input", () => {
    if (rangeOutput) rangeOutput.value = rangeInput.value;
  }, { signal: abortController.signal });

  main.querySelector("[data-motion-replay]")?.addEventListener("click", () => {
    const stage = main.querySelector<HTMLElement>("[data-motion-stage]");
    if (stage) stage.replaceWith(stage.cloneNode(true));
  }, { signal: abortController.signal });

  main.querySelector("[data-toast-demo]")?.addEventListener("click", () => {
    toast?.notify({ title: "Release validated", description: "All component contracts passed.", tone: "success" });
  }, { signal: abortController.signal });

  main.querySelectorAll<HTMLButtonElement>("[data-copy-code]").forEach((button) => {
    button.addEventListener("click", async () => {
      const container = button.closest("[data-docs-example]") ?? button.closest(".docs-code");
      const code = container?.querySelector("code")?.textContent;
      const status = button.parentElement?.querySelector<HTMLElement>("[data-copy-status]");
      if (!code || !status) return;
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(code);
        else {
          const textarea = document.createElement("textarea");
          textarea.value = code;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.append(textarea);
          textarea.select();
          const copied = document.execCommand("copy");
          textarea.remove();
          if (!copied) throw new Error("Copy command was rejected.");
        }
        button.textContent = "Copied";
        status.textContent = "Code copied to clipboard.";
        copyResetTimers.push(window.setTimeout(() => {
          button.textContent = "Copy";
          status.textContent = "";
        }, 2000));
      } catch {
        button.textContent = "Copy failed";
        status.textContent = "Copy failed. Select the code and copy it manually.";
      }
    }, { signal: abortController.signal });
  });

  return () => {
    abortController.abort();
    copyResetTimers.forEach((timer) => window.clearTimeout(timer));
    [...destroyables].reverse().forEach((instance) => instance.destroy());
  };
}

function notFoundMarkup(): string {
  return `<section class="docs-section"><header class="docs-page-header"><span class="nyx-eyebrow">// 404</span><h1 class="docs-title" tabindex="-1">Page not found</h1><p class="docs-intro">This documentation route does not exist.</p></header><a class="nyx-button" data-docs-link data-docs-path="/" href="${hrefFor("/")}">Return to overview</a></section>`;
}

function render(pathname = window.location.pathname): void {
  destroyCurrentPage?.();
  destroyCurrentPage = undefined;
  const page = pageByPath.get(normalizePath(pathname));
  main.innerHTML = page
    ? `${renderPage(page)}<footer class="docs-footer"><span>Nyx UI · v0.1.0 · Apache-2.0</span><a href="https://github.com/Pythoholic/nyx-stealth">Source repository</a></footer>`
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
