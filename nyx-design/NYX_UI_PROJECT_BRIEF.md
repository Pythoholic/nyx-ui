# Nyx UI — Project Brief

## Document purpose

This document records our shared understanding of Nyx UI and the work we intend to begin in a new repository.

When the new repository is created, copy the entire `nyx-design` folder into it. The `index.html` file will provide the visual reference and this document will provide the product and engineering brief. Together, they are the initial source of truth for building the framework.

## Our shared understanding

Nyx is not merely a design-system page for AI Quick Gen. The completed AI Quick Gen interface helped us discover and refine a distinctive visual language. We now want to turn that language into an independent, open-source Tailwind CSS UI component library for building modern websites, applications, dashboards, creative tools, and operational interfaces.

The intended product category is a complete Tailwind CSS UI toolkit:

- Ready-to-use Tailwind CSS components
- Copyable semantic HTML examples
- Optional JavaScript and TypeScript behavior for interactive components
- Framework compatibility rather than dependence on one framework
- Theme support
- Documentation, examples, and reusable application patterns
- An installable npm package

Nyx must have its own recognizable identity, component design, interaction language, documentation, and developer experience. Internal research may inform architectural decisions, but Nyx documentation and interfaces must never name, imitate, or promote another UI product.

## Product vision

Nyx UI should make it fast to build interfaces that feel:

- Precise
- Technical
- Professional
- Modern
- Dense without feeling cramped
- Expressive without visual noise
- Suitable for real production applications

The framework should be useful for:

- SaaS products
- AI and creative tools
- Developer tools
- Administration interfaces
- Operations consoles
- Analytics products
- Dashboards
- Media-generation applications
- Data-heavy internal tools
- Marketing and product websites that use the Nyx identity

## Brand identity

The current visual reference is `index.html` in this folder. It was derived directly from the original NyxForge design system and updated with patterns discovered while building the finished product.

The core visual identity includes:

- Deep slate-black surfaces instead of generic neutral gray
- JetBrains Mono as the principal typeface
- Strong, visible 2px structural boundaries
- Compact radii
- A single configurable accent color
- Fixed semantic colors for success, warning, failure, and information
- Uppercase labels, navigation, status text, and commands
- Sentence-case explanatory copy
- Tabular numerals for operational and financial data
- Boxed selection states rather than underline-only selection
- Compact controls placed within comfortably spaced layouts
- Shadows reserved for genuinely floating elements
- Restrained, purposeful motion

Nyx should become recognizable even when the product name and accent theme change.

## Typography contract

Typography must be deterministic and consistent across every component and documentation page.

The browser viewport may change layout, wrapping, spacing, and column count. It must not arbitrarily shrink the type scale.

The present reference uses these fixed roles:

- Display: 28px, weight 700
- Panel title: 15px, weight 600
- Body: 13–14px, weight 400
- Controls: 12–13px, weight 600 where appropriate
- Labels: 11–12px, weight 500
- Metadata: 10–11px, weight 400–600
- Data: 16px, 22px, or 28px depending on hierarchy

The framework implementation may refine these values during formal token work, but it must preserve a documented, finite type scale. Components must not introduce arbitrary font sizes.

## Color contract

Nyx uses fixed neutral and semantic foundations with a configurable accent.

### Fixed surface roles

- Void
- Radial background
- Panel
- Raised panel
- Input
- Chip
- Default border
- Strong border
- Primary text
- Secondary text
- Label text
- Disabled text

### Fixed semantic roles

- Success / operational
- Warning / degraded
- Failure / destructive
- Information / processing
- Alternate data series

### Theme-controlled accent roles

- Accent
- Accent highlight
- Text on accent
- Soft accent fill
- Accent border

The initial accent themes are:

- Solar
- Signal
- Flux
- Plasma
- Ember

Themes should be activated structurally:

```html
<html data-nyx-theme="solar">
```

Components inherit theme variables. JavaScript must not rewrite the styles of individual components when the theme changes.

Semantic colors do not change to match the accent. Success must remain success, warning must remain warning, and failure must remain failure.

## Framework principles

### Tailwind-first

The public component examples should be composed from Tailwind CSS utilities and Nyx design tokens. Users should be able to inspect, copy, and customize ordinary markup.

Nyx should not hide simple visual components behind unnecessary proprietary abstractions.

