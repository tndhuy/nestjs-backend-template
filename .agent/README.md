# Antigravity Agent Configuration

This directory provides project-specific configuration for the Antigravity agent. It gives the agent the same context as Claude Code — DDD architecture, tech stack, coding conventions, MCP servers — without manual setup.

## Directory Structure

```
.agent/
├── context/        # Project context files (architecture, stack, conventions)
├── skills/         # Agent skill definitions
│   └── gsd/        # GSD milestone-driven workflow skill
└── mcp/            # MCP server configuration
    └── mcp.json    # Server list (context7, prisma, playwright)
```

- `context/` — Markdown files describing how the codebase is structured. Antigravity reads these at startup to orient itself.
- `skills/` — Skill definitions that extend what Antigravity can invoke (e.g., `/gsd:*` commands).
- `mcp/` — MCP server config that matches the project root `.mcp.json`, giving Antigravity the same tools as Claude Code.

## Context Files

The three files in `context/` are verbatim mirrors of `.planning/codebase/`:

| File | Source | Purpose |
|------|--------|---------|
| `ARCHITECTURE.md` | `.planning/codebase/ARCHITECTURE.md` | DDD layer structure, data flows, key abstractions |
| `STACK.md` | `.planning/codebase/STACK.md` | Languages, frameworks, dependencies, platform requirements |
| `CONVENTIONS.md` | `.planning/codebase/CONVENTIONS.md` | Naming patterns, code style, error handling, module design |

These files should be updated whenever `.planning/codebase/` changes. See [Keeping Context Fresh](#keeping-context-fresh) below.

## MCP Servers

Three project-level MCP servers are configured in `.agent/mcp/mcp.json`, matching the project root `.mcp.json`:

| Server | Purpose |
|--------|---------|
| `context7` | Semantic search over latest library docs |
| `prisma` | Database introspection and migration tools |
| `playwright` | Browser automation for E2E testing |

These are the same servers available in Claude Code sessions for this project.

## Setup

1. **Ensure `npx` is available** — Node.js 18+ and npm must be installed.
2. **Set `DATABASE_URL` in environment** — Required by the `prisma` MCP server. Add it to your shell profile or `.env` file:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   ```
3. **Antigravity auto-loads from `.agent/`** — When you open this project in Antigravity, it will automatically detect and load context files, skills, and MCP servers from this directory. No additional configuration needed.

## Keeping Context Fresh

The context files in `.agent/context/` mirror `.planning/codebase/`. When the codebase changes significantly (new modules, refactored architecture, new dependencies), regenerate and sync:

1. Run `/gsd:map-codebase` in Claude Code to regenerate `.planning/codebase/` maps.
2. Copy the updated files into `.agent/context/`:
   ```bash
   cp .planning/codebase/ARCHITECTURE.md .agent/context/ARCHITECTURE.md
   cp .planning/codebase/STACK.md .agent/context/STACK.md
   cp .planning/codebase/CONVENTIONS.md .agent/context/CONVENTIONS.md
   ```
3. Commit the updated `.agent/context/` files.
