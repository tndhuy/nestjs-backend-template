# Contributing Guide

This guide explains how to extend this template by adding new domain modules. It assumes familiarity with NestJS and basic DDD concepts. The canonical reference module throughout this walkthrough is `src/example/`.

---

## Prerequisites

- **pnpm** installed (`npm install -g pnpm`)
- **Docker** running (PostgreSQL + Redis via `docker compose up -d`)
- Basic understanding of DDD: entities, value objects, commands, queries

---

## Add a New Module

The following walkthrough adds a hypothetical `Product` module. Replace `product`/`Product` with your domain noun throughout.

---

### Step 1: Create the Domain Entity

The entity is the core business object with an identity. It extends `AggregateRoot<TId>` from the shared base classes.

**File to create:** `src/product/domain/product.entity.ts`

Reference: `src/example/domain/item.entity.ts`

```typescript
import { AggregateRoot } from '../../shared/base/aggregate-root';
import { ProductName } from './product-name.value-object';

export class Product extends AggregateRoot<string> {
  private _name: ProductName;

  private constructor(id: string, name: ProductName) {
    super(id);
    this._name = name;
  }

  static create(id: string, name: ProductName): Product {
    return new Product(id, name);
  }

  get name(): ProductName {
    return this._name;
  }
}
```

Key points:
- Constructor is `private` — use the static `create()` factory
- State is stored in typed value objects, not primitives
- No framework imports (`@nestjs/*`) in this file

---

### Step 2: Create Value Objects

Value objects are immutable, validated domain primitives. They extend `ValueObject<TProps>`.

**File to create:** `src/product/domain/product-name.value-object.ts`

Reference: `src/example/domain/item-name.value-object.ts`

```typescript
import { ValueObject } from '../../shared/base/value-object';

interface ProductNameProps {
  value: string;
}

export class ProductName extends ValueObject<ProductNameProps> {
  static create(value: string): ProductName {
    if (!value || value.trim().length === 0) {
      throw new Error('ProductName cannot be empty');
    }
    if (value.trim().length > 200) {
      throw new Error('ProductName cannot exceed 200 characters');
    }
    return new ProductName({ value: value.trim() });
  }

  get value(): string {
    return this.props.value;
  }
}
```

Key points:
- Validation lives in the `static create()` method — throw domain errors on invalid input
- `ValueObject` equality is structural (same props = same value)

---

### Step 3: Define the Repository Interface

The repository interface (port) defines the data access contract. The domain layer declares it; the infrastructure layer implements it.

**File to create:** `src/product/domain/product.repository.interface.ts`

Reference: `src/example/domain/item.repository.interface.ts`

```typescript
import { Product } from './product.entity';

export const PRODUCT_REPOSITORY = Symbol('IProductRepository');

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
```

Key points:
- Export a `Symbol` token (used for `@Inject()` in handlers)
- Methods use domain types (`Product`), never DB types (`PrismaProduct`)
- No Prisma or NestJS imports in this file

---

### Step 4: Create a CQRS Command and Handler

Commands represent write operations. They are dispatched via `CommandBus` and handled by `@CommandHandler` classes.

**Files to create:**
- `src/product/application/commands/create-product.command.ts`
- `src/product/application/commands/create-product.handler.ts`

Reference: `src/example/application/commands/create-item.command.ts` and `create-item.handler.ts`

```typescript
// create-product.command.ts
export class CreateProductCommand {
  constructor(public readonly name: string) {}
}
```

```typescript
// create-product.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateProductCommand } from './create-product.command';
import { PRODUCT_REPOSITORY, IProductRepository } from '../../domain/product.repository.interface';
import { Product } from '../../domain/product.entity';
import { ProductName } from '../../domain/product-name.value-object';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<string> {
    const id = crypto.randomUUID();
    const product = Product.create(id, ProductName.create(command.name));
    await this.productRepository.save(product);
    return id;
  }
}
```

Key points:
- `@CommandHandler(CreateProductCommand)` links the class to its command
- Inject the repository via its Symbol token, not the concrete class
- The handler returns a primitive or DTO — never a domain object directly to the controller

---

### Step 5: Create a CQRS Query and Handler

Queries represent read operations. They are dispatched via `QueryBus` and handled by `@QueryHandler` classes.

**Files to create:**
- `src/product/application/queries/get-product.query.ts`
- `src/product/application/queries/get-product.handler.ts`

Reference: `src/example/application/queries/get-item.handler.ts`

```typescript
// get-product.query.ts
export class GetProductQuery {
  constructor(public readonly id: string) {}
}
```

```typescript
// get-product.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetProductQuery } from './get-product.query';
import { PRODUCT_REPOSITORY, IProductRepository } from '../../domain/product.repository.interface';
import { Product } from '../../domain/product.entity';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(query: GetProductQuery): Promise<Product | null> {
    return this.productRepository.findById(query.id);
  }
}
```

---

### Step 6: Create Application DTOs

DTOs define the shape of data flowing into and out of the API. Use `class-validator` decorators for input validation and `@ApiProperty` for Swagger documentation.

**Files to create:**
- `src/product/application/dtos/create-product.dto.ts`
- `src/product/application/dtos/product.response.dto.ts`

Reference: `src/example/application/dtos/`

```typescript
// create-product.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'The product name', example: 'Widget Pro', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;
}
```

```typescript
// product.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ description: 'Product UUID' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;
}
```

