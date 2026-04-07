# SECURITY.md — Phase 05: CLI Package

**Audited:** 2026-04-07
**ASVS Level:** 1
**Threats Closed:** 6/6

---

## Threat Verification

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-05-01 | Tampering | mitigate | CLOSED | `packages/create-app/src/replacements.ts:36-65` — `validateServiceName()` enforces min 2 chars, lowercase-only, no spaces, rejects `..`/`/`/`\`, no leading/trailing hyphens, regex `^[a-z0-9][a-z0-9-]*[a-z0-9]$` |
| T-05-02 | Information Disclosure | mitigate | CLOSED | `packages/create-app/package.json:8-11` — `"files": ["dist", "templates"]` excludes src, tests, and env files from published package |
| T-05-03 | Tampering | mitigate | CLOSED | `packages/create-app/src/scaffold.ts:212-239` — `safeDeleteFile()` and `safeDeleteDir()` both call `resolve()` and assert `startsWith(resolvedDestDir + '/')` before any `rm()`; all `removeRedis()` and `removeOtel()` deletions route through these guards |
| T-05-04 | Denial of Service | accept | CLOSED | Accepted risk — local CLI tool, user controls invocation, DoS exposure is negligible |
| T-05-05 | Information Disclosure | mitigate | CLOSED | `packages/create-app/.npmrc:2` — auth token set as `${NODE_AUTH_TOKEN}` env var placeholder only; no literal token committed |
| T-05-06 | Elevation of Privilege | mitigate | CLOSED | `.github/workflows/publish-cli.yml:4,9-11,30` — trigger scoped to `tags: ['create-app@*']`; permissions limited to `contents: read` + `packages: write`; token is `secrets.GITHUB_TOKEN` (repo-scoped, automatic) |

---

## Accepted Risks Log

| Threat ID | Category | Rationale |
|-----------|----------|-----------|
| T-05-04 | Denial of Service | `addKafka` file writes are invoked by the local CLI tool only. The user controls invocation frequency and the operation runs on the user's own filesystem. No network exposure. Risk accepted. |

---

## Unregistered Flags

None — no `## Threat Flags` sections were present in 05-01-SUMMARY.md, 05-02-SUMMARY.md, or 05-03-SUMMARY.md.

---

## Auditor Notes

- Path traversal guard in `safeDeleteFile`/`safeDeleteDir` uses both `resolve()` normalization and a strict `startsWith` prefix check with a trailing separator (`resolvedDestDir + '/'`), which correctly rejects exact-match escape attempts.
- The `validateServiceName` regex `^[a-z0-9][a-z0-9-]*[a-z0-9]$` implicitly requires at least 2 characters (first + last character classes are non-overlapping with the middle `*`), consistent with the declared minimum length check.
- Workflow does not use `--no-verify` or any bypass flags; tests are enforced before publish step.
