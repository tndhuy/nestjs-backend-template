# Phase 5: CLI Package - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion.

**Date:** 2026-04-06
**Phase:** 05-cli-package
**Mode:** discuss
**Areas analyzed:** CLI library & UX, Scaffolding mechanism, Optional modules, Package structure & publishing, Database selection

## Assumptions Presented

| Area | Options Presented | User Choice |
|------|------------------|-------------|
| CLI library | @clack/prompts, commander+inquirer, Plop/degit | @clack/prompts |
| Scaffold method | Copy+search/replace, EJS/Handlebars templates | Copy+search/replace |
| Optional modules | Redis, OTel, Example module, Kafka | Redis, OTel, Kafka (Example always included) |
| Package structure | packages/create-app/ monorepo, standalone repo | packages/create-app/ monorepo |
| Database prompt | Interactive prompt only, --db flag only, Both | Interactive prompt only |
| Registry | GitHub Packages (private), npm public, private registry | GitHub Packages |

## Key Context from User

User is on a `mongo-compatible` branch where Prisma was migrated to Mongoose. The database selection feature in the CLI is designed to bridge both worlds:
- PostgreSQL → standard Prisma setup (main branch)
- MongoDB → Mongoose setup (from mongo-compatible branch work)

Default is PostgreSQL to maintain backwards compatibility.

## Corrections Made

No corrections — user confirmed all recommended options or selected from presented alternatives.