### Semantic HTML first

Use native elements before adding ARIA or JavaScript:

- `button` for actions
- `a` for navigation
- `input`, `select`, and `textarea` for form controls
- `fieldset` and `legend` for related choices
- `table` elements for tabular data
- `details` and `summary` for straightforward disclosure patterns
- Correct heading hierarchy

ARIA should supplement native semantics, not replace them.

### Framework-agnostic core

The primary component source should work with ordinary HTML and Tailwind CSS.

Interactive behavior should be supplied through optional, framework-agnostic TypeScript plugins. Framework adapters can wrap those primitives later.

React must not be required to use Nyx.

### Optional behavior

Purely visual components should require no JavaScript.

Components such as dialogs, dropdowns, tabs, tooltips, drawers, comboboxes, and advanced selectors may use optional TypeScript plugins.

The behavioral package should support:

- Selective imports
- Tree shaking
- Manual initialization
- Optional automatic initialization
- Lifecycle events
- Dynamic content initialization
- Clean teardown
- Server-rendering safety

### Accessibility is part of the API

Accessibility is not an optional documentation note. Each interactive component must specify:

- Semantic structure
- Accessible name
- Required ARIA attributes
- Keyboard behavior
- Focus behavior
- Focus restoration
- Screen-reader announcements
- Disabled behavior
- Error behavior
- Reduced-motion behavior
- High-contrast behavior

### Responsive without typographic instability

Responsive rules should change:

- Grid columns
- Flex direction
- Content visibility
- Navigation presentation
- Panel arrangement
- Spacing when necessary

Responsive rules should not silently invent a different type hierarchy.

## Proposed repository structure

The exact workspace tooling will be decided when the new repository is created, but this is our intended direction:

```text
nyx-ui/
├── packages/
│   ├── core/                 # tokens, theme CSS, Tailwind integration
│   ├── components/           # copyable Tailwind component source
│   ├── plugins/              # framework-agnostic TypeScript behavior
│   ├── icons/                # SVG icon conventions and helpers
│   └── react/                # optional React adapters, added later
├── apps/
│   ├── docs/                 # public documentation website
│   └── playground/           # component development and testing
├── examples/
│   ├── html-vite/
│   ├── react-vite/
│   └── nextjs/
├── tests/
│   ├── accessibility/
│   ├── interaction/
│   └── visual/
├── design/
│   └── nyx-design/           # this reference folder
├── package.json
└── README.md
```

We should use a monorepo only if it materially improves package development, testing, and releases. The initial setup should remain understandable to outside contributors.

## Proposed packages

Package names are provisional until the repository and npm scope are selected.

### `@nyx-ui/core`

Responsibilities:

- Design tokens
- CSS variables
- Accent themes
- Tailwind CSS integration
- Base typography
- Focus styles
- Motion settings
- Dark-mode foundations
- Optional future light-mode foundations

### `@nyx-ui/components`

Responsibilities:

- Copyable component markup
- Tailwind utility composition
- Component examples and variants
- Required semantic structure
- Data attributes consumed by optional plugins

### `@nyx-ui/plugins`

Responsibilities:

- TypeScript interaction behavior
- Dropdown
- Dialog
- Drawer
- Tabs
- Accordion when native disclosure is insufficient
- Tooltip
- Popover
- Combobox
- Menu
- Toast management
- Other behavior-heavy components

### `@nyx-ui/icons`

Responsibilities:

- Standardized SVG icon integration
- 24px source grid
- Supported rendering sizes: 16px, 20px, and 24px
- Consistent 2px round strokes
- Accessible icon examples
- Rules for decorative and meaningful icons

We should not build a large icon catalog initially. This package should define Nyx's geometry, sizing, stroke, and accessibility contract while allowing consumers to supply compatible SVG icons.

### `@nyx-ui/react`

This should be added after the HTML and TypeScript core is stable.

Responsibilities:

- Thin React adapters
- Type-safe props
- Controlled and uncontrolled patterns
- React lifecycle integration
- No separate visual language

## Intended installation experience

The final syntax depends on Tailwind and package versions selected when development starts. The desired experience is approximately:

```css
@import "tailwindcss";
@import "@nyx-ui/core";
@source "../node_modules/@nyx-ui/components/**/*.{html,js,ts}";
```

