import { paths } from "../routes.js";
import { actionPages } from "./actions.js";
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
  title: "Foundations, components, motion, and application patterns.",
  navigationLabel: "Overview",
  description: "A complete working reference for building precise interfaces with stable typography, semantic markup, themeable tokens, and optional framework-free behavior.",
  searchTerms: "overview foundation catalog components system getting started",
  body: `<div class="docs-readout" aria-label="Catalog status"><div class="docs-readout-row"><span>Foundation groups</span><strong>4</strong></div><div class="docs-readout-row"><span>Component pages</span><strong>39</strong></div><div class="docs-readout-row"><span>Typography roles</span><strong>6 canonical</strong></div><div class="docs-readout-row"><span>Motion tokens</span><strong>10 durations</strong></div><div class="docs-readout-row"><span>Behavior</span><strong style="color:var(--nyx-signal)">Operational</strong></div></div>`,
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
