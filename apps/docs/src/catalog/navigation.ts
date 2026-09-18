import menubarMarkup from "../../../../registry/components/menubar.html?raw";
import navigationMarkup from "../../../../registry/components/navigation.html?raw";
import carouselMarkup from "../../../../registry/components/carousel.html?raw";
import navigationMenuMarkup from "../../../../registry/components/navigation-menu.html?raw";
import { icon } from "../icons.js";
import { paths } from "../routes.js";
import { card, page, selectMarkup } from "./shared.js";

export const navigationPages = [
  page({
    path: paths.components.navigation.topBar,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Top Bar",
    description: "Application top bars keep product identity, status, and account actions visible without adopting application-menu semantics.",
    searchTerms: "navigation topbar status account workspace",
    body: card("Application top bar", `<div class="nyx-topbar"><div class="docs-brand"><span class="docs-mark">N</span><strong>Workspace</strong></div><div class="docs-row"><span class="nyx-badge" data-tone="success"><span class="nyx-status-dot"></span>Operational</span><button class="nyx-button nyx-icon-button" aria-label="Account">${icon("user")}</button></div></div>`),
  }),
  page({
    path: paths.components.navigation.menubar,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Menubar",
    description: "Menubar is reserved for application commands, with horizontal root navigation and keyboard-controlled dropdown menus.",
    searchTerms: "application menubar menu commands file edit view keyboard",
    plugins: ["menubar"],
    body: card("Application menubar", menubarMarkup, "Registry source"),
  }),
  page({
    path: paths.components.navigation.navigationMenu,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Navigation Menu",
    description: "Product navigation remains a semantic nav with real links and disclosure behavior, not a role=menu widget.",
    searchTerms: "product site navigation menu disclosure flyout links",
    plugins: ["navigation-menu"],
    body: card("Product navigation", navigationMenuMarkup, "Registry source"),
  }),
  page({
    path: paths.components.navigation.breadcrumbs,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Breadcrumbs",
    description: "Breadcrumbs communicate hierarchy with a labeled navigation landmark and an explicit current page.",
    searchTerms: "breadcrumbs hierarchy current page links navigation",
    body: card("Breadcrumbs", selectMarkup(navigationMarkup, [".nyx-breadcrumbs"]), "Registry source"),
  }),
  page({
    path: paths.components.navigation.pagination,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Pagination",
    description: "Pagination uses native links, concise accessible names, and aria-current for the selected page.",
    searchTerms: "pagination previous next current page links navigation",
    body: card("Pagination", selectMarkup(navigationMarkup, [".nyx-pagination"]), "Registry source"),
  }),
  page({
    path: paths.components.navigation.accordion,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Accordion",
    description: "Native details and summary elements provide progressive disclosure without a custom controller.",
    searchTerms: "accordion details summary disclosure expand collapse native",
    body: card("Accordion", selectMarkup(navigationMarkup, [".nyx-accordion"]), "Registry source"),
  }),
  page({
    path: paths.components.navigation.tabs,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Tabs",
    description: "Tabs synchronize selection, panels, focus, and Arrow/Home/End keyboard movement.",
    searchTerms: "tabs tablist panel arrow home end keyboard selection",
    plugins: ["tabs"],
    body: card("Tabs", selectMarkup(navigationMarkup, ["[data-nyx-tabs]"]), "Registry source"),
  }),
  page({
    path: paths.components.navigation.carousel,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Carousel",
    description: "Carousel presents one item from an ordered set with explicit, deterministic navigation and no automatic rotation.",
    searchTerms: "carousel slides previous next indicators region ordered content",
    plugins: ["carousel"],
    body: `<section class="docs-prose-section"><h2>Content navigation primitive</h2><p>The generic carousel owns ordered visibility, boundary controls, indicators, and announcements. Rich media remains a composition on top of this contract rather than a separate navigation engine.</p></section>${card("Release highlights", carouselMarkup, "Registry source")}`,
  }),
];
