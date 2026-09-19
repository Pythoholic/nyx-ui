import mediaMarkup from "../../../../registry/components/media.html?raw";
import imageLightboxMarkup from "../../../../registry/components/image-lightbox.html?raw";
import mediaCarouselMarkup from "../../../../registry/components/media-carousel.html?raw";
import uploadDropzoneMarkup from "../../../../registry/components/upload-dropzone.html?raw";
import batchProgressMarkup from "../../../../registry/components/batch-progress-monitor.html?raw";
import { paths } from "../routes.js";
import { card, page, selectMarkup } from "./shared.js";

export const mediaPages = [
  page({
    path: paths.components.media.imageLightbox,
    categoryId: "media",
    categoryLabel: "Media",
    title: "Image Lightbox",
    description: "A modal image viewer composes native dialog focus and dismissal with indexed gallery navigation, synchronized captions, and focus return.",
    searchTerms: "media image lightbox gallery modal viewer zoom next previous caption dialog",
    plugins: ["image-lightbox"],
    body: `<section class="docs-prose-section"><h2>A gallery that remains a document</h2><p>Every thumbnail is a named native button containing a real image. Opening the viewer preserves that authored source, alternative text, and caption while the existing Dialog controller owns modal focus, dismissal, scroll locking, and focus return.</p></section>${card("Mission gallery", imageLightboxMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.media.mediaCarousel,
    categoryId: "media",
    categoryLabel: "Media",
    title: "Media Carousel",
    description: "A figure-based media collection specializes the shared carousel engine without introducing a second navigation model.",
    searchTerms: "media carousel slideshow gallery figure previous next indicators loop",
    plugins: ["media-carousel"],
    body: `<section class="docs-prose-section"><h2>Media is a carousel composition</h2><p>Figures and captions provide the media vocabulary; the existing carousel controller continues to own ordered selection, hidden state, controls, position announcements, cancellation, and lifecycle cleanup.</p></section>${card("Selected media", mediaCarouselMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.media.uploadDropzone,
    categoryId: "media",
    categoryLabel: "Media",
    title: "Upload Dropzone with Queue",
    description: "A native file input is enhanced with drag state, validation, image previews, an accessible queue, progress, abort cleanup, and consumer-owned transport.",
    searchTerms: "media upload dropzone drag drop queue files preview progress transport validation",
    plugins: ["upload-dropzone"],
    body: `<section class="docs-prose-section"><h2>Dropping is an enhancement</h2><p>The visible surface remains a label for a native multiple file input. Nyx validates and presents the queue, revokes generated previews, and reports progress, while an application adapter owns network transport.</p></section>${card("Production asset queue", uploadDropzoneMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.media.batchProgressMonitor,
    categoryId: "media",
    categoryLabel: "Media",
    title: "Batch Progress Monitor",
    description: "An ordered batch view specializes the shared generation queue for application-owned export and processing jobs.",
    searchTerms: "media batch progress monitor jobs exports processing cancel retry queue",
    plugins: ["batch-progress-monitor"],
    body: `<section class="docs-prose-section"><h2>Monitoring without owning the work</h2><p>The component reflects queued, running, complete, failed, and canceled jobs. Applications perform the actual processing and publish state through the shared queue method; cancelable events keep that boundary explicit.</p></section>${card("Campaign deliverables", batchProgressMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.media.gallery,
    categoryId: "media",
    categoryLabel: "Media",
    title: "Media Gallery",
    description: "Media cards combine an accessible preview, production metadata, status, and concise actions.",
    searchTerms: "media preview gallery card image status actions library",
    body: `<section class="docs-prose-section"><h2>Use when preview and metadata belong together</h2><p>The image needs alternative text appropriate to its purpose, while status and production facts remain visible text. Keep actions native and name them for the specific asset when multiple cards appear together. Loading, selection, and media transport are not part of this static card.</p></section>${card("Media card", selectMarkup(mediaMarkup, ["[data-nyx-example='media-card']"]), "Registry source")}`,
  }),
  page({
    path: paths.components.media.rating,
    categoryId: "media",
    categoryLabel: "Media",
    title: "Rating",
    description: "Rating uses native radio inputs and individually named choices beneath the star presentation.",
    searchTerms: "media rating stars radio score choice",
    body: `<section class="docs-prose-section"><h2>Use for one value from an ordered scale</h2><p>The stars are presentation over a native radio group, so preserve the fieldset, legend, and individually named choices. Explain what the endpoints mean when the scale is not obvious. Submission, persistence, and whether a rating may be changed remain application decisions.</p></section>${card("Rating", selectMarkup(mediaMarkup, ["[data-nyx-example='rating']"]), "Registry source")}`,
  }),
  page({
    path: paths.components.media.protectedMedia,
    categoryId: "media",
    categoryLabel: "Media",
    title: "Protected Media",
    description: "Protected previews explain why content is concealed and require an explicit reveal action.",
    searchTerms: "media protected sensitive reveal preview access lock",
    body: `<section class="docs-prose-section"><h2>Concealment is not authorization</h2><p>This pattern warns before revealing visually sensitive material. The application must still enforce access on the media request; hidden markup and CSS do not protect a source URL. Keep the reason visible, use a named native reveal button, and decide whether consent lasts for one item or the session.</p></section>${card("Protected media", selectMarkup(mediaMarkup, ["[data-nyx-example='protected-media']"]), "Registry source")}`,
  }),
  page({
    path: paths.components.media.batchPlan,
    categoryId: "media",
    categoryLabel: "Media",
    title: "Batch Plan",
    description: "Batch plans combine selection, production constraints, and progress in a reusable action surface.",
    searchTerms: "media batch plan selected outputs variations progress production",
    body: `<section class="docs-prose-section"><h2>Review parameters before costly work</h2><p>Use the plan as a confirmation surface when selected inputs, output count, and constraints should be visible together. The progress element describes current work but does not run it. The application validates combinations, calculates totals, starts processing, and handles cancellation or partial failure.</p></section>${card("Batch plan", selectMarkup(mediaMarkup, ["[data-nyx-example='batch-plan']"]), "Registry source")}`,
  }),
];
