# Nyx UI

Nyx is an independent, open-source Tailwind CSS UI system for modern websites, applications, dashboards, creative tools, and operational interfaces.

Its architecture combines a small Tailwind CSS token package, optional framework-agnostic behavior modules, and an open-code component registry.

## Project documents

- [Project brief](./nyx-design/NYX_UI_PROJECT_BRIEF.md)
- [Design-system reference](./nyx-design/index.html)
- [Framework research and architecture direction](./docs/architecture/FRAMEWORK_RESEARCH.md)

## Version 0.1 catalog

The complete initial catalog is live:

- Tailwind CSS 4 tokens, semantic variables, and four accent themes
- the original six-role JetBrains Mono scale with bounded display/data responsiveness
- spacing, geometry, elevation, z-index, responsive, and motion foundations
- actions, forms, navigation, overlays, feedback, data, charts, media, and layout components
- optional framework-agnostic Dialog, Tabs, and Toast behavior modules
- source-owned registry entries for every catalog family
- an interactive documentation laboratory consuming the workspace packages

The documentation catalog is the visual source of truth. Package CSS, behavior modules,
and registry markup are kept separate so applications can take only what they need.

## Run locally

```shell
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173/`.

## Validate

```shell
pnpm test
pnpm typecheck
pnpm build
pnpm packages:check
```

## Release packages

Add a release note for consumer-visible changes with `pnpm changeset`. Maintainers apply pending versions with `pnpm version-packages`, then run `pnpm release` to rebuild, verify the package tarballs, and publish the public packages.
