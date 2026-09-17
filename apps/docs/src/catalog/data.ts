import dataDisplayMarkup from "../../../../registry/components/data-display.html?raw";
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
];
