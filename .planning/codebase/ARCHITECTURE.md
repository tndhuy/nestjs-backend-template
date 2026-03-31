# Architecture

**Analysis Date:** 2026-03-20

## Pattern Overview

**Overall:** Modular Microservices Architecture with Domain-Driven Design (DDD)

**Key Characteristics:**
- Three independent NestJS services operating as microservices (flash-pick-service, processing-flash-pick, user-service)
- Service-to-service communication via Kafka for event-driven workflows
- Layered architecture within each service: presentation → application → domain → infrastructure
- Port/Adapter pattern for database abstraction and dependency injection
- Shared infrastructure components (logging, error handling, validation)

## Layers

**Presentation Layer:**
- Purpose: HTTP request handling, Swagger documentation, request validation
- Location: `src/main.ts`, `src/*/presentation/*`, `src/app.controller.ts`, `src/specs.controller.ts`
- Contains: REST controllers, request/response DTOs, swagger decorators
- Depends on: Application layer, Shared validation
- Used by: HTTP clients and API consumers

**Application Layer:**
- Purpose: Business logic orchestration, use cases, and query services
- Location: `src/modules/*/application/*`, `src/modules/*/queries/*`, `src/modules/*/commands/*`
- Contains: Use case classes, query services, command handlers
- Depends on: Domain layer, Infrastructure ports
- Used by: Presentation layer

**Domain Layer:**
- Purpose: Core business rules, value objects, entities, aggregates
- Location: `src/shared/core/*`, `src/shared/valueobjects/*`, `src/modules/*/domain/*`
- Contains: Business rules, value objects (NumberValueObject, StringValueObject, IdValueObject), aggregates, ports (interfaces)
- Depends on: Nothing (pure domain logic)
- Used by: Application layer

**Infrastructure Layer:**
- Purpose: External system integrations (databases, caches, message queues, APIs)
- Location: `src/infrastructure/*`
- Contains: Database clients (Prisma, ClickHouse, MongoDB), Redis cache, BullMQ queues, Kafka producers, HTTP clients (axios)
- Depends on: Domain ports/interfaces
- Used by: Application and presentation layers

**Shared Layer:**
- Purpose: Cross-cutting concerns and utilities
- Location: `src/shared/*`
- Contains: Logger (pino), validation rules, DTO schemas, decorators, error handling, utilities
- Depends on: Nothing (utility layer)
- Used by: All layers

## Data Flow

**Flash Pick Search Flow (flash-pick-service):**

1. User initiates search request → SearchController
2. SearchQueryService composes response from multiple modules (ProductsModule, AnalyticsModule, DiscountTypesModule, CategoriesModule)
3. Each module queries ClickHouse (via read-only ports) for product data
4. Response aggregated with discount type configuration and category catalog
5. Analytics event tracked asynchronously
6. Response returned with pagination and filters applied

**Data Processing Flow (processing-flash-pick):**

1. External Shopee API data ingested (scheduled or event-triggered)
2. MongoFlashPickRawLoader reads raw data from MongoDB
3. ShopeeFlashPickMapper transforms data to domain model
4. BasicFlashPickValidator applies business rules
5. PrismaFlashPickWriter stores to PostgreSQL (Silver layer)
6. ClickHouseFlashPickGoldWriter materializes to ClickHouse (Gold layer)
7. PrismaFlashPickWatermarkStore tracks processing state
8. Dead letter store captures validation failures

**User Authentication Flow (user-service):**

1. User submits credentials → AuthController
2. LoginUseCase validates credentials via BcryptPasswordHasher
3. JwtStrategy generates JWT token via PrismaTokenRepository
4. Token stored in database for refresh capability
5. Subsequent requests include JWT in Authorization header
6. JwtAuthGuard validates token globally (via APP_GUARD)
7. User context available via @CurrentUser() decorator

**State Management:**
- Service state: Stateless HTTP handlers with external state stores
- Application state: Managed via ports (dependency inversion)
- Persistent state: PostgreSQL (Prisma) for transactional data, ClickHouse for analytical queries, MongoDB for raw data staging
- Cache state: Redis for session/query caching via BullMQ queue consumers
- Event state: Kafka topics for service-to-service communication (Kafka producer in user-service broadcasts user events)

