# Requirements

## REQ-001: Generic Template Scaffold
**Phase:** 1
**Priority:** P0

Extract and clean flash-pick-service into a domain-agnostic template. Remove all business-specific code (product search, ClickHouse, Shopee). Keep infrastructure patterns. Result: a runnable NestJS app with one example domain module demonstrating DDD structure.

**Acceptance:**
- `pnpm install && pnpm build` passes with zero errors
- No references to "flash-pick", "product", "shopee", "clickhouse" in source
- One example module (e.g., `ExampleModule`) demonstrates domain/application/infrastructure layers
- Docker build succeeds

---

## REQ-002: Full DDD Base Classes
**Phase:** 2
**Priority:** P0

Implement reusable DDD primitives in `src/shared/`:
- `Entity<T>` base class with identity equality
- `ValueObject<T>` base class with structural equality
- `AggregateRoot<T>` extending Entity, with domain event collection/dispatch
- `DomainEvent` base class with metadata (occurredOn, aggregateId, eventType)
- `Repository<T>` interface (generic CRUD port)
- Built-in Value Objects: `IdValueObject`, `StringValueObject`, `NumberValueObject`, `DateValueObject`

**Acceptance:**
- All base classes exportable from `src/shared/index.ts`
- Unit tests for Entity equality, ValueObject equality, AggregateRoot event dispatch
- Example module uses all base classes

---

## REQ-003: Infrastructure Layer — Prisma + Redis
**Phase:** 2
**Priority:** P0

Pre-configured infrastructure modules:
- `DatabaseModule` (Prisma client, connection health check)
- `CacheModule` (Redis via ioredis, get/set/del/expire helpers)
- `ConfigModule` (nestjs-config with class-validator schema, fail-fast on missing vars)
- `HealthModule` (terminus: /health, /health/ready, /health/live with DB + Redis checks)

**Acceptance:**
- `DATABASE_URL` and `REDIS_URL` validated on startup
- `/health` returns 200 with DB + Redis status
- Prisma client injectable via `@InjectPrisma()`
- Redis client injectable via `@InjectRedis()`

---

## REQ-004: API Standards & Versioning
**Phase:** 3
**Priority:** P0

Standard API layer:
- URI versioning enabled globally (`/api/v1/...`)
- Response envelope: `{ success: boolean, data: T, meta?: PaginationMeta, error?: ErrorDetail }`
- Pagination: `PaginationDto` query params (page, limit, sort, order), `PaginationMeta` response
- Error codes: structured `AppException` with code, message, statusCode, details
- Global validation pipe with class-transformer
- Global rate limiting (ThrottlerModule, configurable)

**Acceptance:**
- All endpoints prefixed `/api/v1/`
- Response always matches envelope schema
- Invalid requests return `{ success: false, error: { code, message, details } }`
- Paginated endpoints return `meta: { total, page, limit, totalPages }`

---

## REQ-005: Scalar API Documentation
**Phase:** 3
**Priority:** P1

Scalar docs setup:
- Scalar UI served at `/docs` (protected by basic auth in production)
- OpenAPI spec auto-generated from decorators
- Versioned: spec shows API version
- Example module endpoints fully documented with `@ApiOperation`, `@ApiResponse`, schemas

**Acceptance:**
- `/docs` loads Scalar UI
- All example module endpoints visible with request/response schemas
- Auth header documented
- Spec downloadable at `/docs/json`

---

## REQ-006: Observability
**Phase:** 3
**Priority:** P1

Production-ready observability:
- Pino structured logging (nestjs-pino) with request correlation IDs
- OpenTelemetry tracing (conditional via `OTEL_ENABLED=true`)
- Prometheus metrics at `/metrics` (conditional via `METRICS_ENABLED=true`)
- Request/response logging with duration
- Correlation ID propagated via `X-Correlation-ID` header

**Acceptance:**
- Logs are JSON-structured with `correlationId`, `method`, `path`, `statusCode`, `duration`
- `/metrics` returns Prometheus metrics when enabled
- Traces exported when OTEL_ENABLED=true

---

## REQ-007: Agent Configuration — .claude/
**Phase:** 4
**Priority:** P1

Claude Code agent setup in `.claude/`:
- `CLAUDE.md` — project context, architecture overview, conventions
- `skills/` — pre-installed skills:
  - GSD (get-shit-done) for milestone-based development workflows
  - Understand-Anything for codebase onboarding
- `.mcp.json` — pre-configured MCP servers: context7, docker, lark, context-mode
- `get-shit-done/` — GSD framework installed locally

**Acceptance:**
- `.claude/CLAUDE.md` describes architecture, tech stack, conventions
- `.claude/skills/` contains GSD and Understand-Anything skill files
- `.mcp.json` has valid config for context7, docker, lark, context-mode
- New developer can run `/gsd:map-codebase` and get meaningful output

---

## REQ-008: Agent Configuration — .agent/
**Phase:** 4
**Priority:** P1

Antigravity agent setup in `.agent/`:
- `context/` — project context files (architecture, stack, conventions)
- `skills/` — available skills for antigravity agent
- `mcp/` — MCP server configurations (same as .claude/)
- `README.md` — how to use antigravity with this template

**Acceptance:**
- `.agent/` directory has context/, skills/, mcp/ subdirectories
- Context files mirror `.planning/codebase/` content
- MCP config mirrors `.claude/.mcp.json`
- README explains how to configure antigravity for this project

---

## REQ-009: Developer Documentation
**Phase:** 4
**Priority:** P1

Complete onboarding documentation:
- `README.md` — project overview, quick start, scripts, env vars
- `docs/ARCHITECTURE.md` — DDD layers, conventions, data flow
- `docs/CONTRIBUTING.md` — how to add new modules, DDD patterns guide
- `docs/API.md` — API conventions, versioning, response formats
- `.env.example` — all required environment variables with descriptions

**Acceptance:**
- New developer can run the service from README alone (no tribal knowledge)
- Each DDD layer explained with concrete examples from the codebase
- `docs/CONTRIBUTING.md` has step-by-step "add a new domain module" guide

---

## REQ-010: CLI Package
**Phase:** 5
**Priority:** P2

npm CLI package wrapping the template:
- Package: `@team/create-app` (or team-specific name)
- Command: `npx @team/create-app my-service` → scaffolds new service
- Interactive prompts: service name, description, select optional modules (Redis, Kafka, etc.)
- Output: ready-to-run project directory

**Acceptance:**
- `npx @team/create-app my-service` completes without errors
- Generated project passes `pnpm install && pnpm build`
- Generated project has correct service name throughout (no hardcoded "template")
- Published to team npm registry

---

*Last updated: 2026-03-23 after initialization*
