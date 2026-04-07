---
status: complete
phase: 05-cli-package
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md]
started: 2026-04-07T00:00:00+07:00
updated: 2026-04-07T00:00:00+07:00
---

## Current Test

[testing complete]

## Tests

### 1. npm Workspace Wired
expected: root package.json contains "workspaces": ["packages/*"] and packages/create-app/package.json has name "@team/create-app" with a "bin" field pointing to dist/cli.js and a "publishConfig" pointing to npm.pkg.github.com.
result: pass

### 2. CLI Builds Successfully
expected: Running `npm run build --workspace=packages/create-app` completes without errors and produces packages/create-app/dist/cli.js on disk.
result: pass

### 3. All 35 Tests Pass
expected: Running `npm test --workspace=packages/create-app` shows 35 passing tests across scaffold.test.ts (unit) and cli.smoke.ts (integration) — "Test Suites: 2 passed, Tests: 35 passed".
result: pass

### 4. Interactive CLI Prompts Flow
expected: Running `node packages/create-app/dist/cli.js` displays: (1) intro banner, (2) text prompt for service name, (3) select for database (PostgreSQL / MongoDB), (4) multiselect for optional modules (Redis, OTel, Kafka), (5) confirm prompt, (6) spinner while scaffolding, (7) outro with next steps. Pressing Ctrl+C at any prompt exits cleanly without a stack trace.
result: pass

### 5. Placeholder Replacement
expected: After scaffolding a project named e.g. "my-service", no file in the output directory contains the string "nestjs-backend-template". The package.json name field equals "my-service". PascalCase references (e.g. "MyService") are correctly substituted throughout TypeScript files.
result: pass

### 6. PostgreSQL Template
expected: When PostgreSQL database is selected, the scaffolded output includes: @prisma/client in package.json dependencies, a prisma/ directory with schema.prisma, and no mongoose dependency.
result: pass

### 7. MongoDB Template
expected: When MongoDB database is selected, the scaffolded output includes: mongoose in package.json dependencies, no @prisma/client, no prisma/ directory, and mongodb.module.ts present in src/infrastructure/database/.
result: pass

### 8. Redis Module Removal
expected: When Redis is deselected during prompts, the scaffolded output has no ioredis in package.json and the src/infrastructure/cache/ directory does not exist (or is empty).
result: pass

### 9. OTel Module Removal
expected: When OTel is deselected, no @opentelemetry/* packages appear in package.json and instrumentation-related files (e.g. src/instrumentation.ts or similar) are absent from the scaffolded output.
result: pass

### 10. Kafka Module Generation
expected: When Kafka is selected, src/modules/kafka/ exists in the scaffolded output containing kafka.module.ts (with ClientsModule.registerAsync using ConfigService), kafka.controller.ts (with @MessagePattern stub), and index.ts barrel. The consumer group ID in kafka.module.ts matches "{serviceName}-consumer-group".
result: pass

### 11. GitHub Packages Publishing Pipeline
expected: .github/workflows/publish-cli.yml exists. It is triggered on tags matching "create-app@*", has packages: write permission, runs tests before publish, and uses ${NODE_AUTH_TOKEN} (not a hardcoded token).
result: pass

### 12. CLI README
expected: packages/create-app/README.md exists and contains: npx @team/create-app@latest usage, team setup instructions (GitHub token + .npmrc), and publishing workflow (tag + push).
result: pass

## Summary

total: 12
passed: 12
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
