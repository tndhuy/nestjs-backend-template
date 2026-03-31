# Phase 4: Agent Configs & Documentation - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Configure Claude Code (`.claude/`) and Antigravity (`.agent/`) agent tooling with pre-wired MCP servers, and write complete developer documentation. Deliverables: CLAUDE.md (agent-optimized), project-level `.mcp.json`, `.agent/` directory structure, `README.md`, `docs/ARCHITECTURE.md`, `docs/CONTRIBUTING.md` (with onboarding walkthrough), `docs/API.md` (conventions guide).

This phase does NOT include building new features, changing the NestJS application code, or setting up CI/CD.

</domain>

<decisions>
## Implementation Decisions

### CLAUDE.md Content
- **D-01:** Agent-optimized, ~200-300 lines. Written for Claude Code agents, not just humans.
- **D-02:** Primary sections: **DDD layer rules + forbidden patterns** (what agents must never violate) and **Module structure walkthrough** (how domain/application/infrastructure/presenter layers are organized with file-level examples).
- **D-03:** Include key architectural decisions so agents don't second-guess them: commonjs over nodenext, URI versioning, NestExpressApplication, OTel feature flag, DDD base classes must be framework-free.

### MCP Server Configuration
- **D-04:** Project-level `.mcp.json` checked into repo root with 3 servers: **Context7** (library docs lookup), **Prisma/pg MCP** (DB introspection), **Playwright MCP** (browser automation / E2E).
- **D-05:** Lark MCP and Docker MCP are **global user-level** MCPs — NOT in project `.mcp.json`. Document setup instructions in CLAUDE.md so each developer adds them to their own `~/.claude/` config.
- **D-06:** Lark MCP config reference (for CLAUDE.md documentation): `@larksuiteoapi/lark-mcp` with presets `docx.default`, `wiki.default`, `im.default`, `bitable.default`, `contact.default`, `drive.default` + wiki node tools. Credentials via env vars `LARK_APP_ID` and `LARK_APP_SECRET` (referenced as `${LARK_APP_ID}` in config args — never hardcoded). Add both vars to `.env.example` with empty values. Docker MCP: `docker mcp gateway run`.

### API Documentation (docs/API.md)
- **D-07:** `docs/API.md` is an **API conventions guide** — NOT endpoint reference (Scalar at `/docs` covers that). Content: response envelope format, AppException error codes, PaginationDto usage, Swagger decorator patterns (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@RawResponse`). Target audience: developers extending the template.

### Developer Onboarding
- **D-08:** "Add a new module" walkthrough lives in **`docs/CONTRIBUTING.md`** (combined contributing guide + onboarding).
- **D-09:** Walkthrough is **step-by-step with code snippets**: full walkthrough covering domain entity creation, value objects, CQRS handlers (command + query), repository interface + Prisma implementation, controller with Swagger decorators, module wiring. ExampleModule (Item domain) is the reference implementation throughout.

### Claude's Discretion
- Exact structure and tone of README.md (standard NestJS project README conventions)
- docs/ARCHITECTURE.md depth and diagram format
- `.agent/` directory structure and README content (follow Antigravity conventions)
- Whether to include a `src/common/CLAUDE.md` annotation layer

</decisions>

<specifics>
## Specific Ideas

- Lark MCP global config (document in CLAUDE.md, NOT in project .mcp.json). Credentials via env vars `LARK_APP_ID` and `LARK_APP_SECRET`:
  ```json
  {
    "lark-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@larksuiteoapi/lark-mcp", "mcp", "-a", "${LARK_APP_ID}", "-s", "${LARK_APP_SECRET}",
               "--domain", "https://open.larksuite.com",
               "-t", "preset.docx.default,preset.wiki.default,preset.im.default,preset.bitable.default,preset.contact.default,preset.drive.default,wiki_v2_space_node_create,wiki_v2_space_node_move,wiki_v2_space_node_update,wiki_v2_space_list,wiki_v2_space_node_list",
               "--token-mode", "auto", "--oauth"]
    }
  }
  ```
- Add `LARK_APP_ID` and `LARK_APP_SECRET` to `.env.example` (with empty values + comment) so devs know to set them.
- Docker MCP global config: `"MCP_DOCKER": { "command": "docker", "args": ["mcp", "gateway", "run"], "type": "stdio" }`
- flash-pick-service architecture patterns are the DDD reference — researcher should use `.planning/codebase/` maps when available

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project architecture and decisions
- `.planning/STATE.md` — Active architectural decisions table (commonjs, URI versioning, NestExpressApplication, OTel flag, etc.)
- `.planning/ROADMAP.md` — Phase 4 deliverables and requirements (REQ-007, REQ-008, REQ-009)
- `.planning/codebase/ARCHITECTURE.md` — DDD layer architecture reference
- `.planning/codebase/CONVENTIONS.md` — Naming conventions and structural rules
- `.planning/codebase/STRUCTURE.md` — File/directory structure patterns
- `.planning/codebase/STACK.md` — Tech stack decisions

### Existing implementation (Phase 3 — reference for docs)
- `src/example/` — ExampleModule (Item domain) — the canonical DDD module devs will replicate
- `src/common/` — Shared filters, interceptors, decorators, middleware
- `src/shared/` — DTOs, base classes, exceptions
- `src/infrastructure/` — Redis, health, database infrastructure

### No external specs
No external ADR files — requirements are fully captured in decisions above and STATE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/example/` — Full DDD module (Item): domain entity, value objects, CQRS handlers, repository, presenter. This IS the onboarding reference.
- `.claude/settings.json` — Exists but empty; extend with CLAUDE.md and .mcp.json
- `docs/` directory — Does not exist yet; create fresh

### Established Patterns
- DDD layer imports: domain → nothing NestJS; application → domain only; infrastructure → NestJS + Prisma; presenter → application DTOs
- Module wiring: each module has `index.ts` barrel, module file imports infrastructure + application providers
- Error handling: `AppException` extends `HttpException`, used with `HttpExceptionFilter`
- Response: `TransformInterceptor` wraps all responses in `{success, data}` envelope (bypass with `@RawResponse()`)

### Integration Points
- CLAUDE.md sits at project root — auto-loaded by Claude Code on every session
- `.mcp.json` sits at project root — loaded by Claude Code as project-level MCP config
- `.agent/` sits at project root — loaded by Antigravity agent

</code_context>

<deferred>
## Deferred Ideas

- GSD framework tools in project `.mcp.json` — user decided these are personal/global, not project-level
- CI/CD pipeline documentation — out of scope for this phase
- Automated openapi.json export / snapshot — Phase 5 or separate backlog item

</deferred>

---

*Phase: 04-agent-configs-documentation*
*Context gathered: 2026-03-29*
