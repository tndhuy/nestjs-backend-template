# Technology Stack

**Analysis Date:** 2026-03-20

## Languages

**Primary:**
- TypeScript 5.7.3 - All services (NestJS microservices)
- JavaScript (Node.js) - thotool-sync utility scripts

**Secondary:**
- SQL (PostgreSQL, ClickHouse) - Data definition and migration scripts

## Runtime

**Environment:**
- Node.js 18+ (required by thotool-sync)
- Node 22.19.7 (specified in package.json)

**Package Manager:**
- pnpm (monorepo package manager)
- Lockfile: pnpm-lock.yaml (managed by pnpm)

## Frameworks

**Core:**
- NestJS 11.0.1 - Framework for `flash-pick-service`, `processing-flash-pick`, `user-service`
- Express 5.0.0 - HTTP server (via @nestjs/platform-express)

**API Documentation:**
- Swagger/OpenAPI (@nestjs/swagger 11.2.5) - API documentation in flash-pick-service and user-service
- Scalar API Reference (@scalar/nestjs-api-reference 1.0.23 and 1.1.3) - Interactive API docs

**Testing:**
- Jest 29.7.0 - Unit and E2E testing framework
- ts-jest 29.2.5 - TypeScript transformer for Jest
- Supertest 7.0.0 - HTTP assertion library
- @nestjs/testing 11.0.1 - NestJS test utilities

**Build/Dev:**
- SWC (@swc/cli 0.6.0, @swc/core 1.10.7) - Fast TypeScript/JavaScript compiler
- ts-loader 9.5.2 - TypeScript loader for webpack
- ts-node 10.9.2 - Execute TypeScript directly

**Code Quality:**
- ESLint 9.18.0 - JavaScript/TypeScript linting
- typescript-eslint 8.20.0 - TypeScript-specific linting rules
- Prettier 3.4.2 - Code formatter
- eslint-config-prettier 10.0.1 - Disable conflicting ESLint rules
- eslint-plugin-prettier 5.2.2 - Run Prettier as ESLint rule

## Key Dependencies

**Critical:**

### Databases
- @prisma/client 7.3.0 (processing-flash-pick), 6.5.0 (user-service) - PostgreSQL ORM
- @clickhouse/client 1.16.0 (processing-flash-pick), 1.10.2 (flash-pick-service) - ClickHouse data warehouse client
- mongodb 7.0.0 - MongoDB driver (Bronze layer data storage)
- pg 8.18.0 - PostgreSQL native driver

### Message Queue & Caching
- bullmq 5.67.2 - Redis-backed job queue for task scheduling
- @nestjs/bullmq 11.0.4 - NestJS BullMQ integration
- ioredis 5.9.3 (processing-flash-pick), 5.9.2 (flash-pick-service) - Redis client for caching and job queues

### Messaging & Events
- kafkajs 2.2.4 - Apache Kafka client (inter-service communication)
- @nestjs/microservices 11.1.16 - NestJS microservices support (processing-flash-pick only)

### HTTP & API Clients
- axios 1.13.4 - HTTP client library (all services)
- undici 7.22.0 - High-performance HTTP client (thotool-sync)

### Authentication & Security
- @nestjs/jwt 11.0.0 - JWT token support (user-service)
- @nestjs/passport 11.0.5 - Passport.js integration (user-service)
- passport 0.7.0 - Authentication middleware (user-service)
- passport-jwt 4.0.1 - JWT strategy for Passport (user-service)
- bcrypt 5.1.1 - Password hashing (user-service)
- express-basic-auth 1.2.1 - Basic HTTP authentication for docs endpoints

### Data Validation
- class-validator 0.14.3 - Decorator-based data validation
- class-transformer 0.5.1 - DTO serialization/deserialization

### Utilities
- uuid 13.0.0 (flash-pick-service), 11.1.0 (user-service) - UUID generation
- cookie-parser 1.4.7 - Cookie parsing middleware (user-service)
- exceljs 4.4.0 - Excel file generation (thotool-sync)

### Observability & Logging
- pino 9.7.0 - High-performance JSON logger
- nestjs-pino 4.3.0 - NestJS Pino integration
- pino-http 10.5.0 - HTTP request logging (user-service)
- pino-roll 1.0.0 (processing-flash-pick), 4.0.0 (user-service) - Log file rotation
- pino-pretty 13.0.0 - Pretty-print Pino logs in development

### OpenTelemetry (Distributed Tracing & Metrics)
- @opentelemetry/sdk-node 0.213.0 - Node.js SDK
- @opentelemetry/sdk-trace-node 2.6.0 - Trace SDK
- @opentelemetry/sdk-metrics 2.6.0 - Metrics SDK
- @opentelemetry/exporter-trace-otlp-http 0.213.0 - OTLP HTTP exporter for traces
- @opentelemetry/exporter-prometheus 0.213.0 - Prometheus metrics exporter
- @opentelemetry/auto-instrumentations-node 0.71.0 - Auto-instrumentation for popular packages
- nestjs-otel 8.0.2 - NestJS OpenTelemetry integration (flash-pick-service)

### Rate Limiting
- @nestjs/throttler 6.5.0 - Rate limiting (flash-pick-service, user-service)

### Configuration
- dotenvx 1.52.0 - Environment variable management with encryption support (all services except user-service)
- @nestjs/config 4.0.0 - Configuration module (user-service only)
- dotenv 16.4.5 - Basic environment variable loader (thotool-sync)

### Resilience
- cockatiel 3.2.1 - Retry and circuit breaker patterns (flash-pick-service)

## Configuration

**Environment:**
All services use environment variable configuration with examples in `.env.example` files:

- `processing-flash-pick/.env.example` - Bronze/Silver/Gold DB URLs, Redis, Kafka, Lark webhook
- `flash-pick-service/.env.example` - Gold DB URL, Redis, Lark, OpenTelemetry, external service URLs, Kafka
- `user-service/.env.example` - PostgreSQL URI, JWT secrets, Kafka, webhook configuration
- `thotool-sync/.env.example` - PostgreSQL, thotool.com API token, sync behavior flags

**Build:**
- `tsconfig.json` - TypeScript compiler options in each service
- `jest.config` - Test runner configuration in package.json
- `Dockerfile` - Container images for all three NestJS services

**Secrets Management:**
- dotenvx supports `.env.vault` for encrypted secrets
- Environment variables hold sensitive credentials (not committed to git)

## Platform Requirements

**Development:**
- Node.js 18+
- pnpm package manager
- TypeScript 5.7.3
- Docker & Docker Compose (for running infrastructure: PostgreSQL, MongoDB, Redis, ClickHouse, Kafka, Kong)

**Production:**
- Node.js 22.x LTS
- PostgreSQL 14+ (user-service, processing-flash-pick)
- MongoDB 7.0+ (processing-flash-pick - Bronze layer)
- ClickHouse 24.x (processing-flash-pick, flash-pick-service - Gold layer)
- Redis 7.0+ (caching and job queues)
- Apache Kafka 3.x (inter-service messaging, optional)
- Docker container runtime

---

*Stack analysis: 2026-03-20*
