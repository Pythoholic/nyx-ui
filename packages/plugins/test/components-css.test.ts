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

  it("visually hides accessible content without removing it from layout semantics", () => {
    expect(css).toMatch(/\.nyx-visually-hidden:not\(\.nyx-visually-hidden-focusable\)/);
    expect(css).toMatch(/\.sr-only:not\(\.nyx-visually-hidden-focusable\)/);
    expect(css).toMatch(/\.nyx-visually-hidden-focusable:not\(:focus\):not\(:focus-within\)/);
    expect(css).toMatch(/inset-inline-start:\s*0\s*!important/);
    expect(css).toMatch(/clip-path:\s*inset\(50%\)/);
    expect(css).not.toMatch(/\.nyx-visually-hidden[^}]*display:\s*none/);
  });

  it("mirrors direction-sensitive component styling", () => {
    expect(css).toMatch(/\.nyx-select:dir\(rtl\)\s*\{[^}]*background-position:\s*left/);
    expect(css).toMatch(/\.nyx-switch:dir\(rtl\)[^{]*\{[^}]*translateX\(-1\.25rem\)/);
    expect(css).toMatch(/\.nyx-progress\[data-indeterminate="true"\]:dir\(rtl\)\s+\.nyx-progress-bar\s*\{[^}]*animation-name:\s*nyx-progress-rtl/);
    expect(css).toMatch(/\.nyx-before-after-reveal:dir\(rtl\)\s*\{[^}]*clip-path:/);
  });

  it("bounds loading overlays and provides an explicit idle hiding contract", () => {
    expect(css).toMatch(/\.nyx-loading-surface\s*\{[^}]*position:\s*relative;[^}]*isolation:\s*isolate;/);
    expect(css).toMatch(/\.nyx-loading-overlay\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*backdrop-filter:/);
    expect(css).toMatch(/\.nyx-loading-overlay\[hidden\],[^{]*\.nyx-loading-surface\[data-state="idle"\][^{]*\{[^}]*display:\s*none;/);
  });

  it("ships named status and tag variants without relying on color-only dots", () => {
    expect(css).toMatch(/\.nyx-status-indicator\[data-tone="success"\]\s*\{[^}]*var\(--nyx-signal\)/);
    expect(css).toMatch(/\.nyx-status-indicator\[data-state="pending"\][^{]*\.nyx-status-dot\s*\{[^}]*animation:\s*nyx-pulse/);
    expect(css).toMatch(/\.nyx-tag\[data-tone="warning"\]\s*\{[^}]*var\(--nyx-warning-line\)/);
    expect(css).toMatch(/\.nyx-tag\[data-size="small"\]\s*\{[^}]*font-size:\s*var\(--nyx-type-meta\)/);
  });
});
