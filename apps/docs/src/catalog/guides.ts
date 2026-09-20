import { paths } from "../routes.js";
import { codeBlock, page } from "./shared.js";
import { adoptionPage } from "./adoption.js";

function prose(title: string, body: string): string {
  return `<section class="docs-prose-section"><h2>${title}</h2>${body}</section>`;
}

const installCommand = `pnpm add @nyx-ui/core @nyx-ui/plugins`;
const tailwindSetup = `@import "tailwindcss";
@source "../src/**/*.{html,js,ts,jsx,tsx}";
@source "../node_modules/@nyx-ui/core/src/**/*.css";
@import "@nyx-ui/core";`;
const fontSetup = `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />`;
const behaviorSetup = `import { initDialogs } from "@nyx-ui/plugins/dialog";

const root = document.querySelector("#account-settings");
const dialogs = initDialogs(root);

// Before removing or replacing the rendered subtree:
dialogs.forEach((dialog) => dialog.destroy());`;
const explicitSetup = `import { NyxDialog } from "@nyx-ui/plugins/dialog";

const element = document.querySelector("dialog[data-nyx-dialog]");
const dialog = new NyxDialog(element, {
  closeOnEscape: true,
  closeOnBackdrop: true,
});

dialog.open();
dialog.destroy();`;
const eventSetup = `root.addEventListener("nyx:dialog:before-close", (event) => {
  if (hasUnsavedChanges()) event.preventDefault();
});

root.addEventListener("nyx:dialog:close", (event) => {
  persistCloseReason(event.detail.reason);
});`;
const themeSetup = `<html data-nyx-theme="signal">`;
const tokenSetup = `@import "@nyx-ui/core";

:root {
  --nyx-accent: #7cf6d4;
  --nyx-accent-hi: #a8ffe8;
  --nyx-accent-ink: #03120e;
  --nyx-radius-control: 0.25rem;
  --nyx-radius-panel: 0.375rem;
}`;
const reactSetup = `import { useEffect, useRef } from "react";
import { initDialogs } from "@nyx-ui/plugins/dialog";

export function AccountDialog() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const instances = initDialogs(root);
    const dialog = root.querySelector("[data-nyx-dialog]");
    const protectUnsavedWork = (event) => {
      if (hasUnsavedChanges()) event.preventDefault();
    };

    dialog?.addEventListener("nyx:dialog:before-close", protectUnsavedWork);
    return () => {
      dialog?.removeEventListener("nyx:dialog:before-close", protectUnsavedWork);
      instances.forEach((instance) => instance.destroy());
    };
  }, []);

  return <section ref={rootRef}>{/* Copy the registry markup here. */}</section>;
}`;

