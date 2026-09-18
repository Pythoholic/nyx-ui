import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve(process.cwd(), "../core/src/components.css"),
  "utf8",
);

describe("overlay component CSS", () => {
  it("keeps dropdown scrolling vertical-only and themeable", () => {
    expect(css).toMatch(
      /\.nyx-popover\[data-nyx-dropdown-menu\][^{]*\{[^}]*overflow-x:\s*hidden;[^}]*overflow-y:\s*auto;/,
    );
    expect(css).toMatch(/scrollbar-color:\s*var\(--nyx-line-strong\) var\(--nyx-panel-raised\)/);
    expect(css).toMatch(/scrollbar-width:\s*thin/);
  });

  it("does not let closed nested popovers inflate parent scroll extents", () => {
    expect(css).toMatch(
      /\.nyx-popover\[popover\]:not\(:popover-open\)\s*\{\s*display:\s*none;/,
    );
  });
});

describe("small primitive CSS", () => {
  it("ships named aspect ratios and media fitting without scripts", () => {
    expect(css).toMatch(/\.nyx-aspect-ratio\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9;/);
    expect(css).toMatch(/\.nyx-aspect-ratio\[data-ratio="square"\]\s*\{[^}]*aspect-ratio:\s*1;/);
    expect(css).toMatch(/\.nyx-aspect-ratio\s*>\s*:is\(img, video\)\s*\{[^}]*object-fit:\s*cover;/);
  });

  it("collapses authored column counts at both responsive thresholds", () => {
    expect(css).toMatch(/@media \(max-width:\s*64rem\)[\s\S]*?\.nyx-columns\[data-columns="3"\][^}]*--nyx-column-count:\s*2;/);
    expect(css).toMatch(/@media \(max-width:\s*40rem\)[\s\S]*?\.nyx-columns\[data-columns\][^}]*--nyx-column-count:\s*1;/);
  });

  it("keeps links visibly distinguished and quotes logically bordered", () => {
    expect(css).toMatch(/\.nyx-link\s*\{[^}]*text-decoration-line:\s*underline;/);
    expect(css).toMatch(/\.nyx-blockquote,[^{]*\.nyx-activity-quote\s*\{[^}]*border-inline-start:/);
  });

  it("ships code block states and the inline icon sizing contract", () => {
    expect(css).toMatch(/\.nyx-code-block\s*\{[^}]*overflow:\s*hidden;[^}]*border:/);
    expect(css).toMatch(/\.nyx-code-block\[data-state="error"\][^{]*\.nyx-code-status\s*\{[^}]*var\(--nyx-danger\)/);
    expect(css).toMatch(/\.nyx-icon\[data-size="small"\]\s*\{[^}]*inline-size:\s*1rem;/);
    expect(css).toMatch(/\.nyx-icon-catalog\s*\{[^}]*grid-template-columns:/);
  });
});
