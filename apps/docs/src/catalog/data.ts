import dataDisplayMarkup from "../../../../registry/components/data-display.html?raw";
import { card, section } from "./shared.js";

export const dataSection = section(
  "data",
  "12",
  "Data display",
  "Operational data stays scannable through tabular numbers, strong row boundaries, explicit status, accessible tables, and expandable detail.",
  `<div class="docs-stack">
    ${card("Metrics, records, and activity", `<div class="docs-stack">${dataDisplayMarkup}</div>`)}
  </div>`,
  "data stat card description list table jobs workflow timeline log code record expandable",
);
