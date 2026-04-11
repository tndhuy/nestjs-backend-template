import { cp, readdir, readFile, writeFile, rename, rm, stat } from 'fs/promises';
import { join, basename, dirname, resolve, sep } from 'path';
import { buildReplacements } from './replacements';
import { generateKafkaModule } from './kafka-module';

export interface ScaffoldOptions {
  serviceName: string;
  db: 'postgres' | 'mongo';
  orm?: 'mongoose' | 'prisma';
  modules: string[]; // 'redis' | 'otel' | 'kafka'
  destDir: string;
  dryRun?: boolean;
}

/**
 * Check if a file is binary by reading the first 512 bytes and looking for null bytes.
 * Binary files should not have their contents replaced with string substitution.
 */
async function isBinaryFile(filePath: string): Promise<boolean> {
  try {
    const buffer = Buffer.alloc(512);
    const handle = await import('fs/promises').then((m) => m.open(filePath, 'r'));
    try {
      const { bytesRead } = await handle.read(buffer, 0, 512, 0);
      await handle.close();
      // Check for null bytes in the first 512 bytes
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

/**
 * Collect all file and directory paths recursively under a directory.
 * Returns them sorted deepest-first so we can safely rename without
 * invalidating parent paths.
 */
async function collectPaths(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectPaths(fullPath);
      results.push(...nested);
    }
    results.push(fullPath);
  }
  return results;
}

/**
 * Replace file contents for all text files under destDir.
 */
async function replaceFileContents(
  dir: string,
  replacements: [string, string][],
  options: ScaffoldOptions,
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await replaceFileContents(fullPath, replacements, options);
    } else {
      const binary = await isBinaryFile(fullPath);
      if (binary) continue;
      try {
        let content = await readFile(fullPath, 'utf-8');
        let modified = false;

        // 1. Handle conditional blocks
        const isPrisma = options.orm === 'prisma';
        const isMongoose = options.orm === 'mongoose';
        const hasRedis = options.modules.includes('redis');
        const hasOtel = options.modules.includes('otel');
        const hasKafka = options.modules.includes('kafka');
        const isPostgres = options.db === 'postgres';
        const isMongo = options.db === 'mongo';

        const checkBlock = (content: string, flag: boolean, tag: string): string => {
          const startTag = `{{#IF_${tag}}}`;
          const endTag = `{{/IF_${tag}}}`;
          const startNotTag = `{{#IF_NOT_${tag}}}`;
          const endNotTag = `{{/IF_NOT_${tag}}}`;

          if (content.includes(startTag)) {
            if (flag) {
              content = content.replaceAll(startTag, '').replaceAll(endTag, '');
            } else {
              const escapedStart = startTag.replace(/\{/g, '\\{').replace(/\}/g, '\\}');
              const escapedEnd = endTag.replace(/\{/g, '\\{').replace(/\}/g, '\\}');
              const regex = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, 'g');
              content = content.replace(regex, '');
            }
          }

          if (content.includes(startNotTag)) {
            if (!flag) {
              content = content.replaceAll(startNotTag, '').replaceAll(endNotTag, '');
            } else {
              const escapedStart = startNotTag.replace(/\{/g, '\\{').replace(/\}/g, '\\}');
              const escapedEnd = endNotTag.replace(/\{/g, '\\{').replace(/\}/g, '\\}');
              const regex = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, 'g');
              content = content.replace(regex, '');
            }
          }

          return content;
        };

        content = checkBlock(content, isPrisma, 'PRISMA');
        content = checkBlock(content, isMongoose, 'MONGOOSE');
        content = checkBlock(content, hasRedis, 'REDIS');
        content = checkBlock(content, hasOtel, 'OTEL');
        content = checkBlock(content, hasKafka, 'KAFKA');
        content = checkBlock(content, isPostgres, 'POSTGRES');
        content = checkBlock(content, isMongo, 'MONGO');

        modified = content !== await readFile(fullPath, 'utf-8');

        // 2. Handle standard string replacements
        for (const [from, to] of replacements) {
          if (content.includes(from)) {
            content = content.replaceAll(from, to);
            modified = true;
          }
        }

        if (modified) {
          await writeFile(fullPath, content, 'utf-8');
        }
      } catch {
        // Skip files that can't be read as UTF-8 text
      }
    }
  }
}

