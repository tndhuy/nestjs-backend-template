# Phase 2: DDD Foundation & Infrastructure - Research

**Researched:** 2026-03-25
**Domain:** NestJS DDD base classes + Prisma/Redis/Config/Health infrastructure modules
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `Entity<TId>` base class — holds `id: TId` and `equals()` structural equality
- **D-02:** `AggregateRoot<TId>` extends `Entity<TId>` — adds `addDomainEvent`, `pullDomainEvents`
- **D-03:** Phase 1's `aggregate-root.ts` and `value-object.ts` are starting points — refactor, don't replace
- **D-04:** `DomainEvent` base class stays as-is from Phase 1 (only `occurredAt`)
- **D-05:** `Repository<T, TId>` generic interface in `src/shared/` — `findById`, `findAll`, `save`, `delete`
- **D-06:** Four built-in VOs in `src/shared/valueobjects/`: IdValueObject, StringValueObject, NumberValueObject, DateValueObject
- **D-07:** Reference flash-pick-service's `src/shared/valueobjects/` for VO patterns
- **D-08:** `PrismaItemRepository` in `example/infrastructure/persistence/`
- **D-09:** All 4 CQRS handlers wired to `IItemRepository` via `ITEM_REPOSITORY` token
- **D-10:** `Item` entity updated to extend `AggregateRoot<string>` (it is the aggregate root)
- **D-11:** Prisma schema: `id String @id`, `name String`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- **D-12:** `PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy`
- **D-13:** `DatabaseModule` is `@Global()` — exports PrismaService
- **D-14:** Custom `@InjectPrisma()` decorator (hard requirement from REQ-003)
- **D-15:** `DATABASE_URL` validated at startup via ConfigModule — fail-fast
- **D-16:** `RedisService` with cockatiel `ConsecutiveBreaker`, `commandTimeout`, `connectTimeout`, `enableOfflineQueue: false`
- **D-17:** OTel spans NOT included in Phase 2 (deferred to Phase 3)
- **D-18:** `CacheModule` is `@Global()` — exports RedisService
- **D-19:** Custom `@InjectRedis()` decorator (hard requirement from REQ-003)
- **D-20:** `REDIS_URL` validated at startup — fail-fast
- **D-21:** `@nestjs/config` with class-validator schema (not Zod)
- **D-22:** Fail-fast: missing `DATABASE_URL` or `REDIS_URL` throws on startup
- **D-23:** `@nestjs/terminus` for health checks
- **D-24:** Three endpoints: `/health`, `/health/ready`, `/health/live`
- **D-25:** DB health: Prisma `$queryRaw SELECT 1`; Redis health: `client.ping()`
- **D-26:** Jest unit tests for Entity equality, ValueObject equality, AggregateRoot domain events
- **D-27:** Test files as `*.spec.ts` alongside source in `src/shared/`

### Claude's Discretion

- Exact circuit breaker config values (consecutive failures threshold, half-open delay)
- ConfigModule schema class name and validation decorator choices
- Health endpoint response shape (Terminus defaults are acceptable)
- VO method names (`.value` getter pattern from flash-pick is the reference)

### Deferred Ideas (OUT OF SCOPE)

- OTel tracing spans in RedisService — Phase 3
- Pino structured logging — Phase 3
- API versioning, response envelope — Phase 3
- Agent configs (.claude/, .agent/) — Phase 4
- CLI scaffolding — Phase 5

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-002 | Full DDD base classes: Entity, ValueObject, AggregateRoot, DomainEvent, Repository interface, built-in VOs, unit tests | Phase 1 base classes identified; Entity/AggregateRoot split pattern confirmed from flash-pick reference |
| REQ-003 | Infrastructure modules: DatabaseModule (Prisma), CacheModule (Redis), ConfigModule (fail-fast), HealthModule (/health endpoints) with @InjectPrisma() and @InjectRedis() decorators | user-service PrismaModule and flash-pick RedisModule patterns confirmed; @nestjs/terminus health pattern confirmed |

</phase_requirements>

---

## Summary

Phase 2 builds on the Phase 1 scaffold at `nestjs-backend-template/`. The current Phase 1 `AggregateRoot` holds `id` directly — Phase 2 extracts `id` and `equals()` into a new `Entity<TId>` base class, then makes `AggregateRoot<TId>` extend it. This is a refactor-not-replace: existing `Item extends AggregateRoot<string>` continues to work unchanged after the refactor since `AggregateRoot` still provides `id`.

