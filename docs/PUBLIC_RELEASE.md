# Public release checklist

Target: `0.2.0-beta.1` on npm under dist-tag `beta`.

Line references below describe the pre-remediation tree audited on 2026-09-22.

## 1. Status summary

Status: **REPOSITORY PREPARED; OWNER RELEASE SETUP AND PUBLISH AUTHORIZATION PENDING**.

Current gates pass:

- `pnpm test`: 5 MCP tests, 212 plugin tests, and 141 Chromium tests passed.
- `pnpm typecheck`: MCP, plugins, docs, and the workspace example passed.
- `pnpm build`: MCP, plugins, docs, and the workspace example built; Vite emitted only its existing docs chunk-size warning.
- `pnpm packages:check`: core, plugins, and MCP packed 8, 220, and 102 files; 47 runtime exports and 47 type exports resolved from an isolated install; the installed consumer example built.

All repository blockers are complete. Publication remains blocked on the owner-only npm and GitHub configuration listed below; no package has been published by these remediation phases.

Completed repository work:

- Blockers 1-2: `7b9fb02` (`release: finalize attribution and package licenses`).
- Blocker 3: `08012c7` (`chore: untrack internal release artifacts`).
- Blockers 4, 7-9, and 13-16: `f04055b` (`release: rename repository identity and finish public surfaces`).
- Scoped package identity used by Phase 5: `d39c234` (`release: move packages to the nyx-raul npm scope`).
- Blocker 10: `b0e5bcf` (`docs: add public project governance`).
- Blockers 5-6 and 11-12: this Phase 5 commit (`release: prepare 0.2.0-beta.1 publishing`); its hash is the commit containing this checklist.

Outstanding owner actions before any release run:

- Sign in with `npm login`, confirm account-level 2FA is enabled, and verify at least one tested account-recovery path (recovery codes or another npm-supported recovery method).
- Create and protect the GitHub environment named `release`, require Soumya Raula's approval for each deployment, and configure the intended branch/tag protection.
- For each new package name (`@nyx-raul/core`, `@nyx-raul/plugins`, and `@nyx-raul/mcp`), perform the one-time first publish manually with 2FA because a package must exist before npm Trusted Publishing can be bound.
- Immediately after each first publish, bind that package's npm Trusted Publisher to `Pythoholic/nyx-ui`, workflow `release.yml`, environment `release`, and direct `npm publish`; verify all three bindings before any subsequent workflow release.
- Review the exact tarballs, authorize publishing separately, and approve the protected workflow job. Never run the workflow for a version already published during bootstrap.

## 2. BLOCKERS

1. **DONE (`7b9fb02`) — Finalize attribution and replace the LICENSE placeholder.**
   - Problem: `LICENSE:189` still contains `Copyright [yyyy] [name of copyright owner]`; the three publishable manifests have no author; no root `NOTICE` or README credits section exists.
   - Change: replace `LICENSE:189` with `Copyright 2026 Soumya Raula`; add `"author": "Soumya Raula (Software Engineer)"` after `license` in `packages/core/package.json:6`, `packages/plugins/package.json:6`, and `packages/mcp/package.json:6`; add root `NOTICE`; add `## Credits` after `README.md:128`. Use the title `Software Engineer`, never `Cloud Engineer`. Use this exact one-line credit in `NOTICE` and README: `Soumya Raula is a Software Engineer who builds software that improves people's lives.`
   - Acceptance: `rg -n "\[yyyy\]|name of copyright owner|Cloud Engineer" LICENSE NOTICE README.md packages -g package.json` returns nothing; all four attribution surfaces name Soumya Raula, 2026 where a copyright year applies, and `Software Engineer` where a title applies.