/**
 * Rename files and directories whose names contain placeholder strings.
 * Processes deepest paths first to avoid renaming a parent before its children.
 */
async function renamePathsWithPlaceholders(
  dir: string,
  replacements: [string, string][],
): Promise<void> {
  const allPaths = await collectPaths(dir);

  // Sort deepest paths first (by number of path separators)
  allPaths.sort((a, b) => {
    const depthA = a.split(sep).length;
    const depthB = b.split(sep).length;
    return depthB - depthA;
  });

  for (const oldPath of allPaths) {
    const parent = dirname(oldPath);
    let newName = basename(oldPath);
    let changed = false;

    for (const [from, to] of replacements) {
      if (newName.includes(from)) {
        newName = newName.replaceAll(from, to);
        changed = true;
      }
    }

    if (changed) {
      const newPath = join(parent, newName);
      try {
        await rename(oldPath, newPath);
      } catch {
        // Path may have been moved already due to parent rename — skip
      }
    }
  }
}

/**
 * Patch the generated package.json with the correct service name and
 * conditionally swap dependencies based on database selection and module toggles.
 */
async function patchPackageJson(
  destDir: string,
  options: ScaffoldOptions,
): Promise<void> {
  const pkgPath = join(destDir, 'package.json');
  try {
    const raw = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);

    // Set the service name (replacements.ts handles the template string already,
    // but package.json may still have the original if the name field wasn't replaced)
    pkg.name = options.serviceName;

    // Remove workspaces if it exists (it's only for the template monorepo)
    delete pkg.workspaces;

    const PRISMA_LATEST = '^7.5.0';
    const PRISMA_MONGO_COMPAT = '^6.0.0';

    if (options.orm === 'prisma') {
      if (!pkg.scripts) pkg.scripts = {};
      pkg.scripts['db:generate'] = 'prisma generate';
      pkg.scripts['db:push'] = 'prisma db push';
      pkg.scripts['db:pull'] = 'prisma db pull';
      pkg.scripts['db:studio'] = 'prisma studio';
      pkg.scripts['db:format'] = 'prisma format';
      if (options.db === 'postgres') {
        pkg.scripts['db:migrate:dev'] = 'prisma migrate dev';
        pkg.scripts['db:migrate:deploy'] = 'prisma migrate deploy';
      }
    }

    if (options.db === 'mongo') {
      if (options.orm === 'prisma') {
        // Use Prisma with MongoDB (Force v6 for compatibility)
        if (pkg.dependencies) {
          delete pkg.dependencies['@prisma/adapter-pg'];
          delete pkg.dependencies['pg'];
          delete pkg.dependencies['@types/pg'];
          pkg.dependencies['@prisma/client'] = PRISMA_MONGO_COMPAT;
        }
        if (pkg.devDependencies) {
          pkg.devDependencies['prisma'] = PRISMA_MONGO_COMPAT;
        }
      } else {
        // Use Mongoose (default for mongo)
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
    } else {
      // PostgreSQL: Use latest Prisma
      if (pkg.dependencies) {
        pkg.dependencies['@prisma/client'] = PRISMA_LATEST;
        pkg.dependencies['@prisma/adapter-pg'] = PRISMA_LATEST;
      }
      if (pkg.devDependencies) {
        pkg.devDependencies['prisma'] = PRISMA_LATEST;
      }
    }

    if (options.modules.includes('kafka')) {
      if (!pkg.dependencies) pkg.dependencies = {};
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
        // Remove all @opentelemetry/* packages
        for (const dep of Object.keys(pkg.dependencies)) {
          if (dep.startsWith('@opentelemetry/')) {
            delete pkg.dependencies[dep];
          }
        }
      }
    }

    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  } catch (err) {
    // If package.json doesn't exist or is malformed, skip patching
    console.warn('Warning: Could not patch package.json:', err);
  }
}

/**
 * Safely check if a path exists.
 */
async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely delete a file if it exists. No-op if file is missing.
 * Path must be under destDir (security guard against path traversal).
 */
async function safeDeleteFile(destDir: string, filePath: string): Promise<void> {
  const resolved = resolve(filePath);
  const resolvedDestDir = resolve(destDir);
  // Ensure the destination directory ends with a separator for the prefix check
  const prefix = resolvedDestDir.endsWith(sep) ? resolvedDestDir : resolvedDestDir + sep;
  
  if (!resolved.startsWith(prefix) && resolved !== resolvedDestDir) {
    throw new Error(`Security: path '${filePath}' is outside destDir '${destDir}'`);
  }
  try {
    await rm(resolved, { force: true });
  } catch {
    // File doesn't exist — no-op
  }
}

