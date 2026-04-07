# Phase 3: API Standards, Scalar Docs & Observability - Research

**Researched:** 2026-03-28
**Domain:** NestJS API layer — versioning, response envelope, Scalar docs, Pino logging, OpenTelemetry
**Confidence:** HIGH (decisions fully locked in CONTEXT.md; reference implementation in flash-pick-service verified directly)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Global `TransformInterceptor` wraps all responses — `{ success: true, data: <return value>, meta?: PaginationMeta }`
- **D-02:** `@RawResponse()` decorator allows envelope opt-out (file downloads, streaming)
- **D-03:** `/health`, `/health/ready`, `/health/live` excluded from envelope via `@RawResponse()`
- **D-04:** Error shape: `{ success: false, error: { code: string, message: string, statusCode: number, details?: unknown } }` — NOT flash-pick's `{ statusCode, message, path, timestamp }`
- **D-05:** `AppException extends HttpException` — constructor: `{ code, message, statusCode, details? }`
- **D-06:** Error codes: SCREAMING_SNAKE_CASE strings (Stripe/Twilio style)
- **D-07:** `ErrorCodes` const in `src/shared/` with 5 starters: `VALIDATION_FAILED`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `INTERNAL_ERROR`
- **D-08:** `HttpExceptionFilter` handles both `AppException` (structured) and generic `HttpException` (fallback — code defaults to HTTP status name)
- **D-09:** Offset pagination — `PaginationDto`: `page?` (default 1), `limit?` (default 20), `sort?`, `order?: 'asc'|'desc'` (default 'asc')
- **D-10:** `PaginationMeta`: `{ total, page, limit, totalPages }`
- **D-11:** Sort/order are generic strings — controllers validate allowed fields per-entity
- **D-12:** No cursor-based pagination in template
- **D-13:** `nestjs-pino` with pino-pretty dev / JSON stdout prod; no file rolling, no Lark transport
- **D-14:** Dev: pino-pretty with colorize, SYS timestamp, ignore pid/hostname
- **D-15:** Prod: JSON to stdout, `level: 'info'`
- **D-16:** Correlation ID middleware: UUID v4 if `X-Correlation-ID` missing; inject into response header + pino HTTP context
- **D-17:** Pino serializers: log `method` + `url` from req, `statusCode` from res; include `correlationId`, `duration` in HTTP logs
- **D-18:** No file transports in template
- **D-19:** Scalar at `/docs`, protected with `express-basic-auth`; env vars `DOCS_USER` (default: `admin`), `DOCS_PASS`
- **D-20:** OpenAPI spec at `/docs/json` (match flash-pick pattern)
- **D-21:** `DocumentBuilder` sets title/description/version from env; adds `Bearer` auth scheme (`httpBearer`)
- **D-22:** Example module endpoints fully decorated: `@ApiOperation`, `@ApiResponse`, `@ApiTags('example')`
- **D-23:** Scalar `hiddenClients` config copied from flash-pick
- **D-24:** OTel opt-in via `OTEL_ENABLED=true`; `instrumentation.ts` MUST be first import in `main.ts`
- **D-25:** Copy flash-pick's `instrumentation.ts`, generalize `serviceName` to `OTEL_SERVICE_NAME` env var
- **D-26:** Prometheus on separate port (default `9464` via `OTEL_PROMETHEUS_PORT`)
- **D-27:** When `OTEL_ENABLED=false`, `instrumentation.ts` exports `null` — OTel API calls become no-ops
- **D-28:** OTel tracing spans added to `RedisService` — `tracer.startActiveSpan` wraps Redis operations

### Claude's Discretion

