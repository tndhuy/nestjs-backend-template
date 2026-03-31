# Phase 1: Template Scaffold - Research

**Researched:** 2026-03-25
**Domain:** NestJS 11 + CQRS + DDD project scaffold
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Source:** Build `nestjs-backend-template/` from scratch. Do NOT copy from flash-pick-service.
- **ExampleModule:** No stub/in-memory repos in Phase 1. Interface only — real Prisma repo in Phase 2.
- **CQRS pattern:** `@nestjs/cqrs` with CommandBus + QueryBus. Commands: CreateItemCommand, DeleteItemCommand. Queries: GetItemQuery, ListItemsQuery.
- **Controller wiring:** Controller injects CommandBus + QueryBus only — never ItemService.
- **Domain model:** Item extends AggregateRoot placeholder, ItemName is a ValueObject.
- **Repository:** IItemRepository interface in domain layer. Empty infrastructure/ in Phase 1.
- **Phase 1 scope:** Bare skeleton + ExampleModule structure only. No Prisma, no Redis, no Health.
- **Handlers:** May throw `NotImplementedException` (or equivalent) until Phase 2 wires real repo.
- **Location:** `nestjs-backend-template/` at workspace root — standalone project, NOT a pnpm workspace member.
- **Package manager:** pnpm. Own `package.json`, `pnpm-lock.yaml`, `tsconfig.json`.
- **DDD layer names:** application (commands/queries/dtos), domain (entities/value-objects/repo interface), infrastructure (empty Phase 1), presenter (controllers).

### Claude's Discretion

- Exact NestJS version (use latest stable v10 or v11)
- Precise error handling in Phase 1 handlers (NotImplementedException is acceptable)
- Dockerfile base image choice (node:20-alpine is fine)
- .env.example contents (PORT=3000 minimum)
- tsconfig strictness settings

### Deferred Ideas (OUT OF SCOPE)

- Prisma / database integration (Phase 2)
- Redis / caching (Phase 2)
- Health module (Phase 2)
- API response envelopes, versioning (Phase 3)
- Observability (Phase 3)
- Agent configs (Phase 4)
- CLI package (Phase 5)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-001 | Generic Template Scaffold: domain-agnostic NestJS app with one ExampleModule demonstrating DDD layers; `pnpm install && pnpm build` passes; no business-specific references; Docker build succeeds | Covered by Standard Stack, Architecture Patterns, Code Examples, and Dockerfile sections below |
</phase_requirements>

---

## Summary

Phase 1 creates `nestjs-backend-template/` from scratch as a standalone NestJS 11 project with pnpm. The project has no business logic — only an AppModule, a minimal main.ts with health ping (`GET /`), and one ExampleModule demonstrating full DDD + CQRS structure using the Item domain.

The critical pattern is that controllers never inject services — they inject `CommandBus` and `QueryBus` from `@nestjs/cqrs`. Phase 1 command/query handlers intentionally throw `NotImplementedException` because the real Prisma repository adapter is wired in Phase 2. The infrastructure/ directory is created but left empty (no files) so the build passes cleanly.

The reference codebase (flash-pick-service) uses NestJS 11 with TypeScript 5.7, pnpm, CommonJS modules, and has proven DDD base class patterns in `src/shared/`. Those exact patterns (AggregateRoot, ValueObject, DomainEvent) are reproduced verbatim in the template's `src/shared/base/` — they are simple, dependency-free, and compile cleanly.

**Primary recommendation:** Scaffold with `@nestjs/cli` (`nest new`), wire `@nestjs/cqrs` into ExampleModule, define placeholder base classes, leave infrastructure/ empty, and verify `pnpm build` passes before Phase 2.

---

## Project Constraints (from CLAUDE.md)

