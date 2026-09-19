# Nyx build loop state

Durable backlog for the autonomous build loop. Each iteration reads this file, picks the next unchecked item, implements it, and ticks it off. Do not restate plans elsewhere; this file is the single source of truth for progress.

## Loop rules

- Codex performs ALL code changes, builds, tests and commits. Claude plans, reviews and verifies.
- Every phase must end with `pnpm test`, `pnpm typecheck` and `pnpm build` passing.
- No new runtime dependencies beyond `@floating-ui/dom` without an explicit architecture decision.
- Never name a third-party UI library or product in any artifact. Tailwind CSS and React may be named as genuine dependencies.
- Never add AI attribution trailers to commits.
- Every component needs: Phase 1 lifecycle contract (root-inclusive idempotent init, cache-safe destroy, cancelable before-events plus after-events, data-state and aria sync) where it has behavior; per-component ESM subpath export; canonical registry markup consumed via `?raw`; a docs page with tabbed Preview/HTML, copy button, reference tables and accessibility notes; a `registry.json` entry; component CSS; and Vitest coverage.
- Reuse existing internals (positioning, dismissal, roving focus, typeahead, result list) where contracts genuinely match. Do not force a fit where semantics differ, and do not reimplement them.
- Prefer native HTML elements over custom ARIA reimplementation.
- One phase per iteration. Do not start the next phase before the current one is committed.

## Priority 1 (v0.2 milestone)

- [x] Dropdown Menu
- [x] Context Menu
- [x] Menubar
- [x] Navigation Menu
- [x] Avatar and Avatar Group
- [x] Card / Item / List / List Group
- [x] Separator / Divider
- [x] Kbd
- [x] Toggle and Toggle Group
- [x] Alert Dialog
- [x] Command Palette
- [x] Combobox and searchable Select
- [x] Sidebar
- [x] Input OTP / PIN
- [x] File Upload
- [x] Calendar (preview) (verified)
- [x] Date Picker (preview) (verified)
- [x] Advanced Data Table (preview) (verified)

## Priority 2 - complex workspace components

- [x] Tree View (verified)
- [x] Resizable Panels / Layout Splitter (verified)
- [x] Scroll Area and styled scrollbar (verified)
- [x] Hover Card (verified)
- [x] Carousel (verified)
- [x] Stepper with state management (verified)
- [x] Advanced number input (verified)
- [x] Password strength and visibility controls (verified)
- [x] Search box with suggestions and recent searches (verified)
- [x] Multi-select and tag input (verified)
- [x] Notification centre (verified)
- [x] Activity feed (verified)
- [x] Filter bar (verified)
- [x] Command bar (verified)
- [x] Bulk-action toolbar (verified)

## Priority 3 - media and AI-product patterns

- [x] Chat bubbles and message threads (verified)
- [x] Prompt composer (verified)
- [x] Message scroller (verified)
- [x] Attachment previews (verified)
- [x] Generation queue (verified)
- [x] Model selector (verified)
- [x] Parameter inspector (verified)
- [x] Before/after comparison (verified)
- [x] Image lightbox (verified)
- [x] Media carousel (verified)
- [x] Upload dropzone with queue (verified)
- [x] Batch progress monitor (verified)

## Small primitives

- [x] Aspect-ratio container (verified)
- [x] Container and responsive columns (verified)
- [x] Styled links (verified)
- [x] Blockquote (verified)
- [x] Code block and copy button as a shipped component (verified)
- [x] Icon catalog page (verified)
- [x] Accessible visually-hidden utility (verified)
- [x] RTL / direction support (verified)
- [x] Loading overlay (verified)
- [x] Status indicator (verified)
- [x] Tags / chips (verified)
- [x] Tooltip provider and delay rules (verified)

## Release blockers

- [x] Promote non-preview components from `preview` to `stable` in registry.json per ruling 1 (verified)
- [x] Promote catalog-only example variants into canonical registry files (verified)
- [x] CI running test, typecheck and build on push (verified)
- [x] Changesets or equivalent versioning (verified)
- [x] Packages publishable to npm (verified)
- [x] Playwright or equivalent browser regression coverage (verified)

## Known defects

- [x] Calendar: an empty hidden input overrides `data-nyx-calendar-value`, so canonical standalone demos lose their declared initial selection. (fixed, verified)
- [x] Date Picker: `data-state` is not synchronized on open/close, and invalid typed input is not mirrored through `aria-invalid` / `data-invalid`. (fixed, verified)
- [ ] Application Shell: the docs route renders both the page title and the embedded shell title as `h1`, so the document contains two level-one headings.
- [ ] Metrics, Records, and Activity: the docs route creates 81px of horizontal page overflow at the 390px mobile viewport.

## Browser regression coverage

A manual browser audit at 2560x1440 on 2026-09-19 checked all 95 routes and drove the
interactive components by hand. No defects were found. These assertions now need to be
encoded as Playwright specs so they hold permanently rather than depending on a repeat
manual pass.

- [x] Overlay positioning specs: dropdown, context menu, menubar, hover card, popover, tooltip, date picker. Assert the panel is anchored to its trigger (not at the viewport origin), sits within the viewport, flips near an edge, and carries no unexpected scrollbars.
- [x] Dialog family specs: dialog, alert dialog, drawer, command palette. Assert focus moves inside on open, Escape closes, scroll lock is taken and released, focus returns to the trigger, and stacked dialogs release the lock correctly.
- [x] Keyboard navigation specs: tabs, menubar, tree view, calendar, combobox, carousel, stepper. Assert a single tab stop where roving focus applies, arrow and Home/End behaviour, and that only visible items are reachable.
- [x] Form component specs: input OTP paste across cells, number input, password visibility, multi-select, file upload validation, date picker typed input and invalid state.
- [x] Data table specs: sort alternates ascending and descending with aria-sort tracking, pagination hides rows, selection survives paging.
- [x] Site-wide route sweep spec: every route renders, has one h1, produces no console errors, and causes no horizontal page scroll at 2560 wide and at mobile width.