For behavior:

```ts
import { NyxDialog, NyxDropdown } from "@nyx-ui/plugins";
```

For a theme:

```html
<html data-nyx-theme="solar">
```

The actual public API must not be finalized until we create working prototypes and test real consumer projects.

## Component scope

### Foundations

- Color tokens
- Typography
- Spacing
- Borders
- Radii
- Shadows
- Motion
- Breakpoints
- Z-index layers
- Iconography
- Theme architecture

### Actions

- Primary button
- Secondary button
- Quiet button
- Destructive button
- Icon button
- Button group
- Loading and disabled states

### Forms

- Text input
- Textarea
- Native select
- Custom select
- Checkbox
- Radio group
- Switch
- Range control
- Number input
- Search field
- Input group
- Validation messages
- Date and time inputs
- Date-range selection when justified by a real use case
- File upload

### Navigation

- Application top bar
- Navigation tabs
- Breadcrumbs
- Pagination
- Sidebar navigation
- Account menu
- Command or action menu
- Mobile navigation

### Overlays

- Tooltip
- Popover
- Dropdown
- Menu
- Dialog
- Drawer
- Confirmation dialog

### Feedback

- Status badge
- Alert
- Inline notice
- Toast
- Progress bar
- Progress steps
- Skeleton
- Spinner
- Empty state with primary action
- Error state

### Data display

- Stat card
- Description list
- Table
- Data table foundations
- Expandable job row
- Workflow steps
- Timeline
- Log viewer
- Prompt or code record

### Data visualization

- Line chart styling
- Bar chart styling
- Sparkline
- Chart legend
- Chart tooltip
- Empty chart
- Loading chart
- Accessible summary and table alternatives

The chart layer may integrate with an established charting library instead of implementing rendering from scratch. Nyx should own the visual and accessibility contract.

### Media and production

- Media preview
- Gallery card
- Upload area
- Rating control
- Protected or sensitive-media state
- Media action panel
- Batch facet
- Batch plan tile
- Batch progress
- Batch library card

### Layout and patterns

- Application shell
- Authentication layout
- Settings layout
- Dashboard layout
- Split workspace
- Operations console
- Gallery
- Empty onboarding flow

## Component state contract

Every applicable component must document and test:

- Default
- Hover
- Focus-visible
- Active or pressed
- Selected
- Disabled
- Read-only
- Loading
- Success
- Warning
- Error
- Empty
- Compact layout
- Mobile layout
- Reduced motion
- Forced colors or high contrast

A screenshot of the default state is not a complete component specification.

## Documentation requirements

The documentation website should include:

- Installation
- Tailwind integration
- Theme setup
- Component search
- Component categories
- Live previews
- Copyable source
- Variant examples
- Accessibility notes
- Keyboard interaction tables
- API documentation for plugins
- Framework guides
- Migration guides
- Changelog
- Contribution guide
- Browser support
- Version compatibility

Each component page should answer:

1. What problem does this component solve?
2. What markup is required?
3. What states and variants exist?
4. What keyboard behavior is expected?
5. Is JavaScript required?
6. How is it initialized and destroyed?
7. How is it themed?
8. How does it behave responsively?
9. What accessibility rules must consumers preserve?

## Quality requirements

### Accessibility testing

- Automated Axe checks
- Keyboard interaction tests
- Focus-order tests
- Focus-trap and restoration tests
- Accessible-name checks
- Color-contrast checks
- Reduced-motion checks
- Forced-colors review
- Manual screen-reader checks for complex components

### Visual testing

- Screenshot regression tests
- All themes
- Standard desktop viewport
- 2560×1440 reference viewport for large 2K monitors
- Tablet viewport
- Mobile viewport
- High browser zoom
- Long content
- Localization expansion

Typography screenshots must detect unintended fallback fonts, missing weights, and font-size changes.

### Interaction testing

- Mouse
- Keyboard
- Touch where applicable
- Open and close behavior
- Outside click
- Escape behavior
- Nested overlays
- Dynamic content initialization
- Cleanup and memory-leak checks

### Code quality

- TypeScript strict mode
- Linting and formatting
- Public API type tests
- Package-size monitoring
- Tree-shaking verification
- No unintentional global styles
- No undocumented dependencies

## Initial release scope

The first public release should be intentionally focused.

