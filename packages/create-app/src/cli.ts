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
} from '@clack/prompts';
import { join } from 'path';
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

async function main(): Promise<void> {
  intro('create-app -- NestJS DDD scaffolder');

  const config = {
    serviceName: '',
    db: 'postgres' as 'postgres' | 'mongo',
    modules: [] as string[],
  };

  // 0. Parse positional argument if present
  const argName = process.argv[2];
  if (argName && !validateServiceName(argName)) {
    config.serviceName = argName;
  }

  let step = config.serviceName ? 1 : 0;
  const totalSteps = 4;

  while (step < totalSteps) {
    switch (step) {
      case 0: {
        // Step 0: Service Name
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
        // Step 1: Database selection
        const res = guardCancel(
          await select<'postgres' | 'mongo' | '_back'>({
            message: 'Select database',
            options: [
              { value: 'postgres', label: 'PostgreSQL', hint: 'default' },
              { value: 'mongo', label: 'MongoDB' },
              { value: '_back', label: 'Go Back', hint: 'return to service name' },
            ],
          }),
        );

        if (res === '_back') {
          step--;
        } else {
          config.db = res;
          step++;
        }
        break;
      }

      case 2: {
        // Step 2: Optional module toggles
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
        // Step 3: Confirm summary
        const selectedModules = config.modules.length > 0
          ? config.modules.join(', ')
          : 'none';

        note(
          `Service name : ${config.serviceName}\n` +
          `Database     : ${config.db}\n` +
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
          step++;
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
      modules: config.modules,
      destDir,
    });
    s.stop('Project scaffolded!');
  } catch (err) {
    s.stop('Scaffolding failed.');
    throw err;
  }

  // Next steps
  outro(
    `Next steps:\n\n  cd ${config.serviceName}\n  npm install\n  cp .env.example .env\n  npm run start:dev\n`,
  );
}

main().catch((err) => {
  cancel(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
