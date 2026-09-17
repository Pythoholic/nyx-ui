import { initContextMenus } from "@nyx-ui/plugins/context-menu";
import { initDialogs } from "@nyx-ui/plugins/dialog";
import { initDropdownMenus } from "@nyx-ui/plugins/dropdown-menu";
import { initMenubars } from "@nyx-ui/plugins/menubar";
import { initNavigationMenus } from "@nyx-ui/plugins/navigation-menu";
import { initTabs } from "@nyx-ui/plugins/tabs";
import { initToasts, type NyxToast } from "@nyx-ui/plugins/toast";
import {
  componentCategories,
  foundationPages,
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
  <div class="docs-nav-group"><span class="docs-nav-label">Foundations</span><div class="docs-nav">${foundationPages.map((page) => pageLink(page)).join("")}</div></div>
  <div class="docs-nav-group"><span class="docs-nav-label">Components</span><div class="docs-nav-categories">${componentCategories.map(categoryMarkup).join("")}</div></div>
</nav>`;

app.innerHTML = `<div class="docs-shell">
  <header class="docs-topbar">
    <a class="docs-brand" data-docs-link data-docs-path="/" href="${hrefFor("/")}" aria-label="Nyx UI documentation overview"><span class="docs-mark" aria-hidden="true">N</span><span><span class="docs-brand-name">Nyx UI</span><span class="docs-version">System catalog · 0.1.0</span></span></a>
    <div class="docs-search">
      <label><span class="sr-only">Search documentation</span>${icon("search")}<input class="nyx-input" data-catalog-search type="search" placeholder="Search all documentation" autocomplete="off" aria-controls="docs-search-results" aria-expanded="false"/></label>
      <div class="docs-search-results nyx-scrollable-overlay" id="docs-search-results" data-search-results hidden><ul></ul><p class="sr-only" aria-live="polite" data-search-status></p></div>
    </div>
    <div class="docs-theme-list" aria-label="Accent theme" role="group"><button class="nyx-button docs-theme-button" data-size="small" data-theme-value="solar" aria-pressed="true">Solar</button><button class="nyx-button docs-theme-button" data-size="small" data-theme-value="signal" aria-pressed="false">Signal</button><button class="nyx-button docs-theme-button" data-size="small" data-theme-value="flux" aria-pressed="false">Flux</button><button class="nyx-button docs-theme-button" data-size="small" data-theme-value="plasma" aria-pressed="false">Plasma</button></div>
  </header>
  <div class="docs-layout">
    <aside class="docs-sidebar nyx-scrollable-overlay">${sidebarMarkup}</aside>
    <main class="docs-main" id="docs-main" tabindex="-1"></main>
  </div>
</div>`;

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Nyx documentation shell is missing ${selector}.`);
  return element;
}

const main = requiredElement<HTMLElement>(app, "#docs-main");
const sidebar = requiredElement<HTMLElement>(app, ".docs-sidebar");
const searchInput = requiredElement<HTMLInputElement>(app, "[data-catalog-search]");
const searchResults = requiredElement<HTMLElement>(app, "[data-search-results]");
const searchList = requiredElement<HTMLUListElement>(searchResults, "ul");
const searchStatus = requiredElement<HTMLElement>(searchResults, "[data-search-status]");

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

