# Nyx UX audit findings

Source: manual review on 2026-09-19 at desktop width, plus scripted verification against the
dev server on port 5174. Every item below was reproduced before it was written down; the
"Verified by" line records how. Items the report got wrong are recorded as corrections rather
than dropped, because the wrong diagnosis is itself worth not repeating.

Codex performs the fixes. Claude wrote and verified this list.

## Why the browser sweep missed all of this

The existing Playwright suite passes while every defect below is on screen. Three structural
reasons, each of which needs fixing or the next audit finds the same class of problem:

1. **Assertions test existence, not correctness.** `expectAnchored` in
   `tests/browser/overlays.spec.ts` measures only the *gap* between the trigger box and the
   panel box. A panel stretched across the whole viewport overlaps its trigger, so the gap is
   zero and the test passes. The date picker popover renders 2544px wide at x=8 while its
   trigger sits at x=1205, and `date picker panel stays anchored and bounded` still passes.
   An anchored-overlay assertion must also bound the panel's width against the trigger and the
   page, not just measure adjacency.
2. **No assertion covers spacing, alignment, or visual rhythm.** Items 3, 4, 8, 9 and 12 are
   invisible to a suite that only checks roles, counts, `h1`, console errors and page overflow.
   A page with every element stacked flush against its neighbour passes all six current specs.
3. **The suite and the human look at different builds.** Playwright builds and serves
   production on `:4173`; the review was done against `pnpm dev` on `:5174`. Anything that
   differs between dev and prod is unobserved in one of the two. The suite should run against
   the same server the team develops on, or run against both.

The sweep answers "did the page render?" It does not answer "does this look like Nyx?" That
is the gap to close, and it matters more than any single item below.

## Confirmed defects

### 1. Buttons in a row do not share a height
`.nyx-button` sets `min-height: 2.75rem` (a floor, not a height). When a button contains a
`.nyx-kbd`, the kbd's own `min-block-size` plus padding pushes that button taller than its
neighbours. In the command bar, SAVE (which holds `CTRL S`) is visibly taller than NEW.
- Root cause: `packages/core/src/components.css:90` (button), `:52` (kbd), `:485` (command-bar kbd).
- Fix at the shared level: sibling controls in a row must resolve to one height. Do not patch
  the command bar alone; the same mismatch occurs anywhere a button wraps a kbd, badge or icon.
- Verified by: screenshot; CSS read.

### 2. Overlay positioning is broken system-wide
`positionOverlay` orders Floating UI middleware `offset → flip → shift → size`. The `size`
middleware's `apply` writes `--nyx-overlay-available-width`, and the CSS
`max-inline-size: var(--nyx-overlay-available-width, ...)` lets the panel expand to that full
value. A `max-content` panel therefore grows to the whole viewport, and `shift({padding: 8})`
then slides the now-oversized box to the viewport edge. `data-placement` still reports
`bottom-start`, so the DOM looks correct while the panel is visibly wrong.
- Measured: trigger at `x=1205, w=40`; panel at `x=8, w=2544` on a 2560 viewport.
  `data-nyx-positioned` is present, `--nyx-overlay-x: 8px`, no console errors.
- Root cause: `packages/plugins/src/internal/positioning.ts` (middleware order and the
  available-width contract), with `packages/core/src/components.css:422` consuming it.
- This helper is shared by dropdown, context menu, menubar, hover card, tooltip, combobox and
  date picker. Fix once in the helper; check all seven afterwards.
- `available-width` should cap a panel, not size it. Verify the distinction holds after the fix.
- Verified by: scripted measurement against the dev server.

### 3. Docs default to the wrong accent
`apps/docs/index.html:2` hardcodes `data-nyx-theme="solar"` (amber). `apps/docs/src/main.ts:157`
reassigns the theme at runtime, so the accent can visibly change shortly after load.
- **Correction to the original report.** This was filed as "clicking Apply capacity changed the
  theme." It does not. On a fresh browser profile with empty `localStorage` the page already
  loads amber before any click. The click was coincidental; the defect is the default plus the
  startup reassignment. Fixing the button would have fixed nothing.
- The accent guide documents `signal` as the example value, which is a third inconsistency.
- Verified by: fresh-context script, `localStorage` confirmed empty, theme read at load.

### 4. Spacing and alignment
Each of these is a real layout defect, verified from the screenshots:
- **Toggle group**: the pressed-button row sits flush against the "VIEW MODE" label with no gap.
- **Bulk-action toolbar**: selection summary, action buttons and list rows have no vertical
  rhythm separating the bands.
