# Phase 5: CLI Package - Research

**Researched:** 2026-04-06
**Domain:** npm CLI tooling, Node.js scaffolding, monorepo packaging, GitHub Packages publishing
**Confidence:** HIGH

## Summary

Phase 5 wraps the existing NestJS DDD template as a standalone npm CLI package at `packages/create-app/`. The CLI uses `@clack/prompts` (already decided) to interactively collect service name, database preference (Postgres/MongoDB), and optional module toggles (Redis, OTel, Kafka), then copies the template directory with placeholder substitution.

The template repo currently has no `workspaces` field — adding `"workspaces": ["packages/*"]` to the root `package.json` is the only monorepo setup required. The `packages/create-app/` package is entirely self-contained with its own `package.json`, `tsup` build, and `bin` entry.

The `mongo-compatible` git branch already exists and contains `mongodb.module.ts` and Mongoose schemas — the CLI copies from either the `main` or `mongo-compatible` snapshot depending on DB selection. The key insight is that the CLI ships as a compiled artifact; it does not clone git branches at runtime. Instead, the template files for both DB paths are bundled inside `packages/create-app/templates/`.

**Primary recommendation:** Build the CLI as a standalone TypeScript package under `packages/create-app/`, compiled with `tsup` to a single CJS bundle, with template source files stored under `packages/create-app/templates/{postgres,mongo}/` as plain file trees.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use `@clack/prompts` for all interactive prompts. No commander or inquirer.
- **D-02:** Copy entire template directory + search/replace placeholder strings. No template engines (EJS/Handlebars).
- **D-03:** Placeholder mapping: `nestjs-backend-template` → `{service-name}` (kebab-case); `NestjsBackendTemplate` → `{ServiceName}` (PascalCase).
- **D-04:** Database selection is an interactive `@clack/prompts` select prompt. PostgreSQL is default, MongoDB is alternative.
- **D-05:** No `--db` CLI flag. Selection is always interactive. No CI/non-interactive mode for now.
- **D-06:** MongoDB path switches in Mongoose-based infrastructure and removes Prisma dependencies. PostgreSQL uses standard Prisma setup.
- **D-07:** Three optional modules via multiselect: Redis, OpenTelemetry, Kafka.
- **D-08:** `src/example/` module is always included.
- **D-09:** Lives at `packages/create-app/` within the same monorepo. Versioned together.
- **D-10:** Package name: `@team/create-app`.
- **D-11:** Publish to GitHub Packages (private registry, `@team` scope).
- **D-12:** Team members configure `.npmrc` with `//npm.pkg.github.com/:_authToken=TOKEN`.

### Claude's Discretion
- Exact placeholder token format inside files
- Kafka boilerplate module structure (no existing reference — Claude designs it)
- Error handling and rollback if scaffolding fails mid-way
- `package.json` `bin` field setup and CLI entry point structure

