# Release remediation

2026-09-20. Source baseline: `2719a6baa6b2986a7bdaade7751470a17106ed2d`.

The confirmed Priority 1 and 2 defects are corrected. The examples now demonstrate their advertised behavior, and the installation path includes a standalone executable screen. No runtime dependency was added.

## Changes and decisions

| Finding | Result |
| --- | --- |
| 1.1 Progress | The shared fill is block-level. The canonical example has visible labels and a 68% value. The browser measures the fill at 68% of the track and observes the indeterminate transform changing. |
| 1.2 Rating | Five native radios in the existing fieldset, individually named 1–5. Unselected outlines are readable, selected stars fill through the chosen value, and keyboard focus outlines the associated label. The existing `sr-only` utility is retained. |
| 1.3 Pagination | Markup declares a maximum numeric range. The controller hides and disables unavailable numbers, clamps the current page, restores controls when results return, and displays “No results” with no numeric pages for an empty result. Previous/Next remain controller-managed. |
| 1.4 Focus | A shared internal helper moves focus only when the disappearing subtree owns it. Queue cancel/retry exposes and focuses its replacement action before hiding the old one. Row removal chooses next action, previous action, then the labelled collection. Notification and attachment removal follow that policy. Regenerated tags, filters, and uploads return to their input; message jump returns to the message viewport. Hidden stepper/carousel panels and tree branches also preserve a destination. The last toast returns to its initiating control when available. |
| 2.1–2.2 Themes | All four themes work on subtrees, including a solar reset inside another accent. The accent utility resolves the runtime token at the styled element, avoiding inherited alias resolution at the root. |
| 2.3 Initialization | Two separately copyable lifecycle functions, each with its own returned cleanup. Browser coverage executes both examples against a copied number input: one step per click, no action after cleanup. |
| 2.4 Font | Installation includes the document-head font links, weights 400/500/600/700, self-hosting guidance, swap behavior, and the fallback stack. The standalone app includes the same setup. |
| 2.5 Notifications | Read controls are action buttons: their names describe the next action, without `aria-pressed`. Dismissal emits after actual DOM removal and collection synchronization. Prose and implementation agree. |
| 3.1 Validation | Password, number input, and parameter inspector share form-wide pristine/edited/submitted timing. Editing reveals that field’s error; a submission attempt reveals invalid fields; reset returns to pristine. Passive validity reads no longer dispatch `invalid` events. Password/number presentation follows native reset. Registration error messages are linked to their fields. |
| 3.2 Authentication | The task column gets 60% where the split fits. A container query removes the decorative column below 58rem of available space. In-form titles are 24–32px and mixed case. |
| 3.3 Documentation | Examples precede secondary usage guidance; title/divider spacing is smaller; small examples use content height. Paragraph measure remains capped and the existing measure regression passes. |
| 3.4 Content | Carousel and gallery reuse the lightbox illustrations. Gallery downloads point to the displayed assets. A metric-row sparkline accompanies a labelled operational chart with units, exact values, and a text summary; the missing-data state is explicit. The bar chart has categories, units, series labels, and a summary. These remain static chart examples. |
| 4.1 Executable screen | `registry/examples/render-workspace` contains the complete project. Docs import its canonical HTML and application module. It exercises two number-input instances, scoped theme changes, native submission, empty queue, progress, failure/retry, cancellation, removal, application events, and cleanup. A copier exports a standalone project without overwriting an existing directory. |
| 4.2 Consolidation | Removed static “no methods/no events” tables and concentrated generic boundaries in the accessibility guide. Sparkline and accessible-summary fragments are part of the complete chart composition; their old URLs redirect. No working component was deleted. Public typography aliases remain for compatibility, with an explicit compatibility comment. |

## Typography judgment

I rendered the upper-end trial at panel/body/navigation/label sizes of **18/16/14/13px**, then retained **17/15/13/12px**. The larger trial made the documentation controls and panel captions compete more strongly with the task and increased wrapping pressure. Keeping the existing 15px body and 13px navigation preserves compact operational layouts; 17px panel headings and 12px mixed-case form labels establish an intermediate tier.

The larger improvement is role assignment: tooltip text, hover-card paragraphs, and toast descriptions now use body size. Small action buttons and sidebar children use navigation size. Form labels and sidebar children no longer rely on uppercase tracking. Monospace, readable paragraph width, control heights, and existing 12px secondary metadata remain.