From `/Users/trannguyendanghuy/Workspace/happyland-of-draken/CLAUDE.md` (project-level):
- Use `context7` MCP tools for exploring latest docs
- Before implementation, delegate to `planner-researcher` agent
- After implementation, delegate to `code-reviewer` agent
- Run linting before commit; run tests before push
- Do NOT commit confidential information (.env files, API keys)
- Do NOT add AI attribution signatures to commits
- Use conventional commit format

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/core` | ^11.1.17 | NestJS framework core | Latest stable; flash-pick-service uses ^11 |
| `@nestjs/common` | ^11.1.17 | Decorators, pipes, guards | Same package family |
| `@nestjs/platform-express` | ^11.1.17 | Express HTTP adapter | Default NestJS transport |
| `@nestjs/cqrs` | ^11.0.3 | CommandBus, QueryBus, handlers | Locked decision — standard CQRS for NestJS |
| `reflect-metadata` | ^0.2.2 | Decorator metadata support | Required by NestJS |
| `rxjs` | ^7.8.1 | Reactive primitives | Required by NestJS |

### Dev / Build

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@nestjs/cli` | ^11.0.16 | `nest build`, schematics | Build toolchain |
| `@nestjs/schematics` | ^11.0.0 | Code generation | Required by CLI |
| `typescript` | ^5.7.3 | Compiler | Match flash-pick-service |
| `ts-node` | ^10.9.2 | Dev runtime | Local development |
| `tsconfig-paths` | ^4.2.0 | Path alias resolution | Needed for `@shared/*` aliases |
| `jest` | ^29.7.0 | Test runner | Standard in NestJS ecosystem |
| `ts-jest` | ^29.2.5 | TypeScript Jest transform | Required for TS tests |
| `@nestjs/testing` | ^11.0.0 | NestJS test utilities | Unit testing modules |
| `@types/node` | ^22.x | Node type definitions | TypeScript support |

**Installation:**
```bash
# In nestjs-backend-template/ directory
pnpm add @nestjs/common@^11 @nestjs/core@^11 @nestjs/platform-express@^11 @nestjs/cqrs@^11 reflect-metadata rxjs
pnpm add -D @nestjs/cli @nestjs/schematics @nestjs/testing typescript ts-node tsconfig-paths jest ts-jest @types/jest @types/node
```

Or use NestJS CLI scaffold then add @nestjs/cqrs:
```bash
pnpm dlx @nestjs/cli@latest new nestjs-backend-template --package-manager pnpm --skip-git
cd nestjs-backend-template
pnpm add @nestjs/cqrs
```

**Version verification (confirmed 2026-03-25):**
- `@nestjs/core`: 11.1.17 (npm registry)
- `@nestjs/cqrs`: 11.0.3 (npm registry)
- `@nestjs/cli`: 11.0.16 (npm registry)

---

## Architecture Patterns

### Recommended Project Structure

```
nestjs-backend-template/
├── src/
│   ├── main.ts                          # Bootstrap — NestFactory, PORT from env
│   ├── app.module.ts                    # Root module — imports ExampleModule
│   ├── shared/
│   │   └── base/
│   │       ├── aggregate-root.ts        # AggregateRoot<TId> placeholder
│   │       ├── value-object.ts          # ValueObject<TProps> with equals()
│   │       └── domain-event.ts          # DomainEvent with occurredAt
│   └── example/
│       ├── application/
│       │   ├── commands/
│       │   │   ├── create-item.command.ts
│       │   │   ├── create-item.handler.ts
│       │   │   ├── delete-item.command.ts
│       │   │   └── delete-item.handler.ts
│       │   ├── queries/
│       │   │   ├── get-item.query.ts
│       │   │   ├── get-item.handler.ts
│       │   │   ├── list-items.query.ts
│       │   │   └── list-items.handler.ts
│       │   └── dtos/
│       │       ├── create-item.dto.ts
│       │       └── item.response.dto.ts
│       ├── domain/
│       │   ├── item.entity.ts           # Item extends AggregateRoot<string>
│       │   ├── item-name.value-object.ts # ItemName extends ValueObject<{value: string}>
│       │   └── item.repository.interface.ts  # IItemRepository port
│       ├── infrastructure/
│       │   └── .gitkeep                 # Empty in Phase 1 — Prisma adapter Phase 2
│       ├── presenter/
│       │   └── item.controller.ts       # Injects CommandBus + QueryBus only
│       └── example.module.ts
├── test/
│   └── unit/                            # Jest unit specs
├── Dockerfile
├── .dockerignore
├── .env.example
├── .gitignore
├── nest-cli.json
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── tsconfig.build.json
```

