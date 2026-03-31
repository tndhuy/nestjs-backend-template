# Architecture Guide

This document explains the Domain-Driven Design (DDD) architecture used in this template. Every domain module follows the same four-layer structure. The `ExampleModule` at `src/example/` is the canonical reference.

---

## DDD Layer Overview

Layers are strictly ordered. Each layer may only depend on layers below it.

```
┌─────────────────────────────────────────┐
│           Presenter Layer               │  HTTP controllers, Swagger decorators
├─────────────────────────────────────────┤
│          Application Layer              │  Commands, Queries, Handlers, DTOs
├─────────────────────────────────────────┤
│         Infrastructure Layer            │  Prisma repos, Redis, external clients
├─────────────────────────────────────────┤
│            Domain Layer                 │  Entities, Value Objects, Repo interfaces
└─────────────────────────────────────────┘
```

**Dependency rule:**
- Domain depends on nothing
- Application depends on Domain only
- Infrastructure depends on Domain interfaces (implements them)
- Presenter depends on Application (via CommandBus / QueryBus)

Cross-cutting utilities live in `src/shared/` (DDD base classes, DTOs, exceptions) and `src/common/` (NestJS filters, interceptors, middleware, decorators).

---

## Domain Layer

**Location:** `src/<module>/domain/`

**What goes here:**
- **Entities** — objects with identity, mutable state, and business invariants
- **Value Objects** — immutable, validated domain primitives
- **Repository Interfaces** — ports defining data access contracts (no implementation)
- **Domain Events** — facts raised after state changes

**Key rule:** Pure TypeScript only. No `@nestjs/*` imports, no Prisma, no HTTP types.

### Concrete examples from ExampleModule

**Entity** — `src/example/domain/item.entity.ts`

```typescript
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

  get name(): ItemName {
    return this._name;
  }
}
```

**Value Object** — `src/example/domain/item-name.value-object.ts`

```typescript
import { ValueObject } from '../../shared/base/value-object';

interface ItemNameProps {
  value: string;
}

export class ItemName extends ValueObject<ItemNameProps> {
  static create(value: string): ItemName {
    if (!value || value.trim().length === 0) {
      throw new Error('ItemName cannot be empty');
    }
    return new ItemName({ value: value.trim() });
  }

  get value(): string {
    return this.props.value;
  }
}
```

**Repository Interface (Port)** — `src/example/domain/item.repository.interface.ts`

```typescript
import { Item } from './item.entity';

export const ITEM_REPOSITORY = Symbol('IItemRepository');

export interface IItemRepository {
  findById(id: string): Promise<Item | null>;
  findAll(): Promise<Item[]>;
  save(item: Item): Promise<void>;
  delete(id: string): Promise<void>;
}
```

---

## Application Layer

**Location:** `src/<module>/application/`

**What goes here:**
- **Commands** — intent to change state (e.g., `CreateItemCommand`)
- **Command Handlers** — `@CommandHandler` classes that execute commands
- **Queries** — intent to read data (e.g., `GetItemQuery`)
- **Query Handlers** — `@QueryHandler` classes that execute queries
- **DTOs** — request and response shapes for the Presenter layer

**Key rule:** Orchestrates the Domain. May inject repository interfaces. Must not import from Infrastructure or Presenter.

### Concrete examples from ExampleModule

**Command** — `src/example/application/commands/create-item.command.ts`

```typescript
export class CreateItemCommand {
  constructor(public readonly name: string) {}
}
```

**Command Handler** — `src/example/application/commands/create-item.handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateItemCommand } from './create-item.command';
import { ITEM_REPOSITORY, IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';
import { ItemName } from '../../domain/item-name.value-object';

@CommandHandler(CreateItemCommand)
export class CreateItemHandler implements ICommandHandler<CreateItemCommand> {
  constructor(
    @Inject(ITEM_REPOSITORY) private readonly itemRepository: IItemRepository,
  ) {}

  async execute(command: CreateItemCommand): Promise<string> {
    const id = crypto.randomUUID();
    const item = Item.create(id, ItemName.create(command.name));
    await this.itemRepository.save(item);
    return id;
  }
}
```

