# Milestones

## v1.0 NestJS Backend Template MVP (Shipped: 2026-04-07)

**Phases completed:** 5 phases, 15 plans, 16 tasks

**Key accomplishments:**

- 1. [Rule 1 - Bug] Fixed start:prod path from dist/main to dist/src/main
- Framework-free DDD primitives: Entity<TId> with equals(), AggregateRoot extending Entity, Repository interface, and 4 validated built-in VOs (Id/String/Number/Date) — 19 unit tests passing, zero @nestjs imports
- ConfigModule
- One-liner:
- One-liner:
- One-liner:
- ExampleModule endpoints fully decorated for Scalar UI visibility, HealthController excluded from response envelope, and RedisService get/set/del/expire wrapped with OTel tracing spans using db.system/db.redis.key attributes
- One-liner:
- One-liner:
- Interactive @clack/prompts CLI scaffold engine with CJS tsup build, path-traversal-safe name validation, recursive template copy + replacement, and two bundled template snapshots (postgres/mongo) derived from actual template source and mongo-compatible branch.
- Redis/OTel removal logic and Kafka boilerplate codegen wired into scaffold engine, with 34 passing self-contained unit tests covering all toggle combinations
- One-liner:

---
