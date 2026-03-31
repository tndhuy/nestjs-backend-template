---
phase: 4
slug: agent-configs-documentation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | File-system checks + shell scripts (no unit test framework — this phase produces config files and docs) |
| **Config file** | none |
| **Quick run command** | `ls .claude/CLAUDE.md .claude/.mcp.json .agent/README.md README.md` |
| **Full suite command** | `ls .claude/ .agent/ docs/ && cat .claude/CLAUDE.md | head -5` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `ls .claude/CLAUDE.md .claude/.mcp.json .agent/README.md README.md`
- **After every plan wave:** Run `ls .claude/ .agent/ docs/ && cat .claude/CLAUDE.md | head -5`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | REQ-007 | file-check | `ls .claude/CLAUDE.md` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | REQ-007 | file-check | `ls .claude/.mcp.json` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 1 | REQ-007 | file-check | `ls .claude/skills/` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | REQ-008 | file-check | `ls .agent/README.md .agent/context/ .agent/skills/ .agent/mcp/` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 2 | REQ-009 | file-check | `ls README.md docs/ARCHITECTURE.md docs/CONTRIBUTING.md docs/API.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.claude/CLAUDE.md` — populated with project instructions
- [ ] `.claude/.mcp.json` — project-root MCP config (context7, prisma, playwright)
- [ ] `.claude/skills/` — SKILL.md stubs for GSD + Understand-Anything
- [ ] `.agent/` — directory structure with README
- [ ] `docs/` — directory with ARCHITECTURE.md, CONTRIBUTING.md, API.md
- [ ] `README.md` — project root documentation

*Existing infrastructure: none — all files are new deliverables.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MCP servers load in Claude Code | REQ-007 | Requires Claude Code runtime | Open project in Claude Code, run `/mcp` to verify context7, prisma, playwright listed |
| GSD skill works end-to-end | REQ-007 | Requires Claude Code session | Run `/gsd:progress` in Claude Code session on this project |
| Onboarding guide is followable | REQ-009 | Human judgment | Follow "add a new module" guide from scratch, verify all steps work |
| `.agent/` loads in Antigravity | REQ-008 | Requires Antigravity runtime | Open project in Antigravity agent, verify context/skills/mcp loaded |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