export const guidePages = [
  adoptionPage,
  page({
    path: paths.guides.installation,
    categoryLabel: "Getting started",
    title: "Installation",
    navigationLabel: "Installation",
    description: "Install the CSS foundation, add behavior only where it is needed, and make component source visible to the compiler.",
    searchTerms: "install package getting started css plugins tailwind source build step",
    body: `<div class="docs-prose">
      ${prose("Start with a working screen", `<p><a class="nyx-link" href="/guides/render-workspace">Run the render workspace</a> for a complete installation, font, theme, event, and cleanup example.</p>`)}
      ${prose("Packages", `<p><code>@nyx-ui/core</code> supplies the token layers, themes, foundations, and component CSS. <code>@nyx-ui/plugins</code> supplies optional DOM behavior through per-component ESM subpaths.</p>${codeBlock(installCommand, "shell", "Shell")}`)}
      ${prose("Tailwind CSS 4 setup", `<p>Import the compiler, register your application and Nyx source locations, then import the Nyx stylesheet. Keep the <code>@source</code> entries accurate for every place copied markup can live so its classes are detected.</p>${codeBlock(tailwindSetup, "css", "CSS")}`)}
      ${prose("Load the font", `<p>Nyx declares JetBrains Mono but does not bundle font files. Load weights 400, 500, 600, and 700 in your document head, or self-host licensed font files with matching <code>@font-face</code> rules and <code>font-display: swap</code>. While loading, or if the request fails, the stack uses Cascadia Code, then the system monospace fallback. Layout stays usable; glyph shapes and text wrapping may differ.</p>${codeBlock(fontSetup, "html", "Document head")}`)}
      ${prose("Without a build step", `<p>Nyx does not currently publish a supported browser-CDN bundle or precompiled stylesheet. The source package and its theme integration require a CSS build. Plain HTML is the component contract, but a no-build distribution is not promised in version 0.1.</p>`)}
    </div>`,
  }),
  page({
    path: paths.guides.behavior,
    categoryLabel: "Getting started",
    title: "Behavior and JavaScript",
    navigationLabel: "Behavior",
    description: "Initialize only the rendered subtree, retain controller instances, and destroy them before that subtree is replaced.",
    searchTerms: "javascript behavior init constructor lifecycle destroy reinitialize events esm root",
    body: `<div class="docs-prose">
      ${prose("Root-scoped auto-initialization", `<p>Every <code>initX(root)</code> function searches the descendants and the root itself. Repeated calls return the existing controller for an already initialized element. After <code>destroy()</code>, the same markup can be initialized again.</p>${codeBlock(behaviorSetup, "js", "JavaScript")}`)}
      ${prose("Explicit construction", `<p>Use a constructor when your code already owns one element or needs constructor options. Keep the returned instance and destroy it with the same lifecycle as its DOM subtree.</p>${codeBlock(explicitSetup, "js", "JavaScript")}`)}
      ${prose("Events", `<p>State-changing operations emit a cancelable <code>before-*</code> event, then a non-cancelable after-event once state and focus are settled. Call <code>preventDefault()</code> on the before-event to veto the operation. Destruction is intentionally not vetoable.</p>${codeBlock(eventSetup, "js", "JavaScript")}`)}
      ${prose("Per-component imports", `<p>Import from subpaths such as <code>@nyx-ui/plugins/dialog</code>, <code>@nyx-ui/plugins/tabs</code>, or <code>@nyx-ui/plugins/toast</code>. This keeps unrelated controllers out of the consumer bundle.</p>`)}
    </div>`,
  }),
  page({
    path: paths.guides.theming,
    categoryLabel: "Getting started",
    title: "Theming and Customization",
    navigationLabel: "Theming",
    description: "Choose an accent theme at the root, then override stable semantic tokens in consumer CSS when the product needs a distinct expression.",
    searchTerms: "theming customization tokens solar signal flux plasma data nyx theme css override",
    body: `<div class="docs-prose">
      ${prose("Token layers", `<p>Nyx exposes compiler-facing theme variables such as <code>--color-nyx-panel</code> and runtime semantic variables such as <code>--nyx-panel</code>. Components consume the semantic layer. Accent utilities such as <code>text-nyx-accent</code> resolve <code>--nyx-accent</code> on the element, so both follow the nearest theme scope without recompilation.</p>`)}
      ${prose("Accent themes", `<p>Set <code>data-nyx-theme</code> on the document root or a containing subtree. The built-in values are <code>solar</code>, <code>signal</code>, <code>flux</code>, and <code>plasma</code>. Semantic success, warning, danger, and information colors retain their meaning across accents.</p>${codeBlock(themeSetup, "html", "HTML")}<section data-nyx-theme="plasma" class="nyx-panel nyx-panel-body"><span class="text-nyx-accent">Scoped plasma accent</span><button class="nyx-button" data-variant="primary" type="button">Plasma action</button><section data-nyx-theme="solar"><span class="text-nyx-accent">Nested solar accent</span></section></section>`)}
      ${prose("Consumer overrides", `<p>Load Nyx first, then override semantic variables in your own stylesheet. Prefer changing a small, named token set over targeting internal component selectors.</p>${codeBlock(tokenSetup, "css", "CSS")}`)}
    </div>`,
  }),
  page({
    path: paths.guides.accessibility,
    categoryLabel: "Getting started",
    title: "Accessibility",
    navigationLabel: "Accessibility",
    description: "Nyx provides semantic source and interaction contracts; consumers retain responsibility for content, composition, and application-level validation.",
    searchTerms: "accessibility aria keyboard browser baseline 2024 consumer responsibility",
    body: `<div class="docs-prose">
      ${prose("Project stance", `<p>Accessibility is part of component behavior: native elements, visible focus, keyboard operation, focus return, labels, descriptions, live regions, and state synchronization are designed together. Every interactive component page documents its keyboard and ARIA contract.</p>`)}
      ${prose("Browser floor", `<p>Nyx targets the Baseline 2024 browser floor. Native dialog, the Popover API, <code>inert</code>, <code>:has()</code>, and internationalization APIs are required. Nyx does not ship polyfills or legacy fallback branches for these capabilities.</p>`)}
      ${prose("What Nyx guarantees", `<p>Unmodified registry examples provide the documented semantics, focus behavior, keyboard behavior, ARIA state management, and reduced-motion treatment implemented by the corresponding CSS and controller.</p>`)}
      ${prose("Consumer responsibility", `<p>You must preserve accessible names and relationships when editing markup, provide meaningful content and alternative text, manage validation and application state, test completed compositions with keyboards and assistive technology, and avoid introducing contrast or focus regressions through token overrides.</p>`)}
    </div>`,
  }),
  page({
    path: paths.guides.registry,
    categoryLabel: "Getting started",
    title: "Registry and Open Code",
    navigationLabel: "Registry",
    description: "Component markup is source you take into your project, review, and edit; it is not an opaque runtime renderer.",
    searchTerms: "registry open code copy markup source own edit component html",
    body: `<div class="docs-prose">
      ${prose("Source ownership", `<p>Each component entry in <code>registry/registry.json</code> points to canonical HTML and lists its package requirements. The same raw file renders the documentation example and supplies the displayed source, preventing a second documentation-only copy from drifting.</p>`)}
      ${prose("Taking a component", `<ol><li>Open the component page and copy the relevant HTML example.</li><li>Place it in a source file registered with <code>@source</code>.</li><li>Install <code>@nyx-ui/core</code> and, for interactive components, only the documented plugin subpath.</li><li>Edit the owned markup while preserving the documented semantic and ARIA relationships.</li></ol>`)}
    </div>`,
  }),
  page({
    path: paths.guides.react,
    categoryLabel: "Integration",
    title: "React Integration",
    navigationLabel: "React",
    description: "Use the stable DOM contract directly today: initialize within a ref on mount and destroy every controller during cleanup.",
    searchTerms: "react integration guide ref effect lifecycle events no adapter",
    body: `<div class="docs-prose">
      ${prose("Current status", `<p>Nyx does not provide a React adapter package yet. Framework adapters follow only after the HTML contract is stable; this lifecycle pattern is the documented integration path for now.</p>`)}
      ${prose("Mount, events, and cleanup", `<p>Render copied registry markup beneath one ref. Initialize that root in an effect, attach cancelable event handlers to the owning element, and remove handlers plus controllers from the effect cleanup.</p>${codeBlock(reactSetup, "js", "JSX")}`)}
      ${prose("Controlled decisions", `<p>Use cancelable before-events to keep application state authoritative. Do not reconstruct plugin state during render; call public methods from effects or event handlers, and let after-events confirm that the DOM transition completed.</p>`)}
    </div>`,
  }),
];
