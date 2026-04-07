---
phase: 05-cli-package
plan: "03"
subsystem: cli-package
tags: [cli, publishing, github-packages, smoke-test, ci-cd]
dependency_graph:
  requires: ["05-01", "05-02"]
  provides: [github-packages-publish-pipeline, cli-smoke-test, cli-readme]
  affects: [packages/create-app]
tech_stack:
  added: []
  patterns: [github-packages-publishing, npm-workspace-publish, tag-triggered-ci]
key_files:
  created:
    - .github/workflows/publish-cli.yml
    - packages/create-app/.npmrc
    - packages/create-app/README.md
  modified:
    - packages/create-app/src/__tests__/cli.smoke.ts
    - .gitignore
decisions:
  - "Tag-triggered publish (create-app@*) over branch-triggered — prevents accidental publishes from every push"
  - "Smoke tests exercise scaffold() directly (not CLI process) — avoids need for stdin mocking of interactive prompts"
  - "No literal tokens in .npmrc — uses ${NODE_AUTH_TOKEN} env var placeholder only"
  - ".gitignore blocks .npmrc globally with negation for packages/create-app/.npmrc (safe to commit, no literal token)"
metrics:
  duration: 15min
  completed: "2026-04-06"
  tasks_completed: 2
  tasks_total: 3
  files_created: 3
  files_modified: 2
---

# Phase 05 Plan 03: Publishing Setup + Smoke Test Summary

**One-liner:** GitHub Packages CI/CD pipeline (tag-triggered publish workflow + .npmrc) with end-to-end smoke tests proving both DB paths scaffold correctly.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | GitHub Packages publishing setup + CI workflow | 212eb5d | `.github/workflows/publish-cli.yml`, `packages/create-app/.npmrc`, `.gitignore` |
| 2 | End-to-end smoke test + CLI README | 306eb05 | `packages/create-app/src/__tests__/cli.smoke.ts`, `packages/create-app/README.md` |

## Task 3 — Checkpoint: Human Verification (Pending)

**Status:** Awaiting human verification — not executed by automation.

**What was built (Tasks 1 and 2):**
- Complete CLI package: interactive prompt flow, scaffold engine with DB selection and module toggles, Kafka codegen, GitHub Packages publishing workflow, and comprehensive tests.

**Verification steps for the human reviewer:**

1. Build the CLI:
   ```
   npm run build --workspace=packages/create-app
   ```

2. Run all tests:
   ```
   npm test --workspace=packages/create-app
   ```

3. Test the CLI manually:
   ```
   node packages/create-app/dist/cli.js
   ```
   Walk through the prompts (service name, database, modules).

4. Verify the scaffolded output directory has:
   - Correct service name in `package.json`
   - No `nestjs-backend-template` strings anywhere
   - Selected modules present, deselected modules absent

5. Check `.github/workflows/publish-cli.yml` looks correct.

6. Check `packages/create-app/README.md` is clear and accurate.

**Resume signal:** Type "approved" or describe issues.

---

## What Was Built

### Task 1: GitHub Packages Publishing Setup

**`packages/create-app/.npmrc`** — Registry configuration for `@team` scope:
```
@team:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

No literal tokens — `${NODE_AUTH_TOKEN}` is resolved at runtime via:
- GitHub Actions: `secrets.GITHUB_TOKEN` (automatic, scoped to repo)
- Local dev: team member sets in shell environment

**`.github/workflows/publish-cli.yml`** — CI/CD pipeline triggered on `create-app@*` tag push:
- Permissions: `packages: write` (required for GitHub Packages)
- Steps: checkout → setup node → install → test → build → pack verify → publish
- Tests run before publish — broken CLI cannot be published

**`.gitignore` update** — Blocks accidental `.npmrc` commits globally, with negation pattern to allow `packages/create-app/.npmrc` (which uses env var placeholder, not literal token).

### Task 2: Smoke Test + README

**`packages/create-app/src/__tests__/cli.smoke.ts`** — Two end-to-end integration tests:

1. **Postgres + all modules** (`redis`, `otel`, `kafka`):
   - Verifies `package.json` name matches service name
   - Verifies `@prisma/client` present in dependencies
   - Verifies no `nestjs-backend-template` in `app.module.ts`
   - Verifies Kafka module generated with correct consumer group ID
   - Verifies `src/modules/example/` directory exists

2. **Mongo + no optional modules**:
   - Verifies `mongoose` present, `@prisma/client` absent
   - Verifies `ioredis` removed
   - Verifies no `@opentelemetry/*` packages
   - Verifies `@nestjs/microservices` not added

Both tests run in isolated temp directories, cleaned up after each run.

**`packages/create-app/README.md`** — Team-facing CLI documentation:
- Usage: `npx @team/create-app@latest my-service`
- What the CLI does (5 steps)
- After scaffolding next steps
- Setup instructions for team members (GitHub token + `.npmrc`)
- Publishing instructions for maintainers (tag + push)
- Development commands

## Test Results

All 35 tests pass:
```
Test Suites: 2 passed, 2 total
Tests:       35 passed, 35 total
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `.github/workflows/publish-cli.yml` exists and contains `npm publish`
- [x] `packages/create-app/.npmrc` exists and contains `npm.pkg.github.com`
- [x] `packages/create-app/README.md` exists (43 lines)
- [x] `packages/create-app/src/__tests__/cli.smoke.ts` exists with real tests (74 lines)
- [x] Commit 212eb5d exists (Task 1)
- [x] Commit 306eb05 exists (Task 2)
- [x] All 35 tests pass

## Self-Check: PASSED
