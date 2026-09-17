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
    body: card("Line chart", selectMarkup(visualizationMarkup, ["figure"]), "Registry source"),
  }),
  page({
    path: paths.components.visualization.sparklines,
    categoryId: "visualization",
    categoryLabel: "Visualization",
    title: "Sparklines",
    description,
    searchTerms: "chart sparkline trend rising stable falling compact",
    body: card("Sparkline", selectMarkup(visualizationMarkup, ["svg[aria-label='Upward trend']"]), "Registry source"),
  }),
  page({
    path: paths.components.visualization.barChart,
    categoryId: "visualization",
    categoryLabel: "Visualization",
    title: "Bar Chart",
    description,
    searchTerms: "chart bar column volume region data visualization",
    body: card("Bar chart", `<svg class="nyx-chart" viewBox="0 0 640 260" role="img" aria-label="Volume by region"><g class="nyx-chart-grid"><path d="M40 40H620M40 95H620M40 150H620M40 205H620"/></g><rect class="nyx-chart-bar" x="70" y="90" width="58" height="130" rx="4"/><rect class="nyx-chart-bar" data-series="secondary" x="145" y="125" width="58" height="95" rx="4"/><rect class="nyx-chart-bar" x="255" y="55" width="58" height="165" rx="4"/><rect class="nyx-chart-bar" data-series="secondary" x="330" y="105" width="58" height="115" rx="4"/><rect class="nyx-chart-bar" x="440" y="78" width="58" height="142" rx="4"/><rect class="nyx-chart-bar" data-series="secondary" x="515" y="142" width="58" height="78" rx="4"/></svg>`),
  }),
  page({
    path: paths.components.visualization.accessibleSummary,
    categoryId: "visualization",
    categoryLabel: "Visualization",
    title: "Accessible Chart Summary",
    description: "Charts include an accessible name, a text summary, and a table alternative when exact values matter.",
    searchTerms: "chart accessible summary table exact values screen reader",
    body: card("Accessible summary", `<p style="margin-top:0;color:var(--nyx-muted)">Charts always include an accessible name, text summary, and a table alternative for exact values.</p><table class="nyx-table"><thead><tr><th>Period</th><th>Requests</th></tr></thead><tbody><tr><td>14:00</td><td>42,140</td></tr><tr><td>16:00</td><td>64,820</td></tr><tr><td>18:00</td><td>81,240</td></tr></tbody></table>`),
  }),
];
