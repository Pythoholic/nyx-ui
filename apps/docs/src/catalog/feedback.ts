import feedbackMarkup from "../../../../registry/components/feedback.html?raw";
import stepperMarkup from "../../../../registry/components/stepper.html?raw";
import notificationCenterMarkup from "../../../../registry/components/notification-center.html?raw";
import loadingOverlayMarkup from "../../../../registry/components/loading-overlay.html?raw";
import statusIndicatorMarkup from "../../../../registry/components/status-indicator.html?raw";
import { paths } from "../routes.js";
import { card, page, selectMarkup } from "./shared.js";

const description = "Every feedback state uses text and structure in addition to color, with explicit status and recovery paths.";

export const feedbackPages = [
  page({
    path: paths.components.feedback.badges,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Badges",
    description,
    searchTerms: "badge status active success warning danger failed",
    body: card("Badges", selectMarkup(feedbackMarkup, ["[data-nyx-example='badges']"]), "Registry source"),
  }),
  page({
    path: paths.components.feedback.alerts,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Alerts",
    description,
    searchTerms: "alert notice message success danger validation status",
    body: card("Alerts", selectMarkup(feedbackMarkup, ["[data-nyx-example='alerts']"]), "Registry source"),
  }),
  page({
    path: paths.components.feedback.progress,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Progress",
    description: "Progress communicates determinate and indeterminate work with a native progressbar contract.",
    searchTerms: "progress bar loading processing determinate indeterminate",
    body: card("Progress", selectMarkup(feedbackMarkup, ["[data-nyx-example='progress']"]), "Registry source"),
  }),
  page({
    path: paths.components.feedback.stepper,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Stepper",
    description: "Stepper manages a linear or freely navigable sequence while keeping progress, controls, panels, and ARIA synchronized.",
    searchTerms: "stepper steps progress complete current pending linear panel state management",
    plugins: ["stepper"],
    body: `<section class="docs-prose-section"><h2>Progressive flow</h2><p>Linear mode allows revisiting completed steps and advancing only to the next unvisited step. Consumers may cancel a transition to validate or save the current panel before moving.</p></section>${card("Deployment setup", stepperMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.feedback.notificationCenter,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Notification Centre",
    description: "A persistent notification collection manages unread state, bulk acknowledgement, dismissal, counts, and empty state without conflating durable updates with transient toasts.",
    searchTerms: "notification centre center inbox unread read dismiss mark all persistent updates",
    plugins: ["notification-center"],
    body: `<section class="docs-prose-section"><h2>Durable updates</h2><p>Use the centre for updates people may revisit. Each item keeps semantic list structure and independent links while the controller owns only read state, dismissal, and collection summaries.</p></section>${card("Workspace notifications", notificationCenterMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.feedback.loading,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Loading Overlay",
    description: "A bounded overlay keeps existing content visible while exposing busy state and one concise progress announcement.",
    searchTerms: "loading overlay spinner busy inert processing progress reduced motion",
    body: `<section class="docs-prose-section"><h2>Block only the affected region</h2><p>Set <code>aria-busy="true"</code> on the covered content while work is pending, make temporarily unavailable controls inert, and keep one polite status message outside that busy subtree. When work finishes, remove <code>inert</code>, set <code>aria-busy="false"</code> and <code>data-state="idle"</code>, then hide the overlay.</p></section>${card("Refreshing region health", loadingOverlayMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.feedback.statusIndicator,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Status Indicator",
    description: "A compact dot-and-text treatment communicates current state without making color the only signal.",
    searchTerms: "status indicator dot online offline pending warning health service",
    body: `<section class="docs-prose-section"><h2>Always name the state</h2><p>The dot is decorative; the adjacent text carries the meaning. Add a live-region role only when an existing status changes and that change needs to be announced. Do not repeatedly announce polling updates that require no action.</p></section>${card("Service health", statusIndicatorMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.feedback.toast,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Toast",
    description: "Transient notifications enter a live region, announce useful status, and clean up timers and controls when destroyed.",
    searchTerms: "toast notification live region dismiss transient status",
    plugins: ["toast"],
    body: card("Toast", selectMarkup(feedbackMarkup, ["[data-nyx-example='toast']"]), "Registry source"),
  }),
  page({
    path: paths.components.feedback.emptyState,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Empty State",
    description: "Empty states explain what is absent and provide a clear next action where one exists.",
    searchTerms: "empty state no records action create",
    body: card("Empty state", selectMarkup(feedbackMarkup, ["[data-nyx-example='empty-state']"]), "Registry source"),
  }),
  page({
    path: paths.components.feedback.errorState,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Error State",
    description: "Recoverable error states pair a plain-language explanation with the safest next action.",
    searchTerms: "error state failed unavailable retry recoverable",
    body: card("Error state", selectMarkup(feedbackMarkup, ["[data-nyx-example='error-state']"]), "Registry source"),
  }),
];
