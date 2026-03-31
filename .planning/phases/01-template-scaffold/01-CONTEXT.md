# Phase 1: Template Scaffold - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Source:** discuss-phase decisions (locked 2026-03-25)

<domain>
## Phase Boundary

Phase 1 delivers a bare NestJS skeleton with one working ExampleModule demonstrating DDD + CQRS intent.

**Phase 1 scope (strict):**
- `nestjs-backend-template/` directory created from scratch in the workspace root
- Bare NestJS app — AppModule, main.ts, health ping, nothing domain-specific
- One `ExampleModule` with full DDD + CQRS structure (Item domain)
- pnpm workspace setup, Dockerfile, .env.example
- Passing `pnpm build`

**Explicitly OUT of Phase 1 scope:**
- Prisma / database integration (Phase 2)
- Redis / caching (Phase 2)
- Health module (Phase 2)
- API response envelopes, versioning (Phase 3)
- Observability (Phase 3)
- Agent configs (Phase 4)
- CLI package (Phase 5)

</domain>

<decisions>
## Implementation Decisions

### A — Source: Build from scratch
- **Decision:** Build `nestjs-backend-template/` as a completely new project from scratch.
- Do NOT copy from flash-pick-service. No business logic, no Shopee references, no flash-sale domain.
- Use flash-pick-service as a *reference* for DDD patterns only, never as a base to strip.

### B.1 — ExampleModule: No stub repositories
- **Decision:** Phase 1 ExampleModule does NOT need stub/in-memory repository implementations.
- Since Phase 1+2 execute together, the real Prisma repository integration is added in Phase 2.
- Phase 1 defines the repository interface; Phase 2 provides the concrete adapter.

### B.2 — ExampleModule pattern: @nestjs/cqrs
- **Decision:** ExampleModule uses `@nestjs/cqrs` with CommandBus and QueryBus.
- This is the full DDD intent — the template demonstrates the correct pattern from day 1.
- Commands: `CreateItemCommand`, `DeleteItemCommand` (with handlers)
- Queries: `GetItemQuery`, `ListItemsQuery` (with handlers)
- Controller injects CommandBus + QueryBus, never ItemService.
- Item is the domain entity (extends AggregateRoot placeholder), ItemName is a ValueObject.
- Repository interface lives in the domain layer (`IItemRepository`).

### C — Phase 1 scope: Bare skeleton only
- **Decision:** Phase 1 = bare NestJS skeleton + ExampleModule structure.
- No Prisma, no Redis, no Health checks in Phase 1.
- ExampleModule handlers may throw `NotImplementedException` or similar until Phase 2 wires the real repo.

### Template project location
- **Decision:** `nestjs-backend-template/` at the workspace root (`happyland-of-draken/nestjs-backend-template/`).
- Standalone cloneable project, NOT a pnpm workspace member of the monorepo.
- Has its own `package.json`, `pnpm-lock.yaml`, `tsconfig.json`.

### Package manager
- **Decision:** pnpm (consistent with the rest of the workspace).

### ExampleModule DDD layer structure
```
src/
  app.module.ts
  main.ts
  example/
    application/
      commands/
        create-item.command.ts
        create-item.handler.ts
        delete-item.command.ts
        delete-item.handler.ts
      queries/
        get-item.query.ts
        get-item.handler.ts
        list-items.query.ts
        list-items.handler.ts
      dtos/
        create-item.dto.ts
        item.response.dto.ts
    domain/
      item.entity.ts
      item-name.value-object.ts
      item.repository.interface.ts
    infrastructure/
      (empty in Phase 1 — Prisma adapter added in Phase 2)
    presenter/
      item.controller.ts
    example.module.ts
  shared/
    (empty in Phase 1 — base classes added in Phase 2)
```

### Claude's Discretion
- Exact NestJS version (use latest stable v10 or v11)
- Precise error handling in Phase 1 handlers (NotImplementedException is acceptable)
- Dockerfile base image choice (node:20-alpine is fine)
- .env.example contents (PORT=3000 minimum)
- tsconfig strictness settings

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Phase deliverables and success criteria
- `.planning/REQUIREMENTS.md` — REQ-001 acceptance criteria
- `.planning/STATE.md` — Active decisions and project context

### Reference Architecture (read-only — do NOT copy files)
- `flash-pick-service/src/shared/` — Reference DDD base class patterns (Entity, ValueObject, AggregateRoot)
- `flash-pick-service/src/` — Reference for DDD layer naming conventions

</canonical_refs>

<specifics>
## Specific Ideas

### ExampleModule CQRS wiring (from B.2 decision)
```typescript
// presenter/item.controller.ts
@Post()
async create(@Body() dto: CreateItemDto) {
  return this.commandBus.execute(new CreateItemCommand(dto.name));
}

@Get(':id')
async findOne(@Param('id') id: string) {
  return this.queryBus.execute(new GetItemQuery(id));
}

// application/commands/create-item.handler.ts
@CommandHandler(CreateItemCommand)
export class CreateItemHandler implements ICommandHandler<CreateItemCommand> {
  async execute(command: CreateItemCommand): Promise<void> {
    // Phase 2 wires real repo — Phase 1 may throw NotImplementedException
    throw new Error('Not implemented — wired in Phase 2');
  }
}
```

### pnpm workspace integration
- Template is standalone but lives inside the workspace folder
- Add to root `pnpm-workspace.yaml` as optional member or keep separate
- Template's own `package.json` is the source of truth for its deps

</specifics>

<deferred>
## Deferred Ideas

- Real Prisma repository adapter — Phase 2
- Redis cache integration — Phase 2
- `/health` endpoint — Phase 2
- API versioning (`/api/v1/`) — Phase 3
- Response envelope interceptor — Phase 3
- Pino structured logging — Phase 3
- OpenTelemetry + Prometheus — Phase 3
- Claude Code `.claude/` config — Phase 4
- Antigravity `.agent/` config — Phase 4
- `npx @team/create-app` CLI — Phase 5

</deferred>

---

*Phase: 01-template-scaffold*
*Context gathered: 2026-03-25 via discuss-phase session*