Key points:
- `@IsNotEmpty()`, `@IsString()` etc. from `class-validator` are enforced by the global `ValidationPipe`
- `@ApiProperty()` from `@nestjs/swagger` powers the Scalar docs
- Response DTOs do not need validation decorators

---

### Step 7: Implement the Prisma Repository

The Prisma repository is the infrastructure adapter that implements the domain interface.

**File to create:** `src/product/infrastructure/persistence/prisma-product.repository.ts`

Reference: `src/example/infrastructure/persistence/prisma-item.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectPrisma } from '../../../infrastructure/database/inject-prisma.decorator';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IProductRepository } from '../../domain/product.repository.interface';
import { Product } from '../../domain/product.entity';
import { ProductName } from '../../domain/product-name.value-object';

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(@InjectPrisma() private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Product | null> {
    const record = await this.prisma.product.findUnique({ where: { id } });
    if (!record) return null;
    return Product.create(record.id, ProductName.create(record.name));
  }

  async findAll(): Promise<Product[]> {
    const records = await this.prisma.product.findMany();
    return records.map((r) => Product.create(r.id, ProductName.create(r.name)));
  }

  async save(product: Product): Promise<void> {
    await this.prisma.product.upsert({
      where: { id: product.id },
      update: { name: product.name.value },
      create: { id: product.id, name: product.name.value },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }
}
```

Key points:
- `implements IProductRepository` — satisfies the domain port
- Reconstruct domain objects from DB records (never expose Prisma types to upper layers)
- Add the `product` model to `prisma/schema.prisma` and run `pnpm prisma migrate dev`

---

### Step 8: Create the Controller

The controller handles HTTP routing and Swagger documentation. It delegates all logic to the application layer via `CommandBus` and `QueryBus`.

**File to create:** `src/product/presenter/product.controller.ts`

Reference: `src/example/presenter/item.controller.ts`

```typescript
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateProductDto } from '../application/dtos/create-product.dto';
import { ProductResponseDto } from '../application/dtos/product.response.dto';
import { CreateProductCommand } from '../application/commands/create-product.command';
import { GetProductQuery } from '../application/queries/get-product.query';
import { PaginationDto } from '../../shared';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created', type: ProductResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  create(@Body() dto: CreateProductDto) {
    return this.commandBus.execute(new CreateProductCommand(dto.name));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product found', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.queryBus.execute(new GetProductQuery(id));
  }

  @Get()
  @ApiOperation({ summary: 'List all products with pagination' })
  @ApiResponse({ status: 200, description: 'List of products', type: [ProductResponseDto] })
  findAll(@Query() pagination: PaginationDto) {
    return this.queryBus.execute(new ListProductsQuery());
  }
}
```

Key points:
- `@ApiTags('products')` groups all endpoints under "products" in Scalar docs
- Use `@RawResponse()` decorator from `src/common/decorators/raw-response.decorator.ts` to bypass the global `{ success, data }` envelope (e.g., for health checks or streaming responses)
- The controller does not call repositories directly

---

### Step 9: Wire the Module

Register all providers (handlers, repository) in the NestJS module declaration, then import the module in `src/app.module.ts`.

**File to create:** `src/product/product.module.ts`

Reference: `src/example/example.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductController } from './presenter/product.controller';
import { CreateProductHandler } from './application/commands/create-product.handler';
import { GetProductHandler } from './application/queries/get-product.handler';
import { PrismaProductRepository } from './infrastructure/persistence/prisma-product.repository';
import { PRODUCT_REPOSITORY } from './domain/product.repository.interface';

const CommandHandlers = [CreateProductHandler];
const QueryHandlers = [GetProductHandler];

@Module({
  imports: [CqrsModule],
  controllers: [ProductController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
  ],
})
export class ProductModule {}
```

**Register in app.module.ts** — `src/app.module.ts`

```typescript
import { ProductModule } from './product/product.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    CacheModule,
    HealthModule,
    ExampleModule,
    ProductModule, // <-- add here
    // ...
  ],
})
export class AppModule implements NestModule { ... }
```

Key points:
- `CqrsModule` must be in `imports` for the CQRS bus to work in this module
- The repository is provided via its Symbol token using `{ provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository }`
- Import `ProductModule` in `AppModule` to activate all routes and providers

---

## Code Style

Follow these conventions throughout the codebase:

**File naming:** `kebab-case.type.ts`
- Services: `product.service.ts`
- Controllers: `product.controller.ts`
- DTOs: `create-product.dto.ts`, `product.response.dto.ts`
- Entities: `product.entity.ts`
- Value objects: `product-name.value-object.ts`
- Repository interfaces: `product.repository.interface.ts`
- Modules: `product.module.ts`

**Class naming:** `PascalCase`

**Barrel exports:** Create `index.ts` in each layer directory for clean imports.

**DDD import rules:**

| Layer | Can import from |
|-------|----------------|
| Domain | Nothing (pure TypeScript only) |
| Application | Domain |
| Infrastructure | Domain (interfaces only) |
| Presenter | Application (via CommandBus/QueryBus) |

---

## Commit Conventions

Use Conventional Commits format:

```
feat(product): add create product command and handler
fix(product): handle null case in product repository findById
refactor(product): extract product mapper to separate class
test(product): add unit tests for CreateProductHandler
```

Format: `<type>(<module>): <description>`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
