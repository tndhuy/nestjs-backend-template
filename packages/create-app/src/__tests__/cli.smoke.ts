// @group smoke
import { mkdtemp, rm, readFile, readdir, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { scaffold } from '../scaffold';

describe('CLI smoke test', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'create-app-smoke-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('scaffolds a postgres project with all modules', async () => {
    const destDir = join(tempDir, 'test-service');
    await scaffold({
      serviceName: 'test-service',
      db: 'postgres',
      modules: ['redis', 'otel', 'kafka'],
      destDir,
    });

    // Verify project structure
    const pkg = JSON.parse(await readFile(join(destDir, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('test-service');

    // For postgres, prisma should be present
    expect(pkg.dependencies['@prisma/client'] || pkg.devDependencies?.['prisma']).toBeTruthy();

    // Verify no hardcoded template name in app.module.ts
    const appModule = await readFile(join(destDir, 'src', 'app.module.ts'), 'utf-8');
    expect(appModule).not.toContain('nestjs-backend-template');
    expect(appModule).not.toContain('NestjsBackendTemplate');

    // Verify Kafka module was generated
    const kafkaModule = await readFile(join(destDir, 'src', 'kafka', 'kafka.module.ts'), 'utf-8');
    expect(kafkaModule).toContain('KafkaModule');
    expect(kafkaModule).toContain('test-service-consumer-group');

    // Verify example module exists (always included)
    const exampleDir = await stat(join(destDir, 'src', 'modules', 'example'));
    expect(exampleDir.isDirectory()).toBe(true);
  }, 30000);

  it('scaffolds a mongo project without optional modules', async () => {
    const destDir = join(tempDir, 'mongo-svc');
    await scaffold({
      serviceName: 'mongo-svc',
      db: 'mongo',
      modules: [],
      destDir,
    });

    const pkg = JSON.parse(await readFile(join(destDir, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('mongo-svc');

    // MongoDB should have mongoose, not prisma
    expect(pkg.dependencies).toHaveProperty('mongoose');
    expect(pkg.dependencies).not.toHaveProperty('@prisma/client');

    // Redis should be removed
    expect(pkg.dependencies).not.toHaveProperty('ioredis');

    // OTel should be removed
    const hasOtel = Object.keys(pkg.dependencies || {}).some((k) =>
      k.includes('opentelemetry'),
    );
    expect(hasOtel).toBe(false);

    // Kafka should NOT be present
    expect(pkg.dependencies).not.toHaveProperty('@nestjs/microservices');
  }, 30000);
});
