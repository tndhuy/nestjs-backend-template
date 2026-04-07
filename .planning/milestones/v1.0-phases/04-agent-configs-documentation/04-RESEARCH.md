# Phase 4: Agent Configs & Documentation — Research

**Researched:** 2026-03-30
**Domain:** Claude Code agent configuration, MCP servers, developer documentation for NestJS DDD template
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** CLAUDE.md is agent-optimized, ~200-300 lines. Written for Claude Code agents, not just humans.
- **D-02:** Primary sections: DDD layer rules + forbidden patterns (what agents must never violate) and Module structure walkthrough (domain/application/infrastructure/presenter layers with file-level examples).
- **D-03:** Include key architectural decisions so agents don't second-guess them: commonjs over nodenext, URI versioning, NestExpressApplication, OTel feature flag, DDD base classes must be framework-free.
- **D-04:** Project-level `.mcp.json` checked into repo root with 3 servers: Context7 (library docs lookup), Prisma/pg MCP (DB introspection), Playwright MCP (browser automation / E2E).
- **D-05:** Lark MCP and Docker MCP are global user-level MCPs — NOT in project `.mcp.json`. Document setup instructions in CLAUDE.md so each developer adds them to their own `~/.claude/` config.
- **D-06:** Lark MCP config reference (for CLAUDE.md documentation): `@larksuiteoapi/lark-mcp` with presets `docx.default`, `wiki.default`, `im.default`, `bitable.default`, `contact.default`, `drive.default` + wiki node tools. Credentials via env vars `LARK_APP_ID` and `LARK_APP_SECRET` (referenced as `${LARK_APP_ID}` in config args — never hardcoded). Add both vars to `.env.example` with empty values.
- **D-07:** `docs/API.md` is an API conventions guide — NOT endpoint reference. Content: response envelope format, AppException error codes, PaginationDto usage, Swagger decorator patterns.
- **D-08:** "Add a new module" walkthrough lives in `docs/CONTRIBUTING.md` (combined contributing guide + onboarding).
- **D-09:** Walkthrough is step-by-step with code snippets: domain entity, value objects, CQRS handlers, repository interface + Prisma implementation, controller with Swagger decorators, module wiring. ExampleModule (Item domain) is the reference implementation throughout.

### Claude's Discretion

- Exact structure and tone of README.md (standard NestJS project README conventions)
- docs/ARCHITECTURE.md depth and diagram format
- `.agent/` directory structure and README content (follow Antigravity conventions)
- Whether to include a `src/common/CLAUDE.md` annotation layer

### Deferred Ideas (OUT OF SCOPE)

- GSD framework tools in project `.mcp.json` — user decided these are personal/global, not project-level
- CI/CD pipeline documentation — out of scope for this phase
- Automated openapi.json export / snapshot — Phase 5 or separate backlog item
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-007 | Claude Code agent setup in `.claude/`: CLAUDE.md, skills (GSD + Understand-Anything), `.mcp.json`, GSD framework | Covered: CLAUDE.md structure, skills format, MCP schema confirmed |
| REQ-008 | Antigravity agent setup in `.agent/`: context/, skills/, mcp/ directories + README | Covered: `.agent/` mirrors `.claude/` pattern; structure derived from STATE.md note and convention |
| REQ-009 | Complete onboarding documentation: README.md, docs/ARCHITECTURE.md, docs/CONTRIBUTING.md, docs/API.md, .env.example update | Covered: content structure researched from codebase and decisions |
</phase_requirements>

---

## Summary

Phase 4 is a pure configuration and documentation phase — no NestJS application code changes. Three deliverable clusters: (1) Claude Code tooling in `.claude/`, (2) Antigravity tooling in `.agent/`, (3) developer docs in `README.md` + `docs/`.

The `.claude/` directory already has a skeleton: `.mcp.json` (currently holding user-level Lark + Docker servers that must move to global docs), `CLAUDE.md` (empty except claude-mem stub), and `get-shit-done/` framework (templates/ and workflows/ subdirectories exist but are empty stubs with only claude-mem headers). The `skills/` directory is absent and must be created. The project `.mcp.json` at repo root does not exist yet and must be created with the three project-level servers.

