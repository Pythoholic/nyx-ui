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
- [x] Calendar (preview) (built, visually unverified)
- [x] Date Picker (preview) (built, visually unverified)
- [x] Advanced Data Table (preview) (built, visually unverified)

## Priority 2 - complex workspace components

- [x] Tree View (built, visually unverified)
- [x] Resizable Panels / Layout Splitter (built, visually unverified)
- [x] Scroll Area and styled scrollbar (built, visually unverified)
- [x] Hover Card (built, visually unverified)
- [x] Carousel (built, visually unverified)
- [x] Stepper with state management (built, visually unverified)
- [x] Advanced number input (built, visually unverified)
- [x] Password strength and visibility controls (built, visually unverified)
- [x] Search box with suggestions and recent searches (built, visually unverified)
- [x] Multi-select and tag input (built, visually unverified)
- [x] Notification centre (built, visually unverified)
- [x] Activity feed (built, visually unverified)
- [x] Filter bar (built, visually unverified)
- [x] Command bar (built, visually unverified)
- [x] Bulk-action toolbar (built, visually unverified)

## Priority 3 - media and AI-product patterns

- [x] Chat bubbles and message threads (built, visually unverified)
- [x] Prompt composer (built, visually unverified)
- [x] Message scroller (built, visually unverified)
- [x] Attachment previews (built, visually unverified)
- [x] Generation queue (built, visually unverified)
- [x] Model selector (built, visually unverified)
- [x] Parameter inspector (built, visually unverified)
- [x] Before/after comparison (built, visually unverified)
- [x] Image lightbox (built, visually unverified)
- [x] Media carousel (built, visually unverified)
- [x] Upload dropzone with queue (built, visually unverified)
- [x] Batch progress monitor (built, visually unverified)

## Small primitives

- [x] Aspect-ratio container (built, visually unverified)
- [x] Container and responsive columns (built, visually unverified)
- [x] Styled links (built, visually unverified)
- [x] Blockquote (built, visually unverified)
- [x] Code block and copy button as a shipped component (built, visually unverified)
- [x] Icon catalog page (built, visually unverified)
- [x] Accessible visually-hidden utility (built, visually unverified)
- [x] RTL / direction support (built, visually unverified)
- [x] Loading overlay (built, visually unverified)
- [x] Status indicator (built, visually unverified)
- [x] Tags / chips (built, visually unverified)
- [x] Tooltip provider and delay rules (built, visually unverified)

## Release blockers

- [x] Promote non-preview components from `preview` to `stable` in registry.json per ruling 1 (built, visually unverified)
- [x] Promote catalog-only example variants into canonical registry files (built, visually unverified)
- [x] CI running test, typecheck and build on push (built, visually unverified)
- [x] Changesets or equivalent versioning (built, visually unverified)
- [x] Packages publishable to npm (built, visually unverified)
- [x] Playwright or equivalent browser regression coverage (built, visually unverified)

## Known defects

- [x] Calendar: an empty hidden input overrides `data-nyx-calendar-value`, so canonical standalone demos lose their declared initial selection. (fixed, visually unverified)
- [x] Date Picker: `data-state` is not synchronized on open/close, and invalid typed input is not mirrored through `aria-invalid` / `data-invalid`. (fixed, visually unverified)
