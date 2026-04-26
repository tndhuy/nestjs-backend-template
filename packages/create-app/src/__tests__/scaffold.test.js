"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const fsp = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const replacements_1 = require("../replacements");
const scaffold_1 = require("../scaffold");
let tempDirs = [];
async function makeTempDir() {
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
describe('toPascalCase', () => {
    it('converts kebab-case to PascalCase', () => {
        expect((0, replacements_1.toPascalCase)('my-cool-service')).toBe('MyCoolService');
    });
    it('converts nestjs-backend-template correctly', () => {
        expect((0, replacements_1.toPascalCase)('nestjs-backend-template')).toBe('NestjsBackendTemplate');
    });
    it('handles single word', () => {
        expect((0, replacements_1.toPascalCase)('api')).toBe('Api');
    });
    it('handles multi-word', () => {
        expect((0, replacements_1.toPascalCase)('my-service')).toBe('MyService');
        expect((0, replacements_1.toPascalCase)('user-auth-service')).toBe('UserAuthService');
    });
});
describe('buildReplacements', () => {
    it('returns correct replacement pairs', () => {
        const replacements = (0, replacements_1.buildReplacements)('my-service');
        expect(replacements).toContainEqual(['nestjs-backend-template', 'my-service']);
        expect(replacements).toContainEqual(['NestjsBackendTemplate', 'MyService']);
    });
    it('includes PascalCase for multi-word service names', () => {
        const replacements = (0, replacements_1.buildReplacements)('cool-service-v2');
        expect(replacements).toContainEqual(['nestjs-backend-template', 'cool-service-v2']);
        expect(replacements).toContainEqual(['NestjsBackendTemplate', 'CoolServiceV2']);
    });
});
describe('validateServiceName', () => {
    it('accepts valid kebab-case names', () => {
        expect((0, replacements_1.validateServiceName)('my-service')).toBeUndefined();
        expect((0, replacements_1.validateServiceName)('api')).toBeUndefined();
        expect((0, replacements_1.validateServiceName)('cool-service-v2')).toBeUndefined();
        expect((0, replacements_1.validateServiceName)('ab')).toBeUndefined();
    });
    it('rejects path traversal with ..', () => {
        expect((0, replacements_1.validateServiceName)('..')).toBeDefined();
        expect((0, replacements_1.validateServiceName)('../hack')).toBeDefined();
    });
    it('rejects uppercase letters', () => {
        expect((0, replacements_1.validateServiceName)('My-Service')).toBeDefined();
        expect((0, replacements_1.validateServiceName)('MyService')).toBeDefined();
    });
    it('rejects names with spaces', () => {
        expect((0, replacements_1.validateServiceName)('with spaces')).toBeDefined();
        expect((0, replacements_1.validateServiceName)('my service')).toBeDefined();
    });
    it('rejects single char', () => {
        expect((0, replacements_1.validateServiceName)('a')).toBeDefined();
    });
    it('rejects names with leading or trailing hyphens', () => {
        expect((0, replacements_1.validateServiceName)('-my-service')).toBeDefined();
        expect((0, replacements_1.validateServiceName)('my-service-')).toBeDefined();
    });
    it('rejects path traversal with slashes', () => {
        expect((0, replacements_1.validateServiceName)('foo/bar')).toBeDefined();
        expect((0, replacements_1.validateServiceName)('foo\\bar')).toBeDefined();
    });
});
async function writeFixturePackageJson(destDir, extraDeps = {}) {
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
    await fsp.writeFile(path.join(destDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
}
async function writeFixtureAppModule(destDir) {
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
async function writeFixtureEnvExample(destDir, content) {
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
    await fsp.writeFile(path.join(destDir, '.env.example'), content ?? defaultContent, 'utf-8');
}
async function writeFixtureMainTs(destDir) {
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
describe('removeRedis', () => {
    it('deletes the src/infrastructure/cache directory', async () => {
        const destDir = await makeTempDir();
        const cacheDir = path.join(destDir, 'src', 'infrastructure', 'cache');
        await fsp.mkdir(cacheDir, { recursive: true });
        await fsp.writeFile(path.join(cacheDir, 'redis.service.ts'), 'export {}', 'utf-8');
        await (0, scaffold_1.removeRedis)(destDir);
        expect(fs.existsSync(cacheDir)).toBe(false);
    });
    it('removes ioredis and @nestjs-modules/ioredis from package.json', async () => {
        const destDir = await makeTempDir();
        await writeFixturePackageJson(destDir);
        await (0, scaffold_1.removeRedis)(destDir);
        const raw = await fsp.readFile(path.join(destDir, 'package.json'), 'utf-8');
        const pkg = JSON.parse(raw);
        expect(pkg.dependencies).not.toHaveProperty('ioredis');
        expect(pkg.dependencies).not.toHaveProperty('@nestjs-modules/ioredis');
    });
    it('removes CacheModule import from app.module.ts', async () => {
        const destDir = await makeTempDir();
        await writeFixtureAppModule(destDir);
        await writeFixturePackageJson(destDir);
        await (0, scaffold_1.removeRedis)(destDir);
        const content = await fsp.readFile(path.join(destDir, 'src', 'app.module.ts'), 'utf-8');
        expect(content).not.toMatch(/CacheModule/);
        expect(content).not.toMatch(/cache\/redis\.module/);
        expect(content).toMatch(/DatabaseModule/);
    });
    it('removes REDIS_URL from .env.example', async () => {
        const destDir = await makeTempDir();
        await writeFixtureEnvExample(destDir);
        await (0, scaffold_1.removeRedis)(destDir);
        const content = await fsp.readFile(path.join(destDir, '.env.example'), 'utf-8');
        expect(content).not.toMatch(/^REDIS_URL=/m);
    });
    it('handles missing cache directory gracefully (no throw)', async () => {
        const destDir = await makeTempDir();
        await writeFixturePackageJson(destDir);
        await expect((0, scaffold_1.removeRedis)(destDir)).resolves.not.toThrow();
    });
    it('handles missing package.json gracefully (no throw)', async () => {
        const destDir = await makeTempDir();
        await expect((0, scaffold_1.removeRedis)(destDir)).resolves.not.toThrow();
    });
});
describe('removeOtel', () => {
    it('deletes src/instrumentation.ts', async () => {
        const destDir = await makeTempDir();
        await fsp.mkdir(path.join(destDir, 'src'), { recursive: true });
        await fsp.writeFile(path.join(destDir, 'src', 'instrumentation.ts'), 'export default null;', 'utf-8');
        await (0, scaffold_1.removeOtel)(destDir);
        expect(fs.existsSync(path.join(destDir, 'src', 'instrumentation.ts'))).toBe(false);
    });
    it('deletes src/instrumentation.spec.ts', async () => {
        const destDir = await makeTempDir();
        await fsp.mkdir(path.join(destDir, 'src'), { recursive: true });
        await fsp.writeFile(path.join(destDir, 'src', 'instrumentation.spec.ts'), 'describe("otel", () => {});', 'utf-8');
        await (0, scaffold_1.removeOtel)(destDir);
        expect(fs.existsSync(path.join(destDir, 'src', 'instrumentation.spec.ts'))).toBe(false);
    });
    it('removes @opentelemetry/* packages from package.json', async () => {
        const destDir = await makeTempDir();
        await writeFixturePackageJson(destDir);
        await (0, scaffold_1.removeOtel)(destDir);
        const raw = await fsp.readFile(path.join(destDir, 'package.json'), 'utf-8');
        const pkg = JSON.parse(raw);
        const otelDeps = Object.keys(pkg.dependencies ?? {}).filter((k) => k.startsWith('@opentelemetry/'));
        expect(otelDeps).toHaveLength(0);
    });
    it('removes OTEL_ENABLED from .env.example', async () => {
        const destDir = await makeTempDir();
        await writeFixtureEnvExample(destDir);
        await (0, scaffold_1.removeOtel)(destDir);
        const content = await fsp.readFile(path.join(destDir, '.env.example'), 'utf-8');
        expect(content).not.toMatch(/^OTEL_ENABLED=/m);
        expect(content).not.toMatch(/^OTEL_EXPORTER_OTLP_ENDPOINT=/m);
    });
    it('removes otelSdk import and sdk.start() call from main.ts', async () => {
        const destDir = await makeTempDir();
        await writeFixtureMainTs(destDir);
        await (0, scaffold_1.removeOtel)(destDir);
        const content = await fsp.readFile(path.join(destDir, 'src', 'main.ts'), 'utf-8');
        expect(content).not.toMatch(/instrumentation/);
        expect(content).not.toMatch(/otelSdk/);
        expect(content).toMatch(/NestFactory/);
    });
    it('handles missing instrumentation files gracefully (no throw)', async () => {
        const destDir = await makeTempDir();
        await writeFixturePackageJson(destDir);
        await expect((0, scaffold_1.removeOtel)(destDir)).resolves.not.toThrow();
    });
});
describe('addKafka', () => {
    it('creates src/kafka directory with kafka.module.ts', async () => {
        const destDir = await makeTempDir();
        await writeFixturePackageJson(destDir, {});
        await (0, scaffold_1.addKafka)(destDir, 'my-service');
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
        await (0, scaffold_1.addKafka)(destDir, 'my-service');
        const controllerFile = path.join(destDir, 'src', 'kafka', 'kafka.controller.ts');
        expect(fs.existsSync(controllerFile)).toBe(true);
        const content = await fsp.readFile(controllerFile, 'utf-8');
        expect(content).toMatch(/KafkaController/);
        expect(content).toMatch(/@MessagePattern/);
    });
    it('creates src/kafka/index.ts barrel export', async () => {
        const destDir = await makeTempDir();
        await writeFixturePackageJson(destDir, {});
        await (0, scaffold_1.addKafka)(destDir, 'my-service');
        const indexFile = path.join(destDir, 'src', 'kafka', 'index.ts');
        expect(fs.existsSync(indexFile)).toBe(true);
    });
    it('adds @nestjs/microservices to package.json', async () => {
        const destDir = await makeTempDir();
        await writeFixturePackageJson(destDir, {});
        await (0, scaffold_1.addKafka)(destDir, 'my-service');
        const raw = await fsp.readFile(path.join(destDir, 'package.json'), 'utf-8');
        const pkg = JSON.parse(raw);
        expect(pkg.dependencies).toHaveProperty('@nestjs/microservices');
        expect(pkg.dependencies).toHaveProperty('kafkajs');
    });
    it('uses the service name in consumer group id', async () => {
        const destDir = await makeTempDir();
        await writeFixturePackageJson(destDir, {});
        await (0, scaffold_1.addKafka)(destDir, 'my-cool-service');
        const moduleFile = path.join(destDir, 'src', 'kafka', 'kafka.module.ts');
        const content = await fsp.readFile(moduleFile, 'utf-8');
        expect(content).toMatch(/my-cool-service-consumer-group/);
    });
    it('wires KafkaModule into app.module.ts imports when file exists', async () => {
        const destDir = await makeTempDir();
        await writeFixturePackageJson(destDir, {});
        await writeFixtureAppModule(destDir);
        await (0, scaffold_1.addKafka)(destDir, 'my-service');
        const content = await fsp.readFile(path.join(destDir, 'src', 'app.module.ts'), 'utf-8');
        expect(content).toMatch(/KafkaModule/);
        expect(content).toMatch(/kafka\/kafka\.module/);
    });
    it('adds KAFKA_BROKER to .env.example', async () => {
        const destDir = await makeTempDir();
        await writeFixturePackageJson(destDir, {});
        await writeFixtureEnvExample(destDir);
        await (0, scaffold_1.addKafka)(destDir, 'my-service');
        const content = await fsp.readFile(path.join(destDir, '.env.example'), 'utf-8');
        expect(content).toMatch(/KAFKA_BROKER=/);
    });
    it('handles missing app.module.ts gracefully (no throw)', async () => {
        const destDir = await makeTempDir();
        await writeFixturePackageJson(destDir, {});
        await expect((0, scaffold_1.addKafka)(destDir, 'my-service')).resolves.not.toThrow();
        expect(fs.existsSync(path.join(destDir, 'src', 'kafka', 'kafka.module.ts'))).toBe(true);
    });
});
//# sourceMappingURL=scaffold.test.js.map