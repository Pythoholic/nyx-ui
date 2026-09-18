import chatThreadMarkup from "../../../../registry/components/chat-thread.html?raw";
import promptComposerMarkup from "../../../../registry/components/prompt-composer.html?raw";
import messageScrollerMarkup from "../../../../registry/components/message-scroller.html?raw";
import attachmentPreviewsMarkup from "../../../../registry/components/attachment-previews.html?raw";
import generationQueueMarkup from "../../../../registry/components/generation-queue.html?raw";
import modelSelectorMarkup from "../../../../registry/components/model-selector.html?raw";
import parameterInspectorMarkup from "../../../../registry/components/parameter-inspector.html?raw";
import beforeAfterMarkup from "../../../../registry/components/before-after.html?raw";
import { paths } from "../routes.js";
import { card, page } from "./shared.js";

export const aiPages = [
  page({
    path: paths.components.ai.chatThread,
    categoryId: "ai",
    categoryLabel: "AI Patterns",
    title: "Chat Bubbles and Message Threads",
    description: "Semantic transcripts distinguish participants and delivery state without replacing document structure with an application role.",
    searchTerms: "ai chat bubble message thread transcript assistant user conversation pending response",
    body: `<section class="docs-prose-section"><h2>Conversation remains a document</h2><p>The thread is an ordered list because sequence matters. Each message is an article with a visible author and, when available, a native timestamp. Historical content is not a live region; applications should announce only genuinely new responses.</p></section>${card("Release planning thread", chatThreadMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.ai.promptComposer,
    categoryId: "ai",
    categoryLabel: "AI Patterns",
    title: "Prompt Composer",
    description: "A native form coordinates prompt validity, character count, cancelable submission, and an explicit keyboard shortcut without owning transport.",
    searchTerms: "ai prompt composer textarea send submit keyboard shortcut character count message",
    plugins: ["prompt-composer"],
    body: `<section class="docs-prose-section"><h2>Composition stops at submission</h2><p>The textarea remains the editable source of truth. Nyx synchronizes its state and emits a prompt value, while the application decides how to send it, append messages, stream a response, or report a transport failure.</p></section>${card("New prompt", promptComposerMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.ai.messageScroller,
    categoryId: "ai",
    categoryLabel: "AI Patterns",
    title: "Message Scroller",
    description: "A transcript viewport follows streaming content at the end, pauses when the reader scrolls away, and counts new messages without stealing focus.",
    searchTerms: "ai message scroller streaming transcript follow latest unread jump conversation",
    plugins: ["message-scroller"],
    body: `<section class="docs-prose-section"><h2>Reading position belongs to the reader</h2><p>Following is active only at the end of the viewport. Scrolling into history pauses it, leaves focus untouched, and reports marked messages through a compact jump control. Applications still own message creation and response announcements.</p></section>${card("Following conversation", messageScrollerMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.ai.attachmentPreviews,
    categoryId: "ai",
    categoryLabel: "AI Patterns",
    title: "Attachment Previews",
    description: "Semantic file previews expose stable identifiers, synchronized count and empty state, and cancelable removal without owning file selection or upload transport.",
    searchTerms: "ai attachment preview file image document remove restore prompt context",
    plugins: ["attachment-previews"],
    body: `<section class="docs-prose-section"><h2>Preview state stays reversible</h2><p>Nyx owns presentation and removal state for already selected files. The application owns file acquisition, validation, object URL creation and revocation, transport, and whether a canceled removal should be restored.</p></section>${card("Prompt attachments", attachmentPreviewsMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.ai.generationQueue,
    categoryId: "ai",
    categoryLabel: "AI Patterns",
    title: "Generation Queue",
    description: "An ordered work queue keeps progress, lifecycle state, aggregate activity, and cancel, retry, and removal controls synchronized without owning transport.",
    searchTerms: "ai generation queue render progress cancel retry job task pipeline",
    plugins: ["generation-queue"],
    body: `<section class="docs-prose-section"><h2>State management without transport</h2><p>Nyx reflects application-owned work as queued, running, complete, failed, or canceled. Cancelable events create the transport boundary; the application performs the operation and can publish later progress through <code>setStatus()</code>.</p></section>${card("Render queue", generationQueueMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.ai.modelSelector,
    categoryId: "ai",
    categoryLabel: "AI Patterns",
    title: "Model Selector",
    description: "A native radio group presents mutually exclusive model profiles with descriptive metadata and a controlled selection boundary.",
    searchTerms: "ai model selector radio inference profile latency quality fidelity",
    plugins: ["model-selector"],
    body: `<section class="docs-prose-section"><h2>Selection remains native</h2><p>Models are mutually exclusive choices, so the component preserves a fieldset, legend, and radio inputs instead of recreating selection with an application role. Metadata is authored content; applications own availability and pricing.</p></section>${card("Inference model", modelSelectorMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.ai.parameterInspector,
    categoryId: "ai",
    categoryLabel: "AI Patterns",
    title: "Parameter Inspector",
    description: "A native parameter form exposes typed values, validity, modified state, synchronized outputs, and reversible reset behavior.",
    searchTerms: "ai parameter inspector settings guidance steps aspect ratio generation controls",
    plugins: ["parameter-inspector"],
    body: `<section class="docs-prose-section"><h2>Parameters remain ordinary form data</h2><p>The inspector reads named native controls into a typed record and tracks the initial snapshot. It does not prescribe a model schema or submit a generation request, so applications can compose only the controls their model supports.</p></section>${card("Generation parameters", parameterInspectorMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.ai.beforeAfter,
    categoryId: "ai",
    categoryLabel: "AI Patterns",
    title: "Before/After Comparison",
    description: "A keyboard-operable range control reveals an enhanced result while exposing the comparison position in text and synchronized state.",
    searchTerms: "ai before after comparison image reveal slider original enhanced",
    plugins: ["before-after"],
    body: `<section class="docs-prose-section"><h2>Comparison does not require dragging</h2><p>The reveal follows a native range input, so pointer, touch, and keyboard users share one value model. Only the original illustration is announced as an image; the visual overlay is hidden to avoid duplicate descriptions.</p></section>${card("Concept enhancement", beforeAfterMarkup, "Registry source")}`,
  }),
];
