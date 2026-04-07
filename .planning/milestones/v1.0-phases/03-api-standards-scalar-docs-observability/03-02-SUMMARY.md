---
phase: 03-api-standards-scalar-docs-observability
plan: 02
subsystem: bootstrap
tags: [otel, pino, scalar, throttler, versioning, observability]
dependency_graph:
  requires: ["03-01"]
  provides: ["running-app-with-api-standards", "otel-instrumentation", "scalar-docs"]
  affects: ["src/main.ts", "src/app.module.ts", "src/instrumentation.ts"]
tech_stack:
  added: ["nestjs-pino", "@opentelemetry/sdk-node", "@scalar/nestjs-api-reference", "express-basic-auth", "@nestjs/throttler"]
  patterns: ["conditional-otel", "uri-versioning", "pino-structured-logging", "basicauth-docs"]
key_files:
  created:
    - src/instrumentation.ts
    - src/instrumentation.spec.ts
  modified:
    - src/main.ts
    - src/app.module.ts
    - .env.example
decisions:
  - "Use NestExpressApplication type to access app.set('trust proxy') — INestApplication does not expose Express-specific methods"
  - "OTel SDK uses dynamic require() inside conditional block to avoid loading heavy deps when disabled"
  - "Scalar apiReference mounted after basicAuth middleware so all /docs routes are protected"
metrics:
  duration: "25min"
  completed_date: "2026-03-28"
  tasks_completed: 2
  files_modified: 5
---

# Phase 03 Plan 02: Bootstrap Wiring Summary

**One-liner:** Full NestJS bootstrap wired with OTel/Prometheus (conditional), Pino structured logging with correlation IDs, URI versioning at /api/v1/, Scalar docs at /docs with basicAuth, ThrottlerModule, and CorrelationIdMiddleware.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create instrumentation.ts and rewrite main.ts + AppModule | 04eecf3 | src/instrumentation.ts, src/main.ts, src/app.module.ts, .env.example |
| 2 | Unit test for instrumentation.ts feature flag | 8bb8527 | src/instrumentation.spec.ts |

---

## What Was Built

### `src/instrumentation.ts`
- Conditionally bootstraps OTel NodeSDK when `OTEL_ENABLED=true`
- Uses `resourceFromAttributes` (v2 API, not deprecated `new Resource()`)
- `PrometheusExporter` on configurable port (default 9464)
- `OTLPTraceExporter` when `OTEL_EXPORTER_OTLP_ENDPOINT` set, else `ConsoleSpanExporter` as dev fallback
- Auto-instrumentations with DNS/FS disabled
- Exports `null` when disabled — safe `sdk?.start()` call in main.ts
- Try/catch wraps entire init to prevent startup failure

### `src/main.ts`
- First import is `instrumentation.ts` (OTel before NestFactory — required for correct instrumentation)
- `NestExpressApplication` type for `app.set('trust proxy', 1)`
- `bufferLogs: true` + Pino logger via `app.useLogger(app.get(Logger))`
- URI versioning at `/api/v1/` with health routes excluded from global prefix
- Global `ValidationPipe` with `validationOptions` (AppException exceptionFactory)
- Global `HttpExceptionFilter`, `TransformInterceptor`, `TimeoutInterceptor`
- Scalar docs at `/docs` protected by `express-basic-auth`
- Raw OpenAPI spec at `/docs/json`

### `src/app.module.ts`
- `LoggerModule.forRoot` with pino-pretty in dev, structured JSON in prod
- `genReqId` reads `x-correlation-id` header for log correlation
- `ThrottlerModule.forRoot` with configurable TTL/limit from env
- `ThrottlerGuard` as global `APP_GUARD`
- `CorrelationIdMiddleware` applied to all routes via `NestModule.configure`

### `.env.example`
- All Phase 3 env vars documented: `API_VERSION`, `APP_NAME`, `APP_DESCRIPTION`, `REQUEST_TIMEOUT`, `THROTTLE_TTL`, `THROTTLE_LIMIT`, `DOCS_USER`, `DOCS_PASS`, `OTEL_ENABLED`, `OTEL_SERVICE_NAME`, `OTEL_PROMETHEUS_PORT`, `OTEL_EXPORTER_OTLP_ENDPOINT`

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `app.set()` TypeScript error on `INestApplication`**
- **Found during:** Task 1 build verification
- **Issue:** `INestApplication` type does not expose Express-specific `.set()` method; TypeScript error TS2339
- **Fix:** Changed `NestFactory.create(AppModule)` to `NestFactory.create<NestExpressApplication>(AppModule, ...)` to get correct typed application
- **Files modified:** src/main.ts
- **Commit:** 04eecf3 (fix applied inline before commit)

---

## Known Stubs

None — all wiring is real. OTel SDK is conditional but properly implemented.

---

## Self-Check: PASSED

- `src/instrumentation.ts` — EXISTS
- `src/instrumentation.spec.ts` — EXISTS
- `src/main.ts` — EXISTS (rewritten)
- `src/app.module.ts` — EXISTS (updated)
- `.env.example` — EXISTS (updated)
- Commit 04eecf3 — EXISTS
- Commit 8bb8527 — EXISTS
- `pnpm build` — PASSED (exit 0)
- `pnpm jest --testPathPatterns=instrumentation` — 2/2 PASSED
