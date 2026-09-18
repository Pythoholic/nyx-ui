import dataDisplayMarkup from "../../../../registry/components/data-display.html?raw";
import dataTableMarkup from "../../../../registry/components/data-table.html?raw";
import { paths } from "../routes.js";
import { card, page } from "./shared.js";

export const dataPages = [
  page({
    path: paths.components.dataDisplay.records,
    categoryId: "data-display",
    categoryLabel: "Data Display",
    title: "Metrics, Records, and Activity",
    description: "Operational data stays scannable through tabular numbers, strong row boundaries, explicit status, accessible tables, and expandable detail.",
    searchTerms: "data stat card description list table jobs workflow timeline log code record expandable",
    body: card("Metrics, records, and activity", `<div class="docs-stack">${dataDisplayMarkup}</div>`, "Registry source", dataDisplayMarkup),
  }),
  page({
    path: paths.components.dataDisplay.dataTable,
    categoryId: "data-display",
    categoryLabel: "Data Display",
    title: "Advanced Data Table",
    description: "A preview enhancement for semantic tables adds client sorting, filtering, pagination, persistent row selection, and controlled server requests.",
    searchTerms: "advanced data table sort filter pagination selection row key controlled server comparator predicate semantic preview",
    plugins: ["data-table"],
    body: `<section class="docs-prose-section"><h2>Progressive table behavior</h2><p>The source remains a native <code>table</code>. Client mode sorts, filters, and paginates existing rows. Controlled mode emits the same cancelable transitions but leaves row replacement to the application; call <code>refresh()</code> after rendering a server response. Selection is stored by <code>data-row-key</code>, so changing pages does not discard it. Virtualization is intentionally outside this component.</p></section>${card("Sortable deployment jobs", dataTableMarkup, "Preview")}`,
  }),
];
