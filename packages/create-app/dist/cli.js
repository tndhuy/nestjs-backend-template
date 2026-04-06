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
var import_path2 = require("path");

// src/scaffold.ts
var import_promises = require("fs/promises");
var import_path = require("path");

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

// src/scaffold.ts
async function isBinaryFile(filePath) {
  try {
    const fd = await import("fs");
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
  const entries = await (0, import_promises.readdir)(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = (0, import_path.join)(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectPaths(fullPath);
      results.push(...nested);
    }
    results.push(fullPath);
  }
  return results;
}
async function replaceFileContents(dir, replacements) {
  const entries = await (0, import_promises.readdir)(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = (0, import_path.join)(dir, entry.name);
    if (entry.isDirectory()) {
      await replaceFileContents(fullPath, replacements);
    } else {
      const binary = await isBinaryFile(fullPath);
      if (binary) continue;
      try {
        let content = await (0, import_promises.readFile)(fullPath, "utf-8");
        let modified = false;
        for (const [from, to] of replacements) {
          if (content.includes(from)) {
            content = content.replaceAll(from, to);
            modified = true;
          }
        }
        if (modified) {
          await (0, import_promises.writeFile)(fullPath, content, "utf-8");
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
    const parent = (0, import_path.dirname)(oldPath);
    let newName = (0, import_path.basename)(oldPath);
    let changed = false;
    for (const [from, to] of replacements) {
      if (newName.includes(from)) {
        newName = newName.replaceAll(from, to);
        changed = true;
      }
    }
    if (changed) {
      const newPath = (0, import_path.join)(parent, newName);
      try {
        await (0, import_promises.rename)(oldPath, newPath);
      } catch {
      }
    }
  }
}
async function patchPackageJson(destDir, options) {
  const pkgPath = (0, import_path.join)(destDir, "package.json");
  try {
    const raw = await (0, import_promises.readFile)(pkgPath, "utf-8");
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
    await (0, import_promises.writeFile)(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  } catch (err) {
    console.warn("Warning: Could not patch package.json:", err);
  }
}
async function scaffold(options) {
  const templateDir = (0, import_path.join)(__dirname, "..", "templates", options.db);
  const { destDir, serviceName } = options;
  await (0, import_promises.cp)(templateDir, destDir, { recursive: true });
  const replacements = buildReplacements(serviceName);
  await replaceFileContents(destDir, replacements);
  await renamePathsWithPlaceholders(destDir, replacements);
  await patchPackageJson(destDir, options);
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
  const destDir = (0, import_path2.join)(process.cwd(), serviceName);
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
