# Nyx project context

## Package and source model

- `@nyx-ui/core` exposes the tokens, themes, foundations, and component CSS.
- `@nyx-ui/plugins` exposes optional framework-agnostic controllers through per-component subpaths.
- Registry HTML is copied into the consumer repository and becomes application-owned source.
- Interactive registry entries declare their required plugin subpath and initializer in their contract.

Use the project's existing package runner. Do not assume npm when `pnpm-lock.yaml`, `yarn.lock`, or `bun.lock` establishes another manager.

## CSS integration

A Tailwind CSS 4 application normally includes its own source plus Nyx Core:

```css
@source "../src/**/*.{html,js,ts,jsx,tsx}";
@source "../node_modules/@nyx-ui/core/src/**/*.css";
@import "@nyx-ui/core";
```

Preserve an established import order. Do not create a second global stylesheet when the project already has one.

## Themes

Nyx themes are selected structurally with `data-nyx-theme` on the document root or a deliberately scoped subtree. Use semantic Nyx tokens and existing component classes instead of replacing them with raw accent colors.

## Behavior lifecycle

Import the exact subpath named by the registry contract:

```js
import { initDialogs } from "@nyx-ui/plugins/dialog";

const instances = initDialogs(root);
// Before replacing or removing root:
instances.forEach((instance) => instance.destroy());
```

Initializers are subtree-oriented and return controller instances. In React or another rendering framework, initialize after mount and destroy from the corresponding cleanup lifecycle. Do not invent a framework wrapper that Nyx does not ship.

## Ownership boundary

The consumer owns copied markup and every local modification. Nyx continues to own the canonical registry version, CSS, controller APIs, and documentation. Updates are deliberate comparisons; never overwrite adapted source without reviewing the delta.
