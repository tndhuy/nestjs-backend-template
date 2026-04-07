# Phase 3: API Standards, Scalar Docs & Observability - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 establishes the API layer conventions for the template:
- **API Standards**: URI versioning at `/api/v1/`, response envelope, offset-based pagination, structured AppException with error codes
- **Scalar Docs**: Scalar UI at `/docs` with basicAuth, OpenAPI spec auto-generated, versioned, example module fully documented
- **Observability**: Pino structured logging with correlation IDs, OpenTelemetry tracing (OTEL_ENABLED=true), Prometheus metrics (METRICS_ENABLED=true)

This phase wires up `main.ts` properly (currently bare) and adds shared infrastructure in `src/shared/` and `src/common/`.

**Explicitly OUT of Phase 3 scope:**
- Agent configs `.claude/` / `.agent/` (Phase 4)
- CLI package (Phase 5)
- Lark logging transport (service-specific, not template concern)
- File rolling / dedicated error.log (teams add per-service)

</domain>

<decisions>
## Implementation Decisions

### Response Envelope
- **D-01:** Global `TransformInterceptor` wraps all responses automatically — controllers return domain objects directly, interceptor adds the envelope. Pattern: `{ success: true, data: <return value>, meta?: PaginationMeta }`.
- **D-02:** Hybrid approach — `@RawResponse()` decorator allows opt-out for endpoints that need custom shapes (e.g., file downloads, streaming).
- **D-03:** `/health`, `/health/ready`, `/health/live` endpoints are EXCLUDED from the envelope via `@RawResponse()` — Terminus's own shape must not be wrapped (k8s probe compatibility).
- **D-04:** Error shape follows REQ-004: `{ success: false, error: { code: string, message: string, statusCode: number, details?: unknown } }`. The `HttpExceptionFilter` produces this shape, NOT flash-pick's `{ statusCode, message, path, timestamp }`.

### AppException & Error Codes
- **D-05:** `AppException extends HttpException` — constructor takes `{ code: string, message: string, statusCode: number, details?: unknown }`.
- **D-06:** Error codes are human-readable strings in SCREAMING_SNAKE_CASE (Stripe/Twilio style): e.g., `ITEM_NOT_FOUND`, `VALIDATION_FAILED`, `UNAUTHORIZED`, `INTERNAL_ERROR`.
- **D-07:** Template ships an `ErrorCodes` const/enum in `src/shared/` with ~4-5 starter codes: `VALIDATION_FAILED`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `INTERNAL_ERROR`. Teams extend this per-domain.
- **D-08:** `HttpExceptionFilter` is updated to handle both `AppException` (structured) and generic `HttpException` (fallback). For generic exceptions the code defaults to the HTTP status name.

### Pagination
- **D-09:** Offset-based pagination as per REQ-004. `PaginationDto` query params: `page?: number` (default 1), `limit?: number` (default 20), `sort?: string`, `order?: 'asc' | 'desc'` (default 'asc').
- **D-10:** `PaginationMeta` response shape: `{ total: number, page: number, limit: number, totalPages: number }`.
- **D-11:** Sort/order fields are generic strings — controllers validate allowed sort fields themselves per-entity. No typed enum per entity in the base template.
- **D-12:** Template does NOT ship cursor-based pagination. Teams that need cursor-based add it themselves (flash-pick-service is the reference).

### Pino Logger & Correlation IDs
- **D-13:** Minimal logger setup — `nestjs-pino` with pino-pretty for dev, JSON to stdout for prod. No file rolling, no dedicated error.log, no Lark transport.
- **D-14:** Dev transport: `pino-pretty` with colorize, SYS timestamp, ignore pid/hostname.
- **D-15:** Prod transport: JSON to stdout (Docker log capture). `level: 'info'`.
- **D-16:** Correlation ID middleware: generates UUID v4 if `X-Correlation-ID` header is missing. Always injects `correlationId` into:
  - Response header (`X-Correlation-ID`)
  - Pino HTTP log context (`req.correlationId`)
- **D-17:** Pino serializers: log `method` + `url` from req, `statusCode` from res. Include `correlationId`, `duration` (ms) in HTTP logs.
- **D-18:** No file transports in template — teams add pino-roll / Lark transport per-service.

### Scalar Docs
- **D-19:** Scalar UI at `/docs`, protected with `express-basic-auth`. Credentials via env vars: `DOCS_USER` (default: `admin`), `DOCS_PASS` (required in production, fallback in dev).
- **D-20:** OpenAPI spec downloadable at `/docs/json` (or `/api-json` — match flash-pick pattern).
- **D-21:** `DocumentBuilder` sets title, description, version from env. Adds `Bearer` auth scheme (`httpBearer`).
- **D-22:** Example module endpoints fully decorated: `@ApiOperation`, `@ApiResponse`, `@ApiTags('example')`, request/response schemas from DTOs.
- **D-23:** Scalar `hiddenClients` config copied from flash-pick (suppresses noisy SDK examples in UI).

