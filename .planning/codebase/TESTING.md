# Testing Patterns

**Analysis Date:** 2026-03-20

## Test Framework

**Runner:**
- Jest 29.x (all three services)
- Config: inline in `package.json` under `"jest"` key (no separate `jest.config.*`)

**Assertion Library:**
- Jest built-in (`expect`, `toBe`, `toEqual`, `toHaveBeenCalledWith`, etc.)

**Transform:**
- `ts-jest` — TypeScript transformation without separate compilation step

**Run Commands:**
```bash
# From inside a service directory (flash-pick-service, processing-flash-pick, or user-service)
npm run test              # Run all unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report → ./coverage/
npm run test:debug        # Node inspector + jest --runInBand
npm run test:e2e          # E2E tests (separate jest-e2e.json config)
```

## Test File Organization

**Pattern:** Separate `test/` directory at service root — NOT co-located with source files.

**Unit tests:** `test/unit/**/*.spec.ts`
- Matched by `testRegex: "test/unit/.*\\.spec\\.ts$"`

**E2E tests:** `test/e2e/**/*.e2e-spec.ts`
- Run with separate config `test/jest-e2e.json`

**Helpers/mocks:** `test/helpers/` and `test/__mocks__/`

**Structure:**
```
<service>/
├── test/
│   ├── unit/
│   │   ├── *.spec.ts                        # flat or mirroring src structure
│   │   ├── common/
│   │   ├── infrastructure/
│   │   └── modules/etl/flash-pick/
│   │       ├── adapters/
│   │       └── *.spec.ts
│   ├── e2e/
│   │   └── *.e2e-spec.ts
│   ├── helpers/
│   │   └── redis.mock.ts                    # flash-pick-service: shared Redis mock
│   └── __mocks__/
│       └── prisma-client.ts                 # processing-flash-pick: manual Prisma mock
```

## Path Aliases in Tests

All three services configure the same `moduleNameMapper` in `package.json`:

```json
"moduleNameMapper": {
  "^src/(.*)$": "<rootDir>/src/$1",
  "^@shared/(.*)$": "<rootDir>/src/shared/$1",
  "^@modules/(.*)$": "<rootDir>/src/modules/$1"
}
```

`processing-flash-pick` additionally maps Prisma client to the manual mock:
```json
"^prisma/generated/prisma/client$": "<rootDir>/test/__mocks__/prisma-client.ts"
```

## Test Structure Pattern

All services use a `createService()` factory pattern — no `beforeEach` setup blocks. Dependencies are constructed inline with `jest.fn()` mocks:

```typescript
describe('ProductsQueryService', () => {
  const createService = (rows: Array<Record<string, unknown>>) => {
    const client = {
      query: jest.fn().mockResolvedValue({ json: async () => rows }),
    };
    const clickhouse = {
      getClient: jest.fn().mockReturnValue(client),
      execute: jest.fn().mockImplementation((fn) => fn(client)),
    } as unknown as ClickHouseService;

    return {
      service: new ProductsQueryService(clickhouse, ...),
      client,
    };
  };

  it('maps image key to full url', async () => {
    const { service } = createService([{ item_id: '1', image: 'vn-...' }]);
    const res = await service.findAll({ limit: 1 });
    expect(res.data[0].image).toBe('https://...');
  });
});
```

The factory returns both the service under test AND mock references so tests can assert call counts.

## Mocking

**Framework:** `jest.fn()` — no additional mock library.

**Pattern — inline mock objects cast to interface type:**
```typescript
const clickhouse = {
  getClient: jest.fn().mockReturnValue(client),
  execute: jest.fn().mockImplementation((fn) => fn(client)),
} as unknown as ClickHouseService;
```

**Pattern — port interface mocks (ETL service):**
```typescript
const loader: FlashPickRawLoader = {
  load: jest.fn().mockResolvedValue([rawDoc]),
  markProcessed: jest.fn().mockResolvedValue(undefined),
};
const writer: FlashPickBatchWriter = {
  write: jest.fn().mockResolvedValue(undefined),
};
```

**Pattern — manual Prisma mock (`processing-flash-pick/test/__mocks__/prisma-client.ts`):**
```typescript
export class PrismaClient {
  $connect(): Promise<void> { return Promise.resolve(); }
  $queryRaw(_query?: unknown): Promise<unknown> { return Promise.resolve({}); }
}
export const Prisma = {
  sql(strings: TemplateStringsArray, ...values: unknown[]) { ... },
  join(values: unknown[]) { return values; },
};
```
This is mapped via `moduleNameMapper` so all imports of `prisma/generated/prisma/client` resolve to the stub in tests.

