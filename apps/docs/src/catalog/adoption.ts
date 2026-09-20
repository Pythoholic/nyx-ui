import markup from "../../../../registry/examples/render-workspace/screen.html?raw";
import application from "../../../../registry/examples/render-workspace/app.ts?raw";
import entry from "../../../../registry/examples/render-workspace/entry.ts?raw";
import styles from "../../../../registry/examples/render-workspace/style.css?raw";
import document from "../../../../registry/examples/render-workspace/index.html?raw";
import { card, codeBlock, page } from "./shared.js";

export const adoptionPage = page({
  path: "/guides/render-workspace",
  categoryLabel: "Integration",
  title: "Build a Render Workspace",
  navigationLabel: "Executable example",
  description: "Run one complete screen, then copy its markup, application events, font setup, and mount/cleanup lifecycle.",
  searchTerms: "adoption starter executable complete example installation cleanup theme events repeated instances",
  body: `${card("Local batch rehearsal", markup)}
    <section class="docs-prose-section"><h2>Run and copy the complete project</h2><p>The live example and standalone project use the same canonical HTML and application module. Queue work, cancel it, rehearse a failure, retry, and remove every job to reach the empty state.</p>${codeBlock("pnpm install\npnpm dev", "shell", "From the repository root")}<p>Open <code>http://127.0.0.1:5174/guides/render-workspace</code>. Export an independent project with <code>node scripts/copy-workspace-example.mjs ../my-workspace</code>; after the Nyx packages are published, run <code>pnpm install</code> and <code>pnpm dev</code> there. All source lives in <code>registry/examples/render-workspace</code>.</p></section>
    <section class="docs-prose-section"><h2>Application behavior</h2><p>Both number inputs initialize once. Application handlers calculate the batch and react to queue events. A local timer supplies progress and one recoverable failure; replacing it with a service is an application decision.</p>${codeBlock(application, "js", "app.ts")}</section>
    <section class="docs-prose-section"><h2>Mount and cleanup</h2><p>Keep the cleanup returned by <code>mountWorkspace</code>. Call it before replacing the root. This stops work, releases application listeners, and destroys all controllers. The docs host does this on every route change.</p>${codeBlock(entry, "js", "entry.ts")}</section>
    <section class="docs-prose-section"><h2>Document and font loading</h2><p>The document loads weights 400, 500, 600, and 700. Failed or delayed requests use the monospace fallback; self-hosted font files can replace the stylesheet link.</p>${codeBlock(document, "html", "index.html")}${codeBlock(styles, "css", "style.css")}</section>`,
});
