---
phase: 3
slug: api-standards-scalar-docs-observability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test:cov` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test:cov`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | REQ-004 | e2e | `npm run test:e2e` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | REQ-004 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | REQ-004 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | REQ-005 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | REQ-005 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 3 | REQ-006 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 3 | REQ-006 | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/common/interceptors/transform.interceptor.spec.ts` — stubs for REQ-004 response envelope
- [ ] `src/common/filters/http-exception.filter.spec.ts` — stubs for REQ-004 error handling
- [ ] `src/common/middleware/correlation-id.middleware.spec.ts` — stubs for REQ-006 correlation IDs
- [ ] `test/app.e2e-spec.ts` — update for versioned routes at `/api/v1/`

*Existing jest infrastructure covers the framework — only test stubs need to be added.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scalar docs UI accessible at `/docs` with basic auth | REQ-005 | Browser UI verification | Navigate to `http://localhost:3000/docs`, confirm basic auth prompt, enter credentials, verify Swagger/Scalar UI loads with all example endpoints decorated |
| Prometheus metrics endpoint returns metrics | REQ-006 | Requires running process + HTTP check | Start app, `curl http://localhost:9090/metrics`, verify `process_cpu_user_seconds_total` and NestJS HTTP metrics present |
| Pino log output is JSON-structured with correlationId | REQ-006 | Runtime log inspection | Make HTTP request, inspect stdout for JSON with `correlationId` field matching `X-Correlation-Id` response header |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
