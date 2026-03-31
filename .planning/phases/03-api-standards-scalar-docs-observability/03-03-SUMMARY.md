---
phase: 03-api-standards-scalar-docs-observability
plan: 03
subsystem: api
tags: [nestjs, swagger, opentelemetry, redis, otel, scalar, pagination]

requires:
  - phase: 03-01
    provides: PaginationDto, RawResponse decorator, AppException, shared barrel exports

provides:
  - ExampleModule ItemController fully decorated with @ApiTags, @ApiOperation, @ApiResponse, @ApiParam
  - CreateItemDto with @ApiProperty + class-validator decorators
  - ItemResponseDto with @ApiProperty decorators
  - HealthController excluded from response envelope via @RawResponse()
  - RedisService with OTel tracing spans (get/set/del/expire) using @opentelemetry/api

affects: [04-agent-configs, 05-cli-generator, scalar-docs, observability]

tech-stack:
  added: []
  patterns:
    - "@ApiTags/@ApiOperation/@ApiResponse on controller class and each method"
    - "@ApiProperty on DTO fields alongside class-validator decorators"
    - "@RawResponse() to exclude health endpoints from response envelope"
    - "OTel tracer.startActiveSpan wrapping circuit breaker calls in Redis service"
    - "PaginationDto as @Query() param on list endpoints for Scalar docs demonstration"

key-files:
  created: []
  modified:
    - src/example/presenter/item.controller.ts
    - src/example/application/dtos/create-item.dto.ts
    - src/example/application/dtos/item.response.dto.ts
    - src/infrastructure/health/health.controller.ts
    - src/infrastructure/cache/redis.service.ts
    - src/infrastructure/cache/redis.service.spec.ts

key-decisions:
  - "PaginationDto accepted via @Query() in findAll even though ListItemsQuery handler ignores it — demonstrates the Scalar docs pattern"
  - "OTel span wraps the circuit breaker call (not vice versa) to trace the full Redis operation including breaker overhead"
  - "Health endpoints use @RawResponse() to bypass TransformInterceptor envelope — terminus returns its own structured format"

patterns-established:
  - "Swagger pattern: @ApiTags at controller, @ApiOperation/@ApiResponse per method, @ApiParam for path params"
  - "DTO pattern: @ApiProperty + class-validator decorators co-located on each field"
  - "OTel Redis pattern: startActiveSpan with db.system/db.operation/db.redis.key attributes, recordException on error, span.end() in finally"

requirements-completed: [REQ-005, REQ-006]

duration: 15min
completed: 2026-03-28
---

# Phase 3 Plan 03: API Decorators and Redis OTel Tracing Summary

**ExampleModule endpoints fully decorated for Scalar UI visibility, HealthController excluded from response envelope, and RedisService get/set/del/expire wrapped with OTel tracing spans using db.system/db.redis.key attributes**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-28T14:40:00Z
- **Completed:** 2026-03-28T14:55:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- ItemController decorated with @ApiTags('example'), @ApiOperation, @ApiResponse, @ApiParam on all 4 endpoints; PaginationDto wired as @Query() on findAll
- CreateItemDto and ItemResponseDto decorated with @ApiProperty; CreateItemDto gains @IsString/@IsNotEmpty validators
- HealthController all three methods decorated with @RawResponse() to exclude from envelope; @ApiTags('health') added
- RedisService get/set/del/expire wrapped in OTel startActiveSpan with semantic attributes and error recording; circuit breaker preserved
- Redis spec updated: 5 new OTel smoke/verification tests added; all 17 tests pass

## Task Commits

1. **Task 1: Swagger decorators + @RawResponse to HealthController** - `43c70df` (feat)
2. **Task 2: OTel tracing spans to RedisService + updated tests** - `c0222b9` (feat)

## Files Created/Modified

- `src/example/presenter/item.controller.ts` - Added @ApiTags, @ApiOperation, @ApiResponse, @ApiParam, PaginationDto @Query param
- `src/example/application/dtos/create-item.dto.ts` - Added @ApiProperty, @IsString, @IsNotEmpty
- `src/example/application/dtos/item.response.dto.ts` - Added @ApiProperty on id and name fields
- `src/infrastructure/health/health.controller.ts` - Added @RawResponse() to all 3 methods, @ApiTags('health'), @ApiOperation
- `src/infrastructure/cache/redis.service.ts` - Added OTel trace import, module-scope tracer, startActiveSpan wrapping on get/set/del/expire
- `src/infrastructure/cache/redis.service.spec.ts` - Added OTel import and 5 new tracing smoke/verification tests

## Decisions Made

- PaginationDto accepted via @Query() in findAll even though ListItemsQuery handler does not use it — the purpose is to demonstrate the pattern in Scalar docs
- OTel span wraps the circuit breaker call (not vice versa) to trace the full Redis operation including any breaker-level latency
- Health endpoints use @RawResponse() to bypass TransformInterceptor — @nestjs/terminus returns its own structured health response format

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Jest `--testPathPattern` flag renamed to `--testPathPatterns` in newer Jest version; switched to `pnpm jest --testPathPatterns` directly instead of `pnpm test --`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ExampleModule is fully documented in Scalar UI with schemas, operations, tags, and pagination patterns
- HealthController correctly bypasses the response envelope — terminus JSON passthrough works as expected
- RedisService now emits OTel spans; when SDK is initialized in production, spans flow to the configured exporter
- Ready for Phase 04 (agent configs) — all template code is complete

---
*Phase: 03-api-standards-scalar-docs-observability*
*Completed: 2026-03-28*
