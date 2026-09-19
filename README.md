# Nyx UI

Nyx is an open-source interface system for dense applications, operational workspaces, creative tools, and data-heavy products. It is designed for teams that want a strong visual language without giving up semantic HTML or ownership of their component markup.

The project separates styling, behavior, and markup so adopters can take only the layers they need:

- `@nyx-ui/core` provides tokens, themes, foundations, motion, and component CSS.
- `@nyx-ui/plugins` provides optional framework-agnostic controllers through per-component ESM subpaths.
- `registry/` provides canonical, editable HTML for every catalog component and layout.
- `apps/docs` renders those same registry files as the live documentation catalog.

## What ships

The catalog contains 86 component routes across actions, forms, primitives, navigation, overlays, feedback, data display, visualization, media, AI-product patterns, and layouts. It includes static semantic patterns as well as controllers for dialogs, menus, composite form controls, tables, queues, uploads, carousels, workspace navigation, and other stateful interfaces.

Nyx favors native elements first: forms remain forms, navigation remains links, tables remain tables, and modal behavior composes the native `dialog` element. Controllers add the behavior that HTML does not supply on its own, including focus movement, keyboard interaction, dismissal, positioning, synchronized state, cancelable before-events, and cleanup.

## Installation

Package distribution is being evaluated before the first public release. The final consumer install commands will be added after that decision; do not assume that the current package names are available from a public registry yet.

To evaluate Nyx from this repository today, clone it, install the workspace dependencies, and run the documentation application:

```shell
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5174/`.

## How the pieces fit

### CSS and Tailwind CSS

Core exposes one CSS entry that imports the tokens, base rules, motion language, and component styles. A Tailwind CSS 4 application registers the package source and imports core from its main stylesheet:

```css
@source "../node_modules/@nyx-ui/core/src/**/*.css";
@import "@nyx-ui/core";
```

Themes are structural. Set `data-nyx-theme` on the document root and the semantic accent tokens flow through every component:

```html
<html data-nyx-theme="signal">
```

### Registry markup

Registry files are the source-owned component layer. Copy the component HTML into application code, then adapt its content while preserving the documented labels, native elements, ARIA relationships, and `data-nyx-*` hooks. Each entry in `registry/registry.json` lists the files and package requirements for that pattern.

Static components need only core CSS. Interactive components also name the behavior subpath they require.

### Optional behavior

Import behavior by component rather than loading the package root:

```js
import { initDialogs } from "@nyx-ui/plugins/dialog";

const instances = initDialogs(document);

// Before replacing the initialized subtree:
instances.forEach((instance) => instance.destroy());
```

Initializers include a matching root, are idempotent for a mounted element, and return controllers with explicit cleanup. Component pages document public methods, options, events, keyboard behavior, and the application-owned boundary.

React applications use the same registry markup and initialize the relevant subtree from an effect. Nyx does not require a React wrapper layer.

## Where to start

- Browse the local catalog at `http://127.0.0.1:5174/` after starting the dev server.
- Read [Framework research and architecture direction](./docs/architecture/FRAMEWORK_RESEARCH.md) for the package and registry model.
- Read [Build loop](./docs/architecture/BUILD_LOOP.md) for the lifecycle and completeness contract applied to components.
- Use `registry/registry.json` to inspect component maturity, canonical files, and runtime requirements.
- Use the Accessibility, Behavior, Registry, Theming, and React guides in the documentation application before integrating interactive components.

## Browser and accessibility contract

Nyx targets modern browsers and uses native platform behavior where it is the stronger primitive. Interactive controllers keep documented `data-state` and ARIA state synchronized, provide keyboard behavior for composite widgets, emit cancelable before-events and after-events, and release listeners or shared resources from `destroy()`.

Adopters still own content quality, application validation, permissions, network work, routing, persistence unless explicitly opted into, and testing in their supported browser and assistive-technology matrix.

## Contributing

Requires Node.js 22 or newer and pnpm.

```shell
pnpm install
pnpm dev
```

`pnpm dev` builds the behavior package, then serves the documentation catalog on
`http://127.0.0.1:5173/`. The port is not pinned: if 5173 is already in use the dev server takes
the next free port and prints the URL it chose, so read the terminal output rather than assuming
5173. Stop the server with `Ctrl+C`; leaving one running is what holds the port for the next run.

To pin the port explicitly, pass it through:

```shell
pnpm dev -- --port 5173 --strictPort
```

`--strictPort` fails loudly instead of silently moving to another port, which is what you want
when a test run or a script expects a fixed URL.

Before committing a phase, run:

```shell
pnpm test
pnpm typecheck
pnpm build
pnpm packages:check
```

Consumer-visible changes use Changesets:

```shell
pnpm changeset
```

Maintainers apply pending versions with `pnpm version-packages`. Publishing is intentionally deferred until the distribution decision is recorded; do not run `pnpm release` as part of ordinary development.

## License

Apache-2.0
