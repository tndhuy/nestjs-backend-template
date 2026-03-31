# Codebase Structure

**Analysis Date:** 2026-03-20

## Monorepo Layout

```
happyland-of-draken/          # Monorepo root (no workspace manager — each service is independent)
├── flash-pick-service/       # HTTP API service: product search, analytics, external API
├── processing-flash-pick/    # ETL/processing service: Kafka consumer + BullMQ workers
├── user-service/             # Auth, user management, API client connector
├── devops/                   # Infrastructure: nginx, kong, infra configs
│   ├── infra/
│   ├── kong/
│   └── nginx/
├── docs/                     # Cross-service contracts and shared API specs
│   ├── contracts/
│   │   ├── actions/          # Kafka action contracts
│   │   └── http-fallback/    # HTTP fallback contracts
│   └── services/
├── plans/                    # Implementation plans (markdown)
├── .planning/codebase/       # GSD codebase map documents (this directory)
├── thotool-sync/             # Standalone sync utility (Node.js)
└── .agents/                  # Agent workflow definitions
```

## Service: flash-pick-service

```
flash-pick-service/
├── src/
│   ├── main.ts                         # Entry point; OpenTelemetry instrumented
│   ├── instrumentation.ts              # OTEL SDK setup
│   ├── app.module.ts                   # Root NestJS module
│   ├── app.controller.ts               # Health/ping endpoints
│   ├── specs.controller.ts             # Scalar API docs endpoint
│   ├── common/
│   │   ├── exceptions/rpc.exception.ts
│   │   ├── filters/                    # HTTP + RPC exception filters
│   │   └── interceptors/timeout.interceptor.ts
│   ├── infrastructure/
│   │   ├── database/clickhouse/        # ClickHouse client wrapper
│   │   ├── guards/external-client-auth.guard.ts
│   │   ├── messaging/kafka/            # Kafka request-reply client
│   │   ├── messaging/service-registry/ # Internal service discovery
│   │   ├── queue/                      # BullMQ processors, schedulers, cron
│   │   └── redis/                      # ioredis wrapper
│   ├── modules/
│   │   ├── analytics/                  # Analytics events tracking
│   │   ├── categories/                 # Category query API
│   │   ├── discount-types/             # Discount type config API
│   │   ├── external-api/               # External client API (auth + product fetch)
│   │   ├── products/                   # Product listing/search API
│   │   └── search/                     # Search autocomplete + results
│   └── shared/
│       ├── core/                       # DDD base classes (aggregate, value objects, business rules)
│       ├── data/category-catalog.service.ts
│       ├── decorators/
│       ├── logger/                     # nestjs-pino setup, Lark transport
│       ├── search/                     # Discount type config service, query builders
│       └── utils/                      # cursor.utils.ts, shopee.utils.ts, query-params.utils.ts
├── test/
│   ├── unit/                           # Jest unit specs (matched by testRegex)
│   │   ├── common/
│   │   └── *.spec.ts
│   ├── e2e/                            # Supertest e2e specs
│   └── helpers/redis.mock.ts           # Shared in-memory Redis mock
├── migrations/clickhouse/              # Versioned ClickHouse DDL migrations
├── scripts/                            # CLI scripts: migrations, benchmarks, k6 perf tests
├── generated/prisma/                   # (Not used by this service — Prisma not a dep)
├── docs/                               # Service-local API and performance docs
└── package.json
```

## Service: processing-flash-pick

```
processing-flash-pick/
├── src/
│   ├── main.ts                         # Entry point
│   ├── app.module.ts
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── clickhouse/             # ClickHouse gold-layer writer
│   │   │   ├── mongo/                  # MongoDB raw source reader
│   │   │   └── prisma/                 # PostgreSQL via Prisma (silver layer + job tracking)
│   │   ├── kafka/kafka.consumer.ts     # Kafka consumer (microservice transport)
│   │   ├── queue/
│   │   │   ├── processors/             # BullMQ: flash-pick, dead-letter, heartbeat
│   │   │   └── schedulers/             # Cron schedulers per processor
│   │   └── redis/                      # ioredis wrapper + utils
│   └── modules/
│       └── etl/
│           ├── common.types.ts         # RawIngestionStatus enum, shared types
│           ├── etl.module.ts
│           └── flash-pick/
│               ├── etl.service.ts      # Core ETL orchestrator
│               ├── mapper.ts           # Raw → silver mapper
│               ├── ports.ts            # Port interfaces (loader, writer, mapper, etc.)
│               ├── types.ts            # RawFlashPickDocument type
│               └── adapters/
│                   ├── basic.validator.ts
│                   ├── category-catalog.sync.ts
│                   ├── clickhouse-gold.writer.ts
│                   ├── mongo-raw.loader.ts
│                   ├── prisma-dead-letter.store.ts
│                   ├── prisma-job.tracker.ts
│                   ├── prisma-watermark.store.ts
│                   ├── prisma-writer.ts
│                   └── shopee.mapper.ts
├── test/
│   ├── __mocks__/prisma-client.ts      # Manual Prisma mock for unit tests
│   ├── unit/                           # Jest unit specs
│   │   ├── infrastructure/             # Kafka, queue processors, schedulers
│   │   └── modules/etl/flash-pick/     # ETL service + adapter specs
│   └── e2e/
├── migrations/clickhouse/              # Versioned ClickHouse DDL migrations
├── prisma/                             # Prisma schema for silver layer (PostgreSQL)
└── package.json
```

## Service: user-service