### Pattern 1: CQRS Controller (Locked Decision)

**What:** Controller injects CommandBus + QueryBus, never a service.
**When to use:** All controllers in this template.

```typescript
// src/example/presenter/item.controller.ts
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateItemDto } from '../application/dtos/create-item.dto';
import { CreateItemCommand } from '../application/commands/create-item.command';
import { DeleteItemCommand } from '../application/commands/delete-item.command';
import { GetItemQuery } from '../application/queries/get-item.query';
import { ListItemsQuery } from '../application/queries/list-items.query';

@Controller('items')
export class ItemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  create(@Body() dto: CreateItemDto) {
    return this.commandBus.execute(new CreateItemCommand(dto.name));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteItemCommand(id));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queryBus.execute(new GetItemQuery(id));
  }

  @Get()
  findAll() {
    return this.queryBus.execute(new ListItemsQuery());
  }
}
```

### Pattern 2: Command Handler with NotImplementedException

**What:** Phase 1 handlers throw until Phase 2 wires real repo.
**When to use:** All four handlers in Phase 1.

```typescript
// src/example/application/commands/create-item.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotImplementedException } from '@nestjs/common';
import { CreateItemCommand } from './create-item.command';

@CommandHandler(CreateItemCommand)
export class CreateItemHandler implements ICommandHandler<CreateItemCommand> {
  async execute(_command: CreateItemCommand): Promise<void> {
    throw new NotImplementedException('CreateItemHandler: wired in Phase 2');
  }
}
```

### Pattern 3: Query Handler (same pattern)

```typescript
// src/example/application/queries/get-item.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotImplementedException } from '@nestjs/common';
import { GetItemQuery } from './get-item.query';

@QueryHandler(GetItemQuery)
export class GetItemHandler implements IQueryHandler<GetItemQuery> {
  async execute(_query: GetItemQuery): Promise<unknown> {
    throw new NotImplementedException('GetItemHandler: wired in Phase 2');
  }
}
```

### Pattern 4: ExampleModule wiring

```typescript
// src/example/example.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ItemController } from './presenter/item.controller';
import { CreateItemHandler } from './application/commands/create-item.handler';
import { DeleteItemHandler } from './application/commands/delete-item.handler';
import { GetItemHandler } from './application/queries/get-item.handler';
import { ListItemsHandler } from './application/queries/list-items.handler';

const CommandHandlers = [CreateItemHandler, DeleteItemHandler];
const QueryHandlers = [GetItemHandler, ListItemsHandler];

@Module({
  imports: [CqrsModule],
  controllers: [ItemController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class ExampleModule {}
```

### Pattern 5: DDD Base Classes (from flash-pick-service reference)

```typescript
// src/shared/base/value-object.ts
export abstract class ValueObject<TProps> {
  protected readonly props: TProps;

  protected constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  equals(other?: ValueObject<TProps>): boolean {
    if (!other) return false;
    if (other === this) return true;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}

// src/shared/base/domain-event.ts
export abstract class DomainEvent {
  readonly occurredAt: Date;
  protected constructor() {
    this.occurredAt = new Date();
  }
}

// src/shared/base/aggregate-root.ts
import { DomainEvent } from './domain-event';

export abstract class AggregateRoot<TId> {
  readonly id: TId;
  private readonly domainEvents: DomainEvent[] = [];

  protected constructor(id: TId) {
    this.id = id;
  }

  addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }
}
```

### Pattern 6: Item domain model

