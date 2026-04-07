---
phase: 05-cli-package
plan: 01
subsystem: cli
tags: [npm-cli, tsup, clack-prompts, scaffold, monorepo, workspace, templates, postgres, mongodb]

# Dependency graph
requires:
  - phase: 04-agent-configs-documentation
    provides: complete NestJS DDD template source with all modules ready for bundling
provides:
  - npm workspace setup at packages/create-app/ as @team/create-app CLI package
  - interactive scaffold CLI using @clack/prompts (text, select, multiselect, confirm, spinner)
  - scaffold engine with recursive copy + placeholder replacement + filename rename
  - validateServiceName with path traversal protection
  - two complete template snapshots bundled under packages/create-app/templates/{postgres,mongo}/
  - sync-templates.sh script for future re-syncs
affects:
  - 05-02 (module toggle implementation builds on scaffold.ts removeModule stub)
  - 05-03 (smoke test + publish workflow uses these same CLI and template files)

# Tech tracking
tech-stack:
  added:
    - "@clack/prompts ^1.2.0 — interactive CLI prompts"
    - "tsup ^8.5.1 — TypeScript CLI bundler (CJS output)"
    - "execa ^9.6.1 — child process execution"
    - "npm workspaces — monorepo package management"
  patterns:
    - "guardCancel<T> helper pattern for @clack/prompts cancel handling"
    - "Bundled template snapshots (not runtime git clone) for deterministic scaffold"
    - "Deepest-first path rename to avoid parent-before-child rename invalidation"
    - "Binary file detection via null byte scan before UTF-8 content replacement"

key-files:
  created:
    - packages/create-app/package.json
    - packages/create-app/tsconfig.json
    - packages/create-app/tsup.config.ts
    - packages/create-app/jest.config.js
    - packages/create-app/src/cli.ts
    - packages/create-app/src/scaffold.ts
    - packages/create-app/src/replacements.ts
    - packages/create-app/src/__tests__/scaffold.test.ts
    - packages/create-app/src/__tests__/cli.smoke.ts
    - packages/create-app/scripts/sync-templates.sh
    - packages/create-app/templates/postgres/ (full snapshot)
    - packages/create-app/templates/mongo/ (full snapshot)
  modified:
    - package.json (added workspaces field)

key-decisions:
  - "npm workspaces (not pnpm) for packages/* — consistent with root repo using npm"
  - "CJS format in tsup (not ESM) — required for reflect-metadata compatibility in generated project"
  - "Bundled template snapshots over runtime git clone — offline-capable, deterministic"
  - "Two full snapshots (postgres + mongo) rather than single base + patch — simpler scaffold logic at the cost of template sync maintenance"
  - "Binary file skip via null byte scan — avoids corrupting non-UTF-8 files during replacement"
  - "removeModule stub exported from scaffold.ts — Plan 02 implements optional module removal"

patterns-established:
  - "guardCancel<T>: wrap every @clack/prompts call to handle Symbol cancellation gracefully"
  - "Deepest-first rename: collect all paths, sort by depth desc, then rename to avoid parent invalidation"
  - "patchPackageJson: post-copy JSON manipulation for service name and conditional deps"

requirements-completed:
  - REQ-010

# Metrics
duration: 35min
completed: 2026-04-06
---

# Phase 5 Plan 01: CLI Package Foundation Summary

**Interactive @clack/prompts CLI scaffold engine with CJS tsup build, path-traversal-safe name validation, recursive template copy + replacement, and two bundled template snapshots (postgres/mongo) derived from actual template source and mongo-compatible branch.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-04-06T (session start)
- **Completed:** 2026-04-06
- **Tasks:** 3
- **Files created:** 175+ (including 166 template snapshot files)

## Accomplishments

- Created `packages/create-app/` as a valid npm workspace package with `@team/create-app` name, `bin`, `publishConfig`, and all required devDependencies (tsup, jest, ts-jest)
- Implemented full interactive CLI flow in `cli.ts` using `@clack/prompts` with `guardCancel<T>` helper ensuring every prompt has cancellation protection
- Built scaffold engine (`scaffold.ts`) with: recursive `fs.cp`, binary-safe content replacement, deepest-first filename rename, and conditional `patchPackageJson` for DB/module swaps
- Bundled two complete template snapshots (postgres from current HEAD, mongo from `mongo-compatible` branch) — both verified to contain valid `package.json` and `src/modules/example/`
- All 15 unit tests pass (validation, toPascalCase, buildReplacements stubs)

## Task Commits

Each task was committed atomically:

1. **Task 1: Monorepo workspace setup + CLI package scaffold** - `3e1ae75` (feat)
2. **Task 2: CLI prompt flow + scaffold engine + replacements** - `495df2b` (feat)
3. **Task 3: Bundle PostgreSQL and MongoDB template snapshots** - `091fa41` (feat)

## Files Created/Modified

- `package.json` — added `"workspaces": ["packages/*"]`
- `packages/create-app/package.json` — CLI package manifest with bin, publishConfig, @clack/prompts, execa deps
- `packages/create-app/tsconfig.json` — ES2022, commonjs, strict
- `packages/create-app/tsup.config.ts` — CJS format, entry src/cli.ts
- `packages/create-app/jest.config.js` — ts-jest preset, testMatch for .test.ts and .smoke.ts
- `packages/create-app/src/cli.ts` — @clack/prompts flow: intro, text, select, multiselect, confirm, spinner, outro
- `packages/create-app/src/scaffold.ts` — scaffold(), removeModule() stub, patchPackageJson(), binary file detection
- `packages/create-app/src/replacements.ts` — toPascalCase(), buildReplacements(), validateServiceName() with path traversal guard
- `packages/create-app/src/__tests__/scaffold.test.ts` — unit tests for replacements + TODO stubs for scaffold
- `packages/create-app/src/__tests__/cli.smoke.ts` — smoke test stub (Plan 03 implementation)
- `packages/create-app/scripts/sync-templates.sh` — re-sync script for future template updates
- `packages/create-app/templates/postgres/` — full PostgreSQL template snapshot (165 files)
- `packages/create-app/templates/mongo/` — full MongoDB template snapshot (mongodb.module.ts, mongoose schemas, no prisma/)

## Decisions Made

- Used npm workspaces (not pnpm-workspace.yaml) since root `package.json` already uses npm
- CJS format for tsup build — required because the generated project template uses `commonjs` module (reflect-metadata dependency)
- Bundled full template snapshots rather than git-cloning at runtime — avoids network/auth dependency and works offline deterministically
- `removeModule()` stub exported from scaffold.ts, to be implemented in Plan 02

## Deviations from Plan

None - plan executed exactly as written. The `prisma/schema/` subdirectory was not copied to the postgres template since the worktree's prisma directory uses `schema.prisma` at the root level (not the `/schema/` subdirectory from the main repo), which is the correct state for the worktree HEAD.

## Issues Encountered

None significant. The `mongo-compatible` branch was available locally and all 9 MongoDB-specific files were extracted successfully via `git show mongo-compatible:{path}`.

## User Setup Required

None - no external service configuration required for Plan 01.

## Next Phase Readiness

- Plan 02 can now implement `removeModule()` in `scaffold.ts` for optional module removal (Redis, OTel)
- Plan 02 can also implement the Kafka boilerplate generator (code-generated, not template-copied)
- Plan 03 can implement the CLI smoke test in `cli.smoke.ts` and GitHub Actions publish workflow
- Template snapshots are in place and ready for scaffold testing

## Self-Check: PASSED

All created files verified on disk. All task commits verified in git log.

---
*Phase: 05-cli-package*
*Completed: 2026-04-06*
