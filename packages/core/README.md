# @nyx-ui/core

The CSS foundation for Nyx UI: design tokens, four accent themes, base styles, motion rules, and component styles without a JavaScript runtime.

## Install

For Tailwind CSS 4 projects, install the beta package with a compatible Tailwind release:

```shell
pnpm add @nyx-ui/core@beta tailwindcss@^4
```

Register the locations that contain Nyx markup, then import the stylesheet:

```css
@import "tailwindcss";
@source "../src/**/*.{html,js,ts,jsx,tsx}";
@source "../node_modules/@nyx-ui/core/src/**/*.css";
@import "@nyx-ui/core";
```

Tailwind CSS is an optional peer dependency with the supported range `>=4 <5`. It is required for the source-scanning workflow above.

## Direct CSS mode

Projects with an existing CSS bundler can consume the package stylesheet without installing Tailwind:

```shell
pnpm add @nyx-ui/core@beta
```

```css
@import "@nyx-ui/core";
```

The optional peer declaration keeps this mode free of an unexplained Tailwind peer warning. The package does not ship a browser CDN bundle; the CSS import must be handled by the consumer's bundler.

## Themes and customization

Choose one of the built-in accent themes on the document root or a subtree:

```html
<html data-nyx-theme="signal">
```

Available themes are `solar`, `signal`, `flux`, and `plasma`. Components consume semantic custom properties, so an application can load Nyx first and override a focused token set afterward:

```css
:root {
  --nyx-accent: #7cf6d4;
  --nyx-accent-hi: #a8ffe8;
  --nyx-accent-ink: #03120e;
  --nyx-radius-control: 0.25rem;
  --nyx-radius-panel: 0.375rem;
}
```

Copy component markup from the [Nyx UI registry](https://github.com/Pythoholic/nyx-ui/tree/main/registry) and preserve its native elements, labels, ARIA relationships, and `data-nyx-*` hooks.

## Project links

- [Repository](https://github.com/Pythoholic/nyx-ui)
- [Contributing](https://github.com/Pythoholic/nyx-ui/blob/main/CONTRIBUTING.md)
- [Security policy](https://github.com/Pythoholic/nyx-ui/blob/main/SECURITY.md)
- [Code of Conduct](https://github.com/Pythoholic/nyx-ui/blob/main/CODE_OF_CONDUCT.md)
- [Apache-2.0 license](https://github.com/Pythoholic/nyx-ui/blob/main/LICENSE)
