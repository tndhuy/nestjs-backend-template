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
  confirm,
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

  // 1. Collect service name
  const serviceName = guardCancel(
    await text({
      message: 'Service name (kebab-case)',
      placeholder: 'my-service',
      validate: (v) => validateServiceName(v),
    }),
  );

  // 2. Database selection
  const db = guardCancel(
    await select<'postgres' | 'mongo'>({
      message: 'Select database',
      options: [
        { value: 'postgres', label: 'PostgreSQL', hint: 'default' },
        { value: 'mongo', label: 'MongoDB' },
      ],
    }),
  );

  // 3. Optional module toggles
  const modules = guardCancel(
    await multiselect<string>({
      message: 'Optional modules (space to toggle, enter to confirm)',
      options: [
        { value: 'redis', label: 'Redis', hint: 'caching + circuit breaker' },
        { value: 'otel', label: 'OpenTelemetry', hint: 'traces + metrics' },
        { value: 'kafka', label: 'Kafka', hint: 'message broker boilerplate' },
      ],
      required: false,
    }),
  );

  // 4. Confirm summary before scaffolding
  const selectedModules = (modules as string[]).length > 0
    ? (modules as string[]).join(', ')
    : 'none';

  console.log('');
  console.log(`  Service name : ${serviceName}`);
  console.log(`  Database     : ${db}`);
  console.log(`  Modules      : ${selectedModules}`);
  console.log('');

  const proceed = guardCancel(
    await confirm({
      message: 'Scaffold project with these settings?',
      initialValue: true,
    }),
  );

  if (!proceed) {
    cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  // 5. Run scaffold
  const destDir = join(process.cwd(), serviceName as string);
  const s = spinner();
  s.start('Scaffolding project...');

  try {
    await scaffold({
      serviceName: serviceName as string,
      db: db as 'postgres' | 'mongo',
      modules: modules as string[],
      destDir,
    });
    s.stop('Project scaffolded!');
  } catch (err) {
    s.stop('Scaffolding failed.');
    throw err;
  }

  // 6. Next steps
  outro(
    `Next steps:\n\n  cd ${serviceName}\n  npm install\n  cp .env.example .env\n  npm run start:dev\n`,
  );
}

main().catch((err) => {
  cancel(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
