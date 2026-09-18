import chatThreadMarkup from "../../../../registry/components/chat-thread.html?raw";
import promptComposerMarkup from "../../../../registry/components/prompt-composer.html?raw";
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
];