```
user-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── instrumentation.ts
│   ├── specs.controller.ts
│   ├── common/
│   │   ├── exceptions/rpc.exception.ts
│   │   ├── filters/                    # HTTP + RPC exception filters
│   │   └── interceptors/timeout.interceptor.ts
│   ├── infrastructure/
│   │   ├── database/prisma/            # Prisma service for PostgreSQL
│   │   ├── guards/                     # JWT, client-auth, roles guards
│   │   ├── messaging/kafka/            # Kafka producer + request-handler
│   │   └── security/security.module.ts
│   └── modules/
│       ├── auth/                       # Login, register, refresh-token use cases
│       │   ├── application/dto/
│       │   ├── application/use-cases/
│       │   ├── domain/ports/
│       │   ├── infrastructure/         # bcrypt, JWT strategy, Prisma token repo
│       │   └── presentation/auth.controller.ts
│       ├── connector/                  # API client management (register, revoke, verify)
│       │   ├── application/use-cases/
│       │   ├── domain/                 # api-client.entity.ts, client-token.entity.ts
│       │   ├── infrastructure/         # HMAC verifier, Prisma repo, webhook dispatcher
│       │   └── presentation/          # connector, internal-connector, token controllers
│       ├── user/                       # User CRUD + admin operations
│       │   ├── application/use-cases/
│       │   ├── domain/                 # user.entity.ts, user-role.enum.ts
│       │   ├── infrastructure/persistence/prisma-user.repository.ts
│       │   └── presentation/          # user + admin controllers
│       └── team/                       # Team module (stub — only test factories present)
│           └── test/factories/
├── test/unit/                          # Minimal: rpc-exception tests only
├── prisma/                             # Prisma schema for PostgreSQL
└── package.json
```

## Key File Locations

**Entry Points:**
- `flash-pick-service/src/main.ts`
- `processing-flash-pick/src/main.ts`
- `user-service/src/main.ts`

**ETL Core:**
- `processing-flash-pick/src/modules/etl/flash-pick/etl.service.ts`
- `processing-flash-pick/src/modules/etl/flash-pick/ports.ts`

**Product Query Core:**
- `flash-pick-service/src/modules/products/application/queries/products.query.service.ts`

**Auth Guard:**
- `flash-pick-service/src/infrastructure/guards/external-client-auth.guard.ts`

**Shared Cursor Pagination:**
- `flash-pick-service/src/shared/utils/cursor.utils.ts`

**Database Migrations:**
- `flash-pick-service/migrations/clickhouse/`
- `processing-flash-pick/migrations/clickhouse/`
- `user-service/prisma/` (Prisma migrations)
- `processing-flash-pick/prisma/` (Prisma migrations)

**Devops/Infrastructure:**
- `devops/infra/` — infrastructure configs
- `devops/kong/` — Kong API gateway config
- `devops/nginx/` — Nginx config

## Naming Conventions

**Files:**
- `kebab-case.type.ts` — e.g. `products.query.service.ts`, `prisma-writer.ts`, `rpc-exception.filter.ts`
- Test files: `*.spec.ts` under `test/unit/`, `*.e2e-spec.ts` under `test/e2e/`

**Directories:**
- `application/` — DTOs, use-cases
- `domain/` — entities, ports (interfaces), enums
- `infrastructure/` — concrete implementations (Prisma, Kafka, HTTP, crypto)
- `presentation/` — NestJS controllers
- `adapters/` — port implementations inside ETL modules

**Modules:**
- Each feature module exports a NestJS `*.module.ts` barrel

## Where to Add New Code

**New API module (flash-pick-service):**
- Module: `flash-pick-service/src/modules/<name>/`
- Controller: `flash-pick-service/src/modules/<name>/<name>.controller.ts`
- Service: `flash-pick-service/src/modules/<name>/application/queries/<name>.query.service.ts`
- DTOs: `flash-pick-service/src/modules/<name>/application/dto/`
- Unit tests: `flash-pick-service/test/unit/<name>.service.spec.ts`

**New ETL adapter (processing-flash-pick):**
- Port interface: `processing-flash-pick/src/modules/etl/flash-pick/ports.ts`
- Adapter: `processing-flash-pick/src/modules/etl/flash-pick/adapters/<adapter-name>.ts`
- Unit test: `processing-flash-pick/test/unit/modules/etl/flash-pick/adapters/<adapter-name>.spec.ts`

**New user-service use case:**
- Use case: `user-service/src/modules/<module>/application/use-cases/<action>.use-case.ts`
- Domain port: `user-service/src/modules/<module>/domain/ports/<port>.port.ts`
- Infrastructure impl: `user-service/src/modules/<module>/infrastructure/`

**Shared utilities (per service):**
- `<service>/src/shared/utils/` — pure functions, no NestJS deps
- `<service>/src/shared/data/` — data services (catalog, config caches)

**New ClickHouse migration:**
- `<service>/migrations/clickhouse/<YYYYMMDDHHmmss>_<description>/`

## Special Directories

**`generated/prisma/` (flash-pick-service):**
- Purpose: Prisma-generated types (legacy artifact — Prisma is not a runtime dep of this service)
- Generated: Yes
- Committed: Yes (currently, likely an oversight)

**`dist/`:**
- Purpose: TypeScript build output
- Generated: Yes
- Committed: No (gitignored)

**`logs/`:**
- Purpose: Pino log files (pino-roll rotating)
- Generated: Yes
- Committed: No

**`plans/`:**
- Purpose: Implementation plan markdown files for each service
- Generated: No (authored)
- Committed: Yes

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents
- Generated: By `/gsd:map-codebase` command
- Committed: Yes

---

*Structure analysis: 2026-03-20*
