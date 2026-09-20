import { icon } from "../icons.js";
import { paths } from "../routes.js";
import { card, page } from "./shared.js";

const typeRows = [
  { name: "Display / 700 / 32–54 / −.015em", token: "--nyx-type-display", value: "32–54px", sample: "Admin sign in", weight: "700", transform: "uppercase", tracking: "-.015em", lineHeight: "1.04" },
  { name: "Panel title / 600 / 17 / .12em", token: "--nyx-type-panel", value: "17px", sample: "Net gamma exposure by strike", weight: "600", transform: "uppercase", tracking: ".12em", lineHeight: "1.35" },
  { name: "Nav / tab / 600 / 13 / .10em", token: "--nyx-type-nav", value: "13px", sample: "GEX   DEX   VEX", weight: "600", transform: "uppercase", tracking: ".10em", lineHeight: "1.4" },
  { name: "Body / 400 / 15 / 1.7", token: "--nyx-type-body", value: "15px", sample: "Sign in to access the workspace.", weight: "400", transform: "none", tracking: "0", lineHeight: "1.7" },
  { name: "Label / 400 / 12 / .02em", token: "--nyx-type-label", value: "12px", sample: "Email address / Password / Batch size", weight: "400", transform: "none", tracking: ".02em", lineHeight: "1.4" },
  { name: "Data / 600–700 / 16–30 / tabular", token: "--nyx-type-data", value: "16–30px", sample: "$711.09  +0.84%", weight: "700", transform: "none", tracking: "0", lineHeight: "1.15" },
];

