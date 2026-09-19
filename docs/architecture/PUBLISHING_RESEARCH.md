# Package publishing decision research

Research date: 2026-09-19. This document recommends a direction; it does not record a publishing decision. No account, namespace, package, or release was created while researching it.

## Current repository state

The repository already has two publishable packages:

- `@nyx-ui/core` contains source CSS and exports `.` plus `./theme.css`.
- `@nyx-ui/plugins` contains built ESM and type declarations, with one export per behavior module. Its only runtime dependency is `@floating-ui/dom`.

Both manifests are version `0.1.0`, declare Apache-2.0, include repository metadata, and set public access. Changesets is configured with public access, no fixed or linked group, and `@nyx-ui/docs` ignored. The root `pnpm release` command builds, verifies the packed files, then runs `changeset publish`. One pending changeset currently requests only a patch bump for both packages, which would produce `0.1.1` if applied unchanged.

There has been no published release. Live public-registry queries for `@nyx-ui/core` and `@nyx-ui/plugins` returned `404 Not Found` on 2026-09-19. That shows those two package records are not publicly resolvable; it does **not** prove that the `@nyx-ui` organization scope can still be claimed.

## Option 1: publish publicly to npm

### Consumer experience

If the `@nyx-ui` scope is secured, installation is the ordinary public-registry path:

```shell
pnpm add @nyx-ui/core @nyx-ui/plugins
```

