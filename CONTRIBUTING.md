# Contributing to Nyx UI

Thank you for contributing to Nyx UI. By participating, you agree to follow the
[Code of Conduct](./CODE_OF_CONDUCT.md). Please report security vulnerabilities
privately as described in the [Security Policy](./SECURITY.md).

## Development setup

Development requires Node.js 22 or newer and pnpm.

```shell
pnpm install
pnpm dev
```

The development server runs at `http://127.0.0.1:5174/`. It uses a strict port,
so startup fails if port 5174 is already occupied.

## Required checks

Run the complete gate before every commit:

```shell
pnpm test
pnpm typecheck
pnpm build
pnpm packages:check
```

Do not commit known failures. If a failure is unrelated or environment-specific,
describe it clearly in the pull request instead of silently omitting the check.

## Changesets

Add a Changeset for every consumer-visible package change, including new features,
fixes, breaking changes, and meaningful documentation changes to a published API:

```shell
pnpm changeset
```

Choose the affected package or packages, select the appropriate semantic version
impact, and describe the effect on consumers. Commit the generated file under
`.changeset/` with the implementation. Internal refactors, tests, and repository-only
documentation normally do not need a Changeset.

## Component and registry contract

Nyx UI components follow these rules:

- Prefer native HTML elements and platform behavior before adding JavaScript.
- Preserve documented ARIA state and `data-nyx-*` hooks. Treat these hooks as public
  integration points, not implementation details.
- Keep keyboard, focus, and accessible-name behavior intact across supported states.
- Interactive controllers must expose `destroy()` and release every listener,
  observer, timer, or shared resource they own.

When adding or modifying a component:

1. Start with or update its canonical markup under `registry/components/` and use
   native elements wherever possible.
2. Add or update behavior in `packages/plugins/` only when markup and CSS are not
   sufficient. Maintain the controller lifecycle and `destroy()` contract.
3. Update `registry/registry.json` for every added, removed, renamed, or dependency-
   changing registry item. Keep its file list and `requires` entries accurate.
4. Update the documentation catalog and examples so supported states, keyboard
   behavior, ARIA behavior, and cleanup requirements are discoverable.
5. Add or update unit and browser tests, then run the complete required gate.
6. Add a Changeset when consumers will observe the change.

## Commits and pull requests

Keep commits focused, with imperative messages that explain the change. Avoid
mixing unrelated formatting or generated output into a functional change.

Pull requests should explain the problem and solution, link any related issue,
identify the affected package or registry item, and call out accessibility and
compatibility implications. Include screenshots for visual changes and state
whether a Changeset is included or why one is not. All required checks must pass
before review.

Publishing and version application are maintainer-only operations. Contributors
must not run `pnpm release` or publish Nyx UI packages as part of ordinary work.
