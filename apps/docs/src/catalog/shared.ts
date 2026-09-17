export type PluginName =
  | "context-menu"
  | "dialog"
  | "dropdown-menu"
  | "menubar"
  | "navigation-menu"
  | "tabs"
  | "toast";

export interface DocPage {
  body: string;
  categoryId?: string;
  categoryLabel: string;
  description: string;
  navigationLabel?: string;
  path: string;
  plugins?: PluginName[];
  searchTerms: string;
  title: string;
}

export interface NavigationCategory {
  id: string;
  label: string;
  pages: DocPage[];
}

export function page(options: DocPage): DocPage {
  return options;
}

export function renderPage(page: DocPage): string {
  return `<section class="docs-section" data-docs-page="${page.path}"><div class="docs-section-heading"><div><span class="nyx-eyebrow">// ${page.categoryLabel}</span><h1 tabindex="-1">${page.title}</h1></div><p class="docs-section-copy">${page.description}</p></div>${page.body}</section>`;
}

export function card(title: string, body: string, badge = "Ready"): string {
  return `<article class="docs-component-card"><header class="docs-component-head"><h3>${title}</h3><span class="nyx-badge">${badge}</span></header><div class="docs-component-body">${body}</div></article>`;
}

export function selectMarkup(markup: string, selectors: string[]): string {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return selectors
    .flatMap((selector) => Array.from(template.content.querySelectorAll(selector)))
    .map((element) => element.outerHTML)
    .join("");
}
