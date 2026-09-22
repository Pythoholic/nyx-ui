# Publishing plan review

Review date: 2026-09-19. This is a review of the proposed direction against the repository and current npm guidance. It does not authorize or perform a release, namespace claim, account change, or deployment.

## Conclusion

I agree with the overall direction: public npm, scoped package names, explicit package contents, deliberate entry points, and OIDC-based publishing with provenance are the right defaults for these packages. Public npm fits the intended anonymous consumer experience and the repository is already substantially shaped for it.

I do not agree that principles 1–3 are simply complete, or that principle 4 is the only remaining work. Principle 3 is effectively satisfied for the current public surfaces, but principle 1 is only configured locally until the scope is controlled, and principle 2 has an allowlist without a sufficiently strict artifact contract. There are also pre-publication decisions and defects outside the four principles: the tarballs omit `LICENSE`, core does not declare its Tailwind CSS compatibility, the versioning relationship is undecided, the package-page READMEs are thin, changelogs are disabled, and the first-publish bootstrap conflicts with an absolute promise that every release will use Trusted Publishing.

The sequencing note is correct. Publishing and deployment should remain last. The decisions below should be settled earlier because the first public coordinates and contents cannot later be edited in place.

## Verification of the current state

| Claim | Finding | Evidence and correction |
| --- | --- | --- |
| Both packages use scoped names and public access | **Holds as repository configuration, not as registry ownership.** | `packages/core/package.json` and `packages/plugins/package.json` name `@nyx-raul/core` and `@nyx-raul/plugins` and set `publishConfig.access` to `public`. `.changeset/config.json` also sets public access. This does not establish that the project controls `@nyx-raul`. |
| Both package records return 404 | **Holds as of this review.** | Read-only `npm view` requests returned `E404` for both names. This shows that neither public package record resolves; it does not establish scope availability. |
| Both packages use a `files` allowlist and no `.npmignore` | **Holds.** | Core uses `files: ["src/**/*.css"]`; plugins uses `files: ["dist"]`; no `.npmignore` exists. npm's `files` field is an inclusion list, although npm also force-includes certain package-root files such as the manifest, README, and a package-root license when present ([npm package contents](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#files)). |
| The allowlist migration remains to be done | **Does not hold.** | The mechanism is already in place. What remains is to define and enforce the exact intended artifact inventory. The current verifier checks required files but does not reject unexpected ones. |
| Only final compiled assets are published | **Does not fully hold.** | Core intentionally publishes CSS from `src`, which is the distributable input rather than a compiled output. Plugins publishes the entire `dist` tree: JavaScript, declarations, declaration maps, source maps, and compiled internal modules. The maps currently reference source paths but do not embed `sourcesContent`. Whether maps and internal modules are intended artifacts has not been recorded. |
| Allowlisting entirely eliminates accidental disclosure | **Does not hold.** | It sharply reduces risk but cannot eliminate it. A generated file or source map can contain secrets or source content, and npm always includes some package-root metadata regardless of `files`. Exact tarball inspection and secret scanning remain necessary. |
| Plugin entry points all have TypeScript declarations | **Holds.** | The plugin manifest has 43 exports: the root plus 42 named subpaths. Every export has a `types` target and a JavaScript default target. The TypeScript build enables declaration and declaration-map output. |
| Core has a TypeScript-support hole | **The literal observation holds; the implied defect does not.** | Core exports CSS at `.` and `./theme.css`. It has no JavaScript API and therefore needs no declaration file. The plan should say that strict TypeScript support applies to the plugin API, while core's contract is CSS exports. Core already has explicit entry points. |
| Principle 4 is absent | **Holds.** | `.github/workflows/ci.yml` is the only workflow. It grants `contents: read`, runs tests, typechecking, build, and package verification, and has no publish job or `id-token: write`. No repository file configures provenance. The root `pnpm release` command builds, checks, and runs `changeset publish`; it is a local-capable direct publish command, not a trusted CI boundary. |
| Both packages are at `0.1.0`, and a pending changeset would make both `0.1.1` | **Holds.** | Both manifests are `0.1.0`. `.changeset/calm-moons-pack.md` requests a patch bump for both. The first version therefore remains an unresolved decision rather than automatically becoming `0.2.0`. |
| The catalog is approximately 95 routes | **Does not match the current registry.** | The registry currently contains 68 entries. That count is not a sound reason by itself to select a version; release maturity and compatibility intent are the relevant factors. |
| The tarballs contain their READMEs and license | **Only the README portion holds.** | `npm pack --dry-run --json --ignore-scripts` included each package-local README but no `LICENSE` in either tarball. The only license file is at the repository root, outside both package roots. `scripts/verify-packages.mjs` requires README and export targets but does not require `LICENSE`. |
| The source repository is ready for public provenance | **Repository identity is established; release controls remain pending.** | The manifests and Git remote point to the public `Pythoholic/nyx-ui` repository. npm automatically emits provenance through Trusted Publishing only for public packages built from a public repository ([Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)); the protected release workflow and publisher bindings are separate release prerequisites. |

