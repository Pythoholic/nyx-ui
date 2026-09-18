import layoutsMarkup from "../../../../registry/components/layouts.html?raw";
import sidebarMarkup from "../../../../registry/components/sidebar.html?raw";
import scrollAreaMarkup from "../../../../registry/components/scroll-area.html?raw";
import resizablePanelsMarkup from "../../../../registry/components/resizable-panels.html?raw";
import { paths } from "../routes.js";
import { card, page, selectMarkup } from "./shared.js";

export const layoutPages = [
  page({
    path: paths.components.layouts.applicationShell,
    categoryId: "layouts",
    categoryLabel: "Layouts",
    title: "Application Shell",
    description: "The application shell composes stable workspace navigation with an adaptable content region.",
    searchTerms: "layout application shell dashboard sidebar topbar workspace",
    body: card("Application shell", selectMarkup(layoutsMarkup, ["[data-nyx-example='application-shell']"]), "Registry source"),
  }),
  page({
    path: paths.components.layouts.sidebar,
    categoryId: "layouts",
    categoryLabel: "Layouts",
    title: "Sidebar",
    description: "Responsive workspace navigation collapses to an accessible desktop icon rail and composes the existing Dialog drawer on mobile.",
    searchTerms: "layout sidebar navigation icon rail collapse mobile modal drawer persistence",
    plugins: ["sidebar"],
    body: `<section class="docs-prose-section"><h2>Responsive and persistence contract</h2><p>A CSS media query owns the visual breakpoint, while the controller observes the same query to switch native Dialog modality and focus behavior. Persistence is opt-in through <code>data-nyx-sidebar-persist</code>. Persistent instances restore synchronously before <code>data-nyx-sidebar-ready</code> reveals the shell, preventing a flash of the wrong rail state.</p></section>${card("Sidebar", sidebarMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.layouts.scrollArea,
    categoryId: "layouts",
    categoryLabel: "Layouts",
    title: "Scroll Area",
    description: "Native overflow keeps keyboard scrolling and momentum intact while themed scrollbars and passive edge fades clarify additional content.",
    searchTerms: "layout scroll area native overflow scrollbar keyboard momentum fade",
    plugins: ["scroll-area"],
    body: `<section class="docs-prose-section"><h2>Native by design</h2><p>The viewport uses ordinary CSS overflow. The controller only observes dimensions and scroll edges for decorative fades; it never translates content, captures wheel events, or replaces browser scrolling.</p></section>${card("Deployment activity", scrollAreaMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.layouts.resizablePanels,
    categoryId: "layouts",
    categoryLabel: "Layouts",
    title: "Resizable Panels",
    description: "Pointer-capable and keyboard-operable separators resize constrained horizontal, vertical, and nested workspace panels.",
    searchTerms: "layout resizable panels splitter separator pointer touch pen keyboard nested persistence collapse",
    plugins: ["resizable-panels"],
    body: `<section class="docs-prose-section"><h2>Input and persistence contract</h2><p>The handle captures its active pointer, ends on pointer cancellation or capture loss, and suppresses document selection only for the drag lifetime. Arrow keys resize by the configured step, Home and End reach bounds, and Enter toggles an explicitly collapsible leading panel. Storage is never touched unless <code>data-nyx-resizable-persist</code> is present.</p></section>${card("Nested deployment workspace", resizablePanelsMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.layouts.authentication,
    categoryId: "layouts",
    categoryLabel: "Layouts",
    title: "Authentication Layout",
    description: "Authentication pairs a focused form with a restrained branded surface and predictable native inputs.",
    searchTerms: "layout authentication auth sign in email password secure",
    body: card("Authentication layout", selectMarkup(layoutsMarkup, ["[data-nyx-example='authentication-layout']"]), "Registry source"),
  }),
  page({
    path: paths.components.layouts.splitWorkspace,
    categoryId: "layouts",
    categoryLabel: "Layouts",
    title: "Split Workspace",
    description: "Split workspaces keep configuration and live output visible as two coordinated but independently structured regions.",
    searchTerms: "layout split workspace configuration preview live result",
    body: card("Split workspace", selectMarkup(layoutsMarkup, ["[data-nyx-example='split-workspace']"]), "Registry source"),
  }),
];
