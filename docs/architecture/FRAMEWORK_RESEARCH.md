# Nyx UI Framework Research and Architecture Direction

Status: Proposed foundation  
Research date: 2026-09-17  
Reference: [`nyx-design/index.html`](../../nyx-design/index.html) and [`NYX_UI_PROJECT_BRIEF.md`](../../nyx-design/NYX_UI_PROJECT_BRIEF.md)

## Executive decision

Nyx UI should use a hybrid distribution model:

1. A small, stable Tailwind CSS foundation package for tokens, themes, variants, and base styles.
2. Optional, framework-agnostic TypeScript behavior modules for interactive components.
3. An open-code registry that installs editable component source into a consumer's project.
4. Framework adapters only after the HTML and behavior contracts are stable.

This direction applies our architectural research without naming or imitating another UI product. Nyx remains visually distinctive, Tailwind-first, usable from plain HTML, and lightweight when a project only needs a few components.

## Research conclusions

### Universal markup and optional behavior

Nyx uses normal HTML styled with Tailwind utilities plus optional headless JavaScript behavior. Its package design exposes individual plugin subpaths, CSS variants, and theme CSS. Consumers register package files with Tailwind using `@source` and load all behavior or only selected modules.

The contract is:

- Plain, semantic HTML as the universal component format.
- Behavior activated through documented `data-*` attributes.
- Both automatic initialization and explicit programmatic initialization.
- Per-component ESM exports so unused behavior is not bundled.
- Lifecycle methods and public events for dynamic applications.
- Framework guides built on one underlying DOM contract.

Nyx avoids:

- Making the all-plugins bundle the recommended path.
- Pulling charting, date-picker, data-table, upload, and color dependencies into the core package.
- Requiring a permanent document-wide observer when an application can initialize a known subtree explicitly.

### Open-code distribution

Nyx uses a registry that records files and dependencies while its installer places source in the consumer's project. The consumer owns and can edit that source. A project-level configuration file tells the installer where to place components and utilities.

The contract is:

- Source ownership for component markup and framework adapters.
- A machine-readable registry containing dependencies, files, metadata, and documentation links.
- Dry-run, diff, and overwrite-safe installation behavior.
- One canonical component record that can drive the registry, documentation, examples, and tests.
- Predictable composition and naming across every component.

Nyx avoids:

- Starting as React-only.
- Requiring a large CLI before the component contracts are proven.
- Hiding important behavior inside generated code that differs from the documented HTML version.

Nyx will add its own branded installer only when Nyx-specific installation or migration behavior justifies maintaining it.

### Tailwind CSS 4

Tailwind CSS 4 provides the right foundation for a shareable Nyx theme. `@theme` variables create both CSS custom properties and matching utilities. Shared theme files can be published and imported across projects. `@source` explicitly registers component source that lives in a dependency, while `@custom-variant` can expose theme selectors such as `data-nyx-theme` as variants.

Nyx should therefore be CSS-first and target Tailwind CSS 4 from the beginning. It should not make a JavaScript configuration preset its primary token API.

### Accessible primitives and overlay positioning

Accessibility is behavior, not only ARIA attributes: focus management, keyboard navigation, labelling, and correct native elements must be designed together. Overlay positioning must remain modular and framework-independent.

The HTML edition prefers native elements, implements WAI-ARIA patterns where native controls are insufficient, and isolates any collision-aware positioning dependency to the overlay modules that require it.

## Nyx's product position

Nyx is not merely a dark theme and it is not another collection of copied Tailwind snippets.

Its identity is:

- operational, precise, and high-contrast;
- recognizable through slate-black surfaces, strong two-pixel boundaries, compact geometry, mono typography, and one controlled accent signal;
- useful in plain HTML before any framework adapter is installed;
- accessible and keyboard-complete by default;
- source-ownable at the component layer;
- small at runtime because behavior is optional and imported per component;
- deterministic across viewport sizes, especially in typography.