The `understand-anything` plugin is installed globally at `~/.claude/plugins/marketplaces/understand-anything/` with six skills: `understand`, `understand-chat`, `understand-dashboard`, `understand-diff`, `understand-explain`, `understand-onboard`. For the project `.claude/skills/` we need lightweight SKILL.md stub files that reference these, following the established SKILL.md front-matter format (`---\nname:\ndescription:\n---`).

**Primary recommendation:** Write CLAUDE.md as a structured agent brief (200-300 lines), create `.mcp.json` at repo root with context7 + prisma + playwright, scaffold `.claude/skills/` with GSD and Understand-Anything stubs, mirror structure in `.agent/`, and write docs as prescriptive guides with concrete code examples from the ExampleModule.

---

## Standard Stack

### Core Files to Create

| File | Purpose | Notes |
|------|---------|-------|
| `CLAUDE.md` (project root) | Agent brief auto-loaded by Claude Code | ~200-300 lines, agent-optimized |
| `.mcp.json` (project root) | Project-level MCP server config | 3 servers: context7, prisma, playwright |
| `.claude/skills/gsd/SKILL.md` | GSD skill stub for Claude Code | Thin wrapper pointing to global GSD |
| `.claude/skills/understand-anything/SKILL.md` | Understand-Anything skill stub | Thin wrapper pointing to global plugin |
| `.agent/context/ARCHITECTURE.md` | DDD architecture for Antigravity | Mirror of docs/ARCHITECTURE.md |
| `.agent/context/STACK.md` | Tech stack for Antigravity | Mirror of .planning/codebase/STACK.md |
| `.agent/context/CONVENTIONS.md` | Coding conventions for Antigravity | Mirror of .planning/codebase/CONVENTIONS.md |
| `.agent/skills/gsd/SKILL.md` | GSD skill for Antigravity | Same content as .claude/skills/gsd/ |
| `.agent/mcp/mcp.json` | MCP config for Antigravity | Same servers as project .mcp.json |
| `.agent/README.md` | How to use Antigravity with this template | Setup instructions |
| `README.md` | Project overview, quick start | Standard NestJS template README |
| `docs/ARCHITECTURE.md` | DDD layers, data flow, conventions | Written for developers |
| `docs/CONTRIBUTING.md` | Add-a-module walkthrough + contribution guide | Step-by-step with code snippets |
| `docs/API.md` | API conventions guide | Not endpoint reference — Scalar covers that |

### MCP Server Configuration (project `.mcp.json`)

| Server | Package/Command | Purpose | Why project-level |
|--------|----------------|---------|-------------------|
| context7 | `npx -y @upstash/context7-mcp` | Library docs lookup (NestJS, Prisma, etc.) | Every developer working on this codebase needs it |
| prisma | `npx -y @prisma/mcp-server-prisma` | DB schema introspection, migration help | Tied to this project's Prisma schema |
| playwright | `npx -y @playwright/mcp` | Browser automation, E2E test authoring | Needed for API testing against running server |

**Global user-level MCPs (document in CLAUDE.md, NOT in project `.mcp.json`):**
- Lark MCP: `npx -y @larksuiteoapi/lark-mcp` — team-specific credentials, not project-scoped
- Docker MCP: `docker mcp gateway run` — system-level tool, personal workstation config

### SKILL.md Format

Skills use YAML front-matter + markdown body:

```markdown
---
name: gsd
description: Use for milestone-based development workflows: planning phases, researching, implementing tasks, verifying work. Invoke as /gsd:<command>.
---

# GSD (Get Shit Done) Skill

The GSD framework is installed globally at `~/.claude/get-shit-done/`.

## Available Commands
- `/gsd:map-codebase` — Build a knowledge map of this codebase
- `/gsd:discuss-phase` — Discuss and finalize requirements for a phase
- `/gsd:plan-phase` — Plan tasks for a phase
- `/gsd:do-work` — Execute planned tasks
- `/gsd:verify-work` — Verify phase completion

## Usage
Run any GSD command from the project root. State is tracked in `.planning/`.
```

---

## Architecture Patterns

### CLAUDE.md Structure (agent-optimized, ~200-300 lines)

```
# [Project Name] — Claude Code Brief

## Project Overview
[1 paragraph: what this is, who uses it, key tech]

## Architecture
[DDD layer diagram + layer rules]

## Forbidden Patterns
[What agents must NEVER do — firm rules]

## Module Structure
[File-level walkthrough of src/example/]

## Key Architectural Decisions
[Locked choices agents must not second-guess]

## Commands Quick Reference
[pnpm scripts, test commands]

## Global MCP Setup (Developer Action Required)
[Lark + Docker MCP config snippets for ~/.claude/]

## Working with This Codebase
[How to add a module — pointer to docs/CONTRIBUTING.md]
```

