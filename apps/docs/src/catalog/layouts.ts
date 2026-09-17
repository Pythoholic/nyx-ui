import { icon } from "../icons.js";
import { card, section } from "./shared.js";

export const layoutsSection = section(
  "layouts",
  "15",
  "Application layouts",
  "The same primitives scale into shells for dashboards, authentication, settings, split workspaces, operations consoles, galleries, and onboarding.",
  `<div class="docs-stack">
    ${card("Application shell", `<div class="nyx-app-shell"><aside class="nyx-app-sidebar"><span class="nyx-eyebrow">Navigation</span><div class="docs-column" style="margin-top:1rem"><span class="nyx-badge">Overview</span><span style="color:var(--nyx-muted)">Workflows</span><span style="color:var(--nyx-muted)">Library</span><span style="color:var(--nyx-muted)">Settings</span></div></aside><main class="nyx-app-content"><div class="nyx-stat-grid"><article class="nyx-stat"><span class="nyx-stat-label">Active jobs</span><div class="nyx-stat-value">024</div></article><article class="nyx-stat"><span class="nyx-stat-label">Success</span><div class="nyx-stat-value">99.94%</div></article></div></main></div>`, "Dashboard")}
    ${card("Authentication layout", `<div class="nyx-auth-layout"><div class="nyx-auth-art"><div><span class="nyx-eyebrow">Secure workspace</span><h3 style="font-size:var(--nyx-type-section);margin:.5rem 0 0;text-transform:uppercase">Access the system</h3></div></div><form class="nyx-auth-form"><label class="nyx-field" for="auth-email"><span class="nyx-label">Email</span><input class="nyx-input" id="auth-email" type="email" placeholder="operator@example.com"/></label><label class="nyx-field" for="auth-password"><span class="nyx-label">Password</span><input class="nyx-input" id="auth-password" type="password" value="password"/></label><button class="nyx-button" data-variant="primary" type="submit">Sign in</button></form></div>`, "Auth")}
    ${card("Split workspace", `<div class="nyx-split"><section><span class="nyx-eyebrow">Configuration</span><div class="docs-column" style="margin-top:1rem"><label class="nyx-field" for="workspace-prompt"><span class="nyx-label">Prompt</span><textarea class="nyx-textarea" id="workspace-prompt">A precise technical interface...</textarea></label><label class="nyx-field" for="workspace-strength"><span class="nyx-label">Strength</span><input class="nyx-range" id="workspace-strength" type="range" value="72"/></label></div></section><section style="background:var(--nyx-radial)"><span class="nyx-eyebrow">Live result</span><div class="nyx-media-preview" style="margin-top:1rem">${icon("image")}</div></section></div>`, "Workspace")}
  </div>`,
  "layout application shell dashboard auth settings split workspace operations console gallery onboarding",
);
