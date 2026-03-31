# Coding Conventions

**Analysis Date:** 2026-03-20

## Naming Patterns

**Files:**
- Service files: `{feature}.service.ts` (e.g., `products.service.ts`, `etl.service.ts`)
- Controllers: `{feature}.controller.ts` (e.g., `products.controller.ts`)
- Adapters: `{adapter-name}.ts` (e.g., `mongo-raw.loader.ts`, `prisma-writer.ts`)
- Tests: `*.spec.ts` (co-located in `test/unit/` mirror directories)
- Types: `{feature}.types.ts` or `types.ts`
- Ports/Interfaces: `{feature}.ports.ts`
- DTOs: `{feature}.dto.ts` or in `application/dto/` subdirectories
- Queries: `{feature}.query.ts` or `{feature}.query.service.ts`
- Modules: `{feature}.module.ts`
- Filters: `{name}.filter.ts` (e.g., `http-exceptions.filter.ts`)
- Guards: `{name}.guard.ts` (e.g., `external-client-auth.guard.ts`)
- Interceptors: `{name}.interceptor.ts`

**Functions:**
- Use camelCase: `getHello()`, `findById()`, `processFlashPick()`
- Private methods: same camelCase convention, no underscore prefix
- Async operations: `async methodName()` keyword syntax
- Mock factory functions: `createService()`, `makeDoc()` pattern for test helpers

**Variables:**
- Constants: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_BATCH_SIZE`, `FLASH_PICK_RAW_LOADER`)
- Local variables: camelCase (e.g., `startedAt`, `batchSize`, `sourceSystem`)
- Constructor parameters: camelCase, inject with `@Inject(TOKEN)` decorator
- Type aliases with `type` keyword: `type FlashPickDocument = {...}`

**Types/Interfaces:**
- PascalCase for all types: `FlashPickNormalized`, `ProductDto`, `HttpException`
- Port/Interface definitions with `type` for unions, `interface` for object contracts
- DTO suffix for data transfer objects: `ProductListResponseDto`, `ProductsQueryDto`
- Port suffix for dependency injection contracts: `FlashPickRawLoader`, `FlashPickValidator`
- Request DTOs end with `RequestDto`: `FlashPickEtlRequestDto`
- Response DTOs end with `ResponseDto`: `ProductListResponseDto`
- Query DTOs: `{Feature}QueryDto` or `{Feature}sQueryDto` (plural when list operation)

## Code Style

**Formatting:**
- Tool: Prettier v3.4.2
- Config: `src/.prettierrc` or project root `.prettierrc`
- Settings:
  - Single quotes: `singleQuote: true`
  - Trailing commas: `trailingComma: "all"`
  - Run: `npm run format` to apply

**Linting:**
- Tool: ESLint v9.18.0
- Plugins: `eslint-config-prettier`, `eslint-plugin-prettier`, `typescript-eslint`
- Run: `npm run lint` (applies `--fix` automatically)
- Config: Flat config format (no `.eslintrc.js`)

**Language:**
- TypeScript ES2023 target
- Strict type checking: `strictNullChecks: true`
- Decorator metadata: `emitDecoratorMetadata: true`, `experimentalDecorators: true`
- Module resolution: CommonJS with path aliases
- Source maps: enabled (`sourceMap: true`)

## Import Organization

**Order:**
1. Third-party libraries: `@nestjs/*`, `rxjs`, `axios`, etc.
2. Type imports: `type { Interface } from '...'`
3. Internal absolute imports: `src/`, `@shared/`, `@modules/`
4. Internal relative imports: `'./local'`

**Path Aliases:**
- `@shared/*` → `src/shared/*` (shared utilities, guards, filters, logger, valueobjects)
- `@modules/*` → `src/modules/*` (business logic modules)
- `src/*` → `src/*` (full path imports when aliases not needed)

**Type Imports:**
Always use `type { }` syntax for type imports to enable tree-shaking:
```typescript
import type { FlashPickDocument } from './types';
import type { Request, Response } from 'express';
```

## Error Handling

**Patterns:**
- NestJS exceptions for HTTP errors: `NotFoundException`, `BadRequestException`, `UnauthorizedException`
- Custom exception filters: `@Catch()` decorator, implements `ExceptionFilter`
- RPC exceptions: `RpcException` for microservice responses
- Error logging: Use injected `Logger` from `@nestjs/common`
- Dead letter stores for processing failures: dedicated stores for retry/audit (e.g., `FlashPickDeadLetterStore`)
- Try-catch in async operations for batch processing fallbacks (e.g., batch write → per-record writes)

**Example error handling:**
```typescript
try {
  await this.writer.write(records);
} catch (error) {
  // Fallback to individual writes
  for (const record of records) {
    try {
      await this.writer.write([record]);
    } catch (e) {
      await this.deadLetterStore.recordFailure({
        jobId: BigInt(jobId),
        errorMessage: String(e),
        ...
      });
    }
  }
}
```

## Logging

**Framework:** Pino v9.7.0 via `nestjs-pino`

**Patterns:**
- Inject logger: `private readonly logger = new Logger(ClassName.name);`
- Log levels: `debug()`, `log()`, `warn()`, `error()`
- Context-aware: `this.logger.debug('message', context);`
- Structured logging with Pino config in `src/shared/logger/pino.config.ts`
- Custom transports for Lark notifications (`src/shared/logger/transports/lark.transport.ts`)

## Comments

**When to Comment:**
- Complex business logic: explain the "why" not the "what"
- Non-obvious workarounds: e.g., "// guard converts UUID job ID to BigInt(0) safely"
- Important assumptions: guard conditions, retry logic, state transitions
- Do NOT comment obvious code: `const x = 5; // set x to 5` ❌

**JSDoc/TSDoc:**
- Use sparingly for public APIs
- Document parameters, return types, throws
- Example:
```typescript
/**
 * Processes a batch of documents and updates watermark.
 * @param dto - ETL request configuration
 * @returns Processing result with counts and max watermark
 * @throws Error if writer fails and retry exhausted
 */