2. **DONE (`7b9fb02`) — Ship the Apache-2.0 text in every npm tarball.**
   - Problem: fresh `npm pack --dry-run --json --ignore-scripts` inventories contain no license file in core, plugins, or MCP. `scripts/verify-packages.mjs:132-138` requires package metadata, README, and exports, but not `LICENSE`.
   - Change: add package-root copies at `packages/core/LICENSE`, `packages/plugins/LICENSE`, and `packages/mcp/LICENSE`; add `LICENSE` to the required-file list at `scripts/verify-packages.mjs:132-138`.
   - Acceptance: `pnpm packages:check` passes and each package's dry-run pack JSON contains `README.md`, `LICENSE`, and `package.json`; each packaged `LICENSE` is byte-identical to root `LICENSE`.

3. **DONE (`08012c7`) — Untrack internal build and review artifacts without deleting local copies.**
   - Problem: `.openai/hosting.json`, `docs/architecture/EXTERNAL_REVIEW_BRIEF.md`, `docs/architecture/RALPH_PROMPT.md`, `scripts/ralph.sh`, `scripts/verify-review-regressions.py`, and both files under `nyx-design/` are tracked. `.gitignore:1-20` does not exclude them.
   - Change: add exact ignore entries to `.gitignore`; run `git rm --cached` for the four files, `.openai/hosting.json`, and `nyx-design/`. Do not delete local files.
   - Acceptance: `git ls-files` returns none of those paths; every path still exists locally; a clean checkout does not contain them.

4. **DONE (`f04055b`) — Complete the repository rename from `nyx-stealth` to `nyx-ui`.**
   - Problem: the GitHub remote and 21 tracked lines still expose the old name.
   - Change: replace old-name text and URLs at `apps/docs/admin/index.html:6,10`; `apps/docs/src/admin/README.md:1`; `apps/docs/src/admin/app.ts:75,148`; `apps/docs/src/admin/data.ts:36`; `apps/docs/src/catalog/guides.ts:87`; `apps/docs/src/main.ts:457`; `docs/architecture/FRAMEWORK_RESEARCH.md:88`; `docs/architecture/PUBLISHING_PLAN_REVIEW.md:29`; `docs/architecture/PUBLISHING_RESEARCH.md:42`; `packages/core/package.json:8,9,12`; `packages/plugins/package.json:8,9,12`; `packages/mcp/package.json:8,9,12`; and `tests/browser/docs.spec.ts:186`. Change origin to `https://github.com/Pythoholic/nyx-ui.git` after the GitHub rename.
   - Acceptance: `git grep -ni stealth -- ':!docs/PUBLIC_RELEASE.md'` returns nothing; `git remote get-url origin` is `https://github.com/Pythoholic/nyx-ui.git`; every repository, homepage, bugs, source, skill-install, title, footer, test, and architecture reference resolves to `Pythoholic/nyx-ui` or `Nyx UI` as appropriate.
   - Owner action outside repo: rename the GitHub repository to `nyx-ui`, confirm redirects, then update local and automation remotes.

5. **REPOSITORY DONE (`d39c234` and this Phase 5 commit); OWNER SETUP PENDING — Configure the registered `@nyx-raul` npm scope.**
   - Status: the owner has registered `@nyx-raul`; no unauthenticated registry lookup is treated as proof of account or scope control.
   - Repository change: all public package identities use `@nyx-raul`, local publishing is disabled, and the protected workflow is prepared for per-package Trusted Publishing.
   - Owner action outside repo: run `npm login`; enable account-level 2FA; retain and test at least one recovery path; manually publish each brand-new package once with 2FA; then create a Trusted Publisher binding for each package targeting `Pythoholic/nyx-ui`, `release.yml`, and environment `release`.
   - Acceptance: the authenticated owner verifies scope rights, recovery readiness, and all three per-package Trusted Publisher bindings. Do not use a disposable publish or an unauthenticated `npm view` as a substitute.