- Exact `validationOptions` for global `ValidationPipe` (follow flash-pick's `shared/validation-options.ts` pattern)
- `TimeoutInterceptor` implementation (copy from flash-pick, configurable via env)
- `RpcExceptionFilter` inclusion (include for completeness)
- Exact pino log level thresholds (debug in dev, info in prod)
- DNS and FS OTel instrumentation disabled (same as flash-pick — too noisy)
- `trust proxy` setting (set to 1 for reverse proxy compatibility)

### Deferred Ideas (OUT OF SCOPE)

- Lark logging transport
- File rolling (pino-roll) + dedicated error.log
- Cursor-based pagination
- Same-port `/metrics` endpoint
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-004 | URI versioning `/api/v1/`, response envelope, PaginationDto/Meta, AppException with error codes, global ValidationPipe, global rate limiting (ThrottlerModule) | NestJS VersioningType.URI verified in flash-pick; envelope via TransformInterceptor; ThrottlerModule v6.5.0 available |
| REQ-005 | Scalar UI at `/docs` (basic auth in prod), OpenAPI auto-generated, versioned, example module fully documented | `@scalar/nestjs-api-reference` v1.1.5 verified; flash-pick main.ts is direct reference |
| REQ-006 | Pino structured logging with correlation IDs, OTel tracing (OTEL_ENABLED), Prometheus metrics (METRICS_ENABLED), request/response logging with duration | `nestjs-pino` v4.6.1 verified; flash-pick instrumentation.ts is direct reference; OTel packages v0.214.0 |
</phase_requirements>

---

## Summary

Phase 3 extends the bare `main.ts` bootstrap and wires up a complete API layer. The reference implementation in `flash-pick-service/src/main.ts` is the primary source of truth — it contains the exact Scalar setup, basicAuth pattern, versioning, pipes, filters, and OTel init. The key adaptation work is: (1) generalizing flash-pick's hardcoded service names and error shape, (2) building the response envelope interceptor that flash-pick does not have, and (3) implementing offset-based `PaginationDto` (flash-pick uses cursor-based).

All implementation decisions are locked in CONTEXT.md (D-01 through D-28). Research confirms all required packages exist at current versions and the flash-pick reference patterns translate directly. The `src/common/` directory must be created fresh — it doesn't exist in the template yet.

**Primary recommendation:** Copy flash-pick patterns directly, adapt the error shape and service name generalization, then layer on the `TransformInterceptor` + `AppException` + `PaginationDto` which are net-new for the template.

---

## Standard Stack

### Core (already installed in template)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/common` | ^11.0.1 | VersioningType, interceptors, filters, pipes, middleware | NestJS core |
| `@nestjs/swagger` | — | OpenAPI spec generation, `DocumentBuilder`, `SwaggerModule` | **NOT YET INSTALLED — must add** |
| `class-validator` | ^0.15.1 | DTO validation decorators | Already installed |
| `class-transformer` | ^0.5.1 | Transform/serialize DTOs | Already installed |

### New Dependencies to Install
| Library | Version (verified) | Purpose | Why |
|---------|---------|---------|-----|
| `nestjs-pino` | 4.6.1 | NestJS Pino logger integration | Standard structured logging for NestJS |
| `pino-http` | 11.0.0 | HTTP request/response logging middleware | Required by nestjs-pino |
| `pino-pretty` | 13.1.3 | Dev-mode pretty printing | Human-readable local logs |
| `@scalar/nestjs-api-reference` | 1.1.5 | Scalar API reference UI for NestJS | Replaces Swagger UI, already used in flash-pick |
| `express-basic-auth` | 1.2.1 | HTTP Basic Auth middleware | Protects `/docs` in prod |
| `@nestjs/throttler` | 6.5.0 | Rate limiting (ThrottlerModule) | REQ-004 requirement |
| `@opentelemetry/sdk-node` | 0.214.0 | OTel Node SDK bootstrap | OTel standard entry point |
| `@opentelemetry/auto-instrumentations-node` | 0.72.0 | Auto-instrument http, express, pg, redis | Minimal config, max coverage |
| `@opentelemetry/exporter-prometheus` | 0.214.0 | Prometheus metrics exporter | Runs standalone on port 9464 |
| `@opentelemetry/exporter-trace-otlp-http` | 0.214.0 | OTLP trace exporter | Sends traces to Jaeger/Tempo |
| `@opentelemetry/resources` | 2.6.1 | Resource attributes (service.name etc.) | `resourceFromAttributes` API (v2+) |
| `@opentelemetry/api` | 1.9.1 | OTel API for manual spans | Used in RedisService tracing (D-28) |
| `@opentelemetry/sdk-trace-base` | 0.214.0 | `ConsoleSpanExporter` (dev fallback) | Already used in flash-pick |

**Note:** `@nestjs/swagger` is the peer dependency required by `@scalar/nestjs-api-reference` for `DocumentBuilder` and `SwaggerModule.createDocument`. It must be installed even though Scalar replaces the UI.

**Installation:**
```bash
pnpm add @nestjs/swagger nestjs-pino pino-http pino-pretty @scalar/nestjs-api-reference express-basic-auth @nestjs/throttler @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-prometheus @opentelemetry/exporter-trace-otlp-http @opentelemetry/resources @opentelemetry/api @opentelemetry/sdk-trace-base
pnpm add -D @types/express-basic-auth
```

### Type stubs
`@types/express` is already a devDependency. `express-basic-auth` may not have a separate `@types/` package — check at install time; if missing, add a local `.d.ts` declaration.

---

## Architecture Patterns

### Recommended File Structure (additions to existing `src/`)
```
src/
├── instrumentation.ts          # OTel bootstrap — MUST be first import in main.ts
├── main.ts                     # Full rewrite — Scalar, basicAuth, versioning, Pino, OTel
├── app.module.ts               # Add: LoggerModule, ThrottlerModule, correlation middleware
├── shared/
│   ├── index.ts                # Extend to export new types
│   ├── dto/
│   │   ├── pagination.dto.ts   # PaginationDto (query) + PaginationMeta (response)
│   │   └── response.dto.ts     # ResponseEnvelope type
│   ├── exceptions/
│   │   ├── app.exception.ts    # AppException extends HttpException
│   │   └── error-codes.ts      # ErrorCodes const
│   └── validation-options.ts   # ValidationPipeOptions (adapted from flash-pick)
└── common/                     # NEW directory
    ├── filters/
    │   ├── http-exception.filter.ts    # Updated error shape per D-04
    │   └── rpc-exception.filter.ts    # For gRPC/microservice completeness
    ├── interceptors/
    │   ├── transform.interceptor.ts   # Response envelope (net-new)
    │   └── timeout.interceptor.ts     # Copy from flash-pick
    ├── decorators/
    │   └── raw-response.decorator.ts  # @RawResponse() opt-out decorator
    └── middleware/
        └── correlation-id.middleware.ts  # UUID v4 injection
```

### Pattern 1: Response Envelope via TransformInterceptor
**What:** Global interceptor that wraps controller return values in `{ success: true, data: T, meta? }`. Uses a reflection key to detect `@RawResponse()` and skip wrapping.
**When to use:** Applied globally in `main.ts` via `app.useGlobalInterceptors()`.

```typescript
// src/common/interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const RAW_RESPONSE_KEY = 'raw_response';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isRaw) return next.handle();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      })),
    );
  }
}
```

### Pattern 2: @RawResponse() Decorator
```typescript
// src/common/decorators/raw-response.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { RAW_RESPONSE_KEY } from '../interceptors/transform.interceptor';

export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
```

Apply to HealthController methods and any streaming endpoint.

### Pattern 3: AppException
```typescript
// src/shared/exceptions/app.exception.ts
import { HttpException } from '@nestjs/common';

export interface AppExceptionPayload {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export class AppException extends HttpException {
  constructor(payload: AppExceptionPayload) {
    super(payload, payload.statusCode);
  }
}
```

### Pattern 4: HttpExceptionFilter — New Error Shape (D-04)
The template error shape differs from flash-pick's `{ statusCode, message, path, timestamp }`. The filter must produce:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "statusCode": 404,
    "details": null
  }
}
```

Logic:
- If `exception instanceof AppException` → extract `code`, `message`, `statusCode`, `details` from payload
- Else (generic `HttpException`) → `code` = HTTP status name (e.g., `"NOT_FOUND"` from `HttpStatus[status]`), `message` = exception message

### Pattern 5: Correlation ID Middleware
```typescript
// src/common/middleware/correlation-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = (req.headers[CORRELATION_ID_HEADER.toLowerCase()] as string) ?? randomUUID();
    req.headers[CORRELATION_ID_HEADER.toLowerCase()] = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    next();
  }
}
```

Register in `AppModule.configure()` for all routes. The `correlationId` is picked up by pino-http via the `genReqId` option set to read from the header.

### Pattern 6: Pino Config (minimal, no file transport)
```typescript
// Inline in AppModule or a separate logger.module.ts
import { LoggerModule } from 'nestjs-pino';