/**
 * Safely delete a directory if it exists. No-op if directory is missing.
 * Path must be under destDir (security guard against path traversal).
 */
async function safeDeleteDir(destDir: string, dirPath: string): Promise<void> {
  const resolved = resolve(dirPath);
  const resolvedDestDir = resolve(destDir);
  // Ensure the destination directory ends with a separator for the prefix check
  const prefix = resolvedDestDir.endsWith(sep) ? resolvedDestDir : resolvedDestDir + sep;

  if (!resolved.startsWith(prefix) && resolved !== resolvedDestDir) {
    throw new Error(`Security: path '${dirPath}' is outside destDir '${destDir}'`);
  }
  try {
    await rm(resolved, { recursive: true, force: true });
  } catch {
    // Directory doesn't exist — no-op
  }
}

/**
 * Remove lines matching a pattern from a file. No-op if file doesn't exist.
 */
async function removeMatchingLines(
  filePath: string,
  patterns: RegExp[],
): Promise<void> {
  if (!(await pathExists(filePath))) return;
  try {
    const content = await readFile(filePath, 'utf-8');
    let updated = content;
    for (const pattern of patterns) {
      updated = updated.replace(pattern, '');
    }
    // Clean up double blank lines left by removals
    updated = updated.replace(/\n{3,}/g, '\n\n');
    if (updated !== content) {
      await writeFile(filePath, updated, 'utf-8');
    }
  } catch {
    // Skip files that cannot be processed
  }
}

/**
 * Remove Redis module from the scaffolded project.
 *
 * - Deletes src/infrastructure/cache/ directory
 * - Removes ioredis and @nestjs-modules/ioredis from package.json
 * - Removes CacheModule import and usage from app.module.ts
 * - Removes REDIS_URL / REDIS_HOST / REDIS_PORT from .env.example
 */
export async function removeRedis(destDir: string): Promise<void> {
  // 1. Delete cache infrastructure directory
  await safeDeleteDir(destDir, join(destDir, 'src', 'infrastructure', 'cache'));

  // 2. Remove Redis deps from package.json (also handled in patchPackageJson, but do it
  //    here too so removeRedis is independently correct when called standalone)
  const pkgPath = join(destDir, 'package.json');
  if (await pathExists(pkgPath)) {
    try {
      const raw = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(raw);
      if (pkg.dependencies) {
        delete pkg.dependencies['ioredis'];
        delete pkg.dependencies['@nestjs-modules/ioredis'];
      }
      await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    } catch {
      // Skip if package.json is malformed
    }
  }

  // 3. Remove CacheModule from app.module.ts
  const appModulePath = join(destDir, 'src', 'app.module.ts');
  await removeMatchingLines(appModulePath, [
    // Remove the import statement for CacheModule (from cache/redis.module)
    /^import\s*\{[^}]*CacheModule[^}]*\}\s*from\s*['"][^'"]*cache[^'"]*['"];\n?/m,
    // Remove CacheModule entry from the imports array (with optional trailing comma)
    /^\s*CacheModule,?\n/m,
  ]);

  // 4. Remove Redis env vars from .env.example
  const envExamplePath = join(destDir, '.env.example');
  await removeMatchingLines(envExamplePath, [
    // Remove REDIS_URL line
    /^REDIS_URL=.*\n?/m,
    // Remove REDIS_HOST line
    /^REDIS_HOST=.*\n?/m,
    // Remove REDIS_PORT line
    /^REDIS_PORT=.*\n?/m,
    // Remove # Redis section header if it becomes orphaned
    /^# Redis\n(?=\n)/m,
  ]);
}

/**
 * Remove OpenTelemetry from the scaffolded project.
 *
 * - Deletes src/instrumentation.ts and src/instrumentation.spec.ts
 * - Removes @opentelemetry/* packages from package.json
 * - Removes OTEL_* env vars from .env.example
 * - Removes the OTel import and sdk.start() call from src/main.ts
 */
