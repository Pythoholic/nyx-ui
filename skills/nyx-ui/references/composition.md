# Composing Nyx interfaces

Use this guidance for pages, layouts, or requests involving several components.

## Start from a frame

Search layouts and complete examples before assembling a shell from unrelated primitives. Choose the closest frame, then express the requested work as additions, removals, or replacements relative to that source.

## Add one coherent region at a time

For each substantial region:

1. Select its component from registry contracts.
2. Retrieve its canonical source.
3. Integrate it with the current frame and application data.
4. Verify behavior and responsive layout before adding the next region.

This keeps dependency, state, and accessibility mistakes local instead of multiplying them through a whole page.

## Preserve system decisions

- Use one active Nyx theme unless a deliberately nested theme is part of the request.
- Reuse the established content measure, spacing rhythm, control heights, and typography roles.
- Prefer native elements and documented Nyx compositions over generic containers with reconstructed ARIA.
- Keep overlay triggers visually identifiable and preserve focus restoration.
- Keep progress, status, and destructive semantics separate from the accent theme.

## Adapt without flattening

Changing copy, data, region order, or application actions is expected. Removing labels, state hooks, ownership boundaries, live regions, native form relationships, or controller cleanup is not a cosmetic adaptation and requires an explicit replacement that preserves the same contract.
