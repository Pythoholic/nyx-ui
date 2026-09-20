# Nyx UI — live browser review

2026-09-20 · Playwright MCP · local documentation at port 5174

## Verdict

Nyx reads as one designed system, but the canonical examples are not consistently credible enough to copy into a product. The biggest problems are incomplete or misleading examples and interaction-state handling, not the dark palette or the choice of monospace. I would correct the high-priority findings before presenting the registry as production-ready.

This supplements the earlier [source review](EXTERNAL_REVIEW.md). No implementation files were changed and no commit was made.

## Scope and evidence

- Visited all **97 routes at 2560×1440, 1920×1080, and 1280×720**: 291 route/viewport captures. Reviewed the previews visually using contact sheets and targeted full-resolution images.
- Ran a control sweep across all **86 component routes at each width**: keyboard activation, editable inputs, native choices, and documentation preview/code controls where present. Followed up on overlays, date selection, table filtering, queue cancellation, uploads, prompt submission events, context menus, hover cards, and panel dragging.
- Main sweep used Signal; additionally inspected tag variants in Solar, Signal, Flux, and Plasma. Device pixel ratio was 1. These are CSS viewport sizes, not a recreation of physical 32-inch viewing distance or Windows display scaling.
- [Page-by-page coverage and screenshot links](COVERAGE.md) · [viewport inventory](viewport-audit.json) · [control sweep](interaction-audit.json) · [follow-up measurements](flow-audit.json).

This is not an exhaustive accessibility or cross-browser certification. I did not run a real screen reader, the 390px mobile pass, every possible interaction sequence, or a composed dialog→dropdown→tooltip stress test. The requested three desktop widths supersede the brief's broader viewport list for this pass. Some application-owned buttons deliberately have no backend handler; these are not automatically broken components. Clipboard contents were not independently verified. Early automation selector/time-out and close-transition artifacts are not counted as findings.

## Ranked findings

### 1. High — Progress shows empty tracks for work that is already 68% complete

**Confirmed defect; high confidence. All three widths.**

Open `/components/feedback/progress`. Both determinate and indeterminate examples look empty. The determinate control exposes 68 to accessibility APIs, but its fill has a measured width of **0px**. Both fill spans compute to `display: inline`, so their declared inline/block dimensions do not produce the intended bars.

References: [canonical markup](../registry/components/feedback.html), progress example; [component CSS](../packages/core/src/components.css), lines 393–394. [1280 screenshot](screenshots/1280--components--feedback--progress.png).

**Recommendation:** make the canonical markup and fill layout agree, then verify a visibly partial determinate bar and visibly moving indeterminate state. Add the visible label/value the page itself recommends. The batch-plan example uses a block fill and does not establish that these span-based examples work.

### 2. High — Generation cancellation loses keyboard focus

**Confirmed defect; high confidence. All three widths.**

Open `/components/ai/generation-queue`, focus the first **Cancel**, and press Enter. The job becomes canceled and its Cancel button becomes hidden. `document.activeElement` becomes **BODY**, rather than moving to the replacement action or another predictable location. A keyboard operator loses their place in the queue.

References: [controller](../packages/plugins/src/generation-queue.ts), action visibility update around line 150; [queue markup](../registry/components/generation-queue.html). Live results are in `flow-audit.json` under `queue cancel`.

**Recommendation:** define focus destinations for cancel, retry, removal, and the final empty state. Preserve focus on an appropriate surviving/replacement control; do not merely update button visibility. The earlier source review also raises notification removal, but this finding's repeated live proof is specifically queue cancellation.

### 3. High — The rating example is not an ordered rating scale

**Confirmed incomplete canonical example; high confidence. All three widths.**

Open `/components/media/rating`. There is one very faint star and one radio input, with value **5**. There are no 1–4 choices. The surrounding documentation describes individually named choices on an ordered scale, but the copied example cannot express that task.

References: [markup](../registry/components/media.html), lines 9–12; [styles](../packages/core/src/components.css), lines 591–594. [1280 screenshot](screenshots/1280--components--media--rating.png).

**Recommendation:** provide the complete intended scale, clear unselected/selected states, and an obvious keyboard focus treatment. If this is intentionally only a styling fragment, label it as such and do not present it as the canonical rating example.

### 4. Medium — Untouched passwords look invalid before the user starts

**Confirmed behavior; high confidence. Validation timing may be intentional, but contradicts the registration guidance. All three widths.**

