# Nyx UI

Nyx is an independent, open-source Tailwind CSS UI system for modern websites, applications, dashboards, creative tools, and operational interfaces.

The project is currently in its foundation phase. Its intended architecture combines a small Tailwind CSS token package, optional framework-agnostic behavior modules, and an open-code component registry.

## Project documents

- [Project brief](./nyx-design/NYX_UI_PROJECT_BRIEF.md)
- [Design-system reference](./nyx-design/index.html)
- [Framework research and architecture direction](./docs/architecture/FRAMEWORK_RESEARCH.md)

## Current status

The first working vertical slice is live:

- Tailwind CSS 4 tokens, semantic variables, and four accent themes
- fixed, rem-based typography roles that never shrink at breakpoints
- reusable Button, field, badge, panel, icon, code, and Dialog styles
- an optional framework-agnostic Dialog controller
- source-owned Button and Dialog registry entries
- an interactive documentation laboratory consuming the workspace packages

## Run locally

```shell
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173/`.

## Validate

```shell
pnpm typecheck
pnpm build
```