export const foundationPages = [
  page({
    path: paths.foundations.color,
    categoryLabel: "Foundations",
    title: "Color System",
    description: "A cool neutral surface ladder, one active accent, and semantic colors whose meaning never changes between themes.",
    searchTerms: "color palette theme accent surfaces semantic success warning danger",
    body: `<div class="docs-swatch-grid">
      <div class="docs-swatch" style="--swatch:var(--nyx-void)"><span>Void · #05080B</span></div><div class="docs-swatch" style="--swatch:var(--nyx-panel)"><span>Panel · #0A0F14</span></div><div class="docs-swatch" style="--swatch:var(--nyx-chip)"><span>Chip · #121A1F</span></div><div class="docs-swatch" style="--swatch:var(--nyx-line-strong)"><span>Line · #26313A</span></div><div class="docs-swatch" style="--swatch:var(--nyx-accent)"><span>Accent · Theme</span></div><div class="docs-swatch" style="--swatch:var(--nyx-signal)"><span>Success · #9CDB4A</span></div><div class="docs-swatch" style="--swatch:var(--nyx-warning)"><span>Warning · #FFB02E</span></div><div class="docs-swatch" style="--swatch:var(--nyx-danger)"><span>Danger · #FF4D5D</span></div>
    </div>`,
  }),
  page({
    path: paths.foundations.typography,
    categoryLabel: "Foundations",
    title: "Nyx Typography",
    description: "One family, six product roles, weights 400–700, tabular numerals, deliberate uppercase tracking, and negative tracking only for display text.",
    searchTerms: "typography type scale display headings body control label metadata data fixed responsive font",
    body: `<div class="docs-type-list">${typeRows.map(({ name, token, value, sample, weight, transform, tracking, lineHeight }) => `<div class="docs-type-row"><span class="docs-type-name">${name}</span><span style="font-size:var(${token});font-weight:${weight};text-transform:${transform};letter-spacing:${tracking};line-height:${lineHeight}">${sample}</span><span class="docs-type-value">${value}</span></div>`).join("")}</div><div class="nyx-alert" data-tone="success" style="margin-top:var(--nyx-space-4)">${icon("check")}<div><strong class="nyx-alert-title">JetBrains Mono contract</strong>Weights 400, 500, 600, and 700 are loaded explicitly. Functional text stays fixed; only display and large data use bounded responsive scaling.</div></div>`,
  }),
  page({
    path: paths.foundations.geometry,
    categoryLabel: "Foundations",
    title: "Geometry and Depth",
    description: "Spacing follows a four-pixel base rhythm. Strong boundaries, restrained radii, explicit elevation, breakpoints, and z-index layers keep the system predictable.",
    searchTerms: "spacing geometry radius borders shadows elevation breakpoints z-index layers",
    body: `<div class="docs-grid">
      ${card("Spacing scale", `<div class="docs-space-scale">${[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((n) => `<span class="docs-space-unit"><i class="docs-space-block" style="--space:var(--nyx-space-${n})"></i>${n}</span>`).join("")}</div>`, "4px base")}
      ${card("Radius", `<div class="docs-row"><span style="width:5rem;height:5rem;border:var(--nyx-border) solid var(--nyx-accent);border-radius:var(--nyx-radius-xs)"></span><span style="width:5rem;height:5rem;border:var(--nyx-border) solid var(--nyx-accent);border-radius:var(--nyx-radius-control)"></span><span style="width:5rem;height:5rem;border:var(--nyx-border) solid var(--nyx-accent);border-radius:var(--nyx-radius-panel)"></span></div>`, "2 · 6 · 8")}
      ${card("Borders and elevation", `<div class="docs-column"><div style="padding:1rem;border:var(--nyx-border-hairline) solid var(--nyx-line-strong)">Hairline · 1px</div><div style="padding:1rem;border:var(--nyx-border) solid var(--nyx-line-strong)">Interface · 2px</div><div style="padding:1rem;box-shadow:var(--nyx-shadow-raised);background:var(--nyx-panel-raised)">Raised shadow</div></div>`, "Explicit")}
      ${card("Viewport and layers", `<dl class="nyx-description-list"><dt>Mobile</dt><dd>480px</dd><dt>Tablet</dt><dd>768px</dd><dt>Desktop</dt><dd>1280px</dd><dt>Wide</dt><dd>1600px</dd><dt>Sticky</dt><dd>z 100</dd><dt>Overlay</dt><dd>z 500</dd><dt>Toast</dt><dd>z 700</dd></dl>`, "No type shift")}
    </div>`,
  }),
  page({
    path: paths.foundations.motion,
    categoryLabel: "Foundations",
    title: "Motion Language",
    description: "Motion explains a change in state, hierarchy, or location. Nyx uses short interaction transitions, deliberate entrances and exits, and continuous animation only for active work or exceptional attention.",
    searchTerms: "animation motion duration easing transition entrance exit disclosure state progress attention spatial reduced motion replay",
    body: `<div class="docs-motion-page">
      <section class="docs-overview-lead" aria-labelledby="motion-principle"><div><span class="nyx-eyebrow">Principle</span><h2 id="motion-principle">Clarify change; do not decorate inactivity</h2></div><div class="docs-overview-copy"><p>Motion should answer a concrete question: what appeared, what left, what changed, or where an element moved. If the interface is understandable without animation and no transition needs clarification, keep it still.</p><p>Interaction timings are intentionally short. Longer recurring timings belong to progress, loading, or exceptional status—not routine hover effects or ambient decoration.</p></div></section>

      <section class="docs-overview-section" aria-labelledby="motion-examples"><header class="docs-overview-section-head"><span class="nyx-eyebrow">Examples</span><h2 id="motion-examples">Motion applied to interface events</h2><p>Replay each example independently. These samples reuse Nyx surfaces, status treatments, progress, and existing motion utilities rather than presenting timing tokens as abstract squares.</p></header>
        <div class="docs-motion-examples" data-motion-stage>
          <article class="docs-motion-example"><header><div><span class="nyx-eyebrow">Entrance</span><h3>Contextual surface</h3></div><button class="nyx-button" data-size="small" data-motion-replay data-motion-target="motion-entrance" type="button">Replay</button></header><div class="docs-motion-viewport"><div class="nyx-popover docs-motion-popover nyx-motion-scale" id="motion-entrance"><strong>Filters applied</strong><span>3 active conditions</span></div></div><p>Scale and fade a surface from its point of origin. Use the normal duration and enter easing; avoid making routine menus travel across the screen.</p></article>
          <article class="docs-motion-example"><header><div><span class="nyx-eyebrow">Spatial transition</span><h3>Panel arrival</h3></div><button class="nyx-button" data-size="small" data-motion-replay data-motion-target="motion-spatial" type="button">Replay</button></header><div class="docs-motion-viewport docs-motion-viewport-edge"><div class="nyx-panel nyx-panel-body docs-motion-panel" id="motion-spatial"><strong>Inspector</strong><span>Selection details</span></div></div><p>Move an edge-owned panel a short distance from its source. Fade supports the transition, while the settled panel retains space from its container.</p></article>
          <article class="docs-motion-example"><header><div><span class="nyx-eyebrow">Disclosure</span><h3>Expanded detail</h3></div><button class="nyx-button" data-size="small" data-motion-replay data-motion-target="motion-disclosure" type="button">Replay</button></header><div class="docs-motion-viewport"><div class="docs-motion-disclosure" id="motion-disclosure"><strong>Deployment checks</strong><span>All 12 checks passed.</span><span>Ready for promotion.</span></div></div><p>Reveal content in place so the relationship to its trigger remains clear. Do not animate the surrounding page more than the disclosure requires.</p></article>
          <article class="docs-motion-example"><header><div><span class="nyx-eyebrow">Exit</span><h3>Notification removal</h3></div><button class="nyx-button" data-size="small" data-motion-replay data-motion-target="motion-exit" type="button">Replay</button></header><div class="docs-motion-viewport"><div class="nyx-notification docs-motion-exit" id="motion-exit"><div><strong>Export complete</strong><p>Three files are ready.</p></div></div></div><p>Removal moves in the reading direction while fading. Semantics and focus must settle before the visual exit finishes.</p></article>
          <article class="docs-motion-example"><header><div><span class="nyx-eyebrow">Active work</span><h3>Indeterminate progress</h3></div><button class="nyx-button" data-size="small" data-motion-replay data-motion-target="motion-progress" type="button">Restart</button></header><div class="docs-motion-viewport"><div class="docs-motion-progress" id="motion-progress"><span>Preparing assets</span><div class="nyx-progress" data-indeterminate="true" role="progressbar" aria-label="Preparing assets"><span class="nyx-progress-bar"></span></div></div></div><p>Continuous motion is appropriate while work is genuinely active. Stop it when work completes, fails, pauses, or moves out of view.</p></article>
          <article class="docs-motion-example"><header><div><span class="nyx-eyebrow">Attention</span><h3>Exceptional status</h3></div><button class="nyx-button" data-size="small" data-motion-replay data-motion-target="motion-attention" type="button">Replay</button></header><div class="docs-motion-viewport"><div class="nyx-status-indicator docs-motion-attention" data-state="pending" id="motion-attention"><span class="nyx-status-dot"></span><strong>Connection recovering</strong></div></div><p>Pulse or signal only when a status needs timely attention. A stable success or informational state should not animate indefinitely.</p></article>
        </div><button class="nyx-button" data-motion-replay-all type="button">Replay all examples ${icon("arrow")}</button>
      </section>

      <section class="docs-overview-section" aria-labelledby="motion-tokens"><header class="docs-overview-section-head"><span class="nyx-eyebrow">Timing decisions</span><h2 id="motion-tokens">Choose duration from the change being explained</h2></header><div class="docs-motion-token-table"><div><strong>80–120ms</strong><span>Immediate feedback</span><p>Hover, pressed, focus, and small color or border changes.</p></div><div><strong>180ms</strong><span>State transition</span><p>Fade, validation, selection, and compact surface changes.</p></div><div><strong>280ms</strong><span>Spatial transition</span><p>Disclosure, drawer, panel, and deliberate entrance or exit.</p></div><div><strong>420ms</strong><span>Large reflow</span><p>Use sparingly when a substantial layout change must remain trackable.</p></div><div><strong>750–1800ms</strong><span>Recurring work</span><p>Spinner, shimmer, progress, pulse, and signal cycles—not interaction latency.</p></div></div></section>

      <section class="docs-motion-reduced" aria-labelledby="motion-reduced"><div><span class="nyx-eyebrow">Reduced motion</span><h2 id="motion-reduced">Preserve the state change and remove unnecessary travel</h2><p>With <code>prefers-reduced-motion: reduce</code>, Nyx reduces animation and transition durations to 0.01ms and runs animations once. The resulting state remains visible; only the journey is minimized.</p></div><div class="docs-motion-comparison"><div><span>Standard</span><i class="docs-motion-comparison-object nyx-motion-slide"></i></div><div class="docs-motion-reduced-preview"><span>Reduced</span><i class="docs-motion-comparison-object nyx-motion-slide"></i></div></div></section>
    </div>`,
  }),
];