**Critical CLAUDE.md sections** (HIGH confidence, from D-01 through D-03):

1. **DDD Layer Rules** — Explicit import constraints per layer:
   - Domain layer: ZERO NestJS imports, ZERO framework deps
   - Application layer: imports domain only, no infrastructure
   - Infrastructure layer: imports NestJS + Prisma, implements domain interfaces
   - Presenter layer: imports application DTOs only

2. **Forbidden Patterns** — Agent guardrails:
   - Never import `@nestjs/*` in `domain/` directories
   - Never use `new` on NestJS services directly (use DI)
   - Never bypass `TransformInterceptor` except with `@RawResponse()`
   - Never hardcode credentials — use `ConfigService`

3. **Locked Architectural Decisions** (from STATE.md):
   - `moduleResolution: commonjs` (not nodenext) — reflect-metadata requires it
   - URI versioning at `/api/v1/` — team preference
   - `NestExpressApplication` type (not `INestApplication`) — needed for `.set('trust proxy', 1)`
   - OTel via `OTEL_ENABLED=true` env flag — dynamic require avoids loading heavy deps
   - `start:prod` points to `dist/src/main` (not `dist/main`) — NestJS CLI sourceRoot behavior
   - DDD base classes are framework-free — keeps domain unit-testable in isolation

### .agent/ Directory Convention

Derived from STATE.md note: "Antigravity agent config format: similar to `.claude/` — context files, skills, MCP configs."

```
.agent/
├── context/                # Project context files (Antigravity loads these)
│   ├── ARCHITECTURE.md     # DDD layer architecture
│   ├── STACK.md            # Tech stack + versions
│   └── CONVENTIONS.md      # Naming + coding conventions
├── skills/                 # Available skills
│   └── gsd/
│       └── SKILL.md        # GSD skill definition
├── mcp/                    # MCP server configurations
│   └── mcp.json            # Same as project .mcp.json
└── README.md               # How to configure Antigravity for this project
```

### docs/ Structure

```
docs/
├── ARCHITECTURE.md         # DDD layers, patterns, data flow diagrams
├── CONTRIBUTING.md         # Add-a-module walkthrough + contribution rules
└── API.md                  # API conventions guide (NOT endpoint reference)
```

### docs/CONTRIBUTING.md — "Add a New Module" Walkthrough Sections

Per D-09, step-by-step with code snippets using ExampleModule as reference:

1. **Create the domain layer** — entity + value objects (reference: `src/example/domain/item.entity.ts`, `item-name.value-object.ts`)
2. **Define the repository interface** — port pattern (reference: `src/example/domain/item.repository.interface.ts`)
3. **Create CQRS command handler** — command + handler (reference: `src/example/application/commands/create-item.command.ts`, `create-item.handler.ts`)
4. **Create CQRS query handler** — query + handler (reference: `src/example/application/queries/get-item.handler.ts`)
5. **Create application DTOs** — request + response DTOs (reference: `src/example/application/dtos/`)
6. **Implement the Prisma repository** — infrastructure adapter (reference: `src/example/infrastructure/persistence/prisma-item.repository.ts`)
7. **Create the controller** — Swagger decorators, response envelope, `@RawResponse()` when needed (reference: `src/example/presenter/item.controller.ts`)
8. **Wire the module** — NestModule declaration, providers, imports (reference: `src/example/example.module.ts`)
9. **Register in AppModule** — import new module in `src/app.module.ts`

### docs/API.md — API Conventions Guide Sections

Per D-07:
1. Response envelope format (`{ success, data, meta?, error? }`) with TypeScript interfaces
2. `AppException` error codes — how to throw, what codes exist
3. `PaginationDto` usage — query params, `PaginationMeta` response shape
4. Swagger decorator patterns: `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@RawResponse()`
5. Rate limiting with `@Throttle()` override
6. Validation with `class-validator` — required decorators on DTOs

### README.md Structure (Claude's Discretion)

Standard NestJS template README convention:

