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
    body: card("Line chart", selectMarkup(visualizationMarkup, ["[data-nyx-example='line-chart']"]), "Registry source"),
  }),
  page({
    path: paths.components.visualization.sparklines,
    categoryId: "visualization",
    categoryLabel: "Visualization",
    title: "Sparklines",
    description,
    searchTerms: "chart sparkline trend rising stable falling compact",
    body: card("Sparkline", selectMarkup(visualizationMarkup, ["[data-nyx-example='sparkline']"]), "Registry source"),
  }),
  page({
    path: paths.components.visualization.barChart,
    categoryId: "visualization",
    categoryLabel: "Visualization",
    title: "Bar Chart",
    description,
    searchTerms: "chart bar column volume region data visualization",
    body: card("Bar chart", selectMarkup(visualizationMarkup, ["[data-nyx-example='bar-chart']"]), "Registry source"),
  }),
  page({
    path: paths.components.visualization.accessibleSummary,
    categoryId: "visualization",
    categoryLabel: "Visualization",
    title: "Accessible Chart Summary",
    description: "Charts include an accessible name, a text summary, and a table alternative when exact values matter.",
    searchTerms: "chart accessible summary table exact values screen reader",
    body: card("Accessible summary", selectMarkup(visualizationMarkup, ["[data-nyx-example='accessible-chart-summary']"]), "Registry source"),
  }),
];