## Proposed repository architecture

```text
nyx-stealth/
├─ apps/
│  ├─ docs/                  # Documentation, live examples, registry endpoint
│  └─ playground/            # Manual development and accessibility sandbox
├─ packages/
│  ├─ core/                  # Tailwind v4 theme, tokens, base styles, variants
│  ├─ plugins/               # Framework-agnostic TypeScript behaviors
│  └─ testing/               # Shared accessibility and interaction helpers
├─ registry/
│  ├─ components/            # Canonical source-owned component files
│  ├─ blocks/                # Larger compositions and application patterns
│  └─ registry.json          # Machine-readable distribution manifest
├─ examples/
│  ├─ html-vite/
│  └─ react-vite/            # Added after the HTML contract is stable
├─ tests/
│  ├─ accessibility/
│  ├─ interaction/
│  └─ visual/
├─ nyx-design/               # Visual source of truth and project brief
└─ docs/architecture/        # Decisions and research such as this document
```

### Package boundaries

#### `@nyx-ui/core`

Contains only CSS-facing foundations:

- Tailwind `@theme` variables;
- semantic runtime variables under `--nyx-*`;
- theme selectors such as `[data-nyx-theme="solar"]`;
- base focus, typography, motion, and reduced-motion rules;
- optional component-layer CSS where utilities alone would create fragile markup;
- custom variants for states and themes.

It must not depend on a JavaScript framework.

#### `@nyx-ui/plugins`

Contains optional DOM behavior with subpath exports:

```ts
import { NyxDialog } from "@nyx-ui/plugins/dialog";
import { NyxTooltip } from "@nyx-ui/plugins/tooltip";
```

Every interactive plugin should provide:

- a constructor or `init(root)` entry point;
- an idempotent initializer;
- `destroy()` cleanup;
- typed public events;
- documented keyboard behavior;
- synchronization of `aria-*`, `hidden`, and `data-state`;
- no styling decisions beyond state attributes and positioning variables.

An optional `@nyx-ui/plugins/auto` entry point may scan `[data-nyx-*]`. It must remain opt-in.

#### Registry

The registry is the source of installable component markup, not a compiled runtime. Each item should describe:

- component name and version;
- category and maturity status;
- source files;
- required core version;
- optional plugin dependencies;
- external dependencies;
- accessibility pattern;
- supported states and themes;
- documentation and test locations.

The docs site and examples must render the same source files distributed by the registry. This prevents the documentation demo and installed component from drifting apart.

#### Icons

Do not build a full icon library in the first release. Nyx components must accept arbitrary inline SVG and use a common size/stroke contract. A small `@nyx-ui/icons` package should be reserved for genuinely Nyx-specific brand and product symbols later.

## Styling and theming contract

Nyx uses two related token layers:

1. Tailwind theme variables such as `--color-nyx-panel` create utilities.
2. Semantic variables such as `--nyx-surface-panel` power stable component roles and theme overrides.

Example direction:

```css
@theme static {
  --font-nyx: "JetBrains Mono", ui-monospace, monospace;
  --text-nyx-body: 0.8125rem;
  --radius-nyx-control: 0.375rem;
  --color-nyx-accent: #f5d90a;
}

:root,
:root[data-nyx-theme="solar"] {
  --nyx-accent: var(--color-nyx-accent);
  --nyx-accent-ink: #05080b;
}
```

Themes may change accent roles and deliberately documented surface roles. Semantic success, warning, danger, and information colors must not silently change meaning between themes.

## Typography stability contract

Typography is a release-blocking API, not decoration. The reference design's role scale must be extracted once into tokens and then reused everywhere.

Rules:

