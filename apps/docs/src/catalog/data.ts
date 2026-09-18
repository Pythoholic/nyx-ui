import dataDisplayMarkup from "../../../../registry/components/data-display.html?raw";
import dataTableMarkup from "../../../../registry/components/data-table.html?raw";
import treeViewMarkup from "../../../../registry/components/tree-view.html?raw";
import activityFeedMarkup from "../../../../registry/components/activity-feed.html?raw";
import filterBarMarkup from "../../../../registry/components/filter-bar.html?raw";
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
    body: card("Metrics, records, and activity", dataDisplayMarkup, "Registry source"),
  }),
  page({
    path: paths.components.dataDisplay.activityFeed,
    categoryId: "data-display",
    categoryLabel: "Data Display",
    title: "Activity Feed",
    description: "A semantic chronological feed combines actors, actions, linked objects, timestamps, status, and optional quoted context.",
    searchTerms: "activity feed timeline audit history actor events chronological updates comments",
    body: `<section class="docs-prose-section"><h2>Readable chronology</h2><p>The ordered list is the source of sequence. Native <code>time</code>, links, and blockquotes retain their meaning without a JavaScript timeline role, while <code>aria-current</code> identifies the newest relevant event.</p></section>${card("Workspace activity", activityFeedMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.dataDisplay.filterBar,
    categoryId: "data-display",
    categoryLabel: "Data Display",
    title: "Filter Bar",
    description: "Native named controls become an atomic filter value with removable summaries, a polite count, clear-all behavior, and cancelable controlled integration.",
    searchTerms: "filter bar query status region checkbox facets chips clear active filters controlled",
    plugins: ["filter-bar"],
    body: `<section class="docs-prose-section"><h2>Native controls, one value</h2><p>The form remains usable without custom keyboard handling. The controller normalizes non-empty named values, restores the prior state when a change is canceled, and creates removable summaries from the current controls.</p></section>${card("Deployment filters", filterBarMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.dataDisplay.treeView,
    categoryId: "data-display",
    categoryLabel: "Data Display",
    title: "Tree View",
    description: "A semantic hierarchical list provides expansion, single or multiple selection, visible-item roving focus, and typeahead.",
    searchTerms: "tree view files hierarchy nested list expansion selection roving focus typeahead keyboard",
    plugins: ["tree-view"],
    body: `<section class="docs-prose-section"><h2>Visible-set navigation</h2><p>Every arrow-key and typeahead action derives a fresh ordered list from branches whose ancestors are expanded. Collapsed descendants therefore never receive focus. Nested lists remain native <code>ul</code>/<code>li</code> structures while the controller maintains the complete tree ARIA model.</p></section>${card("Workspace files", treeViewMarkup, "Registry source")}`,
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
