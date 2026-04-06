import { cp, readdir, readFile, writeFile, rename, stat } from 'fs/promises';
import { join, basename, dirname } from 'path';
import { buildReplacements } from './replacements';

export interface ScaffoldOptions {
  serviceName: string;
  db: 'postgres' | 'mongo';
  modules: string[]; // 'redis' | 'otel' | 'kafka'
  destDir: string;
}

/**
 * Check if a file is binary by reading the first 512 bytes and looking for null bytes.
 * Binary files should not have their contents replaced with string substitution.
 */
async function isBinaryFile(filePath: string): Promise<boolean> {
  try {
    const fd = await import('fs');
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
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await replaceFileContents(fullPath, replacements);
    } else {
      const binary = await isBinaryFile(fullPath);
      if (binary) continue;
      try {
        let content = await readFile(fullPath, 'utf-8');
        let modified = false;
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
    const depthA = a.split('/').length;
    const depthB = b.split('/').length;
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

    if (options.db === 'mongo') {
      // Remove Prisma, add Mongoose
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

    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  } catch (err) {
    // If package.json doesn't exist or is malformed, skip patching
    console.warn('Warning: Could not patch package.json:', err);
  }
}

/**
 * Stub for module removal — implemented in Plan 02.
 * Removes optional module files from the scaffolded project when the user
 * did not select a given module.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function removeModule(_destDir: string, _module: string): Promise<void> {
  // TODO: Plan 02 implements removal of optional modules (redis, otel, kafka)
}

/**
 * Main scaffold function.
 *
 * 1. Resolves the correct template directory (postgres or mongo)
 * 2. Copies it recursively to destDir
 * 3. Replaces placeholder strings in all text file contents
 * 4. Renames files/dirs that contain placeholder strings in their names
 * 5. Patches package.json with service name and conditional deps
 */
export async function scaffold(options: ScaffoldOptions): Promise<void> {
  const templateDir = join(__dirname, '..', 'templates', options.db);
  const { destDir, serviceName } = options;

  // 1. Copy template to destination
  await cp(templateDir, destDir, { recursive: true });

  // 2. Build replacement pairs
  const replacements = buildReplacements(serviceName);

  // 3. Replace file contents
  await replaceFileContents(destDir, replacements);

  // 4. Rename files/dirs with placeholder names (deepest-first)
  await renamePathsWithPlaceholders(destDir, replacements);

  // 5. Patch package.json
  await patchPackageJson(destDir, options);
}
