import { paths } from "../routes.js";
import { actionPages } from "./actions.js";
import { aiPages } from "./ai.js";
import { chartPages } from "./charts.js";
import { dataPages } from "./data.js";
import { feedbackPages } from "./feedback.js";
import { formPages } from "./forms.js";
import { foundationPages } from "./foundations.js";
import { guidePages } from "./guides.js";
import { layoutPages } from "./layouts.js";
import { mediaPages } from "./media.js";
import { navigationPages } from "./navigation.js";
import { overlayPages } from "./overlays.js";
import { primitivePages } from "./primitives.js";
import { page, type DocPage, type NavigationCategory } from "./shared.js";

export const overviewPage = page({
  path: paths.overview,
  categoryLabel: "Overview",
  title: "Interface foundations for operational software",
  navigationLabel: "Overview",
  description: "Nyx is an open-source UI system for dashboards, administration tools, creative applications, and AI-assisted workflows. It combines a Tailwind CSS 4 foundation, copy-owned semantic markup, and optional framework-agnostic behavior.",
  searchTerms: "overview introduction architecture principles foundation catalog components operational interfaces getting started",
  body: `<div class="docs-overview">
    <section class="docs-overview-lead" aria-labelledby="overview-purpose">
      <div>
        <span class="nyx-eyebrow">Purpose</span>
        <h2 id="overview-purpose">Built for interfaces where state and consequence matter</h2>
      </div>
      <div class="docs-overview-copy">
        <p>Nyx provides the visual and interaction foundations for products used to inspect systems, manage data, configure workflows, and act on changing state. Its dark-first, monospace language is intentionally restrained: hierarchy comes from structure, spacing, and semantic color rather than decoration.</p>
        <p>It is a source-level system, not a hosted component service. Teams retain the HTML they copy, use the CSS as a shared contract, and add JavaScript controllers only where native browser behavior is not sufficient.</p>
      </div>
    </section>

    <section class="docs-overview-section" aria-labelledby="overview-architecture">
      <header class="docs-overview-section-head">
        <span class="nyx-eyebrow">Architecture</span>
        <h2 id="overview-architecture">Three layers with separate responsibilities</h2>
        <p>Adopt the layers your product needs. Markup remains application-owned, and behavior is added per component rather than through a global runtime.</p>
      </header>
      <div class="docs-overview-grid">
        <article class="docs-overview-card">
          <span class="docs-overview-index" aria-hidden="true">01</span>
          <h3>Core CSS</h3>
          <p><code>@nyx-raul/core</code> supplies semantic tokens, four accent themes, typography, layout foundations, motion rules, and component styles for Tailwind CSS 4 projects.</p>
        </article>
        <article class="docs-overview-card">
          <span class="docs-overview-index" aria-hidden="true">02</span>
          <h3>Registry markup</h3>
          <p>Canonical HTML is copied into the application and adapted there. Native elements and explicit accessible relationships remain visible to the team that owns the product.</p>
        </article>
        <article class="docs-overview-card">
          <span class="docs-overview-index" aria-hidden="true">03</span>
          <h3>Optional behavior</h3>
          <p><code>@nyx-raul/plugins</code> provides focused ESM controllers for dialogs, menus, data controls, uploads, and other interactive patterns without requiring a UI framework.</p>
        </article>
      </div>
    </section>

    <section class="docs-overview-split" aria-label="Design principles and adoption guidance">
      <div class="docs-overview-section">
        <header class="docs-overview-section-head">
          <span class="nyx-eyebrow">Principles</span>
          <h2>What the system optimizes for</h2>
        </header>
        <ul class="docs-overview-list">
          <li><strong>Explicit state.</strong><span>Status, progress, selection, validation, and destructive actions remain legible in dense workflows.</span></li>
          <li><strong>Native semantics.</strong><span>Standard HTML behavior is preferred; custom controllers preserve keyboard and focus expectations.</span></li>
          <li><strong>Consumer ownership.</strong><span>Applications own business logic, transport, persistence, authorization, and the final accessibility of adapted markup.</span></li>
          <li><strong>Controlled expression.</strong><span>Themes change accent and emphasis while shared semantic colors retain their operational meaning.</span></li>
        </ul>
      </div>

      <aside class="docs-overview-start" aria-labelledby="overview-start">
        <span class="nyx-eyebrow">Start here</span>
        <h2 id="overview-start">Evaluate Nyx in a real workflow</h2>
        <p>Begin with the executable render workspace to see installation, scoped themes, repeated controls, events, cleanup, progress, failure, and retry in one screen.</p>
        <div class="docs-overview-actions">
          <a class="nyx-button" data-variant="primary" data-docs-link data-docs-path="/guides/render-workspace" href="/guides/render-workspace">Open the working example</a>
          <a class="nyx-link" data-docs-link data-docs-path="/guides/installation" href="/guides/installation">Read installation guidance</a>
        </div>
        <p class="docs-overview-note">Nyx 0.2.0-beta.3 requires a CSS build step. It does not currently provide a supported CDN bundle or framework wrapper.</p>
      </aside>
    </section>

    <div class="docs-readout" aria-label="Current catalog scope">
      <div class="docs-readout-row"><span>Release</span><strong>0.2.0-beta.3</strong></div>
      <div class="docs-readout-row"><span>Foundation groups</span><strong>4</strong></div>
      <div class="docs-readout-row"><span>Component pages</span><strong>84</strong></div>
      <div class="docs-readout-row"><span>Delivery</span><strong>CSS · HTML · ESM</strong></div>
    </div>
  </div>`,
});

export const componentCategories: NavigationCategory[] = [
  { id: "actions", label: "Actions", pages: actionPages },
  { id: "forms", label: "Forms", pages: formPages },
  { id: "primitives", label: "Primitives", pages: primitivePages },
  { id: "navigation", label: "Navigation", pages: navigationPages },
  { id: "overlays", label: "Overlays", pages: overlayPages },
  { id: "feedback", label: "Feedback", pages: feedbackPages },
  { id: "data-display", label: "Data Display", pages: dataPages },
  { id: "visualization", label: "Visualization", pages: chartPages },
  { id: "media", label: "Media", pages: mediaPages },
  { id: "ai", label: "AI Patterns", pages: aiPages },
  { id: "layouts", label: "Layouts", pages: layoutPages },
];

export const pages: DocPage[] = [
  overviewPage,
  ...guidePages,
  ...foundationPages,
  ...componentCategories.flatMap((category) => category.pages),
];

export { foundationPages, guidePages };
export type { DocPage, NavigationCategory } from "./shared.js";