```
# nestjs-backend-template

[Badge row: build, license, node version]

## Overview
[What this template provides — 3 bullet points]

## Quick Start
[5-step: clone → install → .env.example → docker → pnpm dev]

## Available Scripts
[Table: pnpm dev, build, test, lint, format]

## Environment Variables
[Table: key | required | description | example]

## Architecture
[Pointer to docs/ARCHITECTURE.md]

## Adding a New Module
[Pointer to docs/CONTRIBUTING.md]

## Tech Stack
[Bullet list with versions]

## License
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MCP server discovery | Custom config loader | `.mcp.json` at project root | Claude Code auto-loads this file — no custom tooling needed |
| Skill definitions | Full implementation in skill file | SKILL.md stub that points to global install | Skills reference global `~/.claude/` — stub is sufficient |
| API docs | Custom endpoint reference in docs/API.md | Scalar at `/docs` | Scalar auto-generates from Swagger decorators; docs/API.md is conventions only |
| Agent context files | Duplicate full CLAUDE.md in .agent/ | Mirror `.planning/codebase/` files into `.agent/context/` | Codebase maps already contain curated architecture content |
| Env var docs in README | Prose explanation | Table from `.env.example` | `.env.example` is source of truth; README table mirrors it |

---

## Common Pitfalls

### Pitfall 1: Hardcoding Credentials in .mcp.json
**What goes wrong:** Lark/Docker MCP credentials hardcoded in project `.mcp.json`, committed to git.
**Why it happens:** Copy-pasting from existing `~/.claude/.mcp.json` which already has credentials.
**How to avoid:** Project `.mcp.json` uses `${ENV_VAR}` syntax for any credentials. Lark + Docker MCPs go in user-global config, not project file.
**Warning signs:** `.mcp.json` contains literal API keys, passwords, or tokens.

**Current state of `.claude/.mcp.json`:** The existing file at `.claude/.mcp.json` contains hardcoded `cli_a921496251b89eed` and `9QHsbVdb7fvnI7soOOwvfhPx0u5yWbkh` credentials. This file must be replaced with a version using `${LARK_APP_ID}` and `${LARK_APP_SECRET}` env var references, and it should be documented as user-global config, NOT the project-level `.mcp.json`.

### Pitfall 2: CLAUDE.md Too Long / Too Human-Oriented
**What goes wrong:** CLAUDE.md becomes 600+ lines of prose that agents skim and ignore.
**Why it happens:** Trying to document everything in one file.
**How to avoid:** Keep CLAUDE.md to 200-300 lines. Use tight, declarative language. Forbidden patterns as bullet lists. Layer rules as a simple table. Delegate deep content to `docs/`.
**Warning signs:** CLAUDE.md has prose paragraphs explaining what DDD is instead of rules for how to use DDD here.

### Pitfall 3: .agent/ Context Files Out of Sync with .planning/codebase/
**What goes wrong:** `.agent/context/` becomes stale as codebase evolves.
**Why it happens:** Separately maintained from `.planning/codebase/` maps.
**How to avoid:** `.agent/context/` files are copies (or symlinks if supported) of `.planning/codebase/` content. ARCHITECTURE.md, STACK.md, CONVENTIONS.md can be identical.
**Warning signs:** `.agent/context/STACK.md` lists different package versions than what's in `package.json`.

### Pitfall 4: docs/CONTRIBUTING.md Walkthrough Without Code Snippets
**What goes wrong:** Developers follow the guide but hit import errors or pattern mismatches.
**Why it happens:** Written at a high level without referencing actual files.
**How to avoid:** Every step has a concrete code snippet from the ExampleModule. The guide says "copy this pattern from `src/example/domain/item.entity.ts`" — not just "create an entity".
**Warning signs:** Steps say "implement the repository interface" with no code example.

### Pitfall 5: .mcp.json at Wrong Location
**What goes wrong:** MCP servers don't auto-load in Claude Code sessions.
**Why it happens:** Placing `.mcp.json` inside `.claude/` instead of project root.
**How to avoid:** Project-level `.mcp.json` must be at the workspace root (`nestjs-backend-template/.mcp.json`). The existing `.claude/.mcp.json` is a separate user-level config.
**Warning signs:** Running Claude Code in project and MCP servers not appearing in available tools.

---

## Code Examples

### Project `.mcp.json` (repo root)

```json
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "prisma": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@prisma/mcp-server-prisma"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp"]
    }
  }
}
```

### User-Global MCP Config Snippet (document in CLAUDE.md, not committed)

```json
{
  "mcpServers": {
    "lark-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y", "@larksuiteoapi/lark-mcp", "mcp",
        "-a", "${LARK_APP_ID}",
        "-s", "${LARK_APP_SECRET}",
        "--domain", "https://open.larksuite.com",
        "-t", "preset.docx.default,preset.wiki.default,preset.im.default,preset.bitable.default,preset.contact.default,preset.drive.default,wiki_v2_space_node_create,wiki_v2_space_node_move,wiki_v2_space_node_update,wiki_v2_space_list,wiki_v2_space_node_list",
        "--token-mode", "auto", "--oauth"
      ]
    },
    "MCP_DOCKER": {
      "type": "stdio",
      "command": "docker",
      "args": ["mcp", "gateway", "run"]
    }
  }
}
```

### GSD SKILL.md Format

```markdown
---
name: gsd
description: Use for milestone-based development workflows. Invoke /gsd:<command> for planning, research, implementation, and verification of project phases.
---