```

## Function Design

**Size:**
- Keep functions under 100 lines (long functions indicate multiple responsibilities)
- Extract helpers for complex logic (e.g., `parsePositiveInt()`, `createService()`)
- Use descriptive names that indicate what it does

**Parameters:**
- Prefer DTOs for multiple parameters (e.g., `FlashPickEtlRequestDto` instead of individual params)
- Use object destructuring for optional fields: `{ docs?, watermark?, writerError? }`
- Options pattern for test factories: `createService(options?: { ... })`

**Return Values:**
- Return void for side-effect operations
- Return result objects for queries: `{ processed: number; skipped: number; maxWatermark?: string }`
- Use type unions for varied returns: `{ valid: true } | { valid: false; reason: string }`

## Module Design

**Exports:**
- Export services with `@Injectable()` decorator
- Export controllers with `@Controller()` decorator
- Export DTOs, types, ports from module index files
- Use barrel files `index.ts` in `shared/valueobjects/`, `shared/core/`

**Barrel Files:**
- `src/shared/index.ts` exports shared utilities
- `src/shared/core/index.ts` exports business rule interfaces
- `src/shared/valueobjects/index.ts` exports value objects

**Module Structure:**
```
modules/
├── {feature}/
│   ├── {feature}.module.ts          # Module declaration
│   ├── {feature}.controller.ts      # HTTP/RPC endpoints
│   ├── application/
│   │   ├── dto/                     # Request/Response DTOs
│   │   ├── queries/                 # Query services
│   │   └── use-cases/               # Use case implementations
│   ├── domain/
│   │   ├── {aggregate}/             # Domain model
│   │   ├── ports/                   # Interfaces for adapters
│   │   └── validators/              # Business rules
│   └── infrastructure/
│       ├── http/                    # HTTP clients
│       ├── kafka/                   # Kafka adapters
│       └── persistence/             # Database adapters
```

---

*Convention analysis: 2026-03-20*
