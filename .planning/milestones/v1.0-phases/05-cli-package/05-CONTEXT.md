# Phase 5: CLI Package - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Wrap the NestJS backend template as an npm CLI package (`packages/create-app/`). Users run `npx @team/create-app my-service` to scaffold a ready-to-run project with interactive prompts for service name, database selection, and optional module toggles. Publish to GitHub Packages (private registry).

</domain>

<decisions>
## Implementation Decisions

### CLI Library
- **D-01:** Use `@clack/prompts` for all interactive prompts — modern UX, built-in spinner/progress, zero config. No commander or inquirer.

### Scaffolding Mechanism
- **D-02:** Copy entire template directory + search/replace placeholder strings. No template engines (EJS/Handlebars). Template files stay as valid TypeScript — no special syntax.
- **D-03:** Placeholder mapping:
  - `nestjs-backend-template` → `{service-name}` (kebab-case)
  - `NestjsBackendTemplate` → `{ServiceName}` (PascalCase)
  - Any other hardcoded occurrences of the template name

### Database Selection
- **D-04:** Presented as an interactive `@clack/prompts` select prompt — PostgreSQL highlighted as default, MongoDB as alternative.
- **D-05:** No `--db` CLI flag — selection is always interactive. No CI/non-interactive mode for now.
- **D-06:** When MongoDB is selected, the CLI switches in the Mongoose-based infrastructure (`mongodb.module.ts`, `item.schema.ts`) and removes Prisma dependencies. When PostgreSQL is selected, the standard Prisma setup is used.

### Optional Modules (toggleable)
- **D-07:** Three modules are user-selectable via multiselect prompt:
  - **Redis** — include/exclude `CacheModule` and Redis infra
  - **OpenTelemetry** — include/exclude OTel SDK setup (OTEL_ENABLED env var still present but infra removed if excluded)
  - **Kafka** — scaffold a Kafka boilerplate module if selected (not in template today — CLI adds it)
- **D-08:** `src/example/` module is always included (serves as DDD reference for the team).

### Package Structure
- **D-09:** Lives at `packages/create-app/` within the same monorepo. Versioned together with the template.
- **D-10:** Package name: `@team/create-app` (team-specific scope configured in `.npmrc`).

### Publishing
- **D-11:** Publish to GitHub Packages (private registry, `@team` scope).
- **D-12:** Team members configure `.npmrc` with `//npm.pkg.github.com/:_authToken=TOKEN` to install.

### Claude's Discretion
- Exact placeholder token format inside files
- Kafka boilerplate module structure (no existing reference — Claude designs it)
- Error handling and rollback if scaffolding fails mid-way
- `package.json` `bin` field setup and CLI entry point structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §REQ-010 — CLI package acceptance criteria, command syntax, module list

### Template source (what the CLI copies)
- `src/` — full DDD template source to be scaffolded
- `src/infrastructure/database/` — Prisma module (PostgreSQL path)
- `src/infrastructure/database/mongodb.module.ts` — Mongoose module (MongoDB path, on mongo-compatible branch)
- `src/modules/example/infrastructure/persistence/schemas/` — Mongoose schemas (MongoDB path)
- `docker-compose.yml` — template docker compose (service name needs replacement)
- `.env.example` — env vars template

### Reference implementations (CLI tooling patterns)
- No internal refs — researcher should look at `create-t3-app`, `create-next-app`, and `@clack/prompts` docs for patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/infrastructure/database/prisma.module.ts` — PostgreSQL path; copy as-is when user selects postgres
- `src/infrastructure/database/mongodb.module.ts` — MongoDB path (mongo-compatible branch); swap in when user selects mongo
- `src/modules/example/infrastructure/persistence/schemas/` — Mongoose item schema; included in MongoDB scaffold
- `.env.example` — template for environment variable scaffolding

### Established Patterns
- Template uses `nestjs-backend-template` as the canonical name string — CLI must replace all occurrences
- `NestjsBackendTemplate` appears in class names, module names — PascalCase replacement needed
- OTel is opt-in via `OTEL_ENABLED=true` env flag and dynamic `require()` — can be removed without breaking other modules
- Redis is injected via `@InjectRedis()` and isolated in `CacheModule` — removable as a unit

### Integration Points
- `packages/create-app/` is a new package — needs its own `package.json` with `bin` field pointing to CLI entry
- Monorepo root may need `workspaces` field added to `package.json` (currently single-package repo)
- `mongo-compatible` git branch holds MongoDB infrastructure — researcher should verify current merge status before planning copy strategy

</code_context>

<specifics>
## Specific Ideas

- Database selection is a first-class prompt (not buried in "optional modules") — it fundamentally changes the infra layer
- The MongoDB option maps to the work already done on the `mongo-compatible` branch
- Default is always PostgreSQL — no behavior change for existing users who don't pick MongoDB

</specifics>

<deferred>
## Deferred Ideas

- `--db` CLI flag for non-interactive/CI mode — user chose interactive-only for now; can be added later
- Example module toggle (include/exclude `src/example/`) — user decided to always include it
- Scheduled backup / restore commands — out of scope for this phase

</deferred>

---

*Phase: 05-cli-package*
*Context gathered: 2026-04-06*
