import registrySource from "../../../../registry/registry.json?raw";
import { paths } from "../routes.js";
import { codeBlock, page } from "./shared.js";
import { adoptionPage } from "./adoption.js";

function prose(title: string, body: string): string {
  return `<section class="docs-prose-section"><h2>${title}</h2>${body}</section>`;
}

const installCommand = `pnpm add @nyx-raul/core@beta @nyx-raul/plugins@beta`;
const tailwindSetup = `@import "tailwindcss";
@source "../src/**/*.{html,js,ts,jsx,tsx}";
@source "../node_modules/@nyx-raul/core/src/**/*.css";
@import "@nyx-raul/core";`;
const fontSetup = `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />`;
const behaviorSetup = `import { initDialogs } from "@nyx-raul/plugins/dialog";

const root = document.querySelector("#account-settings");
const dialogs = initDialogs(root);

// Before removing or replacing the rendered subtree:
dialogs.forEach((dialog) => dialog.destroy());`;
const explicitSetup = `import { NyxDialog } from "@nyx-raul/plugins/dialog";

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
const registryEntry = `{
  "name": "dialog",
  "type": "component",
  "status": "stable",
  "files": ["components/dialog.html"],
  "requires": ["@nyx-raul/core", "@nyx-raul/plugins/dialog"]
}`;
const registryAdoption = `# Copy the canonical structure into application source
cp registry/components/dialog.html src/components/account-dialog.html

# Keep shared presentation and optional behavior as dependencies
pnpm add @nyx-raul/core@beta @nyx-raul/plugins@beta`;
interface AiRegistryItem {
  name: string;
  type: string;
  status: string;
  description?: string;
  useWhen?: string[];
  avoidWhen?: string[];
  files: string[];
  requires: string[];
  initializer?: { import: string; function: string; selector: string };
  accessibility?: { requirements: string[] };
  related?: string[];
}

const aiRegistry = JSON.parse(registrySource) as { items: AiRegistryItem[] };
const tooltipAiContract = aiRegistry.items.find((item) => item.name === "tooltip");
if (!tooltipAiContract) throw new Error("The AI integration guide requires the tooltip registry contract.");
const tooltipAiContractSource = JSON.stringify(tooltipAiContract, null, 2);
const aiPrompt = `Add concise help to the icon-only deployment settings control using Nyx.
Use the correct component, preserve keyboard access, and include cleanup.`;
const aiResult = `Selected: tooltip
Reason: the request is brief, descriptive, and non-interactive.

Copy: registry/components/tooltip.html
Install: @nyx-raul/core@beta and @nyx-raul/plugins@beta
Initialize: initTooltips(root)

Guardrails:
- Keep the trigger as a native focusable control.
- Do not put links or buttons inside the tooltip.
- Retain controller instances and destroy them before replacing root.`;
const mcpRun = `npx -y @nyx-raul/mcp@beta`;
const skillInstall = `npx skills add Pythoholic/nyx-ui --skill nyx-ui`;
const codexMcpConfig = `[mcp_servers.nyx]
command = "npx"
args = ["-y", "@nyx-raul/mcp@beta"]
enabled_tools = [
  "list_components",
  "search_components",
  "get_component_contract",
  "get_component_source",
]`;
const claudeMcpConfig = `{
  "mcpServers": {
    "nyx": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@nyx-raul/mcp@beta"]
    }
  }
}`;
const tokenSetup = `@import "@nyx-raul/core";