The infrastructure layer follows patterns already proven in this workspace. `PrismaService` from `user-service` and `RedisService` from `flash-pick-service` are near-exact copies with minor adjustments: PrismaService adds `@InjectPrisma()` decorator injection; RedisService removes OTel spans (`@opentelemetry/api` import and `tracer.startActiveSpan` wrapper) while keeping the circuit breaker. Both modules are `@Global()` so they don't need to be re-imported per domain module.

The `ConfigModule` uses `@nestjs/config` with a class-validator `EnvironmentVariables` class. Fail-fast is achieved by passing `validate` function to `ConfigModule.forRoot()`. The `HealthModule` uses `@nestjs/terminus` — three controller methods on `/health`, `/health/ready`, `/health/live` each calling the appropriate indicators.

**Primary recommendation:** Copy reference implementations directly, strip OTel from Redis, add the two `@Inject*()` decorators, wire into AppModule, and complete ExampleModule with PrismaItemRepository.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @prisma/client | 7.5.0 | ORM / DB client | Team standard; user-service uses it |
| prisma | 7.5.0 | Schema CLI + migrations | Paired with @prisma/client |
| ioredis | 5.10.1 | Redis client | Team standard; flash-pick-service uses it |
| cockatiel | 3.2.1 | Circuit breaker | Already used in flash-pick-service |
| @nestjs/terminus | 11.1.1 | Health check framework | NestJS-native, matches NestJS 11 |
| @nestjs/config | 4.0.3 | Config module with validation | Team standard; consistent with existing services |
| class-validator | 0.15.1 | DTO / env validation decorators | Already in devDeps via NestJS CLI; team standard |
| class-transformer | 0.5.1 | Object transformation | Required by class-validator |

**Version verification:** Confirmed against npm registry on 2026-03-25.

**Installation:**
```bash
pnpm add @prisma/client prisma ioredis cockatiel @nestjs/terminus @nestjs/config class-validator class-transformer
```

**Prisma client generation (after install):**
```bash
npx prisma generate
```

---

## Architecture Patterns

### Recommended Project Structure

```
nestjs-backend-template/src/
├── shared/
│   ├── base/
│   │   ├── entity.ts                  # NEW: Entity<TId> with id + equals()
│   │   ├── aggregate-root.ts          # REFACTOR: extend Entity<TId>
│   │   ├── value-object.ts            # KEEP as-is from Phase 1
│   │   ├── domain-event.ts            # KEEP as-is from Phase 1
│   │   ├── repository.interface.ts    # NEW: Repository<T, TId> generic interface
│   │   └── index.ts                   # EXPAND: export all base classes
│   └── valueobjects/
│       ├── id.valueobject.ts          # NEW
│       ├── string.valueobject.ts      # NEW
│       ├── number.valueobject.ts      # NEW
│       ├── date.valueobject.ts        # NEW
│       └── index.ts                   # NEW
├── infrastructure/
│   ├── database/
│   │   ├── prisma.service.ts
│   │   ├── prisma.module.ts           # @Global()
│   │   └── inject-prisma.decorator.ts
│   ├── cache/
│   │   ├── redis.service.ts           # circuit breaker, no OTel
│   │   ├── redis.module.ts            # @Global()
│   │   └── inject-redis.decorator.ts
│   ├── config/
│   │   ├── environment.validation.ts  # class-validator schema
│   │   └── config.module.ts
│   └── health/
│       ├── health.controller.ts
│       └── health.module.ts
├── example/
│   ├── domain/
│   │   └── item.entity.ts             # UPDATE: AggregateRoot<string> (already correct)
│   ├── application/
│   │   ├── commands/                  # UPDATE: wire IItemRepository
│   │   └── queries/                   # UPDATE: wire IItemRepository
│   ├── infrastructure/
│   │   └── persistence/
│   │       └── prisma-item.repository.ts  # NEW
│   └── example.module.ts              # UPDATE: provide PrismaItemRepository
└── app.module.ts                      # UPDATE: import infra modules
prisma/
└── schema.prisma                      # NEW: Item model
```

### Pattern 1: Entity / AggregateRoot Split

**What:** `Entity<TId>` owns `id` and `equals()`. `AggregateRoot<TId>` extends Entity and adds domain events.

**When to use:** Entity for child entities within an aggregate (e.g., `OrderLine extends Entity<string>`). AggregateRoot for the root (e.g., `Item extends AggregateRoot<string>`).

