# Nyx external review — source findings

Date: 2026-09-20  
Brief: [External review brief](../docs/architecture/EXTERNAL_REVIEW_BRIEF.md)

> Follow-up: the live Playwright review is now available in [UI_REVIEW.md](UI_REVIEW.md), with [97-route coverage](COVERAGE.md) at the three requested desktop widths. The browser-unavailable statement below describes the earlier source-only pass, not the current review status. Source-only findings remain distinguished from live-confirmed findings.

## Assessment and limits

I would hold public release until the adoption contract is corrected. Several documented promises contradict the implementation.

This is a **partial source review**, not the visual review requested by the brief. The browser tool returned no available browsers or apps. I could not inspect the four viewport widths, walk keyboard tasks, hear screen-reader announcements, or judge motion. Reproduction steps below are for independent verification; they were not executed in a browser. No implementation files were changed during the review.

References and line numbers describe the repository as inspected on the review date.

## Ranked findings

### 1. High — Documented subtree theming does not exist

**Confidence:** high.

[Theming guidance](../apps/docs/src/catalog/guides.ts), line 110, permits `data-nyx-theme` on a containing subtree. [Theme selectors](../packages/core/src/tokens.css), lines 154–177, require `:root`.

**Reproduce:** place a primary button inside `<section data-nyx-theme="plasma">` while the document uses solar. The section cannot match the theme selector.

**Recommendation:** either implement scoped themes or remove that promise.

### 2. High — Tailwind accent utilities and component accents have different theme behavior

**Confidence:** high.

The [compiler-facing accent](../packages/core/src/tokens.css), line 15, is hardcoded yellow; theme switching changes `--nyx-accent` only.

**Reproduce:** put `text-nyx-accent` text beside a primary Nyx button, then switch the root to plasma. The utility remains yellow while the component uses violet.

This may be an intentional two-layer architecture, but it gives adopters contradictory results under the same “accent” name.

**Recommendation:** unify theme behavior across utilities and components, or explicitly distinguish and document the two contracts.

### 3. High — Initialization examples invite duplicate controllers

**Confidence:** high; runtime consequence inferred from source.

The [generated initialization example](../apps/docs/src/catalog/shared.ts), line 1589, runs `initX(root)` and then constructs another controller on a matching element in the same copyable block. “Or” appears only in a comment. Constructors do not share the initializer's deduplication guard.

**Reproduce:** use both setup paths for Number Input, defer cleanup until unmount, and click increment once. [Each constructor attaches its own listener](../packages/plugins/src/number-input.ts), line 62, so both handle the click.

**Recommendation:** split these into separate examples with cleanup shown in lifecycle context.

### 4. High — Actions hide or remove their focused control without choosing a successor

**Confidence:** high for the omission; browser outcome unverified.

[Queue synchronization](../packages/plugins/src/generation-queue.ts), lines 148–152, hides Cancel after cancellation and Retry after retrying. [Notification dismissal](../packages/plugins/src/notification-center.ts), line 109, calls a [removal helper](../packages/plugins/src/internal/motion.ts), lines 10–14, that makes the item inert and removes it without moving focus.

**Reproduce:** keyboard-activate Cancel or Retry on `/components/ai/generation-queue`; separately dismiss a notification using its focused button. Inspect focus immediately and press Tab.

“Removal never steals focus programmatically” is not a sufficient policy when removal destroys the current focus target.

**Recommendation:** preserve position within the task. Select an appropriate surviving control or empty-state destination when the currently focused action disappears. Verify the actual browser behavior before finalizing the fix.

### 5. Medium — The intended font depends on undocumented application setup

**Confidence:** high.

The docs explicitly load JetBrains Mono in [their HTML entry point](../apps/docs/index.html), line 12. Core only declares a [font-family stack](../packages/core/src/tokens.css), line 2, and [installation guidance](../apps/docs/src/catalog/guides.ts) omits font loading.

**Reproduce:** follow Installation in a fresh application on a machine without JetBrains Mono installed. The application uses a fallback.

Shipping fonts separately is reasonable. Omitting that step is not, when typography defines the product's identity.

**Recommendation:** document font loading, supported weights, and fallback behavior as part of installation.

### 6. Medium — Notification documentation makes claims the code contradicts

**Confidence:** high.

[Accessibility documentation](../apps/docs/src/catalog/shared.ts), line 1391, promises stable toggle names, but [synchronization](../packages/plugins/src/notification-center.ts), lines 137–139, changes both the name and `aria-pressed`. The documented dismissal event also claims removal has completed, while the event fires before asynchronous animation removal finishes.

**Reproduce:** compare a read toggle's accessible name before and after activation; in a dismissal listener inspect whether the notification remains connected while its exit animation runs.

**Recommendation:** choose explicit naming and event-timing contracts, then make implementation and prose agree.

### 7. Medium — The 11px label role has spread into substantive content

**Confidence:** high about usage; design judgment about suitability.

In [component styles](../packages/core/src/components.css), the label token sizes small action buttons (line 99), tooltip text (line 300), hover-card paragraphs (line 354), and toast descriptions (line 391).

**Reproduce:** inspect those components with realistic explanatory text rather than short samples.

The problem is not that `panel` equals `body`, or that `label` is smaller than `meta`. Role tokens can legitimately share sizes. The problem is using the smallest role for information people must read to act.

**Recommendation:** trial 13px controls, 12px metadata, and 14–15px explanatory text, retaining 11px only for genuinely secondary annotations. These are proposed starting points, not visually validated replacements.

## Broader comments

### What an experienced engineer would notice first

The most embarrassing first-ten-minute issue is the theming mismatch: an adopter can follow the documentation and immediately produce inconsistent colors.

### Where the work reads as AI-generated

The strongest tell is confident, repeated contract language that exceeds the implementation—particularly “stable accessible names” and “after removal.” That is an editorial diagnosis, not proof of authorship.

### Distribution and adoption

I would keep the three-part distribution model. CSS, optional behavior, and owned markup are understandable. What it needs is one complete, copyable screen demonstrating setup, application events, repeated instances, and cleanup.

### What to delete or simplify

Start with the repetitive “no methods / no events” tables generated for static components in [shared documentation rendering](../apps/docs/src/catalog/shared.ts), lines 1612–1614. Review the [type aliases](../packages/core/src/tokens.css), lines 91–99, that imply distinctions they do not provide. Check usage and compatibility before removing public tokens.

I would not delete components or declare visual coherence, spacing, contrast, or motion acceptable without the live review.

## Five priorities before public release

1. Unify theming behavior.
2. Make initialization examples safe to copy.
3. Repair focus after destructive state changes, with live browser verification.
4. Document a complete adoption path, including fonts.
5. Reconcile accessibility and event promises with implementation.

## Outstanding review work

The requested live review remains incomplete: visual coherence and spacing at 2560, 1920, 1280, and 390 pixels; keyboard tasks; screen-reader announcements; stacked-overlay focus; contrast across all four themes; and motion quality. Source findings must not be treated as a substitute for those checks.