```typescript
// src/example/domain/item-name.value-object.ts
import { ValueObject } from '../../shared/base/value-object';

interface ItemNameProps { value: string; }

export class ItemName extends ValueObject<ItemNameProps> {
  static create(value: string): ItemName {
    if (!value || value.trim().length === 0) {
      throw new Error('ItemName cannot be empty');
    }
    return new ItemName({ value: value.trim() });
  }
  get value(): string { return this.props.value; }
}

// src/example/domain/item.entity.ts
import { AggregateRoot } from '../../shared/base/aggregate-root';
import { ItemName } from './item-name.value-object';

export class Item extends AggregateRoot<string> {
  private _name: ItemName;

  private constructor(id: string, name: ItemName) {
    super(id);
    this._name = name;
  }

  static create(id: string, name: ItemName): Item {
    return new Item(id, name);
  }

  get name(): ItemName { return this._name; }
}

// src/example/domain/item.repository.interface.ts
import { Item } from './item.entity';

export const ITEM_REPOSITORY = Symbol('IItemRepository');

export interface IItemRepository {
  findById(id: string): Promise<Item | null>;
  findAll(): Promise<Item[]>;
  save(item: Item): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### Pattern 7: Minimal main.ts (Phase 1)

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
```

### Pattern 8: tsconfig.json (aligned with flash-pick-service)

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": {
      "@shared/*": ["src/shared/*"]
    },
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": false
  },
  "exclude": ["node_modules", "dist", "test"]
}
```

tsconfig.build.json (excludes test files from build):
```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

### Anti-Patterns to Avoid

- **Injecting a service into the controller:** Controller must only inject CommandBus + QueryBus. Never `private readonly itemService: ItemService`.
- **Putting infrastructure code in Phase 1:** The `infrastructure/` directory must remain empty (`.gitkeep` only). No Prisma schemas, no adapters.
- **Using @nestjs/cqrs AggregateRoot:** NestJS exports its own `AggregateRoot` from `@nestjs/cqrs`. Do NOT use it — use the custom `src/shared/base/aggregate-root.ts` instead. The NestJS one is tied to event bus wiring that comes in later phases.
- **Missing `emitDecoratorMetadata: true`:** NestJS DI fails silently without this in tsconfig. Always verify.
- **Empty infrastructure/ causes tsc errors:** An empty directory is fine; an empty TypeScript file with no exports can cause module resolution issues. Use `.gitkeep` (not a `.ts` file).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command/Query dispatch | Custom event emitter bus | `@nestjs/cqrs` CommandBus/QueryBus | Handler registration, typing, middleware support built-in |
| Decorator metadata | Manual DI container | NestJS DI via `@Module`, `@Injectable` | Lifecycle management, circular dep detection |
| HTTP not-implemented response | Custom exception class | `NotImplementedException` from `@nestjs/common` | Returns 501 with proper HTTP semantics |

**Key insight:** `@nestjs/cqrs` handles handler discovery automatically when handlers are listed in `providers[]` — no manual registration needed.

---

## Common Pitfalls

### Pitfall 1: `@nestjs/cqrs` AggregateRoot vs custom AggregateRoot

**What goes wrong:** Developer imports `AggregateRoot` from `@nestjs/cqrs` into the domain entity. This introduces a framework dependency into the domain layer and requires event bus wiring that doesn't exist in Phase 1.
**Why it happens:** `@nestjs/cqrs` re-exports its own `AggregateRoot` class.
**How to avoid:** Always import from `../../shared/base/aggregate-root` in domain entities. The custom class is framework-free.
**Warning signs:** `import { AggregateRoot } from '@nestjs/cqrs'` anywhere in `domain/`.

### Pitfall 2: `pnpm build` fails on empty infrastructure directory

**What goes wrong:** TypeScript compiler warns or errors on empty module directories if barrel `index.ts` files reference missing exports.
**Why it happens:** If `example.module.ts` or any file tries to import from `./infrastructure/`, the empty directory causes a module not found error.
**How to avoid:** Do NOT create any barrel `index.ts` in `infrastructure/` that imports non-existent files. Use `.gitkeep` only. Don't import from `infrastructure/` in Phase 1.
**Warning signs:** `Cannot find module './infrastructure/...'` during `nest build`.

### Pitfall 3: Missing `CqrsModule` import in ExampleModule

