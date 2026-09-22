# @nyx-raul/plugins

Optional, framework-agnostic DOM controllers for interactive Nyx UI components. The package ships ESM and type declarations for the root entry point and for each documented component subpath.

## Install

```shell
pnpm add @nyx-raul/plugins@beta
```

Nyx Core supplies the corresponding component presentation. Install it separately with `pnpm add @nyx-raul/core@beta` when it is not already present.

## Import by component

Prefer a per-component entry such as `@nyx-raul/plugins/dialog`, `@nyx-raul/plugins/tabs`, or `@nyx-raul/plugins/toast` so unrelated controllers stay out of the consumer bundle:

```js
import { initDialogs } from "@nyx-raul/plugins/dialog";

const root = document.querySelector("#account-settings");
const dialogs = initDialogs(root);
```

Initializers search the supplied root and its descendants, reuse an existing controller for markup already initialized, and return the controller instances. Retain those instances for the lifetime of the rendered subtree.

## Events and cleanup

Controllers emit cancelable `before-*` events before state changes and non-cancelable after-events after state and focus settle. For a dialog:

```js
const dialog = root.querySelector("dialog[data-nyx-dialog]");

dialog?.addEventListener("nyx:dialog:before-close", (event) => {
  if (hasUnsavedChanges()) event.preventDefault();
});

dialog?.addEventListener("nyx:dialog:close", (event) => {
  persistCloseReason(event.detail.reason);
});
```

Destroy every returned controller before removing or replacing its subtree. This releases event listeners and shared resources and allows the same markup to be initialized again:

```js
dialogs.forEach((dialog) => dialog.destroy());
```

Application code still owns business logic, persistence, validation, permissions, and the lifecycle of its DOM.

## Project links

- [Repository and component registry](https://github.com/Pythoholic/nyx-ui)
- [Contributing](https://github.com/Pythoholic/nyx-ui/blob/main/CONTRIBUTING.md)
- [Security policy](https://github.com/Pythoholic/nyx-ui/blob/main/SECURITY.md)
- [Code of Conduct](https://github.com/Pythoholic/nyx-ui/blob/main/CODE_OF_CONDUCT.md)
- [Apache-2.0 license](https://github.com/Pythoholic/nyx-ui/blob/main/LICENSE)