**Pattern — Redis mock (`flash-pick-service/test/helpers/redis.mock.ts`):**
```typescript
export function makeRedisMock(initial: string[] = []): RedisService {
  // Simulates LPUSH + LTRIM + LRANGE + pipeline() semantics in-memory
  const store: string[] = [...initial];
  // ...
  return {
    getClient: () => client as never,
    execute: (fn) => fn(client as never),
  } as unknown as RedisService;
}
```

**What to mock:**
- All external I/O: ClickHouse client, Prisma, MongoDB, Kafka, Redis
- Port interfaces (ETL): loader, writer, mapper, validator, watermark store, job tracker
- Environment variables via `process.env[key] = value` directly in tests

**What NOT to mock:**
- Pure utility functions in `shared/utils/` — test them directly
- Domain entities and value objects — use real instances

## Fixtures and Test Data

**Pattern — shared fixture document (ETL tests):**
```typescript
const rawDoc: RawFlashPickDocument = {
  _id: { $oid: '697bb261f4c53f05d3a28e22' },
  data: {
    itemid: { $numberLong: '18381625974' },
    shopid: 7669738,
    name: 'Ốp lưng iphone TPU Silicon',
    // ... full realistic Shopee document
  },
  meta: { type: 'FLASH_SALE_PRODUCT', is_processed: false, status: RawIngestionStatus.Updated },
  created_at: { $date: '2026-02-04T00:00:00.000Z' },
};
```

**Location:** Defined at the top of each `*.spec.ts` — no shared fixtures directory.

**Variation pattern:** Spread override for variant documents:
```typescript
const secondDoc: RawFlashPickDocument = {
  ...rawDoc,
  _id: { $oid: '697bb261f4c53f05d3a28e23' },
  created_at: { $date: '2026-02-04T00:10:00.000Z' },
};
```

## Coverage

**Requirements:** No enforced threshold (`coverageThreshold` not set).

**Collection:** `collectCoverageFrom: ["src/**/*.(t|j)s"]`

**Output:** `./coverage/` directory (gitignored)

**View Coverage:**
```bash
npm run test:cov
# Opens coverage/lcov-report/index.html for HTML report
```

## Test Types

**Unit Tests:**
- Scope: Single service/use-case in isolation
- Dependencies: All external I/O mocked
- Location: `test/unit/`
- Examples: `products.query.service.spec.ts`, `etl.service.spec.ts`, `kafka.consumer.spec.ts`

**E2E Tests:**
- Scope: Full NestJS application via `@nestjs/testing` + `supertest`
- Location: `test/e2e/`
- Examples: `flash-pick-service/test/e2e/products.e2e-spec.ts`, `analytics.e2e-spec.ts`

**Performance Tests (flash-pick-service only):**
- Tool: k6 (`scripts/perf/*.k6.js`)
- Run: `npm run bench:k6:search`, `bench:k6:products`, etc.
- Not part of Jest test suite

## Common Patterns

**Async Testing:**
```typescript
it('processes a batch', async () => {
  const { service } = createService();
  const result = await service.run({ batchSize: 50, markProcessed: true });
  expect(result.processed).toBe(1);
});
```

**Error/Rejection Testing:**
```typescript
it('fails when since and until are missing', async () => {
  const { service } = createService();
  await expect(
    service.run({ runMode: 'range', markProcessed: false }),
  ).rejects.toThrow('Range reprocess requires since or until');
});
```

**Asserting call arguments (partial match):**
```typescript
expect(client.query).toHaveBeenCalledWith(
  expect.objectContaining({
    query: expect.stringContaining('promotion_id = toUInt64(...)'),
    query_params: expect.objectContaining({ promotionId: '229090062315520' }),
  }),
);
```

**Environment variable injection in tests:**
```typescript
process.env.SHOPEE_IMAGE_BASE_URL = 'https://down-vn.img.susercontent.com/file';
// ... test
delete process.env.SHOPEE_IMAGE_BASE_URL;  // or via setEnv helper
```

**Testing retry behavior (ETL):**
```typescript
setEnv('FLASH_PICK_BATCH_RETRY_ATTEMPTS', '2');
setEnv('FLASH_PICK_BATCH_RETRY_BACKOFF_MS', '1');
const write = jest.fn()
  .mockRejectedValueOnce(new Error('temp'))
  .mockResolvedValueOnce(undefined);
// assert write called twice
```

---

*Testing analysis: 2026-03-20*
