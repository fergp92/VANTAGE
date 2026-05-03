# CANONICAL.md — [Project Name]

> **One implementation per concern. Adding an alternative requires an ADR.**
>
> This file is the structural source of truth for the project. It is owned by
> Architecture Board (Agent 01) and enforced by Structural Coherence Agent (Agent 34).
> Any PR that introduces an alternative implementation of a listed concern is blocked
> at Gate G3.5 unless an Architecture Decision Record explicitly accepts the divergence.
>
> Created from the VANTAGE 2.0 Pillar B template at `docs/CANONICAL-TEMPLATE.md`.

---

## How to use this file

1. **At project kickoff (Phase 1)**: Architecture Board populates the table below.
   Every cross-cutting concern that will exist in the system gets a row. If a path
   does not exist yet because Phase 4 has not started, write `(to be created at <path>)`
   and update the row when the file is created.

2. **During implementation (Phase 4)**: Code-writing agents (12-16) READ this file
   as part of the Forced-Context Preamble before every write. They never bypass a
   canonical path. If they need to, they request an ADR first.

3. **At sprint close (Gate G3.5)**: Agent 34 verifies every canonical path still
   exists, no alternatives exist outside the Divergence Log, and every new
   cross-cutting concern introduced this sprint has been added to this file.

4. **Adding a new concern**: Edit this file directly. Reference the commit/PR that
   introduces the canonical implementation. Notify Agent 34 in the PR body.

5. **Diverging from a canonical path**: STOP. Open an ADR at `backlog/decisions/`.
   Get Architecture Board approval. Only after the ADR is APPROVED, add the alternative
   to the Divergence Log section below.

---

## Cross-Cutting Concerns

| Concern | Canonical Path | Owner Agent | Notes |
|---------|----------------|-------------|-------|
| Authentication | `src/infrastructure/auth/SessionManager.ts` | 09 | OAuth 2.1 + httpOnly cookies. No JWTs in localStorage. |
| Authorization | `src/application/authz/PolicyEngine.ts` | 09 | RBAC + ABAC hybrid. All routes pass through. |
| HTTP Client (outbound) | `src/infrastructure/http/ApiClient.ts` | 14 | Single retry policy, single timeout config, single circuit breaker. |
| HTTP Server (inbound) | `src/application/api/server.ts` | 13 | Single framework instance. All routes mounted here. |
| Error Types | `src/domain/errors/AppError.ts` | 12 | All thrown errors extend AppError. No raw `Error` from business code. |
| Error Handling Middleware | `src/application/api/middleware/errorHandler.ts` | 13 | Single global handler. Maps AppError subclasses to HTTP responses. |
| Logging | `src/infrastructure/logging/Logger.ts` | 22 | JSON structured. Single transport. No `console.log` in prod code. |
| Validation (input) | `src/domain/validation/` (Zod / Joi schemas) | 12 | No ad-hoc validators in routes or services. |
| DB Access | `src/infrastructure/db/Repository.ts` (per aggregate) | 14 | Parameterized queries only. No string concatenation for SQL. |
| DB Migrations | `src/infrastructure/db/migrations/` | 33 | Single migration tool. Versioned, forward-only by default. |
| Config Loader | `src/infrastructure/config/Config.ts` | 07 | Single env loader. All env access goes through this module. |
| Secrets Access | `src/infrastructure/secrets/SecretsClient.ts` | 10 | Vault or env injection. Never read process.env directly for secrets. |
| Feature Flags | `src/infrastructure/flags/FlagClient.ts` | 13 | Single client. No inline `if (env === 'prod')` checks. |
| Background Jobs | `src/application/jobs/JobScheduler.ts` | 13 | Single job runner. All cron/queue work registered here. |
| Cache | `src/infrastructure/cache/CacheClient.ts` | 14 | Single Redis/memcached client. No per-feature cache instances. |
| Metrics / Observability | `src/infrastructure/observability/Metrics.ts` | 22 | Single OpenTelemetry exporter. No ad-hoc Prometheus scraping. |
| Frontend State | `src/state/store.ts` (Redux/Zustand/etc.) | 15 | Single store. No per-component global state. |
| Frontend HTTP | `src/lib/api.ts` (uses ApiClient) | 16 | Single fetch wrapper. No raw `fetch()` in components. |
| Frontend Routing | `src/router/index.ts` | 15 | Single router config. No imperative `history.push` from random places. |
| i18n | `src/i18n/` | 16 | Single translation system. No hardcoded user-facing strings in components. |

> Remove rows that do not apply to your project. Add rows for concerns specific to
> your domain (e.g. payment processing, file storage, ML model invocation, websocket
> message routing, PDF generation -- each gets ONE canonical path).

---

## Divergence Log

> Filled only when an Architecture Board ADR has approved an alternative implementation.
> Empty by default.

| Date | Concern | Alternative Path | ADR | Reason |
|------|---------|------------------|-----|--------|
| (empty) | | | | |

---

## Verification Commands (run by Agent 34)

For Node/TypeScript projects:

```bash
# Duplication
npx jscpd --threshold 5 src/

# Dead code
npx ts-prune

# Import graph (does ARCHITECTURE.md still match?)
npx madge --circular --warning src/
npx dependency-cruiser src/ --output-type err

# Search for canonical-bypass patterns
# (example: any `new Error(...)` outside src/domain/errors/)
grep -rn "new Error(" src/ | grep -v "src/domain/errors/"
```

For Python projects:

```bash
# Duplication
pylint --disable=all --enable=duplicate-code src/

# Dead code
vulture src/

# Import graph
pydeps src/ --max-bacon 0
```

The VANTAGE runtime exposes a programmatic check via
`.vantage/runtime/structural-coherence.js` for use inside CI hooks (see
`runStructuralAudit()`).

---

## Maintenance Rules

1. This file is committed to git. Changes require PR review (minimum: Architecture
   Board signs off on additions or path changes; Agent 34 signs off on Divergence
   Log additions after ADR approval).

2. If the project evolves and a concern listed here is REMOVED from the codebase
   (e.g. you drop the cache layer entirely), delete the row. Do not leave stale
   entries.

3. If the canonical path is RENAMED or MOVED, update the row in the same commit
   that performs the rename. CI should fail if the row points to a non-existent file.

4. ARCHITECTURE.md describes the SHAPE of the system. CANONICAL.md describes the
   CANONICAL FILES of the system. They are complementary and both required.
