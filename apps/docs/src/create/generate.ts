export const accentNames = ["solar", "signal", "flux", "plasma", "custom"] as const;
export const paletteNames = ["void", "graphite", "slate", "midnight"] as const;
export const radiusNames = ["sharp", "default", "soft", "round"] as const;
export const fontNames = ["jetbrains", "ibm-plex", "space", "source-code"] as const;
export const borderNames = ["hairline", "default"] as const;
export const shadowNames = ["flat", "elevated"] as const;
export const motionNames = ["calm", "default", "snappy"] as const;

export type AccentName = (typeof accentNames)[number];
export type PaletteName = (typeof paletteNames)[number];
export type RadiusName = (typeof radiusNames)[number];
export type FontName = (typeof fontNames)[number];
export type BorderName = (typeof borderNames)[number];
export type ShadowName = (typeof shadowNames)[number];
export type MotionName = (typeof motionNames)[number];

export interface CreateOptions {
  accent: AccentName;
  palette: PaletteName;
  radius: RadiusName;
  font: FontName;
  borders: BorderName;
  shadows: ShadowName;
  motion: MotionName;
  customColor: string;
}

export interface GeneratedTheme {
  installCommands: Record<"pnpm" | "npm" | "yarn" | "bun", string>;
  css: string;
  fontLink: string;
  htmlAttribute: string;
}

export const defaultCreateOptions: CreateOptions = {
  accent: "solar",
  palette: "void",
  radius: "default",
  font: "jetbrains",
  borders: "default",
  shadows: "elevated",
  motion: "default",
  customColor: "#f25f4c",
};

export const accentTokens: Record<Exclude<AccentName, "custom">, Record<string, string>> = {
  solar: {
    "--nyx-accent": "#f5d90a",
    "--nyx-accent-hi": "#ffe93f",
    "--nyx-accent-ink": "#05080b",
    "--nyx-accent-soft": "rgb(245 217 10 / 10%)",
    "--nyx-accent-line": "rgb(245 217 10 / 48%)",
  },
  signal: {
    "--nyx-accent": "#00e08a",
    "--nyx-accent-hi": "#4dffb6",
    "--nyx-accent-ink": "#04120c",
    "--nyx-accent-soft": "rgb(0 224 138 / 10%)",
    "--nyx-accent-line": "rgb(0 224 138 / 48%)",
  },
  flux: {
    "--nyx-accent": "#35c6f4",
    "--nyx-accent-hi": "#6fdcff",
    "--nyx-accent-ink": "#03121a",
    "--nyx-accent-soft": "rgb(53 198 244 / 10%)",
    "--nyx-accent-line": "rgb(53 198 244 / 48%)",
  },
  plasma: {
    "--nyx-accent": "#8b7cf6",
    "--nyx-accent-hi": "#a99cff",
    "--nyx-accent-ink": "#0a0718",
    "--nyx-accent-soft": "rgb(139 124 246 / 12%)",
    "--nyx-accent-line": "rgb(139 124 246 / 48%)",
  },
};

export const paletteTokens: Record<PaletteName, Record<string, string>> = {
  void: {
    "--nyx-void": "#05080b",
    "--nyx-radial": "#0a1014",
    "--nyx-panel": "#0a0f14",
    "--nyx-panel-raised": "#0d1318",
    "--nyx-input": "#0d1216",
    "--nyx-chip": "#121a1f",
    "--nyx-line": "#1a222a",
    "--nyx-line-strong": "#26313a",
    "--nyx-ink": "#e8eef0",
    "--nyx-muted": "#a8b4b8",
    "--nyx-label": "#7f8d93",
    "--nyx-disabled": "#536068",
  },
  graphite: {
    "--nyx-void": "#080809",
    "--nyx-radial": "#101012",
    "--nyx-panel": "#131316",
    "--nyx-panel-raised": "#19191d",
    "--nyx-input": "#17171a",
    "--nyx-chip": "#1e1e23",
    "--nyx-line": "#2a2a31",
    "--nyx-line-strong": "#3d3d47",
    "--nyx-ink": "#f0f0f2",
    "--nyx-muted": "#b5b5bd",
    "--nyx-label": "#94949f",
    "--nyx-disabled": "#666672",
  },
  slate: {
    "--nyx-void": "#071016",
    "--nyx-radial": "#0b161e",
    "--nyx-panel": "#0d1921",
    "--nyx-panel-raised": "#12212b",
    "--nyx-input": "#101c25",
    "--nyx-chip": "#172630",
    "--nyx-line": "#243640",
    "--nyx-line-strong": "#354b57",
    "--nyx-ink": "#e8f1f5",
    "--nyx-muted": "#adbdc5",
    "--nyx-label": "#8ca0aa",
    "--nyx-disabled": "#5b707b",
  },
  midnight: {
    "--nyx-void": "#070919",
    "--nyx-radial": "#0c1023",
    "--nyx-panel": "#0e1329",
    "--nyx-panel-raised": "#141a34",
    "--nyx-input": "#11162e",
    "--nyx-chip": "#19203c",
    "--nyx-line": "#28304f",
    "--nyx-line-strong": "#3b4668",
    "--nyx-ink": "#eef0ff",
    "--nyx-muted": "#b4bbdc",
    "--nyx-label": "#929bc4",
    "--nyx-disabled": "#606b91",
  },
};