# GSD Skill

GSD (Get Shit Done) is a milestone-driven development framework installed globally.

## Commands
- `/gsd:map-codebase` — map project structure into `.planning/codebase/`
- `/gsd:discuss-phase` — gather requirements + decisions for a phase
- `/gsd:research-phase` — research implementation approach
- `/gsd:plan-phase` — generate task plans
- `/gsd:do-work` — execute plans
- `/gsd:verify-work` — verify completion

State lives in `.planning/`. Never delete `.planning/` files.
```

### Understand-Anything SKILL.md Format

```markdown
---
name: understand-anything
description: Use to onboard onto a codebase, understand architecture, or explore unfamiliar code. Run /understand first to build the knowledge graph, then use sub-commands.
---

# Understand-Anything Skill

Understand-Anything builds a knowledge graph of the codebase for navigation and explanation.

## Commands
- `/understand` — build knowledge graph (run first)
- `/understand-onboard` — generate onboarding guide
- `/understand-explain` — explain a specific file or component
- `/understand-diff` — understand a diff or PR
- `/understand-dashboard` — high-level project overview

Knowledge graph stored at `.understand-anything/knowledge-graph.json`.
```

### CLAUDE.md DDD Layer Rules Section

```markdown
## DDD Layer Import Rules

| Layer | Location | May Import | NEVER Import |
|-------|----------|-----------|--------------|
| Domain | `src/*/domain/` | Nothing (pure TS/classes) | @nestjs/*, prisma, ioredis |
| Application | `src/*/application/` | Domain layer only | @nestjs/*, prisma, ioredis |
| Infrastructure | `src/*/infrastructure/` | NestJS DI, Prisma, ioredis | Domain business logic directly |
| Presenter | `src/*/presenter/` | Application DTOs, @nestjs/common | Domain entities directly |

**Forbidden patterns agents must never generate:**
- `import { Injectable } from '@nestjs/common'` inside any `domain/` file
- `import { PrismaService } from '...'` inside any `application/` file
- Direct `new ItemEntity()` in controller — always go through command/query handler
- Hardcoded env vars — always use `ConfigService`
```

---

## Environment Availability

Step 2.6: SKIPPED — Phase 4 is pure file creation (configs, docs, markdown). No external runtime dependencies. The MCP servers listed in `.mcp.json` do not need to be running to create the config file.

---

## Validation Architecture

nyquist_validation is `true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 via `ts-jest` |
| Config file | `package.json` (jest key) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-007 | `.claude/CLAUDE.md` describes architecture and conventions | manual | n/a — content review | ❌ Wave 0 |
| REQ-007 | `.mcp.json` has valid JSON with 3 server entries | smoke | `node -e "JSON.parse(require('fs').readFileSync('.mcp.json','utf8'))"` | ❌ Wave 0 |
| REQ-007 | `.claude/skills/` contains gsd and understand-anything SKILL.md files | smoke | `ls .claude/skills/gsd/SKILL.md .claude/skills/understand-anything/SKILL.md` | ❌ Wave 0 |
| REQ-008 | `.agent/` has context/, skills/, mcp/ subdirectories | smoke | `ls .agent/context .agent/skills .agent/mcp` | ❌ Wave 0 |
| REQ-009 | `README.md` exists and has Quick Start section | manual | grep for "Quick Start" in README.md | ❌ Wave 0 |
| REQ-009 | `docs/CONTRIBUTING.md` has "add a new module" walkthrough | manual | content review | ❌ Wave 0 |
| REQ-009 | `.env.example` includes LARK_APP_ID and LARK_APP_SECRET | smoke | `grep LARK_APP_ID .env.example` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm build` (ensures no TypeScript breakage)
- **Per wave merge:** `pnpm test && pnpm build`
- **Phase gate:** `pnpm test && pnpm build` green + manual review of CLAUDE.md and CONTRIBUTING.md content

