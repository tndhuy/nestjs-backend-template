# Phase 4: Agent Configs & Documentation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 04-agent-configs-documentation
**Areas discussed:** CLAUDE.md depth, MCP server selection, Onboarding guide placement, API.md source of truth

---

## CLAUDE.md Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Agent-optimized | Full context agents need: DDD layer rules, module structure, key decisions, what NOT to do. ~200-300 lines. | ✓ |
| Conventions-focused | DDD naming + structural rules, import constraints, testing patterns. ~100-150 lines. | |
| Minimal pointer doc | Brief overview, key commands, links to docs/ARCHITECTURE.md. ~50 lines. | |

**User's choice:** Agent-optimized

**Follow-up — sections to include:**

| Section | Selected |
|---------|----------|
| DDD layer rules + forbidden patterns | ✓ |
| Module structure walkthrough | ✓ |
| Key architectural decisions | |
| Dev commands + workflow | |

**Notes:** Focus on what agents need to know to avoid mistakes — DDD layer import rules are the highest-value content since violations break the architecture.

---

## MCP Server Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Context7 | Fetches latest library docs on demand | ✓ |
| GSD framework tools | Planning workflow tools | |
| Playwright/browser MCP | Browser automation for E2E testing | ✓ |
| Database (Prisma/pg MCP) | Direct DB introspection | ✓ |

**User's choice:** Context7 + Prisma/pg MCP + Playwright

**Follow-up — config location:**

| Option | Selected |
|--------|----------|
| Project-level .mcp.json | ✓ |
| User-level only | |

**Additional clarification:** User also wants Lark MCP and Docker MCP added. After discussion, decision was to add these as **global user-level** MCPs (documented in CLAUDE.md), NOT in project `.mcp.json`, since they contain personal credentials and are not team-shared tools.

---

## Onboarding Guide Placement

| Option | Description | Selected |
|--------|-------------|----------|
| docs/CONTRIBUTING.md | Combined contributing + onboarding | ✓ |
| Standalone docs/ONBOARDING.md | Dedicated file | |
| README.md section | High visibility but long | |

**User's choice:** docs/CONTRIBUTING.md

**Follow-up — walkthrough depth:**

| Option | Selected |
|--------|----------|
| Step-by-step with code snippets | ✓ |
| High-level steps only | |
| Annotated ExampleModule reference | |

**Notes:** Full walkthrough covering domain entity, value objects, CQRS handlers, repository, controller with Swagger, module wiring.

---

## API.md Source of Truth

| Option | Description | Selected |
|--------|-------------|----------|
| API conventions guide | Response envelope, error codes, pagination, Swagger patterns | ✓ |
| Classic endpoint reference | Manual markdown endpoint list (redundant with Scalar) | |
| Skip — Scalar is enough | Remove from deliverables | |

**User's choice:** API conventions guide

**Notes:** User initially asked about "implementing scalar OpenAPI" — clarified that Scalar is already done in Phase 3. API.md will document the conventions (envelope format, error codes, pagination, Swagger decorator patterns) rather than repeating what Scalar auto-generates.