6. **DONE (this Phase 5 commit) — Set the complete release surface to `0.2.0-beta.1`.**
   - Problem: publishable manifests are `0.1.0` at `packages/core/package.json:3`, `packages/plugins/package.json:3`, and `packages/mcp/package.json:3`; product/version surfaces are stale at `package.json:3`, `apps/docs/package.json:3`, `registry/examples/render-workspace/package.json:3`, `registry/registry.json:3`, `apps/docs/src/catalog/index.ts:83,88`, `apps/docs/src/main.ts:143,457`, and `registry/components/dialog.html:86`. Pending patch plans at `.changeset/calm-moons-pack.md:2-3` and `.changeset/large-radials-balance.md:2` would not produce the settled target.
   - Change: reconcile the pending changesets and update every product-facing version above to `0.2.0-beta.1`; keep unrelated dependency and test-client versions unchanged.
   - Acceptance: all three packed manifests report `0.2.0-beta.1`; docs, registry, and example report the same version; the version plan cannot increment the release to a different number.

7. **DONE (`f04055b`) — Make installation guidance consistent with a beta dist-tag.**
   - Problem: `README.md:21` says public names are undecided and `README.md:124` says publishing is deferred, while `apps/docs/src/catalog/guides.ts:10,54,79,86,90,102` presents unqualified public installs. Unqualified installs do not express the settled `beta` channel.
   - Change: replace the README's provisional text with beta install/run commands; use `@beta` in core, plugins, and MCP consumer commands and generated client configuration until a stable release exists. Keep repository-development commands clearly separate.
   - Acceptance: README, docs guides, and all package READMEs use the same copy-pasteable beta commands; a clean temporary project installs `@nyx-raul/core@beta`, `@nyx-raul/plugins@beta`, and `@nyx-raul/mcp@beta` after release.

8. **DONE (`f04055b`) — Resolve the README development-port contradiction.**
   - Problem: `README.md:30,74` correctly says 5174, but `README.md:95-107` says 5173 and claims the port is unpinned. `package.json:11` and `playwright.config.ts:3,28` pin strict port 5174.
   - Change: rewrite `README.md:95-107` to state that `pnpm dev` uses `http://127.0.0.1:5174/` with strict-port behavior; remove the incorrect passthrough example.
   - Acceptance: `rg -n "5173|not pinned|next free port" README.md` returns nothing; `pnpm dev` serves 5174 and fails if 5174 is occupied.

9. **DONE (`f04055b`) — Correct the catalog count.**
   - Problem: `README.md:15` claims 86 component routes; `registry/registry.json:5` contains 68 registry items.
   - Change: describe the catalog as 68 registry entries, using terminology that does not conflate registry entries with rendered routes.
   - Acceptance: a script reading `registry/registry.json` returns 68 and the README states 68; no tracked public copy outside this checklist claims 86 components.