**What goes wrong:** `CommandBus` and `QueryBus` are undefined when injected into the controller. NestJS throws "Nest can't resolve dependencies" at runtime.
**Why it happens:** `CqrsModule` must be imported in the module that uses CommandBus/QueryBus — it is not global.
**How to avoid:** Always include `imports: [CqrsModule]` in `ExampleModule`.
**Warning signs:** `Error: Nest can't resolve dependencies of the ItemController`.

### Pitfall 4: Handler not listed in `providers[]`

**What goes wrong:** `@CommandHandler` / `@QueryHandler` decorators are applied but the handler is never registered, so `commandBus.execute()` throws "handler not found".
**Why it happens:** NestJS discovers handlers through the DI container — they must be in `providers[]`.
**How to avoid:** Group handlers in arrays (`CommandHandlers`, `QueryHandlers`) and spread into `providers`. Verify count matches number of handler files.
**Warning signs:** `CommandHandlerNotFoundException` at runtime.

### Pitfall 5: pnpm workspace conflict

**What goes wrong:** Root `pnpm-workspace.yaml` includes `nestjs-backend-template/` causing pnpm to treat it as a workspace member, which breaks standalone install.
**Why it happens:** Root workspace already manages other packages.
**How to avoid:** Do NOT add `nestjs-backend-template/` to root `pnpm-workspace.yaml`. The template is standalone — it has its own `pnpm-lock.yaml` and is self-contained.
**Warning signs:** `pnpm install` inside `nestjs-backend-template/` resolves packages from parent workspace instead of local `node_modules`.

---

## pnpm Workspace Configuration

The template is **standalone**, not a workspace member:

- Root `pnpm-workspace.yaml` at `/happyland-of-draken/`: do NOT add `nestjs-backend-template` to packages list.
- `nestjs-backend-template/` has its own `package.json`, `pnpm-lock.yaml`, and `node_modules/`.
- Developers clone `nestjs-backend-template/` independently; they run `pnpm install` inside it.

Root `pnpm-workspace.yaml` should remain unchanged. If none exists yet:
```yaml
# This file intentionally does not include nestjs-backend-template/
# That project is a standalone cloneable template.
packages: []
```

---

## Dockerfile

```dockerfile
# Dockerfile for nestjs-backend-template
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/src/main"]
```

`.dockerignore`:
```
node_modules
dist
.env
.env.*
!.env.example
coverage
*.log
```

**Key Dockerfile decisions (confidence HIGH):**
- `node:20-alpine` — LTS Node 20 on Alpine; small image, production-standard
- `corepack enable` — activates pnpm without separate install step
- `--frozen-lockfile` — ensures reproducible builds; fails if lockfile is out of sync
- Two-stage build — builder installs all deps + compiles; production stage has only prod deps + dist

---

## .env.example Contents

Minimal for Phase 1 (no database, no cache):

```bash
# Application
PORT=3000
NODE_ENV=development
```

Phase 2 will add `DATABASE_URL`, `REDIS_URL`. Phase 3 will add `OTEL_ENABLED`, `METRICS_ENABLED`.

---

## Making `pnpm build` Pass with Empty Infrastructure

The `nest build` command runs `tsc -p tsconfig.build.json` under the hood. To ensure it passes:

1. `infrastructure/` directory contains only `.gitkeep` — no TypeScript files
2. No file imports from `infrastructure/` in Phase 1
3. `tsconfig.build.json` excludes test files
4. `nest-cli.json` points to `src/` as sourceRoot:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

5. `package.json` scripts:
```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/src/main",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "test": "jest",
    "test:cov": "jest --coverage"
  }
}
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `package.json` jest section (or `jest.config.ts`) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test:cov` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| REQ-001 | `pnpm build` passes with zero errors | build smoke | `pnpm build` | N/A — build command |
| REQ-001 | No references to flash-pick, product, shopee, clickhouse in source | lint/grep | `grep -r "flash-pick\|shopee\|clickhouse" src/` | N/A — grep check |
| REQ-001 | ExampleModule demonstrates domain/application/infrastructure layers | structural | manual inspection | N/A |
| REQ-001 | Docker build succeeds | build smoke | `docker build .` | N/A |
| REQ-001 | Item entity, ItemName VO, IItemRepository interface exist | unit | `pnpm test -- --testPathPattern=example` | Wave 0 gap |
| REQ-001 | CommandBus/QueryBus wired — handlers registered in providers | unit | `pnpm test -- --testPathPattern=example.module` | Wave 0 gap |

