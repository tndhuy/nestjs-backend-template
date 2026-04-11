# {{SERVICE_NAME_KEBAB}}

Production-ready NestJS 11 backend service based on DDD architecture.

## Architecture Overview

This project follows **Domain-Driven Design (DDD)** principles with four distinct layers:

1.  **Domain:** Core logic, Entities, Value Objects, and Repository interfaces. (No framework dependencies)
2.  **Application:** Command/Query handlers (CQRS), DTOs, and application services.
3.  **Infrastructure:** Database implementations (Prisma/Mongoose), Redis cache, and external integrations.
4.  **Presenter:** Controllers (HTTP/RPC), Interceptors, and Filters.

## Features

- **Pino Logging:** High-performance logging with request context tracking.
- **Request ID:** Every request is assigned a unique `X-Request-Id` header for traceability.
- **OpenTelemetry:** Distributed tracing and Prometheus metrics (if enabled).
- **Circuit Breaker:** Resilience for Redis and external calls using Cockatiel.
- **API Reference:** Interactive Scalar documentation available at `/docs`.

## Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
```

### 2. Infrastructure

Start database and cache using Docker:

```bash
docker compose up -d
```

### 3. Database Setup

{{#IF_PRISMA}}
```bash
# Generate Prisma Client
npm run db:generate

# Apply migrations
npm run db:migrate:deploy
```
{{/IF_PRISMA}}
{{#IF_MONGOOSE}}
Ensure your `MONGODB_URL` is correct in `.env`.
{{/IF_MONGOOSE}}

### 4. Running the App

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

## Logging & Observability

- **Console:** Pretty-printed logs in development mode.
- **Files:** Logs are automatically rotated and stored in the `logs/` directory.
- **Correlation:** Search for `requestId` in logs to trace all logs for a specific user request.

## Available Scripts

- `npm run build`: Compile the project.
- `npm run start:dev`: Start in watch mode.
- `npm run test`: Run unit tests.
- `npm run test:e2e`: Run end-to-end tests.
- `npm run lint`: Fix code style issues.