### Wave 0 Gaps
- All deliverables are new files — no existing tests to update
- No new TypeScript source files — test suite unchanged
- Validation is primarily structural (file exists) and manual (content quality)

---

## Open Questions

1. **`.claude/.mcp.json` vs `.mcp.json` at root — what happens to the existing file?**
   - What we know: `.claude/.mcp.json` currently exists with hardcoded Lark + Docker credentials
   - What's unclear: Should it be deleted, moved, or kept alongside the new root `.mcp.json`?
   - Recommendation: Replace `.claude/.mcp.json` content with the user-global template (env var refs), document it as the "copy this to `~/.claude/` global config" reference. Create separate `.mcp.json` at project root with the three project servers. Two different files, two different purposes.

2. **Antigravity `.agent/` exact loading mechanism**
   - What we know: STATE.md states "Antigravity agent config format: similar to `.claude/` — context files, skills, MCP configs". No deeper spec available.
   - What's unclear: Exact subdirectory names Antigravity expects, whether `mcp.json` or `.mcp.json` filename convention applies.
   - Recommendation: Use `mcp/mcp.json` (no dot prefix inside subdirectory). Mirror `.claude/` structure for skills. Planner should keep `.agent/` structure flexible.

3. **GSD skill — stub vs full copy**
   - What we know: GSD framework is installed globally at `~/.claude/get-shit-done/`. The project has a local copy stub at `.claude/get-shit-done/` with empty templates/ and workflows/ dirs.
   - What's unclear: Does REQ-007 "GSD framework installed locally" mean full copy of global install, or just SKILL.md stub?
   - Recommendation: Create `SKILL.md` in `.claude/skills/gsd/` as the skill entry point. The existing `.claude/get-shit-done/` skeleton can serve as local reference copies of templates and workflows — populate it from the global install templates. Do NOT duplicate full GSD binaries.

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `.claude/` directory structure and file contents — confirmed via Read/Bash tools
- `.planning/phases/04-agent-configs-documentation/04-CONTEXT.md` — locked decisions D-01 through D-09
- `.planning/STATE.md` — active architectural decisions table
- `~/.claude/plugins/marketplaces/understand-anything/understand-anything-plugin/skills/` — actual skill structure confirmed
- `~/.claude/skills/template-skill/SKILL.md` — canonical SKILL.md format confirmed
- `~/.claude/skills/repomix/SKILL.md` — populated SKILL.md example confirmed

### Secondary (MEDIUM confidence)
- Claude Code `.mcp.json` project-level convention — confirmed from Claude Code docs and existing `.claude/.mcp.json` observation
- Context7 MCP package `@upstash/context7-mcp` — known from prior phases (used in session)
- `@prisma/mcp-server-prisma` and `@playwright/mcp` — well-known official MCP packages from respective vendors

### Tertiary (LOW confidence)
- Antigravity `.agent/` exact directory convention — derived from STATE.md description only; no official spec accessed

---

## Metadata

**Confidence breakdown:**
- Claude Code CLAUDE.md structure: HIGH — confirmed from decisions, global CLAUDE.md conventions, and prior GSD phase pattern
- MCP server configuration: HIGH — `.mcp.json` format confirmed by existing `.claude/.mcp.json`, server packages well-known
- Skills format: HIGH — confirmed by direct inspection of `~/.claude/skills/template-skill/SKILL.md`
- Understand-Anything skill structure: HIGH — confirmed by direct inspection of `~/.claude/plugins/marketplaces/understand-anything/`
- `.agent/` directory convention: LOW — derived from single STATE.md sentence, no Antigravity spec accessed
- Documentation structure: HIGH — content driven by locked decisions D-07 through D-09 and ExampleModule inspection

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable domain — MCP config format and skill format are not fast-moving)