export const radiusTokens: Record<RadiusName, Record<string, string>> = {
  sharp: { "--nyx-radius-xs": "0", "--nyx-radius-sm": "0", "--nyx-radius-control": "0", "--nyx-radius-panel": "0", "--nyx-radius-round": "0" },
  default: { "--nyx-radius-xs": "0.125rem", "--nyx-radius-sm": "0.25rem", "--nyx-radius-control": "0.375rem", "--nyx-radius-panel": "0.5rem", "--nyx-radius-round": "999px" },
  soft: { "--nyx-radius-xs": "0.25rem", "--nyx-radius-sm": "0.5rem", "--nyx-radius-control": "0.75rem", "--nyx-radius-panel": "1rem", "--nyx-radius-round": "999px" },
  round: { "--nyx-radius-xs": "0.5rem", "--nyx-radius-sm": "0.75rem", "--nyx-radius-control": "1rem", "--nyx-radius-panel": "1.5rem", "--nyx-radius-round": "999px" },
};

export const fontDefinitions: Record<FontName, { family: string; href: string }> = {
  jetbrains: { family: '"JetBrains Mono", "Cascadia Code", ui-monospace, monospace', href: "" },
  "ibm-plex": { family: '"IBM Plex Mono", "Cascadia Code", ui-monospace, monospace', href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" },
  space: { family: '"Space Mono", "Cascadia Code", ui-monospace, monospace', href: "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" },
  "source-code": { family: '"Source Code Pro", "Cascadia Code", ui-monospace, monospace', href: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600;700&display=swap" },
};

export const motionTokens: Record<MotionName, Record<string, string>> = {
  calm: {
    "--nyx-duration-instant": "120ms", "--nyx-duration-fast": "180ms", "--nyx-duration-normal": "260ms", "--nyx-duration-deliberate": "400ms", "--nyx-duration-slow": "600ms",
    "--nyx-duration-spinner": "1100ms", "--nyx-duration-pulse": "2200ms", "--nyx-duration-progress": "2100ms", "--nyx-duration-shimmer": "2400ms", "--nyx-duration-signal": "2500ms",
  },
  default: {
    "--nyx-duration-instant": "80ms", "--nyx-duration-fast": "120ms", "--nyx-duration-normal": "180ms", "--nyx-duration-deliberate": "280ms", "--nyx-duration-slow": "420ms",
    "--nyx-duration-spinner": "750ms", "--nyx-duration-pulse": "1600ms", "--nyx-duration-progress": "1500ms", "--nyx-duration-shimmer": "1700ms", "--nyx-duration-signal": "1800ms",
  },
  snappy: {
    "--nyx-duration-instant": "40ms", "--nyx-duration-fast": "70ms", "--nyx-duration-normal": "110ms", "--nyx-duration-deliberate": "170ms", "--nyx-duration-slow": "240ms",
    "--nyx-duration-spinner": "520ms", "--nyx-duration-pulse": "1000ms", "--nyx-duration-progress": "900ms", "--nyx-duration-shimmer": "1050ms", "--nyx-duration-signal": "1100ms",
  },
};

function isOneOf<T extends readonly string[]>(values: T, value: string | null): value is T[number] {
  return value !== null && values.includes(value);
}

export function normalizeHex(value: string): string {
  const compact = value.trim().toLocaleLowerCase();
  if (/^#[0-9a-f]{6}$/.test(compact)) return compact;
  if (/^#[0-9a-f]{3}$/.test(compact)) return `#${compact.slice(1).split("").map((part) => `${part}${part}`).join("")}`;
  return defaultCreateOptions.customColor;
}

function relativeLuminance(hex: string): number {
  const normalized = normalizeHex(hex).slice(1);
  const channels = [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function accentInk(color: string): "#000000" | "#ffffff" {
  return contrastRatio(color, "#000000") >= contrastRatio(color, "#ffffff") ? "#000000" : "#ffffff";
}

export function customAccentTokens(color: string): Record<string, string> {
  const accent = normalizeHex(color);
  return {
    "--nyx-accent": accent,
    "--nyx-accent-hi": `color-mix(in srgb, ${accent} 76%, white)`,
    "--nyx-accent-ink": accentInk(accent),
    "--nyx-accent-soft": `color-mix(in srgb, ${accent} 11%, transparent)`,
    "--nyx-accent-line": `color-mix(in srgb, ${accent} 48%, transparent)`,
  };
}

function paletteOverrideTokens(name: PaletteName): Record<string, string> {
  const palette = paletteTokens[name];
  return {
    ...palette,
    "--nyx-void-glass": `color-mix(in srgb, ${palette["--nyx-void"]} 94%, transparent)`,
    "--nyx-void-chip": `color-mix(in srgb, ${palette["--nyx-void"]} 88%, transparent)`,
    "--nyx-overlay": `color-mix(in srgb, ${palette["--nyx-void"]} 82%, transparent)`,
  };
}

export function tokensForOptions(options: CreateOptions): Record<string, string> {
  const accents = options.accent === "custom" ? customAccentTokens(options.customColor) : accentTokens[options.accent];
  const shadows = options.shadows === "flat"
    ? { "--nyx-shadow-raised": "none", "--nyx-shadow-float": "none", "--nyx-shadow-signal": "none" }
    : { "--nyx-shadow-raised": "0 0.75rem 2rem rgb(0 0 0 / 32%)", "--nyx-shadow-float": "0 1.625rem 4.375rem rgb(0 0 0 / 62%)", "--nyx-shadow-signal": "0 0 1.5rem var(--nyx-accent-soft)" };
  return {
    ...paletteTokens[options.palette],
    ...accents,
    ...radiusTokens[options.radius],
    "--font-nyx": fontDefinitions[options.font].family,
    "--nyx-border": options.borders === "hairline" ? "0.0625rem" : "0.125rem",
    ...shadows,
    ...motionTokens[options.motion],
    "--nyx-void-glass": `color-mix(in srgb, ${paletteTokens[options.palette]["--nyx-void"]} 94%, transparent)`,
    "--nyx-void-chip": `color-mix(in srgb, ${paletteTokens[options.palette]["--nyx-void"]} 88%, transparent)`,
    "--nyx-overlay": `color-mix(in srgb, ${paletteTokens[options.palette]["--nyx-void"]} 82%, transparent)`,
  };
}

export function encodeCreateOptions(options: CreateOptions): string {
  const params = new URLSearchParams();
  params.set("accent", options.accent);
  params.set("palette", options.palette);
  params.set("radius", options.radius);
  params.set("font", options.font);
  params.set("borders", options.borders);
  params.set("shadows", options.shadows);
  params.set("motion", options.motion);
  params.set("custom", normalizeHex(options.customColor));
  return params.toString();
}

export function decodeCreateOptions(value: string | URLSearchParams): CreateOptions {
  const params = typeof value === "string" ? new URLSearchParams(value.startsWith("?") ? value.slice(1) : value) : value;
  return {
    accent: isOneOf(accentNames, params.get("accent")) ? params.get("accent") as AccentName : defaultCreateOptions.accent,
    palette: isOneOf(paletteNames, params.get("palette")) ? params.get("palette") as PaletteName : defaultCreateOptions.palette,
    radius: isOneOf(radiusNames, params.get("radius")) ? params.get("radius") as RadiusName : defaultCreateOptions.radius,
    font: isOneOf(fontNames, params.get("font")) ? params.get("font") as FontName : defaultCreateOptions.font,
    borders: isOneOf(borderNames, params.get("borders")) ? params.get("borders") as BorderName : defaultCreateOptions.borders,
    shadows: isOneOf(shadowNames, params.get("shadows")) ? params.get("shadows") as ShadowName : defaultCreateOptions.shadows,
    motion: isOneOf(motionNames, params.get("motion")) ? params.get("motion") as MotionName : defaultCreateOptions.motion,
    customColor: normalizeHex(params.get("custom") ?? defaultCreateOptions.customColor),
  };
}

function declarations(options: CreateOptions): Record<string, string> {
  const output: Record<string, string> = {};
  if (options.accent === "custom") Object.assign(output, customAccentTokens(options.customColor));
  if (options.palette !== defaultCreateOptions.palette) Object.assign(output, paletteOverrideTokens(options.palette));
  if (options.radius !== defaultCreateOptions.radius) Object.assign(output, radiusTokens[options.radius]);
  if (options.font !== defaultCreateOptions.font) output["--font-nyx"] = fontDefinitions[options.font].family;
  if (options.borders !== defaultCreateOptions.borders) output["--nyx-border"] = "0.0625rem";
  if (options.shadows !== defaultCreateOptions.shadows) Object.assign(output, { "--nyx-shadow-raised": "none", "--nyx-shadow-float": "none", "--nyx-shadow-signal": "none" });
  if (options.motion !== defaultCreateOptions.motion) Object.assign(output, motionTokens[options.motion]);
  return output;
}

export function generateTheme(options: CreateOptions): GeneratedTheme {
  const rows = Object.entries(declarations(options)).map(([token, value]) => `  ${token}: ${value};`);
  const font = fontDefinitions[options.font];
  return {
    installCommands: {
      pnpm: "pnpm add @nyx-raul/core @nyx-raul/plugins",
      npm: "npm install @nyx-raul/core @nyx-raul/plugins",
      yarn: "yarn add @nyx-raul/core @nyx-raul/plugins",
      bun: "bun add @nyx-raul/core @nyx-raul/plugins",
    },
    css: ["/* Nyx theme overrides */", ":root {", ...rows, "}"].join("\n"),
    fontLink: font.href ? `<link href="${font.href}" rel="stylesheet">` : "",
    htmlAttribute: options.accent === "custom" ? "<html>" : `<html data-nyx-theme="${options.accent}">`,
  };
}