### Phase 1 — Foundation

- Repository and package workspace
- License
- Contribution guidelines
- Token model
- Theme CSS
- Tailwind integration
- Typography
- Icon rules
- Documentation shell
- Visual and accessibility test infrastructure

### Phase 2 — Core components

- Buttons
- Form fields
- Checkbox and radio
- Switch
- Cards
- Badges
- Alerts
- Empty states
- Skeletons
- Tabs
- Accordion
- Tooltip
- Dropdown
- Dialog
- Breadcrumbs
- Pagination

### Phase 3 — Application components

- Application shell
- Sidebar
- Tables
- Stat cards
- Job rows
- Progress steps
- Toasts
- File upload
- Media cards

### Phase 4 — Ecosystem

- Framework examples
- React adapters
- Advanced forms
- Charts
- Data table behavior
- Date-range picker
- Additional templates and blocks

## What we should not do initially

- Do not build hundreds of shallow components before the token and accessibility contracts are stable.
- Do not make React mandatory.
- Do not introduce a proprietary styling language on top of Tailwind.
- Do not copy or name another component library in Nyx product materials.
- Do not hardcode AI Quick Gen or NyxForge product concepts into generic primitives.
- Do not build a large custom icon set before Nyx-specific symbols are actually required.
- Do not build a custom chart renderer unless a compelling technical reason emerges.
- Do not promise every framework in the first release.
- Do not allow documentation examples to drift away from tested package source.
- Do not use fluid font sizing that causes hierarchy to change unpredictably across viewports.

## Open decisions for the new repository

We will decide these when development begins:

- Final public project name
- GitHub organization and repository name
- npm scope and package names
- Open-source license
- Tailwind CSS version baseline
- Node.js version baseline
- Package manager
- Monorepo tooling
- Documentation framework
- Testing stack
- Browser-support policy
- Whether the first release is dark-only or includes a light foundation
- Whether behavioral plugins use data attributes, direct constructors, or both
- Which charting library, if any, receives official integration

These decisions should be made deliberately rather than assumed from the current AI Quick Gen repository.

## Recommended first working session

When the new repository is ready, our first session should:

1. Inspect the new repository and this folder.
2. Confirm the project name, license, Tailwind baseline, and package manager.
3. Create the package and application structure.
4. Convert the visual tokens in `index.html` into a canonical token source.
5. Generate CSS variables and Tailwind theme integration from that source.
6. Build the documentation shell using Nyx itself.
7. Implement one simple component and one interactive component end to end.
8. Add accessibility, interaction, and screenshot tests immediately.
9. Test the library in a separate example consumer application.

The recommended proof components are:

- Button — validates tokens, variants, focus and theming.
- Dialog — validates TypeScript behavior, focus management, accessibility, lifecycle and framework independence.

## Definition of success

Nyx UI will be succeeding when an independent developer can:

1. Install it from npm.
2. Add it to an existing Tailwind project without replacing their project structure.
3. Copy a component from the documentation.
4. Understand the markup without learning a proprietary template language.
5. Use visual components without JavaScript.
6. Import only the interactive behavior they need.
7. Apply a Nyx theme from one root data attribute.
8. Customize tokens without editing package source.
9. Use the component with a keyboard and assistive technology.
10. Upgrade versions with a clear changelog and migration path.

## Source-of-truth statement

Until the new repository is created:

- `index.html` is the visual reference.
- `NYX_UI_PROJECT_BRIEF.md` is the product and engineering brief.
- The original NyxForge design files remain historical reference material.
- AI Quick Gen remains evidence of how the design language behaves in a real application, but it is not the future framework architecture.

When development starts, canonical tokens, tested component source, and generated documentation in the new repository will gradually replace `index.html` as the implementation source of truth. The visual identity and principles recorded here should remain stable unless we deliberately revise them.

## Restart prompt for the next session

After creating the new repository and copying this folder into it, use a request similar to:

> Read `design/nyx-design/NYX_UI_PROJECT_BRIEF.md` and inspect `design/nyx-design/index.html`. This is the new Nyx UI repository. Begin Phase 1 by auditing the repository, confirming any decisions that genuinely block architecture, and scaffolding the open-source Tailwind CSS component framework described in the brief.

That will give us a precise starting point without relying on memory from this repository or conversation.
