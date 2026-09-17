import { icon } from "../icons.js";
import { paths } from "../routes.js";
import { card, page } from "./shared.js";

const galleryCards = ["Aurora field", "Night structure", "Signal study"]
  .map((title, index) => `<article class="nyx-panel nyx-media-card"><div class="nyx-media-preview">${icon("image")}</div><div class="nyx-media-body"><div class="docs-row" style="justify-content:space-between"><strong>${title}</strong><span class="nyx-badge">0${index + 1}</span></div><span class="nyx-field-hint">2048 × 1365 · WEBP</span><div class="docs-row"><button class="nyx-button" data-size="small">Open</button><button class="nyx-button nyx-icon-button" data-size="small" aria-label="More actions">${icon("menu")}</button></div></div></article>`)
  .join("");

const rating = [5, 4, 3, 2, 1]
  .map((value) => `<input id="rating-${value}" name="rating" type="radio" value="${value}"${value === 4 ? " checked" : ""}/><label for="rating-${value}" aria-label="${value} stars">${icon("star")}</label>`)
  .join("");

export const mediaPages = [
  page({
    path: paths.components.media.gallery,
    categoryId: "media",
    categoryLabel: "Media",
    title: "Media Gallery",
    description: "Media cards combine an accessible preview, production metadata, status, and concise actions.",
    searchTerms: "media preview gallery card image status actions library",
    body: `<div class="docs-gallery-grid">${galleryCards}</div>`,
  }),
  page({
    path: paths.components.media.rating,
    categoryId: "media",
    categoryLabel: "Media",
    title: "Rating",
    description: "Rating uses native radio inputs and individually named choices beneath the star presentation.",
    searchTerms: "media rating stars radio score choice",
    body: card("Rating", `<fieldset class="nyx-rating" aria-label="Rating">${rating}</fieldset>`),
  }),
  page({
    path: paths.components.media.protectedMedia,
    categoryId: "media",
    categoryLabel: "Media",
    title: "Protected Media",
    description: "Protected previews explain why content is concealed and require an explicit reveal action.",
    searchTerms: "media protected sensitive reveal preview access lock",
    body: card("Protected media", `<div class="nyx-sensitive">${icon("lock")}<div><strong>Protected preview</strong><p style="margin:.5rem 0 0;color:var(--nyx-muted)">Confirm access before revealing this asset.</p></div><button class="nyx-button">Reveal preview</button></div>`),
  }),
  page({
    path: paths.components.media.batchPlan,
    categoryId: "media",
    categoryLabel: "Media",
    title: "Batch Plan",
    description: "Batch plans combine selection, production constraints, and progress in a reusable action surface.",
    searchTerms: "media batch plan selected outputs variations progress production",
    body: card("Batch plan", `<div class="docs-column"><article class="nyx-panel nyx-batch-tile" data-selected="true"><div class="docs-row" style="justify-content:space-between"><strong>Balanced plan</strong><span class="nyx-badge">Selected</span></div><p style="margin:0;color:var(--nyx-muted)">12 outputs · two variations · high fidelity</p><div class="nyx-progress"><div class="nyx-progress-bar" style="--nyx-progress:72%"></div></div></article><article class="nyx-panel nyx-batch-tile"><strong>Rapid plan</strong><p style="margin:0;color:var(--nyx-muted)">6 outputs · one variation · preview quality</p></article></div>`),
  }),
];