## Key Abstractions

**Port/Adapter Pattern:**
- Purpose: Decouple domain logic from infrastructure implementation details
- Examples: `src/modules/etl/flash-pick/ports/*`, `src/modules/auth/domain/ports/*`
- Pattern: Define ports as interfaces (PASSWORD_HASHER_PORT, TOKEN_STORE_PORT, FLASH_PICK_RAW_LOADER), inject adapters implementing ports

**Value Objects:**
- Purpose: Type-safe domain primitives with validation
- Examples: `src/shared/valueobjects/string.valueobject.ts`, `src/shared/valueobjects/number.valueobject.ts`, `src/shared/valueobjects/id.valueobject.ts`
- Pattern: Immutable, validated in constructor, used for domain properties

**Aggregate Root:**
- Purpose: Entity boundary for domain consistency
- Examples: `src/shared/aggregate-root.ts`, `src/shared/core/aggregate/aggregate-utils.ts`
- Pattern: Coordinates transaction boundaries, manages invariants

**Domain Events:**
- Purpose: Event sourcing and eventual consistency between services
- Examples: `src/shared/domain-event.ts`
- Pattern: Raised after state changes, published to Kafka for other services

**Service Modules:**
- Purpose: Feature cohesion and encapsulation
- Examples: SearchModule (flash-pick-service), EtlModule (processing-flash-pick), AuthModule + UserModule (user-service)
- Pattern: Import dependencies, export facades, hide internal implementation

## Entry Points

**Flash Pick Service:**
- Location: `src/main.ts`
- Triggers: HTTP requests to /api/v1/* endpoints
- Responsibilities:
  - Searches via SearchController and SearchQueryService
  - Product/category browsing via ProductsModule
  - Analytics tracking via AnalyticsModule
  - Discount type configuration via DiscountTypesModule
  - Global rate limiting (Throttler), OpenTelemetry instrumentation, Swagger docs at /docs

**Processing Flash Pick Service:**
- Location: `src/main.ts`
- Triggers: ETL job executions (scheduled or manual)
- Responsibilities:
  - Ingest Shopee Flash Pick data
  - Transform raw data to business model via EtlModule
  - Persist to silver (PostgreSQL) and gold (ClickHouse) layers
  - Track watermarks and failed records

**User Service:**
- Location: `src/main.ts`
- Triggers: HTTP requests to /api/v1/* endpoints
- Responsibilities:
  - User registration/login via AuthController
  - User profile management via UserModule
  - Team management via TeamModule
  - External connector setup via ConnectorModule
  - JWT token validation globally via JwtAuthGuard

## Error Handling

**Strategy:** Hierarchical exception filtering and graceful degradation

**Patterns:**
- Global exception filters: `src/common/filters/http-exceptions.filter.ts`, `src/common/filters/rpc-exception.filter.ts`
- HttpException for HTTP errors (4xx, 5xx), RpcException for microservice communication
- Validation pipe rejects invalid DTOs with 400 Bad Request
- Throttler returns 429 Too Many Requests
- Timeout interceptor kills long-running requests (configurable)
- Unhandled rejections and uncaught exceptions logged to stderr and exits gracefully
- Dead letter stores capture processing failures (processing-flash-pick)

## Cross-Cutting Concerns

**Logging:** Pino logger (nestjs-pino) configured in `src/shared/logger/logger.module.ts` with custom Lark transport for alerting

**Validation:** class-validator decorators on DTOs, custom validation rules in `src/shared/core/validator-rules/validator-rule.ts`

**Authentication:** JWT-based via Passport.js in user-service, token stored in database, validated globally on every request (except @Public() routes)

**Rate Limiting:** ThrottlerModule global guard (100 req/60s default, overrideable per endpoint with @Throttle())

**Observability:** OpenTelemetry instrumentation (host metrics, span traces), Prometheus metrics export (port 9464), conditionally enabled via OTEL_ENABLED env var

**API Documentation:** Swagger/Scalar docs with basic auth protection, API reference at /docs (flash-pick, user-service) or /user-docs (user-service)

---

*Architecture analysis: 2026-03-20*