Open `/components/forms/password-input` or `/components/layouts/registration` without typing. The empty password already has a red outline and `aria-invalid="true"`; adjacent untouched required name/email fields do not. Registration says inline validation is revealed after interaction, making the immediate error treatment particularly confusing.

Reference: [password controller](../packages/plugins/src/password-input.ts), line 195, unconditionally maps `checkValidity()` to `aria-invalid`. [Registration screenshot](screenshots/1280--components--layouts--registration.png).

**Recommendation:** distinguish pristine, edited, and submitted states. Keep initial guidance neutral; reveal errors after the agreed validation trigger, consistently across fields.

### 5. Medium — Table pagination offers a page that no longer exists

**Confirmed state mismatch; high confidence. Seen at all three widths; clicked through at 1280.**

Open `/components/data-display/advanced-data-table`; filter for `render-025`. The status correctly changes to **Page 1 of 1**, but page **2** remains visible and enabled. Activating it leaves the same one-page result. An empty filter result also retains that button. Filtering and row selection themselves work.

References: [fixed page buttons](../registry/components/data-table.html), footer; [controller](../packages/plugins/src/data-table.ts), pagination update around lines 210–235. [Filtered-state screenshot](screenshots/table-filter-page-2.png).

**Recommendation:** reconcile numeric page controls with the filtered page count, including zero-result and page-count-shrink cases. A disabled Next button alone is insufficient.

### 6. Medium — Registration gives decorative space priority over the form

**Design judgment; high confidence in the observed composition. Most pronounced at 1280. No overflow defect claimed.**

Open `/components/layouts/registration` at 1280×720. Inside the preview, a largely empty decorative column gets more than half the space while **CREATE / YOUR / ACCOUNT** wraps into three large lines on the right. The form becomes unnecessarily tall. Welcome Back has a related oversized-heading treatment. At wider widths this is less constrained, not universally broken.

References: [auth grid and heading](../packages/core/src/components.css), lines 747–756. [Registration screenshot](screenshots/1280--components--layouts--registration.png); [Welcome Back screenshot](screenshots/1280--components--layouts--welcome-back.png).

**Recommendation:** adapt the layout to its available container width, reduce the in-form title scale, and give the task column priority. Retain the split composition when it has enough room. Measurements did not substantiate a password-field overflow, so that is deliberately not reported.

### 7. Medium — Documentation spends too much vertical space before demonstrating the component

**Design judgment; high confidence. All widths, greatest practical cost at 1280×720.**

Open Rating, Progress, or Registration from the navigation. The repeated sequence is large title, description, large divider gap, prose section, card heading, toolbar, then the actual example. For tiny primitives this produces a disproportionately tall page; for layouts the task starts far down the document. The rating's single star sitting in a large empty panel is the clearest symptom, even after the missing choices are fixed.

References: [documentation styles](../apps/docs/src/styles.css), `.docs-page-header`, `.docs-section`, `.docs-example-panel` and `.docs-preview` around lines 43–68. Compare the screenshots linked above.

**Recommendation:** move the live example nearer the introduction; use compact, content-aware frames for small controls; move secondary usage guidance below it. Keep readable line lengths. I do **not** recommend stretching paragraphs across a 2560px monitor simply to consume available space.

### 8. Medium — Several media/chart examples demonstrate surfaces rather than useful content

**Design/adoption judgment; medium-high confidence. All three widths. Placeholders may be intentional.**

Compare `/components/media/media-carousel`, `/components/media/gallery`, `/components/visualization/line-chart`, `/components/visualization/bar-chart`, and `/components/visualization/sparklines`. The media placeholders are largely empty gradients; chart shapes lack the contextual labels/units a real operational screen needs, and the standalone sparkline is presented as another large chart. These are not broken image loads or a claim that Nyx must become a charting engine. They are weak demonstrations of what an adopter should build.

References: [media carousel](../registry/components/media-carousel.html), [media examples](../registry/components/media.html), [charts](../registry/components/visualization.html). [Carousel screenshot](screenshots/1280--components--media--media-carousel.png); [sparkline screenshot](screenshots/1280--components--visualization--sparklines.png).

**Recommendation:** reuse the meaningful imagery already present in the lightbox, show a sparkline inside a metric row, and pair one complete chart with its labels and accessible summary. Mark intentionally incomplete visual scaffolds explicitly.

### 9. Low–medium — The small uppercase control/label tier is doing too much work

**Design judgment, not a blanket accessibility failure; medium-high confidence.**

