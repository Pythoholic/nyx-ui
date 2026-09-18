Implement exactly ONE phase of the Nyx UI build, then stop.

You are running in a loop with a fresh context each time. You have no memory of previous iterations. Everything you need is on disk. When you finish, the loop restarts with a new context, so leave the repository in a state your successor can read and continue from.

## Before you write any code

1. Read `docs/architecture/BUILD_LOOP.md`. It is the single source of truth for what is done and what remains.
2. Read `docs/architecture/V0.2_SCOPING_NOTES.md` and `docs/architecture/FRAMEWORK_RESEARCH.md` for the architectural rulings that constrain every component.
3. **DO NOT ASSUME SOMETHING IS NOT IMPLEMENTED.** This repository already contains roughly 25 components and a large set of shared internals. Before building anything, check whether it already exists:
   - `ls packages/plugins/src/` for behavior modules
   - `ls packages/plugins/src/internal/` for shared helpers
   - `ls registry/components/` for canonical markup
   - `grep` for the relevant class names in `packages/core/src/components.css`
   Re-implementing something that exists, or adding a parallel system alongside it, is the single worst outcome of this loop. Mature what is there instead.

## Pick the work

Take the next 2 to 4 unchecked items from `BUILD_LOOP.md`, working strictly top to bottom: finish Priority 1, then Priority 2, then Priority 3, then small primitives, then release blockers. Group items only when they genuinely share infrastructure. Do not skip ahead, and do not cherry-pick easy items.

## Build it

Every component must satisfy the project contract:

- Phase 1 lifecycle where the component has behavior: root-inclusive idempotent `initX(root)`, explicit constructor, cache-safe `destroy()` that uncaches the instance, cancelable `nyx:<component>:before-<action>` events paired with bubbling `nyx:<component>:<action>` events, and synchronized `data-state` and `aria-*`.
- Per-component ESM subpath export in `packages/plugins/package.json`.
- Canonical registry markup in `registry/components/`, consumed by the docs through the existing `?raw` import path. The displayed source must be the same source that renders the demo.
- A docs page using the tabbed Preview/HTML presentation, with copy button, data-attribute/methods/events/keyboard reference tables, and accessibility notes.
- A `registry.json` entry.
- Component CSS in `packages/core/src/components.css` following existing conventions.
- Vitest coverage of the real behavior, not smoke tests.

Reuse the existing internals — positioning, dismissal, roving focus, typeahead, result list — wherever their contracts genuinely match. Do not reimplement them, and do not force a fit where the semantics differ. A listbox is not a menu; a navigation menu is not a menubar.

Prefer native HTML elements over reimplementing ARIA patterns from scratch.

## Constraints

- No new runtime dependencies beyond `@floating-ui/dom` without an explicit architecture decision recorded in the docs.
- Never name a third-party UI library or product in any file, comment, commit or metadata. Tailwind CSS and React may be named; they are genuine dependencies.
- Never add AI attribution trailers to commit messages.
- Do not regress: the per-page plugin init/destroy lifecycle, copy-button cleanup, tabbed examples, the unified page shell, or the Command Palette search.

## Finish the iteration

1. Run `pnpm test`, `pnpm typecheck` and `pnpm build`. All three must pass. If they do not, fix the cause rather than weakening the check.
2. Commit. The message should explain in prose why the change was needed and what problem it solves. No bullet lists, no attribution trailer, no third-party product names.
3. Update `BUILD_LOOP.md`:
   - Move each finished component from unchecked to `- [x]`, and append ` (built, visually unverified)` to it.
   - Add any newly discovered work to the appropriate section.
   - Do not mark anything done that you did not actually finish. A dishonest checklist breaks every future iteration, because your successor has no memory and will trust it completely.
4. Stop. Do not begin another phase.

## Honesty about verification

You have no browser. Automated tests cannot catch layout, alignment, spacing, overflow, scrollbar, focus-visibility or visual-regression defects — every serious defect in this project so far has been visual and passed a green test suite.

Therefore: never claim browser or visual verification. Mark components `(built, visually unverified)` and state plainly in your summary what a human reviewer still needs to look at. A separate visual review pass promotes them to fully done.

## If you are stuck

If the next item needs an architectural decision that the docs do not cover, do not guess. Write the question into `BUILD_LOOP.md` under a `## Blocked` heading, commit that, and stop. A human will answer it.