- **Text fields**: the two columns lose their shared baseline because helper and error text
  under the left column is not reserved in the grid, so the right column drifts.
- **Card demo**: a large dead gap sits between the avatar row and the separator.
- **Notification centre**: list rows are cramped relative to their own internal spacing.
- Treat these as one task: the spacing scale exists in tokens but is applied inconsistently.
  Prefer fixing the shared container rules over per-demo padding.

### 5. Navigation menu items have three different treatments
"Overview" and "Changelog" render bold white; "Products" renders dimmer and lighter. No state
(current page, disabled, hover) justifies the difference — they are three peer links that
should look like peers. A disclosure item may carry an affordance, not a different weight.

### 6. Notification centre actions are unstyled
"READ" and "DISMISS" are bare text sitting beside a real underlined link, and only one of the
three items shows a bordered control. Three sibling actions, three visual treatments. Give the
row one consistent action treatment and keep the link semantics native.

### 7. Icon catalog is eight icons
`search, check, close, plus, arrow-right, folder, lock, user` is a sample, not a catalog, and
does not cover the icons the components themselves already use. Either grow it to a real set
covering every icon used across the catalog, or rename the page so it does not promise one.
Needs your call on scope before Codex starts.

### 8. Tag/label treatment is too limited
Currently one style: outlined pill, `--nyx-type-meta` (0.75rem). Requested: a single-line
variant, a solid-fill variant, and additional patterns, with a larger default type size.
This is a design decision, not a bug fix — see "Needs your decision" below.

### 9. Date and time inputs are browser-styled
Native `input[type=date]` and `[type=time]` render with the platform picker and platform
chrome, which reads as un-styled next to Nyx controls. Note this conflicts with the documented
architecture position that native inputs are the preferred default for simple cases, so it
needs a ruling rather than a silent fix.

### 10. Calendar page appears to show the same calendar twice
The two calendars are actually different (single-date starting Sunday; range starting Monday),
but nothing on the page says so, so they read as an accidental duplicate. Label each example
with what it demonstrates. Not a rendering bug — a labelling one.

## Motion

The original request was for "more motion." The repo already has more than the components use:
`packages/core/src/motion.css` defines 14 keyframes and 5 motion utilities, and the token set
has 9 durations and 4 easing curves. Against that, `components.css` contains 11 `transition:`
declarations, 8 `animation:` declarations and 0 `@keyframes` across roughly 95 components.

So the gap is application, not vocabulary. The work is to wire the existing motion language into
components that currently have none, with a documented rule for which state changes animate.
Priorities, in the order that buys the most perceived quality:
1. Overlay enter/exit (dropdown, popover, tooltip, hover card) — currently appear instantly.
2. Dialog and drawer enter/exit — partially done, inconsistent between the two.
3. State transitions on interactive controls: pressed, selected, checked, expanded.
4. List and queue changes: item added, removed, reordered.
5. Loading and progress states, which already have keyframes but few consumers.

Reduced motion is already handled globally at `packages/core/src/motion.css:24`, so new
animation inherits that automatically. **Correction:** an earlier pass of this audit recorded
reduced motion as missing, based on grepping only `components.css`. It is present. New work
should confirm it still covers any animation added outside that file.

## Text and copy

Reported as: descriptions across the catalog are short and unfriendly. This is consistent with
what the screenshots show — the prose is terse and reads as specification notes rather than
guidance for someone adopting the framework. It is also the largest item here by volume
(roughly 95 pages), and it is a voice decision rather than a defect.

Recommend treating it as its own task after the layout fixes land, and agreeing on a voice and
a per-page structure on two or three pages first before rewriting all of them.

## Needs your decision before Codex starts

1. **Icon catalog** — grow to a full set (how many? which?) or rename the page.
2. **Tags** — confirm the variants: single-line, solid, what else, and the new default type size.
3. **Date/time inputs** — override native rendering, or keep native and document why? This
   contradicts the current architecture ruling, so it needs an explicit reversal to change.
4. **Copy voice** — sign off on a sample page before a 95-page rewrite.

## Recommended order

1. Overlay positioning (item 2) — one shared file, fixes seven components, worst visible defect.
2. Button height (item 1) — shared rule, small diff.
3. Theme default (item 3) — one line plus the startup race.
4. Spacing and alignment (item 4), nav menu (5), notification actions (6).
5. Strengthen the browser suite so items 1-6 cannot regress, per the three points at the top.
6. Motion application, then copy, then the decisions above.