**Query Handler** — `src/example/application/queries/get-item.handler.ts`

```typescript
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetItemQuery } from './get-item.query';
import { ITEM_REPOSITORY, IItemRepository } from '../../domain/item.repository.interface';

@QueryHandler(GetItemQuery)
export class GetItemHandler implements IQueryHandler<GetItemQuery> {
  constructor(
    @Inject(ITEM_REPOSITORY) private readonly itemRepository: IItemRepository,
  ) {}

  async execute(query: GetItemQuery) {
    return this.itemRepository.findById(query.id);
  }
}
```

**Request DTO** — `src/example/application/dtos/create-item.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ description: 'The name of the item', example: 'My Item' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

---

## Infrastructure Layer

**Location:** `src/<module>/infrastructure/`

**What goes here:**
- **Prisma repositories** — concrete implementations of domain repository interfaces
- **External service adapters** — HTTP clients, Redis adapters, Kafka producers
- **Persistence mappers** — translate between DB records and domain objects

**Key rule:** Implements the ports (interfaces) defined in the Domain layer. May import Prisma, ioredis, etc. Must not be imported by Domain or Application layers.

### Concrete example from ExampleModule

**Prisma Repository** — `src/example/infrastructure/persistence/prisma-item.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectPrisma } from '../../../infrastructure/database/inject-prisma.decorator';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';
import { ItemName } from '../../domain/item-name.value-object';

