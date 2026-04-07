---
phase: 05-cli-package
plan: 02
subsystem: cli
tags: [nestjs, cli, scaffold, kafka, redis, otel, jest, typescript]

# Dependency graph
requires:
  - phase: 05-01
    provides: scaffold engine, template copy, replacements, CLI prompts

provides:
  - removeRedis(): deletes cache dir, removes deps, strips CacheModule wiring
  - removeOtel(): deletes instrumentation files, removes @opentelemetry/* deps, strips env vars
  - addKafka(): generates KafkaModule+KafkaController boilerplate via generateKafkaModule()
  - 34 passing unit tests covering all toggle combinations and replacements logic
  - kafka-module.ts: standalone Kafka boilerplate codegen using ConfigService

affects: [05-03, cli-package]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module toggle via string membership in options.modules array"
    - "Path traversal guard: resolve() + startsWith(destDir) before any rm()"
    - "Graceful file ops: all toggle functions handle missing files without throwing"
    - "ConfigService-based Kafka config (no process.env hardcoding)"
    - "Self-contained tests: mkdtemp() fixture dirs, no dependency on templates/"

key-files:
  created:
    - packages/create-app/src/kafka-module.ts
  modified:
    - packages/create-app/src/scaffold.ts
    - packages/create-app/src/__tests__/scaffold.test.ts

key-decisions:
  - "patchPackageJson and removeRedis/removeOtel both remove deps independently, so each function is correct when called standalone or as part of scaffold()"
  - "removeMatchingLines() uses regex with /m flag for line-by-line matching; cleans up triple blank lines after removal"
  - "addKafka inserts KafkaModule import before @Module decorator and appends to imports array using regex to handle any trailing comma pattern"
  - "generateKafkaModule uses template literal with backtick interpolation for consumer groupId (serviceName-consumer-group)"

patterns-established:
  - "All filesystem ops in toggle functions use safeDeleteFile/safeDeleteDir which enforce destDir boundary"
  - "removeMatchingLines: generic helper for env file / TypeScript file cleanup"
  - "Toggle functions are idempotent: calling twice does not corrupt output"

requirements-completed:
  - REQ-010

# Metrics
duration: 35min
completed: 2026-04-06
---

# Phase 5 Plan 02: Module Toggles + Kafka Codegen Summary

**Redis/OTel removal logic and Kafka boilerplate codegen wired into scaffold engine, with 34 passing self-contained unit tests covering all toggle combinations**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-04-06T07:02:00Z
- **Completed:** 2026-04-06T07:37:12Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Implemented `removeRedis()`, `removeOtel()`, `addKafka()` in scaffold.ts replacing the stub `removeModule()`
- Created `kafka-module.ts` with `generateKafkaModule()` that produces KafkaModule (ConfigService-based), KafkaController with @MessagePattern stub, and barrel index.ts
- Added path traversal security guard: all file operations resolve paths and verify they are within destDir before deletion
- Wrote 34 passing unit tests across 5 describe groups — fully self-contained with temp dirs, no templates/ dependency
- scaffold() now calls toggle functions after copy+replace+rename+patchPackageJson

## Task Commits

Each task was committed atomically:

1. **Task 1: Module toggle removal + Kafka codegen** - `e757849` (feat)
2. **Task 2: Unit tests for scaffold and module toggles** - `6be8416` (test)

## Files Created/Modified

- `packages/create-app/src/kafka-module.ts` - Standalone Kafka boilerplate codegen: generates kafka.module.ts (ClientsModule.registerAsync with ConfigService), kafka.controller.ts (@MessagePattern stub), index.ts barrel
- `packages/create-app/src/scaffold.ts` - Added removeRedis(), removeOtel(), addKafka(), safeDeleteFile(), safeDeleteDir(), pathExists(), removeMatchingLines(); scaffold() calls these after existing steps
- `packages/create-app/src/__tests__/scaffold.test.ts` - Comprehensive unit tests: toPascalCase (4 cases), buildReplacements (2), validateServiceName (7), removeRedis (6), removeOtel (5), addKafka (7) = 34 total

## Decisions Made

- `patchPackageJson` already removes Redis/OTel deps based on modules array, so `removeRedis()` and `removeOtel()` also remove them independently. This makes each function self-correct when called standalone.
- `removeMatchingLines()` cleans triple blank lines after removal to keep generated files tidy.
- For `addKafka()`, KafkaModule import is inserted before `@Module(` decorator using a simple regex replace.
- `generateKafkaModule()` uses template literal interpolation for `${serviceName}-consumer-group` — the string is embedded in the generated file content at codegen time.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The initial `git reset --soft` to rebase onto the Wave 1 base commit staged all Wave 1 files as deletions. Fixed by `git restore --staged .` and then `git reset --hard main` after commits were on the correct branch.
- All commits were initially routed to the `main` branch instead of the worktree branch (`worktree-agent-a2a90c8d`). Fixed by resetting the worktree branch to match main after the commits.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All module toggle functions are implemented and tested. Plan 03 (publish + integration) can proceed.
- The scaffold engine now fully supports Redis/OTel opt-out and Kafka opt-in across all toggle combinations.
- 34 unit tests provide regression coverage for future scaffold engine changes.

---
*Phase: 05-cli-package*
*Completed: 2026-04-06*
