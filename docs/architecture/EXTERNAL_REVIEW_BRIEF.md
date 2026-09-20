# Independent design review request: Nyx UI

You are being asked for a senior frontend/UI-UX peer review of a design system called Nyx. We
want an outside opinion because the people who built it — one human and two AI coding agents —
have been too close to it to see it whole.

You are running with access to the repository and can start and drive the application yourself.
See "How to review" below for how to run it and what to read.

Please be direct. We are not looking for validation. A blunt list of what is wrong is worth far
more to us than a balanced summary, and "this is not good enough to ship" is an acceptable
conclusion if that is what you find.

---

## What Nyx is

An independent, open-source Tailwind CSS 4 UI system for operational interfaces: dashboards,
admin tools, creative and AI product surfaces. Dark-first. Monospace throughout (JetBrains Mono).
It is not a hosted product; it is meant to be adopted by other teams.

It ships in three parts:
- `@nyx-ui/core` — a CSS package: tokens, four accent themes, foundations, component styles.
  1,088 lines of CSS across five files (`components.css` is 842 of them).
- `@nyx-ui/plugins` — optional framework-agnostic behavior, 43 ESM modules, one per component,
  each with a per-component subpath export. Only runtime dependency is a positioning library.
- A registry of 66 canonical HTML files that adopters copy into their own source.

Plus a documentation site of 97 routes that renders the registry markup as the live examples, so
docs and registry cannot drift.

Design intent, in the team's words: an operational interface language. Restrained. Motion should
clarify a state change, not decorate. Native HTML elements preferred over custom ARIA
reimplementation wherever the platform provides the semantics.

## What we need from you

We have just finished four rounds of defect fixing, and we do not trust that the result is
coherent. Each fix was made in response to a specific complaint. Nobody has stepped back and
asked whether 97 pages of individually-corrected components add up to one designed system.

That is the review we want.

---

## Critical context: why our own testing cannot answer this

This is the single most important thing to understand about our situation.

We have 60 browser regression tests and 201 unit tests. They all pass. They were passing while
every one of the following defects was visibly on screen:

- A date picker popover rendering 2544px wide, pinned to the left edge of a 2560px viewport,
  overlapping the site navigation, while its trigger sat at x=1205.
- Body text frozen at 612px while the code blocks and frames beside it grew to 1280px, so nothing
  on any page shared a left edge.
- A sidebar demo bursting out of its container and obscuring the content behind it.
- Three navigation links rendered in three different visual treatments with no state to justify
  it.

The tests passed because they assert *existence and measurement*: does the element have the right
role, is the panel adjacent to its trigger, is the gap at least 16px. An overlay stretched across
the entire viewport overlaps its trigger, so "adjacent" was satisfied. Every assertion was
technically true and the page was visibly broken.

The conclusion we have drawn is that our tooling can verify correctness but cannot perceive
quality. That is the gap we are asking you to fill. Prioritise what a measuring instrument cannot
see.

---

## Known facts that may be relevant

We offer these as starting threads, not as a complete list. Finding what we have not noticed is
more valuable than confirming what we have.

**The type scale appears disordered.** Current values:

```
--nyx-type-display: clamp(2rem, 4vw, 3.375rem)
--nyx-type-section: clamp(1.25rem, 2.4vw, 1.75rem)
--nyx-type-data:    clamp(1rem, 2.4vw, 1.875rem)
--nyx-type-panel:   0.9375rem
--nyx-type-body:    0.9375rem
--nyx-type-nav:     0.8125rem
--nyx-type-meta:    0.75rem
--nyx-type-label:   0.6875rem
```

Note that `label` is smaller than `meta`, and `panel` and `body` are identical. These are named
by role rather than by size, and we suspect the set grew by accretion rather than being designed
as a scale. We would like your read on whether this is a real problem and what it should be.

**The spacing scale** is `--nyx-space-1` through `-16` on a 0.25rem base (4px), skipping 7, 9,
11, 13-15. Components reference these tokens, but we have never verified that the result produces
rhythm as opposed to gaps that merely satisfy a minimum.

**Four accent themes** — `solar` (amber), `signal` (green), `flux` (cyan), `plasma` (violet) —
over a shared dark neutral base, plus semantic success/warning/danger/info colors that are meant
to retain their meaning across all four accents.

**Motion** was recently applied, not designed. The system has 14 keyframes and 5 motion utilities
that existed but were barely used; we recently took component transitions from 11 to 25 and
animations from 8 to 11, guided only by the instruction "clarify state change, do not decorate."
Nobody has judged the result.

**Everything is monospace.** This is deliberate — it is an operational aesthetic — but it has
consequences for line length, information density, and readability that we would like assessed by
someone who did not make that decision.

---

## The questions

Answer what you find most important. If a question is uninteresting because the answer is "this
is fine," say so briefly and spend your effort elsewhere.

### 1. Coherence

1. Does this read as one designed system, or as 97 pages that were each fixed individually? Where
   specifically does the visual language contradict itself?
