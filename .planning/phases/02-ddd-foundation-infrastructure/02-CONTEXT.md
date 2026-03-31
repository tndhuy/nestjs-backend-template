# Phase 2: DDD Foundation & Infrastructure - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers two things in parallel:
1. **Full DDD base class hierarchy** in `src/shared/` — proper Entity/AggregateRoot split, built-in Value Objects, generic Repository interface, unit tests
2. **Infrastructure modules** — DatabaseModule (Prisma), CacheModule (Redis), ConfigModule, HealthModule with `/health` endpoints

Phase 2 also **completes ExampleModule** by wiring a real `PrismaItemRepository` so all 4 CQRS handlers work end-to-end.

**Explicitly OUT of Phase 2 scope:**
- API versioning, response envelope, pagination (Phase 3)
- Pino structured logging, OTel tracing, Prometheus (Phase 3)
- Agent configs `.claude/` / `.agent/` (Phase 4)
- CLI package (Phase 5)

</domain>

<decisions>
## Implementation Decisions

### DDD Base Class Hierarchy
- **D-01:** Introduce `Entity<TId>` base class — holds identity (`id: TId`) and structural equality (`equals()`).
- **D-02:** `AggregateRoot<TId>` extends `Entity<TId>` — adds domain event collection (`addDomainEvent`, `pullDomainEvents`).
- **D-03:** Phase 1's `src/shared/base/aggregate-root.ts` and `value-object.ts` are the starting point — refactor AggregateRoot to extend the new Entity class.
- **D-04:** `DomainEvent` base class stays as-is from Phase 1 (timestamp, aggregateId, eventType metadata).
- **D-05:** `Repository<T, TId>` generic interface lives in `src/shared/` — provides `findById`, `findAll`, `save`, `delete` as the standard CRUD port.

### Built-in Value Objects
- **D-06:** Implement four built-in VOs in `src/shared/valueobjects/`:
  - `IdValueObject extends ValueObject<{ value: string }>` — validates non-empty
  - `StringValueObject extends ValueObject<{ value: string }>` — validates non-null/undefined
  - `NumberValueObject extends ValueObject<{ value: number }>` — validates is finite number
  - `DateValueObject extends ValueObject<{ value: Date }>` — validates is valid Date
- **D-07:** Reference: flash-pick-service's `src/shared/valueobjects/` has working IdValueObject and StringValueObject — use as patterns.

### ExampleModule Completion
- **D-08:** Phase 2 implements `PrismaItemRepository` in `example/infrastructure/persistence/` — concrete adapter for `IItemRepository`.
- **D-09:** All 4 CQRS handlers updated to use `IItemRepository` (injected via `ITEM_REPOSITORY` token) — no more `NotImplementedException`.
- **D-10:** `Item` entity in `example/domain/` updated to extend `Entity<string>` (not AggregateRoot — Item IS the aggregate root, so it should extend AggregateRoot. But since Item is simple with no child entities, it extends `AggregateRoot<string>` directly).
- **D-11:** Prisma schema for Item is minimal: `id String @id`, `name String`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.

### DatabaseModule (Prisma)
- **D-12:** `PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy` — matches user-service pattern.
- **D-13:** `DatabaseModule` is `@Global()` — exports PrismaService for injection across modules.
- **D-14:** Custom `@InjectPrisma()` decorator wraps standard NestJS injection — as required by REQ-003 (`Prisma client injectable via @InjectPrisma()`).
- **D-15:** `DATABASE_URL` validated at startup via ConfigModule — fail-fast if missing.

### CacheModule (Redis)
- **D-16:** Production-grade `RedisService` — circuit breaker (cockatiel `ConsecutiveBreaker`), connection retries, `commandTimeout`, `connectTimeout`, `enableOfflineQueue: false`. Based on flash-pick-service's pattern.
- **D-17:** OTel tracing spans (`tracer.startActiveSpan`) are **NOT included in Phase 2** — deferred to Phase 3 when `@opentelemetry/api` is fully wired.
- **D-18:** `CacheModule` is `@Global()` — exports `RedisService`.
- **D-19:** Custom `@InjectRedis()` decorator — as required by REQ-003.
- **D-20:** `REDIS_URL` validated at startup via ConfigModule — fail-fast if missing.

### ConfigModule
- **D-21:** Use `@nestjs/config` with a class-validator validation schema (not Zod) — consistent with existing services.
- **D-22:** Fail-fast: if `DATABASE_URL` or `REDIS_URL` missing, app throws on startup (not a silent warning).

### HealthModule
- **D-23:** Use `@nestjs/terminus` for health checks.
- **D-24:** Three endpoints: `/health` (combined), `/health/ready` (DB + Redis), `/health/live` (process alive).
- **D-25:** DB health check pings Prisma (`$queryRaw SELECT 1`); Redis health check pings `client.ping()`.