### Sampling Rate

- **Per task commit:** `pnpm build` (verify zero tsc errors)
- **Per wave merge:** `pnpm test` (unit suite green)
- **Phase gate:** `pnpm build` + `pnpm test` green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `test/unit/example/item.entity.spec.ts` — unit test for Item entity creation and ItemName VO
- [ ] `test/unit/example/example.module.spec.ts` — verifies module compiles and CommandBus resolves
- [ ] Jest config in `package.json` — must be created as part of scaffold

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v24.4.1 | — |
| pnpm | Package manager | Yes | 10.13.1 | — |
| @nestjs/cli | `nest new`, `nest build` | To be installed | 11.0.16 | `pnpm dlx @nestjs/cli` |
| Docker | Docker build verification | Not checked | — | Skip Docker test, flag for CI |

**Missing dependencies with no fallback:**
- None that block code creation. `@nestjs/cli` can be run via `pnpm dlx` without global install.

**Missing dependencies with fallback:**
- Docker: if not available locally, Docker build test can be deferred to CI pipeline.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@nestjs/cqrs` v9 separate `IEvent` for sagas | v11 simplifies saga config | NestJS 11 | No sagas in Phase 1 — no impact |
| `pnpm install --shamefully-hoist` required for some packages | Modern packages handle peer deps correctly | pnpm 9+ | No hoist flags needed |
| `node:18-alpine` Dockerfile base | `node:20-alpine` (LTS) | Node 20 became LTS | Use node:20-alpine |

---

## Open Questions

1. **Root pnpm-workspace.yaml existence**
   - What we know: Root workspace has multiple directories (flash-pick-service, user-service, etc.)
   - What's unclear: Whether a root `pnpm-workspace.yaml` already exists
   - Recommendation: Check at implementation time. If it exists, verify `nestjs-backend-template` is NOT listed. If missing, no action needed — template is self-contained.

2. **`nest new` vs manual scaffold**
   - What we know: `nest new` generates a working project with correct tsconfig, nest-cli.json, and scripts
   - What's unclear: Whether generated gitignore/eslint config needs cleanup
   - Recommendation: Use `nest new` as base, then add `@nestjs/cqrs` and create DDD structure manually. Delete generated `app.controller.ts`, `app.service.ts` stubs.

---

## Sources

### Primary (HIGH confidence)

- flash-pick-service source code — `src/shared/aggregate-root.ts`, `src/shared/valueobject.ts`, `src/shared/domain-event.ts`, `src/shared/core/repositories/repository.interface.ts` — exact base class patterns verified by reading files
- flash-pick-service `package.json` — confirmed NestJS 11, TypeScript 5.7, pnpm, Jest 29, all exact versions
- flash-pick-service `tsconfig.json` — confirmed tsconfig settings: ES2023 target, CommonJS, path aliases
- npm registry (via `npm view`) — `@nestjs/core` 11.1.17, `@nestjs/cqrs` 11.0.3, `@nestjs/cli` 11.0.16 (verified 2026-03-25)
- `01-CONTEXT.md` — locked architecture decisions

### Secondary (MEDIUM confidence)

- `@nestjs/cqrs` README pattern — CommandHandler/QueryHandler decorator usage, CqrsModule import requirement
- NestJS Dockerfile patterns — node:20-alpine + corepack + two-stage build (standard pattern across NestJS docs)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified from npm registry and flash-pick-service package.json
- Architecture: HIGH — patterns locked in CONTEXT.md, base classes read directly from reference codebase
- Pitfalls: HIGH — derived from concrete NestJS DI behavior and verified against reference codebase
- Dockerfile: HIGH — standard two-stage node:20-alpine pattern

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (NestJS 11 stable; @nestjs/cqrs API stable)