function initializePlugin(plugin: PluginName, root: ParentNode, destroyables: Destroyable[]): NyxToast | undefined {
  switch (plugin) {
    case "context-menu": addDestroyables(destroyables, initContextMenus(root)); break;
    case "dialog": addDestroyables(destroyables, initDialogs(root)); break;
    case "dropdown-menu": addDestroyables(destroyables, initDropdownMenus(root)); break;
    case "menubar": addDestroyables(destroyables, initMenubars(root)); break;
    case "navigation-menu": addDestroyables(destroyables, initNavigationMenus(root)); break;
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
  let toast: NyxToast | undefined;
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

  return () => {
    abortController.abort();
    [...destroyables].reverse().forEach((instance) => instance.destroy());
  };
}

function overviewMarkup(): string {
  return `<section class="docs-hero" data-docs-page="/"><div><p class="docs-kicker">// Complete system catalog</p><h1 class="docs-title" tabindex="-1">${overviewPage.title}</h1><p class="docs-intro">${overviewPage.description}</p></div>${overviewPage.body}</section>`;
}

function notFoundMarkup(): string {
  return `<section class="docs-section"><div class="docs-section-heading"><div><span class="nyx-eyebrow">// 404</span><h1 tabindex="-1">Page not found</h1></div><p class="docs-section-copy">This documentation route does not exist.</p></div><a class="nyx-button" data-docs-link data-docs-path="/" href="${hrefFor("/")}">Return to overview</a></section>`;
}

function render(pathname = window.location.pathname): void {
  destroyCurrentPage?.();
  destroyCurrentPage = undefined;
  const page = pageByPath.get(normalizePath(pathname));
  main.innerHTML = page
    ? `${page.path === "/" ? overviewMarkup() : renderPage(page)}<footer class="docs-footer"><span>Nyx UI · System catalog</span><span>Semantic · Accessible · Lightweight</span></footer>`
    : notFoundMarkup();
  updateNavigation(page);
  document.title = page ? `${page.title} — Nyx UI` : "Page not found — Nyx UI";
  if (page) destroyCurrentPage = initializePage(page);
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

function closeSearch(clear = false): void {
  searchResults.hidden = true;
  searchInput.setAttribute("aria-expanded", "false");
  if (clear) searchInput.value = "";
}

function navigate(path: string, replace = false): void {
  const page = pageByPath.get(normalizePath(path));
  if (!page) return;
  const href = hrefFor(page.path);
  if (replace) history.replaceState(null, "", href);
  else history.pushState(null, "", href);
  closeSearch(true);
  render(page.path);
}

function updateSearch(): void {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    searchList.replaceChildren();
    searchStatus.textContent = "";
    closeSearch();
    return;
  }
  const matches = pages.filter((page) => `${page.title} ${page.categoryLabel} ${page.searchTerms} ${page.description}`.toLowerCase().includes(query));
  searchList.innerHTML = matches.length
    ? matches.map((page) => `<li><a data-docs-link data-docs-path="${page.path}" href="${hrefFor(page.path)}"><span>${page.title}</span><small>${page.categoryLabel}</small></a></li>`).join("")
    : `<li class="docs-search-empty">No matching page</li>`;
  searchStatus.textContent = `${matches.length} result${matches.length === 1 ? "" : "s"} found.`;
  searchResults.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
}

searchInput.addEventListener("input", updateSearch);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSearch(true);
    return;
  }
  const links = Array.from(searchList.querySelectorAll<HTMLAnchorElement>("a[data-docs-link]"));
  if (event.key === "ArrowDown" && links[0]) {
    event.preventDefault();
    links[0].focus();
  } else if (event.key === "Enter" && links[0]) {
    event.preventDefault();
    navigate(links[0].dataset.docsPath ?? "/");
  }
});

searchResults.addEventListener("keydown", (event) => {
  const links = Array.from(searchList.querySelectorAll<HTMLAnchorElement>("a[data-docs-link]"));
  const index = links.indexOf(document.activeElement as HTMLAnchorElement);
  if (event.key === "Escape") {
    event.preventDefault();
    closeSearch(true);
    searchInput.focus();
  } else if (event.key === "ArrowDown" && links.length) {
    event.preventDefault();
    links[(index + 1) % links.length]?.focus();
  } else if (event.key === "ArrowUp" && links.length) {
    event.preventDefault();
    if (index <= 0) searchInput.focus();
    else links[index - 1]?.focus();
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
  closeSearch(true);
  render();
});

const legacyPath = legacyHashRedirects[window.location.hash.slice(1)];
if (legacyPath) navigate(legacyPath, true);
else render();
