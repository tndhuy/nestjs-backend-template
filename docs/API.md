# API Conventions Guide

This document covers the API standards followed by all endpoints in this template: response envelope, error handling, pagination, Swagger patterns, versioning, rate limiting, and validation.

For the full interactive endpoint reference, visit `/docs` (Scalar UI, requires basic auth).

---

## Response Envelope

All JSON responses are automatically wrapped in a standard envelope by the global `TransformInterceptor`:

```typescript
// src/common/interceptors/transform.interceptor.ts
{
  success: true,
  data: T           // the handler's return value
}
```

**Success response shape:**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Item"
  }
}
```

**Paginated response shape** (when the handler includes `meta`):

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Bypassing the Envelope

Use `@RawResponse()` on a controller method (or the entire controller class) to bypass envelope wrapping. The handler's return value is sent as-is.

```typescript
import { RawResponse } from '../../common/decorators/raw-response.decorator';

@Get('health')
@RawResponse()
getHealth() {
  return { status: 'ok' };  // sent without { success, data } wrapper
}
```

This is used by the health check endpoint and any endpoint that must return a specific shape (e.g., OAuth callbacks, webhooks).

---

## Error Handling

### AppException

All domain errors are thrown as `AppException`, a typed subclass of NestJS `HttpException`:

```typescript
// src/shared/exceptions/app.exception.ts
import { HttpException } from '@nestjs/common';

export interface AppExceptionPayload {
  code: string;       // machine-readable error code, e.g. 'ITEM_NOT_FOUND'
  message: string;    // human-readable message
  statusCode: number; // HTTP status code
  details?: unknown;  // optional structured details (e.g. validation errors)
}

export class AppException extends HttpException {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(payload: AppExceptionPayload) {
    super(payload, payload.statusCode);
    this.code = payload.code;
    this.details = payload.details;
  }
}
```

**Usage in a handler:**

```typescript
import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../shared/exceptions/app.exception';

const item = await this.itemRepository.findById(query.id);
if (!item) {
  throw new AppException({
    code: 'ITEM_NOT_FOUND',
    message: `Item with id ${query.id} not found`,
    statusCode: HttpStatus.NOT_FOUND,
  });
}
```

### Error Response Shape

The global HTTP exception filter formats all errors into a consistent shape:

```json
{
  "success": false,
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Item with id abc-123 not found",
    "statusCode": 404
  }
}
```

With optional `details` (e.g. for validation errors):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed",
    "statusCode": 400,
    "details": [
      { "field": "name", "message": "name should not be empty" }
    ]
  }
}
```

### Error Code Convention

Error codes are `SCREAMING_SNAKE_CASE` strings prefixed with the domain noun:

| Code | Status | Meaning |
|------|--------|---------|
| `ITEM_NOT_FOUND` | 404 | Item does not exist |
| `ITEM_ALREADY_EXISTS` | 409 | Duplicate item |
| `VALIDATION_FAILED` | 400 | DTO validation error |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Pagination

### Request: PaginationDto

All list endpoints use `PaginationDto` as `@Query()` params:

```typescript
// src/shared/dto/pagination.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'asc';
}
```

### Response: PaginationMeta

```typescript
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### Controller Usage Pattern

```typescript
@Get()
@ApiOperation({ summary: 'List all items with pagination' })
@ApiResponse({ status: 200, description: 'Paginated items', type: [ItemResponseDto] })
findAll(@Query() pagination: PaginationDto) {
  return this.queryBus.execute(new ListItemsQuery(pagination));
}
```

The query handler computes `totalPages = Math.ceil(total / limit)` and returns both `data` and `meta` from the handler. The `TransformInterceptor` passes them through as-is when the handler returns `{ data, meta }`.

---

## Swagger Decorators

All endpoints must be documented with Swagger decorators. The Scalar UI at `/docs` is generated from these decorators.

### Patterns

**Controller class** — group endpoints under a tag:

```typescript
@ApiTags('items')
@Controller('items')
export class ItemController { ... }
```

**Each route method** — operation summary and all response codes:

```typescript
@Post()
@ApiOperation({ summary: 'Create a new item' })
@ApiResponse({ status: 201, description: 'Item created successfully', type: ItemResponseDto })
@ApiResponse({ status: 400, description: 'Validation failed' })
create(@Body() dto: CreateItemDto) { ... }
```

**Path parameters:**

```typescript
@Get(':id')
@ApiParam({ name: 'id', description: 'Item UUID' })
findOne(@Param('id') id: string) { ... }
```

**Request body DTOs** — decorate every field with `@ApiProperty`:

```typescript
export class CreateItemDto {
  @ApiProperty({ description: 'The name of the item', example: 'My Item' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### Complete Example

```typescript
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an item by ID' })
  @ApiParam({ name: 'id', description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  delete(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteItemCommand(id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item by ID' })
  @ApiParam({ name: 'id', description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Item found', type: ItemResponseDto })
  @ApiResponse({ status: 404, description: 'Item not found' })
  findOne(@Param('id') id: string) {
    return this.queryBus.execute(new GetItemQuery(id));
  }

  @Get()
  @ApiOperation({ summary: 'List all items with pagination' })
  @ApiResponse({ status: 200, description: 'List of items', type: [ItemResponseDto] })
  findAll(@Query() pagination: PaginationDto) {
    return this.queryBus.execute(new ListItemsQuery());
  }
}
```

---

## Versioning

All API endpoints are prefixed with `/api/v1/` via NestJS URI versioning configured in `src/main.ts`.

```
GET /api/v1/items
POST /api/v1/items
GET /api/v1/items/:id
```

To declare a specific version on a controller or route:

```typescript
@Controller({ path: 'items', version: '1' })
export class ItemController { ... }
```

Or rely on the global default version set in `main.ts`:

```typescript
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
  prefix: 'api/v',
});
```

When introducing a breaking change, add a `v2` controller alongside the existing `v1` controller and register both in the module.

---

## Rate Limiting

The global `ThrottlerGuard` applies rate limiting to all endpoints. Default configuration is read from environment variables:

| Variable | Default | Meaning |
|----------|---------|---------|
| `THROTTLE_TTL` | `60` | Window duration in seconds |
| `THROTTLE_LIMIT` | `100` | Max requests per window per IP |

Configured in `src/app.module.ts`:

```typescript
ThrottlerModule.forRoot([
  {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
]),
```

**Override per-endpoint** using `@Throttle()`:

```typescript
import { Throttle } from '@nestjs/throttler';

@Post('expensive-operation')
@Throttle({ default: { ttl: 60000, limit: 5 } })
doExpensiveOperation() { ... }
```

When the limit is exceeded, the response is `429 Too Many Requests`.

---

## Validation

All request DTOs are validated by the global `ValidationPipe` configured in `src/main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,        // strip properties not in the DTO
    forbidNonWhitelisted: false,
    transform: true,        // auto-transform query params to declared types (e.g. string -> number)
  }),
);
```

Every request DTO must use `class-validator` decorators:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ description: 'Item name', example: 'Widget' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

**`whitelist: true`** strips any extra properties from the request body that are not declared on the DTO — protecting against mass assignment.

**`transform: true`** converts query string values to the declared TypeScript type automatically when combined with `@Type(() => Number)` from `class-transformer`.

Validation failures return:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed",
    "statusCode": 400,
    "details": [
      { "property": "name", "constraints": { "isNotEmpty": "name should not be empty" } }
    ]
  }
}
```
