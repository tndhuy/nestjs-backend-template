# Phase 3: API Standards, Scalar Docs & Observability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 03-api-standards-scalar-docs-observability
**Areas discussed:** Response envelope, AppException & error codes, Pagination style, Pino logger scope

---

## Response Envelope

### How should the response envelope be applied — globally or per-controller?

| Option | Description | Selected |
|--------|-------------|----------|
| Global interceptor | TransformInterceptor wraps every response automatically. Controllers stay clean, return domain objects directly. Standard NestJS pattern. | |
| Manual per controller | Each controller method returns the envelope shape explicitly. More verbose but gives full control. | |
| Hybrid — global default, opt-out decorator | Global interceptor by default, but a @RawResponse() decorator skips it for endpoints that need custom shapes. | ✓ |

**User's choice:** Hybrid — global interceptor + @RawResponse() opt-out decorator
**Notes:** None

---

### Should /health be excluded from the response envelope?

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude /health | Health checks return Terminus's own shape. Wrapping breaks standard health check parsers and k8s probes. | ✓ |
| Include /health | All endpoints use the same envelope. Consistent but may break health check tooling. | |

**User's choice:** Exclude /health (via @RawResponse())
**Notes:** None

---

### When a request fails, which error shape should the envelope use?

| Option | Description | Selected |
|--------|-------------|----------|
| REQ-004 shape | `{ success: false, error: { code, message, statusCode, details } }` — structured, machine-readable, matches envelope contract. | ✓ |
| flash-pick shape | `{ statusCode, message, path, timestamp }` — simpler but doesn't match envelope pattern. | |
| Both — envelope wraps flash-pick fields | `{ success: false, error: { statusCode, message, path, timestamp } }` — envelope container with flash-pick fields. | |

**User's choice:** REQ-004 shape
**Notes:** None

---

## AppException & Error Codes

### What format should AppException error codes use?

| Option | Description | Selected |
|--------|-------------|----------|
| Human-readable strings | e.g. ITEM_NOT_FOUND, VALIDATION_FAILED. Easy to read in logs and client error handling. Industry standard (Stripe/Twilio style). | ✓ |
| Numeric codes | e.g. 1001, 1002. Compact but requires a lookup table to understand. | |
| Namespaced strings | e.g. example.item.not_found, shared.validation.failed. Hierarchical but verbose. | |

**User's choice:** Human-readable strings (SCREAMING_SNAKE_CASE)
**Notes:** None

---

### Should the template ship a starter set of error codes, or just define the AppException class pattern?

| Option | Description | Selected |
|--------|-------------|----------|
| Pattern only | Ship AppException class + small ErrorCodes enum with ~4 examples (VALIDATION_FAILED, NOT_FOUND, UNAUTHORIZED, INTERNAL_ERROR). Teams extend as needed. | ✓ |
| Full standard set | Ship comprehensive set covering common HTTP scenarios. More work now, ready-made catalog. | |
| Empty pattern | Just the AppException class with no pre-defined codes. | |

**User's choice:** Pattern only — AppException + ~4-5 starter error codes
**Notes:** None

---

## Pagination Style

### Which pagination style should the template ship as default?

| Option | Description | Selected |
|--------|-------------|----------|
| Offset-based as per REQ-004 | PaginationDto: { page, limit, sort, order }. PaginationMeta: { total, page, limit, totalPages }. Standard for CRUD APIs. | ✓ |
| Cursor-based like flash-pick | PaginationDto: { limit, cursor }. Better for large real-time datasets. | |
| Both — ship two pagination DTOs | OffsetPaginationDto and CursorPaginationDto. Teams pick one. | |

**User's choice:** Offset-based (as per REQ-004)
**Notes:** None

---

### For offset pagination — should sort/order fields be generic or typed?

| Option | Description | Selected |
|--------|-------------|----------|
| Generic string fields | sort?: string, order?: 'asc' \| 'desc'. Simple, works for any entity. Controllers validate allowed sort fields themselves. | ✓ |
| Typed enum per entity | Each domain defines its own SortField enum. More type-safe but more boilerplate. | |

**User's choice:** Generic string fields
**Notes:** None

---

## Pino Logger Scope

### How much logging infrastructure should the template include?

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal + correlation IDs | nestjs-pino with pino-pretty for dev, JSON stdout for prod. Correlation ID middleware. No file transports. | ✓ |
| Full flash-pick pattern | File rolling (pino-roll), dedicated error.log, pino-pretty dev, JSON prod. | |
| Minimal — no file transports, no Lark | Same as minimal but explicitly exclude Lark transport. | |

**User's choice:** Minimal + correlation IDs
**Notes:** No file transports — teams add those per-service

---

### How should correlation IDs be handled when the header is missing?

| Option | Description | Selected |
|--------|-------------|----------|
| Generate if missing | If X-Correlation-ID not present, generate a UUID. Always inject into response header and logs. | ✓ |
| Propagate only | Only log correlationId if X-Correlation-ID header was present. No auto-generation. | |

**User's choice:** Generate if missing (UUID v4)
**Notes:** Inject into both response header and pino log context

---

## Claude's Discretion

- Prometheus endpoint: separate port (9464) matching flash-pick's production setup
- Exact ValidationPipe options (follow flash-pick's validation-options pattern)
- TimeoutInterceptor implementation (copy from flash-pick)
- RpcExceptionFilter inclusion (include for completeness)
- Pino log level thresholds (debug dev, info prod)
- OTel DNS/FS instrumentation disabled (too noisy)
- `trust proxy` setting in main.ts

## Deferred Ideas

- Lark logging transport — service-specific, not template concern
- File rolling (pino-roll) — teams add per-service
- Cursor-based pagination — flash-pick-service is reference for teams that need it
- Same-port `/metrics` endpoint — Prometheus runs on separate port
