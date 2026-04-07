---
plan: 02-02
phase: 02-ddd-foundation-infrastructure
status: complete
completed: 2026-03-27
---

## Summary

Implemented all infrastructure modules: ConfigModule (fail-fast env validation), DatabaseModule (Prisma v7 with @prisma/adapter-pg), CacheModule (Redis with constructor-initialized ioredis and circuit breaker), and HealthModule (terminus endpoints for Prisma and Redis).

## What Was Built

**ConfigModule** — `src/infrastructure/config/`
- `EnvironmentVariables` class with class-validator decorators for `DATABASE_URL`, `REDIS_URL`, `PORT`, `NODE_ENV`
- `AppConfigModule` wrapping `@nestjs/config` with `isGlobal: true` and fail-fast validation

**DatabaseModule** — `src/infrastructure/database/`
- `PrismaService` extending `PrismaClient` with Prisma v7 `@prisma/adapter-pg` adapter
- `DatabaseModule` decorated `@Global()`, exports `PrismaService`
- `@InjectPrisma()` decorator for DI

**CacheModule** — `src/infrastructure/cache/`
- `RedisService` with ioredis client initialized in constructor (eliminates race condition)
- Cockatiel circuit breaker wrapping all Redis operations
- `CacheModule` decorated `@Global()`, exports `RedisService`
- `@InjectRedis()` decorator for DI

**HealthModule** — `src/infrastructure/health/`
- `PrismaHealthIndicator` using tagged template `$queryRaw` (not `$queryRawUnsafe`)
- `RedisHealthIndicator` using `PING` command
- `HealthController` at `/health` endpoint
- `HealthModule` importing `TerminusModule`

**Prisma v7 Config** — `prisma.config.ts`
- `defineConfig` with datasource URL fallback for CI environments without `DATABASE_URL`
- `prisma/schema.prisma` updated — `url` field removed from datasource block (v7 breaking change)

## Key Decisions

- Used `@prisma/adapter-pg` (not `pg` pool directly) for Prisma v7 compatibility
- Redis circuit breaker uses `cockatiel.circuitBreaker(handleAll, { halfOpenAfter, breaker })` API (not `handleAll.circuitBreaker()`)
- `process.env.DATABASE_URL ?? 'postgresql://localhost:5432/app'` fallback in `prisma.config.ts` allows `prisma generate` without env vars in CI

## Verification

- `npx tsc --noEmit` — passes clean
- `pnpm test` — 19/19 tests pass
- `npx prisma generate` — succeeds with v7 schema
- Zero `@nestjs` imports in infrastructure adapters (constructor-based init only)

## Commits

- `7b45bbe` feat(02-02): ConfigModule with fail-fast env validation
- `18a8b52` feat(02-02): DatabaseModule (Prisma v7), CacheModule (Redis), HealthModule with terminus
