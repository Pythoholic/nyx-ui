import visualizationMarkup from "../../../../registry/components/visualization.html?raw";
import { paths } from "../routes.js";
import { card, page, selectMarkup } from "./shared.js";

const description = "Nyx owns chart color, grid, typography, tooltip, loading, empty, and accessibility contracts while rendering remains replaceable.";

export const chartPages = [
  page({
    path: paths.components.visualization.lineChart,
    categoryId: "visualization",
    categoryLabel: "Visualization",
    title: "Line Chart",
    description,
    searchTerms: "chart line area series legend requests data visualization",
    body: `<section class="docs-prose-section"><h2>Use for change over an ordered domain</h2><p>The SVG path is visual evidence, not the only source of meaning. Keep the figure's accessible name specific to the measure and interval, and provide the underlying values in nearby text or a table when readers need exact numbers. The canonical example is static: data loading, scales, tooltips, and interaction remain application concerns.</p></section>${card("Line chart", selectMarkup(visualizationMarkup, ["[data-nyx-example='line-chart']"]), "Registry source")}`,
  }),
  page({
    path: paths.components.visualization.sparklines,
    categoryId: "visualization",
    categoryLabel: "Visualization",
    title: "Sparklines",
    description,
    searchTerms: "chart sparkline trend rising stable falling compact",
    body: `<section class="docs-prose-section"><h2>Use as supporting trend context</h2><p>A sparkline is intentionally compact and omits axes, so pair it with the current value and a text description of the trend. Choose a full chart when scale, comparison, or exact points affect a decision. The SVG is static and does not supply hover values or data binding.</p></section>${card("Sparkline", selectMarkup(visualizationMarkup, ["[data-nyx-example='sparkline']"]), "Registry source")}`,
  }),
  page({
    path: paths.components.visualization.barChart,
    categoryId: "visualization",
    categoryLabel: "Visualization",
    title: "Bar Chart",
    description,
    searchTerms: "chart bar column volume region data visualization",
    body: `<section class="docs-prose-section"><h2>Use for discrete comparison</h2><p>Bars make relative magnitude easy to scan across named categories. Preserve the category and value in an accessible summary, and use a table when exact values matter. The registry markup demonstrates visual treatment only; the application owns scales, labels, data updates, and any interactive inspection.</p></section>${card("Bar chart", selectMarkup(visualizationMarkup, ["[data-nyx-example='bar-chart']"]), "Registry source")}`,
  }),
  page({
    path: paths.components.visualization.accessibleSummary,
    categoryId: "visualization",
    categoryLabel: "Visualization",
    title: "Accessible Chart Summary",
    description: "Charts include an accessible name, a text summary, and a table alternative when exact values matter.",
    searchTerms: "chart accessible summary table exact values screen reader",
    body: `<section class="docs-prose-section"><h2>Make the conclusion and values available</h2><p>The visible summary states the important pattern while the native table exposes exact values. Keep both derived from the same application data so they cannot disagree. This pattern complements a chart; it does not make an unlabeled or misleading visualization accessible.</p></section>${card("Accessible summary", selectMarkup(visualizationMarkup, ["[data-nyx-example='accessible-chart-summary']"]), "Registry source")}`,
  }),
];