```typescript
// src/shared/base/entity.ts
export abstract class Entity<TId> {
  readonly id: TId;

  protected constructor(id: TId) {
    this.id = id;
  }

  equals(other?: Entity<TId>): boolean {
    if (!other) return false;
    if (other === this) return true;
    return this.id === other.id;
  }
}

// src/shared/base/aggregate-root.ts  (refactored)
import { Entity } from './entity';
import { DomainEvent } from './domain-event';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private readonly domainEvents: DomainEvent[] = [];

  protected constructor(id: TId) {
    super(id);
  }

  addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }
}
```

### Pattern 2: Custom Inject Decorators

**What:** Thin wrappers around `@Inject()` that provide type safety without exposing DI tokens.

```typescript
// src/infrastructure/database/inject-prisma.decorator.ts
import { Inject } from '@nestjs/common';

export const PRISMA_CLIENT = Symbol('PRISMA_CLIENT');

export const InjectPrisma = () => Inject(PRISMA_CLIENT);

// src/infrastructure/database/prisma.module.ts
@Global()
@Module({
  providers: [
    PrismaService,
    { provide: PRISMA_CLIENT, useExisting: PrismaService },
  ],
  exports: [PrismaService, PRISMA_CLIENT],
})
export class DatabaseModule {}
```

**Alternative simpler approach** (no extra token needed — inject PrismaService directly by class):
```typescript
// src/infrastructure/database/inject-prisma.decorator.ts
import { Inject } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export const InjectPrisma = () => Inject(PrismaService);
```

This simpler approach satisfies REQ-003 and avoids an extra Symbol. Use this unless the planner decides token-based is preferred.

### Pattern 3: RedisService Without OTel (Phase 2 version)

**What:** The flash-pick `execute<T>()` pattern minus `tracer.startActiveSpan` wrapper.

```typescript
// Strip these from flash-pick-service reference:
// import { trace, SpanStatusCode } from '@opentelemetry/api';
// private readonly tracer = trace.getTracer('...');

async execute<T>(fn: (client: Redis) => Promise<T>): Promise<T> {
  return this.policy.execute(() => fn(this.getClient()));
}
```

### Pattern 4: ConfigModule Fail-Fast Validation

```typescript
// src/infrastructure/config/environment.validation.ts
import { IsString, IsNotEmpty, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validated;
}

// src/app.module.ts
ConfigModule.forRoot({ validate, isGlobal: true })
```

