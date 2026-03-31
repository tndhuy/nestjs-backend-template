---
phase: 1
slug: template-scaffold
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
audited: 2026-03-27
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x |
| **Config file** | `package.json` jest section |
| **Quick run command** | `pnpm test --forceExit` |
| **Full suite command** | `pnpm test --forceExit && pnpm build` |
| **Estimated runtime** | ~110 seconds (ts-jest compilation) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --forceExit`
- **After every plan wave:** Run `pnpm test --forceExit && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 110 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | REQ-001 | build | `pnpm build` | N/A | green |
| 01-01-02 | 01 | 1 | REQ-001 | structural | `ls src/shared/base/` | N/A | green |
| 01-02-01 | 02 | 2 | REQ-001 | unit | `npx jest --forceExit --testPathPatterns="item.entity.spec"` | src/example/domain/item.entity.spec.ts (6 tests) | green |
| 01-02-01b | 02 | 2 | REQ-001 | unit | `npx jest --forceExit --testPathPatterns="item-name.value-object.spec"` | src/example/domain/item-name.value-object.spec.ts (8 tests) | green |
| 01-02-02 | 02 | 2 | REQ-001 | unit | `npx jest --forceExit --testPathPatterns="create-item.handler.spec"` | src/example/application/commands/create-item.handler.spec.ts (3 tests) | green |
| 01-02-02b | 02 | 2 | REQ-001 | unit | `npx jest --forceExit --testPathPatterns="get-item.handler.spec"` | src/example/application/queries/get-item.handler.spec.ts (3 tests) | green |
| 01-03-01 | 03 | 3 | REQ-001 | build | `pnpm build` | N/A | green |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [x] `nestjs-backend-template/` directory initialized with NestJS CLI
- [x] `pnpm-lock.yaml` generated via `pnpm install`
- [x] Jest config present in `package.json`

*Wave 0 creates the project structure that all subsequent tasks depend on.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ExampleModule DDD layers visually correct | REQ-001 | Directory structure review | Run `find src/example -type f` and verify application/, domain/, infrastructure/, presenter/ exist |
| CQRS handlers registered | REQ-001 | Runtime wiring | Run `pnpm start:dev` and verify app boots without errors |
| .env.example complete | REQ-001 | Content review | Open `.env.example`, verify all required vars documented |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved

---

## Validation Audit 2026-03-27

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved | 4 |
| Escalated | 0 |

**Tests added:** item.entity.spec.ts (6), item-name.value-object.spec.ts (8), create-item.handler.spec.ts (3), get-item.handler.spec.ts (3) — total 20 tests.