### Deferred Ideas (OUT OF SCOPE)
- `--db` CLI flag for non-interactive/CI mode
- Example module toggle (always included)
- Scheduled backup/restore commands
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-010 | npm CLI package `@team/create-app` — `npx @team/create-app my-service` scaffolds a ready-to-run NestJS DDD project with interactive prompts, name substitution throughout, and published to team registry | @clack/prompts API, tsup bundling, GitHub Packages publishing, template copy strategy, Kafka boilerplate design |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @clack/prompts | 1.2.0 | Interactive CLI prompts (text, select, multiselect, spinner) | Locked decision D-01; modern UX, zero-config [VERIFIED: npm registry] |
| tsup | 8.5.1 | Bundle TypeScript CLI to single CJS file | Zero-config esbuild wrapper; auto-handles shebang → executable output [VERIFIED: npm registry] |
| execa | 9.6.1 | Run child processes (npm install in scaffolded dir) | Gold standard for subprocess in modern Node CLI tools [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @nestjs/microservices | 11.1.18 | Kafka transport for generated Kafka module | Added to scaffolded project's package.json when user selects Kafka [VERIFIED: npm registry] |
| kafkajs | 2.2.4 | Kafka client (peer dep of @nestjs/microservices) | Added alongside @nestjs/microservices in scaffolded project [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tsup | tsc directly | tsup handles shebang auto-chmod, tree-shaking, and single-file output with zero config — tsc requires manual `chmod +x` and doesn't bundle |
| execa | child_process | execa has better cross-platform support, promise API, and output streaming |
| Bundled templates | Git clone at runtime | Runtime git clone requires network + auth; bundled files work offline and ship deterministically |

**Installation (packages/create-app/):**
```bash
npm install --save-dev tsup typescript
npm install @clack/prompts execa
```

**Version verification:**
```
@clack/prompts: 1.2.0 (verified 2026-04-06)
tsup: 8.5.1 (verified 2026-04-06)
execa: 9.6.1 (verified 2026-04-06)
@nestjs/microservices: 11.1.18 (verified 2026-04-06)
kafkajs: 2.2.4 (verified 2026-04-06)
```

---

## Architecture Patterns

### Recommended Project Structure

```
packages/create-app/
├── src/
│   ├── cli.ts              # Entry point — shebang, prompt flow, orchestration
│   ├── scaffold.ts         # Copy templates, apply replacements, write files
│   ├── replacements.ts     # Placeholder definitions and substitution logic
│   └── kafka-module.ts     # Kafka boilerplate generator (written, not copied)
├── templates/
│   ├── postgres/           # Full template snapshot for PostgreSQL path
│   │   └── src/
│   │       └── infrastructure/database/  # prisma.module.ts, prisma.service.ts
│   └── mongo/              # Full template snapshot for MongoDB path
│       └── src/
│           └── infrastructure/database/  # mongodb.module.ts + mongoose deps
├── package.json            # name: @team/create-app, bin, publishConfig
├── tsup.config.ts
└── tsconfig.json
```

### Root monorepo changes
```
nestjs-backend-template/    (existing root)
├── package.json            # Add "workspaces": ["packages/*"]
├── packages/
│   └── create-app/         # New CLI package
└── src/                    # Existing template source (unchanged)
```

### Pattern 1: CLI Entry Point with Shebang

**What:** `src/cli.ts` starts with `#!/usr/bin/env node`. tsup detects the shebang and automatically `chmod +x`'s the output.

**When to use:** Required for all npm `bin` executables.

```typescript
// Source: [CITED: https://tsup.egoist.dev/] + [CITED: https://docs.npmjs.com/cli/v8/using-npm/workspaces/]
#!/usr/bin/env node
import { intro, outro, text, select, multiselect, spinner, isCancel, cancel } from '@clack/prompts';

async function main() {
  intro('create-app — NestJS DDD scaffolder');

  const serviceName = await text({
    message: 'Service name (kebab-case)',
    placeholder: 'my-service',
    validate: (v) => (!v ? 'Required' : undefined),
  });
  if (isCancel(serviceName)) { cancel('Cancelled'); process.exit(0); }

  const db = await select({
    message: 'Database',
    options: [
      { value: 'postgres', label: 'PostgreSQL', hint: 'default' },
      { value: 'mongo',    label: 'MongoDB' },
    ],
  });
  if (isCancel(db)) { cancel('Cancelled'); process.exit(0); }

  const modules = await multiselect({
    message: 'Optional modules (space to toggle)',
    options: [
      { value: 'redis', label: 'Redis' },
      { value: 'otel',  label: 'OpenTelemetry' },
      { value: 'kafka', label: 'Kafka' },
    ],
    required: false,
  });
  if (isCancel(modules)) { cancel('Cancelled'); process.exit(0); }

  const s = spinner();
  s.start('Scaffolding...');
  await scaffold({ serviceName, db, modules });
  s.stop('Done!');

  outro(`cd ${serviceName} && npm install && npm run start:dev`);
}

main().catch(console.error);
```

### Pattern 2: tsup Configuration

**What:** Zero-config bundler; compiles `src/cli.ts` → `dist/cli.js`, handles shebang, outputs CJS (required since template uses commonjs).

```typescript
// tsup.config.ts
// Source: [CITED: https://tsup.egoist.dev/]
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['cjs'],   // commonjs — consistent with template (reflect-metadata requirement)
  clean: true,
  outDir: 'dist',
  // no dts needed for CLI binary
});
```

### Pattern 3: package.json bin + publishConfig

```json
{
  "name": "@team/create-app",
  "version": "0.0.1",
  "private": false,
  "bin": {
    "create-app": "./dist/cli.js"
  },
  "files": ["dist", "templates"],
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "scripts": {
    "build": "tsup",
    "prepublishOnly": "npm run build"
  }
}
```

### Pattern 4: Placeholder Substitution

**What:** Recursive `fs.cp` (Node 16.7+) copies template tree, then a string walk replaces placeholders in file contents and file names.

```typescript
// Source: [ASSUMED] — standard Node.js fs pattern
import { cp, readFile, writeFile, rename } from 'fs/promises';
import { join } from 'path';

const REPLACEMENTS = [
  { from: 'nestjs-backend-template', to: serviceName },           // kebab-case
  { from: 'NestjsBackendTemplate',   to: toPascalCase(serviceName) }, // PascalCase
];

async function applyReplacements(filePath: string) {
  let content = await readFile(filePath, 'utf-8');
  for (const { from, to } of REPLACEMENTS) {
    content = content.replaceAll(from, to);
  }
  await writeFile(filePath, content);
}
```

### Pattern 5: Kafka NestJS Boilerplate (Claude-designed)

**What:** Minimal `KafkaModule` the CLI injects when user selects Kafka. Uses hybrid app pattern (HTTP + Kafka microservice on same app).

```typescript
// Source: [CITED: https://docs.nestjs.com/microservices/kafka]
// kafka/kafka.module.ts — generated by CLI
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaController } from './kafka.controller';

@Module({
  imports: [
    ClientsModule.register([{
      name: 'KAFKA_SERVICE',
      transport: Transport.KAFKA,
      options: {
        client: { brokers: [process.env.KAFKA_BROKER || 'localhost:9092'] },
        consumer: { groupId: 'nestjs-consumer-group' },
      },
    }]),
  ],
  controllers: [KafkaController],
})
export class KafkaModule {}

// kafka/kafka.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class KafkaController {
  @MessagePattern('example-topic')
  handleMessage(@Payload() message: unknown) {
    // Handle incoming Kafka message
    return message;
  }
}
```

### Anti-Patterns to Avoid

- **Git clone at runtime:** Never `git clone` the template during `npx` run — requires network, auth, and branch management. Bundle templates as files inside the package.
- **ESM format for CLI bundle:** Template uses `commonjs` for `reflect-metadata`. The CLI bundle must also be `cjs` to avoid interop issues.
- **Skipping `isCancel` checks:** Every `@clack/prompts` call can return a cancel symbol. Not checking causes a crash when user presses Ctrl+C.
- **Mutating template source in-place:** Always copy to destination first, then apply replacements — never modify the bundled template originals.
- **File-name replacements forgotten:** Placeholder appears in directory names and file names (e.g., `nestjs-backend-template.module.ts`) — must rename files, not just file contents.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive prompts | Custom readline wrapper | @clack/prompts | Handles TTY detection, cancel signals, styling, arrow-key navigation |
| TypeScript compilation + bundling | Custom webpack/tsc pipeline | tsup | Zero-config, handles shebang chmod, tree-shaking, single-file output |
| Child process execution | raw `child_process.exec` | execa | Cross-platform PATH, promise API, output piping, error details |
| Recursive directory copy | Custom recursive fs walk | `fs.cp(src, dst, {recursive: true})` | Built into Node 16.7+ — no dependency needed |

**Key insight:** The hard parts of CLI development (TTY handling, Ctrl+C, cross-platform shell) are already solved. Use the libraries.

---

## MongoDB vs PostgreSQL Scaffold Diff

Based on `git diff main mongo-compatible --name-only`, the files that differ (and must be managed by the CLI) are:

| File | Postgres path | MongoDB path |
|------|--------------|-------------|
| `src/infrastructure/database/` | `prisma.module.ts`, `prisma.service.ts`, `inject-prisma.decorator.ts` | `mongodb.module.ts` (replaces all three) |
| `src/infrastructure/health/` | `prisma.health-indicator.ts` | Remove or replace with MongoDB health check |
| `src/modules/example/infrastructure/persistence/` | `prisma-item.repository.ts` | `mongoose-item.repository.ts` |
| `src/modules/example/infrastructure/persistence/schemas/` | Not present | `item.schema.ts` (Mongoose schema) |
| `src/modules/example/example.module.ts` | Imports PrismaModule | Imports MongoModule |
| `src/app.module.ts` | Imports DatabaseModule (Prisma) | Imports MongoModule |
| `package.json` | `@prisma/client`, `prisma` | `mongoose`, `@nestjs/mongoose` |
| `prisma/` directory | Entire prisma schema | Not present |
| `.env.example` | `DATABASE_URL=postgresql://...` | `MONGODB_URI=mongodb://...` |
| `docker-compose.yml` | PostgreSQL service | MongoDB service |

**Copy strategy:** Ship two complete template snapshots in `packages/create-app/templates/{postgres,mongo}/`. The CLI copies the appropriate one based on DB selection. This avoids complex conditional file-deletion logic at runtime.

---

## Monorepo Setup

**Current state:** Root `package.json` has `"private": true` and no `workspaces` field. Template is standalone.

**Required change:** Add `"workspaces": ["packages/*"]` to root `package.json`.

**Impact:** `npm install` at repo root will hoist shared deps and symlink `packages/create-app` into `node_modules/@team/create-app`. The template's own `src/` is unaffected.

**Note:** Root uses `npm` (not `pnpm`). The `package-lock.json` exists at root. No `pnpm-workspace.yaml`. [VERIFIED: inspected package.json — no workspaces, no packageManager field]

---

## GitHub Packages Publishing

### .npmrc (in packages/create-app/ or repo root)
```
@team:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

### GitHub Actions publish workflow
```yaml
# .github/workflows/publish-cli.yml
name: Publish CLI
on:
  push:
    tags: ['create-app@*']
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@team'
      - run: npm ci --workspace=packages/create-app
      - run: npm run build --workspace=packages/create-app
      - run: npm publish --workspace=packages/create-app
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

[CITED: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry]

---

## Common Pitfalls

### Pitfall 1: Missing `isCancel` check after every prompt
**What goes wrong:** User presses Ctrl+C — `@clack/prompts` returns a cancel symbol instead of a value. Using it as a string causes cryptic crashes.
**Why it happens:** The library uses a Symbol sentinel, not an exception, to signal cancellation.
**How to avoid:** Call `isCancel(value)` after every prompt call. If true, call `cancel()` and `process.exit(0)`.
**Warning signs:** `TypeError: Cannot read properties of Symbol` at runtime.

### Pitfall 2: Template files included in npm publish accidentally
**What goes wrong:** `node_modules/`, `.env`, git history, or build artifacts published to registry, bloating package size.
**Why it happens:** Default `npm publish` includes everything not in `.npmignore` / `files` exclusions.
**How to avoid:** Use `"files": ["dist", "templates"]` in `package.json`. Verify with `npm pack --dry-run`.

### Pitfall 3: ESM/CJS mismatch in CLI bundle
**What goes wrong:** CLI fails on startup with `ERR_REQUIRE_ESM` or decorator metadata errors.
**Why it happens:** Template uses `commonjs` (required for `reflect-metadata`). If tsup outputs ESM, the generated project's imports break.
**How to avoid:** Set `format: ['cjs']` in tsup config. Never use `"type": "module"` in the CLI package.

### Pitfall 4: File-name placeholders not replaced
**What goes wrong:** Generated project has files named `nestjs-backend-template.service.ts`.
**Why it happens:** Replacement logic only processes file contents, not file and directory names.
**How to avoid:** After copying, walk the directory tree and rename any file/directory whose name contains a placeholder string.

### Pitfall 5: Kafka optional module breaks non-Kafka builds
**What goes wrong:** `@nestjs/microservices` and `kafkajs` end up in every generated project even when Kafka was not selected.
**Why it happens:** Kafka deps added unconditionally to `package.json` template.
**How to avoid:** The scaffold step conditionally adds Kafka deps to the generated `package.json` only when Kafka was selected. Kafka module files are added as a code-generation step, not from a template directory.

### Pitfall 6: `npx` caching stale version
**What goes wrong:** Team members run `npx @team/create-app` and get an old version.
**Why it happens:** npx caches packages by default.
**How to avoid:** Document that `npx @team/create-app@latest` is the safe invocation. Bump version on every publish.

---

## Code Examples

### @clack/prompts — cancel guard pattern
```typescript
// Source: [CITED: https://github.com/bombshell-dev/clack/blob/main/packages/prompts/README.md]
import { isCancel, cancel } from '@clack/prompts';

function guardCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }
  return value as T;
}

// Usage:
const name = guardCancel(await text({ message: 'Service name' }));
```

### Recursive copy + replace
```typescript
// Source: [ASSUMED] — Node.js 18+ fs/promises pattern
import { cp, readdir, readFile, writeFile, rename, stat } from 'fs/promises';
import { join, basename, dirname } from 'path';

async function scaffoldProject(templateDir: string, destDir: string, replacements: [string, string][]) {
  await cp(templateDir, destDir, { recursive: true });
  await walkAndReplace(destDir, replacements);
}

async function walkAndReplace(dir: string, replacements: [string, string][]) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    // Rename file/dir if name contains placeholder
    let newPath = fullPath;
    for (const [from, to] of replacements) {
      newPath = newPath.replaceAll(from, to);
    }
    if (newPath !== fullPath) await rename(fullPath, newPath);
    const actualPath = newPath;

    if (entry.isDirectory()) {
      await walkAndReplace(actualPath, replacements);
    } else {
      let content = await readFile(actualPath, 'utf-8').catch(() => null);
      if (content !== null) {
        for (const [from, to] of replacements) content = content.replaceAll(from, to);
        await writeFile(actualPath, content);
      }
    }
  }
}
```

### Conditional package.json modification
```typescript
// Source: [ASSUMED] — standard JSON manipulation pattern
async function patchPackageJson(destDir: string, opts: ScaffoldOptions) {
  const pkgPath = join(destDir, 'package.json');
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));

  if (opts.db === 'mongo') {
    // Remove Prisma, add Mongoose
    delete pkg.dependencies['@prisma/client'];
    delete pkg.devDependencies['prisma'];
    pkg.dependencies['mongoose'] = '^8.0.0';
    pkg.dependencies['@nestjs/mongoose'] = '^11.0.0';
  }

  if (opts.modules.includes('kafka')) {
    pkg.dependencies['@nestjs/microservices'] = '^11.1.18';
    pkg.dependencies['kafkajs'] = '^2.2.4';
  }

  if (!opts.modules.includes('redis')) {
    delete pkg.dependencies['ioredis'];
    delete pkg.dependencies['@nestjs-modules/ioredis'];
  }

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2));
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| inquirer.js for prompts | @clack/prompts | 2023 | Better UX, built-in spinner, no config |
| rollup for CLI bundles | tsup (esbuild-based) | 2022 | 10-100x faster build, zero config |
| Manual `fs.mkdir` recursion | `fs.cp` with `{recursive: true}` | Node 16.7 (2021) | Built-in, no external dep needed |
| Template engines (EJS) | String replace on valid source files | Ongoing | Templates remain valid TypeScript, no special syntax |

**Deprecated/outdated:**
- `inquirer`: Still maintained but @clack/prompts is the modern replacement for new CLIs
- `ncp` npm package: Use `fs.cp` (built-in Node 16.7+) instead

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Two full template snapshots (postgres + mongo) bundled in `templates/` is the right copy strategy | Architecture Patterns | If templates diverge significantly, maintaining two copies becomes a sync burden — could use a single base + patch approach instead |
| A2 | `fs.cp` with `{recursive: true}` is safe for binary and non-UTF-8 files in the template | Code Examples | Binary files (images, etc.) would corrupt if read as UTF-8 — fix: skip binary files during content replacement |
| A3 | The root repo uses `npm` workspaces (not pnpm) for the `packages/` directory | Monorepo Setup | If team later standardizes on pnpm, `pnpm-workspace.yaml` would be needed instead |
| A4 | Kafka module is code-generated (not template-copied) to avoid maintaining a third template variant | Architecture Patterns | If Kafka module needs significant configuration, generated code may be too minimal |

---

## Open Questions

1. **Template snapshot sync strategy**
   - What we know: Two template paths (postgres/mongo) must be bundled in `packages/create-app/templates/`
   - What's unclear: When the main template changes (e.g., Phase 6 adds a feature), who is responsible for updating the bundled snapshots?
   - Recommendation: Add a `npm run sync-templates` script that copies `src/` into `packages/create-app/templates/postgres/` and the mongo-compatible diff into `templates/mongo/`. Run it as part of the release process.

2. **Package scope `@team` mapping to GitHub org**
   - What we know: GitHub Packages requires the package scope to match the GitHub org or user name exactly
   - What's unclear: The actual GitHub org name — `@team` is a placeholder in CONTEXT.md
   - Recommendation: Planner should flag this as a fill-in item. The `publishConfig.registry` and `.npmrc` entries must use the real org name.

3. **OTel exclusion scope**
   - What we know: OTel is opt-in via `OTEL_ENABLED=true` env flag and dynamic `require()` in `instrumentation.ts`
   - What's unclear: When user deselects OTel, does the CLI remove `instrumentation.ts` entirely, or leave it with the env flag pattern?
   - Recommendation: Remove `instrumentation.ts` and `src/instrumentation.spec.ts` entirely when OTel is deselected. The env flag approach is for runtime toggling, not install-time removal.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | CLI runtime + build | Assumed present | 18+ assumed | — |
| npm | Workspace setup, publish | Assumed present | 7+ for workspaces | — |
| git | mongo-compatible branch access for template bundling | Yes (repo is git) | — | — |

**Step 2.6: No external services required.** CLI package is pure Node.js. Template bundling is a file-copy operation from the local repo.

---

## Validation Architecture

Phase 5 is a CLI tool. Validation is primarily smoke-test driven.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (already configured at root) |
| Config file | `packages/create-app/jest.config.js` (new — Wave 0 gap) |
| Quick run command | `npm test --workspace=packages/create-app` |
| Full suite command | `npm test --workspace=packages/create-app -- --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-010 | `npx @team/create-app my-service` completes without errors | Smoke (integration) | `node dist/cli.js test-service` in temp dir | Wave 0 |
| REQ-010 | Generated project has no hardcoded "nestjs-backend-template" strings | Unit | `grep -r 'nestjs-backend-template' ./output` assertion in test | Wave 0 |
| REQ-010 | Placeholder replacement produces valid `package.json` | Unit | Parse JSON, assert name matches input | Wave 0 |
| REQ-010 | MongoDB path removes Prisma deps, adds Mongoose | Unit | Assert generated `package.json` dep keys | Wave 0 |
| REQ-010 | Kafka toggle adds `@nestjs/microservices` dep | Unit | Assert generated `package.json` dep keys | Wave 0 |

### Wave 0 Gaps
- [ ] `packages/create-app/jest.config.js` — test config for CLI package
- [ ] `packages/create-app/src/__tests__/scaffold.test.ts` — unit tests for replacement and copy logic
- [ ] `packages/create-app/src/__tests__/cli.smoke.ts` — end-to-end smoke run in temp dir

---

## Security Domain

CLI is a local developer tool (not a server). Attack surface is minimal.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | CLI runs locally, no auth layer |
| V3 Session Management | No | Stateless CLI |
| V4 Access Control | No | Local file system operations only |
| V5 Input Validation | Yes | Validate service name: kebab-case only, no path traversal chars |
| V6 Cryptography | No | No crypto operations |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal in service name | Tampering | Validate service name: allow `[a-z0-9-]` only, reject `..`, `/`, `\` |
| Token leakage in published package | Information Disclosure | Verify `.npmrc` with auth token is in `.gitignore` and `.npmignore` |

---

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view`) — verified versions of @clack/prompts 1.2.0, tsup 8.5.1, execa 9.6.1, @nestjs/microservices 11.1.18, kafkajs 2.2.4
- `git diff main mongo-compatible --name-only` — verified exact files that differ between Postgres and MongoDB paths
- `package.json` inspection — confirmed no workspaces field, no packageManager field

### Secondary (MEDIUM confidence)
- [GitHub Packages official docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) — publishConfig, .npmrc, GitHub Actions workflow
- [NestJS Kafka docs](https://docs.nestjs.com/microservices/kafka) — Transport.KAFKA, ClientsModule, @MessagePattern
- [tsup docs](https://tsup.egoist.dev/) — shebang handling, CJS format, defineConfig
- [@clack/prompts README](https://github.com/bombshell-dev/clack/blob/main/packages/prompts/README.md) — select, multiselect, text, spinner, isCancel API
- [npm workspaces docs](https://docs.npmjs.com/cli/v8/using-npm/workspaces/) — workspaces field, npm init -w

### Tertiary (LOW confidence)
- None — all critical claims verified via registry or official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry
- Architecture: HIGH — template diff verified against actual git branches; monorepo setup verified against actual package.json
- Pitfalls: MEDIUM — derived from known CLI development patterns and @clack/prompts cancel behavior (documented in README)

**Research date:** 2026-04-06
**Valid until:** 2026-07-06 (stable ecosystem — @clack/prompts, tsup, GitHub Packages publishing patterns are stable)
