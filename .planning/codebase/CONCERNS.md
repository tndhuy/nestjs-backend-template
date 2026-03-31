# Codebase Concerns

**Analysis Date:** 2026-03-20

## Tech Debt

**Legacy offset cursor still supported in flash-pick-service:**
- Issue: `cursor.utils.ts` detects plain numeric strings (e.g. `"20"`, `"40"`) as legacy offset cursors and still executes offset-based pagination via `parseLegacyOffset()`. This is a compatibility shim that keeps SQL `OFFSET` queries alive, which do not scale on large ClickHouse tables.
- Files: `flash-pick-service/src/shared/utils/cursor.utils.ts`, `flash-pick-service/src/modules/products/application/queries/products.query.service.ts`
- Impact: Any client still sending numeric cursors bypasses keyset pagination, causing full table scans at high offsets.
- Fix approach: Audit external clients for usage of numeric cursors, set a deprecation date, and remove `isLegacyOffsetCursor` / `parseLegacyOffset` once migration is confirmed.

**`generated/prisma/` committed to flash-pick-service:**
- Issue: `flash-pick-service/generated/prisma/` exists and is committed, but Prisma is not a runtime dependency of this service (it has no `@prisma/client` in its `package.json`). This is a leftover artifact.
- Files: `flash-pick-service/generated/prisma/`
- Impact: Dead code in the repo creates confusion about the data layer. May mislead new developers into thinking Prisma is used here.
- Fix approach: Remove the directory and add it to `.gitignore`.

**Shared `src/shared/` code duplicated across services:**
- Issue: `aggregate-root.ts`, `shared/core/` (DDD base classes), `shared/logger/`, `shared/valueobjects/` are nearly identical across `flash-pick-service` and `processing-flash-pick`. Pino logger config including the Lark transport appears duplicated in all three services.
- Files: `flash-pick-service/src/shared/`, `processing-flash-pick/src/shared/`, `user-service/src/shared/logger/`
- Impact: Bug fixes or updates to shared logic must be applied in multiple places. Lark transport config (`lark.transport.ts`) exists in all three services independently.
- Fix approach: Extract shared code into internal packages or a shared library within the monorepo. Consider using a `packages/` directory with npm workspace linking.

**No monorepo workspace manager:**
- Issue: The repo has no `pnpm-workspace.yaml` or root `package.json` linking the services together. Each service is a fully independent Node.js project with its own `node_modules`. Dependencies like NestJS, pino, kafkajs are installed separately per service.
- Impact: Large disk footprint, dependency version drift between services (e.g. `@prisma/client` is `^6.5.0` in user-service but `^7.3.0` in processing-flash-pick), no unified scripts to run all tests.
- Fix approach: Add a root `pnpm-workspace.yaml` listing the three services. Hoist common devDependencies.

## Known Bugs / Edge Cases Guarded in Tests

**Empty `item_id` produces no `nextCursor` (H1 guard):**
- Symptoms: If ClickHouse returns rows with empty/null `item_id`, a nextCursor must not be generated — an empty string passed to ClickHouse's `UInt64` param causes a query error on the follow-up request.
- Files: `flash-pick-service/src/modules/products/application/queries/products.query.service.ts`
- Test: `flash-pick-service/test/unit/products.query.service.spec.ts` — "does not generate cursor when item_id is empty (H1 guard)"

**ClickHouse datetime format lacks timezone suffix (M5 fix):**
- Symptoms: ClickHouse returns datetimes as `"2026-02-09 00:00:00"` (no `T` separator, no `Z`). Without normalization this produces invalid ISO-8601 output.
- Files: `flash-pick-service/src/modules/products/application/queries/products.query.service.ts`
- Test: "normalises ClickHouse datetime without timezone suffix (M5 fix)"

**UUID job ID causes BigInt conversion crash (C2 BigInt guard):**
- Symptoms: `jobTracker.start()` may return a UUID string. Calling `BigInt(uuid)` without a digit-only guard throws `SyntaxError`.
- Files: `processing-flash-pick/src/modules/etl/flash-pick/etl.service.ts`
- Test: `processing-flash-pick/test/unit/modules/etl/flash-pick/etl.service.spec.ts` — "does not throw when job ID is a UUID (C2 BigInt guard)"

## Security Considerations

**Token hash transmitted internally instead of raw token:**
- The `ExternalClientAuthGuard` (`flash-pick-service/src/infrastructure/guards/external-client-auth.guard.ts`) hashes the Bearer token with SHA-256 before forwarding to the internal client verifier. This is deliberate — raw token never crosses internal network boundaries. Pattern is sound but relies on the internal endpoint also comparing against the hash (must stay in sync).

**Client IP extraction fallback chain:**
- Files: `flash-pick-service/src/infrastructure/guards/external-client-auth.guard.ts`
- Risk: `request.ip || request.connection?.remoteAddress` — `request.ip` in Express reflects `X-Forwarded-For` only if `app.set('trust proxy', true)` is configured. If reverse proxy config is wrong, client IP for checksum validation will be the proxy IP, not the real client.
- Current mitigation: Checksum validation still occurs; only IP-bound checks would fail silently.
- Recommendation: Verify `trust proxy` is set correctly in nginx/Kong config.