2. Is the spacing scale producing actual rhythm, or arbitrary gaps that happen to pass a minimum
   threshold? Point to where it breaks down.
3. Is the type scale defensible? If not, what should it be, given a monospace face and an
   information-dense operational context?
4. Do the four accent themes hold up equally, or was one designed and the others derived? Do the
   semantic colors retain their meaning across all four?

### 2. Adoption

This matters most to us. Nyx must work as a framework other teams adopt, not as a showcase of a
design language.

5. Reading the documentation, could you build a real screen without reading the source? Where
   would you get stuck?
6. Where will an adopter's first hour go wrong? Installation, Tailwind CSS configuration, the
   copy-the-markup registry model, initializing the behavior modules.
7. Is a three-part distribution model — a CSS package, ESM behavior subpaths, and copy-paste
   registry markup — explicable to a newcomer, or is it too many concepts?
8. What is missing that a team would hit in week one and find absent?

### 3. Accessibility beyond attribute checking

We assert roles and ARIA attributes. We believe that is the floor, not the ceiling.

9. Walk the keyboard through a real task — filter a data table, select a date range, open the
    command palette and act on a result. Not "is there a tab stop" but "is this usable without a
    mouse."
10. What would a screen reader actually announce on the data table, the notification centre, and
    the generation queue? Does the announcement make sense, or merely exist?
11. How does focus behave across stacked overlays — a dialog containing a dropdown containing a
    tooltip? We test these in isolation only.
12. Does contrast hold in all four accent themes across every semantic tone, including solid-fill
    tags and disabled states? We verified one theme.

### 4. Motion

13. Does the motion read as one language, or as separate components that each got animated?
14. Are durations doing semantic work — do similar state changes feel similar — or are they just
    nearby token values?
15. Where is motion missing such that a state change is imperceptible?
16. Where is motion present that should not be, by the standard of "clarify, do not decorate"?

### 5. The questions we most want answered

17. **What is the most embarrassing thing an experienced frontend engineer would notice in the
    first ten minutes?**
18. **Where does this look AI-generated?** Much of it was built by AI agents. We want the tells
    identified — in the CSS, the markup, the component APIs, and the documentation prose.
19. **What should be deleted?** We have only ever added. Nothing has been removed. What is
    redundant, speculative, or not carrying its weight?
20. If you had to fix five things before this is credible as a public framework, what are they and
    in what order?

---

## How to review

You are running inside the repository, so you have the source and can drive the application
yourself. Use both. Every defect listed earlier passed source-level review and was obvious on
screen, so source reading alone will not surface this class of problem.

**Start the application:**

```shell
pnpm install          # if node_modules is absent
pnpm dev -- --port 5174 --strictPort
```

This serves the documentation catalog at `http://127.0.0.1:5174/`. If the port is already in use,
something is already serving it — check before assuming it is broken. If the server is not
running when you try to reach it, start it rather than reporting the site as unreachable; that is
not a finding. Note that running the test suite may stop a server you started, so re-check it
after any test run.

**Drive the real interface.** Do not answer the keyboard, focus and motion questions by reading
markup. Open the pages, tab through them, trigger the state changes and watch what happens. The
accessibility and motion sections exist precisely because attribute-level inspection already
passes while the experience does not.

**Worth reading directly:**
- `packages/core/src/tokens.css` — the token system
- `packages/core/src/components.css` — all component styling, 842 lines
- `packages/core/src/motion.css` — keyframes and motion utilities
- `registry/components/*.html` — the 66 canonical component sources
- `apps/docs/src/catalog/*.ts` — documentation page content and prose
- `tests/browser/*.spec.ts` — what we currently assert, and therefore what we are blind to

**Look at it at several widths.** 2560, 1920, 1280 and 390 at minimum. Several of our defects
only appeared at one width, and one — body text frozen at 612px while frames grew to 1280px — got
worse as the viewport got larger.

**Do not fix anything.** This is a review. Report findings; do not edit files, and do not commit.
We want your assessment, not a patch.

## How to report findings

Two requests, both learned the hard way.

**Give every finding a reference and a reproduction.** File and line where you can, route and
viewport where it is visual, and the steps to see it. We will independently reproduce each
finding before acting on it.

**Mark your confidence, and flag what might be intentional.** In this project's recent history,
three separate diagnoses turned out to be wrong on inspection, and two of them would have sent an
engineer to "fix" code that was working correctly. One reported defect — "the resizable panels do
not resize" — was false; the panels resized correctly, and the real problem was that the drag
handle looked like a border, so nothing indicated it could be dragged. The complaint was real; the
diagnosis was wrong.

So: where something looks wrong but may be a deliberate decision you disagree with, please say
so, rather than reporting it as a defect. "I would have done this differently, and here is why"
is a different and more useful claim than "this is broken."

Rank findings by severity. We would rather have fifteen findings we can act on than fifty we have
to triage.
