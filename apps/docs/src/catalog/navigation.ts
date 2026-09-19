import menubarMarkup from "../../../../registry/components/menubar.html?raw";
import navigationMarkup from "../../../../registry/components/navigation.html?raw";
import carouselMarkup from "../../../../registry/components/carousel.html?raw";
import navigationMenuMarkup from "../../../../registry/components/navigation-menu.html?raw";
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
    body: `<section class="docs-prose-section"><h2>Keep global context and actions concise</h2><p>The top bar is a layout region, not an ARIA menubar. Use real links for destinations and buttons for account or workspace actions, and keep status text readable without relying on color. Responsive overflow, authentication state, and action handling remain application responsibilities.</p></section>${card("Application top bar", selectMarkup(navigationMarkup, ["[data-nyx-example='top-bar']"]), "Registry source")}`,
  }),
  page({
    path: paths.components.navigation.menubar,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Menubar",
    description: "Menubar is reserved for application commands, with horizontal root navigation and keyboard-controlled dropdown menus.",
    searchTerms: "application menubar menu commands file edit view keyboard",
    plugins: ["menubar"],
    body: `<section class="docs-prose-section"><h2>Reserve for desktop-style command systems</h2><p>Use Menubar when commands are organized into persistent top-level menus and users benefit from Arrow-key navigation. Do not use it for site destinations; Navigation Menu preserves link semantics for that case. Nyx owns focus, typeahead, submenu state, dismissal, and events; the application executes commands.</p></section>${card("Application menubar", menubarMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.navigation.navigationMenu,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Navigation Menu",
    description: "Product navigation remains a semantic nav with real links and disclosure behavior, not a role=menu widget.",
    searchTerms: "product site navigation menu disclosure flyout links",
    plugins: ["navigation-menu"],
    body: `<section class="docs-prose-section"><h2>Navigation stays link-based</h2><p>Use this pattern for product or site destinations, including a disclosure that groups additional links. The controller manages disclosure position, open state, dismissal, and focus return without converting the nav into an application menu. The router still owns navigation and <code>aria-current</code>.</p></section>${card("Product navigation", navigationMenuMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.navigation.breadcrumbs,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Breadcrumbs",
    description: "Breadcrumbs communicate hierarchy with a labeled navigation landmark and an explicit current page.",
    searchTerms: "breadcrumbs hierarchy current page links navigation",
    body: `<section class="docs-prose-section"><h2>Use for hierarchy, not browsing history</h2><p>Breadcrumbs show the current page's place in an information structure. Keep the labeled <code>nav</code>, ordered list, and <code>aria-current="page"</code>; separators stay decorative. Omit the pattern when there is no meaningful parent hierarchy.</p></section>${card("Breadcrumbs", selectMarkup(navigationMarkup, [".nyx-breadcrumbs"]), "Registry source")}`,
  }),
  page({
    path: paths.components.navigation.pagination,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Pagination",
    description: "Pagination uses native links, concise accessible names, and aria-current for the selected page.",
    searchTerms: "pagination previous next current page links navigation",
    body: `<section class="docs-prose-section"><h2>Use when results have stable pages</h2><p>Each control is a native link to a distinct page and the current one uses <code>aria-current="page"</code>. Give previous and next controls accessible names that do not depend on their icons. The application owns URLs, disabled boundaries, result loading, and preserving filters.</p></section>${card("Pagination", selectMarkup(navigationMarkup, [".nyx-pagination"]), "Registry source")}`,
  }),
  page({
    path: paths.components.navigation.accordion,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Accordion",
    description: "Native details and summary elements provide progressive disclosure without a custom controller.",
    searchTerms: "accordion details summary disclosure expand collapse native",
    body: `<section class="docs-prose-section"><h2>Use for optional sections in document flow</h2><p>Native <code>details</code> and <code>summary</code> provide disclosure state and keyboard activation without initialization. Keep the summary concise and do not hide information users must read before taking an action. Exclusive opening and persistence are not provided.</p></section>${card("Accordion", selectMarkup(navigationMarkup, [".nyx-accordion"]), "Registry source")}`,
  }),
  page({
    path: paths.components.navigation.tabs,
    categoryId: "navigation",
    categoryLabel: "Navigation",
    title: "Tabs",
    description: "Tabs synchronize selection, panels, focus, and Arrow/Home/End keyboard movement.",
    searchTerms: "tabs tablist panel arrow home end keyboard selection",
    plugins: ["tabs"],
    body: `<section class="docs-prose-section"><h2>Use for peer views within one context</h2><p>Tabs are appropriate when panels are closely related and switching does not represent navigation to a new page. Nyx maintains roving focus, selection, panel visibility, and label relationships. The application owns panel content and any lazy data request; do not remove a focused tab without moving focus deliberately.</p></section>${card("Tabs", selectMarkup(navigationMarkup, ["[data-nyx-tabs]"]), "Registry source")}`,
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
