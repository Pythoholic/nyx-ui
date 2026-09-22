# Versioning

Run `pnpm changeset` for a consumer-visible package change and describe the change in terms of its effect on users. Commit the generated markdown file with the implementation.

Core, plugins, and MCP are a fixed group for the beta line. They ship as one coordinated release, so every release-plan application keeps all three packages on the same version even when a change only affects one package directly.

Maintainers can run `pnpm version-packages` to apply pending versions and generate package changelogs. Publishing is intentionally unavailable from a local script; use the protected GitHub release workflow after the owner approves the release environment.