export async function removeOtel(destDir: string): Promise<void> {
  // 1. Delete instrumentation files
  await safeDeleteFile(destDir, join(destDir, 'src', 'instrumentation.ts'));
  await safeDeleteFile(
    destDir,
    join(destDir, 'src', 'instrumentation.spec.ts'),
  );

  // 2. Remove OTel packages from package.json
  const pkgPath = join(destDir, 'package.json');
  if (await pathExists(pkgPath)) {
    try {
      const raw = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(raw);
      if (pkg.dependencies) {
        for (const dep of Object.keys(pkg.dependencies)) {
          if (dep.startsWith('@opentelemetry/')) {
            delete pkg.dependencies[dep];
          }
        }
      }
      await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    } catch {
      // Skip if package.json is malformed
    }
  }

  // 3. Remove OTEL env vars from .env.example
  const envExamplePath = join(destDir, '.env.example');
  await removeMatchingLines(envExamplePath, [
    /^OTEL_ENABLED=.*\n?/m,
    /^OTEL_SERVICE_NAME=.*\n?/m,
    /^OTEL_PROMETHEUS_PORT=.*\n?/m,
    /^OTEL_EXPORTER_OTLP_ENDPOINT=.*\n?/m,
    // Remove the # Observability - OpenTelemetry comment block if it becomes orphaned
    /^# Observability - OpenTelemetry[^\n]*\n(?=\n|$)/m,
  ]);

  // 4. Remove OTel import and sdk.start() from main.ts
  const mainTsPath = join(destDir, 'src', 'main.ts');
  await removeMatchingLines(mainTsPath, [
    // Remove: import otelSdk from './instrumentation';
    /^import\s+\w+\s+from\s+['"][^'"]*instrumentation['"];\n?/m,
    // Remove: otelSdk?.start(); line
    /^\s*\w+Sdk\?\.start\(\);\n?/m,
    // Remove shutdown logic: void otelSdk?.shutdown()...
    /^\s*void\s+otelSdk\?\.shutdown\(\)\.catch\(\(\)\s*=>\s*undefined\);\n?/m,
  ]);

  // 5. OTel related code in pino.config.ts and redis.service.ts is now handled via {{#IF_OTEL}} blocks
  // so no manual line removal is needed there.

  // 6. Delete prometheus.yml
  await safeDeleteFile(destDir, join(destDir, 'prometheus.yml'));
}

/**
 * Add Kafka module to the scaffolded project.
 *
 * - Generates src/kafka/ directory with KafkaModule, KafkaController, and index.ts
 * - Adds @nestjs/microservices and kafkajs to package.json
 * - Imports KafkaModule in app.module.ts
 * - Adds KAFKA_BROKER to .env.example
 */
export async function addKafka(
  destDir: string,
  serviceName: string,
): Promise<void> {
  // 1. Generate Kafka module files
  await generateKafkaModule(destDir, serviceName);

  // 2. Add Kafka deps to package.json
  const pkgPath = join(destDir, 'package.json');
  if (await pathExists(pkgPath)) {
    try {
      const raw = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(raw);
      if (!pkg.dependencies) pkg.dependencies = {};
      pkg.dependencies['@nestjs/microservices'] = '^11.1.18';
      pkg.dependencies['kafkajs'] = '^2.2.4';
      await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    } catch {
      // Skip if package.json is malformed
    }
  }

  // 3. Wire KafkaModule into app.module.ts
  const appModulePath = join(destDir, 'src', 'app.module.ts');
  if (await pathExists(appModulePath)) {
    try {
      let content = await readFile(appModulePath, 'utf-8');

      // Add KafkaModule import after the last existing import line
      const kafkaImportLine = `import { KafkaModule } from './kafka/kafka.module';\n`;
      if (!content.includes(kafkaImportLine)) {
        // Insert before the @Module decorator
        content = content.replace(
          /^(@Module\()/m,
          `${kafkaImportLine}\n$1`,
        );
      }

      // Add KafkaModule to the imports array
      // Insert after the last module reference before closing bracket of imports array
      if (!content.includes('KafkaModule,') && !content.includes('KafkaModule\n')) {
        // Find the imports array and insert KafkaModule before the closing bracket
        // Pattern: look for the last item before the closing ] of imports: [...]
        content = content.replace(
          /(imports:\s*\[[^\]]*?)(\s*\])/s,
          (match, arrayContent, closing) => {
            // Check if array has trailing comma on last entry
            const trimmed = arrayContent.trimEnd();
            const sep = trimmed.endsWith(',') ? '' : ',';
            return `${trimmed}${sep}\n    KafkaModule,${closing}`;
          },
        );
      }

      await writeFile(appModulePath, content, 'utf-8');
    } catch {
      // Skip if app.module.ts cannot be processed
    }
  }

  // 4. Add KAFKA_BROKER to .env.example
  const envExamplePath = join(destDir, '.env.example');
  if (await pathExists(envExamplePath)) {
    try {
      let content = await readFile(envExamplePath, 'utf-8');
      if (!content.includes('KAFKA_BROKER')) {
        content = content.trimEnd() + '\n\n# Kafka\nKAFKA_BROKER=localhost:9092\n';
        await writeFile(envExamplePath, content, 'utf-8');
      }
    } catch {
      // Skip if .env.example cannot be processed
    }
  }
}

