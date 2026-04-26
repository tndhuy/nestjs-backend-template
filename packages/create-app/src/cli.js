#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = require("@clack/prompts");
const path_1 = require("path");
const scaffold_1 = require("./scaffold");
const replacements_1 = require("./replacements");
function guardCancel(value) {
    if ((0, prompts_1.isCancel)(value)) {
        (0, prompts_1.cancel)('Operation cancelled.');
        process.exit(0);
    }
    return value;
}
async function main() {
    (0, prompts_1.intro)('create-app -- NestJS DDD scaffolder');
    const serviceName = guardCancel(await (0, prompts_1.text)({
        message: 'Service name (kebab-case)',
        placeholder: 'my-service',
        validate: (v) => (0, replacements_1.validateServiceName)(v),
    }));
    const db = guardCancel(await (0, prompts_1.select)({
        message: 'Select database',
        options: [
            { value: 'postgres', label: 'PostgreSQL', hint: 'default' },
            { value: 'mongo', label: 'MongoDB' },
        ],
    }));
    const modules = guardCancel(await (0, prompts_1.multiselect)({
        message: 'Optional modules (space to toggle, enter to confirm)',
        options: [
            { value: 'redis', label: 'Redis', hint: 'caching + circuit breaker' },
            { value: 'otel', label: 'OpenTelemetry', hint: 'traces + metrics' },
            { value: 'kafka', label: 'Kafka', hint: 'message broker boilerplate' },
        ],
        required: false,
    }));
    const selectedModules = modules.length > 0
        ? modules.join(', ')
        : 'none';
    console.log('');
    console.log(`  Service name : ${serviceName}`);
    console.log(`  Database     : ${db}`);
    console.log(`  Modules      : ${selectedModules}`);
    console.log('');
    const proceed = guardCancel(await (0, prompts_1.confirm)({
        message: 'Scaffold project with these settings?',
        initialValue: true,
    }));
    if (!proceed) {
        (0, prompts_1.cancel)('Scaffolding cancelled.');
        process.exit(0);
    }
    const destDir = (0, path_1.join)(process.cwd(), serviceName);
    const s = (0, prompts_1.spinner)();
    s.start('Scaffolding project...');
    try {
        await (0, scaffold_1.scaffold)({
            serviceName: serviceName,
            db: db,
            modules: modules,
            destDir,
        });
        s.stop('Project scaffolded!');
    }
    catch (err) {
        s.stop('Scaffolding failed.');
        throw err;
    }
    (0, prompts_1.outro)(`Next steps:\n\n  cd ${serviceName}\n  npm install\n  cp .env.example .env\n  npm run start:dev\n`);
}
main().catch((err) => {
    (0, prompts_1.cancel)(err instanceof Error ? err.message : String(err));
    process.exit(1);
});
//# sourceMappingURL=cli.js.map