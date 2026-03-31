---
phase: 04-agent-configs-documentation
plan: 01
subsystem: agent-tooling
tags: [claude-code, mcp, skills, agent-config, env]
dependency_graph:
  requires: [03-01]
  provides: [CLAUDE.md, .mcp.json, .claude/skills/gsd/SKILL.md, .claude/skills/understand-anything/SKILL.md]
  affects: [developer-onboarding, agent-tooling]
tech_stack:
  added: []
  patterns: [project-level-mcp-config, claude-skills-stubs]
key_files:
  created:
    - nestjs-backend-template/CLAUDE.md
    - nestjs-backend-template/.mcp.json
    - nestjs-backend-template/.claude/skills/gsd/SKILL.md
    - nestjs-backend-template/.claude/skills/understand-anything/SKILL.md
  modified:
    - nestjs-backend-template/.env.example
decisions:
  - ".mcp.json at project root (not inside .claude/) — Claude Code auto-loads from repo root"
  - "Lark and Docker MCPs documented as user-global, not committed to project repo"
  - "Skill files use SKILL.md stub format pointing to globally installed frameworks"
metrics:
  duration: 8min
  completed: "2026-03-30"
  tasks: 2
  files: 5
---

# Phase 4 Plan 1: Agent Configs and Documentation — Claude Code Tooling Summary

**One-liner:** CLAUDE.md agent brief (155 lines, 8 sections) + project .mcp.json with context7/prisma/playwright + GSD and Understand-Anything skill stubs + Lark env vars in .env.example.

---

## What Was Built

### Task 1: CLAUDE.md + .mcp.json

**CLAUDE.md** (155 lines) written as a Claude Code agent brief with 8 sections:
1. Project overview paragraph
2. Architecture — DDD layer diagram + import rules table
3. Forbidden Patterns — 8 agent guardrails (never import @nestjs/* in domain/, etc.)
4. Module Structure — file-level walkthrough of all 21 files in src/example/ grouped by layer
5. Key Architectural Decisions — 10-row table with rationale (commonjs, URI versioning, NestExpressApplication, OTel flag, start:prod path, DDD framework-free base classes, etc.)
6. Commands Quick Reference — 11 pnpm scripts in a table
7. Global MCP Setup — Lark + Docker MCP JSON snippets with `${LARK_APP_ID}` / `${LARK_APP_SECRET}` env var refs, developer action instructions
8. Working with This Codebase — pointer to docs/CONTRIBUTING.md

**`.mcp.json`** at project root with exactly 3 servers:
- `context7` — `npx -y @upstash/context7-mcp`
- `prisma` — `npx -y @prisma/mcp-server-prisma` with `${DATABASE_URL}` env ref
- `playwright` — `npx -y @playwright/mcp`

No hardcoded credentials. No lark-mcp or MCP_DOCKER (those are user-global).

### Task 2: Skill Stubs + .env.example

**`.claude/skills/gsd/SKILL.md`** — GSD skill stub with frontmatter `name: gsd`, 6 `/gsd:` commands listed, state location note.

**`.claude/skills/understand-anything/SKILL.md`** — Understand-Anything skill stub with frontmatter `name: understand-anything`, 5 `/understand` commands listed, knowledge graph location note.

**`.env.example`** — Appended `LARK_APP_ID=` and `LARK_APP_SECRET=` with comment `# Lark MCP (global agent config — see CLAUDE.md for setup)`. All original vars preserved.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None — no placeholder data or hardcoded empty values that flow to UI rendering. Skill stubs are intentional thin wrappers (not incomplete implementations).

---

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | a260ab1 | feat(04-01): create CLAUDE.md agent brief and project .mcp.json |
| 2 | 97b26da | feat(04-01): scaffold .claude/skills stubs and add Lark vars to .env.example |

## Self-Check: PASSED
