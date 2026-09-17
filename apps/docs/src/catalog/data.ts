import { card, section } from "./shared.js";

export const dataSection = section(
  "data",
  "11",
  "Data display",
  "Operational data stays scannable through tabular numbers, strong row boundaries, explicit status, accessible tables, and expandable detail.",
  `<div class="docs-stack">
    <div class="nyx-stat-grid"><article class="nyx-stat"><span class="nyx-stat-label">Requests</span><div class="nyx-stat-value">128,420</div><span style="color:var(--nyx-signal)">+14.82%</span></article><article class="nyx-stat"><span class="nyx-stat-label">Latency</span><div class="nyx-stat-value">184ms</div><span style="color:var(--nyx-warning)">+12ms</span></article><article class="nyx-stat"><span class="nyx-stat-label">Success rate</span><div class="nyx-stat-value">99.94%</div><span style="color:var(--nyx-signal)">Stable</span></article><article class="nyx-stat"><span class="nyx-stat-label">Queue</span><div class="nyx-stat-value">024</div><span style="color:var(--nyx-muted)">6 active</span></article></div>
    <div class="docs-grid">
      ${card("Description list", `<dl class="nyx-description-list"><dt>Identifier</dt><dd>op-2026-0917-024</dd><dt>Owner</dt><dd>Operations team</dd><dt>Created</dt><dd>17 Sep 2026 · 16:48</dd><dt>Policy</dt><dd>Protected</dd></dl>`)}
      ${card("Timeline", `<ol class="nyx-timeline"><li class="nyx-timeline-item"><strong>Release created</strong><div class="nyx-field-hint">16:48 · Version 24</div></li><li class="nyx-timeline-item"><strong>Validation passed</strong><div class="nyx-field-hint">16:51 · 42 checks</div></li><li class="nyx-timeline-item"><strong>Deployment complete</strong><div class="nyx-field-hint">16:54 · Tokyo region</div></li></ol>`)}
    </div>
    ${card("Table and job rows", `<div class="nyx-table-wrap"><table class="nyx-table"><thead><tr><th scope="col">Job</th><th scope="col">Status</th><th scope="col">Duration</th><th scope="col">Created</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody><tr><td>render-024</td><td><span class="nyx-badge" data-tone="success">Complete</span></td><td>01:42</td><td>17:04</td><td><button class="nyx-button" data-size="small">Details</button></td></tr><tr><td>render-025</td><td><span class="nyx-badge">Running</span></td><td>00:38</td><td>17:08</td><td><button class="nyx-button" data-size="small">Details</button></td></tr><tr><td>render-026</td><td><span class="nyx-badge" data-tone="warning">Queued</span></td><td>—</td><td>17:09</td><td><button class="nyx-button" data-size="small">Details</button></td></tr></tbody></table></div>`)}
    <div class="docs-grid">
      ${card("Log viewer", `<div class="nyx-log" aria-label="Deployment log"><div class="nyx-log-line"><span class="nyx-log-time">17:04:12</span><span class="nyx-log-level">info</span><span>Starting release validation</span></div><div class="nyx-log-line"><span class="nyx-log-time">17:04:14</span><span class="nyx-log-level">pass</span><span>Component contracts verified</span></div><div class="nyx-log-line"><span class="nyx-log-time">17:04:18</span><span class="nyx-log-level" style="color:var(--nyx-warning)">warn</span><span>One optional check skipped</span></div></div>`)}
      ${card("Code record", `<pre class="nyx-code"><code>data-nyx-theme=&quot;solar&quot;&#10;data-state=&quot;active&quot;&#10;aria-current=&quot;page&quot;&#10;aria-live=&quot;polite&quot;</code></pre>`)}
    </div>
  </div>`,
  "data stat card description list table jobs workflow timeline log code record expandable",
);