### Unit Tests
- **D-26:** Jest unit tests for:
  - `Entity<T>` equality (same id = equal, different id = not equal)
  - `ValueObject<T>` equality (structural, not reference)
  - `AggregateRoot` domain event dispatch (`addDomainEvent`, `pullDomainEvents` clears after pull)
- **D-27:** Test files alongside source: `*.spec.ts` in `src/shared/`.

### Claude's Discretion
- Exact circuit breaker config values (consecutive failures threshold, half-open delay)
- ConfigModule schema class name and validation decorator choices
- Health endpoint response shape (Terminus defaults are acceptable)
- VO method names (`.value` getter pattern from flash-pick is the reference)

</decisions>

<specifics>
## Specific Ideas

- RedisService should match flash-pick-service's `execute<T>(fn)` pattern — wraps ops in circuit breaker, callers don't access `getClient()` directly for business logic.
- `@InjectPrisma()` and `@InjectRedis()` are explicitly called out in REQ-003 — they are hard requirements, not optional convenience.
- Item entity: since Item IS the aggregate root (not a child entity), it should extend `AggregateRoot<string>`. The `Entity<T>` class exists for child entities like `OrderLine extends Entity<string>` inside an Order aggregate.
- Phase 1 had `src/shared/base/` — Phase 2 expands this into a proper structure: `src/shared/base/entity.ts`, `src/shared/base/aggregate-root.ts` (refactored to extend Entity), `src/shared/base/value-object.ts`, `src/shared/base/domain-event.ts`, `src/shared/base/repository.interface.ts`.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — REQ-002 (DDD base classes, acceptance criteria) and REQ-003 (infrastructure modules, acceptance criteria)
- `.planning/ROADMAP.md` — Phase 2 deliverables

### Phase 1 Output (base to extend)
- `nestjs-backend-template/src/shared/base/` — Existing Phase 1 base classes (AggregateRoot, ValueObject, DomainEvent) — refactor, don't replace
- `nestjs-backend-template/src/example/domain/` — Item entity, ItemName VO, IItemRepository — update to use new base classes
- `nestjs-backend-template/src/example/application/` — 4 CQRS handlers — wire to PrismaItemRepository

### Reference Implementations (read-only)
- `flash-pick-service/src/shared/valueobjects/` — IdValueObject, StringValueObject, NumberValueObject patterns
- `flash-pick-service/src/shared/aggregate-root.ts` — AggregateRoot reference
- `flash-pick-service/src/infrastructure/redis/redis.service.ts` — Production-grade RedisService with circuit breaker (copy pattern, omit OTel spans)
- `flash-pick-service/src/infrastructure/redis/redis.module.ts` — @Global() module pattern
- `user-service/src/infrastructure/database/prisma/prisma.service.ts` — PrismaService reference
- `user-service/src/infrastructure/database/prisma/prisma.module.ts` — @Global() DatabaseModule reference

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 1)
- `nestjs-backend-template/src/shared/base/aggregate-root.ts` — Has `id`, `addDomainEvent`, `pullDomainEvents` — keep, add extends Entity
- `nestjs-backend-template/src/shared/base/value-object.ts` — Has `props`, `equals()` — keep as-is
- `nestjs-backend-template/src/shared/base/domain-event.ts` — Keep as-is
- `nestjs-backend-template/src/example/domain/item.repository.interface.ts` — Has `IItemRepository` with `ITEM_REPOSITORY` token — keep interface, add Prisma adapter

### Established Patterns
- `@Global()` modules for shared infrastructure (both user-service and flash-pick use this)
- `OnModuleInit` / `OnModuleDestroy` for connection lifecycle management
- Symbol-based DI tokens for repository injection (already in `ITEM_REPOSITORY` token from Phase 1)
- `@nestjs/cqrs` CQRS wiring already in ExampleModule

### Integration Points
- `AppModule` needs to import `DatabaseModule`, `CacheModule`, `ConfigModule`, `HealthModule`
- `ExampleModule` needs `DatabaseModule` (for PrismaItemRepository) — already has `CqrsModule`
- `package.json` needs new deps: `@prisma/client`, `prisma`, `ioredis`, `cockatiel`, `@nestjs/terminus`, `@nestjs/config`, `class-validator`, `class-transformer`

</code_context>

<deferred>
## Deferred Ideas

- OTel tracing spans in RedisService — Phase 3 (when @opentelemetry/api is wired)
- Pino structured logging — Phase 3
- API versioning, response envelope — Phase 3
- Agent configs (.claude/, .agent/) — Phase 4
- CLI scaffolding — Phase 5

</deferred>

---

*Phase: 02-ddd-foundation-infrastructure*
*Context gathered: 2026-03-25 via discuss-phase session*