- `html` remains at the browser default `font-size: 100%`.
- Functional text never uses viewport units.
- Breakpoints must not reduce a typography role's size.
- `clamp()` is not used for controls, labels, metadata, tables, or body copy.
- Responsive rules change layout, wrapping, visibility, spacing, and density—not type identity.
- Component examples may not contain arbitrary `text-[Npx]` values.
- The same role token must resolve to the same computed size at 390, 768, 1280, 1440, and 2560 CSS pixels.
- Tests must include browser zoom and 32-inch 2560×1440 desktop review.
- Any intentional compact-density mode must be explicit (`data-nyx-density="compact"`) and must not activate from viewport width.

The design reference currently contains many inline pixel values. Those values are evidence for the scale, not production component code. During extraction, each value must map to a named role or be rejected as an inconsistency.

## Component anatomy contract

Every documented component must expose the same information:

1. Purpose and appropriate use.
2. Semantic HTML anatomy.
3. Variants, sizes, and supported states.
4. Keyboard interaction.
5. Required ARIA relationships.
6. Tailwind and semantic token usage.
7. Optional behavior import.
8. Copyable source.
9. Accessibility, interaction, and visual tests.

State is expressed consistently:

- `data-state="open|closed|active|inactive|checked|unchecked"`
- `data-disabled` plus the correct native or ARIA disabled state
- `data-invalid` plus `aria-invalid="true"`
- `aria-expanded`, `aria-controls`, and `aria-selected` where the pattern requires them

## Dependency policy

- Core CSS: zero runtime dependencies.
- Static components: zero JavaScript dependencies.
- Plugins: no shared global runtime; each import includes only what it needs.
- Overlay positioning: `@floating-ui/dom` is allowed only for tooltip, popover, dropdown, combobox, and similar modules.
- Icons: peer/documentation integration, not bundled icon sets.
- Charts, calendars, data grids, and editors: styled adapters and examples, not dependencies of core.
- React/Vue/Svelte: adapters must remain separate packages or registry targets.

## Tooling direction

The repository can start with:

- pnpm workspaces;
- TypeScript project references and `tsc` for small ESM packages;
- Tailwind CSS 4;
- Vitest for unit and DOM interaction tests;
- Playwright for keyboard, accessibility integration, and visual regression tests;
- Changesets when the first publishable package exists.

Turborepo is optional. Add it only when workspace task orchestration becomes measurably useful; it is not required to validate the first components.

## First implementation milestone

The first milestone should prove the architecture with a vertical slice, not maximize component count:

1. Scaffold the workspace and quality commands.
2. Extract and normalize color, typography, spacing, radius, border, shadow, motion, and breakpoint tokens from the reference.
3. Build the docs shell using the real `@nyx-ui/core` package.
4. Implement Button as a static source-owned component.
5. Implement Dialog as an interactive plugin with focus management, Escape handling, focus return, scroll locking, and accessible labelling.
6. Publish both through the local registry.
7. Consume them from the HTML/Vite example instead of importing private source paths.
8. Test typography at all contracted viewport widths and test Dialog by keyboard.

If this slice is clean, the same contract can expand to fields, tabs, accordion, tooltip, dropdown, toast, and the rest of the initial release.

## Decisions recorded now

- Tailwind baseline: version 4.
- Universal component language: semantic HTML plus Tailwind utilities.
- Styling distribution: `@nyx-ui/core`.
- Behavior distribution: optional per-plugin ESM imports.
- Component distribution: open-code registry.
- Framework policy: framework-agnostic first; adapters later.
- Theme mechanism: root `data-nyx-theme` attribute and CSS variable overrides.
- Typography policy: fixed role tokens; no responsive shrinking.
- License: Apache-2.0, matching the repository's current `LICENSE`.

## Decisions intentionally deferred

- Public npm scope availability.
- Final docs framework.
- Whether a branded CLI is justified after the registry prototype.
- The first official external icon integration.
- Light theme support.
- Charting and date-picker adapter choices.
- Formal browser support matrix beyond compatibility with the chosen Tailwind CSS 4 release.

These decisions do not block the vertical slice.
