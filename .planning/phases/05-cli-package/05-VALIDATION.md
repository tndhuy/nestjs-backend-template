---
phase: 5
slug: cli-package
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (already configured at root) |
| **Config file** | `packages/create-app/jest.config.js` (new — Wave 0 installs) |
| **Quick run command** | `npm test --workspace=packages/create-app` |
| **Full suite command** | `npm test --workspace=packages/create-app -- --coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test --workspace=packages/create-app`
- **After every plan wave:** Run `npm test --workspace=packages/create-app -- --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | REQ-010 | — | N/A | setup | Wave 0 installs jest.config.js + test stubs | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | REQ-010 | T-05-01 | Service name validated: kebab-case only, no path traversal | unit | `npm test --workspace=packages/create-app` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | REQ-010 | — | Placeholder replacement: no hardcoded template name in output | unit | `npm test --workspace=packages/create-app` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 2 | REQ-010 | — | Generated package.json name matches service name input | unit | `npm test --workspace=packages/create-app` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | REQ-010 | — | MongoDB path: generated package.json has mongoose, no prisma | unit | `npm test --workspace=packages/create-app` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | REQ-010 | — | Kafka toggle: generated package.json has @nestjs/microservices | unit | `npm test --workspace=packages/create-app` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 3 | REQ-010 | — | End-to-end: npx completes without errors in temp dir | smoke | `node dist/cli.js test-service --no-interactive` in temp dir | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/create-app/jest.config.js` — Jest config for CLI package workspace
- [ ] `packages/create-app/src/__tests__/scaffold.test.ts` — unit tests: placeholder replacement, copy logic, module toggle assertions
- [ ] `packages/create-app/src/__tests__/cli.smoke.ts` — smoke test: runs CLI in temp dir, asserts output structure

*All three files are Wave 0 gaps — must be created before implementation tasks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Generated project passes `npm install && npm run build` | REQ-010 | Requires real npm install in scaffolded dir | Scaffold `test-service`, run `cd test-service && npm install && npm run build`, verify exit 0 |
| `npx @team/create-app` works from GitHub Packages | REQ-010 | Requires published package + auth | After publishing, run `npx @team/create-app smoke-test` with `.npmrc` configured |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
