# Retrospective

## Milestone: v1.0 — NestJS Backend Template MVP

**Shipped:** 2026-04-07
**Phases:** 5 | **Plans:** 15 | **Timeline:** 2026-03-31 → 2026-04-07 (7 days)

### What Was Built

1. NestJS 11 DDD skeleton with ExampleModule (Item domain) demonstrating full CQRS structure
2. Framework-free DDD primitives: `Entity<TId>`, `AggregateRoot`, `Repository` interface, 4 built-in VOs — 19 unit tests, zero `@nestjs` imports
3. URI-versioned REST API (`/api/v1/`), response envelope, pagination, AppException hierarchy
4. Scalar docs at `/docs`, Pino structured logging, OpenTelemetry + Prometheus (feature-flagged)
5. Claude Code + Antigravity agent configs with pre-wired MCP servers (context7, docker, lark, context-mode)
6. `@team/create-app` CLI — interactive scaffold with PostgreSQL/MongoDB selection, Redis/OTel/Kafka toggles, GitHub Packages publish pipeline

### What Worked

- **GSD phased planning** — breaking into 5 phases with 3 plans each kept execution focused and atomic
- **Bundled template snapshots** — offline-capable, deterministic, no runtime git clone needed
- **TDD for scaffold engine** — 34 self-contained unit tests with temp dirs caught edge cases before integration
- **guardCancel pattern** — wrapping every `@clack/prompts` call cleanly handled Symbol cancellation
- **DDD base class extraction** — framework-free approach means domain tests run without NestJS bootstrap
- **CJS output for tsup** — explicit CJS format decision prevented reflect-metadata issues upfront

### What Was Inefficient

- Milestone audit ran before phases 3-5 were executed, producing stale gap data
- Branch confusion during Phase 5 Plan 02 execution (commits routed to wrong branch, needed reset)
- REQUIREMENTS.md had no traceability checkboxes — couldn't auto-detect completion status

### Patterns Established

- `guardCancel<T>`: wrap every `@clack/prompts` call to handle Symbol cancellation
- `safeDeleteFile`/`safeDeleteDir`: path resolution + `startsWith(destDir)` guard before any filesystem deletion
- Deepest-first path rename: collect all paths, sort by depth desc before renaming (avoids parent-invalidation)
- Binary file detection via null byte scan before UTF-8 content replacement
- Module toggle functions idempotent: calling twice does not corrupt output

### Key Lessons

- Ship stale audit fixes early — re-run `/gsd-audit-milestone` after all phases complete before `/gsd-complete-milestone`
- Template sync script (`sync-templates.sh`) should be run on a schedule as the source template evolves
- `.npmrc` with `${NODE_AUTH_TOKEN}` placeholder + negation gitignore pattern is the clean way to handle scoped registry auth

### Cost Observations

- Sessions: ~6 working sessions
- Most expensive: Phase 5 Plan 01 (template snapshot bundling, 175 files)
- Most efficient: Phase 5 Plan 03 (publishing + smoke tests, 15 min)

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 5 |
| Plans | 15 |
| Days | 7 |
| Files changed | 288 |
| Tests added | 35+ |
| Deviations from plan | 0 |