Inspect the form labels, preview captions, sidebar children, and operational metadata at 100% zoom. Repeated small uppercase monospace text with tracking makes secondary information feel uniformly faint and busy. The large headings and compact controls have little intermediate hierarchy.

References: [type tokens](../packages/core/src/tokens.css), `--nyx-type-label` and adjacent roles; [docs captions/navigation](../apps/docs/src/styles.css). Representative [registration screenshot](screenshots/1280--components--layouts--registration.png).

**Recommendation:** keep monospace, but reserve 11px uppercase for genuinely secondary overlines. Try 12–13px labels, 13–14px action/navigation text, 15–16px body, and a distinct 16–18px panel-heading tier. Validate at the actual monitor distance before adopting these proposed values. Equal `panel` and `body` token values are not inherently a defect; weak rendered hierarchy is the concern.

## What worked, and what I would not “fix”

- The shared dark surfaces, thin borders, accent treatment, and alignment read coherently across the catalog. The three desktop passes did not show preview-root horizontal overflow or broken image loads. That check does not prove every nested state is overflow-free.
- The date picker opened at **352px** wide at each requested width, rather than spanning the screen. ArrowRight→Enter changed September 18 to September 19 and restored focus to the trigger. Flipping above the trigger near the viewport edge is appropriate, not itself a placement defect.
- The command palette accepted a filtered selection, closed, and returned focus to its opener at all three widths. The main dialog and palette fit the sampled 1280×720 state. The docs-level Ctrl+K opens documentation search; the component's displayed shortcut should not be assumed to invoke an application command in this host.
- Table filtering and keyboard selection worked. Panel dragging changed the split from 42% to 47.3% at 2560/1920 and to 49.6% at 1280. “Panels do not resize” would be a false finding.
- The upload dropzone accepted a local test PNG and reached `complete` using the documentation demo transport. Shift+F10 opened the context menu; the hover card appeared; Ctrl+Enter emitted the prompt-composer submit event. A retained prompt is not proof of failed submission: persistence/clearing is application-owned.
- All four inspected tag palettes are visually usable. The 16 sampled solid-fill tag foreground/background pairs had calculated contrast ratios from **5.86:1 to 14.16:1**. This is not an all-component contrast audit. Signal accent and success share green; keep explicit labels rather than relying on color to distinguish meaning. Disabled styling was not treated as an ordinary enabled-text contrast failure.
- Loading spinner duration changed from 0.75s to 0.00001s under reduced-motion emulation. Sampled overlay motion is short and restrained. I would not invent a system-wide motion redesign from these observations; continuous-motion perception and stacked overlays still deserve dedicated review.

Theme evidence: [Solar](screenshots/theme-preview-solar.png), [Signal](screenshots/theme-preview-signal.png), [Flux](screenshots/theme-preview-flux.png), [Plasma](screenshots/theme-preview-plasma.png).

## Adoption and editorial assessment

The three-part distribution is explainable: CSS provides presentation, copied markup provides structure, optional controllers provide behavior. The difficulty is making those contracts agree. The earlier source review's subtree-theme promise, accent utility behavior, initialization ambiguity, and font setup concerns remain separate adoption issues; this live pass does not silently upgrade all of them to browser-verified defects.

The strongest “generated rather than designed” tell is not the appearance or provenance of the code. It is the repetition of polished responsibility-disclaimer prose beside examples that do not fulfill the page's own promise: a rating scale with one choice, progress without a visible fill, and generic media/chart content. That is an editorial observation, not evidence of how any particular file was authored.

Delete or consolidate low-information material before deleting working components: repeated “no public methods/no events” tables on static primitives, duplicated ownership prose, and standalone pages whose tiny fragments are more useful inside a composed example. Keep boundary guidance, but concentrate it and demonstrate a complete happy path plus an error/empty state.

The first ten minutes' most embarrassing discoveries are the empty progress bars and one-choice rating. Week-one adopters also need one executable end-to-end example that covers installation, font loading, initialization/cleanup, theme switching, and application-owned event handling without requiring source archaeology.

## Five priorities before calling the registry production-ready

1. Repair incomplete/misleading canonical examples, starting with progress and rating.
2. Make focus and dynamic state transitions reliable, starting with queue cancellation and filtered pagination.
3. Align validation timing and embedded authentication layouts with the actual task and available width.
4. Reconcile the documented installation/theming/initialization contracts with shipped behavior, using a minimal consumer app.
5. Rework documentation density and demonstrate realistic composed screens, then do dedicated screen-reader, stacked-overlay, mobile, and cross-browser passes.
