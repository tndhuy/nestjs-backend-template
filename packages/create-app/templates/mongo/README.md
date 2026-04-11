# nestjs-backend-template

## Overview

- Production-ready NestJS 11 template with Domain-Driven Design (DDD) architecture — four layers (Domain, Application, Infrastructure, Presenter) with CQRS via `@nestjs/cqrs`
- Pre-configured infrastructure: Prisma ORM, ioredis with circuit breaker, OpenTelemetry tracing and Prometheus metrics, Scalar API docs at `/docs`
- Agent-ready: Claude Code (`.claude/`) and Antigravity (`.agent/`) configs pre-wired with codebase context files and GSD skill

## Quick Start

1. **Clone the repository**

   ```bash
   git clone <repo-url> my-service && cd my-service
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set at minimum:
   - `DATABASE_URL` — MongoDB connection string
   - `REDIS_URL` — Redis connection string

4. **Start infrastructure**

   ```bash
   docker compose up -d
   ```

   Starts MongoDB and Redis locally.

5. **Start the server**

   ```bash
   pnpm dev
   ```

   Server starts at http://localhost:3000. API docs available at http://localhost:3000/docs (login: `admin` / `admin`).

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm start:dev` | Start in watch mode (development) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start:prod` | Run compiled build (`dist/src/main`) |
| `pnpm test` | Run unit tests with Jest |
| `pnpm test:cov` | Run tests with coverage report |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm lint` | Run ESLint with auto-fix |
| `pnpm format` | Run Prettier on `src/` and `test/` |
| `pnpm db:generate` | Generate Prisma Client from schema |
| `pnpm db:sync` | Sync Prisma schema to MongoDB (`prisma db push`) |
| `pnpm db:sync:force` | Force sync schema with destructive changes (`--accept-data-loss`) |
| `pnpm db:push` | Push schema changes directly to database (no migration files) |
| `pnpm db:pull` | Pull database schema into `prisma/schema/` |
| `pnpm db:validate` | Validate Prisma schema and datasource config |
| `pnpm db:format` | Format Prisma schema files under `prisma/schema/` |
| `pnpm db:studio` | Open Prisma Studio for data browsing/editing |

## MongoDB Schema Workflow

Prisma migrations are not used for MongoDB in this template.

1. Edit schema files in `prisma/schema/`
2. Run `pnpm db:format`
3. Run `pnpm db:validate`
4. Run `pnpm db:sync` (or `pnpm db:sync:force` when explicitly needed)
5. Run `pnpm db:generate`

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PORT` | No | HTTP server port | `3000` |
| `NODE_ENV` | No | Environment (`development` / `production`) | `development` |
| `DATABASE_URL` | Yes | MongoDB connection string | — |
| `REDIS_URL` | Yes | Redis connection string | — |
| `API_VERSION` | No | API version for URI prefix | `1` |
| `APP_NAME` | No | Application name shown in Scalar docs | `NestJS Backend Template` |
| `APP_DESCRIPTION` | No | API description shown in Scalar docs | `API Documentation` |
| `REQUEST_TIMEOUT` | No | Request timeout in milliseconds | `30000` |
| `THROTTLE_TTL` | No | Rate limit window in seconds | `60` |
| `THROTTLE_LIMIT` | No | Max requests per window | `100` |
| `DOCS_USER` | No | Basic auth username for `/docs` | `admin` |
| `DOCS_PASS` | No | Basic auth password for `/docs` | `admin` |
| `OTEL_ENABLED` | No | Enable OpenTelemetry tracing and metrics | `false` |
| `OTEL_SERVICE_NAME` | No | Service name reported to OTel collector | `nestjs-backend-template` |
| `OTEL_PROMETHEUS_PORT` | No | Port for Prometheus metrics scrape endpoint | `9464` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | OTLP HTTP endpoint for trace export | `http://localhost:4318` |
| `LARK_APP_ID` | No | Lark app ID for MCP integration (agent use) | — |
| `LARK_APP_SECRET` | No | Lark app secret for MCP integration (agent use) | — |

## Architecture

This template follows Domain-Driven Design (DDD) with four layers: Domain, Application, Infrastructure, and Presenter. Each domain module is fully self-contained under `src/<module>/` and communicates through the CQRS bus.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full guide including layer rules, data flow, and the `ExampleModule` walkthrough.

## Adding a New Module

Each new domain module follows the same DDD structure as `src/example/`. Follow the step-by-step walkthrough in [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Tech Stack

- **NestJS** 11.0.1 — framework (Express 5 platform)
- **Prisma** 7.5.0 — MongoDB ORM with schema sync (`db push`)
- **ioredis** 5.10.1 — Redis client with cockatiel circuit breaker
- **Pino** / nestjs-pino — structured JSON logging
- **OpenTelemetry** SDK — distributed tracing (OTLP) and Prometheus metrics
- **Scalar** (@scalar/nestjs-api-reference) — interactive API docs
- **class-validator** / **class-transformer** — DTO validation and transformation
- **@nestjs/cqrs** 11.0.3 — command and query bus
- **@nestjs/throttler** 6.5.0 — global rate limiting
- **TypeScript** 5.7.3

## License

UNLICENSED
