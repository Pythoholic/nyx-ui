import feedbackMarkup from "../../../../registry/components/feedback.html?raw";
import { icon } from "../icons.js";
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
    body: card("Badges", `<div class="docs-row"><span class="nyx-badge">Active</span><span class="nyx-badge" data-tone="success">Success</span><span class="nyx-badge" data-tone="warning">Warning</span><span class="nyx-badge" data-tone="danger">Failed</span></div>`),
  }),
  page({
    path: paths.components.feedback.alerts,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Alerts",
    description,
    searchTerms: "alert notice message success danger validation status",
    body: card("Alerts", `<div class="docs-column">${selectMarkup(feedbackMarkup, [".nyx-alert"])}<div class="nyx-alert" data-tone="danger">${icon("alert")}<div><strong class="nyx-alert-title">Validation failed</strong>Correct two fields before continuing.</div></div></div>`, "Registry source"),
  }),
  page({
    path: paths.components.feedback.progress,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Progress",
    description: "Progress communicates determinate and indeterminate work with a native progressbar contract.",
    searchTerms: "progress bar loading processing determinate indeterminate",
    body: card("Progress", `<div class="docs-column">${selectMarkup(feedbackMarkup, [".nyx-progress"])}<div class="nyx-progress" data-indeterminate="true" aria-label="Processing"><div class="nyx-progress-bar"></div></div></div>`, "Registry source"),
  }),
  page({
    path: paths.components.feedback.steps,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Steps",
    description: "Steps expose completed, current, and pending phases with ordered semantic structure.",
    searchTerms: "steps progress complete current queued build verify release",
    body: card("Steps", selectMarkup(feedbackMarkup, [".nyx-steps"]), "Registry source"),
  }),
  page({
    path: paths.components.feedback.loading,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Loading",
    description: "Spinners and skeletons distinguish active status from placeholder content while respecting reduced motion.",
    searchTerms: "loading spinner skeleton placeholder processing reduced motion",
    body: card("Loading", `<div class="docs-column"><div class="docs-row"><span class="nyx-spinner" role="status" aria-label="Loading"></span><span>Processing records</span></div><div class="nyx-skeleton" style="height:1.25rem;width:72%"></div><div class="nyx-skeleton" style="height:1rem;width:100%"></div><div class="nyx-skeleton" style="height:1rem;width:86%"></div></div>`),
  }),
  page({
    path: paths.components.feedback.toast,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Toast",
    description: "Transient notifications enter a live region, announce useful status, and clean up timers and controls when destroyed.",
    searchTerms: "toast notification live region dismiss transient status",
    plugins: ["toast"],
    body: `${card("Toast", `<div class="docs-column"><p style="margin:0;color:var(--nyx-muted)">Notifications enter the live region and dismiss automatically.</p><button class="nyx-button" data-toast-demo type="button">Send notification</button></div>`, "Live region")} ${selectMarkup(feedbackMarkup, ["[data-nyx-toast-region]"])}`,
  }),
  page({
    path: paths.components.feedback.emptyState,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Empty State",
    description: "Empty states explain what is absent and provide a clear next action where one exists.",
    searchTerms: "empty state no records action create",
    body: card("Empty state", selectMarkup(feedbackMarkup, [".nyx-empty"]), "Registry source"),
  }),
  page({
    path: paths.components.feedback.errorState,
    categoryId: "feedback",
    categoryLabel: "Feedback",
    title: "Error State",
    description: "Recoverable error states pair a plain-language explanation with the safest next action.",
    searchTerms: "error state failed unavailable retry recoverable",
    body: card("Error state", `<div class="nyx-empty" style="border-color:var(--nyx-danger-line)">${icon("alert")}<div><strong style="color:var(--nyx-danger)">Unable to load records</strong><p style="margin:.5rem 0 0">The service did not respond. Your changes were not lost.</p></div><button class="nyx-button">Try again</button></div>`, "Recoverable"),
  }),
];
