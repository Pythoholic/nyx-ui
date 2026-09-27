import { describe, expect, it } from "vitest";
import {
  accentInk,
  contrastRatio,
  decodeCreateOptions,
  defaultCreateOptions,
  encodeCreateOptions,
  generateTheme,
  paletteTokens,
  tokensForOptions,
  type CreateOptions,
} from "../../../apps/docs/src/create/generate.js";

function options(change: Partial<CreateOptions> = {}): CreateOptions {
  return { ...defaultCreateOptions, ...change };
}

describe("create theme generator", () => {
  it("keeps the default override block minimal", () => {
    const generated = generateTheme(options());
    expect(generated.css).toBe("/* Nyx theme overrides */\n:root {\n}");
    expect(generated.fontLink).toBe("");
    expect(generated.htmlAttribute).toContain('data-nyx-theme="solar"');
    expect(Object.keys(generated.installCommands)).toEqual(["pnpm", "npm", "yarn", "bun"]);
  });

  it.each([
    [options({ accent: "custom", customColor: "#ffffff" }), "--nyx-accent: #ffffff"],
    [options({ palette: "slate" }), "--nyx-panel: #0d1921"],
    [options({ radius: "round" }), "--nyx-radius-panel: 1.5rem"],
    [options({ font: "space" }), '--font-nyx: "Space Mono"'],
    [options({ borders: "hairline" }), "--nyx-border: 0.0625rem"],
    [options({ shadows: "flat" }), "--nyx-shadow-raised: none"],
    [options({ motion: "snappy" }), "--nyx-duration-normal: 110ms"],
  ] as const)("emits only the selected non-default token group", (selected, expected) => {
    expect(generateTheme(selected).css).toContain(expected);
  });

  it("chooses the higher-contrast black or white custom accent ink", () => {
    expect(accentInk("#ffffff")).toBe("#000000");
    expect(accentInk("#05080b")).toBe("#ffffff");
    expect(contrastRatio("#ffffff", accentInk("#ffffff"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#05080b", accentInk("#05080b"))).toBeGreaterThanOrEqual(4.5);
  });

  it("uses the HTML theme attribute for named accents", () => {
    expect(generateTheme(options({ accent: "plasma" })).htmlAttribute).toBe('<html data-nyx-theme="plasma">');
    expect(generateTheme(options({ accent: "plasma" })).css).toBe("/* Nyx theme overrides */\n:root {\n}");
  });

  it("keeps ink and muted text AA against every panel palette", () => {
    Object.values(paletteTokens).forEach((palette) => {
      expect(contrastRatio(palette["--nyx-panel"]!, palette["--nyx-ink"]!)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette["--nyx-panel"]!, palette["--nyx-muted"]!)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("round-trips every option through the query string exactly", () => {
    const selected = options({
      accent: "custom",
      palette: "midnight",
      radius: "soft",
      font: "source-code",
      borders: "hairline",
      shadows: "flat",
      motion: "calm",
      customColor: "#12abef",
    });
    expect(decodeCreateOptions(encodeCreateOptions(selected))).toEqual(selected);
  });

  it("sets every canvas token group explicitly", () => {
    const tokens = tokensForOptions(options());
    expect(tokens).toHaveProperty("--nyx-accent-soft");
    expect(tokens).toHaveProperty("--nyx-panel-raised");
    expect(tokens).toHaveProperty("--nyx-radius-panel");
    expect(tokens).toHaveProperty("--nyx-duration-normal");
    expect(tokens).toHaveProperty("--nyx-shadow-raised");
  });
});