I did not infer that equal role defaults were defects, remove public aliases, or claim a physical-monitor-distance study. These judgments come from browser captures at 1280, 1920, and 2560 CSS pixels and a mobile overflow check. Compare the [larger registration trial](screenshots/trial-type-1280-layouts-registration.png) and [final registration at the same scroll position](screenshots/final-type-1280-layouts-registration.png), plus the [final tooltip](screenshots/final-1280-overlays-tooltip.png) and [hover card](screenshots/final-1280-overlays-hover-card.png).

## Regression proof

All mutations below were applied individually to the fixed tree. Each run restored the exact original file bytes in `finally`; plugin mutations rebuilt the package both before testing and after restoration. Every run failed at an assertion, rather than merely failing to start. The runner is [verify-review-regressions.py](../scripts/verify-review-regressions.py); machine-readable results are in [release-mutation-audit.json](release-mutation-audit.json).

| Reintroduced defect | Assertion that caught it |
| --- | --- |
| Inline progress fill | Fill/track width ratio differs from 0.68; originally measured 0. |
| Only the fifth rating choice | Radio count differs from five. |
| Original broad rating selector | Selected and unselected star colors become equal. |
| Static numeric pages | Page 2 stays visible after filtering from page 2 to one result. |
| No focus succession | Queue replacement, notification successor, attachment successor, and regenerated-input focus assertions fail. |
| Root-only theme selectors | Nested plasma/solar component colors differ from their declared accents. |
| Hardcoded utility accent | Utility text and adjacent component background differ under the same theme. |
| Combined initializer/constructor example | Initialization section contains one copyable source instead of two. |
| Missing font installation step | Font-loading section and its documented weights are absent. |
| Action name plus toggle semantics | Read action retains the prohibited `aria-pressed` attribute. |
| Early dismissal event | Event observes a still-connected notification. |

Additional browser tests cover indeterminate motion, rating Arrow-key selection/focus, numeric-page restoration, cancellation/retry/removal through final empty state, native validation/reset, compact examples, auth column proportions, loaded media, chart exact values, old chart URLs, toast focus return, executable-screen flows, and detached-root cleanup. Unit coverage also checks asynchronous notification timing and validation-session lease cleanup.

## Verification and limits

- `pnpm test`: **203 unit tests and 80 browser tests pass**.
- `pnpm typecheck` and `pnpm build`: pass, including the standalone example.
- `pnpm packages:check`: both package tarballs contain their required exports/files.
- The route suite visits **96 canonical routes** at 2560 and 390 pixels, checking one h1, console errors, and page overflow. Two retired chart URLs have separate redirect assertions.
- Targeted measurements cover 11 affected pages at 390/1280/1920/2560: **44 checks, zero horizontal page overflow**. See [viewport audit](release-viewport-audit.json). Captures include opened overlays and toasts, rather than only their resting triggers.
- The exported consumer installed offline from freshly packed local release tarballs and built outside the workspace. Browser checks confirmed independent controls, theme switching, queue creation, and keyboard cancel focus. See [consumer audit](release-consumer-audit.json) and [capture](screenshots/release-independent-consumer.png). Public package publication was not performed.
- Two existing focus specs failed intermittently with 12 parallel workers, passed targeted reruns, and the full suite passed with local concurrency capped at four. CI remains one worker. No assertions were weakened.

I directly inspected representative captures and drove the affected interactions. This is not a claim of a new visual inspection of every route, exhaustive state coverage of every component, a screen-reader pass, or cross-browser certification. Changed task examples expose normal/error/empty paths where those states have meaning. Purely presentational primitives retain native/static variants rather than fabricated application errors.

## Findings beyond the two reviews

1. Adding the missing rating choices exposed a second defect: the old sibling selector colored every star after the checked input. The selection mutation specifically covers it.
2. Focus loss extends to regenerated tag/filter/upload controls, attachments, the disappearing message jump control, hidden panels/branches, and the last toast. These now use the shared focus policy.
3. Render-time `checkValidity()` calls were dispatching `invalid` events, not merely reading state. Passive synchronization now uses `validity.valid`, including the prompt composer.
4. Registration’s inline name/email/password error messages lacked complete explicit description relationships. The canonical markup now connects them.
5. Native form reset needed to update password strength and number presentation as well as validation state.

All assigned source diagnoses held. I did not change `sr-only`, invent a password overflow repair, bundle a font, build a chart engine, remove compatible tokens, add runtime dependencies, or publish packages. Existing build output still reports the docs bundle-size advisory; this change does not claim a bundle-size optimization.

Run the example with `pnpm --filter @nyx-ui/workspace-example dev`, or open `/guides/render-workspace` in the documentation.
