# NestJS Backend Template

## What This Is

A production-ready NestJS 11 backend template built on Full DDD architecture, designed for the team to use as a starter kit when bootstrapping new backend services. Ships with framework-free DDD primitives, URI-versioned REST API, Scalar docs, OpenTelemetry observability, Redis, Prisma/PostgreSQL (or MongoDB), and a CLI package (`npx @team/create-app`) for one-command project scaffolding with database selection and optional module toggles.

## Core Value

A new backend service should be production-ready in minutes, not days — with DDD structure, API standards, observability, and agent configs already in place.

## Requirements

### Validated

- ✓ NestJS with TypeScript, modular architecture — v1.0
- ✓ Full DDD layers (domain/application/infrastructure/presentation) — v1.0
- ✓ Prisma ORM with PostgreSQL — v1.0
- ✓ Redis integration — v1.0
- ✓ Pino structured logging — v1.0
- ✓ Global exception filters (HTTP + RPC) — v1.0
- ✓ Scalar/Swagger API docs — v1.0
- ✓ Docker containerization — v1.0
- ✓ OpenTelemetry + Prometheus metrics — v1.0
- ✓ Clean generic template scaffold (no business-domain code) — v1.0
- ✓ Full DDD base classes: Aggregate, Entity, Value Object, Repository interface, Domain Event — v1.0
- ✓ URI versioning (/api/v1/...) pre-configured — v1.0
- ✓ Common API standards: response envelope, pagination, error codes — v1.0
- ✓ Health check endpoints (/health, /health/ready, /health/live) — v1.0
- ✓ Environment config validation — v1.0
- ✓ .agent/ directory with Antigravity agent config — v1.0
- ✓ .claude/ directory with Claude Code skills and GSD — v1.0
- ✓ MCP configs pre-wired: context7, docker, lark, context-mode — v1.0
- ✓ Developer onboarding documentation (README, CONTRIBUTING, architecture guide) — v1.0
- ✓ CLI package: `npx @team/create-app my-service` with database selection and module toggles — v1.0

### Active

(None — v1.0 complete. Define next milestone with `/gsd-new-milestone`)

### Out of Scope

- Kafka/event streaming setup — too domain-specific, teams add as needed
- ClickHouse integration — analytics layer, not generic backend concern
- Multi-tenancy patterns — adds complexity, out of scope for v1 template
- Frontend (Next.js, React) — backend only

## Current State

**Version shipped:** v1.0 (2026-04-07)

**Packages:**
- `src/` — NestJS DDD template (root package, uses npm)
- `packages/create-app/` — `@team/create-app` CLI scaffold package

**Tech stack:** NestJS 11, TypeScript, Prisma (PostgreSQL) or Mongoose (MongoDB), Redis, Pino, OpenTelemetry, Scalar, tsup

**Test coverage:** 34 unit tests (scaffold engine) + 1 smoke test suite (2 e2e scenarios)

**CLI:** Published to GitHub Packages registry as `@team/create-app`

## Context

**Agent ecosystem:** Both Claude Code (`.claude/`) and Antigravity (`.agent/`) configured with pre-wired MCP servers, context files, and skills.

**Template variants:** Two full template snapshots bundled in CLI: postgres (Prisma + PostgreSQL) and mongo (Mongoose + MongoDB).

**Module toggles:** Redis, OTel can be removed; Kafka module can be generated — all wired into interactive CLI prompts.

## Constraints

- **Tech Stack**: NestJS + TypeScript + Prisma/Mongoose — locked, this is the team standard
- **DDD Depth**: Full DDD (Aggregate, Entity, Value Object, Repository, Domain Event) — not negotiable
- **Naming**: kebab-case directories, camelCase files
- **Package manager**: npm (root workspace with packages/*)
- **Agent Config**: Must support both `.agent/` (Antigravity) and `.claude/` (Claude Code) simultaneously

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Based on flash-pick-service (not user-service) | flash-pick has more complete DDD patterns and infrastructure | ✓ Good — clean extraction worked |
| URI versioning (/api/v1/) over header versioning | Easier to test, more visible in logs, team preference | ✓ Good — confirmed team preference |
| Template-first, CLI-second | Ship usable template fast; CLI wrapper added in later phase | ✓ Good — shipped CLI in Phase 5 |
| Scalar over plain Swagger UI | Scalar is already used in existing services, better DX | ✓ Good — consistent with team tools |
| npm workspace (not pnpm) | Consistent with root package.json | ✓ Good — no workspace conflicts |
| Two full template snapshots (postgres + mongo) over single base + patch | Simpler scaffold logic, deterministic output | ✓ Good — offline-capable, no git clone at runtime |
| CJS output for tsup (not ESM) | reflect-metadata compatibility in generated projects | ✓ Good — required for NestJS decorators |
| Bundled template snapshots (not runtime git clone) | Offline-capable, deterministic, no auth needed | ✓ Good — simpler for team adoption |
| @clack/prompts for CLI UX | Consistent, polished terminal UX with cancel handling | ✓ Good — isCancel() guard pattern proven |
| GitHub Packages registry for @team scope | Private team registry, automatic GITHUB_TOKEN auth in CI | ✓ Good — zero external service dependency |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-04-07 after v1.0 milestone*
