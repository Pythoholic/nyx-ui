import { icon } from "../icons.js";
import { card, section } from "./shared.js";

export const feedbackSection = section(
  "feedback",
  "10",
  "Feedback and status",
  "Every feedback state uses text and structure in addition to color. Loading, progress, empty, error, and transient notification patterns are included.",
  `<div class="docs-grid">
    ${card("Badges and alerts", `<div class="docs-column"><div class="docs-row"><span class="nyx-badge">Active</span><span class="nyx-badge" data-tone="success">Success</span><span class="nyx-badge" data-tone="warning">Warning</span><span class="nyx-badge" data-tone="danger">Failed</span></div><div class="nyx-alert" data-tone="success">${icon("check")}<div><strong class="nyx-alert-title">Deployment complete</strong>All services are reporting healthy.</div></div><div class="nyx-alert" data-tone="danger">${icon("alert")}<div><strong class="nyx-alert-title">Validation failed</strong>Correct two fields before continuing.</div></div></div>`)}
    ${card("Progress and steps", `<div class="docs-column"><div class="nyx-progress" role="progressbar" aria-label="Upload progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="68"><div class="nyx-progress-bar" style="--nyx-progress:68%"></div></div><div class="nyx-progress" data-indeterminate="true" aria-label="Processing"><div class="nyx-progress-bar"></div></div><ol class="nyx-steps" style="--nyx-step-count:4"><li class="nyx-step" data-state="complete">Queued</li><li class="nyx-step" data-state="complete">Build</li><li class="nyx-step" data-state="current">Verify</li><li class="nyx-step">Release</li></ol></div>`)}
    ${card("Loading", `<div class="docs-column"><div class="docs-row"><span class="nyx-spinner" role="status" aria-label="Loading"></span><span>Processing records</span></div><div class="nyx-skeleton" style="height:1.25rem;width:72%"></div><div class="nyx-skeleton" style="height:1rem;width:100%"></div><div class="nyx-skeleton" style="height:1rem;width:86%"></div></div>`)}
    ${card("Toast", `<div class="docs-column"><p style="margin:0;color:var(--nyx-muted)">Notifications enter the live region and dismiss automatically.</p><button class="nyx-button" data-toast-demo type="button">Send notification</button></div>`, "Live region")}
    ${card("Empty state", `<div class="nyx-empty">${icon("folder")}<div><strong>No records yet</strong><p style="margin:.5rem 0 0">Create the first record to begin this workspace.</p></div><button class="nyx-button" data-variant="primary">Create first record</button></div>`, "With action")}
    ${card("Error state", `<div class="nyx-empty" style="border-color:var(--nyx-danger-line)">${icon("alert")}<div><strong style="color:var(--nyx-danger)">Unable to load records</strong><p style="margin:.5rem 0 0">The service did not respond. Your changes were not lost.</p></div><button class="nyx-button">Try again</button></div>`, "Recoverable")}
  </div>`,
  "feedback badge alert notice toast progress steps skeleton spinner empty error loading success warning",
);
