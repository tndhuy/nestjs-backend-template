# NestJS Backend Template

## What This Is

A production-ready NestJS backend template built on Full DDD architecture, extracted and generalized from the flash-pick-service codebase. Designed for the team to use as a starter kit when bootstrapping new backend services — and to evolve into a CLI package (`npx @team/create-app`) for one-command project scaffolding.

## Core Value

A new backend service should be production-ready in minutes, not days — with DDD structure, API standards, observability, and agent configs already in place.

## Requirements

### Validated

- ✓ NestJS with TypeScript, modular architecture — existing (flash-pick-service)
- ✓ Full DDD layers (domain/application/infrastructure/presentation) — existing (flash-pick-service)
- ✓ Prisma ORM with PostgreSQL — existing (flash-pick-service, user-service)
- ✓ Redis integration — existing (flash-pick-service)
- ✓ Pino structured logging — existing (all services)
- ✓ Global exception filters (HTTP + RPC) — existing (all services)
- ✓ Scalar/Swagger API docs — existing (flash-pick-service, user-service)
- ✓ Docker containerization — existing (all services)
- ✓ OpenTelemetry + Prometheus metrics — existing (flash-pick-service)

### Active

- [ ] Clean generic template scaffold (no business-domain code from flash-pick)
- [ ] Full DDD base classes: Aggregate, Entity, Value Object, Repository interface, Domain Event
- [ ] URI versioning (/api/v1/...) pre-configured
- [ ] Scalar API docs with versioning support
- [ ] Common API standards: response envelope, pagination, error codes
- [ ] Health check endpoints (/health, /health/ready, /health/live)
- [ ] Environment config validation (class-validator on config modules)
- [ ] .agent/ directory with antigravity agent config (context, skills, MCP)
- [ ] .claude/ directory with Claude skills: Understand-Anything + GSD
- [ ] MCP configs pre-wired: context7, docker, lark, context-mode
- [ ] Developer onboarding documentation (README, CONTRIBUTING, architecture guide)
- [ ] CLI package: `npx @team/create-app my-service` scaffolding

### Out of Scope

- Kafka/event streaming setup — too domain-specific, teams add as needed
- ClickHouse integration — analytics layer, not generic backend concern
- Multi-tenancy patterns — adds complexity, out of scope for v1 template
- Frontend (Next.js, React) — backend only

## Context

**Source codebase:** `flash-pick-service` in this workspace is the reference implementation. It already has the patterns we want — the task is extraction, generalization, and documentation.

**Existing patterns to preserve:**
- Port/Adapter pattern for dependency inversion (ports as interfaces injected via DI)
- Value Objects: `StringValueObject`, `NumberValueObject`, `IdValueObject` in `src/shared/valueobjects/`
- Aggregate Root with domain events: `src/shared/aggregate-root.ts`
- Global validation pipe + class-validator DTOs
- Rate limiting via ThrottlerModule
- JWT auth pattern (from user-service)

**Agent ecosystem:** Team uses two AI coding assistants — Claude Code (`.claude/`) and Antigravity (`.agent/`). Both need project-scoped configs with context files, skills, and MCP server configs. Template should ship with both pre-configured.

**End goal:** This template becomes the team's standard. Every new backend service starts from here. Eventually wrap as CLI package so `npx @team/create-app` generates a ready-to-run project.

## Constraints

- **Tech Stack**: NestJS + TypeScript + Prisma + PostgreSQL + Redis — locked, this is the team standard
- **DDD Depth**: Full DDD (Aggregate, Entity, Value Object, Repository, Domain Event) — not negotiable
- **Naming**: Follow existing conventions from flash-pick-service (camelCase files, kebab-case directories)
- **Node**: pnpm package manager (consistent with existing workspace)
- **Agent Config**: Must support both `.agent/` (antigravity) and `.claude/` (Claude Code) simultaneously

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Based on flash-pick-service (not user-service) | flash-pick has more complete DDD patterns and infrastructure | — Pending |
| URI versioning (/api/v1/) over header versioning | Easier to test, more visible in logs, team preference | — Pending |
| Template-first, CLI-second | Ship usable template fast; CLI wrapper added in later phase | — Pending |
| Scalar over plain Swagger UI | Scalar is already used in existing services, better DX | — Pending |
| pnpm workspace | Consistent with all existing services in this repo | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase:** Move completed requirements to Validated, add new decisions to Key Decisions table.

---
*Last updated: 2026-03-23 after initialization*
