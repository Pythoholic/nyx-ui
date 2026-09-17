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
