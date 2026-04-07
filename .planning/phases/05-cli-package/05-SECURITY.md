---
phase: 05
slug: cli-package
status: verified
threats_open: 0
threats_closed: 6
asvs_level: 1
audited: 2026-04-07
---

# Phase 05 — CLI Package: Security Verification

## Threat Register

| Threat ID | Category | Component | Disposition | Status | Evidence |
|-----------|----------|-----------|-------------|--------|----------|
| T-05-01 | Tampering | `validateServiceName` in replacements.ts | mitigate | CLOSED | `replacements.ts:36-65` — full charset + path traversal + length + hyphen rules |
| T-05-02 | Information Disclosure | published npm package (`files` field) | mitigate | CLOSED | `package.json:8-11` — `"files": ["dist", "templates"]` |
| T-05-03 | Tampering | `removeRedis`/`removeOtel` path scoping | mitigate | CLOSED | `scaffold.ts:212-239` — `safeDeleteFile`/`safeDeleteDir` with `resolve()` + `startsWith(destDir + '/')` guard |
| T-05-04 | Denial of Service | `addKafka` file writes | accept | CLOSED | Local CLI tool — accepted risk, user controls invocation |
| T-05-05 | Information Disclosure | `.npmrc` in repo | mitigate | CLOSED | `.npmrc:2` — `${NODE_AUTH_TOKEN}` placeholder only, no literal token |
| T-05-06 | Elevation of Privilege | `publish-cli.yml` workflow | mitigate | CLOSED | `publish-cli.yml:4,9-11,30` — tag-only trigger, `packages:write` scope, `GITHUB_TOKEN` only |

## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user input → filesystem | Service name from prompt used to create directories and replace file contents |
| local repo → npm registry | Package published to GitHub Packages via CI on tag push |

## Accepted Risks

| Risk ID | Threat | Rationale |
|---------|--------|-----------|
| T-05-04 | DoS via addKafka file writes | Local CLI tool — user controls invocation; no network exposure |

## Audit Trail

### Security Audit 2026-04-07

| Metric | Count |
|--------|-------|
| Threats found | 6 |
| Closed | 6 |
| Open | 0 |
