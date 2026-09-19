import layoutsMarkup from "../../../../registry/components/layouts.html?raw";
import sidebarMarkup from "../../../../registry/components/sidebar.html?raw";
import scrollAreaMarkup from "../../../../registry/components/scroll-area.html?raw";
import resizablePanelsMarkup from "../../../../registry/components/resizable-panels.html?raw";
import authenticationMarkup from "../../../../registry/components/authentication.html?raw";
import registrationMarkup from "../../../../registry/components/registration.html?raw";
import welcomeBackMarkup from "../../../../registry/components/welcome-back.html?raw";
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
    navigationLabel: "Sign In",
    description: "A complete sign-in layout pairs native credential fields with recovery, registration, and account-retention paths.",
    searchTerms: "layout authentication auth sign in email password recovery registration secure",
    body: `<section class="docs-prose-section"><h2>Use and boundary</h2><p>Use this layout for password-based account access when recovery and registration are available routes. The form supplies correct labels, autocomplete values, and native required-field validation; the application still owns credential submission, errors returned by the server, rate limiting, and session policy.</p><p>Do not use the branded panel for legal notices or critical errors: it may stack above the form at narrow widths. Keep blocking instructions and validation adjacent to the controls.</p></section>${card("Sign in", authenticationMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.layouts.registration,
    categoryId: "layouts",
    categoryLabel: "Layouts",
    title: "Registration Layout",
    description: "Create-account fields use native constraints while the existing password component adds visibility and strength guidance.",
    searchTerms: "layout authentication registration create account name email new password validation",
    plugins: ["password-input"],
    body: `<section class="docs-prose-section"><h2>Validation and ownership</h2><p>The browser validates required text, email syntax, minimum password length, and consent before submission. <code>:user-invalid</code> reveals inline guidance only after the user has interacted. Password strength is advisory; it does not replace a server-side password policy.</p><p>The application owns duplicate-account checks, email verification, terms versioning, secure submission, and mapping server errors back to the appropriate field. Add fields only when they are required to create the account.</p></section>${card("Create account", registrationMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.layouts.welcomeBack,
    categoryId: "layouts",
    categoryLabel: "Layouts",
    title: "Welcome Back Layout",
    description: "A returning-user checkpoint identifies the active account before continuing or switching identities.",
    searchTerms: "layout authentication welcome back returning user signed in account switch session",
    body: `<section class="docs-prose-section"><h2>Use and boundary</h2><p>Use this state when the application already has a valid session but benefits from confirming which account will enter a workspace. The account name and identifier must come from trusted session data, not URL parameters or unverified client state.</p><p>The links are navigation examples. The application owns session expiry, account switching, sign-out side effects, and the destination reached by Continue.</p></section>${card("Returning user", welcomeBackMarkup, "Registry source")}`,
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
