# @team/create-app

Scaffold a new NestJS DDD backend service from the team template.

## Usage

```
npx @team/create-app@latest my-service
```

## What it does

1. Prompts for service name (kebab-case)
2. Asks for database: PostgreSQL (default) or MongoDB
3. Asks for optional modules: Redis, OpenTelemetry, Kafka
4. Copies the template, replaces placeholder names, wires selected modules
5. Outputs a ready-to-run project directory

## After scaffolding

```
cd my-service
npm install
cp .env.example .env
npm run start:dev
```

## Setup (team members)

To install from GitHub Packages, add this to your `~/.npmrc`:

```
@team:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Generate a token at https://github.com/settings/tokens with `read:packages` scope.

## Publishing (maintainers)

```
git tag create-app@0.0.2
git push origin create-app@0.0.2
```

The GitHub Actions workflow handles build, test, and publish automatically.

## Development

```
npm test --workspace=packages/create-app       # Run tests
npm run build --workspace=packages/create-app  # Build CLI
```
