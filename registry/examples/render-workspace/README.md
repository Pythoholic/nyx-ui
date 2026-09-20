# Render workspace

A complete local batch rehearsal with two independent number inputs, scoped theme switching, an initially empty queue, cancel, retry, removal, and a recoverable failure. No service or image generation is implied.

From the repository root:

```sh
pnpm install
pnpm --filter @nyx-ui/plugins build
pnpm --filter @nyx-ui/workspace-example dev
```

Open `http://127.0.0.1:5175`. Increase Scenes once: it moves from 2 to 3. Queue a batch. Enable the failure option to exercise retry, and remove settled jobs to return to the empty state.

For an independent project, run `node scripts/copy-workspace-example.mjs ../my-workspace` from the repository root, then run `pnpm install` and `pnpm dev` in that folder after the Nyx packages are published. The copier changes local workspace references to the current package versions; it never overwrites an existing directory.

`index.html` loads JetBrains Mono weights 400, 500, 600, and 700 with swap behavior. You may self-host matching licensed font files. If unavailable, the CSS stack falls back to local monospace fonts.

`screen.html` is canonical markup: documentation imports this exact file with `?raw`. `app.ts` initializes both repeated number inputs and the queue. Application event handlers calculate the batch and report actions; the timer simulates a transport. The returned cleanup removes application listeners, clears the timer, and destroys every controller. Call it before replacing the screen. `entry.ts` supplies page and development cleanup; the documentation host calls the same cleanup during route changes.

To integrate, copy the folder and adapt `app.ts`. Replace the timer with your transport and retain its abort/cleanup behavior. A valid batch submits through native form validation; errors, empty state, progress, cancellation, and retry can all be exercised without a backend.