@Injectable()
export class PrismaItemRepository implements IItemRepository {
  constructor(@InjectPrisma() private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Item | null> {
    const record = await this.prisma.item.findUnique({ where: { id } });
    if (!record) return null;
    return Item.create(record.id, ItemName.create(record.name));
  }

  async save(item: Item): Promise<void> {
    await this.prisma.item.upsert({
      where: { id: item.id },
      update: { name: item.name.value },
      create: { id: item.id, name: item.name.value },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.item.delete({ where: { id } });
  }
}
```

---

## Presenter Layer

**Location:** `src/<module>/presenter/`

**What goes here:**
- **Controllers** — NestJS `@Controller` classes with route handlers
- **Swagger decorators** — `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`

**Key rule:** HTTP concerns only. Delegates all work to the Application layer via `CommandBus` and `QueryBus`. Must not contain business logic.

### Concrete example from ExampleModule

**Controller** — `src/example/presenter/item.controller.ts`

```typescript
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateItemDto } from '../application/dtos/create-item.dto';
import { CreateItemCommand } from '../application/commands/create-item.command';
import { GetItemQuery } from '../application/queries/get-item.query';

@ApiTags('example')
@Controller('items')
export class ItemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({ status: 201, description: 'Item created successfully', type: ItemResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  create(@Body() dto: CreateItemDto) {
    return this.commandBus.execute(new CreateItemCommand(dto.name));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item by ID' })
  @ApiParam({ name: 'id', description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Item found', type: ItemResponseDto })
  @ApiResponse({ status: 404, description: 'Item not found' })
  findOne(@Param('id') id: string) {
    return this.queryBus.execute(new GetItemQuery(id));
  }
}
```

---

## Shared Code

### `src/shared/` — DDD base classes and cross-module utilities

| File / Directory | Purpose |
|-----------------|---------|
| `src/shared/base/aggregate-root.ts` | Base class for domain entities with identity |
| `src/shared/base/value-object.ts` | Base class for immutable value objects |
| `src/shared/dto/pagination.dto.ts` | `PaginationDto` query params and `PaginationMeta` interface |
| `src/shared/exceptions/app.exception.ts` | `AppException` — typed HTTP exception with error code |
| `src/shared/index.ts` | Barrel export for all shared utilities |

### `src/common/` — NestJS cross-cutting concerns

| File / Directory | Purpose |
|-----------------|---------|
| `src/common/filters/` | Global HTTP exception filter (`http-exception.filter.ts`) |
| `src/common/interceptors/transform.interceptor.ts` | Wraps all responses in `{ success: true, data }` envelope |
| `src/common/decorators/raw-response.decorator.ts` | `@RawResponse()` — bypasses the response envelope |
| `src/common/middleware/correlation-id.middleware.ts` | Injects `X-Correlation-ID` header on every request |

---

## Data Flow

A typical HTTP request through the template:

```
HTTP Request
    │
    ▼
Controller (@Controller)
    │  dispatches via CommandBus or QueryBus
    ▼
Command / Query Handler (@CommandHandler / @QueryHandler)
    │  uses domain interfaces
    ▼
Repository Interface (IItemRepository)
    │  implemented by
    ▼
Prisma Repository (PrismaItemRepository)
    │  queries
    ▼
PostgreSQL (via PrismaService)
    │  returns DB record
    ▼
Domain Object (Item entity)
    │  returned up through handler
    ▼
TransformInterceptor wraps response
    │
    ▼
HTTP Response: { success: true, data: { ... } }
```

---

## Directory Structure

```
src/
├── main.ts                          # Entry point — bootstraps NestJS app
├── app.module.ts                    # Root module — imports all feature modules
│
├── example/                         # Reference domain module (DDD pattern demo)
│   ├── example.module.ts            # Module declaration and DI wiring
│   ├── domain/                      # [DOMAIN LAYER] Pure TypeScript business logic
│   │   ├── item.entity.ts           #   Aggregate root entity
│   │   ├── item-name.value-object.ts#   Value object with validation
│   │   └── item.repository.interface.ts # Repository port (interface)
│   ├── application/                 # [APPLICATION LAYER] Use cases via CQRS
│   │   ├── commands/
│   │   │   ├── create-item.command.ts
│   │   │   ├── create-item.handler.ts
│   │   │   ├── delete-item.command.ts
│   │   │   └── delete-item.handler.ts
│   │   ├── queries/
│   │   │   ├── get-item.query.ts
│   │   │   ├── get-item.handler.ts
│   │   │   ├── list-items.query.ts
│   │   │   └── list-items.handler.ts
│   │   └── dtos/
│   │       ├── create-item.dto.ts
│   │       └── item.response.dto.ts
│   ├── infrastructure/              # [INFRASTRUCTURE LAYER] Concrete implementations
│   │   └── persistence/
│   │       └── prisma-item.repository.ts
│   └── presenter/                   # [PRESENTER LAYER] HTTP + Swagger
│       └── item.controller.ts
│
├── infrastructure/                  # Shared infrastructure modules
│   ├── config/                      # AppConfigModule — env var validation
│   ├── database/                    # PrismaService, InjectPrisma decorator
│   ├── cache/                       # RedisService with circuit breaker
│   └── health/                      # Health check endpoint (/health)
│
├── shared/                          # DDD base classes and shared DTOs
│   ├── base/
│   │   ├── aggregate-root.ts        # AggregateRoot<TId> base class
│   │   └── value-object.ts          # ValueObject<TProps> base class
│   ├── dto/
│   │   └── pagination.dto.ts        # PaginationDto and PaginationMeta
│   ├── exceptions/
│   │   └── app.exception.ts         # AppException with typed error code
│   └── index.ts                     # Barrel export
│
└── common/                          # NestJS cross-cutting concerns
    ├── decorators/
    │   └── raw-response.decorator.ts # @RawResponse() — bypass envelope
    ├── filters/
    │   └── http-exception.filter.ts  # Global exception → JSON error response
    ├── interceptors/
    │   └── transform.interceptor.ts  # Global response envelope wrapper
    └── middleware/
        └── correlation-id.middleware.ts
```
