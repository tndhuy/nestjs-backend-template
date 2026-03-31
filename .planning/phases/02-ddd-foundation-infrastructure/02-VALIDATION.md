---
phase: 2
slug: ddd-foundation-infrastructure
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
audited: 2026-03-27
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x |
| **Config file** | `package.json` jest section |
| **Quick run command** | `pnpm test --forceExit --testPathPatterns=shared` |
| **Full suite command** | `pnpm test --forceExit` |
| **Estimated runtime** | ~110 seconds (ts-jest compilation) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --forceExit --testPathPatterns=shared`
- **After every plan wave:** Run `pnpm test --forceExit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 110 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | REQ-002 | unit | `npx jest --forceExit --testPathPatterns="entity.spec"` | src/shared/base/entity.spec.ts (5 tests) | green |
| 2-01-02 | 01 | 1 | REQ-002 | unit | `npx jest --forceExit --testPathPatterns="value-object.spec"` | src/shared/base/value-object.spec.ts (5 tests, incl. immutability) | green |
| 2-01-03 | 01 | 1 | REQ-002 | unit | `npx jest --forceExit --testPathPatterns="aggregate-root.spec"` | src/shared/base/aggregate-root.spec.ts | green |
| 2-01-04 | 01 | 1 | REQ-002 | unit | `npx jest --forceExit --testPathPatterns="id.valueobject.spec"` | src/shared/valueobjects/id.valueobject.spec.ts | green |
| 2-01-02a | 01 | 1 | REQ-002 | unit | `npx jest --forceExit --testPathPatterns="string.valueobject.spec"` | src/shared/valueobjects/string.valueobject.spec.ts (6 tests) | green |
| 2-01-02b | 01 | 1 | REQ-002 | unit | `npx jest --forceExit --testPathPatterns="number.valueobject.spec"` | src/shared/valueobjects/number.valueobject.spec.ts (8 tests) | green |
| 2-01-02c | 01 | 1 | REQ-002 | unit | `npx jest --forceExit --testPathPatterns="date.valueobject.spec"` | src/shared/valueobjects/date.valueobject.spec.ts (6 tests) | green |
| 2-02-01a | 02 | 2 | REQ-003 | unit | `npx jest --forceExit --testPathPatterns="environment.validation.spec"` | src/infrastructure/config/environment.validation.spec.ts (10 tests) | green |
| 2-02-01b | 02 | 2 | REQ-003 | unit | `npx jest --forceExit --testPathPatterns="redis.service.spec"` | src/infrastructure/cache/redis.service.spec.ts (12 tests) | green |
| 2-02-01 | 02 | 2 | REQ-003 | smoke | `curl -s localhost:3000/health` | N/A (manual) | manual |

*Status: pending · green · red · flaky · manual*

---

## Wave 0 Requirements

- [x] `src/shared/base/entity.spec.ts` — Entity equality (same id = equal, different id = not equal) for REQ-002
- [x] `src/shared/base/value-object.spec.ts` — ValueObject structural equality + immutability for REQ-002
- [x] `src/shared/base/aggregate-root.spec.ts` — domain event dispatch for REQ-002
- [x] `src/shared/valueobjects/id.valueobject.spec.ts` — IdValueObject rejects empty string for REQ-002

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/health` returns 200 with DB + Redis status | REQ-003 | Requires running Docker containers (Postgres + Redis) | `docker compose up -d && curl -s localhost:3000/health` — expect `{"status":"ok"}` |
| `/health/ready` checks DB + Redis liveness | REQ-003 | Requires live connections | `curl -s localhost:3000/health/ready` — expect 200 with db+redis indicators |
| `/health/live` returns process alive | REQ-003 | Requires running server | `curl -s localhost:3000/health/live` — expect 200 |
| App fails fast on missing DATABASE_URL | REQ-003 | Requires environment manipulation | Unset DATABASE_URL, run `pnpm start` — expect startup error, not silent warning |

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
| Gaps found | 5 |
| Resolved | 5 |
| Escalated | 0 |

**Tests added/verified:** string.valueobject.spec.ts (6), number.valueobject.spec.ts (8), date.valueobject.spec.ts (6), environment.validation.spec.ts (10), redis.service.spec.ts (12) — total 42 tests. Value-object immutability gap was already COVERED (lines 32-38 of value-object.spec.ts).