### OpenTelemetry + Prometheus
- **D-24:** OTel is opt-in via `OTEL_ENABLED=true` env var. `instrumentation.ts` MUST be the first import in `main.ts` (before NestFactory) — pattern from flash-pick.
- **D-25:** Copy flash-pick's `instrumentation.ts` as the base — NodeSDK, auto-instrumentations, PrometheusExporter, OTLPTraceExporter. Generalize `serviceName` to use `OTEL_SERVICE_NAME` env var (no hardcoded "api-flash-pick").
- **D-26:** Prometheus runs on a SEPARATE port (default `9464` via `OTEL_PROMETHEUS_PORT`) — this matches flash-pick's production setup. REQ-006's mention of `/metrics` refers to that port's root path.
- **D-27:** Feature-flag behavior: when `OTEL_ENABLED=false` (or unset), `instrumentation.ts` exports `null` and all OTel API calls become no-ops automatically.
- **D-28:** OTel tracing spans added to `RedisService` (deferred from Phase 2 per D-17 in Phase 2 context) — `tracer.startActiveSpan` wraps Redis operations.

### Claude's Discretion
- Exact `validationOptions` for the global `ValidationPipe` (follow flash-pick's `shared/validation-options.ts` pattern)
- `TimeoutInterceptor` implementation (copy from flash-pick, configurable via env)
- `RpcExceptionFilter` inclusion (include for completeness — teams using gRPC/microservices will need it)
- Exact pino log level thresholds (debug in dev, info in prod)
- DNS and FS OTel instrumentation disabled (same as flash-pick — too noisy)
- `trust proxy` setting in main.ts (set to 1 for reverse proxy compatibility)

</decisions>

<specifics>
## Specific Ideas

- Response envelope interceptor should NOT wrap responses that are already in the envelope shape — avoid double-wrapping if a controller accidentally returns `{ success, data }`.
- `AppException` usage example in ExampleModule: throw `new AppException({ code: ErrorCodes.NOT_FOUND, message: 'Item not found', statusCode: 404 })` in handlers.
- `main.ts` setup order matters for OTel — `instrumentation.ts` import MUST precede NestFactory (monkey-patches http/net at import time).
- Correlation ID should be logged at the `req` level in pino, not just as a top-level field, so it appears on every HTTP log line.
- Scalar `agent.disabled: true` — suppress the Scalar AI agent feature (same as flash-pick).

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — REQ-004 (API standards, acceptance criteria), REQ-005 (Scalar docs, acceptance criteria), REQ-006 (observability, acceptance criteria)
- `.planning/ROADMAP.md` — Phase 3 deliverables

### Current Template Codebase (base to extend)
- `nestjs-backend-template/src/main.ts` — Current bare bootstrap — this gets replaced
- `nestjs-backend-template/src/app.module.ts` — AppModule — needs new module imports
- `nestjs-backend-template/src/example/presenter/item.controller.ts` — Example controller — add versioning, Swagger decorators
- `nestjs-backend-template/src/infrastructure/health/health.controller.ts` — Health controller — exclude from envelope

### Reference Implementations (read-only)
- `flash-pick-service/src/main.ts` — Full bootstrap reference: Scalar setup, basicAuth, versioning, pipes, filters, OTel init pattern
- `flash-pick-service/src/instrumentation.ts` — OTel SDK bootstrap with PrometheusExporter on separate port
- `flash-pick-service/src/shared/logger/pino.config.ts` — Pino config reference (use minimal subset, not file transports)
- `flash-pick-service/src/common/filters/http-exceptions.filter.ts` — Exception filter reference (adapt for REQ-004 error shape)
- `flash-pick-service/src/common/interceptors/timeout.interceptor.ts` — Timeout interceptor reference
- `flash-pick-service/src/shared/dto/pagination.query.dto.ts` — Pagination DTO reference (cursor-based — adapt to offset-based per D-09)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phases 1 & 2)
- `nestjs-backend-template/src/shared/index.ts` — Will be extended to export new shared DTOs (PaginationDto, ResponseEnvelope, AppException, ErrorCodes)
- `nestjs-backend-template/src/infrastructure/health/health.module.ts` — Already wired; controller needs `@RawResponse()` decorator
- `nestjs-backend-template/src/example/application/dtos/` — Existing DTOs need `@ApiProperty` decorators added

### Established Patterns
- `@Global()` modules for shared infrastructure (Phase 2 pattern — follow for any new shared modules)
- Symbol-based DI tokens (Phase 2 pattern)
- `src/shared/` for cross-cutting concerns (Phase 2 pattern — new shared DTOs go here)

### Integration Points
- `main.ts` — Complete rewrite to add: OTel init, Pino logger, versioning, Scalar docs, filters, pipes, interceptors
- `AppModule` — New imports: `LoggerModule` (nestjs-pino), correlation ID middleware registration
- `ItemController` — Add `@ApiTags`, `@ApiOperation`, `@ApiResponse` decorators; versioning handled globally
- `src/shared/` — New files: `response.dto.ts`, `pagination.dto.ts`, `app-exception.ts`, `error-codes.ts`
- `src/common/` (new directory) — `filters/http-exception.filter.ts`, `interceptors/transform.interceptor.ts`, `interceptors/timeout.interceptor.ts`, `decorators/raw-response.decorator.ts`, `middleware/correlation-id.middleware.ts`

</code_context>

<deferred>
## Deferred Ideas

- Lark logging transport — service-specific, teams add to their own pino config
- File rolling (pino-roll) + dedicated error.log — teams add per-service based on deployment requirements
- Cursor-based pagination — flash-pick-service is the reference implementation; not included in template
- Same-port `/metrics` endpoint — Prometheus runs on separate port (D-26); main app port stays clean

</deferred>

---

*Phase: 03-api-standards-scalar-docs-observability*
*Context gathered: 2026-03-27 via discuss-phase session*
