---
name: nyx-ui
description: Build, integrate, debug, or adapt interfaces with Nyx UI registry components, core styles, and optional behavior plugins. Use when a request mentions Nyx UI, @nyx-ui packages, the Nyx registry, or an existing Nyx component. Do not use for unrelated UI libraries.
---

# Nyx UI

Use Nyx as an open-code component system: canonical markup comes from the registry, presentation comes from `@nyx-ui/core`, and interactive behavior comes from explicit `@nyx-ui/plugins/*` subpaths.

## Establish project context

Inspect the target repository before choosing a component:

- Detect its package manager and framework from existing manifests and source.
- Check whether `@nyx-ui/core` or `@nyx-ui/plugins` is already installed.
- Find the stylesheet that imports Nyx Core and the current `data-nyx-theme` value.
- Preserve existing file placement, naming, rendering, and lifecycle conventions.

Do not initialize a new application or replace its framework unless the user explicitly asks.

## Discover before composing

When the Nyx MCP tools are available:

1. Call `search_components` using the user's intent, not a guessed component identifier.
2. Call `get_component_contract` for the strongest candidate.
3. Compare `related`, `useWhen`, and `avoidWhen` when the choice is ambiguous.
4. Call `get_component_source` only after selecting the component.

If MCP is unavailable but the repository contains `registry/registry.json`, read the matching manifest entry and only the files it declares. If neither source is available, do not invent Nyx APIs; explain that the Nyx MCP server or registry source is required.

## Integrate the selected source

- Copy the canonical markup into application-owned source and adapt its content without discarding native semantics, accessible names, ID relationships, or `data-nyx-*` hooks.
- Keep `@nyx-ui/core` as the shared presentation dependency.
- Add only the plugin subpath declared by the contract for interactive behavior.
- Initialize the smallest stable subtree after its markup exists.
- Retain returned controller instances and call `destroy()` before removing or replacing that subtree.
- Connect business data, routing, validation, permissions, persistence, and network work in application code; Nyx does not own them.

Prefer an existing registry component or composition over reimplementing the same pattern. For a multi-region screen, begin with the closest layout or complete example and describe changes relative to it.

## Verify the result

Exercise the implemented workflow with keyboard and pointer input. Check focus movement and return, accessible names and state, Escape/outside dismissal where applicable, loading and failure states, responsive layout, theme inheritance, reduced motion, and controller cleanup.

Run the target project's relevant tests and type checks. Report any contract requirement that could not be preserved.

For detailed project-detection and dependency rules, read [references/project-context.md](references/project-context.md). Read [references/composition.md](references/composition.md) only for multi-component pages, layouts, or substantial adaptations.
