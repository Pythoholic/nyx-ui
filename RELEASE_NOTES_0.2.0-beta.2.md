Nyx UI is an open-source interface system for dense applications, operational workspaces, creative tools, and data-heavy products. It is for teams that want semantic HTML and ownership of component markup while sharing a CSS foundation and optional browser behavior.

## What makes it different

- Native elements come first: forms remain forms, tables remain tables, and modal behavior composes the native `dialog` element.
- Registry markup is copied into and owned by the adopting project instead of imported as a closed component.
- Browser behavior is optional and imported through per-component subpaths rather than a required framework layer.
- Controllers keep documented `data-state` and ARIA state synchronized, emit cancelable before-events, and expose `destroy()` for cleanup.

## What ships

- `@nyx-raul/core`: CSS tokens, themes, foundations, motion, and component styles.
- `@nyx-raul/plugins`: optional framework-agnostic behavior through 43 per-component subpaths.
- `@nyx-raul/mcp`: a read-only MCP server that exposes the registry.
- Registry: 68 entries; 65 stable and 3 preview. The preview entries are `calendar`, `date-picker`, and `advanced-data-table`.

At this tag, CI is green with 5 MCP and 212 plugin unit tests, plus 141 Chromium browser tests across 15 spec files.

## Try it

```shell
git clone https://github.com/Pythoholic/nyx-ui.git
cd nyx-ui
pnpm install && pnpm dev
```

Open http://127.0.0.1:5174/.

## Beta status

- APIs may change before the stable release.
- The packages are not yet published to npm. They will ship under the npm `beta` dist-tag once published.
- The three preview components may change shape.
- Nyx UI is maintained by one person. Report vulnerabilities through [SECURITY.md](https://github.com/Pythoholic/nyx-ui/blob/v0.2.0-beta.2/SECURITY.md) and see [CONTRIBUTING.md](https://github.com/Pythoholic/nyx-ui/blob/v0.2.0-beta.2/CONTRIBUTING.md) before contributing.

## Requirements

- Node.js 22 or newer for development.
- pnpm.
- A modern browser.
- Tailwind CSS is optional. When used, the supported peer range is `>=4 <5`; direct prebuilt-CSS use does not require Tailwind and is warning-free.

Maintained by Soumya Raula, Senior Software Engineer, AI, Cloud, SRE. Licensed under Apache-2.0.