## Assessment by principle

### 1. Scoped organization naming — partially satisfied

The desired names are consistently configured and public access is explicit. That is valuable preparation, but it is not ownership. The authoritative gate is whether the intended publisher controls the `nyx-raul` npm organization/scope and can grant the maintainers and automation the required package rights. A 404 for a package does not distinguish an unclaimed scope from a controlled scope with no public packages.

Remaining work is to settle the durable organization identity, verify scope control through npm's authenticated process, define owner recovery and at least two appropriate maintainers, and only then freeze the package coordinates. If the scope cannot be controlled, rename both packages and all documentation/import references before either package is published.

The plan's claim that scoping "completely avoids naming collisions" is too strong. A controlled scope prevents outsiders from creating names inside that scope, but the scope itself must first be available and governed. It also does not by itself make a package trustworthy; trust comes from control, release security, provenance, maintenance, and the contents consumers inspect.

### 2. Strict artifact allowlisting — partially satisfied

The repository already uses positive `files` lists and has no root `.npmignore` in either package. There is therefore no blocklist-to-allowlist implementation to perform.

What remains is a policy and stronger verification:

- Decide whether plugin source maps and declaration maps are intentional public artifacts and whether compiled `dist/internal/*` files should ship even though `exports` prevents supported direct imports.
- Recognize that core's CSS in `src` is intentionally shipped source. Rewrite the principle as "only reviewed distributable assets," not "only compiled assets."
- Include the Apache-2.0 license in both package roots/tarballs and make the package check require it.
- Make verification reject unexpected paths, not merely confirm that README and export targets exist. Continue inspecting the exact packed tarballs, because generated output can still contain sensitive content.

The current allowlists keep tests and repository configuration out, but the plan's assertion that the mechanism entirely eliminates disclosure risk is not technically defensible.

### 3. First-class developer experience — already satisfied for entry points and TypeScript, with adjacent release work remaining

Plugins has explicit ESM exports and a declaration target for every public subpath. Core has two explicit CSS exports. That is a coherent public boundary: TypeScript declarations belong to the JavaScript plugin surface, while the CSS-only package does not need artificial `.d.ts` files.

The plan should state this split rather than promising TypeScript support for every package in the abstract. Before release, consumer tests should install the packed tarballs in a clean fixture and verify representative CSS and TypeScript imports. That is validation of an existing design, not a missing entry-point implementation.

Adjacent DX gaps are not TypeScript gaps: core does not declare the Tailwind CSS version it expects, and the package-local READMEs do not yet provide a complete installation, compatibility, and lifecycle path.

### 4. Zero-trust publishing and provenance — not started

There is no release workflow, OIDC permission, npm trusted-publisher binding, protected release environment, or proven CI-only publish path. The present script can publish from any authenticated local environment. Principle 4 is the largest implementation item, but not the only release-readiness work.

