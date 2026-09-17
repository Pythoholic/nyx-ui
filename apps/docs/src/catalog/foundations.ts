import { icon } from "../icons.js";
import { card, section } from "./shared.js";

const colors = section(
  "color",
  "02",
  "Color system",
  "A cool neutral surface ladder, one active accent, and semantic colors whose meaning never changes between themes.",
  `<div class="docs-swatch-grid">
    <div class="docs-swatch" style="--swatch:var(--nyx-void)"><span>Void · #05080B</span></div>
    <div class="docs-swatch" style="--swatch:var(--nyx-panel)"><span>Panel · #0A0F14</span></div>
    <div class="docs-swatch" style="--swatch:var(--nyx-chip)"><span>Chip · #121A1F</span></div>
    <div class="docs-swatch" style="--swatch:var(--nyx-line-strong)"><span>Line · #26313A</span></div>
    <div class="docs-swatch" style="--swatch:var(--nyx-accent)"><span>Accent · Theme</span></div>
    <div class="docs-swatch" style="--swatch:var(--nyx-signal)"><span>Success · #00E08A</span></div>
    <div class="docs-swatch" style="--swatch:var(--nyx-warning)"><span>Warning · #FFB02E</span></div>
    <div class="docs-swatch" style="--swatch:var(--nyx-danger)"><span>Danger · #FF4D5D</span></div>
  </div>`,
  "color palette theme accent surfaces semantic success warning danger",
);

const typeRows = [
  ["Display XL", "--nyx-type-display-xl", "48px", "System intelligence", "800", "uppercase"],
  ["Display", "--nyx-type-display", "36px", "Operational clarity", "800", "uppercase"],
  ["Heading 1", "--nyx-type-heading-1", "30px", "Workspace overview", "700", "uppercase"],
  ["Heading 2", "--nyx-type-heading-2", "24px", "Component family", "700", "uppercase"],
  ["Heading 3", "--nyx-type-heading-3", "20px", "Component anatomy", "700", "uppercase"],
  ["Panel title", "--nyx-type-title", "18px", "Active operations", "700", "uppercase"],
  ["Body large", "--nyx-type-body-lg", "18px", "Readable introductory copy for important product context.", "400", "none"],
  ["Body", "--nyx-type-body", "16px", "The default text role used for application content.", "400", "none"],
  ["Control", "--nyx-type-control", "14px", "PRIMARY ACTION", "700", "uppercase"],
  ["Label", "--nyx-type-label", "14px", "RELEASE NAME", "700", "uppercase"],
  ["Metadata", "--nyx-type-meta", "12px", "UPDATED 17:42 UTC", "600", "uppercase"],
  ["Data XL", "--nyx-type-data-xl", "32px", "$128,420", "800", "none"],
  ["Data large", "--nyx-type-data-lg", "24px", "24,891", "800", "none"],
  ["Data", "--nyx-type-data", "18px", "+14.82%", "700", "none"],
];

const typography = section(
  "typography",
  "03",
  "Complete typography",
  "Every role is named, rem-based, and fixed across breakpoints. Responsive behavior changes layout and wrapping—not the type scale.",
  `<div class="docs-type-list">${typeRows.map(([name, token, value, sample, weight, transform]) => `<div class="docs-type-row"><span class="docs-type-name">${name}</span><span style="font-size:var(${token});font-weight:${weight};text-transform:${transform};line-height:1.25">${sample}</span><span class="docs-type-value">${value}</span></div>`).join("")}</div>
  <div class="nyx-alert" data-tone="success" style="margin-top:var(--nyx-space-4)">${icon("check")}<div><strong class="nyx-alert-title">Typography stability contract</strong>These values remain identical at mobile, tablet, desktop, and 2560×1440. Density modes may alter spacing but never type size.</div></div>`,
  "typography type scale display headings body control label metadata data fixed responsive font",
);

const geometry = section(
  "geometry",
  "04",
  "Geometry and depth",
  "Spacing follows a four-pixel base rhythm. Strong boundaries, restrained radii, explicit elevation, breakpoints, and z-index layers keep the system predictable.",
  `<div class="docs-grid">
    ${card("Spacing scale", `<div class="docs-space-scale">${[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((n) => `<span class="docs-space-unit"><i class="docs-space-block" style="--space:var(--nyx-space-${n})"></i>${n}</span>`).join("")}</div>`, "4px base")}
    ${card("Radius", `<div class="docs-row"><span style="width:5rem;height:5rem;border:var(--nyx-border) solid var(--nyx-accent);border-radius:var(--nyx-radius-xs)"></span><span style="width:5rem;height:5rem;border:var(--nyx-border) solid var(--nyx-accent);border-radius:var(--nyx-radius-control)"></span><span style="width:5rem;height:5rem;border:var(--nyx-border) solid var(--nyx-accent);border-radius:var(--nyx-radius-panel)"></span></div>`, "2 · 6 · 8")}
    ${card("Borders and elevation", `<div class="docs-column"><div style="padding:1rem;border:var(--nyx-border-hairline) solid var(--nyx-line-strong)">Hairline · 1px</div><div style="padding:1rem;border:var(--nyx-border) solid var(--nyx-line-strong)">Interface · 2px</div><div style="padding:1rem;box-shadow:var(--nyx-shadow-raised);background:var(--nyx-panel-raised)">Raised shadow</div></div>`, "Explicit")}
    ${card("Viewport and layers", `<dl class="nyx-description-list"><dt>Mobile</dt><dd>480px</dd><dt>Tablet</dt><dd>768px</dd><dt>Desktop</dt><dd>1280px</dd><dt>Wide</dt><dd>1600px</dd><dt>Sticky</dt><dd>z 100</dd><dt>Overlay</dt><dd>z 500</dd><dt>Toast</dt><dd>z 700</dd></dl>`, "No type shift")}
  </div>`,
  "spacing geometry radius borders shadows elevation breakpoints z-index layers",
);

const motion = section(
  "motion",
  "05",
  "Motion language",
  "Five interaction timings, five recurring-animation timings, and four easing curves cover feedback, entrances, exits, and spatial transitions. Reduced-motion preferences collapse every animation safely.",
  `<div class="docs-motion-grid" data-motion-stage>
    <div class="docs-motion-card"><i class="docs-motion-object nyx-motion-fade"></i><span>Fade · 180ms</span></div>
    <div class="docs-motion-card"><i class="docs-motion-object nyx-motion-slide"></i><span>Slide · 280ms</span></div>
    <div class="docs-motion-card"><i class="docs-motion-object nyx-motion-scale"></i><span>Scale · Spring</span></div>
    <div class="docs-motion-card"><i class="docs-motion-object nyx-motion-pulse"></i><span>Pulse · Status</span></div>
    <div class="docs-motion-card"><i class="docs-motion-object nyx-motion-signal"></i><span>Signal · Attention</span></div>
  </div><div class="docs-row" style="margin-top:var(--nyx-space-4)"><button class="nyx-button" data-motion-replay type="button">Replay motion ${icon("arrow")}</button><span class="nyx-badge">80 · 120 · 180 · 280 · 420ms</span><span class="nyx-badge">750 · 1500 · 1600 · 1700 · 1800ms</span></div>`,
  "animation motion duration easing transition fade slide scale pulse shimmer spinner reduced motion",
);

export const foundationSections = [colors, typography, geometry, motion].join("");
