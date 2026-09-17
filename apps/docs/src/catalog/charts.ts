import { card, section } from "./shared.js";

export const chartsSection = section(
  "charts",
  "12",
  "Data visualization",
  "Nyx owns chart color, grid, typography, tooltip, loading, empty, and accessibility contracts while rendering remains replaceable.",
  `<div class="docs-chart-grid">
    ${card("Line chart", `<figure style="margin:0"><svg class="nyx-chart" viewBox="0 0 640 260" role="img" aria-labelledby="line-title line-desc"><title id="line-title">Request volume</title><desc id="line-desc">Request volume rose from 42 thousand to 81 thousand during the selected period.</desc><g class="nyx-chart-grid"><path d="M40 40H620M40 95H620M40 150H620M40 205H620"/></g><path class="nyx-chart-area" d="M40 190 125 155 210 170 295 110 380 125 465 72 550 88 620 44V220H40Z"/><path class="nyx-chart-series" d="M40 190 125 155 210 170 295 110 380 125 465 72 550 88 620 44"/></svg><figcaption class="nyx-chart-legend"><span class="nyx-chart-key">Requests</span><span class="nyx-chart-key" style="--series-color:var(--nyx-info)">Projected</span></figcaption></figure>`)}
    ${card("Sparklines", `<div class="docs-column"><svg class="nyx-chart" viewBox="0 0 200 60" role="img" aria-label="Rising sparkline"><path class="nyx-chart-series" d="M4 49 32 43 60 48 88 25 116 31 144 12 172 20 196 5"/></svg><svg class="nyx-chart" viewBox="0 0 200 60" role="img" aria-label="Stable sparkline"><path class="nyx-chart-series" style="stroke:var(--nyx-info)" d="M4 31 32 28 60 32 88 29 116 30 144 27 172 31 196 28"/></svg><svg class="nyx-chart" viewBox="0 0 200 60" role="img" aria-label="Falling sparkline"><path class="nyx-chart-series" style="stroke:var(--nyx-danger)" d="M4 8 32 14 60 12 88 27 116 25 144 39 172 36 196 52"/></svg></div>`)}
    ${card("Bar chart", `<svg class="nyx-chart" viewBox="0 0 640 260" role="img" aria-label="Volume by region"><g class="nyx-chart-grid"><path d="M40 40H620M40 95H620M40 150H620M40 205H620"/></g><rect class="nyx-chart-bar" x="70" y="90" width="58" height="130" rx="4"/><rect class="nyx-chart-bar" data-series="secondary" x="145" y="125" width="58" height="95" rx="4"/><rect class="nyx-chart-bar" x="255" y="55" width="58" height="165" rx="4"/><rect class="nyx-chart-bar" data-series="secondary" x="330" y="105" width="58" height="115" rx="4"/><rect class="nyx-chart-bar" x="440" y="78" width="58" height="142" rx="4"/><rect class="nyx-chart-bar" data-series="secondary" x="515" y="142" width="58" height="78" rx="4"/></svg>`)}
    ${card("Accessible summary", `<p style="margin-top:0;color:var(--nyx-muted)">Charts always include an accessible name, text summary, and a table alternative for exact values.</p><table class="nyx-table"><thead><tr><th>Period</th><th>Requests</th></tr></thead><tbody><tr><td>14:00</td><td>42,140</td></tr><tr><td>16:00</td><td>64,820</td></tr><tr><td>18:00</td><td>81,240</td></tr></tbody></table>`)}
  </div>`,
  "chart line bar sparkline legend tooltip empty loading accessible summary table data visualization",
);