const isDev = process.env.NODE_ENV !== 'production';

LoggerModule.forRoot({
  pinoHttp: {
    level: isDev ? 'debug' : 'info',
    genReqId: (req) => req.headers['x-correlation-id'] ?? randomUUID(),
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined, // JSON to stdout in prod
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  },
})
```

### Pattern 7: main.ts Bootstrap Order (CRITICAL)
```typescript
// Order is non-negotiable for OTel
import otelSdk from './instrumentation';         // 1. FIRST — monkey-patches http/net
import { NestFactory } from '@nestjs/core';      // 2. Then NestJS
// ... rest of imports

async function bootstrap() {
  otelSdk?.start();                              // 3. Start before app.create()
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));               // 4. Replace console with Pino
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api', { exclude: ['/docs', ...] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: apiVersion });
  // ... basicAuth, Scalar, pipes, filters, interceptors
  await app.listen(port);
}
```

### Anti-Patterns to Avoid
- **Importing NestFactory before instrumentation.ts:** OTel patches http/net at import time — importing it after `NestFactory` means spans created during bootstrap are missed.
- **Wrapping health endpoints in the envelope:** k8s probes parse Terminus's exact JSON shape — wrapping breaks liveness/readiness probes.
- **Double-wrapping detection:** `TransformInterceptor` should NOT check if data already has `{ success, data }` shape — the `@RawResponse()` decorator is the explicit opt-out mechanism, not shape detection.
- **Using flash-pick's error shape:** Template uses `{ success: false, error: { code, message, statusCode, details } }` — not `{ statusCode, message, path, timestamp }`.
- **Hardcoding service name in instrumentation.ts:** Generalize to `process.env.OTEL_SERVICE_NAME ?? 'nestjs-backend-template'`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured logging | Custom winston/morgan setup | `nestjs-pino` | Async context, pino-http integration, NestJS logger interface |
| API docs UI | Custom Swagger UI setup | `@scalar/nestjs-api-reference` | Flash-pick reference, richer UX than swagger-ui-express |
| OpenAPI spec generation | Manual spec writing | `@nestjs/swagger` decorators + `SwaggerModule` | Auto-generated from DTOs and decorators |
| Basic auth for docs | Custom middleware | `express-basic-auth` | One-liner, battle-tested, challenge header support |
| Rate limiting | Custom Redis-backed limiter | `@nestjs/throttler` | Built-in NestJS module, decorator-based per-route config |
| OTel SDK bootstrap | Manual trace/metric registration | `@opentelemetry/auto-instrumentations-node` | Auto-instruments http, express, prisma, ioredis with zero config |
| Request correlation | Custom header tracking | pino-http `genReqId` + middleware | Injected into every log line automatically |

---

## Common Pitfalls

### Pitfall 1: OTel Import Order
**What goes wrong:** Spans for http/net created during NestJS bootstrap are not captured; instrumentation appears to work but has gaps.
**Why it happens:** `getNodeAutoInstrumentations` monkey-patches Node.js core modules at import time. If NestJS loads first, the patches apply to an already-initialized http module.
**How to avoid:** `instrumentation.ts` must be the absolute first import in `main.ts`, before `NestFactory`, `AppModule`, or any other import.
**Warning signs:** Missing spans for incoming HTTP requests in Jaeger/Tempo; no spans for the first few requests after startup.

### Pitfall 2: TransformInterceptor Applied to Health Endpoints
**What goes wrong:** k8s liveness/readiness probes receive `{ success: true, data: { status: 'ok', ... } }` instead of Terminus's expected format. Probes may fail or report incorrect status.
**Why it happens:** Global interceptors apply to all routes by default.
**How to avoid:** Add `@RawResponse()` to all three `HealthController` methods (check, ready, live).

### Pitfall 3: ValidationPipe Error Shape Inconsistency
**What goes wrong:** Validation errors don't match the `AppException` error shape, causing inconsistent API responses.
**Why it happens:** Default `ValidationPipe` throws a plain `HttpException` with `{ message: string[], statusCode }`. Flash-pick's `validationOptions` uses a different error shape.
**How to avoid:** Use a custom `exceptionFactory` in `validationOptions` that throws an `AppException` with `code: ErrorCodes.VALIDATION_FAILED` and `details` containing field-level errors.

### Pitfall 4: Scalar Served Without `SwaggerModule.createDocument()`
**What goes wrong:** `/docs` loads but shows no endpoints.
**Why it happens:** `@scalar/nestjs-api-reference` needs the OpenAPI document object, not a URL. It must be called with `content: document` where `document` is the result of `SwaggerModule.createDocument()`.
**How to avoid:** Always call `SwaggerModule.createDocument(app, documentBuilder.build())` first, then pass `document` to `apiReference({ content: document, ... })`.

### Pitfall 5: basicAuth Applied After Scalar Middleware
**What goes wrong:** `/docs` is accessible without authentication.
**Why it happens:** Express middleware is order-sensitive — basicAuth must be registered on `/docs` before the Scalar handler.
**How to avoid:** Register `app.use('/docs', basicAuth(...))` before `app.use('/docs', apiReference(...))` in `main.ts`.

### Pitfall 6: `@nestjs/swagger` Missing from Dependencies
**What goes wrong:** `DocumentBuilder` and `SwaggerModule` are unavailable; TypeScript compilation fails.
**Why it happens:** `@scalar/nestjs-api-reference` provides the UI but does not bundle `@nestjs/swagger`. The template currently does not have `@nestjs/swagger` installed.
**How to avoid:** Install `@nestjs/swagger` alongside `@scalar/nestjs-api-reference`.

### Pitfall 7: ThrottlerModule Missing from AppModule
**What goes wrong:** REQ-004 rate limiting requirement unmet; no `@Throttle()` decorator available.
**Why it happens:** `@nestjs/throttler` is installed but not imported in `AppModule`.
**How to avoid:** Import `ThrottlerModule.forRootAsync({ ... })` in `AppModule`, reading limits from `ConfigService`.

---

## Code Examples

### Pagination DTO (offset-based, adapted from flash-pick cursor pattern)
```typescript
// src/shared/dto/pagination.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'asc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### ErrorCodes
```typescript
// src/shared/exceptions/error-codes.ts
export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

### ThrottlerModule config (in AppModule)
```typescript
ThrottlerModule.forRootAsync({
  imports: [AppConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => [
    {
      ttl: config.get('THROTTLE_TTL', 60) * 1000,   // ms
      limit: config.get('THROTTLE_LIMIT', 100),
    },
  ],
}),
```

### AppModule middleware registration
```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
```

### OTel span in RedisService (D-28)
```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('redis-service');

async get(key: string): Promise<string | null> {
  return tracer.startActiveSpan(`redis.get ${key}`, async (span) => {
    try {
      return await this.client.get(key);
    } finally {
      span.end();
    }
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `swagger-ui-express` via `@nestjs/swagger` UI | `@scalar/nestjs-api-reference` | ~2023 | Scalar is richer, modern UI; `@nestjs/swagger` still needed for spec generation |
| `winston` / `morgan` logging | `nestjs-pino` with pino-http | ~2022 | Structured JSON, async context, 5-10x faster |
| `@opentelemetry/resources` v1 `new Resource({...})` | v2 `resourceFromAttributes({...})` | @opentelemetry/resources v2.0 | `Resource` is now a type only — must use factory function |
| Global Prometheus `/metrics` on main port | Separate port via `PrometheusExporter({ port })` | OTel SDK 0.x | Keeps main app port clean; avoids auth complexity on metrics endpoint |

**Deprecated/outdated:**
- `new Resource({...})` from `@opentelemetry/resources`: replaced by `resourceFromAttributes({...})` in v2+. Flash-pick already uses the v2 pattern — copy it directly.
- Flash-pick's pino config (file rolling, pino-roll, error.log): not applicable to template (D-18 locks this out).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | ✓ | (runtime env) | — |
| pnpm | Package install | ✓ | (workspace standard) | — |
| `nestjs-pino` | REQ-006 | ✗ (not installed) | — | Must install |
| `@nestjs/swagger` | REQ-005 | ✗ (not installed) | — | Must install |
| `@scalar/nestjs-api-reference` | REQ-005 | ✗ (not installed) | — | Must install |
| `express-basic-auth` | REQ-005 | ✗ (not installed) | — | Must install |
| `@nestjs/throttler` | REQ-004 | ✗ (not installed) | — | Must install |
| OTel packages | REQ-006 | ✗ (not installed) | — | Must install (feature-flagged, no blocking fallback) |
| `class-validator` / `class-transformer` | REQ-004 | ✓ | ^0.15.1 / ^0.5.1 | Already installed |

**Missing dependencies with no fallback:**
- All listed "Must install" packages above — plan must include an explicit dependency installation task as Wave 0 or first task.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 + ts-jest 29 |
| Config file | `package.json` (jest key), rootDir: `src`, testRegex: `.*\.spec\.ts$` |
| Quick run command | `pnpm test --testPathPattern=src/common` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-004 | `TransformInterceptor` wraps response in envelope | unit | `pnpm test --testPathPattern=transform.interceptor` | ❌ Wave 0 |
| REQ-004 | `@RawResponse()` skips envelope wrapping | unit | `pnpm test --testPathPattern=transform.interceptor` | ❌ Wave 0 |
| REQ-004 | `AppException` produces correct error shape | unit | `pnpm test --testPathPattern=app.exception` | ❌ Wave 0 |
| REQ-004 | `HttpExceptionFilter` maps AppException → error envelope | unit | `pnpm test --testPathPattern=http-exception.filter` | ❌ Wave 0 |
| REQ-004 | `HttpExceptionFilter` maps generic HttpException → fallback code | unit | `pnpm test --testPathPattern=http-exception.filter` | ❌ Wave 0 |
| REQ-004 | `PaginationDto` validates page/limit/sort/order | unit | `pnpm test --testPathPattern=pagination.dto` | ❌ Wave 0 |
| REQ-004 | `CorrelationIdMiddleware` injects UUID when header absent | unit | `pnpm test --testPathPattern=correlation-id.middleware` | ❌ Wave 0 |
| REQ-004 | `CorrelationIdMiddleware` preserves existing correlation ID | unit | `pnpm test --testPathPattern=correlation-id.middleware` | ❌ Wave 0 |
| REQ-005 | Scalar docs accessible at `/docs` | smoke/manual | Manual browser check | N/A |
| REQ-005 | OpenAPI spec downloadable at `/docs/json` | smoke/manual | Manual curl check | N/A |
| REQ-006 | Pino logs include `correlationId` field | unit | `pnpm test --testPathPattern=correlation` | ❌ Wave 0 |
| REQ-006 | `instrumentation.ts` exports null when OTEL_ENABLED unset | unit | `pnpm test --testPathPattern=instrumentation` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test --testPathPattern=src/common --passWithNoTests`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/common/filters/http-exception.filter.spec.ts` — REQ-004 error shape
- [ ] `src/common/interceptors/transform.interceptor.spec.ts` — REQ-004 envelope + opt-out
- [ ] `src/common/middleware/correlation-id.middleware.spec.ts` — REQ-006 correlation ID
- [ ] `src/shared/exceptions/app.exception.spec.ts` — REQ-004 AppException
- [ ] `src/shared/dto/pagination.dto.spec.ts` — REQ-004 pagination validation
- [ ] `src/instrumentation.spec.ts` — REQ-006 feature-flag behavior

---

## Open Questions

1. **`@types/express-basic-auth` availability**
   - What we know: `express-basic-auth` v1.2.1 is a CommonJS package; may not have DefinitelyTyped types
   - What's unclear: Whether TypeScript can infer types or a declaration file is needed
   - Recommendation: Attempt install; if no `@types/` package, add a minimal `declare module 'express-basic-auth'` stub in `src/types/`

2. **`ThrottlerModule` Redis backing store**
   - What we know: REQ-004 says "global rate limiting, configurable"; template has Redis available
   - What's unclear: Whether to use in-memory (default) or Redis store (`@nestjs/throttler-storage-redis`) for the template
   - Recommendation: Use in-memory default for the template (simpler, no extra dependency); document that teams should switch to Redis store for multi-instance deployments

3. **`validationOptions` `exceptionFactory` integration with AppException**
   - What we know: Flash-pick's factory throws a plain `HttpException` with a custom body; template needs `AppException`
   - What's unclear: Whether `HttpExceptionFilter` catching `AppException` will also catch validation errors thrown by the pipe
   - Recommendation: Make `exceptionFactory` throw `new AppException({ code: ErrorCodes.VALIDATION_FAILED, ... })` — the filter catches it as `AppException` and produces the correct shape

---

## Sources

### Primary (HIGH confidence)
- `flash-pick-service/src/main.ts` — Direct reference implementation; Scalar, basicAuth, versioning, OTel init pattern
- `flash-pick-service/src/instrumentation.ts` — OTel SDK bootstrap; `resourceFromAttributes` v2 pattern
- `flash-pick-service/src/shared/logger/pino.config.ts` — Pino config reference (file transport portions excluded per D-18)
- `flash-pick-service/src/common/filters/http-exceptions.filter.ts` — Exception filter reference (error shape adapted per D-04)
- `flash-pick-service/src/common/interceptors/timeout.interceptor.ts` — Timeout interceptor (copy directly)
- `flash-pick-service/src/shared/validation-options.ts` — ValidationPipe options reference
- `nestjs-backend-template/package.json` — Confirmed which packages are already installed
- npm registry — Verified versions: nestjs-pino@4.6.1, pino-pretty@13.1.3, @scalar/nestjs-api-reference@1.1.5, @nestjs/throttler@6.5.0, @opentelemetry/sdk-node@0.214.0

### Secondary (MEDIUM confidence)
- `nestjs-backend-template/src/main.ts` — Current bare bootstrap — confirmed scope of rewrite needed
- `.planning/phases/03-api-standards-scalar-docs-observability/03-CONTEXT.md` — All decisions D-01 through D-28 locked

### Tertiary (LOW confidence)
- None — all findings verified against source code or npm registry

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against npm registry; flash-pick reference inspected directly
- Architecture: HIGH — decisions locked in CONTEXT.md; flash-pick reference provides exact patterns
- Pitfalls: HIGH — verified against flash-pick source code and CONTEXT.md specifics section

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable ecosystem; OTel minor versions move fast — re-verify if > 30 days)