/**
 * Main scaffold function.
 *
 * 1. Resolves the correct template directory (postgres or mongo)
 * 2. Copies it recursively to destDir
 * 3. Replaces placeholder strings in all text file contents
 * 4. Renames files/dirs that contain placeholder strings in their names
 * 5. Patches package.json with service name and conditional deps
 * 6. Applies module toggles: removes redis/otel if not selected, adds kafka if selected
 */
export async function scaffold(options: ScaffoldOptions): Promise<void> {
  // Use postgres template as base if ORM is Prisma, otherwise use db-specific template
  const templateName = options.orm === 'prisma' ? 'postgres' : options.db;
  const templateDir = join(__dirname, '..', 'templates', templateName);
  const { destDir, serviceName, modules, dryRun } = options;

  if (dryRun) {
    console.log(`\n  [Dry Run] Would copy template from ${templateName} to ${destDir}`);
    console.log(`  [Dry Run] Would replace placeholders for: ${serviceName}`);
    console.log(`  [Dry Run] Would apply modules: ${modules.join(', ') || 'none'}\n`);
    return;
  }

  // 1. Copy template to destination
  await cp(templateDir, destDir, { recursive: true });

  // 2. Build replacement pairs
  const replacements = buildReplacements(serviceName);

  // 3. Replace file contents
  await replaceFileContents(destDir, replacements, options);

  // 4. Rename files/dirs with placeholder names (deepest-first)
  await renamePathsWithPlaceholders(destDir, replacements);

  // 5. Patch package.json (handles db swap + module dep additions/removals)
  await patchPackageJson(destDir, options);

  // 5.1 Special handling for Prisma + MongoDB
  if (options.db === 'mongo' && options.orm === 'prisma') {
    const schemaPath = join(destDir, 'prisma', 'schema.prisma');
    if (await pathExists(schemaPath)) {
      try {
        let content = await readFile(schemaPath, 'utf-8');
        // Update provider
        content = content.replace(/provider\s*=\s*["']postgresql["']/g, 'provider = "mongodb"');
        // Update Item model for MongoDB ObjectId compatibility
        content = content.replace(
          /id\s+String\s+@id/g,
          'id String @id @default(auto()) @map("_id") @db.ObjectId'
        );
        await writeFile(schemaPath, content, 'utf-8');
      } catch (err) {
        console.warn('Warning: Could not update schema.prisma for MongoDB:', err);
      }
    }

    // Also update .env.example for MongoDB connection string format
    const envPath = join(destDir, '.env.example');
    if (await pathExists(envPath)) {
      try {
        let content = await readFile(envPath, 'utf-8');
        content = content.replace(
          /DATABASE_URL=postgresql:\/\/.*/g,
          'DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/myDatabase?retryWrites=true&w=majority"'
        );
        await writeFile(envPath, content, 'utf-8');
      } catch {}
    }
  }

  // 6. Apply module toggles
  if (!modules.includes('redis')) {
    await removeRedis(destDir);
  }

  if (!modules.includes('otel')) {
    await removeOtel(destDir);
  }

  if (modules.includes('kafka')) {
    await addKafka(destDir, serviceName);
  }

  // 7. Ensure .gitignore is present (renamed from gitignore.template)
  const templateGitignore = join(destDir, 'gitignore.template');
  if (await pathExists(templateGitignore)) {
    await rename(templateGitignore, join(destDir, '.gitignore'));
  }
}