Public packages can be viewed and downloaded by everyone. Consumers do not need a project `.npmrc` or an access token for ordinary public installation. npm organizations that publish only public packages can use the free public plan. Scoped packages are private by default at publish time, so public access must remain explicit; the repository already sets it in both package manifests and Changesets. See [npm's access matrix](https://docs.npmjs.com/package-scope-access-level-and-visibility/), [organization scope model](https://docs.npmjs.com/about-organization-scopes-and-packages/), and [public scoped publishing guide](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/).

Publishing requires an npm user or organization that owns the scope. Direct publishing also requires the account security or publishing-token setup required by npm. This is maintainer friction, not consumer friction.

### Commitment

This makes the package names and versions part of the public ecosystem. Published versions are effectively permanent consumer coordinates, so exports, CSS behavior, lifecycle contracts, and semver discipline become release obligations. Deprecation is safer than attempting to replace a published version. The project also commits to handling provenance, account recovery, maintainer access, and compromised-token response.

### Fit

This is the lowest-friction option for an open-source package intended for broad adoption. It matches the existing package manifests, public-access configuration, package verification script, and release command.

## Option 2: use the repository host's npm package registry

### Consumer experience

The repository is hosted under `Pythoholic/nyx-stealth`. The host registry only accepts scoped packages whose namespace is the publishing user or organization. Consumers would need a scope mapping and an access token even for public npm-format packages:

```ini
@NAMESPACE:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```shell
pnpm add @NAMESPACE/core @NAMESPACE/plugins
```

The official registry documentation says installation of public, internal, and private packages requires authentication with a classic personal access token; CI may use a repository token where permissions allow it. It also requires the `.npmrc` scope mapping. See [working with the npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) and [package permissions](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages).

The current `@nyx-ui/*` names therefore work on this registry only if a user or organization named `nyx-ui` owns the packages. With the repository under `Pythoholic`, the straightforward host-registry names would instead be `@pythoholic/core` and `@pythoholic/plugins`, requiring repository-wide package-name and import changes. Alternatively, the repository and package ownership would need to move under a `nyx-ui` organization.

### Commitment

This couples consumption to host accounts, host-specific tokens, `.npmrc` configuration, and package permission settings. It can align source and package permissions for a controlled organization, but it adds avoidable setup for a public design system. Publishing configuration would also need an explicit registry URL; the current manifests only set access and are presently aligned with npm's default registry.

### Fit

This is reasonable if Nyx is primarily for authenticated consumers already operating inside the repository host. It is a poor default for anonymous public adoption because every local developer and external CI environment must configure credentials.

## Option 3: do not use a registry yet

### Consumer experience

Adopters can copy canonical component HTML from `registry/components/` and use `registry/registry.json` to discover requirements. That works well for the open-code markup layer, but markup alone does not provide core CSS or interactive controllers.

A direct Git dependency is not a clean substitute in the current monorepo. Installing the repository URL resolves the root private workspace package, not both publishable subpackages, and npm documents that a direct Git install does not install workspaces. See [npm packages and Git URLs](https://docs.npmjs.com/about-packages-and-modules/) and [package specifications](https://docs.npmjs.com/cli/v11/using-npm/package-spec/). To make Git installation supportable, the project would need separate package repositories or release branches/tarballs whose roots are the individual package roots.

The practical no-registry choices are therefore:

1. copy registry markup and vendor `packages/core/src` plus the required built plugin modules at a pinned commit;
2. publish verified `.tgz` files as release assets and install their immutable URLs; or
3. maintain separate package-root branches or repositories for Git dependencies.

Each shifts update discovery, integrity verification, dependency resolution, and upgrade instructions onto adopters. Vendoring is viable for evaluation or a small trusted cohort, but it is not a smooth general installation story.

### Commitment

Deferring a registry avoids claiming a namespace and avoids a public semver promise while APIs are still changing. It commits maintainers to documenting pinning and upgrade procedures and to helping consumers distinguish canonical source from generated build output. If tarballs are offered, those artifacts still need signing/provenance, immutable tags, and release notes.

## The `@nyx-ui` scope question

The package names can be kept only if the publishing account owns `@nyx-ui` in the selected registry.

For npm, an organization name becomes its unique package scope when the organization is created. Public organization scopes are free. The public API checks performed for this research found no public `@nyx-ui/core` or `@nyx-ui/plugins` records, and an unauthenticated organization-membership query returned no public members. Neither result is an authoritative availability check: an empty scope can exist without public packages or members. npm's authenticated organization-creation flow is the authoritative place to confirm whether `nyx-ui` can be claimed. Creating it was explicitly out of scope for this research. See [creating an npm organization](https://docs.npmjs.com/creating-an-organization/) and [about scopes](https://docs.npmjs.com/about-scopes/).

Consequences:

- If `nyx-ui` is available and the chosen publisher creates or already controls it, keep `@nyx-ui/core` and `@nyx-ui/plugins`.
- If it is owned by someone else, the current names cannot be published there. Choose a scope the maintainer controls, then update both manifests, every import example, registry requirements, docs, package-verification expectations, and release configuration before the first publish.
- Do not publish one package under the desired scope and rename the other later. Resolve ownership before either first release.
- Registry scopes are independent. Owning a similarly named repository or organization on one service does not grant the npm scope.

## Recommended first version and release flow

### First version: `0.2.0`

Publish both packages at `0.2.0`, not `0.1.1` and not `1.0.0`.

`0.2.0` matches the repository's completed v0.2 milestone and signals a substantial pre-1.0 API surface rather than a patch to a public `0.1.0` that never existed. A `1.0.0` promise is premature while Calendar, Date Picker, and Advanced Data Table remain preview entries and the packages have not yet been exercised by external adopters. Under pre-1.0 semver, breaking consumer changes should increment the minor version; compatible fixes increment the patch version.

Before publishing, replace or supersede the pending patch changeset with a release plan that moves both packages to `0.2.0`. Keep the two package versions aligned for the first release because adopters will install them together and all documentation currently presents one Nyx version. If maintainers want that alignment enforced after the first release, configure them as a fixed Changesets group; fixed packages are versioned and published together even when only one changed. Otherwise leave the current independent configuration and document compatible package ranges. See [Changesets fixed packages](https://github.com/changesets/changesets/blob/main/docs/fixed-packages.md) and [configuration options](https://github.com/changesets/changesets/blob/main/docs/config-file-options.md).

### Release process

1. Decide the registry and confirm scope ownership before changing names or registry configuration.
2. Add or revise Changesets for all consumer-visible work and produce the `0.2.0` release plan.
3. Run `pnpm version-packages`; review both manifests, the lockfile, consumed changesets, and release notes before committing the version change.
4. Run `pnpm test`, `pnpm typecheck`, `pnpm build`, and `pnpm packages:check` from a clean checkout. The last command verifies declared exports against the actual tarballs.
5. Inspect the two tarball manifests and contents again, including license, repository metadata, `engines`, dependency ranges, and absence of secrets.
6. Publish from protected CI with provenance and least-privilege credentials where the chosen registry supports it. Keep a documented manual recovery path. The existing `pnpm release` command is the final publish step, not the validation step.
7. Smoke-test a clean consumer project against the published versions: install both packages, process the core CSS, import one plugin subpath, initialize canonical registry markup, and build production output.
8. Only after the smoke test passes, create and push the matching repository tag and publish human-readable release notes. If publication partially succeeds, do not reuse a published version; correct the issue and publish the next version.

For subsequent work, every consumer-visible pull request should include a Changeset. Accumulate changes on a release branch or automated version pull request, review the calculated versions, then publish from CI after the same four validation commands pass. The Changesets workflow is designed around adding change intent, applying versions, and publishing packages whose local version is newer than the registry version; see its [usage guide](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md).

## What adopters need on day one

### Package and build expectations

- Install `@nyx-ui/core` for every Nyx integration and `@nyx-ui/plugins` only when using interactive registry components.
- Nyx core currently uses Tailwind CSS 4 syntax, including `@theme static`, and is tested in this repository with Tailwind CSS `4.3.3`. The first release should declare a `tailwindcss: ^4.0.0` peer dependency in core so package managers surface the requirement; no peer dependency is declared today.
- `@nyx-ui/plugins` declares Node.js `>=22` in its package metadata and installs `@floating-ui/dom` transitively. Document that the Node requirement applies to consumer install/build tooling; the controllers execute in the browser.
- Import core CSS once from the application's main stylesheet and register its package source so Tailwind CSS sees the source-owned classes:

```css
@source "../node_modules/@nyx-ui/core/src/**/*.css";
@import "@nyx-ui/core";
```

- Set the theme on the root element, for example `<html data-nyx-theme="signal">`.

### Behavior consumption

Import only the controller used by copied markup:

```js
import { initDialogs } from "@nyx-ui/plugins/dialog";

const instances = initDialogs(root);
// Before replacing or unmounting root:
instances.forEach((instance) => instance.destroy());
```

Day-one documentation must explain root-inclusive idempotent initialization, explicit cleanup, cancelable before-events, after-events, and which application work remains outside each controller. The package root exists, but per-component subpaths should be the recommended path so unrelated behavior is not pulled into a consumer bundle.

### Registry relationship

The registry is not a third package. It distributes canonical HTML that adopters copy and own. `registry/registry.json` states whether a pattern needs only core or a plugin subpath. The docs render those files through raw imports, so the Preview and HTML tabs are the installable source rather than parallel examples.

The first-release instructions should give one complete path: install packages, configure CSS, copy one registry component, import its named behavior subpath if required, initialize after mount, and destroy before subtree replacement.

## Recommendation

Choose public npm, contingent on confirming ownership of `@nyx-ui`, and publish both packages first at `0.2.0`.

This option matches the repository's existing machinery and gives adopters the only low-friction, anonymous installation path. The repository-host registry adds mandatory token and `.npmrc` work for every consumer and would probably require either moving ownership under a `nyx-ui` namespace or renaming the packages. A no-registry release is acceptable for a short evaluation period, but the current monorepo means a Git URL does not cleanly install the two intended packages, so it would turn dependency management into a manual support burden.

The trade-off is that public npm creates a durable compatibility and security obligation. Resolve the scope first, declare the Tailwind CSS peer expectation, choose whether core and plugins remain version-locked, and add protected release credentials/provenance before the first publish. If `@nyx-ui` is unavailable, stop and rename before publishing anything; do not compromise the first release with package names the maintainer cannot own long term.
