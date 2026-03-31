# NestJS Backend Template -- Claude Code Brief

This is a production-ready NestJS 11 backend template built on Full Domain-Driven Design (DDD) architecture. It provides a complete scaffold for new backend services: DDD base classes, URI-versioned REST API, Scalar API docs, OpenTelemetry observability, Redis, Prisma/PostgreSQL, and Claude Code agent configs pre-wired. Managed with npm. Intended for team cloning as a service starter.

---

## Architecture

DDD layers with strict import boundaries:

```
src/
  <module>/
    domain/           # Pure business logic — no framework deps
    application/      # Use cases, CQRS handlers — orchestrates domain
    infrastructure/   # Prisma, Redis adapters — implements domain interfaces
    presenter/        # NestJS controllers, Swagger decorators
  common/             # Global filters, interceptors, middleware, decorators
  shared/             # DTOs, base classes (Entity, AggregateRoot, VOs), exceptions
  infrastructure/     # App-wide infra: database module, Redis, health checks
```

### DDD Layer Import Rules

| Layer | Location | May Import | NEVER Import |
|-------|----------|------------|--------------|
| Domain | `src/*/domain/` | Nothing (pure TS/classes) | @nestjs/*, prisma, ioredis |
| Application | `src/*/application/` | Domain layer only | @nestjs/*, prisma, ioredis |
| Infrastructure | `src/*/infrastructure/` | NestJS DI, Prisma, ioredis | Domain business logic directly |
| Presenter | `src/*/presenter/` | Application DTOs, @nestjs/common | Domain entities directly |

---

## Forbidden Patterns

Agents MUST NEVER generate code that violates these rules:

- Never import `@nestjs/*` in any `domain/` file
- Never import `PrismaService` in any `application/` file
- Never use `new EntityClass()` in controllers — always go through command/query handler
- Never hardcode env vars — always use `ConfigService`
- Never bypass `TransformInterceptor` except with `@RawResponse()` decorator
- Never put business logic directly in infrastructure layer — it belongs in domain/application
- Never skip the repository interface — infrastructure must implement the domain port, not be called directly
- Never use `any` type in domain or application layers

---

## Module Structure

File-level walkthrough of `src/example/` (the canonical reference module — Item domain):

**Domain layer** (`src/example/domain/`):
- `item.entity.ts` — Item entity extending `Entity<ItemId>`, holds domain properties and enforces invariants
- `item-name.value-object.ts` — ItemName value object extending `StringValueObject`, validates string length
- `item.repository.interface.ts` — `IItemRepository` port interface (find, save, delete) — no NestJS/Prisma here

**Application layer** (`src/example/application/`):
- `commands/create-item.command.ts` — CreateItemCommand data class (no logic)
- `commands/create-item.handler.ts` — `@CommandHandler` — orchestrates domain + repository
- `commands/delete-item.command.ts` — DeleteItemCommand
- `commands/delete-item.handler.ts` — `@CommandHandler` for delete
- `queries/get-item.query.ts` — GetItemQuery data class
- `queries/get-item.handler.ts` — `@QueryHandler` — fetches via repository, maps to DTO
- `queries/list-items.query.ts` — ListItemsQuery with pagination params
- `queries/list-items.handler.ts` — `@QueryHandler` — paginated fetch
- `dtos/create-item.dto.ts` — Request DTO with class-validator decorators
- `dtos/item.response.dto.ts` — Response DTO (plain data, no entity exposure)

**Infrastructure layer** (`src/example/infrastructure/`):
- `persistence/prisma-item.repository.ts` — `PrismaItemRepository` implements `IItemRepository` — maps Prisma records to domain entities

**Presenter layer** (`src/example/presenter/`):
- `presenter/item.controller.ts` — REST controller with `@ApiTags`, `@ApiOperation`, `@ApiResponse` decorators; dispatches commands/queries via `CommandBus`/`QueryBus`

**Module wiring**:
- `example.module.ts` — declares providers (handlers, repository), imports (CqrsModule, PrismaModule), exports nothing (self-contained)

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| `commonjs` over `nodenext` | `reflect-metadata` (required by NestJS decorators) does not work with ESM nodenext module resolution |
| URI versioning at `/api/v1/` | Team preference — easier to test, visible in logs and proxy configs |
| `NestExpressApplication` type | Required to call `.set('trust proxy', 1)` for correct IP detection behind reverse proxies |
| OTel via `OTEL_ENABLED=true` env flag | Dynamic `require()` for OTel SDK avoids loading heavy deps (200+ ms) when observability is off |
| `start:prod` points to `dist/src/main` | NestJS CLI compiles to `dist/src/` (due to `sourceRoot: src`) not `dist/` — wrong path causes silent boot failure |
| DDD base classes are framework-free | `Entity<TId>`, `AggregateRoot`, `ValueObject` have zero `@nestjs/*` imports — keeps domain unit-testable without NestJS bootstrap |
| `AggregateRoot` extends `Entity<TId>` | Inherits `equals()` identity comparison; `super(id)` call required in aggregate constructors |
| Generic `Error` in built-in VOs | Template keeps it simple; consumers override with domain-specific `AppException` subclasses |
| `HttpExceptionFilter` code = `HttpStatus[statusCode]` | Fallback for generic `HttpException` codes — produces readable string codes like `FORBIDDEN` |
| `TimeoutInterceptor` via `REQUEST_TIMEOUT` env | Configurable at runtime, defaults to 30000ms |

---

## Commands Quick Reference

| Script | Command | What it does |
|--------|---------|--------------|
| Dev server | `npm run dev` | Start with watch mode (ts-node + SWC) |
| Build | `npm run build` | Compile TypeScript to `dist/` |
| Tests | `npm test` | Run Jest unit tests |
| Tests (watch) | `npm run test:watch` | Jest in watch mode |
| Tests (coverage) | `npm run test:cov` | Jest with coverage report |
| Lint | `npm run lint` | ESLint with auto-fix |
| Format | `npm run format` | Prettier auto-format |
| Production | `npm run start:prod` | Run compiled `dist/src/main.js` |
| Docker up | `npm run docker:up` | Start PostgreSQL + Redis via docker-compose |
| Docker down | `npm run docker:down` | Stop docker services |
| DB migrate | `npm run db:migrate` | Run Prisma migrations |
| DB studio | `npm run db:studio` | Open Prisma Studio |

---

## Global MCP Setup (Developer Action Required)

The project `.mcp.json` (repo root) is auto-loaded by Claude Code and provides three project-scoped MCP servers: **Context7** (library docs), **Prisma** (DB introspection), **Playwright** (browser automation).

Two additional MCPs are **user-global** (team-specific credentials or system tools) — add them to your personal `~/.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "lark-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y", "@larksuiteoapi/lark-mcp", "mcp",
        "-a", "${LARK_APP_ID}",
        "-s", "${LARK_APP_SECRET}",
        "--domain", "https://open.larksuite.com",
        "-t", "preset.docx.default,preset.wiki.default,preset.im.default,preset.bitable.default,preset.contact.default,preset.drive.default,wiki_v2_space_node_create,wiki_v2_space_node_move,wiki_v2_space_node_update,wiki_v2_space_list,wiki_v2_space_node_list",
        "--token-mode", "auto", "--oauth"
      ]
    },
    "MCP_DOCKER": {
      "type": "stdio",
      "command": "docker",
      "args": ["mcp", "gateway", "run"]
    }
  }
}
```

Set `LARK_APP_ID` and `LARK_APP_SECRET` in your shell environment (see `.env.example` for reference). Never commit credentials to the project repo.

---

## Working with This Codebase

To add a new domain module (e.g., `order`), follow the step-by-step walkthrough in `docs/CONTRIBUTING.md`. It covers every layer with concrete code snippets from `src/example/` as reference.

Quick rule: copy the `src/example/` structure, rename everything, replace `Item` with your entity name, and wire it in `src/app.module.ts`.


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

*No recent activity*
</claude-mem-context>