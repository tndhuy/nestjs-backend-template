import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { buildReplacements, toPascalCase, validateServiceName } from '../replacements';
import { removeRedis, removeOtel, addKafka } from '../scaffold';

// ---------------------------------------------------------------------------
// Helper: create a temp directory for each test, cleaned up in afterEach
// ---------------------------------------------------------------------------

let tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(require('os').tmpdir(), 'scaffold-test-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const dir of tempDirs) {
    await fsp.rm(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

// ---------------------------------------------------------------------------
// Group 1: replacements.ts unit tests
// ---------------------------------------------------------------------------

describe('toPascalCase', () => {
  it('converts kebab-case to PascalCase', () => {
    expect(toPascalCase('my-cool-service')).toBe('MyCoolService');
  });

  it('converts nestjs-backend-template correctly', () => {
    expect(toPascalCase('nestjs-backend-template')).toBe('NestjsBackendTemplate');
  });

  it('handles single word', () => {
    expect(toPascalCase('api')).toBe('Api');
  });

  it('handles multi-word', () => {
    expect(toPascalCase('my-service')).toBe('MyService');
    expect(toPascalCase('user-auth-service')).toBe('UserAuthService');
  });
});

describe('buildReplacements', () => {
  it('returns correct replacement pairs', () => {
    const replacements = buildReplacements('my-service');
    expect(replacements).toContainEqual(['nestjs-backend-template', 'my-service']);
    expect(replacements).toContainEqual(['NestjsBackendTemplate', 'MyService']);
  });

  it('includes PascalCase for multi-word service names', () => {
    const replacements = buildReplacements('cool-service-v2');
    expect(replacements).toContainEqual(['nestjs-backend-template', 'cool-service-v2']);
    expect(replacements).toContainEqual(['NestjsBackendTemplate', 'CoolServiceV2']);
  });
});

describe('validateServiceName', () => {
  it('accepts valid kebab-case names', () => {
    expect(validateServiceName('my-service')).toBeUndefined();
    expect(validateServiceName('api')).toBeUndefined();
    expect(validateServiceName('cool-service-v2')).toBeUndefined();
    expect(validateServiceName('ab')).toBeUndefined();
  });

  it('rejects path traversal with ..', () => {
    expect(validateServiceName('..')).toBeDefined();
    expect(validateServiceName('../hack')).toBeDefined();
  });

  it('rejects uppercase letters', () => {
    expect(validateServiceName('My-Service')).toBeDefined();
    expect(validateServiceName('MyService')).toBeDefined();
  });

  it('rejects names with spaces', () => {
    expect(validateServiceName('with spaces')).toBeDefined();
    expect(validateServiceName('my service')).toBeDefined();
  });

  it('rejects single char', () => {
    expect(validateServiceName('a')).toBeDefined();
  });

  it('rejects names with leading or trailing hyphens', () => {
    expect(validateServiceName('-my-service')).toBeDefined();
    expect(validateServiceName('my-service-')).toBeDefined();
  });

  it('rejects path traversal with slashes', () => {
    expect(validateServiceName('foo/bar')).toBeDefined();
    expect(validateServiceName('foo\\bar')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Group 2: scaffold.ts patchPackageJson integration tests (via fixture)
// We test individual toggle functions using minimal fixture files, keeping
// tests fast and self-contained (no dependency on the full templates/ dir).
// ---------------------------------------------------------------------------

/**
 * Write a minimal package.json fixture into destDir.
 */
async function writeFixturePackageJson(
  destDir: string,
  extraDeps: Record<string, string> = {},
): Promise<void> {
  const pkg = {
    name: 'nestjs-backend-template',
    version: '0.0.1',
    dependencies: {
      '@nestjs/common': '^11.0.0',
      ioredis: '^5.0.0',
      '@nestjs-modules/ioredis': '^2.0.0',
      '@opentelemetry/api': '^1.9.0',
      '@opentelemetry/sdk-node': '^0.50.0',
      '@opentelemetry/exporter-trace-otlp-http': '^0.50.0',
      ...extraDeps,
    },
    devDependencies: {
      typescript: '^5.0.0',
    },
  };
  await fsp.writeFile(
    path.join(destDir, 'package.json'),
    JSON.stringify(pkg, null, 2) + '\n',
    'utf-8',
  );
}

/**
 * Write a minimal app.module.ts fixture with CacheModule wired in.
 */
async function writeFixtureAppModule(destDir: string): Promise<void> {
  await fsp.mkdir(path.join(destDir, 'src'), { recursive: true });
  const content = `import { Module } from '@nestjs/common';
import { CacheModule } from './infrastructure/cache/redis.module';
import { DatabaseModule } from './infrastructure/database/prisma.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
  ],
})
export class AppModule {}
`;
  await fsp.writeFile(path.join(destDir, 'src', 'app.module.ts'), content, 'utf-8');
}

/**
 * Write a minimal .env.example fixture.
 */
async function writeFixtureEnvExample(destDir: string, content?: string): Promise<void> {
  const defaultContent = `PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://localhost/db

# Redis
REDIS_URL=redis://localhost:6379

# Observability - OpenTelemetry (opt-in)
OTEL_ENABLED=false
OTEL_SERVICE_NAME=nestjs-backend-template
OTEL_PROMETHEUS_PORT=9464
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
`;
  await fsp.writeFile(
    path.join(destDir, '.env.example'),
    content ?? defaultContent,
    'utf-8',
  );
}

/**
 * Write a minimal main.ts fixture with OTel import.
 */
async function writeFixtureMainTs(destDir: string): Promise<void> {
  await fsp.mkdir(path.join(destDir, 'src'), { recursive: true });
  const content = `import otelSdk from './instrumentation';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  otelSdk?.start();
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

void bootstrap();
`;
  await fsp.writeFile(path.join(destDir, 'src', 'main.ts'), content, 'utf-8');
}

// ---------------------------------------------------------------------------
// Group 3: removeRedis tests
// ---------------------------------------------------------------------------

describe('removeRedis', () => {
  it('deletes the src/infrastructure/cache directory', async () => {
    const destDir = await makeTempDir();
    const cacheDir = path.join(destDir, 'src', 'infrastructure', 'cache');
    await fsp.mkdir(cacheDir, { recursive: true });
    await fsp.writeFile(path.join(cacheDir, 'redis.service.ts'), 'export {}', 'utf-8');

    await removeRedis(destDir);

    expect(fs.existsSync(cacheDir)).toBe(false);
  });

  it('removes ioredis and @nestjs-modules/ioredis from package.json', async () => {
    const destDir = await makeTempDir();
    await writeFixturePackageJson(destDir);

    await removeRedis(destDir);

    const raw = await fsp.readFile(path.join(destDir, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);
    expect(pkg.dependencies).not.toHaveProperty('ioredis');
    expect(pkg.dependencies).not.toHaveProperty('@nestjs-modules/ioredis');
  });

  it('removes CacheModule import from app.module.ts', async () => {
    const destDir = await makeTempDir();
    await writeFixtureAppModule(destDir);
    await writeFixturePackageJson(destDir);

    await removeRedis(destDir);

    const content = await fsp.readFile(path.join(destDir, 'src', 'app.module.ts'), 'utf-8');
    expect(content).not.toMatch(/CacheModule/);
    expect(content).not.toMatch(/cache\/redis\.module/);
    // Other imports should remain
    expect(content).toMatch(/DatabaseModule/);
  });

  it('removes REDIS_URL from .env.example', async () => {
    const destDir = await makeTempDir();
    await writeFixtureEnvExample(destDir);

    await removeRedis(destDir);

    const content = await fsp.readFile(path.join(destDir, '.env.example'), 'utf-8');
    expect(content).not.toMatch(/^REDIS_URL=/m);
  });

  it('handles missing cache directory gracefully (no throw)', async () => {
    const destDir = await makeTempDir();
    await writeFixturePackageJson(destDir);
    // No cache dir created — should not throw
    await expect(removeRedis(destDir)).resolves.not.toThrow();
  });

  it('handles missing package.json gracefully (no throw)', async () => {
    const destDir = await makeTempDir();
    // No package.json created — should not throw
    await expect(removeRedis(destDir)).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Group 4: removeOtel tests
// ---------------------------------------------------------------------------

describe('removeOtel', () => {
  it('deletes src/instrumentation.ts', async () => {
    const destDir = await makeTempDir();
    await fsp.mkdir(path.join(destDir, 'src'), { recursive: true });
    await fsp.writeFile(
      path.join(destDir, 'src', 'instrumentation.ts'),
      'export default null;',
      'utf-8',
    );

    await removeOtel(destDir);

    expect(fs.existsSync(path.join(destDir, 'src', 'instrumentation.ts'))).toBe(false);
  });

  it('deletes src/instrumentation.spec.ts', async () => {
    const destDir = await makeTempDir();
    await fsp.mkdir(path.join(destDir, 'src'), { recursive: true });
    await fsp.writeFile(
      path.join(destDir, 'src', 'instrumentation.spec.ts'),
      'describe("otel", () => {});',
      'utf-8',
    );

    await removeOtel(destDir);

    expect(fs.existsSync(path.join(destDir, 'src', 'instrumentation.spec.ts'))).toBe(false);
  });

  it('removes @opentelemetry/* packages from package.json', async () => {
    const destDir = await makeTempDir();
    await writeFixturePackageJson(destDir);

    await removeOtel(destDir);

    const raw = await fsp.readFile(path.join(destDir, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);
    const otelDeps = Object.keys(pkg.dependencies ?? {}).filter((k) =>
      k.startsWith('@opentelemetry/'),
    );
    expect(otelDeps).toHaveLength(0);
  });

  it('removes OTEL_ENABLED from .env.example', async () => {
    const destDir = await makeTempDir();
    await writeFixtureEnvExample(destDir);

    await removeOtel(destDir);

    const content = await fsp.readFile(path.join(destDir, '.env.example'), 'utf-8');
    expect(content).not.toMatch(/^OTEL_ENABLED=/m);
    expect(content).not.toMatch(/^OTEL_EXPORTER_OTLP_ENDPOINT=/m);
  });

  it('removes otelSdk import and sdk.start() call from main.ts', async () => {
    const destDir = await makeTempDir();
    await writeFixtureMainTs(destDir);

    await removeOtel(destDir);

    const content = await fsp.readFile(path.join(destDir, 'src', 'main.ts'), 'utf-8');
    expect(content).not.toMatch(/instrumentation/);
    expect(content).not.toMatch(/otelSdk/);
    // Rest of main.ts should remain intact
    expect(content).toMatch(/NestFactory/);
  });

  it('handles missing instrumentation files gracefully (no throw)', async () => {
    const destDir = await makeTempDir();
    await writeFixturePackageJson(destDir);
    // No instrumentation files created
    await expect(removeOtel(destDir)).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Group 5: addKafka tests
// ---------------------------------------------------------------------------

describe('addKafka', () => {
  it('creates src/kafka directory with kafka.module.ts', async () => {
    const destDir = await makeTempDir();
    await writeFixturePackageJson(destDir, {});

    await addKafka(destDir, 'my-service');

    const moduleFile = path.join(destDir, 'src', 'kafka', 'kafka.module.ts');
    expect(fs.existsSync(moduleFile)).toBe(true);
    const content = await fsp.readFile(moduleFile, 'utf-8');
    expect(content).toMatch(/KafkaModule/);
    expect(content).toMatch(/ConfigService/);
    expect(content).toMatch(/Transport\.KAFKA/);
  });

  it('creates src/kafka/kafka.controller.ts', async () => {
    const destDir = await makeTempDir();
    await writeFixturePackageJson(destDir, {});

    await addKafka(destDir, 'my-service');

    const controllerFile = path.join(destDir, 'src', 'kafka', 'kafka.controller.ts');
    expect(fs.existsSync(controllerFile)).toBe(true);
    const content = await fsp.readFile(controllerFile, 'utf-8');
    expect(content).toMatch(/KafkaController/);
    expect(content).toMatch(/@MessagePattern/);
  });

  it('creates src/kafka/index.ts barrel export', async () => {
    const destDir = await makeTempDir();
    await writeFixturePackageJson(destDir, {});

    await addKafka(destDir, 'my-service');

    const indexFile = path.join(destDir, 'src', 'kafka', 'index.ts');
    expect(fs.existsSync(indexFile)).toBe(true);
  });

  it('adds @nestjs/microservices to package.json', async () => {
    const destDir = await makeTempDir();
    await writeFixturePackageJson(destDir, {});

    await addKafka(destDir, 'my-service');

    const raw = await fsp.readFile(path.join(destDir, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);
    expect(pkg.dependencies).toHaveProperty('@nestjs/microservices');
    expect(pkg.dependencies).toHaveProperty('kafkajs');
  });

  it('uses the service name in consumer group id', async () => {
    const destDir = await makeTempDir();
    await writeFixturePackageJson(destDir, {});

    await addKafka(destDir, 'my-cool-service');

    const moduleFile = path.join(destDir, 'src', 'kafka', 'kafka.module.ts');
    const content = await fsp.readFile(moduleFile, 'utf-8');
    expect(content).toMatch(/my-cool-service-consumer-group/);
  });

  it('wires KafkaModule into app.module.ts imports when file exists', async () => {
    const destDir = await makeTempDir();
    await writeFixturePackageJson(destDir, {});
    await writeFixtureAppModule(destDir);

    await addKafka(destDir, 'my-service');

    const content = await fsp.readFile(
      path.join(destDir, 'src', 'app.module.ts'),
      'utf-8',
    );
    expect(content).toMatch(/KafkaModule/);
    expect(content).toMatch(/kafka\/kafka\.module/);
  });

  it('adds KAFKA_BROKER to .env.example', async () => {
    const destDir = await makeTempDir();
    await writeFixturePackageJson(destDir, {});
    await writeFixtureEnvExample(destDir);

    await addKafka(destDir, 'my-service');

    const content = await fsp.readFile(path.join(destDir, '.env.example'), 'utf-8');
    expect(content).toMatch(/KAFKA_BROKER=/);
  });

  it('handles missing app.module.ts gracefully (no throw)', async () => {
    const destDir = await makeTempDir();
    await writeFixturePackageJson(destDir, {});
    // No app.module.ts — addKafka should still create kafka/ files without crashing
    await expect(addKafka(destDir, 'my-service')).resolves.not.toThrow();
    expect(
      fs.existsSync(path.join(destDir, 'src', 'kafka', 'kafka.module.ts')),
    ).toBe(true);
  });
});
