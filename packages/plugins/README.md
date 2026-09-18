# @nyx-ui/plugins

Optional framework-agnostic DOM behavior for Nyx UI components. Import only the component controller you use.

```js
import { initDialogs } from "@nyx-ui/plugins/dialog";

const dialogs = initDialogs();
```

Each interactive component is available from its own ESM subpath. The HTML remains the source of truth, and every controller provides explicit initialization and cleanup.
