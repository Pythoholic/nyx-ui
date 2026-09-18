# Versioning

Run `pnpm changeset` for a consumer-visible package change and describe the change in terms of its effect on users. Commit the generated markdown file with the implementation.

Maintainers can then run `pnpm version-packages` to apply pending versions and changelogs, followed by `pnpm release` to build, verify, and publish the public packages.
