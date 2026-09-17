import { icon } from "../icons.js";
import { card, section } from "./shared.js";

const galleryCards = ["Aurora field", "Night structure", "Signal study"]
  .map((title, index) => `<article class="nyx-panel nyx-media-card"><div class="nyx-media-preview">${icon("image")}</div><div class="nyx-media-body"><div class="docs-row" style="justify-content:space-between"><strong>${title}</strong><span class="nyx-badge">0${index + 1}</span></div><span class="nyx-field-hint">2048 × 1365 · WEBP</span><div class="docs-row"><button class="nyx-button" data-size="small">Open</button><button class="nyx-button nyx-icon-button" data-size="small" aria-label="More actions">${icon("menu")}</button></div></div></article>`)
  .join("");

const rating = [5, 4, 3, 2, 1]
  .map((value) => `<input id="rating-${value}" name="rating" type="radio" value="${value}"${value === 4 ? " checked" : ""}/><label for="rating-${value}" aria-label="${value} stars">${icon("star")}</label>`)
  .join("");

export const mediaSection = section(
  "media",
  "14",
  "Media and production",
  "Media patterns cover previews, gallery cards, ratings, protected content, uploads, batch plans, progress, and reusable action surfaces.",
  `<div class="docs-gallery-grid">${galleryCards}</div>
  <div class="docs-grid" style="margin-top:var(--nyx-space-4)">
    ${card("Rating and protected media", `<div class="docs-column"><fieldset class="nyx-rating" aria-label="Rating">${rating}</fieldset><div class="nyx-sensitive">${icon("lock")}<div><strong>Protected preview</strong><p style="margin:.5rem 0 0;color:var(--nyx-muted)">Confirm access before revealing this asset.</p></div><button class="nyx-button">Reveal preview</button></div></div>`)}
    ${card("Batch plan", `<div class="docs-column"><article class="nyx-panel nyx-batch-tile" data-selected="true"><div class="docs-row" style="justify-content:space-between"><strong>Balanced plan</strong><span class="nyx-badge">Selected</span></div><p style="margin:0;color:var(--nyx-muted)">12 outputs · two variations · high fidelity</p><div class="nyx-progress"><div class="nyx-progress-bar" style="--nyx-progress:72%"></div></div></article><article class="nyx-panel nyx-batch-tile"><strong>Rapid plan</strong><p style="margin:0;color:var(--nyx-muted)">6 outputs · one variation · preview quality</p></article></div>`)}
  </div>`,
  "media preview gallery card upload rating protected sensitive action batch plan progress library",
);