10. **DONE (`b0e5bcf`) — Add the missing governance surface.**
    - Problem: root `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, and `CHANGELOG.md` do not exist; neither `.github/ISSUE_TEMPLATE/` nor `.github/PULL_REQUEST_TEMPLATE.md` exists. `README.md:86-124` is not a substitute for complete contribution and release policy.
    - Change: add the four root files, issue templates for bug reports and feature requests plus template configuration, and a pull-request template. Link governance files from README. State supported beta versions and private vulnerability-reporting instructions in `SECURITY.md`.
    - Acceptance: all files exist; internal links pass a Markdown link check; issue/PR templates render correctly on GitHub; security reporting does not instruct reporters to open public vulnerability issues.

11. **DONE (this Phase 5 commit) — Enable generated changelogs.**
    - Problem: `.changeset/config.json:3` sets `"changelog": false`; package versioning cannot generate release notes. `.changeset/config.json:5-6` also leaves related package version policy implicit.
    - Change: set the changelog generator to `@changesets/cli/changelog`; record whether core, plugins, and MCP are fixed together for the beta line, and align the pending release plan. Maintain the root `CHANGELOG.md` as the release index if package changelogs remain package-local.
    - Acceptance: run the version command on a temporary branch/worktree; it produces changelog entries for every bumped package at exactly `0.2.0-beta.1`, consumes the intended changesets, and leaves no unexplained version divergence.

12. **REPOSITORY DONE (this Phase 5 commit); OWNER SETUP PENDING — Add a protected beta release workflow.**
    - Problem: `.github/workflows/ci.yml:1-60` is the only workflow. It verifies code but has no release trigger, protected environment, OIDC permission, provenance path, or `beta` tag enforcement. `package.json:23` is an unrestricted local publish command.
    - Change: add a dedicated `.github/workflows/release.yml`; pin a Trusted-Publishing-compatible Node/npm toolchain; run install, tests, typecheck, build, and package inspection before authority is granted; isolate `id-token: write` to the publish job; publish all three tarballs with `--tag beta`; guard or replace the local release script. Document the one-time first-package bootstrap and immediate Trusted Publisher setup for each package.
    - Acceptance: a non-publishing workflow test reaches the publish boundary with exact reviewed tarballs; only the protected release environment can mint publish authority; package/version/tag mismatches fail; post-release `npm view @nyx-raul/core dist-tags.beta`, `npm view @nyx-raul/plugins dist-tags.beta`, and `npm view @nyx-raul/mcp dist-tags.beta` each return `0.2.0-beta.1`; provenance links to the renamed public repository and release commit.
    - Owner action outside repo: create the protected GitHub release environment, required reviewers, branch protection, and per-package npm Trusted Publisher bindings; execute and audit the first-package bootstrap.

13. **DONE (`f04055b`) — Declare core's Tailwind CSS compatibility.**
    - Problem: `packages/core/package.json:20-24` has no Tailwind peer range even though `packages/core/README.md:9` and the public installation guide require Tailwind CSS 4 behavior.
    - Change: add `tailwindcss: ">=4 <5"` under `peerDependencies`; if direct prebuilt-CSS consumption must remain warning-free, mark that peer optional and explain both modes in the package README.
    - Acceptance: `npm pkg get peerDependencies.tailwindcss --prefix packages/core` returns `>=4 <5`; package checks install both with Tailwind 4 and in the documented direct-CSS mode without an unexplained peer warning.

14. **DONE (`f04055b`) — Replace sparse package READMEs with package-complete guidance.**
    - Problem: `packages/core/README.md:1-9`, `packages/plugins/README.md:1-11`, and `packages/mcp/README.md:1-18` omit beta-qualified installation, compatibility, complete public entry points, lifecycle/cleanup obligations, support/security links, and repository/license attribution appropriate to their package.
    - Change: expand each README only for its package: core covers Tailwind/direct CSS and theming; plugins covers per-component imports, initialization, events, and destroy; MCP covers beta execution, client configuration, read-only tools, and Node support. Link the renamed repository and governance files.
    - Acceptance: each packed README stands alone when viewed on npm; every command is beta-qualified and smoke-tested from an isolated install; no README promises an export or runtime that its tarball lacks.

15. **DONE (`f04055b`) — Remove visible admin-demo image placeholders.**
    - Problem: `apps/docs/src/admin/data.ts:40-44` intentionally supplies empty image sources; `apps/docs/src/admin/app.ts:57-60,115,133` renders visible `IMAGE PLACEHOLDER` blocks in the campaign and product views. `apps/docs/src/admin/README.md:11-21,45` documents the unfinished state.
    - Change: add release-safe local assets under `registry/assets/admin/`, populate campaign and product slots with descriptive alt text, remove placeholder-only UI/copy, and record asset licensing in `NOTICE` when required. Initials may remain the deliberate avatar fallback.
    - Acceptance: `rg -n "IMAGE PLACEHOLDER|src: ''" apps/docs/src/admin` returns nothing for release image slots; `/admin/#overview` and `/admin/#products` contain no placeholder block or broken image at desktop and mobile widths; admin browser tests pass.

