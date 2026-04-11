#!/usr/bin/env node

import {
  intro,
  outro,
  text,
  select,
  multiselect,
  spinner,
  isCancel,
  cancel,
  note,
  confirm,
} from '@clack/prompts';
import { join } from 'path';
import { stat, rm } from 'fs/promises';
import { execa } from 'execa';
import { scaffold } from './scaffold';
import { validateServiceName } from './replacements';

/**
 * Guard helper — checks if a prompt result is a cancellation symbol.
 * If so, prints cancellation message and exits cleanly.
 */
function guardCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }
  return value as T;
}

/**
 * Check if directory exists
 */
async function directoryExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const positionalName = args.find(a => !a.startsWith('--'));

  intro('create-app -- NestJS DDD scaffolder' + (dryRun ? ' [DRY RUN]' : ''));

  const config = {
    serviceName: '',
    db: 'postgres' as 'postgres' | 'mongo',
    orm: 'mongoose' as 'mongoose' | 'prisma',
    modules: [] as string[],
  };

  if (positionalName && !validateServiceName(positionalName)) {
    config.serviceName = positionalName;
    note(`Using service name: ${config.serviceName} (from arguments)`, 'Info');
  }

  let step = config.serviceName ? 1 : 0;
  const totalSteps = 4;

  while (step < totalSteps) {
    switch (step) {
      case 0: {
        const res = guardCancel(
          await text({
            message: 'Service name (kebab-case)',
            placeholder: 'my-service',
            validate: (v) => validateServiceName(v),
          }),
        );
        config.serviceName = res;
        step++;
        break;
      }

      case 1: {
        const res = guardCancel(
          await select<'postgres' | 'mongo' | '_back'>({
            message: 'Select database',
            options: [
              { value: 'postgres', label: 'PostgreSQL', hint: 'using Prisma' },
              { value: 'mongo', label: 'MongoDB', hint: 'choice of Mongoose or Prisma' },
              { value: '_back', label: 'Go Back', hint: 'return to service name' },
            ],
          }),
        );

        if (res === '_back') {
          step--;
        } else {
          config.db = res;
          if (res === 'mongo') {
            config.orm = guardCancel(
              await select<'mongoose' | 'prisma'>({
                message: 'Select MongoDB ORM',
                options: [
                  { value: 'mongoose', label: 'Mongoose', hint: 'default for NestJS' },
                  { value: 'prisma', label: 'Prisma', hint: 'v6 compatible mode' },
                ],
              }),
            );
          } else {
            config.orm = 'prisma'; // PostgreSQL always uses Prisma in this template
          }
          step++;
        }
        break;
      }

      case 2: {
        const res = guardCancel(
          await multiselect<string>({
            message: 'Optional modules (space to toggle, enter to confirm)',
            options: [
              { value: 'redis', label: 'Redis', hint: 'caching + circuit breaker' },
              { value: 'otel', label: 'OpenTelemetry', hint: 'traces + metrics' },
              { value: 'kafka', label: 'Kafka', hint: 'message broker boilerplate' },
              { value: '_back', label: 'Go Back', hint: 'return to database selection' },
            ],
            required: false,
          }),
        );

        if ((res as string[]).includes('_back')) {
          step--;
        } else {
          config.modules = res as string[];
          step++;
        }
        break;
      }

      case 3: {
        const selectedModules = config.modules.length > 0
          ? config.modules.join(', ')
          : 'none';

        note(
          `Service name : ${config.serviceName}\n` +
          `Database     : ${config.db}\n` +
          `ORM          : ${config.orm}\n` +
          `Modules      : ${selectedModules}`,
          'Confirm Project Summary'
        );

        const res = guardCancel(
          await select<'confirm' | 'back' | 'cancel'>({
            message: 'Scaffold project with these settings?',
            options: [
              { value: 'confirm', label: 'Yes, scaffold project' },
              { value: 'back', label: 'No, let me change something', hint: 'go back' },
              { value: 'cancel', label: 'Cancel', hint: 'exit' },
            ],
          }),
        );

        if (res === 'confirm') {
          const destDir = join(process.cwd(), config.serviceName);
          if (await directoryExists(destDir) && !dryRun) {
            const overwrite = guardCancel(
              await select<'overwrite' | 'cancel' | 'back'>({
                message: `Directory "${config.serviceName}" already exists.`,
                options: [
                  { value: 'overwrite', label: 'Overwrite', hint: 'danger: deletes existing directory' },
                  { value: 'back', label: 'Change service name', hint: 'go back to step 1' },
                  { value: 'cancel', label: 'Exit', hint: 'cancel' },
                ],
              }),
            );

            if (overwrite === 'overwrite') {
              const confirmDelete = guardCancel(await confirm({ message: 'Are you absolutely sure?', initialValue: false }));
              if (confirmDelete) {
                const s = spinner();
                s.start('Cleaning up existing directory...');
                await rm(destDir, { recursive: true, force: true });
                s.stop('Directory cleaned.');
                step++;
              }
            } else if (overwrite === 'back') {
              step = 0;
            } else {
              cancel('Operation cancelled.');
              process.exit(0);
            }
          } else {
            step++;
          }
        } else if (res === 'back') {
          step--;
        } else {
          cancel('Scaffolding cancelled.');
          process.exit(0);
        }
        break;
      }
    }
  }

  // Final Step: Run scaffold
  const destDir = join(process.cwd(), config.serviceName);
  const s = spinner();
  s.start('Scaffolding project...');

  try {
    await scaffold({
      serviceName: config.serviceName,
      db: config.db,
      orm: config.orm,
      modules: config.modules,
      destDir,
      dryRun,
    });
    s.stop('Project scaffolded!');
  } catch (err) {
    s.stop('Scaffolding failed.');
    throw err;
  }

  if (!dryRun) {
    const initGit = guardCancel(await confirm({ message: 'Initialize git repository?', initialValue: true }));
    if (initGit) {
      const gs = spinner();
      gs.start('Initializing git...');
      try {
        await execa('git', ['init'], { cwd: destDir });
        await execa('git', ['add', '.'], { cwd: destDir });
        await execa('git', ['commit', '-m', 'chore: initial commit from template'], { cwd: destDir });
        gs.stop('Git initialized with initial commit.');
      } catch (err) {
        gs.stop('Git initialization failed (check if git is installed).');
      }
    }

    const installDeps = guardCancel(await confirm({ message: 'Install dependencies now?', initialValue: true }));
    if (installDeps) {
      const pkgManager = guardCancel(await select({
        message: 'Select package manager',
        options: [
          { value: 'pnpm', label: 'pnpm', hint: 'recommended' },
          { value: 'npm', label: 'npm' },
          { value: 'yarn', label: 'yarn' },
        ],
      })) as string;

      const is = spinner();
      is.start(`Installing dependencies using ${pkgManager}...`);
      try {
        await execa(pkgManager, ['install'], { cwd: destDir, stdio: 'inherit' });
        is.stop('Dependencies installed successfully.');
      } catch (err) {
        is.stop('Dependency installation failed.');
      }
    }
  }

  outro(
    `Next steps:\n\n  cd ${config.serviceName}\n${dryRun ? '' : '  npm run start:dev\n'}`
  );
}

main().catch((err) => {
  cancel(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