**No rate limiting visible on external API endpoints:**
- `@nestjs/throttler` is a dependency of `flash-pick-service` and `user-service`, but application of `@UseGuards(ThrottlerGuard)` was not confirmed on external-api routes. If not applied, external clients can issue unlimited requests.
- Files: `flash-pick-service/src/modules/external-api/presentation/external-products.controller.ts`
- Recommendation: Audit `@UseGuards` decorators on external-facing controllers.

## Performance Bottlenecks

**Dynamic SQL assembly in `ProductsQueryService.findAll`:**
- Problem: Every request dynamically builds a ClickHouse SQL query string with conditional filter fragments and params. The query is not cached or compiled — it is assembled fresh per request.
- Files: `flash-pick-service/src/modules/products/application/queries/products.query.service.ts`
- Impact: Complexity grows with filter combinations. Heavy string operations per request. No query plan reuse.
- Improvement path: Parameterization is already used (ClickHouse `{param:Type}` syntax), so SQL injection is not a risk. Consider caching compiled query templates for common filter combinations.

**Category expansion on every product query:**
- Problem: `CategoryCatalogService.expandCategoryIds()` is called inline during `findAll`, expanding parent category IDs to include all descendants. If this hits Redis or a data structure on every call, it adds latency.
- Files: `flash-pick-service/src/shared/data/category-catalog.service.ts`, `flash-pick-service/src/modules/products/application/queries/products.query.service.ts`
- Improvement path: Confirm that the catalog is loaded into memory at startup (seed at module init), not re-fetched per request.

**ETL batch fallback to per-record writes on batch failure:**
- Problem: When a batch write to ClickHouse/Prisma fails, `FlashPickEtlService` falls back to writing each record individually. Under high load this can cause N individual writes instead of 1 batch write.
- Files: `processing-flash-pick/src/modules/etl/flash-pick/etl.service.ts`
- Impact: Acceptable as a resilience pattern, but can significantly slow processing under write errors.
- Improvement path: Add circuit breaker or backoff before entering per-record fallback.

## Fragile Areas

**`team` module in user-service is a stub:**
- Files: `user-service/src/modules/team/` — contains only `test/factories/` subdirectory and a `CLAUDE.md`
- Why fragile: Module has no implementation. Any code that imports or depends on a team module will fail.
- Safe modification: Add a full module implementation before wiring it into `app.module.ts`.

**`processing-flash-pick` Prisma version mismatch:**
- Files: `processing-flash-pick/package.json` — `@prisma/client: ^7.3.0` vs `user-service/package.json` — `@prisma/client: ^6.5.0`
- Why fragile: Breaking changes between Prisma major versions. Generated types may diverge. Schema changes tested against one version may fail on the other.
- Safe modification: Pin both services to the same Prisma major version. Test migrations on both.

**ETL watermark update is a single point of failure:**
- Files: `processing-flash-pick/src/modules/etl/flash-pick/etl.service.ts`, `processing-flash-pick/src/modules/etl/flash-pick/adapters/prisma-watermark.store.ts`
- Why fragile: If the watermark store update fails after a successful batch write, the next run re-processes already-written documents. The `markProcessed` flag on MongoDB documents provides a secondary deduplication layer, but only when `markProcessed: true` is passed to `run()`.
- Test coverage: Covered for happy path and dry-run; partial coverage for failure during watermark update.

## Missing Critical Features

**No integration/contract tests between services:**
- Problem: Services communicate via Kafka request-reply (`flash-pick-service` → `user-service` for client verification). There are no shared contract tests validating the Kafka message schema is compatible between producer and consumer.
- Blocks: Schema drift between services goes undetected until runtime.

**No CI/CD pipeline configuration found:**
- Problem: No `.github/`, `.gitlab-ci.yml`, or CI config files detected in the repository root or service directories.
- Blocks: No automated test runs on PR, no deployment pipeline validation.

**`user-service` has minimal unit test coverage:**
- Files: `user-service/test/unit/` — only two spec files: `rpc-exception-filter.spec.ts` and `rpc-exception.spec.ts`
- Risk: All auth, user, and connector use-cases have zero unit test coverage. Auth logic bugs (JWT handling, bcrypt, token refresh) could go undetected.
- Priority: High

## Test Coverage Gaps

**`user-service` use-cases entirely untested:**
- What's not tested: `login.use-case.ts`, `register.use-case.ts`, `refresh-token.use-case.ts`, `verify-request.use-case.ts`, all `user/` use-cases
- Files: `user-service/src/modules/auth/application/use-cases/`, `user-service/src/modules/user/application/use-cases/`, `user-service/src/modules/connector/application/use-cases/`
- Risk: Regressions in authentication and authorization go undetected
- Priority: High

**`flash-pick-service` search query service:**
- What's not tested: `search.query.service.ts` — search autocomplete and keyword scoring logic
- Files: `flash-pick-service/src/modules/search/application/queries/search.query.service.ts`
- Risk: Search ranking/scoring changes may break silently
- Priority: Medium

**`processing-flash-pick` ClickHouse gold writer:**
- What's not tested: `clickhouse-gold.writer.ts` adapter
- Files: `processing-flash-pick/src/modules/etl/flash-pick/adapters/clickhouse-gold.writer.ts`
- Risk: Gold layer write failures or schema mismatches not caught by unit tests
- Priority: Medium

---

*Concerns audit: 2026-03-20*
