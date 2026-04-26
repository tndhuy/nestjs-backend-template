"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const os_1 = require("os");
const path_1 = require("path");
const scaffold_1 = require("../scaffold");
describe('CLI smoke test', () => {
    let tempDir;
    beforeEach(async () => {
        tempDir = await (0, promises_1.mkdtemp)((0, path_1.join)((0, os_1.tmpdir)(), 'create-app-smoke-'));
    });
    afterEach(async () => {
        await (0, promises_1.rm)(tempDir, { recursive: true, force: true });
    });
    it('scaffolds a postgres project with all modules', async () => {
        const destDir = (0, path_1.join)(tempDir, 'test-service');
        await (0, scaffold_1.scaffold)({
            serviceName: 'test-service',
            db: 'postgres',
            modules: ['redis', 'otel', 'kafka'],
            destDir,
        });
        const pkg = JSON.parse(await (0, promises_1.readFile)((0, path_1.join)(destDir, 'package.json'), 'utf-8'));
        expect(pkg.name).toBe('test-service');
        expect(pkg.dependencies['@prisma/client'] || pkg.devDependencies?.['prisma']).toBeTruthy();
        const appModule = await (0, promises_1.readFile)((0, path_1.join)(destDir, 'src', 'app.module.ts'), 'utf-8');
        expect(appModule).not.toContain('nestjs-backend-template');
        expect(appModule).not.toContain('NestjsBackendTemplate');
        const kafkaModule = await (0, promises_1.readFile)((0, path_1.join)(destDir, 'src', 'kafka', 'kafka.module.ts'), 'utf-8');
        expect(kafkaModule).toContain('KafkaModule');
        expect(kafkaModule).toContain('test-service-consumer-group');
        const exampleDir = await (0, promises_1.stat)((0, path_1.join)(destDir, 'src', 'modules', 'example'));
        expect(exampleDir.isDirectory()).toBe(true);
    }, 30000);
    it('scaffolds a mongo project without optional modules', async () => {
        const destDir = (0, path_1.join)(tempDir, 'mongo-svc');
        await (0, scaffold_1.scaffold)({
            serviceName: 'mongo-svc',
            db: 'mongo',
            modules: [],
            destDir,
        });
        const pkg = JSON.parse(await (0, promises_1.readFile)((0, path_1.join)(destDir, 'package.json'), 'utf-8'));
        expect(pkg.name).toBe('mongo-svc');
        expect(pkg.dependencies).toHaveProperty('mongoose');
        expect(pkg.dependencies).not.toHaveProperty('@prisma/client');
        expect(pkg.dependencies).not.toHaveProperty('ioredis');
        const hasOtel = Object.keys(pkg.dependencies || {}).some((k) => k.includes('opentelemetry'));
        expect(hasOtel).toBe(false);
        expect(pkg.dependencies).not.toHaveProperty('@nestjs/microservices');
    }, 30000);
});
//# sourceMappingURL=cli.smoke.js.map