16. **DONE (`f04055b`) — Remove broken references to unshipped review evidence.**
    - Problem: `docs/architecture/BUILD_LOOP.md:23,28,108` cites `review/CI_CHART_FOLLOWUP.md`, `review/RELEASE_REMEDIATION.md`, and `review/text-measure/REPORT.md`; `.gitignore:15-17` excludes `review/`, so these references break in a public clone.
    - Change: remove the citations or move the durable conclusions into tracked public documentation. Do not re-track the raw review directory.
    - Acceptance: `git grep -n -E 'review/(CI_CHART_FOLLOWUP|RELEASE_REMEDIATION|text-measure)' -- ':!docs/PUBLIC_RELEASE.md'` returns nothing; a Markdown link check on a clean checkout reports no missing local targets.

## 3. EXECUTION ORDER

Each phase is one independently committable unit. Do not start publishing before all prior phases pass.

### Phase 1 - Attribution and licensing — COMPLETE (`7b9fb02`)

- Complete blockers 1-2.
- Commit: `release: finalize attribution and package licenses`.
- Verify: attribution searches, license byte comparison, three dry-run tarball inventories, `pnpm packages:check`.

### Phase 2 - Internal-artifact cleanup — COMPLETE (`08012c7`)

- Complete blocker 3.
- Commit: `chore: untrack internal release artifacts`.
- Verify: tracked-path check, local-preservation check, and clean-checkout inventory.

### Phase 3 - Public identity and release-facing content — COMPLETE (`f04055b`, `d39c234`)

- Complete blockers 4, 7-9, and 13-16.
- Commit: `release: rename repository identity and finish public surfaces`.
- Verify: zero tracked `stealth` matches outside this checklist, correct origin, public-link check, 68-entry count, 5174 smoke test, isolated package README commands, admin browser tests, and no broken `review/` targets.
- Owner action outside repo: rename the GitHub repository and confirm its public visibility and redirects.

### Phase 4 - Governance — COMPLETE (`b0e5bcf`)

- Complete blocker 10.
- Commit: `docs: add public project governance`.
- Verify: Markdown links, GitHub template rendering, and private security-reporting path.
- Owner action outside repo: enable `main` branch protection, required CI checks, review requirements, and the protected release environment.

### Phase 5 - Version and release plumbing — REPOSITORY COMPLETE (this commit); OWNER ACTIONS PENDING

- Complete blockers 5, 6, 11, and 12.
- Commit: `release: prepare 0.2.0-beta.1 publishing`.
- Verify: temporary version rehearsal, full clean-checkout gates, exact tarball inspection, non-publishing workflow rehearsal, then npm `beta` dist-tag and provenance checks.
- Owner action outside repo: claim/configure `@nyx-raul`, establish maintainers and recovery, configure npm Trusted Publishers, approve the bootstrap, and authorize the protected release.

## 4. NICE-TO-HAVES

Deferred and explicitly out of scope for this beta:

- Eliminate the docs bundle-size warning through route-level code splitting.
- Add CDN bundles or framework-specific wrappers.
- Automate README catalog-count updates from the registry.
- Add package-size budgets and API-extractor-style reports beyond exact tarball inventories.
- Commission independent accessibility and security assessments; do not imply certification before they occur.

## Definition of done for beta

- All 16 blockers are closed and all five phases are merged in order.
- GitHub is public at `Pythoholic/nyx-ui`; `@nyx-raul` control, branch protection, release environment, maintainers, recovery, and publisher trust are verified.
- A clean checkout passes `pnpm test`, `pnpm typecheck`, `pnpm build`, and `pnpm packages:check`.
- The three reviewed tarballs contain correct attribution, Apache-2.0 text, standalone READMEs, renamed URLs, and only intended files; all report `0.2.0-beta.1`.
- `@nyx-raul/core`, `@nyx-raul/plugins`, and `@nyx-raul/mcp` install from dist-tag `beta`; `dist-tags.beta` resolves to `0.2.0-beta.1`; the isolated consumer example builds and runs.
- Release notes and changelogs exist, public links resolve, no stale old-name reference outside this checklist or tracked internal artifact remains, and the release record identifies the exact commit and provenance/bootstrap evidence.