:root {
  --nyx-accent: #7cf6d4;
  --nyx-accent-hi: #a8ffe8;
  --nyx-accent-ink: #03120e;
  --nyx-radius-control: 0.25rem;
  --nyx-radius-panel: 0.375rem;
}`;
const reactSetup = `import { useEffect, useRef } from "react";
import { initDialogs } from "@nyx-raul/plugins/dialog";

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
      ${prose("Packages", `<p><code>@nyx-raul/core</code> supplies the token layers, themes, foundations, and component CSS. <code>@nyx-raul/plugins</code> supplies optional DOM behavior through per-component ESM subpaths.</p>${codeBlock(installCommand, "shell", "Shell")}`)}
      ${prose("Tailwind CSS 4 setup", `<p>Import the compiler, register your application and Nyx source locations, then import the Nyx stylesheet. Keep the <code>@source</code> entries accurate for every place copied markup can live so its classes are detected.</p>${codeBlock(tailwindSetup, "css", "CSS")}`)}
      ${prose("Load the font", `<p>Nyx declares JetBrains Mono but does not bundle font files. Load weights 400, 500, 600, and 700 in your document head, or self-host licensed font files with matching <code>@font-face</code> rules and <code>font-display: swap</code>. While loading, or if the request fails, the stack uses Cascadia Code, then the system monospace fallback. Layout stays usable; glyph shapes and text wrapping may differ.</p>${codeBlock(fontSetup, "html", "Document head")}`)}
      ${prose("Without a build step", `<p>Nyx does not currently publish a supported browser-CDN bundle or precompiled stylesheet. The source package and its theme integration require a CSS build. Plain HTML is the component contract, but a no-build distribution is not included in the beta.</p>`)}
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
      ${prose("Per-component imports", `<p>Import from subpaths such as <code>@nyx-raul/plugins/dialog</code>, <code>@nyx-raul/plugins/tabs</code>, or <code>@nyx-raul/plugins/toast</code>. This keeps unrelated controllers out of the consumer bundle.</p>`)}
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
    description: "Nyx treats accessibility as an interaction contract shared by its markup, CSS, controllers, and the application that composes them.",
    searchTerms: "accessibility aria keyboard focus screen reader testing browser baseline 2024 consumer responsibility reduced motion",
    body: `<div class="docs-accessibility">
      <section class="docs-overview-lead" aria-labelledby="accessibility-approach">
        <div><span class="nyx-eyebrow">Approach</span><h2 id="accessibility-approach">Accessibility is part of component behavior</h2></div>
        <div class="docs-overview-copy">
          <p>Semantics, keyboard operation, visible focus, focus restoration, accessible names, live-region updates, and state synchronization are designed as one contract. They are not optional annotations added after a component is complete.</p>
          <p>Each interactive component page documents the relevant keyboard behavior, public state, and ARIA relationships. The registry source is the reference implementation that adopters begin from.</p>
        </div>
      </section>

      <section class="docs-overview-section" aria-labelledby="accessibility-ownership">
        <header class="docs-overview-section-head"><span class="nyx-eyebrow">Ownership</span><h2 id="accessibility-ownership">What Nyx provides—and what the application must provide</h2></header>
        <div class="docs-accessibility-columns">
          <article class="docs-accessibility-card">
            <h3>Provided by Nyx</h3>
            <ul>
              <li>Semantic, copyable HTML with explicit labels and relationships.</li>
              <li>Keyboard behavior and focus management for custom interactions.</li>
              <li>ARIA state synchronization where native HTML is not sufficient.</li>
              <li>Visible focus treatment, semantic color tokens, and reduced-motion CSS.</li>
              <li>Documented events so application state can accept or prevent transitions.</li>
            </ul>
          </article>
          <article class="docs-accessibility-card">
            <h3>Owned by the application</h3>
            <ul>
              <li>Meaningful labels, instructions, alternative text, and error messages.</li>
              <li>Correct heading structure and landmarks in the completed screen.</li>
              <li>Validation timing, server errors, authorization, and business rules.</li>
              <li>Focus order and announcements across composed or dynamically replaced regions.</li>
              <li>Verification after markup, tokens, content, or controller behavior is adapted.</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="docs-overview-section" aria-labelledby="accessibility-verification">
        <header class="docs-overview-section-head">
          <span class="nyx-eyebrow">Verification</span>
          <h2 id="accessibility-verification">Test the completed workflow, not only the component</h2>
          <p>Automated checks are useful, but they cannot confirm that focus movement, announcements, reading order, and task completion make sense in context.</p>
        </header>
        <ol class="docs-accessibility-checklist">
          <li><span>01</span><div><strong>Keyboard</strong><p>Complete the primary and error-recovery paths without a pointer. Confirm focus remains visible and never disappears after state changes.</p></div></li>
          <li><span>02</span><div><strong>Screen reader</strong><p>Verify names, roles, descriptions, live updates, table relationships, dialog context, and the order in which changed content is announced.</p></div></li>
          <li><span>03</span><div><strong>Zoom and reflow</strong><p>Check the final screen at 200% zoom and narrow widths. Controls, error messages, and actions must remain available without two-dimensional page scrolling.</p></div></li>
          <li><span>04</span><div><strong>Color and motion</strong><p>Recheck contrast after theme overrides, preserve non-color state indicators, and exercise the workflow with reduced motion enabled.</p></div></li>
          <li><span>05</span><div><strong>Application states</strong><p>Cover loading, empty, error, validation, permission, success, cancellation, and destructive flows with realistic content.</p></div></li>
        </ol>
      </section>

      <section class="docs-accessibility-boundary" aria-labelledby="accessibility-browser-floor">
        <div>
          <span class="nyx-eyebrow">Compatibility boundary</span>
          <h2 id="accessibility-browser-floor">Modern browser primitives are required</h2>
        </div>
        <p>Nyx targets the Baseline 2024 browser floor and relies on native <code>dialog</code>, the Popover API, <code>inert</code>, <code>:has()</code>, and internationalization APIs. It does not include polyfills or legacy fallback branches. Confirm the browser and assistive-technology combinations required by your product before adoption.</p>
      </section>

      <aside class="docs-accessibility-note" aria-label="Accessibility conformance statement">
        <strong>No component library can make an application conformant by itself.</strong>
        <p>Nyx provides a tested starting contract. Conformance depends on the content, composition, workflows, target platforms, and changes made by the adopting team.</p>
      </aside>
    </div>`,
  }),
  page({
    path: paths.guides.registry,
    categoryLabel: "Getting started",
    title: "Registry and Open Code",
    navigationLabel: "Registry",
    description: "The registry is Nyx’s source distribution: inspect canonical HTML, copy it into your application, and retain ownership of the markup while shared CSS and optional controllers remain package dependencies.",
    searchTerms: "registry open code copy markup source ownership update compare maintain component html dependencies workflow",
    body: `<div class="docs-registry-guide">
      <section class="docs-overview-lead" aria-labelledby="registry-model">
        <div><span class="nyx-eyebrow">Distribution model</span><h2 id="registry-model">Source you can inspect, adapt, and maintain</h2></div>
        <div class="docs-overview-copy"><p>Nyx does not render components through an opaque package-owned wrapper. The registry contains canonical HTML compositions that become part of your application source. This keeps semantics, content structure, and application-specific changes visible in code review.</p><p>Copying markup does not remove all dependencies. <code>@nyx-raul/core</code> continues to provide tokens and component styles. Interactive patterns also import the documented <code>@nyx-raul/plugins/*</code> controller. Your application owns content, business logic, data, and the adapted HTML.</p></div>
      </section>

      <section class="docs-overview-section" aria-labelledby="registry-entry">
        <header class="docs-overview-section-head"><span class="nyx-eyebrow">Manifest</span><h2 id="registry-entry">Every entry declares what to copy and what to install</h2><p><code>registry/registry.json</code> is the inventory. An entry names the canonical files, maturity, and package requirements; the component page renders that same source and documents its interaction contract.</p></header>
        <div class="docs-registry-manifest">${codeBlock(registryEntry, "js", "registry/registry.json")}<dl class="docs-registry-definitions"><div><dt>Name and type</dt><dd>Identify the component, component group, reference, or complete example.</dd></div><div><dt>Status</dt><dd>Communicates the entry’s current release maturity.</dd></div><div><dt>Files</dt><dd>Lists the canonical source to copy or inspect.</dd></div><div><dt>Requires</dt><dd>Lists shared CSS and any behavior subpath that remains a dependency.</dd></div></dl></div>
      </section>

      <section class="docs-overview-section" aria-labelledby="registry-workflow">
        <header class="docs-overview-section-head"><span class="nyx-eyebrow">Adoption workflow</span><h2 id="registry-workflow">From catalog example to product-owned component</h2></header>
        <ol class="docs-registry-steps"><li><span>01</span><div><strong>Evaluate the live behavior</strong><p>Use the preview with keyboard and pointer input. Read its guidance, accessibility contract, events, methods, and ownership boundaries.</p></div></li><li><span>02</span><div><strong>Copy canonical markup</strong><p>Copy the displayed HTML or the file named by the manifest into a source location included by your Tailwind <code>@source</code> configuration.</p></div></li><li><span>03</span><div><strong>Install only required packages</strong><p>Keep Core for presentation. Add the documented plugin subpath only when the component has controller-managed behavior.</p></div></li><li><span>04</span><div><strong>Adapt within the contract</strong><p>Change content and composition while preserving native semantics, accessible names, ID relationships, state hooks, and the documented controller lifecycle.</p></div></li><li><span>05</span><div><strong>Connect application concerns</strong><p>Add data, validation, authorization, persistence, transport, analytics, and error handling through native or Nyx events.</p></div></li><li><span>06</span><div><strong>Verify the completed workflow</strong><p>Test realistic success, empty, loading, failure, and destructive states with keyboard, assistive technology, zoom, and reduced motion.</p></div></li></ol>
        ${codeBlock(registryAdoption, "shell", "Illustrative copy workflow")}
      </section>

      <section class="docs-registry-ownership" aria-labelledby="registry-ownership"><header><span class="nyx-eyebrow">Ownership boundary</span><h2 id="registry-ownership">Copying transfers control, not upstream synchronization</h2></header><div><p>Nyx maintains the canonical registry version, shared tokens, CSS, controller APIs, and documentation. After copying, your repository owns its local markup and every modification made to it.</p><p>Updates are deliberate: review upstream source and release notes, compare them with your local version, and port relevant fixes. Nyx does not overwrite copied files or silently merge upstream changes into application code.</p></div></section>

      <aside class="docs-registry-decision" aria-label="When to use the registry model"><div><strong>Use the registry model when</strong><p>Your team wants direct control over semantics, composition, and product-specific markup.</p></div><div><strong>Consider another model when</strong><p>Your organization requires centrally upgraded, opaque components with no local source ownership or review burden.</p></div></aside>
    </div>`,
  }),
  page({
    path: paths.guides.aiIntegration,
    categoryLabel: "Integration",
    title: "AI Integration",
    navigationLabel: "AI Integration",
    description: "Give coding agents a structured component contract so selection, installation, composition, and verification come from Nyx instead of guesswork.",
    searchTerms: "ai integration agent codex claude mcp registry metadata prompt component selection machine readable",
    body: `<div class="docs-ai-guide">
      <section class="docs-overview-lead" aria-labelledby="ai-contract-model">
        <div><span class="nyx-eyebrow">Integration preview</span><h2 id="ai-contract-model">One registry contract, usable by every agent</h2></div>
        <div class="docs-overview-copy"><p><code>@nyx-raul/mcp</code> exposes the same component registry used by this catalog to Codex, Claude Code, and other MCP clients.</p><p>Agents can discover components, compare usage guidance, inspect a contract, and retrieve canonical source instead of relying on remembered APIs.</p></div>
      </section>

      <section class="docs-overview-section" aria-labelledby="ai-mcp-heading">
        <header class="docs-overview-section-head"><span class="nyx-eyebrow">MCP server</span><h2 id="ai-mcp-heading">Connect an agent to the Nyx registry</h2><p>The beta package runs as a local stdio server. Add the command below to a compatible MCP client.</p></header>
        <div class="docs-ai-mcp-build">${codeBlock(mcpRun, "shell", "Run the MCP server")}<div><strong>Read-only by design</strong><p>The server can return registry metadata and declared component source. It cannot edit a project or execute component code.</p></div></div>
        <ul class="docs-ai-tools" aria-label="Nyx MCP tools">
          <li><code>list_components</code><span>Browse registry items by type or status.</span></li>
          <li><code>search_components</code><span>Find patterns from names and usage guidance.</span></li>
          <li><code>get_component_contract</code><span>Read dependencies, initialization, accessibility, and alternatives.</span></li>
          <li><code>get_component_source</code><span>Retrieve canonical files for one known registry item.</span></li>
        </ul>
      </section>

      <section class="docs-overview-section" aria-labelledby="ai-skill-heading">
        <header class="docs-overview-section-head"><span class="nyx-eyebrow">Agent Skill</span><h2 id="ai-skill-heading">Give the agent the Nyx workflow, not just registry access</h2><p>MCP supplies current component data. The portable <code>nyx-ui</code> skill teaches an agent how to inspect the project, select from contracts, preserve lifecycle and accessibility requirements, compose layouts, and verify the completed result.</p></header>
        <div class="docs-ai-skill">
          ${codeBlock(skillInstall, "shell", "Install the Nyx skill")}
          <div class="docs-ai-skill-points"><div><strong>Project aware</strong><p>Detects the package manager, framework, existing Nyx dependencies, stylesheet, and active theme before editing.</p></div><div><strong>MCP first</strong><p>Searches intent, reads the selected contract, and fetches canonical source instead of guessing component APIs.</p></div><div><strong>Portable</strong><p>Uses the open Agent Skills format so compatible coding agents can install the same maintained workflow.</p></div></div>
        </div>
      </section>

      <section class="docs-overview-section" aria-labelledby="ai-connect-heading">
        <header class="docs-overview-section-head"><span class="nyx-eyebrow">Client setup</span><h2 id="ai-connect-heading">Use the same server from Codex or Claude Code</h2><p>Codex reads project-scoped MCP settings from <code>.codex/config.toml</code>. Claude Code reads <code>.mcp.json</code> from the project. Restart the client after adding its configuration.</p></header>
        <div class="docs-ai-connect">
          <article><div><span class="nyx-eyebrow">Codex</span><h3>Project config</h3><p>Add the server, restart Codex, then use <code>/mcp</code> to confirm the four Nyx tools are active.</p></div>${codeBlock(codexMcpConfig, "toml", ".codex/config.toml")}</article>
          <article><div><span class="nyx-eyebrow">Claude Code</span><h3>Project config</h3><p>Add the server at project scope, restart Claude Code, then inspect the connection with its MCP commands.</p></div>${codeBlock(claudeMcpConfig, "json", ".mcp.json")}</article>
        </div>
      </section>

      <section class="docs-overview-section" aria-labelledby="ai-agent-guides-heading">
        <header class="docs-overview-section-head"><span class="nyx-eyebrow">Agent setup guides</span><h2 id="ai-agent-guides-heading">Bring MCP data and the Nyx skill to your coding agent</h2><p>Codex and Claude Code have concrete local configuration examples above. The same stdio server and portable skill can be used by other clients that support MCP and the Agent Skills format; follow that client's server-registration flow rather than copying another client's config file.</p></header>
        <div class="docs-ai-agents">
          <article><span aria-hidden="true">CX</span><div><strong>Codex</strong><p>Use project-scoped MCP configuration and install the portable Nyx skill for the component workflow.</p></div><small>Documented above</small></article>
          <article><span aria-hidden="true">CL</span><div><strong>Claude Code</strong><p>Connect the stdio server through <code>.mcp.json</code>, then install the same Nyx skill.</p></div><small>Documented above</small></article>
          <article><span aria-hidden="true">CU</span><div><strong>Cursor</strong><p>Register the Nyx stdio command in Cursor and select Cursor when the skill installer asks for a target.</p></div><small>MCP + Agent Skills</small></article>
          <article><span aria-hidden="true">VS</span><div><strong>VS Code / Copilot</strong><p>Add Nyx to the client's MCP server list and install the skill into the supported project scope.</p></div><small>MCP + Agent Skills</small></article>
          <article><span aria-hidden="true">GM</span><div><strong>Gemini CLI</strong><p>Register the same server command, then choose Gemini when installing the portable skill.</p></div><small>MCP + Agent Skills</small></article>
          <article><span aria-hidden="true">AI</span><div><strong>Other compatible agents</strong><p>Use the built server with any stdio MCP client; use the skill wherever the open Agent Skills format is supported.</p></div><small>Portable integration</small></article>
        </div>
      </section>

      <section class="docs-overview-section" aria-labelledby="ai-flow-heading">
        <header class="docs-overview-section-head"><span class="nyx-eyebrow">Agent flow</span><h2 id="ai-flow-heading">From intent to verified implementation</h2></header>
        <ol class="docs-ai-flow">
          <li><span>01</span><div><strong>Understand the request</strong><p>The agent identifies that the requested help is brief, descriptive, and non-interactive.</p></div></li>
          <li><span>02</span><div><strong>Select from contracts</strong><p><code>useWhen</code> supports Tooltip while <code>avoidWhen</code> rules out visible help, Hover Card, or another interactive surface.</p></div></li>
          <li><span>03</span><div><strong>Compose without guessing</strong><p>The record names canonical markup, packages, initializer, selector, accessibility requirements, and nearby alternatives.</p></div></li>
        </ol>
      </section>

      <section class="docs-overview-section" aria-labelledby="ai-pilot-contract">
        <header class="docs-overview-section-head"><span class="nyx-eyebrow">Source of truth</span><h2 id="ai-pilot-contract">The live Tooltip contract</h2><p>This JSON is generated from the actual registry entry at page load. Editing that entry changes this view and the data an integration would receive.</p></header>
        <div class="docs-ai-contract">
          ${codeBlock(tooltipAiContractSource, "js", "registry/registry.json · tooltip")}
          <div class="docs-ai-contract-notes">
            <div><span>Decision</span><strong>${tooltipAiContract.description}</strong></div>
            <div><span>Canonical source</span><strong>${tooltipAiContract.files.join(", ")}</strong></div>
            <div><span>Runtime</span><strong>${tooltipAiContract.initializer?.function} from ${tooltipAiContract.initializer?.import}</strong></div>
            <div><span>Alternatives</span><strong>${tooltipAiContract.related?.join(" · ")}</strong></div>
          </div>
        </div>
      </section>

      <section class="docs-overview-section" aria-labelledby="ai-example-heading">
        <header class="docs-overview-section-head"><span class="nyx-eyebrow">Example exchange</span><h2 id="ai-example-heading">What an agent can produce from the contract</h2><p>This is deterministic guidance derived from declared metadata. It does not depend on an agent remembering Nyx APIs from training data.</p></header>
        <div class="docs-ai-example">
          ${codeBlock(aiPrompt, "shell", "Developer request")}
          ${codeBlock(aiResult, "shell", "Agent decision")}
        </div>
      </section>

      <aside class="docs-ai-boundary" aria-labelledby="ai-boundary-heading">
        <div><span class="nyx-eyebrow">Availability</span><h2 id="ai-boundary-heading">Use the beta release</h2></div>
        <p>Use the explicit <code>@beta</code> package tag until a stable release is available. The repository-hosted Agent Skill remains available independently.</p>
      </aside>
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
