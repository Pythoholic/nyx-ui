import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  accentTokens,
  accentInk,
  contrastRatio,
  createShareUrl,
  decodeCreateOptions,
  defaultCreateOptions,
  encodeCreateOptions,
  generateTheme,
  paletteTokens,
  tokensForOptions,
  type CreateOptions,
} from "../../../apps/docs/src/create/generate.js";

const coreTokens = readFileSync(resolve(process.cwd(), "../core/src/tokens.css"), "utf8");

function coreToken(name: string): string {
  const value = coreTokens.match(new RegExp(`^\\s*${name}:\\s*(#[0-9a-f]{6});`, "im"))?.[1];
  if (!value) throw new Error(`Missing hex token ${name}`);
  return value;
}

function options(change: Partial<CreateOptions> = {}): CreateOptions {
  return { ...defaultCreateOptions, ...change };
}

describe("create theme generator", () => {
  it("keeps the default override block minimal", () => {
    const generated = generateTheme(options());
    expect(generated.css).toBe("");
    expect(generated.hasOverrides).toBe(false);
    expect(generated.emptyOverridesMessage).toBe("Your choices match the defaults, so no overrides are needed.");
    expect(generated.fontLink).toContain("JetBrains+Mono:wght@400;500;600;700");
    expect(generated.htmlAttribute).toContain('data-nyx-theme="signal"');
    expect(Object.keys(generated.installCommands)).toEqual(["pnpm", "npm", "yarn", "bun"]);
    expect(Object.values(generated.installCommands).every((command) => (
      command.includes("@nyx-raul/core@beta") && command.includes("@nyx-raul/plugins@beta")
    ))).toBe(true);
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
    expect(generateTheme(options({ accent: "plasma" })).css).toBe("");
  });

  it("always supplies the selected font setup", () => {
    expect(generateTheme(options()).fontLink).toContain("JetBrains+Mono");
    expect(generateTheme(options({ font: "space" })).fontLink).toContain("Space+Mono");
  });

  it("builds every documented step and a complete combined setup", () => {
    const generated = generateTheme(options({ radius: "round" }));
    expect(generated.stylesheetEntry).toContain('@source "../node_modules/@nyx-raul/core/src/**/*.css"');
    expect(generated.plainCssEntry).toBe('@import "@nyx-raul/core";');
    expect(generated.behavior).toContain('import { initDialogs } from "@nyx-raul/plugins/dialog";');
    expect(generated.copyAll).toContain(generated.fontLink);
    expect(generated.copyAll).toContain(generated.stylesheetEntry);
    expect(generated.copyAll).toContain(generated.css);
    expect(generated.copyAll).toContain(generated.htmlAttribute);
  });

  it.each([
    [options({ accent: "solar" }), 'data-nyx-theme="solar"'],
    [options({ accent: "flux" }), 'data-nyx-theme="flux"'],
    [options({ accent: "plasma" }), 'data-nyx-theme="plasma"'],
    [options({ accent: "custom", customColor: "#12abef" }), "--nyx-accent: #12abef"],
    [options({ palette: "graphite" }), "--nyx-panel: #131316"],
    [options({ palette: "slate" }), "--nyx-panel: #0d1921"],
    [options({ palette: "midnight" }), "--nyx-panel: #0e1329"],
    [options({ radius: "sharp" }), "--nyx-radius-panel: 0"],
    [options({ radius: "soft" }), "--nyx-radius-panel: 1rem"],
    [options({ radius: "round" }), "--nyx-radius-panel: 1.5rem"],
    [options({ font: "ibm-plex" }), "IBM Plex Mono"],
    [options({ font: "space" }), "Space Mono"],
    [options({ font: "source-code" }), "Source Code Pro"],
    [options({ borders: "hairline" }), "--nyx-border: 0.0625rem"],
    [options({ shadows: "flat" }), "--nyx-shadow-raised: none"],
    [options({ motion: "calm" }), "--nyx-duration-normal: 260ms"],
    [options({ motion: "snappy" }), "--nyx-duration-normal: 110ms"],
  ] as const)("makes every non-default choice visible in generated output", (selected, expected) => {
    const generated = generateTheme(selected);
    const output = [
      ...Object.values(generated.installCommands),
      generated.htmlAttribute,
      generated.fontLink,
      generated.css,
    ].join("\n");
    expect(output).toContain(expected);
  });

  it("keeps ink and muted text AA against every panel palette", () => {
    Object.values(paletteTokens).forEach((palette) => {
      expect(contrastRatio(palette["--nyx-panel"]!, palette["--nyx-ink"]!)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette["--nyx-panel"]!, palette["--nyx-muted"]!)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("keeps every solid badge tone AA against every base palette", () => {
    const semanticPairs = [
      [coreToken("--nyx-signal"), coreToken("--nyx-signal-ink")],
      [coreToken("--nyx-warning"), coreToken("--nyx-warning-ink")],
      [coreToken("--nyx-danger"), coreToken("--nyx-danger-ink")],
    ] as const;

    Object.entries(paletteTokens).forEach(([paletteName, palette]) => {
      const tonePairs = [
        [palette["--nyx-chip"]!, palette["--nyx-label"]!],
        ...Object.values(accentTokens).map((accent) => [accent["--nyx-accent"]!, accent["--nyx-accent-ink"]!] as const),
        ...semanticPairs,
      ];
      tonePairs.forEach(([fill, ink]) => {
        expect(contrastRatio(fill, ink), `${paletteName}: ${ink} on ${fill}`).toBeGreaterThanOrEqual(4.5);
      });
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
    const shareUrl = new URL(createShareUrl("https://example.test/create#picker", selected));
    expect(shareUrl.pathname).toBe("/create");
    expect(shareUrl.hash).toBe("");
    expect(decodeCreateOptions(shareUrl.searchParams)).toEqual(selected);
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
