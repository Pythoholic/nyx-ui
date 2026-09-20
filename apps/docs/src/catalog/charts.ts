import visualizationMarkup from "../../../../registry/components/visualization.html?raw";
import { paths } from "../routes.js";
import { card, page, selectMarkup } from "./shared.js";

const description = "Static operational examples pair chart styling with labelled measures, units, and text summaries.";

export const chartPages = [
  page({
    path: paths.components.visualization.lineChart,
    categoryId: "visualization",
    categoryLabel: "Visualization",
    title: "Line Chart",
    navigationLabel: "Charts and summaries",
    description,
    searchTerms: "chart line sparkline accessible summary table metric trend area series legend requests data visualization",
    body: `<section class="docs-prose-section"><h2>Use for change over an ordered domain</h2><p>The SVG path is visual evidence, not the only source of meaning. Keep the figure's accessible name specific to the measure and interval, and provide the underlying values in nearby text or a table when readers need exact numbers. Use the metric-row sparkline for a quick trend and the labelled chart and exact-value table for detailed inspection. The separately labelled populated and empty cards are alternative examples; render only the state that matches the selected period. The empty state distinguishes missing data from zero. The canonical example is static: data loading, scales, tooltips, and interaction remain application concerns.</p></section>${card("Line chart", selectMarkup(visualizationMarkup, ["[data-nyx-example='operational-charts']"]), "Registry source")}`,
  }),
  page({
    path: paths.components.visualization.barChart,
    categoryId: "visualization",
    categoryLabel: "Visualization",
    title: "Bar Chart",
    description,
    searchTerms: "chart bar column volume region data visualization",
    body: `<section class="docs-prose-section"><h2>Use for discrete comparison</h2><p>Bars make relative magnitude easy to scan across named categories. Preserve the category and value in an accessible summary, and use a table when exact values matter. The static example includes categories, units, series labels, and a summary. The independent --nyx-chart-primary and --nyx-chart-secondary tokens keep series distinct across themes. Solid and dashed outlines distinguish the series without hue; legend keys reuse the same bar styles. Connect updates and interactive inspection to application data when needed.</p></section>${card("Bar chart", selectMarkup(visualizationMarkup, ["[data-nyx-example='bar-chart']"]), "Registry source")}`,
  }),
];
