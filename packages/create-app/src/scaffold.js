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
exports.removeRedis = removeRedis;
exports.removeOtel = removeOtel;
exports.addKafka = addKafka;
exports.scaffold = scaffold;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const replacements_1 = require("./replacements");
const kafka_module_1 = require("./kafka-module");
async function isBinaryFile(filePath) {
    try {
        const buffer = Buffer.alloc(512);
        const handle = await Promise.resolve().then(() => __importStar(require('fs/promises'))).then((m) => m.open(filePath, 'r'));
        try {
            const { bytesRead } = await handle.read(buffer, 0, 512, 0);
            await handle.close();
            for (let i = 0; i < bytesRead; i++) {
                if (buffer[i] === 0) {
                    return true;
                }
            }
            return false;
        }
        catch {
            await handle.close();
            return false;
        }
    }
    catch {
        return false;
    }
}
async function collectPaths(dir) {
    const results = [];
    const entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = (0, path_1.join)(dir, entry.name);
        if (entry.isDirectory()) {
            const nested = await collectPaths(fullPath);
            results.push(...nested);
        }
        results.push(fullPath);
    }
    return results;
}
async function replaceFileContents(dir, replacements) {
    const entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = (0, path_1.join)(dir, entry.name);
        if (entry.isDirectory()) {
            await replaceFileContents(fullPath, replacements);
        }
        else {
            const binary = await isBinaryFile(fullPath);
            if (binary)
                continue;
            try {
                let content = await (0, promises_1.readFile)(fullPath, 'utf-8');
                let modified = false;
                for (const [from, to] of replacements) {
                    if (content.includes(from)) {
                        content = content.replaceAll(from, to);
                        modified = true;
                    }
                }
                if (modified) {
                    await (0, promises_1.writeFile)(fullPath, content, 'utf-8');
                }
            }
            catch {
            }
        }
    }
}
async function renamePathsWithPlaceholders(dir, replacements) {
    const allPaths = await collectPaths(dir);
    allPaths.sort((a, b) => {
        const depthA = a.split('/').length;
        const depthB = b.split('/').length;
        return depthB - depthA;
    });
    for (const oldPath of allPaths) {
        const parent = (0, path_1.dirname)(oldPath);
        let newName = (0, path_1.basename)(oldPath);
        let changed = false;
        for (const [from, to] of replacements) {
            if (newName.includes(from)) {
                newName = newName.replaceAll(from, to);
                changed = true;
            }
        }
        if (changed) {
            const newPath = (0, path_1.join)(parent, newName);
            try {
                await (0, promises_1.rename)(oldPath, newPath);
            }
            catch {
            }
        }
    }
}
async function patchPackageJson(destDir, options) {
    const pkgPath = (0, path_1.join)(destDir, 'package.json');
    try {
        const raw = await (0, promises_1.readFile)(pkgPath, 'utf-8');
        const pkg = JSON.parse(raw);
        pkg.name = options.serviceName;
        if (options.db === 'mongo') {
            if (pkg.dependencies) {
                delete pkg.dependencies['@prisma/client'];
                delete pkg.dependencies['@prisma/adapter-pg'];
                delete pkg.dependencies['pg'];
                delete pkg.dependencies['@types/pg'];
                pkg.dependencies['mongoose'] = '^8.0.0';
                pkg.dependencies['@nestjs/mongoose'] = '^11.0.0';
            }
            if (pkg.devDependencies) {
                delete pkg.devDependencies['prisma'];
            }
        }
        if (options.modules.includes('kafka')) {
            if (!pkg.dependencies)
                pkg.dependencies = {};
            pkg.dependencies['@nestjs/microservices'] = '^11.1.18';
            pkg.dependencies['kafkajs'] = '^2.2.4';
        }
        if (!options.modules.includes('redis')) {
            if (pkg.dependencies) {
                delete pkg.dependencies['ioredis'];
                delete pkg.dependencies['@nestjs-modules/ioredis'];
            }
        }
        if (!options.modules.includes('otel')) {
            if (pkg.dependencies) {
                for (const dep of Object.keys(pkg.dependencies)) {
                    if (dep.startsWith('@opentelemetry/')) {
                        delete pkg.dependencies[dep];
                    }
                }
            }
        }
        await (0, promises_1.writeFile)(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    }
    catch (err) {
        console.warn('Warning: Could not patch package.json:', err);
    }
}
async function pathExists(p) {
    try {
        await (0, promises_1.stat)(p);
        return true;
    }
    catch {
        return false;
    }
}
async function safeDeleteFile(destDir, filePath) {
    const resolved = (0, path_1.resolve)(filePath);
    const resolvedDestDir = (0, path_1.resolve)(destDir);
    if (!resolved.startsWith(resolvedDestDir + '/') && resolved !== resolvedDestDir) {
        throw new Error(`Security: path '${filePath}' is outside destDir '${destDir}'`);
    }
    try {
        await (0, promises_1.rm)(resolved, { force: true });
    }
    catch {
    }
}
async function safeDeleteDir(destDir, dirPath) {
    const resolved = (0, path_1.resolve)(dirPath);
    const resolvedDestDir = (0, path_1.resolve)(destDir);
    if (!resolved.startsWith(resolvedDestDir + '/') && resolved !== resolvedDestDir) {
        throw new Error(`Security: path '${dirPath}' is outside destDir '${destDir}'`);
    }
    try {
        await (0, promises_1.rm)(resolved, { recursive: true, force: true });
    }
    catch {
    }
}
async function removeMatchingLines(filePath, patterns) {
    if (!(await pathExists(filePath)))
        return;
    try {
        const content = await (0, promises_1.readFile)(filePath, 'utf-8');
        let updated = content;
        for (const pattern of patterns) {
            updated = updated.replace(pattern, '');
        }
        updated = updated.replace(/\n{3,}/g, '\n\n');
        if (updated !== content) {
            await (0, promises_1.writeFile)(filePath, updated, 'utf-8');
        }
    }
    catch {
    }
}
async function removeRedis(destDir) {
    await safeDeleteDir(destDir, (0, path_1.join)(destDir, 'src', 'infrastructure', 'cache'));
    const pkgPath = (0, path_1.join)(destDir, 'package.json');
    if (await pathExists(pkgPath)) {
        try {
            const raw = await (0, promises_1.readFile)(pkgPath, 'utf-8');
            const pkg = JSON.parse(raw);
            if (pkg.dependencies) {
                delete pkg.dependencies['ioredis'];
                delete pkg.dependencies['@nestjs-modules/ioredis'];
            }
            await (0, promises_1.writeFile)(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
        }
        catch {
        }
    }
    const appModulePath = (0, path_1.join)(destDir, 'src', 'app.module.ts');
    await removeMatchingLines(appModulePath, [
        /^import\s*\{[^}]*CacheModule[^}]*\}\s*from\s*['"][^'"]*cache[^'"]*['"];\n?/m,
        /^\s*CacheModule,?\n/m,
    ]);
    const envExamplePath = (0, path_1.join)(destDir, '.env.example');
    await removeMatchingLines(envExamplePath, [
        /^REDIS_URL=.*\n?/m,
        /^REDIS_HOST=.*\n?/m,
        /^REDIS_PORT=.*\n?/m,
        /^# Redis\n(?=\n)/m,
    ]);
}
async function removeOtel(destDir) {
    await safeDeleteFile(destDir, (0, path_1.join)(destDir, 'src', 'instrumentation.ts'));
    await safeDeleteFile(destDir, (0, path_1.join)(destDir, 'src', 'instrumentation.spec.ts'));
    const pkgPath = (0, path_1.join)(destDir, 'package.json');
    if (await pathExists(pkgPath)) {
        try {
            const raw = await (0, promises_1.readFile)(pkgPath, 'utf-8');
            const pkg = JSON.parse(raw);
            if (pkg.dependencies) {
                for (const dep of Object.keys(pkg.dependencies)) {
                    if (dep.startsWith('@opentelemetry/')) {
                        delete pkg.dependencies[dep];
                    }
                }
            }
            await (0, promises_1.writeFile)(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
        }
        catch {
        }
    }
    const envExamplePath = (0, path_1.join)(destDir, '.env.example');
    await removeMatchingLines(envExamplePath, [
        /^OTEL_ENABLED=.*\n?/m,
        /^OTEL_SERVICE_NAME=.*\n?/m,
        /^OTEL_PROMETHEUS_PORT=.*\n?/m,
        /^OTEL_EXPORTER_OTLP_ENDPOINT=.*\n?/m,
        /^# Observability - OpenTelemetry[^\n]*\n(?=\n|$)/m,
    ]);
    const mainTsPath = (0, path_1.join)(destDir, 'src', 'main.ts');
    await removeMatchingLines(mainTsPath, [
        /^import\s+\w+\s+from\s+['"][^'"]*instrumentation['"];\n?/m,
        /^\s*\w+Sdk\?\.start\(\);\n?/m,
    ]);
}
async function addKafka(destDir, serviceName) {
    await (0, kafka_module_1.generateKafkaModule)(destDir, serviceName);
    const pkgPath = (0, path_1.join)(destDir, 'package.json');
    if (await pathExists(pkgPath)) {
        try {
            const raw = await (0, promises_1.readFile)(pkgPath, 'utf-8');
            const pkg = JSON.parse(raw);
            if (!pkg.dependencies)
                pkg.dependencies = {};
            pkg.dependencies['@nestjs/microservices'] = '^11.1.18';
            pkg.dependencies['kafkajs'] = '^2.2.4';
            await (0, promises_1.writeFile)(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
        }
        catch {
        }
    }
    const appModulePath = (0, path_1.join)(destDir, 'src', 'app.module.ts');
    if (await pathExists(appModulePath)) {
        try {
            let content = await (0, promises_1.readFile)(appModulePath, 'utf-8');
            const kafkaImportLine = `import { KafkaModule } from './kafka/kafka.module';\n`;
            if (!content.includes(kafkaImportLine)) {
                content = content.replace(/^(@Module\()/m, `${kafkaImportLine}\n$1`);
            }
            if (!content.includes('KafkaModule,') && !content.includes('KafkaModule\n')) {
                content = content.replace(/(imports:\s*\[[^\]]*?)(\s*\])/s, (match, arrayContent, closing) => {
                    const trimmed = arrayContent.trimEnd();
                    const sep = trimmed.endsWith(',') ? '' : ',';
                    return `${trimmed}${sep}\n    KafkaModule,${closing}`;
                });
            }
            await (0, promises_1.writeFile)(appModulePath, content, 'utf-8');
        }
        catch {
        }
    }
    const envExamplePath = (0, path_1.join)(destDir, '.env.example');
    if (await pathExists(envExamplePath)) {
        try {
            let content = await (0, promises_1.readFile)(envExamplePath, 'utf-8');
            if (!content.includes('KAFKA_BROKER')) {
                content = content.trimEnd() + '\n\n# Kafka\nKAFKA_BROKER=localhost:9092\n';
                await (0, promises_1.writeFile)(envExamplePath, content, 'utf-8');
            }
        }
        catch {
        }
    }
}
async function scaffold(options) {
    const templateDir = (0, path_1.join)(__dirname, '..', 'templates', options.db);
    const { destDir, serviceName, modules } = options;
    await (0, promises_1.cp)(templateDir, destDir, { recursive: true });
    const replacements = (0, replacements_1.buildReplacements)(serviceName);
    await replaceFileContents(destDir, replacements);
    await renamePathsWithPlaceholders(destDir, replacements);
    await patchPackageJson(destDir, options);
    if (!modules.includes('redis')) {
        await removeRedis(destDir);
    }
    if (!modules.includes('otel')) {
        await removeOtel(destDir);
    }
    if (modules.includes('kafka')) {
        await addKafka(destDir, serviceName);
    }
}
//# sourceMappingURL=scaffold.js.map