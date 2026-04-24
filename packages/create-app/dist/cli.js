#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/cli.ts
var import_prompts = require("@clack/prompts");
var import_path3 = require("path");

// src/scaffold.ts
var import_promises2 = require("fs/promises");
var import_path2 = require("path");

// src/replacements.ts
function toPascalCase(kebab) {
  return kebab.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}
function buildReplacements(serviceName) {
  return [
    ["nestjs-backend-template", serviceName],
    ["NestjsBackendTemplate", toPascalCase(serviceName)]
  ];
}
function validateServiceName(name) {
  if (!name || name.length < 2) {
    return "Service name must be at least 2 characters";
  }
  if (/[A-Z]/.test(name)) {
    return "Service name must be lowercase (no uppercase letters)";
  }
  if (name.includes(" ")) {
    return "Service name must not contain spaces";
  }
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return "Service name must not contain path traversal characters (..  / or \\)";
  }
  if (name.startsWith("-") || name.endsWith("-")) {
    return "Service name must not start or end with a hyphen";
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name)) {
    return "Service name must contain only lowercase letters, numbers, and hyphens";
  }
  return void 0;
}

// src/kafka-module.ts
var import_promises = require("fs/promises");
var import_path = require("path");
async function generateKafkaModule(destDir, serviceName) {
  const kafkaDir = (0, import_path.join)(destDir, "src", "kafka");
  await (0, import_promises.mkdir)(kafkaDir, { recursive: true });
  const moduleContent = `import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { KafkaController } from './kafka.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([{
      name: 'KAFKA_SERVICE',
      useFactory: (configService: ConfigService) => ({
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
          },
          consumer: {
            groupId: \`${serviceName}-consumer-group\`,
          },
        },
      }),
      inject: [ConfigService],
    }]),
  ],
  controllers: [KafkaController],
  exports: [ClientsModule],
})
export class KafkaModule {}
`;
  await (0, import_promises.writeFile)((0, import_path.join)(kafkaDir, "kafka.module.ts"), moduleContent, "utf-8");
  const controllerContent = `import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class KafkaController {
  @MessagePattern('example-topic')
  handleMessage(@Payload() message: unknown) {
    // TODO: Implement your Kafka message handler
    return message;
  }
}
`;
  await (0, import_promises.writeFile)(
    (0, import_path.join)(kafkaDir, "kafka.controller.ts"),
    controllerContent,
    "utf-8"
  );
  const barrelContent = `export { KafkaModule } from './kafka.module';
export { KafkaController } from './kafka.controller';
`;
  await (0, import_promises.writeFile)((0, import_path.join)(kafkaDir, "index.ts"), barrelContent, "utf-8");
}