### Pattern 5: @nestjs/terminus Health Endpoints

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,   // custom
    private redis: RedisHealthIndicator, // custom
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]); // process-alive check: empty = always 200
  }
}
```

Note: `@nestjs/terminus` does not ship a PrismaHealthIndicator or RedisHealthIndicator. Both must be written as custom indicators that extend `HealthIndicator` and call `$queryRaw` / `client.ping()`.

### Pattern 6: PrismaItemRepository

```typescript
// example/infrastructure/persistence/prisma-item.repository.ts
@Injectable()
export class PrismaItemRepository implements IItemRepository {
  constructor(@InjectPrisma() private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Item | null> {
    const record = await this.prisma.item.findUnique({ where: { id } });
    if (!record) return null;
    return Item.create(record.id, new ItemName(record.name));
  }

  async findAll(): Promise<Item[]> {
    const records = await this.prisma.item.findMany();
    return records.map(r => Item.create(r.id, new ItemName(r.name)));
  }

  async save(item: Item): Promise<void> {
    await this.prisma.item.upsert({
      where: { id: item.id },
      update: { name: item.name.value },
      create: { id: item.id, name: item.name.value },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.item.delete({ where: { id } });
  }
}
```

### Anti-Patterns to Avoid

- **Importing NestJS in domain layer:** `Entity`, `AggregateRoot`, `ValueObject`, `DomainEvent` must have zero NestJS imports. Keeps domain testable without module overhead.
- **Making DatabaseModule or CacheModule non-global:** They must be `@Global()` or every domain module must re-import them — defeats the purpose.
- **Skipping `enableOfflineQueue: false` on Redis:** Without it, commands queue indefinitely during Redis outage and cause cascading delays.
- **Using `getClient()` for business logic:** Callers must use `execute<T>(fn)` to benefit from circuit breaker protection.
- **Forgetting `prisma generate` after schema change:** `@prisma/client` types are not updated until `prisma generate` runs. Add it to `postinstall` script.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Circuit breaker | Custom retry/state machine | cockatiel `ConsecutiveBreaker` | Half-open state, event emission, policy composition are subtle |
| Health checks | Custom `/health` controller ping logic | `@nestjs/terminus` | Handles concurrent checks, timeout, retry, status aggregation |
| Config validation | Manual `process.env` checks | `@nestjs/config` + class-validator | validateSync gives structured errors with field names |
| DB connection lifecycle | Manual `$connect/$disconnect` calls | `OnModuleInit`/`OnModuleDestroy` hooks | NestJS manages order; prevents double-connect |

**Key insight:** The circuit breaker's half-open state is the most error-prone part to hand-roll. `cockatiel` handles this correctly with exponential back-off and proper state transitions.

---

## Common Pitfalls

### Pitfall 1: AggregateRoot Refactor Breaks `Item`

**What goes wrong:** Adding `extends Entity<TId>` to AggregateRoot moves `id` from AggregateRoot to Entity. If AggregateRoot's `protected constructor(id: TId)` does not call `super(id)`, `this.id` will be undefined.

**Why it happens:** Forgetting `super(id)` call in AggregateRoot constructor after restructuring.

**How to avoid:** `AggregateRoot` constructor must call `super(id)`. Since `Item` calls `super(id)` through `AggregateRoot`, the chain is: `Item → AggregateRoot → Entity`.

**Warning signs:** `item.id` returns `undefined` in tests.

### Pitfall 2: `@InjectPrisma()` Decorator Not Exported Properly

**What goes wrong:** `@InjectPrisma()` resolves to `undefined` at runtime because `DatabaseModule` exports `PrismaService` but not the injection token symbol used in the decorator.

**How to avoid:** If using a Symbol-based token, ensure `DatabaseModule` exports both the symbol token and `PrismaService`. Alternatively, use the simpler `Inject(PrismaService)` approach — no extra export needed.

### Pitfall 3: Prisma Client Not Generated

**What goes wrong:** TypeScript build fails with `Cannot find module '@prisma/client'` or Prisma model types missing.

**Why it happens:** `@prisma/client` ships without types until `prisma generate` runs against the schema.

**How to avoid:** Add `"postinstall": "prisma generate"` to `package.json` scripts. Run `prisma generate` immediately after adding the Item model to `schema.prisma`.

### Pitfall 4: `REDIS_URL` vs `REDIS_URI` Naming

**What goes wrong:** flash-pick-service uses `REDIS_URI`; the decisions mandate `REDIS_URL`. Copying the service file verbatim leaves the wrong env var name.

**How to avoid:** When copying `redis.service.ts` from flash-pick-service, change `process.env.REDIS_URI` to `process.env.REDIS_URL` (and the ConfigModule schema class field name).

### Pitfall 5: HealthModule Missing Custom Indicators

**What goes wrong:** `@nestjs/terminus` has built-in HTTP/DNS/memory indicators but no Prisma or Redis indicators. Planner or implementor may expect them to exist.

**How to avoid:** Both `PrismaHealthIndicator` and `RedisHealthIndicator` must be written as custom classes extending `HealthIndicator`. They are 10-20 lines each but must be explicitly planned as tasks.

### Pitfall 6: Jest `rootDir: src` Misses Tests Outside `src`

**What goes wrong:** Current jest config has `"rootDir": "src"` and `"testRegex": ".*\\.spec\\.ts$"`. Tests placed in `src/shared/base/entity.spec.ts` are found. No change needed.

**Warning signs:** If tests are placed outside `src/`, they will not be picked up.

---

## Code Examples

### Built-in Value Object Pattern (from flash-pick-service)

```typescript
// src/shared/valueobjects/id.valueobject.ts
import { ValueObject } from '../base/value-object';

export class IdValueObject extends ValueObject<{ value: string }> {
  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ID must not be empty');
    }
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
```

### Generic Repository Interface

```typescript
// src/shared/base/repository.interface.ts
export interface Repository<T, TId> {
  findById(id: TId): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: TId): Promise<void>;
}
```

### Prisma Schema (Item model)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Item {
  id        String   @id
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AggregateRoot holds id directly | Entity<TId> holds id; AggregateRoot extends Entity | Phase 2 | Enables child entities (OrderLine extends Entity) alongside aggregate roots |
| Direct `PrismaClient` injection | `@InjectPrisma()` decorator | Phase 2 | Consistent DI pattern, easier to mock in tests |
| RedisService with OTel spans | RedisService without OTel (Phase 2), OTel added in Phase 3 | Phase 2 / Phase 3 | Avoids @opentelemetry/api dependency before tracing is wired |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | Assumed (project runs) | — | — |
| pnpm | Package install | Assumed (Phase 1 used it) | — | — |
| PostgreSQL | Prisma / DatabaseModule | Not verified — dev env only | — | Use `.env` with DATABASE_URL pointing to local/Docker Postgres |
| Redis | CacheModule | Not verified — dev env only | — | Use `.env` with REDIS_URL pointing to local/Docker Redis |
| prisma CLI | Schema migrations | Installed via `pnpm add prisma` | — | — |

**Missing dependencies with no fallback:**
- None that block implementation. Prisma and Redis are runtime dependencies — the code compiles without them; they're only needed for integration testing.

**Missing dependencies with fallback:**
- PostgreSQL: Tests that hit the DB require a running Postgres. Unit tests for DDD classes do not. Plan unit tests first; integration tests require a running DB.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30 (already installed) |
| Config file | `package.json` jest section |
| Quick run command | `pnpm test --testPathPattern=shared` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-002 | Entity equality: same id = equal, different id = not equal | unit | `pnpm test --testPathPattern=entity.spec` | Wave 0 |
| REQ-002 | ValueObject equality: structural (same props = equal) | unit | `pnpm test --testPathPattern=value-object.spec` | Wave 0 |
| REQ-002 | AggregateRoot: addDomainEvent + pullDomainEvents clears after pull | unit | `pnpm test --testPathPattern=aggregate-root.spec` | Wave 0 |
| REQ-002 | IdValueObject rejects empty string | unit | `pnpm test --testPathPattern=id.valueobject.spec` | Wave 0 |
| REQ-003 | /health returns 200 | integration/smoke | manual curl or e2e | Wave 0 (e2e) |

### Sampling Rate

- **Per task commit:** `pnpm test --testPathPattern=shared`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/shared/base/entity.spec.ts` — covers REQ-002 Entity equality
- [ ] `src/shared/base/value-object.spec.ts` — covers REQ-002 VO equality (may exist from Phase 1)
- [ ] `src/shared/base/aggregate-root.spec.ts` — covers REQ-002 domain event dispatch
- [ ] `src/shared/valueobjects/id.valueobject.spec.ts` — covers REQ-002 IdValueObject validation

---

## Open Questions

1. **Does `ItemName` VO need to extend `StringValueObject` or remain standalone?**
   - What we know: `ItemName` exists from Phase 1 and validates non-empty string independently.
   - What's unclear: Whether to refactor it to extend the new `StringValueObject`.
   - Recommendation: Refactor it to extend `StringValueObject` as a demonstration of the built-in VOs.

2. **Should `ExampleModule` provide `DatabaseModule` explicitly or rely on global?**
   - What we know: `DatabaseModule` is `@Global()`, so no explicit import needed.
   - What's unclear: Whether the planner intends to list it in `ExampleModule`'s imports for clarity.
   - Recommendation: Since `@Global()`, omit from `ExampleModule.imports`. Only `AppModule` imports `DatabaseModule`.

---

## Sources

### Primary (HIGH confidence)

- Direct read of `flash-pick-service/src/infrastructure/redis/redis.service.ts` — RedisService circuit breaker pattern
- Direct read of `user-service/src/infrastructure/database/prisma/prisma.service.ts` — PrismaService lifecycle pattern
- Direct read of `flash-pick-service/src/shared/valueobjects/id.valueobject.ts` — VO pattern
- Direct read of `nestjs-backend-template/src/shared/base/` — Phase 1 base classes (aggregate-root, value-object, domain-event)
- npm registry (2026-03-25): @prisma/client@7.5.0, ioredis@5.10.1, cockatiel@3.2.1, @nestjs/terminus@11.1.1, @nestjs/config@4.0.3, class-validator@0.15.1, class-transformer@0.5.1

### Secondary (MEDIUM confidence)

- `@nestjs/terminus` docs: custom health indicators must extend `HealthIndicator` base class; no built-in Prisma/Redis indicators exist
- `@nestjs/config` `validate` option pattern: pass a `validate` function to `ConfigModule.forRoot()`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from workspace references + npm registry
- Architecture: HIGH — patterns verified from existing reference implementations
- Pitfalls: HIGH — identified from direct code inspection of reference files

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable ecosystem, 30-day estimate)