"Zero trust" should not be read as "no trust" or as proof that the code is safe. npm provenance provides a cryptographically verifiable link between a published artifact, source repository, commit, and CI workflow; npm explicitly notes that provenance does not prove the package contains no malicious code ([provenance guidance](https://docs.npmjs.com/generating-provenance-statements/)). The pipeline still trusts reviewed source, actions, dependencies, runner isolation, and release governance.

## Technical prerequisites for Trusted Publishing and provenance

### Runtime and registry requirements

- npm Trusted Publishing requires **npm CLI 11.5.1 or later** and **Node.js 22.14.0 or later**. The repository's `node >=22` and workflow `node-version: 22` do not guarantee either floor. The publish workflow must pin a sufficient Node/npm combination and verify the versions. The local machine used for this review happens to have Node 24.11.0 and npm 11.6.1; that does not constrain GitHub Actions.
- The publish must run on a GitHub-hosted runner; self-hosted runners are not currently supported for npm Trusted Publishing.
- Automatic provenance requires Trusted Publishing, a public npm package, and a public source repository. The last condition is not met or at least not publicly observable today.
- The package `repository.url` must exactly and case-sensitively match the GitHub source repository. The two manifests currently match the configured Git remote, but all three must change together if the repository moves.

### GitHub Actions shape

Use a dedicated, narrowly triggered release workflow rather than adding publishing authority to the general CI workflow. Its publish job needs, at minimum:

```yaml
permissions:
  contents: read
  id-token: write
```

It must check out the exact release commit, install from the frozen lockfile, test, build, inspect/package, and publish on a GitHub-hosted runner. A protected GitHub environment can add required approval and must have exactly the same environment name configured in npm's trust relationship.

For stronger isolation, split preparation from authority: an unprivileged job installs dependencies, tests, builds, and packs; a minimal publish job receives only the reviewed tarballs and has `id-token: write`. Do not expose OIDC minting permission to arbitrary install or build scripts if it can be avoided. Changesets v3 and the current Changesets action have separate planning/packing/publishing concepts; the action's own guidance recommends separate sub-actions to tighten Trusted Publishing permissions ([Changesets action](https://github.com/changesets/action)). If tag or release creation needs `contents: write`, keep it out of the OIDC publish job where practical.

Trusted Publishing automatically generates provenance for eligible public GitHub Actions publishes; `--provenance` is not required. If a third-party wrapper prevents the npm configuration from reaching the underlying publish, `NPM_CONFIG_PROVENANCE=true` is the documented fallback for provenance, but that flag alone does not provide OIDC authentication.

### npm-side configuration

Trusted Publishing is configured **per package**, not once per scope or repository. After each package record exists, configure a trust relationship naming the exact GitHub owner, repository, workflow filename, optional environment, and allowed action. Current npm supports direct `npm publish` and the safer `npm stage publish` permission. New configurations default to stage publishing; direct publishing must be deliberately allowed. Once trust works, set package publishing access to require 2FA and disallow traditional tokens, then revoke obsolete write tokens ([Trusted Publishing security guidance](https://docs.npmjs.com/trusted-publishers/)).

There is a bootstrap constraint that the plan misses: a trusted publisher can only be attached to a package that already exists ([npm trust prerequisites](https://docs.npmjs.com/cli/v11/commands/npm-trust/)), and staged publishing also cannot create a brand-new package ([staged publishing prerequisites](https://docs.npmjs.com/staged-publishing/)). The first version of each new name therefore needs a deliberate bootstrap path. The least contradictory option is an interactive first publish from a clean, reviewed release commit using an npm account protected by 2FA, followed immediately by trust configuration and token disallowance. That first local publish will not receive GitHub Actions provenance. Alternatively, a temporary CI credential can create the package with provenance and then be revoked, but that temporarily violates the plan's absolute no-static-write-token language. There is no honest way to promise both "Trusted Publishing from the first-ever package creation" and the current npm requirement that the package already exist. Record a narrow, auditable bootstrap exception rather than hiding it.

If the team adopts staged publishing after bootstrap, it requires npm CLI **11.15.0 or later**, Node.js 22.14.0 or later, and a maintainer with 2FA to inspect and approve each stage. This is stronger than direct automated publication and is my preference for the first releases, but Changesets' normal `publish` command is not itself a staged-publish workflow.

### Interaction with the existing Changesets setup

Changesets is already the version-plan source of truth. Keep the separation it expects:

1. Contributors add changesets.
2. A version step applies them, updates package versions, consumes the files, and produces a reviewable release commit/PR.
3. Only a merged, reviewed release commit is packed and published.

The current configuration has `fixed: []`, `linked: []`, `changelog: false`, and one pending patch changeset for both packages. Thus it neither enforces lockstep versions nor writes package changelogs.

`@changesets/cli` 3.0.3 detects this as a pnpm workspace and its `changeset publish` path invokes `pnpm publish`. The OIDC-capable npm CLI floor still has to be installed and verified in the publishing environment; relying on whatever npm happens to ship with an unpinned Node 22 image is insufficient. Before implementation is accepted, test the exact Changesets/pnpm/npm combination against a disposable package owned by the project or use the action's separated pack/publish flow. Do not discover wrapper incompatibility on the real first release.

The root `pnpm release` command cannot remain an ambiguously local "build, check, publish" button. It should become either:

- a CI-only publish entry point guarded by the dedicated trusted workflow, with local preparation exposed under a different non-publishing command; or
- a preparation command that stops after build, tests, exact tarball verification, and packing, while a distinct workflow-only command publishes the reviewed tarballs.

I recommend the second shape. It makes the safe local action non-publishing and confines the irreversible operation to the minimal OIDC job. If staged publishing is selected, the workflow-only step must stage each prepared tarball and the documented human step must review and approve it; `changeset publish` cannot simply remain unchanged.

## Risks and ordering before the first publish

Resolve these in this order, while keeping actual publication last:

1. **Permanent identity and public source.** Decide the durable GitHub owner/repository name and whether the repository will be public. A rename or transfer is possible later, but old provenance attestations are immutable historical records and will not be rewritten; npm trust bindings and manifest URLs must also be replaced or updated. I therefore agree with settling the name first, but disagree with the stronger claim that a later rename necessarily makes the old repository reference nonexistent: GitHub may preserve redirects, and the attestation remains an accurate record of the origin at publish time.
2. **npm scope control.** Confirm control of the intended organization scope and its recovery/maintainer model. If unavailable, rename before any publication. A package cannot be renamed in place; a different scope is a different package coordinate.
3. **Package contract.** Freeze the two names, exports, intended tarball inventory, license inclusion, Tailwind CSS support range, runtime/browser/Node expectations, and package relationship.
4. **First version and tags.** Choose the initial version deliberately. I still recommend `0.2.0`: it matches the completed project milestone and communicates a substantial but pre-1.0 contract. The repository's pending changeset currently implies `0.1.1`, which would look like a patch to a public `0.1.0` that never existed. This is a recommendation, not an automatic consequence of catalog size.
5. **Release governance.** Decide direct versus staged publishing, trigger, approvers, protected environment, tag naming, recovery path, and who may change the trusted workflow.
6. **Dry-run acceptance.** From a clean checkout, install, test, build, pack, inspect exact file lists and contents, install both tarballs into a clean consumer fixture, and verify the planned version and tag. Only after all other product work and these gates pass should the bootstrap and first live publish occur.

The irreversible facts are precise:

- A published `package@version` tarball and its metadata cannot be edited in place, and that exact name/version can never be reused even after unpublishing ([npm unpublish policy](https://docs.npmjs.com/policies/unpublish/)).
- A package rename is a new package; consumers do not transparently move to it.
- Public provenance transparency records are immutable historical records.
- A bad first version number, missing license, leaked content, or wrong files can only be superseded by another version; it cannot be repaired for the existing coordinate.

Dist-tags, deprecation messages, maintainers, and future trust configurations are mutable. The `latest` tag can be moved, but moving it does not change or erase any published version.

## Matters missing from the plan

### Release and lifecycle policy

- **Deprecation and unpublish:** Default to deprecation with a specific migration message. npm recommends deprecation because unpublishing breaks consumers. Unpublish should be an emergency response for accidental or sensitive publication and is constrained by registry policy; even a successfully unpublished name/version can never be reused ([deprecation guidance](https://docs.npmjs.com/deprecating-and-undeprecating-packages-or-package-versions/)). Document the decision maker, response window, and communication channel.
- **Dist-tags:** Decide whether `0.2.0` is ready to receive `latest`. `npm publish` uses `latest` by default; prereleases or evaluation builds should use a non-`latest` tag. Changesets supports a publish tag, but the normal first stable-public release should not accidentally inherit a beta tag or vice versa ([npm dist-tags](https://docs.npmjs.com/adding-dist-tags-to-packages/)).
- **Direct versus staged:** Current npm recommends stage-only trusted relationships for the strongest posture. Staging adds human 2FA approval and prevents CI from making a version live by itself. It is optional, but the plan should choose rather than treating all OIDC flows as equivalent.
- **Recovery:** Document how to rotate a workflow filename/environment/repository binding, how to recover from a partial two-package publish, and how to publish an emergency fix if GitHub Actions or Trusted Publishing is unavailable. A recovery path must not silently reintroduce a permanent broad token.

### Package contents and consumer contract

- **README on npm:** npm will show each package-local README, not the richer repository-root README. The current package READMEs are included but too short for first-time consumers. They need install commands, minimal CSS/TypeScript usage, supported Tailwind CSS and Node/browser expectations, links to canonical docs/source/issues, lifecycle cleanup guidance for plugins, license, and compatibility/versioning policy.
- **License:** Both dry-run tarballs omit `LICENSE`. Put a copy or otherwise ensure a package-root license is packed for each package, then make verification fail without it. Merely declaring `"license": "Apache-2.0"` is metadata, not inclusion of the license text.
- **Tailwind CSS peer contract:** Core uses Tailwind CSS 4 syntax and this repository tests against 4.3.3, but core declares no peer dependency. Declare and test the supported range before release; the earlier `^4.0.0` recommendation remains reasonable if that is the compatibility promise. If direct non-compiler CSS consumption is truly supported, test and explain that path rather than using it to obscure the build-time requirement.
- **Exact artifact policy:** Decide whether maps are supported artifacts and whether internal compiled modules should ship. Enhance `scripts/verify-packages.mjs` to compare against an expected inventory and to assert license presence. An allowlisted directory is still a broad bucket.
- **Consumer smoke tests:** Validate installs from the actual `.tgz` files, not workspace links. Check core root and theme CSS imports, plugin root and representative subpath imports, TypeScript resolution, ESM runtime behavior, and absence of unsupported deep imports.

### Versioning and release notes

- **Lockstep:** Both packages are currently independent in Changesets even though they share `0.1.0` and the pending changeset bumps both. Decide explicitly. I recommend a fixed group for the initial pre-1.0 period because documentation presents one product version and adopters commonly install both. If independent releases are desired, document compatible ranges and do not imply a single Nyx version.
- **Changelogs:** `"changelog": false` means `changeset version` will consume changesets and bump versions without generating package changelogs. Either enable a reviewed changelog generator or establish another durable release-notes source before the first release. A GitHub release alone is not a substitute unless its generation and package/version mapping are explicit.
- **Semver policy:** State how breaking changes are represented before 1.0, how CSS visual changes are classified, and whether removal or alteration of an export, CSS token, selector, event, or lifecycle behavior is breaking.
- **Two-package atomicity:** npm does not provide a transaction across packages. If the second publish fails, the first remains live. The workflow needs ordered, rerunnable behavior, a partial-release response, and a rule for when `latest` moves. Staged publishing can improve review but still requires an explicit two-package promotion procedure.

### Security and governance

- **Account controls:** Require account-level 2FA, more than one recoverable human owner, protected repository settings, least-privilege workflow permissions, reviewed action pins, and periodic audit of npm maintainers and trust bindings.
- **Public-source gate:** Do not advertise provenance until the repository is actually public and the published package page displays the attestation. Verify after publication with npm's signature audit tooling.
- **Provenance wording:** Say "attestations" rather than promising that provenance makes a build secure. It verifies origin and build context; it does not audit the source or dependencies.

## Recommendation

Proceed with public npm and the four principles, but revise the plan before implementation:

1. Mark principles 1 and 2 as partially satisfied, principle 3 as satisfied for the current CSS/TypeScript split, and principle 4 as not started.
2. Replace absolute claims: scoping does not itself guarantee trust, allowlisting does not eliminate disclosure risk, and provenance does not prove safe code.
3. Resolve the durable repository identity/public visibility, npm organization scope, `0.2.0` first version, lockstep policy, Tailwind CSS peer range, license inclusion, artifact inventory, package-page documentation, changelog policy, and `latest` policy before building release automation.
4. Design a dedicated release workflow with a minimal OIDC publish job, explicit npm and Node floors, per-package npm trust bindings, and preferably stage-only publication after the initial bootstrap.
5. Record the unavoidable first-publish bootstrap exception. Do not imply that two nonexistent package records can begin with an already-attached trusted publisher.
6. Keep hosting and deployment last, as requested. Nothing in this review warrants publishing early merely because much of the manifest work already exists.

The most important disagreement with Claude's assessment is scope: principle 4 is not the only genuine work. Scope ownership, public repository eligibility, license-bearing and exact tarballs, dependency compatibility, release/version policy, and first-publish bootstrapping are all real prerequisites. I agree with Claude that the current names, allowlist mechanism, and plugin type exports are already present, and I agree that `0.2.0` should be a conscious first-release decision. I soften the repository-rename claim: rename before release is prudent, but a later move does not falsify an old attestation; it leaves an immutable historical origin and creates migration work for trust configuration and metadata.