// src/scaffold.ts
async function isBinaryFile(filePath) {
  try {
    const buffer = Buffer.alloc(512);
    const handle = await import("fs/promises").then((m) => m.open(filePath, "r"));
    try {
      const { bytesRead } = await handle.read(buffer, 0, 512, 0);
      await handle.close();
      for (let i = 0; i < bytesRead; i++) {
        if (buffer[i] === 0) {
          return true;
        }
      }
      return false;
    } catch {
      await handle.close();
      return false;
    }
  } catch {
    return false;
  }
}
async function collectPaths(dir) {
  const results = [];
  const entries = await (0, import_promises2.readdir)(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = (0, import_path2.join)(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectPaths(fullPath);
      results.push(...nested);
    }
    results.push(fullPath);
  }
  return results;
}
async function replaceFileContents(dir, replacements) {
  const entries = await (0, import_promises2.readdir)(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = (0, import_path2.join)(dir, entry.name);
    if (entry.isDirectory()) {
      await replaceFileContents(fullPath, replacements);
    } else {
      const binary = await isBinaryFile(fullPath);
      if (binary) continue;
      try {
        let content = await (0, import_promises2.readFile)(fullPath, "utf-8");
        let modified = false;
        for (const [from, to] of replacements) {
          if (content.includes(from)) {
            content = content.replaceAll(from, to);
            modified = true;
          }
        }
        if (modified) {
          await (0, import_promises2.writeFile)(fullPath, content, "utf-8");
        }
      } catch {
      }
    }
  }
}
async function renamePathsWithPlaceholders(dir, replacements) {
  const allPaths = await collectPaths(dir);
  allPaths.sort((a, b) => {
    const depthA = a.split("/").length;
    const depthB = b.split("/").length;
    return depthB - depthA;
  });
  for (const oldPath of allPaths) {
    const parent = (0, import_path2.dirname)(oldPath);
    let newName = (0, import_path2.basename)(oldPath);
    let changed = false;
    for (const [from, to] of replacements) {
      if (newName.includes(from)) {
        newName = newName.replaceAll(from, to);
        changed = true;
      }
    }
    if (changed) {
      const newPath = (0, import_path2.join)(parent, newName);
      try {
        await (0, import_promises2.rename)(oldPath, newPath);
      } catch {
      }
    }
  }
}
async function patchPackageJson(destDir, options) {
  const pkgPath = (0, import_path2.join)(destDir, "package.json");
  try {
    const raw = await (0, import_promises2.readFile)(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);
    pkg.name = options.serviceName;
    if (options.db === "mongo") {
      if (pkg.dependencies) {
        delete pkg.dependencies["@prisma/client"];
        delete pkg.dependencies["@prisma/adapter-pg"];
        delete pkg.dependencies["pg"];
        delete pkg.dependencies["@types/pg"];
        pkg.dependencies["mongoose"] = "^8.0.0";
        pkg.dependencies["@nestjs/mongoose"] = "^11.0.0";
      }
      if (pkg.devDependencies) {
        delete pkg.devDependencies["prisma"];
      }
    }
    if (options.modules.includes("kafka")) {
      if (!pkg.dependencies) pkg.dependencies = {};
      pkg.dependencies["@nestjs/microservices"] = "^11.1.18";
      pkg.dependencies["kafkajs"] = "^2.2.4";
    }
    if (!options.modules.includes("redis")) {
      if (pkg.dependencies) {
        delete pkg.dependencies["ioredis"];
        delete pkg.dependencies["@nestjs-modules/ioredis"];
      }
    }
    if (!options.modules.includes("otel")) {
      if (pkg.dependencies) {
        for (const dep of Object.keys(pkg.dependencies)) {
          if (dep.startsWith("@opentelemetry/")) {
            delete pkg.dependencies[dep];
          }
        }
      }
    }
    await (0, import_promises2.writeFile)(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  } catch (err) {
    console.warn("Warning: Could not patch package.json:", err);
  }
}
async function pathExists(p) {
  try {
    await (0, import_promises2.stat)(p);
    return true;
  } catch {
    return false;
  }
}
async function safeDeleteFile(destDir, filePath) {
  const resolved = (0, import_path2.resolve)(filePath);
  const resolvedDestDir = (0, import_path2.resolve)(destDir);
  if (!resolved.startsWith(resolvedDestDir + "/") && resolved !== resolvedDestDir) {
    throw new Error(`Security: path '${filePath}' is outside destDir '${destDir}'`);
  }
  try {
    await (0, import_promises2.rm)(resolved, { force: true });
  } catch {
  }
}
async function safeDeleteDir(destDir, dirPath) {
  const resolved = (0, import_path2.resolve)(dirPath);
  const resolvedDestDir = (0, import_path2.resolve)(destDir);
  if (!resolved.startsWith(resolvedDestDir + "/") && resolved !== resolvedDestDir) {
    throw new Error(`Security: path '${dirPath}' is outside destDir '${destDir}'`);
  }
  try {
    await (0, import_promises2.rm)(resolved, { recursive: true, force: true });
  } catch {
  }
}
async function removeMatchingLines(filePath, patterns) {
  if (!await pathExists(filePath)) return;
  try {
    const content = await (0, import_promises2.readFile)(filePath, "utf-8");
    let updated = content;
    for (const pattern of patterns) {
      updated = updated.replace(pattern, "");
    }
    updated = updated.replace(/\n{3,}/g, "\n\n");
    if (updated !== content) {
      await (0, import_promises2.writeFile)(filePath, updated, "utf-8");
    }
  } catch {
  }
}
async function removeRedis(destDir) {
  await safeDeleteDir(destDir, (0, import_path2.join)(destDir, "src", "infrastructure", "cache"));
  const pkgPath = (0, import_path2.join)(destDir, "package.json");
  if (await pathExists(pkgPath)) {
    try {
      const raw = await (0, import_promises2.readFile)(pkgPath, "utf-8");
      const pkg = JSON.parse(raw);
      if (pkg.dependencies) {
        delete pkg.dependencies["ioredis"];
        delete pkg.dependencies["@nestjs-modules/ioredis"];
      }
      await (0, import_promises2.writeFile)(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
    } catch {
    }
  }
  const appModulePath = (0, import_path2.join)(destDir, "src", "app.module.ts");
  await removeMatchingLines(appModulePath, [
    // Remove the import statement for CacheModule (from cache/redis.module)
    /^import\s*\{[^}]*CacheModule[^}]*\}\s*from\s*['"][^'"]*cache[^'"]*['"];\n?/m,
    // Remove CacheModule entry from the imports array (with optional trailing comma)
    /^\s*CacheModule,?\n/m
  ]);
  const envExamplePath = (0, import_path2.join)(destDir, ".env.example");
  await removeMatchingLines(envExamplePath, [
    // Remove REDIS_URL line
    /^REDIS_URL=.*\n?/m,
    // Remove REDIS_HOST line
    /^REDIS_HOST=.*\n?/m,
    // Remove REDIS_PORT line
    /^REDIS_PORT=.*\n?/m,
    // Remove # Redis section header if it becomes orphaned
    /^# Redis\n(?=\n)/m
  ]);
}
async function removeOtel(destDir) {
  await safeDeleteFile(destDir, (0, import_path2.join)(destDir, "src", "instrumentation.ts"));
  await safeDeleteFile(
    destDir,
    (0, import_path2.join)(destDir, "src", "instrumentation.spec.ts")
  );
  const pkgPath = (0, import_path2.join)(destDir, "package.json");
  if (await pathExists(pkgPath)) {
    try {
      const raw = await (0, import_promises2.readFile)(pkgPath, "utf-8");
      const pkg = JSON.parse(raw);
      if (pkg.dependencies) {
        for (const dep of Object.keys(pkg.dependencies)) {
          if (dep.startsWith("@opentelemetry/")) {
            delete pkg.dependencies[dep];
          }
        }
      }
      await (0, import_promises2.writeFile)(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
    } catch {
    }
  }
  const envExamplePath = (0, import_path2.join)(destDir, ".env.example");
  await removeMatchingLines(envExamplePath, [
    /^OTEL_ENABLED=.*\n?/m,
    /^OTEL_SERVICE_NAME=.*\n?/m,
    /^OTEL_PROMETHEUS_PORT=.*\n?/m,
    /^OTEL_EXPORTER_OTLP_ENDPOINT=.*\n?/m,
    // Remove the # Observability - OpenTelemetry comment block if it becomes orphaned
    /^# Observability - OpenTelemetry[^\n]*\n(?=\n|$)/m
  ]);
  const mainTsPath = (0, import_path2.join)(destDir, "src", "main.ts");
  await removeMatchingLines(mainTsPath, [
    // Remove: import otelSdk from './instrumentation';
    /^import\s+\w+\s+from\s+['"][^'"]*instrumentation['"];\n?/m,
    // Remove: otelSdk?.start(); line
    /^\s*\w+Sdk\?\.start\(\);\n?/m
  ]);
}
async function addKafka(destDir, serviceName) {
  await generateKafkaModule(destDir, serviceName);
  const pkgPath = (0, import_path2.join)(destDir, "package.json");
  if (await pathExists(pkgPath)) {
    try {
      const raw = await (0, import_promises2.readFile)(pkgPath, "utf-8");
      const pkg = JSON.parse(raw);
      if (!pkg.dependencies) pkg.dependencies = {};
      pkg.dependencies["@nestjs/microservices"] = "^11.1.18";
      pkg.dependencies["kafkajs"] = "^2.2.4";
      await (0, import_promises2.writeFile)(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
    } catch {
    }
  }
  const appModulePath = (0, import_path2.join)(destDir, "src", "app.module.ts");
  if (await pathExists(appModulePath)) {
    try {
      let content = await (0, import_promises2.readFile)(appModulePath, "utf-8");
      const kafkaImportLine = `import { KafkaModule } from './kafka/kafka.module';
`;
      if (!content.includes(kafkaImportLine)) {
        content = content.replace(
          /^(@Module\()/m,
          `${kafkaImportLine}
$1`
        );
      }
      if (!content.includes("KafkaModule,") && !content.includes("KafkaModule\n")) {
        content = content.replace(
          /(imports:\s*\[[^\]]*?)(\s*\])/s,
          (match, arrayContent, closing) => {
            const trimmed = arrayContent.trimEnd();
            const sep = trimmed.endsWith(",") ? "" : ",";
            return `${trimmed}${sep}
    KafkaModule,${closing}`;
          }
        );
      }
      await (0, import_promises2.writeFile)(appModulePath, content, "utf-8");
    } catch {
    }
  }
  const envExamplePath = (0, import_path2.join)(destDir, ".env.example");
  if (await pathExists(envExamplePath)) {
    try {
      let content = await (0, import_promises2.readFile)(envExamplePath, "utf-8");
      if (!content.includes("KAFKA_BROKER")) {
        content = content.trimEnd() + "\n\n# Kafka\nKAFKA_BROKER=localhost:9092\n";
        await (0, import_promises2.writeFile)(envExamplePath, content, "utf-8");
      }
    } catch {
    }
  }
}
async function scaffold(options) {
  const templateDir = (0, import_path2.join)(__dirname, "..", "templates", options.db);
  const { destDir, serviceName, modules } = options;
  await (0, import_promises2.cp)(templateDir, destDir, { recursive: true });
  const replacements = buildReplacements(serviceName);
  await replaceFileContents(destDir, replacements);
  await renamePathsWithPlaceholders(destDir, replacements);
  await patchPackageJson(destDir, options);
  if (!modules.includes("redis")) {
    await removeRedis(destDir);
  }
  if (!modules.includes("otel")) {
    await removeOtel(destDir);
  }
  if (modules.includes("kafka")) {
    await addKafka(destDir, serviceName);
  }
}

// src/cli.ts
function guardCancel(value) {
  if ((0, import_prompts.isCancel)(value)) {
    (0, import_prompts.cancel)("Operation cancelled.");
    process.exit(0);
  }
  return value;
}
async function main() {
  (0, import_prompts.intro)("create-app -- NestJS DDD scaffolder");
  const serviceName = guardCancel(
    await (0, import_prompts.text)({
      message: "Service name (kebab-case)",
      placeholder: "my-service",
      validate: (v) => validateServiceName(v)
    })
  );
  const db = guardCancel(
    await (0, import_prompts.select)({
      message: "Select database",
      options: [
        { value: "postgres", label: "PostgreSQL", hint: "default" },
        { value: "mongo", label: "MongoDB" }
      ]
    })
  );
  const modules = guardCancel(
    await (0, import_prompts.multiselect)({
      message: "Optional modules (space to toggle, enter to confirm)",
      options: [
        { value: "redis", label: "Redis", hint: "caching + circuit breaker" },
        { value: "otel", label: "OpenTelemetry", hint: "traces + metrics" },
        { value: "kafka", label: "Kafka", hint: "message broker boilerplate" }
      ],
      required: false
    })
  );
  const selectedModules = modules.length > 0 ? modules.join(", ") : "none";
  console.log("");
  console.log(`  Service name : ${serviceName}`);
  console.log(`  Database     : ${db}`);
  console.log(`  Modules      : ${selectedModules}`);
  console.log("");
  const proceed = guardCancel(
    await (0, import_prompts.confirm)({
      message: "Scaffold project with these settings?",
      initialValue: true
    })
  );
  if (!proceed) {
    (0, import_prompts.cancel)("Scaffolding cancelled.");
    process.exit(0);
  }
  const destDir = (0, import_path3.join)(process.cwd(), serviceName);
  const s = (0, import_prompts.spinner)();
  s.start("Scaffolding project...");
  try {
    await scaffold({
      serviceName,
      db,
      modules,
      destDir
    });
    s.stop("Project scaffolded!");
  } catch (err) {
    s.stop("Scaffolding failed.");
    throw err;
  }
  (0, import_prompts.outro)(
    `Next steps:

  cd ${serviceName}
  npm install
  cp .env.example .env
  npm run start:dev
`
  );
}
main().catch((err) => {
  (0, import_prompts.cancel)(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
